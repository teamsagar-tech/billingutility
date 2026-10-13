import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Smartphone, Search, Receipt, ArrowRight, Calendar, Store, CheckCircle, ShieldCheck, ExternalLink } from 'lucide-react';

export default function CustomerBillsLookup() {
  const [searchParams] = useSearchParams();
  const initialPhone = searchParams.get('phone') || '';
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [bills, setBills] = useState([]);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (initialPhone && initialPhone.length >= 10) {
      handleLookup(initialPhone);
    }
  }, [initialPhone]);

  const handleLookup = async (targetPhone = phone) => {
    setError('');
    const cleanDigits = targetPhone.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/v1/invoices/public/lookup?phone=${cleanDigits}`);
      const data = await res.json();
      if (data.success) {
        setBills(data.bills || []);
      } else {
        setError(data.error || 'Failed to retrieve bills.');
        setBills([]);
      }
    } catch (err) {
      setError('Connection failed. Please check your internet connection.');
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = bills.reduce((sum, b) => sum + (parseFloat(b.billTotal) || 0), 0);

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '1.5rem 1rem'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Receipt style={{ width: '28px', height: '28px', color: '#059669' }} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            My Digital Receipts &amp; Loyalty
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Enter your mobile number to view and download all your retail store bills
          </p>
        </div>

        {/* Search Box */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <form onSubmit={(e) => { e.preventDefault(); handleLookup(); }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
              Your Registered Mobile Number
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0 12px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '700',
                color: '#475569'
              }}>
                <span>🇮🇳 +91</span>
              </div>
              <input
                ref={inputRef}
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
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)'
                }}
              >
                {loading ? (
                  <span>Searching...</span>
                ) : (
                  <>
                    <Search style={{ width: '16px', height: '16px' }} />
                    <span>Find Bills</span>
                  </>
                )}
              </button>
            </div>
            {error && (
              <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#dc2626' }}>
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Results Stream */}
        {searched && !loading && (
          <div>
            {bills.length > 0 ? (
              <div>
                {/* Summary Banner */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: '700', textTransform: 'uppercase' }}>
                      Total Verified Bills
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#065f46' }}>
                      {bills.length} Receipts Found
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: '700', textTransform: 'uppercase' }}>
                      Lifetime Spend
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#065f46' }}>
                      ₹{totalSpent.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Bills List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bills.map((bill) => (
                    <div
                      key={bill.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        padding: '14px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          backgroundColor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          color: '#475569',
                          overflow: 'hidden'
                        }}>
                          {bill.logoUrl ? (
                            <img src={bill.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <span>{bill.storeName?.slice(0, 2).toUpperCase() || 'ST'}</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#111827' }}>
                            {bill.storeName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Invoice #{bill.invoiceNumber}</span>
                            <span>&bull;</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Calendar style={{ width: '12px', height: '12px' }} />
                              {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div>
                          <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827' }}>
                            ₹{bill.billTotal.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600' }}>
                            {bill.itemsCount} item{bill.itemsCount > 1 ? 's' : ''} &bull; Paid
                          </div>
                        </div>
                        <a
                          href={`/t/${bill.shortId}`}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>View Bill</span>
                          <ExternalLink style={{ width: '13px', height: '13px' }} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0'
              }}>
                <Receipt style={{ width: '40px', height: '40px', color: '#94a3b8', margin: '0 auto 10px' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#334155', margin: '0 0 4px' }}>
                  No digital bills found for +91 {phone}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '360px', margin: '0 auto' }}>
                  Ensure you provide this mobile number at the billing counter when shopping at any of our partner stores!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Security & DPDP Compliance Note */}
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
            <ShieldCheck style={{ width: '14px', height: '14px', color: '#059669' }} />
            <span>DPDP Act 2023 Compliant &bull; 256-bit Encrypted Digital Receipts</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '6px' }}>
            <Link to="/privacy-policy" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</Link>
            <span>&bull;</span>
            <Link to="/terms-and-conditions" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
