import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX } from 'react-icons/fi';
import api from '../../services/api';
import './AdminPages.css';

export default function RolesManagement() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        api.getRoles(),
        api.getPermissions()
      ]);
      setRoles(rolesRes.data.roles || []);
      setPermissions(permissionsRes.data.permissions || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch roles and permissions');
      console.error('Error fetching roles and permissions:', err);
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await api.createRole(formData);
      if (response.data?.role) {
        await fetchRolesAndPermissions();
        setShowModal(false);
        setFormData({ name: '', description: '', permissions: [] });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create role');
      console.error('Create role error:', err);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('No role selected for update');
      return;
    }
    try {
      setError('');
      await api.updateRole(selectedRole.id, formData);
      fetchRolesAndPermissions();
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await api.deleteRole(roleId);
        fetchRolesAndPermissions();
      } catch (err) {
        setError(err.message || 'Failed to delete role');
      }
    }
  };

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const openModal = (role = null) => {
    setSelectedRole(role);
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        level: role.level || 0
      });
    } else {
      setFormData({ name: '', description: '', level: 0 });
    }
    setShowModal(true);
  };

  const handleDeleteClick = (roleId) => {
    handleDeleteRole(roleId);
  };

  if (loading) return <div className="loading">Loading roles...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Role Management</h1>
        <div className="header-actions">
          <button 
            className="btn-primary" 
            onClick={() => setShowModal(true)}
            disabled={loading}
          >
            <FiPlus /> Add New Role
          </button>
        </div>
      </div>

      <div className="roles-grid">
        {roles.map(role => (
          <div key={role.id} className="role-card">
            <div className="role-card-header">
              <h3>{role.name}</h3>
              {role.name === 'super_admin' && (
                <span className="super-admin-badge">System Role</span>
              )}
            </div>
            <div className="role-card-body">
              <p>{role.description}</p>
              <div className="permissions-list">
                {role.permissions?.map(permission => (
                  <span 
                    key={permission} 
                    className={`permission-badge ${permissions.includes(permission) ? '' : 'inactive'}`}
                    title={permissions.includes(permission) ? permission : 'Permission no longer available'}
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
            <div className="role-card-actions">
              <button
                className="btn-icon"
                onClick={() => handleEditClick(role)}
                disabled={role.name === 'super_admin' || loading}
                title={role.name === 'super_admin' ? 'Cannot edit system role' : 'Edit role'}
              >
                <FiEdit2 />
              </button>
              <button
                className="btn-icon delete"
                onClick={() => handleDeleteClick(role.id)}
                disabled={role.name === 'super_admin' || loading || role.users_count > 0}
                title={
                  role.name === 'super_admin' ? 'Cannot delete system role' :
                  role.users_count > 0 ? 'Cannot delete role with assigned users' :
                  'Delete role'
                }
              >
                <FiTrash2 />
              </button>
            </div>
            {role.users_count > 0 && (
              <div className="role-card-footer">
                <span className="users-count">{role.users_count} user{role.users_count !== 1 ? 's' : ''} assigned</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{selectedRole ? 'Edit Role' : 'Create New Role'}</h2>
            <form onSubmit={selectedRole ? handleUpdateRole : handleCreateRole}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Permissions</label>
                <div className="permissions-grid">
                  {permissions.map(permission => (
                    <div
                      key={permission.id}
                      className={`permission-item ${formData.permissions.includes(permission.id) ? 'selected' : ''}`}
                      onClick={() => togglePermission(permission.id)}
                    >
                      {formData.permissions.includes(permission.id) ? <FiCheck /> : <FiX />}
                      <span>{permission.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
