import paymentService from '../services/paymentService.js';

// Loads the Razorpay checkout script on demand (only used in live mode).
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load the payment gateway.'));
    document.body.appendChild(script);
  });
}

// Opens the Razorpay checkout for an order and resolves once the payment is verified.
function payWithRazorpay(order) {
  return loadRazorpayScript().then(
    () =>
      new Promise((resolve, reject) => {
        const checkout = new window.Razorpay({
          key: order.publicKey,
          amount: order.amountInMinorUnits,
          currency: order.currency,
          name: 'DocCare',
          description: `Consultation payment #${order.appointmentId}`,
          order_id: order.orderId,
          handler: (response) => {
            paymentService
              .verify({
                appointmentId: order.appointmentId,
                orderId: order.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              })
              .then((appointment) => resolve(appointment))
              .catch(reject);
          },
          modal: {
            ondismiss: () => {
              paymentService
                .fail({
                  appointmentId: order.appointmentId,
                  orderId: order.orderId,
                  reason: 'Checkout dismissed by user',
                })
                .catch(() => {});
              reject(new Error('Payment cancelled.'));
            },
          },
        });
        checkout.open();
      })
  );
}

/**
 * Charges an appointment with the chosen method.
 *
 * - `cash` is settled offline: the appointment is marked unpaid.
 * - Online methods create a gateway order and are settled immediately in
 *   simulator mode, or through the Razorpay checkout when live keys exist.
 *
 * @returns {Promise<{status: string, method: string, appointment: object|null}>}
 */
export async function chargeAppointment({ appointmentId, method, config }) {
  const order = await paymentService.createOrder({ appointmentId, method });

  if (order.provider === 'offline') {
    return { status: 'unpaid', method, appointment: null };
  }

  if (config?.live && order.publicKey && order.orderId) {
    const appointment = await payWithRazorpay(order);
    return { status: 'paid', method, appointment };
  }

  const appointment = await paymentService.verify({ appointmentId, orderId: order.orderId });
  return { status: appointment?.paymentStatus || 'paid', method, appointment };
}

export default chargeAppointment;
