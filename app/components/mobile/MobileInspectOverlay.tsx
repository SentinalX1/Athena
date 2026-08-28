'use client';

import React from 'react';

interface MobileInspectOverlayProps {
  isInspecting: boolean;
  onEndInspect: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

export function MobileInspectOverlay({
  isInspecting,
  onEndInspect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: MobileInspectOverlayProps) {
  if (!isInspecting) return null;

  return (
    <div
      className="fixed inset-0 z-[65] pointer-events-auto flex flex-col justify-between touch-none select-none"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0.75rem)',
        paddingBottom: 'env(safe-area-inset-bottom, 1.5rem)',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Top Header & Instruction Pill (Cleanly grouped at top above the watch) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          padding: '0.75rem 1.5rem 0',
        }}
      >
        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: '0.65rem',
            pointerEvents: 'auto',
          }}
        >
          <span
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              letterSpacing: '0.32em',
              color: 'rgba(255, 255, 255, 0.92)',
              fontFamily: 'Georgia, serif',
              userSelect: 'none',
            }}
          >
            ATHENA
          </span>

          {/* Top-Right Quick Close Icon */}
          <button
            type="button"
            onClick={onEndInspect}
            aria-label="Exit inspection"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Minimalist Sub-Header Instruction Pill (High above watch) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.3rem',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(7, 8, 12, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: 9999,
              padding: '0.38rem 0.95rem',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2.2"
              style={{ animation: 'spin 6s linear infinite' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>

            <span
              style={{
                fontSize: '0.55rem',
                fontFamily: 'monospace',
                letterSpacing: '0.2em',
                color: '#ffffff',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Drag To Rotate 360°
            </span>
          </div>

          <p
            style={{
              fontFamily: 'monospace',
              fontSize: '0.48rem',
              color: 'rgba(255, 255, 255, 0.4)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Calibre A01 · Multi-Axis Viewport
          </p>
        </div>
      </div>

      {/* Unobstructed Center Viewport for 3D Watch (Empty) */}
      <div style={{ flex: 1, pointerEvents: 'none' }} />

      {/* Bottom Floating Exit Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '0 1.5rem 1.75rem',
          pointerEvents: 'auto',
        }}
      >
        <button
          type="button"
          onClick={onEndInspect}
          style={{
            width: '100%',
            maxWidth: 270,
            padding: '0.85rem 1.5rem',
            borderRadius: 9999,
            background: 'rgba(12, 13, 18, 0.78)',
            border: '1px solid rgba(255, 255, 255, 0.24)',
            color: '#ffffff',
            fontSize: '0.62rem',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow:
              '0 12px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 0 0 1px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <span style={{ fontSize: '0.72rem', opacity: 0.75 }}>✕</span>
          Exit Inspection
        </button>
      </div>
    </div>
  );
}
