import { useMemo } from 'react';
import { formatTime } from '../utils/helpers.js';

// Convert "HH:MM" to minutes from midnight
function toMinutes(time) {
  const [h, m] = String(time).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Group slots into Morning, Afternoon, Evening periods
export default function TimeSlotPicker({ slots = [], value, onChange, loading = false }) {
  const groups = useMemo(() => {
    const morning = [];
    const afternoon = [];
    const evening = [];

    slots.forEach((slot) => {
      const mins = toMinutes(slot);
      if (mins < 12 * 60) {
        morning.push(slot);
      } else if (mins < 17 * 60) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return [
      { label: 'Morning', icon: '☀️', list: morning },
      { label: 'Afternoon', icon: '🌤️', list: afternoon },
      { label: 'Evening', icon: '🌙', list: evening },
    ].filter((g) => g.list.length > 0);
  }, [slots]);

  if (loading) {
    return (
      <div className="slot-loading-state">
        <span className="loader loader-sm" />
        <p className="text-muted mb-0">Finding available time slots...</p>
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="slot-empty-notice">
        <span className="notice-icon">📅</span>
        <p className="mb-0">
          No open slots on this date. Please select another day from the calendar above.
        </p>
      </div>
    );
  }

  return (
    <div className="slot-groups" role="group" aria-label="Available appointment time slots">
      {groups.map((group) => (
        <div key={group.label} className="slot-group-section">
          <div className="slot-group-header">
            <span>{group.icon}</span>
            <span>{group.label} Slots ({group.list.length})</span>
          </div>
          <div className="slot-grid">
            {group.list.map((slot) => {
              const isSelected = value === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  className={`slot-btn${isSelected ? ' selected' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => onChange?.(slot)}
                >
                  <span className="slot-time">{formatTime(slot)}</span>
                  {isSelected && <span className="slot-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
