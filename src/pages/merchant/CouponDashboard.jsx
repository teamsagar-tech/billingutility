import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Tag, Plus, Copy, CheckCircle, Calendar, Sparkles, X, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDisplayDate, formatInputDate } from '../../utils/merchantUtils';

export default function CouponDashboard() {
  const { token, notifyToast } = useOutletContext();

  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({ totalCoupons: 0, redeemedCoupons: 0, availableCoupons: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    title: '',
    discount_type: 'flat',
    discount_value: 200,
    min_bill_amount: 1500,
    total_coupons: 100,
    valid_until: '2026-12-31'
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/coupons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const couponList = Array.isArray(data.data) ? data.data : (data.data?.coupons || []);
        setCoupons(couponList);
        const sum = data.summary || data.data?.summary || {};
        setStats({
          totalCoupons: sum.totalCoupons ?? (data.data?.totalCoupons || couponList.length),
          redeemedCoupons: sum.redeemedCoupons ?? (data.data?.redeemedCoupons || 0),
          availableCoupons: sum.availableCoupons ?? (data.data?.availableCoupons || couponList.length)
        });
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [token]);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/auth/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newCoupon,
          code: newCoupon.code.toUpperCase().trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        notifyToast(`Coupon ${newCoupon.code.toUpperCase()} created successfully!`);
        setShowCreateModal(false);
        setNewCoupon({ code: '', title: '', discount_type: 'flat', discount_value: 200, min_bill_amount: 1500, total_coupons: 100, valid_until: '2026-12-31' });
        fetchCoupons();
      } else {
        notifyToast(data.error || 'Failed to create coupon.');
      }
    } catch (err) {
      notifyToast('Network error creating coupon.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const newStatus = coupon.is_active ? 0 : 1;
      const res = await fetch(`/api/v1/auth/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(coupons.map((c) => (c.id === coupon.id ? { ...c, is_active: newStatus } : c)));
        notifyToast(`Coupon ${coupon.code} ${newStatus ? 'activated' : 'deactivated'}.`);
      }
    } catch (err) {
      notifyToast('Failed to update coupon status.');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    notifyToast(`Coupon code ${code} copied to clipboard!`);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
            Coupon Dashboard &amp; Adhoc Offers
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Generate promo codes, seasonal vouchers, and broadcast discount incentives over WhatsApp
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchCoupons}
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
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.825rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus style={{ width: '15px', height: '15px' }} />
            <span>+ Create Coupon</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Active Coupon Campaigns</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {coupons.filter((c) => c.is_active).length}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>{coupons.length} total created</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Issued Vouchers</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {stats.totalCoupons}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>Available across active campaigns</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Redeemed at Cashier</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
            {stats.redeemedCoupons}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>Applied on billing counter</span>
        </div>
      </div>

      {/* Coupons Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#4b5563', fontSize: '0.72rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>#</th>
              <th style={{ padding: '12px 16px' }}>Promo Code</th>
              <th style={{ padding: '12px 16px' }}>Campaign Title</th>
              <th style={{ padding: '12px 16px' }}>Discount Value</th>
              <th style={{ padding: '12px 16px' }}>Min Bill Amount</th>
              <th style={{ padding: '12px 16px' }}>Quota Used</th>
              <th style={{ padding: '12px 16px' }}>Valid Until</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  Loading coupons from database...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Tag style={{ width: '24px', height: '24px' }} />
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>
                      No Coupons Created Yet
                    </h3>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                      Create promotional codes to incentivize repeat purchases and reward top loyal shoppers.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      + Create First Coupon
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              coupons.map((c, i) => (
                <tr key={c.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{i + 1}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '800', color: '#0284c7', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                        {c.code}
                      </span>
                      <button
                        onClick={() => copyCode(c.code)}
                        title="Copy Code"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                      >
                        <Copy style={{ width: '13px', height: '13px' }} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#111827' }}>
                    {c.title}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '800', color: '#16a34a' }}>
                    {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT`}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4b5563' }}>
                    {formatCurrency(c.min_bill_amount)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>{c.redeemed_count || 0}</span>
                    <span style={{ color: '#94a3b8' }}> / {c.total_coupons}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#4b5563' }}>
                    {formatDisplayDate(c.valid_until)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleToggleActive(c)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: c.is_active ? '#dcfce7' : '#f1f5f9',
                        color: c.is_active ? '#166534' : '#64748b'
                      }}
                    >
                      {c.is_active ? '● Active' : '○ Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => copyCode(c.code)}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0284c7', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Share
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                Create New Coupon Code
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FESTIVE100"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Paithani Special ₹100 OFF"
                  value={newCoupon.title}
                  onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Discount Type</label>
                  <select
                    value={newCoupon.discount_type}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="flat">Flat ₹ Discount</option>
                    <option value="percentage">Percentage % OFF</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newCoupon.discount_value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Minimum Bill (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCoupon.min_bill_amount}
                    onChange={(e) => setNewCoupon({ ...newCoupon, min_bill_amount: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Total Coupon Quota</label>
                  <input
                    type="number"
                    min="1"
                    value={newCoupon.total_coupons}
                    onChange={(e) => setNewCoupon({ ...newCoupon, total_coupons: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Valid Until</label>
                <input
                  type="date"
                  value={newCoupon.valid_until}
                  onChange={(e) => setNewCoupon({ ...newCoupon, valid_until: e.target.value })}
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
                  disabled={submitting}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.825rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  {submitting ? 'Creating...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
