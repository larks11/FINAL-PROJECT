import { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import {
  useGetPasswordResetRequestsQuery,
  useAdminResetPasswordMutation,
  useAdminRejectPasswordResetMutation,
} from '../../slices/usersApiSlice';
import { toast } from 'react-toastify';
import { FaCheck, FaTimes } from 'react-icons/fa';

const PasswordResetRequestsScreen = () => {
  const { data: users, refetch, isLoading, error } = useGetPasswordResetRequestsQuery();
  const [adminResetPassword] = useAdminResetPasswordMutation();
  const [adminRejectPasswordReset] = useAdminRejectPasswordResetMutation();

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const openResetModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowModal(true);
  };

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await adminResetPassword({ userId: selectedUser._id, newPassword }).unwrap();
      toast.success(`Password reset for ${selectedUser.name}`);
      setShowModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleReject = async (userId, userName) => {
    if (window.confirm(`Reject password reset request for ${userName}?`)) {
      try {
        await adminRejectPasswordReset(userId).unwrap();
        toast.success('Request rejected');
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  return (
    <div>
      <h1 style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '24px', marginBottom: '24px' }}>
        🔑 Password Reset Requests
      </h1>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : users?.length === 0 ? (
        <Message variant='info'>No pending password reset requests.</Message>
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-soft)', borderBottom: '2px solid var(--accent)' }}>
                {['#', 'Name', 'Email', 'Requested At', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '600' }}>{user.name}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--accent)' }}>{user.email}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {new Date(user.passwordResetRequest.requestedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => openResetModal(user)}
                        style={{
                          backgroundColor: '#27ae60', color: '#fff', border: 'none',
                          borderRadius: '6px', padding: '4px 10px', fontSize: '12px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        <FaCheck size={11} /> Approve & Reset
                      </button>
                      <button
                        onClick={() => handleReject(user._id, user.name)}
                        style={{
                          backgroundColor: '#e74c3c', color: '#fff', border: 'none',
                          borderRadius: '6px', padding: '4px 10px', fontSize: '12px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        <FaTimes size={11} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password — {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: '13px', color: '#666' }}>
            Set a new password for <strong>{selectedUser?.email}</strong>. The user will be notified.
          </p>
          <Form.Group>
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type='password'
              placeholder='Enter new password (min 6 chars)'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant='success' onClick={handleReset}>Confirm Reset</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PasswordResetRequestsScreen;