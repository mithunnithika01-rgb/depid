import { NavLink } from 'react-router-dom';
import { HiHome, HiSearch, HiUser, HiChartBar, HiShieldCheck, HiExternalLink, HiLockClosed } from 'react-icons/hi';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="shield-icon" style={{ background: '#FFFFFF', padding: '2px', borderRadius: '14px', boxShadow: 'var(--shadow-flat-sm)', overflow: 'hidden' }}>
          <img src="/logo.png" alt="DID Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.15)', mixBlendMode: 'multiply' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            DID
          </h1>
          <span style={{ fontSize: '10px', color: '#64748B', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '700' }}>
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

      <div className="sidebar-footer">
        <div style={{ padding: '8px 12px', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', boxShadow: 'var(--shadow-pressed)' }}>
          Enterprise Console Active
        </div>
      </div>
    </aside>
  );
}
