import React, { useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { TrendingUp, ArrowUpRight, DollarSign, Users, Award, Percent, Megaphone, Smartphone, Cake, Sparkles } from 'lucide-react';
import { formatK, formatCurrency } from '../../utils/merchantUtils';

export default function RoiExplorer() {
  const { profile, analytics, loading } = useOutletContext();

  const totalRev = Number(analytics?.totalRevenue ?? analytics?.metrics?.total_revenue ?? 0);
  const totalBills = Number(analytics?.totalInvoices ?? analytics?.metrics?.total_invoices ?? 0);
  const repeatRev = Number(analytics?.repeatRevenue || 0);
  const repeatBills = Number(analytics?.repeatBillsCount || 0);
  const repeatCust = Number(analytics?.returningCustomers || 0);

  // Dynamic WABA cost calculation (~₹0.45 per WhatsApp message)
  const WABA_RATE = 0.45;
  const totalMessages = totalBills; // Every POS bill generates a WhatsApp dispatch
  const totalCost = Number((totalMessages * WABA_RATE).toFixed(2));
  
  // Real ROI calculation: ((Revenue - Cost) / Cost) * 100
  const blendedRoi = totalCost > 0
    ? Math.round(((totalRev - totalCost) / totalCost) * 100)
    : 0;

  const returnPerRupee = totalCost > 0 ? (totalRev / totalCost).toFixed(2) : '0';

  // Dynamic Attribution Channels based on real store numbers
  const attributions = useMemo(() => {
    return [
      {
        id: 'waba_bills',
        name: 'WhatsApp Instant Digital Invoices',
        channel: 'WhatsApp WABA',
        icon: '📱',
        cost: totalCost,
        revenue: totalRev,
        billsCount: totalBills,
        uniqueShoppers: Number(analytics?.totalCustomers || 0),
        roi: totalCost > 0 ? `${Math.round(((totalRev - totalCost) / totalCost) * 100)}%` : '—',
        status: totalBills > 0 ? 'Live & Active' : 'No Dispatches Yet'
      },
      {
        id: 'repeat_loyalty',
        name: 'Loyalty Retention & Repeat Visits',
        channel: 'WhatsApp Post-Purchase',
        icon: '🔁',
        cost: Number((repeatBills * WABA_RATE).toFixed(2)),
        revenue: repeatRev,
        billsCount: repeatBills,
        uniqueShoppers: repeatCust,
        roi: repeatBills > 0 ? `${Math.round(((repeatRev - (repeatBills * WABA_RATE)) / (repeatBills * WABA_RATE)) * 100)}%` : '—',
        status: repeatBills > 0 ? 'High Retention' : 'Building Cohort'
      }
    ];
  }, [totalCost, totalRev, totalBills, repeatBills, repeatRev, repeatCust, analytics]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            ROI Explorer &amp; Message Attribution
          </h1>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Track direct revenue attribution from WhatsApp digital bills, messaging costs, and shopper retention
          </span>
        </div>
        <Link
          to="/dashboard/campaigns"
          style={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.825rem',
            fontWeight: '700',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Megaphone style={{ width: '15px', height: '15px' }} />
          <span>Launch Campaign</span>
        </Link>
      </div>

      {/* ROI KPI Cards (Live Computed) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Tracked Sales Revenue</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {formatCurrency(totalRev)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>↑ Attributed directly to digital bills</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Messaging Cost</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            ₹{totalCost.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {totalMessages} WhatsApp dispatches @ ₹{WABA_RATE}/msg
          </span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Average Blended ROI</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
            {blendedRoi > 0 ? `${blendedRoi.toLocaleString('en-IN')}%` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
            ₹{returnPerRupee} generated per ₹1 spent
          </span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Repeat Customers Driven</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {repeatCust} Shoppers
          </div>
          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>
            {repeatBills} repeat bills recorded
          </span>
        </div>
      </div>

      {/* Attribution Breakdown Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
          Channel &amp; Campaign Attribution Ledger
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Channel / Initiative</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Gateway</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Spend (Cost)</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Direct Revenue</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Bills Count</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Shoppers Reached</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Net ROI %</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {attributions.map((c, i) => (
                <tr key={c.id || i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '14px', fontWeight: '800', color: '#0f172a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px', color: '#475569' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.725rem', fontWeight: '700', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                      {c.channel}
                    </span>
                  </td>
                  <td style={{ padding: '14px', color: '#dc2626', fontWeight: '700' }}>
                    ₹{c.cost.toFixed(2)}
                  </td>
                  <td style={{ padding: '14px', fontWeight: '800', color: '#16a34a' }}>
                    {formatCurrency(c.revenue)}
                  </td>
                  <td style={{ padding: '14px', color: '#0f172a', fontWeight: '600' }}>
                    {c.billsCount}
                  </td>
                  <td style={{ padding: '14px', color: '#0f172a' }}>
                    {c.uniqueShoppers}
                  </td>
                  <td style={{ padding: '14px', fontWeight: '800', color: '#16a34a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{c.roi}</span>
                      {c.billsCount > 0 && <ArrowUpRight style={{ width: '14px', height: '14px' }} />}
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.725rem', fontWeight: '700', backgroundColor: '#dcfce7', color: '#15803d' }}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
