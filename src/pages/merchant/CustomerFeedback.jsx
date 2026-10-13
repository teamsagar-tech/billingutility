import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Star, MessageSquare, CheckCircle, AlertTriangle, ExternalLink, X, Send, RefreshCw } from 'lucide-react';
import { maskPhone } from '../../utils/merchantUtils';

export default function CustomerFeedback() {
  const { profile, token, notifyToast } = useOutletContext();

  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

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

  useEffect(() => {
    fetchFeedback();
  }, [token]);

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

  const totalReviews = feedbackList.length;
  const avgRating = totalReviews > 0
    ? (feedbackList.reduce((acc, f) => acc + Number(f.rating || 5), 0) / totalReviews).toFixed(1)
    : '5.0';
  const promotersCount = feedbackList.filter((f) => Number(f.rating) >= 4).length;
  const promotersPercent = totalReviews > 0 ? Math.round((promotersCount / totalReviews) * 100) : 100;
  const privateCount = feedbackList.filter((f) => Number(f.rating) <= 3).length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#111827', letterSpacing: '-0.02em' }}>
            Customer Feedback &amp; System Ratings
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
            Ratings and feedback submitted by verified customers directly on their digital receipts (/t/{'{shortId}'}).
          </p>
        </div>
        <button
          onClick={fetchFeedback}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
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

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
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
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>Live verified bill ratings</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Total Ratings Submitted</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{totalReviews} Reviews</div>
          <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '600' }}>Via digital bill receipt</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Satisfied Customers</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
            {promotersPercent}% ({promotersCount})
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>4★ &amp; 5★ positive ratings</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Service Feedback</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: privateCount > 0 ? '#ea580c' : '#0f172a', marginTop: '4px' }}>
            {privateCount} Reviews
          </div>
          <span style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: '600' }}>1-3★ customer feedback</span>
        </div>
      </div>

      {/* Feedback Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#4b5563', fontSize: '0.72rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>#</th>
              <th style={{ padding: '12px 16px' }}>Rating Tier</th>
              <th style={{ padding: '12px 16px' }}>Customer Name</th>
              <th style={{ padding: '12px 16px' }}>Mobile</th>
              <th style={{ padding: '12px 16px' }}>Invoice</th>
              <th style={{ padding: '12px 16px' }}>Rating</th>
              <th style={{ padding: '12px 16px' }}>System Feedback Comments</th>
              <th style={{ padding: '12px 16px' }}>Resolution</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  Loading real-time feedback data...
                </td>
              </tr>
            ) : feedbackList.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
                  <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Star style={{ width: '24px', height: '24px' }} />
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>
                      No Customer Feedback Yet
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                      When shoppers rate their digital bill receipt (/t/{'{shortId}'}) and leave remarks, their verified feedback and Google review routing status will appear here.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              feedbackList.map((f, i) => {
                const isNegative = (Number(f.rating) || 5) <= 3;
                return (
                  <tr key={f.id || i} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isNegative ? '#fffaf8' : '#ffffff' }}>
                    <td style={{ padding: '12px 16px', color: '#9ca3af' }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {isNegative ? (
                        <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.72rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle style={{ width: '12px', height: '12px' }} />
                          <span>1-3★ Feedback</span>
                        </span>
                      ) : (
                        <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.72rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Star style={{ width: '12px', height: '12px', fill: '#166534' }} />
                          <span>4-5★ Feedback</span>
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#111827' }}>
                      {f.customer_name || 'Shopper'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4b5563' }}>{maskPhone(f.customer_phone)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0284c7' }}>#{f.invoice_number || f.short_id}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: isNegative ? '#ef4444' : '#f59e0b', fontWeight: '800', letterSpacing: '2px' }}>
                        {'★'.repeat(f.rating || 5)}{'☆'.repeat(5 - (f.rating || 5))}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: f.comment ? '#374151' : '#94a3b8', fontStyle: f.comment ? 'normal' : 'italic', maxWidth: '280px' }}>
                      {f.comment ? `“${f.comment}”` : '— No written comment submitted —'}
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
                          {f.resolution_status === 'resolved' ? '✓ Resolved' : 'Pending Action'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: '600' }}>
                          ✓ Redirected to Google
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {isNegative && (
                          <button
                            onClick={() => { setActiveModal(f); setResolutionNotes(f.resolution_notes || ''); }}
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

      {/* Resolve Modal */}
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

            <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 12px', marginBottom: '1rem', fontSize: '0.8rem', color: '#9a3412' }}>
              Customer <b>{activeModal.customer_name || 'Shopper'}</b> rated {activeModal.rating}★: "{activeModal.comment || 'No written remark'}"
            </div>

            <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>Resolution Notes / Action Taken</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Called customer and offered replacement / apologized for delay..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {activeModal.customer_phone && (
                <a
                  href={`https://wa.me/${activeModal.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Dear ${activeModal.customer_name || 'Customer'},\n\nWe noticed your recent visit to ${profile?.store_name || 'our store'} was not up to expectations. We sincerely apologize for the inconvenience!\n\nAs a gesture of goodwill, we would love to welcome you back. Please let us know how we can make this right!`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#25d366',
                    color: '#ffffff',
                    fontSize: '0.825rem',
                    fontWeight: '700',
                    textDecoration: 'none'
                  }}
                >
                  <MessageSquare style={{ width: '15px', height: '15px' }} />
                  <span>Send Apology WhatsApp Message</span>
                </a>
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
