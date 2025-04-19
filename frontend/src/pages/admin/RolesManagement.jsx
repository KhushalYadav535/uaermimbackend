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
      const rolesRes = await api.getRoles();
      setRoles(rolesRes.data.roles || []);
      // Temporarily disable permissions until backend is ready
      setPermissions([]);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch roles');
      console.error('Error:', err);
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await api.createRole(formData);
      fetchRolesAndPermissions();
      setShowModal(false);
      setFormData({ name: '', description: '', permissions: [] });
    } catch (err) {
      setError(err.message || 'Failed to create role');
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
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

  if (loading) return <div className="loading">Loading roles...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Roles Management</h1>
        <button className="btn-primary" onClick={() => openModal()}>
          <FiPlus /> Add New Role
        </button>
      </div>

      <div className="roles-grid">
        {(roles || []).map(role => (
          <div key={role.id} className="role-card">
            <div className="role-card-header">
              <h3>{role.name || 'Unnamed Role'}</h3>
              <div className="role-actions">
                <button className="btn-icon" onClick={() => openModal(role)}>
                  <FiEdit2 />
                </button>
                {!['admin', 'user', 'super_admin'].includes(role.name) && (
                  <button className="btn-icon delete" onClick={() => handleDeleteRole(role.id)}>
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </div>
            <p className="role-description">{role.description || 'No description available'}</p>
            <div className="permissions-list">
              <h4>Level: {role.level || 0}</h4>
              {/* Temporarily hide permissions section until backend is ready */}
              {/* <h4>Permissions:</h4>
              {(role.permissions || []).map(permission => (
                <span key={permission.id} className="permission-badge">
                  {permission.name}
                </span>
              ))} */}
            </div>
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
