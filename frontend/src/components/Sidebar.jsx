import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Navigation items per role.
const NAV_ITEMS = {
  patient: [
    { to: '/patient', label: 'Dashboard', icon: '\u25A6', end: true },
    { to: '/patient/book', label: 'Book Appointment', icon: '\u2795' },
    { to: '/patient/appointments', label: 'My Appointments', icon: '\u{1F4C5}' },
    { to: '/patient/history', label: 'History', icon: '\u{1F553}' },
    { to: '/patient/profile', label: 'Profile', icon: '\u{1F464}' },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: '\u25A6', end: true },
    { to: '/doctor/appointments', label: 'Appointments', icon: '\u{1F4C5}' },
    { to: '/doctor/schedule', label: 'Manage Schedule', icon: '\u{1F557}' },
    { to: '/doctor/profile', label: 'Profile', icon: '\u{1F464}' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: '\u25A6', end: true },
    { to: '/admin/patients', label: 'Patients', icon: '\u{1F465}' },
    { to: '/admin/doctors', label: 'Doctors', icon: '\u{1FA7A}' },
    { to: '/admin/specializations', label: 'Specializations', icon: '\u{1F3F7}' },
    { to: '/admin/appointments', label: 'Appointments', icon: '\u{1F4C5}' },
    { to: '/admin/reports', label: 'Reports', icon: '\u{1F4CA}' },
  ],
};

// Collapsible sidebar for dashboards.
export default function Sidebar({ open, onClose }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const items = NAV_ITEMS[role] || [];

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate('/login');
  };

  return (
    <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Dashboard navigation">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-brand" onClick={onClose}>
          <span className="brand-mark" aria-hidden="true">M</span>
          MediCare
        </Link>
        <button type="button" className="sidebar-close" aria-label="Close menu" onClick={onClose}>
          &times;
        </button>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
          <div>
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">{role || 'guest'}</div>
          </div>
        </div>
        <button type="button" className="btn btn-outline btn-block btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
