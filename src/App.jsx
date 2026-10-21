import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Core Target Pages
import LogoSplash from './pages/LogoSplash';
import MerchantLogin from './pages/MerchantLogin';
import MerchantSignUp from './pages/MerchantSignUp';
import ForgotPassword from './pages/ForgotPassword';
import SuperAdminLogin from './pages/SuperAdminLogin';
import CustomerBillsLookup from './pages/CustomerBillsLookup';
import BillReceipt from './pages/BillReceipt';
import SaaSAdminPanel from './pages/SaaSAdminPanel';

// Merchant Dashboard Modular Layout & Subpages
import MerchantLayout from './layouts/MerchantLayout';
import DashboardHome from './pages/merchant/DashboardHome';
import StoreComparison from './pages/merchant/StoreComparison';
import RoiExplorer from './pages/merchant/RoiExplorer';
import CampaignsHub from './pages/merchant/CampaignsHub';
import InvoicesPage from './pages/merchant/InvoicesPage';
import CustomersPage from './pages/merchant/CustomersPage';
import CustomerProfiles from './pages/merchant/CustomerProfiles';
import CustomerJourney from './pages/merchant/CustomerJourney';
import OptOutCustomers from './pages/merchant/OptOutCustomers';
import CustomerSegmentation from './pages/merchant/CustomerSegmentation';
import LoyaltyDashboard from './pages/merchant/LoyaltyDashboard';
import CouponDashboard from './pages/merchant/CouponDashboard';
import RedeemReward from './pages/merchant/RedeemReward';
import CustomerFeedback from './pages/merchant/CustomerFeedback';
import GreetingCards from './pages/merchant/GreetingCards';
import DownloadCenter from './pages/merchant/DownloadCenter';
import StoreSettings from './pages/merchant/StoreSettings';
import WhatsAppSettings from './pages/merchant/WhatsAppSettings';
import ProductsPage from './pages/merchant/ProductsPage';
import TemplateCreationPage from './pages/merchant/TemplateCreationPage';

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

import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import RouteTracker from './components/RouteTracker';

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

