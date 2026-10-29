import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import appointmentService from '../../services/appointmentService.js';
import useFetch from '../../hooks/useFetch.js';
import { formatDate, formatDateTime, formatTime, initials, statusClass, labelize } from '../../utils/helpers.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

// Doctor: patient + appointment details for a single visit.
export default function PatientDetails() {
  const { id } = useParams();

  const fetchAppointment = useCallback(() => appointmentService.getAppointmentById(id), [id]);
  const { data: appointment, loading, error } = useFetch(fetchAppointment, [id], {
    immediate: Boolean(id),
  });

  if (!id) {
    return (
      <div>
        <div className="dashboard-heading">
          <div>
            <h1>Patient Details</h1>
            <p>Select an appointment to view the patient information.</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">&#128100;</div>
          <div className="empty-state-title">No appointment selected</div>
          <p>Open an appointment from the list to see patient details.</p>
          <Link to="/doctor/appointments" className="btn btn-primary mt-3">
            Go to Appointments
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <Loader text="Loading patient details..." />;

  if (error) {
    return (
      <div>
        <Alert type="error" message={error.message} />
        <Link to="/doctor/appointments" className="btn btn-outline">Back to appointments</Link>
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>Patient Details</h1>
          <p>Information for this appointment.</p>
        </div>
        <Link to="/doctor/appointments" className="btn btn-outline">&larr; Back</Link>
      </div>

      <div className="split split-sidebar">
        <div className="card">
          <div className="doctor-card-top">
            <span className="doctor-avatar" aria-hidden="true">
              {initials(appointment.patientName)}
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                {appointment.patientName || 'Patient'}
              </h2>
              <span className="text-muted" style={{ fontSize: '0.86rem' }}>
                Patient ID: {appointment.patientId ?? '-'}
              </span>
            </div>
          </div>

          <div className="divider" />

          <div className="detail-list">
            <div className="detail-row">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{appointment.patientPhone || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Appointment Date</span>
              <span className="detail-value">{formatDate(appointment.appointmentDate)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Appointment Time</span>
              <span className="detail-value">{formatTime(appointment.appointmentTime)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Doctor</span>
              <span className="detail-value">{appointment.doctorName || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Specialization</span>
              <span className="detail-value">{appointment.specializationName || '-'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Booked On</span>
              <span className="detail-value">{formatDateTime(appointment.createdAt)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status</span>
              <span className="detail-value">
                <span className={`badge ${statusClass(appointment.status)}`}>
                  {labelize(appointment.status)}
                </span>
              </span>
            </div>
          </div>
        </div>

        <aside className="card">
          <h2 className="card-title">Reason for Visit</h2>
          <p className="text-muted mb-0">
            {appointment.reason || 'No reason was provided by the patient.'}
          </p>
          <div className="divider" />
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            For privacy reasons, only the information linked to this appointment is
            displayed.
          </p>
        </aside>
      </div>
    </div>
  );
}
