import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface SelectFilter {
  name: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  selectFilters: SelectFilter[];
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: FilterOption[];
  onReset: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  selectFilters,
  sortValue,
  onSortChange,
  sortOptions,
  onReset
}) => {
  return (
    <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '0.75rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-muted)' 
            }} 
          />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.625rem 0.875rem 0.625rem 2.5rem', 
              border: '1px solid var(--border-color)', 
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {selectFilters.map((filter, index) => (
            <select
              key={index}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="form-group"
              style={{ padding: '0.5rem 2rem 0.5rem 1rem', marginBottom: 0, height: '40px' }}
            >
              <option value="all">{filter.placeholder}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}

          {/* Sort */}
          <select
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
            className="form-group"
            style={{ padding: '0.5rem 2rem 0.5rem 1rem', marginBottom: 0, height: '40px' }}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Reset */}
          <button 
            className="btn-outline" 
            onClick={onReset}
            style={{ height: '40px', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
