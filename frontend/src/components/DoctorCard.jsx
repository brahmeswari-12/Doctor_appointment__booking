import { formatTime, initials, todayAvailability } from '../utils/helpers.js';

const MAX_VISIBLE_SLOTS = 4;

// Premium presentational card summarising a doctor.
export default function DoctorCard({ doctor, onView, onBook, showBook = true }) {
  if (!doctor) return null;

  const specName = doctor.specialization?.name || doctor.specializationName || 'General';
  const today = todayAvailability(doctor);

  const visibleSlots = today.slots.slice(0, MAX_VISIBLE_SLOTS);
  const hiddenSlots = today.slotCount - visibleSlots.length;

  return (
    <article className="doctor-card">
      <div className="doctor-card-top">
        <div className="avatar-wrap">
          <span className="doctor-avatar" aria-hidden="true">{initials(doctor.name)}</span>
          <span className="verified-badge-mini" title="Verified Medical Specialist">✓</span>
        </div>
        <div className="doctor-header-info">
          <div className="flex-between">
            <span className="doctor-spec-pill">{specName}</span>
            <span className="rating-pill">★ 4.9</span>
          </div>
          <h3 className="doctor-name">{doctor.name}</h3>
          {doctor.qualification && (
            <div className="doctor-qualification" title={doctor.qualification}>
              {doctor.qualification}
            </div>
          )}
        </div>
      </div>

      <div className="doctor-meta">
        {doctor.experience != null && (
          <div className="doctor-meta-row">
            <span className="meta-icon" aria-hidden="true">💼</span>
            <span>{doctor.experience} years experience</span>
          </div>
        )}
        {doctor.phone && (
          <div className="doctor-meta-row">
            <span className="meta-icon" aria-hidden="true">📞</span>
            <span>{doctor.phone}</span>
          </div>
        )}
      </div>

      {/* ------------------------ Today's slot status ------------------------ */}
      <div className="doctor-today">
        <span className={`badge ${today.className}`}>
          <span className="status-dot" />
          {today.label}
        </span>
        {today.worksToday && doctor.todayTimings && (
          <span className="doctor-today-timings">
            <span aria-hidden="true">🕒</span> {doctor.todayTimings}
          </span>
        )}
      </div>

      {today.worksToday && visibleSlots.length > 0 && (
        <div className="pill-list doctor-slot-chips">
          {visibleSlots.map((time) => (
            <span key={time} className="chip chip-time">{formatTime(time)}</span>
          ))}
          {hiddenSlots > 0 && <span className="chip chip-more">+{hiddenSlots} more</span>}
        </div>
      )}

      {doctor.bio && <p className="doctor-bio">{doctor.bio}</p>}

      <div className="doctor-card-footer">
        <div className="doctor-fee-box">
          <span className="fee-label">Consultation Fee</span>
          <div className="doctor-fee">
            ₹{doctor.consultationFee ?? '-'} <span className="fee-sub">/ visit</span>
          </div>
        </div>
        <div className="btn-group">
          {onView && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onView(doctor)}>
              Profile
            </button>
          )}
          {showBook && onBook && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onBook(doctor)}>
              Book Now
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
