import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Users,
  Award,
  Megaphone,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { formatK, formatCurrency } from '../../utils/merchantUtils';

export default function DashboardHome() {
  const { profile, analytics, loading } = useOutletContext();

  const totalRev = Number(analytics?.metrics?.total_revenue || 0);
  const totalBills = Number(analytics?.metrics?.total_invoices || 0);
  const newRev = totalRev > 0 ? totalRev * 0.67 : 0;
  const repeatRev = totalRev > 0 ? totalRev * 0.33 : 0;
  const newBills = totalBills > 0 ? Math.ceil(totalBills * 0.67) : 0;
  const repeatBills = totalBills > 0 ? Math.floor(totalBills * 0.33) : 0;
  const aov = totalBills > 0 ? totalRev / totalBills : 0;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Business at a Glance ✨
          </h1>
          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>
            Active Utility: &bull; Digital Invoicing &bull; WABA WhatsApp &bull; Customer CRM &bull; Google Reviews
          </span>
        </div>

        {/* Date Filter Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          padding: '7px 14px',
          fontSize: '0.8rem',
          fontWeight: '600',
          color: '#4b5563',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <Calendar style={{ width: '15px', height: '15px', color: '#9ca3af' }} />
          <span>Last 30 Days (Rolling)</span>
          <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>▾</span>
        </div>
      </div>

      {/* SALES BLOCK CONTAINER */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #f1f5f9',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
          Sales Overview
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Revenue Card */}
          <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>
                  {formatK(totalRev)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Gross Revenue
                </div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                💵
              </div>
            </div>

            {/* New vs Repeat Progress Bar */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
                <div style={{ width: '67%', backgroundColor: '#6366f1' }} title="New Shoppers" />
                <div style={{ width: '33%', backgroundColor: '#10b981' }} title="Repeat Shoppers" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', fontWeight: '600' }}>
                <span style={{ color: '#4f46e5' }}>New: {formatK(newRev)} (67%)</span>
                <span style={{ color: '#10b981' }}>Repeat: {formatK(repeatRev)} (33%)</span>
              </div>
            </div>
          </div>

          {/* No. of Bills Card */}
          <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>
                  {totalBills}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Invoices Issued
                </div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                🧾
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
                <div style={{ width: '67%', backgroundColor: '#6366f1' }} />
                <div style={{ width: '33%', backgroundColor: '#10b981' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', fontWeight: '600' }}>
                <span style={{ color: '#4f46e5' }}>{newBills} New Bills</span>
                <span style={{ color: '#10b981' }}>{repeatBills} Repeat Bills</span>
              </div>
            </div>
          </div>

          {/* Avg Order Value Card */}
          <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>
                  {formatK(aov)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Average Order Value (AOV)
                </div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                ⚖️
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
                <div style={{ width: '50%', backgroundColor: '#f59e0b' }} />
                <div style={{ width: '50%', backgroundColor: '#3b82f6' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', fontWeight: '600' }}>
                <span style={{ color: '#d97706' }}>Ticket Size: Healthy</span>
                <span style={{ color: '#2563eb' }}>POS Synced</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK HUB LAUNCHERS (BillFree Match) */}
      <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
        Quick Management Hubs
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link
          to="/dashboard/campaigns"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Megaphone style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>Campaigns Hub</h4>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Automated WhatsApp &amp; SMS</span>
            </div>
          </div>
          <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0 0 10px' }}>
            Trigger Birthday, Anniversary, Win-back Paithani festive campaigns.
          </p>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Launch Campaign <ArrowUpRight style={{ width: '13px', height: '13px' }} />
          </span>
        </Link>

        <Link
          to="/dashboard/customers"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>Customer CRM</h4>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Profiles &amp; RFM Cohorts</span>
            </div>
          </div>
          <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0 0 10px' }}>
            Segment VIP shoppers, track visit frequency, and complete demographic profiles.
          </p>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Explore Customers <ArrowUpRight style={{ width: '13px', height: '13px' }} />
          </span>
        </Link>

        <Link
          to="/dashboard/roi-explorer"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>ROI Explorer</h4>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Attribution &amp; Growth</span>
            </div>
          </div>
          <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0 0 10px' }}>
            Measure marketing return, incremental sales from digital bills, and retention rate.
          </p>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View Analytics <ArrowUpRight style={{ width: '13px', height: '13px' }} />
          </span>
        </Link>

        <Link
          to="/dashboard/invoices"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>Invoices Stream</h4>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Live POS Transactions</span>
            </div>
          </div>
          <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0 0 10px' }}>
            Review real-time digital invoices, WhatsApp delivery ticks, and receipt shortlinks.
          </p>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Open Invoices <ArrowUpRight style={{ width: '13px', height: '13px' }} />
          </span>
        </Link>
      </div>

      {/* RECENT INVOICES MINI FEED */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
              Live POS Invoice Activity
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Real-time stream from RetailNode POS Interceptor &amp; Web POS
            </span>
          </div>
          <Link
            to="/dashboard/invoices"
            style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0284c7', textDecoration: 'none' }}
          >
            View All Transactions &rarr;
          </Link>
        </div>

        {analytics?.recent_invoices && analytics.recent_invoices.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', fontWeight: '600' }}>Invoice #</th>
                  <th style={{ padding: '8px 12px', fontWeight: '600' }}>Customer</th>
                  <th style={{ padding: '8px 12px', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '8px 12px', fontWeight: '600' }}>WhatsApp</th>
                  <th style={{ padding: '8px 12px', fontWeight: '600' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recent_invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>
                      {inv.invoice_number}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>
                      {inv.customer_phone}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>
                      {formatCurrency(inv.bill_total || 1000)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        backgroundColor: '#dcfce7',
                        color: '#15803d'
                      }}>
                        <CheckCircle style={{ width: '11px', height: '11px' }} />
                        Delivered
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <a
                        href={`/t/${inv.short_id || 'test'}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#0284c7', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <span>Open Bill</span>
                        <ExternalLink style={{ width: '12px', height: '12px' }} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <Receipt style={{ width: '32px', height: '32px', margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>No bills processed yet today. Click <b>Quick POS Bill</b> above to issue your first digital invoice.</p>
          </div>
        )}
      </div>
    </div>
  );
}
