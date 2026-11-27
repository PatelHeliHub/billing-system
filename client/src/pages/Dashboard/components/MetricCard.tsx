import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  iconBg?: string;
  iconColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendLabel,
  iconBg = 'var(--primary-light)',
  iconColor = 'var(--primary)'
}) => {
  const isPositive = trend && trend > 0;
  
  return (
    <div className="card metric-card">
      <div className="metric-info">
        <h3>{title}</h3>
        <div className="value">{value}</div>
        {trend !== undefined && (
          <div className={`trend ${isPositive ? 'up' : 'down'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(trend)}%</span>
            <span className="text-muted" style={{ fontWeight: 400, marginLeft: '4px' }}>{trendLabel || 'vs yesterday'}</span>
          </div>
        )}
      </div>
      <div className="icon-wrapper" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
    </div>
  );
};

export default MetricCard;
