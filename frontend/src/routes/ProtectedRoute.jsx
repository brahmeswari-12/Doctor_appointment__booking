import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Guards routes that require authentication.
export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    // Preserve the intended destination so we can return after login.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
