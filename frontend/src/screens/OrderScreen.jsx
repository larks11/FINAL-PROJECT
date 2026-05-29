import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Card, Button, Modal, Form, Badge } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import {
  useGetOrderDetailsQuery,
  useCancelOrderMutation,
  usePrepareOrderMutation,
  usePickupOrderMutation,
  useUpdateOrderETAMutation,
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

const formatDateInput = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 16);
};

const getDeliverySteps = (order) => {
  if (order.isCancelled) {
    return [
      { label: 'Order Created – Ormoc City Main Branch', time: formatTime(order.createdAt), done: true },
      { label: 'Order Cancelled', time: formatTime(order.cancelledAt), done: true, cancelled: true },
    ];
  }

  const city = order.shippingAddress?.city || '';
  const history = order.statusHistory || [];
  const findHistory = (status) => {
    const h = history.find((h) => h.status === status);
    return h ? formatTime(h.timestamp) : null;
  };

  const statusRank = {
    'Order Created': 0, 'Preparing': 1, 'Picked Up': 2,
    'In Transit': 3, 'Out for Delivery': 4, 'Delivered': 5,
  };
  const currentRank = statusRank[order.orderStatus] ?? 0;

  const steps = [
    { label: 'Order Created – Ormoc City Main Branch', done: currentRank >= 0, time: findHistory('Order Created') || formatTime(order.createdAt) },
    { label: 'Prepared – CELLCOM Ormoc Warehouse', done: currentRank >= 1, time: findHistory('Preparing') || (order.preparedAt ? formatTime(order.preparedAt) : null) },
    { label: 'Picked Up – Ormoc City Courier', done: currentRank >= 2, time: findHistory('Picked Up') || (order.pickedUpAt ? formatTime(order.pickedUpAt) : null) },
    { label: 'In Transit – Ormoc Distribution Hub', done: currentRank >= 3, time: findHistory('In Transit') || (order.inTransitAt ? formatTime(order.inTransitAt) : null) },
    { label: `Arrived – ${city} Delivery Hub`, done: currentRank >= 4, time: findHistory('Out for Delivery') || (order.outForDeliveryAt ? formatTime(order.outForDeliveryAt) : null) },
    { label: `Out for Delivery – ${city}`, done: currentRank >= 4, time: findHistory('Out for Delivery') || (order.outForDeliveryAt ? formatTime(order.outForDeliveryAt) : null) },
    { label: `Delivered – ${order.shippingAddress?.address}, ${city}`, done: order.isDelivered || currentRank >= 5, time: findHistory('Delivered') || (order.isDelivered && order.deliveredAt ? formatTime(order.deliveredAt) : null), final: true },
  ];

  let lastReached = -1;
  steps.forEach((s, i) => { if (s.done) lastReached = i; });
  return steps.map((s, i) => ({ ...s, current: i === lastReached && !(s.final && s.done) }));
};

