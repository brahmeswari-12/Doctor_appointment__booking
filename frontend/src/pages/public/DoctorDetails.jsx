import { useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import doctorService from '../../services/doctorService.js';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import { useToastContext } from '../../context/ToastContext.jsx';
import { formatTime, initials, labelize, todayAvailability } from '../../utils/helpers.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

// Public doctor profile with weekly schedule and a booking entry point.
export default function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastContext();
  const { token, role } = useAuth();

  const fetchDoctor = useCallback(() => doctorService.getDoctorById(id), [id]);
  const { data: doctor, loading, error } = useFetch(fetchDoctor, [id]);

  const handleBook = () => {
    if (!token) {
      toast.info('Please sign in to book an appointment.');
      navigate('/login', { state: { from: `/doctors/${id}` } });
      return;
    }
    if (role === 'patient') {
      navigate(`/patient/book?doctorId=${id}`);
      return;
    }
    toast.warning('Only patient accounts can book appointments.');
  };

  if (loading) return <Loader text="Loading doctor profile..." />;

  if (error) {
    return (
      <div className="container section-padding">
        <Alert type="error" message={error.message} />
        <Link to="/doctors" className="btn btn-outline">Back to doctors</Link>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container section-padding">
        <div className="empty-state">
          <div className="empty-state-title">Doctor not found</div>
          <Link to="/doctors" className="btn btn-outline mt-3">Back to doctors</Link>
        </div>
      </div>
    );
  }

  const schedules = Array.isArray(doctor.schedules) ? doctor.schedules : [];
  const specName = doctor.specialization?.name || doctor.specializationName || 'General';
  const today = todayAvailability(doctor);

  return (
    <div className="container section-padding">
      <Link to="/doctors" className="btn-link mb-4" style={{ display: 'inline-block' }}>
        &larr; Back to all doctors
      </Link>

      <div className="split split-sidebar">
        {/* ------------------------------ Main ------------------------------ */}
        <div className="stack">
          <div className="card">
            <div className="doctor-card-top">
              <span className="doctor-avatar" aria-hidden="true">{initials(doctor.name)}</span>
              <div>
                <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>{doctor.name}</h1>
                <div className="doctor-spec">{specName}</div>
                <div className="mt-2">
                  <span className={`badge ${doctor.available ? 'badge-active' : 'badge-inactive'}`}>
                    {doctor.available ? 'Available' : 'Unavailable'}
                  </span>
                  {doctor.status && (
                    <span className="badge badge-info" style={{ marginLeft: 8 }}>
                      {labelize(doctor.status)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* ---------------------- Today's availability --------------------- */}
            <h2 style={{ fontSize: '1.05rem' }}>Today&apos;s Availability</h2>
            <div className="doctor-today">
              <span className={`badge ${today.className}`}>{today.label}</span>
              {today.worksToday && doctor.todayTimings && (
                <span className="doctor-today-timings">
                  <span aria-hidden="true">&#128337;</span> {doctor.todayTimings}
                </span>
              )}
            </div>
            {today.worksToday && today.slots.length > 0 ? (
              <div className="pill-list doctor-slot-chips mt-3">
                {today.slots.map((time) => (
                  <span key={time} className="chip">{formatTime(time)}</span>
                ))}
              </div>
            ) : (
              <p className="text-muted mt-3 mb-0">
                {today.worksToday
                  ? 'No slots left for today. Please choose another date.'
                  : 'This doctor is not consulting today. Please choose another date.'}
              </p>
            )}

            <div className="divider" />

            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Qualification</span>
                <span className="detail-value">{doctor.qualification || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Experience</span>
                <span className="detail-value">
                  {doctor.experience != null ? `${doctor.experience} years` : '-'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consultation Fee</span>
                <span className="detail-value">₹{doctor.consultationFee ?? '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email</span>
                <span className="detail-value">{doctor.email || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{doctor.phone || '-'}</span>
              </div>
            </div>

            {doctor.bio && (
              <>
                <div className="divider" />
                <h2 style={{ fontSize: '1.05rem' }}>About</h2>
                <p className="text-muted mb-0">{doctor.bio}</p>
              </>
            )}
          </div>

          {/* ---------------------------- Schedule --------------------------- */}
          <div className="card">
            <h2 className="card-title">Weekly Schedule</h2>
            {schedules.length === 0 ? (
              <p className="text-muted mb-0">No schedule published yet.</p>
            ) : (
              <div className="mt-3">
                {schedules.map((slot) => (
                  <div className="schedule-row" key={slot.id ?? slot.day}>
                    <span className="schedule-day">{labelize(slot.day)}</span>
                    <span className="text-muted">
                      {slot.startTime && slot.endTime
                        ? `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`
                        : 'No hours set'}
                    </span>
                    <span>
                      <span className={`badge ${slot.available ? 'badge-active' : 'badge-inactive'}`}>
                        {slot.available ? 'Available' : 'Unavailable'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------- Sidebar ---------------------------- */}
        <aside className="card">
          <h2 className="card-title">Book an appointment</h2>
          <p className="text-muted">
            Select an available date and time slot to schedule your visit with{' '}
            {doctor.name}.
          </p>
          <div className="detail-row mb-4">
            <span className="detail-label">Fee</span>
            <span className="detail-value">₹{doctor.consultationFee ?? '-'}</span>
          </div>
          <button type="button" className="btn btn-primary btn-block btn-lg" onClick={handleBook}>
            Book Appointment
          </button>

          {!token && (
            <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.82rem' }}>
              You will be asked to sign in first.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
