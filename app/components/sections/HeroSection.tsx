'use client';

import React from 'react';

interface HeroSectionProps {
  heroP: number;
  onNavigate?: (target: string) => void;
}

export function HeroSection({ heroP, onNavigate }: HeroSectionProps) {
  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('#timepiece');
    } else {
      document.querySelector('#timepiece')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="relative z-10 flex flex-col items-center justify-between select-none"
      style={{
        height: '100vh',
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.97) 0%, rgba(228,231,234,0.82) 55%, rgba(212,215,219,1) 100%)',
      }}
    >
      {/* Ghost ATHENA Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: Math.max(0, 1 - heroP * 2) }}
      >
        <span
          style={{
            fontSize: 'clamp(5rem, 16vw, 18rem)',
            fontWeight: 300,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(155,158,163,0.26)',
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          ATHENA
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* CTA Button */}
      <div
        className="relative z-20"
        style={{
          marginBottom: '2.75rem',
          opacity: Math.max(0, 1 - heroP * 2.5),
          transform: `translateY(${heroP * 40}px)`,
        }}
      >
        <a
          href="#timepiece"
          onClick={handleCtaClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(255,255,255,0.70)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.88)',
            borderRadius: '9999px',
            padding: '0.85rem 2.1rem',
            fontSize: '0.63rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: '#27272a',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            fontFamily: 'system-ui, sans-serif',
            cursor: 'pointer',
          }}
        >
          Discover The Collection
          <svg
            style={{
              width: '0.8rem',
              height: '0.8rem',
              animation: 'ctaBounce 1.8s ease-in-out infinite',
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>
    </section>
  );
}
