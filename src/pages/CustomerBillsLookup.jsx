import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Smartphone, 
  Receipt, 
  ArrowRight, 
  Calendar, 
  Store, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink, 
  KeyRound, 
  Coins, 
  ShoppingBag, 
  Clock, 
  LogOut, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';

export default function CustomerBillsLookup() {
  const [searchParams] = useSearchParams();
  const initialPhone = searchParams.get('phone') || '';

  // Auth & OTP State
  const [phone, setPhone] = useState(initialPhone.replace(/\D/g, '').slice(-10));
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'authenticated'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Authenticated Shopper Data
  const [customerData, setCustomerData] = useState({
    token: '',
    phone: '',
    customerName: '',
    totalLoyaltyPoints: 0,
    lifetimeSpent: 0,
    bills: []
  });

  const phoneInputRef = useRef(null);
  const otpInputRef = useRef(null);

  // Check existing session on mount
  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer_session');
    if (savedCustomer) {
      try {
        const parsed = JSON.parse(savedCustomer);
        if (parsed.phone && parsed.token) {
          setPhone(parsed.phone);
          // Restore and re-verify bills
          fetchBillsWithToken(parsed.phone, parsed.token, parsed);
          return;
        }
      } catch (e) {
        localStorage.removeItem('customer_session');
      }
    }

    if (initialPhone && initialPhone.length >= 10) {
      setPhone(initialPhone.replace(/\D/g, '').slice(-10));
    }
    phoneInputRef.current?.focus();
  }, [initialPhone]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Focus on OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [step]);

  // Helper to re-fetch or verify with saved token
  const fetchBillsWithToken = async (userPhone, userToken, fallbackData = null) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/invoices/public/lookup?phone=${userPhone}`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomerData({
          token: userToken,
          phone: userPhone,
          customerName: fallbackData?.customerName || 'Valued Shopper',
          totalLoyaltyPoints: fallbackData?.totalLoyaltyPoints || 0,
          lifetimeSpent: fallbackData?.lifetimeSpent || 0,
          bills: data.bills || []
        });
        setStep('authenticated');
      } else {
        // Fallback to saved data or reset
        if (fallbackData) {
          setCustomerData(fallbackData);
          setStep('authenticated');
        } else {
          setStep('phone');
        }
      }
    } catch (e) {
      if (fallbackData) {
        setCustomerData(fallbackData);
        setStep('authenticated');
      } else {
        setStep('phone');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP to customer mobile number
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      phoneInputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/customer/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanDigits })
      });
      const data = await res.json();

      if (data.success) {
        setStep('otp');
        setResendCountdown(30);
        setSuccessMsg(data.message || `Verification OTP sent to +91 ${cleanDigits}`);
        if (data.devOtp) {
          // Convenient test autofill hint
          setSuccessMsg(`OTP sent to +91 ${cleanDigits} (Demo Code: ${data.devOtp})`);
        }
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Connection failure. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const cleanOtp = otp.trim();

    if (cleanOtp.length < 4) {
      setError('Please enter the 6-digit OTP sent to your mobile.');
      otpInputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/customer/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanDigits, otp: cleanOtp })
      });
      const data = await res.json();

      if (data.success) {
        const payload = {
          token: data.token,
          phone: cleanDigits,
          customerName: data.customerName || 'Valued Customer',
          totalLoyaltyPoints: data.totalLoyaltyPoints || 0,
          lifetimeSpent: data.lifetimeSpent || 0,
          bills: data.bills || []
        };
        setCustomerData(payload);
        localStorage.setItem('customer_session', JSON.stringify(payload));
        setStep('authenticated');
        setError('');
        setSuccessMsg('');
      } else {
        setError(data.error || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err) {
      setError('Unable to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Sign out customer
  const handleLogout = () => {
    localStorage.removeItem('customer_session');
    setCustomerData({
      token: '',
      phone: '',
      customerName: '',
      totalLoyaltyPoints: 0,
      lifetimeSpent: 0,
      bills: []
    });
    setOtp('');
    setStep('phone');
    setError('');
    setSuccessMsg('');
    setTimeout(() => phoneInputRef.current?.focus(), 100);
  };

  const formatCurrency = (amt) => {
    return '₹' + Number(amt || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDisplayDate = (d) => {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return String(d);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#0f172a',
      padding: '1.5rem 1rem'
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Top Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)'
          }}>
            <Receipt style={{ width: '28px', height: '28px', color: '#059669' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Shopper Digital Bills &amp; Rewards
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            Secure OTP Access to Itemized Receipts &amp; Real-Time Loyalty Points
          </p>
        </div>

        {/* STEP 1: Phone Entry (No Password) */}
        {step === 'phone' && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
            border: '1px solid #e2e8f0',
            padding: '2rem 1.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Smartphone style={{ width: '18px', height: '18px', color: '#2563eb' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Enter Mobile Number
                </h2>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Strictly password-free &bull; 6-digit OTP verification
                </span>
              </div>
            </div>

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

            <form onSubmit={handleSendOtp}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Mobile Number
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0 12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: '#475569'
                  }}>
                    <span>🇮🇳 +91</span>
                  </div>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      fontSize: '1.05rem',
                      fontWeight: '700',
                      color: '#0f172a',
                      outline: 'none',
                      letterSpacing: '0.04em'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.25)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {loading ? (
                  <span>Sending Verification Code...</span>
                ) : (
                  <>
                    <span>Send Verification Code (OTP)</span>
                    <ArrowRight style={{ width: '18px', height: '18px' }} />
                  </>
                )}
              </button>
            </form>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '1.25rem',
              fontSize: '0.78rem',
              color: '#64748b'
            }}>
              <ShieldCheck style={{ width: '15px', height: '15px', color: '#059669' }} />
              <span>We never ask for passwords or PINs. Only instant 1-time OTP.</span>
            </div>
          </div>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 'otp' && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
            border: '1px solid #e2e8f0',
            padding: '2rem 1.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <KeyRound style={{ width: '18px', height: '18px', color: '#059669' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Enter 6-Digit OTP
                  </h2>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Sent to +91 {phone}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#2563eb',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Change Number
              </button>
            </div>

            {successMsg && (
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
                <span>{successMsg}</span>
              </div>
            )}

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

            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <input
                  ref={otpInputRef}
                  type="text"
                  maxLength={6}
                  required
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                    if (val.length === 6) {
                      // Trigger submit
                      setTimeout(() => handleVerifyOtp(), 50);
                    }
                  }}
                  style={{
                    width: '240px',
                    padding: '14px 16px',
                    border: '2px solid #059669',
                    borderRadius: '14px',
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    letterSpacing: '0.3em',
                    textAlign: 'center',
                    color: '#0f172a',
                    outline: 'none',
                    backgroundColor: '#f0fdf4'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.25)'
                }}
              >
                {loading ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <ShieldCheck style={{ width: '18px', height: '18px' }} />
                    <span>Verify &amp; View Digital Bills</span>
                  </>
                )}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.8rem' }}>
              <span style={{ color: '#64748b' }}>Didn't receive the code?</span>
              {resendCountdown > 0 ? (
                <span style={{ color: '#94a3b8', fontWeight: '600' }}>Resend in {resendCountdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw style={{ width: '13px', height: '13px' }} />
                  <span>Resend OTP</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Authenticated Customer Portal */}
        {step === 'authenticated' && (
          <div>
            {/* Customer Profile Header */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      backgroundColor: '#ecfdf5',
                      color: '#065f46',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <CheckCircle2 style={{ width: '12px', height: '12px', color: '#059669' }} />
                      OTP VERIFIED
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>+91 {customerData.phone}</span>
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '6px 0 0' }}>
                    {customerData.customerName || 'Valued Shopper'}
                  </h2>
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut style={{ width: '14px', height: '14px' }} />
                  <span>Switch Number</span>
                </button>
              </div>

              {/* Stats Highlights */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                paddingTop: '1rem',
                borderTop: '1px solid #f1f5f9'
              }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#64748b', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                    <ShoppingBag style={{ width: '13px', height: '13px', color: '#2563eb' }} />
                    <span>Total Bills</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                    {customerData.bills.length}
                  </div>
                </div>

                <div style={{ backgroundColor: '#fefce8', padding: '12px', borderRadius: '12px', border: '1px solid #fef08a', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#854d0e', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                    <Coins style={{ width: '13px', height: '13px', color: '#eab308' }} />
                    <span>Loyalty Points</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#a16207' }}>
                    {customerData.totalLoyaltyPoints || 0}
                  </div>
                </div>

                <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '12px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#065f46', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                    <Sparkles style={{ width: '13px', height: '13px', color: '#059669' }} />
                    <span>Lifetime Spend</span>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#047857' }}>
                    {formatCurrency(customerData.lifetimeSpent || customerData.bills.reduce((s, b) => s + (parseFloat(b.billTotal) || 0), 0))}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoices List */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Your Purchases &amp; Receipts ({customerData.bills.length})
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Sorted by most recent
              </span>
            </div>

            {customerData.bills.length === 0 ? (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
                padding: '3rem 1.5rem',
                textAlign: 'center'
              }}>
                <Receipt style={{ width: '40px', height: '40px', color: '#94a3b8', margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#334155', margin: '0 0 6px' }}>
                  No Digital Bills Found
                </h4>
                <p style={{ fontSize: '0.825rem', color: '#64748b', maxWidth: '360px', margin: '0 auto' }}>
                  No invoices are linked to +91 {customerData.phone} yet. Whenever a participating retail store issues a digital bill, it will appear here automatically!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {customerData.bills.map((bill, idx) => (
                  <div
                    key={bill.shortId || idx}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      padding: '1.25rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'transform 0.15s, box-shadow 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden'
                        }}>
                          {bill.logoUrl ? (
                            <img src={bill.logoUrl} alt={bill.storeName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <Store style={{ width: '20px', height: '20px', color: '#64748b' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                            {bill.storeName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Inv: {bill.invoiceNumber}</span>
                            <span>&bull;</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Calendar style={{ width: '11px', height: '11px' }} />
                              {formatDisplayDate(bill.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#059669' }}>
                          {formatCurrency(bill.billTotal)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {bill.itemsCount} {bill.itemsCount === 1 ? 'item' : 'items'}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid #f8fafc'
                    }}>
                      {bill.fileUrl && (
                        <a
                          href={bill.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FileText style={{ width: '13px', height: '13px' }} />
                          <span>PDF Bill</span>
                        </a>
                      )}

                      <a
                        href={bill.receiptUrl || `/t/${bill.shortId}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 4px rgba(5,150,105,0.2)'
                        }}
                      >
                        <span>View Interactive Receipt</span>
                        <ExternalLink style={{ width: '13px', height: '13px' }} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footnote */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
          <p style={{ margin: '0 0 6px' }}>RetailNode Digital Billing &bull; Zero App Download Required</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link to="/login" style={{ color: '#64748b', textDecoration: 'underline' }}>Store Merchant Login</Link>
            <span>&bull;</span>
            <Link to="/privacy-policy" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
