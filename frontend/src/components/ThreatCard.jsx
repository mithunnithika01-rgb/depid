import { useState } from 'react';
import { FaGooglePlay, FaApple, FaTwitter, FaInstagram, FaYoutube, FaFacebook, FaLinkedin, FaGlobe, FaMagnifyingGlass, FaShieldHalved } from 'react-icons/fa6';
import { HiExclamationTriangle, HiCheckCircle, HiQuestionMarkCircle, HiArrowTopRightOnSquare, HiSparkles } from 'react-icons/hi2';

const PLATFORM_ICONS = {
  google_play: FaGooglePlay,
  apple_store: FaApple,
  twitter: FaTwitter,
  instagram: FaInstagram,
  youtube: FaYoutube,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
  dark_web: FaShieldHalved,
  google_search: FaMagnifyingGlass,
};

const LEVEL_CONFIG = {
  HIGH_RISK: { badge: 'HIGH', icon: HiExclamationTriangle, label: 'HIGH RISK' },
  HIGH:      { badge: 'HIGH', icon: HiExclamationTriangle, label: 'HIGH RISK' },
  MEDIUM:    { badge: 'MEDIUM', icon: HiExclamationTriangle, label: 'MEDIUM RISK' },
  SAFE:      { badge: 'LOW', icon: HiCheckCircle, label: 'SAFE' },
  LOW:       { badge: 'LOW', icon: HiCheckCircle, label: 'LOW RISK' },
  OFFICIAL:  { badge: 'OFFICIAL', icon: HiCheckCircle, label: 'OFFICIAL' },
  UNKNOWN:   { badge: 'UNKNOWN', icon: HiQuestionMarkCircle, label: 'UNKNOWN' },
};

/** Shows the scraped app icon; falls back silently to the platform SVG icon */
function AppIcon({ src, platform }) {
  const [failed, setFailed] = useState(false);
  const PlatformIcon = PLATFORM_ICONS[platform] || FaGlobe;

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return <PlatformIcon style={{ color: 'var(--accent-primary)', fontSize: '22px' }} />;
}

export default function ThreatCard({ threat }) {
  const threatLevel = threat.threat_level || threat.threatLevel || 'UNKNOWN';
  const config = LEVEL_CONFIG[threatLevel] || LEVEL_CONFIG.UNKNOWN;
  const BadgeIcon = config.icon;
  const confidence = threat.confidence_score ?? 0;

  return (
    <div className={`threat-card ${config.badge}`}>
      {/* ── Header ── */}
      <div className="threat-header">
        <div className="threat-title-group">
          <div className="threat-icon">
            <AppIcon src={threat.item_icon_url} platform={threat.platform} />
          </div>
          <div>
            <div className="threat-name">{threat.item_name || threat.title || 'Scraped Threat Item'}</div>
            {threat.item_developer && (
              <div className="threat-meta">by {threat.item_developer}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`threat-badge ${config.badge}`}>
            <BadgeIcon style={{ fontSize: '14px' }} />
            <span>{config.label}</span>
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="threat-body">

        {/* AI Analysis Box */}
        {(() => {
          const isSafeItem = threat.threat_level === 'SAFE' || threat.is_official || config.badge === 'LOW' || config.badge === 'OFFICIAL';
          const boxColor = config.badge === 'HIGH'
            ? { bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.25)', accent: '#EF4444' }
            : config.badge === 'MEDIUM'
            ? { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)', accent: '#F59E0B' }
            : { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', accent: '#10B981' };

          const headerTitle = isSafeItem ? 'VERIFIED SAFE ASSET — WHY IT IS SAFE' : 'AI ANALYSIS VERDICT';

          return (
            <div style={{
              background: boxColor.bg,
              border: `1px solid ${boxColor.border}`,
              borderLeft: `4px solid ${boxColor.accent}`,
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 'var(--space-md)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                {isSafeItem ? (
                  <HiCheckCircle style={{ color: boxColor.accent, fontSize: '18px', flexShrink: 0 }} />
                ) : (
                  <HiSparkles style={{ color: boxColor.accent, fontSize: '16px', flexShrink: 0 }} />
                )}
                <span style={{
                  fontWeight: '800',
                  color: boxColor.accent,
                  fontSize: '11px',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                }}>{headerTitle}</span>
              </div>

              {/* Reason text */}
              {threat.ai_reason ? (
                <p style={{
                  margin: 0,
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.6',
                  fontWeight: '500',
                }}>
                  {threat.ai_reason}
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {isSafeItem ? 'Verified safe asset. Matches official brand developer, logo, and domain.' : 'No AI analysis available for this item.'}
                </p>
              )}
            </div>
          );
        })()}

        {/* Confidence bar */}
        {confidence > 0 && (
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                AI Confidence
              </span>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-primary)' }}>
                {confidence}%
              </span>
            </div>
            <div style={{
              height: '6px', borderRadius: '999px',
              background: 'var(--shadow-flat-sm, rgba(0,0,0,0.08))',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(confidence, 100)}%`,
                height: '100%',
                borderRadius: '999px',
                background: confidence >= 80
                  ? 'linear-gradient(90deg, #10B981, #059669)'
                  : confidence >= 50
                  ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                  : 'linear-gradient(90deg, #EF4444, #DC2626)',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="threat-actions">
          {threat.item_url && (
            <a
              href={threat.item_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ gap: '6px', marginRight: 'auto' }}
            >
              <span>View Source</span>
              <HiArrowTopRightOnSquare style={{ fontSize: '14px' }} />
            </a>
          )}

          {threat.recommended_action === 'TAKEDOWN_REQUEST' && (
            <button className="btn btn-danger btn-sm">Issue Takedown</button>
          )}
          {threat.recommended_action === 'REVIEW' && (
            <button className="btn btn-ghost btn-sm">Flag for Review</button>
          )}
        </div>
      </div>
    </div>
  );
}
