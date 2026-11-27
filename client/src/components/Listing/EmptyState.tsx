import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actionLabel, onAction }) => {
  return (
    <div 
      className="card" 
      style={{ 
        padding: '4rem 2rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed'
      }}
    >
      <div 
        style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--primary-light)', 
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}
      >
        {icon}
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
      <p className="text-muted" style={{ maxWidth: '400px', marginBottom: '2rem' }}>{description}</p>
      {actionLabel && onAction && (
        <button className="btn-primary" onClick={onAction}>
          <Plus size={18} /> {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
