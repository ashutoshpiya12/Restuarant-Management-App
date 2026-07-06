import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../api/axios';

export default function Users() {
  const [users, setUsers] = useState([]);

  const load = () => {
    api.get('/users/').then((res) => setUsers(res.data.results || res.data));
  };

  useEffect(load, []);

  const toggleStaff = async (user) => {
    await api.patch(`/users/${user.id}/`, { is_staff: !user.is_staff });
    load();
  };

  const toggleActive = async (user) => {
    await api.patch(`/users/${user.id}/`, { is_active: !user.is_active });
    load();
  };

  return (
    <AdminLayout title="Users">
      <div className="table-panel p-3">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Admin access</th>
              <th>Account</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="fw-semibold">{user.username}</td>
                <td className="small text-muted">{user.email}</td>
                <td>
                  <span className={`badge badge-role-${user.profile?.role || 'customer'}`}>
                    {user.profile?.role || 'customer'}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${user.is_staff ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                    onClick={() => toggleStaff(user)}
                  >
                    {user.is_staff ? 'Revoke admin' : 'Grant admin'}
                  </button>
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${user.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                    onClick={() => toggleActive(user)}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="text-muted text-center py-4">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
