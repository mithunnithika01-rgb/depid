import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import BrandProfile from './pages/BrandProfile';
import ScanNow from './pages/ScanNow';
import Analytics from './pages/Analytics';
import DarkWeb from './pages/DarkWeb';
import PublicPortal from './pages/PublicPortal';
import LoginPage from './pages/LoginPage';
import MigrationTool from './pages/MigrationTool';
import { SearchProvider } from './utils/SearchContext';
import { seedFirebase } from './utils/api';

function AdminLayout({ children, onLogout }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <TopBar onLogout={onLogout} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('did_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    seedFirebase();
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('did_user');
    setCurrentUser(null);
  };

  return (
    <BrowserRouter>
      <SearchProvider>
        <Routes>
          {/* Standalone Public Portal Web App */}
          <Route path="/public" element={<PublicPortal />} />
          <Route path="/migrate" element={<MigrationTool />} />

          {/* If not logged in, render LoginPage for any other route */}
          {!currentUser ? (
            <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
          ) : (
            /* Internal Security Platform Admin Routes */
            <>
              <Route path="/" element={<AdminLayout onLogout={handleLogout}><Dashboard /></AdminLayout>} />
              <Route path="/brand-profile" element={<AdminLayout onLogout={handleLogout}><BrandProfile /></AdminLayout>} />
              <Route path="/scan" element={<AdminLayout onLogout={handleLogout}><ScanNow /></AdminLayout>} />
              <Route path="/darkweb" element={<AdminLayout onLogout={handleLogout}><DarkWeb /></AdminLayout>} />
              <Route path="/analytics" element={<AdminLayout onLogout={handleLogout}><Analytics /></AdminLayout>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </SearchProvider>
    </BrowserRouter>
  );
}

export default App;
