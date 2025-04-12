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
    return <div className="dashboard-container">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-container error-message">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome, {user?.firstName}!</h1>
        <button onClick={logout}>Logout</button>
      </header>
      
      <nav className="dashboard-nav">
        <Link to="/profile">My Profile</Link>
        {user?.isAdmin && (
          <>
            <Link to="/admin/users">User Management</Link>
            <Link to="/admin/roles">Role Management</Link>
            <Link to="/admin/audit-logs">Audit Logs</Link>
          </>
        )}
      </nav>

      <main className="dashboard-content">
        <h2>Access Control System Dashboard</h2>
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p>{stats.totalUsers}</p>
          </div>
          {user?.isAdmin && (
            <>
              <div className="stat-card">
                <h3>Active Roles</h3>
                <p>{stats.activeRoles}</p>
              </div>
              <div className="stat-card">
                <h3>Recent Activities</h3>
                <ul>
                  {stats.recentActivities.map(activity => (
                    <li key={activity._id}>
                      {new Date(activity.timestamp).toLocaleString()} - {activity.action}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
