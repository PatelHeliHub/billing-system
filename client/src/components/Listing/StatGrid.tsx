import React from 'react';

interface StatItem {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  bg?: string;
}

interface StatGridProps {
  stats: StatItem[];
}

const StatGrid: React.FC<StatGridProps> = ({ stats }) => {
  return (
    <div 
      className="stat-grid" 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1rem' 
      }}
    >
      {stats.map((stat, index) => (
        <div key={index} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              backgroundColor: stat.bg || 'var(--primary-light)', 
              color: stat.color || 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {stat.icon}
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.title}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{stat.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatGrid;
