import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ReceiptText } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'glass-panel shadow-sm py-3' : 'bg-transparent py-5'}`} style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, transition: 'all 0.3s', border: 'none' }}>
      <div className="container flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
          <div style={{ background: 'var(--primary-blue)', padding: '0.5rem', borderRadius: '0.5rem', color: 'white' }}>
            <ReceiptText size={24} />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-primary">RetailBill</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md-flex gap-8 items-center" style={{ display: 'flex', gap: '2rem' }}>
          <Link to="/" className="font-semibold text-muted hover-text-primary transition-colors" style={{ transition: 'color 0.2s', fontWeight: 600 }}>Home</Link>
          <Link to="/features" className="font-semibold text-muted hover-text-primary transition-colors" style={{ transition: 'color 0.2s', fontWeight: 600 }}>Features</Link>
          <Link to="/solutions" className="font-semibold text-muted hover-text-primary transition-colors" style={{ transition: 'color 0.2s', fontWeight: 600 }}>Solutions</Link>
          <Link to="/pricing" className="font-semibold text-muted hover-text-primary transition-colors" style={{ transition: 'color 0.2s', fontWeight: 600 }}>Pricing</Link>
          
          <div className="flex gap-4">
            <button className="font-semibold text-primary">Log in</button>
            <button className="btn-primary">Request Demo</button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
