import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../api/axios';

export default function Reports() {
  const [dailySales, setDailySales] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/daily-sales/'),
      api.get('/orders/?status=completed'),
    ])
      .then(([salesRes, ordersRes]) => {
        setDailySales(salesRes.data);
        setOrders(ordersRes.data.results || ordersRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Reports">
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="table-panel p-3">
            <h2 className="h6 mb-3">Daily sales (paid orders)</h2>
            {loading && <p className="text-muted small">Loading…</p>}
            {!loading && dailySales.length === 0 && (
              <p className="text-muted small">No paid orders yet.</p>
            )}
            <table className="table table-sm mb-0">
              <thead>
                <tr><th>Day</th><th>Orders</th><th>Total sales</th></tr>
              </thead>
              <tbody>
                {dailySales.map((row) => (
                  <tr key={row.day}>
                    <td>{row.day}</td>
                    <td>{row.order_count}</td>
                    <td>₨{row.total_sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="table-panel p-3">
            <h2 className="h6 mb-3">Order history — completed orders</h2>
            {!loading && orders.length === 0 && (
              <p className="text-muted small">No completed orders yet.</p>
            )}
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Table</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.customer_name || o.guest_name || '—'}</td>
                    <td>{o.table_number ? `Table ${o.table_number}` : 'Takeaway'}</td>
                    <td>₨{o.total}</td>
                    <td>{o.payment_method} · {o.payment_status}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
