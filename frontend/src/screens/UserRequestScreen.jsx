import { useState } from 'react';
import { Modal } from 'react-bootstrap';
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
      <h2 style={{ color: 'var(--accent)', margin: '24px 0' }}>📬 My Requests</h2>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : requests?.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px 20px',
          color: 'var(--text-muted)',
          fontSize: '15px',
        }}>
          You have no requests yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map((r) => (
            <div
              key={r._id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: r.hasNewReply ? '4px solid var(--accent)' : '4px solid transparent',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div>
                <strong style={{ color: 'var(--text-main)', fontSize: '15px' }}>{r.productName}</strong>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {r.message || 'No message'}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    backgroundColor: r.status === 'available' ? '#2ecc71' : 'var(--accent)',
                    color: '#fff',
                    borderRadius: '20px',
                    padding: '2px 10px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    {r.status === 'available' ? '✅ Available' : '⏳ Pending'}
                  </span>
                  {r.replies?.length > 0 && (
                    <span style={{
                      backgroundColor: 'var(--bg-soft)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent)',
                      borderRadius: '20px',
                      padding: '2px 10px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      💬 {r.replies.length} replies
                    </span>
                  )}
                  {r.hasNewReply && (
                    <span style={{
                      backgroundColor: '#2ecc71',
                      color: '#fff',
                      borderRadius: '20px',
                      padding: '2px 10px',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}>
                      🔔 New Reply!
                    </span>
                  )}
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px', display: 'block' }}>
                  {new Date(r.createdAt).toLocaleDateString('en-PH')}
                </small>
              </div>
              <button
                onClick={() => handleView(r)}
                style={{
                  backgroundColor: r.hasNewReply ? 'var(--accent)' : 'transparent',
                  color: r.hasNewReply ? 'var(--btn-text)' : 'var(--accent)',
                  border: '2px solid var(--accent)',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--btn-text)';
                }}
                onMouseLeave={(e) => {
                  if (!r.hasNewReply) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--accent)';
                  }
                }}
              >
                {r.hasNewReply ? '🔔 View Reply' : 'Open Chat'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CHAT MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size='lg'>
        <Modal.Header closeButton style={{ backgroundColor: 'var(--bg-card)', borderBottom: '2px solid var(--accent)' }}>
          <Modal.Title style={{ color: 'var(--accent)', fontWeight: '800' }}>
            💬 {selectedRequest?.productName}
          </Modal.Title>
        </Modal.Header>
        {selectedRequest && (
          <Modal.Body style={{ backgroundColor: 'var(--bg-card)' }}>
            <div style={{
              height: '350px',
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px',
              backgroundColor: 'var(--bg-soft)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '70%',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--btn-text)',
                  borderRadius: '12px 12px 0 12px',
                  padding: '10px 14px',
                }}>
                  <small style={{ fontWeight: 'bold', opacity: 0.8 }}>You</small>
                  <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
                    {selectedRequest.message || 'No message'}
                  </p>
                  <small style={{ fontSize: '11px', opacity: 0.7 }}>
                    {new Date(selectedRequest.createdAt).toLocaleString('en-PH')}
                  </small>
                </div>
              </div>

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
                    backgroundColor: reply.sender === 'user' ? 'var(--accent)' : 'var(--bg-card)',
                    color: reply.sender === 'user' ? 'var(--btn-text)' : 'var(--text-main)',
                    border: reply.sender === 'user' ? 'none' : '1px solid var(--border)',
                    borderRadius: reply.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    padding: '10px 14px',
                  }}>
                    <small style={{
                      fontWeight: 'bold',
                      opacity: reply.sender === 'user' ? 0.8 : 1,
                      color: reply.sender === 'user' ? 'var(--btn-text)' : 'var(--accent)',
                    }}>
                      {reply.sender === 'user' ? 'You' : '👤 Admin'}
                    </small>
                    <p style={{ margin: '4px 0 0', fontSize: '14px' }}>{reply.message}</p>
                    <small style={{
                      fontSize: '11px',
                      opacity: 0.7,
                      color: reply.sender === 'user' ? 'var(--btn-text)' : 'var(--text-muted)',
                    }}>
                      {new Date(reply.createdAt).toLocaleString('en-PH')}
                    </small>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input
                type='text'
                placeholder='Type your message...'
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-soft)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleReply}
                disabled={loadingReply || !replyMessage.trim()}
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--btn-text)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: loadingReply || !replyMessage.trim() ? 'not-allowed' : 'pointer',
                  opacity: loadingReply || !replyMessage.trim() ? 0.5 : 1,
                  fontSize: '16px',
                  transition: 'opacity 0.2s',
                }}
              >
                <FaPaperPlane />
              </button>
            </div>
          </Modal.Body>
        )}
        <Modal.Footer style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowModal(false)}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 20px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserRequestScreen;