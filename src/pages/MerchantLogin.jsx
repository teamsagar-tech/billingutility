import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Store, 
  ArrowRight, 
  Lock, 
  Mail, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Zap, 
  Smartphone, 
  FileText, 
  Award, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import RetailNodeLogo from '../components/RetailNodeLogo';

export default function MerchantLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailInputRef.current?.focus();
    // Auto-redirect if already logged in as merchant
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
      backgroundColor: '#f8fafc',
      backgroundImage: `
        radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.10) 0%, transparent 45%),
        radial-gradient(circle at 90% 80%, rgba(14, 165, 233, 0.08) 0%, transparent 45%),
        radial-gradient(circle at 50% 50%, rgba(241, 245, 249, 0.5) 0%, #f8fafc 100%)
      `,
      fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1.5rem',
      boxSizing: 'border-box'
    }}>
      {/* Central Container: Dual-column on desktop, responsive stack on mobile */}
      <div style={{
        width: '100%',
        maxWidth: '1060px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '2.5rem',
        alignItems: 'center'
      }}>
        
        {/* ================= LEFT HERO COLUMN ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
          {/* Standard RetailNode Brand Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <RetailNodeLogo size="lg" to="/login" badge="BILLING CLOUD" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)' }}></span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                High-Throughput Utility &bull; 99.8% Open Rate
              </span>
            </div>
          </div>

          {/* Value Prop Headline */}
          <div>
            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: '900',
              color: '#0f172a',
              lineHeight: 1.15,
              margin: '0 0 12px',
              letterSpacing: '-0.03em'
            }}>
              Deliver Branded Digital Bills on WhatsApp in <span style={{ color: '#2563eb', backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>&lt; 2 Seconds.</span>
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.55, margin: 0 }}>
              Turn every physical retail billing transaction into high-engagement shopper touchpoints with instant vector PDF receipts, automated loyalty points, and 4★+ Google review redirection.
            </p>
          </div>

          {/* 3 Feature Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Feature 1 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Zap style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
                  Ultra-Fast POS Integration (&lt; 25ms)
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Compatible with RetailNode ERP, Tally, Busy, Marg, and desktop print agents.
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Smartphone style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
                  Owner's Choice Dispatch Formats
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Dispatch Tax Invoice PDF attachments, receipt image cards, or interactive templates.
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fae8ff', color: '#a21caf', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Award style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
                  Customer CRM &amp; Milestone Rewards
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Shopper profile completion (+50 points bonus) &amp; automated word-of-mouth referrals.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '4px' }}>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a' }}>&lt; 25ms</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>POS Response</div>
            </div>
            <div style={{ width: '1px', backgroundColor: '#e2e8f0' }}></div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#16a34a' }}>99.8%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>WhatsApp Delivery</div>
            </div>
            <div style={{ width: '1px', backgroundColor: '#e2e8f0' }}></div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#2563eb' }}>100%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>GST Compliant</div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT FORM COLUMN ================= */}
        <div>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(37, 99, 235, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.9)',
            padding: '2.5rem 2rem'
          }}>
            {/* Form Header */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '6px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '0.72rem', fontWeight: '800', marginBottom: '8px' }}>
                <ShieldCheck style={{ width: '13px', height: '13px' }} />
                <span>MERCHANT SIGN IN</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                Merchant Billing Portal
              </h2>
              <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0 }}>
                Enter your credentials to access store dashboard &amp; transaction logs
              </p>
            </div>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '10px',
                color: '#dc2626',
                fontSize: '0.825rem',
                marginBottom: '1.25rem'
              }}>
                <ShieldAlert style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Store Email Input */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                  Store Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
                  <input
                    ref={emailInputRef}
                    type="email"
                    required
                    placeholder="store@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      color: '#0f172a',
                      backgroundColor: '#f8fafc',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{
                      fontSize: '0.75rem',
                      color: '#2563eb',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 42px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      color: '#0f172a',
                      backgroundColor: '#f8fafc',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#2563eb', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="remember-me" style={{ fontSize: '0.8rem', color: '#64748b', cursor: 'pointer' }}>
                  Remember this device for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px 18px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '0.925rem',
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px -2px rgba(37, 99, 235, 0.4)',
                  transition: 'all 0.15s ease'
                }}
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <Store style={{ width: '18px', height: '18px' }} />
                    <span>Sign In to Store Dashboard</span>
                    <ArrowRight style={{ width: '18px', height: '18px' }} />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up CTA */}
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: '#64748b'
            }}>
              <span>New retail store? </span>
              <Link to="/signup" style={{ color: '#2563eb', fontWeight: '800', textDecoration: 'none' }}>
                Create Store Account
              </Link>
            </div>
          </div>

          {/* Shopper OTP Portal Card */}
          <div style={{
            marginTop: '1rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText style={{ width: '16px', height: '16px', color: '#2563eb' }} />
              <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: '600' }}>
                Looking for your shopper receipts?
              </span>
            </div>
            <Link
              to="/my-bills"
              style={{
                fontSize: '0.78rem',
                fontWeight: '800',
                color: '#2563eb',
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              Customer OTP Login &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
        <div>RetailNode Digital Billing &amp; Customer Messaging SaaS Platform</div>
        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '14px' }}>
          <Link to="/privacy-policy" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</Link>
          <span>&bull;</span>
          <Link to="/terms-and-conditions" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms of Service</Link>
          <span>&bull;</span>
          <Link to="/saas-admin/login" style={{ color: '#64748b', textDecoration: 'none' }}>SuperAdmin</Link>
        </div>
      </div>
    </div>
  );
}
