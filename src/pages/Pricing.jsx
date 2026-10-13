import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles, Zap, ArrowRight, Clock } from 'lucide-react';

export default function Pricing() {
  const [campaign, setCampaign] = useState({
    campaign_name: 'Retail Launch Offer',
    plan_tier: 'growth',
    regular_price: 9000,
    campaign_price: 6000,
    trial_days: 3,
    badge_text: 'SAVE ₹3,000 TODAY (33% OFF)',
    headline: 'One Simple Price. All Features Included.',
    subheadline: 'Complete Digital Billing & Smart CRM Utility for Indian Retailers'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/pricing/active')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCampaign(data.data);
        }
      })
      .catch((err) => console.log('Pricing campaign fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const regPrice = Number(campaign.regular_price || 9000);
  const campPrice = Number(campaign.campaign_price || 6000);
  const savings = Math.max(0, regPrice - campPrice);
  const discountPercent = regPrice > 0 ? Math.round((savings / regPrice) * 100) : 33;
  const badgeText = campaign.badge_text || (savings > 0 ? `SAVE ₹${savings.toLocaleString('en-IN')} TODAY (${discountPercent}% OFF)` : 'OFFICIAL RETAIL PLAN');
  const trialDays = campaign.trial_days || 3;
  const monthlyCost = Math.round(campPrice / 12);

  const planFeatures = [
    'Unlimited Digital Invoices & Receipts (/t/:shortId)',
    'Official WhatsApp Business API (WABA) Integration',
    'Interactive Customer Digital Bills with PDF Export',
    'Customer CRM & 360° Interaction Touchpoints',
    'Dynamic Loyalty Rewards & Cashier Redemption',
    'Direct Google Business Review Integration & 1-Click Link',
    'Customer In-Store Feedback & Ratings on Digital Bills',
    'Smart Customer Segmentation (VIP, At-Risk, Dormant)',
    'Automated Festive Greeting Cards & Paithani Campaigns',
    'Tally, Busy, Marg POS Interceptor & REST API (x-api-token)',
    'Real-time WhatsApp Delivery Ticks (Sent, Delivered, Read)',
    'Download Center with Live CSV Ledger Exports',
    '1 Full Year License Validity with Priority Support'
  ];

  return (
    <div className="container" style={{ paddingTop: '8rem', paddingBottom: '6rem', minHeight: '85vh' }}>
      <div className="text-center" style={{ marginBottom: '3.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          borderRadius: '9999px',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          fontSize: '0.8rem',
          fontWeight: '700',
          marginBottom: '1rem',
          border: '1px solid #bfdbfe'
        }}>
          <Sparkles style={{ width: '14px', height: '14px' }} />
          <span>RETAILNODE GROWTH PLAN &bull; {trialDays}-DAY TRIAL</span>
        </div>
        <h1 className="text-5xl font-extrabold" style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 1rem', letterSpacing: '-0.02em', color: '#0f172a' }}>
          {campaign.headline || 'One Simple Price. All Features Included.'}
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.15rem', color: '#64748b', maxWidth: '640px', margin: '0 auto' }}>
          {campaign.subheadline || 'No hidden fees, no tier lockouts. Everything your retail store needs to digitize receipts, delight shoppers, and supercharge customer retention.'}
        </p>
      </div>

      {/* SINGLE PLAN HERO CARD */}
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '2px solid #2563eb',
          padding: '2.5rem',
          boxShadow: '0 20px 35px -10px rgba(37, 99, 235, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top Ribbons */}
          {savings > 0 && (
            <div style={{
              position: 'absolute',
              top: '0',
              right: '0',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              padding: '6px 20px',
              borderBottomLeftRadius: '14px',
              fontSize: '0.75rem',
              fontWeight: '800',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              {badgeText}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RETAILNODE GROWTH PLAN
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '6px 0 10px' }}>
              Complete Digital Billing &amp; Smart CRM Utility
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
              <Clock style={{ width: '15px', height: '15px', color: '#2563eb' }} />
              <span>Includes Instant {trialDays}-Day Free Trial &bull; 1 Year License on Upgrade</span>
            </div>
          </div>

          {/* Pricing Display */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
            padding: '1.25rem',
            backgroundColor: '#f8fafc',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>₹</span>
              <span style={{ fontSize: '3.5rem', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>
                {campPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {savings > 0 && (
                <span style={{ fontSize: '1.15rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>
                  ₹{regPrice.toLocaleString('en-IN')}
                </span>
              )}
              <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '700' }}>
                / Year (Just ₹{monthlyCost} / month)
              </span>
            </div>
          </div>

          {/* Feature Checklist */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Everything Included in Growth:
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {planFeatures.map((feat, i) => (
              <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <CheckCircle2 style={{ width: '18px', height: '18px', color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: '500', lineHeight: 1.4 }}>
                  {feat}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              to="/signup"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px 24px',
                borderRadius: '12px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: '800',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Start {trialDays}-Day Free Trial Now</span>
              <ArrowRight style={{ width: '18px', height: '18px' }} />
            </Link>
            <p style={{ textAlign: 'center', margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
              Instant activation &bull; Setup in under 5 minutes &bull; Free onboarding assistance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
