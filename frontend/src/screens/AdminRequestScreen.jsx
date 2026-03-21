import { useState } from 'react';
import { Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { FaTrash, FaPaperPlane } from 'react-icons/fa';
import {
  useGetRequestsQuery,
  useMarkRequestReadMutation,
  useReplyToRequestMutation,
} from '../slices/productsApiSlice';
import { useSelector } from 'react-redux';

const AdminRequestScreen = () => {
  const { data: requests, isLoading, error, refetch } = useGetRequestsQuery();
  const [markRead] = useMarkRequestReadMutation();
  const [replyToRequest, { isLoading: loadingReply }] = useReplyToRequestMutation();
  const { userInfo } = useSelector((state) => state.auth);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  const handleView = async (request) => {
    setSelectedRequest(request);
    setShowModal(true);
    setReplyMessage('');
    if (!request.isRead) {
      await markRead(request._id);
      refetch();
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) return;
    try {
      await replyToRequest({
        id: selectedRequest._id,
        message: replyMessage,
      }).unwrap();
      setReplyMessage('');
      refetch();
      const updated = await fetch(`/api/products/requests`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      const data = await updated.json();
      const updatedRequest = data.find((r) => r._id === selectedRequest._id);
      if (updatedRequest) setSelectedRequest(updatedRequest);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await fetch(`/api/products/requests/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setShowModal(false);
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
          headers: { Authorization: `Bearer ${userInfo.token}` },
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
          <Button variant='danger' size='sm' onClick={handleDeleteAll}>
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
                  {r.replies?.length > 0 && (
                    <Badge bg='info' style={{ marginLeft: '5px' }}>
                      💬 {r.replies.length}
                    </Badge>
                  )}
                </td>
                <td>{new Date(r.createdAt).toLocaleDateString('en-PH')}</td>
                <td style={{ display: 'flex', gap: '5px' }}>
                  <Button size='sm' variant='outline-primary' onClick={() => handleView(r)}>
                    Chat
                  </Button>
                  <Button size='sm' variant='danger' onClick={() => handleDelete(r._id)}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* CHAT MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>
            💬 Chat — {selectedRequest?.productName}
          </Modal.Title>
        </Modal.Header>
        {selectedRequest && (
          <Modal.Body>
            <div style={{ marginBottom: '10px' }}>
              <small className='text-muted'>
                User: <strong>{selectedRequest.user?.name}</strong> ({selectedRequest.user?.email})
              </small>
            </div>

            {/* CHAT MESSAGES */}
            <div style={{
              height: '350px',
              overflowY: 'auto',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {/* Original message */}
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  maxWidth: '70%',
                  backgroundColor: '#fff',
                  border: '1px solid #dee2e6',
                  borderRadius: '12px 12px 12px 0',
                  padding: '10px 14px',
                }}>
                  <small style={{ color: '#0d6efd', fontWeight: 'bold' }}>
                    {selectedRequest.user?.name}
                  </small>
                  <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
                    {selectedRequest.message || 'No message'}
                  </p>
                  <small style={{ color: '#aaa', fontSize: '11px' }}>
                    {new Date(selectedRequest.createdAt).toLocaleString('en-PH')}
                  </small>
                </div>
              </div>

              {/* Replies */}
              {selectedRequest.replies?.map((reply, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: reply.sender === 'admin' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    backgroundColor: reply.sender === 'admin' ? '#0d6efd' : '#fff',
                    color: reply.sender === 'admin' ? '#fff' : '#000',
                    border: reply.sender === 'admin' ? 'none' : '1px solid #dee2e6',
                    borderRadius: reply.sender === 'admin'
                      ? '12px 12px 0 12px'
                      : '12px 12px 12px 0',
                    padding: '10px 14px',
                  }}>
                    <small style={{
                      fontWeight: 'bold',
                      color: reply.sender === 'admin' ? '#cce' : '#0d6efd',
                    }}>
                      {reply.sender === 'admin' ? '👤 Admin' : reply.senderName}
                    </small>
                    <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
                      {reply.message}
                    </p>
                    <small style={{
                      fontSize: '11px',
                      color: reply.sender === 'admin' ? '#cce' : '#aaa',
                    }}>
                      {new Date(reply.createdAt).toLocaleString('en-PH')}
                    </small>
                  </div>
                </div>
              ))}
            </div>

            {/* REPLY INPUT */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <Form.Control
                type='text'
                placeholder='Type your reply...'
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
              />
              <Button
                variant='primary'
                onClick={handleReply}
                disabled={loadingReply || !replyMessage.trim()}
              >
                <FaPaperPlane />
              </Button>
            </div>
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