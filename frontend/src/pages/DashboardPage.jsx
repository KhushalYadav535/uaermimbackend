import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRoles: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.isAdmin) {
          const [usersResponse, rolesResponse, logsResponse] = await Promise.all([
            api.getUsers({ limit: 1 }),
            api.getRoles({ limit: 1 }),
            api.getAuditLogs({ limit: 5 })
          ]);

          setStats({
            totalUsers: usersResponse.data.total,
            activeRoles: rolesResponse.data.total,
            recentActivities: logsResponse.data.logs
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Welcome back, {user?.firstName}!</h1>
          <p className="header-subtitle">Here's what's happening with your account today</p>
        </div>
        <button onClick={logout} className="logout-button">Logout</button>
      </header>
      
      <nav className="dashboard-nav">
        <div className="nav-links">
          <Link to="/profile" className="nav-link">My Profile</Link>
          {user?.isAdmin && (
            <>
              <Link to="/admin/users" className="nav-link">User Management</Link>
              <Link to="/admin/roles" className="nav-link">Role Management</Link>
              <Link to="/admin/audit-logs" className="nav-link">Audit Logs</Link>
            </>
          )}
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
          </div>
          {user?.isAdmin && (
            <>
              <div className="stat-card">
                <div className="stat-icon">🔑</div>
                <h3>Active Roles</h3>
                <p>{stats.activeRoles}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <h3>Recent Activities</h3>
                <ul className="activity-list">
                  {stats.recentActivities.map(activity => (
                    <li key={activity._id} className="activity-item">
                      <span className="activity-time">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                      <span className="activity-action">{activity.action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-button">
              <span className="action-icon">📝</span>
              Update Profile
            </button>
            <button className="action-button">
              <span className="action-icon">🔒</span>
              Change Password
            </button>
            {user?.isAdmin && (
              <button className="action-button">
                <span className="action-icon">➕</span>
                Add New User
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
