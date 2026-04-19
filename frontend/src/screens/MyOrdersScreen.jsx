import { Link } from 'react-router-dom';
import { Table, Button } from 'react-bootstrap';
import { FaTimes, FaEye } from 'react-icons/fa';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { useGetMyOrdersQuery } from '../slices/ordersApiSlice';

const formatPeso = (amount) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const MyOrdersScreen = () => {
  const { data: orders, isLoading, error } = useGetMyOrdersQuery();

  return (
    <>
      <h1 style={{ color: 'var(--accent)', marginBottom: '20px' }}>🛒 My Orders</h1>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : orders.length === 0 ? (
        <Message variant='info'>
          You have no orders yet. <Link to='/'>Start Shopping →</Link>
        </Message>
      ) : (
        <Table responsive hover style={{
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-main)',
          borderRadius: '10px',
          overflow: 'hidden',
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--accent)' }}>
              <th style={{ color: 'var(--accent)' }}>Order ID</th>
              <th style={{ color: 'var(--accent)' }}>Date</th>
              <th style={{ color: 'var(--accent)' }}>Total</th>
              <th style={{ color: 'var(--accent)' }}>Paid</th>
              <th style={{ color: 'var(--accent)' }}>Delivered</th>
              <th style={{ color: 'var(--accent)' }}>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} style={{ borderColor: 'var(--border)' }}>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {order._id.slice(-8).toUpperCase()}
                </td>
                <td>{order.createdAt.substring(0, 10)}</td>
                <td style={{ color: 'var(--accent)', fontWeight: '600' }}>
                  {formatPeso(order.totalPrice)}
                </td>
                <td>
                  {order.isPaid ? (
                    <span style={{ color: '#2ecc71', fontWeight: '600' }}>
                      ✅ {order.paidAt.substring(0, 10)}
                    </span>
                  ) : (
                    <FaTimes style={{ color: '#e74c3c' }} />
                  )}
                </td>
                <td>
                  {order.isDelivered ? (
                    <span style={{ color: '#2ecc71', fontWeight: '600' }}>
                      ✅ {order.deliveredAt.substring(0, 10)}
                    </span>
                  ) : (
                    <FaTimes style={{ color: '#e74c3c' }} />
                  )}
                </td>
                <td>
                  {order.isCancelled ? (
                    <span style={{
                      backgroundColor: '#e74c3c22',
                      color: '#e74c3c',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      ❌ Cancelled
                    </span>
                  ) : order.isDelivered ? (
                    <span style={{
                      backgroundColor: '#2ecc7122',
                      color: '#2ecc71',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      ✅ Delivered
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: 'rgba(212,175,55,0.15)',
                      color: 'var(--accent)',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      🚚 In Transit
                    </span>
                  )}
                </td>
                <td>
                  <Link to={`/order/${order._id}`}>
                    <Button
                      size='sm'
                      style={{
                        backgroundColor: 'var(--accent)',
                        border: 'none',
                        color: 'var(--btn-text)',
                        fontWeight: '600',
                      }}
                    >
                      <FaEye style={{ marginRight: '4px' }} />
                      View
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

export default MyOrdersScreen;