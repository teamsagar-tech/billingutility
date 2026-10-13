import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Home, 
  Receipt, 
  Link2, 
  BarChart3, 
  Megaphone, 
  Users, 
  TrendingUp, 
  Layers, 
  Download, 
  Award, 
  Tag, 
  Gift, 
  MessageSquare, 
  Calendar, 
  RefreshCw, 
  Search, 
  Eye, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  Key, 
  Copy, 
  LogOut, 
  Smartphone, 
  ArrowUpRight, 
  Clock, 
  FileText, 
  Percent, 
  Sparkles, 
  Send, 
  Plus, 
  Image, 
  Sliders, 
  CreditCard, 
  CheckSquare, 
  Flame, 
  Cake, 
  Heart, 
  ShoppingBag, 
  HelpCircle,
  X,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function MerchantDashboard() {
  const navigate = useNavigate();
  // Sidebar tabs matching BillFree
  const [activeMenu, setActiveMenu] = useState('home'); 
  // 'home' | 'store-comparison' | 'roi-explorer' | 'campaigns-hub' | 'invoices' | 'customers' | 'segmentation' | 'feedback' | 'loyalty' | 'coupon' | 'redeem' | 'greeting-cards' | 'whatsapp' | 'quick-links' | 'downloads'

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loyalty, setLoyalty] = useState({ rupees_per_point: 100, min_points_redeem: 500, discount_value: 50 });
  const [searchQuery, setSearchQuery] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Redeem cashier search
  const [redeemPhone, setRedeemPhone] = useState('');
  const [searchedCustomer, setSearchedCustomer] = useState(null);
  const [redeemSuccess, setRedeemSuccess] = useState('');

  // Create coupon modal
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    title: '',
    discount_type: 'flat',
    discount_value: 200,
    min_bill_amount: 1500,
    total_coupons: 100,
    valid_until: '2026-12-31'
  });

  // Store Branding & Socials form
  const [brandingForm, setBrandingForm] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    gstin: '',
    logo_url: '',
    google_place_id: '',
    google_review_url: '',
    instagram_url: '',
    youtube_url: '',
    facebook_url: '',
    fb_pixel_id: ''
  });

  // WABA form state
  const [wabaForm, setWabaForm] = useState({
    waba_provider: 'waba_custom',
    waba_access_token: '',
    phone_number_id: '',
    waba_template_name: 'invoice_notification_v2'
  });

  // Quick Digital Bill Generator (Web POS)
  const [showQuickBill, setShowQuickBill] = useState(false);
  const [quickBillForm, setQuickBillForm] = useState({
    customerPhone: '',
    customerName: '',
    billAmount: '',
    invoiceNumber: '',
    itemName: 'Designer Saree Collection',
    sendWhatsApp: true
  });
  const [quickBillLoading, setQuickBillLoading] = useState(false);
  const [quickBillSuccess, setQuickBillSuccess] = useState(null);

  // Customer Subtabs matching BillFree (/profiles/customers)
  const [customerSubtab, setCustomerSubtab] = useState('customers'); // 'customers' | 'profiles' | 'journey' | 'optout'
  const [customerInsights, setCustomerInsights] = useState(null);
  const [customerFilterCohort, setCustomerFilterCohort] = useState('all');
  const [profileStatusFilter, setProfileStatusFilter] = useState('all'); // 'all' | 'complete' | 'incomplete' | 'not_exist'
  const [dormantFilter, setDormantFilter] = useState('all'); // 'all' | 'active_3m' | 'dormant_3_6m' | 'dormant_6_12m' | 'dormant_12p_m'
  const [visitFilter, setVisitFilter] = useState('all'); // 'all' | '1' | '2' | '3' | '4' | '5' | '10'
  const [customerProfileFilter, setCustomerProfileFilter] = useState('all'); // 'all' | 'birthday' | 'anniversary'

  // Create / Enrich Profile Modal (matching /profiles/create?phone=...)
  const [activeProfileModal, setActiveProfileModal] = useState(null);
  const [profileForm, setProfileForm] = useState({
    customer_name: '',
    phone: '',
    dob: '',
    email: '',
    profession: '',
    shopping_frequency: 'Monthly',
    gender: 'm',
    marital_status: 'u',
    anniversary_date: '',
    spouse_name: '',
    spouse_mobile: '',
    spouse_dob: '',
    child_name: '',
    child_dob: '',
    state: 'Maharashtra',
    city: 'Pune',
    consent_given: true
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Customer Journey state
  const [journeyPhone, setJourneyPhone] = useState('');
  const [journeyData, setJourneyData] = useState(null);
  const [journeyLoading, setJourneyLoading] = useState(false);

  // Optout / DND List state
  const [optoutList, setOptoutList] = useState([]);
  const [optoutLoading, setOptoutLoading] = useState(false);
  const [newOptoutPhone, setNewOptoutPhone] = useState('');
  const [newOptoutReason, setNewOptoutReason] = useState('Customer requested DND');

  // Feedback Resolution Modal
  const [activeFeedbackModal, setActiveFeedbackModal] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Campaigns & Marketing Automation Hub state (mirroring /campaigns-hub/index)
  const [campaignView, setCampaignView] = useState('hub'); // 'hub' | 'ledger'
  const [smsCredits, setSmsCredits] = useState(100);
  const [waCredits, setWaCredits] = useState(100);
  const [activeCampaignModal, setActiveCampaignModal] = useState(null);
  const [campaignSuccessToast, setCampaignSuccessToast] = useState('');
  const [campaignForm, setCampaignForm] = useState({
    channel: 'whatsapp',
    audience: 'all',
    templateText: '',
    couponCode: '',
    pointsBonus: 0,
    scheduleType: 'instant',
    scheduleDate: ''
  });

  const [campaignLedger, setCampaignLedger] = useState([
    {
      id: 1,
      date: '2026-10-12 11:30 AM',
      title: 'Navratri Festive Silk Clearance',
      channel: 'WhatsApp',
      audience: 'All Customers',
      count: 420,
      creditsSpent: 420,
      cost: 189.0,
      billsCount: 38,
      uniqueCustomers: 36,
      revenue: 84500,
      roi: '436%',
      avgBill: 2223,
      status: 'Completed'
    },
    {
      id: 2,
      date: '2026-10-08 04:15 PM',
      title: 'VIP Weekend Paithani Preview',
      channel: 'WhatsApp',
      audience: 'VIP Spenders (> ₹5,000)',
      count: 85,
      creditsSpent: 85,
      cost: 38.25,
      billsCount: 22,
      uniqueCustomers: 21,
      revenue: 68400,
      roi: '1689%',
      avgBill: 3109,
      status: 'Completed'
    },
    {
      id: 3,
      date: '2026-10-04 10:00 AM',
      title: 'October Birthday Celebrations 🎉',
      channel: 'WhatsApp',
      audience: 'Birthday Shoppers',
      count: 28,
      creditsSpent: 28,
      cost: 12.60,
      billsCount: 9,
      uniqueCustomers: 9,
      revenue: 21800,
      roi: '1630%',
      avgBill: 2422,
      status: 'Active (Daily Auto)'
    }
  ]);

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
      desc: "Send offers & promotions directly on customer's mobile",
      image: '/campaigns/rcs.png',
      defaultChannel: 'sms',
      actionText: 'Explore RCS'
    },
    {
      id: 'coupon',
      title: 'Coupon Campaigns',
      desc: 'Give adhoc coupons to your customers directly on Whatsapp using official Whatsapp Business API and SMS',
      image: '/campaigns/coupon_campaign.jpg',
      defaultChannel: 'whatsapp',
      actionText: 'Distribute Coupons'
    }
  ];

  const automationCampaignsList = [
    {
      id: 'birthday',
      title: 'Birthday Campaigns',
      desc: 'Setup the Birthday Campaign for your beloved customers',
      image: '/campaigns/birthday_campaign.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    },
    {
      id: 'anniversary',
      title: 'Anniversary Campaigns',
      desc: 'Setup the Anniversary Campaign for your beloved customers.',
      image: '/campaigns/anniversary_campaign.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    },
    {
      id: 'festival',
      title: 'Festival Campaigns',
      desc: 'Setup the Festival Campaign for your beloved customers',
      image: '/campaigns/festival_campaign.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    },
    {
      id: 'win-back',
      title: 'Win Back Old Customers',
      desc: "Setup the Win Back Campaign for your customers who haven't shopped with you for a long time",
      image: '/campaigns/win_back_old_customers.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    },
    {
      id: 'sku',
      title: 'SKU Based',
      desc: 'Setup the SKU Automation Campaign for your beloved customers.',
      image: '/campaigns/sku_based.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    }
  ];

  const automationEventsList = [
    {
      id: 'bill-sent',
      title: 'On Bill Sent',
      desc: 'Setup the Bill Sent Campaign for your beloved customers',
      image: '/campaigns/on_bill_sent.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    },
    {
      id: 'profile',
      title: 'Profile Completion',
      desc: 'Setup the Profile Completion Campaign for your beloved customers.',
      image: '/campaigns/profile_completion.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    },
    {
      id: 'feedback',
      title: 'Feedback Given',
      desc: 'Setup the Feedback Campaign for your dissatisfied customers.',
      image: '/campaigns/feedback_given.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    },
    {
      id: 'welcome',
      title: 'Welcome Message',
      subtitle: '(New & Old Customer)',
      desc: 'Setup the Welcome Campaign for your new/old customers.',
      image: '/campaigns/welcome.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    },
    {
      id: 'referrer',
      title: 'Referrer Message',
      desc: 'Setup the Referrer notification and reward for your customers.',
      image: '/campaigns/referee.jpg',
      hasWaving: true,
      actionText: 'Create First Notification Now'
    },
    {
      id: 'referee',
      title: 'Referred Message',
      desc: 'Setup the Referral notification and reward for your new customers (Referred).',
      image: '/campaigns/referred_message.jpg',
      hasWaving: true,
      actionText: 'Create First Notification Now'
    },
    {
      id: 'vip',
      title: 'VIP Specials',
      desc: 'Setup the Campaign for your VIP customers.',
      image: '/campaigns/vip.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    },
    {
      id: 'spin-wheel',
      title: 'Spin Wheel Reward',
      desc: 'Setup the message for spin wheel reward.',
      image: '/campaigns/spin_wheel_reward.jpg',
      hasWaving: true,
      actionText: 'Create First spin wheel message'
    }
  ];

  const remindersList = [
    {
      id: 'balance-points',
      title: 'Outstanding Balance Points',
      desc: 'Setup the Outstanding Loyalty Points Reminder for your customers.',
      image: '/campaigns/outstanding_balance_points.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    },
    {
      id: 'points-expiry',
      title: 'Points Expiry',
      desc: 'Setup the Loyalty Points Expiry Reminder for your customers.',
      image: '/campaigns/loyalty_points_expiry.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    },
    {
      id: 'coupon-expiry',
      title: 'Coupons Expiry',
      desc: 'Setup the Coupon Reminder for your customers.',
      image: '/campaigns/coupon_expiry.jpg',
      hasWaving: true,
      actionText: 'Create First Campaign Now'
    }
  ];

  const openCampaignSetup = (campaign) => {
    setActiveCampaignModal(campaign);
    const storeName = profile?.store_name || 'Store';
    let defaultMsg = '';
    if (campaign.id === 'whatsapp' || campaign.id === 'sms') {
      defaultMsg = `🌟 Special Festive Offer from ${storeName}! 🌟\n\nDear {{customer_name}},\nEnjoy FLAT 10% OFF on all new saree arrivals this week!\n\nShow this message at the checkout counter or view details: {{bill_url}}`;
    } else if (campaign.id === 'birthday') {
      defaultMsg = `🎂 Happy Birthday {{customer_name}}! 🎂\n\nTeam ${storeName} wishes you joy, prosperity and good health!\nAs a special gift, enjoy ₹200 OFF on your bill + 100 Bonus Loyalty Points.\n\nShow code: BDAY200 at checkout!`;
    } else if (campaign.id === 'anniversary') {
      defaultMsg = `💍 Happy Anniversary {{customer_name}}! 💖\n\nCelebrate your milestone with ${storeName}. We have reserved an exclusive 15% discount for you and your family this week!`;
    } else if (campaign.id === 'festival') {
      defaultMsg = `🪔 Festive Greetings from ${storeName}! 🪔\n\nCelebrate Diwali & Dussehra with our brand new designer silk & Paithani collection. Special festive bundles available now!`;
    } else if (campaign.id === 'win-back') {
      defaultMsg = `We miss you at ${storeName}, {{customer_name}}! 🥰\n\nIt has been a while since your last visit. Drop by this weekend and get FLAT ₹150 OFF on your purchase!`;
    } else if (campaign.id === 'balance-points') {
      defaultMsg = `💎 You have {{points}} unredeemed loyalty points in your ${storeName} wallet!\n\nYour points are worth ₹{{value}}. Redeem them on your next visit before they expire!`;
    } else {
      defaultMsg = `Hello {{customer_name}}, greetings from ${storeName}!\n\n${campaign.desc}\n\nVisit us today or check your digital bill at {{bill_url}}.`;
    }

    setCampaignForm({
      channel: campaign.defaultChannel || 'whatsapp',
      audience: 'all',
      templateText: defaultMsg,
      couponCode: coupons[0]?.code || 'FESTIVE10',
      pointsBonus: campaign.id === 'birthday' ? 100 : 0,
      scheduleType: 'instant',
      scheduleDate: ''
    });
  };

  const handleLaunchCampaign = () => {
    if (!activeCampaignModal) return;
    const isWa = campaignForm.channel === 'whatsapp';
    const costPerMsg = isWa ? 0.45 : 0.20;
    const count = campaignForm.audience === 'vip' ? 45 : campaignForm.audience === 'inactive' ? 120 : (customers?.length || 150);
    
    // Check credits
    if (isWa && waCredits < count) {
      alert(`Insufficient WhatsApp credits (${waCredits} available, ${count} needed). Please top-up credits.`);
      return;
    }
    if (!isWa && smsCredits < count) {
      alert(`Insufficient SMS credits (${smsCredits} available, ${count} needed). Please top-up credits.`);
      return;
    }

    // Deduct credits
    if (isWa) {
      setWaCredits(c => c - count);
    } else {
      setSmsCredits(c => c - count);
    }

    const newEntry = {
      id: Date.now(),
      date: 'Just now',
      title: activeCampaignModal.title,
      channel: isWa ? 'WhatsApp' : 'SMS',
      audience: campaignForm.audience === 'vip' ? 'VIP Spenders (> ₹5,000)' : campaignForm.audience === 'inactive' ? 'Inactive (> 30 Days)' : 'All Customers',
      count: count,
      creditsSpent: count,
      cost: parseFloat((count * costPerMsg).toFixed(2)),
      billsCount: 0,
      uniqueCustomers: 0,
      revenue: 0,
      roi: '0%',
      avgBill: 0,
      status: campaignForm.scheduleType === 'instant' ? 'Delivered' : 'Scheduled'
    };

    setCampaignLedger(prev => [newEntry, ...prev]);
    setCampaignSuccessToast(`Campaign "${activeCampaignModal.title}" launched successfully to ${count} recipients!`);
    setActiveCampaignModal(null);
    setTimeout(() => setCampaignSuccessToast(''), 4500);
  };

  const handleQuickBillPhoneChange = (phone) => {
    setQuickBillForm(prev => ({ ...prev, customerPhone: phone }));
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length >= 10) {
      const match = customers.find(c => c.phone && c.phone.includes(cleanDigits.slice(-10)));
      if (match && match.customer_name && match.customer_name !== 'Valued Customer') {
        setQuickBillForm(prev => ({
          ...prev,
          customerPhone: phone,
          customerName: match.customer_name
        }));
      }
    }
  };

  const handleCreateQuickBill = async (e) => {
    e.preventDefault();
    if (!quickBillForm.customerPhone || !quickBillForm.billAmount) {
      alert('Please enter customer mobile number and bill amount');
      return;
    }
    setQuickBillLoading(true);
    try {
      const res = await fetch('/api/v1/auth/invoices/quick-bill', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerPhone: quickBillForm.customerPhone,
          customerName: quickBillForm.customerName || 'Valued Shopper',
          billAmount: parseFloat(quickBillForm.billAmount),
          invoiceNumber: quickBillForm.invoiceNumber || `POS-${Date.now().toString().slice(-6)}`,
          items: [
            { Name: quickBillForm.itemName || 'Retail Purchase', Qty: 1, Rate: parseFloat(quickBillForm.billAmount), Amount: parseFloat(quickBillForm.billAmount) }
          ],
          sendWhatsApp: quickBillForm.sendWhatsApp
        })
      });
      const data = await res.json();
      if (data.success) {
        setQuickBillSuccess(data.data);
        setSaveSuccess(`Digital Bill #${data.data.invoiceNumber} generated & sent via WhatsApp!`);
        setTimeout(() => setSaveSuccess(''), 4000);
        loadData();
      } else {
        alert(data.error || 'Failed to generate quick bill');
      }
    } catch (err) {
      alert('Network error generating bill');
    } finally {
      setQuickBillLoading(false);
    }
  };

  const handleUpdateFeedbackResolution = async (feedbackId, status) => {
    try {
      const res = await fetch(`/api/v1/auth/feedback/responses/${feedbackId}/resolution`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          notes: resolutionNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackList(prev => prev.map(f => f.id === feedbackId ? { ...f, resolution_status: status, resolution_notes: resolutionNotes } : f));
        setActiveFeedbackModal(null);
        setResolutionNotes('');
        setSaveSuccess('Customer feedback resolution recorded successfully!');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      alert('Error updating feedback resolution');
    }
  };

  const handleOpenProfileModal = (c) => {
    setActiveProfileModal(c || { phone: '' });
    setProfileForm({
      customer_name: c?.customer_name || '',
      phone: c?.phone || '',
      dob: c?.dob ? c.dob.slice(0, 10) : '',
      email: c?.email || '',
      profession: c?.profession || '',
      shopping_frequency: c?.shopping_frequency || 'Monthly',
      gender: c?.gender || 'm',
      marital_status: c?.marital_status || 'u',
      anniversary_date: c?.anniversary_date ? c.anniversary_date.slice(0, 10) : '',
      spouse_name: c?.spouse_name || '',
      spouse_mobile: c?.spouse_mobile || '',
      spouse_dob: c?.spouse_dob ? c.spouse_dob.slice(0, 10) : '',
      child_name: c?.child_name || '',
      child_dob: c?.child_dob ? c.child_dob.slice(0, 10) : '',
      state: c?.state || 'Maharashtra',
      city: c?.city || 'Pune',
      consent_given: c?.consent_given !== undefined ? Boolean(c.consent_given) : true
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.phone) {
      alert('Mobile number is required');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch('/api/v1/auth/customers/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        const refreshRes = await fetch('/api/v1/auth/customers', { headers: { 'Authorization': `Bearer ${token}` } });
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setCustomers(refreshData.data || []);
          if (refreshData.insights) setCustomerInsights(refreshData.insights);
        }
        setActiveProfileModal(null);
        setCampaignSuccessToast('Customer Profile Saved Successfully! 🚀');
        setTimeout(() => setCampaignSuccessToast(''), 4000);
      } else {
        alert(data.error || 'Failed to save customer profile');
      }
    } catch (err) {
      alert('Network error while saving profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLoadJourney = async (phone) => {
    if (!phone) return;
    setJourneyPhone(phone);
    setJourneyLoading(true);
    setCustomerSubtab('journey');
    try {
      const res = await fetch(`/api/v1/auth/customers/${phone}/journey`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setJourneyData(data);
      } else {
        setJourneyData(null);
      }
    } catch (err) {
      setJourneyData(null);
    } finally {
      setJourneyLoading(false);
    }
  };

  const handleLoadOptouts = async () => {
    setOptoutLoading(true);
    try {
      const res = await fetch('/api/v1/auth/customers/optout', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOptoutList(data.data || []);
      }
    } catch (e) {}
    setOptoutLoading(false);
  };

  const handleAddOptout = async (e) => {
    e.preventDefault();
    if (!newOptoutPhone) return;
    try {
      const res = await fetch('/api/v1/auth/customers/optout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: newOptoutPhone, reason: newOptoutReason, channel: 'whatsapp' })
      });
      const data = await res.json();
      if (data.success) {
        setNewOptoutPhone('');
        handleLoadOptouts();
      }
    } catch (e) {}
  };

  const handleRemoveOptout = async (id) => {
    try {
      await fetch(`/api/v1/auth/customers/optout/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      handleLoadOptouts();
    } catch (e) {}
  };

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [token, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Profile
      const profRes = await fetch('/api/v1/auth/profile', { headers });
      const profData = await profRes.json();
      if (profData.success && profData.data) {
        setProfile(profData.data);
        setBrandingForm({
          store_name: profData.data.store_name || '',
          store_address: profData.data.store_address || '',
          store_phone: profData.data.store_phone || '',
          store_email: profData.data.store_email || '',
          gstin: profData.data.gstin || '',
          logo_url: profData.data.logo_url || '',
          google_place_id: profData.data.google_place_id || '',
          google_review_url: profData.data.google_review_url || '',
          instagram_url: profData.data.instagram_url || '',
          youtube_url: profData.data.youtube_url || '',
          facebook_url: profData.data.facebook_url || '',
          fb_pixel_id: profData.data.fb_pixel_id || ''
        });
        setWabaForm({
          waba_provider: profData.data.waba_provider || 'waba_custom',
          waba_access_token: profData.data.waba_access_token || '',
          phone_number_id: profData.data.phone_number_id || '',
          waba_template_name: profData.data.waba_template_name || 'invoice_notification_v2'
        });
      } else if (profRes.status === 401 || profRes.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      // 2. Analytics (Business at a Glance metrics)
      const anaRes = await fetch('/api/v1/auth/analytics', { headers });
      const anaData = await anaRes.json();
      if (anaData.success && anaData.data) {
        setAnalytics(anaData.data);
      }

      // 3. Invoices
      const invRes = await fetch('/api/v1/auth/invoices', { headers });
      const invData = await invRes.json();
      if (invData.success) {
        setInvoices(invData.data || []);
      }

      // 4. Customers
      const custRes = await fetch('/api/v1/auth/customers', { headers });
      const custData = await custRes.json();
      if (custData.success) {
        setCustomers(custData.data || []);
        if (custData.insights) setCustomerInsights(custData.insights);
      }

      // 5. Coupons
      const coupRes = await fetch('/api/v1/auth/coupons', { headers });
      const coupData = await coupRes.json();
      if (coupData.success) {
        setCoupons(coupData.data || []);
      }

      // 6. Feedback
      const feedRes = await fetch('/api/v1/auth/feedback/responses', { headers });
      const feedData = await feedRes.json();
      if (feedData.success) {
        setFeedbackList(feedData.data || []);
      }

      // 7. Banners
      const banRes = await fetch('/api/v1/auth/banners', { headers });
      const banData = await banRes.json();
      if (banData.success) {
        setBanners(banData.data || []);
      }

      // 8. Loyalty
      const loyRes = await fetch('/api/v1/auth/loyalty', { headers });
      const loyData = await loyRes.json();
      if (loyData.success && loyData.data) {
        setLoyalty(loyData.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyApiToken = () => {
    if (profile?.api_token) {
      navigator.clipboard.writeText(profile.api_token);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess('');
    try {
      const res = await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(brandingForm)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess('Store branding and Google Review link saved successfully!');
        setTimeout(() => setSaveSuccess(''), 4000);
        loadData();
      } else {
        alert(data.error || 'Failed to save branding.');
      }
    } catch (err) {
      alert('Network error saving details.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWaba = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess('');
    try {
      const res = await fetch('/api/v1/auth/waba', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(wabaForm)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess('WhatsApp API gateway updated successfully!');
        setTimeout(() => setSaveSuccess(''), 4000);
        loadData();
      } else {
        alert(data.error || 'Failed to update WhatsApp settings.');
      }
    } catch (err) {
      alert('Network error updating WhatsApp settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLoyalty = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/v1/auth/loyalty', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loyalty)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess('Loyalty rules updated successfully!');
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        alert(data.error || 'Failed to update loyalty rules.');
      }
    } catch (err) {
      alert('Network error updating loyalty.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCouponSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/auth/coupons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCoupon)
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateCoupon(false);
        setSaveSuccess(`Coupon ${newCoupon.code} created successfully!`);
        setTimeout(() => setSaveSuccess(''), 4000);
        loadData();
      } else {
        alert(data.error || 'Failed to create coupon');
      }
    } catch (err) {
      alert('Network error creating coupon');
    }
  };

  const handleCustomerRedeemLookup = (e) => {
    e.preventDefault();
    setRedeemSuccess('');
    const found = customers.find(c => c.phone.includes(redeemPhone.trim()));
    if (found) {
      setSearchedCustomer(found);
    } else {
      setSearchedCustomer({
        customer_name: 'Walk-in Shopper',
        phone: redeemPhone,
        loyalty_points: 60,
        lifetime_value: 1850,
        profile_status: 'Active'
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const filteredInvoices = invoices.filter(inv => {
    const q = searchQuery.toLowerCase();
    return (
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
      (inv.customerPhone && inv.customerPhone.includes(q)) ||
      (inv.shortId && inv.shortId.toLowerCase().includes(q)) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(q))
    );
  });

  // Numbers for the BillFree-style cards
  const totalRev = analytics?.totalRevenue || (invoices.reduce((acc, i) => acc + parseFloat(i.billTotal || 0), 0));
  const newRev = analytics?.newRevenue || Math.round(totalRev * 0.67);
  const repeatRev = analytics?.repeatRevenue || Math.round(totalRev * 0.33);
  const totalBills = analytics?.totalInvoices || invoices.length;
  const newBills = analytics?.newBillsCount || Math.max(1, Math.round(totalBills * 0.67));
  const repeatBills = analytics?.repeatBillsCount || Math.max(0, totalBills - newBills);
  const aov = analytics?.avgOrderValue || (totalBills > 0 ? Math.round(totalRev / totalBills) : 0);

  const googleVisited = analytics?.googleReviewsVisited || invoices.filter(i => i.hasReviewed).length;
  const feedbackCount = feedbackList.length > 0 ? feedbackList.length : (analytics?.feedbackReceived || 2);
  const avgRating = analytics?.avgFeedbackRating || '5.0';
  const loyaltyEarned = analytics?.loyaltyPointsEarned || customers.reduce((acc, c) => acc + (c.loyalty_points || 0), 0);

  const formatK = (num) => {
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
    }
    return `₹${num}`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: 'Inter, system-ui, sans-serif', color: '#111827' }}>
      
      {/* 1. LEFT SIDEBAR (EXACT BILLFREE COMPLETE TREE) */}
      <aside style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        boxSizing: 'border-box',
        padding: '1.25rem 0.75rem'
      }}>
        {/* Store Profile Card at Top */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0.5rem 0.5rem 1.25rem',
          borderBottom: '1px solid #f3f4f6',
          marginBottom: '0.75rem'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0
          }}>
            <FileText style={{ width: '20px', height: '20px' }} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <h2 style={{
              fontSize: '0.9rem',
              fontWeight: '800',
              margin: 0,
              color: '#111827',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {profile?.store_name || (loading ? 'Loading Store...' : 'Retail Store')}
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
              {profile?.id ? `Store ID: #${profile.id}` : 'Store ID: --'} &bull; Active
            </span>
          </div>
        </div>

        {/* PRIMARY NAVIGATION */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
          {[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'store-comparison', label: 'Store Summary', icon: BarChart3 },
            { id: 'roi-explorer', label: 'ROI Explorer', icon: TrendingUp },
            { id: 'campaigns-hub', label: 'Campaigns & Automation', icon: Megaphone },
            { id: 'invoices', label: 'Invoice', icon: Receipt, badge: invoices.length },
            { id: 'customers', label: 'Customers', icon: Users, badge: customers.length },
            { id: 'segmentation', label: 'Segmentation', icon: Layers },
            { id: 'feedback', label: 'Feedback & Reviews', icon: Star, badge: feedbackCount },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isActive ? '#0284c7' : 'transparent',
                  color: isActive ? '#ffffff' : '#4b5563',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon style={{ width: '16px', height: '16px', color: isActive ? '#ffffff' : '#6b7280' }} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                    color: isActive ? '#ffffff' : '#6b7280',
                    fontWeight: '700'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* REWARDS SECTION */}
          <div style={{ padding: '14px 12px 4px', fontSize: '0.7rem', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Rewards
          </div>
          {[
            { id: 'loyalty', label: 'Loyalty', icon: Award },
            { id: 'coupon', label: 'Coupon', icon: Tag, badge: coupons.length },
            { id: 'redeem', label: 'Redeem Reward', icon: Gift }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isActive ? '#0284c7' : 'transparent',
                  color: isActive ? '#ffffff' : '#4b5563',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon style={{ width: '16px', height: '16px', color: isActive ? '#ffffff' : '#6b7280' }} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#f3f4f6',
                    color: isActive ? '#ffffff' : '#6b7280',
                    fontWeight: '700'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* CHANNELS SECTION */}
          <div style={{ padding: '14px 12px 4px', fontSize: '0.7rem', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Channels
          </div>
          {[
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
            { id: 'greeting-cards', label: 'Greeting Cards', icon: Image }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isActive ? '#0284c7' : 'transparent',
                  color: isActive ? '#ffffff' : '#4b5563',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Icon style={{ width: '16px', height: '16px', color: isActive ? '#ffffff' : '#6b7280' }} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* MANAGE SECTION */}
          <div style={{ padding: '14px 12px 4px', fontSize: '0.7rem', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Manage
          </div>
          {[
            { id: 'quick-links', label: 'Quick Links & Branding', icon: Link2 },
            { id: 'downloads', label: 'Download Center', icon: Download }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isActive ? '#0284c7' : 'transparent',
                  color: isActive ? '#ffffff' : '#4b5563',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Icon style={{ width: '16px', height: '16px', color: isActive ? '#ffffff' : '#6b7280' }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card at Bottom */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#111827' }}>Sagar</div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Owner Account</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: '#fee2e2', color: '#b91c1c', cursor: 'pointer' }}
            >
              <LogOut style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT VIEWPORT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        
        {/* Global Toast Success Banner */}
        {saveSuccess && (
          <div style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '10px 1.5rem', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle style={{ width: '16px', height: '16px' }} />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* TOP HEADER BAR WITH FAST ACTION & QUICK BILL */}
        <header style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '0.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Quick Bill Button */}
            <button
              onClick={() => { setShowQuickBill(true); setQuickBillSuccess(null); }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              <span>+ Quick Digital Bill ⚡</span>
            </button>
          </div>
        </header>

        <main style={{ padding: '1.5rem 2rem', flex: 1 }}>
          
          {/* TAB 1: HOME (BUSINESS AT A GLANCE ✨) */}
          {activeMenu === 'home' && (
            <div>
              {/* Top Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827', margin: '0 0 4px' }}>
                    Business at a Glance ✨
                  </h1>
                  <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>
                    Active Features: &bull; Invoice &bull; Roles &bull; Ad Banner &bull; Google Review &bull; White Label/Branding
                  </span>
                </div>

                {/* Date Filter Pill */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#4b5563',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                  <Calendar style={{ width: '15px', height: '15px', color: '#9ca3af' }} />
                  <span>13-Sep-2026 - 13-Oct-2026</span>
                  <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>▾</span>
                </div>
              </div>

              {/* SALES BLOCK CONTAINER */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #f1f5f9',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
                  Sales
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
                  {/* Left 3 Stacked Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Revenue Card */}
                    <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#111827' }}>
                            {formatK(totalRev)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                            Revenue
                          </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                          💵
                        </div>
                      </div>

                      {/* New vs Repeat Progress Bar */}
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
                          <div style={{ width: '66.67%', backgroundColor: '#6366f1' }}></div>
                          <div style={{ width: '33.33%', backgroundColor: '#10b981' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', fontWeight: '600' }}>
                          <span style={{ color: '#4f46e5' }}>{formatK(newRev)} (66.67%)</span>
                          <span style={{ color: '#10b981' }}>{formatK(repeatRev)} (33.33%)</span>
                        </div>
                      </div>
                    </div>

                    {/* No. of Bills Card */}
                    <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#111827' }}>
                            {totalBills}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                            No. of Bills
                          </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                          🚀
                        </div>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
                          <div style={{ width: '66.67%', backgroundColor: '#6366f1' }}></div>
                          <div style={{ width: '33.33%', backgroundColor: '#10b981' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', fontWeight: '600' }}>
                          <span style={{ color: '#4f46e5' }}>{newBills} (66.67%)</span>
                          <span style={{ color: '#10b981' }}>{repeatBills} (33.33%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Avg Order Value Card */}
                    <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#111827' }}>
                            {formatK(aov)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                            Avg. Order Value
                          </div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                          ⚖️
                        </div>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#e5e7eb' }}>
                          <div style={{ width: '50%', backgroundColor: '#6366f1' }}></div>
                          <div style={{ width: '50%', backgroundColor: '#10b981' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', fontWeight: '600' }}>
                          <span style={{ color: '#4f46e5' }}>{formatK(aov)}</span>
                          <span style={{ color: '#10b981' }}>{formatK(aov)}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Dual-Axis Chart */}
                  <div style={{
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', fontWeight: '700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '12px', height: '6px', backgroundColor: '#10b981', borderRadius: '2px' }}></span>
                          <span style={{ color: '#374151' }}>Revenue</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '12px', height: '2px', backgroundColor: '#3b82f6', display: 'inline-block' }}></span>
                          <span style={{ color: '#374151' }}>Sales</span>
                        </div>
                      </div>
                      <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }} title="Download Chart">
                        <Download style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>

                    <div style={{ position: 'relative', width: '100%', height: '230px', marginTop: '10px' }}>
                      <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <line x1="40" y1="20" x2="460" y2="20" stroke="#f3f4f6" strokeDasharray="3" />
                        <line x1="40" y1="65" x2="460" y2="65" stroke="#f3f4f6" strokeDasharray="3" />
                        <line x1="40" y1="110" x2="460" y2="110" stroke="#f3f4f6" strokeDasharray="3" />
                        <line x1="40" y1="155" x2="460" y2="155" stroke="#f3f4f6" strokeDasharray="3" />
                        <line x1="40" y1="190" x2="460" y2="190" stroke="#e5e7eb" strokeWidth="1.5" />

                        <text x="5" y="25" fill="#10b981" fontSize="10" fontWeight="600">₹3K</text>
                        <text x="5" y="70" fill="#10b981" fontSize="10" fontWeight="600">₹2K</text>
                        <text x="5" y="115" fill="#10b981" fontSize="10" fontWeight="600">₹1K</text>
                        <text x="15" y="193" fill="#10b981" fontSize="10" fontWeight="600">₹0</text>

                        <text x="475" y="25" fill="#3b82f6" fontSize="10" fontWeight="600">3</text>
                        <text x="475" y="70" fill="#3b82f6" fontSize="10" fontWeight="600">2</text>
                        <text x="475" y="115" fill="#3b82f6" fontSize="10" fontWeight="600">1</text>
                        <text x="475" y="193" fill="#3b82f6" fontSize="10" fontWeight="600">0</text>

                        <rect x="135" y="20" width="22" height="170" rx="3" fill="#10b981" />

                        <path
                          d="M 146 20 C 230 110, 310 185, 340 188 S 410 188, 440 188"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2.5"
                        />

                        <circle cx="146" cy="20" r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" />
                        <circle cx="340" cy="188" r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" />
                        <circle cx="440" cy="188" r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" />

                        <text x="130" y="212" fill="#6b7280" fontSize="10" fontWeight="600">29 Sep</text>
                        <text x="325" y="212" fill="#6b7280" fontSize="10" fontWeight="600">12 Oct</text>
                        <text x="425" y="212" fill="#6b7280" fontSize="10" fontWeight="600">13 Oct</text>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 COLORFUL PERFORMANCE CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#8b5cf6', borderRadius: '14px', padding: '1.25rem', color: '#ffffff', boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.9 }}>Loyalty Points Earned</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', marginTop: '8px' }}>{loyaltyEarned}</div>
                </div>

                <div style={{ backgroundColor: '#10b981', borderRadius: '14px', padding: '1.25rem', color: '#ffffff', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.9 }}>Feedback Received</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', marginTop: '8px' }}>{feedbackCount}</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4b5563' }}>Google Page<br />Visited</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: '#111827', marginTop: '4px' }}>{googleVisited}</div>
                  </div>
                  <div style={{ width: '48px', height: '48px' }}>
                    <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4b5563' }}>Profiles<br />Completed</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4f46e5', marginTop: '6px' }}>67%</div>
                  </div>
                  <div style={{ width: '48px', height: '48px', position: 'relative' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4f46e5" strokeWidth="3.5" strokeDasharray="67, 100" />
                    </svg>
                  </div>
                </div>

                <div style={{ backgroundColor: '#f59e0b', borderRadius: '14px', padding: '1.25rem', color: '#ffffff', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.9 }}>Loyalty Points Redeemed</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', marginTop: '8px' }}>0</div>
                </div>

                <div style={{ backgroundColor: '#0284c7', borderRadius: '14px', padding: '1.25rem', color: '#ffffff', boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.9 }}>Avg. Feedback Rating</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', marginTop: '8px' }}>{avgRating} ★</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STORE COMPARISON (EXACT /store-comparison/store-comparision) */}
          {activeMenu === 'store-comparison' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 4px', color: '#111827' }}>
                    Store Summary &amp; Multi-Metric Comparison
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                    Aggregate sales, customer retention, feedback, and coupon redemptions across your retail branches.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <Calendar style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                  <span>Date Range: All Time</span>
                </div>
              </div>

              {/* Multi-Section Table */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem', minWidth: '1000px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#334155', fontWeight: '800', textAlign: 'center' }}>
                      <th colSpan={3} style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>STORES</th>
                      <th colSpan={3} style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>NO. OF BILLS</th>
                      <th colSpan={2} style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>REVENUE</th>
                      <th colSpan={2} style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>NEW CUSTOMER</th>
                      <th colSpan={2} style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>REPEAT CUSTOMER</th>
                      <th colSpan={2} style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>FEEDBACK</th>
                      <th colSpan={2} style={{ padding: '8px' }}>LOYALTY &amp; COUPONS</th>
                    </tr>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb', color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px' }}>S.No</th>
                      <th style={{ padding: '10px' }}>Store ID</th>
                      <th style={{ padding: '10px', borderRight: '1px solid #e5e7eb' }}>Store Name</th>
                      <th style={{ padding: '10px' }}>Total</th>
                      <th style={{ padding: '10px' }}>With Mobile</th>
                      <th style={{ padding: '10px', borderRight: '1px solid #e5e7eb' }}>% Digital</th>
                      <th style={{ padding: '10px' }}>Amount (₹)</th>
                      <th style={{ padding: '10px', borderRight: '1px solid #e5e7eb' }}>Avg Rev</th>
                      <th style={{ padding: '10px' }}>Count</th>
                      <th style={{ padding: '10px', borderRight: '1px solid #e5e7eb' }}>Rev (₹)</th>
                      <th style={{ padding: '10px' }}>Count</th>
                      <th style={{ padding: '10px', borderRight: '1px solid #e5e7eb' }}>Rev (₹)</th>
                      <th style={{ padding: '10px' }}>Count</th>
                      <th style={{ padding: '10px', borderRight: '1px solid #e5e7eb' }}>Avg Rating</th>
                      <th style={{ padding: '10px' }}>Points</th>
                      <th style={{ padding: '10px' }}>Coupons Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>1</td>
                      <td style={{ padding: '12px 10px' }}>#1</td>
                      <td style={{ padding: '12px 10px', fontWeight: '700', color: '#111827', borderRight: '1px solid #f3f4f6' }}>
                        {profile?.store_name || (loading ? 'Loading...' : 'Retail Store')}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: '700' }}>{totalBills}</td>
                      <td style={{ padding: '12px 10px', color: '#16a34a' }}>{totalBills}</td>
                      <td style={{ padding: '12px 10px', color: '#16a34a', fontWeight: '700', borderRight: '1px solid #f3f4f6' }}>100%</td>
                      <td style={{ padding: '12px 10px', fontWeight: '800' }}>₹{totalRev.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 10px', borderRight: '1px solid #f3f4f6' }}>₹{aov.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 10px' }}>{newBills}</td>
                      <td style={{ padding: '12px 10px', borderRight: '1px solid #f3f4f6' }}>₹{newRev.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 10px' }}>{repeatBills}</td>
                      <td style={{ padding: '12px 10px', borderRight: '1px solid #f3f4f6' }}>₹{repeatRev.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 10px' }}>{feedbackCount}</td>
                      <td style={{ padding: '12px 10px', color: '#f59e0b', fontWeight: '700', borderRight: '1px solid #f3f4f6' }}>{avgRating} ★</td>
                      <td style={{ padding: '12px 10px', color: '#7c3aed', fontWeight: '700' }}>{loyaltyEarned} pts</td>
                      <td style={{ padding: '12px 10px', color: '#0284c7', fontWeight: '700' }}>{coupons.reduce((acc, c) => acc + (c.redeemed_count || 0), 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ROI EXPLORER (EXACT /roi-explorer/index) */}
          {activeMenu === 'roi-explorer' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 4px', color: '#111827' }}>
                    ROI Explorer
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                    Measure the net revenue and return on investment generated from WhatsApp billing notifications and offers.
                  </p>
                </div>
              </div>

              {/* 3 Top Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Cost of Campaign</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#111827', margin: '8px 0 2px' }}>₹0.00</div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Included in active billing tier</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Total Revenue Driven</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#10b981', margin: '8px 0 2px' }}>
                    ₹{totalRev.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669' }}>From {totalBills} digital receipts</div>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Return On Investment</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0284c7', margin: '8px 0 2px' }}>&infin; ROI</div>
                  <div style={{ fontSize: '0.75rem', color: '#0284c7' }}>High positive conversion margin</div>
                </div>
              </div>

              {/* Campaigns Table */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#111827' }}>Campaigns List</h3>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>#</th>
                      <th style={{ padding: '12px 16px' }}>Campaign Title</th>
                      <th style={{ padding: '12px 16px' }}>Channel Type</th>
                      <th style={{ padding: '12px 16px' }}>Target Audience</th>
                      <th style={{ padding: '12px 16px' }}>User Count</th>
                      <th style={{ padding: '12px 16px' }}>Revenue Driven</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px' }}>1</td>
                      <td style={{ padding: '12px 16px', fontWeight: '700' }}>WhatsApp Instant Bill Dispatch</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: '700' }}>WhatsApp WABA</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>All Billing Customers</td>
                      <td style={{ padding: '12px 16px' }}>{totalBills}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#16a34a' }}>₹{totalRev.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '700', fontSize: '0.75rem' }}>Active Auto-Pilot</span>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px' }}>2</td>
                      <td style={{ padding: '12px 16px', fontWeight: '700' }}>Google 5-Star Review Prompt</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: '700' }}>Google Place ID</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>Digital Receipt Viewers</td>
                      <td style={{ padding: '12px 16px' }}>{googleVisited} clicks</td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#16a34a' }}>SEO Uplift</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '9999px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: '700', fontSize: '0.75rem' }}>Active Auto-Pilot</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CAMPAIGNS HUB (EXACT /campaigns-hub/index) */}
          {activeMenu === 'campaigns-hub' && (
            <div>
              {/* Header and Credit Badges Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: '800', margin: '0 0 4px', color: '#111827' }}>
                    Campaigns &amp; Automation Hub
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>
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
                      🎯 Campaigns Catalog
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
                      setSmsCredits(c => c + 500);
                      setWaCredits(c => c + 500);
                      setCampaignSuccessToast('Recharge successful! +500 SMS and +500 WhatsApp credits added.');
                      setTimeout(() => setCampaignSuccessToast(''), 4000);
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

              {/* Toast */}
              {campaignSuccessToast && (
                <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '10px 16px', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.85rem' }}>
                  <CheckCircle style={{ width: '18px', height: '18px', color: '#10b981' }} />
                  <span>{campaignSuccessToast}</span>
                </div>
              )}

              {/* VIEW 1: CATALOG OF 4 SECTIONS */}
              {campaignView === 'hub' ? (
                <div>
                  {/* SECTION 1: MANUAL CAMPAIGNS */}
                  <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', margin: '0 0 1rem' }}>
                      Manual Campaign
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                      {manualCampaignsList.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => openCampaignSetup(c)}
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                          }}
                        >
                          <div style={{ height: '145px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                            <img
                              src={c.image}
                              alt={c.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.src = '/campaigns/whatsapp_campaign.jpg'; }}
                            />
                          </div>
                          <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                            <div>
                              <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: '800', color: '#111827' }}>
                                {c.title}
                              </h4>
                              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>
                                {c.desc}
                              </p>
                            </div>
                            <button
                              style={{
                                marginTop: '1.25rem',
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #bfdbfe',
                                backgroundColor: '#eff6ff',
                                color: '#1d4ed8',
                                fontWeight: '700',
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              {c.actionText}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 2: AUTOMATION CAMPAIGNS */}
                  <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', margin: '0 0 1rem' }}>
                      Automation Campaigns
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                      {automationCampaignsList.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => openCampaignSetup(c)}
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                          }}
                        >
                          <div style={{ height: '145px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                            <img
                              src={c.image}
                              alt={c.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.src = '/campaigns/birthday_campaign.jpg'; }}
                            />
                          </div>
                          <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#111827' }}>
                                  {c.title}
                                </h4>
                                <span style={{ backgroundColor: '#fef9c3', padding: '3px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <img src="/campaigns/waving.png" alt="waving" style={{ width: '22px', height: '22px' }} />
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>
                                {c.desc}
                              </p>
                            </div>
                            <button
                              style={{
                                marginTop: '1.25rem',
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#fef9c3',
                                color: '#854d0e',
                                fontWeight: '700',
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              {c.actionText}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 3: AUTOMATION EVENTS */}
                  <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', margin: '0 0 1rem' }}>
                      Automation Events
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                      {automationEventsList.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => openCampaignSetup(c)}
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                          }}
                        >
                          <div style={{ height: '145px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                            <img
                              src={c.image}
                              alt={c.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.src = '/campaigns/on_bill_sent.jpg'; }}
                            />
                          </div>
                          <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <div>
                                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#111827' }}>
                                    {c.title}
                                  </h4>
                                  {c.subtitle && (
                                    <small style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: '600' }}>{c.subtitle}</small>
                                  )}
                                </div>
                                <span style={{ backgroundColor: '#fef9c3', padding: '3px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <img src="/campaigns/waving.png" alt="waving" style={{ width: '22px', height: '22px' }} />
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>
                                {c.desc}
                              </p>
                            </div>
                            <button
                              style={{
                                marginTop: '1.25rem',
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#fef9c3',
                                color: '#854d0e',
                                fontWeight: '700',
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              {c.actionText}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 4: REMINDERS */}
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#111827', margin: '0 0 1rem' }}>
                      Reminders
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                      {remindersList.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => openCampaignSetup(c)}
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                          }}
                        >
                          <div style={{ height: '145px', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                            <img
                              src={c.image}
                              alt={c.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.currentTarget.src = '/campaigns/outstanding_balance_points.jpg'; }}
                            />
                          </div>
                          <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#111827' }}>
                                  {c.title}
                                </h4>
                                <span style={{ backgroundColor: '#fef9c3', padding: '3px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <img src="/campaigns/waving.png" alt="waving" style={{ width: '22px', height: '22px' }} />
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45 }}>
                                {c.desc}
                              </p>
                            </div>
                            <button
                              style={{
                                marginTop: '1.25rem',
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#fef9c3',
                                color: '#854d0e',
                                fontWeight: '700',
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              {c.actionText}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* VIEW 2: BROADCAST & PERFORMANCE LEDGER (MATCHING /whatsapp-campaign/index) */
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: '800', color: '#111827' }}>
                        Campaigns Performance &amp; ROI Ledger
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                        Track WhatsApp and SMS broadcast delivery, conversion rates, and revenue driven
                      </p>
                    </div>

                    <button
                      onClick={() => openCampaignSetup(manualCampaignsList[1])}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus style={{ width: '16px', height: '16px' }} />
                      <span>Create New Broadcast</span>
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                        <tr>
                          <th style={{ padding: '12px 14px' }}>#</th>
                          <th style={{ padding: '12px 14px' }}>Campaign Date</th>
                          <th style={{ padding: '12px 14px' }}>Template / Title</th>
                          <th style={{ padding: '12px 14px' }}>Channel</th>
                          <th style={{ padding: '12px 14px' }}>Audience</th>
                          <th style={{ padding: '12px 14px' }}>Recipients</th>
                          <th style={{ padding: '12px 14px' }}>Credits</th>
                          <th style={{ padding: '12px 14px' }}>Cost (₹)</th>
                          <th style={{ padding: '12px 14px' }}>Bills</th>
                          <th style={{ padding: '12px 14px' }}>Revenue (₹)</th>
                          <th style={{ padding: '12px 14px' }}>ROI</th>
                          <th style={{ padding: '12px 14px' }}>Avg Bill</th>
                          <th style={{ padding: '12px 14px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaignLedger.map((row, idx) => (
                          <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: '600' }}>{idx + 1}</td>
                            <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1e293b' }}>{row.date}</td>
                            <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0284c7' }}>{row.title}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: row.channel === 'WhatsApp' ? '#dcfce7' : '#dbeafe', color: row.channel === 'WhatsApp' ? '#166534' : '#1e40af', fontWeight: '700', fontSize: '0.72rem' }}>
                                {row.channel}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#475569' }}>{row.audience}</td>
                            <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1e293b' }}>{row.count}</td>
                            <td style={{ padding: '12px 14px', color: '#64748b' }}>{row.creditsSpent}</td>
                            <td style={{ padding: '12px 14px', color: '#475569' }}>₹{row.cost.toFixed(2)}</td>
                            <td style={{ padding: '12px 14px', fontWeight: '700', color: '#16a34a' }}>{row.billsCount}</td>
                            <td style={{ padding: '12px 14px', fontWeight: '800', color: '#0f172a' }}>₹{row.revenue.toLocaleString('en-IN')}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ color: '#16a34a', fontWeight: '800' }}>{row.roi}</span>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#475569' }}>₹{row.avgBill}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ padding: '3px 8px', borderRadius: '9999px', backgroundColor: row.status.includes('Active') ? '#fef9c3' : '#dcfce7', color: row.status.includes('Active') ? '#854d0e' : '#166534', fontWeight: '700', fontSize: '0.72rem' }}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: INVOICES (LIVE BILLING STREAM) */}
          {activeMenu === 'invoices' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 4px', color: '#111827' }}>
                    Digital Bill Stream
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                    Real-time sales invoices ingested via POS Print Interceptor or ERP REST API
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '320px' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '10px', width: '16px', height: '16px', color: '#9ca3af' }} />
                    <input
                      type="text"
                      placeholder="Search invoice #, phone, customer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    />
                  </div>
                  <button
                    onClick={loadData}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600' }}
                  >
                    <RefreshCw style={{ width: '14px', height: '14px' }} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Invoices Table */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 16px' }}>Invoice #</th>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px' }}>Customer</th>
                      <th style={{ padding: '12px 16px' }}>Amount (₹)</th>
                      <th style={{ padding: '12px 16px' }}>WhatsApp Status</th>
                      <th style={{ padding: '12px 16px' }}>Google Review</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                          No invoices found.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <tr key={inv.id || inv.shortId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: '#111827' }}>
                            #{inv.invoiceNumber}
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 'normal' }}>
                              Short ID: {inv.shortId}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.8rem' }}>
                            {inv.createdAt ? new Date(inv.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '600', color: '#111827' }}>{inv.customerName || 'Shopper'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{inv.customerPhone || 'N/A'}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: '800', color: '#111827' }}>
                            ₹{parseFloat(inv.billTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              backgroundColor: inv.whatsappStatus === 'read' ? '#dcfce7' : (inv.whatsappStatus === 'delivered' ? '#e0f2fe' : (inv.whatsappStatus === 'failed' ? '#fee2e2' : '#fef9c3')),
                              color: inv.whatsappStatus === 'read' ? '#166534' : (inv.whatsappStatus === 'delivered' ? '#0369a1' : (inv.whatsappStatus === 'failed' ? '#991b1b' : '#854d0e'))
                            }}>
                              {inv.whatsappStatus === 'read' && <CheckCircle style={{ width: '12px', height: '12px' }} />}
                              {inv.whatsappStatus === 'delivered' && <CheckCircle style={{ width: '12px', height: '12px' }} />}
                              {inv.whatsappStatus || 'sent'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {inv.hasReviewed ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: '800' }}>
                                <Star style={{ width: '12px', height: '12px', fill: '#f59e0b', color: '#f59e0b' }} />
                                <span>Reviewed ⭐</span>
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                Pending
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <a
                              href={`/t/${inv.shortId}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '6px',
                                color: '#0284c7',
                                fontWeight: '700',
                                fontSize: '0.75rem',
                                textDecoration: 'none'
                              }}
                            >
                              <Eye style={{ width: '12px', height: '12px' }} />
                              <span>View Receipt</span>
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMERS (COMPREHENSIVE CUSTOMER HUB & ENRICHMENT) */}
          {activeMenu === 'customers' && (
            <div>
              {/* SUB-TABS NAVIGATION (MATCHING BILLFREE ARCHITECTURE) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
                  {[
                    { id: 'customers', label: '😎 Customers', count: customers.length },
                    { id: 'profiles', label: '🧑 Profiles', count: customers.filter(c => c.profile_status === 'complete').length },
                    { id: 'journey', label: '🛣️ Customer Journey' },
                    { id: 'optout', label: '🚫 Opt-out Customers', count: optoutList.length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setCustomerSubtab(tab.id);
                        if (tab.id === 'optout') handleLoadOptouts();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: customerSubtab === tab.id ? '#0284c7' : 'transparent',
                        color: customerSubtab === tab.id ? '#ffffff' : '#475569',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.12s'
                      }}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          backgroundColor: customerSubtab === tab.id ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                          color: customerSubtab === tab.id ? '#ffffff' : '#64748b'
                        }}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenProfileModal(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '0.8rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus style={{ width: '15px', height: '15px' }} />
                    <span>+ Create Profile</span>
                  </button>
                </div>
              </div>

              {/* 1. CUSTOMERS SUB-TAB */}
              {customerSubtab === 'customers' && (
                <div>
                  {/* Quick Insight Bar (Matching Screenshot 2) */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111827' }}>
                        Quick Insight ✨
                        <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', marginLeft: '6px' }}>
                          Over lifetime customer activity
                        </span>
                      </div>
                      {(dormantFilter !== 'all' || customerFilterCohort !== 'all' || profileStatusFilter !== 'all' || visitFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setDormantFilter('all');
                            setCustomerFilterCohort('all');
                            setProfileStatusFilter('all');
                            setVisitFilter('all');
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          ✕ Clear Filters
                        </button>
                      )}
                    </div>

                    {/* Stat Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '1rem' }}>
                      {[
                        { id: 'all', label: 'All Customers', count: customerInsights?.all || customers.length, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
                        { id: 'active_3m', label: 'Active In 3 Months', count: customerInsights?.active_3m || 0, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                        { id: 'dormant_3_6m', label: 'Dormant 3-6 Months', count: customerInsights?.dormant_3_6m || 0, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                        { id: 'dormant_6_12m', label: 'Dormant 6-12 Months', count: customerInsights?.dormant_6_12m || 0, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
                        { id: 'dormant_12p_m', label: 'Dormant 12+ Months', count: customerInsights?.dormant_12p_m || 0, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
                      ].map(stat => (
                        <div
                          key={stat.id}
                          onClick={() => setDormantFilter(dormantFilter === stat.id ? 'all' : stat.id)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: stat.bg,
                            border: dormantFilter === stat.id ? `2px solid ${stat.color}` : `1px solid ${stat.border}`,
                            cursor: 'pointer',
                            transition: 'all 0.12s'
                          }}
                        >
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: stat.color, marginBottom: '2px' }}>
                            {stat.label}
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: stat.color }}>
                            {stat.count}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Customer Visits Distribution Bar */}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                        Customer Visits 🥰
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        {[
                          { val: '1', label: '1 Time', count: customerInsights?.visits?.v1 || 0, bg: '#2563eb' },
                          { val: '2', label: '2 Times', count: customerInsights?.visits?.v2 || 0, bg: '#0284c7' },
                          { val: '3', label: '3 Times', count: customerInsights?.visits?.v3 || 0, bg: '#059669' },
                          { val: '4', label: '4 Times', count: customerInsights?.visits?.v4 || 0, bg: '#d97706' },
                          { val: '5', label: '5+ Times', count: customerInsights?.visits?.v5_plus || 0, bg: '#ea580c' },
                          { val: '10', label: '10+ Times', count: customerInsights?.visits?.v10_plus || 0, bg: '#7c3aed' }
                        ].map(v => (
                          <div
                            key={v.val}
                            onClick={() => setVisitFilter(visitFilter === v.val ? 'all' : v.val)}
                            style={{
                              backgroundColor: v.bg,
                              color: '#ffffff',
                              padding: '8px 4px',
                              textAlign: 'center',
                              cursor: 'pointer',
                              borderRight: '1px solid rgba(255,255,255,0.2)',
                              opacity: (visitFilter === 'all' || visitFilter === v.val) ? 1 : 0.4
                            }}
                          >
                            <div style={{ fontSize: '0.95rem', fontWeight: '800' }}>{v.count}</div>
                            <div style={{ fontSize: '0.68rem', opacity: 0.9 }}>{v.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Customer Table */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Showing <strong>{
                          customers
                            .filter(c => profileStatusFilter === 'all' || (profileStatusFilter === 'not_exist' ? (!c.profile_status || c.profile_status === 'not_exist') : c.profile_status === profileStatusFilter))
                            .filter(c => dormantFilter === 'all' || c.dormancy === dormantFilter)
                            .filter(c => customerFilterCohort === 'all' || (c.rfm_cohort || c.profile_status) === customerFilterCohort)
                            .filter(c => visitFilter === 'all' || (visitFilter === '5' ? c.no_of_visits >= 5 : (visitFilter === '10' ? c.no_of_visits >= 10 : c.no_of_visits === parseInt(visitFilter))))
                            .length
                        }</strong> of <strong>{customers.length}</strong> items.
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Profile Status Filter Dropdown */}
                        <select
                          value={profileStatusFilter}
                          onChange={(e) => setProfileStatusFilter(e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: '#f8fafc',
                            color: '#334155'
                          }}
                        >
                          <option value="all">Profile Status: All</option>
                          <option value="complete">Complete</option>
                          <option value="incomplete">Incomplete</option>
                          <option value="not_exist">Not Exist</option>
                        </select>

                        <button
                          onClick={() => {
                            const filtered = customers;
                            const headers = ['Phone', 'Customer Name', 'Profile Status', 'Visits', 'Lifetime Spend', 'Loyalty Points'];
                            const rows = filtered.map(c => [c.phone, c.customer_name || '', c.profile_status || '', c.no_of_visits || 1, c.lifetime_value || 0, c.loyalty_points || 0]);
                            const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement('a');
                            link.setAttribute('href', encodedUri);
                            link.setAttribute('download', `customers_${Date.now()}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <Download style={{ width: '13px', height: '13px' }} />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '10px 12px', width: '30px' }}>#</th>
                            <th style={{ padding: '10px 12px' }}>Store</th>
                            <th style={{ padding: '10px 12px' }}>Profile Status</th>
                            <th style={{ padding: '10px 12px' }}>Customer Name</th>
                            <th style={{ padding: '10px 12px' }}>Phone Numbers</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center' }}>No of Visit</th>
                            <th style={{ padding: '10px 12px' }}>Lifetime Value</th>
                            <th style={{ padding: '10px 12px' }}>Avg Trx. Value</th>
                            <th style={{ padding: '10px 12px' }}>Last Bill Value</th>
                            <th style={{ padding: '10px 12px' }}>Last Bill Date</th>
                            <th style={{ padding: '10px 12px' }}>Max Bill Amt.</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers
                            .filter(c => profileStatusFilter === 'all' || (profileStatusFilter === 'not_exist' ? (!c.profile_status || c.profile_status === 'not_exist') : c.profile_status === profileStatusFilter))
                            .filter(c => dormantFilter === 'all' || c.dormancy === dormantFilter)
                            .filter(c => customerFilterCohort === 'all' || (c.rfm_cohort || c.profile_status) === customerFilterCohort)
                            .filter(c => visitFilter === 'all' || (visitFilter === '5' ? c.no_of_visits >= 5 : (visitFilter === '10' ? c.no_of_visits >= 10 : c.no_of_visits === parseInt(visitFilter))))
                            .length === 0 ? (
                            <tr>
                              <td colSpan={12} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                                No customers match the selected filter criteria.
                              </td>
                            </tr>
                          ) : (
                            customers
                              .filter(c => profileStatusFilter === 'all' || (profileStatusFilter === 'not_exist' ? (!c.profile_status || c.profile_status === 'not_exist') : c.profile_status === profileStatusFilter))
                              .filter(c => dormantFilter === 'all' || c.dormancy === dormantFilter)
                              .filter(c => customerFilterCohort === 'all' || (c.rfm_cohort || c.profile_status) === customerFilterCohort)
                              .filter(c => visitFilter === 'all' || (visitFilter === '5' ? c.no_of_visits >= 5 : (visitFilter === '10' ? c.no_of_visits >= 10 : c.no_of_visits === parseInt(visitFilter))))
                              .map((c, i) => (
                                <tr key={c.phone || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: '600' }}>{i + 1}</td>
                                  <td style={{ padding: '10px 12px', color: '#334155', fontWeight: '600', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {profile?.store_name || (loading ? 'Loading...' : 'Retail Store')}
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>
                                    {c.profile_status === 'complete' ? (
                                      <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: '800' }}>
                                        Complete
                                      </span>
                                    ) : (c.profile_status === 'incomplete' ? (
                                      <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.7rem', fontWeight: '800' }}>
                                        Incomplete
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleOpenProfileModal(c)}
                                        style={{ background: 'none', border: 'none', padding: 0, color: '#0284c7', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}
                                      >
                                        Not Exist (Add in profile)
                                      </button>
                                    ))}
                                  </td>
                                  <td style={{ padding: '10px 12px', fontWeight: '700', color: '#111827' }}>
                                    {c.customer_name || 'DUMMYCUST'}
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <a
                                        href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}
                                      >
                                        {c.phone.slice(0, 2)}XXXXXX{c.phone.slice(-2)}
                                      </a>
                                    </div>
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: '#111827' }}>
                                    {c.no_of_visits || 1}
                                  </td>
                                  <td style={{ padding: '10px 12px', fontWeight: '800', color: '#111827' }}>
                                    ₹{(c.lifetime_value || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td style={{ padding: '10px 12px', color: '#475569' }}>
                                    ₹{(c.avg_trx_value || c.lifetime_value || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td style={{ padding: '10px 12px', color: '#475569' }}>
                                    ₹{(c.last_bill_value || c.lifetime_value || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '0.75rem' }}>
                                    {c.last_bill_date ? new Date(c.last_bill_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                                  </td>
                                  <td style={{ padding: '10px 12px', fontWeight: '700', color: '#111827' }}>
                                    ₹{(c.max_bill_amount || c.last_bill_value || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                      <button
                                        onClick={() => handleLoadJourney(c.phone)}
                                        title="View Customer Journey"
                                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0284c7', fontWeight: '700', fontSize: '0.72rem', cursor: 'pointer' }}
                                      >
                                        🛣️ Journey
                                      </button>
                                      <button
                                        onClick={() => handleOpenProfileModal(c)}
                                        title="Edit Profile"
                                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '700', fontSize: '0.72rem', cursor: 'pointer' }}
                                      >
                                        ✏️ Edit
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. PROFILES SUB-TAB */}
              {customerSubtab === 'profiles' && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                    {[
                      { id: 'all', label: `All Profiles (${customers.length})` },
                      { id: 'birthday', label: `🎂 Upcoming Birthdays (${customerInsights?.upcoming_birthdays || 0})` },
                      { id: 'anniversary', label: `💍 Upcoming Anniversaries (${customerInsights?.upcoming_anniversaries || 0})` }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setCustomerProfileFilter(f.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          border: customerProfileFilter === f.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                          backgroundColor: customerProfileFilter === f.id ? '#f0f9ff' : '#ffffff',
                          color: customerProfileFilter === f.id ? '#0284c7' : '#475569',
                          fontWeight: '700',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '10px 12px' }}>#</th>
                          <th style={{ padding: '10px 12px' }}>Name</th>
                          <th style={{ padding: '10px 12px' }}>Mobile</th>
                          <th style={{ padding: '10px 12px' }}>DOB</th>
                          <th style={{ padding: '10px 12px' }}>Anniversary</th>
                          <th style={{ padding: '10px 12px' }}>Email</th>
                          <th style={{ padding: '10px 12px' }}>Profession</th>
                          <th style={{ padding: '10px 12px' }}>Gender</th>
                          <th style={{ padding: '10px 12px' }}>Location</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers
                          .filter(c => customerProfileFilter === 'all' || (customerProfileFilter === 'birthday' ? c.is_birthday_upcoming : c.is_anniversary_upcoming))
                          .map((c, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{i + 1}</td>
                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#111827' }}>{c.customer_name || 'Valued Shopper'}</td>
                              <td style={{ padding: '10px 12px', color: '#0284c7', fontWeight: '600' }}>{c.phone}</td>
                              <td style={{ padding: '10px 12px' }}>{c.dob ? new Date(c.dob).toLocaleDateString('en-IN') : '--'}</td>
                              <td style={{ padding: '10px 12px' }}>{c.anniversary_date ? new Date(c.anniversary_date).toLocaleDateString('en-IN') : '--'}</td>
                              <td style={{ padding: '10px 12px', color: '#64748b' }}>{c.email || '--'}</td>
                              <td style={{ padding: '10px 12px', color: '#475569' }}>{c.profession || '--'}</td>
                              <td style={{ padding: '10px 12px' }}>{c.gender === 'f' ? 'Female' : (c.gender === 'o' ? 'Other' : 'Male')}</td>
                              <td style={{ padding: '10px 12px', color: '#64748b' }}>{c.city ? `${c.city}, ${c.state}` : '--'}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleOpenProfileModal(c)}
                                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0284c7', fontWeight: '700', fontSize: '0.72rem', cursor: 'pointer' }}
                                >
                                  Edit Profile
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. CUSTOMER JOURNEY SUB-TAB */}
              {customerSubtab === 'journey' && (
                <div>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                      Search Customer Journey
                    </div>
                    <div style={{ display: 'flex', gap: '8px', maxWidth: '440px', marginBottom: '10px' }}>
                      <input
                        type="tel"
                        placeholder="Enter customer mobile number"
                        value={journeyPhone}
                        onChange={(e) => setJourneyPhone(e.target.value)}
                        style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                      <button
                        onClick={() => handleLoadJourney(journeyPhone)}
                        style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        {journeyLoading ? 'Loading...' : 'Lookup Journey'}
                      </button>
                    </div>

                    {/* Quick Phone Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Recent Shoppers:</span>
                      {customers.slice(0, 5).map(c => (
                        <button
                          key={c.phone}
                          onClick={() => handleLoadJourney(c.phone)}
                          style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.72rem', color: '#0284c7', fontWeight: '600', cursor: 'pointer' }}
                        >
                          {c.customer_name || 'Customer'} ({c.phone.slice(-4)})
                        </button>
                      ))}
                    </div>
                  </div>

                  {journeyData ? (
                    <div>
                      {/* Customer Summary Card */}
                      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
                              {journeyData.profile?.customer_name || 'Valued Shopper'}
                            </h3>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              📱 {journeyData.profile?.phone} &bull; Registered {journeyData.profile?.city ? `(${journeyData.profile.city})` : ''}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '14px' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Invoices</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>{journeyData.summary?.total_invoices || 0}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Lifetime Spend</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#16a34a' }}>₹{(journeyData.summary?.lifetime_spend || 0).toLocaleString('en-IN')}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Loyalty Balance</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#7c3aed' }}>{journeyData.summary?.loyalty_points || 0} pts</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline Events */}
                      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#111827', marginBottom: '1.25rem' }}>
                          Chronological Interaction Journey
                        </div>

                        <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #e2e8f0', marginLeft: '8px' }}>
                          {(journeyData.timeline || []).map((event, idx) => (
                            <div key={idx} style={{ marginBottom: '1.5rem', position: 'relative' }}>
                              <div style={{
                                position: 'absolute',
                                left: '-31px',
                                top: '0px',
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: event.type === 'invoice' ? '#0284c7' : (event.type === 'feedback' ? '#f59e0b' : '#16a34a'),
                                border: '2px solid #ffffff'
                              }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#111827' }}>
                                  {event.title}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                  {new Date(event.timestamp).toLocaleString('en-IN')}
                                </div>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                                {event.details}
                              </div>
                              {event.short_id && (
                                <a
                                  href={`/t/${event.short_id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: '700', textDecoration: 'underline', marginTop: '4px', display: 'inline-block' }}
                                >
                                  View Public Bill &rarr;
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                      Enter a customer mobile number above to see their complete interaction journey.
                    </div>
                  )}
                </div>
              )}

              {/* 4. OPTOUT SUB-TAB */}
              {customerSubtab === 'optout' && (
                <div>
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: '800', color: '#111827' }}>
                          DPDP Act &amp; WhatsApp Anti-Spam Opt-Out List
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                          Numbers on this list will never receive promotional broadcasts or automated campaign messages.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAddOptout(true)}
                        style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '700', fontSize: '0.75rem', border: 'none', cursor: 'pointer' }}
                      >
                        + Add Number to DND
                      </button>
                    </div>

                    {showAddOptout && (
                      <form onSubmit={handleAddOptout} style={{ display: 'flex', gap: '8px', marginTop: '10px', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                        <input
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={newOptoutPhone}
                          onChange={(e) => setNewOptoutPhone(e.target.value)}
                          style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                        />
                        <input
                          type="text"
                          placeholder="Reason (e.g. customer requested stop)"
                          value={newOptoutReason}
                          onChange={(e) => setNewOptoutReason(e.target.value)}
                          style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                        />
                        <button
                          type="submit"
                          style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Save DND
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddOptout(false)}
                          style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </div>

                  <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '10px 12px' }}>#</th>
                          <th style={{ padding: '10px 12px' }}>User Phone</th>
                          <th style={{ padding: '10px 12px' }}>Channel</th>
                          <th style={{ padding: '10px 12px' }}>Reason</th>
                          <th style={{ padding: '10px 12px' }}>Date Added</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optoutList.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                              No customers have opted out. Your messaging list is in good standing!
                            </td>
                          </tr>
                        ) : (
                          optoutList.map((item, idx) => (
                            <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{idx + 1}</td>
                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#111827' }}>{item.phone}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.7rem', fontWeight: '800' }}>
                                  {item.channel?.toUpperCase() || 'WHATSAPP'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.reason || 'DND'}</td>
                              <td style={{ padding: '10px 12px', color: '#64748b' }}>{new Date(item.created_at).toLocaleDateString('en-IN')}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleRemoveOptout(item.id)}
                                  style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid #fee2e2', backgroundColor: '#ffffff', color: '#dc2626', fontSize: '0.72rem', cursor: 'pointer' }}
                                >
                                  Remove DND
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
            </div>
          )}

          {/* TAB 7: FEEDBACK (ADVANCED DISSATISFACTION SHIELD & GOOGLE REVIEW AMPLIFIER) */}
          {activeMenu === 'feedback' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 4px', color: '#111827' }}>
                    Customer Feedback &amp; Dissatisfaction Shield
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                    Intercept 1-3★ feedback privately before it reaches Google Maps, and auto-route 5★ happy customers to public Google Reviews.
                  </p>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>#</th>
                      <th style={{ padding: '12px 16px' }}>Shield Status</th>
                      <th style={{ padding: '12px 16px' }}>Customer Name</th>
                      <th style={{ padding: '12px 16px' }}>Phone</th>
                      <th style={{ padding: '12px 16px' }}>Invoice No.</th>
                      <th style={{ padding: '12px 16px' }}>Rating</th>
                      <th style={{ padding: '12px 16px' }}>Customer Feedback</th>
                      <th style={{ padding: '12px 16px' }}>Resolution</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackList.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                          No feedback responses recorded yet.
                        </td>
                      </tr>
                    ) : (
                      feedbackList.map((f, i) => {
                        const isNegative = (f.rating || 5) <= 3;
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: isNegative ? '#fffaf8' : '#ffffff' }}>
                            <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{f.id || i + 1}</td>
                            <td style={{ padding: '12px 16px' }}>
                              {isNegative ? (
                                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.72rem', fontWeight: '800' }}>
                                  ⚠️ Dissatisfied (Private)
                                </span>
                              ) : (
                                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.72rem', fontWeight: '800' }}>
                                  ⭐ 5★ Google Promoter
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: '700', color: '#111827' }}>{f.customer_name || 'Verified Shopper'}</td>
                            <td style={{ padding: '12px 16px', color: '#4b5563' }}>{f.customer_phone}</td>
                            <td style={{ padding: '12px 16px', fontWeight: '600' }}>#{f.invoice_number || f.short_id}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ color: isNegative ? '#ef4444' : '#f59e0b', fontWeight: '800', letterSpacing: '2px' }}>
                                {'★'.repeat(f.rating || 5)}{'☆'.repeat(5 - (f.rating || 5))}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#374151', fontStyle: 'italic', maxWidth: '240px' }}>
                              "{f.comment || (isNegative ? 'Needs improvement' : 'Great experience!')}"
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {isNegative ? (
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: '700',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  backgroundColor: f.resolution_status === 'resolved' ? '#dcfce7' : '#ffedd5',
                                  color: f.resolution_status === 'resolved' ? '#166534' : '#9a3412'
                                }}>
                                  {f.resolution_status === 'resolved' ? '✓ Resolved' : (f.resolution_status === 'in_progress' ? 'In Progress' : 'Pending Action')}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600' }}>
                                  ✓ Public Review Prompted
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                {isNegative && (
                                  <button
                                    onClick={() => { setActiveFeedbackModal(f); setResolutionNotes(f.resolution_notes || ''); }}
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid #fed7aa',
                                      backgroundColor: '#fff7ed',
                                      color: '#ea580c',
                                      fontWeight: '700',
                                      fontSize: '0.72rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    🛠️ Resolve &amp; WhatsApp
                                  </button>
                                )}
                                <a
                                  href={`/t/${f.short_id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#0284c7', fontWeight: '700', fontSize: '0.72rem', textDecoration: 'none' }}
                                >
                                  See Bill
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: COUPONS (EXACT /coupon-dashboard/index SCHEMA) */}
          {activeMenu === 'coupon' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 4px', color: '#111827' }}>
                    Coupons &amp; Adhoc Discounts
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                    Issue promotional coupon codes attached to customer digital receipts and WhatsApp messages.
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateCoupon(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: '#0284c7', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  <span>Create Coupon</span>
                </button>
              </div>

              {/* Coupons Table */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px' }}>#</th>
                      <th style={{ padding: '12px 16px' }}>Coupon Code</th>
                      <th style={{ padding: '12px 16px' }}>Title</th>
                      <th style={{ padding: '12px 16px' }}>Discount</th>
                      <th style={{ padding: '12px 16px' }}>Min Bill</th>
                      <th style={{ padding: '12px 16px' }}>All Coupons</th>
                      <th style={{ padding: '12px 16px' }}>Redeemed</th>
                      <th style={{ padding: '12px 16px' }}>Available</th>
                      <th style={{ padding: '12px 16px' }}>Expiry</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: '2.5rem', textAlign: 'center', color: '#6b7280' }}>
                          No coupons created yet.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((c, i) => (
                        <tr key={c.id || i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{c.id || i + 1}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '800', color: '#0284c7' }}>{c.code}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '600' }}>{c.title}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: '#16a34a' }}>
                            {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                          </td>
                          <td style={{ padding: '12px 16px' }}>₹{c.min_bill_amount || 0}</td>
                          <td style={{ padding: '12px 16px' }}>{c.total_coupons}</td>
                          <td style={{ padding: '12px 16px', color: '#d97706', fontWeight: '700' }}>{c.redeemed_count || 0}</td>
                          <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: '700' }}>
                            {Math.max(0, (c.total_coupons || 0) - (c.redeemed_count || 0))}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.78rem' }}>
                            {c.valid_until ? new Date(c.valid_until).toLocaleDateString('en-IN') : 'Ongoing'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: c.is_active ? '#dcfce7' : '#fee2e2', color: c.is_active ? '#166534' : '#991b1b', fontWeight: '700', fontSize: '0.72rem' }}>
                              {c.is_active ? 'Active' : 'Expired'}
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

          {/* TAB 9: REDEEM REWARD (COUNTER CASHIER POS SCREEN) */}
          {activeMenu === 'redeem' && (
            <div style={{ maxWidth: '750px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '1.75rem', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: '800', color: '#111827' }}>
                  Counter Point-of-Sale Redemption
                </h3>
                <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  Look up a customer's phone at checkout to instantly apply coupons or redeem loyalty points against their purchase.
                </p>

                <form onSubmit={handleCustomerRedeemLookup} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Enter customer 10-digit mobile number (e.g. 9876543210)"
                    value={redeemPhone}
                    onChange={(e) => setRedeemPhone(e.target.value)}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem' }}
                  />
                  <button
                    type="submit"
                    style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                  >
                    Lookup Rewards
                  </button>
                </form>
              </div>

              {searchedCustomer && (
                <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
                        {searchedCustomer.customer_name || 'Customer'}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Mobile: +91 {searchedCustomer.phone}</span>
                    </div>
                    <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: '700' }}>WALLET BALANCE</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#065f46' }}>
                        {searchedCustomer.loyalty_points || 60} pts (₹{(searchedCustomer.loyalty_points || 60).toFixed(2)})
                      </div>
                    </div>
                  </div>

                  <h5 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase' }}>
                    Available Store Coupons
                  </h5>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    {coupons.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fcfcfc' }}>
                        <div>
                          <strong style={{ color: '#0284c7', fontSize: '0.9rem' }}>{c.code}</strong> &bull; {c.title}
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {c.discount_type === 'percentage' ? `${c.discount_value}% Discount` : `₹${c.discount_value} Flat Off`} on min bill of ₹{c.min_bill_amount}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setRedeemSuccess(`Applied ${c.code} successfully! Deducting ₹${c.discount_value} from bill.`);
                            setTimeout(() => setRedeemSuccess(''), 4000);
                          }}
                          style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#ffffff', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          Apply to Bill
                        </button>
                      </div>
                    ))}
                  </div>

                  {redeemSuccess && (
                    <div style={{ marginTop: '1rem', backgroundColor: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', textAlign: 'center' }}>
                      {redeemSuccess}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 10: GREETING CARDS (EXACT /greeting-cards/index) */}
          {activeMenu === 'greeting-cards' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 4px', color: '#111827' }}>
                    Festive &amp; Greeting Cards Catalog
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                    Pre-curated festival greeting banners attached to digital billing receipts for seasonal celebrations.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {[
                  { title: 'Durga Puja Special 50% Off', img: '/offers/durga_puja_offer.png', purpose: 'Festive Greeting & Offer', status: 'Active' },
                  { title: 'Grand Festive Wedding Sale', img: '/offers/festive_wedding_sale.png', purpose: 'Wedding Collection 2026', status: 'Active' },
                  { title: 'Diwali Special Shubh Deepawali', img: '/offers/festive_durga_puja.png', purpose: 'Diwali Festive Savings', status: 'Active' }
                ].map((card, i) => (
                  <div key={i} style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    <div style={{ height: '160px', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={card.img} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: '800', color: '#111827' }}>{card.title}</h4>
                      <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#6b7280' }}>Purpose: {card.purpose}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: '700', fontSize: '0.7rem' }}>
                          {card.status}
                        </span>
                        <button style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #0284c7', backgroundColor: '#f0f9ff', color: '#0284c7', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}>
                          Send on WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: LOYALTY RULES */}
          {activeMenu === 'loyalty' && (
            <div style={{ maxWidth: '600px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '1.75rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: '800', color: '#111827' }}>
                  Loyalty Points Earning &amp; Redemption Rules
                </h3>

                <form onSubmit={handleSaveLoyalty} style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#4b5563', marginBottom: '4px' }}>
                      Rupees Spent Per 1 Loyalty Point
                    </label>
                    <input
                      type="number"
                      value={loyalty.rupees_per_point}
                      onChange={(e) => setLoyalty({ ...loyalty, rupees_per_point: parseInt(e.target.value, 10) })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>e.g. Spend ₹100 = 1 point</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#4b5563', marginBottom: '4px' }}>
                      Min Points Threshold to Redeem
                    </label>
                    <input
                      type="number"
                      value={loyalty.min_points_redeem}
                      onChange={(e) => setLoyalty({ ...loyalty, min_points_redeem: parseInt(e.target.value, 10) })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#4b5563', marginBottom: '4px' }}>
                      Discount Value Per 1 Point (₹)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={loyalty.discount_value}
                      onChange={(e) => setLoyalty({ ...loyalty, discount_value: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{ padding: '9px 18px', borderRadius: '8px', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', border: 'none', cursor: 'pointer', marginTop: '6px' }}
                  >
                    Save Loyalty Rules
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 12: WHATSAPP SETTINGS */}
          {activeMenu === 'whatsapp' && (
            <div style={{ maxWidth: '650px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '1.75rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: '800', color: '#111827' }}>
                  WhatsApp Gateway (WABA) Settings
                </h3>

                <form onSubmit={handleSaveWaba} style={{ display: 'grid', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                      WABA Gateway Provider
                    </label>
                    <select
                      value={wabaForm.waba_provider}
                      onChange={(e) => setWabaForm({ ...wabaForm, waba_provider: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                      <option value="waba_custom">WABA Gateway (waba.mpocket.in)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                      WABA Bearer Access Token
                    </label>
                    <input
                      type="password"
                      placeholder="Paste WABA access token"
                      value={wabaForm.waba_access_token}
                      onChange={(e) => setWabaForm({ ...wabaForm, waba_access_token: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Phone Number ID
                    </label>
                    <input
                      type="text"
                      value={wabaForm.phone_number_id}
                      onChange={(e) => setWabaForm({ ...wabaForm, phone_number_id: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{ padding: '10px 22px', borderRadius: '8px', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                    >
                      {saving ? 'Saving...' : 'Save WhatsApp Settings'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 13: QUICK LINKS & BRANDING */}
          {activeMenu === 'quick-links' && (
            <div style={{ maxWidth: '850px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 4px', color: '#111827' }}>
                  Store Branding &amp; Google Review Configuration
                </h2>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  Configure your store identity, Google Place ID for 1-click write-review popups, and social links.
                </p>

                <form onSubmit={handleSaveBranding} style={{ display: 'grid', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Store Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={brandingForm.store_name}
                        onChange={(e) => setBrandingForm({ ...brandingForm, store_name: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                        GSTIN / Tax ID
                      </label>
                      <input
                        type="text"
                        placeholder="27ABCDE1234F1Z5"
                        value={brandingForm.gstin}
                        onChange={(e) => setBrandingForm({ ...brandingForm, gstin: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Google Review Trigger Box */}
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Star style={{ width: '18px', height: '18px', fill: '#16a34a', color: '#16a34a' }} />
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#166534' }}>
                        Google Review 1-Click Write Dialog
                      </h4>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: '#15803d' }}>
                      Enter your Google Place ID to open the 5-star write-review popup directly for customers.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>
                          Google Place ID
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ChIJLzbyWhvp5zsRk6DeaWJXVRU"
                          value={brandingForm.google_place_id}
                          onChange={(e) => setBrandingForm({ ...brandingForm, google_place_id: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #86efac', backgroundColor: '#ffffff', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#166534', marginBottom: '4px' }}>
                          Or Google Share Link
                        </label>
                        <input
                          type="text"
                          placeholder="https://share.google/... or https://g.page/r/..."
                          value={brandingForm.google_review_url}
                          onChange={(e) => setBrandingForm({ ...brandingForm, google_review_url: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #86efac', backgroundColor: '#ffffff', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Handles */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Instagram Profile URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/yourstore"
                        value={brandingForm.instagram_url}
                        onChange={(e) => setBrandingForm({ ...brandingForm, instagram_url: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Facebook Page URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://facebook.com/yourstore"
                        value={brandingForm.facebook_url}
                        onChange={(e) => setBrandingForm({ ...brandingForm, facebook_url: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{ padding: '10px 22px', borderRadius: '8px', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                    >
                      {saving ? 'Saving...' : 'Save Quick Links'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 14: DOWNLOAD CENTER */}
          {activeMenu === 'downloads' && (
            <div style={{ maxWidth: '800px' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '1.75rem' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: '800', color: '#111827' }}>
                  Download Center &amp; POS Print Interceptor
                </h3>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  Download the Windows thermal printer interceptor or connect your RetailNode ERP.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '1.5rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: '800', color: '#0284c7' }}>
                      DigitalBillAgent.exe (Windows Thermal Print Interceptor)
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#0369a1' }}>
                      Silently intercepts ESC/POS thermal bills from Tally, Busy, or Marg to send WhatsApp digital bills.
                    </p>
                  </div>
                  <a
                    href="/downloads/DigitalBillAgent.exe"
                    download
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', fontSize: '0.8rem', textDecoration: 'none' }}
                  >
                    <Download style={{ width: '15px', height: '15px' }} />
                    <span>Download</span>
                  </a>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>
                    Sample cURL Ingestion Payload
                  </h4>
                  <pre style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '1rem', borderRadius: '8px', fontSize: '0.75rem', overflowX: 'auto' }}>
{`curl -X POST https://bill.retailnode.in/api/v1/invoices \\
  -H "Content-Type: application/json" \\
  -H "x-api-token: ${profile?.api_token || 'sk_live_YOUR_TOKEN'}" \\
  -d '{
    "invoiceNumber": "INV-2026-001",
    "customerPhone": "9876543210",
    "billTotal": 2499.00
  }'`}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL: CREATE COUPON */}
      {showCreateCoupon && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>Create New Promo Coupon</h3>
            
            <form onSubmit={handleCreateCouponSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DIWALI500"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival Season Savings"
                  value={newCoupon.title}
                  onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Discount Type</label>
                  <select
                    value={newCoupon.discount_type}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="flat">Flat ₹ Off</option>
                    <option value="percentage">Percentage % Off</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Value *</label>
                  <input
                    type="number"
                    required
                    value={newCoupon.discount_value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Min Bill (₹)</label>
                  <input
                    type="number"
                    value={newCoupon.min_bill_amount}
                    onChange={(e) => setNewCoupon({ ...newCoupon, min_bill_amount: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Total Quantity</label>
                  <input
                    type="number"
                    value={newCoupon.total_coupons}
                    onChange={(e) => setNewCoupon({ ...newCoupon, total_coupons: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateCoupon(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#4b5563', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE CAMPAIGN SETUP MODAL (EXACT /campaigns-hub/campaign-details) */}
      {activeCampaignModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '840px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            {/* Header */}
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

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {/* Form Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Channel */}
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
                        border: campaignForm.channel === 'whatsapp' ? '2px solid #16a34a' : '1px solid #d1d5db',
                        backgroundColor: campaignForm.channel === 'whatsapp' ? '#f0fdf4' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        color: campaignForm.channel === 'whatsapp' ? '#166534' : '#374151'
                      }}
                    >
                      <MessageSquare style={{ width: '16px', height: '16px', color: '#16a34a' }} />
                      <span>WhatsApp WABA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignForm({ ...campaignForm, channel: 'sms' })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: campaignForm.channel === 'sms' ? '2px solid #2563eb' : '1px solid #d1d5db',
                        backgroundColor: campaignForm.channel === 'sms' ? '#eff6ff' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        color: campaignForm.channel === 'sms' ? '#1e40af' : '#374151'
                      }}
                    >
                      <Smartphone style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                      <span>SMS Gateway</span>
                    </button>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Target Audience Segment
                  </label>
                  <select
                    value={campaignForm.audience}
                    onChange={(e) => setCampaignForm({ ...campaignForm, audience: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="all">All Registered Customers ({customers?.length || 150} shoppers)</option>
                    <option value="inactive">Inactive Shoppers (&gt; 30 Days without Bill) (~120 shoppers)</option>
                    <option value="vip">VIP Big Spenders (LTV &gt; ₹5,000) (~45 VIPs)</option>
                    <option value="birthday">Special Occasion (Birthday / Anniversary this month)</option>
                  </select>
                </div>

                {/* Offer Coupon Attachment */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Attach Coupon Voucher
                  </label>
                  <select
                    value={campaignForm.couponCode}
                    onChange={(e) => setCampaignForm({ ...campaignForm, couponCode: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
                  >
                    <option value="">-- No Coupon Attached --</option>
                    {coupons.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} — {c.title} ({c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`})
                      </option>
                    ))}
                    <option value="FESTIVE10">FESTIVE10 — 10% OFF on all Sarees</option>
                    <option value="BDAY200">BDAY200 — FLAT ₹200 OFF on ₹1,500</option>
                  </select>
                </div>

                {/* Bonus Loyalty Points */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Bonus Loyalty Points Reward
                  </label>
                  <input
                    type="number"
                    value={campaignForm.pointsBonus}
                    onChange={(e) => setCampaignForm({ ...campaignForm, pointsBonus: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Schedule */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Schedule
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={campaignForm.scheduleType === 'instant'}
                        onChange={() => setCampaignForm({ ...campaignForm, scheduleType: 'instant' })}
                      />
                      <span>Send Immediately</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={campaignForm.scheduleType === 'scheduled'}
                        onChange={() => setCampaignForm({ ...campaignForm, scheduleType: 'scheduled' })}
                      />
                      <span>Schedule for Tomorrow 10:00 AM</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' }}>
                  Live Message Preview
                </label>

                {/* WhatsApp Chat Bubble */}
                <div style={{ backgroundColor: '#efeae2', borderRadius: '12px', padding: '1rem', border: '1px solid #d1d5db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>
                      {profile?.store_name ? profile.store_name.slice(0, 2).toUpperCase() : 'ST'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#111827' }}>
                        {profile?.store_name || 'Store'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: '600' }}>Official WhatsApp Business</div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '10px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontSize: '0.8rem', color: '#1e293b', whiteSpace: 'pre-line', lineHeight: 1.45 }}>
                    {campaignForm.templateText
                      .replace('{{customer_name}}', 'Priya Sharma')
                      .replace('{{store_name}}', profile?.store_name || 'Store')
                      .replace('{{bill_url}}', 'https://bill.retailnode.in/t/JiKSx0qM')
                      .replace('{{coupon_code}}', campaignForm.couponCode || 'FESTIVE10')
                      .replace('{{points}}', '450')
                      .replace('{{value}}', '225')
                    }
                    {campaignForm.couponCode && (
                      <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: '#fef9c3', border: '1px dashed #ca8a04', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#854d0e', textAlign: 'center' }}>
                        🏷️ PROMO CODE: {campaignForm.couponCode}
                      </div>
                    )}
                    <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '0.65rem', color: '#94a3b8' }}>
                      10:30 AM <span style={{ color: '#0284c7' }}>✓✓</span>
                    </div>
                  </div>
                </div>

                {/* Message Editor */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>
                    Edit Message Template
                  </label>
                  <textarea
                    rows={4}
                    value={campaignForm.templateText}
                    onChange={(e) => setCampaignForm({ ...campaignForm, templateText: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.78rem', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {['{{customer_name}}', '{{store_name}}', '{{coupon_code}}', '{{bill_url}}'].map((tag) => (
                      <span
                        key={tag}
                        onClick={() => setCampaignForm({ ...campaignForm, templateText: campaignForm.templateText + ' ' + tag })}
                        style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.68rem', cursor: 'pointer', color: '#0284c7', fontWeight: '600' }}
                      >
                        + {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cost & Quota Estimation */}
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Estimated Audience: </span>
                    <strong style={{ color: '#111827' }}>
                      {campaignForm.audience === 'vip' ? 45 : campaignForm.audience === 'inactive' ? 120 : (customers?.length || 150)} recipients
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Credits needed: </span>
                    <strong style={{ color: campaignForm.channel === 'whatsapp' ? '#166534' : '#1e40af' }}>
                      {campaignForm.audience === 'vip' ? 45 : campaignForm.audience === 'inactive' ? 120 : (customers?.length || 150)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveCampaignModal(null)}
                style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#4b5563', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchCampaign}
                style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send style={{ width: '15px', height: '15px' }} />
                <span>Launch Broadcast Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK DIGITAL BILL MODAL (WEB POS CHECKOUT TERMINAL) */}
      {showQuickBill && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt style={{ width: '18px', height: '18px' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
                    Quick Digital Bill Generator
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Fast counter checkout &bull; Instant WhatsApp Receipt
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowQuickBill(false); setQuickBillSuccess(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#94a3b8' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              {quickBillSuccess ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <CheckCircle style={{ width: '32px', height: '32px' }} />
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: '800', color: '#111827' }}>
                    Digital Bill #{quickBillSuccess.invoiceNumber} Sent!
                  </h4>
                  <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                    Receipt link dispatched to <strong>+91 {quickBillSuccess.customerPhone}</strong>
                  </p>

                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '1rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748b' }}>Bill Amount:</span>
                      <strong style={{ color: '#111827' }}>₹{quickBillSuccess.billTotal?.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748b' }}>Loyalty Points Awarded:</span>
                      <strong style={{ color: '#16a34a' }}>+{quickBillSuccess.loyaltyEarned} pts</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: '#64748b' }}>Short Link:</span>
                      <a href={quickBillSuccess.receiptUrl} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}>
                        {quickBillSuccess.receiptUrl}
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <a
                      href={quickBillSuccess.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '9px 16px', borderRadius: '8px', backgroundColor: '#0284c7', color: '#fff', textDecoration: 'none', fontWeight: '700', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Eye style={{ width: '15px', height: '15px' }} />
                      <span>View Receipt</span>
                    </a>
                    <button
                      onClick={() => {
                        setQuickBillSuccess(null);
                        setQuickBillForm({
                          customerPhone: '',
                          customerName: '',
                          billAmount: '',
                          invoiceNumber: '',
                          itemName: 'Designer Saree Collection',
                          sendWhatsApp: true
                        });
                      }}
                      style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#374151', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      + Create Another Bill
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateQuickBill} style={{ display: 'grid', gap: '1.1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Customer Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={quickBillForm.customerPhone}
                      onChange={(e) => handleQuickBillPhoneChange(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', fontWeight: '600' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '5px' }}>
                        Customer Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Priya Sharma"
                        value={quickBillForm.customerName}
                        onChange={(e) => setQuickBillForm({ ...quickBillForm, customerName: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '5px' }}>
                        Bill Amount (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        step="any"
                        placeholder="e.g. 2450"
                        value={quickBillForm.billAmount}
                        onChange={(e) => setQuickBillForm({ ...quickBillForm, billAmount: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.95rem', fontWeight: '800', color: '#111827' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '5px' }}>
                      Item Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kanjivaram Pure Silk Saree"
                      value={quickBillForm.itemName}
                      onChange={(e) => setQuickBillForm({ ...quickBillForm, itemName: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <input
                      type="checkbox"
                      id="sendWhatsAppCheck"
                      checked={quickBillForm.sendWhatsApp}
                      onChange={(e) => setQuickBillForm({ ...quickBillForm, sendWhatsApp: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#16a34a' }}
                    />
                    <label htmlFor="sendWhatsAppCheck" style={{ fontSize: '0.8rem', fontWeight: '700', color: '#166534', cursor: 'pointer' }}>
                      Dispatch branded receipt via WhatsApp immediately (Free)
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowQuickBill(false)}
                      style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#4b5563', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={quickBillLoading}
                      style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {quickBillLoading ? 'Generating...' : 'Generate & Send WhatsApp Bill ⚡'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK RESOLUTION & DISSATISFACTION SHIELD MODAL */}
      {activeFeedbackModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#991b1b' }}>
                  🛠️ Dissatisfaction Shield Resolution
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                  Resolve customer complaint privately before public review
                </p>
              </div>
              <button
                onClick={() => setActiveFeedbackModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#94a3b8' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ backgroundColor: '#fef2f2', borderRadius: '10px', padding: '1rem', border: '1px solid #fee2e2', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ color: '#111827' }}>{activeFeedbackModal.customer_name || 'Shopper'}</strong>
                  <span style={{ color: '#dc2626', fontWeight: '800' }}>
                    {'★'.repeat(activeFeedbackModal.rating || 1)}{'☆'.repeat(5 - (activeFeedbackModal.rating || 1))}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '8px' }}>
                  Phone: <strong>{activeFeedbackModal.customer_phone}</strong> &bull; Invoice #{activeFeedbackModal.invoice_number}
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b', fontStyle: 'italic' }}>
                  "{activeFeedbackModal.comment || 'Customer gave low rating without written comment'}"
                </p>
              </div>

              {/* Direct WhatsApp Call/Message Button */}
              <div style={{ marginBottom: '1.25rem' }}>
                <a
                  href={`https://wa.me/${activeFeedbackModal.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Dear ${activeFeedbackModal.customer_name || 'Customer'},\n\nWe noticed your recent visit to ${profile?.store_name || 'our store'} was not up to expectations. We sincerely apologize for the inconvenience!\n\nAs a gesture of goodwill, we have credited an apology voucher for your next visit. Please let us know how we can make this right!`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    textDecoration: 'none'
                  }}
                >
                  <MessageSquare style={{ width: '16px', height: '16px' }} />
                  <span>Send WhatsApp Apology &amp; Voucher</span>
                </a>
              </div>

              {/* Resolution Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Manager Resolution Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Called customer, replaced defective piece, offered 15% discount for next visit."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.82rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleUpdateFeedbackResolution(activeFeedbackModal.id, 'in_progress')}
                  style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#d97706', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Mark In Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateFeedbackResolution(activeFeedbackModal.id, 'resolved')}
                  style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  ✓ Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOMER PROFILE MODAL (MATCHING BILLFREE SCREENSHOT 1) */}
      {activeProfileModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '640px', width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#111827' }}>
                  {activeProfileModal.phone ? 'Customer Profile Details' : 'Create Customer Profile'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                  Enrich customer profile for automated birthday, anniversary &amp; lifecycle campaigns
                </p>
              </div>
              <button
                onClick={() => setActiveProfileModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#94a3b8' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Customer full name"
                    value={profileForm.customer_name}
                    onChange={(e) => setProfileForm({ ...profileForm, customer_name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Mobile No. <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/\D/g, '') })}
                      style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Date of Birth 🎂
                  </label>
                  <input
                    type="date"
                    value={profileForm.dob}
                    onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="customer@email.com"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Profession
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Doctor, Teacher, Business"
                    value={profileForm.profession}
                    onChange={(e) => setProfileForm({ ...profileForm, profession: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Shopping Frequency
                  </label>
                  <select
                    value={profileForm.shopping_frequency}
                    onChange={(e) => setProfileForm({ ...profileForm, shopping_frequency: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Festive Only">Festive Only</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Customer Gender
                  </label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="m">Male</option>
                    <option value="f">Female</option>
                    <option value="o">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Customer Married Status
                  </label>
                  <select
                    value={profileForm.marital_status}
                    onChange={(e) => setProfileForm({ ...profileForm, marital_status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="u">Single</option>
                    <option value="m">Married</option>
                  </select>
                </div>
              </div>

              {/* Conditional Spouse & Family Fields (If Married) */}
              {profileForm.marital_status === 'm' && (
                <div style={{ backgroundColor: '#fdf2f8', padding: '12px', borderRadius: '10px', border: '1px solid #fbcfe8', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#9d174d', marginBottom: '8px' }}>
                    💍 Family &amp; Anniversary Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#374151', marginBottom: '3px' }}>
                        Anniversary Date 💍
                      </label>
                      <input
                        type="date"
                        value={profileForm.anniversary_date}
                        onChange={(e) => setProfileForm({ ...profileForm, anniversary_date: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#374151', marginBottom: '3px' }}>
                        Spouse Name
                      </label>
                      <input
                        type="text"
                        placeholder="Spouse name"
                        value={profileForm.spouse_name}
                        onChange={(e) => setProfileForm({ ...profileForm, spouse_name: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#374151', marginBottom: '3px' }}>
                        Spouse Mobile No.
                      </label>
                      <input
                        type="tel"
                        placeholder="Spouse 10-digit mobile"
                        value={profileForm.spouse_mobile}
                        onChange={(e) => setProfileForm({ ...profileForm, spouse_mobile: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#374151', marginBottom: '3px' }}>
                        Child Name
                      </label>
                      <input
                        type="text"
                        placeholder="Child name"
                        value={profileForm.child_name}
                        onChange={(e) => setProfileForm({ ...profileForm, child_name: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* State & City */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Select State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Select City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pune, Mumbai, Kolhapur"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* DPDP Act 2023 Consent Checkbox (Matching Screenshot 1) */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="consentCheck"
                  checked={profileForm.consent_given}
                  onChange={(e) => setProfileForm({ ...profileForm, consent_given: e.target.checked })}
                  style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#16a34a' }}
                />
                <label htmlFor="consentCheck" style={{ fontSize: '0.78rem', color: '#166534', fontWeight: '600', cursor: 'pointer', lineHeight: 1.4 }}>
                  The customer has agreed to share these details with the merchant for loyalty, billing and communication purposes. (DPDP Act 2023 Compliant)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveProfileModal(null)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {savingProfile ? 'Saving Profile...' : 'Save Profile ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
