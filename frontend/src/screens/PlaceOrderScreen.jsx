import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button, Row, Col, ListGroup, Image, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Message from '../components/Message';
import CheckoutSteps from '../components/CheckoutSteps';
import Loader from '../components/Loader';
import { useCreateOrderMutation } from '../slices/ordersApiSlice';
import { clearCartItems } from '../slices/cartSlice';

const formatPeso = (amount) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const getShippingFee = (city = '') => {
  const location = city.toLowerCase();
  const visayas = ['cebu','mandaue','lapu-lapu','lapulapu','talisay','danao','toledo','bogo','iloilo','bacolod','dumaguete','tagbilaran','boracay','roxas','ormoc','tacloban','palo','tanauan','tolosa','dulag','abuyog','baybay','maasin','burauen','carigara','naval','catbalogan','calbayog','leyte','samar','bohol','negros','panay','visayas'];
  const mindanao = ['davao','cagayan','cdo','cagayan de oro','zamboanga','general santos','gensan','cotabato','butuan','iligan','surigao','pagadian','koronadal','tacurong','kidapawan','midsayap','mindanao'];
  if (visayas.some((k) => location.includes(k))) return 80;
  if (mindanao.some((k) => location.includes(k))) return 150;
  return 200;
};

const getRegionLabel = (city = '') => {
  const location = city.toLowerCase();
  const visayas = ['cebu','mandaue','lapu-lapu','lapulapu','talisay','danao','toledo','bogo','iloilo','bacolod','dumaguete','tagbilaran','boracay','roxas','ormoc','tacloban','palo','tanauan','tolosa','dulag','abuyog','baybay','maasin','burauen','carigara','naval','catbalogan','calbayog','leyte','samar','bohol','negros','panay','visayas'];
  const mindanao = ['davao','cagayan','cdo','cagayan de oro','zamboanga','general santos','gensan','cotabato','butuan','iligan','surigao','pagadian','koronadal','tacurong','kidapawan','midsayap','mindanao'];
  if (visayas.some((k) => location.includes(k))) return 'Within Visayas';
  if (mindanao.some((k) => location.includes(k))) return 'Visayas → Mindanao';
  return 'Visayas → Luzon';
};

const VAT_RATE = 12; // 12%

const PlaceOrderScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);

  const [createOrder, { isLoading, error }] = useCreateOrderMutation();

  useEffect(() => {
    if (!cart.shippingAddress.address) {
      navigate('/shipping');
    } else if (!cart.paymentMethod) {
      navigate('/payment');
    }
  }, [cart.paymentMethod, cart.shippingAddress.address, navigate]);

  const totalQty    = cart.cartItems.reduce((acc, item) => acc + item.qty, 0);
  const itemsPrice  = Number(cart.itemsPrice);
  const shippingFee = getShippingFee(cart.shippingAddress.city);
  const taxPrice    = Number(((VAT_RATE / 100) * itemsPrice).toFixed(2));
  const totalPrice  = Number((itemsPrice + shippingFee + taxPrice).toFixed(2));
  const regionLabel = getRegionLabel(cart.shippingAddress.city);

  const placeOrderHandler = async () => {
    try {
      const res = await createOrder({
        orderItems:      cart.cartItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod:   cart.paymentMethod,
        itemsPrice,
        shippingPrice:   shippingFee,
        taxPrice,
        totalPrice,
      }).unwrap();
      dispatch(clearCartItems());
      navigate(`/order/${res._id}`);
    } catch (err) {
      toast.error(err?.data?.message || err.message);
    }
  };

  return (
    <>
      <CheckoutSteps step1 step2 step3 step4 />

      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>

            <ListGroup.Item>
              <h2>📦 Shipping</h2>
              <p>
                <strong>Address: </strong>
                {cart.shippingAddress.address},{' '}
                {cart.shippingAddress.city},{' '}
                {cart.shippingAddress.postalCode},{' '}
                {cart.shippingAddress.country}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                🗺️ Delivery route: <strong>{regionLabel}</strong>
              </p>
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>🛒 Order Items</h2>
              {cart.cartItems.length === 0 ? (
                <Message>Your cart is empty</Message>
              ) : (
                <ListGroup variant='flush'>
                  {cart.cartItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row>
                        <Col md={1}>
                          <Image src={item.image} alt={item.name} fluid rounded />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`}>{item.name}</Link>
                        </Col>
                        <Col md={4}>
                          {item.qty} x {formatPeso(item.price)} ={' '}
                          {formatPeso(item.qty * item.price)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>

        <Col md={4}>
          <Card>
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>

              <ListGroup.Item style={{
                backgroundColor: 'rgba(212,175,55,0.06)',
                borderLeft: '3px solid var(--accent)',
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  Payment Method
                </p>
                <strong style={{ color: 'var(--accent)', fontSize: '15px' }}>
                  💳 {cart.paymentMethod}
                </strong>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>Item Cost ({totalQty} pcs)</Col>
                  <Col>{formatPeso(itemsPrice)}</Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item style={{
                backgroundColor: 'rgba(212,175,55,0.08)',
                border: '1px solid var(--accent-dark)',
                borderRadius: '6px',
              }}>
                <Row>
                  <Col>
                    <strong>Shipping Fee 🚚</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {regionLabel}
                    </div>
                  </Col>
                  <Col>
                    <strong style={{ color: 'var(--accent)' }}>
                      {formatPeso(shippingFee)}
                    </strong>
                  </Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>VAT ({VAT_RATE}%) 📊</Col>
                  <Col>{formatPeso(taxPrice)}</Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col><strong>Total Amount</strong></Col>
                  <Col>
                    <strong style={{ color: 'var(--accent)', fontSize: '16px' }}>
                      {formatPeso(totalPrice)}
                    </strong>
                  </Col>
                </Row>
              </ListGroup.Item>

              {error && (
                <ListGroup.Item>
                  <Message variant='danger'>{error?.data?.message}</Message>
                </ListGroup.Item>
              )}

              <ListGroup.Item>
                <Button
                  type='button'
                  className='btn-primary w-100'
                  disabled={cart.cartItems.length === 0}
                  onClick={placeOrderHandler}
                  style={{ fontWeight: '700', fontSize: '15px' }}
                >
                  ✅ Place Order
                </Button>
                {isLoading && <Loader />}
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PlaceOrderScreen;