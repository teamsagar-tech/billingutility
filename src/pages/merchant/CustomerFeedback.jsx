import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  Star, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  X, 
  Send, 
  RefreshCw, 
  Search,
  Sparkles,
  Gift,
  Settings,
  Heart,
  ThumbsUp,
  Sliders,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { maskPhone } from '../../utils/merchantUtils';
import { SortableTh, TablePagination, TableSearchInput } from '../../components/DataTable';
import { useDataTable } from '../../hooks/useDataTable';

export default function CustomerFeedback() {
  const { profile, token, notifyToast } = useOutletContext();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'complaints' | 'promoters' | 'settings'
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  // Survey Settings Form
  const [surveySettings, setSurveySettings] = useState({
    feedback_enabled: true,
    survey_reward_points: 25,
    google_review_url: '',
    google_place_id: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/feedback/responses', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFeedbackList(data.data);
      } else {
        setFeedbackList([]);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
      setFeedbackList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/v1/auth/feedback/settings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSurveySettings({
          feedback_enabled: data.feedback_enabled !== false,
          survey_reward_points: data.survey_reward_points !== undefined ? data.survey_reward_points : 25,
          google_review_url: data.google_review_url || profile?.google_review_url || '',
          google_place_id: data.google_place_id || ''
        });
      }
    } catch (err) {
      console.warn('Could not load feedback settings:', err);
    }
  };

  useEffect(() => {
    fetchFeedback();
    fetchSettings();
  }, [token]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/v1/auth/feedback/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(surveySettings)
      });
      const data = await res.json();
      if (data.success) {
        notifyToast('Survey settings & reward points saved successfully!');
      } else {
        notifyToast(data.error || 'Failed to update settings');
      }
    } catch (err) {
      notifyToast('Network error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!activeModal) return;

    setResolving(true);
    try {
      const res = await fetch(`/api/v1/auth/feedback/responses/${activeModal.id}/resolution`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'resolved',
          notes: resolutionNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackList(
          feedbackList.map((f) =>
            f.id === activeModal.id ? { ...f, resolution_status: 'resolved', resolution_notes: resolutionNotes } : f
          )
        );
        notifyToast('Feedback marked as resolved and resolution note saved.');
        setActiveModal(null);
      } else {
        notifyToast(data.error || 'Failed to update resolution status.');
      }
    } catch (err) {
      notifyToast('Network error updating resolution.');
    } finally {
      setResolving(false);
    }
  };

  // Metrics Calculations
  const totalReviews = feedbackList.length;
  const avgRating = totalReviews > 0
    ? (feedbackList.reduce((acc, f) => acc + Number(f.rating || 5), 0) / totalReviews).toFixed(1)
    : '5.0';

  const promotersCount = feedbackList.filter((f) => Number(f.rating) >= 4).length;
  const promotersPercent = totalReviews > 0 ? Math.round((promotersCount / totalReviews) * 100) : 100;
  const privateCount = feedbackList.filter((f) => Number(f.rating) <= 3).length;

  // NPS Calculations
  const npsResponses = feedbackList.filter(f => f.nps_score !== null && f.nps_score !== undefined);
  const npsPromoters = npsResponses.filter(f => Number(f.nps_score) >= 9).length;
  const npsDetractors = npsResponses.filter(f => Number(f.nps_score) <= 6).length;
  const npsScore = npsResponses.length > 0 
    ? Math.round(((npsPromoters - npsDetractors) / npsResponses.length) * 100) 
    : 75;

  // Filtered List based on active tab
  const filteredList = feedbackList.filter(f => {
    if (activeTab === 'complaints') return Number(f.rating || 5) <= 3;
    if (activeTab === 'promoters') return Number(f.rating || 5) >= 4;
    return true;
  });

  // Universal Data Table Hook with search, sorting & pagination
  const {
    items: paginatedFeedback,
    totalItems,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort
  } = useDataTable(filteredList, {
    searchFields: ['customer_name', 'customer_phone', 'invoice_number', 'short_id', 'comment'],
    defaultSortKey: 'id',
    defaultSortDir: 'desc',
    defaultPageSize: 10,
    customSortAccessor: (f, key) => {
      if (key === 'rating') return Number(f.rating || 0);
      if (key === 'nps_score') return Number(f.nps_score !== null ? f.nps_score : -1);
      return f[key];
    }
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
            Customer Surveys &amp; Verified Reviews
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
            Direct customer feedback, Net Promoter Scores (NPS), and star ratings collected seamlessly within digital receipts (/t/{'{shortId}'}).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {activeTab !== 'settings' && (
            <TableSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search feedback, phone, invoice..."
              width="260px"
            />
          )}
          <button
            onClick={fetchFeedback}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Overall Rating */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Overall Rating</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{avgRating} / 5.0</span>
            <div style={{ display: 'flex', color: '#f59e0b' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  style={{
                    width: '18px',
                    height: '18px',
                    fill: s <= Math.round(Number(avgRating)) ? '#f59e0b' : '#e2e8f0',
                    color: s <= Math.round(Number(avgRating)) ? '#f59e0b' : '#cbd5e1'
                  }}
                />
              ))}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>Based on {totalReviews} receipt submissions</span>
        </div>

        {/* Net Promoter Score (NPS) */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Net Promoter Score (NPS)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: npsScore >= 50 ? '#16a34a' : (npsScore >= 0 ? '#f59e0b' : '#dc2626'), marginTop: '4px' }}>
            {npsScore > 0 ? `+${npsScore}` : npsScore}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '500' }}>
            {npsPromoters} Promoters (9-10) &bull; {npsDetractors} Detractors (0-6)
          </span>
        </div>

        {/* Satisfied Promoters */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Promoters (4-5★)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
            {promotersPercent}% ({promotersCount})
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>Nudged to Google Reviews</span>
        </div>

        {/* Private Recovery Queue */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Service Complaints (1-3★)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: privateCount > 0 ? '#ea580c' : '#0f172a', marginTop: '4px' }}>
            {privateCount} Issues
          </div>
          <span style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: '600' }}>
            Kept strictly private for manager resolution
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'all' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'all' ? '#2563eb' : '#64748b',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>All Surveys &amp; Feedback</span>
          <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: activeTab === 'all' ? '#dbeafe' : '#f1f5f9', color: activeTab === 'all' ? '#1e40af' : '#64748b' }}>
            {totalReviews}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          style={{
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'complaints' ? '2px solid #ea580c' : '2px solid transparent',
            color: activeTab === 'complaints' ? '#ea580c' : '#64748b',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <AlertTriangle style={{ width: '14px', height: '14px', color: '#ea580c' }} />
          <span>Action Required (1-3★ Complaints)</span>
          {privateCount > 0 && (
            <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: '#ffedd5', color: '#9a3412', fontWeight: '800' }}>
              {privateCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('promoters')}
          style={{
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'promoters' ? '2px solid #16a34a' : '2px solid transparent',
            color: activeTab === 'promoters' ? '#16a34a' : '#64748b',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Star style={{ width: '14px', height: '14px', color: '#16a34a', fill: '#16a34a' }} />
          <span>Happy Promoters (4-5★)</span>
          <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: '#dcfce7', color: '#166534' }}>
            {promotersCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: '700',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'settings' ? '#2563eb' : '#64748b',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Settings style={{ width: '14px', height: '14px' }} />
          <span>Survey Settings &amp; Rewards</span>
        </button>
      </div>

      {/* TAB 1: SURVEY RESPONSES TABLE */}
      {activeTab !== 'settings' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#4b5563', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>#</th>
                <SortableTh sortKey="customer_name" currentSort={sortConfig} onSort={handleSort}>Shopper</SortableTh>
                <SortableTh sortKey="rating" currentSort={sortConfig} onSort={handleSort}>Rating</SortableTh>
                <SortableTh sortKey="nps_score" currentSort={sortConfig} onSort={handleSort}>NPS Score</SortableTh>
                <th style={{ padding: '12px 16px' }}>Selected Aspects &amp; Feedback Tags</th>
                <th style={{ padding: '12px 16px' }}>Customer Remarks</th>
                <SortableTh sortKey="invoice_number" currentSort={sortConfig} onSort={handleSort}>Bill / Short ID</SortableTh>
                <SortableTh sortKey="resolution_status" currentSort={sortConfig} onSort={handleSort}>Status</SortableTh>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '3.5rem', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
                    <span>Loading verified customer survey responses...</span>
                  </td>
                </tr>
              ) : paginatedFeedback.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                    <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <Sparkles style={{ width: '26px', height: '26px' }} />
                      </div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: '800', color: '#1e293b' }}>
                        No Customer Surveys Yet
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                        When shoppers open their digital bill receipt (/t/{'{shortId}'}) and complete the embedded survey or rate stars, their verified responses will appear here automatically.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedFeedback.map((f, i) => {
                  const isNegative = (Number(f.rating) || 5) <= 3;
                  const tags = Array.isArray(f.survey_tags) ? f.survey_tags : [];

                  return (
                    <tr key={f.id || i} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isNegative ? '#fffaf8' : '#ffffff' }}>
                      <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '0.75rem' }}>{i + 1}</td>
                      
                      {/* Customer Name & Phone */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{f.customer_name || 'Valued Shopper'}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{maskPhone(f.customer_phone)}</div>
                      </td>

                      {/* Star Rating */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star
                              key={st}
                              style={{
                                width: '13px',
                                height: '13px',
                                fill: st <= f.rating ? (isNegative ? '#ea580c' : '#f59e0b') : '#e2e8f0',
                                color: st <= f.rating ? (isNegative ? '#ea580c' : '#f59e0b') : '#cbd5e1'
                              }}
                            />
                          ))}
                          <span style={{ fontSize: '0.78rem', fontWeight: '800', marginLeft: '4px', color: isNegative ? '#ea580c' : '#0f172a' }}>
                            {f.rating}★
                          </span>
                        </div>
                      </td>

                      {/* NPS Score */}
                      <td style={{ padding: '12px 16px' }}>
                        {f.nps_score !== null && f.nps_score !== undefined ? (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            backgroundColor: f.nps_score >= 9 ? '#dcfce7' : (f.nps_score >= 7 ? '#fef3c7' : '#fee2e2'),
                            color: f.nps_score >= 9 ? '#166534' : (f.nps_score >= 7 ? '#92400e' : '#991b1b')
                          }}>
                            {f.nps_score}/10 {f.nps_score >= 9 ? '• Promoter' : (f.nps_score >= 7 ? '• Neutral' : '• Detractor')}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>

                      {/* Survey Tags */}
                      <td style={{ padding: '12px 16px', maxWidth: '240px' }}>
                        {tags.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {tags.map((tag, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: '12px',
                                  fontSize: '0.68rem',
                                  fontWeight: '600',
                                  backgroundColor: isNegative ? '#ffedd5' : '#eff6ff',
                                  color: isNegative ? '#9a3412' : '#1d4ed8',
                                  border: isNegative ? '1px solid #fed7aa' : '1px solid #dbeafe'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>No tags selected</span>
                        )}
                      </td>

                      {/* Remarks Comment */}
                      <td style={{ padding: '12px 16px', color: f.comment ? '#334155' : '#94a3b8', fontStyle: f.comment ? 'normal' : 'italic', maxWidth: '240px', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {f.comment ? `“${f.comment}”` : '—'}
                      </td>

                      {/* Invoice Link */}
                      <td style={{ padding: '12px 16px' }}>
                        <a
                          href={`/t/${f.short_id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          <span>#{f.invoice_number || f.short_id}</span>
                          <ExternalLink style={{ width: '11px', height: '11px' }} />
                        </a>
                      </td>

                      {/* Resolution Status */}
                      <td style={{ padding: '12px 16px' }}>
                        {isNegative ? (
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: f.resolution_status === 'resolved' ? '#dcfce7' : '#fee2e2',
                            color: f.resolution_status === 'resolved' ? '#166534' : '#991b1b'
                          }}>
                            {f.resolution_status === 'resolved' ? '✓ Resolved' : '⚠️ Pending Action'}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            backgroundColor: '#dcfce7',
                            color: '#166534'
                          }}>
                            ✓ Promoter
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          {isNegative && (
                            <button
                              onClick={() => { setActiveModal(f); setResolutionNotes(f.resolution_notes || ''); }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #fed7aa',
                                backgroundColor: '#fff7ed',
                                color: '#ea580c',
                                fontWeight: '700',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>Resolve</span>
                            </button>
                          )}
                          <a
                            href={`/t/${f.short_id}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              fontWeight: '700',
                              fontSize: '0.72rem',
                              textDecoration: 'none'
                            }}
                          >
                            Receipt
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Table Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            accentColor="#2563eb"
          />
        </div>
      )}

      {/* TAB 2: SURVEY SETTINGS & REWARDS */}
      {activeTab === 'settings' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.75rem', maxWidth: '800px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sliders style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#111827' }}>
                Embedded Customer Survey Controls
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                Configure survey points incentives and Google Reviews routing on public digital receipts (/t/{'{shortId}'})
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Enable Surveys Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#1e293b' }}>
                  Enable Embedded Surveys on Digital Receipts
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Displays the interactive 5-star rating, aspect tag chips, and NPS score selector on shopper bill pages.
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                <input
                  type="checkbox"
                  checked={surveySettings.feedback_enabled}
                  onChange={(e) => setSurveySettings({ ...surveySettings, feedback_enabled: e.target.checked })}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: surveySettings.feedback_enabled ? '#2563eb' : '#cbd5e1',
                  borderRadius: '24px',
                  transition: '0.2s'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: surveySettings.feedback_enabled ? '23px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.2s'
                  }} />
                </span>
              </label>
            </div>

            {/* Survey Reward Points */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Survey Completion Reward Points
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={surveySettings.survey_reward_points}
                  onChange={(e) => setSurveySettings({ ...surveySettings, survey_reward_points: parseInt(e.target.value, 10) || 0 })}
                  style={{ width: '140px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Bonus loyalty points credited instantly to customer profile upon submitting survey.
                </span>
              </div>
            </div>

            {/* Google Review Direct Link */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Google Business Review URL
              </label>
              <input
                type="url"
                placeholder="https://g.page/r/your-store/review or Google Maps URL"
                value={surveySettings.google_review_url}
                onChange={(e) => setSurveySettings({ ...surveySettings, google_review_url: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                Shoppers who rate 4★ or 5★ are nudged with a 1-click button directly to this Google Review write dialog.
              </span>
            </div>

            {/* Google Place ID */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Google Place ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
                value={surveySettings.google_place_id}
                onChange={(e) => setSurveySettings({ ...surveySettings, google_place_id: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>

            {/* Save Button */}
            <div style={{ paddingTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={savingSettings}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  border: 'none',
                  cursor: savingSettings ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                }}
              >
                {savingSettings ? 'Saving Settings...' : 'Save Survey Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resolve Feedback Modal */}
      {activeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#111827' }}>
                Resolve Customer Feedback
              </h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '12px', marginBottom: '1rem', fontSize: '0.8rem', color: '#9a3412' }}>
              <div style={{ fontWeight: '800', marginBottom: '4px' }}>
                Customer: {activeModal.customer_name || 'Shopper'} ({activeModal.customer_phone || 'No Phone'}) &bull; {activeModal.rating}★ Rating
              </div>
              <div>"{activeModal.comment || 'No written remark'}"</div>
              {Array.isArray(activeModal.survey_tags) && activeModal.survey_tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                  {activeModal.survey_tags.map((t, idx) => (
                    <span key={idx} style={{ padding: '1px 6px', borderRadius: '8px', backgroundColor: '#ffedd5', fontSize: '0.7rem', fontWeight: '700' }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  Resolution Notes / Action Taken
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Called customer and offered replacement / apologized for billing delay..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              {activeModal.customer_phone && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={`https://wa.me/${activeModal.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Dear ${activeModal.customer_name || 'Customer'},\n\nWe noticed your recent visit to ${profile?.store_name || 'our store'} was not up to expectations. We sincerely apologize for the inconvenience!\n\nAs a gesture of goodwill, we would love to welcome you back. Please let us know how we can make this right!`)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#25d366',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                  >
                    <MessageSquare style={{ width: '14px', height: '14px' }} />
                    <span>WhatsApp Apology</span>
                  </a>

                  <a
                    href={`tel:${activeModal.customer_phone.replace(/\D/g, '')}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                  >
                    <PhoneCall style={{ width: '14px', height: '14px' }} />
                    <span>Call</span>
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontSize: '0.825rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontSize: '0.825rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  {resolving ? 'Saving...' : 'Mark as Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
