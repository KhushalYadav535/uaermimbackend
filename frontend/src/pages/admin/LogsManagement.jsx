import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiActivity, FiClock } from 'react-icons/fi';
import './LogsManagement.css';

export default function LogsManagement() {
  const [activityLogs, setActivityLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      const [activityResponse, loginResponse] = await Promise.all([
        api.getActivityLogs({ page, limit: 10 }),
        api.getLoginLogs({ page, limit: 10 })
      ]);

      setActivityLogs(activityResponse.data.logs);
      setLoginLogs(loginResponse.data.logs);
      setTotalPages(Math.max(
        activityResponse.data.total_pages,
        loginResponse.data.total_pages
      ));
      setError('');
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="logs-management">
      <h1>System Logs</h1>

      <div className="logs-section">
        <h2><FiActivity /> Activity Logs</h2>
        <div className="logs-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.createdAt)}</td>
                  <td>{log.performer?.email || 'Unknown'}</td>
                  <td>{log.action}</td>
                  <td>{JSON.stringify(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="logs-section">
        <h2><FiClock /> Login Logs</h2>
        <div className="logs-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Status</th>
                <th>IP Address</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {loginLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.createdAt)}</td>
                  <td>{log.user?.email || 'Unknown'}</td>
                  <td>{log.status}</td>
                  <td>{log.ipAddress}</td>
                  <td>{log.location?.city}, {log.location?.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
