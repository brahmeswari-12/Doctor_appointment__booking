// Dismissible inline alert banner.
const ICONS = {
  error: '\u26A0',
  success: '\u2714',
  warning: '\u26A0',
  info: '\u2139',
};

export default function Alert({ type = 'info', message, children, onClose, className = '' }) {
  if (!message && !children) return null;

  return (
    <div className={`alert alert-${type} ${className}`.trim()} role="alert">
      <span className="alert-icon" aria-hidden="true">{ICONS[type] || ICONS.info}</span>
      <div className="alert-body">{children || message}</div>
      {onClose && (
        <button type="button" className="alert-close" aria-label="Dismiss" onClick={onClose}>
          &times;
        </button>
      )}
    </div>
  );
}
