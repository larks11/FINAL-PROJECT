import { useState } from 'react';
import { Table, Button, Form, InputGroup, Row, Col, Badge } from 'react-bootstrap';
import { FaSearch, FaTrash } from 'react-icons/fa';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import {
  useGetOrdersQuery,
  useDeleteOrderMutation,
} from '../../slices/ordersApiSlice';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const OrderListScreen = () => {
  const { data: orders, isLoading, error, refetch } = useGetOrdersQuery();
  const [deleteOrder, { isLoading: loadingDelete }] = useDeleteOrderMutation();
  const [searchTerm, setSearchTerm] = useState('');

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteOrder(id).unwrap();
        toast.success('Order deleted successfully');
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const getStatusBadge = (order) => {
    if (order.isCancelled) return <Badge bg='danger'>Cancelled</Badge>;
    if (order.isDelivered) return <Badge bg='success'>Delivered</Badge>;
    if (order.isPaid) return <Badge bg='info'>Processing</Badge>;
    return <Badge bg='warning'>Pending</Badge>;
  };

  const filteredOrders = orders?.filter((order) =>
    order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <>
      <Row className='align-items-center mb-3'>
        <Col><h1>Orders</h1></Col>
      </Row>

      <Row className='mb-3'>
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              type='text'
              placeholder='Search by order ID or user name...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button variant='outline-secondary' onClick={() => setSearchTerm('')}>
                Clear
              </Button>
            )}
          </InputGroup>
        </Col>
        <Col md={6} className='d-flex align-items-center'>
          {searchTerm && (
            <span style={{ color: '#666', fontSize: '14px' }}>
              {filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''} found
            </span>
          )}
        </Col>
      </Row>

      {loadingDelete && <Loader />}

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : (
        <Table striped bordered hover responsive className='table-sm'>
          <thead>
            <tr>
              <th>ID</th>
              <th>USER</th>
              <th>DATE</th>
              <th>TOTAL</th>
              <th>STATUS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order._id}
                  style={{ opacity: order.isCancelled ? 0.7 : 1 }}
                >
                  <td style={{ fontSize: '12px' }}>{order._id}</td>
                  <td>{order.user && order.user.name}</td>
                  <td>{order.createdAt.substring(0, 10)}</td>
                  <td>₱{Number(order.totalPrice).toLocaleString('en-PH')}</td>
                  <td>{getStatusBadge(order)}</td>
                  <td style={{ display: 'flex', gap: '5px' }}>
                    <Button
                      as={Link}
                      to={`/order/${order._id}`}
                      variant='light'
                      className='btn-sm'
                    >
                      Details
                    </Button>
                    <Button
                      variant='danger'
                      className='btn-sm'
                      onClick={() => deleteHandler(order._id)}
                    >
                      <FaTrash style={{ color: 'white' }} />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='6' className='text-center'>
                  No orders found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </>
  );
};

export default OrderListScreen;