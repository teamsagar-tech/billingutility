import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles, Zap, ArrowRight, Clock } from 'lucide-react';

export default function Pricing() {
  const [selectedCategory, setSelectedCategory] = useState('billing'); // 'billing' | 'gmb' | 'combo'
  const [allActiveCampaigns, setAllActiveCampaigns] = useState([]);
  const [campaign, setCampaign] = useState({
    campaign_name: 'Retail Launch Offer',
    category: 'billing',
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
        if (data.success) {
          if (data.all_active && data.all_active.length > 0) {
            setAllActiveCampaigns(data.all_active);
          }
          if (data.data) {
            setCampaign(data.data);
            if (data.data.category) setSelectedCategory(data.data.category);
          }
        }
      })
      .catch((err) => console.log('Pricing campaign fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // When selected category changes, switch to the active campaign of that category if available
  const activePlanForCategory = allActiveCampaigns.find(c => (c.category || 'billing') === selectedCategory) || campaign;

  const currentPlan = (activePlanForCategory.category || 'billing') === selectedCategory ? activePlanForCategory : campaign;
  const regPrice = Number(currentPlan.regular_price || 9000);
  const campPrice = Number(currentPlan.campaign_price || 0);
  const savings = Math.max(0, regPrice - campPrice);
  const discountPercent = regPrice > 0 ? Math.round((savings / regPrice) * 100) : 33;
  const badgeText = currentPlan.badge_text || (savings > 0 ? `SAVE ₹${savings.toLocaleString('en-IN')} TODAY (${discountPercent}% OFF)` : 'OFFICIAL RETAIL PLAN');
  const trialDays = currentPlan.trial_days || 3;
  const monthlyCost = Math.round(campPrice / 12);

  const billingFeatures = [
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

  const gmbFeatures = [
    'Custom Tabletop Acrylic QR Standee Delivered to Store',
    'Google Business Profile AI Auto-Responder (Gemini Powered)',
    'Private Negative Feedback Shield (1-3 Stars Intercepted)',
    '5-Star Direct Google Maps Review Redirection',
    'Public Store Review Showcase Hub (gmbreviews.retailnode.in/[slug])',
    '10 Real-time Dynamic Themes & Custom Branding Palette',
    'Automated Google Business Reviews Stream & Sync',
    'Live Local SEO Health Audit & Score (0-100 Rating)',
    'Executive Monthly Performance PDF Audit Generator',
    'Multi-branch / Multi-store Review Aggregation',
    'QR Standee High-Res Vector PDF Print & Re-download',
    'Zero Commission, 100% Direct Customer Relationship'
  ];

  const comboFeatures = [
    '🚀 Full Digital Billing POS + WABA Cloud Gateway',
    '⭐ Custom Acrylic Tabletop QR Review Standee Delivered',
    'Unlimited WhatsApp Receipts & Customer Bills (/t/:slug)',
    'Google Business Profile AI Auto-Responder (Gemini Powered)',
    'Negative Review Interceptor & Private Recovery Funnel',
    'Public Review Hub (gmbreviews.retailnode.in/[slug])',
    'Dynamic Customer Loyalty Points & Cashier Redemption',
    'Local SEO Health Audit & Executive PDF Reports',
    'Multi-branch POS Interceptor (Tally, Busy, Marg)',
    'Priority Phone & WhatsApp Support with Dedicated Manager',
    'All Future Updates & Product Addons Included Free',
    '1 Full Year Combined Commercial License'
  ];

  const activeFeatures = selectedCategory === 'gmb' ? gmbFeatures : (selectedCategory === 'combo' ? comboFeatures : billingFeatures);

  return (
    <div className="container" style={{ paddingTop: '8rem', paddingBottom: '6rem', minHeight: '85vh' }}>
      <div className="text-center" style={{ marginBottom: '2.5rem' }}>
        {/* Product Category Selector Tabs */}
        <div style={{
          display: 'inline-flex',
          gap: '6px',
          padding: '5px',
          borderRadius: '9999px',
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {[
            { id: 'billing', label: '🧾 Digital Billing POS' },
            { id: 'gmb', label: '⭐ Google Review & Standee' },
            { id: 'combo', label: '🚀 All-in-One Retail Combo' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: selectedCategory === tab.id ? '#ffffff' : 'transparent',
                color: selectedCategory === tab.id ? '#0f172a' : '#64748b',
                fontWeight: selectedCategory === tab.id ? '800' : '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: selectedCategory === tab.id ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          borderRadius: '9999px',
          backgroundColor: selectedCategory === 'gmb' ? '#eff6ff' : (selectedCategory === 'combo' ? '#faf5ff' : '#f0fdf4'),
          color: selectedCategory === 'gmb' ? '#1d4ed8' : (selectedCategory === 'combo' ? '#7e22ce' : '#166534'),
          fontSize: '0.8rem',
          fontWeight: '700',
          marginBottom: '1rem',
          border: '1px solid currentColor'
        }}>
          <Sparkles style={{ width: '14px', height: '14px' }} />
          <span>
            {selectedCategory === 'gmb' ? 'GOOGLE REVIEW & LOCAL SEO BOOSTER' : (selectedCategory === 'combo' ? 'RETAIL ALL-IN-ONE GROWTH SUITE' : 'RETAIL DIGITAL BILLING OS')} &bull; {trialDays}-DAY TRIAL
          </span>
        </div>
        <h1 className="text-5xl font-extrabold" style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 1rem', letterSpacing: '-0.02em', color: '#0f172a' }}>
          {currentPlan.headline || (selectedCategory === 'gmb' ? 'Rank #1 on Google Maps. Automate 5-Star Reviews.' : 'One Simple Price. All Features Included.')}
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.15rem', color: '#64748b', maxWidth: '640px', margin: '0 auto' }}>
          {currentPlan.subheadline || (selectedCategory === 'gmb' ? 'Deliver 5-star customer ratings, stop bad reviews privately, and stand out locally with custom acrylic tabletop QR standees.' : 'No hidden fees, no tier lockouts. Everything your retail store needs to digitize receipts, delight shoppers, and supercharge customer retention.')}
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
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: selectedCategory === 'gmb' ? '#2563eb' : (selectedCategory === 'combo' ? '#7c3aed' : '#059669'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {selectedCategory === 'gmb' ? 'GOOGLE REVIEW & LOCAL SEO BOOSTER' : (selectedCategory === 'combo' ? 'RETAIL ALL-IN-ONE GROWTH COMBO' : 'RETAIL DIGITAL BILLING OS')}
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '6px 0 10px' }}>
              {currentPlan.campaign_name || 'Retail Launch Offer'}
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
                / Year {campPrice > 0 ? `(Just ₹${monthlyCost} / month)` : '(Special Promotional Grant)'}
              </span>
            </div>
          </div>

          {/* Feature Checklist */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Everything Included in {currentPlan.campaign_name}:
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {activeFeatures.map((feat, i) => (
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
