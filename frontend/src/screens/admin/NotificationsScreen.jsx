import { useState } from 'react';
import { useGetOrdersQuery } from '../../slices/ordersApiSlice';
import { Link } from 'react-router-dom';
import Loader from '../../components/Loader';
import Message from '../../components/Message';

const NotificationsScreen = () => {
  const { data: orders, isLoading, error } = useGetOrdersQuery();
  const [filter, setFilter] = useState('all');

  const allOrders = [...(orders || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const notifications = allOrders.flatMap((order) => {
    const name = order.user?.name || 'Unknown';

    if (order.isCancelled) {
      return [{
        id: order._id + '_cancelled',
        orderId: order._id,
        type: 'cancelled',
        message: `${name} cancelled an order`,
        date: order.updatedAt || order.createdAt,
        color: '#e74c3c',
        icon: '❌',
      }];
    } else if (order.isDelivered) {
      return [{
        id: order._id + '_delivered',
        orderId: order._id,
        type: 'delivered',
        message: `Order delivered to ${name}`,
        date: order.deliveredAt || order.createdAt,
        color: '#2ecc71',
        icon: '✅',
      }];
    } else if (order.orderStatus === 'Out for Delivery') {
      return [{
        id: order._id + '_outfordelivery',
        orderId: order._id,
        type: 'outfordelivery',
        message: `Order is Out for Delivery for ${name}`,
        date: order.updatedAt || order.createdAt,
        color: '#1abc9c',
        icon: '🏍️',
      }];
    } else if (order.orderStatus === 'In Transit') {
      return [{
        id: order._id + '_transit',
        orderId: order._id,
        type: 'transit',
        message: `Order is In Transit for ${name}`,
        date: order.updatedAt || order.createdAt,
        color: '#9b59b6',
        icon: '🚚',
      }];
    } else if (order.orderStatus === 'Preparing') {
      return [{
        id: order._id + '_preparing',
        orderId: order._id,
        type: 'preparing',
        message: `Order is being prepared for ${name}`,
        date: order.updatedAt || order.createdAt,
        color: '#f39c12',
        icon: '📦',
      }];
    } else {
      return [{
        id: order._id + '_new',
        orderId: order._id,
        type: 'new',
        message: `New order placed by ${name}`,
        date: order.createdAt,
        color: '#3498db',
        icon: '🛒',
      }];
    }
  });

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: '🛒 New Orders', value: 'new' },
    { label: '📦 Preparing', value: 'preparing' },
    { label: '🚚 In Transit', value: 'transit' },
    { label: '🏍️ Out for Delivery', value: 'outfordelivery' },
    { label: '✅ Delivered', value: 'delivered' },
    { label: '❌ Cancelled', value: 'cancelled' },
  ];

  const filtered =
    filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '24px', margin: 0 }}>
          🔔 Notifications
        </h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {filterOptions.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              backgroundColor: filter === f.value ? 'var(--accent)' : 'var(--bg-soft)',
              color: filter === f.value ? 'var(--btn-text)' : 'var(--text-muted)',
              border: `1px solid ${filter === f.value ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '20px',
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '15px' }}>
          No notifications found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((notif) => (
            <div
              key={notif.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${notif.color}`,
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>{notif.icon}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-main)', fontSize: '14px' }}>
                    {notif.message}
                  </p>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                    {new Date(notif.date).toLocaleString('en-PH')}
                  </p>
                </div>
              </div>
              <Link
                to={`/order/${notif.orderId}`}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                View Order
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsScreen;