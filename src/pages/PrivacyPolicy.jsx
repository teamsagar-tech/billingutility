import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy - RetailNode Digital Billing';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif', padding: '32px 16px 64px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '20px', padding: '36px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
        
        {/* Navigation Back */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0f766e', fontWeight: '700', fontSize: '13px', textDecoration: 'none', marginBottom: '20px' }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} /> Return to Home
        </Link>

        {/* Title Header */}
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck style={{ width: '22px', height: '22px' }} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Privacy Policy</h1>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Effective Date: October 2026 &bull; Compliant with Digital Personal Data Protection (DPDP) Act 2023 &amp; IT Act 2000
          </p>
        </div>

        {/* Content Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '14px', lineHeight: '1.7', color: '#334155' }}>
          
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              1. Overview &amp; Scope
            </h2>
            <p>
              RetailNode ("Platform", "we", "us", or "our") operates the Digital Invoice and Customer Billing Utility SaaS platform (<strong>bill.retailnode.in</strong>). This Privacy Policy describes how we collect, process, store, and safeguard data when retail merchants use our services to dispatch digital receipts to shoppers via WhatsApp, SMS, or web links.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              2. Data We Process for Digital Receipts
            </h2>
            <p style={{ marginBottom: '8px' }}>When an in-store transaction occurs, our billing utility processes:</p>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li><strong>Transaction Data:</strong> Store name, bill number, purchase date, item descriptions, quantities, prices, taxes, and total amount payable.</li>
              <li><strong>Customer Contact Details:</strong> Mobile number provided at checkout solely for receipt transmission and store loyalty points ledger.</li>
              <li><strong>Customer Engagement Data:</strong> Star ratings, feedback submitted on receipt links, and promotional voucher redemptions.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              3. Analytics, Meta Pixel &amp; Cookie Compliance
            </h2>
            <p>
              To help merchants evaluate store campaign performance and re-engage in-store shoppers, our web receipt pages utilize standard first-party web cookies and third-party advertising analytics tools (such as the Meta/Facebook Pixel).
            </p>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px', margin: '12px 0' }}>
              <div style={{ fontWeight: '700', color: '#166534', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px' }} /> Strict Privacy &amp; PII Safeguards:
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#14532d' }}>
                We <strong>never transmit unhashed or raw personal data</strong> (such as your phone number, Aadhaar, identity records, or complete residential addresses) to Meta or external ad networks. Event data is limited to anonymous transaction totals (e.g. Purchase value: ₹8,800) and general PageView counters.
              </p>
            </div>
            <p>
              Users may disable tracking cookies at any time via browser settings or through Meta's Ad Preferences settings (https://www.facebook.com/adpreferences).
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              4. WhatsApp &amp; SMS Messaging Standards
            </h2>
            <p>
              Messages sent through our WhatsApp Business API (WABA) gateway are utility-classified transactional receipts requested by the customer at billing. We do not sell, rent, or trade your contact information to third-party telemarketers or external advertising brokers.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              5. Search Engine No-Index Policy
            </h2>
            <p>
              Digital invoices contain private shopping transactions. In compliance with data confidentiality guidelines, all receipt URLs (<code>/i/*</code> and <code>/t/*</code>) enforce strict <code>noindex, nofollow, noarchive</code> HTTP directives and robots.txt declarations, preventing public search engines (Google, Bing) from indexing or caching customer invoices.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              6. Data Retention &amp; Security
            </h2>
            <p>
              Invoice data is securely stored on enterprise servers utilizing TLS 1.3 encryption in transit and AES-256 encrypted relational databases. Receipts are accessible via high-entropy, cryptographically generated short identifiers (e.g. <code>JiKSx0qM</code>).
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              7. Grievance Redressal &amp; Inquiries
            </h2>
            <p>
              For questions concerning this Privacy Policy, your loyalty data, or to request deletion of your billing record from a participating store, contact:
            </p>
            <p style={{ margin: '8px 0 0', fontWeight: '600' }}>
              RetailNode Privacy &amp; Compliance Office<br />
              Email: <a href="mailto:privacy@retailnode.in" style={{ color: '#0f766e' }}>privacy@retailnode.in</a> &bull; Support: <a href="mailto:support@retailnode.in" style={{ color: '#0f766e' }}>support@retailnode.in</a><br />
              Website: <a href="https://retailnode.in" target="_blank" rel="noopener noreferrer" style={{ color: '#0f766e' }}>retailnode.in</a>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '32px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap', gap: '8px' }}>
          <span>© 2026 RetailNode. All rights reserved.</span>
          <Link to="/terms-and-conditions" style={{ color: '#0f766e', fontWeight: '600', textDecoration: 'none' }}>
            View Terms &amp; Conditions &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
