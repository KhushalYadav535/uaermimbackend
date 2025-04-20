import React from 'react';

const Navigation = ({ onNavigate }) => {
  const navigate = (panel) => {
    onNavigate(panel);
  };

  return (
    <aside style={{ width: '20%' }}>
      <button onClick={() => navigate('users')} style={buttonStyle}>Manage Users</button>
      <button onClick={() => navigate('roles')} style={buttonStyle}>Manage Roles</button>
      <button onClick={() => navigate('settings')} style={buttonStyle}>Global Settings</button>
      <button onClick={() => navigate('logs')} style={buttonStyle}>View Logs</button>
    </aside>
  );
};

const buttonStyle = {
  display: 'block',
  width: '100%',
  padding: '10px 15px',
  margin: '5px 0',
  backgroundColor: '#007bff',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  textAlign: 'left',
};

export default Navigation;