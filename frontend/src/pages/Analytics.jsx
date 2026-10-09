import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { threatsApi } from '../utils/api';

const tooltipStyle = {
  background: '#E6E9EF',
  borderRadius: '12px',
  boxShadow: '6px 6px 14px #c2c7d0, -6px -6px 14px #ffffff',
  border: 'none',
  fontFamily: 'Plus Jakarta Sans',
  color: '#1E293B',
};

const PLATFORM_LABELS = {
  google_play: 'Play Store',
  apple_store: 'App Store',
  twitter: 'Twitter',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  dark_web: 'Dark Web',
  google_search: 'Google Search',
};

const ACTION_COLORS = {
  TAKEDOWN_REQUEST: '#EF4444',
  REVIEW: '#F59E0B',
  MONITOR: '#6366F1',
  NONE: '#94A3B8',
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, threatsRes] = await Promise.all([
          threatsApi.stats(),
          threatsApi.list({ limit: 500 }),
        ]);
        setStats(statsRes);
        setThreats(threatsRes.threats || []);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ── Derived chart data ── */

  // Platform risk breakdown: high / medium / safe per platform
  const platformRisk = stats?.by_platform
    ? Object.entries(stats.by_platform).map(([key, total]) => {
        const label = PLATFORM_LABELS[key] || key;
        const high   = threats.filter(t => t.platform === key && (t.threat_level === 'HIGH_RISK' || t.threat_level === 'HIGH')).length;
        const medium = threats.filter(t => t.platform === key && t.threat_level === 'MEDIUM').length;
        const safe   = total - high - medium;
        return { platform: label, high, medium, safe: Math.max(safe, 0) };
      })
    : [];

  // Action breakdown donut
  const actionCounts = threats.reduce((acc, t) => {
    const action = t.recommended_action || 'NONE';
    acc[action] = (acc[action] || 0) + 1;
    return acc;
  }, {});

  const actionData = Object.entries(actionCounts).map(([name, value]) => ({
    name: name === 'TAKEDOWN_REQUEST' ? 'Takedown' : name === 'REVIEW' ? 'Review' : name === 'MONITOR' ? 'Monitor' : 'None',
    value,
    color: ACTION_COLORS[name] || '#94A3B8',
  }));

  // Threat level totals
  const total       = stats?.total ?? 0;
  const highRisk    = stats?.by_level?.HIGH_RISK ?? 0;
  const medium      = stats?.by_level?.MEDIUM ?? 0;
  const safe        = stats?.by_level?.SAFE ?? 0;
  const takedowns   = actionCounts['TAKEDOWN_REQUEST'] || 0;
  const aiCovered   = threats.filter(t => t.ai_reason).length;
  const aiPrecision = total > 0 ? Math.round((aiCovered / total) * 100) : 0;

  // Confidence distribution bar chart
  const confBuckets = [
    { range: '0–20%',  count: threats.filter(t => t.confidence_score <= 20).length },
    { range: '21–40%', count: threats.filter(t => t.confidence_score > 20 && t.confidence_score <= 40).length },
    { range: '41–60%', count: threats.filter(t => t.confidence_score > 40 && t.confidence_score <= 60).length },
    { range: '61–80%', count: threats.filter(t => t.confidence_score > 60 && t.confidence_score <= 80).length },
    { range: '81–100%',count: threats.filter(t => t.confidence_score > 80).length },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)', fontSize: '16px' }}>
        Loading analytics…
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics &amp; Intelligence</h1>
        <p className="page-subtitle">
          Live threat breakdown, platform risk profiles, and response metrics — all from your database.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card" style={{ borderLeft: '5px solid var(--threat-high)' }}>
          <div className="card-title">Total Threats</div>
          <div className="card-value" style={{ color: 'var(--threat-high)' }}>{total}</div>
          <div className="card-subtitle">in database</div>
        </div>
        <div className="card" style={{ borderLeft: '5px solid #F59E0B' }}>
          <div className="card-title">High Risk</div>
          <div className="card-value" style={{ color: '#F59E0B' }}>{highRisk}</div>
          <div className="card-subtitle">immediate action needed</div>
        </div>
        <div className="card" style={{ borderLeft: '5px solid var(--threat-safe)' }}>
          <div className="card-title">Safe / Verified</div>
          <div className="card-value" style={{ color: 'var(--threat-safe)' }}>{safe}</div>
          <div className="card-subtitle">no action required</div>
        </div>
        <div className="card" style={{ borderLeft: '5px solid var(--accent-primary)' }}>
          <div className="card-title">AI Coverage</div>
          <div className="card-value" style={{ color: 'var(--accent-primary)' }}>{aiPrecision}%</div>
          <div className="card-subtitle">threats AI-analysed</div>
        </div>
        <div className="card" style={{ borderLeft: '5px solid #EF4444' }}>
          <div className="card-title">Takedown Queue</div>
          <div className="card-value" style={{ color: '#EF4444' }}>{takedowns}</div>
          <div className="card-subtitle">pending requests</div>
        </div>
      </div>

      {/* Platform Risk + Action Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>

        {/* Platform Risk Breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Risk Distribution by Platform</span>
          </div>
          {platformRisk.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={platformRisk} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="platform" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Plus Jakarta Sans' }} width={90} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Plus Jakarta Sans' }} />
                <Bar dataKey="high"   name="High"   stackId="a" fill="#EF4444" />
                <Bar dataKey="medium" name="Medium" stackId="a" fill="#F59E0B" />
                <Bar dataKey="safe"   name="Safe"   stackId="a" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No platform data yet — run a scan first.</div>
          )}
        </div>

        {/* Response Action Donut */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Response Action Breakdown</span>
          </div>
          {actionData.length > 0 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={actionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      labelLine={false}
                      label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                    >
                      {actionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} (${threats.length > 0 ? ((v / threats.length) * 100).toFixed(1) : 0}%)`, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend with percentages */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '8px' }}>
                {actionData.map(d => {
                  const pct = threats.length > 0 ? Math.round((d.value / threats.length) * 100) : 0;
                  return (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                      {d.name}: {d.value} ({pct}%)
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No action data yet.</div>
          )}
        </div>
      </div>

      {/* AI Confidence Distribution */}
      <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card-header">
          <span className="card-title">AI Confidence Distribution</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={confBuckets}>
            <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Threats" fill="var(--accent-primary)" radius={[8, 8, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Threats per Platform bar */}
      {stats?.by_platform && Object.keys(stats.by_platform).length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Total Threats by Platform</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={Object.entries(stats.by_platform).map(([k, v]) => ({
                name: PLATFORM_LABELS[k] || k,
                threats: v,
              }))}
            >
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="threats" name="Threats" fill="var(--accent-secondary)" radius={[8, 8, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
