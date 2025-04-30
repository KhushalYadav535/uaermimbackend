import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUsers, FaUserCheck, FaChartLine, FaBell, FaCog, FaSignOutAlt, FaUser, FaTachometerAlt, FaUserShield, FaKey, FaHistory, FaUserEdit } from 'react-icons/fa';
import api from '../services/api';
import '../styles/Dashboard.css';

const DashboardPage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    userGrowth: 0
  });
  const [profile, setProfile] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get(
          user?.role === 'admin' || user?.role === 'super_admin'
            ? '/admin/dashboard'
            : '/users/dashboard'
        );
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          newUsers: 0,
          userGrowth: 0
        });
      }
    };

    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        setProfile(response.data.user);
        // Extract permissions from roles if available
        if (response.data.user.roles) {
          const perms = [];
          response.data.user.roles.forEach(role => {
            if (role.permissions) {
              perms.push(...role.permissions.map(p => p.name));
            }
          });
          setPermissions([...new Set(perms)]);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    const fetchRecentActivities = async () => {
      try {
        // Assuming an API endpoint for user recent activities exists
        const response = await api.get('/users/activity-logs', { params: { userId: user?.id, limit: 5 } });
        setRecentActivities(response.data.activities || []);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      }
    };

    if (isAuthenticated) {
      fetchStats();
      fetchProfile();
      fetchRecentActivities();
    }
  }, [user, isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
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
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <>
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
              </>
            )}
            <li>
              <Link to="/settings" className="nav-link">
                <FaCog /> Settings
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="user-profile">
          <div className="profile-avatar">
            {profile?.first_name?.[0] || 'U'}
          </div>
          <div className="profile-info">
            <p className="profile-name">{profile?.first_name} {profile?.last_name}</p>
            <p className="profile-email">{profile?.email}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="welcome-text">
            <h1>{getGreeting()}, {profile?.first_name}! Welcome back.</h1>
            <p>Here's what's happening with your users today.</p>
          </div>
          <div className="header-actions">
            <button className="icon-button">
              <FaBell />
            </button>
            <button className="icon-button" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          {user?.role === 'admin' || user?.role === 'super_admin' ? (
            <>
              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">Total Users</h3>
                  <div className="stat-icon" style={{ background: '#e8f5fe', color: '#3498db' }}>
                    <FaUsers />
                  </div>
                </div>
                <p className="stat-value">{stats.totalUsers?.toLocaleString() || '0'}</p>
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
                <p className="stat-value">{stats.activeUsers?.toLocaleString() || '0'}</p>
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
                <p className="stat-value">{stats.newUsers?.toLocaleString() || '0'}</p>
                <p className="stat-change">
                  <span>↑</span> 8.4% from last month
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">Activity Logs</h3>
                  <div className="stat-icon" style={{ background: '#e8f5fe', color: '#3498db' }}>
                    <FaUsers />
                  </div>
                </div>
                <p className="stat-value">{stats.activityCount?.toLocaleString() || '0'}</p>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3 className="stat-title">Login Logs</h3>
                  <div className="stat-icon" style={{ background: '#e6fff3', color: '#27ae60' }}>
                    <FaUserCheck />
                  </div>
                </div>
                <p className="stat-value">{stats.loginCount?.toLocaleString() || '0'}</p>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <section className="quick-actions" style={{ marginTop: '30px' }}>
          <h2>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to="/password-reset" className="quick-action-button" style={{ display: 'flex', alignItems: 'center', padding: '10px 15px', backgroundColor: '#3498db', color: 'white', borderRadius: '5px', textDecoration: 'none' }}>
              <FaKey style={{ marginRight: '8px' }} /> Change Password
            </Link>
            <Link to="/settings" className="quick-action-button" style={{ display: 'flex', alignItems: 'center', padding: '10px 15px', backgroundColor: '#27ae60', color: 'white', borderRadius: '5px', textDecoration: 'none' }}>
              <FaUserEdit style={{ marginRight: '8px' }} /> Update Profile
            </Link>
            <Link to="/user/access-logs" className="quick-action-button" style={{ display: 'flex', alignItems: 'center', padding: '10px 15px', backgroundColor: '#f39c12', color: 'white', borderRadius: '5px', textDecoration: 'none' }}>
              <FaHistory style={{ marginRight: '8px' }} /> View Access Logs
            </Link>
          </div>
        </section>

        {/* User Role and Permissions */}
        <section className="user-roles-permissions" style={{ marginTop: '30px' }}>
          <h2>Your Roles and Permissions</h2>
          <div>
            <strong>Roles:</strong> {profile?.roles?.map(role => role.name).join(', ') || 'None'}
          </div>
          <div style={{ marginTop: '10px' }}>
            <strong>Permissions:</strong> {permissions.length > 0 ? permissions.join(', ') : 'None'}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="recent-activity" style={{ marginTop: '30px' }}>
          <h2>Recent Activity</h2>
          {recentActivities.length > 0 ? (
            <ul>
              {recentActivities.map((activity, index) => (
                <li key={index}>
                  {activity.action} - {new Date(activity.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent activity found.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
