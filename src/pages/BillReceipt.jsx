import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Download, 
  Share2, 
  Star, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ShieldCheck, 
  ShoppingBag, 
  MessageCircle, 
  ChevronRight
} from 'lucide-react';

export default function BillReceipt() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Rating & Feedback State
  const [starRating, setStarRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  
  // Slider states
  const [socialSlide, setSocialSlide] = useState(0); // 0 = Facebook, 1 = Instagram
  const [offerSlide, setOfferSlide] = useState(0);

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

  // Social slider auto-advance (every 4 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setSocialSlide((prev) => (prev === 0 ? 1 : 0));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Offer slider auto-advance (every 5 seconds)
  const offerSlides = [
    {
      id: 1,
      image: '/offers/festive_durga_puja.png',
      title: 'Durga Puja Offer - 50% OFF'
    },
    {
      id: 2,
      image: '/offers/festive_wedding_sale.png',
      title: 'Wedding & Festive Special - Flat 30% OFF'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setOfferSlide((prev) => (prev + 1) % offerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [offerSlides.length]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Digital Receipt - ${data?.receiptData?.StoreName || data?.tenantProfile?.store_name || 'RetailNode'}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Receipt link copied to clipboard!');
    }
  };

  const handleRatingSubmit = async (rating) => {
    setStarRating(rating);
    setFeedbackSent(true);
    try {
      await fetch('/api/v1/invoices/public/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortId: slug,
          rating,
          comment: ''
        })
      });
    } catch (err) {
      console.error('Feedback submission error:', err);
    }

    // If rating >= 4, automatically open Google Review page
    const googleReviewUrl = data?.tenantProfile?.google_review_url || 
      `https://www.google.com/search?q=${encodeURIComponent((data?.tenantProfile?.store_name || data?.receiptData?.StoreName || 'Pankhudi Fashion Store') + ' reviews')}`;
    
    if (rating >= 4 && googleReviewUrl && googleReviewUrl !== '#') {
      setTimeout(() => {
        window.open(googleReviewUrl, '_blank');
      }, 350);
    }
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '32px 24px', borderRadius: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', maxWidth: '380px', width: '100%', border: '1px solid #f1f5f9' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#fff1f2', color: '#e11d48', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <AlertCircle style={{ width: '26px', height: '26px' }} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Invoice Not Found</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
            The bill reference <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#334155' }}>{slug}</code> could not be found or has expired.
          </p>
          <Link to="/login" style={{ display: 'inline-block', backgroundColor: '#0f766e', color: '#ffffff', padding: '10px 22px', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', textDecoration: 'none' }}>
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
  const storeName = tenant.store_name || receipt.StoreName || 'Pankhudi Fashion Store';
  const storeAddress = receipt.StoreAddress || 'Main Market, Solapur';
  const pointsEarned = data.loyalty?.earned || Math.floor(parseFloat(billTotal) / 100);
  const pointsBalance = data.loyalty?.balance || 0;
  
  // Website URL
  const websiteUrl = tenant.website_url || receipt.StoreWebsite || receipt.website;
  
  // Google Review URL
  const googleReviewUrl = tenant.google_review_url || 
    `https://www.google.com/search?q=${encodeURIComponent(storeName + ' reviews')}`;

  // WhatsApp store contact number (clean format for wa.me)
  const rawPhone = tenant.phone_number_id || receipt.StorePhone || '919876543210';
  const whatsappNumber = rawPhone.replace(/\D/g, '');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '16px 12px 48px', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto' }}>
        
        {/* ========================================================= */}
        {/* 1. STORE HEADER: Logo, Store Name & Verified Badge        */}
        {/* ========================================================= */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {tenant.logo_url ? (
              <img 
                src={tenant.logo_url} 
                alt={storeName} 
                style={{ height: '36px', width: 'auto', maxHeight: '36px', objectFit: 'contain' }} 
              />
            ) : (
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#0f766e', color: '#ffffff', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', boxShadow: '0 2px 6px rgba(15, 118, 110, 0.2)' }}>
                {storeName.charAt(0)}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                {storeName}
              </h1>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0', fontWeight: '500' }}>
                {storeAddress}
              </p>
            </div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0f766e', backgroundColor: '#ccfbf1', border: '1px solid #99f6e4', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
            <ShieldCheck style={{ width: '13px', height: '13px' }} /> Verified
          </span>
        </header>

        {/* ========================================================= */}
        {/* 2. GOOGLE REVIEW CARD: Golden Wave + 5 Stars + Google Logo */}
        {/* ========================================================= */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '14px' }}>
          {/* Top Yellow Ribbon Waves */}
          <div style={{ position: 'relative', width: '100%', height: '40px', overflow: 'hidden', backgroundColor: '#fffbeb' }}>
            <svg viewBox="0 0 500 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <path d="M0,45 C150,75 300,15 500,45 L500,0 L0,0 Z" fill="#fef08a" opacity="0.8" />
              <path d="M0,30 C130,60 290,5 500,32 L500,0 L0,0 Z" fill="#fde047" opacity="0.7" />
              <path d="M0,18 C140,45 320,8 500,22 L500,0 L0,0 Z" fill="#facc15" opacity="0.9" />
            </svg>
          </div>

          <div style={{ padding: '8px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#d97706', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
                Rate Your Experience with us
              </h3>
              
              {feedbackSent ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '700', fontSize: '13px' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                  <span>Thank you for your {starRating}★ review!</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingSubmit(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', transition: 'transform 0.1s' }}
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        style={{
                          width: '28px',
                          height: '28px',
                          color: (hoverRating || starRating) >= star ? '#f59e0b' : '#cbd5e1',
                          fill: (hoverRating || starRating) >= star ? '#f59e0b' : '#e2e8f0',
                          transition: 'color 0.2s, fill 0.2s'
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Official Google 4-Color "G" Icon */}
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Leave a Google Review"
              style={{ flexShrink: 0, padding: '4px', display: 'block', transition: 'transform 0.2s' }}
            >
              <svg viewBox="0 0 48 48" style={{ width: '46px', height: '46px', display: 'block' }}>
                <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.91l7.35-5.73z"/>
                <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. SOCIAL FOLLOW SLIDER: Facebook & Instagram follow      */}
        {/* ========================================================= */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '14px', padding: '16px 20px' }}>
          <div style={{ minHeight: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {socialSlide === 0 ? (
              <a
                href={tenant.facebook_url || 'https://facebook.com'}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', textDecoration: 'none', width: '100%' }}
              >
                {/* Official Meta Facebook Circle Icon */}
                <svg viewBox="0 0 48 48" style={{ width: '50px', height: '50px', flexShrink: 0 }}>
                  <circle cx="24" cy="24" r="24" fill="#1877F2"/>
                  <path fill="#FFFFFF" d="M26.67 38V24.5h4.53l.68-5.26h-5.21v-3.36c0-1.52.42-2.56 2.61-2.56h2.79V8.61c-.48-.06-2.14-.21-4.07-.21-4.03 0-6.79 2.46-6.79 6.98v3.86h-4.54v5.26h4.54V38h5.46z"/>
                </svg>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Follow us on</span>
                  <span style={{ fontSize: '23px', fontWeight: '800', color: '#1877F2', letterSpacing: '-0.02em' }}>facebook</span>
                </div>
              </a>
            ) : (
              <a
                href={tenant.instagram_url || 'https://instagram.com'}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', textDecoration: 'none', width: '100%' }}
              >
                {/* Official Instagram Gradient Round Icon */}
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', color: '#ffffff', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Follow us on</span>
                  <span
                    style={{
                      fontSize: '23px',
                      fontWeight: '800',
                      letterSpacing: '-0.02em',
                      background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Instagram
                  </span>
                </div>
              </a>
            )}
          </div>

          {/* Social Slide Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
            <button
              onClick={() => setSocialSlide(0)}
              style={{ height: '6px', width: socialSlide === 0 ? '20px' : '6px', borderRadius: '3px', backgroundColor: socialSlide === 0 ? '#1877F2' : '#e2e8f0', transition: 'all 0.2s', padding: 0, border: 'none' }}
              aria-label="Facebook slide"
            />
            <button
              onClick={() => setSocialSlide(1)}
              style={{ height: '6px', width: socialSlide === 1 ? '20px' : '6px', borderRadius: '3px', backgroundColor: socialSlide === 1 ? '#ec4899' : '#e2e8f0', transition: 'all 0.2s', padding: 0, border: 'none' }}
              aria-label="Instagram slide"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* QUICK ACTIONS: Download PDF & Share Bill                  */}
        {/* ========================================================= */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <button
            onClick={handlePrint}
            style={{
              flex: 1,
              height: '44px',
              backgroundColor: '#0f766e',
              color: '#ffffff',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 10px rgba(15, 118, 110, 0.2)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Download style={{ width: '16px', height: '16px' }} /> Download PDF
          </button>
          <button
            onClick={handleShare}
            style={{
              flex: 1,
              height: '44px',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
              cursor: 'pointer'
            }}
          >
            <Share2 style={{ width: '16px', height: '16px', color: '#64748b' }} /> Share Bill
          </button>
        </div>

        {/* ========================================================= */}
        {/* LOYALTY REWARDS BANNER                                    */}
        {/* ========================================================= */}
        <div style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
          borderRadius: '14px',
          padding: '14px 20px',
          marginBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(15, 118, 110, 0.15)'
        }}>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#99f6e4', fontWeight: '800' }}>
              Loyalty Points Earned
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', lineHeight: 1.2 }}>
              +{pointsEarned} <span style={{ fontSize: '12px', fontWeight: '600', color: '#ccfbf1' }}>pts</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#99f6e4', fontWeight: '800' }}>
              Total Balance
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#5eead4', lineHeight: 1.2 }}>
              {pointsBalance} pts
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN INVOICE BILL CARD                                    */}
        {/* ========================================================= */}
        <div id="printable-bill" style={{ backgroundColor: '#ffffff', borderRadius: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', padding: '22px 20px', marginBottom: '14px' }}>
          {/* Bill Top Metadata */}
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '14px', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', margin: '0 0 4px' }}>
              {storeName}
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px' }}>
              {storeAddress}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '12px', color: '#475569', fontWeight: '600' }}>
              <span>Bill: #{receipt.InvoiceNumber || receipt.invoiceNumber || slug}</span>
              <span>&bull;</span>
              <span>
                {receipt.Date 
                  ? new Date(receipt.Date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
                  : new Date().toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>

          {/* Customer & Cashier Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px' }}>
            <span>Customer: <strong style={{ color: '#0f172a', fontWeight: '700' }}>{receipt.CustomerPhone || receipt.customerPhone || 'Walk-in'}</strong></span>
            <span>Mode: <strong style={{ color: '#0f172a', fontWeight: '700' }}>{receipt.PaymentMode || receipt.paymentMode || 'UPI'}</strong></span>
          </div>

          {/* Line Items Table */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span style={{ flex: 1 }}>Item Description</span>
              <span style={{ width: '45px', textAlign: 'center' }}>Qty</span>
              <span style={{ width: '85px', textAlign: 'right' }}>Amount</span>
            </div>

            {items && items.length > 0 ? (
              items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                  <div style={{ flex: 1, paddingRight: '8px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a', lineHeight: 1.3 }}>
                      {item.Name || item.name || item.ItemName}
                    </div>
                    {item.Rate && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                        Rate: ₹{parseFloat(item.Rate || item.rate || 0).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div style={{ width: '45px', textAlign: 'center', color: '#475569', fontWeight: '600' }}>
                    {item.Qty || item.qty || 1}
                  </div>
                  <div style={{ width: '85px', textAlign: 'right', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
                    ₹{parseFloat(item.Amount || item.amount || item.Price || 0).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '16px 0', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                Itemized details recorded on physical bill slip
              </div>
            )}
          </div>

          {/* Bill Totals Summary */}
          <div style={{ borderTop: '2px solid #0f172a', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {parseFloat(taxAmount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                <span>GST Tax (Included)</span>
                <span style={{ fontFamily: 'monospace' }}>₹{parseFloat(taxAmount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '19px', fontWeight: '900', color: '#0f172a', paddingTop: '4px' }}>
              <span>Grand Total</span>
              <span style={{ color: '#0f766e', fontFamily: 'monospace' }}>₹{parseFloat(billTotal).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. WEBSITE LINK (Shown after invoice if website exists)   */}
        {/* ========================================================= */}
        {websiteUrl && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '22px 20px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 14px' }}>
              Visit our website for more information
            </h3>
            <a
              href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                backgroundColor: '#1877f2',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '15px',
                padding: '13px 20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(24, 119, 242, 0.25)',
                textDecoration: 'none'
              }}
            >
              Shop Online <ExternalLink style={{ width: '16px', height: '16px' }} />
            </a>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. PROMOTIONAL OFFERS BANNER SLIDER                       */}
        {/* ========================================================= */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '14px', padding: '14px' }}>
          {/* Offer Slide Image Box */}
          <div style={{ position: 'relative', width: '100%', borderRadius: '14px', overflow: 'hidden', backgroundColor: '#0f172a', aspectRatio: '760 / 731' }}>
            {offerSlides.map((slide, idx) => (
              <div
                key={slide.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: offerSlide === idx ? 1 : 0,
                  transition: 'opacity 0.6s ease-in-out',
                  pointerEvents: offerSlide === idx ? 'auto' : 'none'
                }}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            ))}
          </div>

          {/* Offer Slider Dot Indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', paddingTop: '10px' }}>
            {offerSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setOfferSlide(idx)}
                style={{ height: '6px', width: offerSlide === idx ? '20px' : '6px', borderRadius: '3px', backgroundColor: offerSlide === idx ? '#e11d48' : '#e2e8f0', transition: 'all 0.2s', padding: 0, border: 'none' }}
                aria-label={`Offer Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Quick-Action Circular Social Buttons (Official Instagram & WhatsApp) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', paddingTop: '14px', marginTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            {/* Official Instagram Button */}
            <a
              href={tenant.instagram_url || 'https://instagram.com'}
              target="_blank"
              rel="noopener noreferrer"
              title="Follow us on Instagram"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                textDecoration: 'none'
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: '26px', height: '26px', color: '#ffffff', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>

            {/* Official WhatsApp Button */}
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                `Hi ${storeName}, I saw your festive offers on my digital bill #${slug}. I would like to inquire about current collections!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Chat on WhatsApp"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)',
                textDecoration: 'none'
              }}
            >
              <svg viewBox="0 0 32 32" style={{ width: '28px', height: '28px', fill: '#ffffff' }}>
                <path d="M16.02 2C8.28 2 2 8.28 2 16.02c0 2.48.65 4.89 1.88 7.02L2 30l7.21-1.89c2.06 1.13 4.4 1.73 6.81 1.73 7.74 0 14.02-6.28 14.02-14.02C30.04 8.28 23.76 2 16.02 2zm0 25.68c-2.14 0-4.23-.57-6.07-1.66l-.43-.26-4.51 1.18 1.2-4.4-.28-.45c-1.2-1.9-1.84-4.11-1.84-6.37 0-6.6 5.37-11.97 11.97-11.97 3.2 0 6.2 1.25 8.46 3.51 2.26 2.26 3.51 5.26 3.51 8.46 0 6.6-5.37 11.97-11.97 11.97zm6.56-8.96c-.36-.18-2.13-1.05-2.46-1.17-.33-.12-.57-.18-.81.18-.24.36-.93 1.17-1.14 1.41-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.9-1.79-1.07-.96-1.8-2.14-2.01-2.5-.21-.36-.02-.56.16-.74.16-.16.36-.42.54-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.29-.7-.59-.6-.81-.61l-.69-.01c-.24 0-.63.09-.96.45-.33.36-1.26 1.23-1.26 3 0 1.77 1.29 3.48 1.47 3.72.18.24 2.54 3.88 6.15 5.44.86.37 1.53.59 2.05.76.86.27 1.65.23 2.27.14.69-.1 2.13-.87 2.43-1.71.3-.84.3-1.56.21-1.71-.09-.15-.33-.24-.69-.42z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 6. ONLINE ORDER & RE-ORDER CTA                            */}
        {/* ========================================================= */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '18px', padding: '18px 20px', marginBottom: '14px', border: '1px solid #334155', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShoppingBag style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: 0 }}>Order Online from Store</h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>Browse catalogue & place repeat orders directly</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={websiteUrl || `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi ${storeName}, I would like to place an order.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                backgroundColor: '#0f766e',
                color: '#ffffff',
                fontWeight: '700',
                padding: '11px 12px',
                borderRadius: '10px',
                fontSize: '13px',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(15, 118, 110, 0.3)'
              }}
            >
              <ShoppingBag style={{ width: '15px', height: '15px' }} /> Shop Online
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi ${storeName}, please share your latest catalogue!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                fontWeight: '600',
                padding: '11px 12px',
                borderRadius: '10px',
                fontSize: '13px',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <MessageCircle style={{ width: '15px', height: '15px', color: '#34d399' }} /> WhatsApp Order
            </a>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 7. PURCHASE & BILL HISTORY                                */}
        {/* ========================================================= */}
        {data.history && data.history.length > 0 && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                <Clock style={{ width: '15px', height: '15px', color: '#0f766e' }} />
                <span>Purchase History</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '12px' }}>
                {data.history.length} Previous Bills
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.history.map((hist, idx) => (
                <Link
                  key={idx}
                  to={`/i/${hist.shortId}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    textDecoration: 'none',
                    transition: 'background-color 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                        Invoice #{hist.shortId.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(hist.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <ChevronRight style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* FOOTER                                                    */}
        {/* ========================================================= */}
        <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#64748b', paddingBottom: '28px', paddingTop: '4px' }}>
          <span>Powered by</span>
          <a 
            href="https://retailnode.in" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '700', color: '#0f172a', textDecoration: 'none' }}
          >
            <img 
              src="https://retailnode.in/logo.svg" 
              alt="RetailNode Logo" 
              style={{ width: '18px', height: '18px', display: 'inline-block' }} 
            />
            <span>RetailNode</span>
          </a>
        </footer>
      </div>
    </div>
  );
}
