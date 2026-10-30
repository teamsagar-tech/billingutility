import { useState, useMemo, useEffect } from 'react';

/**
 * Universal Data Table Hook: Search, Column Sorting & Pagination
 * 
 * @param {Array} data - Raw data array
 * @param {Object} options - Configuration options
 * @param {Array} options.searchFields - Object keys to search against (e.g. ['invoiceNumber', 'customerPhone'])
 * @param {String} options.defaultSortKey - Initial sort column key
 * @param {String} options.defaultSortDir - Initial sort direction ('asc' | 'desc')
 * @param {Number} options.defaultPageSize - Default rows per page (default: 10)
 * @param {Function} options.customSortAccessor - Optional (item, key) => sortableValue
 * @param {Function} options.customFilter - Optional (item) => boolean
 */
export function useDataTable(data = [], options = {}) {
  const {
    searchFields = [],
    defaultSortKey = null,
    defaultSortDir = 'desc',
    defaultPageSize = 10,
    customSortAccessor = null,
    customFilter = null
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: defaultSortKey,
    direction: defaultSortDir
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // 1. Search & Filter
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data.filter((item) => {
      // Custom filter first if provided
      if (customFilter && !customFilter(item)) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      // If specific search fields defined, inspect them
      if (searchFields.length > 0) {
        return searchFields.some((field) => {
          const val = item[field];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      }

      // Otherwise inspect all top-level primitives
      return Object.values(item).some((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }, [data, searchQuery, customFilter, searchFields]);

  // 2. Column Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA;
      let valB;

      if (customSortAccessor) {
        valA = customSortAccessor(a, sortConfig.key);
        valB = customSortAccessor(b, sortConfig.key);
      } else {
        valA = a[sortConfig.key];
        valB = b[sortConfig.key];
      }

      // Handle null/undefined
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      // Number comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }

      // Date string comparison (e.g. ISO strings)
      if (
        typeof valA === 'string' &&
        typeof valB === 'string' &&
        (valA.includes('T') || valA.includes('-')) &&
        !isNaN(Date.parse(valA)) &&
        !isNaN(Date.parse(valB))
      ) {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      // String comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, customSortAccessor]);

  // 3. Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure current page doesn't exceed total pages
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, validCurrentPage, pageSize]);

  // Header Sort Toggle Handler
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Toggle direction
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  return {
    items: paginatedData,
    paginatedData,
    totalItems,
    totalPages,
    currentPage: validCurrentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    sortConfig,
    sortKey: sortConfig?.key,
    sortDir: sortConfig?.direction,
    handleSort
  };
}
