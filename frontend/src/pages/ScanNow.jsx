import { useState, useEffect, useRef } from 'react';
import ScanProgress from '../components/ScanProgress';
import ThreatCard from '../components/ThreatCard';
import { scanApi, brandApi, threatsApi } from '../utils/api';
import { FaGooglePlay, FaApple, FaTwitter, FaInstagram, FaYoutube, FaFacebook, FaLinkedin, FaGlobe, FaMagnifyingGlass, FaShieldHalved, FaRocket, FaBolt, FaTriangleExclamation } from 'react-icons/fa6';

const ALL_PLATFORMS = [
  'google_play', 'apple_store', 'twitter', 'instagram',
  'youtube', 'facebook', 'linkedin', 'dark_web', 'google_search',
];

const PLATFORM_CONFIG = {
  google_play: { label: 'Google Play', icon: FaGooglePlay, color: '#01875F' },
  apple_store: { label: 'Apple Store', icon: FaApple, color: '#000000' },
  twitter: { label: 'Twitter/X', icon: FaTwitter, color: '#1DA1F2' },
  instagram: { label: 'Instagram', icon: FaInstagram, color: '#E4405F' },
  youtube: { label: 'YouTube', icon: FaYoutube, color: '#FF0000' },
  facebook: { label: 'Facebook', icon: FaFacebook, color: '#1877F2' },
  linkedin: { label: 'LinkedIn', icon: FaLinkedin, color: '#0A66C2' },
  dark_web: { label: 'Dark Web', icon: FaShieldHalved, color: '#475569' },
  google_search: { label: 'Google Search', icon: FaMagnifyingGlass, color: '#4285F4' },
};

export default function ScanNow() {
  const currentUser = JSON.parse(localStorage.getItem('did_user')) || { username: 'mithun', role: 'ADMIN', email: 'mithun@defence.ai' };
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(ALL_PLATFORMS);
  const [scanning, setScanning] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [scanData, setScanData] = useState(null);
  const [results, setResults] = useState([]);
  const pollRef = useRef(null);

  useEffect(() => {
    brandApi.list(currentUser.username).then(data => {
      setBrands(data.brands || []);
      if (data.brands?.length > 0) setSelectedBrand(data.brands[0].id);
    }).catch(() => {});
  }, []);

  const togglePlatform = (p) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const startScan = async () => {
    if (!selectedBrand) return;
    setScanning(true);
    setResults([]);

    try {
      const data = await scanApi.start(selectedBrand, selectedPlatforms);
      setJobId(data.job_id);

      pollRef.current = setInterval(async () => {
        try {
          const status = await scanApi.status(data.job_id);
          setScanData(status);

          if (status.job?.status === 'completed' || status.job?.status === 'failed') {
            clearInterval(pollRef.current);
            setScanning(false);
            const threats = await threatsApi.list({ brand_id: selectedBrand, limit: 50 });
            setResults(threats.threats || []);
          }
        } catch (err) {
          console.error('Poll error:', err);
        }
      }, 1500);
    } catch (err) {
      setScanning(false);
      console.error('Scan error:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Scan Now</h1>
        <p className="page-subtitle">
          Launch an autonomous multi-platform threat scan across mobile stores, web search, and social networks.
        </p>
      </div>

      {/* Brand Selection */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="form-label" style={{ marginBottom: 'var(--space-md)' }}>Select Brand Profile</div>
        {brands.length > 0 ? (
          <select
            className="form-input"
            value={selectedBrand || ''}
            onChange={e => setSelectedBrand(e.target.value)}
          >
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.brand_name} {b.website_url ? `(${b.website_url})` : ''}</option>
            ))}
          </select>
        ) : (
          <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <FaTriangleExclamation style={{ color: 'var(--threat-medium)', fontSize: '20px' }} />
            <span>No brand profiles found. <a href="/brand-profile">Create one first →</a></span>
          </div>
        )}
      </div>

      {/* Platform Selection */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="form-label" style={{ marginBottom: 'var(--space-md)' }}>Target Platforms</div>
        <div className="filter-chips">
          <button
            className={`chip ${selectedPlatforms.length === ALL_PLATFORMS.length ? 'active' : ''}`}
            onClick={() => setSelectedPlatforms(
              selectedPlatforms.length === ALL_PLATFORMS.length ? [] : ALL_PLATFORMS
            )}
          >
            <FaGlobe style={{ fontSize: '15px' }} />
            <span>All Platforms</span>
          </button>
          {ALL_PLATFORMS.map(p => {
            const conf = PLATFORM_CONFIG[p];
            const Icon = conf?.icon || FaGlobe;
            const isSelected = selectedPlatforms.includes(p);
            return (
              <button
                key={p}
                className={`chip ${isSelected ? 'active' : ''}`}
                onClick={() => togglePlatform(p)}
              >
                <Icon style={{ color: isSelected ? 'var(--accent-primary)' : conf?.color, fontSize: '15px' }} />
                <span>{conf?.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Launch Button */}
      <button
        className="btn btn-primary btn-lg btn-block"
        onClick={startScan}
        disabled={scanning || !selectedBrand || selectedPlatforms.length === 0}
        style={{ marginBottom: 'var(--space-xl)', fontSize: 'var(--font-size-lg)', gap: '12px' }}
      >
        {scanning ? (
          <>
            <FaBolt style={{ animation: 'spin 1s linear infinite' }} />
            <span>SCANNING IN PROGRESS...</span>
          </>
        ) : (
          <>
            <FaRocket />
            <span>LAUNCH MULTI-PLATFORM SCAN</span>
          </>
        )}
      </button>

      {/* Scan Progress */}
      {scanData && (
        <ScanProgress
          platforms={selectedPlatforms}
          currentPlatform={scanData.job?.current_platform}
          completed={scanData.job?.platforms_completed || 0}
          total={scanData.job?.platforms_total || 0}
          status={scanData.job?.status || 'pending'}
        />
      )}

      {/* Results */}
      {results.length > 0 && (
        <>
          <div className="page-title" style={{ fontSize: 'var(--font-size-xl)', marginTop: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
            Scan Results ({results.length} items analyzed)
          </div>
          {results.map(threat => (
            <ThreatCard key={threat.id} threat={threat} />
          ))}
        </>
      )}
    </div>
  );
}
