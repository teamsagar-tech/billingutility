import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Megaphone,
  Smartphone,
  MessageSquare,
  Gift,
  Cake,
  Heart,
  Flame,
  Award,
  Calendar,
  X,
  Send,
  CheckCircle,
  Plus,
  TrendingUp,
  Tag,
  ArrowUpRight,
  RefreshCw,
  Eye,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDisplayDate } from '../../utils/merchantUtils';

export default function CampaignsHub() {
  const { profile, token, notifyToast } = useOutletContext();

  const [campaignView, setCampaignView] = useState('hub'); // 'hub' | 'ledger'
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [customersCount, setCustomersCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  // Active Campaign Creation Modal
  const [activeCampaignModal, setActiveCampaignModal] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    channel: 'whatsapp', // 'whatsapp' | 'sms'
    audience: 'all', // 'all' | 'repeat' | 'inactive' | 'vip'
    templateName: 'deepak_sarees_invoice',
    messageText: '',
    couponCode: '',
    scheduleType: 'instant',
    scheduleDate: ''
  });

  // Detailed Sending Report Inspection Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Load campaigns, templates & customer count on mount
  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
    fetchCustomerStats();
  }, [token]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/v1/campaigns/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data || []);
      }
    } catch (e) {
      console.warn('Failed to fetch campaigns list:', e);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/v1/campaigns/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.templates) {
        setTemplates(data.templates);
        if (data.templates.length > 0) {
          setCampaignForm(prev => ({ ...prev, templateName: data.templates[0].name }));
        }
      }
    } catch (e) {
      console.warn('Failed to fetch templates:', e);
    }
  };

  const fetchCustomerStats = async () => {
    try {
      const res = await fetch('/api/v1/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomersCount(data.total || (data.customers ? data.customers.length : 0));
      }
    } catch (e) {
      console.warn('Failed to fetch customer stats:', e);
    }
  };

  const manualCampaignsList = [
    {
      id: 'whatsapp',
      title: 'WhatsApp Broadcast Campaigns',
      desc: 'Send rich media offer messages directly to customers via official WABA Gateway (waba.mpocket.in)',
      image: '/campaigns/whatsapp_campaign.jpg',
      defaultChannel: 'whatsapp',
      actionText: 'Launch WhatsApp Campaign'
    },
    {
      id: 'sms',
      title: 'SMS Offer Campaigns',
      desc: 'Deliver direct promotional and billing SMS notifications with short links to customer mobiles',
      image: '/campaigns/sms_camapign.jpg',
      defaultChannel: 'sms',
      actionText: 'Send SMS Campaign'
    },
    {
      id: 'coupon',
      title: 'Adhoc Discount Coupons',
      desc: 'Distribute adhoc promo coupons to customer wallets directly on WhatsApp and SMS',
      image: '/campaigns/coupon_campaign.jpg',
      defaultChannel: 'whatsapp',
      actionText: 'Distribute Coupons'
    }
  ];

  const automationCampaignsList = [
    {
      id: 'birthday',
      title: 'Birthday Celebrations',
      desc: 'Automate celebratory greetings & special birthday discount codes for registered customers',
      image: '/campaigns/birthday_campaign.jpg',
      defaultChannel: 'whatsapp',
      actionText: 'Configure Birthday Campaign'
    },
    {
      id: 'anniversary',
      title: 'Anniversary Milestones',
      desc: 'Deliver anniversary wishes & exclusive family milestone discount vouchers automatically',
      image: '/campaigns/anniversary_campaign.jpg',
      defaultChannel: 'whatsapp',
      actionText: 'Configure Anniversary Promo'
    },
    {
      id: 'festival',
      title: 'Festive Season Broadcast',
      desc: 'Celebrate Diwali, Dussehra, and festive seasons with automated digital invitations and paithani showcases',
      image: '/campaigns/festival_campaign.jpg',
      defaultChannel: 'whatsapp',
      actionText: 'Configure Festival Broadcast'
    },
    {
      id: 'win-back',
      title: 'Win Back Inactive Shoppers',
      desc: 'Re-engage shoppers who have not visited in the past 30 to 90 days with an exclusive incentive',
      image: '/campaigns/win_back_old_customers.jpg',
      defaultChannel: 'whatsapp',
      actionText: 'Launch Win-Back Promo'
    }
  ];

  const openCampaignModal = (campaign) => {
    setActiveCampaignModal(campaign);
    const storeName = profile?.store_name || 'Retail Store';
    let defaultMsg = '';

    if (campaign.id === 'whatsapp' || campaign.id === 'sms') {
      defaultMsg = `🌟 Special Festive Offer from *${storeName}*! 🌟\n\nDear Valued Customer,\nEnjoy FLAT 10% OFF on all new designer arrivals this week!\n\nShow this message at checkout or view store collection online.`;
    } else if (campaign.id === 'birthday') {
      defaultMsg = `🎂 Happy Birthday from *${storeName}*! 🎂\n\nWe wish you joy, prosperity and good health!\nAs a special gift, enjoy ₹200 OFF on your bill + 100 Bonus Loyalty Points.\n\nShow code: BDAY200 at checkout!`;
    } else if (campaign.id === 'anniversary') {
      defaultMsg = `💍 Happy Anniversary from *${storeName}*! 💖\n\nCelebrate your milestone with us. We have reserved an exclusive 15% discount for you and your family this week!`;
    } else if (campaign.id === 'festival') {
      defaultMsg = `🪔 Festive Greetings from *${storeName}*! 🪔\n\nCelebrate the auspicious festive season with our brand new designer collection. Special festive bundles available now!`;
    } else if (campaign.id === 'win-back') {
      defaultMsg = `We miss you at *${storeName}*! 🥰\n\nIt has been a while since your last visit. Drop by this weekend and get FLAT ₹150 OFF on your purchase!`;
    } else {
      defaultMsg = `Hello from *${storeName}*!\n\n${campaign.desc}\n\nVisit us today to explore the collection.`;
    }

    setCampaignForm({
      title: campaign.title,
      channel: campaign.defaultChannel || 'whatsapp',
      audience: 'all',
      templateName: templates.length > 0 ? templates[0].name : 'deepak_sarees_invoice',
      messageText: defaultMsg,
      couponCode: campaign.id === 'birthday' ? 'BDAY200' : 'FESTIVE10',
      scheduleType: 'instant',
      scheduleDate: ''
    });
  };

  const handleLaunchCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.messageText.trim()) {
      alert('Please enter campaign message text.');
      return;
    }

    setDispatching(true);
    try {
      const endpoint = campaignForm.channel === 'sms' ? '/api/v1/campaigns/send-sms' : '/api/v1/campaigns/create';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          campaignName: campaignForm.title,
          templateName: campaignForm.templateName,
          channel: campaignForm.channel,
          audience: campaignForm.audience,
          messageText: campaignForm.messageText,
          couponCode: campaignForm.couponCode,
          schedule: campaignForm.scheduleType === 'instant' ? 'now' : campaignForm.scheduleDate
        })
      });

      const data = await res.json();
      if (data.success) {
        notifyToast(data.message || 'Campaign launched successfully via WABA!');
        setActiveCampaignModal(null);
        fetchCampaigns();
        setCampaignView('ledger');
      } else {
        alert(data.error || 'Failed to dispatch campaign.');
      }
    } catch (err) {
      alert('Network error while launching campaign. Please check connection.');
    } finally {
      setDispatching(false);
    }
  };

  const inspectCampaignReport = async (campaignId) => {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/v1/campaigns/report/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedReport(data);
      } else {
        alert(data.error || 'Failed to load report.');
      }
    } catch (e) {
      alert('Failed to connect to WABA report service.');
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
            WABA Marketing Campaigns &amp; Customer Automation Hub
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
            Broadcast offers strictly via WABA Gateway (waba.mpocket.in) &amp; track verified real-time delivery reports
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Switcher: Catalog vs Ledger */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            <button
              onClick={() => setCampaignView('hub')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: campaignView === 'hub' ? '#ffffff' : 'transparent',
                color: campaignView === 'hub' ? '#0f766e' : '#64748b',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: campaignView === 'hub' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              🎯 Campaign Catalog
            </button>
            <button
              onClick={() => { setCampaignView('ledger'); fetchCampaigns(); }}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: campaignView === 'ledger' ? '#ffffff' : 'transparent',
                color: campaignView === 'ledger' ? '#0f766e' : '#64748b',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: campaignView === 'ledger' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              📊 Sending Reports &amp; Ledger ({campaigns.length})
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: '#065f46',
            fontWeight: '700'
          }}>
            <Smartphone style={{ width: '14px', height: '14px', color: '#059669' }} />
            <span>WABA Gateway: waba.mpocket.in</span>
          </div>
        </div>
      </div>

      {campaignView === 'hub' ? (
        <div>
          {/* SECTION 1: MANUAL CAMPAIGNS */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', margin: '0 0 2px' }}>
                Instant Broadcast Campaigns
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Broadcast promotional offers, festive greetings, and adhoc coupons to your real retail customer base
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {manualCampaignsList.map((c) => (
                <div
                  key={c.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ height: '140px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                    <img
                      src={c.image}
                      alt={c.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.style.backgroundColor = '#f0fdf4';
                      }}
                    />
                  </div>
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '800', color: '#111827' }}>
                        {c.title}
                      </h3>
                      <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45 }}>
                        {c.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => openCampaignModal(c)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#0f766e',
                        color: '#ffffff',
                        fontSize: '0.825rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus style={{ width: '15px', height: '15px' }} />
                      <span>{c.actionText}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: AUTOMATION & LIFECYCLE CAMPAIGNS */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', margin: '0 0 2px' }}>
                Automated Lifecycle Campaigns
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Set-and-forget marketing automations that drive repeat visits on birthdays, anniversaries &amp; dormant periods
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {automationCampaignsList.map((c) => (
                <div
                  key={c.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ height: '140px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                    <img
                      src={c.image}
                      alt={c.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.style.backgroundColor = '#ecfdf5';
                      }}
                    />
                  </div>
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '800', color: '#111827' }}>
                        {c.title}
                      </h3>
                      <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45 }}>
                        {c.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => openCampaignModal(c)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #0f766e',
                        backgroundColor: '#f0fdf4',
                        color: '#0f766e',
                        fontSize: '0.825rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus style={{ width: '15px', height: '15px' }} />
                      <span>{c.actionText}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* CAMPAIGN PERFORMANCE & SENDING REPORT LEDGER */
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: '0 0 2px', fontSize: '1.15rem', fontWeight: '800', color: '#111827' }}>
                WABA &amp; SMS Campaign Sending Reports
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Real-time delivery verification, read rates, and per-contact delivery ledgers
              </p>
            </div>
            <button
              onClick={fetchCampaigns}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.78rem',
                fontWeight: '600',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              <RefreshCw style={{ width: '13px', height: '13px' }} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Date</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Campaign Title</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Channel</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Recipients</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Delivered</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Read / Opened</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Cost</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Status</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
                      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                          <Megaphone style={{ width: '24px', height: '24px' }} />
                        </div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>
                          No Campaigns Dispatched Yet
                        </h4>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                          Launch an instant WhatsApp broadcast or automate customer greetings from the Catalog tab.
                        </p>
                        <button
                          onClick={() => setCampaignView('hub')}
                          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0f766e', color: '#ffffff', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Explore Campaign Catalog &rarr;
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  campaigns.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '0.8rem' }}>{formatDisplayDate(row.created_at)}</td>
                      <td style={{ padding: '12px', fontWeight: '800', color: '#0f172a' }}>{row.title}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.725rem',
                          fontWeight: '700',
                          backgroundColor: row.channel === 'whatsapp' ? '#dcfce7' : '#e0e7ff',
                          color: row.channel === 'whatsapp' ? '#15803d' : '#3730a3'
                        }}>
                          {row.channel === 'whatsapp' ? 'WhatsApp (WABA)' : 'SMS'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>{row.recipient_count}</td>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#059669' }}>
                        {row.delivered_count} ({row.recipient_count > 0 ? Math.round((row.delivered_count / row.recipient_count) * 100) : 0}%)
                      </td>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#2563eb' }}>
                        {row.read_count} ({row.delivered_count > 0 ? Math.round((row.read_count / row.delivered_count) * 100) : 0}%)
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>₹{Number(row.cost || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.725rem',
                          fontWeight: '700',
                          backgroundColor: row.status === 'completed' ? '#ecfdf5' : '#fefce8',
                          color: row.status === 'completed' ? '#065f46' : '#854d0e'
                        }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => inspectCampaignReport(row.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye style={{ width: '13px', height: '13px' }} />
                          <span>View Report</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {activeCampaignModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '820px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                  <img src={activeCampaignModal.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
                    {activeCampaignModal.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                    WABA Direct Gateway Dispatch &bull; Zero Graph API dependency
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCampaignModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#94a3b8' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleLaunchCampaign} style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Left Column: Form Settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Channel Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Dispatch Channel
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setCampaignForm({ ...campaignForm, channel: 'whatsapp' })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: campaignForm.channel === 'whatsapp' ? '2px solid #0f766e' : '1px solid #cbd5e1',
                        backgroundColor: campaignForm.channel === 'whatsapp' ? '#f0fdf4' : '#ffffff',
                        color: campaignForm.channel === 'whatsapp' ? '#0f766e' : '#64748b',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Smartphone style={{ width: '16px', height: '16px' }} />
                      <span>WhatsApp (WABA)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCampaignForm({ ...campaignForm, channel: 'sms' })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: campaignForm.channel === 'sms' ? '2px solid #0f766e' : '1px solid #cbd5e1',
                        backgroundColor: campaignForm.channel === 'sms' ? '#f0fdf4' : '#ffffff',
                        color: campaignForm.channel === 'sms' ? '#0f766e' : '#64748b',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <MessageSquare style={{ width: '16px', height: '16px' }} />
                      <span>Direct SMS</span>
                    </button>
                  </div>
                </div>

                {/* Template Selector (if WhatsApp) */}
                {campaignForm.channel === 'whatsapp' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>
                        Approved WABA Template ({templates.length})
                      </label>
                      <Link
                        to="/dashboard/templates"
                        style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}
                      >
                        + Create / Manage Templates
                      </Link>
                    </div>
                    <select
                      value={campaignForm.templateName}
                      onChange={(e) => {
                        const sel = templates.find(t => t.name === e.target.value);
                        setCampaignForm({
                          ...campaignForm,
                          templateName: e.target.value,
                          messageText: sel?.bodyText || campaignForm.messageText
                        });
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    >
                      <optgroup label="⭐ Marketing & Promotional Templates">
                        {templates.filter(t => t.category === 'MARKETING').map(t => (
                          <option key={t.name} value={t.name}>
                            {t.name} ({t.language}) — {t.displayName || 'Marketing'}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="⚡ Utility & Billing Templates">
                        {templates.filter(t => t.category === 'UTILITY').map(t => (
                          <option key={t.name} value={t.name}>
                            {t.name} ({t.language}) — {t.displayName || 'Utility'}
                          </option>
                        ))}
                      </optgroup>
                      {templates.some(t => t.category === 'AUTHENTICATION') && (
                        <optgroup label="🔒 Authentication Templates">
                          {templates.filter(t => t.category === 'AUTHENTICATION').map(t => (
                            <option key={t.name} value={t.name}>
                              {t.name} ({t.language})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}

                {/* Audience Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Target Customer Audience
                  </label>
                  <select
                    value={campaignForm.audience}
                    onChange={(e) => setCampaignForm({ ...campaignForm, audience: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="all">All Enrolled Customers ({customersCount > 0 ? customersCount : 'Active Store Shoppers'})</option>
                    <option value="repeat">Repeat Shoppers (2+ Visits / Lifetime Spends &gt; ₹1500)</option>
                    <option value="vip">VIP High Spenders (Spends &gt; ₹3000)</option>
                    <option value="inactive">Dormant Shoppers (No Visit in 30+ Days)</option>
                  </select>
                </div>

                {/* Message Text */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Message Content
                  </label>
                  <textarea
                    rows={4}
                    value={campaignForm.messageText}
                    onChange={(e) => setCampaignForm({ ...campaignForm, messageText: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Action Buttons */}
                <button
                  type="submit"
                  disabled={dispatching}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    border: 'none',
                    cursor: dispatching ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  {dispatching ? (
                    <span>Dispatching via WABA...</span>
                  ) : (
                    <>
                      <Send style={{ width: '16px', height: '16px' }} />
                      <span>Launch Campaign Broadcast</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Live Message Preview */}
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Live Message Preview
                </span>

                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  padding: '1rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  flex: 1
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a' }}>
                      {profile?.store_name || 'Retail Store'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: '0 0 12px' }}>
                    {campaignForm.messageText}
                  </p>

                  <div style={{ padding: '8px 12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px dashed #86efac', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#166534' }}>
                      Promo Code: {campaignForm.couponCode || 'FESTIVE10'}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#64748b' }}>
                  &bull; Gateway: <strong>waba.mpocket.in</strong><br />
                  &bull; Fallback: RetailNode Default Shared Gateway
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED SENDING REPORT MODAL */}
      {selectedReport && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#111827' }}>
                  Campaign Delivery Audit Report
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {selectedReport.campaign?.title} &bull; Gateway: waba.mpocket.in
                </span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#94a3b8' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Metrics Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Recipients</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a' }}>{selectedReport.metrics?.totalRecipients || 0}</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#065f46', textTransform: 'uppercase' }}>Delivered</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#047857' }}>{selectedReport.metrics?.delivered || 0}</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase' }}>Read Rate</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#1d4ed8' }}>{selectedReport.metrics?.openRatePct}%</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase' }}>Failed</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#b91c1c' }}>{selectedReport.metrics?.failed || 0}</div>
                </div>
              </div>

              {/* Individual Recipient Statuses */}
              <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                Individual Recipient Dispatch Log
              </h4>

              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Recipient Mobile</th>
                      <th style={{ padding: '8px 12px' }}>Gateway</th>
                      <th style={{ padding: '8px 12px' }}>Delivery Status</th>
                      <th style={{ padding: '8px 12px' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReport.messages || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                          No individual delivery receipts recorded yet.
                        </td>
                      </tr>
                    ) : (
                      selectedReport.messages.map((m, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '600' }}>+91 {m.customer_phone}</td>
                          <td style={{ padding: '8px 12px', color: '#64748b' }}>{m.gateway}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '700',
                              backgroundColor: m.status === 'delivered' ? '#ecfdf5' : '#eff6ff',
                              color: m.status === 'delivered' ? '#047857' : '#1d4ed8'
                            }}>
                              {m.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', color: '#64748b' }}>{formatDisplayDate(m.sent_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
