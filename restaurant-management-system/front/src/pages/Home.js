import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Home() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories/').then((res) => setCategories(res.data.results || res.data));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="row">
            <div className="col-lg-7">
              <div className="eyebrow mb-2">Slow-cooked, honestly priced</div>
              <h1 className="display-font mb-4">
                Food that tastes like<br />someone actually cooked it.
              </h1>
              <p className="mb-4" style={{ maxWidth: 480, opacity: 0.9 }}>
                Seasonal ingredients, wood-fired mains, and a menu that changes
                with what's good this week — browse today's dishes and place
                your order.
              </p>
              <div className="d-flex gap-3">
                <Link to="/menu" className="btn btn-ember px-4 py-2">View Menu</Link>
                <Link to="/admin/login" className="btn btn-outline-cream px-4 py-2">Staff Login</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <h2 className="display-font mb-4 h3">Categories</h2>
        <div className="row g-3">
          {categories.length === 0 && (
            <p className="text-muted">No categories yet — add some from the admin panel.</p>
          )}
          {categories.map((cat) => (
            <div className="col-6 col-md-3" key={cat.id}>
              <Link to="/menu" className="text-decoration-none">
                <div className="menu-card p-3 h-100 text-center">
                  <div className="fw-semibold" style={{ color: 'var(--forest)' }}>{cat.name}</div>
                  <div className="small text-muted">{cat.item_count} items</div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
