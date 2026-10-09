import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';

export default function StatCard({ title, value, subtitle, icon: IconComponent, trend, trendDirection, accentColor }) {
  return (
    <div className="card stat-card" style={accentColor ? { borderLeft: `5px solid ${accentColor}` } : {}}>
      <div className="card-header">
        <span className="card-title">{title}</span>
        {IconComponent && (
          <div className="stat-icon" style={accentColor ? { color: accentColor } : {}}>
            {typeof IconComponent === 'function' || typeof IconComponent === 'object' ? <IconComponent /> : IconComponent}
          </div>
        )}
      </div>
      <div className="card-value" style={accentColor ? { color: accentColor } : {}}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
        {trend && (
          <span className={`stat-trend ${trendDirection || 'up'}`}>
            {trendDirection === 'down' ? <HiTrendingDown /> : <HiTrendingUp />}
            <span>{trend}</span>
          </span>
        )}
        {subtitle && <span className="card-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
