import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Card, Button, Modal, Form } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import {
  useGetOrderDetailsQuery,
  useCancelOrderMutation,
} from '../slices/ordersApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const formatPeso = (amount) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const OrderScreen = () => {
  const { id: orderId } = useParams();
  const { userInfo } = useSelector((state) => state.auth);

  const { data: order, isLoading, error, refetch } = useGetOrderDetailsQuery(orderId);
  const [cancelOrder, { isLoading: loadingCancel }] = useCancelOrderMutation();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    try {
      await cancelOrder({ orderId, reason: cancelReason }).unwrap();
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const getDeliverySteps = (order) => {
    if (order.isCancelled) {
      return [
        { label: 'Order Created – Manila Warehouse', done: true, reached: true },
        { label: `Order Cancelled – ${new Date(order.cancelledAt).toLocaleDateString('en-PH')}`, done: true, cancelled: true },
      ];
    }
    const steps = [
      { label: 'Order Created – Manila Warehouse', done: true },
      { label: 'Picked Up – Parañaque Sorting Center', done: true },
      { label: 'Sorting – Cebu Logistics Hub', done: true },
      { label: 'Transport – Tacloban Distribution Hub', done: order.isPaid },
      { label: `Arrived – ${order.shippingAddress.city} Delivery Hub`, done: order.isPaid },
      { label: `Out for Delivery – ${order.shippingAddress.city}`, done: order.isDelivered },
      {
        label: `Delivered – ${order.shippingAddress.address}, ${order.shippingAddress.city}`,
        done: order.isDelivered,
        final: true,
      },
    ];

    // Find last reached step index
    let lastReached = -1;
    steps.forEach((s, i) => { if (s.done) lastReached = i; });

    return steps.map((s, i) => ({ ...s, current: i === lastReached && !s.final }));
  };

  const getStepStyle = (step) => {
    if (step.cancelled) return { color: '#e74c3c', fontWeight: 'bold' };
    if (step.final && step.done) return { color: '#2ecc71', fontWeight: 'bold' };
    if (step.current) return { color: 'var(--accent)', fontWeight: '700' };
    if (step.done) return { color: 'var(--text-muted)' };
    return { color: 'var(--border)', opacity: 0.5 };
  };

  const getStepIcon = (step) => {
    if (step.cancelled) return '❌';
    if (step.final && step.done) return '✅';
    if (step.current) return '📍';
    if (step.done) return '✔';
    return '⬜';
  };

  return isLoading ? (
    <Loader />
  ) : error ? (
    <Message variant='danger'>{error?.data?.message}</Message>
  ) : (
    <>
      <h1>Order Tracking</h1>

      {/* CANCELLED BANNER */}
      {order.isCancelled && (
        <Message variant='danger'>
          ❌ This order was cancelled on{' '}
          {new Date(order.cancelledAt).toLocaleDateString('en-PH')}.
          Reason: {order.cancelReason}
        </Message>
      )}

      {/* DELIVERY PROGRESS */}
      <Card className='mb-4 p-3'>
        <h4 style={{ color: 'var(--accent)', marginBottom: '16px' }}>📦 Delivery Progress</h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {getDeliverySteps(order).map((step, i) => (
            <li
              key={i}
              style={{
                ...getStepStyle(step),
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: step.current ? '6px 12px' : '2px 12px',
                borderRadius: '6px',
                backgroundColor: step.current
                  ? 'rgba(212,175,55,0.1)'
                  : 'transparent',
                border: step.current
                  ? '1px solid var(--accent)'
                  : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: '16px' }}>{getStepIcon(step)}</span>
              <span>{step.label}</span>
              {step.current && (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--btn-text)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: '700',
                }}>
                  Current
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>

            {/* SHIPPING */}
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p><strong>Name: </strong>{order.user.name}</p>
              <p><strong>Email: </strong>{order.user.email}</p>
              <p>
                <strong>Address: </strong>
                {order.shippingAddress.address},{' '}
                {order.shippingAddress.city},{' '}
                {order.shippingAddress.postalCode},{' '}
                {order.shippingAddress.country}
              </p>
              {order.isCancelled ? (
                <Message variant='danger'>Order Cancelled ❌</Message>
              ) : order.isDelivered ? (
                <Message variant='success'>Delivered ✔</Message>
              ) : (
                <Message variant='warning'>Not Yet Delivered</Message>
              )}
            </ListGroup.Item>

            {/* PAYMENT — separated, visible only here */}
            <ListGroup.Item>
              <h2>Payment Information</h2>
              <p><strong>Method: </strong>{order.paymentMethod}</p>
              <p><strong>Items: </strong>{formatPeso(order.itemsPrice)}</p>
              <p><strong>Shipping Fee: </strong>{formatPeso(order.shippingPrice)}</p>
              <p>
                <strong>Tax (12% VAT): </strong>
                <span style={{ color: 'var(--accent)', fontWeight: '700' }}>
                  {formatPeso(order.taxPrice)}
                </span>
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--accent)',
                marginTop: '8px',
              }}>
                Total: {formatPeso(order.totalPrice)}
              </p>
              {order.isPaid ? (
                <Message variant='success'>Paid ✔</Message>
              ) : (
                <Message variant='warning'>Not Paid</Message>
              )}
            </ListGroup.Item>

            {/* ORDER ITEMS */}
            <ListGroup.Item>
              <h2>Order Items</h2>
              {order.orderItems.length === 0 ? (
                <Message>Order is empty</Message>
              ) : (
                <ListGroup variant='flush'>
                  {order.orderItems.map((item, index) => (
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

        {/* ORDER SUMMARY CARD */}
        <Col md={4}>
          <Card>
            <ListGroup variant='flush'>
              <ListGroup.Item><h2>Order Summary</h2></ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>{formatPeso(order.itemsPrice)}</Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col>{formatPeso(order.shippingPrice)}</Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item style={{
                backgroundColor: 'rgba(212,175,55,0.08)',
                border: '1px solid var(--accent-dark)',
                borderRadius: '6px',
              }}>
                <Row>
                  <Col><strong>Tax (12% VAT) ⚡</strong></Col>
                  <Col><strong style={{ color: 'var(--accent)' }}>{formatPeso(order.taxPrice)}</strong></Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col><strong>Total</strong></Col>
                  <Col><strong style={{ color: 'var(--accent)' }}>{formatPeso(order.totalPrice)}</strong></Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                {order.isCancelled ? (
                  <Message variant='danger'>Order Cancelled</Message>
                ) : (
                  <>
                    <Message variant='success'>PAYMENT COMPLETED ✔</Message>
                    {order.isDelivered && (
                      <Message variant='success'>DELIVERY COMPLETED ✔</Message>
                    )}
                  </>
                )}
              </ListGroup.Item>

              {/* CANCEL BUTTON */}
              {!order.isCancelled && !order.isDelivered && !userInfo?.isAdmin && (
                <ListGroup.Item>
                  <Button
                    variant='danger'
                    className='w-100'
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel Order
                  </Button>
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginTop: '4px', textAlign: 'center' }}>
                    To cancel, please contact CELLCOM
                  </small>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      {/* CANCEL MODAL */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Message variant='warning'>
            ⚠️ Are you sure you want to cancel this order? Please contact CELLCOM if you have concerns.
          </Message>
          <Form.Group className='mt-3'>
            <Form.Label>Reason for cancellation</Form.Label>
            <Form.Control
              as='textarea'
              rows={3}
              placeholder='Please enter your reason...'
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShowCancelModal(false)}>
            Keep Order
          </Button>
          <Button variant='danger' onClick={handleCancel} disabled={loadingCancel}>
            {loadingCancel ? 'Cancelling...' : 'Confirm Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OrderScreen;