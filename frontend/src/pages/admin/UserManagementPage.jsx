import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.getUsers({
          page: pagination.page,
          limit: pagination.limit
        });
        setUsers(data.users);
        setPagination(prev => ({
          ...prev,
          total: data.total
        }));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    if (user?.isAdmin) {
      fetchUsers();
    }
  }, [user, pagination.page, pagination.limit]);

  const handleDelete = async (userId) => {
    try {
      setLoading(true);
      await api.deleteUser(userId);
      setUsers(users.filter(user => user._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isAdmin) {
    return <div>Unauthorized</div>;
  }

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-container">
      <h1>User Management</h1>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td>{user._id}</td>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button 
                  className="edit-btn"
                  disabled={loading}
                >
                  {loading ? 'Editing...' : 'Edit'}
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this user?')) {
                      handleDelete(user._id);
                    }
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination-controls">
        <button 
          disabled={pagination.page === 1 || loading}
          onClick={() => setPagination(prev => ({...prev, page: prev.page - 1}))}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {Math.ceil(pagination.total/pagination.limit)}</span>
        <button 
          disabled={pagination.page * pagination.limit >= pagination.total || loading}
          onClick={() => setPagination(prev => ({...prev, page: prev.page + 1}))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
