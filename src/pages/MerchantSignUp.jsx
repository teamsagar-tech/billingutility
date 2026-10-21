import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, User, Mail, Smartphone, MapPin, Lock, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import RetailNodeLogo from '../components/RetailNodeLogo';

export default function MerchantSignUp() {
  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    phone: '',
    email: '',
    city: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const storeNameInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    storeNameInputRef.current?.focus();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token && (role === 'merchant_admin' || role === 'merchant')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 10) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const { storeName, ownerName, phone, email, city, password, confirmPassword } = formData;

    if (!storeName.trim()) {
      setError('Please enter your store or business name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your business email address.');
      return;
    }
    if (phone && phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: storeName.trim(),
          ownerName: ownerName.trim() || 'Store Admin',
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          city: city.trim(),
          password
        })
      });

      const data = await res.json();

      if (data.success && data.token) {
        setSuccess(true);
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role || 'merchant_admin');
        if (data.tenantId) localStorage.setItem('tenantId', data.tenantId);
        if (data.storeName) localStorage.setItem('storeName', data.storeName);
        if (data.apiToken) localStorage.setItem('apiToken', data.apiToken);

        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else {
        setError(data.error || 'Registration failed. Please verify your details.');
      }
    } catch (err) {
      setError('Unable to reach the onboarding server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        
        {/* Standard RetailNode Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem' }}>
          <RetailNodeLogo size="lg" to="/login" badge="STORE SIGNUP" />
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '14px 0 4px', letterSpacing: '-0.02em', textAlign: 'center' }}>
            Start Sending Digital Invoices
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, textAlign: 'center' }}>
            Create your retail store billing account in under 60 seconds
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          border: '1px solid #e2e8f0',
          padding: '2rem 1.75rem'
        }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px'
              }}>
                <Sparkles style={{ width: '28px', height: '28px' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                Account Created Successfully!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Setting up your store dashboard and API tokens...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '10px',
                  color: '#dc2626',
                  fontSize: '0.825rem',
                  marginBottom: '1.25rem'
                }}>
                  <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister}>
                {/* Store Name */}
                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Store / Retail Business Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Store style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                    <input
                      ref={storeNameInputRef}
                      type="text"
                      name="storeName"
                      required
                      placeholder="e.g. Sainath Silks, Royal Footwear"
                      value={formData.storeName}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '11px 12px 11px 38px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Owner Name & Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Owner / Manager Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                      <input
                        type="text"
                        name="ownerName"
                        placeholder="Ramesh Kumar"
                        value={formData.ownerName}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '11px 12px 11px 38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Mobile Phone (10 digits)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Smartphone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                      <input
                        type="tel"
                        name="phone"
                        maxLength={10}
                        placeholder="98XXXXXXXX"
                        value={formData.phone}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '11px 12px 11px 38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Email & City */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px', marginBottom: '1.1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Business Email *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="store@domain.com"
                        value={formData.email}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '11px 12px 11px 38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                      City / Location
                    </label>
                    <div style={{ position: 'relative' }}>
                      <MapPin style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                      <input
                        type="text"
                        name="city"
                        placeholder="Bengaluru"
                        value={formData.city}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '11px 12px 11px 38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Password & Confirm */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Password (min 6 chars) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                      <input
                        type="password"
                        name="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '11px 12px 11px 38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Confirm Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '11px 12px 11px 38px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '10px',
                          fontSize: '0.875rem',
                          color: '#0f172a',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: '#ffffff',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px -1px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.15s'
                  }}
                >
                  {loading ? (
                    <span>Creating Store Account...</span>
                  ) : (
                    <>
                      <span>Register &amp; Activate Store</span>
                      <ArrowRight style={{ width: '16px', height: '16px' }} />
                    </>
                  )}
                </button>
              </form>

              {/* Links */}
              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid #f1f5f9',
                textAlign: 'center',
                fontSize: '0.85rem',
                color: '#64748b'
              }}>
                <span>Already have a merchant account? </span>
                <Link to="/login" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
                  Sign In here
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Customer Portal Link Banner */}
        <div style={{
          marginTop: '1rem',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '14px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone style={{ width: '16px', height: '16px', color: '#2563eb' }} />
            <span style={{ fontSize: '0.82rem', color: '#1e40af' }}>
              Are you a shopper searching for your purchase bills?
            </span>
          </div>
          <Link
            to="/my-bills"
            style={{
              fontSize: '0.78rem',
              fontWeight: '700',
              color: '#2563eb',
              textDecoration: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            OTP Login &rarr;
          </Link>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
          RetailNode Digital Billing &amp; Customer Messaging SaaS Platform
        </div>
      </div>
    </div>
  );
}
