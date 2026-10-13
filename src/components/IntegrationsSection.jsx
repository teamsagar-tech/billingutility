import React from 'react';
import { Blocks, ArrowRight } from 'lucide-react';

const IntegrationsSection = () => {
  return (
    <section className="container py-24" style={{ padding: '6rem 24px' }}>
      <div className="glass-panel overflow-hidden relative" style={{ borderRadius: '1.5rem', background: 'var(--primary-dark)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        
        {/* Background Decorative Elements */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'var(--primary-light)', filter: 'blur(80px)', opacity: 0.3, borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '300px', height: '300px', background: 'var(--accent-teal)', filter: 'blur(80px)', opacity: 0.2, borderRadius: '50%' }}></div>

        <div className="grid md-grid-cols-2 gap-8 p-12 items-center" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', padding: '4rem', gap: '3rem', position: 'relative', zIndex: 10 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="text-4xl font-extrabold" style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2 }}>
              Seamlessly integrates with your existing tools
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '1.125rem', lineHeight: 1.6 }}>
              RetailBill is not an ERP. It's a powerful integration layer that connects with over 100+ POS, invoicing, and ERP systems to supercharge your customer engagement.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(20, 184, 166, 0.2)', padding: '0.25rem', borderRadius: '50%' }}><Blocks size={16} color="var(--accent-teal-light)" /></div>
                <span style={{ color: '#f8fafc' }}>Easy and quick setup</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(20, 184, 166, 0.2)', padding: '0.25rem', borderRadius: '50%' }}><Blocks size={16} color="var(--accent-teal-light)" /></div>
                <span style={{ color: '#f8fafc' }}>No additional setup costs</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(20, 184, 166, 0.2)', padding: '0.25rem', borderRadius: '50%' }}><Blocks size={16} color="var(--accent-teal-light)" /></div>
                <span style={{ color: '#f8fafc' }}>Real-time synchronization</span>
              </li>
            </ul>
            <div style={{ marginTop: '1rem' }}>
              <button className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'white', color: 'var(--primary-dark)' }}>
                View All Integrations <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Abstract Integration Graphic */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px', aspectRatio: '1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
               <div style={{ position: 'absolute', width: '100%', height: '100%', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '50%', animation: 'spin 20s linear infinite' }}></div>
               <div style={{ position: 'absolute', width: '70%', height: '70%', border: '1px dashed rgba(255,255,255,0.3)', borderRadius: '50%', animation: 'spin 15s linear infinite reverse' }}></div>
               <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)', zIndex: 2 }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" style={{ width: '45px' }} />
               </div>
               
               {/* Orbital Nodes */}
               <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                 <Blocks size={20} color="var(--accent-teal-light)" />
               </div>
               <div style={{ position: 'absolute', bottom: '20%', right: '5%', width: '50px', height: '50px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                 <span style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#fff' }}>POS</span>
               </div>
               <div style={{ position: 'absolute', top: '40%', right: '-5%', width: '45px', height: '45px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                 <span style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#fff' }}>ERP</span>
               </div>
            </div>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </section>
  );
};

export default IntegrationsSection;
