'use client';

import React from 'react';

interface NavbarProps {
  isVisible: boolean;
}

export function Navbar({ isVisible }: NavbarProps) {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-7 mix-blend-difference text-white transition-opacity duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ maxWidth: '1400px', margin: '0 auto' }}
    >
      <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.28em' }}>
        ATHENA
      </span>
      <nav
        style={{
          display: 'flex',
          gap: '2.5rem',
          fontSize: '0.66rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        <a href="#timepiece" style={{ textDecoration: 'none', color: 'inherit' }}>
          Timepieces
        </a>
        <a href="#craftsmanship" style={{ textDecoration: 'none', color: 'inherit' }}>
          Craftsmanship
        </a>
      </nav>
      <button
        style={{
          fontSize: '0.62rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: '9999px',
          padding: '0.65rem 1.45rem',
          paddingTop: '0.75rem',
          paddingBottom: '0.60rem',
          marginTop: '0.35rem',
          background: 'transparent',
          cursor: 'pointer',
          color: 'white',
        }}
      >
        Contact
      </button>
    </header>
  );
}
