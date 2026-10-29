import { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import appointmentService from '../../services/appointmentService.js';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import StatCard from '../../components/StatCard.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';
import { formatDate, formatTime, statusClass, labelize, toDateInputValue } from '../../utils/helpers.js';

// Doctor home: appointment counts and today's schedule.
export default function DoctorDashboard() {
  const { user } = useAuth();

  const fetchAppointments = useCallback(() => appointmentService.getAppointments(), []);
  const { data, loading, error } = useFetch(fetchAppointments);

  const list = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const today = toDateInputValue();

  const stats = useMemo(
    () => ({
      pending: list.filter((a) => a.status === 'pending').length,
      confirmed: list.filter((a) => a.status === 'confirmed').length,
      completed: list.filter((a) => a.status === 'completed').length,
      today: list.filter((a) => a.appointmentDate === today && a.status !== 'cancelled').length,
    }),
    [list, today]
  );

  const todaysAppointments = useMemo(
    () =>
      list
        .filter((a) => a.appointmentDate === today)
        .sort((a, b) => String(a.appointmentTime).localeCompare(String(b.appointmentTime))),
    [list, today]
  );

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>Welcome, {user?.name || 'Doctor'}</h1>
          <p>Here is an overview of your appointments.</p>
        </div>
        <Link to="/doctor/appointments" className="btn btn-primary">Manage Appointments</Link>
      </div>

      {error && <Alert type="error" message={error.message} />}

      <div className="grid grid-4 mb-5">
        <StatCard label="Pending Requests" value={stats.pending} icon="&#9203;" variant="warning" />
        <StatCard label="Confirmed" value={stats.confirmed} icon="&#10004;" variant="info" />
        <StatCard label="Completed" value={stats.completed} icon="&#9989;" variant="success" />
        <StatCard label="Today" value={stats.today} icon="&#128197;" variant="primary" />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Today&apos;s Appointments</h2>
            <p className="card-subtitle">{formatDate(today)}</p>
          </div>
          <Link to="/doctor/schedule" className="btn btn-outline btn-sm">Manage Schedule</Link>
        </div>

        {loading && <Loader text="Loading appointments..." />}

        {!loading && todaysAppointments.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">&#9749;</div>
            <div className="empty-state-title">No appointments today</div>
            <p>Enjoy the calm — new requests will appear here.</p>
          </div>
        )}

        {!loading && todaysAppointments.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Patient</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {todaysAppointments.map((appt) => (
                  <tr key={appt.id}>
                    <td>{formatTime(appt.appointmentTime)}</td>
                    <td>{appt.patientName || '-'}</td>
                    <td>{appt.patientPhone || '-'}</td>
                    <td className="truncate" style={{ maxWidth: 220 }}>{appt.reason || '-'}</td>
                    <td>
                      <span className={`badge ${statusClass(appt.status)}`}>
                        {labelize(appt.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
