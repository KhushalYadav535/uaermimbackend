import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;  // Redirect non-admin users
  }

  return <Outlet />;
};

export default AdminRoute;
