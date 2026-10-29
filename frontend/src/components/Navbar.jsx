import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Top navigation for public pages. Collapses into a menu on mobile.
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, token, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const homeForRole =
    role === 'admin' ? '/admin' : role === 'doctor' ? '/doctor' : '/patient';

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate('/login');
  };

  // Close the mobile menu whenever the route changes.
  // (Rendered inline to avoid an extra effect import.)
  const links = (
    <>
      <NavLink to="/" onClick={close} className={location.pathname === '/' ? 'active' : ''} end>
        Home
      </NavLink>
      <NavLink to="/doctors" onClick={close} className={location.pathname.startsWith('/doctors') ? 'active' : ''}>
        Find Doctors
      </NavLink>
      <NavLink to="/about" onClick={close} className={location.pathname === '/about' ? 'active' : ''}>
        About
      </NavLink>
      <NavLink to="/contact" onClick={close} className={location.pathname === '/contact' ? 'active' : ''}>
        Contact
      </NavLink>
    </>
  );

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={close}>
          <span className="brand-mark" aria-hidden="true">M</span>
          MediCare
        </Link>

        <nav className="navbar-links" aria-label="Primary">{links}</nav>

        <div className="navbar-actions">
          {token ? (
            <>
              <span className="nav-user">
                <span className="avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                {user?.name || 'Account'}
              </span>
              <Link to={homeForRole} className="btn btn-secondary btn-sm">Dashboard</Link>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="navbar-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? '\u2715' : '\u2630'}
        </button>
      </div>

      {open && (
        <div className="navbar-mobile">
          {links}
          <div className="mobile-actions">
            {token ? (
              <>
                <Link to={homeForRole} className="btn btn-secondary btn-block" onClick={close}>
                  Dashboard
                </Link>
                <button type="button" className="btn btn-outline btn-block" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-block" onClick={close}>Login</Link>
                <Link to="/register" className="btn btn-primary btn-block" onClick={close}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
