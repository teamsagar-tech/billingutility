import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Award, Save, RefreshCw, CheckCircle, ArrowUpRight, Search } from 'lucide-react';
import { formatCurrency, maskPhone } from '../../utils/merchantUtils';

export default function LoyaltyDashboard() {
  const { token, notifyToast } = useOutletContext();

  const [loyalty, setLoyalty] = useState({
    rupees_per_point: 100,
    min_points_redeem: 500,
    discount_value: 0.5
  });
  const [saving, setSaving] = useState(false);

  const transactions = [
    { id: 1, date: 'Today, 02:45 PM', customerName: 'Anita Sharma', phone: '9876543210', billNo: 'DS-8842', earned: 88, redeemed: 0, balance: 250 },
    { id: 2, date: 'Yesterday, 06:10 PM', customerName: 'Priya Joshi', phone: '9123456780', billNo: 'DS-8841', earned: 42, redeemed: 0, balance: 140 },
    { id: 3, date: 'Oct 11, 01:20 PM', customerName: 'Sunita Patil', phone: '9988776655', billNo: 'DS-8839', earned: 0, redeemed: 100, balance: 210 }
  ];

  const handleSaveLoyalty = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/v1/auth/loyalty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(loyalty)
      });
      const data = await res.json();
      if (data.success) {
        notifyToast('Loyalty earning & redemption rules saved successfully!');
      } else {
        alert(data.error || 'Failed to save loyalty settings.');
      }
    } catch (err) {
      notifyToast('Loyalty configuration updated locally.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
            Loyalty Program &amp; Points Rules
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Reward repeat shoppers with points on every digital bill and configure redemption ratios
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Rules Config Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
            Points Earning &amp; Value Rules
          </h3>

          <form onSubmit={handleSaveLoyalty} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                Spend Required for 1 Point (₹)
              </label>
              <input
                type="number"
                required
                value={loyalty.rupees_per_point}
                onChange={(e) => setLoyalty({ ...loyalty, rupees_per_point: parseInt(e.target.value, 10) || 100 })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Customer earns 1 point for every ₹{loyalty.rupees_per_point} spent.</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                Minimum Points Threshold to Redeem
              </label>
              <input
                type="number"
                required
                value={loyalty.min_points_redeem}
                onChange={(e) => setLoyalty({ ...loyalty, min_points_redeem: parseInt(e.target.value, 10) || 100 })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Shopper must accumulate at least {loyalty.min_points_redeem} points before cashier checkout redemption.</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                Rupees Value Per 1 Point (₹)
              </label>
              <input
                type="number"
                step="0.05"
                required
                value={loyalty.discount_value}
                onChange={(e) => setLoyalty({ ...loyalty, discount_value: parseFloat(e.target.value) || 0.5 })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>e.g. 500 points = ₹{(500 * (loyalty.discount_value || 0.5)).toFixed(2)} discount off the invoice.</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                marginTop: '6px'
              }}
            >
              <Save style={{ width: '15px', height: '15px' }} />
              <span>{saving ? 'Saving...' : 'Save Loyalty Rules'}</span>
            </button>
          </form>
        </div>

        {/* Recent Points Ledger Table */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
            Points Transaction Ledger
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Timestamp</th>
                  <th style={{ padding: '10px 12px' }}>Customer</th>
                  <th style={{ padding: '10px 12px' }}>Invoice</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Earned</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Redeemed</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', color: '#64748b' }}>{t.date}</td>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>
                      {t.customerName}
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{maskPhone(t.phone)}</div>
                    </td>
                    <td style={{ padding: '12px', color: '#0284c7', fontWeight: '600' }}>#{t.billNo}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#16a34a', fontWeight: '700' }}>
                      {t.earned > 0 ? `+${t.earned}` : '—'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#dc2626', fontWeight: '700' }}>
                      {t.redeemed > 0 ? `-${t.redeemed}` : '—'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '800', color: '#0f172a' }}>
                      {t.balance} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
