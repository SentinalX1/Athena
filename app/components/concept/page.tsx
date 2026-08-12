'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

const _qDelta = new THREE.Quaternion();
const _axis = new THREE.Vector3(0, 0, 1);

type Props = ThreeElements['group'];

// ─── 3-D Watch (hands + scroll-driven tilt) ──────────────────────────────────
function WatchModel(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { scene } = useGLTF('/models/AthenaWatch.glb');
  const groupRef = useRef<THREE.Group>(null);

  const hourHand = scene.getObjectByName('HandHour') as THREE.Object3D | undefined;
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
      hour: hourHand.quaternion.clone(),
      minute: minuteHand.quaternion.clone(),
      second: secondHand.quaternion.clone(),
    };
  }

  const smooth = useRef(0);
  const floatTime = useRef(0);

  useFrame((_, delta) => {
    if (!mounted || !initQ.current) return;

    // 1. Clock hands
    const now = new Date();
    const sec = now.getSeconds() + now.getMilliseconds() / 1000;
    const min = now.getMinutes() + sec / 60;
    const hr = (now.getHours() % 12) + now.getMinutes() / 60;

    const BAKED_HOUR = 10 + 10 / 60;
    const BAKED_MINUTE = 10 + 40 / 60;
    const BAKED_SECOND = 40;

    const hrAngle = -(((hr - BAKED_HOUR) / 12) * Math.PI * 2);
    const minAngle = -(((min - BAKED_MINUTE) / 60) * Math.PI * 2);
    const secAngle = -(((sec - BAKED_SECOND) / 60) * Math.PI * 2);

    if (hourHand) { _qDelta.setFromAxisAngle(_axis, hrAngle); hourHand.quaternion.multiplyQuaternions(initQ.current.hour, _qDelta); }
    if (minuteHand) { _qDelta.setFromAxisAngle(_axis, minAngle); minuteHand.quaternion.multiplyQuaternions(initQ.current.minute, _qDelta); }
    if (secondHand) { _qDelta.setFromAxisAngle(_axis, secAngle); secondHand.quaternion.multiplyQuaternions(initQ.current.second, _qDelta); }

    // 2. Scroll-driven Rolex-style tilt
    if (!groupRef.current) return;

    const scrollY = window.scrollY;
    const winH = window.innerHeight || 1;
    const target = Math.min(1, Math.max(0, scrollY / winH));

    smooth.current = THREE.MathUtils.lerp(smooth.current, target, 1 - Math.pow(0.001, delta));
    const p = smooth.current;

    floatTime.current += delta;
    const idleFloat = Math.sin(floatTime.current * 0.8) * 0.018 * (1 - p);

    groupRef.current.rotation.x = THREE.MathUtils.lerp(0, 0.96, p);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(0, 0.16, p);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(0, -0.07, p);

    groupRef.current.position.x = 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(-0.05, 0.20, p) + idleFloat;
    groupRef.current.position.z = THREE.MathUtils.lerp(0, 0.65, p);

    const s = THREE.MathUtils.lerp(3.45, 4.10, p);
    groupRef.current.scale.set(s, s, s);
  });

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConceptScrollPage() {
  const [scrollY, setScrollY] = useState(0);
  const [winH, setWinH] = useState(1);

  // FORCE SCROLLING: This overrides your Next.js global layout blocking the scroll
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = 'auto';
    body.style.overflow = 'auto';
    
    const handleResize = () => setWinH(window.innerHeight || 1);
    handleResize();
    window.addEventListener('resize', handleResize);

    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const p = Math.min(1, Math.max(0, scrollY / winH));

  return (
    <div className="relative w-full text-zinc-800" style={{ fontFamily: 'Georgia, serif' }}>

      {/* ── Fixed 3-D Canvas (z-40) — IN FRONT of text, completely transparent background ── */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 2.5], fov: 40 }} style={{ position: 'absolute', inset: 0 }}>
          <ambientLight intensity={0.85} />
          <directionalLight position={[4, 8, 5]} intensity={1.7} color="#FFFFFF" />
          <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#CBE0FF" />
          <pointLight position={[0, 1, 2.5]} intensity={0.8} color="#FFF6E0" />
          <Environment preset="city" />
          <Suspense fallback={null}>
            <WatchModel />
          </Suspense>
        </Canvas>
      </div>

      {/* ── Fixed nav ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-7 mix-blend-difference text-white"
        style={{ maxWidth: '1280px', margin: '0 auto' }}
      >
        <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.25em' }}>ATHENA</span>
        <nav style={{ display: 'flex', gap: '2.5rem', fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          <a href="#hero" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:opacity-70 transition">Timepieces</a>
          <a href="#coming-soon" style={{ textDecoration: 'none', color: 'inherit' }} className="hover:opacity-70 transition">Craftsmanship</a>
        </nav>
        <button style={{
          fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          border: '1px solid rgba(255,255,255,0.4)', borderRadius: '9999px', padding: '0.55rem 1.4rem',
          background: 'transparent', cursor: 'pointer', color: 'white'
        }}>
          Contact
        </button>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1 — Hero (White Theme Background)
      ════════════════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative z-10 flex flex-col items-center justify-between select-none"
        style={{ height: '100vh', background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.96) 0%, rgba(230,232,235,0.80) 60%, rgba(215,218,222,1) 100%)' }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: Math.max(0, 1 - p * 2) }}
        >
          <span style={{
            fontSize: 'clamp(5rem, 16vw, 18rem)', fontWeight: 300, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'rgba(160,163,168,0.28)', userSelect: 'none', lineHeight: 1,
          }}>
            ATHENA
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div
          className="relative z-20"
          style={{
            marginBottom: '2.5rem', opacity: Math.max(0, 1 - p * 2.5),
            transform: `translateY(${p * 48}px)`, transition: 'opacity 0.1s, transform 0.1s',
          }}
        >
          <a
            href="#coming-soon"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              background: 'rgba(255,255,255,0.68)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.85)', borderRadius: '9999px', padding: '0.85rem 2rem',
              fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase',
              textDecoration: 'none', color: '#27272a', boxShadow: '0 8px 30px rgba(0,0,0,0.07)',
            }}
          >
            Discover The Collection
            <svg style={{ width: '0.85rem', height: '0.85rem', animation: 'bounce 1.8s infinite' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 — Coming Soon (Strictly Black Background)
      ════════════════════════════════════════════════════════════════════ */}
      <section
        id="coming-soon"
        className="relative z-10 flex items-center justify-center select-none bg-black text-white"
        style={{ height: '100vh', padding: '0 1.5rem' }}
      >
        <div
          style={{
            maxWidth: '560px', width: '100%',
            background: 'rgba(20,20,20,0.52)', backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.75rem',
            padding: 'clamp(2rem, 5vw, 3.5rem)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            opacity: Math.min(1, Math.max(0, (p - 0.3) * 1.6)),
            transform: `translateY(${Math.max(0, (1 - p) * 36)}px)`,
            textAlign: 'center',
          }}
        >
          <div style={{
            display: 'inline-block', background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)',
            borderRadius: '9999px', padding: '0.3rem 1rem', fontSize: '0.6rem', letterSpacing: '0.3em',
            textTransform: 'uppercase', color: '#fcd34d', fontWeight: 600, marginBottom: '1.4rem',
          }}>
            Athena Horology
          </div>

          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 300, lineHeight: 1.25, marginBottom: '1rem', color: '#fff' }}>
            A New Standard<br />
            <em style={{ fontStyle: 'italic', color: '#a1a1aa' }}>In Automatic Engineering</em>
          </h2>

          <p style={{ fontSize: '0.8rem', color: '#a1a1aa', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7, maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Forged Grade 5 Titanium with double-domed anti-reflective sapphire crystal.
            Precision assembly strictly limited to 500 numbered pieces worldwide.
          </p>

          <div style={{ marginBottom: '1.75rem' }}>
            <p style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
              Coming Soon
            </p>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#71717a', fontFamily: 'system-ui, sans-serif' }}>
              Autumn 2026 Premiere
            </p>
          </div>

          <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: '380px', margin: '0 auto' }}>
            <input
              type="email"
              placeholder="Enter email for early access"
              style={{
                width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '9999px',
                padding: '0.7rem 1.25rem', fontSize: '0.72rem', fontFamily: 'system-ui, sans-serif',
                color: '#fff', outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                background: '#fff', color: '#000', borderRadius: '9999px',
                padding: '0.7rem 1.5rem', fontSize: '0.62rem', letterSpacing: '0.2em',
                textTransform: 'uppercase', border: 'none', cursor: 'pointer', fontFamily: 'system-ui, sans-serif', fontWeight: 'bold'
              }}
            >
              Notify Me
            </button>
          </form>
        </div>
      </section>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
}

useGLTF.preload('/models/AthenaWatch.glb');