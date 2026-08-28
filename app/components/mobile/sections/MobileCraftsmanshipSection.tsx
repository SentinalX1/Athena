'use client';

import React from 'react';

const CRAFT_ITEMS = [
  {
    num: '01',
    title: 'FORGED TITANIUM CASE',
    body: 'Grade 5 titanium, machined to within 0.01mm. Hand-satin finished bevels.',
  },
  {
    num: '02',
    title: 'DOUBLE-DOMED SAPPHIRE',
    body: '9H hardness, zero-distortion geometry, dual-sided anti-reflective coating.',
  },
  {
    num: '03',
    title: 'CALIBRE A01 MOVEMENT',
    body: 'In-house automatic engine with 72-hour power reserve.',
  },
] as const;

interface MobileCraftsmanshipSectionProps {
  craftOpacity: number;
}

export function MobileCraftsmanshipSection({
  craftOpacity,
}: MobileCraftsmanshipSectionProps) {
  return (
    <section
      id="craftsmanship"
      style={{
        minHeight: '100dvh',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: '#070708',
      }}
    >
      <div
        style={{
          padding: '0 1.5rem 2.5rem',
          opacity: craftOpacity,
          transform: `translateY(${(1 - craftOpacity) * 20}px)`,
        }}
      >
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '0.52rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '0.4rem',
          }}
        >
          CRAFTSMANSHIP
        </p>

        <h2
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(1.5rem, 5.5vw, 2rem)',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.92)',
            marginBottom: '0.55rem',
            lineHeight: 1.2,
          }}
        >
          Crafted With Intent
        </h2>

        <p
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.42)',
            lineHeight: 1.65,
            marginBottom: '1.25rem',
            fontWeight: 300,
          }}
        >
          Every surface, proportion and interface is considered before the first movement begins.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {CRAFT_ITEMS.map(({ num, title, body }) => (
            <div
              key={num}
              style={{
                borderTop: '1px solid rgba(255,255,255,0.09)',
                paddingTop: '0.65rem',
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.52rem',
                  color: 'rgba(255,255,255,0.28)',
                  fontWeight: 700,
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                {num}
              </span>

              <div>
                <p
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.88)',
                    marginBottom: '0.2rem',
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: '0.68rem',
                    color: 'rgba(255,255,255,0.42)',
                    lineHeight: 1.6,
                    fontWeight: 300,
                  }}
                >
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
