import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ArrowRight, Lock, Mail, ShieldAlert } from 'lucide-react';

export default function MerchantLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailInputRef.current?.focus();
    // If already logged in as merchant, navigate to dashboard
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token && (role === 'merchant_admin' || role === 'merchant')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide your store email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, loginType: 'merchant' })
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.role || 'merchant_admin');
        if (data.tenantId) localStorage.setItem('tenantId', data.tenantId);
        if (data.storeName) localStorage.setItem('storeName', data.storeName);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err) {
      setError('Unable to connect to the billing service. Please check your internet connection.');
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
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/retailnode-logo.png"
            alt="RetailNode"
            style={{ height: '46px', width: 'auto', display: 'block', margin: '0 auto 12px' }}
          />
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Merchant Billing Portal
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0 }}>
            Sign in to manage digital bills, campaigns &amp; customer loyalty
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
          border: '1px solid #e2e8f0',
          padding: '2rem'
        }}>
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
              fontSize: '0.82rem',
              marginBottom: '1.25rem'
            }}>
              <ShieldAlert style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                Store Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  placeholder="store@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: '0.75rem',
                    color: '#0f766e',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.875rem',
                color: '#ffffff',
                backgroundColor: '#0f766e',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                transition: 'all 0.15s'
              }}
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <Store style={{ width: '16px', height: '16px' }} />
                  <span>Sign In to Store Dashboard</span>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#64748b'
          }}>
            <span>New retail store? </span>
            <Link to="/signup" style={{ color: '#0f766e', fontWeight: '700', textDecoration: 'none' }}>
              Create Store Account
            </Link>
          </div>
        </div>

        {/* Customer OTP Access Banner */}
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
          <span style={{ fontSize: '0.82rem', color: '#1e40af' }}>
            Looking for your shopper receipts?
          </span>
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
            Customer OTP Login &rarr;
          </Link>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
          RetailNode Digital Invoice &amp; Customer Billing SaaS &bull; ISO/IEC 27001 Certified
        </div>

        <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Link to="/privacy-policy" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</Link>
          <span>&bull;</span>
          <Link to="/terms-and-conditions" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
