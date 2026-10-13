// Shared Merchant Dashboard Utilities

export const formatK = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '₹0';
  const val = Number(num);
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${val.toLocaleString('en-IN')}`;
};

export const formatCurrency = (amt) => {
  if (amt === null || amt === undefined || isNaN(amt)) return '₹0.00';
  return `₹${Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const maskPhone = (phone) => {
  if (!phone) return '••••••••••';
  const p = String(phone).replace(/\D/g, '');
  if (p.length >= 10) {
    return `${p.slice(0, 2)}XXXXXX${p.slice(-2)}`;
  }
  return p;
};

export const getCohortBadge = (spend, visits) => {
  const s = Number(spend) || 0;
  const v = Number(visits) || 0;
  if (s >= 5000 || v >= 5) {
    return { label: 'VIP Spender', color: '#854d0e', bg: '#fef9c3', border: '#fde047' };
  }
  if (v >= 2) {
    return { label: 'Repeat Customer', color: '#166534', bg: '#dcfce7', border: '#86efac' };
  }
  return { label: 'New Customer', color: '#1e40af', bg: '#dbeafe', border: '#93c5fd' };
};

export const formatDisplayDate = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    
    // Check if it's an ISO UTC string ending with Z or .000Z
    // In Indian Standard Time (IST UTC+5:30), 1995-10-23T18:30:00.000Z corresponds to 1995-10-24
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return String(dateVal);
  }
};

export const formatInputDate = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

