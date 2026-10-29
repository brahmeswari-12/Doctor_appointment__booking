import { useCallback, useEffect, useMemo, useState } from 'react';
import appointmentService from '../../services/appointmentService.js';
import doctorService from '../../services/doctorService.js';
import paymentService from '../../services/paymentService.js';
import { chargeAppointment } from '../../utils/paymentFlow.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import {
  formatDate,
  formatTime,
  formatCurrency,
  statusClass,
  labelize,
  toDateInputValue,
} from '../../utils/helpers.js';
import Modal from '../../components/Modal.jsx';
import TimeSlotPicker from '../../components/TimeSlotPicker.jsx';
import PaymentMethodPicker, { paymentMethodLabel } from '../../components/PaymentMethodPicker.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

// Patient appointment list with tabs, cancel and reschedule actions.
export default function MyAppointments() {
  const toast = useToastContext();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');

  // Cancel confirmation state.
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Reschedule state.
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(toDateInputValue());
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  // Pay-now state.
  const [payTarget, setPayTarget] = useState(null);
  const [payMethod, setPayMethod] = useState('card');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paying, setPaying] = useState(false);

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

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const today = toDateInputValue();

  const { upcoming, past } = useMemo(() => {
    const up = [];
    const p = [];
    appointments.forEach((appt) => {
      const isUpcoming =
        appt.appointmentDate >= today && ['pending', 'confirmed'].includes(appt.status);
      (isUpcoming ? up : p).push(appt);
    });
    up.sort((a, b) => `${a.appointmentDate}${a.appointmentTime}`.localeCompare(`${b.appointmentDate}${b.appointmentTime}`));
    p.sort((a, b) => `${b.appointmentDate}${b.appointmentTime}`.localeCompare(`${a.appointmentDate}${a.appointmentTime}`));
    return { upcoming: up, past: p };
  }, [appointments, today]);

  const visible = tab === 'upcoming' ? upcoming : past;

  // ----------------------------- Cancel flow -----------------------------
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await appointmentService.update(cancelTarget.id, { status: 'cancelled' });
      toast.success('Appointment cancelled.');
      setCancelTarget(null);
      await loadAppointments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  // --------------------------- Reschedule flow ---------------------------
  const openReschedule = (appt) => {
    setRescheduleTarget(appt);
    setRescheduleDate(appt.appointmentDate || toDateInputValue());
    setRescheduleTime('');
    setRescheduleSlots([]);
  };

  useEffect(() => {
    if (!rescheduleTarget || !rescheduleDate) return undefined;

    let active = true;
    setLoadingRescheduleSlots(true);
    setRescheduleTime('');

    doctorService
      .getDoctorSlots(rescheduleTarget.doctorId, rescheduleDate)
      .then((data) => {
        if (active) setRescheduleSlots(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) {
          setRescheduleSlots([]);
          toast.error(err.message);
        }
      })
      .finally(() => {
        if (active) setLoadingRescheduleSlots(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rescheduleTarget, rescheduleDate]);

  const handleRescheduleSubmit = async () => {
    if (!rescheduleTarget) return;
    if (!rescheduleTime) {
      toast.warning('Please select a new time slot.');
      return;
    }
    setRescheduling(true);
    try {
      await appointmentService.update(rescheduleTarget.id, {
        appointmentDate: rescheduleDate,
        appointmentTime: rescheduleTime,
      });
      toast.success('Appointment rescheduled.');
      setRescheduleTarget(null);
      await loadAppointments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRescheduling(false);
    }
  };

  // ----------------------------- Pay-now flow -----------------------------
  const appointmentAmount = (appt) => Number(appt?.amount || 0) || Number(appt?.consultationFee || 0);

  const openPay = (appt) => {
    setPayTarget(appt);
    const online = paymentConfig?.onlineMethods || [];
    setPayMethod(online[0] || 'card');
  };

  const handlePay = async () => {
    if (!payTarget) return;
    setPaying(true);
    try {
      const charged = await chargeAppointment({
        appointmentId: payTarget.id,
        method: payMethod,
        config: paymentConfig,
      });
      toast.success(
        charged.status === 'paid' ? 'Payment successful.' : 'Marked as pay at clinic.'
      );
      setPayTarget(null);
      await loadAppointments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPaying(false);
    }
  };

  const renderCard = (appt) => {
    const amount = appointmentAmount(appt);
    const payable = appt.paymentStatus !== 'paid' && appt.status !== 'cancelled' && amount > 0;

    return (
      <div key={appt.id} className={`appointment-card status-${appt.status}`}>
        <div className="appointment-top">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>{appt.doctorName || 'Doctor'}</h3>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              {appt.specializationName || 'General'}
            </span>
          </div>
          <span className={`badge ${statusClass(appt.status)}`}>{labelize(appt.status)}</span>
        </div>

        <div className="appointment-grid">
          <div className="appointment-field">
            <span className="appointment-field-label">Date</span>
            <span className="appointment-field-value">{formatDate(appt.appointmentDate)}</span>
          </div>
          <div className="appointment-field">
            <span className="appointment-field-label">Time</span>
            <span className="appointment-field-value">{formatTime(appt.appointmentTime)}</span>
          </div>
          <div className="appointment-field">
            <span className="appointment-field-label">Payment</span>
            <span className="appointment-field-value">
              <span className={`badge ${statusClass(appt.paymentStatus)}`}>
                {labelize(appt.paymentStatus || 'unpaid')}
              </span>
              {amount > 0 && (
                <span className="text-muted" style={{ marginLeft: 8, fontSize: '0.82rem' }}>
                  {formatCurrency(amount)}
                  {appt.paymentMethod ? ` · ${paymentMethodLabel(appt.paymentMethod)}` : ''}
                </span>
              )}
            </span>
          </div>
          {appt.reason && (
            <div className="appointment-field">
              <span className="appointment-field-label">Reason</span>
              <span className="appointment-field-value">{appt.reason}</span>
            </div>
          )}
        </div>

        {(tab === 'upcoming' || payable) && (
          <div className="btn-group mt-3">
            {payable && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => openPay(appt)}>
                Pay Now
              </button>
            )}
            {tab === 'upcoming' && (
              <>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => openReschedule(appt)}>
                  Reschedule
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setCancelTarget(appt)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>My Appointments</h1>
          <p>View, reschedule or cancel your bookings.</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'upcoming'}
          className={`tab${tab === 'upcoming' ? ' active' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'past'}
          className={`tab${tab === 'past' ? ' active' : ''}`}
          onClick={() => setTab('past')}
        >
          Past ({past.length})
        </button>
      </div>

      {loading && <Loader text="Loading appointments..." />}

      {!loading && visible.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">&#128197;</div>
          <div className="empty-state-title">
            {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </div>
          <p>
            {tab === 'upcoming'
              ? 'Book a new appointment to see it here.'
              : 'Your completed and cancelled visits will appear here.'}
          </p>
        </div>
      )}

      {!loading && visible.map(renderCard)}

      {/* --------------------------- Cancel modal --------------------------- */}
      <Modal
        open={Boolean(cancelTarget)}
        title="Cancel appointment"
        size="sm"
        onClose={() => setCancelTarget(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setCancelTarget(null)}
              disabled={cancelling}
            >
              Keep it
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleCancelConfirm}
              disabled={cancelling}
            >
              {cancelling ? <Loader size="sm" inline /> : 'Yes, cancel'}
            </button>
          </>
        }
      >
        <p className="mb-0">
          Are you sure you want to cancel your appointment with{' '}
          <strong>{cancelTarget?.doctorName}</strong> on{' '}
          <strong>{formatDate(cancelTarget?.appointmentDate)}</strong> at{' '}
          <strong>{formatTime(cancelTarget?.appointmentTime)}</strong>? This action cannot be undone.
        </p>
      </Modal>

      {/* ------------------------- Reschedule modal ------------------------- */}
      <Modal
        open={Boolean(rescheduleTarget)}
        title="Reschedule appointment"
        onClose={() => setRescheduleTarget(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setRescheduleTarget(null)}
              disabled={rescheduling}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRescheduleSubmit}
              disabled={rescheduling}
            >
              {rescheduling ? <Loader size="sm" inline /> : 'Confirm'}
            </button>
          </>
        }
      >
        <p className="text-muted">
          Choose a new date and time for your appointment with{' '}
          <strong>{rescheduleTarget?.doctorName}</strong>.
        </p>

        <div className="form-group">
          <label className="form-label" htmlFor="rs-date">New Date</label>
          <input
            id="rs-date"
            type="date"
            className="form-control"
            min={toDateInputValue()}
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Available Slots</label>
          <TimeSlotPicker
            slots={rescheduleSlots}
            value={rescheduleTime}
            onChange={setRescheduleTime}
            loading={loadingRescheduleSlots}
          />
        </div>
      </Modal>

      {/* --------------------------- Pay-now modal --------------------------- */}
      <Modal
        open={Boolean(payTarget)}
        title="Pay for appointment"
        size="sm"
        onClose={() => setPayTarget(null)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setPayTarget(null)}
              disabled={paying}
            >
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handlePay} disabled={paying}>
              {paying ? <Loader size="sm" inline /> : `Pay ${formatCurrency(appointmentAmount(payTarget))}`}
            </button>
          </>
        }
      >
        <p className="text-muted">
          Paying for your appointment with <strong>{payTarget?.doctorName}</strong> on{' '}
          <strong>{formatDate(payTarget?.appointmentDate)}</strong>.
        </p>

        <PaymentMethodPicker
          value={payMethod}
          onChange={setPayMethod}
          methods={paymentConfig?.methods}
          amount={appointmentAmount(payTarget)}
          currency={paymentConfig?.currency || 'INR'}
          disabled={paying}
        />

        {paymentConfig && !paymentConfig.live && (
          <p className="text-muted mt-3 mb-0">
            Demo mode: no payment gateway keys are configured, online payments are simulated.
          </p>
        )}
      </Modal>
    </div>
  );
}
