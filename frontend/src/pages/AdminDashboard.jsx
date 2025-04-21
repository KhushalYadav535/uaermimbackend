import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserShield, FaCog, FaChartBar, FaBell, FaSearch, FaEllipsisV, FaUserPlus, FaBars, FaSignOutAlt } from 'react-icons/fa';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 1250,
    activeUsers: 856,
    totalRoles: 5,
    newUsersToday: 23
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [recentUsers, setRecentUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'User', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Admin', status: 'Active' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'User', status: 'Pending' },
  ]);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    // Add logout functionality here
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
              <a href="#" className="nav-link active">
                <FaChartBar /> Overview
              </a>
            </li>
            <li>
              <a href="#" className="nav-link">
                <FaUsers /> Users
              </a>
            </li>
            <li>
              <a href="#" className="nav-link">
                <FaUserShield /> Roles
              </a>
            </li>
            <li>
              <a href="#" className="nav-link">
                <FaCog /> Settings
              </a>
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
              <input type="text" placeholder="Search users..." />
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
          <button className="action-button primary">
            <FaUserPlus /> Add New User
          </button>
          <button className="action-button">
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
            <button className="view-all-button">View All</button>
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
                {recentUsers.map(user => (
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
                      <button className="action-icon">
                        <FaEllipsisV />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;