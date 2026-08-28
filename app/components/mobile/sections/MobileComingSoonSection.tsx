'use client';

import React from 'react';

interface MobileComingSoonSectionProps {
  vipOpacity: number;
  emailValue: string;
  emailSubmitted: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MobileComingSoonSection({
  vipOpacity,
  emailValue,
  emailSubmitted,
  onEmailChange,
  onSubmit,
}: MobileComingSoonSectionProps) {
  return (
    <section
      id="coming-soon"
      style={{
        minHeight: '100dvh',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '4.5rem',
        background: '#030303',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          padding: '0 1.5rem',
          width: '100%',
          maxWidth: 340,
          opacity: vipOpacity,
          transform: `translateY(${(1 - vipOpacity) * 20}px)`,
        }}
      >
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '0.52rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '0.65rem',
          }}
        >
          ATHENA HOROLOGY
        </p>

        <h2
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(1.9rem, 7vw, 2.6rem)',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.92)',
            marginBottom: '0.35rem',
            lineHeight: 1.1,
          }}
        >
          Coming Soon
        </h2>

        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '0.58rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '1.75rem',
          }}
        >
          Autumn 2026 Premiere
        </p>

        {emailSubmitted ? (
          <div
            style={{
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.3)',
              borderRadius: 16,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(52,211,153,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6ee7b7',
                fontSize: '1rem',
              }}
            >
              ✓
            </div>

            <p
              style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#fff',
              }}
            >
              VIP Access Confirmed
            </p>

            <p
              style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: '0.68rem',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.6,
              }}
            >
              You have been placed on the private allocation register.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}
          >
            <input
              type="email"
              value={emailValue}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Enter email for private access"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 9999,
                padding: '0.8rem 1.5rem',
                fontSize: '0.72rem',
                fontFamily: 'system-ui, sans-serif',
                color: '#fff',
                outline: 'none',
                textAlign: 'center',
                letterSpacing: '0.04em',
              }}
            />

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.92)',
                color: '#050507',
                border: 'none',
                fontSize: '0.62rem',
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(255,255,255,0.18)',
              }}
            >
              Notify Me
            </button>
          </form>
        )}

        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '0.48rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.18)',
            marginTop: '3rem',
          }}
        >
          ATHENA HOROLOGY · GENÈVE
        </p>
      </div>
    </section>
  );
}
