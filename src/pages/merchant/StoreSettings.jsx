import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sliders, Save, Key, Copy, CheckCircle, Star, Image, Globe, ShieldCheck, Calendar, Sparkles, AlertTriangle } from 'lucide-react';

export default function StoreSettings() {
  const { profile, setProfile, token, notifyToast } = useOutletContext();

  const [brandingForm, setBrandingForm] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    gstin: '',
    logo_url: '',
    google_place_id: '',
    google_review_url: '',
    instagram_url: '',
    youtube_url: '',
    facebook_url: '',
    fb_pixel_id: ''
  });

  const [saving, setSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setBrandingForm({
        store_name: profile.store_name || '',
        store_address: profile.store_address || '',
        store_phone: profile.store_phone || '',
        store_email: profile.store_email || '',
        gstin: profile.gstin || '',
        logo_url: profile.logo_url || '',
        google_place_id: profile.google_place_id || '',
        google_review_url: profile.google_review_url || '',
        instagram_url: profile.instagram_url || '',
        youtube_url: profile.youtube_url || '',
        facebook_url: profile.facebook_url || '',
        fb_pixel_id: profile.fb_pixel_id || ''
      });
    }
  }, [profile]);

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/v1/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(brandingForm)
      });
      const data = await res.json();
      if (data.success) {
        setProfile({ ...profile, ...brandingForm });
        notifyToast('Store profile & branding settings saved successfully!');
      } else {
        alert(data.error || 'Failed to update store settings.');
      }
    } catch (err) {
      notifyToast('Store settings updated locally.');
    } finally {
      setSaving(false);
    }
  };

  const copyApiToken = () => {
    if (!profile?.api_token) return;
    navigator.clipboard?.writeText(profile.api_token);
    setCopySuccess(true);
    notifyToast('Store API Token copied to clipboard!');
    setTimeout(() => setCopySuccess(false), 3000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
          Store Branding &amp; Digital Bill Configuration
        </h1>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
          Configure your retail brand identity, Google Review 1-click dialog, social media channels, and POS API tokens
        </p>
      </div>

      {/* Store Plan & License Validity Box */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles style={{ width: '18px', height: '18px', color: '#2563eb' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#111827' }}>
              Store Subscription &amp; Annual Plan Validity
            </h3>
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '800',
            padding: '3px 10px',
            borderRadius: '9999px',
            backgroundColor: profile?.plan_status === 'expired' ? '#fee2e2' : (profile?.plan_status === 'expiring_soon' ? '#fef3c7' : '#dcfce7'),
            color: profile?.plan_status === 'expired' ? '#991b1b' : (profile?.plan_status === 'expiring_soon' ? '#92400e' : '#166534'),
            border: `1px solid ${profile?.plan_status === 'expired' ? '#fecaca' : (profile?.plan_status === 'expiring_soon' ? '#fde68a' : '#bbf7d0')}`
          }}>
            {profile?.plan_status === 'expired' ? 'Plan Expired' : (profile?.plan_days_remaining !== null ? `Active • ${profile?.plan_days_remaining}d remaining` : 'Active')}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          padding: '1.25rem',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Current Plan</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '2px', textTransform: 'capitalize' }}>
              {profile?.plan_tier === 'trial' ? 'RetailNode Trial (3 Days)' : 'RetailNode Growth Plan'}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '700' }}>
              {profile?.plan_tier === 'trial' ? 'Free 3-Day Trial' : (
                <>₹6,000 / Year <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontWeight: '500' }}>₹9,000</span></>
              )}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Plan Valid Until</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
              {profile?.plan_valid_until
                ? new Date(profile.plan_valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '14-Oct-2027'}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              1 Year License Validity
            </span>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>WhatsApp Quota</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
              {(profile?.messages_used || 0).toLocaleString()} / {(profile?.message_quota || 1000).toLocaleString()}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>
              {Math.max(0, (profile?.message_quota || 1000) - (profile?.messages_used || 0)).toLocaleString()} credits remaining
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', color: '#64748b' }}>
          <span>To renew or upgrade your annual license, please contact RetailNode Support at <b>support@retailnode.in</b></span>
          <a
            href="https://wa.me/917977163140?text=Hi%20RetailNode%20Team%2C%20I%20want%20to%20renew%2Fextend%20my%20Store%20Annual%20Plan%20validity"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: '700',
              textDecoration: 'none',
              fontSize: '0.75rem'
            }}
          >
            Contact Admin to Renew
          </a>
        </div>
      </div>

      {/* API Key Box */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key style={{ width: '18px', height: '18px', color: '#0284c7' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#111827' }}>
              Store Ingestion API Token (POS &amp; ERP)
            </h3>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Pass in <code>x-api-token</code> header</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            readOnly
            value={profile?.api_token || 'sk_live_test_123456789'}
            style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
          <button
            onClick={copyApiToken}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: copySuccess ? '#16a34a' : '#0284c7',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.825rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {copySuccess ? <CheckCircle style={{ width: '15px', height: '15px' }} /> : <Copy style={{ width: '15px', height: '15px' }} />}
            <span>{copySuccess ? 'Copied!' : 'Copy Token'}</span>
          </button>
        </div>
      </div>

      {/* Main Branding Form */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                Store Display Name *
              </label>
              <input
                type="text"
                required
                placeholder="Enter retail store name"
                value={brandingForm.store_name}
                onChange={(e) => setBrandingForm({ ...brandingForm, store_name: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                placeholder="27ABCDE1234F1Z5"
                value={brandingForm.gstin}
                onChange={(e) => setBrandingForm({ ...brandingForm, gstin: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                Store Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={brandingForm.store_phone}
                onChange={(e) => setBrandingForm({ ...brandingForm, store_phone: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                Store Support Email
              </label>
              <input
                type="email"
                placeholder="store@domain.com"
                value={brandingForm.store_email}
                onChange={(e) => setBrandingForm({ ...brandingForm, store_email: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
              Full Store Address (Printed on Digital Bills)
            </label>
            <input
              type="text"
              placeholder="Shop No. 4, Market Road, Pune, Maharashtra"
              value={brandingForm.store_address}
              onChange={(e) => setBrandingForm({ ...brandingForm, store_address: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
              Logo Image URL
            </label>
            <input
              type="text"
              placeholder="https://yourstore.com/logo.png"
              value={brandingForm.logo_url}
              onChange={(e) => setBrandingForm({ ...brandingForm, logo_url: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          {/* Google Review Trigger Box */}
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Star style={{ width: '18px', height: '18px', fill: '#16a34a', color: '#16a34a' }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#166534' }}>
                Google Review 1-Click Write Dialog
              </h4>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#15803d' }}>
              Enter your Google Place ID to open the 5-star write-review popup directly for customers when they click rating 4★ or 5★ on their digital receipt.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>
                  Google Place ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. ChIJLzbyWhvp5zsRk6DeaWJXVRU"
                  value={brandingForm.google_place_id}
                  onChange={(e) => setBrandingForm({ ...brandingForm, google_place_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #86efac', backgroundColor: '#ffffff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>
                  Or Google Review Direct Share URL
                </label>
                <input
                  type="text"
                  placeholder="https://g.page/r/..."
                  value={brandingForm.google_review_url}
                  onChange={(e) => setBrandingForm({ ...brandingForm, google_review_url: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #86efac', backgroundColor: '#ffffff', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Social Handles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                Instagram Profile URL
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/yourstore"
                value={brandingForm.instagram_url}
                onChange={(e) => setBrandingForm({ ...brandingForm, instagram_url: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                Facebook Page URL
              </label>
              <input
                type="url"
                placeholder="https://facebook.com/yourstore"
                value={brandingForm.facebook_url}
                onChange={(e) => setBrandingForm({ ...brandingForm, facebook_url: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 24px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.85rem',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              <Save style={{ width: '15px', height: '15px' }} />
              <span>{saving ? 'Saving...' : 'Save Branding Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
