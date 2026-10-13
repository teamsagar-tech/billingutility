import React from 'react';
import { Smartphone, Wrench, ShieldAlert } from 'lucide-react';

const Electronics = () => {
  return (
    <div className="pt-32 pb-16 min-h-[80vh] container" style={{ paddingTop: '10rem', paddingBottom: '6rem', minHeight: '80vh' }}>
      <div className="text-center" style={{ marginBottom: '4rem' }}>
        <h1 className="text-5xl font-extrabold" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
          Electronics & <span className="gradient-text">Electricals</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Provide a premium post-purchase experience with automated warranty reminders, digital receipts, and upselling accessories.
        </p>
      </div>

      <div className="grid md-grid-cols-3 gap-8 max-w-5xl mx-auto mb-16" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto 4rem auto' }}>
        
        <div className="glass-panel p-8 text-center" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-blue)' }}><ShieldAlert size={32} /></div>
          <h3 className="text-xl font-bold">Warranty Tracking</h3>
          <p className="text-muted">Digital bills mean customers never lose their proof of purchase. Automate WhatsApp reminders right before warranties expire to sell extended coverage.</p>
        </div>

        <div className="glass-panel p-8 text-center" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-teal)' }}><Wrench size={32} /></div>
          <h3 className="text-xl font-bold">Post-Purchase Support</h3>
          <p className="text-muted">Send automated setup guides or customer service contact links 2 days after the purchase of large appliances to reduce return rates and increase satisfaction.</p>
        </div>

        <div className="glass-panel p-8 text-center" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-purple)' }}><Smartphone size={32} /></div>
          <h3 className="text-xl font-bold">Accessory Upselling</h3>
          <p className="text-muted">Customer bought a phone? Automatically send them a 10% off coupon for cases and screen protectors 24 hours later directly via WhatsApp.</p>
        </div>

      </div>
    </div>
  );
};

export default Electronics;
