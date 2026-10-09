import { useState } from 'react';
import { publicApi } from '../utils/api';
import { HiShieldCheck, HiExclamationTriangle, HiCheckCircle, HiQuestionMarkCircle, HiFlag, HiShare } from 'react-icons/hi2';
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
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Hero Header */}
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        <div style={{
          width: '64px', height: '64px', margin: '0 auto var(--space-md)',
          borderRadius: 'var(--radius-lg)', background: 'var(--bg-main)',
          boxShadow: 'var(--shadow-flat)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent-primary)', fontSize: '32px'
        }}>
          <HiShieldCheck />
        </div>
        <h1 className="page-title" style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-sm)' }}>
          Public Verification & Safety Portal
        </h1>
        <p className="page-subtitle" style={{ maxWidth: '580px', margin: '0 auto var(--space-xl)' }}>
          Check any suspicious link, mobile app, or social profile to verify whether it&apos;s an official brand asset or an impersonation scam.
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
            <span>Report submitted successfully! Our AI verification pipeline will analyze it.</span>
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
            <span>SUBMIT FOR AI ANALYSIS</span>
          </button>
        </form>
      </div>
    </div>
  );
}
