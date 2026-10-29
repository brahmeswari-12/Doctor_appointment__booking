// Small shared helpers used across pages.

// Format an ISO / date string as e.g. "12 Mar 2026".
export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Format a datetime string as "12 Mar 2026, 09:30".
export function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${formatDate(value)}, ${date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

// Convert a time like "09:30" (24h) into "09:30 AM".
export function formatTime(value) {
  if (!value) return '-';
  const parts = String(value).split(':');
  if (parts.length < 2) return String(value);
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (Number.isNaN(hours)) return String(value);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(display).padStart(2, '0')}:${minutes} ${suffix}`;
}

// YYYY-MM-DD for the given date (defaults to today) in local time.
export function toDateInputValue(date = new Date()) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Status -> badge class name.
export function statusClass(status) {
  const key = String(status || '').toLowerCase();
  const known = [
    'pending',
    'confirmed',
    'completed',
    'cancelled',
    'approved',
    'rejected',
    'active',
    'inactive',
    'paid',
    'unpaid',
    'refunded',
    'failed',
  ];
  return known.includes(key) ? `badge-${key}` : 'badge-neutral';
}

// Currency symbol for a currency code (defaults to the rupee sign).
export function currencySymbol(currency = 'INR') {
  const map = { INR: '\u20B9', USD: '$', EUR: '\u20AC', GBP: '\u00A3' };
  return map[String(currency).toUpperCase()] || `${String(currency).toUpperCase()} `;
}

// Format an amount as e.g. "₹500.00".
export function formatCurrency(amount, currency = 'INR') {
  const value = Number(amount || 0);
  return `${currencySymbol(currency)}${value.toFixed(2)}`;
}

// Build initials from a full name ("Dr. John Doe" -> "JD").
export function initials(name) {
  if (!name) return '?';
  return name
    .replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

// Human readable status label.
export function labelize(value) {
  if (!value) return '-';
  const text = String(value);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Today's booking-slot status for a doctor, derived from the API card fields
// (worksToday / todaySlotCount / todaySlots).
export function todayAvailability(doctor) {
  const worksToday = Boolean(doctor?.worksToday);
  const slotCount = Number(doctor?.todaySlotCount || 0);
  const slots = Array.isArray(doctor?.todaySlots) ? doctor.todaySlots : [];

  if (!worksToday) {
    return { worksToday, slotCount, slots, className: 'badge-inactive', label: 'Not available today' };
  }
  if (slotCount > 0) {
    return {
      worksToday,
      slotCount,
      slots,
      className: 'badge-active',
      label: `${slotCount} slot${slotCount === 1 ? '' : 's'} available today`,
    };
  }
  return { worksToday, slotCount, slots, className: 'badge-pending', label: 'No slots left today' };
}
