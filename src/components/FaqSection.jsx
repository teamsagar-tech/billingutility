import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Is RetailNode an ERP software?",
      answer: "RetailNode V2 offers a complete ERP solution, while this Billing Platform acts as an ultra-fast customer engagement utility that integrates easily with RetailNode ERP or any third-party POS/invoicing software, enabling you to deliver digital bills, loyalty rewards, and CRM offerings on WhatsApp."
    },
    {
      question: "Can we send invoices to our customers over WhatsApp?",
      answer: "Yes, our core feature allows you to instantly send digital bills (invoices) directly to your customers' WhatsApp right at the time of checkout, ensuring they never lose a receipt again."
    },
    {
      question: "I do not have an existing loyalty program. Do I have to change my software to get this feature?",
      answer: "Not at all. RetailNode handles the entire loyalty program natively. You can issue points, send reminders, and allow customers to redeem rewards via OTP without needing to change your existing POS system."
    },
    {
      question: "Is there a free trial for me to understand if RetailNode is a good fit?",
      answer: "Yes! We offer a free trial with no commitment. You can start sending digital bills and exploring the Smart CRM immediately to see the impact on your retail business."
    }
  ];

  return (
    <section className="container py-24" style={{ padding: '6rem 24px' }}>
      <div className="text-center mb-16">
        <h2 className="text-4xl font-extrabold mb-4" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          Frequently Asked <span className="gradient-text">Questions</span>
        </h2>
        <p className="text-xl text-muted max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Got questions? We've got answers to help you get started.
        </p>
      </div>

      <div className="max-w-3xl mx-auto flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '768px', margin: '0 auto' }}>
        {faqs.map((faq, idx) => (
          <div 
            key={idx} 
            className="glass-panel" 
            style={{ 
              borderRadius: '0.75rem', 
              overflow: 'hidden',
              border: openIndex === idx ? '2px solid var(--primary-light)' : '1px solid var(--border-color)',
              transition: 'all 0.3s ease'
            }}
          >
            <button 
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              style={{ 
                width: '100%', 
                padding: '1.5rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                textAlign: 'left',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--primary-dark)',
                background: openIndex === idx ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
              }}
            >
              {faq.question}
              <ChevronDown 
                size={20} 
                color="var(--text-muted)" 
                style={{ 
                  transform: openIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }} 
              />
            </button>
            
            <div 
              style={{ 
                maxHeight: openIndex === idx ? '200px' : '0', 
                overflow: 'hidden', 
                transition: 'max-height 0.3s ease-in-out',
                background: 'rgba(255,255,255,0.5)'
              }}
            >
              <p style={{ padding: '0 1.5rem 1.5rem 1.5rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FaqSection;
