import Message from '../../components/Message';
import Loader from '../../components/Loader';
import { useGetLockedAccountsQuery, useUnlockAccountMutation } from '../../slices/usersApiSlice';
import { toast } from 'react-toastify';
import { FaUnlock } from 'react-icons/fa';

const LockedAccountsScreen = () => {
  const { data: users, refetch, isLoading, error } = useGetLockedAccountsQuery();
  const [unlockAccount] = useUnlockAccountMutation();

  const handleUnlock = async (userId, userName) => {
    if (window.confirm(`Unlock account for ${userName}?`)) {
      try {
        await unlockAccount(userId).unwrap();
        toast.success(`Account unlocked for ${userName}`);
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  return (
    <div>
      <h1 style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '24px', marginBottom: '24px' }}>
        🔒 Locked Accounts
      </h1>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : users?.length === 0 ? (
        <Message variant='info'>No locked accounts at the moment.</Message>
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
                {['#', 'Name', 'Email', 'Failed Attempts', 'Locked Until', 'Actions'].map((h) => (
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
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      backgroundColor: 'rgba(231,76,60,0.15)', color: '#e74c3c',
                      borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: '700',
                    }}>
                      {user.loginAttempts} attempts
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {user.lockUntil ? new Date(user.lockUntil).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => handleUnlock(user._id, user.name)}
                      style={{
                        backgroundColor: '#27ae60', color: '#fff', border: 'none',
                        borderRadius: '6px', padding: '4px 12px', fontSize: '12px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      <FaUnlock size={11} /> Unlock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LockedAccountsScreen;