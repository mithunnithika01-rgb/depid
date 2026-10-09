import { useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../utils/api';
import { HiShieldCheck, HiExclamationTriangle, HiCheckCircle, HiFlag, HiShare, HiArrowLeft } from 'react-icons/hi2';
import { HiSearch } from 'react-icons/hi';

export default function PublicPortal() {
  const [checkUrl, setCheckUrl] = useState('');
  const [checking, setChecking] = useState(false);
  const [verdict, setVerdict] = useState(null);

  const [reportUrl, setReportUrl] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reported, setReported] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const isExternalUrl = (urlStr) => {
    try {
      const u = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
      return u.hostname !== 'localhost' && u.hostname !== '127.0.0.1';
    } catch {
      return false;
    }
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!checkUrl.trim()) return;

    if (!isExternalUrl(checkUrl)) {
      setErrorMsg('Please enter a valid external web URL (e.g. https://play.google.com/...)');
      return;
    }

    setChecking(true);
    setVerdict(null);

    try {
      const data = await publicApi.check(checkUrl);
      setVerdict(data);
    } catch (err) {
      setVerdict({
        verdict: 'ERROR',
        explanation: 'Could not verify this URL at the moment.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportUrl.trim()) return;

    if (!isExternalUrl(reportUrl)) {
      setErrorMsg('Only external public URLs can be reported.');
      return;
    }

    try {
      await publicApi.report(reportUrl, reportDesc);
      setReported(true);
      setReportUrl('');
      setReportDesc('');
      setErrorMsg(null);
    } catch (err) {
      console.error('Report error:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
      {/* Public Standalone Header */}
      <header style={{
        background: 'var(--bg-card)', borderBottom: 'var(--border-light)',
        boxShadow: 'var(--shadow-flat-sm)', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: '#FFFFFF', padding: '3px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-flat-sm)', overflow: 'hidden'
          }}>
            <img src="/logo.png" alt="DID Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Public Scam & Impersonation Checker
            </h1>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
              Official Community Verification Network
            </span>
          </div>
        </div>

        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-main)', border: 'var(--border-light)',
          color: 'var(--text-secondary)', textDecoration: 'none',
          fontSize: '13px', fontWeight: '700', boxShadow: 'var(--shadow-flat-sm)'
        }}>
          <HiArrowLeft /> <span>Admin Console</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '850px', margin: '40px auto', padding: '0 20px 60px 20px' }}>
        {/* Hero Header Card */}
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          <div style={{
            width: '64px', height: '64px', margin: '0 auto var(--space-md)',
            borderRadius: 'var(--radius-lg)', background: 'var(--bg-main)',
            boxShadow: 'var(--shadow-flat)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-primary)', fontSize: '32px'
          }}>
            <HiShieldCheck />
          </div>
          <h2 className="page-title" style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-sm)' }}>
            Verify Any Link or Report Impersonation
          </h2>
          <p className="page-subtitle" style={{ maxWidth: '580px', margin: '0 auto var(--space-xl)', color: 'var(--text-secondary)' }}>
            Check any suspicious link, mobile app, or social profile against ground-truth official profiles to prevent fraud and scams.
          </p>

          {/* URL Input Form */}
          <form onSubmit={handleCheck} style={{ maxWidth: '620px', margin: '0 auto', display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <div className="form-input" style={{ flex: 1, minWidth: '280px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HiSearch style={{ color: 'var(--text-muted)', fontSize: '20px' }} />
              <input
                type="text"
                placeholder="Paste public web link (e.g. https://...)"
                value={checkUrl}
                onChange={e => { setCheckUrl(e.target.value); setErrorMsg(null); }}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: 'var(--font-sans)', fontSize: 'var(--font-size-md)' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={checking} style={{ gap: '8px' }}>
              <HiSearch style={{ fontSize: '18px' }} />
              <span>{checking ? 'Analyzing...' : 'VERIFY URL'}</span>
            </button>
          </form>

          {errorMsg && (
            <div style={{ marginTop: 'var(--space-md)', color: 'var(--threat-high)', fontSize: '13px', fontWeight: '700' }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Verdict Output */}
        {verdict && (
          <div className="card" style={{
            textAlign: 'center', marginBottom: 'var(--space-xl)',
            borderLeft: verdict.verdict === 'SAFE' ? '6px solid var(--threat-safe)' : '6px solid var(--threat-high)'
          }}>
            <div style={{ fontSize: '42px', color: verdict.verdict === 'SAFE' ? 'var(--threat-safe)' : 'var(--threat-high)', marginBottom: 'var(--space-xs)' }}>
              {verdict.verdict === 'SAFE' ? <HiCheckCircle style={{ margin: '0 auto' }} /> : <HiExclamationTriangle style={{ margin: '0 auto' }} />}
            </div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: '800', marginBottom: 'var(--space-xs)' }}>
              {verdict.verdict === 'SAFE' ? 'Verified Official Asset' :
               verdict.verdict === 'HIGH_RISK' ? 'Danger — Impersonation Scam Detected' :
               verdict.verdict === 'MEDIUM' ? 'Suspicious Profile — Exercise Caution' :
               'Unscanned URL'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
              {verdict.explanation || 'No historical scan record found for this link.'}
            </p>
          </div>
        )}

        {/* Report Section */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-md)' }}>
            <HiFlag style={{ color: 'var(--threat-high)', fontSize: '24px' }} />
            <span className="card-title" style={{ fontSize: 'var(--font-size-md)' }}>Report Suspicious Link</span>
          </div>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Spotted a counterfeit app, phishing site, or fake social profile? Submit the external link below for automated AI inspection.
          </p>

          {reported && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--threat-safe-bg)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)',
              color: 'var(--threat-safe)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <HiCheckCircle style={{ fontSize: '20px' }} />
              <span>Report submitted successfully! Our verification pipeline will analyze it.</span>
            </div>
          )}

          <form onSubmit={handleReport}>
            <div className="form-group">
              <label className="form-label">External Suspicious URL *</label>
              <input
                className="form-input"
                value={reportUrl}
                onChange={e => { setReportUrl(e.target.value); setReported(false); setErrorMsg(null); }}
                placeholder="https://..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Notes / Description (Optional)</label>
              <textarea
                className="form-input"
                value={reportDesc}
                onChange={e => setReportDesc(e.target.value)}
                placeholder="Describe why this link appears to be a scam or lookalike..."
                rows={3}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-block" style={{ gap: '8px' }}>
              <HiShare style={{ fontSize: '18px' }} />
              <span>SUBMIT FOR ANALYSIS</span>
            </button>
          </form>
        </div>
      </main>

      {/* Public Footer */}
      <footer style={{ borderTop: 'var(--border-subtle)', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
        Protected by Multi-Layered AI Brand Defense • Community Security Verification
      </footer>
    </div>
  );
}
