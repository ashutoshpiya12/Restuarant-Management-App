import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../api/axios';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats/').then((res) => setStats(res.data));
  }, []);

  const cards = [
    { label: 'Categories', value: stats?.total_categories },
    { label: 'Menu Items', value: stats?.total_menu_items },
    { label: 'Registered Users', value: stats?.total_users },
    { label: 'Total Orders', value: stats?.total_orders },
    { label: 'Pending Orders', value: stats?.pending_orders },
    { label: "Today's Orders", value: stats?.todays_orders },
    { label: "Today's Sales", value: stats ? `₨${stats.todays_sales}` : undefined },
    { label: 'Completed Orders', value: stats?.completed_orders },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="row g-3">
        {cards.map((card) => (
          <div className="col-6 col-md-4 col-lg-3" key={card.label}>
            <div className="stat-card">
              <div className="value">{card.value ?? '—'}</div>
              <div className="label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted small mt-4">
        Use the sidebar to manage food categories, menu items, and registered users.
      </p>
    </AdminLayout>
  );
}
