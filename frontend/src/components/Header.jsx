import { useState, useEffect, useRef } from 'react';
import { Navbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaUser, FaBell, FaEnvelope, FaBoxOpen } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useLogoutMutation } from '../slices/usersApiSlice';
import { logout } from '../slices/authSlice';
import SearchBox from './SearchBox';
import logo from '../assets/logo.png';
import { resetCart } from '../slices/cartSlice';
import {
  useGetUnreadCountQuery,
  useGetMyRequestsQuery,
} from '../slices/productsApiSlice';

const THEMES = [
  { id: 'black-gold',    label: '🖤 Black & Gold',    dot: '#d4af37', bg: '#0a0a0a' },
  { id: 'blue-silver',   label: '🔵 Blue & Silver',   dot: '#a0b4d6', bg: '#0b0f1a' },
  { id: 'red-black',     label: '🔴 Red & Black',     dot: '#e03030', bg: '#0a0000' },
  { id: 'emerald-black', label: '🟢 Emerald & Black', dot: '#2ecc71', bg: '#010a05' },
];

// ===== THEME DROPDOWN COMPONENT =====
const ThemeDropdown = ({ currentTheme, setCurrentTheme }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          background: 'transparent',
          border: '1px solid var(--accent)',
          borderRadius: '6px',
          padding: '4px 10px',
          cursor: 'pointer',
          color: 'var(--accent)',
          fontWeight: '600',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          whiteSpace: 'nowrap',
        }}
      >
        🎨 Theme
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '110%',
          right: 0,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--accent-dark)',
          borderRadius: '10px',
          padding: '10px',
          zIndex: 9999,
          minWidth: '190px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}>
          <p style={{
            color: 'var(--accent)',
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '8px',
            paddingLeft: '6px',
          }}>
            Select Theme
          </p>

          {THEMES.map((theme) => {
            const isActive = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => { setCurrentTheme(theme.id); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--accent-dark)' : 'transparent',
                  color: isActive ? 'var(--btn-text)' : 'var(--text-main)',
                  fontWeight: isActive ? '700' : '400',
                  fontSize: '13px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--border)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.bg} 50%, ${theme.dot} 50%)`,
                  border: '1px solid #666',
                  flexShrink: 0,
                }} />
                {theme.label}
                {isActive && (
                  <span style={{ marginLeft: 'auto', fontSize: '11px' }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ===== MAIN HEADER =====
const Header = () => {
  const { cartItems } = useSelector((state) => state.cart);
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApiCall] = useLogoutMutation();

  const [currentTheme, setCurrentTheme] = useState(
    () => localStorage.getItem('cellcom-theme') || 'black-gold'
  );

  useEffect(() => {
    if (currentTheme === 'black-gold') {
      document.body.removeAttribute('data-theme');
    } else {
      document.body.setAttribute('data-theme', currentTheme);
    }
    localStorage.setItem('cellcom-theme', currentTheme);
  }, [currentTheme]);

  const { data: unreadData } = useGetUnreadCountQuery(
    undefined,
    { skip: !userInfo?.isAdmin, pollingInterval: 30000 }
  );
  const unreadCount = unreadData?.count || 0;

  const { data: myRequests } = useGetMyRequestsQuery(
    undefined,
    { skip: !userInfo || userInfo?.isAdmin, pollingInterval: 30000 }
  );
  const newRepliesCount = myRequests?.filter((r) => r.hasNewReply).length || 0;

  const logoutHandler = async () => {
    try {
      await logoutApiCall().unwrap();
      dispatch(logout());
      dispatch(resetCart());
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header>
      <Navbar expand='lg' collapseOnSelect style={{
        backgroundColor: 'var(--navbar-bg)',
        borderBottom: '2px solid var(--accent)',
      }}>
        <Container>
          <Navbar.Brand as={Link} to='/'>
            <img src={logo} alt='logo' style={{ height: '30px', marginRight: '10px' }} />
            <span style={{ color: 'var(--accent)', fontWeight: '800' }}>CELL</span>
            <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>COM</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls='basic-navbar-nav' />

          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='ms-auto align-items-center' style={{ gap: '6px' }}>
              <SearchBox />

              {/* CART */}
              {userInfo && !userInfo.isAdmin && (
                <Nav.Link as={Link} to='/cart'>
                  <FaShoppingCart /> Cart
                  {cartItems.length > 0 && (
                    <Badge pill bg='primary' style={{ marginLeft: '5px' }}>
                      {cartItems.reduce((a, c) => a + c.qty, 0)}
                    </Badge>
                  )}
                </Nav.Link>
              )}

              {/* USER BELL */}
              {userInfo && !userInfo.isAdmin && (
                <Nav.Link as={Link} to='/my-requests' style={{ position: 'relative' }}>
                  <FaBell style={{ fontSize: '18px', color: newRepliesCount > 0 ? '#ff6b35' : 'var(--text-muted)' }} />
                  {newRepliesCount > 0 && (
                    <Badge pill bg='danger' style={{ position: 'absolute', top: '2px', right: '0px', fontSize: '10px', minWidth: '16px' }}>
                      {newRepliesCount}
                    </Badge>
                  )}
                </Nav.Link>
              )}

              {/* ===== NOT LOGGED IN ===== */}
              {!userInfo && (
                <>
                  <Nav.Link as={Link} to='/login'>
                    <FaUser /> Sign In
                  </Nav.Link>
                  <ThemeDropdown currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />
                </>
              )}

              {/* ===== LOGGED IN USER (not admin) ===== */}
              {userInfo && !userInfo.isAdmin && (
                <>
                  <NavDropdown title={userInfo.name} id='username'>
                    <NavDropdown.Item as={Link} to='/profile'>
                      Profile
                    </NavDropdown.Item>

                    {/* MY ORDERS — bag-o, tapad sa My Requests */}
                    <NavDropdown.Item as={Link} to='/myorders'>
                      <FaBoxOpen style={{ marginRight: '6px' }} />
                      My Orders
                    </NavDropdown.Item>

                    <NavDropdown.Item as={Link} to='/my-requests'>
                      <FaEnvelope style={{ marginRight: '6px' }} />
                      My Requests
                      {newRepliesCount > 0 && (
                        <Badge pill bg='success' style={{ marginLeft: '8px' }}>
                          {newRepliesCount} new
                        </Badge>
                      )}
                    </NavDropdown.Item>

                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={logoutHandler}>Logout</NavDropdown.Item>
                  </NavDropdown>

                  <ThemeDropdown currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />
                </>
              )}

              {/* ===== ADMIN ===== */}
              {userInfo && userInfo.isAdmin && (
                <>
                  <Nav.Link as={Link} to='/admin/requests' style={{ position: 'relative' }}>
                    <FaBell style={{ fontSize: '18px', color: unreadCount > 0 ? '#ff6b35' : 'var(--text-muted)' }} />
                    {unreadCount > 0 && (
                      <Badge pill bg='danger' style={{ position: 'absolute', top: '2px', right: '0px', fontSize: '10px', minWidth: '16px' }}>
                        {unreadCount}
                      </Badge>
                    )}
                  </Nav.Link>

                  <NavDropdown title={userInfo.name} id='username'>
                    <NavDropdown.Item as={Link} to='/profile'>Profile</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={logoutHandler}>Logout</NavDropdown.Item>
                  </NavDropdown>

                  <NavDropdown title='Edit' id='adminmenu'>
                    <NavDropdown.Item as={Link} to='/admin/productlist'>Products</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to='/admin/orderlist'>Orders</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to='/admin/userlist'>Users</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to='/admin/requests'>
                      🔔 Requests
                      {unreadCount > 0 && (
                        <Badge pill bg='danger' style={{ marginLeft: '8px' }}>{unreadCount}</Badge>
                      )}
                    </NavDropdown.Item>
                  </NavDropdown>

                  <ThemeDropdown currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />
                </>
              )}

            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;