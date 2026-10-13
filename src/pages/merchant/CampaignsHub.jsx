import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
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
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/merchantUtils';

export default function CampaignsHub() {
  const { profile, notifyToast } = useOutletContext();

  const [campaignView, setCampaignView] = useState('hub'); // 'hub' | 'ledger'
  const [smsCredits, setSmsCredits] = useState(100);
  const [waCredits, setWaCredits] = useState(100);
  const [activeCampaignModal, setActiveCampaignModal] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    channel: 'whatsapp',
    audience: 'all',
    templateText: '',
    couponCode: '',
    pointsBonus: 0,
    scheduleType: 'instant',
    scheduleDate: ''
  });

  const [campaignLedger, setCampaignLedger] = useState([]);

  const manualCampaignsList = [
    {
      id: 'sms',
      title: 'SMS Campaigns',
      desc: 'Send SMS with multimedia offer link to your customers on special occasions',
      image: '/campaigns/sms_camapign.jpg',
      defaultChannel: 'sms',
      actionText: 'Create SMS Campaign'
    },
    {
      id: 'whatsapp',
      title: 'Whatsapp Campaigns',
      desc: 'Send offers & promotions directly on Whatsapp using official Whatsapp Business API',
      image: '/campaigns/whatsapp_campaign.jpg',
      defaultChannel: 'whatsapp',
      actionText: 'Create WhatsApp Campaign'
    },
    {
      id: 'rcs',
      title: 'RCS Campaigns',
      desc: "Send interactive carousel offers directly on customer's native messaging app",
      image: '/campaigns/rcs.png',
      defaultChannel: 'sms',
      actionText: 'Explore RCS'
    },
    {
      id: 'coupon',
      title: 'Coupon Campaigns',
      desc: 'Give adhoc discount coupons to your customers directly on WhatsApp and SMS',
      image: '/campaigns/coupon_campaign.jpg',
      defaultChannel: 'whatsapp',
      actionText: 'Distribute Coupons'
    }
  ];

  const automationCampaignsList = [
    {
      id: 'birthday',
      title: 'Birthday Campaigns',
      desc: 'Automate celebratory greetings & special birthday discounts for your beloved customers',
      image: '/campaigns/birthday_campaign.jpg',
      hasWaving: true,
      actionText: 'Setup Birthday Automation'
    },
    {
      id: 'anniversary',
      title: 'Anniversary Campaigns',
      desc: 'Deliver anniversary wishes & exclusive family milestone offers on WhatsApp automatically',
      image: '/campaigns/anniversary_campaign.jpg',
      hasWaving: true,
      actionText: 'Setup Anniversary Automation'
    },
    {
      id: 'festival',
      title: 'Festival Campaigns',
      desc: 'Celebrate Diwali, Dussehra, and festive seasons with automated digital invitations',
      image: '/campaigns/festival_campaign.jpg',
      hasWaving: true,
      actionText: 'Configure Festival Promo'
    },
    {
      id: 'win-back',
      title: 'Win Back Old Customers',
      desc: 'Re-engage shoppers who have not visited in the past 90 to 180 days with a special incentive',
      image: '/campaigns/win_back.png',
      hasWaving: true,
      actionText: 'Start Win Back Campaign'
    },
    {
      id: 'point-expiry',
      title: 'Point Balance / Expiry Reminder',
      desc: 'Urge customers to visit and redeem unspent loyalty points before they expire',
      image: '/campaigns/point_balance.png',
      hasWaving: true,
      actionText: 'Enable Points Reminder'
    }
  ];

  const openCampaignModal = (campaign) => {
    setActiveCampaignModal(campaign);
    const storeName = profile?.store_name || 'Store';
    let defaultMsg = '';

    if (campaign.id === 'whatsapp' || campaign.id === 'sms') {
      defaultMsg = `🌟 Special Festive Offer from ${storeName}! 🌟\n\nDear {{customer_name}},\nEnjoy FLAT 10% OFF on all new saree arrivals this week!\n\nShow this message at checkout or view details: {{bill_url}}`;
    } else if (campaign.id === 'birthday') {
      defaultMsg = `🎂 Happy Birthday {{customer_name}}! 🎂\n\nTeam ${storeName} wishes you joy, prosperity and good health!\nAs a special gift, enjoy ₹200 OFF on your bill + 100 Bonus Loyalty Points.\n\nShow code: BDAY200 at checkout!`;
    } else if (campaign.id === 'anniversary') {
      defaultMsg = `💍 Happy Anniversary {{customer_name}}! 💖\n\nCelebrate your milestone with ${storeName}. We have reserved an exclusive 15% discount for you and your family this week!`;
    } else if (campaign.id === 'festival') {
      defaultMsg = `🪔 Festive Greetings from ${storeName}! 🪔\n\nCelebrate Diwali & Dussehra with our brand new designer collection. Special festive bundles available now!`;
    } else if (campaign.id === 'win-back') {
      defaultMsg = `We miss you at ${storeName}, {{customer_name}}! 🥰\n\nIt has been a while since your last visit. Drop by this weekend and get FLAT ₹150 OFF on your purchase!`;
    } else if (campaign.id === 'point-expiry') {
      defaultMsg = `💎 You have {{points}} unredeemed loyalty points in your ${storeName} wallet!\n\nYour points are worth ₹{{value}}. Redeem them on your next visit before they expire!`;
    } else {
      defaultMsg = `Hello {{customer_name}}, greetings from ${storeName}!\n\n${campaign.desc}\n\nVisit us today or check your digital bill at {{bill_url}}.`;
    }

    setCampaignForm({
      channel: campaign.defaultChannel || 'whatsapp',
      audience: 'all',
      templateText: defaultMsg,
      couponCode: campaign.id === 'birthday' ? 'BDAY200' : 'FESTIVE10',
      pointsBonus: campaign.id === 'birthday' ? 100 : 0,
      scheduleType: 'instant',
      scheduleDate: ''
    });
  };

  const handleDispatchCampaign = (e) => {
    e.preventDefault();
    if (!campaignForm.templateText) {
      alert('Please enter message text for the campaign.');
      return;
    }

    const newLedgerItem = {
      id: campaignLedger.length + 1,
      date: 'Just now',
      title: activeCampaignModal.title,
      channel: campaignForm.channel === 'whatsapp' ? 'WhatsApp' : 'SMS',
      audience: campaignForm.audience === 'all' ? 'All Customers' : campaignForm.audience,
      count: 150,
      creditsSpent: 150,
      cost: campaignForm.channel === 'whatsapp' ? 67.5 : 30.0,
      billsCount: 0,
      uniqueCustomers: 0,
      revenue: 0,
      roi: 'Tracking...',
      avgBill: 0,
      status: 'In Progress'
    };

    setCampaignLedger([newLedgerItem, ...campaignLedger]);
    setActiveCampaignModal(null);
    notifyToast(`Campaign "${activeCampaignModal.title}" scheduled & dispatched successfully!`);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header and Credit Badges Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
            Campaigns &amp; Marketing Automation Hub
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
            Broadcast promotional offers, automate lifecycle greetings, and schedule urgent loyalty reminders
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
                color: campaignView === 'hub' ? '#0284c7' : '#64748b',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: campaignView === 'hub' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              🎯 Catalog
            </button>
            <button
              onClick={() => setCampaignView('ledger')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: campaignView === 'ledger' ? '#ffffff' : 'transparent',
                color: campaignView === 'ledger' ? '#0284c7' : '#64748b',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: campaignView === 'ledger' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              📊 Performance Ledger
            </button>
          </div>

          {/* Credits Badges */}
          <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Smartphone style={{ width: '15px', height: '15px' }} />
            <span>{smsCredits} SMS Credits</span>
          </span>
          <span style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare style={{ width: '15px', height: '15px' }} />
            <span>{waCredits} WhatsApp Credits</span>
          </span>
          <button
            onClick={() => {
              setSmsCredits((c) => c + 500);
              setWaCredits((c) => c + 500);
              notifyToast('Recharge successful! +500 SMS and +500 WhatsApp credits added.');
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#374151',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            + Top-up
          </button>
        </div>
      </div>

      {campaignView === 'hub' ? (
        <div>
          {/* SECTION 1: MANUAL CAMPAIGNS */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', margin: '0 0 2px' }}>
                Manual Campaigns
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Run instant broadcasts, seasonal sales announcements, and adhoc coupon distributions
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
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
                        e.target.parentNode.style.backgroundColor = '#e0f2fe';
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
                        padding: '9px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#0284c7',
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
                        padding: '9px 14px',
                        borderRadius: '8px',
                        border: '1px solid #0284c7',
                        backgroundColor: '#f0f9ff',
                        color: '#0284c7',
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
        /* CAMPAIGN PERFORMANCE LEDGER */
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
            Historical Campaign Performance Ledger
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Date</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Campaign Title</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Channel</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Audience</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Reached</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Cost</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Bills</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Revenue</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>ROI %</th>
                  <th style={{ padding: '10px 12px', fontWeight: '700' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaignLedger.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
                      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                          <Megaphone style={{ width: '24px', height: '24px' }} />
                        </div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>
                          No Campaigns Dispatched Yet
                        </h4>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                          Switch to the Campaigns Hub tab to launch an instant WhatsApp broadcast or automate customer birthday greetings.
                        </p>
                        <button
                          onClick={() => setCampaignView('hub')}
                          style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Explore Campaigns Hub →
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  campaignLedger.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px', color: '#64748b', fontSize: '0.8rem' }}>{row.date}</td>
                    <td style={{ padding: '12px', fontWeight: '800', color: '#0f172a' }}>{row.title}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.725rem', fontWeight: '700', backgroundColor: '#dcfce7', color: '#15803d' }}>
                        {row.channel}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#475569' }}>{row.audience}</td>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>{row.count}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>₹{row.cost.toFixed(2)}</td>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>{row.billsCount}</td>
                    <td style={{ padding: '12px', fontWeight: '800', color: '#0f172a' }}>{formatCurrency(row.revenue)}</td>
                    <td style={{ padding: '12px', fontWeight: '800', color: '#16a34a' }}>{row.roi}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.725rem', fontWeight: '700', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INTERACTIVE CAMPAIGN SETUP MODAL WITH LIVE WHATSAPP PREVIEW */}
      {activeCampaignModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '840px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
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
                    {activeCampaignModal.desc}
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

            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Form Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                        border: campaignForm.channel === 'whatsapp' ? '2px solid #25d366' : '1px solid #e2e8f0',
                        backgroundColor: campaignForm.channel === 'whatsapp' ? '#f0fdf4' : '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        color: campaignForm.channel === 'whatsapp' ? '#166534' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <MessageSquare style={{ width: '16px', height: '16px' }} />
                      <span>WhatsApp WABA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignForm({ ...campaignForm, channel: 'sms' })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: campaignForm.channel === 'sms' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        backgroundColor: campaignForm.channel === 'sms' ? '#f0f9ff' : '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        color: campaignForm.channel === 'sms' ? '#0369a1' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Smartphone style={{ width: '16px', height: '16px' }} />
                      <span>SMS Broadcast</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Target Audience
                  </label>
                  <select
                    value={campaignForm.audience}
                    onChange={(e) => setCampaignForm({ ...campaignForm, audience: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  >
                    <option value="all">All Store Shoppers (Entire Customer Base)</option>
                    <option value="vip">VIP High Spenders (&gt; ₹5,000 spend)</option>
                    <option value="dormant_90">Inactive / At Risk (No visit past 90 days)</option>
                    <option value="birthday">Upcoming Birthday Shoppers</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Message Copy Template
                  </label>
                  <textarea
                    rows={6}
                    value={campaignForm.templateText}
                    onChange={(e) => setCampaignForm({ ...campaignForm, templateText: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.825rem', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {['{{customer_name}}', '{{store_name}}', '{{coupon_code}}', '{{bill_url}}'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setCampaignForm({ ...campaignForm, templateText: campaignForm.templateText + ' ' + tag })}
                        style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.7rem', color: '#475569', cursor: 'pointer' }}
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveCampaignModal(null)}
                    style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#4b5563', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDispatchCampaign}
                    style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Send style={{ width: '15px', height: '15px' }} />
                    <span>Schedule &amp; Broadcast</span>
                  </button>
                </div>
              </div>

              {/* Live Preview Simulator */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Live Recipient Preview ({campaignForm.channel.toUpperCase()})
                </label>
                <div style={{ backgroundColor: '#efeae2', borderRadius: '16px', padding: '1.25rem', border: '1px solid #dcd7cf', minHeight: '340px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {/* WhatsApp chat header */}
                  <div style={{ backgroundColor: '#075e54', color: '#ffffff', padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#075e54', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem' }}>
                      {profile?.store_name ? profile.store_name.slice(0, 2).toUpperCase() : 'ST'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                        {profile?.store_name || 'Retail Store'}
                      </div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>Official WhatsApp Business Account</div>
                    </div>
                  </div>

                  {/* Message bubble */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '12px 14px', maxWidth: '92%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', alignSelf: 'flex-start' }}>
                    <div style={{ fontSize: '0.825rem', color: '#111827', whiteSpace: 'pre-line', lineHeight: 1.45 }}>
                      {campaignForm.templateText
                        .replace(/\{\{customer_name\}\}/g, 'Pooja')
                        .replace(/\{\{store_name\}\}/g, profile?.store_name || 'Retail Store')
                        .replace(/\{\{coupon_code\}\}/g, campaignForm.couponCode || 'FESTIVE10')
                        .replace(/\{\{bill_url\}\}/g, 'https://bill.retailnode.in/t/OHVrHzYL')
                        .replace(/\{\{points\}\}/g, '250')
                        .replace(/\{\{value\}\}/g, '125')}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.65rem', color: '#9ca3af', marginTop: '4px' }}>
                      10:30 AM &bull; ✓✓
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#6b7280', marginTop: '1rem' }}>
                    Previewing personalized message for recipient <b>+91 98765 43210</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
