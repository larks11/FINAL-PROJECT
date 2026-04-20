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

  // Total qty of all items
  const totalQty = cart.cartItems.reduce((acc, item) => acc + item.qty, 0);

  // Shipping fee = 1% of itemsPrice per qty
  const shippingFee = Number((cart.itemsPrice * 0.01 * totalQty).toFixed(2));
  const totalPrice  = Number((Number(cart.itemsPrice) + shippingFee).toFixed(2));

  const placeOrderHandler = async () => {
    try {
      const res = await createOrder({
        orderItems:      cart.cartItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod:   cart.paymentMethod,
        itemsPrice:      cart.itemsPrice,
        shippingPrice:   shippingFee,
        taxPrice:        0,
        totalPrice:      totalPrice,
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

            {/* SHIPPING */}
            <ListGroup.Item>
              <h2>📦 Shipping</h2>
              <p>
                <strong>Address: </strong>
                {cart.shippingAddress.address},{' '}
                {cart.shippingAddress.city},{' '}
                {cart.shippingAddress.postalCode},{' '}
                {cart.shippingAddress.country}
              </p>
            </ListGroup.Item>

            {/* ORDER ITEMS */}
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

        {/* ORDER SUMMARY */}
        <Col md={4}>
          <Card>
            <ListGroup variant='flush'>
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>

              {/* PAYMENT METHOD */}
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

              {/* ITEMS */}
              <ListGroup.Item>
                <Row>
                  <Col>Items ({totalQty} pcs)</Col>
                  <Col>{formatPeso(cart.itemsPrice)}</Col>
                </Row>
              </ListGroup.Item>

              {/* SHIPPING FEE 1% x qty */}
              <ListGroup.Item style={{
                backgroundColor: 'rgba(212,175,55,0.08)',
                border: '1px solid var(--accent-dark)',
                borderRadius: '6px',
              }}>
                <Row>
                  <Col>
                    <strong>Shipping Fee 🚚</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      1% × {totalQty} item{totalQty > 1 ? 's' : ''}
                    </div>
                  </Col>
                  <Col>
                    <strong style={{ color: 'var(--accent)' }}>
                      {formatPeso(shippingFee)}
                    </strong>
                  </Col>
                </Row>
              </ListGroup.Item>

              {/* TOTAL */}
              <ListGroup.Item>
                <Row>
                  <Col><strong>Total</strong></Col>
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