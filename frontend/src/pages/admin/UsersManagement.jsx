import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiUserPlus, FiLock, FiUnlock, FiShield } from 'react-icons/fi';
import api from '../../services/api';
import './AdminPages.css';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'user',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data.users || []);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.register(formData);
      fetchUsers();
      setShowModal(false);
      setFormData({ email: '', first_name: '', last_name: '', role: 'user', password: '' });
    } catch (err) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.updateUser(selectedUser.id, formData);
      fetchUsers();
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.deleteUser(userId);
        fetchUsers();
      } catch (err) {
        setError(err.message || 'Failed to delete user');
      }
    }
  };

  const handleUpdateRole = async (userId, role) => {
    try {
      await api.updateUserRole(userId, role);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.updateUser(userId, { status: currentStatus === 'active' ? 'inactive' : 'active' });
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    if (user) {
      setFormData({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.Roles?.[0]?.name || 'user'
      });
    } else {
      setFormData({ email: '', first_name: '', last_name: '', role: 'user', password: '' });
    }
    setShowModal(true);
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Users Management</h1>
        <button className="btn-primary" onClick={() => openModal('create')}>
          <FiUserPlus /> Add New User
        </button>
      </div>

      <div className="users-grid">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <div className="user-card-header">
              <h3>{user.first_name || ''} {user.last_name || ''}</h3>
              <span className={`status-badge ${user.status || 'inactive'}`}>{user.status || 'inactive'}</span>
            </div>
            <div className="user-card-body">
              <p>{user.email}</p>
              <div className="role-badges">
                {(user.Roles || []).map(role => (
                  <span key={role.id} className="role-badge">{role.name}</span>
                ))}
              </div>
            </div>
            <div className="user-card-actions">
              <button className="btn-icon" onClick={() => openModal('edit', user)}>
                <FiEdit2 />
              </button>
              <button className="btn-icon" onClick={() => handleToggleStatus(user.id, user.status)}>
                {user.status === 'active' ? <FiLock /> : <FiUnlock />}
              </button>
              <button className="btn-icon" onClick={() => handleUpdateRole(user.id, (user.Roles || [])[0]?.name === 'admin' ? 'user' : 'admin')}>
                <FiShield />
              </button>
              <button className="btn-icon delete" onClick={() => handleDeleteUser(user.id)}>
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{modalType === 'create' ? 'Create New User' : 'Edit User'}</h2>
            <form onSubmit={modalType === 'create' ? handleCreateUser : handleUpdateUser}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              {modalType === 'create' && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {modalType === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
