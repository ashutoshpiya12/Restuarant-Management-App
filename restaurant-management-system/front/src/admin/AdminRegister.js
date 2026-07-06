import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function AdminRegister() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register/', { username, email, password });
      navigate('/admin/login');
    } catch (err) {
      const data = err.response?.data;
      const firstError = data && typeof data === 'object'
        ? Object.values(data)[0]
        : null;
      setError(Array.isArray(firstError) ? firstError[0] : (firstError || 'Could not create the account. Please check your details.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <h1 className="display-font h3 mb-1">Create admin account</h1>
        <p className="text-muted small mb-4">Acme Restaurant — staff registration</p>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Username</label>
            <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Email</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-semibold">Confirm password</label>
            <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button className="btn btn-ember w-100 py-2" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center small text-muted mt-3 mb-0">
          Already have an account? <Link to="/admin/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
