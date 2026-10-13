import React from 'react';
import { MousePointerClick, CalendarHeart, Ticket, RefreshCcw } from 'lucide-react';

const MarketingAutomation = () => {
  return (
    <div className="pt-32 pb-16 min-h-[80vh] container" style={{ paddingTop: '10rem', paddingBottom: '6rem', minHeight: '80vh' }}>
      <div className="text-center" style={{ marginBottom: '4rem' }}>
        <h1 className="text-5xl font-extrabold" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
          WhatsApp <span className="gradient-text">Marketing Automation</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Market your products and services better and grow your revenue with a complete platform for WhatsApp-driven marketing automation.
        </p>
      </div>

      <div className="grid md-grid-cols-2 gap-8 max-w-5xl mx-auto mb-16" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto 4rem auto' }}>
        
        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: 'var(--primary-blue)' }}><MousePointerClick size={32} /></div>
          <h3 className="text-2xl font-bold">15% Click-Through Rate</h3>
          <p className="text-muted">Reach your customers on WhatsApp where they are active. Launch unique promotional campaigns to generate more sales with unparalleled engagement rates.</p>
        </div>

        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: 'var(--accent-teal)' }}><CalendarHeart size={32} /></div>
          <h3 className="text-2xl font-bold">Birthday & Festive Greetings</h3>
          <p className="text-muted">Use pre-built birthday, anniversary, and festival messages to give your customers a pleasant surprise. Deliver the right messages at the right time.</p>
        </div>

        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: 'var(--accent-purple)' }}><Ticket size={32} /></div>
          <h3 className="text-2xl font-bold">Custom Offers & Coupons</h3>
          <p className="text-muted">Create coupons easily from the dashboard and schedule automatic delivery to select customers at moments that matter. Boost brand loyalty.</p>
        </div>

        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: '#f59e0b' }}><RefreshCcw size={32} /></div>
          <h3 className="text-2xl font-bold">Win-Back Campaigns</h3>
          <p className="text-muted">Long time no see? Re-engage with lapsed customers and win them back by automatically sharing attractive, time-sensitive coupons and offers.</p>
        </div>

      </div>

      <div className="text-center">
        <button className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.25rem' }}>Create a Campaign</button>
      </div>
    </div>
  );
};

export default MarketingAutomation;
