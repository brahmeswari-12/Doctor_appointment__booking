import { useCallback, useEffect, useMemo, useState } from 'react';
import adminService from '../../services/adminService.js';
import StatCard from '../../components/StatCard.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';
import { labelize } from '../../utils/helpers.js';

const STATUS_KEYS = ['pending', 'confirmed', 'completed', 'cancelled'];

// Admin: summary stats plus pure-CSS charts (no chart library).
export default function Reports() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, appointmentsData] = await Promise.all([
        adminService.getStats(),
        adminService.getAppointments(),
      ]);
      setStats(statsData || null);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Count appointments per status.
  const statusCounts = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    appointments.forEach((appt) => {
      if (counts[appt.status] != null) counts[appt.status] += 1;
    });
    return counts;
  }, [appointments]);

  const maxStatusCount = useMemo(
    () => Math.max(1, ...Object.values(statusCounts)),
    [statusCounts]
  );

  // Count appointments per specialization.
  const specializationBreakdown = useMemo(() => {
    const map = new Map();
    appointments.forEach((appt) => {
      const name = appt.specializationName || 'General';
      map.set(name, (map.get(name) || 0) + 1);
    });
    const rows = Array.from(map.entries()).map(([name, count]) => ({ name, count }));
    rows.sort((a, b) => b.count - a.count);
    return rows;
  }, [appointments]);

  const totalAppointments = appointments.length || stats?.totalAppointments || 0;
  const maxSpecCount = Math.max(1, ...specializationBreakdown.map((r) => r.count), 1);

  if (loading) return <Loader text="Generating report..." />;

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>Reports</h1>
          <p>Summary of platform activity and appointment trends.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={load}>Refresh</button>
      </div>

      {error && <Alert type="error" message={error.message} />}

      {stats && (
        <div className="grid grid-4 mb-5">
          <StatCard label="Total Patients" value={stats.totalPatients} icon="&#128101;" variant="primary" />
          <StatCard label="Total Doctors" value={stats.totalDoctors} icon="&#129658;" variant="info" />
          <StatCard label="Total Appointments" value={stats.totalAppointments} icon="&#128197;" variant="success" />
          <StatCard label="Pending Approvals" value={stats.pendingDoctors} icon="&#9203;" variant="warning" />
        </div>
      )}

      <div className="split split-sidebar">
        {/* ----------------------- Status bar chart ----------------------- */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Appointments by Status</h2>
              <p className="card-subtitle">{totalAppointments} appointments in total</p>
            </div>
          </div>

          {totalAppointments === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No data to display</div>
              <p>There are no appointments recorded yet.</p>
            </div>
          ) : (
            <div className="chart" role="img" aria-label="Bar chart of appointments by status">
              {STATUS_KEYS.map((key) => {
                const value = statusCounts[key];
                const heightPct = Math.round((value / maxStatusCount) * 100);
                return (
                  <div className="chart-bar-wrap" key={key}>
                    <span className="chart-bar-value">{value}</span>
                    <div
                      className={`chart-bar bar-${key}`}
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                      title={`${labelize(key)}: ${value}`}
                    />
                    <span className="chart-bar-label">{labelize(key)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --------------------- Specialization breakdown -------------------- */}
        <aside className="card">
          <h2 className="card-title">Top Specializations</h2>
          {specializationBreakdown.length === 0 ? (
            <p className="text-muted mb-0">No specialization data available.</p>
          ) : (
            <div className="progress-list mt-3">
              {specializationBreakdown.map((row) => (
                <div className="progress-item" key={row.name}>
                  <div className="progress-item-head">
                    <span>{row.name}</span>
                    <span className="text-muted">{row.count}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.round((row.count / maxSpecCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* ---------------------- Status summary table ---------------------- */}
      <div className="card mt-5">
        <h2 className="card-title">Status Summary</h2>
        <div className="table-wrap" style={{ border: 'none', marginTop: 16 }}>
          <table className="table" style={{ minWidth: 420 }}>
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Count</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {STATUS_KEYS.map((key) => {
                const value = statusCounts[key];
                const share = totalAppointments ? Math.round((value / totalAppointments) * 100) : 0;
                return (
                  <tr key={key}>
                    <td>{labelize(key)}</td>
                    <td>{value}</td>
                    <td>{share}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
