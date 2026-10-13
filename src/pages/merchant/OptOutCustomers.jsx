import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { UserX, Plus, RefreshCw, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import CustomerSubnav from '../../components/CustomerSubnav';
import { maskPhone } from '../../utils/merchantUtils';

export default function OptOutCustomers() {
  const { token, notifyToast } = useOutletContext();

  const [optoutList, setOptoutList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newReason, setNewReason] = useState('Customer requested DND');

  const fetchOptouts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/customers/optout', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOptoutList(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load opt-out list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptouts();
  }, [token]);

  const handleAddOptout = async (e) => {
    e.preventDefault();
    if (!newPhone) return;

    try {
      const res = await fetch('/api/v1/auth/customers/optout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: newPhone.trim(),
          channel: 'whatsapp',
          reason: newReason
        })
      });
      const data = await res.json();
      if (data.success) {
        notifyToast(`Number ${newPhone} added to DND blacklist.`);
        setNewPhone('');
        setShowAddForm(false);
        fetchOptouts();
      } else {
        alert(data.error || 'Failed to add to DND.');
      }
    } catch (err) {
      alert('Network error adding to DND list.');
    }
  };

  const handleRemoveOptout = async (id) => {
    if (!window.confirm('Are you sure you want to remove this customer from the DND opt-out list?')) return;
    try {
      const res = await fetch(`/api/v1/auth/customers/optout/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        notifyToast('Number removed from DND. Promotional messages re-enabled.');
        fetchOptouts();
      }
    } catch (err) {
      alert('Network error removing from DND.');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <CustomerSubnav totalOptouts={optoutList.length} />

      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: '0 0 2px', fontSize: '1.15rem', fontWeight: '800', color: '#111827' }}>
              DPDP Act 2023 &amp; WhatsApp Anti-Spam DND List
            </h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
              Numbers on this list will never receive promotional broadcasts or automated marketing campaigns.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.8rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus style={{ width: '15px', height: '15px' }} />
              <span>+ Add Number to DND</span>
            </button>

            <button
              onClick={fetchOptouts}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600' }}
            >
              <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddOptout} style={{ display: 'flex', gap: '10px', marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '10px', border: '1px solid #fee2e2', flexWrap: 'wrap' }}>
            <input
              type="tel"
              required
              placeholder="10-digit mobile number"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              style={{ flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
            <input
              type="text"
              placeholder="Reason (e.g. customer requested stop)"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
            <button
              type="submit"
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '700', fontSize: '0.825rem', cursor: 'pointer' }}
            >
              Save DND Entry
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.825rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 14px' }}>#</th>
              <th style={{ padding: '12px 14px' }}>Customer Mobile</th>
              <th style={{ padding: '12px 14px' }}>Restricted Channel</th>
              <th style={{ padding: '12px 14px' }}>Reason</th>
              <th style={{ padding: '12px 14px' }}>Date Blocked</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {optoutList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <ShieldCheck style={{ width: '36px', height: '36px', margin: '0 auto 8px', color: '#16a34a' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No customers have opted out. Your messaging list is 100% compliant!</p>
                </td>
              </tr>
            ) : (
              optoutList.map((item, idx) => (
                <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{idx + 1}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: '#111827' }}>{maskPhone(item.phone)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.7rem', fontWeight: '800' }}>
                      {item.channel?.toUpperCase() || 'WHATSAPP'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{item.reason || 'Customer Requested DND'}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : 'Recent'}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleRemoveOptout(item.id)}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fee2e2', backgroundColor: '#fff1f2', color: '#dc2626', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Unblock / Re-enable
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
