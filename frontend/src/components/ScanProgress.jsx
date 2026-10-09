import { FaGooglePlay, FaApple, FaTwitter, FaInstagram, FaYoutube, FaFacebook, FaLinkedin, FaGlobe, FaMagnifyingGlass, FaUserShield } from 'react-icons/fa6';
import { HiCheckCircle, HiRefresh, HiClock, HiExclamationCircle } from 'react-icons/hi';

export default function ScanProgress({ platforms, currentPlatform, completed, total, status }) {
  const platformIcons = {
    google_play: { label: 'Google Play', icon: FaGooglePlay },
    apple_store: { label: 'Apple Store', icon: FaApple },
    twitter: { label: 'Twitter/X', icon: FaTwitter },
    instagram: { label: 'Instagram', icon: FaInstagram },
    youtube: { label: 'YouTube', icon: FaYoutube },
    facebook: { label: 'Facebook', icon: FaFacebook },
    linkedin: { label: 'LinkedIn', icon: FaLinkedin },
    dark_web: { label: 'Dark Web', icon: FaUserShield },
    google_search: { label: 'Google Search', icon: FaMagnifyingGlass },
  };

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
      <div className="card-header">
        <span className="card-title">Scan Progress</span>
        <span className={`threat-badge ${status === 'completed' ? 'LOW' : status === 'failed' ? 'HIGH' : 'MEDIUM'}`}>
          {status === 'running' ? (
            <>
              <HiRefresh style={{ animation: 'spin 1s linear infinite' }} />
              <span>SCANNING</span>
            </>
          ) : status === 'completed' ? (
            <>
              <HiCheckCircle />
              <span>COMPLETED</span>
            </>
          ) : status === 'failed' ? (
            <>
              <HiExclamationCircle />
              <span>FAILED</span>
            </>
          ) : (
            <>
              <HiClock />
              <span>PENDING</span>
            </>
          )}
        </span>
      </div>

      {/* Overall Progress Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
        <span>{completed} of {total} platforms scanned</span>
        <span>{progress}%</span>
      </div>
      <div style={{
        height: '12px', width: '100%', background: 'var(--bg-main)',
        boxShadow: 'var(--shadow-pressed)', borderRadius: 'var(--radius-full)', overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--accent-secondary), var(--accent-primary))',
          borderRadius: 'var(--radius-full)', transition: 'width 300ms ease'
        }} />
      </div>

      {/* Platform List */}
      <div style={{ marginTop: 'var(--space-lg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
        {(platforms || []).map((p) => {
          const isDone = platforms.indexOf(p) < completed;
          const isCurrent = p === currentPlatform;
          const platInfo = platformIcons[p] || { label: p, icon: FaGlobe };
          const Icon = platInfo.icon;

          return (
            <div key={p} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              boxShadow: isCurrent ? 'var(--shadow-pressed)' : 'var(--shadow-flat-sm)',
              background: isDone ? 'var(--threat-safe-bg)' : 'var(--bg-main)',
              color: isDone ? 'var(--threat-safe)' : isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)',
              fontWeight: 600, fontSize: 'var(--font-size-sm)',
            }}>
              {isDone ? (
                <HiCheckCircle style={{ color: 'var(--threat-safe)', fontSize: '18px' }} />
              ) : isCurrent ? (
                <HiRefresh style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)', fontSize: '18px' }} />
              ) : (
                <HiClock style={{ color: 'var(--text-muted)', fontSize: '18px' }} />
              )}
              <Icon style={{ fontSize: '16px' }} />
              <span>{platInfo.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
