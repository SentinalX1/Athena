'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const _qDelta = new THREE.Quaternion();
const _axis = new THREE.Vector3(0, 0, 1);

// Easing helper
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

interface HandQuaternions {
  hour: THREE.Quaternion;
  minute: THREE.Quaternion;
  second: THREE.Quaternion;
}

interface WatchHands {
  hourHand?: THREE.Object3D;
  minuteHand?: THREE.Object3D;
  secondHand?: THREE.Object3D;
}

const BAKED_HOUR = 10 + 10 / 60;
const BAKED_MINUTE = 10 + 40 / 60;
const BAKED_SECOND = 40;

const START_HOUR = 10 + 10 / 60; // 10:10 pose (Hour hand at 10)
const START_MINUTE = 10;         // 10 minutes mark (Minute hand at 2 o'clock)
const START_SECOND = 30;         // 30 seconds mark (Second hand at 6 o'clock)

const HOLD_DURATION = 0.55; // Hold the 10:10:30 catalog pose for 0.55s
const SWEEP_DURATION = 1.35; // Smoothly rotate to user's local time over 1.35s

function applyHandRotations(
  hr: number,
  min: number,
  sec: number,
  hands: WatchHands,
  initQuats: HandQuaternions
) {
  if (hands.hourHand) {
    _qDelta.setFromAxisAngle(_axis, -(((hr - BAKED_HOUR) / 12) * Math.PI * 2));
    hands.hourHand.quaternion.multiplyQuaternions(initQuats.hour, _qDelta);
  }
  if (hands.minuteHand) {
    _qDelta.setFromAxisAngle(_axis, -(((min - BAKED_MINUTE) / 60) * Math.PI * 2));
    hands.minuteHand.quaternion.multiplyQuaternions(initQuats.minute, _qDelta);
  }
  if (hands.secondHand) {
    _qDelta.setFromAxisAngle(_axis, -(((sec - BAKED_SECOND) / 60) * Math.PI * 2));
    hands.secondHand.quaternion.multiplyQuaternions(initQuats.second, _qDelta);
  }
}

function updateWatchHandsAnimation(
  elapsedTime: number,
  hands: WatchHands,
  initQuats: HandQuaternions
) {
  const now = new Date();
  const targetSec = now.getSeconds() + now.getMilliseconds() / 1000;
  const targetMin = now.getMinutes() + targetSec / 60;
  const targetHr = (now.getHours() % 12) + targetMin / 60;

  if (elapsedTime <= HOLD_DURATION) {
    // Initial catalog pose: 10:10:30
    applyHandRotations(START_HOUR, START_MINUTE, START_SECOND, hands, initQuats);
    return;
  }

  const sweepElapsed = elapsedTime - HOLD_DURATION;
  const progress = Math.min(1, sweepElapsed / SWEEP_DURATION);
  // Smooth mechanical easing
  const eased = 1 - Math.pow(1 - progress, 3);

  // Clockwise rotation to target time
  let diffHr = (targetHr - START_HOUR) % 12;
  if (diffHr < 0) diffHr += 12;

  let diffMin = (targetMin - START_MINUTE) % 60;
  if (diffMin < 0) diffMin += 60;

  const currentHr = START_HOUR + diffHr * eased;
  const currentMin = START_MINUTE + diffMin * eased;

  // Second hand starts at 30s and sweeps forward
  const currentSec = START_SECOND + sweepElapsed;

  applyHandRotations(currentHr, currentMin, currentSec, hands, initQuats);
}

type WatchProps = ThreeElements['group'] & { scrollRaw: number };

