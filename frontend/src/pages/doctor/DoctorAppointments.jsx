import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import appointmentService from '../../services/appointmentService.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import AppointmentTable from '../../components/AppointmentTable.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import Alert from '../../components/Alert.jsx';

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];

// Doctor: manage incoming appointment requests.
export default function DoctorAppointments() {
  const toast = useToastContext();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (status) params.status = status;
      const data = await appointmentService.getAppointments(params);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side text filter on top of the server status filter.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return appointments;
    return appointments.filter(
      (appt) =>
        (appt.patientName || '').toLowerCase().includes(term) ||
        (appt.patientPhone || '').toLowerCase().includes(term) ||
        (appt.reason || '').toLowerCase().includes(term)
    );
  }, [appointments, search]);

  const changeStatus = async (appt, nextStatus, successMessage) => {
    setBusyId(appt.id);
    try {
      await appointmentService.update(appt.id, { status: nextStatus });
      toast.success(successMessage);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const renderActions = (appt) => {
    const busy = busyId === appt.id;
    return (
      <>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => navigate(`/doctor/patients/${appt.id}`)}
        >
          Details
        </button>

        {appt.status === 'pending' && (
          <>
            <button
              type="button"
              className="btn btn-success btn-sm"
              disabled={busy}
              onClick={() => changeStatus(appt, 'confirmed', 'Appointment confirmed.')}
            >
              Accept
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={busy}
              onClick={() => changeStatus(appt, 'cancelled', 'Appointment rejected.')}
            >
              Reject
            </button>
          </>
        )}

        {appt.status === 'confirmed' && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={() => changeStatus(appt, 'completed', 'Appointment marked as completed.')}
          >
            Complete
          </button>
        )}
      </>
    );
  };

  // Small status summary shown above the table.
  const counts = useMemo(() => {
    const base = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    appointments.forEach((a) => {
      if (base[a.status] != null) base[a.status] += 1;
    });
    return base;
  }, [appointments]);

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>Appointments</h1>
          <p>Review requests, confirm visits and update their status.</p>
        </div>
      </div>

      {error && <Alert type="error" message={error.message} onClose={() => setError('')} />}

      <div className="pill-list mb-4">
        <span className="chip">Pending: {counts.pending}</span>
        <span className="chip">Confirmed: {counts.confirmed}</span>
        <span className="chip">Completed: {counts.completed}</span>
        <span className="chip">Cancelled: {counts.cancelled}</span>
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by patient name, phone or reason..."
        status={status}
        statusOptions={STATUS_OPTIONS}
        onStatusChange={setStatus}
        showStatus
        onReset={() => {
          setSearch('');
          setStatus('');
        }}
      />

      <AppointmentTable
        appointments={visible}
        loading={loading}
        showPatient
        showDoctor={false}
        renderActions={renderActions}
        emptyMessage="No appointments match the current filters."
      />
    </div>
  );
}
