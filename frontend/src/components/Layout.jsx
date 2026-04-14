import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiPackage, FiPlusCircle, FiAlertTriangle, FiFileText,
  FiMapPin, FiUsers, FiSettings, FiMenu, FiX, FiLogOut, FiChevronsLeft, FiChevronsRight
} from 'react-icons/fi';
import Logo from '../assets/Logo';

const adminNav = {
  main: [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/stores', label: 'Stores', icon: FiMapPin },
    { path: '/alerts', label: 'Alerts', icon: FiAlertTriangle },
    { path: '/reports', label: 'Reports', icon: FiFileText },
  ],
  support: [
    { path: '/settings', label: 'Settings', icon: FiSettings },
  ]
};

const managerNav = {
  main: [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/my-team', label: 'My Team', icon: FiUsers },
    { path: '/inventory', label: 'Inventory', icon: FiPackage },
    { path: '/add-product', label: 'Add Product', icon: FiPlusCircle },
    { path: '/alerts', label: 'Alerts', icon: FiAlertTriangle },
    { path: '/reports', label: 'Reports', icon: FiFileText },
  ],
  support: [
    { path: '/settings', label: 'Settings', icon: FiSettings },
  ]
};

const staffNav = {
  main: [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/inventory', label: 'Inventory', icon: FiPackage },
    { path: '/add-product', label: 'Add Product', icon: FiPlusCircle },
    { path: '/alerts', label: 'Alerts', icon: FiAlertTriangle },
  ],
  support: [
    { path: '/settings', label: 'Settings', icon: FiSettings },
  ]
};

function getNavSections(role) {
  if (role === 'admin') return adminNav;
  if (role === 'manager') return managerNav;
  return staffNav;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navSections = getNavSections(user?.role);

  return (
    <div className={`app-layout ${collapsed ? 'sb-collapsed' : ''}`}>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
          <FiMenu />
        </button>
        <Logo size={24} textColor="#00897b" />
        <div style={{ width: 24 }} />
      </div>

      {/* Sidebar */}
      <aside className={`sb ${sidebarOpen ? 'sb-open' : ''} ${collapsed ? 'sb-mini' : ''}`}>

        {/* Logo Area */}
        <div className="sb-logo-area">
          {!collapsed ? (
            <Logo size={28} textColor="#00897b" />
          ) : (
            <Logo size={26} showText={false} />
          )}

          {/* Close button on mobile */}
          <button
            className="sb-close-mobile"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Nav Sections */}
        <nav className="sb-nav">
          {/* Main Section */}
          <div className="sb-section">
            {!collapsed && <div className="sb-section-label">Main</div>}
            {navSections.main.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `sb-link ${isActive ? 'sb-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>

          {/* Support Section */}
          <div className="sb-section">
            {!collapsed && <div className="sb-section-label">Support</div>}
            {navSections.support.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `sb-link ${isActive ? 'sb-active' : ''}`}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Collapse Toggle (desktop only) */}
        <button
          className="sb-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronsRight size={16} /> : <FiChevronsLeft size={16} />}
        </button>

        {/* Footer: User Profile */}
        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="sb-user-info">
                <div className="sb-user-name">{user?.name}</div>
                <div className="sb-user-role">
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  {user?.store?.name ? ` · ${user.store.name}` : ''}
                </div>
              </div>
            )}
          </div>
          <button
            className="sb-logout"
            onClick={logout}
            title="Logout"
          >
            <FiLogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sb-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
