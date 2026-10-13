import React from 'react';
import FeaturesSection from '../components/FeaturesSection';

const Features = () => {
  return (
    <div className="pt-32 pb-16 min-h-[80vh]" style={{ paddingTop: '8rem', minHeight: '80vh' }}>
      <div className="container text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4" style={{ fontSize: '3rem', fontWeight: 800 }}>
          Comprehensive Features for <span className="gradient-text">Retail</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Everything you need to attract, engage, retain, and manage your retail customers.
        </p>
      </div>
      <FeaturesSection />
    </div>
  );
};

export default Features;
