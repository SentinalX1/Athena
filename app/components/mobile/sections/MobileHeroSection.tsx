'use client';

interface MobileHeroSectionProps {
  heroTextOpacity: number;
  onStartInspect: () => void;
  onScrollToSection: (id: string) => void;
}

export function MobileHeroSection({
  heroTextOpacity,
  onStartInspect,
  onScrollToSection,
}: MobileHeroSectionProps) {
  const contentOpacity = Math.max(0, heroTextOpacity);
  const contentTranslateY = (1 - contentOpacity) * 20;
  const watermarkOpacity = Math.max(0, 1 - heroTextOpacity < 0.8 ? 0 : 0.28);

  return (
    <section
      id="hero"
      style={{
        minHeight: '100dvh',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background:
          'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.96) 0%, rgba(224,228,234,0.88) 55%, rgba(200,207,215,1) 100%)',
      }}
    >
      {/* Ghost ATHENA watermark */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          top: '-6%',
          opacity: watermarkOpacity,
        }}
      >
        <span
          style={{
            fontSize: 'clamp(3.2rem, 17vw, 6rem)',
            fontWeight: 300,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(140,145,155,1)',
            userSelect: 'none',
            lineHeight: 1,
            fontFamily: 'Georgia, serif',
          }}
        >
          ATHENA
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Hero Bottom Text & CTAs */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          padding: '0 1.5rem 2.25rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          opacity: contentOpacity,
          transform: `translateY(${contentTranslateY}px)`,
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            marginBottom: '0.5rem',
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#3b82f6',
            }}
          />
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.55rem',
              letterSpacing: '0.36em',
              textTransform: 'uppercase',
              color: '#4b5563',
            }}
          >
            SWISS AUTOMATIC · GENÈVE
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(1.9rem, 7.5vw, 2.5rem)',
            fontWeight: 300,
            letterSpacing: '-0.01em',
            color: '#18181b',
            marginBottom: '0.55rem',
            lineHeight: 1.1,
          }}
        >
          Athena A01
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '0.72rem',
            color: '#6b7280',
            lineHeight: 1.65,
            maxWidth: 270,
            marginBottom: '1.5rem',
            fontWeight: 300,
          }}
        >
          Pure mechanical restraint. Forged Grade 5 titanium with double-domed sapphire crystal.
        </p>

        {/* CTA Row */}
        <div
          style={{
            display: 'flex',
            gap: '0.65rem',
            width: '100%',
            maxWidth: 300,
          }}
        >
          <button
            type="button"
            onClick={onStartInspect}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.75rem 0',
              borderRadius: 9999,
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.9)',
              color: '#18181b',
              fontSize: '0.6rem',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
            360° VIEW
          </button>

          <button
            type="button"
            onClick={() => onScrollToSection('#timepiece')}
            style={{
              flex: 1,
              padding: '0.75rem 0',
              borderRadius: 9999,
              background: '#18181b',
              color: '#fff',
              border: 'none',
              fontSize: '0.6rem',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
            }}
          >
            DISCOVER ↓
          </button>
        </div>
      </div>
    </section>
  );
}
