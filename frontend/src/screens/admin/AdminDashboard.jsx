import { useGetOrdersQuery } from '../../slices/ordersApiSlice';
import { useGetUsersQuery } from '../../slices/usersApiSlice';
import { useGetAdminProductsQuery } from '../../slices/productsApiSlice';
import { Link } from 'react-router-dom';
import Loader from '../../components/Loader';

const AdminDashboard = () => {
  const { data: ordersData, isLoading: loadingOrders } = useGetOrdersQuery();
  const { data: usersData, isLoading: loadingUsers } = useGetUsersQuery();
  const { data: productsData, isLoading: loadingProducts } = useGetAdminProductsQuery({});

  const orders   = ordersData   || [];
  const users    = usersData    || [];
  const products = productsData?.products || [];

  const totalRevenue = orders
  .filter((o) => !o.isCancelled)
  .reduce((acc, o) => acc + (Number(o.totalPrice) || 0), 0);
  const pendingOrders   = orders.filter((o) => !o.isCancelled && !o.isDelivered).length;
  const deliveredOrders = orders.filter((o) => o.isDelivered).length;
  const cancelledOrders = orders.filter((o) => o.isCancelled).length;
  const soldOutProducts = products.filter((p) => p.countInStock === 0).length;
  const lowStockProducts = products.filter((p) => p.countInStock > 0 && p.countInStock <= 5).length;
  const activeProducts  = products.filter((p) => !p.isArchived && p.countInStock > 0).length;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const statusColor = {
    'Order Created':    '#6c757d',
    'Preparing':        '#f39c12',
    'Picked Up':        '#3498db',
    'In Transit':       '#9b59b6',
    'Out for Delivery': '#1abc9c',
    'Delivered':        '#2ecc71',
    'Cancelled':        '#e74c3c',
  };

  if (loadingOrders || loadingUsers || loadingProducts) return <Loader />;

  const StatCard = ({ title, value, sub, color, icon, to }) => (
    <Link to={to || '#'} style={{ textDecoration: 'none', flex: '1 1 200px' }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        borderTop: `4px solid ${color}`,
        borderRadius: '14px',
        padding: '20px 22px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
        <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>{title}</div>
        {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
      </div>
    </Link>
  );

  return (
    <div style={{ padding: '8px 0' }}>

      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '26px', margin: 0 }}>
          📊 Admin Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Welcome back! Here's your store overview.
        </p>
      </div>

      {/* REVENUE BANNER */}
      <div style={{
        backgroundColor: 'var(--accent)',
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <p style={{ color: 'var(--btn-text)', opacity: 0.85, fontSize: '13px', margin: 0, fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Total Revenue
          </p>
          <h2 style={{ color: 'var(--btn-text)', fontWeight: '900', fontSize: '36px', margin: '4px 0 0' }}>
            ₱{totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </h2>
          <p style={{ color: 'var(--btn-text)', opacity: 0.75, fontSize: '13px', margin: '4px 0 0' }}>
            From {orders.filter((o) => !o.isCancelled).length} completed orders
          </p>
        </div>
        <div style={{ fontSize: '64px', opacity: 0.3 }}>💰</div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <StatCard title='Total Orders'    value={orders.length}     icon='🛒' color='#3498db' to='/admin/orderlist' />
        <StatCard title='Pending Orders'  value={pendingOrders}     icon='⏳' color='#f39c12' to='/admin/orderlist' sub='Not yet delivered' />
        <StatCard title='Delivered'       value={deliveredOrders}   icon='✅' color='#2ecc71' to='/admin/orderlist' />
        <StatCard title='Cancelled'       value={cancelledOrders}   icon='❌' color='#e74c3c' to='/admin/orderlist' />
        <StatCard title='Total Users'     value={users.length}      icon='👥' color='#9b59b6' to='/admin/userlist' />
        <StatCard title='Total Products'  value={products.length}   icon='📦' color='var(--accent)' to='/admin/productlist' sub={`${activeProducts} active`} />
        <StatCard title='Low Stock'       value={lowStockProducts}  icon='⚠️' color='#e67e22' to='/admin/productlist' sub='5 or less remaining' />
        <StatCard title='Sold Out'        value={soldOutProducts}   icon='🚫' color='#e74c3c' to='/admin/productlist' />
      </div>

      {/* RECENT ORDERS */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '28px',
      }}>
        <div style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-soft)',
          borderBottom: '2px solid var(--accent)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--accent)' }}>
            🕒 Recent Orders
          </h3>
          <Link to='/admin/orderlist' style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600', textDecoration: 'none' }}>
            View All →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-soft)' }}>
                {['#', 'Customer', 'Date', 'Total', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => (
                <tr key={order._id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-soft)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>{i + 1}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-main)', fontWeight: '600' }}>
                    {order.user?.name || 'Unknown'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {order.createdAt?.substring(0, 10)}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent)', fontWeight: '700' }}>
                    ₱{Number(order.totalPrice).toLocaleString('en-PH')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      backgroundColor: statusColor[order.isCancelled ? 'Cancelled' : order.orderStatus] || '#6c757d',
                      color: '#fff',
                      borderRadius: '20px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: '700',
                    }}>
                      {order.isCancelled ? 'Cancelled' : order.orderStatus || 'Order Created'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link to={`/order/${order._id}`} style={{
                      backgroundColor: 'transparent',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent)',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK LINKS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {[
          { label: '➕ Create Product', to: '/admin/productlist' },
          { label: '📋 Manage Orders',  to: '/admin/orderlist' },
          { label: '👥 Manage Users',   to: '/admin/userlist' },
        ].map((btn) => (
          <Link key={btn.to} to={btn.to} style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--btn-text)',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 24px',
            fontWeight: '700',
            fontSize: '14px',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {btn.label}
          </Link>
        ))}
      </div>

    </div>
  );
};

export default AdminDashboard;