import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import AdminLayout from './AdminLayout';
import api from '../api/axios';

const emptyForm = { id: null, number: '', capacity: 2, is_occupied: false };

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [qrTable, setQrTable] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const load = () => {
    api.get('/tables/').then((res) => setTables(res.data.results || res.data));
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
      const payload = { ...form, number: Number(form.number), capacity: Number(form.capacity) };
      if (form.id) {
        await api.put(`/tables/${form.id}/`, payload);
      } else {
        await api.post('/tables/', payload);
      }
      setForm(emptyForm);
      load();
    } catch (err) {
      setError('Could not save table. Table numbers must be unique.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table?')) return;
    await api.delete(`/tables/${id}/`);
    load();
  };

  const menuUrlFor = (table) => `${window.location.origin}/menu?table=${table.id}`;

  const showQr = async (table) => {
    const url = menuUrlFor(table);
    const dataUrl = await QRCode.toDataURL(url, { width: 260, margin: 2 });
    setQrDataUrl(dataUrl);
    setQrTable(table);
  };

  const downloadQr = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `table-${qrTable.number}-qr.png`;
    link.click();
  };

  return (
    <AdminLayout title="Tables">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="table-panel p-3">
            <h2 className="h6 mb-3">{form.id ? 'Edit table' : 'Add table'}</h2>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="form-label small">Table number</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  name="number"
                  value={form.number}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small">Capacity (seats)</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-ember btn-sm px-3" type="submit">
                  {form.id ? 'Save changes' : 'Add table'}
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
                  <th>Table</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t) => (
                  <tr key={t.id}>
                    <td className="fw-semibold">Table {t.number}</td>
                    <td>{t.capacity} seats</td>
                    <td>
                      <span className={`badge ${t.is_occupied ? 'bg-danger' : 'bg-success'}`}>
                        {t.is_occupied ? 'Occupied' : 'Free'}
                      </span>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => showQr(t)}>QR</button>
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setForm(t)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {tables.length === 0 && (
                  <tr><td colSpan={4} className="text-muted text-center py-4">No tables yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {qrTable && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 30 }}
        >
          <div className="bg-white rounded p-4 text-center" style={{ maxWidth: 340, width: '90%' }}>
            <h2 className="h6 mb-3">Table {qrTable.number} — Menu QR</h2>
            {qrDataUrl && <img src={qrDataUrl} alt={`QR for table ${qrTable.number}`} className="img-fluid mb-3" />}
            <p className="small text-muted">
              Print this and place it on the table. Scanning it opens the menu
              with this table pre-selected so guests don't have to pick it manually.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-ember btn-sm" onClick={downloadQr}>Download PNG</button>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setQrTable(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
