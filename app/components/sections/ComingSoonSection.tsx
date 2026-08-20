'use client';

import React from 'react';

interface ComingSoonSectionProps {
  comingSoonP: number;
}

export function ComingSoonSection({ comingSoonP }: ComingSoonSectionProps) {
  return (
    <section
      id="coming-soon"
      className="relative z-10 flex items-center justify-center select-none"
      style={{
        height: '100vh',
        background: '#030303',
        padding: '0 1.5rem',
        alignItems: 'flex-start',
        paddingTop: 'clamp(5rem, 10vh, 9rem)',
      }}
    >
      <div
        className="text-center max-w-lg mx-auto"
        style={{
          opacity: comingSoonP,
          transform: `translateY(${Math.max(0, (1 - comingSoonP) * 30)}px)`,
        }}
      >
        <p
          style={{
            fontSize: '0.58rem',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)',
            marginBottom: '1.5rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          ATHENA HOROLOGY
        </p>

        <h2
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 300,
            lineHeight: 1.2,
            color: 'rgba(255,255,255,0.90)',
            marginBottom: '0.5rem',
            letterSpacing: '-0.01em',
          }}
        >
          Coming Soon
        </h2>
        <p
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.22)',
            marginBottom: '2.5rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Autumn 2026 Premiere
        </p>

        <form
          onSubmit={(e) => e.preventDefault()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.7rem',
            maxWidth: '360px',
            margin: '0 auto',
          }}
        >
          <input
            type="email"
            placeholder="Enter email for private access"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '9999px',
              padding: '0.75rem 1.35rem',
              fontSize: '0.72rem',
              fontFamily: 'system-ui, sans-serif',
              color: '#fff',
              outline: 'none',
              letterSpacing: '0.05em',
            }}
          />
          <button
            type="submit"
            style={{
              background: 'rgba(255,255,255,0.90)',
              color: '#050505',
              borderRadius: '9999px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.6rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 700,
            }}
          >
            Notify Me
          </button>
        </form>
      </div>
    </section>
  );
}
