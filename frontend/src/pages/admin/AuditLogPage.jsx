import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AuditLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.getAuditLogs({
          page: pagination.page,
          limit: pagination.limit
        });
        setLogs(data.logs);
        setPagination(prev => ({
          ...prev,
          total: data.total
        }));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch audit logs');
      } finally {
        setLoading(false);
      }
    };

    if (user?.isAdmin) {
      fetchLogs();
    }
  }, [user, pagination.page, pagination.limit]);

  const handleClearLogs = async () => {
    try {
      if (window.confirm('Are you sure you want to clear all audit logs?')) {
        setLoading(true);
        await api.clearAuditLogs();
        setLogs([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear logs');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isAdmin) {
    return <div>Unauthorized</div>;
  }

  if (loading) {
    return <div>Loading audit logs...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Audit Logs</h1>
        <button 
          className="clear-btn"
          onClick={handleClearLogs}
          disabled={loading || logs.length === 0}
        >
          {loading ? 'Clearing...' : 'Clear Logs'}
        </button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>User</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log._id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.action}</td>
              <td>{log.userId}</td>
              <td>{log.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
