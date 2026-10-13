import React from 'react';
import { Star, Building2, MapPin } from 'lucide-react';

const TrustSection = () => {
  return (
    <section className="container py-16 text-center" style={{ padding: '4rem 24px', textAlign: 'center' }}>
      <p className="text-muted font-semibold mb-8 uppercase tracking-widest text-sm" style={{ marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--text-muted)' }}>
        Trusted by 60,000+ Retailers and Brands
      </p>
      
      <div className="grid md-grid-cols-3 gap-8 max-w-4xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        
        <div className="glass-panel p-6 flex-col items-center gap-4 transition-transform hover-scale" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
          <div style={{ background: 'rgba(250, 204, 21, 0.2)', padding: '1rem', borderRadius: '50%' }}>
            <Star size={32} color="#eab308" fill="#eab308" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold" style={{ fontSize: '2rem', fontWeight: 800 }}>4.8+</h3>
            <p className="text-muted font-semibold" style={{ color: 'var(--text-muted)' }}>Rating on Google Reviews</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex-col items-center gap-4 transition-transform hover-scale" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <Building2 size={32} color="var(--primary-blue)" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold" style={{ fontSize: '2rem', fontWeight: 800 }}>60K+</h3>
            <p className="text-muted font-semibold" style={{ color: 'var(--text-muted)' }}>Retailers & Brands</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex-col items-center gap-4 transition-transform hover-scale" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
          <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <MapPin size={32} color="var(--accent-teal)" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold" style={{ fontSize: '2rem', fontWeight: 800 }}>300+</h3>
            <p className="text-muted font-semibold" style={{ color: 'var(--text-muted)' }}>Cities across India</p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TrustSection;
