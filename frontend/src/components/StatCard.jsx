// Icon + value summary tile for dashboards.
export default function StatCard({ label, value, icon, variant = 'primary' }) {
  return (
    <div className="stat-card">
      {icon && <span className={`stat-icon stat-icon-${variant}`} aria-hidden="true">{icon}</span>}
      <div className="stat-info">
        <div className="stat-value">{value ?? 0}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
