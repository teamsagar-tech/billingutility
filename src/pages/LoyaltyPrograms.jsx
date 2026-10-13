import React from 'react';
import { Wallet, ShieldCheck, Clock, TrendingUp } from 'lucide-react';

const LoyaltyPrograms = () => {
  return (
    <div className="pt-32 pb-16 min-h-[80vh] container" style={{ paddingTop: '10rem', paddingBottom: '6rem', minHeight: '80vh' }}>
      <div className="text-center" style={{ marginBottom: '4rem' }}>
        <h1 className="text-5xl font-extrabold" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
          Next-Gen <span className="gradient-text">Loyalty Programs</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Deliver personalized rewarding experiences via digital bills shared on WhatsApp and increase repeat purchases like never before.
        </p>
      </div>

      <div className="grid md-grid-cols-2 gap-8 max-w-5xl mx-auto mb-16" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto 4rem auto' }}>
        
        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: 'var(--primary-blue)' }}><TrendingUp size={32} /></div>
          <h3 className="text-2xl font-bold">Boost Customer LTV</h3>
          <p className="text-muted">Increase customer lifetime value up to 400% by creating repeat buyers and making your retail business highly profitable.</p>
        </div>

        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: 'var(--accent-teal)' }}><Wallet size={32} /></div>
          <h3 className="text-2xl font-bold">Digital Wallet on WhatsApp</h3>
          <p className="text-muted">Enable an online wallet for your customers via digital bill that can be used to instantly check loyalty points and available coupons.</p>
        </div>

        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: 'var(--accent-purple)' }}><Clock size={32} /></div>
          <h3 className="text-2xl font-bold">Expiry Reminders</h3>
          <p className="text-muted">Send automated reminders of loyalty points status and upcoming expiry to your customers to instantly increase redemption and footfall.</p>
        </div>

        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: '#f59e0b' }}><ShieldCheck size={32} /></div>
          <h3 className="text-2xl font-bold">OTP Redemption</h3>
          <p className="text-muted">Give your customers the easiest and most secure way to redeem their loyalty points via OTP verification directly at the time of purchase.</p>
        </div>

      </div>

      <div className="text-center">
        <button className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.25rem' }}>Setup Loyalty Program</button>
      </div>
    </div>
  );
};

export default LoyaltyPrograms;
