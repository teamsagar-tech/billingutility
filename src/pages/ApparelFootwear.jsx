import React from 'react';
import { Shirt, Tag, PartyPopper } from 'lucide-react';

const ApparelFootwear = () => {
  return (
    <div className="pt-32 pb-16 min-h-[80vh] container" style={{ paddingTop: '10rem', paddingBottom: '6rem', minHeight: '80vh' }}>
      <div className="text-center" style={{ marginBottom: '4rem' }}>
        <h1 className="text-5xl font-extrabold" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
          Apparel & <span className="gradient-text">Footwear</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Drive repeat purchases on seasonal collections and clear out inventory faster with highly targeted WhatsApp campaigns.
        </p>
      </div>

      <div className="grid md-grid-cols-3 gap-8 max-w-5xl mx-auto mb-16" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto 4rem auto' }}>
        
        <div className="glass-panel p-8 text-center" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-blue)' }}><Shirt size={32} /></div>
          <h3 className="text-xl font-bold">Seasonal Drops</h3>
          <p className="text-muted">Instantly notify your best customers about new summer or winter collections directly on WhatsApp with rich media images.</p>
        </div>

        <div className="glass-panel p-8 text-center" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-teal)' }}><Tag size={32} /></div>
          <h3 className="text-xl font-bold">Flash Sales</h3>
          <p className="text-muted">Need to clear inventory? Send a time-sensitive 24-hour coupon via WhatsApp. Experience up to 15% CTR compared to 2% on email.</p>
        </div>

        <div className="glass-panel p-8 text-center" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-purple)' }}><PartyPopper size={32} /></div>
          <h3 className="text-xl font-bold">Birthday Outfits</h3>
          <p className="text-muted">Automatically send a 20% discount coupon 7 days before a customer's birthday, encouraging them to buy their celebration outfit from you.</p>
        </div>

      </div>
    </div>
  );
};

export default ApparelFootwear;
