'use client';

import React from 'react';

interface TimepieceSectionProps {
  timepieceP: number;
}

export function TimepieceSection({ timepieceP }: TimepieceSectionProps) {
  return (
    <section
      id="timepiece"
      className="relative z-10 flex items-center select-none"
      style={{
        height: '100vh',
        background: '#050505',
        backgroundImage:
          'radial-gradient(ellipse 50% 60% at 20% 50%, rgba(35,35,40,0.95) 0%, #050505 70%)',
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-8 lg:px-16 flex justify-end">
        <div
          className="w-full lg:w-[50%] text-white"
          style={{
            opacity: timepieceP,
            transform: `translateY(${Math.max(0, (1 - timepieceP) * 30)}px)`,
          }}
        >
          <p
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
              marginBottom: '1.5rem',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            ATHENA / A01
          </p>

          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 300,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              color: '#ffffff',
              marginBottom: '1.25rem',
            }}
          >
            A New Standard<br />
            In{' '}
            <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>
              Automatic Engineering
            </em>
          </h2>

          <p
            style={{
              fontSize: '0.83rem',
              color: 'rgba(255,255,255,0.42)',
              lineHeight: 1.8,
              maxWidth: '42ch',
              marginBottom: '2.5rem',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Forged Grade 5 titanium. Double-domed sapphire.<br />
            A mechanical architecture engineered around restraint, precision and permanence.
          </p>

          <div
            style={{
              width: '100%',
              height: '1px',
              background: 'rgba(255,255,255,0.08)',
              marginBottom: '2rem',
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem 2rem',
              marginBottom: '2.5rem',
            }}
          >
            {[
              { label: 'CASE', value: '42 MM' },
              { label: 'MATERIAL', value: 'GRADE 5 TITANIUM' },
              { label: 'MOVEMENT', value: 'AUTOMATIC' },
              { label: 'CRYSTAL', value: 'DOUBLE-DOMED SAPPHIRE' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p
                  style={{
                    fontSize: '0.56rem',
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.28)',
                    marginBottom: '0.25rem',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {label}
                </p>
                <p
                  style={{
                    fontSize: '0.78rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.72)',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
