import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import useAuth from '../hooks/useAuth';

// Shell for patient/doctor/admin dashboards: collapsible sidebar + topbar.
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, role } = useAuth();

  const roleLabel = role
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : 'Dashboard';

  return (
    <div className="dashboard-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-menu-btn"
            aria-label="Toggle navigation"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            &#9776;
          </button>

          <span className="dashboard-topbar-title">{roleLabel} Portal</span>

          <span className="nav-user">
            <span className="avatar">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </span>
            <span className="hidden" style={{ display: 'none' }}>{user?.name}</span>
          </span>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
