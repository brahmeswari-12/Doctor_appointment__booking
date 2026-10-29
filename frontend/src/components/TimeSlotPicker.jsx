import { formatTime } from '../utils/helpers.js';

// Grid of selectable appointment slots.
export default function TimeSlotPicker({ slots = [], value, onChange, loading = false }) {
  if (loading) {
    return <p className="text-muted">Loading available time slots...</p>;
  }

  if (!slots.length) {
    return (
      <p className="text-muted">
        No slots available for the selected date. Please choose another date.
      </p>
    );
  }

  return (
    <div className="slot-grid" role="group" aria-label="Available time slots">
      {slots.map((slot) => {
        const isSelected = value === slot;
        return (
          <button
            key={slot}
            type="button"
            className={`slot-btn${isSelected ? ' selected' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onChange?.(slot)}
          >
            {formatTime(slot)}
          </button>
        );
      })}
    </div>
  );
}
