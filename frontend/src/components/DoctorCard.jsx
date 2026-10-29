import { formatTime, initials, todayAvailability } from '../utils/helpers.js';

const MAX_VISIBLE_SLOTS = 4;

// Small presentational card summarising a doctor.
export default function DoctorCard({ doctor, onView, onBook, showBook = true }) {
  if (!doctor) return null;

  const specName = doctor.specialization?.name || doctor.specializationName || 'General';
  const today = todayAvailability(doctor);

  const visibleSlots = today.slots.slice(0, MAX_VISIBLE_SLOTS);
  const hiddenSlots = today.slotCount - visibleSlots.length;

  return (
    <article className="doctor-card">
      <div className="doctor-card-top">
        <span className="doctor-avatar" aria-hidden="true">{initials(doctor.name)}</span>
        <div>
          <h3 className="doctor-name">{doctor.name}</h3>
          <div className="doctor-spec">{specName}</div>
        </div>
      </div>

      <div className="doctor-meta">
        {doctor.qualification && (
          <div className="doctor-meta-row">
            <span aria-hidden="true">&#127891;</span>
            <span>{doctor.qualification}</span>
          </div>
        )}
        {doctor.experience != null && (
          <div className="doctor-meta-row">
            <span aria-hidden="true">&#128188;</span>
            <span>{doctor.experience} years experience</span>
          </div>
        )}
        {doctor.phone && (
          <div className="doctor-meta-row">
            <span aria-hidden="true">&#128222;</span>
            <span>{doctor.phone}</span>
          </div>
        )}
      </div>

      {/* ------------------------ Today's slot status ------------------------ */}
      <div className="doctor-today">
        <span className={`badge ${today.className}`}>{today.label}</span>
        {today.worksToday && doctor.todayTimings && (
          <span className="doctor-today-timings">
            <span aria-hidden="true">&#128337;</span> {doctor.todayTimings}
          </span>
        )}
      </div>

      {today.worksToday && visibleSlots.length > 0 && (
        <div className="pill-list doctor-slot-chips">
          {visibleSlots.map((time) => (
            <span key={time} className="chip">{formatTime(time)}</span>
          ))}
          {hiddenSlots > 0 && <span className="chip chip-more">+{hiddenSlots} more</span>}
        </div>
      )}

      {doctor.bio && <p className="doctor-bio">{doctor.bio}</p>}

      <div className="doctor-card-footer">
        <div className="doctor-fee">
          ₹{doctor.consultationFee ?? '-'} <span>/ visit</span>
        </div>
        <div className="btn-group">
          {onView && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onView(doctor)}>
              View
            </button>
          )}
          {showBook && onBook && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onBook(doctor)}>
              Book
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
