import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    emailVerified: '',
    registrationDateFrom: '',
    registrationDateTo: '',
    lastLoginFrom: '',
    lastLoginTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.getUsers({
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          ...filters
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
  }, [user, pagination.page, pagination.limit, searchTerm, filters]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setLoading(true);
      await api.updateUserRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      setLoading(true);
      await api.deactivateUser(userId);
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: false } : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      setLoading(true);
      await api.resetUserPassword(userId);
      // Show success message
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      await api.deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updateUser(editingUser._id, editingUser);
      setUsers(users.map(u => (u._id === editingUser._id ? editingUser : u)));
      setShowEditModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
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
      
      {/* Search and Filters */}
      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={filters.role}
          onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={filters.emailVerified}
          onChange={(e) => setFilters(prev => ({ ...prev, emailVerified: e.target.value }))}
          className="filter-select"
        >
          <option value="">Email Verification</option>
          <option value="true">Verified</option>
          <option value="false">Not Verified</option>
        </select>

        <div className="date-filters">
          <input
            type="date"
            value={filters.registrationDateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, registrationDateFrom: e.target.value }))}
            placeholder="Registration From"
            className="date-input"
          />
          <input
            type="date"
            value={filters.registrationDateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, registrationDateTo: e.target.value }))}
            placeholder="Registration To"
            className="date-input"
          />
          <input
            type="date"
            value={filters.lastLoginFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, lastLoginFrom: e.target.value }))}
            placeholder="Last Login From"
            className="date-input"
          />
          <input
            type="date"
            value={filters.lastLoginTo}
            onChange={(e) => setFilters(prev => ({ ...prev, lastLoginTo: e.target.value }))}
            placeholder="Last Login To"
            className="date-input"
          />
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Email Verified</th>
            <th>Registration Date</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  disabled={loading}
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>{user.emailVerified ? 'Yes' : 'No'}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
              <td className="action-buttons">
                <button
                  className="action-btn"
                  onClick={() => handleDeactivate(user._id)}
                  disabled={loading}
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleResetPassword(user._id)}
                  disabled={loading}
                >
                  Reset Password
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleEditUser(user)}
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleDeleteUser(user._id)}
                  disabled={loading}
                >
                  Delete
                </button>
                {user.twoFactorEnabled && (
                  <button
                    className="action-btn"
                    onClick={() => handleReset2FA(user._id)}
                    disabled={loading}
                  >
                    Reset 2FA
                  </button>
                )}
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

      {showEditModal && (
        <div className="modal">
          <h2>Edit User</h2>
          <form onSubmit={handleEditSubmit}>
            <input
              type="text"
              value={editingUser.firstName}
              onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
              placeholder="First Name"
              required
            />
            <input
              type="text"
              value={editingUser.lastName}
              onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
              placeholder="Last Name"
              required
            />
            <input
              type="email"
              value={editingUser.email}
              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              placeholder="Email"
              required
            />
            <button type="submit">Save Changes</button>
            <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
}
