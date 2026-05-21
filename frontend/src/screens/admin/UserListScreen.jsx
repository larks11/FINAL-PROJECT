import { useState } from 'react';
import { Button, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { FaTrash, FaEdit, FaSearch } from 'react-icons/fa';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { useDeleteUserMutation, useGetUsersQuery } from '../../slices/usersApiSlice';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const UserListScreen = () => {
  const { data: users, refetch, isLoading, error } = useGetUsersQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [searchTerm, setSearchTerm] = useState('');

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const filteredUsers = users?.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const adminCount = users?.filter((u) => u.isAdmin).length || 0;
  const userCount  = users?.filter((u) => !u.isAdmin).length || 0;

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '24px', margin: 0 }}>
          👥 Users
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{
            backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '4px 14px', fontSize: '12px',
            fontWeight: '700', color: 'var(--text-muted)',
          }}>
            👑 {adminCount} Admin{adminCount !== 1 ? 's' : ''}
          </span>
          <span style={{
            backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '4px 14px', fontSize: '12px',
            fontWeight: '700', color: 'var(--text-muted)',
          }}>
            👤 {userCount} User{userCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* SEARCH */}
      <Row className='mb-3'>
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              type='text'
              placeholder='Search by name or email...'
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
              {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''} found
            </span>
          )}
        </Col>
      </Row>

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
                  {['#', 'Name', 'Email', 'Role', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <tr key={user._id}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-soft)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontWeight: '600' }}>
                        {user.name}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <a href={`mailto:${user.email}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '13px' }}>
                          {user.email}
                        </a>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          backgroundColor: user.isAdmin ? 'rgba(212,175,55,0.15)' : 'var(--bg-soft)',
                          color: user.isAdmin ? 'var(--accent)' : 'var(--text-muted)',
                          border: `1px solid ${user.isAdmin ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: '20px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: '700',
                        }}>
                          {user.isAdmin ? '👑 Admin' : '👤 User'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {!user.isAdmin && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Link to={`/admin/user/${user._id}/edit`} style={{
                              backgroundColor: 'transparent',
                              color: 'var(--accent)',
                              border: '1px solid var(--accent)',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: '700',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}>
                              <FaEdit size={11} /> Edit
                            </Link>
                            <button
                              onClick={() => deleteHandler(user._id)}
                              style={{
                                backgroundColor: '#e74c3c',
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
                              <FaTrash size={11} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan='5' style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {searchTerm ? `No users found matching "${searchTerm}"` : 'No users yet'}
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

export default UserListScreen;