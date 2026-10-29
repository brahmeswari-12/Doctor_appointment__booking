import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import doctorService from '../../services/doctorService.js';
import appointmentService from '../../services/appointmentService.js';
import paymentService from '../../services/paymentService.js';
import { chargeAppointment } from '../../utils/paymentFlow.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import { formatTime, toDateInputValue, formatDate, formatCurrency, statusClass } from '../../utils/helpers.js';
import TimeSlotPicker from '../../components/TimeSlotPicker.jsx';
import PaymentMethodPicker, { paymentMethodLabel } from '../../components/PaymentMethodPicker.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

// Booking flow: details -> payment method -> confirmation.
export default function BookAppointment() {
  const [searchParams] = useSearchParams();
  const presetDoctorId = searchParams.get('doctorId') || '';

  const navigate = useNavigate();
  const toast = useToastContext();

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [doctorId, setDoctorId] = useState(presetDoctorId);
  const [date, setDate] = useState(toDateInputValue());
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');

  // 'details' collects the visit info, 'payment' chooses how to pay.
  const [step, setStep] = useState('details');
  const [method, setMethod] = useState('cash');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [result, setResult] = useState(null);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load the doctor list for the dropdown.
  useEffect(() => {
    let active = true;
    setLoadingDoctors(true);
    doctorService
      .getDoctors()
      .then((data) => {
        if (active) setDoctors(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoadingDoctors(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Load the available payment methods / currency.
  useEffect(() => {
    let active = true;
    paymentService
      .getConfig()
      .then((cfg) => {
        if (active) setPaymentConfig(cfg);
      })
      .catch(() => {
        if (active) setPaymentConfig(null);
      });
    return () => {
      active = false;
    };
  }, []);

  // Fetch available slots whenever the doctor or date changes.
  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([]);
      setTime('');
      return undefined;
    }

    let active = true;
    setLoadingSlots(true);
    setTime('');

    doctorService
      .getDoctorSlots(doctorId, date)
      .then((data) => {
        if (active) setSlots(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) {
          setSlots([]);
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [doctorId, date]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => String(d.id) === String(doctorId)) || null,
    [doctors, doctorId]
  );

  const currency = paymentConfig?.currency || 'INR';
  const amount = Number(selectedDoctor?.consultationFee || 0);

  // A doctor without a fee can only be paid in cash at the clinic.
  const availableMethods = useMemo(() => {
    const methods = paymentConfig?.methods?.length
      ? paymentConfig.methods
      : ['cash', 'card', 'upi', 'netbanking', 'wallet'];
    return amount > 0 ? methods : methods.filter((m) => m === (paymentConfig?.cashMethod || 'cash'));
  }, [paymentConfig, amount]);

  // The selected date must not be in the past.
  const minDate = toDateInputValue();

  const goToPayment = (e) => {
    e.preventDefault();
    setError('');

    if (!doctorId) {
      setError('Please choose a doctor.');
      return;
    }
    if (!date) {
      setError('Please choose an appointment date.');
      return;
    }
    if (!time) {
      setError('Please select a time slot.');
      return;
    }
    setStep('payment');
  };

  const handleConfirm = async () => {
    setError('');
    setSubmitting(true);
    try {
      const appointment = await appointmentService.create({
        doctorId: Number(doctorId),
        appointmentDate: date,
        appointmentTime: time,
        reason: reason.trim(),
      });

      const charged = await chargeAppointment({
        appointmentId: appointment.id,
        method,
        config: paymentConfig,
      });

      setResult({ appointment, method, status: charged.status });

      if (charged.status === 'paid') {
        toast.success('Payment successful. Appointment booked.');
      } else {
        toast.success('Appointment booked. Please pay at the clinic.');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------- Success view -----------------------------
  if (result) {
    const paid = result.status === 'paid';
    return (
      <div>
        <div className="dashboard-heading">
          <div>
            <h1>Booking Confirmed</h1>
            <p>Your appointment has been scheduled.</p>
          </div>
        </div>

        <div className="card pay-success">
          <div className="pay-success-icon" aria-hidden="true">
            {paid ? '\u2714' : '\u20B9'}
          </div>
          <h2 className="card-title" style={{ marginBottom: 6 }}>
            {paid ? 'Payment received' : 'Pay at the clinic'}
          </h2>
          <p className="text-muted">
            {paid
              ? `We received ${formatCurrency(amount, currency)} via ${paymentMethodLabel(result.method)}.`
              : `Please pay ${formatCurrency(amount, currency)} at the reception (${paymentMethodLabel(
                  result.method
                )}).`}
          </p>

          <div className="detail-list mt-4" style={{ textAlign: 'left', maxWidth: 420, margin: '0 auto' }}>
            <div className="detail-row">
              <span className="detail-label">Doctor</span>
              <span className="detail-value">{result.appointment.doctorName || selectedDoctor?.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(result.appointment.appointmentDate)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Time</span>
              <span className="detail-value">{formatTime(result.appointment.appointmentTime)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amount</span>
              <span className="detail-value">{formatCurrency(amount, currency)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Payment</span>
              <span className="detail-value">
                <span className={`badge ${statusClass(result.status)}`}>
                  {result.status === 'paid' ? 'Paid' : 'Unpaid'}
                </span>
              </span>
            </div>
          </div>

          <div className="btn-group mt-4" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/patient/appointments')}
            >
              View My Appointments
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setResult(null);
                setStep('details');
                setTime('');
                setReason('');
              }}
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>Book Appointment</h1>
          <p>
            {step === 'details'
              ? 'Choose a doctor and an available slot that suits you.'
              : 'Select how you would like to pay for this consultation.'}
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="split split-sidebar">
        <div className="card">
          {step === 'details' ? (
            <form onSubmit={goToPayment} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="ba-doctor">
                  Doctor <span className="required">*</span>
                </label>
                <select
                  id="ba-doctor"
                  className="form-select"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  disabled={loadingDoctors}
                >
                  <option value="">
                    {loadingDoctors ? 'Loading doctors...' : 'Select a doctor'}
                  </option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialization?.name || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ba-date">
                  Appointment Date <span className="required">*</span>
                </label>
                <input
                  id="ba-date"
                  type="date"
                  className="form-control"
                  min={minDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Available Time Slots <span className="required">*</span>
                </label>
                {!doctorId ? (
                  <p className="text-muted mb-0">Select a doctor to see available slots.</p>
                ) : (
                  <TimeSlotPicker
                    slots={slots}
                    value={time}
                    onChange={setTime}
                    loading={loadingSlots}
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ba-reason">Reason for Visit</label>
                <textarea
                  id="ba-reason"
                  className="form-control"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly describe your symptoms or reason for the visit"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-lg" disabled={!time}>
                  Continue to Payment
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-lg"
                  onClick={() => navigate('/patient')}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h2 className="card-title">Payment Method</h2>
              <p className="text-muted">
                Amount payable: <strong>{formatCurrency(amount, currency)}</strong>
              </p>

              <PaymentMethodPicker
                value={method}
                onChange={setMethod}
                methods={availableMethods}
                amount={amount}
                currency={currency}
                disabled={submitting}
              />

              {amount <= 0 && (
                <p className="text-muted mt-3 mb-0">
                  This doctor has not set a consultation fee, so payment is collected at the clinic.
                </p>
              )}

              {paymentConfig && !paymentConfig.live && (
                <p className="text-muted mt-3 mb-0">
                  Demo mode: no payment gateway keys are configured, online payments are simulated.
                </p>
              )}

              <div className="form-actions mt-4">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader size="sm" inline />
                  ) : method === (paymentConfig?.cashMethod || 'cash') ? (
                    'Confirm Booking'
                  ) : (
                    `Pay ${formatCurrency(amount, currency)}`
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-lg"
                  onClick={() => setStep('details')}
                  disabled={submitting}
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="card">
          <h2 className="card-title">Booking Summary</h2>
          {!selectedDoctor ? (
            <p className="text-muted mb-0">No doctor selected yet.</p>
          ) : (
            <div className="detail-list mt-3">
              <div className="detail-row">
                <span className="detail-label">Doctor</span>
                <span className="detail-value">{selectedDoctor.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Specialization</span>
                <span className="detail-value">
                  {selectedDoctor.specialization?.name || 'General'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Experience</span>
                <span className="detail-value">
                  {selectedDoctor.experience != null ? `${selectedDoctor.experience} years` : '-'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Fee</span>
                <span className="detail-value">{formatCurrency(amount, currency)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date</span>
                <span className="detail-value">{date || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Time</span>
                <span className="detail-value">{time ? formatTime(time) : '-'}</span>
              </div>
              {step === 'payment' && (
                <div className="detail-row">
                  <span className="detail-label">Payment</span>
                  <span className="detail-value">{paymentMethodLabel(method)}</span>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
