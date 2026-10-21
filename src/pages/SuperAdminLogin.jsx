import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Mail, AlertTriangle, KeyRound } from 'lucide-react';
import RetailNodeLogo from '../components/RetailNodeLogo';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailInputRef.current?.focus();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token && role === 'superadmin') {
      navigate('/saas-admin');
    }
  }, [navigate]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Admin identifier and master key are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, loginType: 'superadmin' })
      });
      const data = await res.json();

      if (data.success && data.token) {
        if (data.role !== 'superadmin') {
          setError('Access Denied: Insufficient platform operator privileges.');
          return;
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', 'superadmin');
        navigate('/saas-admin');
      } else {
        setError(data.error || 'Authentication rejected. Verify administrator credentials.');
      }
    } catch (err) {
      setError('Platform gateway connection failure.');
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
      backgroundColor: '#090d16',
      padding: '1.5rem',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#f8fafc'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Standard RetailNode Operator Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <RetailNodeLogo theme="dark" size="lg" to="/login" badge="OPERATOR" />
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', margin: '14px 0 4px', letterSpacing: '-0.02em', textAlign: 'center' }}>
            Platform Operator Terminal
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, textAlign: 'center' }}>
            Restricted SaaS Command &amp; Multi-Tenant Control
          </p>
        </div>

        {/* Security Login Card */}
        <div style={{
          backgroundColor: '#111827',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          border: '1px solid #1f2937',
          padding: '2rem'
        }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#450a0a',
              border: '1px solid #7f1d1d',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '0.82rem',
              marginBottom: '1.25rem'
            }}>
              <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Administrator Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  placeholder="admin@retailnode.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    border: '1px solid #374151',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    color: '#f8fafc',
                    backgroundColor: '#1f2937',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Master Access Key
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: '0.75rem',
                    color: '#818cf8',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  Forgot Key?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#64748b' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    border: '1px solid #374151',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    color: '#f8fafc',
                    backgroundColor: '#1f2937',
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
                backgroundColor: '#2563eb',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.45)',
                transition: 'all 0.15s'
              }}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <KeyRound style={{ width: '16px', height: '16px' }} />
                  <span>Authenticate Operator</span>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </>
              )}
            </button>
          </form>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.725rem', color: '#64748b' }}>
          RetailNode Cloud Infrastructure &bull; IP: 95.135.166.109 &bull; TLS 1.3 Strict
        </div>
      </div>
    </div>
  );
}
