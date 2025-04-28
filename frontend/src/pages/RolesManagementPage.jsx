import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaEdit, FaTrash, FaPlus, FaCheck, FaTimes, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/RolesManagement.css';

const RolesManagementPage = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new role
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: []
  });

  // Available permissions
  const availablePermissions = [
    'CREATE_USER',
    'EDIT_USER',
    'DELETE_USER',
    'VIEW_USERS',
    'CREATE_ROLE',
    'EDIT_ROLE',
    'DELETE_ROLE',
    'VIEW_ROLES',
    'VIEW_LOGS',
    'MANAGE_SETTINGS'
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

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
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newRole)
      });
      
      if (!response.ok) throw new Error('Failed to create role');
      
      await fetchRoles(); // Refresh role list
      setNewRole({ name: '', description: '', permissions: [] });
      showSuccessMessage('Role created successfully!');
      setIsSubmitting(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdateRole = async (roleId, updates) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update role');
      
      await fetchRoles(); // Refresh role list
      setIsEditModalOpen(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete role');
      
      await fetchRoles(); // Refresh role list
    } catch (error) {
      setError(error.message);
    }
  };

  const handlePermissionChange = (permission, isNewRole = true) => {
    if (isNewRole) {
      const updatedPermissions = newRole.permissions.includes(permission)
        ? newRole.permissions.filter(p => p !== permission)
        : [...newRole.permissions, permission];
      setNewRole({ ...newRole, permissions: updatedPermissions });
    } else {
      const updatedPermissions = selectedRole.permissions.includes(permission)
        ? selectedRole.permissions.filter(p => p !== permission)
        : [...selectedRole.permissions, permission];
      setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    toast.success(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showErrorMessage = (message) => {
    setError(message);
    toast.error(message);
    setTimeout(() => setError(null), 3000);
  };

  return (
    <div className="roles-management-container">
      <div className="page-header">
        <h1><FaShieldAlt className="header-icon" /> Role Management</h1>
        {successMessage && <div className="success-message">{successMessage}</div>}
        {error && <div className="error-message">{error}</div>}
      </div>
      
      {/* Create Role Form */}
      <div className="create-role-section">
        <h2><FaPlus className="section-icon" /> Create New Role</h2>
        <form onSubmit={handleCreateRole} className="create-role-form" disabled={isSubmitting}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Role Name"
              value={newRole.name}
              onChange={(e) => setNewRole({...newRole, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Role Description"
              value={newRole.description}
              onChange={(e) => setNewRole({...newRole, description: e.target.value})}
              required
            />
          </div>
          <div className="permissions-group">
            <h3>Permissions</h3>
            <div className="permissions-grid">
              {availablePermissions.map(permission => (
                <label key={permission} className="permission-checkbox">
                  <input
                    type="checkbox"
                    checked={newRole.permissions.includes(permission)}
                    onChange={() => handlePermissionChange(permission)}
                  />
                  {permission.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
          </div>
          <button 
            type="submit" 
            className="btn-create" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Creating...
              </>
            ) : (
              <>
                <FaPlus className="button-icon" />
                Create Role
              </>
            )}
          </button>
        </form>
      </div>

      {/* Roles List */}
      <div className="roles-list-section">
        <h2>Roles List</h2>
        <div className="roles-grid">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id} className="role-row">
                  <td>
                    <div className="role-name">
                      <FaShieldAlt className="role-icon" />
                      {role.name}
                    </div>
                  </td>
                  <td>{role.description}</td>
                  <td>
                    <div className="permissions-tags">
                      {role.permissions.map(permission => (
                        <span key={permission} className="permission-tag">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedRole(role);
                        setIsEditModalOpen(true);
                      }}
                      className="btn-edit"
                      disabled={role.name === 'super_admin'} // Can't edit super_admin role
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="btn-delete"
                      disabled={role.name === 'super_admin'} // Can't delete super_admin role
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

      {/* Edit Role Modal */}
      {isEditModalOpen && selectedRole && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Role</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateRole(selectedRole.id, selectedRole);
            }}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Role Name"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({
                    ...selectedRole,
                    name: e.target.value
                  })}
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="Role Description"
                  value={selectedRole.description}
                  onChange={(e) => setSelectedRole({
                    ...selectedRole,
                    description: e.target.value
                  })}
                />
              </div>
              <div className="permissions-group">
                <h3>Permissions</h3>
                <div className="permissions-grid">
                  {availablePermissions.map(permission => (
                    <label key={permission} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedRole.permissions.includes(permission)}
                        onChange={() => handlePermissionChange(permission, false)}
                      />
                      {permission.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
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

export default RolesManagementPage;
