import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Maps a role to its dashboard home.
const ROLE_HOME = {
  patient: '/patient',
  doctor: '/doctor',
  admin: '/admin',
};

// Guards routes by role. Users are bounced to their own dashboard.
export default function RoleRoute({ allow = [], children }) {
  const { role } = useAuth();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(role)) {
    // Redirect to the dashboard that matches the user's actual role.
    return <Navigate to={ROLE_HOME[role] || '/'} replace />;
  }

  return children;
}
