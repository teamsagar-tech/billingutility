import React from 'react';
import { ArrowRight, MessageCircleCode, CheckCircle2, ReceiptText } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="container flex items-center pt-32 pb-16 min-h-[80vh]" style={{ paddingTop: '10rem', paddingBottom: '4rem', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="grid md-grid-cols-2 gap-8 items-center" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', width: '100%' }}>
        
        {/* Left Content */}
        <div className="flex-col gap-4 animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="flex items-center gap-2 font-semibold text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent-teal)', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
              <MessageCircleCode size={16} /> Powered by WhatsApp
            </span>
            <span>Built for Retailers</span>
          </div>
          
          <h1 className="text-5xl font-extrabold" style={{ fontSize: '3.5rem', lineHeight: '1.1', fontWeight: 800 }}>
            Increase sales using <br/>
            <span className="gradient-text">WhatsApp</span> for Retail
          </h1>
          
          <p className="text-lg text-muted" style={{ fontSize: '1.125rem', color: 'var(--text-muted)', maxWidth: '500px', lineHeight: 1.6 }}>
            Leading customer engagement and marketing automation platform for retailers and emerging brands. Turn your digital bills into powerful marketing channels.
          </p>
          
          <div className="flex gap-4 mt-4" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn-primary flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Start your free trial <ArrowRight size={18} />
            </button>
            <button className="btn-secondary">
              Calculate ROI
            </button>
          </div>
          
          <div className="flex items-center gap-4 mt-6 text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', fontSize: '0.875rem' }}>
            <span className="flex items-center gap-1" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={16} color="var(--accent-teal)" /> No credit card required
            </span>
            <span className="flex items-center gap-1" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={16} color="var(--accent-teal)" /> Easy integration
            </span>
          </div>
        </div>

        {/* Right Graphic */}
        <div className="relative animate-float" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div className="glass-panel p-6 animate-pulse-glow" style={{ padding: '1.5rem', position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px' }}>
            {/* Mockup of a WhatsApp Bill */}
            <div style={{ background: '#ece5dd', borderRadius: '0.5rem', padding: '1rem', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
              {/* Header */}
              <div style={{ background: '#075e54', color: 'white', padding: '1rem', margin: '-1rem -1rem 1rem -1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ReceiptText size={24} color="#075e54" />
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>The Fashion Store</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Retailer</div>
                </div>
              </div>
              
              {/* Message Bubble */}
              <div style={{ background: '#dcf8c6', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', position: 'relative' }}>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Hi John, thanks for shopping with us! 🛍️</p>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Your digital bill for today's purchase of ₹2,450 is ready.</p>
                
                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '0.25rem', textAlign: 'center', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <span style={{ color: '#0ea5e9', fontWeight: 600, fontSize: '0.875rem' }}>View Digital Bill & Points</span>
                </div>
              </div>

              {/* Reward Bubble */}
              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '0.5rem', position: 'relative', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-purple)' }}>🎁 You earned 120 points!</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Leave a Google Review to get 50 bonus points.</p>
              </div>

            </div>
          </div>
          
          {/* Decorative floating elements */}
          <div className="glass-panel" style={{ position: 'absolute', bottom: '-20px', left: '-20px', padding: '1rem', zIndex: 20, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'var(--accent-teal)', color: 'white', padding: '0.5rem', borderRadius: '50%' }}>
              <MessageCircleCode size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>+15% CTR</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Marketing engagement</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
