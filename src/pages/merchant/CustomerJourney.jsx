import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import {
  Compass,
  Search,
  Receipt,
  MessageSquare,
  Star,
  Tag,
  Gift,
  CheckCircle,
  ExternalLink,
  User,
  Phone,
  Cake,
  Heart
} from 'lucide-react';
import CustomerSubnav from '../../components/CustomerSubnav';
import { formatCurrency, maskPhone, formatDisplayDate } from '../../utils/merchantUtils';

export default function CustomerJourney() {
  const { phone: routePhone } = useParams();
  const navigate = useNavigate();
  const { token, notifyToast } = useOutletContext();

  const [inputPhone, setInputPhone] = useState(routePhone || '');
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchJourney = async (targetPhone) => {
    if (!targetPhone) return;
    setLoading(true);
    try {
      const cleanPhone = targetPhone.replace(/\D/g, '');
      const res = await fetch(`/api/v1/auth/customers/${cleanPhone}/journey`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && (data.data || data.profile)) {
        setJourneyData(data.data || { profile: data.profile, summary: data.summary, timeline: data.timeline });
      } else {
        setJourneyData(null);
      }
    } catch (err) {
      console.error('Failed to load customer journey:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routePhone) {
      setInputPhone(routePhone);
      fetchJourney(routePhone);
    }
  }, [routePhone, token]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputPhone) return;
    navigate(`/dashboard/customer-journey/${inputPhone.trim()}`);
    fetchJourney(inputPhone.trim());
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <CustomerSubnav />

      {/* Search Header */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: '800', color: '#111827' }}>
          Customer 360° Interaction Journey
        </h2>
        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b' }}>
          Inspect complete chronological touchpoints: digital bills, WhatsApp delivery status, ratings, and redemptions
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '440px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '12px', top: '10px', width: '16px', height: '16px', color: '#9ca3af' }} />
            <input
              type="tel"
              required
              placeholder="Enter customer 10-digit mobile..."
              value={inputPhone}
              onChange={(e) => setInputPhone(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}
          >
            {loading ? 'Searching...' : 'Explore Journey'}
          </button>
        </form>
      </div>

      {journeyData ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Profile Card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem' }}>
                <User style={{ width: '24px', height: '24px' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
                  {journeyData.profile?.customer_name || 'Shopper Profile'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {maskPhone(journeyData.profile?.phone || inputPhone)}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Lifetime Spends</span>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {formatCurrency(journeyData.summary?.lifetime_spend || journeyData.profile?.total_spent || 0)}
                </div>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Total Invoices</span>
                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                  {journeyData.summary?.total_invoices || journeyData.profile?.visits_count || 1}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#475569' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Date of Birth:</span>
                <span style={{ fontWeight: '600' }}>{formatDisplayDate(journeyData.profile?.dob)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Anniversary:</span>
                <span style={{ fontWeight: '600' }}>{formatDisplayDate(journeyData.profile?.anniversary_date)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Loyalty Points:</span>
                <span style={{ fontWeight: '800', color: '#16a34a' }}>{journeyData.profile?.loyalty_points || 0} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Compliance Consent:</span>
                <span style={{ fontWeight: '700', color: '#16a34a' }}>DPDP Granted</span>
              </div>
            </div>
          </div>

          {/* Chronological Timeline */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
              Interaction Timeline
            </h3>

            <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #e2e8f0', marginLeft: '8px' }}>
              {(journeyData.timeline || []).length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No past events recorded for this number.</p>
              ) : (
                journeyData.timeline.map((event, idx) => (
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
                        View Digital Receipt &rarr;
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '3.5rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <Compass style={{ width: '40px', height: '40px', margin: '0 auto 10px', opacity: 0.4 }} />
          <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '700', color: '#111827' }}>No customer selected</h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Enter a customer phone number above or click "🛣️ Journey" on any customer row.</p>
        </div>
      )}
    </div>
  );
}
