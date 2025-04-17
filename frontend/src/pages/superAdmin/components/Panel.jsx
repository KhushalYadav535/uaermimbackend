import React from 'react';

const Panel = ({ activePanel }) => {
  const renderPanel = () => {
    switch (activePanel) {
      case 'users':
        return <div><h2>Users</h2><p>View, add, edit, or delete users.</p></div>;
      case 'roles':
        return <div><h2>Roles</h2><p>Assign or revoke roles.</p></div>;
      case 'settings':
        return <div><h2>Settings</h2><p>Configure global platform settings.</p></div>;
      case 'logs':
        return <div><h2>Logs</h2><p>Audit system-wide logs.</p></div>;
      default:
        return <div><h2>Welcome</h2><p>Select an option to proceed.</p></div>;
    }
  };

  return (
    <section style={{ flexGrow: 1, backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.1)' }}>
      {renderPanel()}
    </section>
  );
};

export default Panel;