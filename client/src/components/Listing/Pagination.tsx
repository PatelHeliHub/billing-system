import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage, 
  onPageChange 
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push('...');
      }
    }
    return pages.filter((v, i, a) => a.indexOf(v) === i);
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.5rem 0',
        marginTop: '1rem'
      }}
    >
      <div className="text-muted" style={{ fontSize: '0.875rem' }}>
        Showing <strong>{startItem}-{endItem}</strong> of <strong>{totalItems}</strong> items
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button 
          className="btn-outline" 
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{ padding: '0.5rem', borderRadius: '8px' }}
        >
          <ChevronLeft size={18} />
        </button>
        
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={index} style={{ padding: '0 0.5rem', color: 'var(--text-muted)' }}>...</span>
          ) : (
            <button
              key={index}
              className={currentPage === page ? 'btn-primary' : 'btn-outline'}
              onClick={() => onPageChange(Number(page))}
              style={{ 
                minWidth: '36px', 
                height: '36px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '8px',
                padding: 0
              }}
            >
              {page}
            </button>
          )
        ))}

        <button 
          className="btn-outline" 
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{ padding: '0.5rem', borderRadius: '8px' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
