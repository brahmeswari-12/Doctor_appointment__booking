import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

// Toast (notification) context.
const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        timers.current[id] = setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [remove]
  );

  const success = useCallback((message, duration) => push(message, 'success', duration), [push]);
  const error = useCallback((message, duration) => push(message, 'error', duration), [push]);
  const info = useCallback((message, duration) => push(message, 'info', duration), [push]);
  const warning = useCallback((message, duration) => push(message, 'warning', duration), [push]);

  const value = useMemo(
    () => ({ toasts, push, success, error, info, warning, remove }),
    [toasts, push, success, error, info, warning, remove]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return ctx;
}

export default ToastContext;
