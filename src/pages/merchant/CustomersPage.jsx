import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Eye,
  Calendar
} from 'lucide-react';
import CustomerSubnav from '../../components/CustomerSubnav';
import ProfileModal from '../../components/ProfileModal';
import { formatCurrency, maskPhone, getCohortBadge, formatDisplayDate } from '../../utils/merchantUtils';
import { SortableTh, TablePagination, TableSearchInput } from '../../components/DataTable';
import { useDataTable } from '../../hooks/useDataTable';

export default function CustomersPage() {
  const { profile, token, notifyToast } = useOutletContext();

  const [customers, setCustomers] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters matching BillFree
  const [dormantFilter, setDormantFilter] = useState('all');
  const [visitFilter, setVisitFilter] = useState('all');
  const [cohortFilter, setCohortFilter] = useState('all');
  const [profileStatusFilter, setProfileStatusFilter] = useState('all');

  // Modal
  const [activeProfileModal, setActiveProfileModal] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
        setInsights(data.insights || null);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  // Universal Data Table Hook with search, multi-filter, column sorting & pagination
  const {
    items: paginatedCustomers,
    totalItems,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort
  } = useDataTable(customers, {
    searchFields: ['customer_name', 'name', 'phone', 'customer_phone', 'city', 'state'],
    defaultSortKey: 'total_spent',
    defaultSortDir: 'desc',
    defaultPageSize: 10,
    customFilter: (c) => {
      let matchesDormant = true;
      if (dormantFilter !== 'all') {
        matchesDormant = (c.dormancy_bucket || c.dormancy) === dormantFilter;
      }

      let matchesVisit = true;
      if (visitFilter !== 'all') {
        const v = Number(c.visits_count || c.no_of_visits || 1);
        if (visitFilter === '1') matchesVisit = v === 1;
        else if (visitFilter === '2') matchesVisit = v === 2;
        else if (visitFilter === '3') matchesVisit = v === 3;
        else if (visitFilter === '4') matchesVisit = v === 4;
        else if (visitFilter === '5') matchesVisit = v >= 5 && v < 10;
        else if (visitFilter === '10') matchesVisit = v >= 10;
      }

      let matchesCohort = true;
      if (cohortFilter !== 'all') {
        matchesCohort = (c.cohort || c.rfm_cohort) === cohortFilter;
      }

      let matchesProfile = true;
      if (profileStatusFilter === 'complete') matchesProfile = c.profile_status === 'complete';
      if (profileStatusFilter === 'not_exist') matchesProfile = c.profile_status !== 'complete';

      return matchesDormant && matchesVisit && matchesCohort && matchesProfile;
    },
    customSortAccessor: (c, key) => {
      if (key === 'total_spent') return Number(c.total_spent || c.lifetime_value || 0);
      if (key === 'visits_count') return Number(c.visits_count || c.no_of_visits || 1);
      if (key === 'last_bill_amount') return Number(c.last_bill_amount || c.last_bill_value || 0);
      if (key === 'max_bill_value') return Number(c.max_bill_value || c.max_bill_amount || 0);
      if (key === 'loyalty_points') return Number(c.loyalty_points || 0);
      if (key === 'last_visit') return new Date(c.last_visit || 0).getTime();
      return c[key];
    }
  });

  const clearAllFilters = () => {
    setDormantFilter('all');
    setVisitFilter('all');
    setCohortFilter('all');
    setProfileStatusFilter('all');
    setSearchQuery('');
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      {/* Sub-nav */}
      <CustomerSubnav
        totalCustomers={customers.length}
        totalProfiles={customers.filter((c) => c.profile_status === 'complete').length}
        totalOptouts={0}
        onCreateProfile={() => setActiveProfileModal({ phone: '' })}
      />

      {/* Quick Insight Bar (BillFree Screenshot 2 match) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#111827' }}>
            Customer Dormancy &amp; Activity Insights ✨
            <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', marginLeft: '6px' }}>
              Over lifetime store shopper history
            </span>
          </div>
          {(dormantFilter !== 'all' || cohortFilter !== 'all' || profileStatusFilter !== 'all' || visitFilter !== 'all' || searchQuery) && (
            <button
              onClick={clearAllFilters}
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

        {/* Dormancy stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '1rem' }}>
          {[
            { id: 'all', label: 'All Customers', count: insights?.all || customers.length, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
            { id: 'active_3m', label: 'Active In 3 Months', count: insights?.active_3m || 0, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
            { id: 'dormant_3_6m', label: 'Dormant 3-6 Months', count: insights?.dormant_3_6m || 0, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { id: 'dormant_6_12m', label: 'Dormant 6-12 Months', count: insights?.dormant_6_12m || 0, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
            { id: 'dormant_12p_m', label: 'Dormant 12+ Months', count: insights?.dormant_12p_m || 0, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
          ].map((stat) => (
            <div
              key={stat.id}
              onClick={() => setDormantFilter(dormantFilter === stat.id ? 'all' : stat.id)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: dormantFilter === stat.id ? stat.bg : '#ffffff',
                border: `1.5px solid ${dormantFilter === stat.id ? stat.border : '#e2e8f0'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: stat.color, textTransform: 'uppercase' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
                {stat.count}
              </div>
            </div>
          ))}
        </div>

        {/* Visit Filter Distribution Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
            Visit Frequency:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: '1', label: '1 Visit' },
            { id: '2', label: '2 Visits' },
            { id: '3', label: '3 Visits' },
            { id: '4', label: '4 Visits' },
            { id: '5', label: '5+ Visits' },
            { id: '10', label: '10+ Visits' }
          ].map((vf) => (
            <button
              key={vf.id}
              onClick={() => setVisitFilter(visitFilter === vf.id ? 'all' : vf.id)}
              style={{
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '600',
                border: `1px solid ${visitFilter === vf.id ? '#0284c7' : '#cbd5e1'}`,
                backgroundColor: visitFilter === vf.id ? '#0284c7' : '#ffffff',
                color: visitFilter === vf.id ? '#ffffff' : '#475569',
                cursor: 'pointer'
              }}
            >
              {vf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <TableSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by customer phone, name or city..."
          width="320px"
        />

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={profileStatusFilter}
            onChange={(e) => setProfileStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.825rem', backgroundColor: '#fff' }}
          >
            <option value="all">All Profile Statuses</option>
            <option value="complete">Complete Profiles</option>
            <option value="not_exist">Not Exist (Needs Enrichment)</option>
          </select>

          <select
            value={cohortFilter}
            onChange={(e) => setCohortFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.825rem', backgroundColor: '#fff' }}
          >
            <option value="all">All RFM Cohorts</option>
            <option value="vip">VIP Spenders</option>
            <option value="repeat">Repeat Shoppers</option>
            <option value="new">New Shoppers</option>
          </select>

          <button
            onClick={fetchCustomers}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600' }}
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Customers Table (Exact 14 columns matching BillFree /profiles/customers) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '10px 12px', width: '40px' }}>#</th>
                <th style={{ padding: '10px 12px', minWidth: '130px' }}>Store Outlet</th>
                <SortableTh sortKey="profile_status" currentSort={sortConfig} onSort={handleSort} minWidth="150px">Demographic Profile</SortableTh>
                <SortableTh sortKey="customer_name" currentSort={sortConfig} onSort={handleSort} minWidth="130px">Customer Name</SortableTh>
                <SortableTh sortKey="phone" currentSort={sortConfig} onSort={handleSort} minWidth="120px">Mobile No.</SortableTh>
                <SortableTh sortKey="visits_count" currentSort={sortConfig} onSort={handleSort} align="center">Visits</SortableTh>
                <SortableTh sortKey="total_spent" currentSort={sortConfig} onSort={handleSort} align="right">Total Spends</SortableTh>
                <SortableTh sortKey="last_bill_amount" currentSort={sortConfig} onSort={handleSort} align="right">Last Bill</SortableTh>
                <SortableTh sortKey="last_visit" currentSort={sortConfig} onSort={handleSort} minWidth="110px">Last Bill Date</SortableTh>
                <SortableTh sortKey="max_bill_value" currentSort={sortConfig} onSort={handleSort} align="right">Max Bill</SortableTh>
                <SortableTh sortKey="loyalty_points" currentSort={sortConfig} onSort={handleSort} align="center">Earned</SortableTh>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Redeemed</th>
                <SortableTh sortKey="loyalty_points" currentSort={sortConfig} onSort={handleSort} align="center">Balance</SortableTh>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #0284c7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading customer directory...</p>
                  </td>
                </tr>
              ) : paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    <Users style={{ width: '32px', height: '32px', margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No customers match the active filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((c, idx) => {
                  const custPhone = c.phone || c.customer_phone || '';
                  const custName = c.customer_name || c.name || 'Valued Shopper';
                  const totalSpent = Number(c.total_spent || c.lifetime_value || 0);
                  const visits = Number(c.visits_count || c.no_of_visits || 1);
                  const isComplete = c.profile_status === 'complete';
                  const cohort = getCohortBadge(totalSpent, visits);

                  return (
                    <tr key={c.id || custPhone || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '0.75rem' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#1e293b' }}>
                        {profile?.store_name || 'Store'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {isComplete ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.725rem', fontWeight: '700', backgroundColor: '#dcfce7', color: '#15803d' }}>
                            <CheckCircle style={{ width: '11px', height: '11px' }} />
                            Complete
                          </span>
                        ) : (
                          <button
                            onClick={() => setActiveProfileModal(c)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: '#0284c7',
                              fontWeight: '700',
                              fontSize: '0.75rem',
                              textDecoration: 'underline',
                              cursor: 'pointer'
                            }}
                          >
                            Not Exist (Add in profile)
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>
                        {custName}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Link
                          to={`/dashboard/customer-journey/${custPhone}`}
                          style={{
                            color: '#0284c7',
                            fontWeight: '700',
                            textDecoration: 'none'
                          }}
                        >
                          {maskPhone(custPhone)}
                        </Link>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>
                        {visits}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>
                        {formatCurrency(totalSpent)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#334155' }}>
                        {formatCurrency(c.last_bill_amount || (totalSpent / visits))}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '0.78rem' }}>
                        {formatDisplayDate(c.last_visit)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#334155' }}>
                        {formatCurrency(c.max_bill_value || totalSpent)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#16a34a', fontWeight: '700' }}>
                        +{c.loyalty_points || Math.floor(totalSpent / 100)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                        0
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: '800', color: '#0284c7' }}>
                        {c.loyalty_points || Math.floor(totalSpent / 100)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <Link
                            to={`/dashboard/customer-journey/${custPhone}`}
                            title="View Customer Journey"
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              textDecoration: 'none',
                              fontSize: '0.72rem',
                              fontWeight: '700'
                            }}
                          >
                            🛣️ Journey
                          </Link>
                          <button
                            onClick={() => setActiveProfileModal(c)}
                            title="Edit Demographic Profile"
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              border: 'none',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            ✏️ Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          accentColor="#0284c7"
        />
      </div>

      {/* Profile Modal */}
      {activeProfileModal && (
        <ProfileModal
          customer={activeProfileModal}
          token={token}
          onClose={() => setActiveProfileModal(null)}
          onSaved={(savedData) => {
            notifyToast('Customer profile updated successfully!');
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
}
