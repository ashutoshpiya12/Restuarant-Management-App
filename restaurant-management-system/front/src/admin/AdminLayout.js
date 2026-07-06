import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';

const LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/menu-items', label: 'Menu Items' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/tables', label: 'Tables' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/reports', label: 'Reports' },
];

export default function AdminLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-shell d-flex">
      <aside className="admin-sidebar" style={{ width: 220, flexShrink: 0 }}>
        <div className="brand">Acme Restaurant</div>
        <nav className="nav flex-column py-2">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className="nav-link">
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-grow-1">
        <div className="admin-topbar d-flex justify-content-between align-items-center px-4 py-3">
          <h1 className="h5 mb-0">{title}</h1>
          <div className="d-flex align-items-center gap-3">
            <span className="small text-muted">{user?.username}</span>
            <button className="btn btn-sm btn-outline-secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
