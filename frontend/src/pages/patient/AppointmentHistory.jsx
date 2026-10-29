import { useCallback, useMemo, useState } from 'react';
import patientService from '../../services/patientService.js';
import useFetch from '../../hooks/useFetch.js';
import AppointmentTable from '../../components/AppointmentTable.jsx';
import Alert from '../../components/Alert.jsx';

// Read-only history of all past visits.
export default function AppointmentHistory() {
  const [search, setSearch] = useState('');

  const fetchAppointments = useCallback(() => patientService.getAppointments(), []);
  const { data, loading, error } = useFetch(fetchAppointments);

  const history = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const term = search.trim().toLowerCase();

    return list
      .filter((appt) => ['completed', 'cancelled'].includes(appt.status))
      .filter((appt) => {
        if (!term) return true;
        return (
          (appt.doctorName || '').toLowerCase().includes(term) ||
          (appt.specializationName || '').toLowerCase().includes(term) ||
          (appt.reason || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => `${b.appointmentDate}${b.appointmentTime}`.localeCompare(`${a.appointmentDate}${a.appointmentTime}`));
  }, [data, search]);

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>Appointment History</h1>
          <p>All your completed and cancelled visits.</p>
        </div>
      </div>

      {error && <Alert type="error" message={error.message} />}

      <div className="card card-tight mb-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="hist-search">Search history</label>
          <input
            id="hist-search"
            type="search"
            className="form-control"
            placeholder="Search by doctor, specialization or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <AppointmentTable
        appointments={history}
        loading={loading}
        showPatient={false}
        showDoctor
        emptyMessage="No past appointments match your search."
      />
    </div>
  );
}
