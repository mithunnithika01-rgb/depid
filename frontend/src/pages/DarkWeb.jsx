import { useState, useEffect } from 'react';
import { HiGlobeAlt, HiExclamationTriangle, HiShieldCheck, HiArrowPath, HiLockClosed } from 'react-icons/hi2';
import { threatsApi, scanApi, brandApi } from '../utils/api';
import ThreatCard from '../components/ThreatCard';

export default function DarkWeb() {
  const [darkWebThreats, setDarkWebThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeBrand, setActiveBrand] = useState(null);

  const fetchDarkWebData = async () => {
    setLoading(true);
    try {
      const brandRes = await brandApi.list();
      if (brandRes.brands && brandRes.brands.length > 0) {
        setActiveBrand(brandRes.brands[0]);
      }

      const res = await threatsApi.list({ platform: 'dark_web', limit: 50 });
      setDarkWebThreats(res.threats || []);
    } catch (err) {
      console.error("Failed to load dark web threats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDarkWebData();
  }, []);

  const handleRunDarkWebScan = async () => {
    if (!activeBrand) return;
    setScanning(true);
    try {
      await scanApi.start(activeBrand.id, ['dark_web']);
      // Poll for completion
      setTimeout(() => {
        fetchDarkWebData();
        setScanning(false);
      }, 4000);
    } catch (err) {
      console.error("Dark web scan failed:", err);
      setScanning(false);
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)', background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HiLockClosed style={{ fontSize: '20px' }} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Dark Web & Leaked Credentials Monitor</h2>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0, maxWidth: '650px' }}>
              Scans Tor hidden services (Ahmia indexer), leak forums, paste dumps (psbdmp.ws), and dark markets for leaked brand credentials, fake domain sales, and malicious mentions.
            </p>
          </div>

          <button
            onClick={handleRunDarkWebScan}
            disabled={scanning || !activeBrand}
            className="btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 20px', background: 'var(--threat-high)',
              color: '#FFFFFF', fontWeight: '700', borderRadius: 'var(--radius-md)',
              boxShadow: '0 6px 16px rgba(239, 68, 68, 0.45)', border: 'none', cursor: 'pointer'
            }}
          >
            <HiArrowPath className={scanning ? 'spin' : ''} style={{ fontSize: '18px' }} />
            <span>{scanning ? 'Scanning Dark Web...' : 'Run Dark Web Scan'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Dark Web Mentions</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
              <HiExclamationTriangle />
            </div>
          </div>
          <div className="stat-value">{darkWebThreats.length}</div>
          <div className="stat-subtitle">Found in Ahmia & Pastebin dumps</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Sources Monitored</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
              <HiGlobeAlt />
            </div>
          </div>
          <div className="stat-value">Ahmia + Pastes</div>
          <div className="stat-subtitle">Tor onion & pastebin engine</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Protection Status</span>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <HiShieldCheck />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#10B981' }}>Active Shield</div>
          <div className="stat-subtitle">Real-time intelligence sync</div>
        </div>
      </div>

      {/* Dark Web Results Table / List */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
          <span className="card-title">Dark Web Findings & Paste Dumps</span>
          <span className="chip" style={{ fontSize: '12px', background: 'var(--bg-main)' }}>
            Showing {darkWebThreats.length} items
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading Dark Web Intelligence...
          </div>
        ) : darkWebThreats.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
            <HiShieldCheck style={{ fontSize: '48px', color: 'var(--accent-secondary)', marginBottom: '12px' }} />
            <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>No Dark Web Threats Detected</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
              Click "Run Dark Web Scan" to search Ahmia and Pastebin for active mentions.
            </p>
          </div>
        ) : (
          <div>
            {darkWebThreats.map((threat) => (
              <ThreatCard key={threat.id} threat={threat} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
