'use client';

import React from 'react';

interface NavbarProps {
  isVisible: boolean;
  onNavigate?: (target: string) => void;
}

export function Navbar({ isVisible, onNavigate }: NavbarProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(target);
    } else {
      const el = document.querySelector(target);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-7 mix-blend-difference text-white transition-opacity duration-700 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ maxWidth: '1400px', margin: '0 auto' }}
    >
      <a
        href="#hero"
        onClick={(e) => handleClick(e, '#hero')}
        style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.28em', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
      >
        ATHENA
      </a>
      <nav
        style={{
          display: 'flex',
          gap: '2.5rem',
          fontSize: '0.66rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        <a
          href="#timepiece"
          onClick={(e) => handleClick(e, '#timepiece')}
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
        >
          Timepieces
        </a>
        <a
          href="#craftsmanship"
          onClick={(e) => handleClick(e, '#craftsmanship')}
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
        >
          Craftsmanship
        </a>
      </nav>
      <button
        onClick={() => {
          if (onNavigate) {
            onNavigate('#coming-soon');
          } else {
            document.querySelector('#coming-soon')?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
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
