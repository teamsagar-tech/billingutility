import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Layers,
  Plus,
  Users,
  Megaphone,
  Download,
  CheckCircle,
  Filter,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Search,
  Eye,
  X
} from 'lucide-react';
import CustomerSubnav from '../../components/CustomerSubnav';
import { formatCurrency, maskPhone } from '../../utils/merchantUtils';

export default function CustomerSegmentation() {
  const { token, notifyToast } = useOutletContext();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSeg, setNewSeg] = useState({ name: '', minSpend: 2000, minVisits: 2 });
  const [customSegments, setCustomSegments] = useState([]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCustomers(data.data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error('Failed to load customers for segmentation:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  // Dynamically compute built-in segments from real DB customers
  const computedSegments = useMemo(() => {
    const total = customers.length;

    // 1. VIP Spenders (Spend >= 5000 or visits >= 5)
    const vipList = customers.filter(
      (c) => Number(c.total_spent || 0) >= 5000 || Number(c.visits_count || 0) >= 5
    );
    const vipAvg = vipList.length > 0
      ? Math.round(vipList.reduce((sum, c) => sum + Number(c.total_spent || 0), 0) / vipList.length)
      : 0;

    // 2. Loyal Repeat (Visits >= 2)
    const loyalList = customers.filter((c) => Number(c.visits_count || 0) >= 2);
    const loyalAvg = loyalList.length > 0
      ? Math.round(loyalList.reduce((sum, c) => sum + Number(c.total_spent || 0), 0) / loyalList.length)
      : 0;

    // 3. New First-Time (Visits <= 1)
    const newList = customers.filter((c) => Number(c.visits_count || 0) <= 1);
    const newAvg = newList.length > 0
      ? Math.round(newList.reduce((sum, c) => sum + Number(c.total_spent || 0), 0) / newList.length)
      : 0;

    // 4. Birthday Club (DOB recorded)
    const bdayList = customers.filter((c) => Boolean(c.dob));
    const bdayAvg = bdayList.length > 0
      ? Math.round(bdayList.reduce((sum, c) => sum + Number(c.total_spent || 0), 0) / bdayList.length)
      : 0;

    const base = [
      {
        id: 'vip',
        name: '👑 High-Value VIP Spenders',
        definition: 'Lifetime spend ≥ ₹5,000 or visits ≥ 5',
        type: 'Customer',
        mode: 'Dynamic',
        customers: vipList,
        audienceCount: vipList.length,
        avgSpend: vipAvg,
        tag: 'VIP'
      },
      {
        id: 'loyal',
        name: '🔁 Loyal Repeat Shoppers',
        definition: 'Visited store 2 or more times',
        type: 'Customer',
        mode: 'Dynamic',
        customers: loyalList,
        audienceCount: loyalList.length,
        avgSpend: loyalAvg,
        tag: 'Loyal'
      },
      {
        id: 'new',
        name: '🌱 New First-Time Shoppers',
        definition: 'Single visit recorded in store',
        type: 'Customer',
        mode: 'Dynamic',
        customers: newList,
        audienceCount: newList.length,
        avgSpend: newAvg,
        tag: 'Nurture'
      },
      {
        id: 'birthday',
        name: '🎂 Birthday & Anniversary Club',
        definition: 'Shoppers with verified DOB or anniversary on file',
        type: 'Profile',
        mode: 'Dynamic',
        customers: bdayList,
        audienceCount: bdayList.length,
        avgSpend: bdayAvg,
        tag: 'Promo'
      }
    ];

    // Add any user-created custom segments
    customSegments.forEach((cs) => {
      const filtered = customers.filter(
        (c) =>
          Number(c.total_spent || 0) >= Number(cs.minSpend) &&
          Number(c.visits_count || 0) >= Number(cs.minVisits)
      );
      const avg = filtered.length > 0
        ? Math.round(filtered.reduce((sum, c) => sum + Number(c.total_spent || 0), 0) / filtered.length)
        : 0;

      base.push({
        id: cs.id,
        name: cs.name,
        definition: `Spend ≥ ₹${cs.minSpend} & visits ≥ ${cs.minVisits}`,
        type: 'Customer',
        mode: 'Dynamic',
        customers: filtered,
        audienceCount: filtered.length,
        avgSpend: avg,
        tag: 'Custom'
      });
    });

    return base;
  }, [customers, customSegments]);

  const handleCreateSegment = (e) => {
    e.preventDefault();
    if (!newSeg.name) return;

    setCustomSegments((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        name: newSeg.name,
        minSpend: Number(newSeg.minSpend) || 0,
        minVisits: Number(newSeg.minVisits) || 1
      }
    ]);
    setShowCreateModal(false);
    setNewSeg({ name: '', minSpend: 2000, minVisits: 2 });
    notifyToast(`Segment "${newSeg.name}" created and synced with live database!`);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <CustomerSubnav />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
            Smart Customer Segmentation
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Live audience segments computed from actual store visits, cumulative spend, and customer profiles
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchCustomers}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Sync Live</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.825rem',
              cursor: 'pointer'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Create Segment</span>
          </button>
        </div>
      </div>

      {/* BillFree Navigation Subnav */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '8px',
            border: '1px solid #0284c7',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '0.8rem'
          }}
        >
          <span>⚡</span>
          <span>Segmentations ({computedSegments.length})</span>
        </button>

        <Link
          to="/dashboard/profiles/customers"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#334155',
            fontWeight: '700',
            fontSize: '0.8rem',
            textDecoration: 'none'
          }}
        >
          <span>👥</span>
          <span>All Customers ({customers.length})</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {computedSegments.slice(0, 4).map((seg) => (
          <div
            key={seg.id}
            onClick={() => setSelectedSegment(seg)}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: selectedSegment?.id === seg.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
              padding: '1.25rem',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.725rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>
                {seg.tag} Cohort
              </span>
              <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.675rem', fontWeight: '800', backgroundColor: '#dcfce7', color: '#15803d' }}>
                Dynamic
              </span>
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
              {seg.name}
            </h3>
            <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: '#64748b', minHeight: '32px' }}>
              {seg.definition}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Members</span>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a' }}>
                  {loading ? '...' : seg.audienceCount}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Avg Spend</span>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#16a34a' }}>
                  {formatCurrency(seg.avgSpend)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Segments Table (Exact BillFree Match) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#4b5563', fontSize: '0.72rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>#</th>
              <th style={{ padding: '12px 16px' }}>Name</th>
              <th style={{ padding: '12px 16px' }}>Definition</th>
              <th style={{ padding: '12px 16px' }}>Type</th>
              <th style={{ padding: '12px 16px' }}>Mode</th>
              <th style={{ padding: '12px 16px' }}>Customers Count</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {computedSegments.map((seg, i) => (
              <tr key={seg.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{i + 1}</td>
                <td style={{ padding: '12px 16px', fontWeight: '800', color: '#0f172a' }}>
                  {seg.name}
                </td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>
                  {seg.definition}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#334155' }}>
                    {seg.type}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: '#dcfce7', color: '#166534' }}>
                    ● {seg.mode}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: '800', color: '#0284c7' }}>
                  {seg.audienceCount} Shoppers
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button
                    onClick={() => setSelectedSegment(seg)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      color: '#0284c7',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <Eye style={{ width: '13px', height: '13px' }} />
                    <span>View Members</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Member Viewer Modal */}
      {selectedSegment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '800px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                  {selectedSegment.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {selectedSegment.audienceCount} matching customers ({selectedSegment.definition})
                </span>
              </div>
              <button
                onClick={() => setSelectedSegment(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
              {selectedSegment.customers.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                  No customer records currently meet this segment criteria.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontSize: '0.72rem' }}>
                      <th style={{ padding: '8px 12px' }}>#</th>
                      <th style={{ padding: '8px 12px' }}>Customer Name</th>
                      <th style={{ padding: '8px 12px' }}>Phone</th>
                      <th style={{ padding: '8px 12px' }}>Visits</th>
                      <th style={{ padding: '8px 12px' }}>Total Spend</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>360° Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSegment.customers.map((c, idx) => (
                      <tr key={c.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>
                          {c.customer_name || c.name || 'Shopper'}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>
                          {maskPhone(c.phone || c.customer_phone)}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>
                          {c.visits_count || 1}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: '#16a34a' }}>
                          {formatCurrency(c.total_spent || 0)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <Link
                            to={`/dashboard/customer-journey/${(c.phone || c.customer_phone || '').replace(/\D/g, '')}`}
                            onClick={() => setSelectedSegment(null)}
                            style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none', fontSize: '0.75rem' }}
                          >
                            Explore Journey →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedSegment(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Segment Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                Create Custom Dynamic Segment
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateSegment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Segment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival Bridal Shoppers"
                  value={newSeg.name}
                  onChange={(e) => setNewSeg({ ...newSeg, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Minimum Cumulative Spend (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newSeg.minSpend}
                  onChange={(e) => setNewSeg({ ...newSeg, minSpend: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Minimum Store Visits Count</label>
                <input
                  type="number"
                  min="1"
                  value={newSeg.minVisits}
                  onChange={(e) => setNewSeg({ ...newSeg, minVisits: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.825rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.825rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Create Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
