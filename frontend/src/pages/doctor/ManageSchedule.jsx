import { useEffect, useState } from 'react';
import authService from '../../services/authService.js';
import doctorService from '../../services/doctorService.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Build a default row per weekday.
const defaultRows = () =>
  DAYS.map((day) => ({
    day,
    startTime: '09:00',
    endTime: '17:00',
    available: day !== 'sunday',
  }));

// Normalise an API schedule array into a full 7-day set.
function toRows(schedules) {
  if (!Array.isArray(schedules) || schedules.length === 0) return defaultRows();

  return DAYS.map((day) => {
    const found = schedules.find((s) => String(s.day).toLowerCase() === day);
    return {
      day,
      startTime: found?.startTime?.slice(0, 5) || '09:00',
      endTime: found?.endTime?.slice(0, 5) || '17:00',
      available: found ? Boolean(found.available) : false,
    };
  });
}

// Doctor: edit the weekly availability grid.
export default function ManageSchedule() {
  const toast = useToastContext();

  const [rows, setRows] = useState(defaultRows);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load the doctor's current schedule (needs the doctor id from /auth/me).
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const me = await authService.getMe();
        const doctorId = me?.profile?.id;
        if (!doctorId) {
          if (active) setLoading(false);
          return;
        }
        const schedules = await doctorService.getDoctorSchedule(doctorId);
        if (active) setRows(toRows(schedules));
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate that end time is after start time for available days.
    const invalid = rows.find(
      (row) => row.available && row.startTime && row.endTime && row.startTime >= row.endTime
    );
    if (invalid) {
      setError(`End time must be after start time for ${invalid.day}.`);
      return;
    }

    setSaving(true);
    try {
      const payload = rows.map((row) => ({
        day: row.day,
        startTime: row.startTime,
        endTime: row.endTime,
        available: row.available,
      }));
      const saved = await doctorService.updateSchedule(payload);
      setRows(toRows(saved));
      toast.success('Schedule saved successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader text="Loading your schedule..." />;

  return (
    <div>
      <div className="dashboard-heading">
        <div>
          <h1>Manage Schedule</h1>
          <p>Set your weekly availability so patients can book slots.</p>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card" style={{ maxWidth: 860 }}>
        <form onSubmit={handleSubmit}>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="table" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Start Time</th>
                  <th scope="col">End Time</th>
                  <th scope="col">Available</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.day}>
                    <td className="schedule-day" style={{ textTransform: 'capitalize' }}>
                      {row.day}
                    </td>
                    <td>
                      <label className="sr-only" htmlFor={`start-${row.day}`}>
                        {row.day} start time
                      </label>
                      <input
                        id={`start-${row.day}`}
                        type="time"
                        className="form-control"
                        value={row.startTime}
                        disabled={!row.available}
                        onChange={(e) => handleChange(index, 'startTime', e.target.value)}
                      />
                    </td>
                    <td>
                      <label className="sr-only" htmlFor={`end-${row.day}`}>
                        {row.day} end time
                      </label>
                      <input
                        id={`end-${row.day}`}
                        type="time"
                        className="form-control"
                        value={row.endTime}
                        disabled={!row.available}
                        onChange={(e) => handleChange(index, 'endTime', e.target.value)}
                      />
                    </td>
                    <td>
                      <div className="form-check">
                        <input
                          id={`avail-${row.day}`}
                          type="checkbox"
                          checked={row.available}
                          onChange={(e) => handleChange(index, 'available', e.target.checked)}
                        />
                        <label htmlFor={`avail-${row.day}`}>
                          {row.available ? 'Open' : 'Closed'}
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? <Loader size="sm" inline /> : 'Save Schedule'}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-lg"
              onClick={() => setRows(defaultRows())}
              disabled={saving}
            >
              Reset to Default
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
