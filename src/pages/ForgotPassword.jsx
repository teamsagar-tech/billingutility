import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, 
  Smartphone, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import RetailNodeLogo from '../components/RetailNodeLogo';

export default function ForgotPassword() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Request OTP
  // Step 2: Verify OTP ONLY (once verified, unlocks step 3)
  // Step 3: Change Password ONLY (with verified resetToken)
  // Step 4: Success Screen
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [resending, setResending] = useState(false);

  const emailInputRef = useRef(null);
  const otpInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 1) {
      emailInputRef.current?.focus();
    } else if (step === 2) {
      otpInputRef.current?.focus();
    } else if (step === 3) {
      passwordInputRef.current?.focus();
    }
  }, [step]);

  // STEP 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!emailOrPhone.trim()) {
      setError('Please enter your registered store email or mobile number.');
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
        setInfoMsg(`Verification OTP sent to ${emailOrPhone.trim()}. Please check your email inbox and spam folder.`);
      } else {
        setError(data.error || 'No registered account found with these credentials.');
      }
    } catch (err) {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    setError('');
    setResending(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setInfoMsg(`New verification code sent to ${emailOrPhone.trim()}. Please check your email inbox.`);
      } else {
        setError(data.error || 'Failed to resend verification code.');
      }
    } catch (err) {
      setError('Network error while resending OTP.');
    } finally {
      setResending(false);
    }
  };

  // STEP 2: Verify OTP ONLY (Strict Gate: Cannot change password without verified OTP)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      otpInputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          otp: cleanOtp
        })
      });
      const data = await res.json();

      if (data.success && data.resetToken) {
        // Save authorized reset token & advance to Step 3
        setResetToken(data.resetToken);
        setStep(3);
        setError('');
        setInfoMsg('OTP verified successfully! Now choose a strong new password.');
      } else {
        setError(data.error || 'Invalid or expired OTP code. Please verify and try again.');
      }
    } catch (err) {
      setError('Failed to reach verification service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Set New Password (Only accessible once Step 2 OTP is verified)
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      passwordInputRef.current?.focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter confirm password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword
        })
      });
      const data = await res.json();

      if (data.success) {
        setStep(4);
        setError('');
      } else {
        setError(data.error || 'Failed to update password. Your session may have expired.');
      }
    } catch (err) {
      setError('Network error while updating password. Please try again.');
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
        radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(14, 165, 233, 0.07) 0%, transparent 40%)
      `,
      fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1rem',
      boxSizing: 'border-box'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          {/* Official RetailNode Standard Logo with Name */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <RetailNodeLogo size="lg" to="/login" />
          </div>

          {/* Stepper Indicator */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#eef2ff', border: '1px solid #c7d2fe', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#4338ca', letterSpacing: '0.04em' }}>
              STEP {step} OF 3
            </span>
            <span style={{ color: '#818cf8' }}>&bull;</span>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4f46e5' }}>
              {step === 1 && 'Request OTP'}
              {step === 2 && 'Verify OTP Code'}
              {step === 3 && 'Set New Password'}
              {step === 4 && 'Complete'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {step === 1 && 'Forgot Your Password?'}
            {step === 2 && 'Enter Verification OTP'}
            {step === 3 && 'Create New Password'}
            {step === 4 && 'Password Reset Complete!'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            {step === 1 && 'Enter your registered store email or mobile to receive a 6-digit OTP.'}
            {step === 2 && 'Verify your identity by entering the 6-digit verification code.'}
            {step === 3 && 'Choose a strong new password for your store dashboard account.'}
            {step === 4 && 'Your credentials have been updated securely.'}
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 35px -10px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          padding: '2rem 1.75rem'
        }}>
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
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {infoMsg && (step === 2 || step === 3) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 14px',
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

          {/* ================= STEP 1: Request OTP ================= */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                  Registered Store Email or Mobile Phone
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
                  <input
                    ref={emailInputRef}
                    type="text"
                    required
                    placeholder="store@domain.com or 9876543210"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 40px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px 18px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px -2px rgba(79, 70, 229, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                {loading ? (
                  <span>Sending Verification OTP...</span>
                ) : (
                  <>
                    <span>Send Verification OTP</span>
                    <ArrowRight style={{ width: '16px', height: '16px' }} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 2: Verify OTP ONLY ================= */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Enter 6-Digit OTP Code
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); setInfoMsg(''); setOtp(''); }}
                    style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '700' }}
                  >
                    Change Account
                  </button>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <KeyRound style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
                  <input
                    ref={otpInputRef}
                    type="text"
                    maxLength={6}
                    required
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      border: '2px solid #818cf8',
                      backgroundColor: '#f5f3ff',
                      borderRadius: '10px',
                      fontSize: '1.35rem',
                      fontWeight: '800',
                      letterSpacing: '0.35em',
                      color: '#312e81',
                      textAlign: 'center',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Resend Code row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b' }}>Didn't receive the OTP?</span>
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4f46e5',
                    fontWeight: '700',
                    cursor: resending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw style={{ width: '12px', height: '12px', animation: resending ? 'spin 1s linear infinite' : 'none' }} />
                  <span>{resending ? 'Resending...' : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                style={{
                  width: '100%',
                  padding: '13px 18px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  background: otp.length === 6 ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : '#cbd5e1',
                  border: 'none',
                  cursor: loading || otp.length < 6 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: otp.length === 6 ? '0 4px 12px -2px rgba(22, 163, 74, 0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {loading ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <ShieldCheck style={{ width: '18px', height: '18px' }} />
                    <span>Verify OTP Code</span>
                    <ArrowRight style={{ width: '16px', height: '16px' }} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 3: Change Password ONLY ================= */}
          {step === 3 && (
            <form onSubmit={handleUpdatePassword}>
              {/* Identity Verified Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontSize: '0.78rem',
                fontWeight: '700',
                marginBottom: '1.25rem'
              }}>
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#16a34a' }} />
                <span>Verified: {emailOrPhone}</span>
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                  New Password (min 6 characters)
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 38px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 38px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {showConfirmPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px 18px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px -2px rgba(79, 70, 229, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                {loading ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <ShieldCheck style={{ width: '18px', height: '18px' }} />
                    <span>Update &amp; Activate Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 4: Success Screen ================= */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 10px 20px -5px rgba(22, 163, 74, 0.25)'
              }}>
                <CheckCircle2 style={{ width: '36px', height: '36px' }} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a', margin: '0 0 6px' }}>
                Password Updated!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                Your store account password has been updated securely. You can now sign into the Merchant Billing Portal with your new password.
              </p>

              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  padding: '13px 18px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px -2px rgba(79, 70, 229, 0.35)'
                }}
              >
                <span>Proceed to Sign In</span>
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          )}

          {/* Back to Login Link */}
          {step !== 4 && (
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
                  fontWeight: '700',
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

        {/* Professional Footer (Zero ISO text) */}
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
          RetailNode Digital Billing &amp; Customer Messaging SaaS Platform
        </div>
        <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Link to="/privacy-policy" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</Link>
          <span>&bull;</span>
          <Link to="/terms-and-conditions" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
