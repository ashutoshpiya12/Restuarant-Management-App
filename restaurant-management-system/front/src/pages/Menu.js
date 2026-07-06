import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const PAYMENT_STEP = { CART: 'cart', PAY: 'pay', PROCESSING: 'processing', FAILED: 'failed' };

export default function Menu() {
  const [searchParams] = useSearchParams();
  const qrTableId = searchParams.get('table'); // set when a customer scans a table's QR code

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Cart: { [menuItemId]: { item, quantity } }
  const [cart, setCart] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [step, setStep] = useState(PAYMENT_STEP.CART);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [tableId, setTableId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [placing, setPlacing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/categories/'),
      api.get('/menu-items/?available=true'),
      api.get('/tables/').catch(() => ({ data: [] })),
    ])
      .then(([catRes, itemRes, tableRes]) => {
        setCategories(catRes.data.results || catRes.data);
        setItems(itemRes.data.results || itemRes.data);
        setTables(tableRes.data.results || tableRes.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // If the customer arrived via a table's QR code, lock the table in.
  useEffect(() => {
    if (qrTableId) setTableId(qrTableId);
  }, [qrTableId]);

  const currentTable = tables.find((t) => String(t.id) === String(tableId));

  const visibleItems = activeCategory === 'all'
    ? items
    : items.filter((item) => item.category === activeCategory);

  const addToCart = (item) => {
    setCart((c) => {
      const existing = c[item.id];
      return {
        ...c,
        [item.id]: { item, quantity: existing ? existing.quantity + 1 : 1 },
      };
    });
  };

  const changeQty = (itemId, delta) => {
    setCart((c) => {
      const existing = c[itemId];
      if (!existing) return c;
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        const { [itemId]: _removed, ...rest } = c;
        return rest;
      }
      return { ...c, [itemId]: { ...existing, quantity: nextQty } };
    });
  };

  const cartLines = Object.values(cart);
  const cartCount = cartLines.reduce((sum, l) => sum + l.quantity, 0);
  const cartTotal = cartLines.reduce((sum, l) => sum + l.item.price * l.quantity, 0);

  const submitOrder = async (paymentStatus) => {
    const { data } = await api.post('/orders/', {
      table: tableId || null,
      guest_name: guestName,
      guest_phone: guestPhone,
      status: 'pending',
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      items: cartLines.map((l) => ({
        menu_item: l.item.id,
        quantity: l.quantity,
        price: l.item.price,
      })),
    });
    setConfirmedOrder(data);
    setCart({});
    setShowCheckout(false);
    setStep(PAYMENT_STEP.CART);
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    setError('');
    setStep(PAYMENT_STEP.PAY);
  };

  const chooseCash = async () => {
    setPlacing(true);
    try {
      // Cash is collected in person later — order goes in as "pending" payment.
      await submitOrder('pending');
    } catch (err) {
      setError('Could not place your order. Please try again.');
      setStep(PAYMENT_STEP.PAY);
    } finally {
      setPlacing(false);
    }
  };

  // Simulates a digital wallet / QR payment round-trip (no real payment
  // gateway is wired up in this demo — this stands in for Step 3.6.1).
  const simulateDigitalPayment = (didSucceed) => {
    setStep(PAYMENT_STEP.PROCESSING);
    setTimeout(async () => {
      if (!didSucceed) {
        setStep(PAYMENT_STEP.FAILED);
        return;
      }
      setPlacing(true);
      try {
        await submitOrder('paid');
      } catch (err) {
        setError('Payment succeeded but the order could not be saved. Please try again.');
        setStep(PAYMENT_STEP.PAY);
      } finally {
        setPlacing(false);
      }
    }, 1200);
  };

  if (confirmedOrder) {
    return (
      <div className="container py-5 text-center">
        <h1 className="display-font h2 mb-3">Order received!</h1>
        <p className="text-muted">
          Your order <strong>#{confirmedOrder.id}</strong> has been sent to the kitchen.
          {confirmedOrder.table_number
            ? ` Sit tight — someone will bring it to Table ${confirmedOrder.table_number} shortly.`
            : " We'll have it ready for pickup shortly."}
        </p>
        <p className="small text-muted">
          Payment: {confirmedOrder.payment_method === 'digital' ? 'Paid online' : 'Pay with cash when it arrives'}.
          Keep your order number and phone number handy to track its status.
        </p>
        <button className="btn btn-ember mt-3" onClick={() => setConfirmedOrder(null)}>
          Order something else
        </button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h1 className="display-font h2 mb-1">Today's Menu</h1>
      {currentTable ? (
        <p className="text-muted mb-4">
          Ordering for <strong>Table {currentTable.number}</strong> — add dishes below.
        </p>
      ) : (
        <p className="text-muted mb-4">Add dishes to your order, then check out below.</p>
      )}

      <div className="d-flex gap-2 flex-wrap mb-4">
        <button
          className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted">Loading menu…</p>}
      {!loading && visibleItems.length === 0 && (
        <p className="text-muted">No dishes in this category yet.</p>
      )}

      <div className="row g-4">
        {visibleItems.map((item) => {
          const inCart = cart[item.id];
          return (
            <div className="col-md-6 col-lg-4" key={item.id}>
              <div className="menu-card h-100 overflow-hidden">
                {item.image && (
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                )}
                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <h3 className="h6 fw-bold mb-1">{item.name}</h3>
                    {item.is_vegetarian && <span className="veg-dot" title="Vegetarian"></span>}
                  </div>
                  <p className="small text-muted mb-2">{item.description}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="price">₨ {item.price}</div>
                    {inCart ? (
                      <div className="d-flex align-items-center gap-2">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => changeQty(item.id, -1)}>−</button>
                        <span>{inCart.quantity}</span>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => changeQty(item.id, 1)}>+</button>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-ember" onClick={() => addToCart(item)}>Add</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && !showCheckout && (
        <div
          className="position-fixed bottom-0 start-0 end-0 d-flex justify-content-between align-items-center px-4 py-3"
          style={{ background: 'var(--forest)', color: 'var(--cream)', zIndex: 20 }}
        >
          <span>{cartCount} item{cartCount > 1 ? 's' : ''} · ₨{cartTotal.toFixed(2)}</span>
          <button className="btn btn-ember" onClick={() => setShowCheckout(true)}>Checkout</button>
        </div>
      )}

      {/* Checkout panel */}
      {showCheckout && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 30 }}
        >
          <div className="bg-white rounded p-4" style={{ maxWidth: 420, width: '90%' }}>

            {step === PAYMENT_STEP.CART && (
              <>
                <h2 className="h5 mb-3">Your order</h2>
                <ul className="list-group mb-3">
                  {cartLines.map((l) => (
                    <li key={l.item.id} className="list-group-item d-flex justify-content-between small">
                      <span>{l.quantity} x {l.item.name}</span>
                      <span>₨{(l.item.price * l.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                  <li className="list-group-item d-flex justify-content-between fw-semibold small">
                    <span>Total</span><span>₨{cartTotal.toFixed(2)}</span>
                  </li>
                </ul>

                {error && <div className="alert alert-danger py-2 small">{error}</div>}

                <form onSubmit={handleDetailsSubmit}>
                  <div className="mb-2">
                    <label className="form-label small">Your name</label>
                    <input className="form-control form-control-sm" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
                  </div>
                  <div className="mb-2">
                    <label className="form-label small">Phone</label>
                    <input className="form-control form-control-sm" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} required />
                    <div className="form-text">Used to track your order status later.</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small">Table</label>
                    {currentTable ? (
                      <input className="form-control form-control-sm" value={`Table ${currentTable.number}`} disabled />
                    ) : (
                      <select className="form-select form-select-sm" value={tableId} onChange={(e) => setTableId(e.target.value)}>
                        <option value="">Takeaway / no table</option>
                        {tables.map((t) => (
                          <option key={t.id} value={t.id}>Table {t.number}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-ember flex-grow-1" type="submit">Continue to payment</button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCheckout(false)}>Back</button>
                  </div>
                </form>
              </>
            )}

            {step === PAYMENT_STEP.PAY && (
              <>
                <h2 className="h5 mb-3">Payment method</h2>
                <p className="small text-muted mb-3">Total due: <strong>₨{cartTotal.toFixed(2)}</strong></p>
                {error && <div className="alert alert-danger py-2 small">{error}</div>}
                <div className="d-flex flex-column gap-2">
                  <button
                    className={`btn ${paymentMethod === 'cash' ? 'btn-ember' : 'btn-outline-secondary'}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    Cash — pay when it arrives
                  </button>
                  <button
                    className={`btn ${paymentMethod === 'digital' ? 'btn-ember' : 'btn-outline-secondary'}`}
                    onClick={() => setPaymentMethod('digital')}
                  >
                    Digital — QR / e-wallet
                  </button>
                </div>

                <div className="d-flex gap-2 mt-4">
                  {paymentMethod === 'cash' ? (
                    <button className="btn btn-ember flex-grow-1" disabled={placing} onClick={chooseCash}>
                      {placing ? 'Placing order…' : 'Confirm order'}
                    </button>
                  ) : (
                    <button className="btn btn-ember flex-grow-1" onClick={() => simulateDigitalPayment(true)}>
                      Pay ₨{cartTotal.toFixed(2)} now
                    </button>
                  )}
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(PAYMENT_STEP.CART)}>Back</button>
                </div>
                {paymentMethod === 'digital' && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-danger mt-2 p-0"
                    onClick={() => simulateDigitalPayment(false)}
                  >
                    Simulate a declined payment (demo)
                  </button>
                )}
              </>
            )}

            {step === PAYMENT_STEP.PROCESSING && (
              <div className="text-center py-4">
                <h2 className="h5 mb-2">Processing payment…</h2>
                <p className="text-muted small">Confirming with your wallet provider.</p>
              </div>
            )}

            {step === PAYMENT_STEP.FAILED && (
              <div className="text-center py-4">
                <h2 className="h5 mb-2 text-danger">Payment failed</h2>
                <p className="text-muted small mb-3">Your card or wallet declined the payment. No charge was made.</p>
                <div className="d-flex gap-2 justify-content-center">
                  <button className="btn btn-ember" onClick={() => setStep(PAYMENT_STEP.PAY)}>Try again</button>
                  <button className="btn btn-outline-secondary" onClick={() => { setPaymentMethod('cash'); setStep(PAYMENT_STEP.PAY); }}>
                    Pay with cash instead
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
