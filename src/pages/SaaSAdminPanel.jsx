import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Clock
} from 'lucide-react';

export default function SaaSAdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stores');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [gateways, setGateways] = useState({});
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
  const [showCampaignModal, setShowCampaignModal] = useState(null); // null, 'create', or campaign object
  const [campaignForm, setCampaignForm] = useState({
    campaign_name: 'Retail Launch Offer',
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

      // 3. Action Logs
      const logsRes = await fetch('/api/v1/admin/action-logs', { headers });
      const logsData = await logsRes.json();
      if (logsData.success) {
        setActionLogs(logsData.data || []);
      }

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const filteredTenants = tenants.filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      t.store_name.toLowerCase().includes(q) ||
      (t.store_phone && t.store_phone.includes(q)) ||
      (t.store_email && t.store_email.toLowerCase().includes(q)) ||
      String(t.id).includes(q)
    );
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
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)' }}>
            <ShieldCheck style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.125rem', fontWeight: '800', margin: 0, color: '#0f172a', letterSpacing: '-0.01em' }}>
                RetailNode SaaS Command Center
              </h1>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#e0e7ff', color: '#4338ca', fontWeight: '800' }}>
                SUPERADMIN
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
              Cluster: 95.135.166.109 &bull; Billing Utility Microservice &bull; Engine: MySQL 8.0 + Redis
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
            { id: 'pricing', label: 'Pricing Campaigns & Offers', icon: Tag, count: campaigns.length },
            { id: 'logs', label: 'Live Action Logs', icon: Activity, count: actionLogs.length },
            { id: 'gateways', label: 'Global WABA Gateway Config', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ position: 'relative', width: '360px' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '10px', width: '16px', height: '16px', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Filter stores by name, email, phone, ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                    />
                  </div>

                  <button
                    onClick={loadPlatformData}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600' }}
                  >
                    <RefreshCw style={{ width: '14px', height: '14px' }} />
                    <span>Sync Directory</span>
                  </button>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '12px 16px' }}>Store ID &amp; Name</th>
                        <th style={{ padding: '12px 16px' }}>Plan &amp; Validity</th>
                        <th style={{ padding: '12px 16px' }}>Contact</th>
                        <th style={{ padding: '12px 16px' }}>API Token</th>
                        <th style={{ padding: '12px 16px' }}>Invoices</th>
                        <th style={{ padding: '12px 16px' }}>WhatsApp Quota</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>{t.store_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Store ID: #{t.id}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                textTransform: 'uppercase',
                                fontSize: '0.7rem',
                                fontWeight: '800',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: t.plan_tier === 'growth' ? '#eff6ff' : '#fff7ed',
                                color: t.plan_tier === 'growth' ? '#1d4ed8' : '#c2410c',
                                border: '1px solid currentColor'
                              }}>
                                {t.plan_tier === 'growth' ? 'Growth Plan' : (t.plan_tier === 'trial' ? 'Trial (3d)' : (t.plan_tier || 'trial'))}
                              </span>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: ACTION LOGS - Clean Modern Light Table */}
            {activeTab === 'logs' && (
              <div>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                      Real-Time Platform Action Audit Stream
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Showing latest {actionLogs.length} customer interactions
                    </span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '12px 16px' }}>Timestamp</th>
                        <th style={{ padding: '12px 16px' }}>Retail Store</th>
                        <th style={{ padding: '12px 16px' }}>Short ID</th>
                        <th style={{ padding: '12px 16px' }}>Action Trigger</th>
                        <th style={{ padding: '12px 16px' }}>Customer Phone</th>
                        <th style={{ padding: '12px 16px' }}>Metadata</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actionLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                            No action logs recorded yet.
                          </td>
                        </tr>
                      ) : (
                        actionLogs.map(log => (
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
                </div>
              </div>
            )}

            {/* TAB 3: GLOBAL GATEWAYS */}
            {activeTab === 'gateways' && (
              <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                    Global WABA Gateway &amp; SMS Fallback
                  </h3>
                  <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                    These system-wide credentials are used for stores that do not provide their own custom Meta WABA accounts.
                  </p>

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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <button
                        type="submit"
                        style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#4f46e5', color: '#ffffff', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                      >
                        Save Global Gateways
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
                      Control live prices on /pricing in real time. Create promotional campaigns, alter discount prices, and configure trial periods.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCampaignForm({
                        campaign_name: 'Retail Promotional Sale',
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
                      padding: '8px 16px',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(79, 70, 229, 0.3)'
                    }}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    <span>Create New Pricing Campaign</span>
                  </button>
                </div>

                {/* Live Active Campaign Spotlight Card */}
                {(() => {
                  const activeCamp = campaigns.find(c => c.is_active) || campaigns[0];
                  if (!activeCamp) return null;
                  const reg = Number(activeCamp.regular_price || 9000);
                  const camp = Number(activeCamp.campaign_price || 6000);
                  const sav = Math.max(0, reg - camp);
                  const pct = reg > 0 ? Math.round((sav / reg) * 100) : 33;
                  return (
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '2px solid #3b82f6',
                      padding: '1.75rem',
                      boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: '800', marginBottom: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }}></span>
                            <span>CURRENTLY LIVE ON /pricing</span>
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
                            <span>Quick Edit Price &amp; Campaign</span>
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
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Plan Name</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>Growth Plan</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Live Offer Price</div>
                          <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#16a34a', marginTop: '2px' }}>₹{camp.toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>/ yr</span></div>
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

                {/* Campaigns Table */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                      All Platform Pricing Campaigns ({campaigns.length})
                    </h3>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#4b5563', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 16px' }}>#</th>
                        <th style={{ padding: '12px 16px' }}>Campaign Name</th>
                        <th style={{ padding: '12px 16px' }}>Offer Price</th>
                        <th style={{ padding: '12px 16px' }}>Regular Price</th>
                        <th style={{ padding: '12px 16px' }}>Trial</th>
                        <th style={{ padding: '12px 16px' }}>Ribbon Badge</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                            Loading pricing campaigns...
                          </td>
                        </tr>
                      ) : (
                        campaigns.map((camp, idx) => (
                          <tr key={camp.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: camp.is_active ? '#f0fdf4' : '#ffffff' }}>
                            <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{idx + 1}</td>
                            <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                              {camp.campaign_name}
                              {camp.is_active ? (
                                <span style={{ marginLeft: '8px', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: '800' }}>
                                  ACTIVE OFFER
                                </span>
                              ) : null}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: '800', color: '#16a34a', fontSize: '0.95rem' }}>
                              ₹{Number(camp.campaign_price).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#94a3b8', textDecoration: 'line-through' }}>
                              ₹{Number(camp.regular_price).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: '600', color: '#ea580c' }}>
                              {camp.trial_days || 3} Days
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#475569' }}>
                              {camp.badge_text || '—'}
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
                        ))
                      )}
                    </tbody>
                  </table>
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
                      const days = tier === 'trial' ? 3 : 365;
                      const exp = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                      setNewStoreForm({ ...newStoreForm, plan_tier: tier, plan_valid_until: exp });
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                  >
                    <option value="trial">Trial (3 Days Free)</option>
                    <option value="growth">Growth Plan (₹6,000 / Year &bull; Reg. ₹9,000)</option>
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
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Plan Subscription Tier
                </label>
                <select
                  value={planForm.plan_tier}
                  onChange={(e) => setPlanForm({ ...planForm, plan_tier: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#0f172a', fontSize: '0.85rem' }}
                >
                  <option value="trial">Trial (3 Days Free)</option>
                  <option value="growth">Growth Plan (₹6,000 / Year &bull; Reg. ₹9,000)</option>
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
                  Quick Extend Validity
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleExtendDays(3);
                      setPlanForm(prev => ({ ...prev, plan_tier: 'trial' }));
                    }}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #fed7aa', backgroundColor: '#fff7ed', color: '#c2410c', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    +3d (Trial)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExtendDays(90);
                      setPlanForm(prev => ({ ...prev, plan_tier: 'growth' }));
                    }}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    +90 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExtendDays(365);
                      setPlanForm(prev => ({ ...prev, plan_tier: 'growth' }));
                    }}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #c7d2fe', backgroundColor: '#eef2ff', color: '#4338ca', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    +1 Year (Growth)
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

            <form onSubmit={handleSaveCampaign} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Retail Launch Offer, Festive Dhamaka Offer"
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
    </div>
  );
}
