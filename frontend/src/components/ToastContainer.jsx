import { useToastContext } from '../context/ToastContext.jsx';

// Renders the stack of active toasts. Mounted once at the app root.
export default function ToastContainer() {
  const { toasts, remove } = useToastContext();

  if (!toasts.length) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
          <span className="toast-message">{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            aria-label="Dismiss notification"
            onClick={() => remove(toast.id)}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
