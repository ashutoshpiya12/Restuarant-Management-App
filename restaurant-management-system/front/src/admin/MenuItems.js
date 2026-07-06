import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../api/axios';

const emptyForm = {
  id: null, category: '', name: '', description: '', price: '',
  is_available: true, is_vegetarian: false, image: null,
};

export default function MenuItems() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/menu-items/').then((res) => setItems(res.data.results || res.data));
    api.get('/categories/').then((res) => setCategories(res.data.results || res.data));
  };

  useEffect(load, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // FormData is required (instead of plain JSON) whenever we're sending
      // a file alongside the other fields.
      const data = new FormData();
      data.append('category', Number(form.category));
      data.append('name', form.name);
      data.append('description', form.description);
      data.append('price', form.price);
      data.append('is_available', form.is_available);
      data.append('is_vegetarian', form.is_vegetarian);
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (form.id) {
        await api.patch(`/menu-items/${form.id}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/menu-items/', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setForm(emptyForm);
      setImageFile(null);
      load();
    } catch (err) {
      setError('Could not save item. Make sure a category and price are set.');
    }
  };

  const handleEdit = (item) => {
    setImageFile(null);
    setForm({
      id: item.id,
      category: item.category,
      name: item.name,
      description: item.description,
      price: item.price,
      is_available: item.is_available,
      is_vegetarian: item.is_vegetarian,
      image: item.image,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    await api.delete(`/menu-items/${id}/`);
    load();
  };

  return (
    <AdminLayout title="Menu Items">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="table-panel p-3">
            <h2 className="h6 mb-3">{form.id ? 'Edit item' : 'Add menu item'}</h2>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="form-label small">Category</label>
                <select
                  className="form-select form-select-sm"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option value={c.id} key={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
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
              <div className="mb-2">
                <label className="form-label small">Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control form-control-sm"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small">Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control form-control-sm"
                  onChange={handleFileChange}
                />
                {form.id && form.image && !imageFile && (
                  <img src={form.image} alt="" className="mt-2 rounded" style={{ width: 60, height: 60, objectFit: 'cover' }} />
                )}
              </div>
              <div className="form-check mb-1">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="is_available"
                  checked={form.is_available}
                  onChange={handleChange}
                  id="item-available"
                />
                <label className="form-check-label small" htmlFor="item-available">Available</label>
              </div>
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  name="is_vegetarian"
                  checked={form.is_vegetarian}
                  onChange={handleChange}
                  id="item-veg"
                />
                <label className="form-check-label small" htmlFor="item-veg">Vegetarian</label>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-ember btn-sm px-3" type="submit">
                  {form.id ? 'Save changes' : 'Add item'}
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
                  <th></th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.image ? (
                        <img src={item.image} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 4, background: '#eee' }} />
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold">{item.name}</div>
                      <div className="small text-muted">{item.description}</div>
                    </td>
                    <td>{item.category_name}</td>
                    <td>₨ {item.price}</td>
                    <td>
                      <span className={`badge ${item.is_available ? 'bg-success' : 'bg-secondary'}`}>
                        {item.is_available ? 'Available' : 'Hidden'}
                      </span>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEdit(item)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={6} className="text-muted text-center py-4">No menu items yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
