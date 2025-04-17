import React, { useState } from 'react'
import Navigation from './components/Navigation';
import Panel from './components/Panel';

const SuperAdminDashboard = () => {
    const [activePanel, setActivePanel] = useState('users'); 

    const handleNavigation = (panel) => {
      setActivePanel(panel);
    };
    return (
        <div>
            <header style={{ backgroundColor: '#007bff', color: '#fff', padding: '1rem', textAlign: 'center' }}>
                <h1>Super Admin Dashboard</h1>
            </header>
            <main style={{ display: 'flex', gap: '1rem', margin: '1rem' }}>
                <Navigation onNavigate={handleNavigation} />
                <Panel activePanel={activePanel} />
            </main>
        </div>
    )
}

export default SuperAdminDashboard
