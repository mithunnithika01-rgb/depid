import { useState } from 'react';
import { HiXMark, HiUser, HiLockClosed, HiEnvelope, HiShieldCheck } from 'react-icons/hi2';
import { authApi } from '../utils/api';

export default function AuthModal({ isOpen, onClose, onUserChange, currentUser }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await authApi.login(username, password);
        if (res.user) {
          localStorage.setItem('did_user', JSON.stringify(res.user));
          if (onUserChange) onUserChange(res.user);
          onClose();
        }
      } else {
        const res = await authApi.signup(username, email || `${username}@defence.ai`, password, role);
        if (res.user) {
          localStorage.setItem('did_user', JSON.stringify(res.user));
          if (onUserChange) onUserChange(res.user);
          onClose();
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: '20px'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '440px', background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)', border: 'var(--border-light)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', padding: '32px',
        animation: 'fadeIn 200ms ease'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FFFFFF', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-flat-sm)', overflow: 'hidden' }}>
              <img src="/logo.png" alt="DID Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure Enterprise Portal</span>
            </div>
          </div>
          {currentUser && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <HiXMark style={{ fontSize: '22px' }} />
            </button>
          )}
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: '20px', boxShadow: 'var(--shadow-pressed)' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-sm)',
              background: mode === 'login' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'login' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              boxShadow: mode === 'login' ? 'var(--shadow-flat-sm)' : 'none'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            style={{
              flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-sm)',
              background: mode === 'signup' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'signup' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              boxShadow: mode === 'signup' ? 'var(--shadow-flat-sm)' : 'none'
            }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <HiUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter username"
                style={{
                  width: '100%', padding: '10px 12px 10px 38px', borderRadius: 'var(--radius-md)',
                  border: 'var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-pressed)', fontSize: '14px', outline: 'none'
                }}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <HiEnvelope style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@defence.ai"
                  style={{
                    width: '100%', padding: '10px 12px 10px 38px', borderRadius: 'var(--radius-md)',
                    border: 'var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-pressed)', fontSize: '14px', outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <HiLockClosed style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                style={{
                  width: '100%', padding: '10px 12px 10px 38px', borderRadius: 'var(--radius-md)',
                  border: 'var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-pressed)', fontSize: '14px', outline: 'none'
                }}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                User Role & Permissions
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  border: 'var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-pressed)', fontSize: '14px', outline: 'none'
                }}
              >
                <option value="ADMIN">ADMIN — Full System Access & Takedowns</option>
                <option value="ANALYST">SECURITY ANALYST — Scans & Threat Review</option>
                <option value="VIEWER">AUDITOR — Read Only Access</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', padding: '12px', fontSize: '14px', fontWeight: '700' }}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
