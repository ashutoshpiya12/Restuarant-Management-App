import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-md site-navbar py-3">
      <div className="container">
        <Link className="navbar-brand" to="/">Acme Restaurant</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="mainNav">
          <ul className="navbar-nav gap-3">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end>Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/menu">Menu</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/track-order">Track Order</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/admin/login">Admin</NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
