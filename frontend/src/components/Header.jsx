
import { Navbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaUser, FaBell } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useLogoutMutation } from '../slices/usersApiSlice';
import { logout } from '../slices/authSlice';
import SearchBox from './SearchBox';
import logo from '../assets/logo.png';
import { resetCart } from '../slices/cartSlice';
import { useGetUnreadCountQuery } from '../slices/productsApiSlice';

const Header = () => {
  const { cartItems } = useSelector((state) => state.cart);
  const { userInfo } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logoutApiCall] = useLogoutMutation();

  // Fetch unread count — only if admin
 const { data: unreadData } = useGetUnreadCountQuery(
    undefined,
    { skip: !userInfo?.isAdmin, pollingInterval: 30000 }
  );

  const unreadCount = unreadData?.count || 0;

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
      <Navbar bg='light' expand='lg' collapseOnSelect>
        <Container>
          <Navbar.Brand as={Link} to='/'>
            <img src={logo} alt='logo'
              style={{ height: '30px', marginRight: '10px' }} />
            <span className='cell'>CELL</span>
            <span className='com'>COM</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls='basic-navbar-nav' />

          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='ms-auto'>
              <SearchBox />

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

              {userInfo ? (
                <NavDropdown title={userInfo.name} id='username'>
                  <NavDropdown.Item as={Link} to='/profile'>
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item onClick={logoutHandler}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link as={Link} to='/login'>
                  <FaUser /> Sign In
                </Nav.Link>
              )}

              {userInfo && userInfo.isAdmin && (
                <>
                  {/* NOTIFICATION BELL */}
                  <Nav.Link as={Link} to='/admin/requests'
                    style={{ position: 'relative', marginRight: '8px' }}>
                    <FaBell style={{ fontSize: '18px', color: unreadCount > 0 ? '#ff6b35' : '#555' }} />
                    {unreadCount > 0 && (
                      <Badge
                        pill bg='danger'
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '0px',
                          fontSize: '10px',
                          minWidth: '16px',
                        }}
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Nav.Link>

                  <NavDropdown title='Edit' id='adminmenu'>
                    <NavDropdown.Item as={Link} to='/admin/productlist'>
                      Products
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to='/admin/orderlist'>
                      Orders
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to='/admin/userlist'>
                      Users
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to='/admin/requests'>
                      🔔 Requests
                      {unreadCount > 0 && (
                        <Badge pill bg='danger' style={{ marginLeft: '8px' }}>
                          {unreadCount}
                        </Badge>
                      )}
                    </NavDropdown.Item>
                  </NavDropdown>
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