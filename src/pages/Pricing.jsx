import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const Pricing = () => {
  return (
    <div className="container" style={{ paddingTop: '10rem', paddingBottom: '6rem', minHeight: '80vh' }}>
      <div className="text-center" style={{ marginBottom: '4rem' }}>
        <h1 className="text-5xl font-extrabold" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}>
          Simple, Transparent <span className="gradient-text">Pricing</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Start for free, upgrade when you need more power.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1000px', margin: '0 auto', alignItems: 'stretch' }}>
        
        {/* Starter Plan */}
        <div className="glass-panel p-8" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="text-2xl font-bold mb-2">Starter</h3>
          <div className="text-4xl font-extrabold mb-6">₹0<span className="text-base text-muted font-normal">/month</span></div>
          <ul className="mb-8" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {['Up to 500 digital bills/mo', 'Basic CRM features', 'Google Reviews integration', 'Standard email support'].map((feat, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle2 size={18} color="var(--accent-teal)" />
                <span className="text-muted">{feat}</span>
              </li>
            ))}
          </ul>
          <button className="btn-secondary w-full" style={{ width: '100%' }}>Get Started</button>
        </div>

        {/* Pro Plan */}
        <div className="glass-panel p-8" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', transform: 'scale(1.05)', border: '2px solid var(--primary-light)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary-light)', color: 'white', padding: '2px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' }}>MOST POPULAR</div>
          <h3 className="text-2xl font-bold mb-2">Pro</h3>
          <div className="text-4xl font-extrabold mb-6">₹1,999<span className="text-base text-muted font-normal">/month</span></div>
          <ul className="mb-8" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {['Unlimited digital bills', 'Marketing Automation', 'Loyalty Programs', 'Advanced Analytics', 'Priority WhatsApp support'].map((feat, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle2 size={18} color="var(--primary-blue)" />
                <span className="text-muted">{feat}</span>
              </li>
            ))}
          </ul>
          <button className="btn-primary w-full" style={{ width: '100%' }}>Start Free Trial</button>
        </div>

        {/* Enterprise Plan */}
        <div className="glass-panel p-8" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
          <div className="text-4xl font-extrabold mb-6">Custom</div>
          <ul className="mb-8" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {['Multi-store management', 'Custom POS integrations', 'Dedicated account manager', 'Custom reporting', '24/7 Phone support'].map((feat, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle2 size={18} color="var(--accent-teal)" />
                <span className="text-muted">{feat}</span>
              </li>
            ))}
          </ul>
          <button className="btn-secondary w-full" style={{ width: '100%' }}>Contact Sales</button>
        </div>

      </div>
    </div>
  );
};

export default Pricing;
