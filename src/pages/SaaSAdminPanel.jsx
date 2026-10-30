import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Store, 
  Receipt, 
  Smartphone, 
  Users, 
  Star, 
  Activity, 
  Plus, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  LogOut, 
  Settings, 
  CreditCard, 
  Eye, 
  Edit3, 
  Copy, 
  Server, 
  X, 
  Save,
  Tag,
  Trash2,
  Sparkles,
  Clock,
  Mail,
  MessageSquare,
  Send,
  ExternalLink,
  Printer,
  QrCode,
  Key,
  FileText,
  Globe,
  MapPin,
  Phone,
  Filter
} from 'lucide-react';
import { SortableTh, TablePagination, TableSearchInput } from '../components/DataTable';
import { useDataTable } from '../hooks/useDataTable';
import RetailNodeLogo from '../components/RetailNodeLogo';

export default function SaaSAdminPanel({ defaultTab = 'stores' }) {
  const navigate = useNavigate();
  const { tab: routeTab } = useParams();

  const TAB_MAP = {
    'stores': 'stores',
    'tenants': 'stores',
    'pricing': 'pricing',
    'campaigns': 'pricing',
    'gmb': 'gmb',
    'locations': 'gmb',
    'google-review': 'gmb',
    'users': 'users',
    'user-management': 'users',
    'whatsapp-logs': 'whatsapp_logs',
    'whatsapp': 'whatsapp_logs',
    'whatsapp_logs': 'whatsapp_logs',
    'logs': 'logs',
    'action-logs': 'logs',
    'gateways': 'gateways'
  };

  const activeTab = (routeTab && TAB_MAP[routeTab]) ? TAB_MAP[routeTab] : (defaultTab || 'stores');

  const handleTabChange = (tabId) => {
    const routeMap = {
      'stores': '/saas-admin/stores',
      'gmb': '/saas-admin/gmb',
      'users': '/saas-admin/users',
      'pricing': '/saas-admin/pricing',
      'whatsapp_logs': '/saas-admin/whatsapp-logs',
      'logs': '/saas-admin/logs',
      'gateways': '/saas-admin/gateways'
    };
    navigate(routeMap[tabId] || `/saas-admin/${tabId}`);
  };

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [pageViewLogs, setPageViewLogs] = useState([]);
  const [invoiceViewLogs, setInvoiceViewLogs] = useState([]);
  const [logsSubTab, setLogsSubTab] = useState('auth'); // 'auth' | 'page_views' | 'invoice_views' | 'actions'
  const [gateways, setGateways] = useState({});
  const [adminWhatsAppLogs, setAdminWhatsAppLogs] = useState([]);
  const [emailGateway, setEmailGateway] = useState({
    is_configured: false,
    resend_api_key: '',
    resend_from_email: 'billing@retailnode.in',
    resend_from_name: 'RetailNode Invoices',
    stats: { total_emails: 0, sent_count: 0, failed_count: 0 }
  });
  const [razorpayGateway, setRazorpayGateway] = useState({
    is_configured: false,
    key_id: '',
    key_secret: '',
    key_secret_masked: ''
  });
  const [savingRazorpay, setSavingRazorpay] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuotaModal, setShowQuotaModal] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(null);
  const [quotaAmount, setQuotaAmount] = useState('5000');
  const [toastMessage, setToastMessage] = useState('');

  // Plan form state
  const [planForm, setPlanForm] = useState({
    plan_tier: 'growth',
    plan_valid_until: '',
    is_active: 1
  });

  // New store form state (Default: 3-day trial)
  const [newStoreForm, setNewStoreForm] = useState({
    store_name: '',
    store_phone: '',
    store_email: '',
    admin_email: '',
    admin_password: '',
    plan_tier: 'trial',
    plan_valid_until: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    message_quota: 5000
  });

  // Pricing Campaigns state
  const [campaigns, setCampaigns] = useState([]);
  const [campaignCategoryFilter, setCampaignCategoryFilter] = useState('all'); // 'all' | 'gmb' | 'billing' | 'combo'
  const [showCampaignModal, setShowCampaignModal] = useState(null); // null, 'create', or campaign object
  const [campaignForm, setCampaignForm] = useState({
    campaign_name: 'Retail Launch Offer',
    category: 'billing', // 'billing' | 'gmb' | 'combo'
    plan_tier: 'growth',
    regular_price: 9000,
    campaign_price: 6000,
    trial_days: 3,
    badge_text: 'SAVE ₹3,000 TODAY (33% OFF)',
    headline: 'One Simple Price. All Features Included.',
    subheadline: 'Complete Digital Billing & Smart CRM Utility for Indian Retailers',
    is_active: 1,
    start_date: '',
    end_date: ''
  });

  // GMB & Review Hub Management state
  const [gmbLocations, setGmbLocations] = useState([]);
  const [platformUsers, setPlatformUsers] = useState([]);
  const [gmbReviews, setGmbReviews] = useState([]);
  const [gmbFeedbacks, setGmbFeedbacks] = useState([]);
  const [gmbSubTab, setGmbSubTab] = useState('locations'); // 'locations' | 'reviews' | 'feedbacks'
  const [reviewFilterRating, setReviewFilterRating] = useState('all');
  const [reviewFilterLocation, setReviewFilterLocation] = useState('all');

  // GMB Location Modal state
  const [showGmbModal, setShowGmbModal] = useState(null); // null, 'create', or location object
  const [savingGmb, setSavingGmb] = useState(false);
  const [gmbForm, setGmbForm] = useState({
    title: '',
    slug: '',
    tenant_id: '',
    place_id: '',
    google_review_url: '',
    phone: '',
    whatsapp_number: '',
    website_url: '',
    address: '',
    selected_theme: 'pearl-light',
    primary_category: 'Retail Store'
  });

  // User Management Modal state
  const [showUserModal, setShowUserModal] = useState(null); // null, 'create', or user object
  const [savingUser, setSavingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    phone: '',
    first_name: '',
    last_name: '',
    role: 'merchant_admin',
    tenant_id: ''
  });

  // Review Reply State
  const [activeReplyReview, setActiveReplyReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    if (!token || userRole !== 'superadmin') {
      navigate('/login');
      return;
    }
    loadPlatformData();
  }, [token, userRole, navigate]);

  const loadPlatformData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Analytics
      const anaRes = await fetch('/api/v1/admin/analytics', { headers });
      const anaData = await anaRes.json();
      if (anaData.success) {
        setAnalytics(anaData.data);
      } else if (anaRes.status === 401 || anaRes.status === 403) {
        navigate('/login');
        return;
      }

      // 2. Tenants
      const tenRes = await fetch('/api/v1/admin/tenants', { headers });
      const tenData = await tenRes.json();
      if (tenData.success) {
        setTenants(tenData.data || []);
      }

      // 3. Action Logs & Security Audit Streams
      const logsRes = await fetch('/api/v1/admin/action-logs', { headers });
      const logsData = await logsRes.json();
      if (logsData.success) {
        setActionLogs(logsData.data || []);
      }

      try {
        const auditRes = await fetch('/api/v1/telemetry/audit-logs?limit=200', { headers });
        const auditData = await auditRes.json();
        if (auditData.success) {
          setAuditLogs(auditData.data || []);
        }
      } catch (e) {}

      try {
        const pvRes = await fetch('/api/v1/telemetry/page-views?limit=200', { headers });
        const pvData = await pvRes.json();
        if (pvData.success) {
          setPageViewLogs(pvData.data || []);
        }
      } catch (e) {}

      try {
        const ivRes = await fetch('/api/v1/telemetry/invoice-views?limit=200', { headers });
        const ivData = await ivRes.json();
        if (ivData.success) {
          setInvoiceViewLogs(ivData.data || []);
        }
      } catch (e) {}

      // 4. Global Gateways
      const gwRes = await fetch('/api/v1/admin/gateways', { headers });
      const gwData = await gwRes.json();
      if (gwData.success) {
        setGateways(gwData.data || {});
      }

      // 5. Pricing Campaigns
      const campRes = await fetch('/api/v1/admin/pricing-campaigns', { headers });
      const campData = await campRes.json();
      if (campData.success) {
        setCampaigns(campData.data || []);
      }

      // 6. WhatsApp Message Logs
      try {
        const waRes = await fetch('/api/v1/admin/whatsapp-logs', { headers });
        const waData = await waRes.json();
        if (waData.success) {
          setAdminWhatsAppLogs(waData.data || []);
        }
      } catch (e) {}

      // 7. Global Resend Email Gateway
      try {
        const emailRes = await fetch('/api/v1/admin/email-gateway', { headers });
        const emailData = await emailRes.json();
        if (emailData.success && emailData.data) {
          setEmailGateway(emailData.data);
        }
      } catch (e) {}

      // 8. Global Razorpay Payment Gateway
      try {
        const rpRes = await fetch('/api/v1/admin/payments/gateway', { headers });
        const rpData = await rpRes.json();
        if (rpData.success && rpData.data) {
          setRazorpayGateway({
            is_configured: rpData.data.is_configured,
            key_id: rpData.data.key_id || '',
            key_secret: '',
            key_secret_masked: rpData.data.key_secret_masked || ''
          });
        }
      } catch (e) {}

      // 9. GMB Locations
      try {
        const gmbRes = await fetch('/api/v1/admin/gmb/locations', { headers });
        const gmbData = await gmbRes.json();
        if (gmbData.success) {
          setGmbLocations(gmbData.data || []);
        }
      } catch (e) {}

      // 10. Platform & GMB Users
      try {
        const userRes = await fetch('/api/v1/admin/users', { headers });
        const userData = await userRes.json();
        if (userData.success) {
          setPlatformUsers(userData.data || []);
        }
      } catch (e) {}

      // 11. GMB Reviews & Feedbacks
      try {
        const revRes = await fetch('/api/v1/admin/gmb/reviews', { headers });
        const revData = await revRes.json();
        if (revData.success) {
          setGmbReviews(revData.data || []);
        }
      } catch (e) {}

      try {
        const fbRes = await fetch('/api/v1/admin/gmb/feedbacks', { headers });
        const fbData = await fbRes.json();
        if (fbData.success) {
          setGmbFeedbacks(fbData.data || []);
        }
      } catch (e) {}
    } catch (err) {
      console.error('Failed to load SaaS admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/admin/tenants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStoreForm)
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`Store "${newStoreForm.store_name}" provisioned successfully!`);
        setShowCreateModal(false);
        setNewStoreForm({
          store_name: '',
          store_phone: '',
          store_email: '',
          admin_email: '',
          admin_password: '',
          plan_tier: 'pro',
          message_quota: 5000
        });
        setTimeout(() => setToastMessage(''), 4000);
        loadPlatformData();
      } else {
        alert(data.error || 'Failed to create tenant store.');
      }
    } catch (err) {
      alert('Network error provisioning store.');
    }
  };

  const handleTopupQuota = async (e) => {
    e.preventDefault();
    if (!showQuotaModal) return;
    try {
      const res = await fetch(`/api/v1/admin/tenants/${showQuotaModal.id}/quota`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: quotaAmount })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`Added ${quotaAmount} credits to ${showQuotaModal.store_name}`);
        setShowQuotaModal(null);
        setTimeout(() => setToastMessage(''), 4000);
        loadPlatformData();
      } else {
        alert(data.error || 'Failed to top up quota');
      }
    } catch (err) {
      alert('Network error topping up quota');
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!showPlanModal) return;
    try {
      const res = await fetch(`/api/v1/admin/tenants/${showPlanModal.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planForm)
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`Plan & validity for ${showPlanModal.store_name} updated successfully!`);
        setShowPlanModal(null);
        setTimeout(() => setToastMessage(''), 4000);
        loadPlatformData();
      } else {
        alert(data.error || 'Failed to update store plan');
      }
    } catch (err) {
      alert('Network error updating store plan');
    }
  };

  const handleExtendDays = (days) => {
    const baseDate = planForm.plan_valid_until && new Date(planForm.plan_valid_until) > new Date()
      ? new Date(planForm.plan_valid_until)
      : new Date();
    baseDate.setDate(baseDate.getDate() + days);
    setPlanForm({ ...planForm, plan_valid_until: baseDate.toISOString().split('T')[0] });
  };

  const handleToggleActive = async (tenant) => {
    try {
      const newStatus = tenant.is_active ? 0 : 1;
      const res = await fetch(`/api/v1/admin/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`Store "${tenant.store_name}" status updated`);
        setTimeout(() => setToastMessage(''), 3000);
        loadPlatformData();
      }
    } catch (err) {
      alert('Failed to update tenant status');
    }
  };

  const handleSaveGateways = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/admin/gateways', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ configs: gateways })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('Global Gateway configs updated successfully!');
        setTimeout(() => setToastMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to update gateways');
      }
    } catch (err) {
      alert('Network error updating gateways');
    }
  };

  const handleSaveEmailGateway = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/admin/email-gateway', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resend_api_key: emailGateway.resend_api_key,
          resend_from_email: emailGateway.resend_from_email,
          resend_from_name: emailGateway.resend_from_name
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('Global Resend Email settings saved successfully!');
        setTimeout(() => setToastMessage(''), 4000);
        loadPlatformData();
      } else {
        alert(data.error || 'Failed to save email gateway settings');
      }
    } catch (err) {
      alert('Error updating email gateway: ' + err.message);
    }
  };

  const handleTestEmailGateway = async (e) => {
    e.preventDefault();
    if (!testEmailAddress) return;
    setTestEmailSending(true);
    try {
      const res = await fetch('/api/v1/admin/email-gateway/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_email: testEmailAddress,
          api_key: emailGateway.resend_api_key?.includes('••••') ? undefined : emailGateway.resend_api_key,
          from_email: emailGateway.resend_from_email,
          from_name: emailGateway.resend_from_name
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`Test email successfully sent to ${testEmailAddress} via Resend!`);
        setTimeout(() => setToastMessage(''), 5000);
        setTestEmailAddress('');
        loadPlatformData();
      } else {
        alert(data.error || 'Test email failed. Please verify Resend API key.');
      }
    } catch (err) {
      alert('Network error testing email gateway: ' + err.message);
    } finally {
      setTestEmailSending(false);
    }
  };

  const handleSaveRazorpayGateway = async (e) => {
    e.preventDefault();
    setSavingRazorpay(true);
    try {
      const res = await fetch('/api/v1/admin/payments/gateway', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key_id: razorpayGateway.key_id,
          key_secret: razorpayGateway.key_secret || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('Razorpay Gateway credentials saved successfully!');
        setTimeout(() => setToastMessage(''), 4000);
        setRazorpayGateway(prev => ({
          ...prev,
          is_configured: Boolean(prev.key_id),
          key_secret: '',
          key_secret_masked: '••••••••'
        }));
      } else {
        alert(data.error || 'Failed to save Razorpay settings');
      }
    } catch (err) {
      alert('Error updating Razorpay gateway: ' + err.message);
    } finally {
      setSavingRazorpay(false);
    }
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    try {
      const isEdit = showCampaignModal && showCampaignModal.id;
      const url = isEdit ? `/api/v1/admin/pricing-campaigns/${showCampaignModal.id}` : '/api/v1/admin/pricing-campaigns';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignForm)
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(isEdit ? 'Pricing campaign updated successfully!' : 'New pricing campaign created & published!');
        setShowCampaignModal(null);
        loadPlatformData();
        setTimeout(() => setToastMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to save campaign');
      }
    } catch (err) {
      alert('Network error saving campaign');
    }
  };

  const handleToggleActiveCampaign = async (camp) => {
    try {
      const res = await fetch(`/api/v1/admin/pricing-campaigns/${camp.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: camp.is_active ? 0 : 1 })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`Campaign "${camp.campaign_name}" ${camp.is_active ? 'deactivated' : 'activated as current offer'}!`);
        loadPlatformData();
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      alert('Failed to update campaign status');
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!confirm('Are you sure you want to delete this pricing campaign?')) return;
    try {
      const res = await fetch(`/api/v1/admin/pricing-campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('Pricing campaign deleted.');
        loadPlatformData();
        setTimeout(() => setToastMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to delete campaign');
      }
    } catch (err) {
      alert('Network error deleting campaign');
    }
  };

  const THEME_OPTIONS = [
    { id: 'pearl-light', name: 'Pearl Light (Clean White & Slate)', bg: '#ffffff', border: '#e2e8f0', accent: '#0284c7' },
    { id: 'emerald-glow', name: 'Emerald Glow (Deep Emerald & Mint)', bg: '#064e3b', border: '#10b981', accent: '#34d399' },
    { id: 'midnight-navy', name: 'Midnight Navy (Deep Sapphire)', bg: '#0f172a', border: '#38bdf8', accent: '#0284c7' },
    { id: 'royal-amethyst', name: 'Royal Amethyst (Imperial Purple)', bg: '#3b0764', border: '#a855f7', accent: '#c084fc' },
    { id: 'sunset-amber', name: 'Sunset Amber (Warm Terracotta)', bg: '#451a03', border: '#f59e0b', accent: '#fbbf24' },
    { id: 'champagne-gold', name: 'Champagne Gold (Luxury Onyx & Gold)', bg: '#1c1917', border: '#eab308', accent: '#fde047' },
    { id: 'sapphire-depth', name: 'Sapphire Depth (Executive Cobalt)', bg: '#172554', border: '#3b82f6', accent: '#60a5fa' },
    { id: 'rose-gold', name: 'Rose Gold (Blush & Pink Quartz)', bg: '#fff1f2', border: '#f43f5e', accent: '#fb7185' },
    { id: 'crimson-luxe', name: 'Crimson Luxe (Ruby & Scarlet)', bg: '#450a0a', border: '#ef4444', accent: '#f87171' },
    { id: 'neon-cyber', name: 'Neon Cyber (Matrix Dark & Cyan)', bg: '#09090b', border: '#06b6d4', accent: '#22d3ee' }
  ];

  // GMB Location Handlers
  const handleOpenGmbModal = (loc = null) => {
    if (loc) {
      setGmbForm({
        title: loc.title || '',
        slug: loc.slug || '',
        tenant_id: loc.tenant_id ? String(loc.tenant_id) : '',
        place_id: loc.place_id || '',
        google_review_url: loc.google_review_url || '',
        phone: loc.phone || '',
        whatsapp_number: loc.whatsapp_number || '',
        website_url: loc.website_url || '',
        address: loc.address || '',
        selected_theme: loc.selected_theme || 'pearl-light',
        primary_category: loc.primary_category || 'Retail Store'
      });
      setShowGmbModal(loc);
    } else {
      setGmbForm({
        title: '',
        slug: '',
        tenant_id: '',
        place_id: '',
        google_review_url: '',
        phone: '',
        whatsapp_number: '',
        website_url: '',
        address: '',
        selected_theme: 'pearl-light',
        primary_category: 'Retail Store'
      });
      setShowGmbModal('create');
    }
  };

  const handleSaveGmbLocation = async (e) => {
    e.preventDefault();
    setSavingGmb(true);
    try {
      const isCreate = showGmbModal === 'create';
      const endpoint = isCreate ? '/api/v1/admin/gmb/locations' : `/api/v1/admin/gmb/locations/${showGmbModal.id}`;
      const method = isCreate ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...gmbForm,
          tenant_id: gmbForm.tenant_id ? Number(gmbForm.tenant_id) : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`GMB Location "${gmbForm.title}" ${isCreate ? 'onboarded' : 'updated'} successfully!`);
        setShowGmbModal(null);
        loadPlatformData();
        setTimeout(() => setToastMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to save GMB location');
      }
    } catch (err) {
      alert('Network error saving GMB location');
    } finally {
      setSavingGmb(false);
    }
  };

  const handleDeleteGmbLocation = async (id, title) => {
    if (!confirm(`Are you sure you want to remove GMB location "${title}"?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/gmb/locations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`Location "${title}" removed.`);
        loadPlatformData();
        setTimeout(() => setToastMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to delete GMB location');
      }
    } catch (err) {
      alert('Network error deleting GMB location');
    }
  };

  // User Management Handlers
  const handleOpenUserModal = (u = null) => {
    if (u) {
      setUserForm({
        email: u.email || '',
        password: '',
        phone: u.phone || '',
        first_name: u.first_name || '',
        last_name: u.last_name || '',
        role: u.role || 'merchant_admin',
        tenant_id: u.tenant_id ? String(u.tenant_id) : ''
      });
      setShowUserModal(u);
    } else {
      setUserForm({
        email: '',
        password: '',
        phone: '',
        first_name: '',
        last_name: '',
        role: 'merchant_admin',
        tenant_id: ''
      });
      setShowUserModal('create');
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      const isCreate = showUserModal === 'create';
      const endpoint = isCreate ? '/api/v1/admin/users' : `/api/v1/admin/users/${showUserModal.id}`;
      const method = isCreate ? 'POST' : 'PUT';

      const payload = {
        email: userForm.email,
        phone: userForm.phone,
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        role: userForm.role,
        tenant_id: userForm.tenant_id ? Number(userForm.tenant_id) : null
      };
      if (userForm.password) {
        payload.password = userForm.password;
      }

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`User account for ${userForm.email} ${isCreate ? 'created' : 'updated'} successfully!`);
        setShowUserModal(null);
        loadPlatformData();
        setTimeout(() => setToastMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to save user account');
      }
    } catch (err) {
      alert('Network error saving user account');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id, email) => {
    if (!confirm(`Are you sure you want to delete user "${email}"?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`User "${email}" deleted.`);
        loadPlatformData();
        setTimeout(() => setToastMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      alert('Network error deleting user');
    }
  };

  const handleSaveReviewReply = async (e) => {
    e.preventDefault();
    if (!activeReplyReview || !replyText.trim()) return;
    setSavingReply(true);
    try {
      const res = await fetch(`/api/v1/admin/gmb/reviews/${activeReplyReview.id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reply_comment: replyText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('Review reply published successfully!');
        setActiveReplyReview(null);
        setReplyText('');
        loadPlatformData();
        setTimeout(() => setToastMessage(''), 4000);
      } else {
        alert(data.error || 'Failed to save review reply');
      }
    } catch (err) {
      alert('Network error saving reply');
    } finally {
      setSavingReply(false);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  // 1. Tenants DataTable Hook
  const tenantsTable = useDataTable(tenants, {
    searchFields: ['store_name', 'store_phone', 'store_email', 'id', 'api_token'],
    defaultSortKey: 'id',
    defaultSortDir: 'desc',
    defaultPageSize: 10,
    customSortAccessor: (t, key) => {
      if (key === 'id') return Number(t.id || 0);
      if (key === 'total_invoices') return Number(t.total_invoices || 0);
      if (key === 'messages_used') return Number(t.messages_used || 0);
      if (key === 'message_quota') return Number(t.message_quota || 0);
      if (key === 'plan_valid_until') return new Date(t.plan_valid_until || 0).getTime();
      return t[key];
    }
  });

  // 2. Action Logs DataTable Hook
  const actionLogsTable = useDataTable(actionLogs, {
    searchFields: ['store_name', 'short_id', 'action_type', 'customer_phone'],
    defaultSortKey: 'created_at',
    defaultSortDir: 'desc',
    defaultPageSize: 10,
    customSortAccessor: (l, key) => {
      if (key === 'created_at') return new Date(l.created_at || 0).getTime();
      return l[key];
    }
  });

  // Security & Auth Audit Logs DataTable Hook
  const auditLogsTable = useDataTable(auditLogs, {
    searchFields: ['store_name', 'actor_email', 'actor_phone', 'event_name', 'ip_address', 'failure_reason'],
    defaultSortKey: 'created_at',
    defaultSortDir: 'desc',
    defaultPageSize: 10,
    customSortAccessor: (l, key) => {
      if (key === 'created_at') return new Date(l.created_at || 0).getTime();
      return l[key];
    }
  });

  // Panel Page Views DataTable Hook
  const pageViewsTable = useDataTable(pageViewLogs, {
    searchFields: ['path', 'page_title', 'store_name', 'user_email', 'ip_address', 'panel_type'],
    defaultSortKey: 'created_at',
    defaultSortDir: 'desc',
    defaultPageSize: 10,
    customSortAccessor: (l, key) => {
      if (key === 'created_at') return new Date(l.created_at || 0).getTime();
      if (key === 'duration_seconds') return Number(l.duration_seconds || 0);
      return l[key];
    }
  });

  // Customer Invoice Views DataTable Hook
  const invoiceViewsTable = useDataTable(invoiceViewLogs, {
    searchFields: ['short_id', 'customer_phone', 'store_name', 'ip_address', 'device_type'],
    defaultSortKey: 'created_at',
    defaultSortDir: 'desc',
    defaultPageSize: 10,
    customSortAccessor: (l, key) => {
      if (key === 'created_at') return new Date(l.created_at || 0).getTime();
      if (key === 'view_number') return Number(l.view_number || 0);
      return l[key];
    }
  });

  // 3. Admin WhatsApp Logs DataTable Hook
  const adminWhatsAppTable = useDataTable(adminWhatsAppLogs, {
    searchFields: ['store_name', 'customer_phone', 'short_id', 'status', 'message_id'],
    defaultSortKey: 'sent_at',
    defaultSortDir: 'desc',
    defaultPageSize: 10,
    customSortAccessor: (l, key) => {
      if (key === 'sent_at') return new Date(l.sent_at || 0).getTime();
      return l[key];
    }
  });

  // 4. Pricing Campaigns DataTable Hook
  const filteredCampaigns = useMemo(() => {
    if (!campaignCategoryFilter || campaignCategoryFilter === 'all') return campaigns;
    return campaigns.filter(c => (c.category || 'billing') === campaignCategoryFilter);
  }, [campaigns, campaignCategoryFilter]);

  const campaignsTable = useDataTable(filteredCampaigns, {
    searchFields: ['campaign_name', 'badge_text', 'category', 'plan_tier', 'headline'],
    defaultSortKey: 'id',
    defaultSortDir: 'desc',
    defaultPageSize: 10,
    customSortAccessor: (c, key) => {
      if (key === 'campaign_price') return Number(c.campaign_price || 0);
      if (key === 'regular_price') return Number(c.regular_price || 0);
      if (key === 'trial_days') return Number(c.trial_days || 0);
      return c[key];
    }
  });

  // 5. GMB Locations DataTable Hook
  const gmbTable = useDataTable(gmbLocations, {
    searchFields: ['title', 'slug', 'primary_category', 'place_id', 'address', 'store_name'],
    defaultSortKey: 'id',
    defaultSortDir: 'asc',
    defaultPageSize: 10,
    customSortAccessor: (l, key) => {
      if (key === 'average_rating') return Number(l.average_rating || 0);
      if (key === 'total_reviews') return Number(l.total_reviews || 0);
      if (key === 'funnel_views') return Number(l.funnel_views || 0);
      if (key === 'funnel_positive_redirects') return Number(l.funnel_positive_redirects || 0);
      if (key === 'funnel_private_feedbacks') return Number(l.funnel_private_feedbacks || 0);
      return l[key];
    }
  });

  // 6. Platform & Merchant Users DataTable Hook
  const usersTable = useDataTable(platformUsers, {
    searchFields: ['first_name', 'last_name', 'email', 'phone', 'role', 'store_name', 'gmb_title'],
    defaultSortKey: 'id',
    defaultSortDir: 'desc',
    defaultPageSize: 10
  });

  // 7. GMB Reviews DataTable Hook with filters
  const filteredReviews = useMemo(() => {
    return gmbReviews.filter(r => {
      const matchRating = reviewFilterRating === 'all' || Number(r.star_rating) === Number(reviewFilterRating);
      const matchLoc = reviewFilterLocation === 'all' || String(r.location_id) === String(reviewFilterLocation);
      return matchRating && matchLoc;
    });
  }, [gmbReviews, reviewFilterRating, reviewFilterLocation]);

  const reviewsTable = useDataTable(filteredReviews, {
    searchFields: ['reviewer_name', 'comment', 'location_title', 'location_slug'],
    defaultSortKey: 'review_created_at',
    defaultSortDir: 'desc',
    defaultPageSize: 10
  });

  // 8. GMB Negative Feedbacks DataTable Hook
  const feedbacksTable = useDataTable(gmbFeedbacks, {
    searchFields: ['customer_name', 'customer_phone', 'feedback', 'location_title'],
    defaultSortKey: 'created_at',
    defaultSortDir: 'desc',
    defaultPageSize: 10
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* SaaS Admin Header Bar - 100% Full Width Light Theme */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <RetailNodeLogo size="md" to="/saas-admin" badge="SUPERADMIN" />
          </div>
          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
              SaaS Command Center
            </div>
            <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
              Cluster: 95.135.166.109 &bull; MySQL 8.0 + Redis &bull; 99.8% Open Rate
            </p>
          </div>
        </div>

        {/* Global Stats & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#4f46e5',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(79, 70, 229, 0.3)',
              transition: 'all 0.15s'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Onboard Retail Store</span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#b91c1c',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '10px 1.5rem', fontSize: '0.875rem', fontWeight: '700', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <CheckCircle style={{ width: '18px', height: '18px' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Platform Analytics Cards - Clean Light Modern Theme */}
      <div style={{ padding: '1.5rem 1.5rem 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Active Retail Stores</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
              <Store style={{ width: '15px', height: '15px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px', letterSpacing: '-0.02em' }}>
            {analytics?.stores?.active || tenants.filter(t => t.is_active).length}
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'normal' }}> / {analytics?.stores?.total || tenants.length}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>100% operational uptime</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Invoices Processed</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Receipt style={{ width: '15px', height: '15px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px', letterSpacing: '-0.02em' }}>
            {analytics?.invoices?.total?.toLocaleString() || '1'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>High throughput &bull; &lt; 20ms cache</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>WhatsApp Messages</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <Smartphone style={{ width: '15px', height: '15px' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px', letterSpacing: '-0.02em' }}>
            {analytics?.messaging?.messagesSent?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>Dual Gateway Engine Active</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span>Google Review Clicks</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <Star style={{ width: '15px', height: '15px', fill: '#f59e0b', color: '#f59e0b' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '8px 0 2px', letterSpacing: '-0.02em' }}>
            {analytics?.engagement?.googleReviews || '0'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>Audited in action_logs</div>
        </div>
      </div>

      {/* Tabs - Light Theme */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0', padding: '0 1.5rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[
            { id: 'stores', label: 'Tenants Directory', icon: Store, count: tenants.length },
            { id: 'gmb', label: 'Google Review & GMB Management', icon: Star, count: gmbLocations.length },
            { id: 'users', label: 'Users & Store Access', icon: Users, count: platformUsers.length },
            { id: 'pricing', label: 'Pricing Campaigns & Offers', icon: Tag, count: campaigns.length },
            { id: 'whatsapp_logs', label: 'WhatsApp Message Logs', icon: MessageSquare, count: adminWhatsAppLogs.length },
            { id: 'logs', label: 'Live Action Logs', icon: Activity, count: actionLogs.length },
            { id: 'gateways', label: 'Global Gateways (WABA, Resend & Razorpay)', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '1rem 0',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #4f46e5' : '2px solid transparent',
                  backgroundColor: 'transparent',
                  color: isActive ? '#4f46e5' : '#64748b',
                  fontWeight: isActive ? '800' : '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Icon style={{ width: '16px', height: '16px', color: isActive ? '#4f46e5' : '#94a3b8' }} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '9999px', backgroundColor: isActive ? '#e0e7ff' : '#f1f5f9', color: isActive ? '#4338ca' : '#64748b', fontWeight: '700' }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #cbd5e1', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: '600' }}>Querying platform telemetry...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: STORES DIRECTORY */}
            {activeTab === 'stores' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                  <TableSearchInput
                    value={tenantsTable.searchQuery}
                    onChange={tenantsTable.setSearchQuery}
                    placeholder="Filter stores by name, email, phone, ID..."
                    width="360px"
                  />

                  <button
                    onClick={loadPlatformData}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600' }}
                  >
                    <RefreshCw style={{ width: '14px', height: '14px' }} />
                    <span>Sync Directory</span>
                  </button>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <SortableTh sortKey="store_name" currentSort={tenantsTable.sortConfig} onSort={tenantsTable.handleSort}>Store ID &amp; Name</SortableTh>
                        <SortableTh sortKey="plan_valid_until" currentSort={tenantsTable.sortConfig} onSort={tenantsTable.handleSort}>Plan &amp; Validity</SortableTh>
                        <SortableTh sortKey="store_phone" currentSort={tenantsTable.sortConfig} onSort={tenantsTable.handleSort}>Contact</SortableTh>
                        <SortableTh sortKey="api_token" currentSort={tenantsTable.sortConfig} onSort={tenantsTable.handleSort}>API Token</SortableTh>
                        <SortableTh sortKey="total_invoices" currentSort={tenantsTable.sortConfig} onSort={tenantsTable.handleSort}>Invoices</SortableTh>
                        <SortableTh sortKey="messages_used" currentSort={tenantsTable.sortConfig} onSort={tenantsTable.handleSort}>WhatsApp Quota</SortableTh>
                        <SortableTh sortKey="is_active" currentSort={tenantsTable.sortConfig} onSort={tenantsTable.handleSort}>Status</SortableTh>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenantsTable.items.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                            {tenantsTable.searchQuery ? 'No stores match your search.' : 'No stores enrolled yet.'}
                          </td>
                        </tr>
                      ) : (
                        tenantsTable.items.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{t.store_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Store ID: #{t.id}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {(() => {
                                const tier = t.plan_tier || 'trial';
                                let bg = '#fff7ed';
                                let textCol = '#c2410c';
                                let label = 'Trial (3d)';
                                if (tier === 'growth') {
                                  bg = '#eff6ff'; textCol = '#1d4ed8'; label = 'Growth Plan';
                                } else if (tier === 'promotion') {
                                  bg = '#ecfdf5'; textCol = '#047857'; label = '🎁 1-Yr Promo';
                                } else if (tier === 'gmb_pro') {
                                  bg = '#fef3c7'; textCol = '#b45309'; label = '⭐ GMB Pro';
                                } else if (tier === 'retail_combo') {
                                  bg = '#faf5ff'; textCol = '#7e22ce'; label = '🚀 Retail Combo';
                                } else if (tier === 'gmb_starter') {
                                  bg = '#f0fdf4'; textCol = '#15803d'; label = '🏷️ Standee Starter';
                                } else if (tier === 'enterprise') {
                                  bg = '#f1f5f9'; textCol = '#334155'; label = '🏢 Enterprise';
                                }
                                return (
                                  <span style={{
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem',
                                    fontWeight: '800',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: bg,
                                    color: textCol,
                                    border: '1px solid currentColor'
                                  }}>
                                    {label}
                                  </span>
                                );
                              })()}
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: '700',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: t.plan_status === 'expired' ? '#fee2e2' : (t.plan_status === 'expiring_soon' ? '#fef3c7' : '#dcfce7'),
                                color: t.plan_status === 'expired' ? '#991b1b' : (t.plan_status === 'expiring_soon' ? '#92400e' : '#166534')
                              }}>
                                {t.plan_status === 'expired' ? 'Expired' : (t.days_remaining !== null ? `${t.days_remaining}d left` : 'Lifetime')}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                              {t.plan_valid_until ? `Valid till ${new Date(t.plan_valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'No expiry set'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#334155' }}>
                            <div>{t.store_phone || 'No phone'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.store_email || 'No email'}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <code style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', color: '#0284c7', border: '1px solid #e2e8f0' }}>
                              {t.api_token ? `${t.api_token.slice(0, 14)}...` : 'None'}
                            </code>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                            {t.total_invoices || 0}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: '600' }}>
                              {(t.messages_used || 0).toLocaleString()} / {(t.message_quota || 0).toLocaleString()}
                            </div>
                            <div style={{ width: '100px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                              <div style={{ width: `${Math.min(100, Math.round(((t.messages_used || 0) / (t.message_quota || 1)) * 100))}%`, height: '100%', backgroundColor: '#10b981' }}></div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button
                              onClick={() => handleToggleActive(t)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                border: 'none',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                backgroundColor: t.is_active ? '#dcfce7' : '#fee2e2',
                                color: t.is_active ? '#166534' : '#991b1b'
                              }}
                            >
                              {t.is_active ? 'Active' : 'Suspended'}
                            </button>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => {
                                setShowPlanModal(t);
                                setPlanForm({
                                  plan_tier: t.plan_tier || 'growth',
                                  plan_valid_until: t.plan_valid_until ? t.plan_valid_until.split('T')[0] : '',
                                  is_active: t.is_active ? 1 : 0
                                });
                              }}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', marginRight: '6px' }}
                            >
                              Plan &amp; Validity
                            </button>
                            <button
                              onClick={() => setShowQuotaModal(t)}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #c7d2fe', backgroundColor: '#eef2ff', color: '#4338ca', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                            >
                              Top-Up Quota
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  </table>

                  {/* Tenants Table Pagination */}
                  <TablePagination
                    currentPage={tenantsTable.currentPage}
                    totalItems={tenantsTable.totalItems}
                    pageSize={tenantsTable.pageSize}
                    onPageChange={tenantsTable.setCurrentPage}
                    onPageSizeChange={tenantsTable.setPageSize}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: AUDIT & TELEMETRY STREAM COMMAND CENTER */}
            {activeTab === 'logs' && (
              <div>
                {/* Sub-Tab Navigation Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 4px', color: '#0f172a' }}>
                      Universal Activity & Security Audit Command Center
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      Real-time audit stream of signups, logins, panel navigation, customer receipt opens, and interactive actions
                    </p>
                  </div>

                  {/* Sub-tab Pill Selectors */}
                  <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setLogsSubTab('auth')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '7px',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        backgroundColor: logsSubTab === 'auth' ? '#ffffff' : 'transparent',
                        color: logsSubTab === 'auth' ? '#0f172a' : '#64748b',
                        boxShadow: logsSubTab === 'auth' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      🛡️ Security & Auth ({auditLogs.length})
                    </button>
                    <button
                      onClick={() => setLogsSubTab('page_views')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '7px',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        backgroundColor: logsSubTab === 'page_views' ? '#ffffff' : 'transparent',
                        color: logsSubTab === 'page_views' ? '#0f172a' : '#64748b',
                        boxShadow: logsSubTab === 'page_views' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      🧭 Panel Navigation ({pageViewLogs.length})
                    </button>
                    <button
                      onClick={() => setLogsSubTab('invoice_views')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '7px',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        backgroundColor: logsSubTab === 'invoice_views' ? '#ffffff' : 'transparent',
                        color: logsSubTab === 'invoice_views' ? '#0f172a' : '#64748b',
                        boxShadow: logsSubTab === 'invoice_views' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      👁️ Invoice Views ({invoiceViewLogs.length})
                    </button>
                    <button
                      onClick={() => setLogsSubTab('actions')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '7px',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        backgroundColor: logsSubTab === 'actions' ? '#ffffff' : 'transparent',
                        color: logsSubTab === 'actions' ? '#0f172a' : '#64748b',
                        boxShadow: logsSubTab === 'actions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      ⚡ Clicks & Engagement ({actionLogs.length})
                    </button>
                  </div>
                </div>

                {/* SUB-VIEW 1: SECURITY & AUTH AUDIT LOGS */}
                {logsSubTab === 'auth' && (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                          Signups & Login Security Audit Ledger
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Verified client IP addresses, authentication timestamps, and failure causes
                        </span>
                      </div>
                      <TableSearchInput
                        value={auditLogsTable.searchQuery}
                        onChange={auditLogsTable.setSearchQuery}
                        placeholder="Search IP, email, phone, store..."
                        width="300px"
                      />
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <SortableTh sortKey="created_at" currentSort={auditLogsTable.sortConfig} onSort={auditLogsTable.handleSort}>Timestamp</SortableTh>
                          <SortableTh sortKey="event_name" currentSort={auditLogsTable.sortConfig} onSort={auditLogsTable.handleSort}>Event / Action</SortableTh>
                          <SortableTh sortKey="status" currentSort={auditLogsTable.sortConfig} onSort={auditLogsTable.handleSort}>Status</SortableTh>
                          <SortableTh sortKey="actor_email" currentSort={auditLogsTable.sortConfig} onSort={auditLogsTable.handleSort}>User / Actor</SortableTh>
                          <SortableTh sortKey="store_name" currentSort={auditLogsTable.sortConfig} onSort={auditLogsTable.handleSort}>Retail Store</SortableTh>
                          <SortableTh sortKey="ip_address" currentSort={auditLogsTable.sortConfig} onSort={auditLogsTable.handleSort}>Client IP</SortableTh>
                          <th style={{ padding: '12px 16px' }}>Device / Platform</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogsTable.items.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                              {auditLogsTable.searchQuery ? 'No audit records match your search.' : 'No authentication audit records logged yet.'}
                            </td>
                          </tr>
                        ) : (
                          auditLogsTable.items.map(log => {
                            const isSuccess = log.status === 'success';
                            return (
                              <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem' }}>
                                  {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    backgroundColor: log.event_name.includes('signup') ? '#f3e8ff' : (isSuccess ? '#ecfdf5' : '#fef2f2'),
                                    color: log.event_name.includes('signup') ? '#7e22ce' : (isSuccess ? '#065f46' : '#991b1b')
                                  }}>
                                    {log.event_name}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    color: isSuccess ? '#16a34a' : '#dc2626'
                                  }}>
                                    {isSuccess ? '✓ SUCCESS' : `✕ FAILED (${log.failure_reason || 'Unknown'})`}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: '600' }}>
                                  {log.actor_email || log.actor_phone || 'Anonymous'}
                                  {log.actor_role && (
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal' }}>
                                      Role: {log.actor_role}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '12px 16px', color: '#475569' }}>
                                  {log.store_name || (log.tenant_id ? `Tenant #${log.tenant_id}` : 'Platform SuperAdmin')}
                                </td>
                                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#0284c7', fontWeight: '600', fontSize: '0.8rem' }}>
                                  {log.ip_address}
                                </td>
                                <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem' }}>
                                  <span style={{ textTransform: 'capitalize', fontWeight: '600', color: '#334155' }}>
                                    {log.device_type || 'Desktop'}
                                  </span>
                                  {log.user_agent && (
                                    <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.7 }} title={log.user_agent}>
                                      {log.user_agent}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>

                    <TablePagination
                      currentPage={auditLogsTable.currentPage}
                      totalItems={auditLogsTable.totalItems}
                      pageSize={auditLogsTable.pageSize}
                      onPageChange={auditLogsTable.setCurrentPage}
                      onPageSizeChange={auditLogsTable.setPageSize}
                    />
                  </div>
                )}

                {/* SUB-VIEW 2: PANEL NAVIGATION STREAM */}
                {logsSubTab === 'page_views' && (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                          Real-Time Panel Navigation & Screen Telemetry
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Screen transitions, dwell durations, and page access frequency across panels
                        </span>
                      </div>
                      <TableSearchInput
                        value={pageViewsTable.searchQuery}
                        onChange={pageViewsTable.setSearchQuery}
                        placeholder="Search screen, path, email, IP..."
                        width="300px"
                      />
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <SortableTh sortKey="created_at" currentSort={pageViewsTable.sortConfig} onSort={pageViewsTable.handleSort}>Timestamp</SortableTh>
                          <SortableTh sortKey="path" currentSort={pageViewsTable.sortConfig} onSort={pageViewsTable.handleSort}>Screen / Route</SortableTh>
                          <SortableTh sortKey="panel_type" currentSort={pageViewsTable.sortConfig} onSort={pageViewsTable.handleSort}>Panel</SortableTh>
                          <SortableTh sortKey="store_name" currentSort={pageViewsTable.sortConfig} onSort={pageViewsTable.handleSort}>Store / Tenant</SortableTh>
                          <SortableTh sortKey="user_email" currentSort={pageViewsTable.sortConfig} onSort={pageViewsTable.handleSort}>Staff User</SortableTh>
                          <SortableTh sortKey="duration_seconds" currentSort={pageViewsTable.sortConfig} onSort={pageViewsTable.handleSort}>Dwell Time</SortableTh>
                          <SortableTh sortKey="ip_address" currentSort={pageViewsTable.sortConfig} onSort={pageViewsTable.handleSort}>Client IP</SortableTh>
                        </tr>
                      </thead>
                      <tbody>
                        {pageViewsTable.items.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                              {pageViewsTable.searchQuery ? 'No page navigation records match your query.' : 'No panel navigation telemetry recorded yet.'}
                            </td>
                          </tr>
                        ) : (
                          pageViewsTable.items.map(pv => (
                            <tr key={pv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem' }}>
                                {new Date(pv.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                                {pv.path}
                                {pv.page_title && (
                                  <div style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 'normal' }}>
                                    {pv.page_title}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.725rem',
                                  fontWeight: '700',
                                  backgroundColor: pv.panel_type === 'merchant_panel' ? '#eff6ff' : (pv.panel_type === 'saas_admin' ? '#f5f3ff' : '#f8fafc'),
                                  color: pv.panel_type === 'merchant_panel' ? '#1e40af' : (pv.panel_type === 'saas_admin' ? '#6b21a8' : '#475569')
                                }}>
                                  {pv.panel_type}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', color: '#334155' }}>
                                {pv.store_name || (pv.tenant_id ? `Tenant #${pv.tenant_id}` : 'Platform SuperAdmin')}
                              </td>
                              <td style={{ padding: '12px 16px', color: '#0284c7', fontSize: '0.8rem' }}>
                                {pv.user_email || 'Session ' + (pv.session_id ? pv.session_id.slice(-6) : 'Anon')}
                              </td>
                              <td style={{ padding: '12px 16px', color: '#334155', fontWeight: '600' }}>
                                {pv.duration_seconds > 0 ? `${pv.duration_seconds}s` : '< 1s'}
                              </td>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b', fontSize: '0.8rem' }}>
                                {pv.ip_address}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    <TablePagination
                      currentPage={pageViewsTable.currentPage}
                      totalItems={pageViewsTable.totalItems}
                      pageSize={pageViewsTable.pageSize}
                      onPageChange={pageViewsTable.setCurrentPage}
                      onPageSizeChange={pageViewsTable.setPageSize}
                    />
                  </div>
                )}

                {/* SUB-VIEW 3: CUSTOMER INVOICE VIEWS STREAM */}
                {logsSubTab === 'invoice_views' && (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                          Customer Digital Receipt Open Audit Trail
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Real-time stream of retail shoppers viewing their digital bills (/t/{'{shortId}'})
                        </span>
                      </div>
                      <TableSearchInput
                        value={invoiceViewsTable.searchQuery}
                        onChange={invoiceViewsTable.setSearchQuery}
                        placeholder="Search short ID, phone, store, IP..."
                        width="300px"
                      />
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <SortableTh sortKey="created_at" currentSort={invoiceViewsTable.sortConfig} onSort={invoiceViewsTable.handleSort}>Timestamp</SortableTh>
                          <SortableTh sortKey="short_id" currentSort={invoiceViewsTable.sortConfig} onSort={invoiceViewsTable.handleSort}>Receipt Slug</SortableTh>
                          <SortableTh sortKey="store_name" currentSort={invoiceViewsTable.sortConfig} onSort={invoiceViewsTable.handleSort}>Store</SortableTh>
                          <SortableTh sortKey="customer_phone" currentSort={invoiceViewsTable.sortConfig} onSort={invoiceViewsTable.handleSort}>Customer Phone</SortableTh>
                          <SortableTh sortKey="view_number" currentSort={invoiceViewsTable.sortConfig} onSort={invoiceViewsTable.handleSort}>View #</SortableTh>
                          <th style={{ padding: '12px 16px' }}>Channel / Browser</th>
                          <SortableTh sortKey="ip_address" currentSort={invoiceViewsTable.sortConfig} onSort={invoiceViewsTable.handleSort}>Client IP</SortableTh>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceViewsTable.items.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                              {invoiceViewsTable.searchQuery ? 'No customer receipt views match your search.' : 'No customer receipt views recorded yet.'}
                            </td>
                          </tr>
                        ) : (
                          invoiceViewsTable.items.map(iv => (
                            <tr key={iv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem' }}>
                                {new Date(iv.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <a
                                  href={`/t/${iv.short_id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}
                                >
                                  /t/{iv.short_id} ↗
                                </a>
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a' }}>
                                {iv.store_name || `Tenant #${iv.tenant_id}`}
                              </td>
                              <td style={{ padding: '12px 16px', color: '#334155' }}>
                                {iv.customer_phone}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '800',
                                  backgroundColor: iv.view_number === 1 ? '#ecfdf5' : '#f0f9ff',
                                  color: iv.view_number === 1 ? '#047857' : '#0369a1'
                                }}>
                                  {iv.view_number === 1 ? '1st Open (New)' : `${iv.view_number}th Open`}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                {iv.is_whatsapp_webview ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: '#dcfce7', color: '#166534' }}>
                                    WhatsApp In-App
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {iv.device_type === 'mobile' ? 'Mobile Browser' : 'Desktop Browser'}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#0284c7', fontSize: '0.8rem' }}>
                                {iv.ip_address}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    <TablePagination
                      currentPage={invoiceViewsTable.currentPage}
                      totalItems={invoiceViewsTable.totalItems}
                      pageSize={invoiceViewsTable.pageSize}
                      onPageChange={invoiceViewsTable.setCurrentPage}
                      onPageSizeChange={invoiceViewsTable.setPageSize}
                    />
                  </div>
                )}

                {/* SUB-VIEW 4: INTERACTIVE CLICKS & ENGAGEMENT */}
                {logsSubTab === 'actions' && (
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                          Customer Interaction Clicks (Reviews & Social)
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Showing latest customer clicks on Google Reviews, Instagram, and social channels
                        </span>
                      </div>

                      <TableSearchInput
                        value={actionLogsTable.searchQuery}
                        onChange={actionLogsTable.setSearchQuery}
                        placeholder="Search store, short ID, action, phone..."
                        width="300px"
                      />
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <SortableTh sortKey="created_at" currentSort={actionLogsTable.sortConfig} onSort={actionLogsTable.handleSort}>Timestamp</SortableTh>
                          <SortableTh sortKey="store_name" currentSort={actionLogsTable.sortConfig} onSort={actionLogsTable.handleSort}>Retail Store</SortableTh>
                          <SortableTh sortKey="short_id" currentSort={actionLogsTable.sortConfig} onSort={actionLogsTable.handleSort}>Short ID</SortableTh>
                          <SortableTh sortKey="action_type" currentSort={actionLogsTable.sortConfig} onSort={actionLogsTable.handleSort}>Action Trigger</SortableTh>
                          <SortableTh sortKey="customer_phone" currentSort={actionLogsTable.sortConfig} onSort={actionLogsTable.handleSort}>Customer Phone</SortableTh>
                          <th style={{ padding: '12px 16px' }}>Metadata</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actionLogsTable.items.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                              {actionLogsTable.searchQuery ? 'No action logs match your search.' : 'No action logs recorded yet.'}
                            </td>
                          </tr>
                        ) : (
                          actionLogsTable.items.map(log => (
                            <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                              <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.8rem' }}>
                                {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                                {log.store_name || `Tenant #${log.tenant_id}`}
                              </td>
                              <td style={{ padding: '12px 16px', color: '#0284c7', fontWeight: '600' }}>
                                {log.short_id}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  backgroundColor: log.action_type.includes('review') ? '#fef3c7' : (log.action_type.includes('instagram') ? '#fce7f3' : (log.action_type.includes('youtube') ? '#fee2e2' : '#e0f2fe')),
                                  color: log.action_type.includes('review') ? '#92400e' : (log.action_type.includes('instagram') ? '#9d174d' : (log.action_type.includes('youtube') ? '#991b1b' : '#0369a1'))
                                }}>
                                  {log.action_type}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', color: '#334155' }}>
                                {log.customer_phone || 'Anonymous'}
                              </td>
                              <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                {typeof log.metadata === 'object' ? JSON.stringify(log.metadata) : (log.metadata || '-')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    <TablePagination
                      currentPage={actionLogsTable.currentPage}
                      totalItems={actionLogsTable.totalItems}
                      pageSize={actionLogsTable.pageSize}
                      onPageChange={actionLogsTable.setCurrentPage}
                      onPageSizeChange={actionLogsTable.setPageSize}
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: WHATSAPP MESSAGE LOGS (MULTI-TENANT AUDIT) */}
            {activeTab === 'whatsapp_logs' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 4px', color: '#0f172a' }}>
                      Platform-Wide WhatsApp Delivery Audit Stream
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      Real-time stream of all digital invoices and OTPs dispatched via WABA Gateway (waba.mpocket.in)
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <TableSearchInput
                      value={adminWhatsAppTable.searchQuery}
                      onChange={adminWhatsAppTable.setSearchQuery}
                      placeholder="Search store, phone, receipt #, status..."
                      width="280px"
                    />
                    <button
                      onClick={loadPlatformData}
                      style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600' }}
                    >
                      <RefreshCw style={{ width: '14px', height: '14px' }} />
                      <span>Refresh Stream</span>
                    </button>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <SortableTh sortKey="sent_at" currentSort={adminWhatsAppTable.sortConfig} onSort={adminWhatsAppTable.handleSort}>Sent Timestamp</SortableTh>
                        <SortableTh sortKey="store_name" currentSort={adminWhatsAppTable.sortConfig} onSort={adminWhatsAppTable.handleSort}>Store / Merchant</SortableTh>
                        <SortableTh sortKey="customer_phone" currentSort={adminWhatsAppTable.sortConfig} onSort={adminWhatsAppTable.handleSort}>Recipient Mobile</SortableTh>
                        <SortableTh sortKey="short_id" currentSort={adminWhatsAppTable.sortConfig} onSort={adminWhatsAppTable.handleSort}>Digital Receipt</SortableTh>
                        <SortableTh sortKey="gateway" currentSort={adminWhatsAppTable.sortConfig} onSort={adminWhatsAppTable.handleSort}>Gateway</SortableTh>
                        <SortableTh sortKey="message_id" currentSort={adminWhatsAppTable.sortConfig} onSort={adminWhatsAppTable.handleSort}>WABA Message ID (WAMID)</SortableTh>
                        <SortableTh sortKey="status" currentSort={adminWhatsAppTable.sortConfig} onSort={adminWhatsAppTable.handleSort} align="right">Status</SortableTh>
                      </tr>
                    </thead>
                    <tbody>
                      {adminWhatsAppTable.items.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                            {adminWhatsAppTable.searchQuery ? 'No WhatsApp messages match your search.' : 'No WhatsApp messages dispatched yet.'}
                          </td>
                        </tr>
                      ) : (
                        adminWhatsAppTable.items.map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                              {new Date(log.sent_at).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                              {log.store_name || `Store #${log.tenant_id}`}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: '600', color: '#334155' }}>
                              +{log.customer_phone}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {log.short_id ? (
                                <a
                                  href={`https://bill.retailnode.in/t/${log.short_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#4f46e5', textDecoration: 'none', fontWeight: '700' }}
                                >
                                  <span>/t/{log.short_id}</span>
                                  <ExternalLink style={{ width: '12px', height: '12px' }} />
                                </a>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>Direct Message</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#047857', fontWeight: '700', fontSize: '0.78rem' }}>
                              {log.gateway || 'waba.mpocket.in'}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                              {log.message_id ? (
                                <span title={log.message_id}>{log.message_id.slice(0, 24)}...</span>
                              ) : '—'}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <span style={{
                                padding: '4px 9px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                backgroundColor: log.status === 'sent' || log.status === 'delivered' || log.status === 'read' ? '#dcfce7' : '#fee2e2',
                                color: log.status === 'sent' || log.status === 'delivered' || log.status === 'read' ? '#15803d' : '#b91c1c'
                              }}>
                                {log.status ? log.status.toUpperCase() : 'SENT'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Admin WhatsApp Logs Table Pagination */}
                  <TablePagination
                    currentPage={adminWhatsAppTable.currentPage}
                    totalItems={adminWhatsAppTable.totalItems}
                    pageSize={adminWhatsAppTable.pageSize}
                    onPageChange={adminWhatsAppTable.setCurrentPage}
                    onPageSizeChange={adminWhatsAppTable.setPageSize}
                  />
                </div>
              </div>
            )}

            {/* TAB 4: GLOBAL GATEWAYS (WABA + RESEND EMAIL) */}
            {activeTab === 'gateways' && (
              <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '1.5rem' }}>
                
                {/* 1. Global WABA Gateway */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                        Global WABA Gateway &amp; SMS Fallback
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                        System-wide default credentials used for retail stores opting into the platform shared gateway.
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#ecfdf5', color: '#065f46', padding: '4px 10px', borderRadius: '6px', border: '1px solid #a7f3d0', fontWeight: '700' }}>
                      361462453714220 &bull; ACTIVE
                    </span>
                  </div>

                  <form onSubmit={handleSaveGateways} style={{ display: 'grid', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Default WABA Provider
                      </label>
                      <input
                        type="text"
                        value={gateways.default_waba_provider || 'waba_custom'}
                        onChange={(e) => setGateways({ ...gateways, default_waba_provider: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Global WABA Bearer Token
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={gateways.global_waba_token || ''}
                        onChange={(e) => setGateways({ ...gateways, global_waba_token: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Global Phone Number ID
                      </label>
                      <input
                        type="text"
                        value={gateways.global_phone_number_id || ''}
                        onChange={(e) => setGateways({ ...gateways, global_phone_number_id: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button
                        type="submit"
                        style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                      >
                        Save Global WABA Gateway
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2. Global Resend Email Gateway */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                        Global Resend.com Email Gateway
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                        Platform-wide Resend API key and fallback sender for digital invoice HTML emails.
                      </p>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      backgroundColor: emailGateway.is_configured ? '#ecfdf5' : '#fef3c7',
                      color: emailGateway.is_configured ? '#065f46' : '#92400e',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: emailGateway.is_configured ? '#a7f3d0' : '#fde68a',
                      fontWeight: '700'
                    }}>
                      {emailGateway.is_configured ? 'RESEND KEY CONFIGURED' : 'AWAITING KEY'}
                    </span>
                  </div>

                  <form onSubmit={handleSaveEmailGateway} style={{ display: 'grid', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Global Resend API Key (re_...)
                      </label>
                      <input
                        type="password"
                        placeholder="re_••••••••••••••••••••••••"
                        value={emailGateway.resend_api_key || ''}
                        onChange={(e) => setEmailGateway({ ...emailGateway, resend_api_key: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Default From Email
                        </label>
                        <input
                          type="email"
                          placeholder="billing@retailnode.in (or onboarding@resend.dev)"
                          value={emailGateway.resend_from_email || ''}
                          onChange={(e) => setEmailGateway({ ...emailGateway, resend_from_email: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Default From Name
                        </label>
                        <input
                          type="text"
                          placeholder="RetailNode Digital Invoices"
                          value={emailGateway.resend_from_name || ''}
                          onChange={(e) => setEmailGateway({ ...emailGateway, resend_from_name: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button
                        type="submit"
                        style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                      >
                        Save Global Email Gateway
                      </button>
                    </div>
                  </form>

                  {/* SuperAdmin Test Email Box */}
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>
                      Send Platform Test Email via Resend
                    </h4>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                      Verify that your Resend API Key is active and authorized to send outbound emails.
                    </p>

                    <form onSubmit={handleTestEmailGateway} style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="email"
                        required
                        placeholder="Enter recipient email (e.g. admin@retailnode.in)"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                      <button
                        type="submit"
                        disabled={testEmailSending}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#4f46e5',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '0.825rem',
                          cursor: testEmailSending ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Send style={{ width: '14px', height: '14px' }} />
                        <span>{testEmailSending ? 'Dispatching...' : 'Dispatch Test Email'}</span>
                      </button>
                    </form>
                  </div>

                </div>

                {/* 3. Global Razorpay Payment Gateway */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                        <CreditCard style={{ width: '22px', height: '22px' }} />
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                          Razorpay Payment Gateway Integration
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                          Collects merchant subscription payments (Growth Plan ₹6,000/yr) &amp; message quota top-ups.
                        </p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      backgroundColor: razorpayGateway.is_configured ? '#ecfdf5' : '#fef3c7',
                      color: razorpayGateway.is_configured ? '#065f46' : '#92400e',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: razorpayGateway.is_configured ? '#a7f3d0' : '#fde68a',
                      fontWeight: '700'
                    }}>
                      {razorpayGateway.is_configured ? 'RAZORPAY ACTIVE' : 'PENDING KEYS'}
                    </span>
                  </div>

                  <form onSubmit={handleSaveRazorpayGateway} style={{ display: 'grid', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Razorpay Key ID (`rzp_live_...` or `rzp_test_...`)
                        </label>
                        <input
                          type="text"
                          placeholder="rzp_live_xxxxxxxxxxxxxxxx"
                          value={razorpayGateway.key_id}
                          onChange={(e) => setRazorpayGateway({ ...razorpayGateway, key_id: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Razorpay Key Secret
                        </label>
                        <input
                          type="password"
                          placeholder={razorpayGateway.key_secret_masked || "Enter Razorpay Secret Key"}
                          value={razorpayGateway.key_secret}
                          onChange={(e) => setRazorpayGateway({ ...razorpayGateway, key_secret: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                        Used automatically on checkout for annual subscriptions and quota top-ups with HMAC SHA256 verification.
                      </p>
                      <button
                        type="submit"
                        disabled={savingRazorpay}
                        style={{ padding: '10px 22px', borderRadius: '8px', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', border: 'none', cursor: savingRazorpay ? 'not-allowed' : 'pointer' }}
                      >
                        {savingRazorpay ? 'Saving...' : 'Save Razorpay Credentials'}
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            )}

            {/* TAB 4: PRICING CAMPAIGNS & DYNAMIC OFFERS */}
            {activeTab === 'pricing' && (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Header Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 4px', color: '#0f172a' }}>
                      Pricing Campaigns &amp; Dynamic Live Offers
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      Control live prices on /pricing in real time. Manage Google Reviews, Digital Billing POS, and Retail Combo plans.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        setCampaignForm({
                          campaign_name: 'Google Review & Local SEO Booster Pro',
                          category: 'gmb',
                          plan_tier: 'gmb_pro',
                          regular_price: 5000,
                          campaign_price: 2999,
                          trial_days: 7,
                          badge_text: 'SAVE ₹2,001 (40% OFF)',
                          headline: 'Rank #1 on Google Maps. Automate 5-Star Reviews.',
                          subheadline: 'Acrylic QR Standee + AI Auto-Responder + Negative Review Shield for Retail Stores',
                          is_active: 1,
                          start_date: '',
                          end_date: ''
                        });
                        setShowCampaignModal('create');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)'
                      }}
                    >
                      <Star style={{ width: '15px', height: '15px' }} />
                      <span>+ GMB Plan</span>
                    </button>

                    <button
                      onClick={() => {
                        setCampaignForm({
                          campaign_name: 'Retail Growth Combo (Billing + GMB Suite)',
                          category: 'combo',
                          plan_tier: 'retail_combo',
                          regular_price: 14000,
                          campaign_price: 7999,
                          trial_days: 14,
                          badge_text: 'BEST VALUE (43% OFF)',
                          headline: 'Everything Retail: Digital Bills + 5-Star Google Reviews',
                          subheadline: 'Complete Retail OS: WhatsApp Receipts + GMB Smart QR Standee + Customer Retention CRM',
                          is_active: 1,
                          start_date: '',
                          end_date: ''
                        });
                        setShowCampaignModal('create');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: '#7c3aed',
                        color: '#ffffff',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(124, 58, 237, 0.3)'
                      }}
                    >
                      <Sparkles style={{ width: '15px', height: '15px' }} />
                      <span>+ Combo Suite</span>
                    </button>

                    <button
                      onClick={() => {
                        setCampaignForm({
                          campaign_name: 'Retail Launch Offer',
                          category: 'billing',
                          plan_tier: 'growth',
                          regular_price: 9000,
                          campaign_price: 6000,
                          trial_days: 3,
                          badge_text: 'SAVE ₹3,000 TODAY (33% OFF)',
                          headline: 'One Simple Price. All Features Included.',
                          subheadline: 'Complete Digital Billing & Smart CRM Utility for Indian Retailers',
                          is_active: 1,
                          start_date: '',
                          end_date: ''
                        });
                        setShowCampaignModal('create');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(5, 150, 105, 0.3)'
                      }}
                    >
                      <Plus style={{ width: '15px', height: '15px' }} />
                      <span>+ Custom Campaign</span>
                    </button>
                  </div>
                </div>

                {/* Live Active Campaign Spotlight Card */}
                {(() => {
                  const activeCamp = campaigns.find(c => c.is_active && (campaignCategoryFilter === 'all' || (c.category || 'billing') === campaignCategoryFilter))
                    || campaigns.find(c => campaignCategoryFilter === 'all' || (c.category || 'billing') === campaignCategoryFilter)
                    || campaigns.find(c => c.is_active)
                    || campaigns[0];
                  if (!activeCamp) return null;
                  const reg = Number(activeCamp.regular_price || 9000);
                  const camp = Number(activeCamp.campaign_price || 6000);
                  const sav = Math.max(0, reg - camp);
                  const pct = reg > 0 ? Math.round((sav / reg) * 100) : 33;
                  const cat = activeCamp.category || 'billing';
                  return (
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: cat === 'gmb' ? '2px solid #2563eb' : (cat === 'combo' ? '2px solid #7c3aed' : '2px solid #059669'),
                      padding: '1.75rem',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px', backgroundColor: activeCamp.is_active ? '#dcfce7' : '#f1f5f9', color: activeCamp.is_active ? '#166534' : '#64748b', fontSize: '0.75rem', fontWeight: '800' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: activeCamp.is_active ? '#16a34a' : '#94a3b8', display: 'inline-block' }}></span>
                              <span>{activeCamp.is_active ? 'CURRENTLY LIVE ON /pricing' : 'INACTIVE / DRAFT OFFER'}</span>
                            </div>
                            {cat === 'gmb' && (
                              <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                                ⭐ GOOGLE REVIEW &amp; STANDEE PLAN
                              </span>
                            )}
                            {cat === 'combo' && (
                              <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>
                                🚀 ALL-IN-ONE RETAIL COMBO
                              </span>
                            )}
                            {cat === 'billing' && (
                              <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                                🧾 DIGITAL BILLING POS
                              </span>
                            )}
                          </div>
                          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0 0 4px', color: '#0f172a' }}>
                            {activeCamp.campaign_name}
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                            {activeCamp.headline}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setCampaignForm({
                                campaign_name: activeCamp.campaign_name,
                                category: activeCamp.category || 'billing',
                                plan_tier: activeCamp.plan_tier || 'growth',
                                regular_price: activeCamp.regular_price,
                                campaign_price: activeCamp.campaign_price,
                                trial_days: activeCamp.trial_days || 3,
                                badge_text: activeCamp.badge_text,
                                headline: activeCamp.headline,
                                subheadline: activeCamp.subheadline,
                                is_active: activeCamp.is_active ? 1 : 0,
                                start_date: activeCamp.start_date ? activeCamp.start_date.split('T')[0] : '',
                                end_date: activeCamp.end_date ? activeCamp.end_date.split('T')[0] : ''
                              });
                              setShowCampaignModal(activeCamp);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              borderRadius: '8px',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit3 style={{ width: '14px', height: '14px' }} />
                            <span>Quick Edit Price &amp; Plan</span>
                          </button>
                          <a
                            href="/pricing"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 12px',
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}
                          >
                            <Eye style={{ width: '14px', height: '14px' }} />
                            <span>Preview Live Page</span>
                          </a>
                        </div>
                      </div>

                      {/* Numbers Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Plan Category &amp; Tier</div>
                          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                            {activeCamp.plan_tier ? activeCamp.plan_tier.replace('_', ' ').toUpperCase() : 'STANDARD'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Live Offer Price</div>
                          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#16a34a', marginTop: '2px' }}>
                            {camp === 0 ? 'FREE' : `₹${camp.toLocaleString('en-IN')}`} <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>/ yr</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Regular Base Price</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#94a3b8', textDecoration: 'line-through', marginTop: '2px' }}>₹{reg.toLocaleString('en-IN')}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Customer Savings</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2563eb', marginTop: '2px' }}>Save ₹{sav.toLocaleString('en-IN')} ({pct}%)</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Trial Duration</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ea580c', marginTop: '2px' }}>{activeCamp.trial_days || 3} Days Free</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Campaigns Table Card */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', marginRight: '6px' }}>Filter Category:</span>
                      {[
                        { id: 'all', label: `All Plans (${campaigns.length})` },
                        { id: 'gmb', label: `⭐ Google Review & Standee (${campaigns.filter(c => c.category === 'gmb').length})` },
                        { id: 'billing', label: `🧾 Digital Billing POS (${campaigns.filter(c => c.category === 'billing' || !c.category).length})` },
                        { id: 'combo', label: `🚀 All-in-One Combos (${campaigns.filter(c => c.category === 'combo').length})` }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setCampaignCategoryFilter(cat.id);
                            campaignsTable.setCurrentPage(1);
                          }}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: campaignCategoryFilter === cat.id ? '800' : '600',
                            border: '1px solid',
                            borderColor: campaignCategoryFilter === cat.id ? '#2563eb' : '#e2e8f0',
                            backgroundColor: campaignCategoryFilter === cat.id ? '#eff6ff' : '#ffffff',
                            color: campaignCategoryFilter === cat.id ? '#1d4ed8' : '#64748b',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <TableSearchInput
                      value={campaignsTable.searchQuery}
                      onChange={campaignsTable.setSearchQuery}
                      placeholder="Search campaign, badge, category..."
                      width="260px"
                    />
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#4b5563', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '12px 16px' }}>#</th>
                          <SortableTh sortKey="campaign_name" currentSort={campaignsTable.sortConfig} onSort={campaignsTable.handleSort}>Campaign / Plan Name</SortableTh>
                          <SortableTh sortKey="category" currentSort={campaignsTable.sortConfig} onSort={campaignsTable.handleSort}>Category &amp; Tier</SortableTh>
                          <SortableTh sortKey="campaign_price" currentSort={campaignsTable.sortConfig} onSort={campaignsTable.handleSort}>Offer Price</SortableTh>
                          <SortableTh sortKey="regular_price" currentSort={campaignsTable.sortConfig} onSort={campaignsTable.handleSort}>Regular Price</SortableTh>
                          <SortableTh sortKey="trial_days" currentSort={campaignsTable.sortConfig} onSort={campaignsTable.handleSort}>Trial</SortableTh>
                          <SortableTh sortKey="badge_text" currentSort={campaignsTable.sortConfig} onSort={campaignsTable.handleSort}>Ribbon Badge</SortableTh>
                          <SortableTh sortKey="is_active" currentSort={campaignsTable.sortConfig} onSort={campaignsTable.handleSort}>Status</SortableTh>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(campaignsTable.items || []).length === 0 ? (
                          <tr>
                            <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                              {campaignsTable.searchQuery ? 'No campaigns match your search.' : 'No pricing campaigns found in this category.'}
                            </td>
                          </tr>
                        ) : (
                          (campaignsTable.items || []).map((camp, idx) => {
                            const cCat = camp.category || 'billing';
                            return (
                              <tr key={camp.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: camp.is_active ? '#f0fdf4' : '#ffffff' }}>
                                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{(campaignsTable.currentPage - 1) * campaignsTable.pageSize + idx + 1}</td>
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{camp.campaign_name}</div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{camp.headline}</div>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {cCat === 'gmb' && (
                                      <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', width: 'fit-content' }}>
                                        ⭐ GMB REVIEW
                                      </span>
                                    )}
                                    {cCat === 'combo' && (
                                      <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff', width: 'fit-content' }}>
                                        🚀 RETAIL COMBO
                                      </span>
                                    )}
                                    {cCat === 'billing' && (
                                      <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', width: 'fit-content' }}>
                                        🧾 BILLING POS
                                      </span>
                                    )}
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                                      {camp.plan_tier || 'standard'}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 16px', fontWeight: '800', color: '#16a34a', fontSize: '0.95rem' }}>
                                  {Number(camp.campaign_price) === 0 ? 'FREE' : `₹${Number(camp.campaign_price).toLocaleString('en-IN')}`}
                                </td>
                                <td style={{ padding: '12px 16px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                  ₹{Number(camp.regular_price).toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#ea580c' }}>
                                  {camp.trial_days || 3} Days
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#475569' }}>
                                  <span style={{ padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                    {camp.badge_text || '—'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <button
                                    onClick={() => handleToggleActiveCampaign(camp)}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      border: 'none',
                                      backgroundColor: camp.is_active ? '#dcfce7' : '#f1f5f9',
                                      color: camp.is_active ? '#166534' : '#64748b'
                                    }}
                                  >
                                    {camp.is_active ? '✓ Published (Active)' : 'Draft (Inactive)'}
                                  </button>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                    <button
                                      onClick={() => {
                                        setCampaignForm({
                                          campaign_name: camp.campaign_name,
                                          category: camp.category || 'billing',
                                          plan_tier: camp.plan_tier || 'growth',
                                          regular_price: camp.regular_price,
                                          campaign_price: camp.campaign_price,
                                          trial_days: camp.trial_days || 3,
                                          badge_text: camp.badge_text,
                                          headline: camp.headline,
                                          subheadline: camp.subheadline,
                                          is_active: camp.is_active ? 1 : 0,
                                          start_date: camp.start_date ? camp.start_date.split('T')[0] : '',
                                          end_date: camp.end_date ? camp.end_date.split('T')[0] : ''
                                        });
                                        setShowCampaignModal(camp);
                                      }}
                                      style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                                    >
                                      Edit
                                    </button>
                                    {campaigns.length > 1 && (
                                      <button
                                        onClick={() => handleDeleteCampaign(camp.id)}
                                        style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #fee2e2', backgroundColor: '#fff1f2', color: '#e11d48', fontSize: '0.75rem', cursor: 'pointer' }}
                                      >
                                        <Trash2 style={{ width: '13px', height: '13px' }} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Campaigns Table Pagination */}
                  <TablePagination
                    currentPage={campaignsTable.currentPage}
                    totalItems={campaignsTable.totalItems}
                    pageSize={campaignsTable.pageSize}
                    onPageChange={campaignsTable.setCurrentPage}
                    onPageSizeChange={campaignsTable.setPageSize}
                  />
                </div>
              </div>
            )}

            {/* TAB: GOOGLE REVIEW & GMB MANAGEMENT HUB */}
            {activeTab === 'gmb' && (
              <div>
                {/* Header & Sub-Tab Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 4px', color: '#0f172a' }}>
                      Google Business Profile &amp; Review Hubs
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                      Manage public review hubs, tabletop acrylic standees, and review streams across all tenant stores.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => handleOpenGmbModal()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: '#0284c7',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: '#ffffff',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      <Plus style={{ width: '16px', height: '16px' }} />
                      <span>Onboard GMB Location</span>
                    </button>
                  </div>
                </div>

                {/* Sub-tab Navigation */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'locations', label: 'Locations & Standees', count: gmbLocations.length, icon: MapPin },
                    { id: 'reviews', label: 'Live Reviews Stream', count: gmbReviews.length, icon: Star },
                    { id: 'feedbacks', label: 'Private Negative Feedback Funnel', count: gmbFeedbacks.length, icon: AlertTriangle }
                  ].map(st => {
                    const StIcon = st.icon;
                    const isSelected = gmbSubTab === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setGmbSubTab(st.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                          color: isSelected ? '#0369a1' : '#64748b',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <StIcon style={{ width: '14px', height: '14px' }} />
                        <span>{st.label}</span>
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          backgroundColor: isSelected ? '#bae6fd' : '#f1f5f9',
                          color: isSelected ? '#0369a1' : '#64748b'
                        }}>
                          {st.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* SUBTAB 1: LOCATIONS */}
                {gmbSubTab === 'locations' && (
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                      <TableSearchInput
                        value={gmbTable.searchQuery}
                        onChange={gmbTable.setSearchQuery}
                        placeholder="Search locations by title, slug, Place ID, category..."
                      />
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569' }}>
                            <SortableTh sortKey="id" currentSort={gmbTable.sortConfig} onSort={gmbTable.handleSort}>#</SortableTh>
                            <SortableTh sortKey="title" currentSort={gmbTable.sortConfig} onSort={gmbTable.handleSort}>Store &amp; GMB Location</SortableTh>
                            <SortableTh sortKey="slug" currentSort={gmbTable.sortConfig} onSort={gmbTable.handleSort}>Public Hub</SortableTh>
                            <th style={{ padding: '10px 12px', fontWeight: '700' }}>Place ID</th>
                            <SortableTh sortKey="average_rating" currentSort={gmbTable.sortConfig} onSort={gmbTable.handleSort}>Rating &amp; Reviews</SortableTh>
                            <th style={{ padding: '10px 12px', fontWeight: '700' }}>Theme</th>
                            <SortableTh sortKey="funnel_views" currentSort={gmbTable.sortConfig} onSort={gmbTable.handleSort}>Funnel Stats</SortableTh>
                            <th style={{ padding: '10px 12px', fontWeight: '700', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(gmbTable.items || []).length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                No GMB locations found. Click "+ Onboard GMB Location" to add one.
                              </td>
                            </tr>
                          ) : (
                            (gmbTable.items || []).map((loc, idx) => {
                              const themeObj = THEME_OPTIONS.find(t => t.id === loc.selected_theme) || THEME_OPTIONS[0];
                              return (
                                <tr key={loc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '12px', color: '#94a3b8' }}>
                                    {(gmbTable.currentPage - 1) * gmbTable.pageSize + idx + 1}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <div style={{ fontWeight: '800', color: '#0f172a' }}>{loc.title}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{loc.primary_category || 'Retail Store'}</div>
                                    {loc.store_name && (
                                      <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#eef2ff', color: '#4338ca', fontWeight: '700' }}>
                                        Store: {loc.store_name}
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <a
                                      href={`https://gmbreviews.retailnode.in/${loc.slug}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}
                                    >
                                      <span>/{loc.slug}</span>
                                      <ExternalLink style={{ width: '12px', height: '12px' }} />
                                    </a>
                                  </td>
                                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.72rem', color: '#475569' }}>
                                    {loc.place_id ? (
                                      <span title={loc.place_id} style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                        {loc.place_id.substring(0, 14)}...
                                      </span>
                                    ) : (
                                      <span style={{ color: '#cbd5e1' }}>Not set</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800', color: '#0f172a' }}>
                                      <Star style={{ width: '14px', height: '14px', fill: '#f59e0b', color: '#f59e0b' }} />
                                      <span>{Number(loc.average_rating || 0).toFixed(1)}</span>
                                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal' }}>
                                        ({loc.total_reviews || 0})
                                      </span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '6px', border: `1px solid ${themeObj.border}`, backgroundColor: '#ffffff' }}>
                                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: themeObj.accent }} />
                                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#334155' }}>{themeObj.name.split(' ')[0]}</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px' }}>
                                    <div style={{ fontSize: '0.75rem' }}>
                                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{loc.funnel_views || 0}</span> <span style={{ color: '#94a3b8' }}>views</span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#16a34a' }}>
                                      {loc.funnel_positive_redirects || 0} redirected &bull; {loc.funnel_private_feedbacks || 0} feedback
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    <a
                                      href={`https://gmbreviews.retailnode.in/standee/${loc.slug}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Print Acrylic Standee"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none', marginRight: '6px' }}
                                    >
                                      <Printer style={{ width: '13px', height: '13px', color: '#4f46e5' }} />
                                      <span>Standee</span>
                                    </a>
                                    <a
                                      href={`https://gmbreviews.retailnode.in/monthly-report/${loc.slug}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Monthly Audit Report PDF"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none', marginRight: '6px' }}
                                    >
                                      <FileText style={{ width: '13px', height: '13px', color: '#0284c7' }} />
                                      <span>Report</span>
                                    </a>
                                    <button
                                      onClick={() => handleOpenGmbModal(loc)}
                                      style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', marginRight: '6px' }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteGmbLocation(loc.id, loc.title)}
                                      style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #fee2e2', backgroundColor: '#fff1f2', color: '#e11d48', fontSize: '0.75rem', cursor: 'pointer' }}
                                    >
                                      <Trash2 style={{ width: '13px', height: '13px' }} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <TablePagination
                      currentPage={gmbTable.currentPage}
                      totalItems={gmbTable.totalItems}
                      pageSize={gmbTable.pageSize}
                      onPageChange={gmbTable.setCurrentPage}
                      onPageSizeChange={gmbTable.setPageSize}
                    />
                  </div>
                )}

                {/* SUBTAB 2: LIVE REVIEWS STREAM */}
                {gmbSubTab === 'reviews' && (
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    {/* Filters Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                      <TableSearchInput
                        value={reviewsTable.searchQuery}
                        onChange={reviewsTable.setSearchQuery}
                        placeholder="Search reviews by customer name, comment, location..."
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Rating Filter */}
                        <select
                          value={reviewFilterRating}
                          onChange={(e) => setReviewFilterRating(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.8rem', fontWeight: '600' }}
                        >
                          <option value="all">All Star Ratings</option>
                          <option value="5">⭐⭐⭐⭐⭐ 5 Stars Only</option>
                          <option value="4">⭐⭐⭐⭐ 4 Stars Only</option>
                          <option value="3">⭐⭐⭐ 3 Stars Only</option>
                          <option value="2">⭐⭐ 2 Stars Only</option>
                          <option value="1">⭐ 1 Star Only</option>
                        </select>

                        {/* Location Filter */}
                        <select
                          value={reviewFilterLocation}
                          onChange={(e) => setReviewFilterLocation(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.8rem', fontWeight: '600' }}
                        >
                          <option value="all">All Locations ({gmbLocations.length})</option>
                          {gmbLocations.map(l => (
                            <option key={l.id} value={l.id}>{l.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569' }}>
                            <SortableTh sortKey="id" currentSort={reviewsTable.sortConfig} onSort={reviewsTable.handleSort}>#</SortableTh>
                            <SortableTh sortKey="reviewer_name" currentSort={reviewsTable.sortConfig} onSort={reviewsTable.handleSort}>Reviewer</SortableTh>
                            <SortableTh sortKey="star_rating" currentSort={reviewsTable.sortConfig} onSort={reviewsTable.handleSort}>Rating</SortableTh>
                            <th style={{ padding: '10px 12px', fontWeight: '700' }}>Review &amp; Feedback</th>
                            <th style={{ padding: '10px 12px', fontWeight: '700' }}>Location</th>
                            <th style={{ padding: '10px 12px', fontWeight: '700' }}>Store Reply</th>
                            <SortableTh sortKey="review_created_at" currentSort={reviewsTable.sortConfig} onSort={reviewsTable.handleSort}>Date</SortableTh>
                            <th style={{ padding: '10px 12px', fontWeight: '700', textAlign: 'right' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(reviewsTable.items || []).length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                No reviews matching current filters.
                              </td>
                            </tr>
                          ) : (
                            (reviewsTable.items || []).map((rev, idx) => (
                              <tr key={rev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px', color: '#94a3b8' }}>
                                  {(reviewsTable.currentPage - 1) * reviewsTable.pageSize + idx + 1}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {rev.reviewer_photo_url ? (
                                      <img src={rev.reviewer_photo_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                                    ) : (
                                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.75rem', color: '#475569' }}>
                                        {rev.reviewer_name?.charAt(0) || 'U'}
                                      </div>
                                    )}
                                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{rev.reviewer_name || 'Anonymous'}</div>
                                  </div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    {[1, 2, 3, 4, 5].map(st => (
                                      <Star
                                        key={st}
                                        style={{
                                          width: '13px',
                                          height: '13px',
                                          fill: st <= (rev.star_rating || 5) ? '#f59e0b' : '#e2e8f0',
                                          color: st <= (rev.star_rating || 5) ? '#f59e0b' : '#e2e8f0'
                                        }}
                                      />
                                    ))}
                                  </div>
                                </td>
                                <td style={{ padding: '12px', maxWidth: '320px' }}>
                                  <div style={{ color: '#334155', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                    {rev.comment ? rev.comment : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Rating given without comment</span>}
                                  </div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4338ca', backgroundColor: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>
                                    {rev.location_title || `Location #${rev.location_id}`}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', maxWidth: '240px' }}>
                                  {rev.reply_comment ? (
                                    <div style={{ fontSize: '0.75rem', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e0f2fe' }}>
                                      {rev.reply_comment}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>No reply yet</span>
                                  )}
                                </td>
                                <td style={{ padding: '12px', color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                  {rev.review_created_at ? new Date(rev.review_created_at).toLocaleDateString('en-IN') : 'Recent'}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <button
                                    onClick={() => {
                                      setActiveReplyReview(rev);
                                      setReplyText(rev.reply_comment || '');
                                    }}
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      backgroundColor: rev.reply_comment ? '#f8fafc' : '#0284c7',
                                      color: rev.reply_comment ? '#0f172a' : '#ffffff',
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {rev.reply_comment ? 'Edit Reply' : 'Reply'}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <TablePagination
                      currentPage={reviewsTable.currentPage}
                      totalItems={reviewsTable.totalItems}
                      pageSize={reviewsTable.pageSize}
                      onPageChange={reviewsTable.setCurrentPage}
                      onPageSizeChange={reviewsTable.setPageSize}
                    />
                  </div>
                )}

                {/* SUBTAB 3: PRIVATE NEGATIVE FEEDBACK FUNNEL */}
                {gmbSubTab === 'feedbacks' && (
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#991b1b', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '10px 14px' }}>
                        🛡️ Protected Funnel: These 1-3 star grievances were intercepted on tabletop standees and prevented from being posted publicly to Google Maps. Use customer contact to resolve grievances.
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569' }}>
                            <SortableTh sortKey="id" currentSort={feedbacksTable.sortConfig} onSort={feedbacksTable.handleSort}>#</SortableTh>
                            <SortableTh sortKey="customer_name" currentSort={feedbacksTable.sortConfig} onSort={feedbacksTable.handleSort}>Customer &amp; Contact</SortableTh>
                            <th style={{ padding: '10px 12px', fontWeight: '700' }}>Location</th>
                            <SortableTh sortKey="rating" currentSort={feedbacksTable.sortConfig} onSort={feedbacksTable.handleSort}>Rating</SortableTh>
                            <th style={{ padding: '10px 12px', fontWeight: '700' }}>Private Feedback Details</th>
                            <SortableTh sortKey="is_resolved" currentSort={feedbacksTable.sortConfig} onSort={feedbacksTable.handleSort}>Resolution Status</SortableTh>
                            <SortableTh sortKey="created_at" currentSort={feedbacksTable.sortConfig} onSort={feedbacksTable.handleSort}>Date</SortableTh>
                            <th style={{ padding: '10px 12px', fontWeight: '700', textAlign: 'right' }}>WhatsApp Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(feedbacksTable.items || []).length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                No negative feedbacks submitted yet. 100% positive customer satisfaction.
                              </td>
                            </tr>
                          ) : (
                            (feedbacksTable.items || []).map((fb, idx) => (
                              <tr key={fb.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px', color: '#94a3b8' }}>
                                  {(feedbacksTable.currentPage - 1) * feedbacksTable.pageSize + idx + 1}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{fb.customer_name || 'Customer'}</div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{fb.customer_phone || 'No phone'}</div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4338ca', backgroundColor: '#eef2ff', padding: '2px 8px', borderRadius: '4px' }}>
                                    {fb.location_title || `Location #${fb.location_id}`}
                                  </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#fef2f2', color: '#b91c1c', fontWeight: '800' }}>
                                    <Star style={{ width: '12px', height: '12px', fill: '#ef4444', color: '#ef4444' }} />
                                    <span>{fb.rating} ★</span>
                                  </span>
                                </td>
                                <td style={{ padding: '12px', maxWidth: '300px' }}>
                                  <div style={{ color: '#334155', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                    {fb.feedback}
                                  </div>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: '9999px',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    backgroundColor: fb.is_resolved ? '#dcfce7' : '#fef3c7',
                                    color: fb.is_resolved ? '#166534' : '#b45309'
                                  }}>
                                    {fb.is_resolved ? 'Resolved' : 'Pending Resolution'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                  {fb.created_at ? new Date(fb.created_at).toLocaleDateString('en-IN') : 'Recent'}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  {fb.customer_phone && (
                                    <a
                                      href={`https://wa.me/91${fb.customer_phone.replace(/\D/g, '')}?text=Dear%20${encodeURIComponent(fb.customer_name || 'Customer')},%20we%20received%20your%20feedback%20regarding%20your%20visit%20and%20would%20love%20to%20help.`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #86efac', backgroundColor: '#f0fdf4', color: '#166534', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none' }}
                                    >
                                      <Smartphone style={{ width: '12px', height: '12px' }} />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <TablePagination
                      currentPage={feedbacksTable.currentPage}
                      totalItems={feedbacksTable.totalItems}
                      pageSize={feedbacksTable.pageSize}
                      onPageChange={feedbacksTable.setCurrentPage}
                      onPageSizeChange={feedbacksTable.setPageSize}
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB: USERS & STORE ACCESS DIRECTORY */}
            {activeTab === 'users' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 4px', color: '#0f172a' }}>
                      Users &amp; Store Access Directory
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                      Manage SuperAdmin and Merchant user credentials mapped across all tenant stores and review hubs.
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenUserModal()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      backgroundColor: '#4f46e5',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(79, 70, 229, 0.3)'
                    }}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    <span>Add User Account</span>
                  </button>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                    <TableSearchInput
                      value={usersTable.searchQuery}
                      onChange={usersTable.setSearchQuery}
                      placeholder="Search users by name, email, phone, role, store..."
                    />
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#475569' }}>
                          <SortableTh sortKey="id" currentSort={usersTable.sortConfig} onSort={usersTable.handleSort}>#</SortableTh>
                          <SortableTh sortKey="first_name" currentSort={usersTable.sortConfig} onSort={usersTable.handleSort}>User Name &amp; Contact</SortableTh>
                          <SortableTh sortKey="role" currentSort={usersTable.sortConfig} onSort={usersTable.handleSort}>Role</SortableTh>
                          <SortableTh sortKey="store_name" currentSort={usersTable.sortConfig} onSort={usersTable.handleSort}>Assigned Store</SortableTh>
                          <th style={{ padding: '10px 12px', fontWeight: '700' }}>Linked GMB Hub</th>
                          <SortableTh sortKey="created_at" currentSort={usersTable.sortConfig} onSort={usersTable.handleSort}>Joined Date</SortableTh>
                          <th style={{ padding: '10px 12px', fontWeight: '700', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(usersTable.items || []).length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                              No users found.
                            </td>
                          </tr>
                        ) : (
                          (usersTable.items || []).map((u, idx) => {
                            const isSuper = u.role === 'superadmin';
                            return (
                              <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px', color: '#94a3b8' }}>
                                  {(usersTable.currentPage - 1) * usersTable.pageSize + idx + 1}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ fontWeight: '800', color: '#0f172a' }}>
                                    {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email.split('@')[0]}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#475569' }}>{u.email}</div>
                                  {u.phone && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{u.phone}</div>}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: '9999px',
                                    fontSize: '0.72rem',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    backgroundColor: isSuper ? '#f3e8ff' : u.role === 'merchant_admin' ? '#e0e7ff' : '#f1f5f9',
                                    color: isSuper ? '#7e22ce' : u.role === 'merchant_admin' ? '#3730a3' : '#475569'
                                  }}>
                                    {u.role}
                                  </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                  {u.store_name ? (
                                    <div>
                                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{u.store_name}</div>
                                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {u.tenant_id}</div>
                                    </div>
                                  ) : (
                                    <span style={{ color: isSuper ? '#7e22ce' : '#94a3b8', fontStyle: 'italic', fontWeight: isSuper ? '700' : 'normal' }}>
                                      {isSuper ? 'All Stores (Platform SuperAdmin)' : 'Unassigned'}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  {u.gmb_title ? (
                                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '2px 8px', borderRadius: '4px' }}>
                                      {u.gmb_title}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>—</span>
                                  )}
                                </td>
                                <td style={{ padding: '12px', color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                  {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : 'Recent'}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <button
                                    onClick={() => handleOpenUserModal(u)}
                                    style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', marginRight: '6px' }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                    style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #fee2e2', backgroundColor: '#fff1f2', color: '#e11d48', fontSize: '0.75rem', cursor: 'pointer' }}
                                  >
                                    <Trash2 style={{ width: '13px', height: '13px' }} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <TablePagination
                    currentPage={usersTable.currentPage}
                    totalItems={usersTable.totalItems}
                    pageSize={usersTable.pageSize}
                    onPageChange={usersTable.setCurrentPage}
                    onPageSizeChange={usersTable.setPageSize}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: PROVISION NEW RETAIL STORE */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '520px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                Onboard New Retail Store
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Store / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Silks &amp; Sarees"
                  value={newStoreForm.store_name}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, store_name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Owner Phone
                  </label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={newStoreForm.store_phone}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, store_phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Initial Quota
                  </label>
                  <input
                    type="number"
                    value={newStoreForm.message_quota}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, message_quota: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Merchant Login Email
                </label>
                <input
                  type="email"
                  placeholder="owner@store.com"
                  value={newStoreForm.admin_email}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, admin_email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Plan Tier
                  </label>
                  <select
                    value={newStoreForm.plan_tier}
                    onChange={(e) => {
                      const tier = e.target.value;
                      const days = tier === 'trial' ? 3 : (tier === 'gmb_starter' ? 365 : 365);
                      const exp = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      setNewStoreForm({ ...newStoreForm, plan_tier: tier, plan_valid_until: exp });
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  >
                    <option value="trial">⏳ Trial (3 Days Free Evaluation)</option>
                    <option value="promotion">🎁 1-Year Free Promotional Grant</option>
                    <option value="growth">🧾 Growth Plan (₹6,000 / Year &bull; Reg. ₹9,000)</option>
                    <option value="gmb_pro">⭐ Google Review &amp; Local SEO Booster Pro (₹2,999 / Year)</option>
                    <option value="retail_combo">🚀 Retail Growth Combo (Billing + GMB • ₹7,999 / Year)</option>
                    <option value="gmb_starter">🏷️ GMB Standee Starter Kit (₹1,499)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Plan Valid Until
                  </label>
                  <input
                    type="date"
                    required
                    value={newStoreForm.plan_valid_until}
                    onChange={(e) => setNewStoreForm({ ...newStoreForm, plan_valid_until: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Temporary Password
                </label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={newStoreForm.admin_password}
                  onChange={(e) => setNewStoreForm({ ...newStoreForm, admin_password: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Provision Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOP-UP QUOTA */}
      {showQuotaModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '420px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.125rem', fontWeight: '800', color: '#0f172a' }}>
              Top-Up WhatsApp Credits
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
              Adding message quota for <strong>{showQuotaModal.store_name}</strong>
            </p>

            <form onSubmit={handleTopupQuota} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Credits to Add
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quotaAmount}
                  onChange={(e) => setQuotaAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '1rem', fontWeight: '700' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowQuotaModal(null)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Confirm Top-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAGE PLAN & VALIDITY */}
      {showPlanModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                  Store Plan &amp; License Validity
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {showPlanModal.store_name} &bull; Store ID #{showPlanModal.id}
                </span>
              </div>
              <button onClick={() => setShowPlanModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} style={{ display: 'grid', gap: '1.25rem' }}>
              {/* Quick Promotional Grant Banner */}
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#065f46' }}>
                    🎁 1-Year Free Promotional Subscription Grant
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#047857' }}>
                    Instantly grant 365 days of 100% free cloud billing &amp; smart CRM access.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 365);
                    setPlanForm({
                      ...planForm,
                      plan_tier: 'promotion',
                      plan_valid_until: d.toISOString().split('T')[0],
                      is_active: 1
                    });
                  }}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '7px 12px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(5, 150, 105, 0.2)'
                  }}
                >
                  Apply 1-Year Free
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Plan Subscription Tier
                </label>
                <select
                  value={planForm.plan_tier}
                  onChange={(e) => {
                    const val = e.target.value;
                    let newDate = planForm.plan_valid_until;
                    if (val === 'promotion' || val === 'growth' || val === 'gmb_pro' || val === 'retail_combo') {
                      const d = new Date();
                      d.setDate(d.getDate() + 365);
                      newDate = d.toISOString().split('T')[0];
                    } else if (val === 'trial') {
                      const d = new Date();
                      d.setDate(d.getDate() + 3);
                      newDate = d.toISOString().split('T')[0];
                    } else if (val === 'gmb_starter') {
                      const d = new Date();
                      d.setDate(d.getDate() + 365);
                      newDate = d.toISOString().split('T')[0];
                    }
                    setPlanForm({ ...planForm, plan_tier: val, plan_valid_until: newDate });
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  <option value="gmb_pro">⭐ Google Review &amp; Local SEO Booster Pro (₹2,999 / Year)</option>
                  <option value="retail_combo">🚀 Retail Growth Combo (Digital Billing + GMB Suite • ₹7,999 / Year)</option>
                  <option value="gmb_starter">🏷️ GMB Smart Standee Starter Kit (₹1,499)</option>
                  <option value="promotion">🎁 1-Year Free Promotional Subscription (365 Days Free • Special Grant)</option>
                  <option value="growth">🧾 Growth Plan (₹6,000 / Year &bull; Reg. ₹9,000)</option>
                  <option value="trial">⏳ Trial (3 Days Free Evaluation)</option>
                  <option value="enterprise">🏢 Enterprise Custom Unlimited</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Plan Expiry Date
                </label>
                <input
                  type="date"
                  required
                  value={planForm.plan_valid_until}
                  onChange={(e) => setPlanForm({ ...planForm, plan_valid_until: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.9rem', fontWeight: '600' }}
                />
              </div>

              {/* Quick Extension Buttons */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Quick 1-Click Plan Application &amp; Extension
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleExtendDays(365);
                      setPlanForm(prev => ({ ...prev, plan_tier: 'gmb_pro' }));
                    }}
                    style={{ padding: '8px 6px', borderRadius: '6px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    ⭐ +365d GMB Pro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExtendDays(365);
                      setPlanForm(prev => ({ ...prev, plan_tier: 'retail_combo' }));
                    }}
                    style={{ padding: '8px 6px', borderRadius: '6px', border: '1px solid #e9d5ff', backgroundColor: '#faf5ff', color: '#7e22ce', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    🚀 +365d Combo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExtendDays(365);
                      setPlanForm(prev => ({ ...prev, plan_tier: 'growth' }));
                    }}
                    style={{ padding: '8px 6px', borderRadius: '6px', border: '1px solid #c7d2fe', backgroundColor: '#eef2ff', color: '#4338ca', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    🧾 +365d Growth
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleExtendDays(365);
                      setPlanForm(prev => ({ ...prev, plan_tier: 'promotion' }));
                    }}
                    style={{ padding: '8px 6px', borderRadius: '6px', border: '1px solid #a7f3d0', backgroundColor: '#ecfdf5', color: '#065f46', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    🎁 +365d Promo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExtendDays(90)}
                    style={{ padding: '8px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    +90 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExtendDays(3);
                      setPlanForm(prev => ({ ...prev, plan_tier: 'trial' }));
                    }}
                    style={{ padding: '8px 6px', borderRadius: '6px', border: '1px solid #fed7aa', backgroundColor: '#fff7ed', color: '#c2410c', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    +3d Trial
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Account Status
                </label>
                <select
                  value={planForm.is_active}
                  onChange={(e) => setPlanForm({ ...planForm, is_active: parseInt(e.target.value, 10) })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                >
                  <option value={1}>Active &bull; Operational</option>
                  <option value={0}>Suspended &bull; Billing Disabled</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(null)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Save Plan &amp; Validity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE OR EDIT PRICING CAMPAIGN */}
      {showCampaignModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '580px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  {showCampaignModal === 'create' ? 'Create Pricing Campaign' : `Edit Campaign: ${showCampaignModal.campaign_name}`}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Changes will immediately update the live pricing page (/pricing) across the platform.
                </p>
              </div>
              <button onClick={() => setShowCampaignModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* 1-Click Quick Preset Buttons */}
            <div style={{ marginBottom: '1.25rem', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                1-Click Quick Fill Presets:
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setCampaignForm({
                    campaign_name: 'Google Review & Local SEO Booster Pro',
                    category: 'gmb',
                    plan_tier: 'gmb_pro',
                    regular_price: 5000,
                    campaign_price: 2999,
                    trial_days: 7,
                    badge_text: 'SAVE ₹2,001 (40% OFF)',
                    headline: 'Rank #1 on Google Maps. Automate 5-Star Reviews.',
                    subheadline: 'Acrylic QR Standee + AI Auto-Responder + Negative Review Shield for Retail Stores',
                    is_active: 1
                  })}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  ⭐ GMB Pro (₹2,999)
                </button>

                <button
                  type="button"
                  onClick={() => setCampaignForm({
                    campaign_name: 'Retail Growth Combo (Billing + GMB Suite)',
                    category: 'combo',
                    plan_tier: 'retail_combo',
                    regular_price: 14000,
                    campaign_price: 7999,
                    trial_days: 14,
                    badge_text: 'BEST VALUE (43% OFF)',
                    headline: 'Everything Retail: Digital Bills + 5-Star Google Reviews',
                    subheadline: 'Complete Retail OS: WhatsApp Receipts + GMB Smart QR Standee + Customer Retention CRM',
                    is_active: 1
                  })}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e9d5ff', backgroundColor: '#faf5ff', color: '#7e22ce', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  🚀 Retail Combo (₹7,999)
                </button>

                <button
                  type="button"
                  onClick={() => setCampaignForm({
                    campaign_name: 'Retail Launch Offer',
                    category: 'billing',
                    plan_tier: 'growth',
                    regular_price: 9000,
                    campaign_price: 6000,
                    trial_days: 3,
                    badge_text: 'SAVE ₹3,000 TODAY (33% OFF)',
                    headline: 'One Simple Price. All Features Included.',
                    subheadline: 'Complete Digital Billing & Smart CRM Utility for Indian Retailers',
                    is_active: 1
                  })}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', color: '#166534', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  🧾 Billing Growth (₹6,000)
                </button>

                <button
                  type="button"
                  onClick={() => setCampaignForm({
                    campaign_name: '1-Year Free Promotional Subscription',
                    category: 'billing',
                    plan_tier: 'promotion',
                    regular_price: 9000,
                    campaign_price: 0,
                    trial_days: 365,
                    badge_text: '100% FREE SPECIAL LAUNCH GRANT',
                    headline: '1-Year Free Digital Billing for Indian Retailers',
                    subheadline: 'Complimentary grant for early adopter merchant partners across India',
                    is_active: 1
                  })}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  🎁 1-Yr Free Promo (₹0)
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveCampaign} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Plan Category *
                  </label>
                  <select
                    value={campaignForm.category || 'billing'}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      let defaultTier = 'growth';
                      if (newCat === 'gmb') defaultTier = 'gmb_pro';
                      if (newCat === 'combo') defaultTier = 'retail_combo';
                      setCampaignForm({ ...campaignForm, category: newCat, plan_tier: defaultTier });
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem', fontWeight: '600' }}
                  >
                    <option value="gmb">⭐ Google Review &amp; Standee</option>
                    <option value="billing">🧾 Digital Billing POS</option>
                    <option value="combo">🚀 All-in-One Retail Combo</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Plan Tier ID *
                  </label>
                  <select
                    value={campaignForm.plan_tier || 'growth'}
                    onChange={(e) => setCampaignForm({ ...campaignForm, plan_tier: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem', fontWeight: '600' }}
                  >
                    <option value="gmb_pro">gmb_pro (Google Review Booster Pro)</option>
                    <option value="gmb_starter">gmb_starter (GMB Standee Starter Kit)</option>
                    <option value="retail_combo">retail_combo (Retail Growth Combo Suite)</option>
                    <option value="growth">growth (Digital Billing Growth Plan)</option>
                    <option value="promotion">promotion (1-Year Free Launch Promo)</option>
                    <option value="enterprise">enterprise (Custom Unlimited)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Review & Local SEO Booster Pro"
                  value={campaignForm.campaign_name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, campaign_name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Campaign Offer Price (₹ / Year) *
                  </label>
                  <input
                    type="number"
                    required
                    value={campaignForm.campaign_price}
                    onChange={(e) => {
                      const cPrice = Number(e.target.value);
                      const rPrice = Number(campaignForm.regular_price || 9000);
                      const sav = Math.max(0, rPrice - cPrice);
                      const pct = rPrice > 0 ? Math.round((sav / rPrice) * 100) : 0;
                      setCampaignForm({
                        ...campaignForm,
                        campaign_price: e.target.value,
                        badge_text: sav > 0 ? `SAVE ₹${sav.toLocaleString('en-IN')} TODAY (${pct}% OFF)` : 'OFFICIAL RETAIL PLAN'
                      });
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '2px solid #2563eb', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '1rem', fontWeight: '800' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '600' }}>Active price charged to stores</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Regular Base Price (₹ / Year)
                  </label>
                  <input
                    type="number"
                    required
                    value={campaignForm.regular_price}
                    onChange={(e) => setCampaignForm({ ...campaignForm, regular_price: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Shown as strikethrough comparison</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Free Trial Duration (Days)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={30}
                    value={campaignForm.trial_days}
                    onChange={(e) => setCampaignForm({ ...campaignForm, trial_days: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: '600' }}>Standard: 3 Days Free Trial</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Offer Ribbon Badge Text
                  </label>
                  <input
                    type="text"
                    value={campaignForm.badge_text}
                    onChange={(e) => setCampaignForm({ ...campaignForm, badge_text: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Headline on /pricing
                </label>
                <input
                  type="text"
                  value={campaignForm.headline}
                  onChange={(e) => setCampaignForm({ ...campaignForm, headline: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Subheadline Description
                </label>
                <textarea
                  rows={2}
                  value={campaignForm.subheadline}
                  onChange={(e) => setCampaignForm({ ...campaignForm, subheadline: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <input
                  type="checkbox"
                  id="campaign_is_active"
                  checked={Boolean(campaignForm.is_active)}
                  onChange={(e) => setCampaignForm({ ...campaignForm, is_active: e.target.checked ? 1 : 0 })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="campaign_is_active" style={{ fontSize: '0.82rem', fontWeight: '700', color: '#166534', cursor: 'pointer' }}>
                  Publish as Current Active Pricing Campaign (Live immediately on /pricing)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(null)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save style={{ width: '16px', height: '16px' }} />
                  <span>{showCampaignModal === 'create' ? 'Create & Publish Campaign' : 'Update Campaign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ONBOARD / EDIT GMB LOCATION */}
      {showGmbModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                  {showGmbModal === 'create' ? 'Onboard GMB Location & Standee Hub' : 'Edit GMB Location'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Public Hub URL: gmbreviews.retailnode.in/{gmbForm.slug || '[slug]'}
                </p>
              </div>
              <button onClick={() => setShowGmbModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveGmbLocation} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Business / Store Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Technfest IT Solutions"
                    value={gmbForm.title}
                    onChange={(e) => setGmbForm({ ...gmbForm, title: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Hub Slug (Unique URL Path) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. technfest"
                    value={gmbForm.slug}
                    onChange={(e) => setGmbForm({ ...gmbForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Linked Retail Store / Tenant
                  </label>
                  <select
                    value={gmbForm.tenant_id}
                    onChange={(e) => setGmbForm({ ...gmbForm, tenant_id: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Standalone / Not Linked to Store --</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.store_name} (ID: {t.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Primary Business Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software Company, Apparel Store"
                    value={gmbForm.primary_category}
                    onChange={(e) => setGmbForm({ ...gmbForm, primary_category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Google Place ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ChIJ..."
                    value={gmbForm.place_id}
                    onChange={(e) => setGmbForm({ ...gmbForm, place_id: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Direct Google Review URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://g.page/r/.../review"
                    value={gmbForm.google_review_url}
                    onChange={(e) => setGmbForm({ ...gmbForm, google_review_url: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={gmbForm.phone}
                    onChange={(e) => setGmbForm({ ...gmbForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    placeholder="919876543210"
                    value={gmbForm.whatsapp_number}
                    onChange={(e) => setGmbForm({ ...gmbForm, whatsapp_number: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Full Physical Address
                </label>
                <input
                  type="text"
                  placeholder="Shop No. 4, Main Road, Market Yard..."
                  value={gmbForm.address}
                  onChange={(e) => setGmbForm({ ...gmbForm, address: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Selected Theme Design (Choose from 10 Curated Palettes)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                  {THEME_OPTIONS.map(th => {
                    const isSelected = gmbForm.selected_theme === th.id;
                    return (
                      <div
                        key={th.id}
                        onClick={() => setGmbForm({ ...gmbForm, selected_theme: th.id })}
                        style={{
                          border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px',
                          backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: th.bg, border: `1px solid ${th.border}` }} />
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: th.accent }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: isSelected ? '800' : '600', color: isSelected ? '#0369a1' : '#334155' }}>
                          {th.name.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowGmbModal(null)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGmb}
                  style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save style={{ width: '16px', height: '16px' }} />
                  <span>{savingGmb ? 'Saving...' : showGmbModal === 'create' ? 'Onboard Location' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ONBOARD / EDIT USER ACCOUNT */}
      {showUserModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                {showUserModal === 'create' ? 'Create Platform & Store User' : 'Edit User Account'}
              </h3>
              <button onClick={() => setShowUserModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="Sagar"
                    value={userForm.first_name}
                    onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Mohite"
                    value={userForm.last_name}
                    onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="merchant@example.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    {showUserModal === 'create' ? 'Password *' : 'New Password (Optional)'}
                  </label>
                  <input
                    type="password"
                    required={showUserModal === 'create'}
                    placeholder={showUserModal === 'create' ? '••••••••' : 'Leave empty to keep'}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Role &amp; Privilege
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  >
                    <option value="merchant_admin">Merchant Admin (Store Manager)</option>
                    <option value="cashier">Cashier (Billing POS Only)</option>
                    <option value="superadmin">Platform SuperAdmin</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Assigned Retail Store
                  </label>
                  <select
                    value={userForm.tenant_id}
                    onChange={(e) => setUserForm({ ...userForm, tenant_id: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  >
                    <option value="">-- All Stores / None --</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.store_name} (ID: {t.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUserModal(null)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save style={{ width: '16px', height: '16px' }} />
                  <span>{savingUser ? 'Saving...' : showUserModal === 'create' ? 'Create User' : 'Update User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPLY TO GOOGLE REVIEW */}
      {activeReplyReview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '540px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                  Reply to Google Review
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Reviewer: {activeReplyReview.reviewer_name} &bull; {activeReplyReview.star_rating} Stars
                </p>
              </div>
              <button onClick={() => setActiveReplyReview(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '4px' }}>
                {[1, 2, 3, 4, 5].map(st => (
                  <Star
                    key={st}
                    style={{
                      width: '12px',
                      height: '12px',
                      fill: st <= (activeReplyReview.star_rating || 5) ? '#f59e0b' : '#e2e8f0',
                      color: st <= (activeReplyReview.star_rating || 5) ? '#f59e0b' : '#e2e8f0'
                    }}
                  />
                ))}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', fontStyle: activeReplyReview.comment ? 'normal' : 'italic' }}>
                "{activeReplyReview.comment || 'No written comment provided'}"
              </p>
            </div>

            <form onSubmit={handleSaveReviewReply} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Your Official Response
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Thank you for visiting us! We are thrilled to hear you had a great experience..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                />
              </div>

              {/* Quick Template Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Quick Response Templates
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setReplyText('Thank you so much for your kind words and 5-star rating! We look forward to serving you again soon.')}
                    style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#334155', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    ⭐ Friendly Gratitude: "Thank you so much for your kind words and 5-star rating!..."
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyText('Thank you for choosing us! We truly appreciate your feedback and hope to see you again soon.')}
                    style={{ textAlign: 'left', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#334155', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    🤝 Professional Appreciation: "Thank you for choosing us! We truly appreciate..."
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveReplyReview(null)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReply}
                  style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send style={{ width: '15px', height: '15px' }} />
                  <span>{savingReply ? 'Publishing...' : 'Publish Reply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
