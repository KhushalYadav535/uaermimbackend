import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UsersManagement from './pages/admin/UsersManagement';
import RolesManagement from './pages/admin/RolesManagement';
import LogsManagement from './pages/admin/LogsManagement';
import SystemSettings from './pages/admin/SystemSettings';
import ProfilePage from './pages/ProfilePage';
import PasswordResetPage from './pages/PasswordResetPage';
import './App.css';
import SuperAdminDashboard from './pages/superAdmin/SuperAdminDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />
          {/* Protected routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          {/* Admin routes */}
          <Route path="/admin/users" element={<AdminRoute><UsersManagement /></AdminRoute>} />
          <Route path="/admin/roles" element={<AdminRoute><RolesManagement /></AdminRoute>} />
          <Route path="/admin/logs" element={<AdminRoute><LogsManagement /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><SystemSettings /></AdminRoute>} />
          {/* Super admin */}
          <Route path='/superAdmin' element={<AdminRoute><SuperAdminDashboard /></AdminRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
