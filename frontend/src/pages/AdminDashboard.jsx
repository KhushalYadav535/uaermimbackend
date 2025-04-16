import React from 'react';
import { useAuth } from '../context/AuthContext';
import AccountLockReset from '../components/AccountLockReset';

const AdminDashboard = () => {
  const { user } = useAuth();

  if (!user?.isSuperAdmin) {
    return <div>Access denied. Super admin access required.</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>Admin Dashboard</h1>
      <div className="dashboard-content">
        <AccountLockReset />
        {/* Add other admin components here */}
      </div>
    </div>
  );
};

export default AdminDashboard; 