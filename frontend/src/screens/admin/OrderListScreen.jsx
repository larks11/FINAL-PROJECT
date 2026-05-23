import { useState } from 'react';
import { Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaSearch, FaTrash, FaArchive, FaBoxOpen } from 'react-icons/fa';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import {
  useGetOrdersQuery,
  useDeleteOrderMutation,
  usePrepareOrderMutation,
  usePickupOrderMutation,
  useArchiveOrderMutation,
} from '../../slices/ordersApiSlice';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const OrderListScreen = () => {
  const { data: orders, isLoading, error, refetch } = useGetOrdersQuery();
  const [deleteOrder, { isLoading: loadingDelete }] = useDeleteOrderMutation();
  const [prepareOrder]  = usePrepareOrderMutation();
  const [pickupOrder]   = usePickupOrderMutation();
  const [archiveOrder]  = useArchiveOrderMutation();

  const [searchTerm, setSearchTerm]           = useState('');
  const [filterStatus, setFilterStatus]       = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showArchived, setShowArchived]       = useState(false);

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this order?')) {
      try {
        await deleteOrder(id).unwrap();
        toast.success('Order deleted successfully');
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const archiveHandler = async (id, isArchived) => {
    const action = isArchived ? 'unarchive' : 'archive';
    if (window.confirm(`Are you sure you want to ${action} this order?`)) {
      try {
        await archiveOrder(id).unwrap();
        toast.success(`Order ${action}d successfully`);
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const handlePrepare = async (id) => {
    setActionLoadingId(id);
    try {
      await prepareOrder(id).unwrap();
      toast.success('Order is now being prepared!');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
    setActionLoadingId(null);
  };

  const handlePickup = async (id) => {
    setActionLoadingId(id);
    try {
      await pickupOrder(id).unwrap();
      toast.success('Picked up! Auto-tracking started.');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
    setActionLoadingId(null);
  };

  const statusColor = {
    'Order Created':    '#6c757d',
    'Preparing':        '#f39c12',
    'Picked Up':        '#3498db',
    'In Transit':       '#9b59b6',
    'Out for Delivery': '#1abc9c',
    'Delivered':        '#2ecc71',
    'Cancelled':        '#e74c3c',
  };

  const allOrders = orders || [];

  const visibleOrders = showArchived
    ? allOrders.filter((o) => o.isArchived)
    : allOrders.filter((o) => !o.isArchived);

  const filteredOrders = visibleOrders.filter((o) => {
    const status = o.isCancelled ? 'Cancelled' : o.orderStatus || 'Order Created';
    if (filterStatus !== 'all' && status !== filterStatus) return false;
    return (
      o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const activeOrders = allOrders.filter((o) => !o.isArchived);
  const statusCounts = {
    all:             activeOrders.length,
    'Order Created': activeOrders.filter((o) => !o.isCancelled && o.orderStatus === 'Order Created').length,
    'Preparing':     activeOrders.filter((o) => o.orderStatus === 'Preparing').length,
    'In Transit':    activeOrders.filter((o) => o.orderStatus === 'In Transit').length,
    'Delivered':     activeOrders.filter((o) => o.isDelivered).length,
    'Cancelled':     activeOrders.filter((o) => o.isCancelled).length,
  };
  const archivedCount = allOrders.filter((o) => o.isArchived).length;

  const thStyle = {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--accent)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '24px', margin: 0 }}>
          {showArchived ? '📁 Archived Orders' : '🛒 Orders'}
        </h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {allOrders.length} total orders
          </span>
          <button
            onClick={() => { setShowArchived(!showArchived); setFilterStatus('all'); }}
            style={{
              backgroundColor: showArchived ? 'var(--accent)' : 'transparent',
              color: showArchived ? 'var(--btn-text)' : 'var(--text-muted)',
              border: '1px solid var(--accent)',
              borderRadius: '8px',
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {showArchived ? <><FaBoxOpen /> Active Orders</> : <><FaArchive /> Archives ({archivedCount})</>}
          </button>
        </div>
      </div>

      {/* STATUS FILTER TABS */}
      {!showArchived && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                backgroundColor: filterStatus === status ? 'var(--accent)' : 'var(--bg-soft)',
                color: filterStatus === status ? 'var(--btn-text)' : 'var(--text-muted)',
                border: `1px solid ${filterStatus === status ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '20px',
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {status === 'all' ? 'All' : status} ({count})
            </button>
          ))}
        </div>
      )}

      {/* SEARCH */}
      <Row className='mb-3'>
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              type='text'
              placeholder='Search by order ID or customer name...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button variant='outline-secondary' onClick={() => setSearchTerm('')}>Clear</Button>
            )}
          </InputGroup>
        </Col>
        <Col md={6} className='d-flex align-items-center'>
          {searchTerm && (
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''} found
            </span>
          )}
        </Col>
      </Row>

      {loadingDelete && <Loader />}

      {isLoading ? <Loader /> : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-soft)', borderBottom: '2px solid var(--accent)' }}>
                  {['#', 'Customer', 'Date', 'Total', 'Status', 'Details', 'Actions'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => {
                    const status = order.isCancelled ? 'Cancelled' : order.orderStatus || 'Order Created';
                    const isDelivered = order.isDelivered;
                    return (
                      <tr
                        key={order._id}
                        style={{ borderBottom: '1px solid var(--border)', opacity: order.isCancelled ? 0.7 : 1 }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-soft)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontWeight: '600' }}>
                          {order.user?.name || 'Unknown'}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                          {order.createdAt?.substring(0, 10)}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--accent)', fontWeight: '700' }}>
                          ₱{Number(order.totalPrice).toLocaleString('en-PH')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            backgroundColor: statusColor[status] || '#6c757d',
                            color: '#fff',
                            borderRadius: '20px',
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: '700',
                          }}>
                            {status}
                          </span>
                          {order.isArchived && (
                            <span style={{
                              backgroundColor: '#6c757d',
                              color: '#fff',
                              borderRadius: '20px',
                              padding: '3px 8px',
                              fontSize: '10px',
                              fontWeight: '700',
                              marginLeft: '6px',
                            }}>
                              Archived
                            </span>
                          )}
                        </td>

                        {/* ✅ DETAILS — separate column */}
                        <td style={{ padding: '14px 16px' }}>
                          <Link
                            to={`/order/${order._id}`}
                            style={{
                              backgroundColor: 'transparent',
                              color: 'var(--accent)',
                              border: '1px solid var(--accent)',
                              borderRadius: '6px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              fontWeight: '700',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            View Details
                          </Link>
                        </td>

                        {/* ✅ ACTIONS — separate column (rightmost) */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Prepare — only when Order Created */}
                            {!order.isCancelled && !order.isDelivered && order.orderStatus === 'Order Created' && (
                              <button
                                onClick={() => handlePrepare(order._id)}
                                disabled={actionLoadingId === order._id}
                                style={{
                                  backgroundColor: '#f39c12',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 12px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                }}
                              >
                                {actionLoadingId === order._id ? '...' : '📦 Prepare'}
                              </button>
                            )}

                            {/* Pickup — only when Preparing */}
                            {!order.isCancelled && !order.isDelivered && order.orderStatus === 'Preparing' && (
                              <button
                                onClick={() => handlePickup(order._id)}
                                disabled={actionLoadingId === order._id}
                                style={{
                                  backgroundColor: '#2ecc71',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 12px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                }}
                              >
                                {actionLoadingId === order._id ? '...' : '🛵 Pickup'}
                              </button>
                            )}

                            {/* Archive & Delete — only when Delivered */}
                            {isDelivered && (
                              <>
                                <button
                                  onClick={() => archiveHandler(order._id, order.isArchived)}
                                  title={order.isArchived ? 'Unarchive' : 'Archive'}
                                  style={{
                                    backgroundColor: order.isArchived ? '#6c757d' : '#3498db',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  {order.isArchived ? <FaBoxOpen size={11} /> : <FaArchive size={11} />}
                                </button>

                                <button
                                  onClick={() => deleteHandler(order._id)}
                                  title='Delete Order'
                                  style={{
                                    backgroundColor: '#e74c3c',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <FaTrash size={11} />
                                </button>
                              </>
                            )}

                            {/* Empty state for orders with no actions */}
                            {!(!order.isCancelled && !order.isDelivered && (order.orderStatus === 'Order Created' || order.orderStatus === 'Preparing')) && !isDelivered && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan='7' style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {searchTerm
                        ? `No orders found matching "${searchTerm}"`
                        : showArchived ? 'No archived orders yet' : 'No orders yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderListScreen;