import { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { HiSearch } from 'react-icons/hi';
import {
  HiBell, HiXMark, HiGlobeAlt, HiChevronDown,
  HiKey, HiArrowRightOnRectangle, HiCheckCircle, HiUserCircle,
  HiEnvelope, HiShieldExclamation, HiArrowPath,
} from 'react-icons/hi2';
import { FaTwitter, FaInstagram } from 'react-icons/fa6';
import { brandApi, threatsApi, authApi } from '../utils/api';
import AuthModal from './AuthModal';
import { useSearch } from '../utils/SearchContext';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/scan': 'Scan Now',
  '/brand-profile': 'Brand Profile',
  '/analytics': 'Analytics',
  '/darkweb': 'Dark Web Monitor',
  '/public': 'Public Portal',
};

/* ── Icon pill shared size (matches notification bell) ── */
const PILL_SIZE = 42;
const AVATAR_SIZE = 28;

function BrandAvatar({ brand, size = AVATAR_SIZE }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '8px',
      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '900', color: 'white', fontSize: size * 0.42,
      overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
    }}>
      {brand?.logo_path
        ? <img src={`http://localhost:8000${brand.logo_path}`} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : brand?.brand_name?.charAt(0).toUpperCase() ?? '?'}
    </div>
  );
}

function UserAvatar({ user, size = AVATAR_SIZE }) {
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? 'US';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '900', fontSize: size * 0.4, flexShrink: 0,
      boxShadow: '0 2px 10px rgba(99,102,241,0.45)',
    }}>
      {initials}
    </div>
  );
}

export default function TopBar({ onLogout }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  const [brands, setBrands] = useState([]);
  const [activeBrand, setActiveBrand] = useState(null);
  const [showBrandCard, setShowBrandCard] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [switchingBrand, setSwitchingBrand] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('did_user')) || { username: 'mithun', role: 'ADMIN', email: 'mithun@defence.ai' };

  const { query: searchQuery, setQuery: setSearchQuery } = useSearch();
  const navigate = useNavigate();

  const [recentAlerts, setRecentAlerts] = useState([]);

  const brandRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    brandApi.list(currentUser?.username).then(data => {
      if (data.brands?.length > 0) {
        setBrands(data.brands);
        setActiveBrand(data.brands[0]);
      }
    }).catch(() => {});

    threatsApi.list({ threat_level: 'HIGH_RISK', limit: 5 }).then(data => {
      setRecentAlerts(data.threats || []);
    }).catch(() => {});
  }, []);

  /* close popovers on outside click */
  useEffect(() => {
    function handler(e) {
      if (brandRef.current && !brandRef.current.contains(e.target)) setShowBrandCard(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfilePopover(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setShowProfilePopover(false);
    if (onLogout) onLogout();
  };

  const handleSwitchBrand = (brand) => {
    setSwitchingBrand(brand.id);
    setTimeout(() => {
      setActiveBrand(brand);
      setSwitchingBrand(false);
    }, 300);
  };

  const permissionList = (currentUser?.permissions || 'ALL,TAKEDOWN,SCAN,MANAGE_USERS').split(',');

  /* ── Shared pill button styles ── */
  const pillStyle = (active) => ({
    height: `${PILL_SIZE}px`,
    padding: '0 14px',
    background: 'var(--bg-main)',
    borderRadius: 'var(--radius-md)',
    boxShadow: active ? 'var(--shadow-pressed)' : 'var(--shadow-flat-sm)',
    border: '1px solid var(--border-color)',
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)',
    cursor: 'pointer', transition: 'all 0.15s ease',
  });

  return (
    <header className="topbar">
      <h2 className="topbar-title">{title}</h2>

      <div className="topbar-actions">
        {/* SEARCH */}
        <div className="topbar-search">
          <HiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search threats, URLs, profiles..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              // If not on dashboard or darkweb, navigate there so results show
              if (location.pathname !== '/' && location.pathname !== '/darkweb') {
                navigate('/');
              }
            }}
            onKeyDown={e => { if (e.key === 'Escape') setSearchQuery(''); }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              }}
              title="Clear search"
            >
              <HiXMark style={{ fontSize: '14px' }} />
            </button>
          )}
        </div>

        {/* ── NOTIFICATIONS BELL ── */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifications(v => !v)}
            style={{
              width: `${PILL_SIZE}px`, height: `${PILL_SIZE}px`,
              padding: 0, borderRadius: 'var(--radius-md)',
              background: 'var(--bg-main)',
              boxShadow: showNotifications ? 'var(--shadow-pressed)' : 'var(--shadow-flat-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', transition: 'all 0.15s ease',
            }}
            title="Real-time Threat Alerts"
          >
            <HiBell style={{ fontSize: '20px', color: 'var(--text-secondary)' }} />
            {recentAlerts.length > 0 && (
              <span style={{
                position: 'absolute', top: '5px', right: '5px',
                width: '16px', height: '16px', background: 'var(--threat-high)',
                color: 'white', fontSize: '9px', fontWeight: '800',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', boxShadow: '0 2px 5px rgba(239,68,68,0.4)',
              }}>
                {recentAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="card" style={{
              position: 'absolute', right: 0, top: `${PILL_SIZE + 6}px`, width: '320px',
              zIndex: 300, padding: '16px', boxShadow: 'var(--shadow-flat-lg)',
              border: 'var(--border-light)', background: 'var(--bg-card)',
              animation: 'fadeIn 150ms ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="card-title" style={{ fontSize: '11px' }}>REAL-TIME ALERTS</span>
                <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <HiXMark style={{ fontSize: '16px' }} />
                </button>
              </div>
              {recentAlerts.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '10px 0', textAlign: 'center' }}>
                  No active high-risk alerts.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentAlerts.map(alert => (
                    <div key={alert.id} style={{
                      padding: '8px 10px', borderRadius: '8px',
                      background: 'var(--bg-main)', fontSize: '12px',
                      borderLeft: '3px solid var(--threat-high)',
                    }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{alert.item_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{alert.platform} • {alert.threat_level}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── BRAND SELECTOR ── */}
        <div style={{ position: 'relative' }} ref={brandRef}>
          <button
            onClick={() => setShowBrandCard(v => !v)}
            style={{
              ...pillStyle(showBrandCard),
              border: `1px solid ${showBrandCard ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              color: showBrandCard ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
            title="Switch active brand"
          >
            <BrandAvatar brand={activeBrand} size={AVATAR_SIZE} />
            <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeBrand ? activeBrand.brand_name : 'Select Brand'}
            </span>
            <HiChevronDown style={{ fontSize: '14px', transition: 'transform 0.2s', transform: showBrandCard ? 'rotate(180deg)' : 'none' }} />
          </button>

          {showBrandCard && (
            <div className="card" style={{
              position: 'absolute', right: 0, top: `${PILL_SIZE + 6}px`, width: '340px',
              zIndex: 200, padding: '0', boxShadow: 'var(--shadow-flat-lg)',
              border: 'var(--border-light)', background: 'var(--bg-card)',
              animation: 'fadeIn 150ms ease', overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderBottom: '1px solid var(--border-color)',
              }}>
                <span className="card-title" style={{ fontSize: '11px' }}>ACTIVE BRAND</span>
                <button onClick={() => setShowBrandCard(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <HiXMark style={{ fontSize: '18px' }} />
                </button>
              </div>

              {/* Active brand details */}
              {activeBrand && (
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <BrandAvatar brand={activeBrand} size={46} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-primary)' }}>{activeBrand.brand_name || 'Loading...'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{activeBrand.developer_name || 'Ground Truth Brand'}</div>
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '3px 8px',
                      borderRadius: '20px', background: 'rgba(16,185,129,0.12)',
                      color: '#10B981', border: '1px solid rgba(16,185,129,0.3)',
                    }}>ACTIVE</span>
                  </div>

                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px',
                    color: 'var(--text-secondary)', background: 'var(--bg-main)',
                    padding: '10px 12px', borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-pressed)',
                  }}>
                    {activeBrand.website_url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: '600' }}>
                        <HiGlobeAlt /> <span>{activeBrand.website_url}</span>
                      </div>
                    )}
                    {activeBrand.twitter_handle && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaTwitter style={{ color: '#1DA1F2' }} /> <span>{activeBrand.twitter_handle}</span>
                      </div>
                    )}
                    {activeBrand.instagram_handle && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaInstagram style={{ color: '#E4405F' }} /> <span>{activeBrand.instagram_handle}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Switch brand list */}
              {brands.length > 1 && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    SWITCH BRAND
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                    {brands.map(brand => {
                      const isActive = activeBrand?.id === brand.id;
                      const isSwitching = switchingBrand === brand.id;
                      return (
                        <button
                          key={brand.id}
                          onClick={() => !isActive && handleSwitchBrand(brand)}
                          disabled={isActive}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 10px', borderRadius: '8px',
                            background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                            border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                            cursor: isActive ? 'default' : 'pointer',
                            transition: 'all 0.15s ease', textAlign: 'left', width: '100%',
                          }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-main)'; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <BrandAvatar brand={brand} size={28} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{brand.brand_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{brand.developer_name || 'Brand'}</div>
                          </div>
                          {isActive && <HiCheckCircle style={{ color: 'var(--accent-primary)', fontSize: '16px' }} />}
                          {isSwitching && <HiArrowPath style={{ color: 'var(--text-muted)', fontSize: '14px', animation: 'spin 0.5s linear infinite' }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                <Link
                  to="/brand-profile"
                  onClick={() => setShowBrandCard(false)}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  Edit Brand Properties →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── USER PROFILE ── */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            onClick={() => setShowProfilePopover(v => !v)}
            style={pillStyle(showProfilePopover)}
            title="Account"
          >
            <UserAvatar user={currentUser} size={AVATAR_SIZE} />
            <span style={{ maxWidth: '72px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser ? currentUser.username : 'Log In'}
            </span>
            <HiChevronDown style={{ fontSize: '13px', transition: 'transform 0.2s', transform: showProfilePopover ? 'rotate(180deg)' : 'none' }} />
          </button>

          {showProfilePopover && (
            <div className="card" style={{
              position: 'absolute', right: 0, top: `${PILL_SIZE + 6}px`, width: '300px',
              zIndex: 250, padding: '0', boxShadow: 'var(--shadow-flat-lg)',
              border: 'var(--border-light)', background: 'var(--bg-card)',
              animation: 'fadeIn 150ms ease', overflow: 'hidden',
            }}>
              {/* Gradient header */}
              <div style={{
                padding: '20px 16px 16px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span className="card-title" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>MY ACCOUNT</span>
                  <button onClick={() => setShowProfilePopover(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <HiXMark style={{ fontSize: '16px' }} />
                  </button>
                </div>

                {currentUser && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Large avatar with ring */}
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '54px', height: '54px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '900', fontSize: '20px', color: 'white',
                        boxShadow: '0 0 0 3px var(--bg-card), 0 0 0 5px rgba(99,102,241,0.4)',
                      }}>
                        {currentUser.username.slice(0, 2).toUpperCase()}
                      </div>
                      {/* Online dot */}
                      <div style={{
                        position: 'absolute', bottom: '1px', right: '1px',
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: '#10B981', border: '2px solid var(--bg-card)',
                      }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-primary)' }}>{currentUser.username}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HiEnvelope style={{ fontSize: '11px' }} />
                        {currentUser.email || 'mithun@defence.ai'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Role & Permissions */}
              {currentUser && (
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <HiShieldExclamation style={{ color: 'var(--accent-primary)', fontSize: '15px' }} />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      ROLE & ACCESS
                    </span>
                    <span style={{
                      marginLeft: 'auto', fontSize: '10px', fontWeight: '800',
                      padding: '2px 10px', borderRadius: '20px',
                      background: 'var(--accent-primary)', color: 'white',
                      letterSpacing: '0.05em',
                    }}>
                      {currentUser.role || 'ADMIN'}
                    </span>
                  </div>

                  {/* Permissions grid */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {permissionList.map(p => (
                      <span key={p} style={{
                        fontSize: '10px', fontWeight: '700', padding: '3px 8px',
                        borderRadius: '20px', background: 'var(--bg-main)',
                        color: 'var(--text-secondary)', border: '1px solid var(--border-color)',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <HiCheckCircle style={{ color: '#10B981', fontSize: '10px' }} />
                        {p.trim()}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                    Active Session
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => { setShowProfilePopover(false); if (onLogout) onLogout(); }}
                  className="btn btn-secondary btn-sm btn-block"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <HiKey /> Switch / Add Account
                </button>
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm btn-block"
                  style={{ color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <HiArrowRightOnRectangle /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
