import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Image, MessageSquare, Download, Share2, Sparkles } from 'lucide-react';

export default function GreetingCards() {
  const { profile, notifyToast } = useOutletContext();

  const cards = [
    {
      id: 1,
      title: 'Shubh Deepawali & Lakshmi Pujan',
      festival: 'Diwali 2026',
      img: '/offers/festive_durga_puja.png',
      desc: 'Warm Diwali greetings with exclusive festive discounts for your loyal patrons.'
    },
    {
      id: 2,
      title: 'Grand Festive Wedding Paithani Sale',
      festival: 'Wedding Season',
      img: '/offers/festive_wedding_sale.png',
      desc: 'Designer bridal paithanis, pure silk sarees & festive matching ensembles.'
    },
    {
      id: 3,
      title: 'Happy Dussehra & Navratri Blessings',
      festival: 'Dussehra',
      img: '/offers/durga_puja_offer.png',
      desc: 'Celebrate victory and prosperity with festive greetings delivered straight to WhatsApp.'
    }
  ];

  const handleShare = (c) => {
    const storeName = profile?.store_name || 'Retail Store';
    const text = encodeURIComponent(`🪔 Festive Greetings from ${storeName}!\n\nWishing you and your family abundant happiness, prosperity and good health this festive season!\n\nVisit us to explore our latest festive collection: https://bill.retailnode.in/t/OHVrHzYL`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
            Festive &amp; Greeting Cards Catalog
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
            Pre-curated festival greeting banners attached to digital billing receipts for seasonal celebrations
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {cards.map((c) => (
          <div
            key={c.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ height: '180px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
              <img
                src={c.img}
                alt={c.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.style.backgroundColor = '#fef3c7';
                }}
              />
            </div>

            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.7rem', fontWeight: '800' }}>
                  {c.festival}
                </span>
                <h3 style={{ margin: '8px 0 6px', fontSize: '1.05rem', fontWeight: '800', color: '#111827' }}>
                  {c.title}
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45 }}>
                  {c.desc}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleShare(c)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#25d366',
                    color: '#ffffff',
                    fontSize: '0.825rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <MessageSquare style={{ width: '15px', height: '15px' }} />
                  <span>Send on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
