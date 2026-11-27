import React from 'react';

interface ActionButton {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'outline' | 'danger';
}

interface ModuleHeaderProps {
  title: string;
  description: string;
  actions: ActionButton[];
}

const ModuleHeader: React.FC<ModuleHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="module-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: '8px' }}>{title}</h1>
        <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>{description}</p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {actions.map((action, index) => (
          <button 
            key={index} 
            className={`btn-${action.variant || 'outline'}`} 
            onClick={action.onClick}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModuleHeader;
