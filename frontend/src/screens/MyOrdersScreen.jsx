import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaBoxOpen } from 'react-icons/fa';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { useGetMyOrdersQuery } from '../slices/ordersApiSlice';

const formatPeso = (amount) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const getOrderSeed = (orderId) =>
  orderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

// ✅ Check kung nag-move na ba ang tracking (past Step 0)
const hasOrderMoved = (order) => {
  const created = new Date(order.createdAt);
  const seed = getOrderSeed(order._id);
  const r = (i) => seededRandom(seed + i);
  const pickupOffset = 1 + r(1) * 2;
  const pickupTime = new Date(created.getTime() + pickupOffset * 60 * 60 * 1000);
  return new Date() >= pickupTime;
};

// ✅ Tab logic
// - cancelled → Cancelled
// - isDelivered → Completed
// - nag-move na ang tracking → To Receive
// - wala pa mo-move → To Ship
const getTab = (order) => {
  if (order.isCancelled) return 'cancelled';
  if (order.isDelivered) return 'completed';
  if (hasOrderMoved(order)) return 'toreceive';
  return 'toship';
};

// ✅ Walay To Pay tab — tangtangon
const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'toship',    label: 'To Ship' },
  { key: 'toreceive', label: 'To Receive' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const MyOrdersScreen = () => {
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = (orders || []).filter((o) => {
    const matchTab = activeTab === 'all' || getTab(o) === activeTab;
    const matchSearch = o._id.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const countFor = (key) =>
    key === 'all'
      ? (orders || []).length
      : (orders || []).filter((o) => getTab(o) === key).length;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <FaBoxOpen style={{ fontSize: '28px', color: 'var(--accent)' }} />
        <h1 style={{ color: 'var(--accent)', margin: 0 }}>My Purchase</h1>
      </div>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>

          {/* TABS */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
            {TABS.map((tab) => {
              const count = countFor(tab.key);
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: '1', minWidth: '100px', padding: '14px 10px',
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: isActive ? '700' : '400',
                    fontSize: '13px', cursor: 'pointer',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                  {count > 0 && (
                    <span style={{
                      marginLeft: '5px',
                      backgroundColor: isActive ? 'var(--accent)' : '#adb5bd',
                      color: '#fff', borderRadius: '10px',
                      padding: '1px 6px', fontSize: '11px', fontWeight: '700',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* SEARCH */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <input
              type='text'
              placeholder='🔍 Search by Order ID...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 14px', borderRadius: '20px',
                border: '1px solid var(--border)', backgroundColor: 'var(--bg)',
                color: 'var(--text-main)', fontSize: '13px', outline: 'none',
              }}
            />
          </div>

          {/* ORDER LIST */}
          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FaBoxOpen style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ margin: 0 }}>No orders found.</p>
              <Link to='/' style={{ color: 'var(--accent)', fontSize: '13px' }}>Start Shopping →</Link>
            </div>
          ) : (
            filtered.map((order) => {
              const tab = getTab(order);
              return (
                <div key={order._id} style={{ borderBottom: '1px solid var(--border)', padding: '16px' }}>

                  {/* ORDER HEADER */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Order ID: <strong style={{ color: 'var(--text-main)' }}>
                        {order._id.slice(-8).toUpperCase()}
                      </strong>
                    </span>

                    {/* STATUS BADGE */}
                    {tab === 'cancelled' && (
                      <span style={{ backgroundColor: '#e74c3c22', color: '#e74c3c', padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                        ❌ Cancelled
                      </span>
                    )}
                    {tab === 'completed' && (
                      <span style={{ backgroundColor: '#2ecc7122', color: '#2ecc71', padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                        ✅ Completed
                      </span>
                    )}
                    {tab === 'toreceive' && (
                      <span style={{ backgroundColor: 'rgba(212,175,55,0.15)', color: 'var(--accent)', padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                        🚚 To Receive
                      </span>
                    )}
                    {tab === 'toship' && (
                      <span style={{ backgroundColor: '#3498db22', color: '#3498db', padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                        📦 To Ship
                      </span>
                    )}
                  </div>

                  {/* ORDER ITEMS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {order.orderItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={item.image} alt={item.name}
                          style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </p>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>x{item.qty}</p>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                          {formatPeso(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* FOOTER */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {order.createdAt.substring(0, 10)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Order Total:{' '}
                        <strong style={{ color: 'var(--accent)', fontSize: '15px' }}>
                          {formatPeso(order.totalPrice)}
                        </strong>
                      </span>
                      <Link to={`/order/${order._id}`}>
                        <button style={{
                          backgroundColor: 'var(--accent)', color: 'var(--btn-text)',
                          border: 'none', borderRadius: '6px', padding: '6px 16px',
                          fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '5px',
                        }}>
                          <FaEye /> View Order
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrdersScreen;