import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Gift, Search, CheckCircle, Tag, Award, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';
import { formatCurrency, maskPhone } from '../../utils/merchantUtils';

export default function RedeemReward() {
  const { token, notifyToast } = useOutletContext();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [searched, setSearched] = useState(false);

  // Fetch active coupons from database
  useEffect(() => {
    const fetchActiveCoupons = async () => {
      try {
        const res = await fetch('/api/v1/auth/coupons', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data?.coupons) {
          setCoupons(data.data.coupons.filter((c) => c.is_active));
        }
      } catch (err) {
        console.error('Failed to load coupons:', err);
      }
    };
    fetchActiveCoupons();
  }, [token]);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setRedeemSuccess('');
    setSearched(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const res = await fetch(`/api/v1/auth/customers/${cleanPhone}/journey`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && (data.data || data.profile)) {
        const prof = data.data?.profile || data.profile || {};
        const sum = data.data?.summary || data.summary || {};
        const pts = Number(prof.loyalty_points || 0);
        setCustomerData({
          name: prof.customer_name || 'Registered Shopper',
          phone: cleanPhone,
          walletBalance: pts,
          walletRupees: Math.round(pts / 2), // Default 2 pts = ₹1
          totalVisits: sum.total_invoices || prof.visits_count || 1,
          totalSpends: sum.lifetime_spend || prof.total_spent || 0
        });
      } else {
        setCustomerData(null);
      }
    } catch (err) {
      console.error('Customer lookup error:', err);
      setCustomerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemPoints = () => {
    if (!customerData) return;
    const pts = customerData.walletBalance;
    const rs = customerData.walletRupees;
    if (pts <= 0) {
      notifyToast('Customer has 0 loyalty points to redeem.');
      return;
    }
    setCustomerData({
      ...customerData,
      walletBalance: 0,
      walletRupees: 0
    });
    const msg = `Successfully redeemed ${pts} points (₹${rs} discount) applied to cashier bill!`;
    setRedeemSuccess(msg);
    notifyToast(msg);
  };

  const handleApplyCoupon = (c) => {
    const discountText = c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT`;
    const msg = `Applied coupon ${c.code}! Deducting ${discountText} from cashier bill (Min bill ₹${c.min_bill_amount}).`;
    setRedeemSuccess(msg);
    notifyToast(msg);
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
          Cashier Checkout Rewards Terminal
        </h1>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
          Look up customer by mobile phone at billing counter to verify loyalty points &amp; redeem discount coupons
        </p>
      </div>

      {/* Search Box */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="tel"
            required
            autoFocus
            placeholder="Enter customer 10-digit mobile number (e.g. 9876543210)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Search style={{ width: '15px', height: '15px' }} />
            <span>{loading ? 'Verifying...' : 'Check Balance'}</span>
          </button>
        </form>
      </div>

      {redeemSuccess && (
        <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#065f46' }}>
          <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981', flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{redeemSuccess}</div>
        </div>
      )}

      {/* Customer Result Card */}
      {customerData ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: '0 0 2px', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                {customerData.name}
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Verified Customer: {maskPhone(customerData.phone)}
              </span>
            </div>
            <Link
              to={`/dashboard/customer-journey/${customerData.phone}`}
              style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}
            >
              View Full Journey →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>Loyalty Points</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#78350f', marginTop: '2px' }}>
                {customerData.walletBalance} pts
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#b45309' }}>
                Worth ₹{customerData.walletRupees} Discount
              </span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Visits</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {customerData.totalVisits} Bills
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Verified store invoices</span>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Lifetime Value</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16a34a', marginTop: '2px' }}>
                {formatCurrency(customerData.totalSpends)}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Cumulative spent</span>
            </div>
          </div>

          {/* Action to Redeem Points */}
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontWeight: '800', color: '#166534', fontSize: '0.95rem', marginBottom: '2px' }}>
                Redeem {customerData.walletBalance} Loyalty Points
              </div>
              <div style={{ fontSize: '0.8rem', color: '#15803d' }}>
                Deducts ₹{customerData.walletRupees} directly from the customer's current billing amount.
              </div>
            </div>
            <button
              onClick={handleRedeemPoints}
              disabled={customerData.walletBalance <= 0}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: customerData.walletBalance > 0 ? '#16a34a' : '#94a3b8',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: customerData.walletBalance > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              {customerData.walletBalance > 0 ? 'Apply Points Discount' : 'No Points Available'}
            </button>
          </div>
        </div>
      ) : searched && !loading ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2.5rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <AlertCircle style={{ width: '36px', height: '36px', color: '#94a3b8', margin: '0 auto 8px' }} />
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>
            Customer Profile Not Found
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            No previous transactions found for mobile number <b>{phone}</b>. Points will be automatically credited upon issuing their first digital bill.
          </p>
        </div>
      ) : null}

      {/* Available Coupons from Database */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
          Active Cashier Coupons &amp; Offers
        </h3>
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
          Click "Apply Discount" to redeem active promotional vouchers at checkout
        </p>

        {coupons.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            No active coupons found. Create seasonal discount codes in the Coupon Dashboard.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {coupons.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tag style={{ width: '18px', height: '18px' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0284c7', fontSize: '0.95rem' }}>
                        {c.code}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534' }}>
                        {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT`}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      {c.title} • Min bill: {formatCurrency(c.min_bill_amount)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyCoupon(c)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Apply Discount
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
