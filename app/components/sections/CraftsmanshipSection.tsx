'use client';

import React from 'react';

interface CraftsmanshipSectionProps {
  craftP: number;
}

export function CraftsmanshipSection({ craftP }: CraftsmanshipSectionProps) {
  return (
    <section
      id="craftsmanship"
      className="relative z-10 flex items-center select-none"
      style={{ height: '100vh', background: '#070708' }}
    >
      <div
        className="w-full max-w-7xl mx-auto px-8 lg:px-16 flex justify-start"
        style={{ paddingLeft: 'clamp(2rem, 6vw, 6rem)' }}
      >
        <div
          className="w-full lg:w-[48%] text-white"
          style={{
            opacity: craftP,
            transform: `translateY(${Math.max(0, (1 - craftP) * 30)}px)`,
          }}
        >
          <p
            style={{
              fontSize: '0.58rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)',
              marginBottom: '1.25rem',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            CRAFTSMANSHIP
          </p>

          <h2
            style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)',
              fontWeight: 300,
              lineHeight: 1.1,
              color: 'rgba(255,255,255,0.88)',
              marginBottom: '1.5rem',
              letterSpacing: '-0.01em',
            }}
          >
            Crafted<br />With Intent
          </h2>

          <p
            style={{
              fontSize: '0.83rem',
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.85,
              maxWidth: '40ch',
              marginBottom: '2.5rem',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Every surface, proportion and interface is considered before the first movement begins.
            The Athena A01 is composed rather than merely assembled.
          </p>

          <div className="flex flex-col gap-4">
            {[
              {
                num: '01',
                title: 'FORGED TITANIUM CASE',
                body: 'Grade 5 titanium, machined and finished to within 0.01 mm.',
              },
              {
                num: '02',
                title: 'DOUBLE-DOMED SAPPHIRE',
                body: 'Anti-reflective coating on both surfaces with 9H hardness.',
              },
              {
                num: '03',
                title: 'CALIBRE A01 MOVEMENT',
                body: 'In-house automatic movement with a 72-hour power reserve.',
              },
            ].map(({ num, title, body }) => (
              <div
                key={num}
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}
              >
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      fontSize: '0.58rem',
                      letterSpacing: '0.2em',
                      color: 'rgba(255,255,255,0.2)',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {num}
                  </span>
                  <div>
                    <p
                      style={{
                        fontSize: '0.62rem',
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.55)',
                        marginBottom: '0.25rem',
                        fontFamily: 'system-ui, sans-serif',
                      }}
                    >
                      {title}
                    </p>
                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: 'rgba(255,255,255,0.32)',
                        lineHeight: 1.6,
                        fontFamily: 'system-ui, sans-serif',
                      }}
                    >
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
