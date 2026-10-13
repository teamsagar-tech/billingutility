import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, ShieldCheck } from 'lucide-react';
import { formatInputDate } from '../utils/merchantUtils';

export default function ProfileModal({ customer, token, onClose, onSaved }) {
  const [profileForm, setProfileForm] = useState({
    customer_name: customer?.customer_name || customer?.name || '',
    phone: customer?.phone || customer?.customer_phone || '',
    dob: formatInputDate(customer?.dob),
    email: customer?.email || '',
    profession: customer?.profession || '',
    shopping_frequency: customer?.shopping_frequency || 'Monthly',
    gender: customer?.gender || 'm',
    marital_status: customer?.marital_status || 'u',
    anniversary_date: formatInputDate(customer?.anniversary_date),
    spouse_name: customer?.spouse_name || '',
    spouse_mobile: customer?.spouse_mobile || '',
    spouse_dob: formatInputDate(customer?.spouse_dob),
    child_name: customer?.child_name || '',
    child_dob: formatInputDate(customer?.child_dob),
    state: customer?.state || 'Maharashtra',
    city: customer?.city || 'Pune',
    consent_given: customer?.consent_given !== undefined ? Boolean(customer?.consent_given) : true
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profileForm.phone) {
      setError('Mobile number is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/customers/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        onSaved?.(data.profile || profileForm);
        onClose();
      } else {
        setError(data.error || 'Failed to save customer profile.');
      }
    } catch (err) {
      setError('Network error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '640px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#111827' }}>
              {profileForm.phone ? 'Customer Demographic Profile' : 'Create Customer Profile'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
              Enrich demographic details for automated birthday, anniversary &amp; lifecycle campaigns
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#94a3b8' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {error && (
          <div style={{ margin: '1rem 1.5rem 0', padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#dc2626', fontSize: '0.8rem', fontWeight: '600' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Customer full name"
                value={profileForm.customer_name}
                onChange={(e) => setProfileForm({ ...profileForm, customer_name: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                Mobile Number <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/\D/g, '') })}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                Date of Birth 🎂
              </label>
              <input
                type="date"
                value={profileForm.dob}
                onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="customer@email.com"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                Profession
              </label>
              <input
                type="text"
                placeholder="e.g. Doctor, Teacher, Business"
                value={profileForm.profession}
                onChange={(e) => setProfileForm({ ...profileForm, profession: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                Shopping Frequency
              </label>
              <select
                value={profileForm.shopping_frequency}
                onChange={(e) => setProfileForm({ ...profileForm, shopping_frequency: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', boxSizing: 'border-box' }}
              >
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Festive / Occasional">Festive / Occasional</option>
              </select>
            </div>
          </div>

          {/* Gender & Marital Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                Gender
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="gender"
                    value="m"
                    checked={profileForm.gender === 'm'}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  />
                  <span>Male</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="gender"
                    value="f"
                    checked={profileForm.gender === 'f'}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  />
                  <span>Female</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="gender"
                    value="o"
                    checked={profileForm.gender === 'o'}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  />
                  <span>Other</span>
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                Marital Status
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="marital_status"
                    value="m"
                    checked={profileForm.marital_status === 'm'}
                    onChange={(e) => setProfileForm({ ...profileForm, marital_status: e.target.value })}
                  />
                  <span>Married</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="marital_status"
                    value="u"
                    checked={profileForm.marital_status === 'u'}
                    onChange={(e) => setProfileForm({ ...profileForm, marital_status: e.target.value })}
                  />
                  <span>Unmarried</span>
                </label>
              </div>
            </div>
          </div>

          {/* Married extra fields */}
          {profileForm.marital_status === 'm' && (
            <div style={{ padding: '12px', backgroundColor: '#fdf2f8', borderRadius: '10px', border: '1px solid #fbcfe8', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#9d174d', marginBottom: '8px' }}>
                💖 Family &amp; Anniversary Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#374151', marginBottom: '3px' }}>
                    Anniversary Date
                  </label>
                  <input
                    type="date"
                    value={profileForm.anniversary_date}
                    onChange={(e) => setProfileForm({ ...profileForm, anniversary_date: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#374151', marginBottom: '3px' }}>
                    Spouse Name
                  </label>
                  <input
                    type="text"
                    placeholder="Spouse Name"
                    value={profileForm.spouse_name}
                    onChange={(e) => setProfileForm({ ...profileForm, spouse_name: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#374151', marginBottom: '3px' }}>
                    Spouse Mobile
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile"
                    value={profileForm.spouse_mobile}
                    onChange={(e) => setProfileForm({ ...profileForm, spouse_mobile: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#374151', marginBottom: '3px' }}>
                    Spouse DOB
                  </label>
                  <input
                    type="date"
                    value={profileForm.spouse_dob}
                    onChange={(e) => setProfileForm({ ...profileForm, spouse_dob: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                State
              </label>
              <input
                type="text"
                value={profileForm.state}
                onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                City
              </label>
              <input
                type="text"
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Consent Checkbox */}
          <div style={{ marginBottom: '1.25rem', padding: '10px 12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.75rem', color: '#166534', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={profileForm.consent_given}
                onChange={(e) => setProfileForm({ ...profileForm, consent_given: e.target.checked })}
                style={{ marginTop: '2px' }}
              />
              <span>
                <b>DPDP Act 2023 Consent</b>: Customer has explicitly consented to receive digital invoices, birthday greetings, and loyalty updates via WhatsApp and SMS.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 20px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: '700',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              <Save style={{ width: '15px', height: '15px' }} />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
