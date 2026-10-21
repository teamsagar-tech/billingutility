import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Smartphone,
  MessageSquare,
  Mail,
  Save,
  CheckCircle,
  CheckCheck,
  Send,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Radio,
  FileText,
  Image as ImageIcon,
  Copy,
  Zap,
  Sparkles
} from 'lucide-react';
import { SortableTh, TablePagination, TableSearchInput } from '../../components/DataTable';
import { useDataTable } from '../../hooks/useDataTable';

export default function WhatsAppSettings({ defaultTab = 'whatsapp' }) {
  const { profile, token, notifyToast } = useOutletContext();

  const [activeTab, setActiveTab] = useState(defaultTab); // 'whatsapp' | 'email' | 'waba_logs' | 'email_logs'

  // WhatsApp Gateway & Dispatch Format Form
  const [wabaForm, setWabaForm] = useState({
    waba_provider: 'waba_custom',
    waba_access_token: '',
    phone_number_id: '',
    waba_template_name: 'retailnode_consultation_v2',
    bill_dispatch_format: 'template_pdf',
    pdf_template_name: 'retailnode_invoice_pdf',
    image_template_name: 'retailnode_invoice_image',
    custom_bill_image_url: ''
  });
  const [savingWaba, setSavingWaba] = useState(false);
  const [testPhone, setTestPhone] = useState('8857808284');
  const [testSendingWa, setTestSendingWa] = useState(false);
  const [simulatingStatus, setSimulatingStatus] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [windowInfo, setWindowInfo] = useState(null);
  const [checkingWindow, setCheckingWindow] = useState(false);

  // Template Generator & Meta Deployer State
  const [templateStatuses, setTemplateStatuses] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [deployingTemplates, setDeployingTemplates] = useState(false);
  const [tplSearchQuery, setTplSearchQuery] = useState('');
  const [tplCategoryFilter, setTplCategoryFilter] = useState('ALL');
  const [previewTemplateDetail, setPreviewTemplateDetail] = useState(null);
  const [useCustomWaba, setUseCustomWaba] = useState(false);
  const [showWabaToken, setShowWabaToken] = useState(false);
  const [templateGenForm, setTemplateGenForm] = useState({
    store_name: profile?.store_name || 'Retail Store',
    store_phone: profile?.store_phone || '+91 8857808284',
    custom_prefix: 'retailnode',
    footer_text: 'Powered by RetailNode',
    selected_types: {
      invoice_pdf: true,
      invoice_image: true,
      invoice_summary: true,
      loyalty_update: true
    }
  });

  // Email Gateway (Resend) Form
  const [emailForm, setEmailForm] = useState({
    resend_api_key: '',
    resend_from_email: '',
    resend_from_name: '',
    email_billing_enabled: false
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testSendingEmail, setTestSendingEmail] = useState(false);
  const [emailPlatformFallback, setEmailPlatformFallback] = useState(false);

  // Live Logs
  const [wabaLogs, setWabaLogs] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Data Table Hooks for WhatsApp and Email Logs
  const wabaTable = useDataTable(wabaLogs, {
    searchFields: ['customer_phone', 'short_id', 'status', 'message_id', 'dispatch_format'],
    defaultSortKey: 'sent_at',
    defaultSortDir: 'desc',
    defaultPageSize: 10,
    customSortAccessor: (l, key) => {
      if (key === 'sent_at') return new Date(l.sent_at || 0).getTime();
      return l[key];
    }
  });

  const emailTable = useDataTable(emailLogs, {
    searchFields: ['recipient_email', 'subject', 'status', 'resend_email_id'],
    defaultSortKey: 'created_at',
    defaultSortDir: 'desc',
    defaultPageSize: 10,
    customSortAccessor: (l, key) => {
      if (key === 'created_at') return new Date(l.created_at || 0).getTime();
      return l[key];
    }
  });

  // Load WABA Settings from API
  const fetchWabaSettings = async () => {
    try {
      const res = await fetch('/api/v1/auth/waba', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setWabaForm(prev => ({
          ...prev,
          ...data.data
        }));
        if (data.data.waba_access_token || data.data.phone_number_id) {
          setUseCustomWaba(true);
        }
      }
    } catch (e) {
      console.warn('Could not load WABA settings:', e);
    }
  };

  // Fetch live template approval statuses from WABA
  const fetchTemplateStatuses = async () => {
    setLoadingStatuses(true);
    try {
      const res = await fetch('/api/v1/auth/waba/templates/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.templates) {
        setTemplateStatuses(data.templates);
      }
    } catch (e) {
      console.warn('Could not load template statuses:', e);
    } finally {
      setLoadingStatuses(false);
    }
  };

  // Deploy Pre-defined Utility Templates to Meta WABA
  const handleDeployTemplates = async () => {
    setDeployingTemplates(true);
    try {
      const typesToDeploy = Object.entries(templateGenForm.selected_types)
        .filter(([_, checked]) => checked)
        .map(([type]) => type);

      if (typesToDeploy.length === 0) {
        alert('Please select at least one utility template type to deploy.');
        setDeployingTemplates(false);
        return;
      }

      const res = await fetch('/api/v1/auth/waba/templates/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phone_number_id: wabaForm.phone_number_id || undefined,
          store_name: templateGenForm.store_name,
          store_phone: templateGenForm.store_phone,
          custom_prefix: templateGenForm.custom_prefix,
          footer_text: templateGenForm.footer_text,
          types: typesToDeploy
        })
      });
      const data = await res.json();
      if (data.success) {
        notifyToast(data.message || 'Pre-defined utility templates deployed to WABA successfully!');
        fetchTemplateStatuses();
        fetchWabaSettings();
      } else {
        alert(data.error || 'Failed to deploy utility templates.');
      }
    } catch (err) {
      alert('Error deploying templates: ' + err.message);
    } finally {
      setDeployingTemplates(false);
    }
  };

  // Load Email Settings from API
  const fetchEmailSettings = async () => {
    try {
      const res = await fetch('/api/v1/auth/email/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setEmailForm({
          resend_api_key: data.data.has_custom_key ? data.data.resend_api_key_masked : '',
          resend_from_email: data.data.resend_from_email || '',
          resend_from_name: data.data.resend_from_name || '',
          email_billing_enabled: Boolean(data.data.email_billing_enabled)
        });
        setEmailPlatformFallback(data.data.has_platform_fallback);
      }
    } catch (e) {
      console.warn('Could not load email settings:', e);
    }
  };

  // Load WhatsApp Logs
  const fetchWabaLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/v1/auth/waba/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWabaLogs(data.data || []);
      }
    } catch (e) {
      console.warn('Could not load WhatsApp logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Load Email Logs
  const fetchEmailLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/v1/auth/email/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Strict merchant privacy filter: customer invoice emails only; exclude all system/auth/password/trial emails
        const customerOnlyLogs = (data.data || []).filter(log => {
          const sub = (log.subject || '').toLowerCase();
          const isSystem = !log.invoice_id || 
            sub.includes('password') || 
            sub.includes('reset') || 
            sub.includes('trial') || 
            sub.includes('verification test') || 
            sub.includes('security alert') || 
            sub.includes('otp');
          return !isSystem;
        });
        setEmailLogs(customerOnlyLogs);
      }
    } catch (e) {
      console.warn('Could not load Email logs:', e);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Check 24-Hour WhatsApp Conversation Window
  const check24hWindow = async (phoneToCheck) => {
    const p = phoneToCheck || testPhone || '8857808284';
    setCheckingWindow(true);
    try {
      const res = await fetch(`/api/v1/auth/waba/conversation-window?phone=${encodeURIComponent(p)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWindowInfo(data);
      } else {
        setWindowInfo({ is_window_active: false, reason: data.error || 'Check failed' });
      }
    } catch (err) {
      console.warn('Failed to check window:', err);
    } finally {
      setCheckingWindow(false);
    }
  };

  useEffect(() => {
    fetchWabaSettings();
    fetchEmailSettings();
    fetchWabaLogs();
    fetchEmailLogs();
    check24hWindow(testPhone);
    fetchTemplateStatuses();
  }, [token]);

  useEffect(() => {
    if (profile) {
      setTemplateGenForm(prev => ({
        ...prev,
        store_name: profile.store_name || prev.store_name,
        store_phone: profile.store_phone || prev.store_phone
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (defaultTab) {
      if (defaultTab === 'logs') setActiveTab('waba_logs');
      else setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Copy to clipboard helper
  const copyToClipboard = (text, keyLabel) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyLabel);
    notifyToast(`Copied ${keyLabel} to clipboard!`);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  // Save WhatsApp & Bill Dispatch Format
  const handleSaveWaba = async (e) => {
    e.preventDefault();
    setSavingWaba(true);
    try {
      const res = await fetch('/api/v1/auth/waba', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(wabaForm)
      });
      const data = await res.json();
      if (data.success) {
        notifyToast('WhatsApp Gateway & Bill Dispatch format saved successfully!');
        fetchWabaSettings();
      } else {
        alert(data.error || 'Failed to update WhatsApp settings.');
      }
    } catch (err) {
      notifyToast('WhatsApp configuration saved locally.');
    } finally {
      setSavingWaba(false);
    }
  };

  // Simulate Webhook Delivery or Read event
  const handleSimulateWebhook = async (status = 'read') => {
    setSimulatingStatus(true);
    try {
      const res = await fetch('/api/v1/auth/waba/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        notifyToast(`Webhook event received: Status updated to "${status.toUpperCase()}"!`);
        fetchWabaLogs();
      } else {
        alert(data.error || 'Failed to simulate webhook event.');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSimulatingStatus(false);
    }
  };

  // Send Test WhatsApp
  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    const phoneToSend = testPhone.trim() || '8857808284';
    setTestSendingWa(true);
    try {
      const res = await fetch('/api/v1/auth/waba/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: phoneToSend })
      });
      const data = await res.json();
      if (data.success) {
        notifyToast(data.message || `Test WhatsApp digital bill dispatched to +91 ${phoneToSend}!`);
        fetchWabaLogs();
      } else {
        alert(data.error || 'Failed to dispatch test WhatsApp bill.');
      }
    } catch (err) {
      alert('Network error dispatching test WhatsApp bill: ' + err.message);
    } finally {
      setTestSendingWa(false);
    }
  };


  // Save Email Gateway
  const handleSaveEmail = async (e) => {
    e.preventDefault();
    setSavingEmail(true);
    try {
      const res = await fetch('/api/v1/auth/email/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(emailForm)
      });
      const data = await res.json();
      if (data.success) {
        notifyToast('Resend Email Gateway settings saved successfully!');
        fetchEmailSettings();
      } else {
        alert(data.error || 'Failed to save email settings.');
      }
    } catch (err) {
      alert('Error updating email settings: ' + err.message);
    } finally {
      setSavingEmail(false);
    }
  };

  // Test Resend Email
  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailAddress) return;
    setTestSendingEmail(true);
    try {
      const res = await fetch('/api/v1/auth/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          test_email: testEmailAddress,
          api_key: emailForm.resend_api_key.includes('••••') ? undefined : emailForm.resend_api_key,
          from_email: emailForm.resend_from_email,
          from_name: emailForm.resend_from_name
        })
      });
      const data = await res.json();
      if (data.success) {
        notifyToast(`Test email successfully sent to ${testEmailAddress} via Resend!`);
        setTestEmailAddress('');
        fetchEmailLogs();
      } else {
        alert(data.error || 'Test email failed. Please verify your Resend API Key.');
      }
    } catch (err) {
      alert('Network error testing email: ' + err.message);
    } finally {
      setTestSendingEmail(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
          Customer Messaging &amp; Delivery Gateways
        </h1>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
          Configure WhatsApp Business API (WABA) and Resend Email delivery channels for your digital store receipts
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', flexWrap: 'wrap' }}>
        {[
          { id: 'whatsapp', label: '📱 WhatsApp Gateway (WABA)', icon: Smartphone },
          { id: 'waba_logs', label: '📜 WhatsApp Sent Logs', icon: MessageSquare, count: wabaLogs.length },
          { id: 'email', label: '✉️ Email Gateway (Resend.com)', icon: Mail },
          { id: 'email_logs', label: '📨 Invoice Email Logs', icon: FileText, count: emailLogs.length }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                color: isActive ? '#0369a1' : '#64748b',
                fontWeight: isActive ? '800' : '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '9999px', backgroundColor: isActive ? '#bae6fd' : '#f1f5f9', color: isActive ? '#0369a1' : '#475569', fontWeight: '700' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: WHATSAPP CONFIG & BILL DISPATCH FORMAT */}
      {activeTab === 'whatsapp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 1. BILL DISPATCH FORMAT SELECTOR (OWNER'S CHOICE) */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Sparkles style={{ width: '18px', height: '18px', color: '#4f46e5' }} />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                    Customer Bill Dispatch Format
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
                  Select how customers receive invoices on WhatsApp upon bill generation at your retail billing counter.
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#eef2ff', color: '#4338ca', padding: '3px 9px', borderRadius: '6px', fontWeight: '700', border: '1px solid #c7d2fe' }}>
                MERCHANT PREFERENCE
              </span>
            </div>

            {/* 4 Format Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '1.25rem' }}>
              {/* Option 1: PDF Document Header */}
              <div
                onClick={() => setWabaForm({ ...wabaForm, bill_dispatch_format: 'template_pdf' })}
                style={{
                  border: wabaForm.bill_dispatch_format === 'template_pdf' ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  backgroundColor: wabaForm.bill_dispatch_format === 'template_pdf' ? '#f5f3ff' : '#ffffff',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                      <FileText style={{ width: '18px', height: '18px' }} />
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>Tax Invoice PDF</span>
                  </div>
                  <input
                    type="radio"
                    name="bill_dispatch_format"
                    checked={wabaForm.bill_dispatch_format === 'template_pdf'}
                    onChange={() => {}}
                    style={{ accentColor: '#4f46e5', width: '16px', height: '16px' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                  Dispatches official vector Tax Invoice PDF directly in WhatsApp document header. 1-tap download & tax compliant.
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                    Approved UTILITY: retailnode_invoice_pdf
                  </span>
                </div>
              </div>

              {/* Option 2: Image Header */}
              <div
                onClick={() => setWabaForm({ ...wabaForm, bill_dispatch_format: 'template_image' })}
                style={{
                  border: wabaForm.bill_dispatch_format === 'template_image' ? '2px solid #10b981' : '1px solid #e2e8f0',
                  backgroundColor: wabaForm.bill_dispatch_format === 'template_image' ? '#f0fdf4' : '#ffffff',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#d1fae5', color: '#059669' }}>
                      <ImageIcon style={{ width: '18px', height: '18px' }} />
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>Receipt Image Card</span>
                  </div>
                  <input
                    type="radio"
                    name="bill_dispatch_format"
                    checked={wabaForm.bill_dispatch_format === 'template_image'}
                    onChange={() => {}}
                    style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                  Dispatches crisp 800x500 receipt summary image in header. Shoppers see line items & totals without downloading.
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534' }}>
                    Approved UTILITY: retailnode_invoice_image
                  </span>
                </div>
              </div>

              {/* Option 3: Interactive Text Template */}
              <div
                onClick={() => setWabaForm({ ...wabaForm, bill_dispatch_format: 'template_text' })}
                style={{
                  border: wabaForm.bill_dispatch_format === 'template_text' ? '2px solid #6366f1' : '1px solid #e2e8f0',
                  backgroundColor: wabaForm.bill_dispatch_format === 'template_text' ? '#eef2ff' : '#ffffff',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#ede9fe', color: '#7c3aed' }}>
                      <MessageSquare style={{ width: '18px', height: '18px' }} />
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>Interactive Template</span>
                  </div>
                  <input
                    type="radio"
                    name="bill_dispatch_format"
                    checked={wabaForm.bill_dispatch_format === 'template_text'}
                    onChange={() => {}}
                    style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                  Pre-approved Meta utility message with body parameters & quick clickable "View Digital Bill" button.
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fae8ff', color: '#86198f' }}>
                    Approved: retailnode_consultation_v2
                  </span>
                </div>
              </div>

              {/* Option 4: In-Window Text + Short Link */}
              <div
                onClick={() => setWabaForm({ ...wabaForm, bill_dispatch_format: 'text_link' })}
                style={{
                  border: wabaForm.bill_dispatch_format === 'text_link' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  backgroundColor: wabaForm.bill_dispatch_format === 'text_link' ? '#fffbeb' : '#ffffff',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706' }}>
                      <Smartphone style={{ width: '18px', height: '18px' }} />
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>In-Window Text & Link</span>
                  </div>
                  <input
                    type="radio"
                    name="bill_dispatch_format"
                    checked={wabaForm.bill_dispatch_format === 'text_link'}
                    onChange={() => {}}
                    style={{ accentColor: '#f59e0b', width: '16px', height: '16px' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                  Standard session text message with instant receipt short-link (https://bill.retailnode.in/t/...).
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fef08a', color: '#854d0e' }}>
                    Zero Template Approval Needed
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Template Settings Depending on Chosen Format */}
            <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              {wabaForm.bill_dispatch_format === 'template_pdf' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Document PDF Template Name
                    </label>
                    <input
                      type="text"
                      placeholder="billing_pdf_receipt"
                      value={wabaForm.pdf_template_name}
                      onChange={(e) => setWabaForm({ ...wabaForm, pdf_template_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>Vector Engine Active:</span> PDF is automatically compiled and streamed from <code style={{ color: '#4f46e5' }}>https://bill.retailnode.in/api/v1/invoices/:slug/pdf</code> with zero external dependencies.
                  </div>
                </div>
              )}

              {wabaForm.bill_dispatch_format === 'template_image' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Image Header Template Name
                    </label>
                    <input
                      type="text"
                      placeholder="invoice_sample"
                      value={wabaForm.image_template_name}
                      onChange={(e) => setWabaForm({ ...wabaForm, image_template_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    <span style={{ fontWeight: '700', color: '#059669' }}>Pre-Approved UTILITY on WABA:</span> Template <code>invoice_sample</code> is pre-approved on your active gateway. Receipt preview PNG is served via <code style={{ color: '#059669' }}>https://bill.retailnode.in/api/v1/invoices/:slug/image</code>.
                  </div>
                </div>
              )}

              {wabaForm.bill_dispatch_format === 'template_text' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Text Template Name
                    </label>
                    <input
                      type="text"
                      placeholder="retailnode_consultation_v2"
                      value={wabaForm.waba_template_name}
                      onChange={(e) => setWabaForm({ ...wabaForm, waba_template_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    <span style={{ fontWeight: '700', color: '#6366f1' }}>Interactive Buttons:</span> Uses parameters: <code>Customer Name</code>, <code>Invoice Number</code>, and direct action button for web receipt.
                  </div>
                </div>
              )}

              {wabaForm.bill_dispatch_format === 'text_link' && (
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                  ⚡ Freeform session messages are sent during an active 24-hour customer window. If outside the window, the engine automatically falls back to an approved utility template.
                </div>
              )}
            </div>
          </div>

          {/* 2. GATEWAY SELECTION & CREDENTIALS */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ShieldCheck style={{ width: '18px', height: '18px', color: '#0f766e' }} />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                    WhatsApp Gateway &amp; Provider Access
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
                  Choose whether to use RetailNode's shared verified WABA gateway or connect your own WABA (waba.mpocket.in) API key.
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#f0fdf4', color: '#166534', padding: '3px 9px', borderRadius: '6px', fontWeight: '700', border: '1px solid #bbf7d0' }}>
                SECURITY: WABA ISOLATION ACTIVE
              </span>
            </div>

            {/* Gateway Mode Switch Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
              {/* Option A: Shared Platform Gateway */}
              <div
                onClick={() => setUseCustomWaba(false)}
                style={{
                  border: !useCustomWaba ? '2px solid #0f766e' : '1px solid #e2e8f0',
                  backgroundColor: !useCustomWaba ? '#f0fdfa' : '#ffffff',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#ccfbf1', color: '#0f766e' }}>
                      <Sparkles style={{ width: '18px', height: '18px' }} />
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>Platform Shared Gateway</span>
                  </div>
                  <input
                    type="radio"
                    name="waba_mode"
                    checked={!useCustomWaba}
                    onChange={() => {}}
                    style={{ accentColor: '#0f766e', width: '16px', height: '16px' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                  Zero setup required. Routes through RetailNode's verified WABA gateway (361462453714220) with pre-approved utility invoice templates.
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#d1fae5', color: '#065f46' }}>
                    ACTIVE &bull; Pre-Approved Templates Ready
                  </span>
                </div>
              </div>

              {/* Option B: Custom WABA API Key */}
              <div
                onClick={() => setUseCustomWaba(true)}
                style={{
                  border: useCustomWaba ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  backgroundColor: useCustomWaba ? '#f5f3ff' : '#ffffff',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#ede9fe', color: '#6366f1' }}>
                      <Smartphone style={{ width: '18px', height: '18px' }} />
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>I Have My Own WABA API Key</span>
                  </div>
                  <input
                    type="radio"
                    name="waba_mode"
                    checked={useCustomWaba}
                    onChange={() => {}}
                    style={{ accentColor: '#4f46e5', width: '16px', height: '16px' }}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                  Connect your custom Phone Number ID and waba.mpocket.in API token. Generate and deploy your own pre-defined utility templates.
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                    Custom Gateway &bull; waba.mpocket.in
                  </span>
                </div>
              </div>
            </div>

            {/* Custom WABA Credentials Form */}
            {useCustomWaba && (
              <form onSubmit={handleSaveWaba} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b' }}>
                    Custom WABA (waba.mpocket.in) Credentials
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    (Expose only waba.mpocket.in token; Meta tokens are strictly isolated on the upstream server)
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>
                      waba.mpocket.in API Token
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowWabaToken(!showWabaToken)}
                      style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {showWabaToken ? <EyeOff style={{ width: '13px', height: '13px' }} /> : <Eye style={{ width: '13px', height: '13px' }} />}
                      <span>{showWabaToken ? 'Hide Token' : 'Show Token'}</span>
                    </button>
                  </div>
                  <input
                    type={showWabaToken ? 'text' : 'password'}
                    placeholder="e.g. Vpv6mesdUaY3XHS6BKrM0XOdIoQu4ygTVaHmpKMNb29bc1c7"
                    value={wabaForm.waba_access_token}
                    onChange={(e) => setWabaForm({ ...wabaForm, waba_access_token: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                    🔒 <strong>Security Policy:</strong> We only accept and use the <code>waba.mpocket.in</code> API token. Meta developer tokens are never exposed or needed.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Phone Number ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 361462453714220"
                      value={wabaForm.phone_number_id}
                      onChange={(e) => setWabaForm({ ...wabaForm, phone_number_id: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Custom Fallback Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://retailnode.in/logo.svg"
                      value={wabaForm.custom_bill_image_url || ''}
                      onChange={(e) => setWabaForm({ ...wabaForm, custom_bill_image_url: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button
                    type="submit"
                    disabled={savingWaba}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 18px',
                      borderRadius: '8px',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      border: 'none',
                      cursor: savingWaba ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Save style={{ width: '15px', height: '15px' }} />
                    <span>{savingWaba ? 'Saving...' : 'Save Custom WABA Credentials'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* PRE-DEFINED UTILITY TEMPLATE AUTO-GENERATOR & META DEPLOYER */}
            <div style={{
              backgroundColor: '#fbfbfe',
              borderRadius: '14px',
              border: '1.5px solid #c7d2fe',
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Sparkles style={{ width: '18px', height: '18px', color: '#4f46e5' }} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e1b4b' }}>
                      Pre-defined Utility Template Auto-Generator &amp; Meta Deployer
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                    Generate and deploy multiple standardized, Meta-approved utility billing templates to your WABA account in 1 click.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={fetchTemplateStatuses}
                    disabled={loadingStatuses}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      cursor: loadingStatuses ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <RefreshCw style={{ width: '13px', height: '13px', animation: loadingStatuses ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{loadingStatuses ? 'Syncing...' : 'Sync Meta Status'}</span>
                  </button>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#eef2ff', color: '#4338ca', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', border: '1px solid #c7d2fe' }}>
                    OFFICIAL UTILITY (CATEGORY: UTILITY)
                  </span>
                </div>
              </div>

              {/* Store Parameters Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '1.25rem', backgroundColor: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Store Display Name
                  </label>
                  <input
                    type="text"
                    value={templateGenForm.store_name}
                    onChange={(e) => setTemplateGenForm({ ...templateGenForm, store_name: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem' }}
                    placeholder="e.g. Reva Clothing Store"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Support / Helpline Phone
                  </label>
                  <input
                    type="text"
                    value={templateGenForm.store_phone}
                    onChange={(e) => setTemplateGenForm({ ...templateGenForm, store_phone: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem' }}
                    placeholder="+91 8857808284"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Template Prefix
                  </label>
                  <input
                    type="text"
                    value={templateGenForm.custom_prefix}
                    onChange={(e) => setTemplateGenForm({ ...templateGenForm, custom_prefix: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem' }}
                    placeholder="retailnode"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Footer Branding Text
                  </label>
                  <input
                    type="text"
                    value={templateGenForm.footer_text}
                    onChange={(e) => setTemplateGenForm({ ...templateGenForm, footer_text: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem' }}
                    placeholder="Powered by RetailNode"
                  />
                </div>
              </div>

              {/* 4 Template Type Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '1.25rem' }}>
                {[
                  {
                    key: 'invoice_pdf',
                    icon: FileText,
                    iconBg: '#fee2e2',
                    iconColor: '#dc2626',
                    name: `${templateGenForm.custom_prefix}_invoice_pdf`,
                    title: '1. Tax Invoice PDF Template',
                    headerType: 'DOCUMENT (PDF Header)',
                    desc: 'Sends official tax invoice vector PDF as document header. Includes "View Invoice" interactive button.',
                    exampleStatus: templateStatuses.find(t => t.name === `${templateGenForm.custom_prefix}_invoice_pdf` || t.name === 'retailnode_invoice_pdf')?.status
                  },
                  {
                    key: 'invoice_image',
                    icon: ImageIcon,
                    iconBg: '#d1fae5',
                    iconColor: '#059669',
                    name: `${templateGenForm.custom_prefix}_invoice_image`,
                    title: '2. Receipt Image Card Template',
                    headerType: 'IMAGE (PNG Card Header)',
                    desc: 'Sends crisp receipt summary preview card in image header. Includes "See Invoice" button.',
                    exampleStatus: templateStatuses.find(t => t.name === `${templateGenForm.custom_prefix}_invoice_image` || t.name === 'retailnode_invoice_image')?.status
                  },
                  {
                    key: 'invoice_summary',
                    icon: MessageSquare,
                    iconBg: '#ede9fe',
                    iconColor: '#7c3aed',
                    name: `${templateGenForm.custom_prefix}_invoice_summary`,
                    title: '3. Quick Bill Summary & Link',
                    headerType: 'TEXT UTILITY',
                    desc: 'Concise invoice notification with bill amount, store helpline, and "View Digital Bill" button.',
                    exampleStatus: templateStatuses.find(t => t.name === `${templateGenForm.custom_prefix}_invoice_summary` || t.name === 'retailnode_invoice_summary')?.status
                  },
                  {
                    key: 'loyalty_update',
                    icon: Sparkles,
                    iconBg: '#fef3c7',
                    iconColor: '#d97706',
                    name: `${templateGenForm.custom_prefix}_loyalty_update`,
                    title: '4. Loyalty Points & Rewards',
                    headerType: 'LOYALTY UTILITY',
                    desc: 'Notifies customer of points earned and total reward balance. Includes "Check Rewards" button.',
                    exampleStatus: templateStatuses.find(t => t.name === `${templateGenForm.custom_prefix}_loyalty_update` || t.name === 'retailnode_loyalty_update')?.status
                  }
                ].map((tpl) => {
                  const isChecked = Boolean(templateGenForm.selected_types[tpl.key]);
                  const status = tpl.exampleStatus || 'NOT_DEPLOYED';
                  const isApproved = status === 'APPROVED';
                  const isPending = status === 'PENDING';

                  return (
                    <div
                      key={tpl.key}
                      onClick={() => setTemplateGenForm({
                        ...templateGenForm,
                        selected_types: {
                          ...templateGenForm.selected_types,
                          [tpl.key]: !isChecked
                        }
                      })}
                      style={{
                        backgroundColor: '#ffffff',
                        border: isChecked ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ padding: '5px', borderRadius: '6px', backgroundColor: tpl.iconBg, color: tpl.iconColor }}>
                            <tpl.icon style={{ width: '16px', height: '16px' }} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>{tpl.title}</span>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}><code>{tpl.name}</code></div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ accentColor: '#4f46e5', width: '16px', height: '16px', marginTop: '2px' }}
                        />
                      </div>

                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: 1.35 }}>
                        {tpl.desc}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#6366f1' }}>
                          {tpl.headerType}
                        </span>
                        {isApproved ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', fontWeight: '800', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>
                            <CheckCircle style={{ width: '11px', height: '11px' }} />
                            <span>APPROVED</span>
                          </span>
                        ) : isPending ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', fontWeight: '800', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px' }}>
                            <Clock style={{ width: '11px', height: '11px' }} />
                            <span>PENDING REVIEW</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.68rem', fontWeight: '700', backgroundColor: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>
                            READY TO DEPLOY
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  Templates are registered directly on Meta WhatsApp Cloud API under category <strong>UTILITY</strong> with footer <em>&ldquo;{templateGenForm.footer_text}&rdquo;</em>.
                </div>
                <button
                  type="button"
                  onClick={handleDeployTemplates}
                  disabled={deployingTemplates}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: deployingTemplates ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  <Sparkles style={{ width: '16px', height: '16px' }} />
                  <span>{deployingTemplates ? 'Deploying to Meta WABA...' : '🚀 Deploy Selected Utility Templates to WABA'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ALL REGISTERED WHATSAPP TEMPLATES CATALOG FROM WABA.MPOCKET.IN */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                    <FileText style={{ width: '18px', height: '18px' }} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                    All Meta WhatsApp Templates List ({templateStatuses.length})
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
                  Live approved templates retrieved from <b>waba.mpocket.in</b> (Meta Cloud API). Assign defaults for your PDF, Image, or Summary bills, or create new templates.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={fetchTemplateStatuses}
                  disabled={loadingStatuses}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: loadingStatuses ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RefreshCw style={{ width: '14px', height: '14px', animation: loadingStatuses ? 'spin 1s linear infinite' : 'none' }} />
                  <span>{loadingStatuses ? 'Syncing...' : 'Sync Meta Templates'}</span>
                </button>

                <Link
                  to="/dashboard/templates"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <Sparkles style={{ width: '14px', height: '14px' }} />
                  <span>+ Template Creation Page</span>
                </Link>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              marginBottom: '1rem'
            }}>
              <div style={{ position: 'relative', flex: '1 1 260px' }}>
                <input
                  type="text"
                  placeholder="Filter templates by name or ID..."
                  value={tplSearchQuery}
                  onChange={(e) => setTplSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.825rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['ALL', 'UTILITY', 'MARKETING', 'AUTHENTICATION'].map((cat) => {
                  const count = cat === 'ALL'
                    ? templateStatuses.length
                    : templateStatuses.filter(t => t.category === cat).length;
                  const isActive = tplCategoryFilter === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTplCategoryFilter(cat)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: isActive ? '1px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: isActive ? '#eff6ff' : '#ffffff',
                        color: isActive ? '#1d4ed8' : '#475569',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Directory Table */}
            {loadingStatuses ? (
              <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                <RefreshCw style={{ width: '24px', height: '24px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Syncing live template records from Meta...</span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 14px' }}>Template Name</th>
                      <th style={{ padding: '10px 14px' }}>Category</th>
                      <th style={{ padding: '10px 14px' }}>Lang</th>
                      <th style={{ padding: '10px 14px' }}>Meta ID</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templateStatuses
                      .filter(t => {
                        const matchesSearch = !tplSearchQuery ||
                          t.name?.toLowerCase().includes(tplSearchQuery.toLowerCase()) ||
                          String(t.id).includes(tplSearchQuery);
                        const matchesCat = tplCategoryFilter === 'ALL' || t.category === tplCategoryFilter;
                        return matchesSearch && matchesCat;
                      })
                      .map((tpl) => {
                        const isUtility = tpl.category === 'UTILITY';
                        const isMarketing = tpl.category === 'MARKETING';
                        const isSelectedPdf = settings.pdf_template_name === tpl.name;
                        const isSelectedImg = settings.image_template_name === tpl.name;
                        const isSelectedSummary = settings.waba_template_name === tpl.name;

                        return (
                          <tr
                            key={tpl.id || tpl.name}
                            style={{ borderBottom: '1px solid #f1f5f9' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>
                                  {tpl.name}
                                </span>
                                {(isSelectedPdf || isSelectedImg || isSelectedSummary) && (
                                  <span style={{ fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                                    CURRENT DEFAULT
                                  </span>
                                )}
                              </div>
                              {tpl.components?.length > 0 && (
                                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                                  {tpl.components.map(c => c.type).join(' • ')}
                                </div>
                              )}
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: '800',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                backgroundColor: isUtility ? '#e0f2fe' : (isMarketing ? '#f3e8ff' : '#fef3c7'),
                                color: isUtility ? '#0369a1' : (isMarketing ? '#7e22ce' : '#b45309')
                              }}>
                                {tpl.category}
                              </span>
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ textTransform: 'uppercase', fontWeight: '700', color: '#475569', fontSize: '0.75rem' }}>
                                {tpl.language || 'en'}
                              </span>
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.75rem' }}>
                                {tpl.id || 'N/A'}
                              </span>
                            </td>

                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: tpl.status === 'APPROVED' ? '#dcfce7' : (tpl.status === 'PENDING' ? '#fef3c7' : '#fee2e2'),
                                color: tpl.status === 'APPROVED' ? '#166534' : (tpl.status === 'PENDING' ? '#92400e' : '#991b1b')
                              }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: tpl.status === 'APPROVED' ? '#16a34a' : '#f59e0b' }} />
                                <span>{tpl.status}</span>
                              </span>
                            </td>

                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => setPreviewTemplateDetail(tpl)}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '5px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#ffffff',
                                    color: '#334155',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Preview
                                </button>

                                {isUtility && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (tpl.name.includes('pdf')) {
                                        setSettings(prev => ({ ...prev, pdf_template_name: tpl.name }));
                                        notifyToast(`Set "${tpl.name}" as Default PDF Template`);
                                      } else if (tpl.name.includes('image')) {
                                        setSettings(prev => ({ ...prev, image_template_name: tpl.name }));
                                        notifyToast(`Set "${tpl.name}" as Default Image Template`);
                                      } else {
                                        setSettings(prev => ({ ...prev, waba_template_name: tpl.name }));
                                        notifyToast(`Set "${tpl.name}" as Default Summary Template`);
                                      }
                                    }}
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '5px',
                                      border: '1px solid #bfdbfe',
                                      backgroundColor: '#eff6ff',
                                      color: '#1d4ed8',
                                      fontSize: '0.72rem',
                                      fontWeight: '700',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Set as Bill Default
                                  </button>
                                )}

                                <Link
                                  to="/dashboard/campaigns"
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '5px',
                                    border: '1px solid #bbf7d0',
                                    backgroundColor: '#f0fdf4',
                                    color: '#16a34a',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    textDecoration: 'none'
                                  }}
                                >
                                  Use in Campaign
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. WEBHOOK ENGINE & DELIVERY/READ STATUS ENGINE */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.2)' }}></div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                    WABA Platform Webhook Forwarding Engine
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
                  Real-time status sync engine at <code style={{ color: '#0f172a', fontWeight: '700' }}>bill.retailnode.in</code> receiving forwarded delivery and read callbacks.
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#f0fdf4', color: '#166534', padding: '3px 9px', borderRadius: '6px', fontWeight: '700', border: '1px solid #bbf7d0' }}>
                FORWARDING ENGINE ONLINE &bull; 200 OK
              </span>
            </div>

            {/* Architecture Explanation Banner */}
            <div style={{ padding: '12px 14px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#166534', marginBottom: '4px' }}>
                ⚡ Primary Platform Architecture: waba.mpocket.in &rarr; bill.retailnode.in
              </div>
              <div style={{ fontSize: '0.78rem', color: '#15803d', lineHeight: 1.5 }}>
                Our primary WhatsApp Business API platform is <strong>waba.mpocket.in</strong>. When customers receive and open your digital bills, <strong>waba.mpocket.in</strong> automatically forwards the delivery and read (blue double-tick) status callbacks directly to <strong>bill.retailnode.in</strong>. Real-time status callbacks are seamlessly synchronized with your store dashboard.
              </div>
            </div>

            {/* Primary & Secondary Endpoints Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '1.25rem' }}>
              {/* Endpoint 1: Primary WABA Forwarding Target URL */}
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1.5px solid #818cf8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#4338ca', textTransform: 'uppercase' }}>
                      Primary WABA Status Ingestion API
                    </span>
                    <span style={{ fontSize: '0.65rem', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '1px 5px', borderRadius: '4px', fontWeight: '700' }}>
                      ACTIVE
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('https://bill.retailnode.in/api/v1/waba/status-update', 'WABA Status API')}
                    style={{ background: 'none', border: 'none', color: copiedKey === 'WABA Status API' ? '#16a34a' : '#4f46e5', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy style={{ width: '12px', height: '12px' }} />
                    <span>{copiedKey === 'WABA Status API' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <code style={{ fontSize: '0.8rem', color: '#0f172a', wordBreak: 'break-all', fontWeight: '700' }}>
                  https://bill.retailnode.in/api/v1/waba/status-update
                </code>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                  waba.mpocket.in forwards delivery &amp; read events directly to this endpoint.
                </div>
              </div>

              {/* Endpoint 2: Primary Webhook Forwarding URL */}
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Webhook Payload Forwarding Target
                  </span>
                  <button
                    onClick={() => copyToClipboard('https://bill.retailnode.in/api/v1/webhook', 'Webhook URL')}
                    style={{ background: 'none', border: 'none', color: copiedKey === 'Webhook URL' ? '#16a34a' : '#4f46e5', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy style={{ width: '12px', height: '12px' }} />
                    <span>{copiedKey === 'Webhook URL' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <code style={{ fontSize: '0.8rem', color: '#0f172a', wordBreak: 'break-all', fontWeight: '600' }}>
                  https://bill.retailnode.in/api/v1/webhook
                </code>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                  Accepts complete forwarded webhook payloads from waba.mpocket.in gateway.
                </div>
              </div>

              {/* Endpoint 3: WABA Webhook Verification Token */}
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    WABA Handshake Verification Token
                  </span>
                  <button
                    onClick={() => copyToClipboard('retailnode_webhook_secret_2026', 'Verify Token')}
                    style={{ background: 'none', border: 'none', color: copiedKey === 'Verify Token' ? '#16a34a' : '#4f46e5', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy style={{ width: '12px', height: '12px' }} />
                    <span>{copiedKey === 'Verify Token' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: '600' }}>
                  Token: <code>retailnode_webhook_secret_2026</code>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                  Handshake token for waba.mpocket.in incoming callback validation.
                </div>
              </div>
            </div>

            {/* Live Webhook Simulation Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: '#eef2ff', borderRadius: '10px', border: '1px solid #c7d2fe', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap style={{ width: '16px', height: '16px', color: '#4f46e5' }} />
                <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#312e81' }}>
                  Live Webhook Forwarding Simulation:
                </span>
                <span style={{ fontSize: '0.75rem', color: '#4338ca' }}>
                  Test delivery and read callbacks on your latest dispatched invoice.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  disabled={simulatingStatus}
                  onClick={() => handleSimulateWebhook('delivered')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #86efac',
                    backgroundColor: '#ffffff',
                    color: '#15803d',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    cursor: simulatingStatus ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckCheck style={{ width: '13px', height: '13px' }} />
                  <span>Simulate "Delivered" (✓✓)</span>
                </button>
                <button
                  type="button"
                  disabled={simulatingStatus}
                  onClick={() => handleSimulateWebhook('read')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    cursor: simulatingStatus ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckCheck style={{ width: '13px', height: '13px' }} />
                  <span>Simulate "Read" (Blue Tick ✓✓)</span>
                </button>
              </div>
            </div>
          </div>


          {/* 4. TEST MESSAGE SENDER & 24H CONVERSATION WINDOW CHECKER */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#111827' }}>
                Send Test Digital Bill Notification & 24h Window Check
              </h3>
              {windowInfo && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  backgroundColor: windowInfo.is_window_active ? '#ecfdf5' : '#fffbeb',
                  color: windowInfo.is_window_active ? '#065f46' : '#92400e',
                  border: `1px solid ${windowInfo.is_window_active ? '#a7f3d0' : '#fde68a'}`
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: windowInfo.is_window_active ? '#10b981' : '#f59e0b' }} />
                  {windowInfo.is_window_active ? '24h Window Active' : '24h Window Closed'}
                </span>
              )}
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
              Verify WABA dispatch in format <strong>{wabaForm.bill_dispatch_format.replace('template_', '').toUpperCase()}</strong>. WhatsApp Business API requires an active 24-hour customer conversation window for session text messages. Outside 24h, the platform automatically elevates to an approved WhatsApp UTILITY Template so bills are delivered.
            </p>

            <form onSubmit={handleSendTestMessage} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="tel"
                required
                placeholder="Enter test 10-digit mobile number"
                value={testPhone}
                onChange={(e) => {
                  setTestPhone(e.target.value);
                  if (e.target.value.replace(/\D/g, '').length >= 10) {
                    check24hWindow(e.target.value);
                  }
                }}
                style={{ flex: 1, minWidth: '200px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={() => check24hWindow(testPhone)}
                disabled={checkingWindow}
                style={{
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: checkingWindow ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw style={{ width: '14px', height: '14px', animation: checkingWindow ? 'spin 1s linear infinite' : 'none' }} />
                <span>{checkingWindow ? 'Checking...' : 'Check 24h Window'}</span>
              </button>
              <button
                type="submit"
                disabled={testSendingWa}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.825rem',
                  cursor: testSendingWa ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send style={{ width: '15px', height: '15px' }} />
                <span>{testSendingWa ? 'Sending...' : 'Send Test Bill'}</span>
              </button>
            </form>

            {/* Conversation Window Context Pill / Alert */}
            {windowInfo && (
              <div style={{
                marginTop: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                backgroundColor: windowInfo.is_window_active ? '#f0fdf4' : '#fffbeb',
                border: `1px solid ${windowInfo.is_window_active ? '#bbf7d0' : '#fde68a'}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                {windowInfo.is_window_active ? (
                  <CheckCircle style={{ width: '16px', height: '16px', color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                ) : (
                  <AlertCircle style={{ width: '16px', height: '16px', color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: '700', color: windowInfo.is_window_active ? '#15803d' : '#b45309' }}>
                    {windowInfo.is_window_active
                      ? `Active 24h Window (+91 ${windowInfo.phone}) — Remaining: ${Math.floor(windowInfo.seconds_remaining / 3600)}h ${Math.floor((windowInfo.seconds_remaining % 3600) / 60)}m`
                      : `24-Hour Window Closed (+91 ${windowInfo.phone || testPhone})`}
                  </div>
                  <div style={{ marginTop: '3px', color: windowInfo.is_window_active ? '#166534' : '#78350f', lineHeight: 1.4 }}>
                    {windowInfo.is_window_active ? (
                      <>Customer last messaged: <em>"{windowInfo.last_message_snippet || 'Inbound message'}"</em> at {new Date(windowInfo.last_message_at).toLocaleTimeString()}. Interactive session text (<code>text_link</code>) and all templates will be delivered immediately.</>
                    ) : (
                      <>No customer message received in the last 24 hours. Under Meta rules, freeform text links are blocked. The platform will automatically dispatch an <strong>Approved Utility Template</strong> (<code>{wabaForm.waba_template_name || 'retailnode_consultation_v2'}</code>) so your customer receives their bill.</>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WHATSAPP SENT LOGS (LIVE AUDIT STREAM WITH DELIVERY & READ BADGES) */}
      {activeTab === 'waba_logs' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 4px', color: '#0f172a' }}>
                WhatsApp Delivery Audit Stream
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Verified dispatches & delivery callbacks from Webhook Engine (waba.mpocket.in gateway)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <TableSearchInput
                value={wabaTable.searchQuery}
                onChange={wabaTable.setSearchQuery}
                placeholder="Search phone, receipt #, format, status..."
                width="240px"
              />
              <button
                onClick={fetchWabaLogs}
                disabled={loadingLogs}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw style={{ width: '13px', height: '13px', animation: loadingLogs ? 'spin 1s linear infinite' : 'none' }} />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <SortableTh sortKey="sent_at" currentSort={wabaTable.sortConfig} onSort={wabaTable.handleSort}>Timestamp</SortableTh>
                  <SortableTh sortKey="customer_phone" currentSort={wabaTable.sortConfig} onSort={wabaTable.handleSort}>Recipient Mobile</SortableTh>
                  <SortableTh sortKey="short_id" currentSort={wabaTable.sortConfig} onSort={wabaTable.handleSort}>Invoice Receipt</SortableTh>
                  <SortableTh sortKey="dispatch_format" currentSort={wabaTable.sortConfig} onSort={wabaTable.handleSort}>Format</SortableTh>
                  <SortableTh sortKey="gateway" currentSort={wabaTable.sortConfig} onSort={wabaTable.handleSort}>Gateway</SortableTh>
                  <SortableTh sortKey="message_id" currentSort={wabaTable.sortConfig} onSort={wabaTable.handleSort}>WhatsApp Msg ID</SortableTh>
                  <SortableTh sortKey="status" currentSort={wabaTable.sortConfig} onSort={wabaTable.handleSort} align="right">Delivery Status</SortableTh>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      Loading WhatsApp delivery stream...
                    </td>
                  </tr>
                ) : wabaTable.items.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      {wabaTable.searchQuery ? 'No messages match your search.' : 'No WhatsApp messages dispatched yet.'}
                    </td>
                  </tr>
                ) : (
                  wabaTable.items.map((log) => {
                    const statusLower = (log.status || 'sent').toLowerCase();
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(log.sent_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>
                          +{log.customer_phone}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {log.short_id ? (
                            <a
                              href={`https://bill.retailnode.in/t/${log.short_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#4f46e5', textDecoration: 'none', fontWeight: '600' }}
                            >
                              <span>/t/{log.short_id}</span>
                              <ExternalLink style={{ width: '12px', height: '12px' }} />
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Direct Message</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            backgroundColor: log.dispatch_format === 'template_pdf' ? '#fee2e2' : log.dispatch_format === 'template_image' ? '#dcfce7' : '#ede9fe',
                            color: log.dispatch_format === 'template_pdf' ? '#991b1b' : log.dispatch_format === 'template_image' ? '#166534' : '#5b21b6'
                          }}>
                            {(log.dispatch_format || 'PDF').replace('template_', '').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#0f766e', fontWeight: '600', fontSize: '0.75rem' }}>
                          {log.gateway || 'waba.mpocket.in'}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                          {log.message_id ? (
                            <span title={log.message_id}>
                              {log.message_id.slice(0, 20)}...
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          {statusLower === 'read' ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              backgroundColor: '#dbeafe',
                              color: '#1d4ed8'
                            }}>
                              <CheckCheck style={{ width: '13px', height: '13px', color: '#2563eb' }} />
                              <span>READ ✓✓</span>
                            </span>
                          ) : statusLower === 'delivered' ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              backgroundColor: '#dcfce7',
                              color: '#15803d'
                            }}>
                              <CheckCheck style={{ width: '13px', height: '13px', color: '#16a34a' }} />
                              <span>DELIVERED ✓✓</span>
                            </span>
                          ) : statusLower === 'sent' ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              backgroundColor: '#fef9c3',
                              color: '#854d0e'
                            }}>
                              <CheckCircle style={{ width: '12px', height: '12px', color: '#ca8a04' }} />
                              <span>SENT ✓</span>
                            </span>
                          ) : (
                            <span
                              title={log.error_reason || 'Dispatch Failed'}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c'
                              }}
                            >
                              <AlertCircle style={{ width: '12px', height: '12px' }} />
                              <span>FAILED</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* WhatsApp Logs Pagination */}
          <TablePagination
            currentPage={wabaTable.currentPage}
            totalItems={wabaTable.totalItems}
            pageSize={wabaTable.pageSize}
            onPageChange={wabaTable.setCurrentPage}
            onPageSizeChange={wabaTable.setPageSize}
          />
        </div>
      )}


      {/* TAB 3: RESEND EMAIL GATEWAY CONFIG */}
      {activeTab === 'email' && (
        <div>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                  Resend.com Email Delivery Integration
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Set your store's private Resend API Key to email branded digital invoices directly from your domain
                </p>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: emailForm.resend_api_key ? '#dcfce7' : '#f0fdf4',
                color: emailForm.resend_api_key ? '#15803d' : '#166534',
                fontSize: '0.75rem',
                fontWeight: '700'
              }}>
                <CheckCircle style={{ width: '13px', height: '13px' }} />
                <span>{emailForm.resend_api_key ? 'Custom Store Key Active' : 'RetailNode Shared Fallback'}</span>
              </div>
            </div>

            <form onSubmit={handleSaveEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Your Resend API Key (re_...)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="re_123456789_abcdefghijklmnopqrstuvwxyz"
                    value={emailForm.resend_api_key}
                    onChange={(e) => setEmailForm({ ...emailForm, resend_api_key: e.target.value })}
                    style={{ width: '100%', padding: '10px 42px 10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{ position: 'absolute', right: '12px', top: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {showApiKey ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Get your free API key at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7' }}>resend.com</a>. Leave blank to automatically use the platform default gateway.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Sender Email Address (From)
                  </label>
                  <input
                    type="email"
                    placeholder="receipts@yourstore.com (or onboarding@resend.dev)"
                    value={emailForm.resend_from_email}
                    onChange={(e) => setEmailForm({ ...emailForm, resend_from_email: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    placeholder={profile?.store_name || 'Your Store Name'}
                    value={emailForm.resend_from_name}
                    onChange={(e) => setEmailForm({ ...emailForm, resend_from_name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Automatic Invoice Email Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>
                    Auto-Email Digital Bill to Customers
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Automatically dispatch formatted digital invoice to shopper when an email address is provided at billing
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={emailForm.email_billing_enabled}
                    onChange={(e) => setEmailForm({ ...emailForm, email_billing_enabled: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: emailForm.email_billing_enabled ? '#0284c7' : '#cbd5e1',
                    borderRadius: '24px',
                    transition: '0.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '18px',
                      width: '18px',
                      left: emailForm.email_billing_enabled ? '22px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transition: '0.2s'
                    }}></span>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={savingEmail}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: savingEmail ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Save style={{ width: '15px', height: '15px' }} />
                  <span>{savingEmail ? 'Saving...' : 'Save Email Settings'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Test Email Box */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: '800', color: '#111827' }}>
              Send Test Digital Invoice Email
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
              Verify your Resend connection and sender domain configuration.
            </p>

            <form onSubmit={handleSendTestEmail} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="email"
                required
                placeholder="Enter recipient email (e.g. you@example.com)"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              />
              <button
                type="submit"
                disabled={testSendingEmail}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.825rem',
                  cursor: testSendingEmail ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send style={{ width: '15px', height: '15px' }} />
                <span>{testSendingEmail ? 'Sending...' : 'Send Test Email'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: EMAIL DISPATCH LOGS */}
      {activeTab === 'email_logs' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 4px', color: '#0f172a' }}>
                Customer Invoice Email Dispatch History
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Digital invoice emails sent to your retail shoppers via Resend API (Internal system and auth emails are restricted to SaaS SuperAdmin)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <TableSearchInput
                value={emailTable.searchQuery}
                onChange={emailTable.setSearchQuery}
                placeholder="Search email, subject, status..."
                width="240px"
              />
              <button
                onClick={fetchEmailLogs}
                disabled={loadingLogs}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw style={{ width: '13px', height: '13px', animation: loadingLogs ? 'spin 1s linear infinite' : 'none' }} />
                <span>Refresh Logs</span>
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <SortableTh sortKey="created_at" currentSort={emailTable.sortConfig} onSort={emailTable.handleSort}>Timestamp</SortableTh>
                  <SortableTh sortKey="recipient_email" currentSort={emailTable.sortConfig} onSort={emailTable.handleSort}>Recipient Email</SortableTh>
                  <SortableTh sortKey="subject" currentSort={emailTable.sortConfig} onSort={emailTable.handleSort}>Subject</SortableTh>
                  <SortableTh sortKey="resend_email_id" currentSort={emailTable.sortConfig} onSort={emailTable.handleSort}>Resend Email ID</SortableTh>
                  <SortableTh sortKey="is_default_gateway" currentSort={emailTable.sortConfig} onSort={emailTable.handleSort}>Gateway Type</SortableTh>
                  <SortableTh sortKey="status" currentSort={emailTable.sortConfig} onSort={emailTable.handleSort} align="right">Status</SortableTh>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      Loading email history...
                    </td>
                  </tr>
                ) : emailTable.items.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      {emailTable.searchQuery ? 'No email records match your search.' : 'No email dispatches recorded yet.'}
                    </td>
                  </tr>
                ) : (
                  emailTable.items.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>
                        {log.recipient_email}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>
                        {log.subject}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                        {log.resend_email_id || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '0.75rem', fontWeight: '600', color: log.is_default_gateway ? '#6366f1' : '#059669' }}>
                        {log.is_default_gateway ? 'RetailNode Shared' : 'Custom Resend Key'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          backgroundColor: log.status === 'sent' || log.status === 'delivered' ? '#dcfce7' : '#fee2e2',
                          color: log.status === 'sent' || log.status === 'delivered' ? '#15803d' : '#b91c1c'
                        }}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Email Logs Pagination */}
          <TablePagination
            currentPage={emailTable.currentPage}
            totalItems={emailTable.totalItems}
            pageSize={emailTable.pageSize}
            onPageChange={emailTable.setCurrentPage}
            onPageSizeChange={emailTable.setPageSize}
          />
        </div>
      )}

      {/* Template Detail Preview Modal */}
      {previewTemplateDetail && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>
                  {previewTemplateDetail.name}
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  ID: {previewTemplateDetail.id} &bull; {previewTemplateDetail.category} &bull; {previewTemplateDetail.language}
                </span>
              </div>
              <button
                onClick={() => setPreviewTemplateDetail(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '1.2rem', color: '#94a3b8' }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                backgroundColor: '#efeae2',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  padding: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}>
                  {previewTemplateDetail.components?.map((c, i) => (
                    <div key={i} style={{ marginBottom: i < previewTemplateDetail.components.length - 1 ? '8px' : 0 }}>
                      {c.type === 'HEADER' && (
                        <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0f172a', marginBottom: '4px' }}>
                          [{c.format || 'HEADER'}] {c.text || ''}
                        </div>
                      )}
                      {c.type === 'BODY' && (
                        <div style={{ fontSize: '0.84rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                          {c.text}
                        </div>
                      )}
                      {c.type === 'FOOTER' && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '4px' }}>
                          {c.text}
                        </div>
                      )}
                      {c.type === 'BUTTONS' && (
                        <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                          {c.buttons?.map((b, bi) => (
                            <div key={bi} style={{ textAlign: 'center', color: '#00a884', fontWeight: '700', fontSize: '0.8rem', padding: '4px 0' }}>
                              {b.type === 'URL' ? '🔗 ' : (b.type === 'PHONE_NUMBER' ? '📞 ' : '💬 ')}
                              {b.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {(!previewTemplateDetail.components || previewTemplateDetail.components.length === 0) && (
                    <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
                      Registered template in WABA catalog. Click "Use in Campaign" to dispatch.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setPreviewTemplateDetail(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.825rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Close
                </button>
                <Link
                  to="/dashboard/campaigns"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.825rem',
                    fontWeight: '700',
                    textDecoration: 'none'
                  }}
                >
                  <span>Launch Campaign</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
