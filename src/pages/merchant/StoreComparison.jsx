import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Store, Star, ArrowUpRight, Award, MapPin, Calendar, Users, ShoppingBag, Coins, MessageSquare } from 'lucide-react';
import { formatK, formatCurrency } from '../../utils/merchantUtils';

export default function StoreComparison() {
  const { profile, analytics, loading } = useOutletContext();
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'daily' | 'trend'

  // Extract real live numbers from analytics
  const totalRev = Number(analytics?.totalRevenue ?? analytics?.metrics?.total_revenue ?? 0);
  const totalBills = Number(analytics?.totalInvoices ?? analytics?.metrics?.total_invoices ?? 0);
  const aov = Number(analytics?.avgOrderValue ?? (totalBills > 0 ? Math.round(totalRev / totalBills) : 0));
  
  const newRev = Number(analytics?.newRevenue || 0);
  const repeatRev = Number(analytics?.repeatRevenue || 0);
  const newBills = Number(analytics?.newBillsCount || 0);
  const repeatBills = Number(analytics?.repeatBillsCount || 0);

  const totalCust = Number(analytics?.totalCustomers || 0);
  const newCust = Number(analytics?.newCustomers || 0);
  const repeatCust = Number(analytics?.returningCustomers || 0);

  const repeatPercent = totalBills > 0
    ? Math.round((repeatBills / totalBills) * 100)
    : (totalCust > 0 ? Math.round((repeatCust / totalCust) * 100) : 0);

  const newPercent = 100 - repeatPercent;

  const avgRating = analytics?.avgFeedbackRating || '5.0';
  const feedbackCount = Number(analytics?.feedbackReceived || 0);
  const loyaltyPoints = Number(analytics?.loyaltyPointsEarned || 0);
  const storeName = profile?.store_name || 'Primary Store';

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Store Summary &amp; Analytics
          </h1>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Multi-store sales performance, customer retention cohorts, and bill delivery metrics
          </span>
        </div>
      </div>

      {/* BillFree-Style Subnavigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('summary')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeTab === 'summary' ? '1px solid #0284c7' : '1px solid #e2e8f0',
            backgroundColor: activeTab === 'summary' ? '#0284c7' : '#ffffff',
            color: activeTab === 'summary' ? '#ffffff' : '#334155',
            fontWeight: '700',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          <span>🛍️</span>
          <span>Store Summary</span>
        </button>

        <Link
          to="/dashboard/invoices"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#334155',
            fontWeight: '700',
            fontSize: '0.8rem',
            textDecoration: 'none'
          }}
        >
          <span>💸</span>
          <span>Sales Transactions</span>
        </Link>

        <Link
          to="/dashboard/feedback"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#334155',
            fontWeight: '700',
            fontSize: '0.8rem',
            textDecoration: 'none'
          }}
        >
          <span>👍</span>
          <span>Customer Feedback</span>
        </Link>

        <Link
          to="/dashboard/profiles/customers"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
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
          <span>Customer CRM</span>
        </Link>
      </div>

      {/* Main KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Active Outlets</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {profile?.id ? `Outlet #${profile.id}` : '1 Outlet'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>● Multi-location ready</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Combined Revenue</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {formatK(totalRev)}
          </div>
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem' }}>
            <span style={{ color: '#6366f1', fontWeight: '700' }}>New: {formatK(newRev)}</span>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ color: '#16a34a', fontWeight: '700' }}>Repeat: {formatK(repeatRev)}</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Invoices</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            {totalBills} Bills
          </div>
          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>
            Avg. {formatCurrency(aov)} / bill
          </span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Customer Satisfaction</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{avgRating}</span>
            <Star style={{ width: '20px', height: '20px', fill: '#f59e0b', color: '#f59e0b' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
            {feedbackCount > 0 ? `${feedbackCount} verified reviews` : 'Google review shield active'}
          </span>
        </div>
      </div>

      {/* BillFree Dual Cohort Split Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Revenue Split */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>Revenue Cohort Breakdown</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Total {formatCurrency(totalRev)}</span>
          </div>

          <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f1f5f9', margin: '12px 0 10px' }}>
            <div style={{ width: `${totalRev > 0 ? (newRev / totalRev) * 100 : 50}%`, backgroundColor: '#6366f1' }} title={`New Shoppers: ${formatCurrency(newRev)}`} />
            <div style={{ width: `${totalRev > 0 ? (repeatRev / totalRev) * 100 : 50}%`, backgroundColor: '#22c55e' }} title={`Repeat Shoppers: ${formatCurrency(repeatRev)}`} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
              <span style={{ color: '#475569' }}>New Shoppers: <b>{formatCurrency(newRev)}</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <span style={{ color: '#475569' }}>Repeat Shoppers: <b>{formatCurrency(repeatRev)}</b></span>
            </div>
          </div>
        </div>

        {/* Customer Volume Split */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>Customer Retention Ratio</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>{totalCust} Registered Customers</span>
          </div>

          <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f1f5f9', margin: '12px 0 10px' }}>
            <div style={{ width: `${newPercent}%`, backgroundColor: '#38bdf8' }} title={`New Shoppers: ${newCust}`} />
            <div style={{ width: `${repeatPercent}%`, backgroundColor: '#10b981' }} title={`Repeat Shoppers: ${repeatCust}`} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
              <span style={{ color: '#475569' }}>Single Visit: <b>{newCust} ({newPercent}%)</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ color: '#475569' }}>Repeat Loyal: <b>{repeatCust} ({repeatPercent}%)</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Outlet Details Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
          Store Performance Breakdown
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Store Outlet</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Location</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Revenue</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Bills Count</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Avg Basket (AOV)</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Repeat Ratio</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Loyalty Points</th>
                <th style={{ padding: '10px 14px', fontWeight: '700' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '14px', fontWeight: '800', color: '#0f172a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Store style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div>
                      <div>{loading ? 'Loading Store...' : storeName}</div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Store ID: #{profile?.id || '1'} (Main Outlet)</span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
                    <span>{profile?.store_address || 'Registered Location'}</span>
                  </div>
                </td>
                <td style={{ padding: '14px', fontWeight: '800', color: '#0f172a' }}>
                  {formatCurrency(totalRev)}
                </td>
                <td style={{ padding: '14px', fontWeight: '700', color: '#0f172a' }}>
                  {totalBills}
                </td>
                <td style={{ padding: '14px', fontWeight: '700', color: '#0f172a' }}>
                  {formatCurrency(aov)}
                </td>
                <td style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, maxWidth: '80px', height: '6px', borderRadius: '3px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                      <div style={{ width: `${repeatPercent}%`, height: '100%', backgroundColor: '#10b981' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981' }}>
                      {repeatPercent}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '14px', fontWeight: '700', color: '#854d0e' }}>
                  {loyaltyPoints.toLocaleString('en-IN')} pts
                </td>
                <td style={{ padding: '14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.725rem', fontWeight: '700', backgroundColor: '#dcfce7', color: '#15803d' }}>
                    Online &bull; Active
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
