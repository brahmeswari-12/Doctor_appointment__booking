import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService.js';
import useFetch from '../../hooks/useFetch.js';
import StatCard from '../../components/StatCard.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';
import { formatCurrency } from '../../utils/helpers.js';

// Admin home: system-wide KPIs.
export default function AdminDashboard() {
  const fetchStats = useCallback(() => adminService.getStats(), []);
  const { data: stats, loading, error } = useFetch(fetchStats);

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>Admin Dashboard</h1>
          <p>System overview and key metrics.</p>
        </div>
        <div className="btn-group">
          <Link to="/admin/reports" className="btn btn-outline">View Reports</Link>
          <Link to="/admin/doctors" className="btn btn-primary">Manage Doctors</Link>
        </div>
      </div>

      {error && <Alert type="error" message={error.message} />}
      {loading && <Loader text="Loading statistics..." />}

      {!loading && stats && (
        <>
          <h2 style={{ fontSize: '1.05rem' }} className="mb-3">People</h2>
          <div className="grid grid-4 mb-5">
            <StatCard label="Total Patients" value={stats.totalPatients} icon="&#128101;" variant="primary" />
            <StatCard label="Total Doctors" value={stats.totalDoctors} icon="&#129658;" variant="info" />
            <StatCard label="Pending Doctor Approvals" value={stats.pendingDoctors} icon="&#9203;" variant="warning" />
          </div>

          <h2 style={{ fontSize: '1.05rem' }} className="mb-3">Appointments</h2>
          <div className="grid grid-4">
            <StatCard label="Total Appointments" value={stats.totalAppointments} icon="&#128197;" variant="primary" />
            <StatCard label="Pending" value={stats.pendingAppointments} icon="&#9203;" variant="warning" />
            <StatCard label="Confirmed" value={stats.confirmedAppointments} icon="&#10004;" variant="info" />
            <StatCard label="Completed" value={stats.completedAppointments} icon="&#9989;" variant="success" />
          </div>
          <div className="grid grid-4 mt-4">
            <StatCard label="Cancelled" value={stats.cancelledAppointments} icon="&#10006;" variant="danger" />
          </div>

          <h2 style={{ fontSize: '1.05rem' }} className="mb-3 mt-5">Payments</h2>
          <div className="grid grid-4">
            <StatCard
              label="Revenue Collected"
              value={formatCurrency(stats.totalRevenue)}
              icon="&#128176;"
              variant="success"
            />
            <StatCard label="Paid" value={stats.paidAppointments ?? 0} icon="&#10004;" variant="info" />
            <StatCard label="Unpaid" value={stats.unpaidAppointments ?? 0} icon="&#9203;" variant="warning" />
            <StatCard label="Refunded" value={stats.refundedAppointments ?? 0} icon="&#8635;" variant="primary" />
          </div>
        </>
      )}

      {!loading && !stats && !error && (
        <div className="empty-state">
          <div className="empty-state-title">No statistics available</div>
          <p>Statistics will appear once the backend responds.</p>
        </div>
      )}

      <div className="card mt-5">
        <h2 className="card-title">Quick Actions</h2>
        <div className="btn-group mt-3">
          <Link to="/admin/patients" className="btn btn-outline">Patients</Link>
          <Link to="/admin/doctors" className="btn btn-outline">Doctors</Link>
          <Link to="/admin/specializations" className="btn btn-outline">Specializations</Link>
          <Link to="/admin/appointments" className="btn btn-outline">Appointments</Link>
          <Link to="/admin/reports" className="btn btn-outline">Reports</Link>
        </div>
      </div>
    </div>
  );
}
