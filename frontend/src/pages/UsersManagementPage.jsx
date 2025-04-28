import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaEdit, FaTrash, FaUserShield } from 'react-icons/fa';
import '../styles/UsersManagement.css';

const UsersManagementPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for new user
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roleId: '',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newUser)
      });
      
      if (!response.ok) throw new Error('Failed to create user');
      
      await fetchUsers(); // Refresh user list
      setNewUser({ firstName: '', lastName: '', email: '', roleId: '', password: '' });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update user');
      
      await fetchUsers(); // Refresh user list
      setIsEditModalOpen(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete user');
      
      await fetchUsers(); // Refresh user list
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdateRole = async (userId, roleId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ roleId })
      });
      
      if (!response.ok) throw new Error('Failed to update user role');
      
      await fetchUsers(); // Refresh user list
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="users-management-container">
      <h1>User Management</h1>
      
      {/* Create User Form */}
      <div className="create-user-section">
        <h2>Create New User</h2>
        <form onSubmit={handleCreateUser} className="create-user-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="First Name"
              value={newUser.firstName}
              onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Last Name"
              value={newUser.lastName}
              onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <select
              value={newUser.roleId}
              onChange={(e) => setNewUser({...newUser, roleId: e.target.value})}
              required
            >
              <option value="">Select Role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn-create">Create User</button>
        </form>
      </div>

      {/* Users List */}
      <div className="users-list-section">
        <h2>Users List</h2>
        <div className="users-grid">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{`${user.firstName} ${user.lastName}`}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.roles[0]?.id || ''}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      disabled={user.id === user?.id} // Can't change own role
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setIsEditModalOpen(true);
                      }}
                      className="btn-edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="btn-delete"
                      disabled={user.id === user?.id} // Can't delete self
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit User</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateUser(selectedUser.id, selectedUser);
            }}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="First Name"
                  value={selectedUser.firstName}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    firstName: e.target.value
                  })}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Last Name"
                  value={selectedUser.lastName}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    lastName: e.target.value
                  })}
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    email: e.target.value
                  })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-save">Save</button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagementPage;
