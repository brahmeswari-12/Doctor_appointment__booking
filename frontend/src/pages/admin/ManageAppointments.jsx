import { useCallback, useEffect, useState } from 'react';
import adminService from '../../services/adminService.js';
import doctorService from '../../services/doctorService.js';
import appointmentService from '../../services/appointmentService.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import { formatDate, formatDateTime, formatTime, statusClass, labelize } from '../../utils/helpers.js';
import Modal from '../../components/Modal.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];

// Admin: browse and manage all appointments across the system.
export default function ManageAppointments() {
  const toast = useToastContext();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [doctorId, setDoctorId] = useState('');

  const [detail, setDetail] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (status) params.status = status;
      if (date) params.date = date;
      if (doctorId) params.doctorId = doctorId;
      const data = await adminService.getAppointments(params);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, date, doctorId]);

  useEffect(() => {
    load();
  }, [load]);

  // Doctor options for the filter dropdown.
  useEffect(() => {
    doctorService
      .getDoctors()
      .then((data) => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => setDoctors([]));
  }, []);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setBusyId(cancelTarget.id);
    try {
      await appointmentService.update(cancelTarget.id, { status: 'cancelled' });
      toast.success('Appointment cancelled.');
      setCancelTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReset = () => {
    setStatus('');
    setDate('');
    setDoctorId('');
  };

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>Manage Appointments</h1>
          <p>Monitor and manage all appointments in the system.</p>
        </div>
      </div>

      {error && <Alert type="error" message={error.message} onClose={() => setError('')} />}

      {/* ------------------------------- Filters ------------------------------ */}
      <div className="filter-bar filter-bar-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="ma-status">Status</label>
          <select
            id="ma-status"
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{labelize(opt)}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="ma-date">Date</label>
          <input
            id="ma-date"
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="ma-doctor">Doctor</label>
          <select
            id="ma-doctor"
            className="form-select"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
          >
            <option value="">All doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <span className="form-label" aria-hidden="true">&nbsp;</span>
          <button type="button" className="btn btn-outline" onClick={handleReset}>Reset</button>
        </div>
      </div>

      {loading && <Loader text="Loading appointments..." />}

      {!loading && appointments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">&#128197;</div>
          <div className="empty-state-title">No appointments found</div>
          <p>Try changing the filters above.</p>
        </div>
      )}

      {!loading && appointments.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Date</th>
                <th scope="col">Time</th>
                <th scope="col">Patient</th>
                <th scope="col">Doctor</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt, index) => (
                <tr key={appt.id ?? index}>
                  <td>{index + 1}</td>
                  <td>{formatDate(appt.appointmentDate)}</td>
                  <td>{formatTime(appt.appointmentTime)}</td>
                  <td>
                    <div>{appt.patientName || '-'}</div>
                    <small className="text-muted">{appt.patientPhone || ''}</small>
                  </td>
                  <td>
                    <div>{appt.doctorName || '-'}</div>
                    <small className="text-muted">{appt.specializationName || ''}</small>
                  </td>
                  <td>
                    <span className={`badge ${statusClass(appt.status)}`}>
                      {labelize(appt.status)}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setDetail(appt)}
                      >
                        View
                      </button>
                      {['pending', 'confirmed'].includes(appt.status) && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={busyId === appt.id}
                          onClick={() => setCancelTarget(appt)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --------------------------- Details modal --------------------------- */}
      <Modal
        open={Boolean(detail)}
        title="Appointment Details"
        onClose={() => setDetail(null)}
        footer={
          <button type="button" className="btn btn-outline" onClick={() => setDetail(null)}>
            Close
          </button>
        }
      >
        {detail && (
          <div className="detail-list">
            <div className="detail-row">
              <span className="detail-label">Appointment ID</span>
              <span className="detail-value">{detail.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Patient</span>
              <span className="detail-value">{detail.patientName || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Patient Phone</span>
              <span className="detail-value">{detail.patientPhone || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Doctor</span>
              <span className="detail-value">{detail.doctorName || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Specialization</span>
              <span className="detail-value">{detail.specializationName || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(detail.appointmentDate)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Time</span>
              <span className="detail-value">{formatTime(detail.appointmentTime)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Reason</span>
              <span className="detail-value">{detail.reason || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className="detail-value">
                <span className={`badge ${statusClass(detail.status)}`}>
                  {labelize(detail.status)}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Created</span>
              <span className="detail-value">{formatDateTime(detail.createdAt)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* ---------------------------- Cancel modal --------------------------- */}
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
              disabled={busyId === cancelTarget?.id}
            >
              Keep it
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={confirmCancel}
              disabled={busyId === cancelTarget?.id}
            >
              {busyId === cancelTarget?.id ? <Loader size="sm" inline /> : 'Cancel appointment'}
            </button>
          </>
        }
      >
        <p className="mb-0">
          Cancel the appointment for <strong>{cancelTarget?.patientName}</strong> with{' '}
          <strong>{cancelTarget?.doctorName}</strong> on{' '}
          <strong>{formatDate(cancelTarget?.appointmentDate)}</strong>?
        </p>
      </Modal>
    </div>
  );
}
