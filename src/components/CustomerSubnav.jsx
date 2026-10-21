import React from 'react';
import { NavLink } from 'react-router-dom';

export default function CustomerSubnav({ totalCustomers, totalProfiles, totalOptouts, onCreateProfile }) {
  const tabs = [
    { to: '/dashboard/customers', label: '😎 Customers List', count: totalCustomers },
    { to: '/dashboard/profiles', label: '🧑 Demographic Profiles', count: totalProfiles },
    { to: '/dashboard/customer-journey', label: '🛣️ Customer Journey' },
    { to: '/dashboard/optout-customers', label: '🚫 Opt-out (DND)', count: totalOptouts },
    { to: '/dashboard/segmentation', label: '📊 Smart Segmentation' },
    { to: '/dashboard/segmentation/sku', label: '📦 SKU Products' }
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '12px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isActive ? '#0284c7' : 'transparent',
              color: isActive ? '#ffffff' : '#475569',
              fontWeight: '700',
              fontSize: '0.8rem',
              textDecoration: 'none',
              transition: 'all 0.12s'
            })}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span style={{
                fontSize: '0.7rem',
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(0,0,0,0.08)'
              }}>
                {tab.count}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {onCreateProfile && (
        <button
          onClick={onCreateProfile}
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
          <span>+ Create Profile</span>
        </button>
      )}
    </div>
  );
}
