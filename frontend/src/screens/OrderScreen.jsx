import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Card, Button, Modal, Form } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import {
  useGetOrderDetailsQuery,
  useCancelOrderMutation,
  usePrepareOrderMutation,
  usePickupOrderMutation,
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

const getDeliverySteps = (order) => {
  if (order.isCancelled) {
    return [
      {
        label: 'Order Created – Ormoc City Main Branch',
        time: formatTime(order.createdAt),
        done: true,
      },
      {
        label: 'Order Cancelled',
        time: formatTime(order.cancelledAt),
        done: true,
        cancelled: true,
      },
    ];
  }

  const city = order.shippingAddress?.city || '';
  const history = order.statusHistory || [];

  const findHistory = (status) => {
    const h = history.find((h) => h.status === status);
    return h ? formatTime(h.timestamp) : null;
  };

  const statusRank = {
    'Order Created': 0,
    'Preparing': 1,
    'Picked Up': 2,
    'In Transit': 3,
    'Out for Delivery': 4,
    'Delivered': 5,
  };

  const currentRank = statusRank[order.orderStatus] ?? 0;

  const pickedUpTime = order.pickedUpAt ? new Date(order.pickedUpAt) : null;
  const inTransitTime = order.inTransitAt ? new Date(order.inTransitAt) : null;
  const outForDeliveryTime = order.outForDeliveryAt ? new Date(order.outForDeliveryAt) : null;

  const steps = [
    {
      label: 'Order Created – Ormoc City Main Branch',
      done: currentRank >= 0,
      time: findHistory('Order Created') || formatTime(order.createdAt),
    },
    {
      label: 'Prepared – CELLCOM Ormoc Warehouse',
      done: currentRank >= 1,
      time: findHistory('Preparing') || (order.preparedAt ? formatTime(order.preparedAt) : null),
    },
    {
      label: 'Picked Up – Ormoc City Courier',
      done: currentRank >= 2,
      time: findHistory('Picked Up') || (pickedUpTime ? formatTime(pickedUpTime) : null),
    },
    {
      label: 'In Transit – Ormoc Distribution Hub',
      done: currentRank >= 3,
      time: findHistory('In Transit') || (inTransitTime ? formatTime(inTransitTime) : null),
    },
    {
      label: `Arrived – ${city} Delivery Hub`,
      done: currentRank >= 4,
      time: findHistory('Out for Delivery') || (outForDeliveryTime ? formatTime(outForDeliveryTime) : null),
    },
    {
      label: `Out for Delivery – ${city}`,
      done: currentRank >= 4,
      time: findHistory('Out for Delivery') || (outForDeliveryTime ? formatTime(outForDeliveryTime) : null),
    },
    {
      label: `Delivered – ${order.shippingAddress?.address}, ${city}`,
      done: order.isDelivered || currentRank >= 5,
      time: findHistory('Delivered') || (order.isDelivered && order.deliveredAt ? formatTime(order.deliveredAt) : null),
      final: true,
    },
  ];

  let lastReached = -1;
  steps.forEach((s, i) => { if (s.done) lastReached = i; });

  return steps.map((s, i) => ({
    ...s,
    current: i === lastReached && !(s.final && s.done),
  }));
};

const getEstimatedDelivery = (order) => {
  if (order.deliveredAt && !order.isDelivered) {
    return new Date(order.deliveredAt).toLocaleDateString('en-PH', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  }
  if (order.isDelivered && order.deliveredAt) {
    return new Date(order.deliveredAt).toLocaleDateString('en-PH', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  }
  return 'To be determined';
};

const canCancel = (order, userInfo) => {
  if (order.isCancelled || order.isDelivered || userInfo?.isAdmin) return false;
  return order.orderStatus === 'Order Created';
};

const OrderScreen = () => {
  const { id: orderId } = useParams();
  const { userInfo } = useSelector((state) => state.auth);

  const { data: order, isLoading, error, refetch } = useGetOrderDetailsQuery(orderId);
  const [cancelOrder, { isLoading: loadingCancel }]   = useCancelOrderMutation();
  const [prepareOrder, { isLoading: loadingPrepare }] = usePrepareOrderMutation();
  const [pickupOrder, { isLoading: loadingPickup }]   = usePickupOrderMutation();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason]       = useState('');

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

  const handlePrepare = async () => {
    try {
      await prepareOrder(orderId).unwrap();
      toast.success('Order is now being prepared!');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handlePickup = async () => {
    try {
      await pickupOrder(orderId).unwrap();
      toast.success('Order picked up! Automatic delivery tracking started.');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
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

      {order.isCancelled && (
        <Message variant='danger'>
          ❌ This order was cancelled on{' '}
          {new Date(order.cancelledAt).toLocaleDateString('en-PH')}.
          Reason: {order.cancelReason}
        </Message>
      )}

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
              {getEstimatedDelivery(order)}
            </strong>
          </div>
        </div>
      )}

      <Card className='mb-4'>
        <Card.Body>
          <h4 style={{ color: 'var(--accent)', marginBottom: '24px', fontWeight: '700' }}>
            📦 Delivery Progress
          </h4>

          <div style={{ position: 'relative', paddingLeft: '28px' }}>
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
                        color: '#000000',
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

                  {/* ✅ Only show time if step is done or current */}
                  {(step.done || step.current) && step.time && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
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

              {userInfo?.isAdmin && !order.isCancelled && !order.isDelivered && (
                <ListGroup.Item>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{
                      fontSize: '12px', fontWeight: '700',
                      color: 'var(--accent)', margin: 0,
                    }}>
                      🛠 Admin Controls
                    </p>

                    {order.orderStatus === 'Order Created' && (
                      <Button
                        variant='warning'
                        className='w-100'
                        onClick={handlePrepare}
                        disabled={loadingPrepare}
                      >
                        {loadingPrepare ? 'Processing...' : '📦 Prepare Order'}
                      </Button>
                    )}

                    {order.orderStatus === 'Preparing' && (
                      <Button
                        variant='success'
                        className='w-100'
                        onClick={handlePickup}
                        disabled={loadingPickup}
                      >
                        {loadingPickup ? 'Processing...' : '🛵 Mark as Picked Up'}
                      </Button>
                    )}

                    {['Picked Up', 'In Transit', 'Out for Delivery'].includes(order.orderStatus) && (
                      <div style={{
                        backgroundColor: 'rgba(46,204,113,0.08)',
                        border: '1px solid #2ecc71',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#2ecc71',
                        textAlign: 'center',
                      }}>
                        ✅ Auto-tracking active.<br />
                        <strong>Status: {order.orderStatus}</strong>
                      </div>
                    )}
                  </div>
                </ListGroup.Item>
              )}

              {canCancel(order, userInfo) && (
                <ListGroup.Item>
                  <Button
                    variant='danger'
                    className='w-100'
                    onClick={() => setShowCancelModal(true)}
                  >
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

              {!order.isCancelled && !order.isDelivered &&
                !canCancel(order, userInfo) && !userInfo?.isAdmin && (
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