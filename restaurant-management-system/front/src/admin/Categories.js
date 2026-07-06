import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../api/axios';

const emptyForm = { id: null, name: '', description: '', is_active: true };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/categories/').then((res) => setCategories(res.data.results || res.data));
  };

  useEffect(load, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (form.id) {
        await api.put(`/categories/${form.id}/`, form);
      } else {
        await api.post('/categories/', form);
      }
      setForm(emptyForm);
      load();
    } catch (err) {
      setError('Could not save category. Check the name is unique and try again.');
    }
  };

  const handleEdit = (cat) => setForm({ ...cat, id: cat.id });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Menu items inside it will also be removed.')) return;
    await api.delete(`/categories/${id}/`);
    load();
  };

  return (
    <AdminLayout title="Categories">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="table-panel p-3">
            <h2 className="h6 mb-3">{form.id ? 'Edit category' : 'Add category'}</h2>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="form-label small">Name</label>
                <input
                  className="form-control form-control-sm"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="form-label small">Description</label>
                <textarea
                  className="form-control form-control-sm"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                />
              </div>
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  id="cat-active"
                />
                <label className="form-check-label small" htmlFor="cat-active">Active</label>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-ember btn-sm px-3" type="submit">
                  {form.id ? 'Save changes' : 'Add category'}
                </button>
                {form.id && (
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setForm(emptyForm)}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="table-panel p-3">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div className="fw-semibold">{cat.name}</div>
                      <div className="small text-muted">{cat.description}</div>
                    </td>
                    <td>{cat.item_count}</td>
                    <td>
                      <span className={`badge ${cat.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {cat.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEdit(cat)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(cat.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td colSpan={4} className="text-muted text-center py-4">No categories yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
