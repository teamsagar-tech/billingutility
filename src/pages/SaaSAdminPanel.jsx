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
  Save 
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
  const [quotaAmount, setQuotaAmount] = useState('5000');
  const [toastMessage, setToastMessage] = useState('');

  // New store form state
  const [newStoreForm, setNewStoreForm] = useState({
    store_name: '',
    store_phone: '',
    store_email: '',
    admin_email: '',
    admin_password: '',
    plan_tier: 'pro',
    message_quota: 5000
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
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: #{t.id} &bull; Plan: {t.plan_tier || 'starter'}</div>
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
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              onClick={() => setShowQuotaModal(t)}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #c7d2fe', backgroundColor: '#eef2ff', color: '#4338ca', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', marginRight: '6px' }}
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
    </div>
  );
}