const ETABanner = ({ order, userInfo, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [etaDate, setEtaDate] = useState('');
  const [etaReason, setEtaReason] = useState('');
  const [isDelay, setIsDelay] = useState(false);
  const [updateETA, { isLoading: loadingETA }] = useUpdateOrderETAMutation();

  if (order.isCancelled || order.isDelivered) return null;

  const hasOverride = !!order.etaOverride;
  const hasRange = order.etaStart && order.etaEnd;

  const formatRange = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const opts = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString('en-PH', opts)} – ${e.toLocaleDateString('en-PH', { ...opts, year: 'numeric' })}`;
  };

  const formatSingle = (date) =>
    new Date(date).toLocaleDateString('en-PH', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

  const openModal = () => {
    setEtaDate(formatDateInput(order.etaOverride || order.etaEnd));
    setEtaReason(order.etaReason || '');
    setIsDelay(order.etaIsDelayed || false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!etaDate) { toast.error('Please select an ETA date'); return; }
    try {
      await updateETA({ orderId: order._id, etaDate, etaReason, isDelay }).unwrap();
      toast.success('ETA updated!');
      setShowModal(false);
      onUpdate();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update ETA');
    }
  };

  const handleClear = async () => {
    try {
      await updateETA({ orderId: order._id, etaDate: null, etaReason: '' }).unwrap();
      toast.success('ETA reset to automatic');
      setShowModal(false);
      onUpdate();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reset ETA');
    }
  };

  const quickReasons = ['Storm / Typhoon', 'Holiday', 'Road Closure', 'High Volume Orders', 'Vehicle Breakdown', 'Flood'];

  const isDelayed = order.etaIsDelayed;
  const bannerBg = isDelayed
    ? 'linear-gradient(135deg, #fff3cd, #ffeaa7)'
    : order.etaIsAccurate
    ? 'linear-gradient(135deg, #d4efdf, #a9dfbf)'
    : 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
  const bannerBorder = isDelayed ? '#f39c12' : order.etaIsAccurate ? '#27ae60' : '#3b82f6';
  const labelColor = isDelayed ? '#856404' : order.etaIsAccurate ? '#1e8449' : '#1e40af';
  const dateColor = isDelayed ? '#533f03' : order.etaIsAccurate ? '#145a32' : '#1e3a8a';

  return (
    <>
      <div style={{
        borderRadius: '12px', padding: '18px 22px', marginBottom: '20px',
        background: bannerBg, border: `2px solid ${bannerBorder}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: labelColor, marginBottom: '4px' }}>
              {isDelayed ? '⚠️ Updated ETA' : order.etaIsAccurate ? '🚚 Estimated Delivery' : '📦 Estimated Delivery Date'}
            </div>

            {/* Shopee-style range display */}
            {hasOverride ? (
              <div style={{ fontSize: '20px', fontWeight: '800', color: dateColor }}>
                {formatSingle(order.etaOverride)}
              </div>
            ) : hasRange ? (
              <div style={{ fontSize: '20px', fontWeight: '800', color: dateColor }}>
                {formatRange(order.etaStart, order.etaEnd)}
              </div>
            ) : (
              <div style={{ fontSize: '16px', color: dateColor }}>Calculating...</div>
            )}

            {order.etaIsAccurate && !isDelayed && (
              <div style={{ marginTop: '4px', fontSize: '12px', color: labelColor }}>
                ✅ Accurate ETA — order is now in transit
              </div>
            )}
            {!order.etaIsAccurate && !isDelayed && (
              <div style={{ marginTop: '4px', fontSize: '12px', color: labelColor }}>
              </div>
            )}
            {isDelayed && order.etaReason && (
              <div style={{ marginTop: '6px', fontSize: '13px', color: '#856404', background: 'rgba(255,255,255,0.6)', borderRadius: '6px', padding: '3px 10px', display: 'inline-block' }}>
                📋 Reason: <strong>{order.etaReason}</strong>
              </div>
            )}
            {isDelayed && order.etaUpdatedAt && (
              <div style={{ marginTop: '4px', fontSize: '11px', color: '#888' }}>
                Updated {formatTime(order.etaUpdatedAt)} by {order.etaUpdatedBy}
              </div>
            )}
          </div>
          {userInfo?.isAdmin && (
            <Button variant="warning" size="sm" onClick={openModal} style={{ fontWeight: '700', borderRadius: '8px' }}>
              ✏️ Edit ETA
            </Button>
          )}
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ background: '#1a1a2e', color: 'white' }}>
          <Modal.Title>✏️ Update Estimated Delivery</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ background: '#fff3cd', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#856404', marginBottom: '16px' }}>
            ⚠️ Use this only for emergencies: storms, delays, holidays, etc.
          </div>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: '600' }}>📅 New ETA Date & Time</Form.Label>
            <Form.Control type="datetime-local" value={etaDate} onChange={(e) => setEtaDate(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label style={{ fontWeight: '600' }}>📋 Reason for Change</Form.Label>
            <Form.Control
              as="textarea" rows={2}
              placeholder="e.g. Typhoon delayed delivery by 2 days"
              value={etaReason}
              onChange={(e) => setEtaReason(e.target.value)}
            />
          </Form.Group>
          <Form.Check
            type="checkbox"
            label="Mark as delayed (shows warning to customer)"
            checked={isDelay}
            onChange={(e) => setIsDelay(e.target.checked)}
            className="mb-2"
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {quickReasons.map((r) => (
              <span key={r} onClick={() => { setEtaReason(r); setIsDelay(true); }} style={{
                cursor: 'pointer', padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
                color: '#2c3e50', fontWeight: etaReason === r ? '700' : '400',
                background: etaReason === r ? '#ffeaa7' : '#f0f0f0',
                border: etaReason === r ? '2px solid #f39c12' : '1px solid #dee2e6',
              }}>{r}</span>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          {hasOverride && (
            <Button variant="outline-secondary" size="sm" onClick={handleClear}>🔄 Reset to Auto</Button>
          )}
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          <Button variant="warning" onClick={handleSave} disabled={loadingETA} style={{ fontWeight: '700' }}>
            {loadingETA ? 'Saving...' : '💾 Save ETA'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const canCancel = (order, userInfo) => {
  if (order.isCancelled || order.isDelivered || userInfo?.isAdmin) return false;
  return order.orderStatus === 'Order Created';
};

const OrderScreen = () => {
  const { id: orderId } = useParams();
  const { userInfo } = useSelector((state) => state.auth);

  const { data: order, isLoading, error, refetch } = useGetOrderDetailsQuery(orderId);
  const [cancelOrder, { isLoading: loadingCancel }] = useCancelOrderMutation();
  const [prepareOrder, { isLoading: loadingPrepare }] = usePrepareOrderMutation();
  const [pickupOrder, { isLoading: loadingPickup }] = usePickupOrderMutation();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a reason for cancellation'); return; }
    try {
      await cancelOrder({ orderId, reason: cancelReason }).unwrap();
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      refetch();
    } catch (err) { toast.error(err?.data?.message || err.error); }
  };

  const handlePrepare = async () => {
    try {
      await prepareOrder(orderId).unwrap();
      toast.success('Order is now being prepared!');
      refetch();
    } catch (err) { toast.error(err?.data?.message || err.error); }
  };

  const handlePickup = async () => {
    try {
      await pickupOrder(orderId).unwrap();
      toast.success('Order picked up! Automatic delivery tracking started.');
      refetch();
    } catch (err) { toast.error(err?.data?.message || err.error); }
  };

  return isLoading ? <Loader /> : error ? (
    <Message variant="danger">{error?.data?.message}</Message>
  ) : (
    <>
      <h2 style={{ fontWeight: '800', marginBottom: '4px' }}>Order Tracking</h2>
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
        Order ID: <code>#{order._id.slice(-8).toUpperCase()}</code>
      </p>

      {order.isCancelled && (
        <Message variant="danger">
          ❌ This order was cancelled on {new Date(order.cancelledAt).toLocaleDateString('en-PH')}.
          {' '}Reason: {order.cancelReason}
        </Message>
      )}

      <Row>
        <Col md={8}>
          <ETABanner order={order} userInfo={userInfo} onUpdate={refetch} />

          {/* ✅ FIXED: Dark theme delivery progress */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h5 style={{ fontWeight: '700', marginBottom: '16px' }}>📦 Delivery Progress</h5>
            {getDeliverySteps(order).map((step, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* ✅ FIXED: Gold color para match sa theme */}
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: step.cancelled ? '#e74c3c' : step.done ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                    border: step.current ? '3px solid #f59e0b' : step.done ? 'none' : '2px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: step.done ? '#1a1a1a' : 'rgba(255,255,255,0.35)',
                    fontSize: '12px', fontWeight: '700',
                  }}>
                    {step.cancelled ? '✕' : step.done ? '✓' : i + 1}
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{
                      width: '2px', flex: 1, minHeight: '16px',
                      background: step.done ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                      marginTop: '2px',
                    }} />
                  )}
                </div>
                <div style={{ paddingBottom: '8px' }}>
                  {/* ✅ FIXED: White text para visible sa dark bg */}
                  <div style={{
                    fontWeight: step.current ? '700' : '500',
                    fontSize: '14px',
                    color: step.cancelled ? '#e74c3c' : step.done ? '#ffffff' : 'rgba(255,255,255,0.35)',
                  }}>
                    {step.label}
                    {step.current && (
                      <Badge style={{ marginLeft: '8px', fontSize: '10px', background: '#f59e0b', color: '#1a1a1a' }}>
                        Current
                      </Badge>
                    )}
                  </div>
                  {(step.done || step.current) && step.time && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>🕐 {step.time}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <ListGroup variant="flush">
            <ListGroup.Item>
              <h4>Shipping</h4>
              <p><strong>Name: </strong>{order.user.name}</p>
              <p><strong>Email: </strong>{order.user.email}</p>
              <p><strong>Address: </strong>{order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
              {order.isCancelled ? <Message variant="danger">Order Cancelled ❌</Message>
                : order.isDelivered ? <Message variant="success">✅ Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-PH')}</Message>
                : <Message variant="warning">Not Yet Delivered</Message>}
            </ListGroup.Item>
            <ListGroup.Item>
              <h4>Payment Information</h4>
              <p><strong>Method: </strong>{order.paymentMethod}</p>
              <p><strong>Items: </strong>{formatPeso(order.itemsPrice)}</p>
              <p><strong>Shipping Fee: </strong>{formatPeso(order.shippingPrice)}</p>
              <p><strong>Total: </strong>{formatPeso(order.totalPrice)}</p>
              {order.isPaid ? <Message variant="success">Paid ✔</Message> : <Message variant="danger">Not Paid</Message>}
            </ListGroup.Item>
            <ListGroup.Item>
              <h4>Order Items</h4>
              {order.orderItems.length === 0 ? <Message>Order is empty</Message> : (
                <ListGroup variant="flush">
                  {order.orderItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row className="align-items-center">
                        <Col md={1}><Image src={item.image} alt={item.name} fluid rounded /></Col>
                        <Col><Link to={`/product/${item.product}`}>{item.name}</Link></Col>
                        <Col md={4}>{item.qty} x {formatPeso(item.price)} = {formatPeso(item.qty * item.price)}</Col>
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
            <ListGroup variant="flush">
              <ListGroup.Item><h4>Order Summary</h4></ListGroup.Item>
              <ListGroup.Item><Row><Col>Items</Col><Col>{formatPeso(order.itemsPrice)}</Col></Row></ListGroup.Item>
              <ListGroup.Item><Row><Col><strong>Shipping Fee 🚚</strong></Col><Col><strong>{formatPeso(order.shippingPrice)}</strong></Col></Row></ListGroup.Item>
              <ListGroup.Item><Row><Col><strong>Total</strong></Col><Col><strong>{formatPeso(order.totalPrice)}</strong></Col></Row></ListGroup.Item>
              <ListGroup.Item>
                {order.isCancelled ? <Message variant="danger">Order Cancelled ❌</Message> : (
                  <>
                    <Message variant="success">PAYMENT COMPLETED ✔</Message>
                    {order.isDelivered && <Message variant="success">DELIVERY COMPLETED ✔</Message>}
                  </>
                )}
              </ListGroup.Item>

              {userInfo?.isAdmin && !order.isCancelled && !order.isDelivered && (
                <ListGroup.Item>
                  <h5 style={{ fontWeight: '700', marginBottom: '12px' }}>🛠 Admin Controls</h5>
                  {order.orderStatus === 'Order Created' && (
                    <Button variant="primary" className="w-100 mb-2" onClick={handlePrepare} disabled={loadingPrepare}>
                      {loadingPrepare ? 'Processing...' : '📦 Prepare Order'}
                    </Button>
                  )}
                  {order.orderStatus === 'Preparing' && (
                    <Button variant="success" className="w-100 mb-2" onClick={handlePickup} disabled={loadingPickup}>
                      {loadingPickup ? 'Processing...' : '🛵 Mark as Picked Up'}
                    </Button>
                  )}
                  {['Picked Up', 'In Transit', 'Out for Delivery'].includes(order.orderStatus) && (
                    <Message variant="info">✅ Auto-tracking active.<br /><strong>Status: {order.orderStatus}</strong></Message>
                  )}
                </ListGroup.Item>
              )}

              {canCancel(order, userInfo) && (
                <ListGroup.Item>
                  <Button variant="danger" className="w-100" onClick={() => setShowCancelModal(true)}>Cancel Order</Button>
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '8px', textAlign: 'center' }}>To cancel, please contact CELLCOM</p>
                </ListGroup.Item>
              )}

              {!order.isCancelled && !order.isDelivered && !canCancel(order, userInfo) && !userInfo?.isAdmin && (
                <ListGroup.Item>
                  <Message variant="warning">⚠️ Order is already in transit.<br /><strong>Cancellation is no longer allowed.</strong></Message>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Cancel Order</Modal.Title></Modal.Header>
        <Modal.Body>
          <p>⚠️ Are you sure you want to cancel this order? Please contact CELLCOM if you have concerns.</p>
          <Form.Group>
            <Form.Label>Reason for cancellation</Form.Label>
            <Form.Control as="textarea" rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Keep Order</Button>
          <Button variant="danger" onClick={handleCancel} disabled={loadingCancel}>
            {loadingCancel ? 'Cancelling...' : 'Confirm Cancel'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OrderScreen;