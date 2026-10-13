import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
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
  ChevronRight,
  Lock,
  X,
  Sparkles,
  Heart,
  ThumbsUp
} from 'lucide-react';

// Resolves direct Google Review Write Dialog URL from Place ID, review link, or Google share link
function resolveGoogleReviewUrl(reviewUrl, placeId, storeName, storeAddress) {
  // 1. If explicit Google Place ID is provided, use Google's official direct write-review URL
  if (placeId && placeId.trim()) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId.trim())}`;
  }

  if (reviewUrl && reviewUrl.trim()) {
    let url = reviewUrl.trim();

    // If user entered a raw Google Place ID (typically starts with ChIJ and has no slashes)
    if (url.startsWith('ChIJ') && !url.includes('/')) {
      return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(url)}`;
    }

    // If it's a Google Business Profile short link (g.page), ensure /review is attached to open write dialog directly
    if (url.includes('g.page/') && !url.endsWith('/review')) {
      return url.endsWith('/') ? `${url}review` : `${url}/review`;
    }

    // If it's a Google search URL with #lrd, ensure ,3 is attached to trigger the write review popup directly
    if (url.includes('#lrd=') && !url.endsWith(',3')) {
      const parts = url.split('#lrd=');
      if (parts[1] && !parts[1].includes(',')) {
        return `${parts[0]}#lrd=${parts[1]},3`;
      }
    }

    // Standard URL (including share.google, maps.app.goo.gl, etc.)
    return url;
  }

  // Fallback: Dynamic Google search with store name and address
  if (storeName && storeName !== 'Store Receipt') {
    const q = (storeName + (storeAddress ? ' ' + storeAddress : '')).trim();
    return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  }

  return '';
}

