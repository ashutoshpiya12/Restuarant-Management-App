import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../api/axios';

// "completed" isn't offered here directly — it only happens through the
// dedicated Complete-order action, which enforces ready + paid first.
const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'ready', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-secondary',
  confirmed: 'bg-primary',
  preparing: 'bg-warning text-dark',
  ready: 'bg-info text-dark',
  completed: 'bg-success',
  cancelled: 'bg-danger',
};
const PAYMENT_BADGE = {
  unpaid: 'bg-secondary',
  pending: 'bg-warning text-dark',
  paid: 'bg-success',
  failed: 'bg-danger',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');
  const [receiptOrder, setReceiptOrder] = useState(null);

  // New order form state (for staff taking a walk-in/phone order)
  const [table, setTable] = useState('');
  const [cart, setCart] = useState([]);
  const [pickItem, setPickItem] = useState('');
  const [pickQty, setPickQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const load = () => {
    api.get('/orders/').then((res) => setOrders(res.data.results || res.data));
    api.get('/tables/').then((res) => setTables(res.data.results || res.data));
    api.get('/menu-items/?available=true').then((res) => setMenuItems(res.data.results || res.data));
  };

  useEffect(load, []);

  const addToCart = () => {
    if (!pickItem) return;
    const item = menuItems.find((m) => m.id === Number(pickItem));
    if (!item) return;
    setCart((c) => [...c, {
      menu_item: item.id,
      name: item.name,
      price: item.price,
      quantity: Number(pickQty) || 1,
    }]);
    setPickItem('');
    setPickQty(1);
  };

  const removeFromCart = (index) => {
    setCart((c) => c.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const submitOrder = async (e) => {
    e.preventDefault();
    setError('');
    if (cart.length === 0) {
      setError('Add at least one item to the order.');
      return;
    }
    try {
      await api.post('/orders/', {
        table: table || null,
        status: 'pending',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cash' ? 'pending' : 'unpaid',
        items: cart.map((c) => ({ menu_item: c.menu_item, quantity: c.quantity, price: c.price })),
      });
      setCart([]);
      setTable('');
      load();
    } catch (err) {
      setError('Could not create order. Please check the items and try again.');
    }
  };

  const changeStatus = async (order, status) => {
    await api.patch(`/orders/${order.id}/`, { status });
    load();
  };

  const markCashReceived = async (order) => {
    await api.post(`/orders/${order.id}/verify-payment/`, { received: true });
    load();
  };

  const completeOrder = async (order) => {
    try {
      await api.post(`/orders/${order.id}/complete/`);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not complete this order.');
    }
  };

  const tableLabel = (order) => (order.table_number ? `Table ${order.table_number}` : 'Takeaway');

  return (
    <AdminLayout title="Orders">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="table-panel p-3">
            <h2 className="h6 mb-3">New order (walk-in / phone)</h2>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <div className="mb-3">
              <label className="form-label small">Table (optional)</label>
              <select className="form-select form-select-sm" value={table} onChange={(e) => setTable(e.target.value)}>
                <option value="">Takeaway / no table</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>Table {t.number}</option>
                ))}
              </select>
            </div>

            <label className="form-label small">Add dish</label>
            <div className="d-flex gap-2 mb-2">
              <select className="form-select form-select-sm" value={pickItem} onChange={(e) => setPickItem(e.target.value)}>
                <option value="">Select dish…</option>
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — ₨{m.price}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                className="form-control form-control-sm"
                style={{ width: 60 }}
                value={pickQty}
                onChange={(e) => setPickQty(e.target.value)}
              />
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addToCart}>Add</button>
            </div>

            {cart.length > 0 && (
              <ul className="list-group mb-3">
                {cart.map((c, i) => (
                  <li key={i} className="list-group-item d-flex justify-content-between align-items-center py-1 px-2 small">
                    <span>{c.quantity} x {c.name}</span>
                    <span className="d-flex align-items-center gap-2">
                      ₨{(c.price * c.quantity).toFixed(2)}
                      <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeFromCart(i)}>✕</button>
                    </span>
                  </li>
                ))}
                <li className="list-group-item d-flex justify-content-between fw-semibold py-1 px-2 small">
                  <span>Total</span><span>₨{cartTotal.toFixed(2)}</span>
                </li>
              </ul>
            )}

            <div className="mb-3">
              <label className="form-label small">Payment method</label>
              <select className="form-select form-select-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="digital">Digital (already paid)</option>
              </select>
            </div>

            <button className="btn btn-ember btn-sm w-100" onClick={submitOrder}>Place order</button>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="table-panel p-3">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Table</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr>
                      <td className="fw-semibold">#{order.id}</td>
                      <td>{order.customer_name || order.guest_name || '—'}</td>
                      <td>{tableLabel(order)}</td>
                      <td>₨{order.total}</td>
                      <td>
                        {order.status === 'completed' ? (
                          <span className="badge bg-success">Completed</span>
                        ) : (
                          <select
                            className="form-select form-select-sm"
                            value={order.status}
                            onChange={(e) => changeStatus(order, e.target.value)}
                            style={{ width: 130 }}
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${PAYMENT_BADGE[order.payment_status]} d-block mb-1`}>
                          {order.payment_method} · {order.payment_status}
                        </span>
                        {order.payment_status === 'pending' && (
                          <button className="btn btn-sm btn-outline-success" onClick={() => markCashReceived(order)}>
                            Mark cash received
                          </button>
                        )}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-secondary mb-1"
                          onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                        >
                          {expandedId === order.id ? 'Hide' : 'Details'}
                        </button>
                        {order.status === 'ready' && order.payment_status === 'paid' && (
                          <button className="btn btn-sm btn-ember ms-1" onClick={() => completeOrder(order)}>
                            Complete
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <button className="btn btn-sm btn-outline-primary ms-1" onClick={() => setReceiptOrder(order)}>
                            Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr>
                        <td colSpan={7} className="bg-light">
                          <ul className="mb-0 small">
                            {order.items.map((it) => (
                              <li key={it.id}>{it.quantity} x {it.menu_item_name} — ₨{it.subtotal}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="text-muted text-center py-4">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {receiptOrder && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 30 }}
        >
          <div className="bg-white rounded p-4" style={{ maxWidth: 380, width: '90%' }}>
            <h2 className="h5 mb-1">Receipt — Order #{receiptOrder.id}</h2>
            <p className="small text-muted mb-3">{tableLabel(receiptOrder)} · {new Date(receiptOrder.created_at).toLocaleString()}</p>
            <ul className="list-group mb-3">
              {receiptOrder.items.map((it) => (
                <li key={it.id} className="list-group-item d-flex justify-content-between small">
                  <span>{it.quantity} x {it.menu_item_name}</span>
                  <span>₨{it.subtotal}</span>
                </li>
              ))}
              <li className="list-group-item d-flex justify-content-between fw-semibold small">
                <span>Total</span><span>₨{receiptOrder.total}</span>
              </li>
            </ul>
            <p className="small text-muted mb-3">Paid via {receiptOrder.payment_method}.</p>
            <div className="d-flex gap-2">
              <button className="btn btn-ember flex-grow-1" onClick={() => window.print()}>Print</button>
              <button className="btn btn-outline-secondary" onClick={() => setReceiptOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
