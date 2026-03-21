import { useState } from 'react';
import { Table, Badge, Button, Modal } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { FaTrash } from 'react-icons/fa';
import {
  useGetRequestsQuery,
  useMarkRequestReadMutation,
} from '../slices/productsApiSlice';
import { useSelector } from 'react-redux';

const AdminRequestScreen = () => {
  const { data: requests, isLoading, error, refetch } = useGetRequestsQuery();
  const [markRead] = useMarkRequestReadMutation();
  const { userInfo } = useSelector((state) => state.auth);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleView = async (request) => {
    setSelectedRequest(request);
    setShowModal(true);
    if (!request.isRead) {
      await markRead(request._id);
      refetch();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await fetch(`/api/products/requests/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        refetch();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Delete ALL requests? This cannot be undone.')) {
      try {
        await fetch(`/api/products/requests/all`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        refetch();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className='my-4'>🔔 Product Requests</h2>
        {requests?.length > 0 && (
          <Button
            variant='danger'
            size='sm'
            onClick={handleDeleteAll}
          >
            <FaTrash /> Delete All
          </Button>
        )}
      </div>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : requests.length === 0 ? (
        <Message>No requests yet.</Message>
      ) : (
        <Table striped bordered hover responsive>
          <thead style={{ backgroundColor: '#0d6efd', color: '#fff' }}>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Product</th>
              <th>Message</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr
                key={r._id}
                style={{
                  backgroundColor: !r.isRead ? '#fff8e1' : '#fff',
                  fontWeight: !r.isRead ? 'bold' : 'normal',
                }}
              >
                <td>{r.user?.name}</td>
                <td>{r.user?.email}</td>
                <td>{r.productName}</td>
                <td style={{
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {r.message || '—'}
                </td>
                <td>
                  <Badge bg={r.status === 'available' ? 'success' : 'warning'}>
                    {r.status === 'available' ? '✅ Available' : '⏳ Pending'}
                  </Badge>
                  {!r.isRead && (
                    <Badge bg='danger' style={{ marginLeft: '5px' }}>NEW</Badge>
                  )}
                </td>
                <td>{new Date(r.createdAt).toLocaleDateString('en-PH')}</td>
                <td style={{ display: 'flex', gap: '5px' }}>
                  <Button
                    size='sm'
                    variant='outline-primary'
                    onClick={() => handleView(r)}
                  >
                    View
                  </Button>
                  <Button
                    size='sm'
                    variant='danger'
                    onClick={() => handleDelete(r._id)}
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Request Details</Modal.Title>
        </Modal.Header>
        {selectedRequest && (
          <Modal.Body>
            <p><strong>User:</strong> {selectedRequest.user?.name}</p>
            <p><strong>Email:</strong> {selectedRequest.user?.email}</p>
            <p><strong>Product:</strong> {selectedRequest.productName}</p>
            <p><strong>Stock:</strong>{' '}
              {selectedRequest.product?.countInStock > 0
                ? `${selectedRequest.product.countInStock} in stock`
                : 'Out of stock'}
            </p>
            <p><strong>Status:</strong>{' '}
              <Badge bg={selectedRequest.status === 'available' ? 'success' : 'warning'}>
                {selectedRequest.status === 'available' ? '✅ Available' : '⏳ Pending'}
              </Badge>
            </p>
            <p><strong>Message:</strong></p>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '12px',
              minHeight: '60px',
            }}>
              {selectedRequest.message || 'No message provided.'}
            </div>
            <p className='mt-2 text-muted' style={{ fontSize: '12px' }}>
              Sent: {new Date(selectedRequest.createdAt).toLocaleString('en-PH')}
            </p>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminRequestScreen;