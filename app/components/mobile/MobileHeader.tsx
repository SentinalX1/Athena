'use client';

import React from 'react';

interface MobileHeaderProps {
  isInspecting: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onStartInspect: () => void;
  onNavigateHome: () => void;
}

export function MobileHeader({
  isInspecting,
  menuOpen,
  onToggleMenu,
  onStartInspect,
  onNavigateHome,
}: MobileHeaderProps) {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(5, 5, 7, 0.55)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        opacity: isInspecting ? 0 : 1,
        pointerEvents: isInspecting ? 'none' : 'auto',
        transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <button
        type="button"
        onClick={onNavigateHome}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          fontSize: '0.92rem',
          fontWeight: 700,
          letterSpacing: '0.32em',
          color: '#ffffff',
          cursor: 'pointer',
          fontFamily: 'Georgia, serif',
        }}
      >
        ATHENA
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Luxury 360° View Pill */}
        <button
          type="button"
          onClick={onStartInspect}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '9999px',
            padding: '0.38rem 0.85rem',
            fontSize: '0.6rem',
            fontFamily: 'monospace',
            letterSpacing: '0.18em',
            color: 'rgba(255, 255, 255, 0.95)',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
            transition: 'all 0.2s ease',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#60a5fa',
              boxShadow: '0 0 8px #60a5fa',
              animation: 'pulse 2s infinite',
            }}
          />
          360° VIEW
        </button>

        {/* Menu Toggle */}
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label="Menu"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '50%',
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>
    </header>
  );
}
