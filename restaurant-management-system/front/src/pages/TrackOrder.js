import React, { useState } from 'react';
import api from '../api/axios';

const STATUS_LABELS = {
  pending: 'Pending — waiting for the kitchen to accept it',
  confirmed: 'Confirmed — the kitchen has accepted your order',
  preparing: 'Preparing — your food is being cooked',
  ready: 'Ready — your order is ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      const { data } = await api.get('/orders/track/', { params: { order_id: orderId, phone } });
      setOrder(data);
    } catch (err) {
      setError('No order found with that order number and phone number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 480 }}>
      <h1 className="display-font h2 mb-1">Track your order</h1>
      <p className="text-muted mb-4">Enter your order number and the phone number you used at checkout.</p>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-2">
          <label className="form-label small">Order number</label>
          <input className="form-control" value={orderId} onChange={(e) => setOrderId(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label small">Phone number</label>
          <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <button className="btn btn-ember" disabled={loading}>{loading ? 'Checking…' : 'Track order'}</button>
      </form>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {order && (
        <div className="table-panel p-3">
          <h2 className="h6 mb-1">Order #{order.id}</h2>
          <p className="small text-muted mb-2">
            {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
          </p>
          <p className="fw-semibold mb-3">{STATUS_LABELS[order.status] || order.status}</p>
          <ul className="list-group mb-3">
            {order.items.map((it) => (
              <li key={it.id} className="list-group-item d-flex justify-content-between small">
                <span>{it.quantity} x {it.menu_item_name}</span>
                <span>₨{it.subtotal}</span>
              </li>
            ))}
            <li className="list-group-item d-flex justify-content-between fw-semibold small">
              <span>Total</span><span>₨{order.total}</span>
            </li>
          </ul>
          <p className="small text-muted mb-0">
            Payment: {order.payment_method === 'digital' ? 'Digital' : 'Cash'} — {order.payment_status}
          </p>
        </div>
      )}
    </div>
  );
}
