import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiUsers, FiUserPlus, FiSettings, FiActivity, FiShield, FiUserCheck } from 'react-icons/fi';
import { MdAdminPanelSettings } from 'react-icons/md';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    recentActivities: [],
    recentLogins: []
  });
  const [userStats, setUserStats] = useState({
    recentActivities: [],
    recentLogins: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.isAdmin || user?.isSuperAdmin) {
          try {
            const [
              usersResponse,
              rolesResponse,
              activityLogsResponse,
              loginLogsResponse,
              settingsResponse
            ] = await Promise.all([
              api.getUsers(),
              api.getRoles(),
              api.getActivityLogs({ limit: 5 }),
              api.getLoginLogs({ limit: 5 }),
              api.getSettings()
            ]);

            setStats({
              totalUsers: usersResponse.data.total_users || 0,
              activeUsers: (usersResponse.data.users || []).filter(u => u.status === 'active').length,
              totalRoles: rolesResponse.data.total || 0,
              recentActivities: activityLogsResponse.data.logs || [],
              recentLogins: loginLogsResponse.data.logs || [],
              settings: settingsResponse.data
            });
          } catch (err) {
            console.error('Error fetching admin stats:', err);
            setError('Failed to fetch admin statistics');
          }
        } else {
          try {
            const [activityLogsResponse, loginLogsResponse] = await Promise.all([
              api.getActivityLogs({ limit: 5, user_id: user.id }),
              api.getLoginLogs({ limit: 5, user_id: user.id })
            ]);

            setUserStats({
              recentActivities: activityLogsResponse.data.logs || [],
              recentLogins: loginLogsResponse.data.logs || []
            });
          } catch (err) {
            console.error('Error fetching user stats:', err);
            setError('Failed to fetch user statistics');
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const renderAdminStats = () => (
    <div className="stats-grid">
      <div className="stat-card">
        <FiUsers className="stat-icon" />
        <div className="stat-content">
          <h3>Total Users</h3>
          <p>{stats.totalUsers}</p>
        </div>
      </div>
      <div className="stat-card">
        <FiUserCheck className="stat-icon" />
        <div className="stat-content">
          <h3>Active Users</h3>
          <p>{stats.activeUsers}</p>
        </div>
      </div>
      <div className="stat-card">
        <FiShield className="stat-icon" />
        <div className="stat-content">
          <h3>Total Roles</h3>
          <p>{stats.totalRoles}</p>
        </div>
      </div>
    </div>
  );

  const renderAdminActions = () => (
    <div className="admin-actions">
      <Link to="/admin/users" className="action-card">
        <FiUserPlus />
        <span>Manage Users</span>
      </Link>
      <Link to="/admin/roles" className="action-card">
        <FiShield />
        <span>Manage Roles</span>
      </Link>
      <Link to="/admin/settings" className="action-card">
        <FiSettings />
        <span>System Settings</span>
      </Link>
      <Link to="/admin/logs" className="action-card">
        <FiActivity />
        <span>Activity Logs</span>
      </Link>
    </div>
  );

  const renderActivityLog = () => {
    const activities = user.isAdmin ? stats.recentActivities : userStats.recentActivities;
    return (
      <div className="activity-section">
        <h2>Recent Activities</h2>
        <div className="activity-list">
          {activities && activities.length > 0 ? (
            activities.map((activity, index) => (
              <div key={activity.id || index} className="activity-item">
                <div className="activity-icon">
                  <FiActivity />
                </div>
                <div className="activity-details">
                  <p>
                    {user.isAdmin && activity.performer && (
                      <strong>{activity.performer.email}: </strong>
                    )}
                    {activity.action}
                  </p>
                  <small>{new Date(activity.createdAt).toLocaleString()}</small>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">No recent activities</div>
          )}
        </div>
      </div>
    );
  };

  const renderLoginHistory = () => {
    const logins = user.isAdmin ? stats.recentLogins : userStats.recentLogins;
    return (
      <div className="activity-section">
        <h2>Recent Logins</h2>
        <div className="activity-list">
          {logins && logins.length > 0 ? (
            logins.map((login, index) => (
              <div key={login.id || index} className="activity-item">
                <div className="activity-icon">
                  <MdAdminPanelSettings />
                </div>
                <div className="activity-details">
                  <p>
                    {user.isAdmin && login.user && (
                      <strong>{login.user.email}: </strong>
                    )}
                    Login from {login.ipAddress}
                    {login.location && ` (${login.location.city}, ${login.location.country})`}
                  </p>
                  <small>
                    {new Date(login.createdAt).toLocaleString()} - 
                    <span className={`status ${login.status.toLowerCase()}`}>
                      {login.status}
                    </span>
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data">No recent logins</div>
          )}
        </div>
      </div>
    );
  };

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
      <div className="dashboard-header">
        <h1>Welcome, {user.first_name}!</h1>
        <p className="user-role">{user?.roles?.map(r => r.name)?.join(', ') || 'User'}</p>
      </div>

      {(user.isAdmin || user.isSuperAdmin) && (
        <>
          {renderAdminStats()}
          {renderAdminActions()}
        </>
      )}

      <div className="dashboard-content">
        {user.isAdmin || user.isSuperAdmin ? (
          <>
            {renderActivityLog()}
            {renderLoginHistory()}
          </>
        ) : (
          <>
            <div className="activity-section">
              <h2>Your Recent Activities</h2>
              <div className="activity-list">
                {userStats.recentActivities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      <FiActivity />
                    </div>
                    <div className="activity-details">
                      <p>{activity.action}</p>
                      <small>{new Date(activity.created_at).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="activity-section">
              <h2>Your Login History</h2>
              <div className="activity-list">
                {userStats.recentLogins.map((login, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      <MdAdminPanelSettings />
                    </div>
                    <div className="activity-details">
                      <p>Login from {login.ip_address}</p>
                      <small>{new Date(login.created_at).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

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
          <Link to="/profile">My Profile</Link>
          {user?.isAdmin && (
            <>
              <Link to="/admin/users">User Management</Link>
              <Link to="/admin/roles">Role Management</Link>
              <Link to="/admin/audit-logs">Audit Logs</Link>
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
                <ul>
                  {stats.recentActivities.map(activity => (
                    <li key={activity._id}>
                      <span>{new Date(activity.timestamp).toLocaleString()}</span>
                      <span>{activity.action}</span>
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
              <span className="action-icon">📝</span> Update Profile
            </button>
            <button className="action-button">
              <span className="action-icon">🔒</span> Change Password
            </button>
            {user?.isAdmin && (
              <button className="action-button">
                <span className="action-icon">➕</span> Add New User
              </button>
            )}
          </div>
        </div>
      </main>
    </div>

  );
}
