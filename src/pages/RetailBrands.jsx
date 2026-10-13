import React from 'react';
import { Building2, Globe, Database } from 'lucide-react';

const RetailBrands = () => {
  return (
    <div className="pt-32 pb-16 min-h-[80vh] container" style={{ paddingTop: '10rem', paddingBottom: '6rem', minHeight: '80vh' }}>
      <div className="text-center" style={{ marginBottom: '4rem' }}>
        <h1 className="text-5xl font-extrabold" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
          For <span className="gradient-text">Retail Brands</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Scale your enterprise retail brand with a robust CRM and WhatsApp automation engine built for high-volume transactions.
        </p>
      </div>

      <div className="glass-panel p-12 max-w-4xl mx-auto mb-16" style={{ padding: '3rem' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '1rem', color: 'var(--primary-blue)', alignSelf: 'flex-start' }}><Building2 size={24} /></div>
              <div>
                <h3 className="text-xl font-bold mb-2">Enterprise Scale</h3>
                <p className="text-muted">Built to handle thousands of daily transactions across massive franchise networks with zero downtime and seamless ERP sync.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '1rem', borderRadius: '1rem', color: 'var(--accent-teal)', alignSelf: 'flex-start' }}><Database size={24} /></div>
              <div>
                <h3 className="text-xl font-bold mb-2">Deep ERP Integrations</h3>
                <p className="text-muted">RetailBill acts as a middleware that integrates directly into your custom ERP or complex POS setups, requiring zero operational changes.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '1rem', color: 'var(--accent-purple)', alignSelf: 'flex-start' }}><Globe size={24} /></div>
              <div>
                <h3 className="text-xl font-bold mb-2">Omnichannel Loyalty</h3>
                <p className="text-muted">Unify your online D2C store loyalty programs with your physical offline stores, giving customers a single wallet for all points.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="text-center">
        <button className="btn-secondary" style={{ padding: '1rem 3rem', fontSize: '1.25rem' }}>Contact Enterprise Sales</button>
      </div>
    </div>
  );
};

export default RetailBrands;
