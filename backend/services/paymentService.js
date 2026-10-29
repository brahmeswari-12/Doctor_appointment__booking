const crypto = require('crypto');

const patientModel = require('../models/patientModel');
const appointmentModel = require('../models/appointmentModel');
const paymentModel = require('../models/paymentModel');
const ApiError = require('../utils/ApiError');
const { toAppointment } = require('../utils/serializers');
const paymentConfig = require('../config/payment');
const razorpay = require('../utils/razorpayClient');

// 'cash' is settled at the clinic; the rest go through an online gateway.
const CASH_METHOD = 'cash';
const ONLINE_METHODS = ['card', 'upi', 'netbanking', 'wallet'];
const ALL_METHODS = [CASH_METHOD, ...ONLINE_METHODS];

/** Public client configuration (safe to expose - never includes the secret). */
function getConfig() {
  return {
    provider: paymentConfig.provider,
    live: paymentConfig.isLive,
    publicKey: paymentConfig.isLive ? paymentConfig.KEY_ID : null,
    currency: paymentConfig.CURRENCY,
    methods: ALL_METHODS,
    onlineMethods: ONLINE_METHODS,
    cashMethod: CASH_METHOD,
  };
}

/** Loads an appointment and asserts the caller may pay for it. */
async function requireOwnAppointment(user, appointmentId) {
  const appointment = await appointmentModel.findById(appointmentId);
  if (!appointment) {
    throw ApiError.notFound('Appointment not found.');
  }
  if (user.role === 'admin') return appointment;

  const patient = await patientModel.findByUserId(user.id);
  if (!patient || patient.id !== appointment.patientId) {
    throw ApiError.forbidden('You do not have access to this appointment.');
  }
  return appointment;
}

/** The amount payable: whatever was agreed when booking, else the doctor's fee. */
function resolveAmount(appointment) {
  const amount = Number(appointment.amount) > 0
    ? Number(appointment.amount)
    : Number(appointment.consultationFee || 0);
  return amount;
}

/**
 * Starts a payment for an appointment.
 * - `cash` records the intent to pay at the clinic.
 * - online methods create a Razorpay order (or a simulated one without keys).
 */
async function createOrder(user, { appointmentId, method }) {
  const appointment = await requireOwnAppointment(user, appointmentId);

  if (!ALL_METHODS.includes(method)) {
    throw ApiError.badRequest('Unsupported payment method.');
  }
  if (appointment.status === 'cancelled') {
    throw ApiError.badRequest('A cancelled appointment cannot be paid for.');
  }
  if (appointment.paymentStatus === 'paid') {
    throw ApiError.conflict('This appointment has already been paid for.');
  }

  const amount = resolveAmount(appointment);
  if (amount <= 0) {
    throw ApiError.badRequest('This doctor has not set a consultation fee yet.');
  }
  const currency = paymentConfig.CURRENCY;

  // -------- Pay at the clinic: no gateway involved --------
  if (method === CASH_METHOD) {
    await appointmentModel.updatePayment(appointment.id, {
      paymentStatus: 'unpaid',
      paymentMethod: CASH_METHOD,
      amount,
      paymentReference: null,
      paidAt: null,
    });

    return {
      provider: 'offline',
      method,
      appointmentId: appointment.id,
      amount,
      currency,
      status: 'unpaid',
    };
  }

  // -------- Online: create a gateway order --------
  let providerOrderId;

  if (paymentConfig.isLive) {
    const order = await razorpay.createOrder({
      amount: Math.round(amount * 100), // paise
      currency,
      receipt: `appt-${appointment.id}-${Date.now()}`,
      notes: {
        appointmentId: String(appointment.id),
        patientId: String(appointment.patientId),
      },
    });
    providerOrderId = order.id;
  } else {
    providerOrderId = `sim_order_${crypto.randomBytes(8).toString('hex')}`;
  }

  const paymentId = await paymentModel.create({
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    provider: paymentConfig.provider,
    method,
    amount,
    currency,
    status: 'created',
    providerOrderId,
  });

  await appointmentModel.updatePayment(appointment.id, {
    paymentStatus: 'pending',
    paymentMethod: method,
    amount,
    paymentReference: null,
    paidAt: null,
  });

  return {
    provider: paymentConfig.provider,
    live: paymentConfig.isLive,
    publicKey: paymentConfig.isLive ? paymentConfig.KEY_ID : null,
    method,
    paymentId,
    appointmentId: appointment.id,
    orderId: providerOrderId,
    amount,
    amountInMinorUnits: Math.round(amount * 100),
    currency,
    status: 'pending',
  };
}

/**
 * Settles an online payment. With real keys the Razorpay signature is verified
 * before the appointment is marked paid.
 */
async function verifyPayment(user, { appointmentId, orderId, paymentId, signature }) {
  const appointment = await requireOwnAppointment(user, appointmentId);

  const payment = await paymentModel.findByOrderId(orderId);
  if (!payment || payment.appointmentId !== appointment.id) {
    throw ApiError.notFound('No payment order found for this appointment.');
  }

  if (payment.status === 'paid') {
    return toAppointment(await appointmentModel.findById(appointment.id));
  }

  const providerPaymentId = paymentId || `sim_pay_${crypto.randomBytes(8).toString('hex')}`;

  if (paymentConfig.isLive) {
    const valid = razorpay.verifySignature({ orderId, paymentId, signature });
    if (!valid) {
      await paymentModel.updateStatus(payment.id, {
        status: 'failed',
        failureReason: 'Signature verification failed',
      });
      await appointmentModel.updatePayment(appointment.id, { paymentStatus: 'failed' });
      throw ApiError.badRequest('Payment could not be verified. Please try again.');
    }
  }

  await paymentModel.updateStatus(payment.id, { status: 'paid', providerPaymentId });
  await appointmentModel.updatePayment(appointment.id, {
    paymentStatus: 'paid',
    paymentReference: providerPaymentId,
    paidAt: new Date(),
  });

  return toAppointment(await appointmentModel.findById(appointment.id));
}

/** Records a declined / abandoned online payment. */
async function failPayment(user, { appointmentId, orderId, reason }) {
  const appointment = await requireOwnAppointment(user, appointmentId);

  const payment = await paymentModel.findByOrderId(orderId);
  if (!payment || payment.appointmentId !== appointment.id) {
    throw ApiError.notFound('No payment order found for this appointment.');
  }

  await paymentModel.updateStatus(payment.id, {
    status: 'failed',
    failureReason: reason || 'Payment declined',
  });
  await appointmentModel.updatePayment(appointment.id, { paymentStatus: 'failed' });

  return toAppointment(await appointmentModel.findById(appointment.id));
}

/** Flags a paid appointment as refunded (used when the booking is cancelled). */
async function refundForAppointment(appointmentId) {
  await paymentModel.markRefundedForAppointment(appointmentId);
  await appointmentModel.updatePayment(appointmentId, {
    paymentStatus: 'refunded',
    paymentReference: null,
    paidAt: null,
  });
}

module.exports = {
  getConfig,
  createOrder,
  verifyPayment,
  failPayment,
  refundForAppointment,
  CASH_METHOD,
  ONLINE_METHODS,
  ALL_METHODS,
};
