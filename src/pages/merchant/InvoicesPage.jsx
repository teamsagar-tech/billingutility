import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, RefreshCw, CheckCircle, Star, Eye, ExternalLink, Receipt, Filter } from 'lucide-react';
import { formatCurrency, maskPhone } from '../../utils/merchantUtils';

export default function InvoicesPage() {
  const { token, notifyToast } = useOutletContext();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setInvoices(data.data);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [token]);

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const invNum = (inv.invoiceNumber || inv.invoice_number || '').toLowerCase();
    const phone = (inv.customerPhone || inv.customer_phone || '').toLowerCase();
    const name = (inv.customerName || inv.customer_name || '').toLowerCase();
    const matchesSearch = invNum.includes(q) || phone.includes(q) || name.includes(q);

    const matchesStatus =
      statusFilter === 'all' ||
      (inv.whatsappStatus || inv.whatsapp_status || 'delivered').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
            Digital Bill Stream
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
            Real-time sales invoices ingested via POS Print Interceptor or ERP REST API
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '10px', width: '15px', height: '15px', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search bill #, phone, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.825rem' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.825rem', backgroundColor: '#ffffff' }}
          >
            <option value="all">All WhatsApp Status</option>
            <option value="read">Read (✓✓ Blue)</option>
            <option value="delivered">Delivered (✓✓)</option>
            <option value="sent">Sent (✓)</option>
            <option value="failed">Failed</option>
          </select>

          <button
            onClick={fetchInvoices}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600' }}
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px' }}>Invoice #</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Customer</th>
                <th style={{ padding: '12px 16px' }}>Amount (₹)</th>
                <th style={{ padding: '12px 16px' }}>WhatsApp Status</th>
                <th style={{ padding: '12px 16px' }}>Google Review</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #0284c7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading invoices...</p>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    <Receipt style={{ width: '32px', height: '32px', margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No invoices match your query.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const invNum = inv.invoiceNumber || inv.invoice_number;
                  const shortId = inv.shortId || inv.short_id;
                  const billAmt = inv.billTotal || inv.bill_total || 0;
                  const waStatus = inv.whatsappStatus || inv.whatsapp_status || 'delivered';
                  const custName = inv.customerName || inv.customer_name || 'Valued Customer';
                  const custPhone = inv.customerPhone || inv.customer_phone || 'N/A';
                  const dateStr = inv.createdAt || inv.created_at;

                  return (
                    <tr key={inv.id || shortId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#111827' }}>
                        #{invNum}
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 'normal' }}>
                          Short: {shortId}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.8rem' }}>
                        {dateStr ? new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{custName}</div>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{maskPhone(custPhone)}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '800', color: '#111827' }}>
                        {formatCurrency(billAmt)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.725rem',
                          fontWeight: '700',
                          backgroundColor: waStatus === 'read' ? '#dcfce7' : (waStatus === 'delivered' ? '#e0f2fe' : (waStatus === 'failed' ? '#fee2e2' : '#fef9c3')),
                          color: waStatus === 'read' ? '#166534' : (waStatus === 'delivered' ? '#0369a1' : (waStatus === 'failed' ? '#991b1b' : '#854d0e'))
                        }}>
                          {(waStatus === 'read' || waStatus === 'delivered') && <CheckCircle style={{ width: '12px', height: '12px' }} />}
                          {waStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {inv.hasReviewed ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.725rem', fontWeight: '800' }}>
                            <Star style={{ width: '12px', height: '12px', fill: '#f59e0b', color: '#f59e0b' }} />
                            <span>Reviewed ⭐</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            Pending
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <a
                          href={`/t/${shortId}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: '6px',
                            color: '#0284c7',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            textDecoration: 'none'
                          }}
                        >
                          <Eye style={{ width: '12px', height: '12px' }} />
                          <span>View Receipt</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
