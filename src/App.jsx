import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Core Target Pages
import LogoSplash from './pages/LogoSplash';
import UnifiedLogin from './pages/UnifiedLogin';
import BillReceipt from './pages/BillReceipt';

// Marketing & Portal Pages
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Features from './pages/Features';
import Solutions from './pages/Solutions';
import Pricing from './pages/Pricing';
import DigitalBills from './pages/DigitalBills';
import SmartCRM from './pages/SmartCRM';
import MarketingAutomation from './pages/MarketingAutomation';
import LoyaltyPrograms from './pages/LoyaltyPrograms';
import RetailStores from './pages/RetailStores';
import RetailBrands from './pages/RetailBrands';
import ApparelFootwear from './pages/ApparelFootwear';
import Electronics from './pages/Electronics';

function MarketingLayout({ children }) {
  return (
    <div className="app-wrapper">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Target Route 1: bill.retailnode.in root shows JUST RetailNode logo and nothing else */}
        <Route path="/" element={<LogoSplash />} />

        {/* Target Route 2: bill.retailnode.in/login opens customer & saas admin login */}
        <Route path="/login" element={<UnifiedLogin />} />

        {/* Target Route 3: bill.retailnode.in/i/ random key will show pdf and other details of bills */}
        <Route path="/i/:slug" element={<BillReceipt />} />
        <Route path="/t/:slug" element={<BillReceipt />} />

        {/* Marketing and product pages */}
        <Route path="/features" element={<MarketingLayout><Features /></MarketingLayout>} />
        <Route path="/solutions" element={<MarketingLayout><Solutions /></MarketingLayout>} />
        <Route path="/pricing" element={<MarketingLayout><Pricing /></MarketingLayout>} />
        <Route path="/products/digital-bills" element={<MarketingLayout><DigitalBills /></MarketingLayout>} />
        <Route path="/products/smart-crm" element={<MarketingLayout><SmartCRM /></MarketingLayout>} />
        <Route path="/products/marketing-automation" element={<MarketingLayout><MarketingAutomation /></MarketingLayout>} />
        <Route path="/products/loyalty-programs" element={<MarketingLayout><LoyaltyPrograms /></MarketingLayout>} />
        <Route path="/solutions/retail-stores" element={<MarketingLayout><RetailStores /></MarketingLayout>} />
        <Route path="/solutions/retail-brands" element={<MarketingLayout><RetailBrands /></MarketingLayout>} />
        <Route path="/solutions/apparel-footwear" element={<MarketingLayout><ApparelFootwear /></MarketingLayout>} />
        <Route path="/solutions/electronics" element={<MarketingLayout><Electronics /></MarketingLayout>} />

        {/* Fallback to Logo Splash */}
        <Route path="*" element={<LogoSplash />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
