import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import ThreatCard from '../components/ThreatCard';
import { threatsApi } from '../utils/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { HiExclamationTriangle, HiShieldCheck, HiGlobeAlt, HiSparkles, HiMagnifyingGlass } from 'react-icons/hi2';
import { useSearch, matchesThreatSearch } from '../utils/SearchContext';

export default function Dashboard() {
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { query: searchQuery } = useSearch();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const threatsRes = await threatsApi.list({ limit: 50 });
        setThreats(threatsRes.threats || []);

        const statsRes = await threatsApi.stats();
        setStats(statsRes);
      } catch (err) {
        console.error("Error loading dashboard SQLite data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const levelFiltered = filter === 'all' ? threats : threats.filter(t => t.threat_level === filter);
  const filteredThreats = levelFiltered.filter(t => matchesThreatSearch(t, searchQuery));

  // Standard monitored platforms list
  const STANDARD_PLATFORMS = [
    { key: 'google_play', name: 'Play Store' },
    { key: 'apple_store', name: 'App Store' },
    { key: 'twitter', name: 'Twitter' },
    { key: 'instagram', name: 'Instagram' },
    { key: 'facebook', name: 'Facebook' },
    { key: 'linkedin', name: 'LinkedIn' },
    { key: 'dark_web', name: 'Dark Web' },
  ];

  // Merge SQLite stats with standard platforms
  const platformChartData = STANDARD_PLATFORMS.map(p => ({
    name: p.name,
    threats: stats?.by_platform?.[p.key] || 0,
  }));

  // If there are extra platforms in stats not in standard list, include them
  if (stats?.by_platform) {
    Object.keys(stats.by_platform).forEach(key => {
      if (!STANDARD_PLATFORMS.some(p => p.key === key)) {
        const label = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
        platformChartData.push({ name: label, threats: stats.by_platform[key] });
      }
    });
  }

  // Compute donut chart data dynamically from SQLite stats
  const donutChartData = [
    { name: 'High Risk', value: stats?.by_level?.HIGH_RISK || 0, color: '#EF4444' },
    { name: 'Medium Risk', value: stats?.by_level?.MEDIUM || 0, color: '#F59E0B' },
    { name: 'Safe', value: stats?.by_level?.SAFE || 0, color: '#10B981' },
  ];

  const totalDonutSum = donutChartData.reduce((acc, curr) => acc + curr.value, 0);

  const totalThreatsCount = stats ? (stats.total_threats || 0) : threats.length;
  const highRiskCount = stats?.by_level?.HIGH_RISK || threats.filter(t => t.threat_level === 'HIGH_RISK').length;

  return (
    <div>
      {/* Stats Row */}
      <div className="stats-grid">
        <StatCard
          title="Total Threats"
          value={totalThreatsCount.toString()}
          trend="Live"
          trendDirection="up"
          subtitle="Real-time sync"
          icon={HiExclamationTriangle}
          accentColor="var(--threat-high)"
        />
        <StatCard
          title="High Risk Items"
          value={highRiskCount.toString()}
          trend="Immediate"
          trendDirection="up"
          subtitle="Takedown ready"
          icon={HiExclamationTriangle}
          accentColor="var(--threat-high)"
        />
        <StatCard
          title="Platforms Monitored"
          value="9"
          subtitle="Includes Dark Web & Ahmia"
          icon={HiGlobeAlt}
          accentColor="var(--accent-secondary)"
        />
        <StatCard
          title="AI Threat Analyses"
          value={totalThreatsCount.toString()}
          trend="Active"
          trendDirection="up"
          subtitle="AI verified"
          icon={HiSparkles}
          accentColor="var(--accent-primary)"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        {/* Threats by Platform */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Threats by Platform</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={platformChartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ 
                  background: '#E6E9EF',
                  borderRadius: '12px',
                  boxShadow: '6px 6px 14px #c2c7d0, -6px -6px 14px #ffffff',
                  border: 'none',
                  fontFamily: 'Plus Jakarta Sans',
                }} 
              />
              <Bar dataKey="threats" fill="var(--accent-primary)" radius={[8, 8, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Donut */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Threat Breakdown</span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>
              Total: {totalDonutSum}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutChartData}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val, name) => [
                      `${val} (${totalDonutSum > 0 ? ((val / totalDonutSum) * 100).toFixed(1) : 0}%)`,
                      name
                    ]}
                    contentStyle={{ 
                      background: '#E6E9EF',
                      borderRadius: '12px',
                      boxShadow: '6px 6px 14px #c2c7d0, -6px -6px 14px #ffffff',
                      border: 'none',
                      fontFamily: 'Plus Jakarta Sans',
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {totalDonutSum > 0 ? `${Math.round(((donutChartData[2].value) / totalDonutSum) * 100)}%` : '0%'}
                </div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--threat-safe)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Safe Rate
                </div>
              </div>
            </div>

            {/* Legend with exact percentages */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' }}>
              {donutChartData.map((item) => {
                const pct = totalDonutSum > 0 ? Math.round((item.value / totalDonutSum) * 100) : 0;
                return (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: item.color }} />
                    <span>{item.name}:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>{item.value} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Threats Feed */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
          <span className="card-title" style={{ fontSize: 'var(--font-size-md)' }}>
            Detected Threats Feed
            {searchQuery && (
              <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '600', color: 'var(--accent-primary)', background: 'rgba(99,102,241,0.08)', padding: '2px 8px', borderRadius: '20px' }}>
                "{searchQuery}" — {filteredThreats.length} result{filteredThreats.length !== 1 ? 's' : ''}
              </span>
            )}
          </span>
          <div className="filter-chips">
            {['all', 'HIGH_RISK', 'MEDIUM', 'SAFE'].map(f => (
              <button
                key={f}
                className={`chip ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All Items' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading scan results...
          </div>
        ) : filteredThreats.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {searchQuery
              ? <><HiMagnifyingGlass style={{ fontSize: '28px', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />No threats matched "{searchQuery}". Try a different keyword.</>
              : 'No threat records found. Run a scan on the Scan Now page to analyze brand presence.'}
          </div>
        ) : (
          <div>
            {filteredThreats.map(threat => (
              <ThreatCard key={threat.id} threat={threat} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
