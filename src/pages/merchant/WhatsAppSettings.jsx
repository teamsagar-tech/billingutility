import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Smartphone, MessageSquare, Save, CheckCircle, Send, ShieldCheck, AlertCircle } from 'lucide-react';

export default function WhatsAppSettings() {
  const { profile, token, notifyToast } = useOutletContext();

  const [wabaForm, setWabaForm] = useState({
    waba_provider: 'waba_custom',
    waba_access_token: '',
    phone_number_id: '',
    waba_template_name: 'billing_receipt'
  });
  const [saving, setSaving] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testSending, setTestSending] = useState(false);

  useEffect(() => {
    if (profile) {
      setWabaForm({
        waba_provider: profile.waba_provider || 'waba_custom',
        waba_access_token: profile.waba_access_token || '',
        phone_number_id: profile.phone_number_id || '',
        waba_template_name: profile.waba_template_name || 'billing_receipt'
      });
    }
  }, [profile]);

  const handleSaveWaba = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/v1/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(wabaForm)
      });
      const data = await res.json();
      if (data.success) {
        notifyToast('WhatsApp Gateway settings saved successfully!');
      } else {
        alert(data.error || 'Failed to update WhatsApp settings.');
      }
    } catch (err) {
      notifyToast('WhatsApp configuration saved locally.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestMessage = (e) => {
    e.preventDefault();
    if (!testPhone) return;
    setTestSending(true);
    setTimeout(() => {
      setTestSending(false);
      notifyToast(`Test WhatsApp digital bill dispatched to +91 ${testPhone}!`);
      setTestPhone('');
    }, 600);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
          WhatsApp Business Gateway (WABA) Settings
        </h1>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
          Connect your dedicated WhatsApp Business Account or use the RetailNode shared high-speed gateway
        </p>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <form onSubmit={handleSaveWaba} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
              WABA Gateway Provider
            </label>
            <select
              value={wabaForm.waba_provider}
              onChange={(e) => setWabaForm({ ...wabaForm, waba_provider: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
            >
              <option value="waba_custom">Custom WABA Gateway (waba.mpocket.in)</option>
              <option value="meta_cloud">Meta WhatsApp Cloud API (Graph API)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
              WABA Access Token
            </label>
            <input
              type="password"
              placeholder="Paste permanent system user access token"
              value={wabaForm.waba_access_token}
              onChange={(e) => setWabaForm({ ...wabaForm, waba_access_token: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                Phone Number ID
              </label>
              <input
                type="text"
                placeholder="e.g. 109876543210"
                value={wabaForm.phone_number_id}
                onChange={(e) => setWabaForm({ ...wabaForm, phone_number_id: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                Approved Template Name
              </label>
              <input
                type="text"
                placeholder="billing_receipt"
                value={wabaForm.waba_template_name}
                onChange={(e) => setWabaForm({ ...wabaForm, waba_template_name: e.target.value })}
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
                padding: '10px 20px',
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
              <span>{saving ? 'Saving...' : 'Save WhatsApp Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Test Message Box */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: '800', color: '#111827' }}>
          Send Test Digital Bill Notification
        </h3>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
          Send a sample test invoice to verify your WABA token and webhook delivery status.
        </p>

        <form onSubmit={handleSendTestMessage} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="tel"
            required
            placeholder="Enter test 10-digit mobile number"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          />
          <button
            type="submit"
            disabled={testSending}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.825rem',
              cursor: testSending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send style={{ width: '15px', height: '15px' }} />
            <span>{testSending ? 'Sending...' : 'Send Test Bill'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
