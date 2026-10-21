import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Standard Official RetailNode Logo Lockup with Name
 * Matches the official RetailNode brand standard:
 * - Signature RN. circular network badge with connection nodes
 * - Bold wordmark: "Retail" in slate-900 (#0f172a) + "Node" in vibrant blue (#2563eb)
 * - Support for light and dark backgrounds
 */
export default function RetailNodeLogo({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  theme = 'light', // 'light' | 'dark'
  to = null,
  badge = null,
  subtext = null,
  className = '',
  onClick = null
}) {
  // Dimension configurations
  const SIZES = {
    sm: {
      badgeSize: 32,
      strokeWidth: 2.5,
      nodeSize: 2.2,
      monogramSize: 13,
      fontSize: '1.25rem', // 20px
      letterSpacing: '-0.025em',
      gap: '0.625rem'
    },
    md: {
      badgeSize: 42,
      strokeWidth: 3,
      nodeSize: 2.8,
      monogramSize: 17,
      fontSize: '1.65rem', // 26px
      letterSpacing: '-0.03em',
      gap: '0.75rem'
    },
    lg: {
      badgeSize: 52,
      strokeWidth: 3.5,
      nodeSize: 3.5,
      monogramSize: 21,
      fontSize: '2.1rem', // 34px
      letterSpacing: '-0.035em',
      gap: '0.875rem'
    },
    xl: {
      badgeSize: 64,
      strokeWidth: 4.2,
      nodeSize: 4.2,
      monogramSize: 26,
      fontSize: '2.6rem', // 42px
      letterSpacing: '-0.04em',
      gap: '1rem'
    }
  };

  const current = SIZES[size] || SIZES.md;
  const isDark = theme === 'dark';

  const logoContent = (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: current.gap,
        fontFamily: "'Outfit', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* 1. RN. Signature Circular Badge */}
      <div
        style={{
          width: current.badgeSize,
          height: current.badgeSize,
          flexShrink: 0,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg
          width={current.badgeSize}
          height={current.badgeSize}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Main circle */}
          <circle
            cx="50"
            cy="50"
            r="41"
            fill={isDark ? '#0f172a' : '#ffffff'}
            stroke={isDark ? '#38bdf8' : '#0ea5e9'}
            strokeWidth="7"
          />
          {/* Left connection node */}
          <circle
            cx="9"
            cy="50"
            r="4.5"
            fill={isDark ? '#0f172a' : '#ffffff'}
            stroke={isDark ? '#38bdf8' : '#0ea5e9'}
            strokeWidth="3"
          />
          {/* Right connection node */}
          <circle
            cx="91"
            cy="50"
            r="4.5"
            fill={isDark ? '#0f172a' : '#ffffff'}
            stroke={isDark ? '#38bdf8' : '#0ea5e9'}
            strokeWidth="3"
          />
          {/* Monogram */}
          <text
            x="50"
            y="52"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'Outfit', system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="34"
            letterSpacing="-0.5px"
          >
            <tspan fill={isDark ? '#ffffff' : '#0f172a'}>RN</tspan>
            <tspan fill={isDark ? '#38bdf8' : '#0ea5e9'}>.</tspan>
          </text>
        </svg>
      </div>

      {/* 2. Brand Name Typography & Optional Badge */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1 }}>
          <span
            style={{
              fontSize: current.fontSize,
              fontWeight: '900',
              letterSpacing: current.letterSpacing,
              lineHeight: 1,
              display: 'inline-block'
            }}
          >
            <span style={{ color: isDark ? '#ffffff' : '#0f172a' }}>Retail</span>
            <span style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>Node</span>
          </span>

          {badge && (
            <span
              style={{
                fontSize: size === 'sm' ? '0.65rem' : '0.72rem',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eef2ff',
                color: isDark ? '#93c5fd' : '#4338ca',
                border: isDark ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid #c7d2fe'
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {subtext && (
          <span
            style={{
              fontSize: size === 'sm' ? '0.7rem' : '0.78rem',
              color: isDark ? '#94a3b8' : '#64748b',
              fontWeight: '600',
              marginTop: '4px',
              lineHeight: 1.2
            }}
          >
            {subtext}
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        className="no-underline group hover:opacity-95 transition-opacity"
        style={{ textDecoration: 'none', display: 'inline-flex' }}
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
