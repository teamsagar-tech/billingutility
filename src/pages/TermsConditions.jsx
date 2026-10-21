import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TermsConditions() {
  useEffect(() => {
    document.title = 'Terms & Conditions - RetailNode Digital Billing';
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
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText style={{ width: '22px', height: '22px' }} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Terms &amp; Conditions</h1>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Effective Date: October 2026 &bull; Governed under the Information Technology Act, 2000 of India
          </p>
        </div>

        {/* Content Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '14px', lineHeight: '1.7', color: '#334155' }}>
          
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the RetailNode Digital Invoice and Customer Billing Platform (<strong>bill.retailnode.in</strong>), including viewing digital receipts, redeeming loyalty coupons, or submitting star feedback, you agree to be bound by these Terms and Conditions. If you do not agree, please refrain from using the platform.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              2. Nature of Digital Invoices
            </h2>
            <p>
              Digital invoices hosted on <strong>bill.retailnode.in</strong> represent electronic replicas of transactions initiated at participating retail establishments. The primary business relationship, warranty, product liability, return policy, and exchange terms exist strictly between the customer and the respective merchant listed on the receipt header.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              3. Loyalty Points &amp; Promotional Offers
            </h2>
            <p>
              Loyalty balances, reward coupons, and promotional discounts displayed on digital receipts are governed by the participating retailer's individual terms. Points cannot be exchanged for cash, are non-transferable between stores, and may be subject to expiration as configured by the merchant.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              4. Merchant Messaging Responsibilities
            </h2>
            <p>
              Merchants utilizing our API, desktop print agent, or WABA gateway warrant that customer phone numbers entered during checkout were provided with explicit opt-in consent for receiving transactional invoices and store communications in compliance with TRAI and Meta WhatsApp Commerce policies.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              5. Intellectual Property
            </h2>
            <p>
              All platform design, software code, APIs, and the RetailNode name and logo are the proprietary property of RetailNode. Merchant names, logos, and product brand identifiers remain the exclusive trademarks of their respective owners.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              6. Limitation of Liability
            </h2>
            <p>
              RetailNode operates as a technology intermediary utility. To the maximum extent permitted by law, RetailNode shall not be liable for product defects, disputes between merchants and buyers, delivery failures caused by telecom network outages, or typographical errors recorded on physical bills.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              7. Governing Law &amp; Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with the platform shall be subject to the exclusive jurisdiction of the competent courts in Maharashtra, India.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '32px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap', gap: '8px' }}>
          <span>© 2026 RetailNode. All rights reserved.</span>
          <Link to="/privacy-policy" style={{ color: '#0f766e', fontWeight: '600', textDecoration: 'none' }}>
            View Privacy Policy &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
