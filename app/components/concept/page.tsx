'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

const _qDelta = new THREE.Quaternion();
const _axis = new THREE.Vector3(0, 0, 1);

//  Easing helpers
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

type WatchProps = ThreeElements['group'] & { scrollRaw: number };

//  3-D Watch Model ─
function WatchModel({ scrollRaw, ...props }: WatchProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { scene } = useGLTF('/models/AthenaWatch.glb');
  const groupRef = useRef<THREE.Group>(null);

  const hourHand   = scene.getObjectByName('HandHour')   as THREE.Object3D | undefined;
  const minuteHand = scene.getObjectByName('HandMinute') as THREE.Object3D | undefined;
  const secondHand = scene.getObjectByName('HandSecond') as THREE.Object3D | undefined;

  useEffect(() => {
    if (!scene || scene.userData.centered) return;
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.sub(box.getCenter(new THREE.Vector3()));
    scene.userData.centered = true;
  }, [scene]);

  const initQ = useRef<{ hour: THREE.Quaternion; minute: THREE.Quaternion; second: THREE.Quaternion } | null>(null);
  if (!initQ.current && hourHand && minuteHand && secondHand) {
    initQ.current = {
      hour:   hourHand.quaternion.clone(),
      minute: minuteHand.quaternion.clone(),
      second: secondHand.quaternion.clone(),
    };
  }

  // Smoothed raw scroll progress (un-clamped — spans 0 → ~2.5 viewport heights)
  const smoothRaw = useRef(0);
  const floatTime = useRef(0);

  useFrame((_, delta) => {
    if (!mounted || !initQ.current) return;

    // Clock hands 
    const now = new Date();
    const sec = now.getSeconds() + now.getMilliseconds() / 1000;
    const min = now.getMinutes() + sec / 60;
    const hr  = (now.getHours() % 12) + now.getMinutes() / 60;

    const BAKED_HOUR   = 10 + 10 / 60;
    const BAKED_MINUTE = 10 + 40 / 60;
    const BAKED_SECOND = 40;

    if (hourHand)   { _qDelta.setFromAxisAngle(_axis, -(((hr  - BAKED_HOUR)   / 12) * Math.PI * 2)); hourHand.quaternion.multiplyQuaternions(initQ.current.hour,   _qDelta); }
    if (minuteHand) { _qDelta.setFromAxisAngle(_axis, -(((min - BAKED_MINUTE) / 60) * Math.PI * 2)); minuteHand.quaternion.multiplyQuaternions(initQ.current.minute, _qDelta); }
    if (secondHand) { _qDelta.setFromAxisAngle(_axis, -(((sec - BAKED_SECOND) / 60) * Math.PI * 2)); secondHand.quaternion.multiplyQuaternions(initQ.current.second, _qDelta); }

    // Smooth scroll progress ─
    if (!groupRef.current) return;
    smoothRaw.current = THREE.MathUtils.lerp(smoothRaw.current, scrollRaw, 1 - Math.pow(0.001, delta));
    const sp = smoothRaw.current; // un-clamped progress in viewport units

    floatTime.current += delta;
    const t = floatTime.current;

    // Phase progress values
    // Phase 0  — Hero          : sp 0.00 → 0.65  (watch centered, idle float)
    // Phase 1  — Horizon       : sp 0.65 → 1.00  (tilt back, begin moving left)
    // Phase 2  — Arrival       : sp 1.00 → 1.55  (dock to left 3/4 product shot)
    // Phase 3  — Craftsmanship : sp 1.55 → 2.40  (subtle Y-axis spin)

    const p0 = smoothstep(0.00, 0.65, sp);  // hero — 0→1 during hero section
    const p1 = smoothstep(0.65, 1.00, sp);  // horizon transition
    const p2 = smoothstep(1.00, 1.55, sp);  // arrival / dock
    const p3 = smoothstep(1.55, 2.40, sp);  // craftsmanship rotation

    // Hero idle float (fades out as horizon transition begins)
    const heroFloat = Math.sin(t * 0.8) * 0.018 * (1 - p1);

    // Rotation
    // Hero:        x=-0.30, y=0,     z=0
    // Horizon pk:  x=-1.05, y=-0.50, z=-0.08   (overshoot)
    // Docked:      x=-0.72, y=-0.38, z=-0.03   (settle)
    // Craft:       adds extra y spin

    const rxHero = -0.30;
    const rxHorizonPeak = -1.05;
    const rxDocked = -0.72;

    const ryHero = 0.00;
    const ryHorizonPeak = -0.50;
    const ryDocked = -0.38;

    const rzHero = 0.00;
    const rzHorizonPeak = -0.08;
    const rzDocked = -0.03;

    // Phase 0→1: hero → horizon peak
    const rx01 = THREE.MathUtils.lerp(rxHero, rxHorizonPeak, p1);
    const ry01 = THREE.MathUtils.lerp(ryHero, ryHorizonPeak, p1);
    const rz01 = THREE.MathUtils.lerp(rzHero, rzHorizonPeak, p1);

    // Phase 2: horizon peak → docked (settle/relax)
    const rx12 = THREE.MathUtils.lerp(rxHorizonPeak, rxDocked, p2);
    const ry12 = THREE.MathUtils.lerp(ryHorizonPeak, ryDocked, p2);
    const rz12 = THREE.MathUtils.lerp(rzHorizonPeak, rzDocked, p2);

    // Blend: before phase 2 starts use p0→p1 result, after use p1→p2 result
    groupRef.current.rotation.x = THREE.MathUtils.lerp(rx01, rx12, p2);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(ry01, ry12, p2) + Math.sin(t * 0.3) * 0.005 * p2;
    groupRef.current.rotation.z = THREE.MathUtils.lerp(rz01, rz12, p2);

    // Phase 3: add a gentle Y-rotation in craftsmanship section
    groupRef.current.rotation.y += p3 * 0.40;

    // Position
    // Hero:     x=0,    y=-0.05, z=0
    // Horizon:  x=-0.25, y=-0.30, z=0.25  (begins moving left + forward)
    // Docked:   x=-0.72, y=-0.05, z=0.15

    const xHero = 0;      const xHorizon = -0.25;  const xDocked = -0.72;
    const yHero = -0.05;  const yHorizon = -0.30;  const yDocked = -0.05;
    const zHero = 0;      const zHorizon = 0.25;   const zDocked = 0.15;

    const px01 = THREE.MathUtils.lerp(xHero, xHorizon, p1);
    const py01 = THREE.MathUtils.lerp(yHero, yHorizon, p1) + heroFloat;
    const pz01 = THREE.MathUtils.lerp(zHero, zHorizon, p1);

    const px12 = THREE.MathUtils.lerp(xHorizon, xDocked, p2);
    const py12 = THREE.MathUtils.lerp(yHorizon, yDocked, p2) + Math.sin(t * 0.45) * 0.008 * p2;
    const pz12 = THREE.MathUtils.lerp(zHorizon, zDocked, p2);

    groupRef.current.position.x = THREE.MathUtils.lerp(px01, px12, p2);
    groupRef.current.position.y = THREE.MathUtils.lerp(py01, py12, p2);
    groupRef.current.position.z = THREE.MathUtils.lerp(pz01, pz12, p2);

    // Scale
    // Hero: 2.75  →  Horizon: 2.20  →  Docked: 1.80
    const sHero    = 2.75;
    const sHorizon = 2.20;
    const sDocked  = 1.80;

    const s01 = THREE.MathUtils.lerp(sHero, sHorizon, p1);
    const s12 = THREE.MathUtils.lerp(sHorizon, sDocked, p2);
    const s   = THREE.MathUtils.lerp(s01, s12, p2);
    groupRef.current.scale.set(s, s, s);
  });

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

//  Page 
export default function ConceptScrollPage() {
  const [scrollY, setScrollY] = useState(0);
  const [winH,   setWinH]    = useState(1);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'auto';
    body.style.overflow = 'auto';

    const onResize = () => setWinH(window.innerHeight || 1);
    onResize();
    window.addEventListener('resize', onResize);
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Raw un-clamped scroll progress in viewport-height units
  const scrollRaw = scrollY / (winH || 1);

  // Per-section clamped progress for HTML fade-ins
  const heroP       = smoothstep(0, 0.65,  scrollRaw);
  const timepieceP  = smoothstep(0.75, 1.45, scrollRaw);
  const craftP      = smoothstep(1.55, 2.20, scrollRaw);
  const comingSoonP = smoothstep(2.30, 2.90, scrollRaw);

  return (
    <div className="relative w-full" style={{ fontFamily: 'Georgia, serif' }}>

      {/* Fixed 3-D Canvas — transparent, z-40, always in front */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 2.5], fov: 40 }} style={{ position: 'absolute', inset: 0 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[4, 8, 5]}    intensity={1.6} color="#FFFFFF" />
          <directionalLight position={[-4, -2, -3]}  intensity={0.4} color="#C8D8FF" />
          <pointLight       position={[0, 1, 2.5]}   intensity={0.8} color="#FFF8F0" />
          <Environment preset="city" />
          <Suspense fallback={null}>
            <WatchModel scrollRaw={scrollRaw} />
          </Suspense>
        </Canvas>
      </div>

      {/* Fixed navigation */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-7 mix-blend-difference text-white"
        style={{ maxWidth: '1400px', margin: '0 auto' }}
      >
        <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.28em' }}>ATHENA</span>
        <nav style={{ display: 'flex', gap: '2.5rem', fontSize: '0.66rem', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          <a href="#timepiece"     style={{ textDecoration: 'none', color: 'inherit' }}>Timepieces</a>
          <a href="#craftsmanship" style={{ textDecoration: 'none', color: 'inherit' }}>Craftsmanship</a>
        </nav>
        <button style={{
          fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          border: '1px solid rgba(255,255,255,0.4)', borderRadius: '9999px',
          padding: '0.5rem 1.35rem', background: 'transparent', cursor: 'pointer', color: 'white'
        }}>Contact</button>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative z-10 flex flex-col items-center justify-between select-none"
        style={{
          height: '100vh',
          background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.97) 0%, rgba(228,231,234,0.82) 55%, rgba(212,215,219,1) 100%)',
        }}
      >
        {/* Ghost ATHENA watermark */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: Math.max(0, 1 - heroP * 1.8) }}
        >
          <span style={{
            fontSize: 'clamp(5rem, 16vw, 18rem)', fontWeight: 300, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'rgba(155,158,163,0.26)', userSelect: 'none', lineHeight: 1,
          }}>ATHENA</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Discover CTA */}
        <div
          className="relative z-20"
          style={{
            marginBottom: '2.75rem',
            opacity: Math.max(0, 1 - heroP * 2.8),
            transform: `translateY(${heroP * 52}px)`,
          }}
        >
          <a href="#timepiece" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
            background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.88)', borderRadius: '9999px', padding: '0.85rem 2.1rem',
            fontSize: '0.63rem', letterSpacing: '0.24em', textTransform: 'uppercase',
            textDecoration: 'none', color: '#27272a', boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            fontFamily: 'system-ui, sans-serif',
          }}>
            Discover The Collection
            <svg style={{ width: '0.8rem', height: '0.8rem', animation: 'ctaBounce 1.8s ease-in-out infinite' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — THE TIMEPIECE
          Watch docks left, editorial copy on right. No glass card.
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="timepiece"
        className="relative z-10 flex items-center select-none"
        style={{
          minHeight: '100vh',
          background: '#050505',
          // Subtle radial studio light on the left where the watch sits
          backgroundImage: 'radial-gradient(ellipse 55% 60% at 28% 50%, rgba(35,35,40,0.95) 0%, #050505 70%)',
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-8 lg:px-16 py-24 flex flex-col lg:flex-row items-center lg:items-start justify-end">

          {/* Left zone — empty, reserved for the docked 3D watch */}
          <div className="hidden lg:block lg:w-[45%] pointer-events-none" />

          {/* Right zone — editorial copy */}
          <div
            className="w-full lg:w-[55%] text-white"
            style={{
              opacity: timepieceP,
              transform: `translateY(${Math.max(0, (1 - timepieceP) * 40)}px)`,
              transition: 'none',
            }}
          >
            {/* Eyebrow */}
            <p style={{
              fontSize: '0.6rem', letterSpacing: '0.32em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)', marginBottom: '2rem',
              fontFamily: 'system-ui, sans-serif',
            }}>
              ATHENA / A01
            </p>

            {/* Main heading */}
            <h2 style={{
              fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', fontWeight: 300, lineHeight: 1.15,
              letterSpacing: '-0.01em', color: '#ffffff', marginBottom: '1.5rem',
            }}>
              A New Standard<br />
              In <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>Automatic Engineering</em>
            </h2>

            {/* Description */}
            <p style={{
              fontSize: '0.83rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.8,
              maxWidth: '42ch', marginBottom: '3rem',
              fontFamily: 'system-ui, sans-serif',
            }}>
              Forged Grade 5 titanium. Double-domed sapphire.<br />
              A mechanical architecture engineered around restraint,
              precision and permanence.
            </p>

            {/* Thin rule */}
            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '2.5rem' }} />

            {/* Technical specifications */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem 3rem', marginBottom: '3.5rem' }}>
              {[
                { label: 'CASE',     value: '42 MM' },
                { label: 'MATERIAL', value: 'GRADE 5 TITANIUM' },
                { label: 'MOVEMENT', value: 'AUTOMATIC' },
                { label: 'CRYSTAL',  value: 'DOUBLE-DOMED SAPPHIRE' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{
                    fontSize: '0.56rem', letterSpacing: '0.28em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.28)', marginBottom: '0.35rem',
                    fontFamily: 'system-ui, sans-serif',
                  }}>{label}</p>
                  <p style={{
                    fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.72)',
                    fontFamily: 'system-ui, sans-serif',
                  }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Thin rule */}
            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '2rem' }} />

            {/* Secondary CTA */}
            <a href="#craftsmanship" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
              fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.38)', textDecoration: 'none',
              fontFamily: 'system-ui, sans-serif',
              transition: 'color 0.25s',
            }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.82)')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.38)')}
            >
              EXPLORE THE ARCHITECTURE
              <span style={{ fontSize: '0.75rem' }}>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — CRAFTSMANSHIP
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="craftsmanship"
        className="relative z-10 select-none"
        style={{ minHeight: '100vh', background: '#070708' }}
      >
        <div
          className="w-full max-w-7xl mx-auto px-8 lg:px-16 py-32 flex flex-col lg:flex-row gap-16 lg:gap-24"
          style={{
            opacity: craftP,
            transform: `translateY(${Math.max(0, (1 - craftP) * 40)}px)`,
          }}
        >
          {/* Left editorial text */}
          <div className="lg:w-1/2">
            <p style={{
              fontSize: '0.58rem', letterSpacing: '0.32em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)', marginBottom: '1.5rem',
              fontFamily: 'system-ui, sans-serif',
            }}>CRAFTSMANSHIP</p>

            <h2 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 300, lineHeight: 1.1,
              color: 'rgba(255,255,255,0.88)', marginBottom: '2rem', letterSpacing: '-0.01em',
            }}>
              Crafted<br />With Intent
            </h2>

            <div style={{ width: '48px', height: '1px', background: 'rgba(255,255,255,0.2)', marginBottom: '2rem' }} />

            <p style={{
              fontSize: '0.83rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.85,
              maxWidth: '40ch', fontFamily: 'system-ui, sans-serif',
            }}>
              Every surface, proportion and interface is considered
              before the first movement begins. The Athena A01 is not
              assembled — it is composed.
            </p>
          </div>

          {/* Right: engineering details grid */}
          <div className="lg:w-1/2 flex flex-col gap-8 justify-center pt-8 lg:pt-24">
            {[
              {
                num: '01',
                title: 'FORGED TITANIUM CASE',
                body: 'Grade 5 titanium, machined and finished to within 0.01 mm. Lighter than steel, stronger than aluminium.',
              },
              {
                num: '02',
                title: 'DOUBLE-DOMED SAPPHIRE',
                body: 'Anti-reflective coating on both surfaces. 9H hardness. Distortion-free at every angle.',
              },
              {
                num: '03',
                title: 'CALIBRE A01 MOVEMENT',
                body: 'In-house automatic movement. 72-hour power reserve. Visible balance wheel through the caseback.',
              },
            ].map(({ num, title, body }) => (
              <div key={num} style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: '0.58rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)',
                    fontFamily: 'system-ui, sans-serif', paddingTop: '0.15rem', flexShrink: 0,
                  }}>{num}</span>
                  <div>
                    <p style={{
                      fontSize: '0.62rem', letterSpacing: '0.26em', textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.55)', marginBottom: '0.5rem',
                      fontFamily: 'system-ui, sans-serif',
                    }}>{title}</p>
                    <p style={{
                      fontSize: '0.8rem', color: 'rgba(255,255,255,0.32)', lineHeight: 1.7,
                      fontFamily: 'system-ui, sans-serif',
                    }}>{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — COMING SOON
      ══════════════════════════════════════════════════════════════════ */}
      <section
        id="coming-soon"
        className="relative z-10 flex items-center justify-center select-none"
        style={{ minHeight: '100vh', background: '#030303', padding: '4rem 1.5rem' }}
      >
        <div
          className="text-center max-w-lg mx-auto"
          style={{
            opacity: comingSoonP,
            transform: `translateY(${Math.max(0, (1 - comingSoonP) * 32)}px)`,
          }}
        >
          {/* Badge */}
          <p style={{
            fontSize: '0.58rem', letterSpacing: '0.32em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)', marginBottom: '2.5rem',
            fontFamily: 'system-ui, sans-serif',
          }}>ATHENA HOROLOGY</p>

          {/* Heading */}
          <h2 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 300, lineHeight: 1.2,
            color: 'rgba(255,255,255,0.90)', marginBottom: '0.75rem', letterSpacing: '-0.01em',
          }}>
            Coming Soon
          </h2>
          <p style={{
            fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.22)', marginBottom: '3rem',
            fontFamily: 'system-ui, sans-serif',
          }}>
            Autumn 2026 Premiere
          </p>

          {/* Thin rule */}
          <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 auto 3rem' }} />

          {/* Email form */}
          <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: '360px', margin: '0 auto' }}>
            <input
              type="email"
              placeholder="Enter email for private access"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '9999px',
                padding: '0.75rem 1.35rem',
                fontSize: '0.72rem', fontFamily: 'system-ui, sans-serif',
                color: '#fff', outline: 'none', letterSpacing: '0.05em',
              }}
            />
            <button type="submit" style={{
              background: 'rgba(255,255,255,0.90)', color: '#050505',
              borderRadius: '9999px', padding: '0.75rem 1.5rem',
              fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase',
              border: 'none', cursor: 'pointer', fontFamily: 'system-ui, sans-serif', fontWeight: 700,
            }}>
              Notify Me
            </button>
          </form>
        </div>
      </section>

      <style>{`
        @keyframes ctaBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(5px); }
        }
      `}</style>
    </div>
  );
}

useGLTF.preload('/models/AthenaWatch.glb');