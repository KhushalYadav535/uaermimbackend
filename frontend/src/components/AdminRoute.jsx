import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
