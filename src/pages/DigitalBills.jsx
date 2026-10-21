import React from 'react';
import { FileText, MessageCircle, Star, Users } from 'lucide-react';

const DigitalBills = () => {
  return (
    <div className="pt-32 pb-16 min-h-[80vh] container" style={{ paddingTop: '10rem', paddingBottom: '6rem', minHeight: '80vh' }}>
      <div className="text-center" style={{ marginBottom: '4rem' }}>
        <h1 className="text-5xl font-extrabold" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
          Digital Bills on <span className="gradient-text">WhatsApp</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Transform your transactional receipts into a powerful marketing engine. Deliver eco-friendly bills straight to WhatsApp and drive 20x more engagement.
        </p>
      </div>

      <div className="grid md-grid-cols-2 gap-8 max-w-5xl mx-auto mb-16" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto 4rem auto' }}>
        
        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: 'var(--primary-blue)' }}><Star size={32} /></div>
          <h3 className="text-2xl font-bold">20x More Google Reviews</h3>
          <p className="text-muted">Get a credibility boost by collecting reviews and feedback seamlessly via digital bills. Nudge happy customers to leave a 5-star rating with one click.</p>
        </div>

        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: 'var(--accent-teal)' }}><Users size={32} /></div>
          <h3 className="text-2xl font-bold">Complete Customer Profiles</h3>
          <p className="text-muted">Collect more customer information effortlessly. Request your customers to fill in their details and earn rewards, all possible through the digital bill.</p>
        </div>

        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: 'var(--accent-purple)' }}><MessageCircle size={32} /></div>
          <h3 className="text-2xl font-bold">Automated Delivery</h3>
          <p className="text-muted">RetailNode instantly sends digital bills on WhatsApp to your customers so that they never lose their receipts again, ensuring a premium post-purchase experience.</p>
        </div>

        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: '#f59e0b' }}><FileText size={32} /></div>
          <h3 className="text-2xl font-bold">Loyalty Points Redemption</h3>
          <p className="text-muted">Increase redemption of loyalty points via digital bill. Customers can instantly view their earned points and available coupons directly on their phone.</p>
        </div>

      </div>

      <div className="text-center">
        <button className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.25rem' }}>Request a Free Demo</button>
      </div>
    </div>
  );
};

export default DigitalBills;
