import { useState } from 'react';
import { Badge, Button, Modal, Form, ListGroup } from 'react-bootstrap';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { FaPaperPlane } from 'react-icons/fa';
import {
  useGetMyRequestsQuery,
  useUserReplyToRequestMutation,
  useMarkReplySeenMutation,
} from '../slices/productsApiSlice';

const UserRequestScreen = () => {
  const { data: requests, isLoading, error, refetch } = useGetMyRequestsQuery();
  const [userReply, { isLoading: loadingReply }] = useUserReplyToRequestMutation();
  const [markSeen] = useMarkReplySeenMutation();

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  const handleView = async (request) => {
    setSelectedRequest(request);
    setShowModal(true);
    setReplyMessage('');
    if (request.hasNewReply) {
      await markSeen(request._id);
      refetch();
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) return;
    try {
      await userReply({
        id: selectedRequest._id,
        message: replyMessage,
      }).unwrap();
      setReplyMessage('');
      refetch();
      const res = await fetch('/api/products/my-requests', {
        headers: { credentials: 'include' },
      });
      const data = await res.json();
      const updated = data.find((r) => r._id === selectedRequest._id);
      if (updated) setSelectedRequest(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 className='my-4'>📬 My Requests</h2>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : requests?.length === 0 ? (
        <Message>You have no requests yet.</Message>
      ) : (
        <ListGroup>
          {requests.map((r) => (
            <ListGroup.Item
              key={r._id}
              style={{
                backgroundColor: r.hasNewReply ? '#e8f5e9' : '#fff',
                borderLeft: r.hasNewReply ? '4px solid #28a745' : '4px solid transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{r.productName}</strong>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                    {r.message || 'No message'}
                  </div>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <Badge bg={r.status === 'available' ? 'success' : 'warning'}>
                      {r.status === 'available' ? '✅ Available' : '⏳ Pending'}
                    </Badge>
                    {r.replies?.length > 0 && (
                      <Badge bg='info'>💬 {r.replies.length} replies</Badge>
                    )}
                    {r.hasNewReply && (
                      <Badge bg='success'>🔔 New Reply!</Badge>
                    )}
                  </div>
                  <small style={{ color: '#aaa' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-PH')}
                  </small>
                </div>
                <Button
                  size='sm'
                  variant={r.hasNewReply ? 'success' : 'outline-primary'}
                  onClick={() => handleView(r)}
                >
                  {r.hasNewReply ? '🔔 View Reply' : 'Open Chat'}
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {/* CHAT MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>💬 {selectedRequest?.productName}</Modal.Title>
        </Modal.Header>
        {selectedRequest && (
          <Modal.Body>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '70%',
                  backgroundColor: '#0d6efd',
                  color: '#fff',
                  borderRadius: '12px 12px 0 12px',
                  padding: '10px 14px',
                }}>
                  <small style={{ fontWeight: 'bold', color: '#cce' }}>You</small>
                  <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
                    {selectedRequest.message || 'No message'}
                  </p>
                  <small style={{ fontSize: '11px', color: '#cce' }}>
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
                    justifyContent: reply.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    backgroundColor: reply.sender === 'user' ? '#0d6efd' : '#fff',
                    color: reply.sender === 'user' ? '#fff' : '#000',
                    border: reply.sender === 'user' ? 'none' : '1px solid #dee2e6',
                    borderRadius: reply.sender === 'user'
                      ? '12px 12px 0 12px'
                      : '12px 12px 12px 0',
                    padding: '10px 14px',
                  }}>
                    <small style={{
                      fontWeight: 'bold',
                      color: reply.sender === 'user' ? '#cce' : '#0d6efd',
                    }}>
                      {reply.sender === 'user' ? 'You' : '👤 Admin'}
                    </small>
                    <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
                      {reply.message}
                    </p>
                    <small style={{
                      fontSize: '11px',
                      color: reply.sender === 'user' ? '#cce' : '#aaa',
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
                placeholder='Type your message...'
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

export default UserRequestScreen;