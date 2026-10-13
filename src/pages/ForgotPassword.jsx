import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Smartphone, Lock, KeyRound, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset Password, 3 = Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const emailInputRef = useRef(null);
  const otpInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 1) {
      emailInputRef.current?.focus();
    } else if (step === 2) {
      otpInputRef.current?.focus();
    }
  }, [step]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!emailOrPhone.trim()) {
      setError('Please enter your registered email address or mobile number.');
      emailInputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setStep(2);
        let msg = data.message || 'Verification OTP sent to your registered contact.';
        if (data.devOtp) {
          msg += ` (Demo OTP: ${data.devOtp})`;
        }
        setInfoMsg(msg);
      } else {
        setError(data.error || 'No registered account found with these credentials.');
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP code.');
      otpInputRef.current?.focus();
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          otp: otp.trim(),
          newPassword
        })
      });
      const data = await res.json();

      if (data.success) {
        setStep(3);
        setError('');
      } else {
        setError(data.error || 'Failed to reset password. OTP may be invalid or expired.');
      }
    } catch (err) {
      setError('Failed to reach password reset service. Please try again.');
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
      <div style={{ width: '100%', maxWidth: '440px' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img
            src="/retailnode-logo.png"
            alt="RetailNode"
            style={{ height: '46px', width: 'auto', display: 'block', margin: '0 auto 12px' }}
          />
          <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Account Password Recovery
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            {step === 1 && 'Enter your registered email or phone to receive a reset code'}
            {step === 2 && 'Enter the 6-digit OTP code and choose a new password'}
            {step === 3 && 'Your password has been successfully reset!'}
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

          {infoMsg && step === 2 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '10px',
              color: '#065f46',
              fontSize: '0.825rem',
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* STEP 1: Request OTP */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Registered Email Address or Mobile Phone
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                  <input
                    ref={emailInputRef}
                    type="text"
                    required
                    placeholder="store@domain.com or 98XXXXXXXX"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
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
                  boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.25)'
                }}
              >
                {loading ? (
                  <span>Generating Reset OTP...</span>
                ) : (
                  <>
                    <span>Send Password Reset OTP</span>
                    <ArrowRight style={{ width: '16px', height: '16px' }} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Verify OTP & Enter New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>
                    6-Digit Verification OTP Code
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); setInfoMsg(''); }}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Change Account
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <KeyRound style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                  <input
                    ref={otpInputRef}
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      fontWeight: '700',
                      letterSpacing: '0.15em',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  New Password (min 6 characters)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.25)'
                }}
              >
                {loading ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <ShieldCheck style={{ width: '16px', height: '16px' }} />
                    <span>Reset &amp; Activate Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle2 style={{ width: '32px', height: '32px' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                Password Updated!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.5rem' }}>
                Your account password has been successfully reset. You can now log into your store dashboard.
              </p>

              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  color: '#ffffff',
                  backgroundColor: '#0f766e',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.25)'
                }}
              >
                <span>Proceed to Sign In</span>
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          )}

          {/* Back to Login Link */}
          {step !== 3 && (
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #f1f5f9',
              textAlign: 'center'
            }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.825rem',
                  fontWeight: '600',
                  color: '#64748b',
                  textDecoration: 'none'
                }}
              >
                <ArrowLeft style={{ width: '14px', height: '14px' }} />
                <span>Back to Store Login</span>
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
          RetailNode Digital Invoice &amp; Customer Billing SaaS &bull; ISO/IEC 27001 Certified
        </div>
      </div>
    </div>
  );
}
