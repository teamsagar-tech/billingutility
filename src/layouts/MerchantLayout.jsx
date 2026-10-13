import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BarChart3,
  TrendingUp,
  Megaphone,
  Receipt,
  Users,
  UserCheck,
  Compass,
  UserX,
  Layers,
  Star,
  Tag,
  Gift,
  Image,
  Award,
  Smartphone,
  Sliders,
  Download,
  LogOut,
  RefreshCw,
  Plus,
  ArrowUpRight,
  CheckCircle,
  FileText,
  X,
  ChevronRight,
  Send
} from 'lucide-react';

export default function MerchantLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Quick POS Bill Generator Modal
  const [showQuickBill, setShowQuickBill] = useState(false);
  const [quickBillForm, setQuickBillForm] = useState({
    customerPhone: '',
    customerName: '',
    billAmount: '',
    invoiceNumber: '',
    itemName: 'Retail Purchase',
    sendWhatsApp: true
  });
  const [quickBillLoading, setQuickBillLoading] = useState(false);
  const [quickBillSuccess, setQuickBillSuccess] = useState(null);

  const notifyToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('storeName');
    navigate('/login');
  };

  const loadData = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Profile
      const profRes = await fetch('/api/v1/auth/profile', { headers });
      const profData = await profRes.json();
      if (profData.success && profData.data) {
        setProfile(profData.data);
      } else if (profRes.status === 401 || profRes.status === 403) {
        handleLogout();
        return;
      }

      // 2. Analytics
      const anaRes = await fetch('/api/v1/auth/analytics', { headers });
      const anaData = await anaRes.json();
      if (anaData.success && anaData.data) {
        setAnalytics(anaData.data);
      }
    } catch (err) {
      console.error('Failed to load merchant data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Handle Quick Bill submission
  const handleCreateQuickBill = async (e) => {
    e.preventDefault();
    if (!quickBillForm.customerPhone || !quickBillForm.billAmount) {
      alert('Please enter both customer phone and bill amount.');
      return;
    }

    setQuickBillLoading(true);
    setQuickBillSuccess(null);

    const generatedInv = quickBillForm.invoiceNumber.trim() || `BILL-${Date.now().toString().slice(-6)}`;
    const billAmt = parseFloat(quickBillForm.billAmount) || 0;

    const payload = {
      invoice_number: generatedInv,
      customer_phone: quickBillForm.customerPhone.trim(),
      customer_name: quickBillForm.customerName.trim() || 'Valued Customer',
      send_whatsapp: quickBillForm.sendWhatsApp,
      receipt_data: {
        StoreName: profile?.store_name || 'Retail Store',
        InvoiceNumber: generatedInv,
        Date: new Date().toISOString(),
        GrandTotal: billAmt,
        Items: [
          {
            name: quickBillForm.itemName || 'Retail Purchase',
            qty: 1,
            price: billAmt,
            total: billAmt
          }
        ]
      }
    };

    try {
      const res = await fetch('/api/v1/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setQuickBillSuccess({
          invoiceNumber: generatedInv,
          shortUrl: data.short_url,
          customerPhone: quickBillForm.customerPhone
        });
        notifyToast(`Digital Bill #${generatedInv} generated & dispatched!`);
        loadData();
      } else {
        alert(data.error || 'Failed to generate digital invoice.');
      }
    } catch (err) {
      alert('Network error while generating bill. Please check your connection.');
    } finally {
      setQuickBillLoading(false);
    }
  };

  const navGroups = [
    {
      group: 'PRIMARY',
      items: [
        { to: '/dashboard', end: true, label: 'Home', icon: Home },
        { to: '/dashboard/store-comparison', label: 'Store Summary', icon: BarChart3 },
        { to: '/dashboard/roi-explorer', label: 'ROI Explorer', icon: TrendingUp },
        { to: '/dashboard/campaigns', label: 'Campaigns Hub', icon: Megaphone, badge: 'Auto' },
        { to: '/dashboard/invoices', label: 'Invoices (POS)', icon: Receipt },
        { to: '/dashboard/downloads', label: 'Download Center', icon: Download }
      ]
    },
    {
      group: 'CUSTOMERS & CRM',
      items: [
        { to: '/dashboard/customers', label: 'Customers', icon: Users },
        { to: '/dashboard/profiles', label: 'Demographics', icon: UserCheck },
        { to: '/dashboard/customer-journey', label: 'Customer Journey', icon: Compass },
        { to: '/dashboard/optout-customers', label: 'Opt-out (DND)', icon: UserX },
        { to: '/dashboard/segmentation', label: 'Segmentation', icon: Layers }
      ]
    },
    {
      group: 'REWARDS & LOYALTY',
      items: [
        { to: '/dashboard/loyalty', label: 'Loyalty Rules', icon: Award },
        { to: '/dashboard/coupons', label: 'Coupon Dashboard', icon: Tag },
        { to: '/dashboard/redeem', label: 'Redeem Cashier', icon: Gift },
        { to: '/dashboard/feedback', label: 'Reviews & Feedback', icon: Star }
      ]
    },
    {
      group: 'CHANNELS & CONFIG',
      items: [
        { to: '/dashboard/greeting-cards', label: 'Greeting Cards', icon: Image },
        { to: '/dashboard/whatsapp', label: 'WhatsApp Gateway', icon: Smartphone },
        { to: '/dashboard/settings', label: 'Store Branding & API', icon: Sliders }
      ]
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* SIDEBAR NAVIGATION */}
      <aside style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        overflowY: 'auto'
      }}>
        {/* Store Brand Header - ZERO hardcoded store name */}
        <div style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {profile?.logo_url ? (
            <img
              src={profile.logo_url}
              alt=""
              style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'contain', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}
            />
          ) : (
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '1rem',
              boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.2)'
            }}>
              {loading ? (
                <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                (profile?.store_name?.slice(0, 2)?.toUpperCase() || 'RN')
              )}
            </div>
          )}

          <div style={{ overflow: 'hidden', flex: 1 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ height: '16px', width: '110px', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                <div style={{ height: '12px', width: '70px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
              </div>
            ) : (
              <>
                <h2 style={{
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  margin: 0,
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {profile?.store_name || 'Retail Store'}
                </h2>
                <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                  {profile?.id ? `Store #${profile.id}` : 'Store Account'} &bull; <span style={{ color: '#16a34a', fontWeight: '600' }}>Active</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* NAVIGATION GROUPS */}
        <nav style={{ padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
          {navGroups.map((grp) => (
            <div key={grp.group}>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: '800',
                color: '#94a3b8',
                letterSpacing: '0.06em',
                padding: '0 0.75rem 0.4rem',
                textTransform: 'uppercase'
              }}>
                {grp.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.825rem',
                        fontWeight: isActive ? '700' : '500',
                        color: isActive ? '#0284c7' : '#4b5563',
                        backgroundColor: isActive ? '#e0f2fe' : 'transparent',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease'
                      })}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon style={{ width: '16px', height: '16px' }} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span style={{
                          fontSize: '0.625rem',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: '#dbeafe',
                          color: '#1d4ed8'
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* SIDEBAR FOOTER & LOGOUT */}
        <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #fee2e2',
              backgroundColor: '#fff1f2',
              color: '#e11d48',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut style={{ width: '15px', height: '15px' }} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Toast Notification */}
        {toastMessage && (
          <div style={{
            backgroundColor: '#10b981',
            color: '#ffffff',
            padding: '10px 1.5rem',
            fontSize: '0.85rem',
            fontWeight: '700',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 100
          }}>
            <CheckCircle style={{ width: '16px', height: '16px' }} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* TOP HEADER */}
        <header style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* Left info & status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#166534' }}>POS &amp; WhatsApp Online</span>
            </div>

            <a
              href="https://bill.retailnode.in/t/OHVrHzYL"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.75rem',
                color: '#0284c7',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
                padding: '4px 10px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #bae6fd'
              }}
            >
              <span>View Sample Digital Receipt</span>
              <ArrowUpRight style={{ width: '13px', height: '13px' }} />
            </a>
          </div>

          {/* Right Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowQuickBill(true)}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.825rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
              }}
            >
              <Plus style={{ width: '15px', height: '15px' }} />
              <span>Quick POS Bill</span>
            </button>

            <button
              onClick={loadData}
              title="Refresh Data"
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCw style={{ width: '15px', height: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </header>

        {/* SUBPAGE CONTENT (Rendered via React Router Outlet) */}
        <main style={{ flex: 1, padding: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
          <Outlet context={{ profile, setProfile, analytics, setAnalytics, token, refreshData: loadData, notifyToast }} />
        </main>
      </div>

      {/* QUICK DIGITAL BILL MODAL */}
      {showQuickBill && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt style={{ width: '18px', height: '18px', color: '#0284c7' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#111827' }}>
                  Generate Instant POS Bill
                </h3>
              </div>
              <button
                onClick={() => { setShowQuickBill(false); setQuickBillSuccess(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {quickBillSuccess ? (
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <CheckCircle style={{ width: '32px', height: '32px' }} />
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#111827', margin: '0 0 6px' }}>
                  Bill Sent Successfully!
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem' }}>
                  Digital invoice <b>#{quickBillSuccess.invoiceNumber}</b> generated and dispatched to <b>+91 {quickBillSuccess.customerPhone}</b>.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <a
                    href={quickBillSuccess.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      fontSize: '0.825rem',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                  >
                    View Receipt
                  </a>
                  <button
                    onClick={() => {
                      setQuickBillSuccess(null);
                      setQuickBillForm({ customerPhone: '', customerName: '', billAmount: '', invoiceNumber: '', itemName: 'Retail Purchase', sendWhatsApp: true });
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#374151',
                      fontSize: '0.825rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    New Bill
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateQuickBill} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Customer Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={quickBillForm.customerPhone}
                    onChange={(e) => setQuickBillForm({ ...quickBillForm, customerPhone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                      Customer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Patil"
                      value={quickBillForm.customerName}
                      onChange={(e) => setQuickBillForm({ ...quickBillForm, customerName: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                      Bill Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1850"
                      value={quickBillForm.billAmount}
                      onChange={(e) => setQuickBillForm({ ...quickBillForm, billAmount: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                      Invoice / Bill Number
                    </label>
                    <input
                      type="text"
                      placeholder="Auto if blank"
                      value={quickBillForm.invoiceNumber}
                      onChange={(e) => setQuickBillForm({ ...quickBillForm, invoiceNumber: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                      Item Summary
                    </label>
                    <input
                      type="text"
                      placeholder="Retail Items"
                      value={quickBillForm.itemName}
                      onChange={(e) => setQuickBillForm({ ...quickBillForm, itemName: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: '#374151', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={quickBillForm.sendWhatsApp}
                    onChange={(e) => setQuickBillForm({ ...quickBillForm, sendWhatsApp: e.target.checked })}
                  />
                  <span>Dispatch instant WhatsApp billing receipt link</span>
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowQuickBill(false)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#4b5563', fontSize: '0.825rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={quickBillLoading}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      fontSize: '0.825rem',
                      fontWeight: '700',
                      cursor: quickBillLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {quickBillLoading ? 'Generating...' : 'Issue & Dispatch'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
