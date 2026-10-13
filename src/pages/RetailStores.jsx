import React from 'react';
import { Store, MapPin, Activity } from 'lucide-react';

const RetailStores = () => {
  return (
    <div className="pt-32 pb-16 min-h-[80vh] container" style={{ paddingTop: '10rem', paddingBottom: '6rem', minHeight: '80vh' }}>
      <div className="text-center" style={{ marginBottom: '4rem' }}>
        <h1 className="text-5xl font-extrabold" style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
          For <span className="gradient-text">Retail Stores</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Grow your local, multi-store retail business. Transform footfall into loyal, repeat customers.
        </p>
      </div>

      <div className="glass-panel p-12 max-w-4xl mx-auto mb-16" style={{ padding: '3rem' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '1rem', color: 'var(--primary-blue)', alignSelf: 'flex-start' }}><Store size={24} /></div>
              <div>
                <h3 className="text-xl font-bold mb-2">Centralized Store Management</h3>
                <p className="text-muted">Consolidate customer data from all your physical locations into one dashboard. Monitor exactly which store drives the highest retention.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '1rem', borderRadius: '1rem', color: 'var(--accent-teal)', alignSelf: 'flex-start' }}><MapPin size={24} /></div>
              <div>
                <h3 className="text-xl font-bold mb-2">Hyper-Local Discovery</h3>
                <p className="text-muted">Boost your Google My Business rankings for each individual store location by automating 5-star review collection via WhatsApp.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '1rem', color: 'var(--accent-purple)', alignSelf: 'flex-start' }}><Activity size={24} /></div>
              <div>
                <h3 className="text-xl font-bold mb-2">Footfall Analytics</h3>
                <p className="text-muted">Get a clear visualization of customer interactions and store performance trends over time.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="text-center">
        <button className="btn-secondary" style={{ padding: '1rem 3rem', fontSize: '1.25rem' }}>View Demo for Retailers</button>
      </div>
    </div>
  );
};

export default RetailStores;
