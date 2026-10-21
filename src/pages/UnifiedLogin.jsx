import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ShieldCheck, ArrowRight, Lock, Mail, Receipt, Smartphone } from 'lucide-react';
import RetailNodeLogo from '../components/RetailNodeLogo';

export default function UnifiedLogin() {
  const [role, setRole] = useState('merchant'); // 'merchant' | 'superadmin' | 'customer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, [role]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'customer') {
        // Customer lookup by phone number
        if (!phone || phone.length < 10) {
          setError('Please enter a valid 10-digit mobile number.');
          setLoading(false);
          return;
        }
        // Redirect to bill lookup or customer receipts page
        navigate(`/i/lookup?phone=${phone}`);
        return;
      }

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, loginType: role })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role || role);
        if (role === 'superadmin') {
          navigate('/saas-admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error || 'Invalid credentials. Please verify your details.');
      }
    } catch (err) {
      setError('Connection failed. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
      padding: '1.5rem',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Standard RetailNode Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <RetailNodeLogo size="lg" to="/login" badge="UNIFIED ACCESS" />
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '14px 0 4px', letterSpacing: '-0.02em', textAlign: 'center' }}>
            Billing &amp; Messaging SaaS
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, textAlign: 'center' }}>
            Unified portal for shoppers, merchants, and administrators
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
          border: '1px solid #f1f5f9',
          padding: '2rem'
        }}>
          {/* Tab Selector */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px',
            padding: '4px',
            backgroundColor: '#f1f5f9',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            <button
              type="button"
              onClick={() => { setRole('merchant'); setError(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 4px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: role === 'merchant' ? '#ffffff' : 'transparent',
                color: role === 'merchant' ? '#0f172a' : '#64748b',
                boxShadow: role === 'merchant' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Store style={{ width: '14px', height: '14px', color: '#2563eb' }} />
              <span>Merchant</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('superadmin'); setError(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 4px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: role === 'superadmin' ? '#ffffff' : 'transparent',
                color: role === 'superadmin' ? '#0f172a' : '#64748b',
                boxShadow: role === 'superadmin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <ShieldCheck style={{ width: '14px', height: '14px', color: '#2563eb' }} />
              <span>SuperAdmin</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('customer'); setError(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 4px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: role === 'customer' ? '#ffffff' : 'transparent',
                color: role === 'customer' ? '#0f172a' : '#64748b',
                boxShadow: role === 'customer' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Receipt style={{ width: '14px', height: '14px', color: '#2563eb' }} />
              <span>Customer</span>
            </button>
          </div>

          {error && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#be123c',
              fontSize: '0.8rem',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {role === 'customer' ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Customer Mobile Number
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#94a3b8' }}>
                    <Smartphone style={{ width: '16px', height: '16px' }} />
                  </div>
                  <input
                    ref={inputRef}
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="9876543210"
                    maxLength={10}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                  Enter your mobile number to view and download your bills
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    {role === 'superadmin' ? 'Operator Email' : 'Store Admin Email'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#94a3b8' }}>
                      <Mail style={{ width: '16px', height: '16px' }} />
                    </div>
                    <input
                      ref={inputRef}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={role === 'superadmin' ? 'admin@retailnode.in' : 'store@example.com'}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#94a3b8' }}>
                      <Lock style={{ width: '16px', height: '16px' }} />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '12px 16px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.875rem',
                color: '#ffffff',
                backgroundColor: '#2563eb',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 10px -1px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span>
                    {role === 'customer' ? 'Lookup My Bills' : (role === 'superadmin' ? 'SuperAdmin Sign In' : 'Store Admin Sign In')}
                  </span>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </>
              )}
            </button>
          </form>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
          RetailNode Digital Billing & Customer Messaging Utility &bull; Server: 95.135.166.109
        </div>

        <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Link to="/privacy-policy" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</Link>
          <span>&bull;</span>
          <Link to="/terms-and-conditions" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms &amp; Conditions</Link>
        </div>
      </div>
    </div>
  );
}
