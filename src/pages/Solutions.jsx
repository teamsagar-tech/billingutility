import React from 'react';

const Solutions = () => {
  return (
    <div className="pt-32 pb-16 min-h-[80vh] container" style={{ paddingTop: '10rem', minHeight: '80vh' }}>
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold mb-4" style={{ fontSize: '3rem', fontWeight: 800 }}>
          Industry <span className="gradient-text">Solutions</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Tailored marketing and CRM solutions for every type of retail business.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {['Apparel & Footwear', 'Electronics & Electricals', 'Fine-Dining & QSR', 'Home & Living', 'Sports & Fitness', 'Salon & Spa'].map((industry, i) => (
          <div key={i} className="glass-panel p-8 text-center transition-all" style={{ padding: '2rem', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
            <h3 className="text-2xl font-bold mb-2" style={{ fontSize: '1.5rem', color: 'var(--primary-dark)' }}>{industry}</h3>
            <p className="text-muted">Grow your {industry.toLowerCase()} business with automated, data-driven customer engagement.</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Solutions;
