import React from 'react';
import { TrendingUp, Users, Target } from 'lucide-react';

const StatsSection = () => {
  return (
    <section className="container py-24 border-t border-b border-gray-100" style={{ padding: '6rem 24px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="grid md:grid-cols-3 gap-12 text-center max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <Target size={32} color="var(--primary-blue)" />
          </div>
          <h3 className="text-5xl font-extrabold gradient-text" style={{ fontSize: '3.5rem', fontWeight: 800 }}>15%</h3>
          <p className="text-xl font-bold" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Click-Through Rate</p>
          <p className="text-muted">Achieve unparalleled engagement with WhatsApp marketing messages compared to traditional SMS or Email.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <Users size={32} color="var(--accent-teal)" />
          </div>
          <h3 className="text-5xl font-extrabold gradient-text" style={{ fontSize: '3.5rem', fontWeight: 800 }}>22%</h3>
          <p className="text-xl font-bold" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Better Retention</p>
          <p className="text-muted">Engage your customers with an intuitive loyalty program and retain them at a significantly higher rate.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <TrendingUp size={32} color="var(--accent-purple)" />
          </div>
          <h3 className="text-5xl font-extrabold gradient-text" style={{ fontSize: '3.5rem', fontWeight: 800 }}>400%</h3>
          <p className="text-xl font-bold" style={{ fontSize: '1.25rem', fontWeight: 700 }}>LTV Increase</p>
          <p className="text-muted">Boost customer lifetime value by creating repeat buyers and making your retail business more profitable.</p>
        </div>

      </div>
    </section>
  );
};

export default StatsSection;
