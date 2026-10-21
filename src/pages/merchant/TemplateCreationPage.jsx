import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Send,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Image as ImageIcon,
  Tag,
  Gift,
  HelpCircle,
  Eye,
  Megaphone,
  CheckCircle
} from 'lucide-react';

export default function TemplateCreationPage() {
  const { profile, token, notifyToast } = useOutletContext() || {};
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'predefined' | 'directory'
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);

  // Filter & Search in Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState(null);

  // 1-Click Pre-defined Deployer State
  const [deploying, setDeploying] = useState(false);
  const [predefinedForm, setPredefinedForm] = useState({
    store_name: profile?.store_name || 'Retail Store',
    store_phone: profile?.store_phone || '+91 8857808284',
    custom_prefix: (profile?.store_name || 'retailnode').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15) || 'retailnode',
    footer_text: 'Powered by RetailNode',
    selected_types: {
      invoice_pdf: true,
      invoice_image: true,
      invoice_summary: true,
      loyalty_update: true
    }
  });

  // Custom Builder Form State
  const [submittingCustom, setSubmittingCustom] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '',
    category: 'MARKETING', // 'UTILITY' | 'MARKETING' | 'AUTHENTICATION'
    language: 'en',
    headerType: 'NONE', // 'NONE' | 'TEXT' | 'IMAGE' | 'DOCUMENT'
    headerText: '',
    headerMediaUrl: '',
    bodyText: '🌟 Special Festive Offer from {{1}}!\n\nDear Valued Customer,\nEnjoy FLAT {{2}}% OFF on all new arrivals this week!\n\nShow code {{3}} at billing counter to claim your discount.',
    sampleVariables: {
      '1': profile?.store_name || 'Retail Store',
      '2': '15',
      '3': 'FESTIVE15',
      '4': 'https://bill.retailnode.in'
    },
    footerText: 'Powered by RetailNode • Reply STOP to unsubscribe',
    buttonType: 'QUICK_REPLY', // 'NONE' | 'QUICK_REPLY' | 'URL' | 'PHONE'
    buttonText1: 'View Offer',
    buttonUrl1: 'https://bill.retailnode.in/t/{{1}}',
    buttonText2: 'Opt Out',
    buttonPhone: '+918857808284'
  });

  const firstInputRef = useRef(null);

  // Load all templates from WABA
  const fetchAllTemplates = async (isManual = false) => {
    if (isManual) setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch('/api/v1/auth/waba/templates/status', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.templates)) {
        setTemplates(data.templates);
        if (isManual) notifyToast?.(`✅ Synced ${data.templates.length} templates from Meta WhatsApp API!`);
      }
    } catch (err) {
      console.warn('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTemplates(false);
  }, [token]);

  // Sync profile data to forms when loaded
  useEffect(() => {
    if (profile?.store_name) {
      setPredefinedForm(prev => ({
        ...prev,
        store_name: profile.store_name,
        store_phone: profile.store_phone || prev.store_phone,
        custom_prefix: profile.store_name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)
      }));
      setCustomForm(prev => ({
        ...prev,
        sampleVariables: {
          ...prev.sampleVariables,
          '1': profile.store_name
        }
      }));
    }
  }, [profile]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Add variable chip to body text
  const insertVariableChip = () => {
    const matches = customForm.bodyText.match(/\{\{(\d+)\}\}/g) || [];
    const nextIndex = matches.length + 1;
    const insertion = `{{${nextIndex}}}`;
    setCustomForm(prev => ({
      ...prev,
      bodyText: prev.bodyText + (prev.bodyText.endsWith(' ') ? '' : ' ') + insertion,
      sampleVariables: {
        ...prev.sampleVariables,
        [String(nextIndex)]: `Sample ${nextIndex}`
      }
    }));
  };

  // Compute live rendered body text for preview
  const livePreviewBody = useMemo(() => {
    let rendered = customForm.bodyText;
    Object.keys(customForm.sampleVariables).forEach(idx => {
      const val = customForm.sampleVariables[idx] || `{{${idx}}}`;
      rendered = rendered.split(`{{${idx}}}`).join(val);
    });
    return rendered;
  }, [customForm.bodyText, customForm.sampleVariables]);

  // Submit Pre-defined Utility Templates
  const handleDeployPredefined = async (e) => {
    e.preventDefault();
    setDeploying(true);

    const selectedTypes = Object.keys(predefinedForm.selected_types).filter(
      k => predefinedForm.selected_types[k]
    );

    if (selectedTypes.length === 0) {
      alert('Please select at least one utility template type to deploy.');
      setDeploying(false);
      return;
    }

    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch('/api/v1/auth/waba/templates/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          store_name: predefinedForm.store_name,
          store_phone: predefinedForm.store_phone,
          custom_prefix: predefinedForm.custom_prefix,
          footer_text: predefinedForm.footer_text,
          types: selectedTypes
        })
      });

      const data = await res.json();
      if (data.success) {
        notifyToast?.('🚀 Pre-defined utility templates submitted to Meta successfully!');
        fetchAllTemplates(true);
        setActiveTab('directory');
      } else {
        alert(data.error || 'Failed to deploy utility templates.');
      }
    } catch (err) {
      alert('Error deploying utility templates: ' + err.message);
    } finally {
      setDeploying(false);
    }
  };

  // Submit Custom Template to Meta
  const handleSubmitCustomTemplate = async (e) => {
    e.preventDefault();

    const cleanName = customForm.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanName) {
      alert('Please enter a valid lowercase template name.');
      return;
    }

    if (!customForm.bodyText.trim()) {
      alert('Template body text is required.');
      return;
    }

    setSubmittingCustom(true);

    try {
      // Build Meta components array
      const components = [];

      // 1. Header component (if applicable)
      if (customForm.headerType === 'TEXT' && customForm.headerText.trim()) {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: customForm.headerText.trim()
        });
      } else if (customForm.headerType === 'IMAGE') {
        components.push({
          type: 'HEADER',
          format: 'IMAGE',
          example: {
            header_handle: [
              customForm.headerMediaUrl || 'https://bill.retailnode.in/retailnode-logo.svg'
            ]
          }
        });
      } else if (customForm.headerType === 'DOCUMENT') {
        components.push({
          type: 'HEADER',
          format: 'DOCUMENT',
          example: {
            header_handle: [
              customForm.headerMediaUrl || 'https://bill.retailnode.in/sample_invoice.pdf'
            ]
          }
        });
      }

      // 2. Body component with variables
      const bodyMatches = customForm.bodyText.match(/\{\{(\d+)\}\}/g) || [];
      const sampleVals = bodyMatches.map(m => {
        const idx = m.replace(/\D/g, '');
        return customForm.sampleVariables[idx] || `Sample ${idx}`;
      });

      const bodyComponent = {
        type: 'BODY',
        text: customForm.bodyText.trim()
      };

      if (sampleVals.length > 0) {
        bodyComponent.example = {
          body_text: [sampleVals]
        };
      }
      components.push(bodyComponent);

      // 3. Footer component
      if (customForm.footerText.trim()) {
        components.push({
          type: 'FOOTER',
          text: customForm.footerText.trim()
        });
      }

      // 4. Buttons component
      if (customForm.buttonType === 'QUICK_REPLY') {
        const buttons = [];
        if (customForm.buttonText1.trim()) {
          buttons.push({ type: 'QUICK_REPLY', text: customForm.buttonText1.trim() });
        }
        if (customForm.buttonText2.trim()) {
          buttons.push({ type: 'QUICK_REPLY', text: customForm.buttonText2.trim() });
        }
        if (buttons.length > 0) {
          components.push({ type: 'BUTTONS', buttons });
        }
      } else if (customForm.buttonType === 'URL') {
        components.push({
          type: 'BUTTONS',
          buttons: [
            {
              type: 'URL',
              text: customForm.buttonText1.trim() || 'Visit Link',
              url: customForm.buttonUrl1.trim() || 'https://bill.retailnode.in'
            }
          ]
        });
      } else if (customForm.buttonType === 'PHONE') {
        components.push({
          type: 'BUTTONS',
          buttons: [
            {
              type: 'PHONE_NUMBER',
              text: customForm.buttonText1.trim() || 'Call Store',
              phone_number: customForm.buttonPhone.trim() || '+918857808284'
            }
          ]
        });
      }

      const authToken = token || localStorage.getItem('token');
      const res = await fetch('/api/v1/auth/waba/templates/create-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: cleanName,
          category: customForm.category,
          language: customForm.language,
          components
        })
      });

      const data = await res.json();
      if (data.success) {
        notifyToast?.(`✅ Template "${cleanName}" submitted to Meta for review!`);
        fetchAllTemplates(true);
        setActiveTab('directory');
      } else {
        alert(data.error || 'Failed to submit template to Meta.');
      }
    } catch (err) {
      alert('Error creating template: ' + err.message);
    } finally {
      setSubmittingCustom(false);
    }
  };

  // Filtered Templates Directory
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = !searchQuery ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(t.id).includes(searchQuery);

      const matchesCat = categoryFilter === 'ALL' || t.category === categoryFilter;
      const matchesStat = statusFilter === 'ALL' || t.status === statusFilter;

      return matchesSearch && matchesCat && matchesStat;
    });
  }, [templates, searchQuery, categoryFilter, statusFilter]);

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER BAR */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        backgroundColor: '#ffffff',
        padding: '1.25rem 1.5rem',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#eef2ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                WhatsApp Templates &amp; Builder
              </h1>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '20px',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe'
              }}>
                Meta Cloud API Sync
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '3px 0 0' }}>
              Create standardized utility billing receipts or design custom marketing broadcast templates registered on <b>waba.mpocket.in</b>.
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchAllTemplates(true)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.825rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw style={{ width: '15px', height: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>{loading ? 'Syncing...' : 'Sync Meta Templates'}</span>
          </button>

          <Link
            to="/dashboard/campaigns"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#475569',
              fontSize: '0.825rem',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            <Megaphone style={{ width: '15px', height: '15px', color: '#2563eb' }} />
            <span>Campaigns Hub</span>
          </Link>

          <Link
            to="/dashboard/whatsapp"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '0.825rem',
              fontWeight: '700',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Smartphone style={{ width: '15px', height: '15px' }} />
            <span>WABA Gateway Config</span>
          </Link>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '1.25rem',
        backgroundColor: '#f1f5f9',
        padding: '5px',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        <button
          onClick={() => setActiveTab('builder')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'builder' ? '#2563eb' : 'transparent',
            color: activeTab === 'builder' ? '#ffffff' : '#475569',
            fontSize: '0.84rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Sparkles style={{ width: '16px', height: '16px' }} />
          <span>Custom Template Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('predefined')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'predefined' ? '#2563eb' : 'transparent',
            color: activeTab === 'predefined' ? '#ffffff' : '#475569',
            fontSize: '0.84rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Layers style={{ width: '16px', height: '16px' }} />
          <span>1-Click Utility Presets</span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'directory' ? '#2563eb' : 'transparent',
            color: activeTab === 'directory' ? '#ffffff' : '#475569',
            fontSize: '0.84rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <FileText style={{ width: '16px', height: '16px' }} />
          <span>All Templates Catalog ({templates.length})</span>
        </button>
      </div>

      {/* TAB 1: CUSTOM TEMPLATE BUILDER WITH LIVE MOBILE PREVIEW */}
      {activeTab === 'builder' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)',
          gap: '1.5rem',
          alignItems: 'start'
        }}>
          {/* Builder Form Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }}></div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Design WhatsApp Message Template
              </h2>
            </div>

            <form onSubmit={handleSubmitCustomTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              {/* Template Name & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Template Name * (lowercase &amp; underscores only)
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    required
                    placeholder="e.g. festive_diwali_discount"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({
                      ...customForm,
                      name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                    })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Meta Category *
                  </label>
                  <select
                    value={customForm.category}
                    onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#f8fafc', fontWeight: '600' }}
                  >
                    <option value="MARKETING">MARKETING (Promotions, Discounts, Offers)</option>
                    <option value="UTILITY">UTILITY (Billing Invoices, Order Status, Receipts)</option>
                    <option value="AUTHENTICATION">AUTHENTICATION (OTPs, Security Verification)</option>
                  </select>
                </div>
              </div>

              {/* Language & Header Format */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Language
                  </label>
                  <select
                    value={customForm.language}
                    onChange={(e) => setCustomForm({ ...customForm, language: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#f8fafc' }}
                  >
                    <option value="en">English (en)</option>
                    <option value="mr">Marathi (mr)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="gu">Gujarati (gu)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Header Type (Optional)
                  </label>
                  <select
                    value={customForm.headerType}
                    onChange={(e) => setCustomForm({ ...customForm, headerType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#f8fafc' }}
                  >
                    <option value="NONE">None (Text-only message)</option>
                    <option value="TEXT">Text Header (Bold title)</option>
                    <option value="IMAGE">Image Header (PNG / JPG preview)</option>
                    <option value="DOCUMENT">Document Header (PDF Attachment)</option>
                  </select>
                </div>
              </div>

              {/* Conditional Header Content */}
              {customForm.headerType === 'TEXT' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Header Text (Bold Headline)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EXCLUSIVE VIP INVITATION"
                    value={customForm.headerText}
                    onChange={(e) => setCustomForm({ ...customForm, headerText: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {(customForm.headerType === 'IMAGE' || customForm.headerType === 'DOCUMENT') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Sample Media URL for Meta Approval
                  </label>
                  <input
                    type="url"
                    placeholder={customForm.headerType === 'IMAGE' ? 'https://example.com/offer_banner.jpg' : 'https://example.com/sample_invoice.pdf'}
                    value={customForm.headerMediaUrl}
                    onChange={(e) => setCustomForm({ ...customForm, headerMediaUrl: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              {/* Body Text Editor */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155' }}>
                    Body Text * (Use variables like &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;)
                  </label>
                  <button
                    type="button"
                    onClick={insertVariableChip}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #bfdbfe',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus style={{ width: '12px', height: '12px' }} />
                    <span>Insert Variable Chip</span>
                  </button>
                </div>
                <textarea
                  rows="5"
                  required
                  value={customForm.bodyText}
                  onChange={(e) => setCustomForm({ ...customForm, bodyText: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', lineHeight: '1.45', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                  Character count: {customForm.bodyText.length} &bull; Markdown supported (*bold*, _italic_, ~strikethrough~)
                </div>
              </div>

              {/* Sample Variable Values */}
              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Sample Variable Values (Required for Meta Review)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {['1', '2', '3', '4'].map(num => (
                    <div key={num}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', marginBottom: '2px' }}>
                        Value for &#123;&#123;{num}&#125;&#125;
                      </label>
                      <input
                        type="text"
                        value={customForm.sampleVariables[num] || ''}
                        onChange={(e) => setCustomForm({
                          ...customForm,
                          sampleVariables: {
                            ...customForm.sampleVariables,
                            [num]: e.target.value
                          }
                        })}
                        placeholder={`e.g. Sample ${num}`}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Text */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Footer Text (Optional, max 60 chars)
                </label>
                <input
                  type="text"
                  maxLength={60}
                  placeholder="e.g. Powered by RetailNode • Reply STOP to opt out"
                  value={customForm.footerText}
                  onChange={(e) => setCustomForm({ ...customForm, footerText: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Buttons Configuration */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Interactive Action Buttons
                </label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  {['NONE', 'QUICK_REPLY', 'URL', 'PHONE'].map(bType => (
                    <label key={bType} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="buttonType"
                        checked={customForm.buttonType === bType}
                        onChange={() => setCustomForm({ ...customForm, buttonType: bType })}
                      />
                      <span>{bType.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>

                {customForm.buttonType === 'QUICK_REPLY' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Button 1 (e.g. View Offer)"
                      value={customForm.buttonText1}
                      onChange={(e) => setCustomForm({ ...customForm, buttonText1: e.target.value })}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem' }}
                    />
                    <input
                      type="text"
                      placeholder="Button 2 (e.g. Opt Out)"
                      value={customForm.buttonText2}
                      onChange={(e) => setCustomForm({ ...customForm, buttonText2: e.target.value })}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem' }}
                    />
                  </div>
                )}

                {customForm.buttonType === 'URL' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Button Label (e.g. View Invoice)"
                      value={customForm.buttonText1}
                      onChange={(e) => setCustomForm({ ...customForm, buttonText1: e.target.value })}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem' }}
                    />
                    <input
                      type="url"
                      placeholder="Destination URL (e.g. https://bill.retailnode.in/t/{{1}})"
                      value={customForm.buttonUrl1}
                      onChange={(e) => setCustomForm({ ...customForm, buttonUrl1: e.target.value })}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem' }}
                    />
                  </div>
                )}

                {customForm.buttonType === 'PHONE' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Button Label (e.g. Call Helpline)"
                      value={customForm.buttonText1}
                      onChange={(e) => setCustomForm({ ...customForm, buttonText1: e.target.value })}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem' }}
                    />
                    <input
                      type="tel"
                      placeholder="Phone number (e.g. +918857808284)"
                      value={customForm.buttonPhone}
                      onChange={(e) => setCustomForm({ ...customForm, buttonPhone: e.target.value })}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem' }}
                    />
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={submittingCustom}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    cursor: submittingCustom ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  {submittingCustom && <RefreshCw style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} />}
                  <span>{submittingCustom ? 'Submitting to Meta...' : '🚀 Submit Template to Meta for Approval'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Real-Time Mobile WhatsApp Mockup Preview */}
          <div style={{ position: 'sticky', top: '90px' }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 12px 24px -4px rgba(0,0,0,0.08)',
              maxWidth: '380px',
              margin: '0 auto'
            }}>
              {/* WhatsApp App Bar */}
              <div style={{
                backgroundColor: '#075e54',
                color: '#ffffff',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#128c7e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>
                  RN
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                    {profile?.store_name || 'RetailNode Store'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>
                    Official WhatsApp Business Account
                  </div>
                </div>
              </div>

              {/* Chat Canvas with WhatsApp Wallpaper */}
              <div style={{
                backgroundColor: '#efeae2',
                padding: '16px 12px',
                minHeight: '440px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start'
              }}>
                {/* Security Encryption Notice */}
                <div style={{
                  backgroundColor: '#ffeecd',
                  color: '#54656f',
                  fontSize: '0.68rem',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginBottom: '14px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  🔒 Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
                </div>

                {/* The WhatsApp Template Bubble */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  maxWidth: '92%',
                  alignSelf: 'flex-start',
                  borderTopLeftRadius: '2px'
                }}>
                  {/* Header Preview */}
                  {customForm.headerType === 'TEXT' && customForm.headerText && (
                    <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#111827', marginBottom: '6px' }}>
                      {customForm.headerText}
                    </div>
                  )}

                  {customForm.headerType === 'IMAGE' && (
                    <div style={{
                      height: '140px',
                      backgroundColor: '#e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      marginBottom: '8px',
                      backgroundImage: customForm.headerMediaUrl ? `url(${customForm.headerMediaUrl})` : 'none',
                      backgroundSize: 'cover'
                    }}>
                      {!customForm.headerMediaUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ImageIcon style={{ width: '20px', height: '20px' }} />
                          <span>Image Header Preview</span>
                        </div>
                      )}
                    </div>
                  )}

                  {customForm.headerType === 'DOCUMENT' && (
                    <div style={{
                      padding: '10px 12px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <FileText style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b' }}>TAX_INVOICE.pdf</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>PDF Document &bull; 1 page</div>
                      </div>
                    </div>
                  )}

                  {/* Body Text */}
                  <div style={{
                    fontSize: '0.84rem',
                    color: '#111827',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {livePreviewBody || 'Your template message will render here in real-time...'}
                  </div>

                  {/* Footer Text */}
                  {customForm.footerText && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '4px' }}>
                      {customForm.footerText}
                    </div>
                  )}

                  {/* Message Time and Meta Double Tick */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.65rem', color: '#8696a0' }}>
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#53bdeb' }}>✓✓</span>
                  </div>

                  {/* Buttons Section */}
                  {customForm.buttonType === 'QUICK_REPLY' && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                      {customForm.buttonText1 && (
                        <div style={{ padding: '8px', textAlign: 'center', color: '#00a884', fontWeight: '700', fontSize: '0.8rem', borderBottom: customForm.buttonText2 ? '1px solid #f1f5f9' : 'none' }}>
                          💬 {customForm.buttonText1}
                        </div>
                      )}
                      {customForm.buttonText2 && (
                        <div style={{ padding: '8px', textAlign: 'center', color: '#00a884', fontWeight: '700', fontSize: '0.8rem' }}>
                          💬 {customForm.buttonText2}
                        </div>
                      )}
                    </div>
                  )}

                  {customForm.buttonType === 'URL' && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', padding: '8px', textAlign: 'center', color: '#00a884', fontWeight: '700', fontSize: '0.8rem' }}>
                      🔗 {customForm.buttonText1 || 'Visit Link'}
                    </div>
                  )}

                  {customForm.buttonType === 'PHONE' && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', padding: '8px', textAlign: 'center', color: '#00a884', fontWeight: '700', fontSize: '0.8rem' }}>
                      📞 {customForm.buttonText1 || 'Call Store'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 1-CLICK PRE-DEFINED UTILITY TEMPLATES */}
      {activeTab === 'predefined' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
                Pre-defined Retail Utility Templates Auto-Generator
              </h2>
              <p style={{ margin: 0, fontSize: '0.825rem', color: '#64748b' }}>
                Standardized, Meta-compliant utility billing and loyalty templates that register to your WABA account in 1 click.
              </p>
            </div>
            <span style={{ fontSize: '0.72rem', backgroundColor: '#eef2ff', color: '#4338ca', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', border: '1px solid #c7d2fe' }}>
              OFFICIAL CATEGORY: UTILITY (GUARANTEED BILLING DELIVERY)
            </span>
          </div>

          <form onSubmit={handleDeployPredefined} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Branding Inputs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Store Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={predefinedForm.store_name}
                  onChange={(e) => setPredefinedForm({ ...predefinedForm, store_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Support / Helpline Phone *
                </label>
                <input
                  type="text"
                  required
                  value={predefinedForm.store_phone}
                  onChange={(e) => setPredefinedForm({ ...predefinedForm, store_phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Template Prefix (a-z, 0-9)
                </label>
                <input
                  type="text"
                  required
                  value={predefinedForm.custom_prefix}
                  onChange={(e) => setPredefinedForm({
                    ...predefinedForm,
                    custom_prefix: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                  })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Footer Branding Text
                </label>
                <input
                  type="text"
                  value={predefinedForm.footer_text}
                  onChange={(e) => setPredefinedForm({ ...predefinedForm, footer_text: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
              </div>
            </div>

            {/* Template Selection Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {[
                {
                  key: 'invoice_pdf',
                  icon: FileText,
                  iconBg: '#fee2e2',
                  iconColor: '#dc2626',
                  title: 'Tax Invoice PDF Bill Template',
                  name: `${predefinedForm.custom_prefix}_invoice_pdf`,
                  header: 'DOCUMENT HEADER (Single-page vector PDF)',
                  desc: 'Delivers full tax invoice PDF directly in document header. Includes "View Invoice" interactive short link.'
                },
                {
                  key: 'invoice_image',
                  icon: ImageIcon,
                  iconBg: '#d1fae5',
                  iconColor: '#059669',
                  title: 'Receipt Image Card Template',
                  name: `${predefinedForm.custom_prefix}_invoice_image`,
                  header: 'IMAGE HEADER (PNG receipt preview card)',
                  desc: 'Sends itemized bill summary snapshot preview. Fast loading on mobile screens.'
                },
                {
                  key: 'invoice_summary',
                  icon: MessageSquare,
                  iconBg: '#ede9fe',
                  iconColor: '#7c3aed',
                  title: 'Interactive Receipt Link & Summary',
                  name: `${predefinedForm.custom_prefix}_invoice_summary`,
                  header: 'TEXT UTILITY (High delivery rate)',
                  desc: 'Concise notification with bill amount, store name, helpline, and "View Digital Bill" button.'
                },
                {
                  key: 'loyalty_update',
                  icon: Sparkles,
                  iconBg: '#fef3c7',
                  iconColor: '#d97706',
                  title: 'Loyalty Points Balance Update',
                  name: `${predefinedForm.custom_prefix}_loyalty_update`,
                  header: 'LOYALTY REWARDS (Post-purchase engagement)',
                  desc: 'Notifies customer of points earned and total reward balance with "Check Rewards" button.'
                }
              ].map(tpl => {
                const isSelected = Boolean(predefinedForm.selected_types[tpl.key]);
                const existing = templates.find(t => t.name === tpl.name);
                const status = existing?.status || 'READY_TO_DEPLOY';

                return (
                  <div
                    key={tpl.key}
                    onClick={() => setPredefinedForm({
                      ...predefinedForm,
                      selected_types: {
                        ...predefinedForm.selected_types,
                        [tpl.key]: !isSelected
                      }
                    })}
                    style={{
                      backgroundColor: '#ffffff',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: tpl.iconBg, color: tpl.iconColor }}>
                          <tpl.icon style={{ width: '18px', height: '18px' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a' }}>{tpl.title}</div>
                          <code style={{ fontSize: '0.7rem', color: '#64748b' }}>{tpl.name}</code>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </div>

                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#2563eb' }}>
                      {tpl.header}
                    </div>

                    <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                      {tpl.desc}
                    </p>

                    <div style={{ marginTop: 'auto', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: status === 'APPROVED' ? '#dcfce7' : (status === 'PENDING' ? '#fef3c7' : '#f1f5f9'),
                        color: status === 'APPROVED' ? '#166534' : (status === 'PENDING' ? '#92400e' : '#475569')
                      }}>
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deploy CTA */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <button
                type="submit"
                disabled={deploying}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: deploying ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                }}
              >
                {deploying && <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                <span>{deploying ? 'Deploying to Meta WABA...' : '🚀 1-Click Deploy Selected Utility Templates'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ALL TEMPLATES CATALOG */}
      {activeTab === 'directory' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          {/* Filter Toolbar */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            backgroundColor: '#f8fafc'
          }}>
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search templates by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.825rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', fontWeight: '600' }}
              >
                <option value="ALL">All Categories ({templates.length})</option>
                <option value="UTILITY">Utility ({templates.filter(t => t.category === 'UTILITY').length})</option>
                <option value="MARKETING">Marketing ({templates.filter(t => t.category === 'MARKETING').length})</option>
                <option value="AUTHENTICATION">Authentication ({templates.filter(t => t.category === 'AUTHENTICATION').length})</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', fontWeight: '600' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING">PENDING</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          {/* Templates Table */}
          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center' }}>
              <RefreshCw style={{ width: '28px', height: '28px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>Loading Templates from Meta...</div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center' }}>
              <FileText style={{ width: '42px', height: '42px', color: '#cbd5e1', margin: '0 auto 10px' }} />
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>No Templates Found</div>
              <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '4px 0 14px' }}>
                No templates matched your search or filter criteria.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setCategoryFilter('ALL'); setStatusFilter('ALL'); }}
                style={{ padding: '7px 14px', borderRadius: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px' }}>Template Name</th>
                    <th style={{ padding: '10px 14px' }}>Category</th>
                    <th style={{ padding: '10px 14px' }}>Language</th>
                    <th style={{ padding: '10px 14px' }}>Meta Template ID</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map(tpl => {
                    const isUtility = tpl.category === 'UTILITY';
                    const isMarketing = tpl.category === 'MARKETING';
                    const isAuth = tpl.category === 'AUTHENTICATION';

                    return (
                      <tr
                        key={tpl.id || tpl.name}
                        style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                            {tpl.name}
                          </div>
                          {tpl.components?.length > 0 && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                              {tpl.components.map(c => c.type).join(' &bull; ')}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            padding: '3px 8px',
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.75rem' }}>
                              {tpl.id || 'N/A'}
                            </span>
                            {tpl.id && (
                              <button
                                onClick={() => copyToClipboard(tpl.id, tpl.id)}
                                title="Copy ID"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedKey === tpl.id ? '#16a34a' : '#94a3b8' }}
                              >
                                {copiedKey === tpl.id ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                              </button>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            padding: '3px 8px',
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
                              onClick={() => setSelectedPreviewTemplate(tpl)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#334155',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              <Eye style={{ width: '13px', height: '13px' }} />
                              <span>Preview</span>
                            </button>

                            <Link
                              to={`/dashboard/campaigns`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                color: '#16a34a',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                textDecoration: 'none'
                              }}
                            >
                              <Send style={{ width: '12px', height: '12px' }} />
                              <span>Use in Campaign</span>
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
      )}

      {/* TEMPLATE DETAILS PREVIEW MODAL */}
      {selectedPreviewTemplate && (
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
                  {selectedPreviewTemplate.name}
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  ID: {selectedPreviewTemplate.id} &bull; {selectedPreviewTemplate.category} &bull; {selectedPreviewTemplate.language}
                </span>
              </div>
              <button
                onClick={() => setSelectedPreviewTemplate(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
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
                  {selectedPreviewTemplate.components?.map((c, i) => (
                    <div key={i} style={{ marginBottom: i < selectedPreviewTemplate.components.length - 1 ? '8px' : 0 }}>
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
                  {(!selectedPreviewTemplate.components || selectedPreviewTemplate.components.length === 0) && (
                    <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
                      Registered template in WABA catalog. Click "Use in Campaign" to dispatch.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setSelectedPreviewTemplate(null)}
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
                  <ArrowRight style={{ width: '14px', height: '14px' }} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
