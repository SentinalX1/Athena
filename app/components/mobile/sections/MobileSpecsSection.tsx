'use client';

import React from 'react';

const SPEC_ITEMS = [
  { label: 'CASE',     value: '42 MM' },
  { label: 'MATERIAL', value: 'GRADE 5 TITANIUM' },
  { label: 'MOVEMENT', value: 'AUTOMATIC' },
  { label: 'CRYSTAL',  value: 'DOUBLE-DOMED SAPPHIRE' },
] as const;

interface MobileSpecsSectionProps {
  specsOpacity: number;
}

export function MobileSpecsSection({ specsOpacity }: MobileSpecsSectionProps) {
  return (
    <section
      id="timepiece"
      style={{
        minHeight: '100dvh',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: '#050505',
      }}
    >
      <div
        style={{
          padding: '0 1.5rem 2.5rem',
          opacity: specsOpacity,
          transform: `translateY(${(1 - specsOpacity) * 20}px)`,
        }}
      >
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '0.52rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.38)',
            marginBottom: '0.4rem',
          }}
        >
          ATHENA / A01
        </p>

        <h2
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(1.5rem, 5.5vw, 2rem)',
            fontWeight: 300,
            color: '#fff',
            marginBottom: '0.55rem',
            lineHeight: 1.2,
          }}
        >
          A New Standard
          <br />
          In{' '}
          <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>
            Automatic Engineering
          </em>
        </h2>

        <p
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.48)',
            lineHeight: 1.65,
            marginBottom: '1.25rem',
            fontWeight: 300,
          }}
        >
          Forged Grade 5 titanium. Double-domed sapphire. Engineered around restraint, precision and permanence.
        </p>

        <div
          style={{
            width: '100%',
            height: 1,
            background: 'rgba(255,255,255,0.08)',
            marginBottom: '1rem',
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.9rem 1.25rem',
          }}
        >
          {SPEC_ITEMS.map(({ label, value }) => (
            <div key={label}>
              <p
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.5rem',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.32)',
                  marginBottom: '0.2rem',
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.88)',
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
