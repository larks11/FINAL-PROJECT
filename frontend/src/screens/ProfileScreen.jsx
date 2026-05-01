import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaCheckCircle } from 'react-icons/fa';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { useProfileMutation } from '../slices/usersApiSlice';
import { useGetMyOrdersQuery } from '../slices/ordersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { Link } from 'react-router-dom';

const ProfileScreen = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { userInfo } = useSelector((state) => state.auth);
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();
  const [updateProfile, { isLoading: loadingUpdate }] = useProfileMutation();
  const dispatch = useDispatch();

  useEffect(() => {
    setName(userInfo.name);
    setEmail(userInfo.email);
  }, [userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      const res = await updateProfile({
        name, email,
        oldPassword: oldPassword || undefined,
        password: password || undefined,
      }).unwrap();
      dispatch(setCredentials({ ...res }));
      toast.success('Profile updated successfully');
      setOldPassword(''); setPassword(''); setConfirmPassword('');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const getOrderStatus = (order) => {
    if (order.isCancelled) return { label: 'Cancelled', color: '#e74c3c', bg: '#e74c3c22' };
    if (order.isDelivered) return { label: 'Delivered', color: '#2ecc71', bg: '#2ecc7122' };
    if (order.isPaid) return { label: 'Processing', color: '#3498db', bg: '#3498db22' };
    return { label: 'Pending', color: '#e67e22', bg: '#e67e2222' };
  };

  const SIDEBAR = [
    { key: 'profile', icon: <FaUser />, label: 'My Profile' },
    { key: 'password', icon: <FaLock />, label: 'Change Password' },
  ];

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-soft)',
    color: 'var(--text-main)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px 0 80px' }}>
      <h2 style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '22px', marginBottom: '20px', letterSpacing: '1px' }}>
        My Account
      </h2>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        {/* SIDEBAR */}
        <div style={{
          flex: '0 0 200px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          alignSelf: 'flex-start',
        }}>
          <div style={{ padding: '24px 16px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: '64px', height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px',
              fontSize: '24px', fontWeight: '800',
              color: '#000000',
            }}>
              {userInfo.name.charAt(0).toUpperCase()}
            </div>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{userInfo.name}</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{userInfo.email}</p>
          </div>

          {SIDEBAR.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              style={{
                width: '100%',
                padding: '13px 18px',
                display: 'flex', alignItems: 'center', gap: '10px',
                border: 'none',
                borderLeft: activeSection === item.key ? '3px solid var(--accent)' : '3px solid transparent',
                backgroundColor: activeSection === item.key ? 'rgba(212,175,55,0.08)' : 'transparent',
                color: activeSection === item.key ? 'var(--accent)' : 'var(--text-main)',
                fontWeight: activeSection === item.key ? '700' : '400',
                fontSize: '14px', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '24px' }}>

            {activeSection === 'profile' && (
              <>
                <h3 style={{ color: 'var(--accent)', fontWeight: '700', marginBottom: '6px', fontSize: '18px' }}>My Profile</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>Manage and update your personal information.</p>
                <form onSubmit={submitHandler}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input type='text' value={name} onChange={(e) => setName(e.target.value)} style={inputStyle}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <button type='submit' style={{
                        backgroundColor: 'var(--accent)', color: '#000000', border: 'none',
                        borderRadius: '8px', padding: '10px 28px', fontWeight: '700', fontSize: '14px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        <FaCheckCircle /> Save Changes
                      </button>
                      {loadingUpdate && <Loader />}
                    </div>
                  </div>
                </form>
              </>
            )}

            {activeSection === 'password' && (
              <>
                <h3 style={{ color: 'var(--accent)', fontWeight: '700', marginBottom: '6px', fontSize: '18px' }}>Change Password</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>Keep your account secure by updating your password regularly.</p>
                <form onSubmit={submitHandler}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { label: 'Current Password', val: oldPassword, set: setOldPassword, ph: 'Enter current password' },
                      { label: 'New Password', val: password, set: setPassword, ph: 'Enter new password' },
                      { label: 'Confirm New Password', val: confirmPassword, set: setConfirmPassword, ph: 'Confirm new password' },
                    ].map((field, i) => (
                      <div key={i}>
                        <label style={labelStyle}>{field.label}</label>
                        <input type='password' value={field.val} onChange={(e) => field.set(e.target.value)}
                          placeholder={field.ph} style={inputStyle}
                          onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
                      </div>
                    ))}
                    <div>
                      <button type='submit' style={{
                        backgroundColor: 'var(--accent)', color: '#000000', border: 'none',
                        borderRadius: '8px', padding: '10px 28px', fontWeight: '700', fontSize: '14px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      }}>
                        <FaLock /> Update Password
                      </button>
                      {loadingUpdate && <Loader />}
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* RECENT ORDERS */}
          <div style={{ marginTop: '20px', backgroundColor: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px', borderBottom: '2px solid var(--accent)',
              backgroundColor: 'var(--bg-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h4 style={{ margin: 0, color: 'var(--accent)', fontWeight: '800', fontSize: '15px', letterSpacing: '1px' }}>RECENT ORDERS</h4>
              <Link to='/myorders' style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: '600' }}>View All →</Link>
            </div>

            {isLoading ? <Loader /> : error ? (
              <Message variant='danger'>{error?.data?.message}</Message>
            ) : (
              <div>
                {orders.slice(0, 5).map((order) => {
                  const status = getOrderStatus(order);
                  return (
                    <div key={order._id} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 20px', borderBottom: '1px solid var(--border)', transition: 'background 0.2s',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-soft)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {order.orderItems[0] && (
                        <img src={order.orderItems[0].image} alt=''
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                          {order.createdAt.substring(0, 10)} · {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: '700', color: 'var(--accent)', fontSize: '14px' }}>
                          ₱{Number(order.totalPrice).toLocaleString('en-PH')}
                        </p>
                        <span style={{
                          fontSize: '11px', fontWeight: '700',
                          color: status.color, backgroundColor: status.bg,
                          padding: '2px 8px', borderRadius: '10px',
                        }}>
                          {status.label}
                        </span>
                      </div>
                      {/* ✅ FIXED: #000 para klaro ang View text sa gold button */}
                      <Link to={`/order/${order._id}`} className='view-btn' style={{
                        backgroundColor: 'var(--accent)',
                        color: '#000000',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}>
                        View
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;