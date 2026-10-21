import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Universal Route Telemetry Tracker
 * Mounts at top-level <BrowserRouter> to automatically track screen transitions,
 * panel navigation, and dwell durations across ALL current and future pages.
 */

// Helper to get or generate persistent session UUID per browser tab
function getSessionId() {
  let sId = sessionStorage.getItem('rn_session_id');
  if (!sId) {
    sId = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    sessionStorage.setItem('rn_session_id', sId);
  }
  return sId;
}

// Fire telemetry beacon (non-blocking, fails gracefully)
function sendTelemetryBeacon(payload) {
  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const body = JSON.stringify(payload);

    // If available and supported, sendBeacon is ideal for unloads
    if (navigator.sendBeacon && payload.isUnload) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/v1/telemetry/page-view', blob);
      return;
    }

    // Standard non-blocking fetch
    fetch('/api/v1/telemetry/page-view', {
      method: 'POST',
      headers,
      body,
      keepalive: true
    }).catch(() => {
      // Intentionally silent on offline/network errors
    });
  } catch (e) {}
}

export default function RouteTracker() {
  const location = useLocation();
  const lastPathRef = useRef(null);
  const pageStartTimeRef = useRef(Date.now());
  const sessionIdRef = useRef(getSessionId());

  useEffect(() => {
    const currentPath = location.pathname + (location.search || '');
    const now = Date.now();

    // If there was a previous page in this session, report its transition duration
    if (lastPathRef.current && lastPathRef.current !== currentPath) {
      const durationSeconds = Math.max(0, Math.round((now - pageStartTimeRef.current) / 1000));
      sendTelemetryBeacon({
        path: lastPathRef.current,
        referrer: null,
        sessionId: sessionIdRef.current,
        durationSeconds,
        pageTitle: document.title || lastPathRef.current
      });
    }

    // Log the new page entry
    sendTelemetryBeacon({
      path: currentPath,
      referrer: lastPathRef.current || document.referrer || null,
      sessionId: sessionIdRef.current,
      durationSeconds: 0,
      pageTitle: document.title || currentPath
    });

    // Update tracking pointers
    lastPathRef.current = currentPath;
    pageStartTimeRef.current = now;
  }, [location.pathname, location.search]);

  // Track page unload / tab close to capture dwell time of last page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lastPathRef.current) {
        const durationSeconds = Math.max(0, Math.round((Date.now() - pageStartTimeRef.current) / 1000));
        sendTelemetryBeacon({
          path: lastPathRef.current,
          sessionId: sessionIdRef.current,
          durationSeconds,
          isUnload: true
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return null;
}
