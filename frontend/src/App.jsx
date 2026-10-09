import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import BrandProfile from './pages/BrandProfile';
import ScanNow from './pages/ScanNow';
import Analytics from './pages/Analytics';
import DarkWeb from './pages/DarkWeb';
import PublicPortal from './pages/PublicPortal';
import { SearchProvider } from './utils/SearchContext';

function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <div className="app-layout">
          <Sidebar />
          <TopBar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/brand-profile" element={<BrandProfile />} />
              <Route path="/scan" element={<ScanNow />} />
              <Route path="/darkweb" element={<DarkWeb />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/public" element={<PublicPortal />} />
            </Routes>
          </main>
        </div>
      </SearchProvider>
    </BrowserRouter>
  );
}

export default App;
