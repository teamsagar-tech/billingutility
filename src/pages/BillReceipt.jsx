import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Share2, Star, Clock, CheckCircle2, AlertCircle, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';

export default function BillReceipt() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starRating, setStarRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    async function fetchBill() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/invoices/${slug}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Invoice not found');
        }
      } catch (err) {
        setError('Failed to load invoice details.');
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchBill();
  }, [slug]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Digital Receipt - ${data?.receiptData?.StoreName || 'RetailNode'}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Receipt link copied to clipboard!');
    }
  };

  const handleRatingSubmit = async (rating) => {
    setStarRating(rating);
    try {
      await fetch('/api/v1/invoices/public/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortId: slug,
          rating,
          comment: feedbackText
        })
      });
      setFeedbackSent(true);
      // If rating >= 4, redirect to Google Review if configured
      const googleReviewUrl = data?.tenantProfile?.google_review_url;
      if (rating >= 4 && googleReviewUrl && googleReviewUrl !== '#') {
        window.open(googleReviewUrl, '_blank');
      }
    } catch (err) {}
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#0f766e', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>Loading your verified bill...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '1rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%', border: '1px solid #f1f5f9' }}>
          <div style={{ width: '52px', height: '52px', backgroundColor: '#fff1f2', color: '#e11d48', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <AlertCircle style={{ width: '28px', height: '28px' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>Invoice Not Found</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            The bill reference <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#334155' }}>{slug}</code> could not be found or has expired.
          </p>
          <Link to="/login" style={{ display: 'inline-block', backgroundColor: '#0f766e', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', textDecoration: 'none' }}>
            Return to Portal
          </Link>
        </div>
      </div>
    );
  }

  const receipt = data.receiptData || {};
  const tenant = data.tenantProfile || {};
  const items = receipt.Items || receipt.items || receipt.LineItems || [];
  const billTotal = receipt.BillTotal || receipt.billAmount || receipt.totalAmount || '0.00';
  const taxAmount = receipt.TaxAmount || receipt.taxAmount || '0.00';
  const pointsEarned = data.loyalty?.earned || Math.floor(parseFloat(billTotal) / 100);
  const pointsBalance = data.loyalty?.balance || 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '1.5rem 1rem 3rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={tenant.logo_url || '/retailnode-logo.png'} alt="Store Logo" style={{ height: '32px', width: 'auto', maxHeight: '32px' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>{tenant.store_name || receipt.StoreName || 'Retail Store'}</span>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#0f766e', backgroundColor: '#ccfbf1', padding: '4px 8px', borderRadius: '12px', fontWeight: '700' }}>
            <ShieldCheck style={{ width: '12px', height: '12px' }} /> Verified
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: '#0f766e',
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.2)'
            }}
          >
            <Download style={{ width: '16px', height: '16px' }} /> Download PDF
          </button>
          <button
            onClick={handleShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.85rem',
              border: '1px solid #cbd5e1',
              cursor: 'pointer'
            }}
          >
            <Share2 style={{ width: '16px', height: '16px' }} /> Share Bill
          </button>
        </div>

        {/* Loyalty Reward Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
          color: '#ffffff',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 15px -3px rgba(15, 118, 110, 0.15)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85, fontWeight: '700' }}>Points Earned</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>+{pointsEarned} <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>pts</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85, fontWeight: '700' }}>Total Balance</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#5eead4' }}>{pointsBalance} pts</div>
          </div>
        </div>

        {/* Main Printable Bill Card */}
        <div id="printable-bill" style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          padding: '1.75rem',
          marginBottom: '1rem'
        }}>
          {/* Bill Top Metadata */}
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
              {receipt.StoreName || tenant.store_name || 'RetailNode Store'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px' }}>
              {receipt.StoreAddress || 'Main Market, City'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '0.75rem', color: '#475569', fontWeight: '600' }}>
              <span>Bill: #{receipt.InvoiceNumber || receipt.invoiceNumber || slug}</span>
              <span>&bull;</span>
              <span>{receipt.Date ? new Date(receipt.Date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          {/* Customer & Cashier Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '1.25rem' }}>
            <span>Customer: <strong style={{ color: '#0f172a' }}>{receipt.CustomerPhone || receipt.customerPhone}</strong></span>
            <span>Mode: <strong style={{ color: '#0f172a' }}>{receipt.PaymentMode || receipt.paymentMode || 'Cash/UPI'}</strong></span>
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
              <span>Item</span>
              <span style={{ textAlign: 'center' }}>Qty</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
            </div>
            {items && items.length > 0 ? (
              items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.Name || item.name || item.ItemName}</div>
                    {item.Rate && (
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Rate: ₹{parseFloat(item.Rate || item.rate || 0).toFixed(2)}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', color: '#475569', fontWeight: '500' }}>{item.Qty || item.qty || 1}</div>
                  <div style={{ textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>₹{parseFloat(item.Amount || item.amount || item.Price || 0).toFixed(2)}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '12px 0', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                Itemized details recorded on physical slip
              </div>
            )}
          </div>

          {/* Bill Totals Summary */}
          <div style={{ borderTop: '2px solid #0f172a', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                <span>GST Tax</span>
                <span>₹{parseFloat(taxAmount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', paddingTop: '4px' }}>
              <span>Grand Total</span>
              <span style={{ color: '#0f766e' }}>₹{parseFloat(billTotal).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Rating / Feedback Box */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          {feedbackSent ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#0f766e', fontWeight: '700', fontSize: '0.875rem' }}>
              <CheckCircle2 style={{ width: '18px', height: '18px' }} />
              <span>Thank you for your rating!</span>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                Rate your shopping experience
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingSubmit(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.1s' }}
                  >
                    <Star style={{ width: '28px', height: '28px', color: star <= starRating ? '#f59e0b' : '#cbd5e1', fill: star <= starRating ? '#f59e0b' : 'none' }} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Past Bills Accordion */}
        {data.history && data.history.length > 0 && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
              <Clock style={{ width: '16px', height: '16px', color: '#0f766e' }} /> Past Visit Bills
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.history.map((hist, idx) => (
                <Link
                  key={idx}
                  to={`/i/${hist.shortId}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', color: '#334155' }}
                >
                  <span style={{ fontWeight: '600' }}>#{hist.shortId}</span>
                  <span style={{ color: '#64748b' }}>{new Date(hist.date).toLocaleDateString('en-IN')} &rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
          Powered by RetailNode Digital Billing Utility &bull; bill.retailnode.in
        </div>
      </div>
    </div>
  );
}
