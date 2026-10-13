import React from 'react';
import { Link } from 'react-router-dom';
import { ReceiptText, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="pt-16 pb-8" style={{ paddingTop: '4rem', paddingBottom: '2rem', background: 'var(--primary-dark)', color: 'white' }}>
      <div className="container" style={{ padding: '0 24px' }}>
        <div className="grid md-grid-cols-4 gap-8 mb-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          
          <div className="flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ background: 'white', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--primary-blue)' }}>
                <ReceiptText size={24} />
              </div>
              <span className="font-extrabold text-2xl tracking-tight" style={{ fontSize: '1.5rem', fontWeight: 800 }}>RetailBill</span>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Leading customer engagement and marketing automation platform for retailers and emerging brands.
            </p>
          </div>

          <div className="flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Products</h4>
            <Link to="/products/digital-bills" style={{ color: '#94a3b8', fontSize: '0.875rem', transition: 'color 0.2s', textDecoration: 'none' }}>Digital Bills</Link>
            <Link to="/products/smart-crm" style={{ color: '#94a3b8', fontSize: '0.875rem', transition: 'color 0.2s', textDecoration: 'none' }}>Smart CRM</Link>
            <Link to="/products/marketing-automation" style={{ color: '#94a3b8', fontSize: '0.875rem', transition: 'color 0.2s', textDecoration: 'none' }}>Marketing Automation</Link>
            <Link to="/products/loyalty-programs" style={{ color: '#94a3b8', fontSize: '0.875rem', transition: 'color 0.2s', textDecoration: 'none' }}>Loyalty Programs</Link>
          </div>

          <div className="flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Solutions</h4>
            <Link to="/solutions/retail-stores" style={{ color: '#94a3b8', fontSize: '0.875rem', transition: 'color 0.2s', textDecoration: 'none' }}>For Retail Stores</Link>
            <Link to="/solutions/retail-brands" style={{ color: '#94a3b8', fontSize: '0.875rem', transition: 'color 0.2s', textDecoration: 'none' }}>For Retail Brands</Link>
            <Link to="/solutions/apparel-footwear" style={{ color: '#94a3b8', fontSize: '0.875rem', transition: 'color 0.2s', textDecoration: 'none' }}>Apparel & Footwear</Link>
            <Link to="/solutions/electronics" style={{ color: '#94a3b8', fontSize: '0.875rem', transition: 'color 0.2s', textDecoration: 'none' }}>Electronics & Electricals</Link>
          </div>

          <div className="flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Contact Us</h4>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
              <Phone size={16} style={{ marginTop: '0.25rem' }} />
              <span>+91 (120) 420 7081</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
              <Mail size={16} style={{ marginTop: '0.25rem' }} />
              <span>contact@retailbill.in</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' }}>
              <MapPin size={16} style={{ marginTop: '0.25rem', flexShrink: 0 }} />
              <span>2nd Floor, B-79, B Block, Sector 63, Noida, Uttar Pradesh, 201301, India</span>
            </div>
          </div>
          
        </div>
        
        <div style={{ borderTop: '1px solid #334155', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            © 2026 RetailBill Labs. All Rights Reserved.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/terms-and-conditions" style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
            <Link to="/privacy-policy" style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none' }}>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
