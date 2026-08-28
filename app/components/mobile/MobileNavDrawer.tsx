'use client';

import React from 'react';

const NAV_ITEMS = [
  { id: '#hero',          label: 'Overview & Model',              idx: '01' },
  { id: '#timepiece',     label: 'Specifications & Dimensions',   idx: '02' },
  { id: '#craftsmanship', label: 'Haute Horlogerie Craft',        idx: '03' },
  { id: '#coming-soon',   label: 'VIP Premiere Allocation',       idx: '04' },
] as const;

interface MobileNavDrawerProps {
  isOpen: boolean;
  onSelectSection: (id: string) => void;
  onStartInspect: () => void;
}

export function MobileNavDrawer({
  isOpen,
  onSelectSection,
  onStartInspect,
}: MobileNavDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 62,
        left: 0,
        right: 0,
        zIndex: 58,
        background: 'rgba(7, 7, 11, 0.98)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
      }}
    >
      <p
        style={{
          fontFamily: 'monospace',
          fontSize: '0.5rem',
          letterSpacing: '0.35em',
          color: 'rgba(255, 255, 255, 0.35)',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}
      >
        ATHENA HOROLOGY
      </p>

      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectSection(item.id)}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
            padding: '0.75rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.82)',
            fontSize: '0.7rem',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            textAlign: 'left',
            transition: 'color 0.2s ease',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.55rem',
                color: 'rgba(255, 255, 255, 0.3)',
              }}
            >
              {item.idx}
            </span>
            {item.label}
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>→</span>
        </button>
      ))}

      {/* Luxury Launch 360 Tactile Inspection Button */}
      <button
        type="button"
        onClick={onStartInspect}
        style={{
          marginTop: '1.25rem',
          width: '100%',
          padding: '0.85rem',
          borderRadius: 9999,
          background: 'linear-gradient(135deg, #ffffff 0%, #ebebeb 100%)',
          color: '#08080a',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          fontSize: '0.62rem',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(255, 255, 255, 0.18), 0 4px 16px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#2563eb',
            boxShadow: '0 0 6px #2563eb',
          }}
        />
        Launch 360° Tactile Inspection
      </button>
    </div>
  );
}