// 3D Watch Component
function WatchModel({ scrollRaw, ...props }: WatchProps) {
  const [mounted, setMounted] = useState(false);

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

  const initQ = useRef<HandQuaternions | null>(null);
  if (!initQ.current && hourHand && minuteHand && secondHand) {
    initQ.current = {
      hour: hourHand.quaternion.clone(),
      minute: minuteHand.quaternion.clone(),
      second: secondHand.quaternion.clone(),
    };
    // Initialize immediately in the 10:10:30 catalog pose
    applyHandRotations(START_HOUR, START_MINUTE, START_SECOND, { hourHand, minuteHand, secondHand }, initQ.current);
  }

  useEffect(() => {
    setMounted(true);
    if (initQ.current && hourHand && minuteHand && secondHand) {
      applyHandRotations(START_HOUR, START_MINUTE, START_SECOND, { hourHand, minuteHand, secondHand }, initQ.current);
    }
  }, [hourHand, minuteHand, secondHand]);

  const smoothRaw = useRef(0);
  const floatTime = useRef(0);
  const animTime = useRef(0);

  useFrame((_, delta) => {
    if (!mounted || !initQ.current || !groupRef.current) return;

    animTime.current += delta;
    updateWatchHandsAnimation(animTime.current, { hourHand, minuteHand, secondHand }, initQ.current);

    // Smooth scroll interpolation
    smoothRaw.current = THREE.MathUtils.lerp(smoothRaw.current, scrollRaw, 1 - Math.pow(0.0005, delta));
    const sp = smoothRaw.current;

    floatTime.current += delta;
    const t = floatTime.current;

    // Timeline Progress Keys:
    // 0.0 -> 0.8 : Hero
    // 0.8 -> 1.8 : Section 2 (Timepiece - Watch Left, Text Right)
    // 1.8 -> 2.8 : Section 3 (Craftsmanship - Watch Right, Text Left)
    // 2.8 -> 3.8 : Section 4 (Coming Soon - Watch shrink/fade)

    const pSec2 = smoothstep(0.3, 1.0, sp);
    const pSec3 = smoothstep(1.2, 2.0, sp);
    const pSec4 = smoothstep(2.2, 3.0, sp);

    const idleFloat = Math.sin(t * 0.8) * 0.015 * (1 - pSec2);

    // X Position Target Mapping
    // Hero: 0.0 | Sec 2: -0.65 (Left) | Sec 3: +0.62 (Right) | Sec 4: 0.0 (Centered/Retracted)
    let posX = 0;
    if (sp < 1.0) {
      posX = THREE.MathUtils.lerp(0.0, -0.65, pSec2);
    } else if (sp >= 1.0 && sp < 2.0) {
      posX = THREE.MathUtils.lerp(-0.65, 0.62, pSec3);
    } else {
      posX = THREE.MathUtils.lerp(0.62, 0.0, pSec4);
    }

    // Y Position
    let posY = -0.05 + idleFloat;
    if (sp >= 2.0) {
      posY = THREE.MathUtils.lerp(-0.05, -0.35, pSec4); // Settles in lower portion of Section 4
    }

    // Rotation Mapping
    // Hero: Front facing | Sec 2: 3/4 Yaw Left | Sec 3: 3/4 Yaw Right
    const rotX = THREE.MathUtils.lerp(-0.30, -0.20, pSec2);
    let rotY = THREE.MathUtils.lerp(0.0, -0.55, pSec2);
    if (sp >= 1.0) {
      rotY = THREE.MathUtils.lerp(-0.55, 0.65, pSec3);
    }

    // Scale Mapping
    let scale = THREE.MathUtils.lerp(2.75, 1.85, pSec2);
    if (sp >= 2.0) {
      scale = THREE.MathUtils.lerp(1.85, 1.20, pSec4);
    }

    groupRef.current.position.x = posX;
    groupRef.current.position.y = posY;
    groupRef.current.position.z = THREE.MathUtils.lerp(0.0, 0.20, pSec2);

    groupRef.current.rotation.x = rotX;
    groupRef.current.rotation.y = rotY + Math.sin(t * 0.4) * 0.01;
    groupRef.current.rotation.z = THREE.MathUtils.lerp(0.0, -0.05, pSec2);

    groupRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

// Main Page Component
export default function ConceptScrollPage() {
  const [scrollY, setScrollY] = useState(0);
  const [winH, setWinH] = useState(1);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'auto';
    body.style.overflow = 'auto';

    const onResize = () => setWinH(window.innerHeight || 1);
    onResize();
    window.addEventListener('resize', onResize);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on('scroll', (e: { scroll: number }) => {
      setScrollY(e.scroll);
    });

    // Initial sync
    setScrollY(window.scrollY);

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const scrollRaw = scrollY / (winH || 1);

  // Synchronized HTML Opacities & Thresholds
  const heroP = smoothstep(0.0, 0.4, scrollRaw);
  const timepieceP = smoothstep(0.6, 1.0, scrollRaw) * (1 - smoothstep(1.4, 1.8, scrollRaw));
  const craftP = smoothstep(1.6, 2.0, scrollRaw) * (1 - smoothstep(2.4, 2.8, scrollRaw));
  const comingSoonP = smoothstep(2.6, 3.0, scrollRaw);

  return (
    <div className="relative w-full" style={{ fontFamily: 'Georgia, serif' }}>

      {/* Fixed 3D Canvas */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 2.5], fov: 40 }} style={{ position: 'absolute', inset: 0 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[4, 8, 5]} intensity={1.6} color="#FFFFFF" />
          <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#C8D8FF" />
          <pointLight position={[0, 1, 2.5]} intensity={0.8} color="#FFF8F0" />
          <Environment preset="city" />
          <Suspense fallback={null}>
            <WatchModel scrollRaw={scrollRaw} />
          </Suspense>
        </Canvas>
      </div>

      {/* Fixed Navbar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-7 mix-blend-difference text-white"
        style={{ maxWidth: '1400px', margin: '0 auto' }}
      >
        <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.28em' }}>ATHENA</span>
        <nav style={{ display: 'flex', gap: '2.5rem', fontSize: '0.66rem', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          <a href="#timepiece" style={{ textDecoration: 'none', color: 'inherit' }}>Timepieces</a>
          <a href="#craftsmanship" style={{ textDecoration: 'none', color: 'inherit' }}>Craftsmanship</a>
        </nav>
        <button style={{
          fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          border: '1px solid rgba(255,255,255,0.4)', borderRadius: '9999px',
          padding: '0.5rem 1.35rem', background: 'transparent', cursor: 'pointer', color: 'white'
        }}>Contact</button>
      </header>

      {/* SECTION 1 — HERO */}
      <section
        id="hero"
        className="relative z-10 flex flex-col items-center justify-between select-none"
        style={{
          height: '100vh',
          background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.97) 0%, rgba(228,231,234,0.82) 55%, rgba(212,215,219,1) 100%)',
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: Math.max(0, 1 - heroP * 2) }}
        >
          <span style={{
            fontSize: 'clamp(5rem, 16vw, 18rem)', fontWeight: 300, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'rgba(155,158,163,0.26)', userSelect: 'none', lineHeight: 1,
          }}>ATHENA</span>
        </div>

        <div style={{ flex: 1 }} />

        <div
          className="relative z-20"
          style={{
            marginBottom: '2.75rem',
            opacity: Math.max(0, 1 - heroP * 2.5),
            transform: `translateY(${heroP * 40}px)`,
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

      {/* SECTION 2 — THE TIMEPIECE (Watch docked LEFT, Copy on RIGHT) */}
      <section
        id="timepiece"
        className="relative z-10 flex items-center select-none"
        style={{
          height: '100vh',
          background: '#050505',
          backgroundImage: 'radial-gradient(ellipse 50% 60% at 20% 50%, rgba(35,35,40,0.95) 0%, #050505 70%)',
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
            <p style={{
              fontSize: '0.6rem', letterSpacing: '0.32em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)', marginBottom: '1.5rem',
              fontFamily: 'system-ui, sans-serif',
            }}>
              ATHENA / A01
            </p>

            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 300, lineHeight: 1.15,
              letterSpacing: '-0.01em', color: '#ffffff', marginBottom: '1.25rem',
            }}>
              A New Standard<br />
              In <em style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>Automatic Engineering</em>
            </h2>

            <p style={{
              fontSize: '0.83rem', color: 'rgba(255,255,255,0.42)', lineHeight: 1.8,
              maxWidth: '42ch', marginBottom: '2.5rem',
              fontFamily: 'system-ui, sans-serif',
            }}>
              Forged Grade 5 titanium. Double-domed sapphire.<br />
              A mechanical architecture engineered around restraint, precision and permanence.
            </p>

            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '2rem' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 2rem', marginBottom: '2.5rem' }}>
              {[
                { label: 'CASE', value: '42 MM' },
                { label: 'MATERIAL', value: 'GRADE 5 TITANIUM' },
                { label: 'MOVEMENT', value: 'AUTOMATIC' },
                { label: 'CRYSTAL', value: 'DOUBLE-DOMED SAPPHIRE' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{
                    fontSize: '0.56rem', letterSpacing: '0.28em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.28)', marginBottom: '0.25rem',
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
          </div>
        </div>
      </section>

      {/* SECTION 3 — CRAFTSMANSHIP (Watch docked RIGHT, Copy on LEFT) */}
      <section
        id="craftsmanship"
        className="relative z-10 flex items-center select-none"
        style={{ height: '100vh', background: '#070708' }}
      >
        <div className="w-full max-w-7xl mx-auto px-8 lg:px-16 flex justify-start" style={{ paddingLeft: 'clamp(2rem, 6vw, 6rem)' }}>
          <div
            className="w-full lg:w-[48%] text-white"
            style={{
              opacity: craftP,
              transform: `translateY(${Math.max(0, (1 - craftP) * 30)}px)`,
            }}
          >
            <p style={{
              fontSize: '0.58rem', letterSpacing: '0.32em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)', marginBottom: '1.25rem',
              fontFamily: 'system-ui, sans-serif',
            }}>CRAFTSMANSHIP</p>

            <h2 style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)', fontWeight: 300, lineHeight: 1.1,
              color: 'rgba(255,255,255,0.88)', marginBottom: '1.5rem', letterSpacing: '-0.01em',
            }}>
              Crafted<br />With Intent
            </h2>

            <p style={{
              fontSize: '0.83rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.85,
              maxWidth: '40ch', marginBottom: '2.5rem', fontFamily: 'system-ui, sans-serif',
            }}>
              Every surface, proportion and interface is considered before the first movement begins. The Athena A01 is composed rather than merely assembled.
            </p>

            <div className="flex flex-col gap-4">
              {[
                { num: '01', title: 'FORGED TITANIUM CASE', body: 'Grade 5 titanium, machined and finished to within 0.01 mm.' },
                { num: '02', title: 'DOUBLE-DOMED SAPPHIRE', body: 'Anti-reflective coating on both surfaces with 9H hardness.' },
                { num: '03', title: 'CALIBRE A01 MOVEMENT', body: 'In-house automatic movement with a 72-hour power reserve.' },
              ].map(({ num, title, body }) => (
                <div key={num} style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', fontFamily: 'system-ui, sans-serif' }}>{num}</span>
                    <div>
                      <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: '0.25rem', fontFamily: 'system-ui, sans-serif' }}>{title}</p>
                      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.32)', lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — COMING SOON (Centered Form, Watch Retracted/Hidden) */}
      <section
        id="coming-soon"
        className="relative z-10 flex items-center justify-center select-none"
        style={{ height: '100vh', background: '#030303', padding: '0 1.5rem', alignItems: 'flex-start', paddingTop: 'clamp(5rem, 10vh, 9rem)' }}
      >
        <div
          className="text-center max-w-lg mx-auto"
          style={{
            opacity: comingSoonP,
            transform: `translateY(${Math.max(0, (1 - comingSoonP) * 30)}px)`,
          }}
        >
          <p style={{
            fontSize: '0.58rem', letterSpacing: '0.32em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)', marginBottom: '1.5rem',
            fontFamily: 'system-ui, sans-serif',
          }}>ATHENA HOROLOGY</p>

          <h2 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 300, lineHeight: 1.2,
            color: 'rgba(255,255,255,0.90)', marginBottom: '0.5rem', letterSpacing: '-0.01em',
          }}>
            Coming Soon
          </h2>
          <p style={{
            fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.22)', marginBottom: '2.5rem',
            fontFamily: 'system-ui, sans-serif',
          }}>
            Autumn 2026 Premiere
          </p>

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