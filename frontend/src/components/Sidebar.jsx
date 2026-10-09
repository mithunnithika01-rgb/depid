import { NavLink } from 'react-router-dom';
import { HiHome, HiSearch, HiUser, HiChartBar, HiLogout, HiShieldCheck, HiExternalLink, HiLockClosed } from 'react-icons/hi';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="shield-icon">
          <HiShieldCheck />
        </div>
        <div>
          <h1>DID</h1>
          <span style={{ fontSize: '11px', color: '#64748B', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>
            Defence in Depth
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          <HiHome className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/scan" className={({ isActive }) => isActive ? 'active' : ''}>
          <HiSearch className="nav-icon" />
          <span>Scan Now</span>
        </NavLink>

        <NavLink to="/darkweb" className={({ isActive }) => isActive ? 'active' : ''}>
          <HiLockClosed className="nav-icon" />
          <span>Dark Web Monitor</span>
        </NavLink>

        <NavLink to="/brand-profile" className={({ isActive }) => isActive ? 'active' : ''}>
          <HiUser className="nav-icon" />
          <span>Brand Profile</span>
        </NavLink>

        <NavLink to="/analytics" className={({ isActive }) => isActive ? 'active' : ''}>
          <HiChartBar className="nav-icon" />
          <span>Analytics</span>
        </NavLink>

        <NavLink to="/public" className={({ isActive }) => `public-portal-link ${isActive ? 'active' : ''}`}>
          <HiShieldCheck className="nav-icon" />
          <span>Public Portal</span>
          <HiExternalLink style={{ marginLeft: 'auto', fontSize: '14px', opacity: 0.7 }} />
        </NavLink>
      </nav>
    </aside>
  );
}
