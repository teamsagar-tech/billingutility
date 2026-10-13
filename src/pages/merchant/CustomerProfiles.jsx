import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  UserCheck,
  Search,
  Cake,
  Heart,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import CustomerSubnav from '../../components/CustomerSubnav';
import ProfileModal from '../../components/ProfileModal';
import { maskPhone, formatDisplayDate } from '../../utils/merchantUtils';

export default function CustomerProfiles() {
  const { profile, token, notifyToast } = useOutletContext();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'birthday' | 'anniversary' | 'complete' | 'incomplete'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProfileModal, setActiveProfileModal] = useState(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [token]);

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const name = (c.customer_name || c.name || '').toLowerCase();
    const phone = (c.phone || c.customer_phone || '').toLowerCase();
    const matchesSearch = name.includes(q) || phone.includes(q);

    if (!matchesSearch) return false;
    if (filterType === 'complete') return c.profile_status === 'complete';
    if (filterType === 'incomplete') return c.profile_status !== 'complete';
    if (filterType === 'birthday') return Boolean(c.dob);
    if (filterType === 'anniversary') return Boolean(c.anniversary_date);
    return true;
  });

  const bdayCount = customers.filter((c) => Boolean(c.dob)).length;
  const anniCount = customers.filter((c) => Boolean(c.anniversary_date)).length;
  const completeCount = customers.filter((c) => c.profile_status === 'complete').length;

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <CustomerSubnav
        totalCustomers={customers.length}
        totalProfiles={completeCount}
        totalOptouts={0}
        onCreateProfile={() => setActiveProfileModal({ phone: '' })}
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div
          onClick={() => setFilterType('all')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: `1.5px solid ${filterType === 'all' ? '#0284c7' : '#e2e8f0'}`,
            padding: '1.25rem',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>All Profiles</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{customers.length}</div>
          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>Directory overview</span>
        </div>

        <div
          onClick={() => setFilterType('birthday')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: `1.5px solid ${filterType === 'birthday' ? '#ec4899' : '#e2e8f0'}`,
            padding: '1.25rem',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#be185d', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cake style={{ width: '14px', height: '14px' }} />
            <span>Birthdays Saved</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#9d174d', marginTop: '4px' }}>{bdayCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#db2777', fontWeight: '600' }}>Automated B'day wishes enabled</span>
        </div>

        <div
          onClick={() => setFilterType('anniversary')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: `1.5px solid ${filterType === 'anniversary' ? '#8b5cf6' : '#e2e8f0'}`,
            padding: '1.25rem',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6d28d9', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Heart style={{ width: '14px', height: '14px' }} />
            <span>Anniversaries</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#5b21b6', marginTop: '4px' }}>{anniCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: '600' }}>Milestone greetings active</span>
        </div>

        <div
          onClick={() => setFilterType('complete')}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: `1.5px solid ${filterType === 'complete' ? '#16a34a' : '#e2e8f0'}`,
            padding: '1.25rem',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle style={{ width: '14px', height: '14px' }} />
            <span>Complete Profiles</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#14532d', marginTop: '4px' }}>{completeCount}</div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>Enriched demographics</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '10px', width: '15px', height: '15px', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search by customer phone or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.825rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setActiveProfileModal({ phone: '' })}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.8rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus style={{ width: '15px', height: '15px' }} />
            <span>Enrich New Profile</span>
          </button>

          <button
            onClick={fetchProfiles}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600' }}
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Profiles Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '10px 14px' }}>#</th>
                <th style={{ padding: '10px 14px' }}>Customer Name</th>
                <th style={{ padding: '10px 14px' }}>Mobile Number</th>
                <th style={{ padding: '10px 14px' }}>Date of Birth 🎂</th>
                <th style={{ padding: '10px 14px' }}>Anniversary 💍</th>
                <th style={{ padding: '10px 14px' }}>Gender</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>City</th>
                <th style={{ padding: '10px 14px' }}>Consent</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #0284c7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading profiles...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <UserCheck style={{ width: '32px', height: '32px', margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No customer profiles match this criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => {
                  const custPhone = c.phone || c.customer_phone || '';
                  const isComplete = c.profile_status === 'complete';

                  return (
                    <tr key={c.id || custPhone || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>
                        {c.customer_name || c.name || 'Shopper'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Link to={`/dashboard/customer-journey/${custPhone}`} style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}>
                          {maskPhone(custPhone)}
                        </Link>
                      </td>
                      <td style={{ padding: '12px 14px', color: c.dob ? '#9d174d' : '#94a3b8', fontWeight: c.dob ? '700' : 'normal' }}>
                        {formatDisplayDate(c.dob)}
                      </td>
                      <td style={{ padding: '12px 14px', color: c.anniversary_date ? '#6d28d9' : '#94a3b8', fontWeight: c.anniversary_date ? '700' : 'normal' }}>
                        {formatDisplayDate(c.anniversary_date)}
                      </td>
                      <td style={{ padding: '12px 14px', textTransform: 'capitalize' }}>
                        {c.gender === 'm' ? 'Male' : (c.gender === 'f' ? 'Female' : (c.gender || '—'))}
                      </td>
                      <td style={{ padding: '12px 14px', textTransform: 'capitalize' }}>
                        {c.marital_status === 'm' ? 'Married' : (c.marital_status === 'u' ? 'Unmarried' : '—')}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        {c.city || '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#dcfce7', color: '#15803d' }}>
                          DPDP Consented
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => setActiveProfileModal(c)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeProfileModal && (
        <ProfileModal
          customer={activeProfileModal}
          token={token}
          onClose={() => setActiveProfileModal(null)}
          onSaved={() => {
            notifyToast('Customer profile saved successfully!');
            fetchProfiles();
          }}
        />
      )}
    </div>
  );
}
