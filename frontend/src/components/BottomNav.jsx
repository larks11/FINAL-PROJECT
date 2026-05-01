import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaHome, FaShoppingCart, FaBell, FaUser } from 'react-icons/fa';

const BottomNav = () => {
  const location = useLocation();
  const { userInfo } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  if (!userInfo || userInfo.isAdmin) return null;

  const totalQty = cartItems.reduce((a, c) => a + c.qty, 0);
  const path = location.pathname;

  const tabs = [
    { to: '/', icon: <FaHome size={20} />, label: 'Home', active: path === '/' },
    {
      to: '/cart', icon: (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <FaShoppingCart size={20} />
          {totalQty > 0 && (
            <span style={{
              position: 'absolute', top: '-8px', right: '-8px',
              backgroundColor: '#e74c3c', color: '#fff',
              borderRadius: '50%', width: '16px', height: '16px',
              fontSize: '10px', fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{totalQty}</span>
          )}
        </div>
      ),
      label: 'Cart', active: path === '/cart',
    },
    { to: '/my-requests', icon: <FaBell size={20} />, label: 'Notifications', active: path === '/my-requests' },
    { to: '/profile', icon: <FaUser size={20} />, label: 'Me', active: path === '/profile' },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      backgroundColor: 'var(--navbar-bg)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 1000,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
    }}>
      {tabs.map((tab, i) => (
        <Link
          key={i}
          to={tab.to}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 0 8px',
            color: tab.active ? 'var(--accent)' : 'var(--text-muted)',
            textDecoration: 'none',
            transition: 'color 0.2s',
            gap: '3px',
          }}
        >
          {tab.icon}
          <span style={{
            fontSize: '10px',
            fontWeight: tab.active ? '700' : '400',
            letterSpacing: '0.3px',
          }}>
            {tab.label}
          </span>
          {tab.active && (
            <div style={{
              width: '4px', height: '4px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              marginTop: '1px',
            }} />
          )}
        </Link>
      ))}
    </div>
  );
};

export default BottomNav;