export default function App() {
  return (
    <BrowserRouter>
      <RouteTracker />
      <Routes>
        {/* Target Route 1: bill.retailnode.in root shows JUST RetailNode logo and nothing else */}
        <Route path="/" element={<LogoSplash />} />

        {/* 1. Retail Store / Merchant Login & Self-Serve Sign Up */}
        <Route path="/login" element={<MerchantLogin />} />
        <Route path="/merchant/login" element={<MerchantLogin />} />
        <Route path="/signup" element={<MerchantSignUp />} />
        <Route path="/register" element={<MerchantSignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ForgotPassword />} />

        {/* 2. SaaS SuperAdmin Platform Login (Isolated security gate) */}
        <Route path="/saas-admin/login" element={<SuperAdminLogin />} />
        <Route path="/platform-admin" element={<SuperAdminLogin />} />

        {/* 3. Customer Digital Bills & Loyalty Portal (Strict OTP-Only Login) */}
        <Route path="/my-bills" element={<CustomerBillsLookup />} />
        <Route path="/customer/login" element={<CustomerBillsLookup />} />
        <Route path="/i/lookup" element={<CustomerBillsLookup />} />

        {/* Merchant & Store Management Portal - Dedicated Subpages */}
        <Route path="/dashboard" element={<MerchantLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="home" element={<DashboardHome />} />
          <Route path="store-comparison" element={<StoreComparison />} />
          <Route path="roi-explorer" element={<RoiExplorer />} />
          <Route path="campaigns" element={<CampaignsHub />} />
          <Route path="campaigns-hub" element={<CampaignsHub />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="segmentation/sku" element={<ProductsPage />} />
          <Route path="sku" element={<Navigate to="/dashboard/products" replace />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="profiles" element={<CustomerProfiles />} />
          <Route path="profiles/customers" element={<CustomersPage />} />
          <Route path="profiles/create" element={<CustomerProfiles />} />
          <Route path="customer-journey" element={<CustomerJourney />} />
          <Route path="customer-journey/:phone" element={<CustomerJourney />} />
          <Route path="optout-customers" element={<OptOutCustomers />} />
          <Route path="segmentation" element={<CustomerSegmentation />} />
          <Route path="loyalty" element={<LoyaltyDashboard />} />
          <Route path="coupons" element={<CouponDashboard />} />
          <Route path="redeem" element={<RedeemReward />} />
          <Route path="feedback" element={<CustomerFeedback />} />
          <Route path="greeting-cards" element={<GreetingCards />} />
          <Route path="downloads" element={<DownloadCenter />} />
          <Route path="settings" element={<StoreSettings />} />
          <Route path="whatsapp" element={<WhatsAppSettings />} />
          <Route path="templates" element={<TemplateCreationPage />} />
          <Route path="whatsapp/templates" element={<TemplateCreationPage />} />
          <Route path="template-builder" element={<TemplateCreationPage />} />
          <Route path="email" element={<WhatsAppSettings defaultTab="email" />} />
          <Route path="whatsapp-logs" element={<WhatsAppSettings defaultTab="logs" />} />
        </Route>

        {/* Convenient Top-Level Aliases Redirecting into /dashboard/... */}
        <Route path="/invoices" element={<Navigate to="/dashboard/invoices" replace />} />
        <Route path="/products" element={<Navigate to="/dashboard/products" replace />} />
        <Route path="/templates" element={<Navigate to="/dashboard/templates" replace />} />
        <Route path="/whatsapp/templates" element={<Navigate to="/dashboard/templates" replace />} />
        <Route path="/segmentation/sku" element={<Navigate to="/dashboard/segmentation/sku" replace />} />
        <Route path="/customers" element={<Navigate to="/dashboard/customers" replace />} />
        <Route path="/profiles" element={<Navigate to="/dashboard/profiles" replace />} />
        <Route path="/profiles/customers" element={<Navigate to="/dashboard/profiles/customers" replace />} />
        <Route path="/profiles/create" element={<Navigate to="/dashboard/profiles/create" replace />} />
        <Route path="/customer-journey" element={<Navigate to="/dashboard/customer-journey" replace />} />
        <Route path="/customer-journey/:phone" element={<Navigate to="/dashboard/customer-journey/:phone" replace />} />
        <Route path="/campaigns" element={<Navigate to="/dashboard/campaigns" replace />} />
        <Route path="/loyalty" element={<Navigate to="/dashboard/loyalty" replace />} />
        <Route path="/coupons" element={<Navigate to="/dashboard/coupons" replace />} />
        <Route path="/redeem" element={<Navigate to="/dashboard/redeem" replace />} />
        <Route path="/feedback" element={<Navigate to="/dashboard/feedback" replace />} />
        <Route path="/store-comparison" element={<Navigate to="/dashboard/store-comparison" replace />} />
        <Route path="/roi-explorer" element={<Navigate to="/dashboard/roi-explorer" replace />} />
        <Route path="/greeting-cards" element={<Navigate to="/dashboard/greeting-cards" replace />} />
        <Route path="/downloads" element={<Navigate to="/dashboard/downloads" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
        <Route path="/whatsapp" element={<Navigate to="/dashboard/whatsapp" replace />} />
        <Route path="/email" element={<Navigate to="/dashboard/email" replace />} />
        <Route path="/whatsapp-logs" element={<Navigate to="/dashboard/whatsapp-logs" replace />} />

        {/* SaaS SuperAdmin Platform Panel - Dedicated Separate Routes */}
        <Route path="/saas-admin" element={<Navigate to="/saas-admin/stores" replace />} />
        <Route path="/saas-admin/stores" element={<SaaSAdminPanel defaultTab="stores" />} />
        <Route path="/saas-admin/tenants" element={<Navigate to="/saas-admin/stores" replace />} />
        <Route path="/saas-admin/pricing" element={<SaaSAdminPanel defaultTab="pricing" />} />
        <Route path="/saas-admin/campaigns" element={<Navigate to="/saas-admin/pricing" replace />} />
        <Route path="/saas-admin/whatsapp-logs" element={<SaaSAdminPanel defaultTab="whatsapp_logs" />} />
        <Route path="/saas-admin/whatsapp" element={<Navigate to="/saas-admin/whatsapp-logs" replace />} />
        <Route path="/saas-admin/logs" element={<SaaSAdminPanel defaultTab="logs" />} />
        <Route path="/saas-admin/action-logs" element={<Navigate to="/saas-admin/logs" replace />} />
        <Route path="/saas-admin/gateways" element={<SaaSAdminPanel defaultTab="gateways" />} />
        <Route path="/saas-admin/:tab" element={<SaaSAdminPanel />} />

        {/* Target Route 3: bill.retailnode.in/t/ or /i/ random key will show digital bill */}
        <Route path="/i/:slug" element={<BillReceipt />} />
        <Route path="/t/:slug" element={<BillReceipt />} />

        {/* Legal & Compliance Routes */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsConditions />} />
        <Route path="/terms" element={<TermsConditions />} />

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
