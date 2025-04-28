import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserShield, FaCog, FaChartBar, FaBell, FaSearch, FaEllipsisV, FaUserPlus, FaBars, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import apiService from '../services/api';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    newUsersToday: 0
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [recentUsers, setRecentUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const statsResponse = await apiService.get('/admin/dashboard');
        const usersResponse = await apiService.get('/admin/users', { params: { limit: 5 } });

        setStats({
          totalUsers: statsResponse.data.stats.totalUsers,
          activeUsers: statsResponse.data.stats.activeUsers,
          totalRoles: statsResponse.data.stats.totalRoles,
          newUsersToday: statsResponse.data.stats.newUsersToday
        });

        setRecentUsers(usersResponse.data.users.map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.roles[0]?.name || 'N/A',
          status: user.status
        })));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleViewAllUsers = () => {
    navigate('/admin/users');
  };

  const handleAddNewUser = () => {
    navigate('/admin/users/new');
  };

  const handleManageRoles = () => {
    navigate('/admin/roles');
  };

  return (
    <div className="dashboard-container">
      {/* Mobile Menu Toggle */}
      {isMobile && (
        <button 
          className="menu-toggle"
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 1001,
            background: 'none',
            border: 'none',
            color: '#3498db',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          <FaBars />
        </button>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          <ul className="nav-item">
            <li>
              <Link to="/admin/dashboard" className="nav-link active">
                <FaChartBar /> Overview
              </Link>
            </li>
            <li>
              <Link to="/admin/users" className="nav-link">
                <FaUsers /> Users
              </Link>
            </li>
            <li>
              <Link to="/admin/roles" className="nav-link">
                <FaUserShield /> Roles
              </Link>
            </li>
            <li>
              <Link to="/admin/settings" className="nav-link">
                <FaCog /> Settings
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="welcome-text">
            <h1>Admin Dashboard</h1>
            <p>Manage your system and users</p>
          </div>
          <div className="header-actions">
            <div className="search-bar">
              <FaSearch />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="icon-button">
              <FaBell />
              <span className="notification-badge">3</span>
            </button>
            <button className="icon-button" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-button primary" onClick={handleAddNewUser}>
            <FaUserPlus /> Add New User
          </button>
          <button className="action-button" onClick={handleManageRoles}>
            <FaUserShield /> Manage Roles
          </button>
          <button className="action-button">
            <FaCog /> System Settings
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">Total Users</h3>
              <div className="stat-icon" style={{ background: '#e8f5fe', color: '#3498db' }}>
                <FaUsers />
              </div>
            </div>
            <p className="stat-value">{stats.totalUsers.toLocaleString()}</p>
            <p className="stat-change">
              <span>↑</span> {stats.newUsersToday} new today
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">Active Users</h3>
              <div className="stat-icon" style={{ background: '#e6fff3', color: '#27ae60' }}>
                <FaUsers />
              </div>
            </div>
            <p className="stat-value">{stats.activeUsers.toLocaleString()}</p>
            <p className="stat-change">
              <span>↑</span> 85% activity rate
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">User Roles</h3>
              <div className="stat-icon" style={{ background: '#fff5e6', color: '#f39c12' }}>
                <FaUserShield />
              </div>
            </div>
            <p className="stat-value">{stats.totalRoles}</p>
            <p className="stat-change">All roles active</p>
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="data-grid">
          <div className="grid-header">
            <h2>Recent Users</h2>
            <button className="view-all-button" onClick={handleViewAllUsers}>View All</button>
          </div>
          <div className="grid-content">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
            <tbody>
                {loading ? (
                  <tr><td colSpan="5">Loading...</td></tr>
                ) : recentUsers.length === 0 ? (
                  <tr><td colSpan="5">No users found.</td></tr>
                ) : (
                  recentUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">{user.name[0]}</div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.status.toLowerCase()}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-icon"
                          onClick={() => alert(`Manage user ${user.id}`)}
                        >
                          <FaEllipsisV />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
export default AdminDashboard; 
