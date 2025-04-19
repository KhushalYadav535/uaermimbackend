import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

export default function UserActivityPage() {
  const { user } = useAuth();
  const { userId } = useParams();
  const [loginHistory, setLoginHistory] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loginResponse, activityResponse] = await Promise.all([
          api.getLoginHistory(userId, {
            page: pagination.page,
            limit: pagination.limit
          }),
          api.getAuditLogs({
            userId,
            page: pagination.page,
            limit: pagination.limit
          })
        ]);

        setLoginHistory(loginResponse.data.logs);
        setActivityLogs(activityResponse.data.logs);
        setPagination(prev => ({
          ...prev,
          total: Math.max(loginResponse.data.total, activityResponse.data.total)
        }));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch user activity');
      } finally {
        setLoading(false);
      }
    };

    if (user?.isAdmin) {
      fetchData();
    }
  }, [user, userId, pagination.page, pagination.limit]);

  const handleExport = async (format) => {
    try {
      const response = await api.exportLogs(format);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user-activity-${userId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export logs');
    }
  };

  if (!user?.isAdmin) {
    return <div>Unauthorized</div>;
  }

  if (loading) {
    return <div>Loading user activity...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>User Activity</h1>
        <div className="export-buttons">
          <button
            className="export-btn"
            onClick={() => handleExport('csv')}
            disabled={loading}
          >
            Export CSV
          </button>
          <button
            className="export-btn"
            onClick={() => handleExport('pdf')}
            disabled={loading}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="activity-section">
        <h2>Login History</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>IP Address</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loginHistory.map(login => (
              <tr key={login._id}>
                <td>{new Date(login.timestamp).toLocaleString()}</td>
                <td>{login.ipAddress}</td>
                <td>{login.location || 'Unknown'}</td>
                <td className={login.success ? 'success' : 'failure'}>
                  {login.success ? 'Success' : 'Failed'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="activity-section">
        <h2>Activity Logs</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {activityLogs.map(log => (
              <tr key={log._id}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.action}</td>
                <td>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <button 
          disabled={pagination.page === 1 || loading}
          onClick={() => setPagination(prev => ({...prev, page: prev.page - 1}))}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {Math.ceil(pagination.total/pagination.limit)}</span>
        <button 
          disabled={pagination.page * pagination.limit >= pagination.total || loading}
          onClick={() => setPagination(prev => ({...prev, page: prev.page + 1}))}
        >
          Next
        </button>
      </div>
    </div>
  );
} 