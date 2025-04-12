import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function RoleManagementPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data } = await api.getRoles({
          page: pagination.page,
          limit: pagination.limit
        });
        setRoles(data.roles);
        setPagination(prev => ({
          ...prev,
          total: data.total
        }));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch roles');
      } finally {
        setLoading(false);
      }
    };

    if (user?.isAdmin) {
      fetchRoles();
    }
  }, [user, pagination.page, pagination.limit]);

  const handleDelete = async (roleId) => {
    try {
      setLoading(true);
      await api.deleteRole(roleId);
      setRoles(roles.filter(role => role._id !== roleId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isAdmin) {
    return <div>Unauthorized</div>;
  }

  if (loading) {
    return <div>Loading roles...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-container">
      <h1>Role Management</h1>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Permissions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(role => (
            <tr key={role._id}>
              <td>{role._id}</td>
              <td>{role.name}</td>
              <td>{role.permissions.join(', ')}</td>
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
                    if (window.confirm('Are you sure you want to delete this role?')) {
                      handleDelete(role._id);
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
