import React from 'react';
import { Quote } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      text: "Collecting Google Reviews has never been so seamless. In just 3 months, we have witnessed a 30% increase in inbound enquiries & store footfall.",
      author: "CEAT Shoppe Owner",
      role: "Retail Partner"
    },
    {
      text: "The loyalty perks, expiry reminders, and WhatsApp support are game-changers, delivering exceptional ROI in the industry. Highly recommended!",
      author: "Harish Gupta",
      role: "Head of Retail Business"
    },
    {
      text: "Kudos for transforming our customization business! The paperless bill delivery via WhatsApp and CRM campaigns have redefined customer engagement.",
      author: "Divesh Mehta",
      role: "Head of Digital"
    }
  ];

  return (
    <section className="container py-24" style={{ padding: '6rem 24px', background: 'linear-gradient(to bottom, transparent, rgba(30, 58, 138, 0.03))' }}>
      <div className="text-center mb-16" style={{ marginBottom: '4rem' }}>
        <h2 className="text-4xl font-extrabold mb-4" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          Loved by <span className="gradient-text">Retail Leaders</span>
        </h2>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Don't just take our word for it. See how RetailNode is transforming offline retail.
        </p>
      </div>

      <div className="grid md-grid-cols-3 gap-8 max-w-6xl mx-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
        {testimonials.map((t, idx) => (
          <div key={idx} className="glass-panel p-8 relative" style={{ padding: '2rem', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <Quote size={40} color="rgba(30, 58, 138, 0.1)" style={{ position: 'absolute', top: '1rem', right: '1rem' }} />
            <p style={{ color: 'var(--text-main)', fontSize: '1.125rem', fontStyle: 'italic', marginBottom: '1.5rem', flex: 1, zIndex: 1, position: 'relative' }}>
              "{t.text}"
            </p>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-dark)' }}>{t.author}</h4>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t.role}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
