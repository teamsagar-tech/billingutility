import React from 'react';
import { Sparkles, MessageCircle, BarChart3, Users, Gift, Share2 } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      pillar: 'ATTRACT',
      title: 'Reviews & Referrals',
      description: 'Earn more Google Reviews and drive one-click referrals via digital bills on WhatsApp.',
      icon: <Share2 size={28} color="var(--primary-blue)" />,
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      pillar: 'ENGAGE & RETAIN',
      title: 'Digital Bills & Loyalty',
      description: 'Send bills directly to WhatsApp and drive loyalty with automated coupons and expiry reminders.',
      icon: <Gift size={28} color="var(--accent-purple)" />,
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
    {
      pillar: 'ENGAGE & RETAIN',
      title: 'Marketing Automation',
      description: 'Automate marketing campaigns, festive greetings, and win-back offers easily.',
      icon: <Sparkles size={28} color="#eab308" />,
      bgColor: 'rgba(250, 204, 21, 0.1)',
    },
    {
      pillar: 'MANAGE',
      title: 'Smart CRM',
      description: 'Easily manage customer data and create hyper-personalized segments for campaigns.',
      icon: <Users size={28} color="var(--accent-teal)" />,
      bgColor: 'rgba(20, 184, 166, 0.1)',
    },
    {
      pillar: 'MANAGE',
      title: 'Advanced Analytics',
      description: 'Uncover trends and actionable insights across multiple store locations in one dashboard.',
      icon: <BarChart3 size={28} color="#f97316" />,
      bgColor: 'rgba(249, 115, 22, 0.1)',
    },
    {
      pillar: 'ENGAGE & RETAIN',
      title: 'Customer Surveys',
      description: 'Collect direct customer feedback and ratings embedded within the digital receipt.',
      icon: <MessageCircle size={28} color="#ec4899" />,
      bgColor: 'rgba(236, 72, 153, 0.1)',
    }
  ];

  return (
    <section id="features" className="container py-24" style={{ padding: '6rem 24px' }}>
      <div className="text-center mb-16" style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h2 className="text-4xl font-extrabold mb-4" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          Power-packed for <span className="gradient-text">business growth</span>
        </h2>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '42rem', margin: '0 auto' }}>
          A 360° consumer engagement and lifecycle automation platform designed specifically to drive retail sales.
        </p>
      </div>

      <div className="grid md-grid-cols-2 lg-grid-cols-3 gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {features.map((feature, idx) => (
          <div 
            key={idx} 
            className="glass-panel p-8 flex-col gap-4 transition-all"
            style={{ 
              padding: '2rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ background: feature.bgColor, padding: '1rem', borderRadius: '0.75rem' }}>
                {feature.icon}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', background: 'var(--bg-color)', padding: '0.25rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--border-color)' }}>
                {feature.pillar}
              </span>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>
                {feature.title}
              </h3>
              <p className="text-muted" style={{ color: 'var(--text-muted)' }}>
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
