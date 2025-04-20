import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUsers, FaUserCheck, FaChartLine, FaBell, FaCog, FaSignOutAlt, FaUser, FaTachometerAlt, FaUserShield } from 'react-icons/fa';
import '../styles/Dashboard.css';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    userGrowth: 0
  });

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        // Replace with actual API call
        setStats({
          totalUsers: 1250,
          activeUsers: 856,
          newUsers: 125,
          userGrowth: 15.7
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>User Management</h2>
        </div>
        <nav className="sidebar-nav">
          <ul className="nav-item">
            <li>
              <a href="#" className="nav-link active">
                <FaTachometerAlt /> Dashboard
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

        {/* User Profile Section */}
        <div className="user-profile">
          <div className="profile-avatar">
            {user?.first_name?.[0] || 'U'}
          </div>
          <div className="profile-info">
            <p className="profile-name">{user?.first_name} {user?.last_name}</p>
            <p className="profile-email">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="welcome-text">
            <h1>Welcome back, {user?.first_name}!</h1>
            <p>Here's what's happening with your users today.</p>
          </div>
          <div className="header-actions">
            <button className="icon-button">
              <FaBell />
            </button>
            <button className="icon-button" onClick={handleLogout}>
              <FaSignOutAlt />
            </button>
          </div>
        </header>

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
              <span>↑</span> {stats.userGrowth}% from last month
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">Active Users</h3>
              <div className="stat-icon" style={{ background: '#e6fff3', color: '#27ae60' }}>
                <FaUserCheck />
              </div>
            </div>
            <p className="stat-value">{stats.activeUsers.toLocaleString()}</p>
            <p className="stat-change">
              <span>↑</span> 12.3% from last month
            </p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3 className="stat-title">New Users</h3>
              <div className="stat-icon" style={{ background: '#fff5e6', color: '#f39c12' }}>
                <FaChartLine />
              </div>
            </div>
            <p className="stat-value">{stats.newUsers.toLocaleString()}</p>
            <p className="stat-change">
              <span>↑</span> 8.4% from last month
            </p>
          </div>
        </div>

        {/* Recent Users Grid */}
        <div className="data-grid">
          <div className="grid-header">
            <h2>Recent Users</h2>
          </div>
          <div className="grid-content">
            {/* Add your users table or grid component here */}
            <p>User data table will be displayed here...</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
