import React from 'react';
import { LayoutDashboard, Users, Gift, TrendingUp } from 'lucide-react';

const SmartCRM = () => {
  return (
    <div className="pt-32 pb-16 min-h-[80vh] container" style={{ paddingTop: '10rem', paddingBottom: '6rem', minHeight: '80vh' }}>
      <div className="text-center" style={{ marginBottom: '4rem' }}>
        <h1 className="text-5xl font-extrabold" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
          360-Degree <span className="gradient-text">Business Dashboard</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          The most effortless way to automate WhatsApp-driven marketing and customer engagement for your retail business.
        </p>
      </div>

      <div className="grid md-grid-cols-2 gap-8 max-w-5xl mx-auto mb-16" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto 4rem auto' }}>
        
        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: 'var(--primary-blue)' }}><LayoutDashboard size={32} /></div>
          <h3 className="text-2xl font-bold">All-In-One Solution</h3>
          <p className="text-muted">Send offers and promotions, check analytics, automate campaigns, and manage loyalty and rewards from a single, intuitive interface.</p>
        </div>

        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: 'var(--accent-teal)' }}><Users size={32} /></div>
          <h3 className="text-2xl font-bold">Manage Customer Lists</h3>
          <p className="text-muted">Manage customer information on a centralized dashboard and deliver personalized experiences. One tool to manage all customer data across multiple locations.</p>
        </div>

        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: 'var(--accent-purple)' }}><Gift size={32} /></div>
          <h3 className="text-2xl font-bold">Offers and Promotions</h3>
          <p className="text-muted">Engage customers 1:1 or in bulk with tailor-made offers and promotions using built-in templates and powerful automation tools.</p>
        </div>

        <div className="glass-panel p-8" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', color: '#f59e0b' }}><TrendingUp size={32} /></div>
          <h3 className="text-2xl font-bold">Drive Conversations</h3>
          <p className="text-muted">Let automation do the work. Schedule promotional, loyalty and customer retention tasks and drive conversations at a 20x higher rate.</p>
        </div>

      </div>

      <div className="text-center">
        <button className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.25rem' }}>Start Free Trial</button>
      </div>
    </div>
  );
};

export default SmartCRM;
