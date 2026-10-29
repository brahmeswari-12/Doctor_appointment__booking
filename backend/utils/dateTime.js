const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Returns the weekday name (e.g. "Monday") for a YYYY-MM-DD string. */
function dayNameFromDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return DAY_NAMES[date.getDay()];
}

/** Adds `minutes` to a "HH:MM" (or "HH:MM:SS") string and returns "HH:MM". */
function addMinutes(timeString, minutes) {
  const [h, m] = timeString.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hours = Math.floor(total / 60) % 24;
  const mins = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/** Normalizes "HH:MM:SS" or "HH:MM" to "HH:MM". */
function toHHMM(timeString) {
  return String(timeString).slice(0, 5);
}

/** True when `time` is inside [start, end) using "HH:MM" comparisons. */
function isWithin(time, start, end) {
  return time >= toHHMM(start) && time < toHHMM(end);
}

module.exports = { DAY_NAMES, dayNameFromDate, addMinutes, toHHMM, isWithin };
