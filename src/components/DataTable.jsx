import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  X 
} from 'lucide-react';

/**
 * Enterprise Sortable Table Header Component
 */
export function SortableTh({
  sortKey,
  currentSort,
  onSort,
  children,
  align = 'left',
  width,
  minWidth,
  style = {}
}) {
  const isSorted = currentSort && currentSort.key === sortKey;
  const direction = isSorted ? currentSort.direction : null;

  return (
    <th
      onClick={() => onSort && onSort(sortKey)}
      style={{
        padding: '12px 14px',
        textAlign: align,
        width,
        minWidth,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background-color 0.15s ease',
        ...style
      }}
      title={`Click to sort by ${typeof children === 'string' ? children : sortKey}`}
      className="sortable-table-th"
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f1f5f9';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '';
      }}
    >
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
        width: '100%'
      }}>
        <span style={{
          color: isSorted ? '#0284c7' : 'inherit',
          fontWeight: isSorted ? '800' : '700'
        }}>
          {children}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {isSorted ? (
            direction === 'asc' ? (
              <ArrowUp style={{ width: '13px', height: '13px', color: '#0284c7', strokeWidth: 2.5 }} />
            ) : (
              <ArrowDown style={{ width: '13px', height: '13px', color: '#0284c7', strokeWidth: 2.5 }} />
            )
          ) : (
            <ArrowUpDown style={{ width: '12px', height: '12px', color: '#94a3b8', opacity: 0.6 }} />
          )}
        </span>
      </div>
    </th>
  );
}

/**
 * Enterprise Table Pagination Component
 */
export function TablePagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  accentColor = '#0284c7'
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const pages = getPageNumbers();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e5e7eb',
      flexWrap: 'wrap',
      gap: '12px',
      fontSize: '0.825rem',
      color: '#4b5563'
    }}>
      {/* Left: Summary and Page Size Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div>
          Showing <strong style={{ color: '#111827' }}>{from}</strong> to <strong style={{ color: '#111827' }}>{to}</strong> of <strong style={{ color: '#111827' }}>{totalItems}</strong> entries
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange && onPageSizeChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              fontSize: '0.8rem',
              color: '#111827',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Navigation Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            color: currentPage <= 1 ? '#9ca3af' : '#374151',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: '600',
            transition: 'all 0.15s ease'
          }}
          title="Previous Page"
        >
          <ChevronLeft style={{ width: '14px', height: '14px' }} />
          <span>Prev</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} style={{ padding: '0 6px', color: '#9ca3af' }}>
                  &hellip;
                </span>
              );
            }

            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                onClick={() => onPageChange && onPageChange(p)}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  padding: '0 6px',
                  borderRadius: '6px',
                  border: isCurrent ? 'none' : '1px solid #e5e7eb',
                  backgroundColor: isCurrent ? accentColor : '#ffffff',
                  color: isCurrent ? '#ffffff' : '#374151',
                  fontWeight: isCurrent ? '800' : '600',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: isCurrent ? '0 1px 2px rgba(0,0,0,0.15)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            color: currentPage >= totalPages ? '#9ca3af' : '#374151',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: '600',
            transition: 'all 0.15s ease'
          }}
          title="Next Page"
        >
          <span>Next</span>
          <ChevronRight style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
    </div>
  );
}

/**
 * Standard Table Search Bar with result counter and quick clear
 */
export function TableSearchInput({
  value,
  onChange,
  placeholder = 'Search table...',
  totalMatches,
  totalItems,
  width = '300px'
}) {
  return (
    <div style={{ position: 'relative', width }}>
      <Search style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '15px',
        height: '15px',
        color: '#9ca3af',
        pointerEvents: 'none'
      }} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 36px 8px 34px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          fontSize: '0.825rem',
          backgroundColor: '#ffffff',
          color: '#111827',
          outline: 'none',
          boxSizing: 'border-box'
        }}
      />
      {value ? (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            border: 'none',
            background: 'none',
            padding: '2px',
            cursor: 'pointer',
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Clear search"
        >
          <X style={{ width: '14px', height: '14px' }} />
        </button>
      ) : null}
    </div>
  );
}
