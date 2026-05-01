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

const formatTime = (date) =>
  new Date(date).toLocaleString('en-PH', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const getOrderSeed = (orderId) =>
  orderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

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
    const created = new Date(order.createdAt);
    const seed = getOrderSeed(order._id);
    const deliveryDays = 1 + Math.floor(seededRandom(seed) * 3);
    const totalHours = deliveryDays * 24;
    const r = (i) => seededRandom(seed + i);

    const stepOffsets = [
      0,
      1 + r(1) * 2,
      3 + r(2) * 4,
      7 + r(3) * 5,
      totalHours * 0.5 + r(4) * 3,
      totalHours * 0.75 + r(5) * 2,
      totalHours + r(6) * 1,
    ];

    const addHours = (base, hours) =>
      new Date(base.getTime() + hours * 60 * 60 * 1000);

    const now = new Date();

    if (order.isCancelled) {
      return [
        { label: 'Order Created – Manila Warehouse', time: formatTime(created), done: true },
        { label: 'Order Cancelled', time: formatTime(order.cancelledAt), done: true, cancelled: true },
      ];
    }

    const steps = [
      { label: 'Order Created – Manila Warehouse', scheduledTime: addHours(created, stepOffsets[0]), done: true },
      { label: 'Picked Up – Parañaque Sorting Center', scheduledTime: addHours(created, stepOffsets[1]), done: now >= addHours(created, stepOffsets[1]) },
      { label: 'Sorting – Cebu Logistics Hub', scheduledTime: addHours(created, stepOffsets[2]), done: now >= addHours(created, stepOffsets[2]) },
      { label: 'Transport – Tacloban Distribution Hub', scheduledTime: addHours(created, stepOffsets[3]), done: now >= addHours(created, stepOffsets[3]) },
      { label: `Arrived – ${order.shippingAddress.city} Delivery Hub`, scheduledTime: addHours(created, stepOffsets[4]), done: now >= addHours(created, stepOffsets[4]) },
      { label: `Out for Delivery – ${order.shippingAddress.city}`, scheduledTime: addHours(created, stepOffsets[5]), done: now >= addHours(created, stepOffsets[5]) },
      {
        label: `Delivered – ${order.shippingAddress.address}, ${order.shippingAddress.city}`,
        scheduledTime: addHours(created, stepOffsets[6]),
        done: order.isDelivered || now >= addHours(created, stepOffsets[6]),
        final: true,
      },
    ];

    let lastReached = -1;
    steps.forEach((s, i) => { if (s.done) lastReached = i; });

    return steps.map((s, i) => ({
      ...s,
      time: formatTime(s.scheduledTime),
      current: i === lastReached && !(s.final && s.done),
    }));
  };

  const getEstimatedDelivery = (createdAt, orderId) => {
    const seed = getOrderSeed(orderId);
    const deliveryDays = 1 + Math.floor(seededRandom(seed) * 3);
    const d = new Date(createdAt);
    d.setDate(d.getDate() + deliveryDays);
    return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const canCancel = (order) => {
    if (order.isCancelled || order.isDelivered || userInfo?.isAdmin) return false;
    const steps = getDeliverySteps(order);
    const currentIndex = steps.findIndex((s) => s.current);
    return currentIndex <= 0;
  };

  return isLoading ? (
    <Loader />
  ) : error ? (
    <Message variant='danger'>{error?.data?.message}</Message>
  ) : (
    <>
      <h1 style={{ color: 'var(--accent)', fontWeight: '800', marginBottom: '20px' }}>
        Order Tracking
      </h1>

      {/* CANCELLED BANNER */}
      {order.isCancelled && (
        <Message variant='danger'>
          ❌ This order was cancelled on{' '}
          {new Date(order.cancelledAt).toLocaleDateString('en-PH')}.
          Reason: {order.cancelReason}
        </Message>
      )}

      {/* ESTIMATED DELIVERY BANNER */}
      {!order.isCancelled && !order.isDelivered && (
        <div style={{
          backgroundColor: 'rgba(212,175,55,0.08)',
          border: '1px solid var(--accent-dark)',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '22px' }}>🚚</span>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Estimated Delivery Date
            </p>
            <strong style={{ color: 'var(--accent)', fontSize: '15px' }}>
              {getEstimatedDelivery(order.createdAt, order._id)}
            </strong>
          </div>
        </div>
      )}

      {/* DELIVERY PROGRESS */}
      <Card className='mb-4'>
        <Card.Body>
          <h4 style={{ color: 'var(--accent)', marginBottom: '24px', fontWeight: '700' }}>
            📦 Delivery Progress
          </h4>

          <div style={{ position: 'relative', paddingLeft: '28px' }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute',
              left: '6px', top: '8px', bottom: '8px',
              width: '2px',
              backgroundColor: 'var(--border)',
              zIndex: 0,
            }} />

            {getDeliverySteps(order).map((step, i) => (
              <div key={i} style={{
                position: 'relative',
                marginBottom: '22px',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Circle dot only — no big highlight */}
                <div style={{
                  position: 'absolute',
                  left: '-22px', top: '3px',
                  width: '14px', height: '14px',
                  borderRadius: '50%',
                  backgroundColor: step.cancelled
                    ? '#e74c3c'
                    : step.current
                    ? 'var(--accent)'
                    : step.done
                    ? (step.final ? '#2ecc71' : 'var(--accent-dark)')
                    : 'var(--bg-soft)',
                  border: step.current
                    ? '2px solid var(--accent-light)'
                    : step.done
                    ? '2px solid transparent'
                    : '2px solid var(--border)',
                  zIndex: 1,
                  boxShadow: step.current ? '0 0 8px var(--accent)' : 'none',
                  transition: 'all 0.3s',
                }} />

                {/* Text content — no background highlight */}
                <div style={{ paddingLeft: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontWeight: step.current || (step.final && step.done) ? '700' : '400',
                      color: step.cancelled
                        ? '#e74c3c'
                        : step.current
                        ? 'var(--accent)'
                        : step.done
                        ? (step.final ? '#2ecc71' : 'var(--text-main)')
                        : 'var(--text-muted)',
                      fontSize: step.current ? '14px' : '13px',
                      opacity: !step.done && !step.current ? 0.45 : 1,
                    }}>
                      {step.label}
                    </span>
                    {step.current && (
                      <span style={{
                        fontSize: '10px',
                        backgroundColor: 'var(--accent)',
                        color: 'var(--btn-text)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        Current
                      </span>
                    )}
                  </div>

                  {(step.done || step.current) && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '2px',
                    }}>
                      🕐 {step.time}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
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
                {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.postalCode}, {order.shippingAddress.country}
              </p>
              {order.isCancelled ? (
                <Message variant='danger'>Order Cancelled ❌</Message>
              ) : order.isDelivered ? (
                <Message variant='success'>
                  ✅ Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-PH')}
                </Message>
              ) : (
                <Message variant='warning'>Not Yet Delivered</Message>
              )}
            </ListGroup.Item>

            {/* PAYMENT */}
            <ListGroup.Item>
              <h2>Payment Information</h2>
              <p><strong>Method: </strong>{order.paymentMethod}</p>
              <p><strong>Items: </strong>{formatPeso(order.itemsPrice)}</p>
              <p>
                <strong>Shipping Fee (1%): </strong>
                <span style={{ color: 'var(--accent)', fontWeight: '700' }}>
                  {formatPeso(order.shippingPrice)}
                </span>
              </p>
              <p style={{
                fontSize: '16px', fontWeight: '700',
                color: 'var(--accent)', marginTop: '8px',
                borderTop: '1px solid var(--border)', paddingTop: '8px',
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
                          {item.qty} x {formatPeso(item.price)} = {formatPeso(item.qty * item.price)}
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

              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>{formatPeso(order.itemsPrice)}</Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item style={{
                backgroundColor: 'rgba(212,175,55,0.08)',
                border: '1px solid var(--accent-dark)',
                borderRadius: '6px',
              }}>
                <Row>
                  <Col><strong>Shipping Fee (1%) 🚚</strong></Col>
                  <Col>
                    <strong style={{ color: 'var(--accent)' }}>
                      {formatPeso(order.shippingPrice)}
                    </strong>
                  </Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col><strong>Total</strong></Col>
                  <Col>
                    <strong style={{ color: 'var(--accent)', fontSize: '16px' }}>
                      {formatPeso(order.totalPrice)}
                    </strong>
                  </Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                {order.isCancelled ? (
                  <Message variant='danger'>Order Cancelled ❌</Message>
                ) : (
                  <>
                    <Message variant='success'>PAYMENT COMPLETED ✔</Message>
                    {order.isDelivered && (
                      <Message variant='success'>DELIVERY COMPLETED ✔</Message>
                    )}
                  </>
                )}
              </ListGroup.Item>

              {/* CANCEL BUTTON — Step 0 lang */}
              {canCancel(order) && (
                <ListGroup.Item>
                  <Button variant='danger' className='w-100' onClick={() => setShowCancelModal(true)}>
                    Cancel Order
                  </Button>
                  <small style={{
                    color: 'var(--text-muted)', fontSize: '11px',
                    display: 'block', marginTop: '4px', textAlign: 'center',
                  }}>
                    To cancel, please contact CELLCOM
                  </small>
                </ListGroup.Item>
              )}

              {/* IN TRANSIT NOTICE */}
              {!order.isCancelled && !order.isDelivered && !canCancel(order) && !userInfo?.isAdmin && (
                <ListGroup.Item>
                  <div style={{
                    backgroundColor: 'rgba(212,175,55,0.08)',
                    border: '1px solid var(--accent-dark)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '12px',
                    color: 'var(--accent)',
                    textAlign: 'center',
                  }}>
                    ⚠️ Order is already in transit.<br />
                    <strong>Cancellation is no longer allowed.</strong>
                  </div>
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
              as='textarea' rows={3}
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