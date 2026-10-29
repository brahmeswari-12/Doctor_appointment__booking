// Search + filter controls used on doctor and admin listing pages.
export default function SearchFilterBar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  specializations = [],
  specializationId = '',
  onSpecializationChange,
  status = '',
  statusOptions = [],
  onStatusChange,
  date = '',
  onDateChange,
  onReset,
  showSpecialization = false,
  showStatus = false,
  showDate = false,
}) {
  const columns = 1 +
    (showSpecialization ? 1 : 0) +
    (showStatus ? 1 : 0) +
    (showDate ? 1 : 0);

  const barClass = columns >= 3 ? 'filter-bar filter-bar-4' : 'filter-bar';

  return (
    <div className={barClass}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor="sfb-search">Search</label>
        <input
          id="sfb-search"
          type="search"
          className="form-control"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      {showSpecialization && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="sfb-spec">Specialization</label>
          <select
            id="sfb-spec"
            className="form-select"
            value={specializationId}
            onChange={(e) => onSpecializationChange?.(e.target.value)}
          >
            <option value="">All specializations</option>
            {specializations.map((spec) => (
              <option key={spec.id} value={spec.id}>{spec.name}</option>
            ))}
          </select>
        </div>
      )}

      {showStatus && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="sfb-status">Status</label>
          <select
            id="sfb-status"
            className="form-select"
            value={status}
            onChange={(e) => onStatusChange?.(e.target.value)}
          >
            <option value="">All statuses</option>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </div>
      )}

      {showDate && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="sfb-date">Date</label>
          <input
            id="sfb-date"
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => onDateChange?.(e.target.value)}
          />
        </div>
      )}

      {onReset && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <span className="form-label" aria-hidden="true">&nbsp;</span>
          <button type="button" className="btn btn-outline" onClick={onReset}>Reset</button>
        </div>
      )}
    </div>
  );
}
