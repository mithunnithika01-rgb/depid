import { useState } from 'react';
import { HiUser, HiLockClosed, HiEnvelope, HiShieldCheck } from 'react-icons/hi2';
import { authApi } from '../utils/api';

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await authApi.login(username, password);
        if (res.user) {
          localStorage.setItem('did_user', JSON.stringify(res.user));
          onLogin(res.user);
        }
      } else {
        const res = await authApi.signup(username, email || `${username}@defence.ai`, password, role);
        if (res.message) {
          // Auto login after signup
          const loginRes = await authApi.login(username, password);
          if (loginRes.user) {
            localStorage.setItem('did_user', JSON.stringify(loginRes.user));
            onLogin(loginRes.user);
          }
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
      minHeight: '100vh',
      width: '100vw',
      background: 'var(--bg-main)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '440px', background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-flat-lg)', padding: '40px',
        animation: 'fadeIn 300ms ease',
        boxSizing: 'border-box',
        border: 'var(--border-light)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '36px', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'var(--bg-main)', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-flat)' }}>
            <img src="/logo.png" alt="DID Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Defence in Depth
            </h2>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>Secure Enterprise Portal</span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', padding: '6px', marginBottom: '32px', boxShadow: 'var(--shadow-pressed)' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              flex: 1, padding: '12px', border: 'none', borderRadius: 'var(--radius-md)',
              background: mode === 'login' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'login' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: '700', fontSize: '14px', cursor: 'pointer', outline: 'none',
              boxShadow: mode === 'login' ? 'var(--shadow-flat-sm)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            style={{
              flex: 1, padding: '12px', border: 'none', borderRadius: 'var(--radius-md)',
              background: mode === 'signup' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'signup' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: '700', fontSize: '14px', cursor: 'pointer', outline: 'none',
              boxShadow: mode === 'signup' ? 'var(--shadow-flat-sm)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '4px' }}>
              Username
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <HiUser style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '20px' }} />
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 16px 48px', background: 'var(--bg-input)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', outline: 'none', boxShadow: 'var(--shadow-pressed)' }}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '4px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <HiEnvelope style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '20px' }} />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 16px 48px', background: 'var(--bg-input)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', outline: 'none', boxShadow: 'var(--shadow-pressed)' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '4px' }}>
                  Role Assignment
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <HiShieldCheck style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '20px', pointerEvents: 'none' }} />
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 16px 48px', background: 'var(--bg-input)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', outline: 'none', appearance: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-pressed)' }}
                  >
                    <option value="ADMIN">System Admin</option>
                    <option value="ANALYST">Security Analyst</option>
                    <option value="INVESTIGATOR">Investigator</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '4px' }}>
              Password
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <HiLockClosed style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '20px' }} />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 16px 48px', background: 'var(--bg-input)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', outline: 'none', boxShadow: 'var(--shadow-pressed)' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '14px', background: 'var(--threat-high-bg)', color: 'var(--threat-high)', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <HiLockClosed style={{ fontSize: '18px' }} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '16px', background: 'var(--accent-primary)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '800', fontSize: '16px', letterSpacing: '0.5px',
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: '12px', outline: 'none',
              boxShadow: 'var(--shadow-flat)', transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Authenticating...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}
