import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import patientService from '../../services/patientService.js';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import StatCard from '../../components/StatCard.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';
import { formatDate, formatTime, statusClass, labelize } from '../../utils/helpers.js';

// Patient home: summary tiles + the next upcoming appointments.
export default function PatientDashboard() {
  const { user } = useAuth();

  const fetchAppointments = useCallback(() => patientService.getAppointments(), []);
  const { data: appointments, loading, error } = useFetch(fetchAppointments);

  const list = useMemo(
    () => (Array.isArray(appointments) ? appointments : []),
    [appointments]
  );

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: list.length,
      upcoming: list.filter(
        (a) => a.appointmentDate >= today && ['pending', 'confirmed'].includes(a.status)
      ).length,
      completed: list.filter((a) => a.status === 'completed').length,
      cancelled: list.filter((a) => a.status === 'cancelled').length,
    };
  }, [list]);

  const upcoming = useMemo(
    () =>
      list
        .filter((a) => ['pending', 'confirmed'].includes(a.status))
        .sort((a, b) => `${a.appointmentDate}${a.appointmentTime}`.localeCompare(`${b.appointmentDate}${b.appointmentTime}`))
        .slice(0, 5),
    [list]
  );

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>Hello, {user?.name || 'Patient'} 👋</h1>
          <p>Here is a summary of your appointments.</p>
        </div>
        <Link to="/patient/book" className="btn btn-primary">+ Book Appointment</Link>
      </div>

      {error && <Alert type="error" message={error.message} />}

      <div className="grid grid-4 mb-5">
        <StatCard label="Total Appointments" value={stats.total} icon="&#128197;" variant="primary" />
        <StatCard label="Upcoming" value={stats.upcoming} icon="&#9203;" variant="info" />
        <StatCard label="Completed" value={stats.completed} icon="&#10004;" variant="success" />
        <StatCard label="Cancelled" value={stats.cancelled} icon="&#10006;" variant="danger" />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Upcoming Appointments</h2>
            <p className="card-subtitle">Your next scheduled visits</p>
          </div>
          <Link to="/patient/appointments" className="btn btn-outline btn-sm">View all</Link>
        </div>

        {loading && <Loader text="Loading appointments..." />}

        {!loading && upcoming.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">&#128197;</div>
            <div className="empty-state-title">No upcoming appointments</div>
            <p>Book your first appointment to get started.</p>
            <Link to="/patient/book" className="btn btn-primary mt-3">Book Appointment</Link>
          </div>
        )}

        {!loading && upcoming.length > 0 && (
          <div className="mt-3">
            {upcoming.map((appt) => (
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
                  {appt.reason && (
                    <div className="appointment-field">
                      <span className="appointment-field-label">Reason</span>
                      <span className="appointment-field-value">{appt.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