export default function BillReceipt() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);

  // 72-Hour WhatsApp OTP & Security Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [lockInfo, setLockInfo] = useState(null);
  const [inputPhone, setInputPhone] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [lockError, setLockError] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  // Rating & Feedback State
  const [starRating, setStarRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // First-Visit Customer Engagement Modal & Action Tracking State
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [engagementActionDone, setEngagementActionDone] = useState({
    googleReview: false,
    instagram: false,
    youtube: false
  });
  
  // Slider states
  const [socialSlide, setSocialSlide] = useState(0);
  const [offerSlide, setOfferSlide] = useState(0);

  // OTP Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    async function fetchBill() {
      try {
        setLoading(true);
        setError('');
        const savedToken = localStorage.getItem(`inv_auth_${slug}`) || '';
        const savedPhone = localStorage.getItem('customerPhone') || '';
        const savedAuthTime = localStorage.getItem('customer_auth_time') || '';
        const savedSession = localStorage.getItem('customer_session_token') || '';

        const headers = {};
        if (savedToken) headers['x-invoice-token'] = savedToken;
        if (savedPhone) headers['x-customer-phone'] = savedPhone;
        if (savedSession) headers['x-customer-session'] = savedSession;
        if (savedAuthTime) headers['x-customer-authtime'] = savedAuthTime;

        const res = await fetch(`/api/v1/invoices/${slug}`, { headers });
        const result = await res.json();
        if (result.success) {
          if (result.requiresAuth) {
            setIsLocked(true);
            setLockInfo({
              maskedPhone: result.maskedPhone || '••••••••••',
              storeName: result.storeName || 'Store Receipt',
              logoUrl: result.logoUrl || null,
              ageHours: result.ageHours || 72
            });
            document.title = `Verify Customer Mobile - ${result.storeName || 'Digital Invoice'}`;
          } else {
            setData(result.data);
            setIsLocked(false);
          }
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

  // Set document title to "invoice number - firm name" and disallow search engine indexing
  useEffect(() => {
    if (data) {
      const invNo = data.receiptData?.InvoiceNumber || data.receiptData?.invoiceNumber || slug;
      const firm = data.tenantProfile?.store_name || data.receiptData?.StoreName || data.receiptData?.storeName || 'Store Receipt';
      document.title = `${invNo} - ${firm}`;

      // Enforce strict no-index / no-archive for search crawlers
      let metaRobots = document.querySelector('meta[name="robots"]');
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute('content', 'noindex, nofollow, noarchive, nosnippet');

      let metaGooglebot = document.querySelector('meta[name="googlebot"]');
      if (!metaGooglebot) {
        metaGooglebot = document.createElement('meta');
        metaGooglebot.name = 'googlebot';
        document.head.appendChild(metaGooglebot);
      }
      metaGooglebot.setAttribute('content', 'noindex, nofollow, noarchive, nosnippet');

      // =========================================================
      // DUAL META PIXEL ENGINE (Platform Master + Store Pixel)
      // Fully compliant with India DPDP Act 2023 & Meta Terms:
      // Anonymized PageView & Purchase tracking without raw PII
      // =========================================================
      try {
        if (!window.fbq) {
          (function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)})(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
        }

        const platformPixel = data.platformPixelId || '101582739485721';
        const storePixelRaw = data.tenantProfile?.fb_pixel_id || '';
        const storePixels = storePixelRaw
          ? storePixelRaw.split(',').map((p) => p.trim()).filter(Boolean)
          : [];

        const allPixels = Array.from(new Set([platformPixel, ...storePixels]));

        allPixels.forEach((pixelId) => {
          if (pixelId && window.fbq) {
            window.fbq('init', pixelId);
          }
        });

        if (window.fbq) {
          window.fbq('track', 'PageView');

          const total = parseFloat(data.receiptData?.BillTotal || data.receiptData?.billAmount || 0);
          if (total > 0) {
            window.fbq('track', 'Purchase', {
              value: total,
              currency: 'INR',
              content_name: firm
            });
          }
        }
      } catch (pxErr) {
        console.warn('Pixel initialization error:', pxErr);
      }
    }
  }, [data, slug]);

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

  // Download ONLY the invoice (#printable-bill) as PDF without browser print dialog
  const handleDownloadPdf = async () => {
    const element = document.getElementById('printable-bill');
    if (!element) return;

    setDownloadingPdf(true);
    try {
      const invoiceNo = receipt.InvoiceNumber || receipt.invoiceNumber || slug;
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Invoice_${invoiceNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true, 
          backgroundColor: '#ffffff',
          scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Could not download invoice PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Share Bill: Share PDF file directly to mobile communication apps (WhatsApp, Telegram, etc.) with text and RetailNode branding
  const handleShareBill = async () => {
    const element = document.getElementById('printable-bill');
    if (!element) return;

    setSharingPdf(true);
    const invoiceNo = receipt.InvoiceNumber || receipt.invoiceNumber || slug;
    const firm = tenant.store_name || receipt.StoreName || receipt.storeName || 'Store Receipt';
    const total = parseFloat(billTotal).toFixed(2);
    const billUrl = window.location.href;

    // Branded text with RetailNode branding at the very end
    const shareMessage = `*Invoice #${invoiceNo}*\nStore: ${firm}\nTotal: ₹${total}\n\nView Online Bill:\n${billUrl}\n\nPowered by RetailNode\nhttps://retailnode.in`;

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Invoice_${invoiceNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true, 
        backgroundColor: '#ffffff',
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };

    try {
      // Generate standalone PDF blob for the invoice
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const pdfFile = new File([pdfBlob], `Invoice_${invoiceNo}.pdf`, { type: 'application/pdf' });

      // If mobile browser supports sharing files (WhatsApp, Telegram, Gmail, Messages, etc.)
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Invoice #${invoiceNo} - ${firm}`,
          text: shareMessage
        });
      } else if (navigator.share) {
        // Fallback for browsers supporting text/URL sharing: share message & download PDF
        await navigator.share({
          title: `Invoice #${invoiceNo} - ${firm}`,
          text: shareMessage,
          url: billUrl
        });
        await html2pdf().set(opt).from(element).save();
      } else {
        // Desktop fallback: download PDF & copy branded message
        await html2pdf().set(opt).from(element).save();
        try {
          await navigator.clipboard.writeText(shareMessage);
          alert('Invoice PDF downloaded! Bill details with RetailNode branding copied to clipboard.');
        } catch {
          alert('Invoice PDF downloaded!');
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share bill error:', err);
        try {
          await html2pdf().set(opt).from(element).save();
        } catch (saveErr) {}
      }
    } finally {
      setSharingPdf(false);
    }
  };

  // Centralized Engagement Tracking & Safe URL Dispatcher (Zero Hardcoding)
  const handleTrackAndOpen = (actionType, url, source = 'popup') => {
    if (!url || url === '#') return;

    // 1. Immediately update UI state and local storage
    if (actionType === 'google_review_click') {
      setEngagementActionDone(prev => ({ ...prev, googleReview: true }));
      try { localStorage.setItem(`rn_reviewed_${slug}`, 'true'); } catch (e) {}
    } else if (actionType === 'instagram_click') {
      setEngagementActionDone(prev => ({ ...prev, instagram: true }));
      try { localStorage.setItem(`rn_instagram_${slug}`, 'true'); } catch (e) {}
    } else if (actionType === 'youtube_click') {
      setEngagementActionDone(prev => ({ ...prev, youtube: true }));
      try { localStorage.setItem(`rn_youtube_${slug}`, 'true'); } catch (e) {}
    }

    // 2. Dispatch Meta Pixel tracking event
    try {
      if (window.fbq) {
        const eventMap = {
          'google_review_click': 'GoogleReviewClick',
          'instagram_click': 'InstagramFollowClick',
          'youtube_click': 'YouTubeSubscribeClick',
          'facebook_click': 'FacebookFollowClick'
        };
        const evtName = eventMap[actionType] || 'EngagementClick';
        const stName = data?.tenantProfile?.store_name || data?.receiptData?.StoreName || 'Store';
        window.fbq('trackCustom', evtName, {
          invoice: slug,
          store: stName,
          source
        });
      }
    } catch (e) {}

    // 3. Dispatch backend tracking call (Logged in MySQL action_logs & Redis)
    try {
      fetch(`/api/v1/invoices/${slug}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          source,
          metadata: { targetUrl: url }
        })
      }).catch(() => {});
    } catch (e) {}

    // 4. Open destination in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const dismissEngagementModal = () => {
    setShowEngagementModal(false);
    try {
      localStorage.setItem(`rn_engagement_dismissed_${slug}`, 'true');
    } catch (e) {}
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

    // Direct Google Review Write Dialog URL (Supports Place ID, Google share link, or review URL)
    const firmName = data?.tenantProfile?.store_name || data?.receiptData?.StoreName || data?.receiptData?.storeName || '';
    const firmAddress = data?.tenantProfile?.store_address || data?.receiptData?.StoreAddress || '';
    const targetUrl = resolveGoogleReviewUrl(
      data?.tenantProfile?.google_review_url,
      data?.tenantProfile?.google_place_id,
      firmName,
      firmAddress
    );
    
    if (rating >= 4 && targetUrl && targetUrl !== '#') {
      setTimeout(() => {
        handleTrackAndOpen('google_review_click', targetUrl, 'star_rating_prompt');
      }, 350);
    }
  };

  // Send OTP to customer's WhatsApp
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanDigits = inputPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setLockError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setSendingOtp(true);
    setLockError('');
    try {
      const res = await fetch(`/api/v1/invoices/${slug}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanDigits })
      });
      const result = await res.json();
      if (result.success) {
        setOtpSent(true);
        setCountdown(45);
        if (result.devOtp) {
          setInputOtp(result.devOtp);
        }
      } else {
        setLockError(result.error || 'Failed to send WhatsApp OTP. Please try again.');
      }
    } catch (err) {
      setLockError('Network error while requesting WhatsApp OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP & Activate 72-Hour Session
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanDigits = inputPhone.replace(/\D/g, '');
    const cleanOtp = inputOtp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setLockError('Please enter the 6-digit OTP received on WhatsApp.');
      return;
    }
    setVerifyingOtp(true);
    setLockError('');
    try {
      const res = await fetch(`/api/v1/invoices/${slug}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanDigits, otp: cleanOtp })
      });
      const result = await res.json();
      if (result.success) {
        // Activate 72-Hour Seamless Mobile Session in browser
        localStorage.setItem('customerPhone', cleanDigits);
        localStorage.setItem('customer_auth_time', Date.now().toString());
        if (result.customerSessionToken) {
          localStorage.setItem('customer_session_token', result.customerSessionToken);
        }
        if (result.token) {
          localStorage.setItem(`inv_auth_${slug}`, result.token);
        }
        setData(result.data);
        setIsLocked(false);
      } else {
        setLockError(result.error || 'Invalid OTP code. Please check WhatsApp and try again.');
      }
    } catch (err) {
      setLockError('Network error while verifying WhatsApp OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Direct phone unlock fallback
  const handleDirectUnlock = async (e) => {
    if (e) e.preventDefault();
    const cleanDigits = inputPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setLockError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setVerifyingOtp(true);
    setLockError('');
    try {
      const res = await fetch(`/api/v1/invoices/${slug}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanDigits })
      });
      const result = await res.json();
      if (result.success) {
        localStorage.setItem('customerPhone', cleanDigits);
        localStorage.setItem('customer_auth_time', Date.now().toString());
        if (result.customerSessionToken) {
          localStorage.setItem('customer_session_token', result.customerSessionToken);
        }
        if (result.token) {
          localStorage.setItem(`inv_auth_${slug}`, result.token);
        }
        setData(result.data);
        setIsLocked(false);
      } else {
        setLockError(result.error || 'Access denied: The entered mobile number does not match.');
      }
    } catch (err) {
      setLockError('Network error while verifying mobile number.');
    } finally {
      setVerifyingOtp(false);
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

  if (isLocked) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '24px 16px 48px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '420px', margin: '0 auto' }}>
          
          {/* Store Header */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {lockInfo?.logoUrl ? (
                <img 
                  src={lockInfo.logoUrl} 
                  alt={lockInfo.storeName} 
                  style={{ height: '40px', width: '40px', borderRadius: '50%', objectFit: 'contain', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }} 
                />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0f766e', color: '#ffffff', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                  {(lockInfo?.storeName || 'R').charAt(0)}
                </div>
              )}
              <div>
                <h1 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                  {lockInfo?.storeName || 'Store Receipt'}
                </h1>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0', fontWeight: '500' }}>
                  Digital Invoice #{slug.toUpperCase()}
                </p>
              </div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0f766e', backgroundColor: '#ccfbf1', border: '1px solid #99f6e4', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
              <ShieldCheck style={{ width: '13px', height: '13px' }} /> Verified
            </span>
          </header>

          {/* WhatsApp OTP Verification Card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', padding: '28px 24px', textAlign: 'center' }}>
            
            {/* WhatsApp Verification Icon */}
            <div style={{ width: '58px', height: '58px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#059669', border: '2px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.15)' }}>
              <MessageCircle style={{ width: '30px', height: '30px' }} />
            </div>

            <div style={{ display: 'inline-block', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', marginBottom: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              72-Hour Security Lock
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', margin: '0 0 8px' }}>
              {otpSent ? 'Enter WhatsApp OTP' : 'Verify Mobile Number'}
            </h2>

            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              {otpSent 
                ? 'We sent a 6-digit verification code to your WhatsApp. Enter it below to unlock your bill.'
                : 'This invoice was issued more than 72 hours ago. Verify your mobile number to view and download your bill.'}
            </p>

            {/* Masked recipient hint */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '10px 14px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <span>Registered to:</span>
              <strong style={{ fontFamily: 'monospace', fontSize: '13px', color: '#0f172a', letterSpacing: '0.05em' }}>
                +91 {lockInfo?.maskedPhone || '••••••••••'}
              </strong>
            </div>

            {/* Stage 1: Request WhatsApp OTP */}
            {!otpSent ? (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Customer Mobile Number
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: lockError ? '2px solid #ef4444' : '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', transition: 'border-color 0.2s' }}>
                    <span style={{ padding: '0 12px', backgroundColor: '#f8fafc', color: '#475569', fontSize: '13px', fontWeight: '700', borderRight: '1px solid #cbd5e1', height: '44px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      autoFocus
                      maxLength={10}
                      value={inputPhone}
                      onChange={(e) => {
                        setInputPhone(e.target.value.replace(/\D/g, ''));
                        setLockError('');
                      }}
                      placeholder="10-digit mobile number"
                      style={{
                        flex: 1,
                        height: '44px',
                        border: 'none',
                        outline: 'none',
                        padding: '0 12px',
                        fontSize: '15px',
                        fontWeight: '600',
                        letterSpacing: '0.05em',
                        color: '#0f172a'
                      }}
                    />
                  </div>
                </div>

                {lockError && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.4 }}>
                    <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '1px' }} />
                    <span>{lockError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sendingOtp || inputPhone.length < 10}
                  style={{
                    width: '100%',
                    height: '46px',
                    backgroundColor: inputPhone.length >= 10 ? '#25D366' : '#94a3b8',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: inputPhone.length >= 10 && !sendingOtp ? 'pointer' : 'not-allowed',
                    boxShadow: inputPhone.length >= 10 ? '0 4px 12px rgba(37, 211, 102, 0.35)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <MessageCircle style={{ width: '18px', height: '18px' }} />
                  <span>{sendingOtp ? 'Sending OTP...' : 'Send OTP on WhatsApp'}</span>
                </button>
              </form>
            ) : (
              /* Stage 2: Enter & Verify WhatsApp OTP */
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#059669', flexShrink: 0 }} />
                  <span>OTP dispatched to WhatsApp (+91 •••••• {inputPhone.slice(-4)})</span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                      6-Digit WhatsApp OTP
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{ background: 'none', border: 'none', color: '#0f766e', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={inputOtp}
                    onChange={(e) => {
                      setInputOtp(e.target.value.replace(/\D/g, ''));
                      setLockError('');
                    }}
                    placeholder="• • • • • •"
                    style={{
                      width: '100%',
                      height: '48px',
                      border: lockError ? '2px solid #ef4444' : '2px solid #0f766e',
                      borderRadius: '12px',
                      outline: 'none',
                      textAlign: 'center',
                      fontSize: '22px',
                      fontWeight: '800',
                      letterSpacing: '0.3em',
                      color: '#0f172a',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {lockError && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', lineHeight: 1.4 }}>
                    <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '1px' }} />
                    <span>{lockError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifyingOtp || inputOtp.length < 4}
                  style={{
                    width: '100%',
                    height: '46px',
                    backgroundColor: inputOtp.length >= 4 ? '#0f766e' : '#94a3b8',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: inputOtp.length >= 4 && !verifyingOtp ? 'pointer' : 'not-allowed',
                    boxShadow: inputOtp.length >= 4 ? '0 4px 12px rgba(15, 118, 110, 0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Lock style={{ width: '16px', height: '16px' }} />
                  <span>{verifyingOtp ? 'Verifying...' : 'Unlock Bill (72-Hour Session)'}</span>
                </button>

                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  {countdown > 0 ? (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Resend OTP via WhatsApp in <strong style={{ color: '#475569' }}>{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      style={{ background: 'none', border: 'none', color: '#25D366', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <MessageCircle style={{ width: '14px', height: '14px' }} /> Resend OTP on WhatsApp
                    </button>
                  )}
                </div>
              </form>
            )}

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
              🔒 Verified login unlocks all your invoices for 72 hours
            </div>
          </div>

          {/* Footer */}
          <footer style={{ textAlign: 'center', paddingBottom: '32px', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
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
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '11px', color: '#94a3b8' }}>
              <Link to="/privacy-policy" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</Link>
              <span>&bull;</span>
              <Link to="/terms-and-conditions" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms &amp; Conditions</Link>
            </div>
          </footer>

        </div>
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
  const storeName = tenant.store_name || receipt.StoreName || receipt.storeName || 'Store Receipt';
  const storeAddress = tenant.store_address || receipt.StoreAddress || receipt.storeAddress || '';
  const pointsEarned = data.loyalty?.earned || Math.floor(parseFloat(billTotal) / 100);
  const pointsBalance = data.loyalty?.balance || 0;
  
  // Website URL
  const websiteUrl = tenant.website_url || receipt.StoreWebsite || receipt.website;
  
  // Direct Google Review Write Dialog URL (Supports Place ID, Google share link, or review URL)
  const googleReviewUrl = resolveGoogleReviewUrl(
    tenant.google_review_url,
    tenant.google_place_id,
    storeName,
    storeAddress
  );

  // Social & Engagement Channels (Dynamic)
  const instagramUrl = tenant.instagram_url || '';
  const youtubeUrl = tenant.youtube_url || '';
  const facebookUrl = tenant.facebook_url || '';

  // Active Social Media Channels
  const activeSocials = [];
  if (facebookUrl) {
    activeSocials.push({
      type: 'facebook',
      name: 'Facebook',
      url: facebookUrl,
      color: '#1877F2',
      renderIcon: () => (
        <svg viewBox="0 0 48 48" style={{ width: '50px', height: '50px', flexShrink: 0 }}>
          <circle cx="24" cy="24" r="24" fill="#1877F2"/>
          <path fill="#FFFFFF" d="M26.67 38V24.5h4.53l.68-5.26h-5.21v-3.36c0-1.52.42-2.56 2.61-2.56h2.79V8.61c-.48-.06-2.14-.21-4.07-.21-4.03 0-6.79 2.46-6.79 6.98v3.86h-4.54v5.26h4.54V38h5.46z"/>
        </svg>
      )
    });
  }
  if (instagramUrl) {
    activeSocials.push({
      type: 'instagram',
      name: 'Instagram',
      url: instagramUrl,
      color: '#ec4899',
      renderIcon: () => (
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', color: '#ffffff', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        </div>
      )
    });
  }
  if (youtubeUrl) {
    activeSocials.push({
      type: 'youtube',
      name: 'YouTube',
      url: youtubeUrl,
      color: '#FF0000',
      renderIcon: () => (
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF0000', boxShadow: '0 2px 8px rgba(255,0,0,0.2)' }}>
          <svg viewBox="0 0 24 24" style={{ width: '28px', height: '28px', fill: '#ffffff' }}>
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
      )
    });
  }

  // WhatsApp store contact number (clean format for wa.me)
  const rawPhone = tenant.store_phone || tenant.phone_number_id || receipt.StorePhone || receipt.storePhone || '';
  const whatsappNumber = rawPhone ? rawPhone.replace(/\D/g, '') : '';

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
                style={{ height: '42px', width: '42px', borderRadius: '50%', objectFit: 'contain', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }} 
              />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0f766e', color: '#ffffff', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', boxShadow: '0 2px 6px rgba(15, 118, 110, 0.2)' }}>
                {storeName.charAt(0)}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
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
              <button 
                type="button"
                onClick={() => handleTrackAndOpen('google_review_click', googleReviewUrl, 'receipt_card_header')}
                style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', display: 'block' }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#d97706', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
                  Rate Your Experience with us
                </h3>
              </button>
              
              {(feedbackSent || engagementActionDone.googleReview) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '700', fontSize: '13px' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                  <span>Thank you for your review!</span>
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
            <button
              type="button"
              onClick={() => handleTrackAndOpen('google_review_click', googleReviewUrl, 'receipt_card_icon')}
              title="Leave a Google Review"
              style={{ background: 'none', border: 'none', flexShrink: 0, padding: '4px', display: 'block', cursor: 'pointer', transition: 'transform 0.2s' }}
            >
              <svg viewBox="0 0 48 48" style={{ width: '46px', height: '46px', display: 'block' }}>
                <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.91l7.35-5.73z"/>
                <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. SOCIAL FOLLOW SLIDER: Dynamic (FB, Insta, YouTube)     */}
        {/* ========================================================= */}
        {activeSocials.length > 0 && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '14px', padding: '16px 20px' }}>
            <div style={{ minHeight: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const cur = activeSocials[socialSlide % activeSocials.length];
                if (!cur) return null;
                return (
                  <button
                    type="button"
                    onClick={() => handleTrackAndOpen(`${cur.type}_click`, cur.url, 'social_slider')}
                    style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', cursor: 'pointer', width: '100%', padding: 0 }}
                  >
                    {cur.renderIcon()}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Follow us on</span>
                      <span style={{ fontSize: '23px', fontWeight: '800', color: cur.color, letterSpacing: '-0.02em' }}>{cur.name}</span>
                    </div>
                  </button>
                );
              })()}
            </div>

            {/* Social Slide Dots */}
            {activeSocials.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                {activeSocials.map((item, idx) => (
                  <button
                    key={item.type}
                    onClick={() => setSocialSlide(idx)}
                    style={{
                      height: '6px',
                      width: (socialSlide % activeSocials.length) === idx ? '20px' : '6px',
                      borderRadius: '3px',
                      backgroundColor: (socialSlide % activeSocials.length) === idx ? item.color : '#e2e8f0',
                      transition: 'all 0.2s',
                      padding: 0,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    aria-label={`${item.name} slide`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* QUICK ACTIONS: Download PDF & Share Bill                  */}
        {/* ========================================================= */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
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
              cursor: downloadingPdf ? 'not-allowed' : 'pointer',
              opacity: downloadingPdf ? 0.75 : 1,
              transition: 'all 0.15s'
            }}
          >
            <Download style={{ width: '16px', height: '16px' }} />
            <span>{downloadingPdf ? 'Saving PDF...' : 'Download PDF'}</span>
          </button>
          <button
            type="button"
            onClick={handleShareBill}
            disabled={sharingPdf}
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
              cursor: sharingPdf ? 'not-allowed' : 'pointer',
              opacity: sharingPdf ? 0.75 : 1,
              transition: 'all 0.15s'
            }}
          >
            <Share2 style={{ width: '16px', height: '16px', color: '#64748b' }} />
            <span>{sharingPdf ? 'Preparing PDF...' : 'Share Bill'}</span>
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

          {/* Verified Digital Bill Footer in Downloaded PDF & On Screen */}
          <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: '16px', paddingTop: '10px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
            <span>Verified Digital Invoice &bull; Powered by </span>
            <strong style={{ color: '#0f172a', fontWeight: '700' }}>RetailNode</strong>
            <span style={{ display: 'block', fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>https://bill.retailnode.in</span>
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
        <footer style={{ textAlign: 'center', paddingBottom: '32px', paddingTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '11px', color: '#94a3b8' }}>
            <Link to="/privacy-policy" style={{ color: '#64748b', textDecoration: 'underline' }}>Privacy Policy</Link>
            <span>&bull;</span>
            <Link to="/terms-and-conditions" style={{ color: '#64748b', textDecoration: 'underline' }}>Terms &amp; Conditions</Link>
          </div>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* FIRST-VISIT CUSTOMER ENGAGEMENT POPUP MODAL               */}
      {/* Asks for Google Review, Instagram follow, YouTube follow  */}
      {/* Tracks user clicks and stores in action_logs & Redis      */}
      {/* ========================================================= */}
      {showEngagementModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) dismissEngagementModal();
          }}
        >
          <style>{`
            @keyframes engagementModalFadeIn {
              from { opacity: 0; transform: scale(0.94) translateY(12px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '430px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              position: 'relative',
              animation: 'engagementModalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Top Close Button */}
            <button
              onClick={dismissEngagementModal}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                color: '#64748b'
              }}
              aria-label="Close dialog"
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>

            {/* Header Accent Bar with store branding */}
            <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #facc15 100%)', padding: '24px 20px 18px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '10px', overflow: 'hidden', border: '2px solid #ffffff' }}>
                {tenant.logo_url ? (
                  <img src={tenant.logo_url} alt={storeName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <Sparkles style={{ width: '28px', height: '28px', color: '#d97706' }} />
                )}
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#78350f', margin: '0 0 4px', lineHeight: 1.2 }}>
                Thank You for Visiting!
              </h2>
              <p style={{ fontSize: '13px', color: '#92400e', margin: 0, fontWeight: '600' }}>
                {storeName} appreciates your support
              </p>
            </div>

            {/* Modal Body with Options */}
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 16px', lineHeight: 1.5, textAlign: 'center' }}>
                How would you like to stay connected? Choose an option below to support our store:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 1. GOOGLE REVIEW OPTION */}
                {googleReviewUrl && (
                  <div 
                    style={{
                      border: engagementActionDone.googleReview ? '1.5px solid #10b981' : '1.5px solid #fde68a',
                      backgroundColor: engagementActionDone.googleReview ? '#f0fdf4' : '#fffbeb',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', flexShrink: 0 }}>
                        <svg viewBox="0 0 48 48" style={{ width: '26px', height: '26px' }}>
                          <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                          <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                          <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.91l7.35-5.73z"/>
                          <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Google Review</span>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#b45309', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '10px' }}>5 Stars</span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>
                          Takes only 10 seconds to rate us
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTrackAndOpen('google_review_click', googleReviewUrl, 'modal_card')}
                      style={{
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        backgroundColor: engagementActionDone.googleReview ? '#10b981' : '#f59e0b',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      {engagementActionDone.googleReview ? (
                        <><CheckCircle2 style={{ width: '13px', height: '13px' }} /> Opened</>
                      ) : (
                        <><Star style={{ width: '13px', height: '13px', fill: '#ffffff' }} /> Review</>
                      )}
                    </button>
                  </div>
                )}

                {/* 2. INSTAGRAM FOLLOW OPTION */}
                {instagramUrl && (
                  <div 
                    style={{
                      border: engagementActionDone.instagram ? '1.5px solid #10b981' : '1.5px solid #fbcfe8',
                      backgroundColor: engagementActionDone.instagram ? '#f0fdf4' : '#fdf2f8',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                        <svg viewBox="0 0 24 24" style={{ width: '22px', height: '22px', color: '#ffffff', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Instagram</span>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#be185d', backgroundColor: '#fce7f3', padding: '1px 6px', borderRadius: '10px' }}>New Looks</span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>
                          Daily saree arrivals & festive offers
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTrackAndOpen('instagram_click', instagramUrl, 'modal_card')}
                      style={{
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        background: engagementActionDone.instagram ? '#10b981' : 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      {engagementActionDone.instagram ? (
                        <><CheckCircle2 style={{ width: '13px', height: '13px' }} /> Followed</>
                      ) : (
                        'Follow Us'
                      )}
                    </button>
                  </div>
                )}

                {/* 3. YOUTUBE SUBSCRIBE OPTION */}
                {youtubeUrl && (
                  <div 
                    style={{
                      border: engagementActionDone.youtube ? '1.5px solid #10b981' : '1.5px solid #fecaca',
                      backgroundColor: engagementActionDone.youtube ? '#f0fdf4' : '#fef2f2',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#FF0000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(255,0,0,0.2)' }}>
                        <svg viewBox="0 0 24 24" style={{ width: '22px', height: '22px', fill: '#ffffff' }}>
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>YouTube</span>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#991b1b', backgroundColor: '#fee2e2', padding: '1px 6px', borderRadius: '10px' }}>Videos</span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>
                          Collection showcases & draping videos
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTrackAndOpen('youtube_click', youtubeUrl, 'modal_card')}
                      style={{
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        backgroundColor: engagementActionDone.youtube ? '#10b981' : '#FF0000',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      {engagementActionDone.youtube ? (
                        <><CheckCircle2 style={{ width: '13px', height: '13px' }} /> Subscribed</>
                      ) : (
                        'Subscribe'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Combined Option: Support Both / All */}
              {(googleReviewUrl && (instagramUrl || youtubeUrl)) && (
                <button
                  type="button"
                  onClick={() => {
                    if (googleReviewUrl) handleTrackAndOpen('google_review_click', googleReviewUrl, 'modal_support_both');
                    if (instagramUrl) {
                      setTimeout(() => handleTrackAndOpen('instagram_click', instagramUrl, 'modal_support_both'), 400);
                    } else if (youtubeUrl) {
                      setTimeout(() => handleTrackAndOpen('youtube_click', youtubeUrl, 'modal_support_both'), 400);
                    }
                  }}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '11px 16px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Sparkles style={{ width: '15px', height: '15px', color: '#f59e0b' }} />
                  <span>Support on Both (Review + Follow)</span>
                </button>
              )}

              {/* Dismiss / Continue to Invoice */}
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={dismissEngagementModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0f766e',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    textDecoration: 'underline'
                  }}
                >
                  Continue to Bill Receipt →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
