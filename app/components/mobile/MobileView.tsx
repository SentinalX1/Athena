'use client';

import React, { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { START_HOUR, START_MINUTE, START_SECOND } from '@/lib/constants';
import {
  HandQuaternions,
  applyHandRotations,
  updateWatchHandsAnimation,
} from '@/lib/clockEngine';
import { smoothstep } from '@/lib/math';

// ─────────────────────────────────────────────────────────────────────────────
// Mobile 3D Watch Model & Scene Controller with Studio Horology Lighting
// ─────────────────────────────────────────────────────────────────────────────
interface MobileWatchSceneProps {
  scrollProgress: number;
  isInspecting: boolean;
  inspectRot: { x: number; y: number };
  isLoaderComplete: boolean;
  onModelReady?: () => void;
}

function MobileWatchScene({
  scrollProgress,
  isInspecting,
  inspectRot,
  isLoaderComplete,
  onModelReady,
}: MobileWatchSceneProps) {
  const { scene } = useGLTF('/models/AthenaWatch.glb');
  const groupRef = useRef<THREE.Group>(null);

  const hourHand = scene.getObjectByName('HandHour') as THREE.Object3D | undefined;
  const minuteHand = scene.getObjectByName('HandMinute') as THREE.Object3D | undefined;
  const secondHand = scene.getObjectByName('HandSecond') as THREE.Object3D | undefined;

  // Center model geometry once
  const centeredRef = useRef(false);

  if (!centeredRef.current && scene) {
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.sub(box.getCenter(new THREE.Vector3()));
    centeredRef.current = true;
  }

  const initQ = useRef<HandQuaternions | null>(null);

  if (!initQ.current && hourHand && minuteHand && secondHand) {
    initQ.current = {
      hour: hourHand.quaternion.clone(),
      minute: minuteHand.quaternion.clone(),
      second: secondHand.quaternion.clone(),
    };

    applyHandRotations(
      START_HOUR,
      START_MINUTE,
      START_SECOND,
      { hourHand, minuteHand, secondHand },
      initQ.current
    );

    onModelReady?.();
  }

  const animTime = useRef(0);
  const smoothProgress = useRef(0);
  const floatTime = useRef(0);
  const smoothInspectX = useRef(0);
  const smoothInspectY = useRef(0);

  useFrame((_, delta) => {
    if (!initQ.current || !groupRef.current) return;

    // ── Watch hand animation ──
    if (isLoaderComplete) {
      animTime.current += delta;

      updateWatchHandsAnimation(
        animTime.current,
        { hourHand, minuteHand, secondHand },
        initQ.current
      );
    } else {
      applyHandRotations(
        START_HOUR,
        START_MINUTE,
        START_SECOND,
        { hourHand, minuteHand, secondHand },
        initQ.current
      );
    }

    floatTime.current += delta;
    const t = floatTime.current;

    // ── 360° Tactile Inspection Mode ──
    if (isInspecting) {
      smoothInspectX.current = THREE.MathUtils.lerp(
        smoothInspectX.current,
        inspectRot.x,
        0.12
      );

      smoothInspectY.current = THREE.MathUtils.lerp(
        smoothInspectY.current,
        inspectRot.y,
        0.12
      );

      groupRef.current.position.set(0, 0.0, 0);

      groupRef.current.rotation.x =
        -0.15 + smoothInspectX.current;

      groupRef.current.rotation.y =
        smoothInspectY.current;

      groupRef.current.rotation.z = 0;

      groupRef.current.scale.setScalar(2.05);

      return;
    }

    // ── Scroll-driven Choreography ──
    smoothProgress.current = THREE.MathUtils.lerp(
      smoothProgress.current,
      scrollProgress,
      1 - Math.pow(0.001, delta)
    );

    const sp = smoothProgress.current;

    // Transition weights per section
    const p12 = smoothstep(0.3, 1.0, sp);   // Hero → Specs
    const p23 = smoothstep(1.3, 2.0, sp);   // Specs → Craft
    const p34 = smoothstep(2.3, 3.0, sp);   // Craft → VIP

    const idleFloat =
      Math.sin(t * 0.85) * 0.012 * (1 - p12);

    // ── Y Position: watch always inside camera frustum ──
    // Hero:  0.06  (center-upper — watch is big so it fills frame)
    // Specs: 0.26  (upper third — leaves bottom half for text)
    // Craft: 0.22  (upper third — similar)
    // VIP:   0.05  (center, small, silhouette)
    let posY = 0.06 + idleFloat;

    if (p12 > 0) {
      posY = THREE.MathUtils.lerp(0.06, 0.26, p12);
    }

    if (p23 > 0) {
      posY = THREE.MathUtils.lerp(0.26, 0.22, p23);
    }

    if (p34 > 0) {
      posY = THREE.MathUtils.lerp(0.22, 0.05, p34);
    }

    // ── Rotation ──
    const rotX = THREE.MathUtils.lerp(-0.25, -0.12, p12);

    let rotY = THREE.MathUtils.lerp(0.0, -0.30, p12);

    if (p23 > 0) {
      rotY = THREE.MathUtils.lerp(-0.30, 0.42, p23);
    }

    if (p34 > 0) {
      rotY = THREE.MathUtils.lerp(0.42, 0.0, p34);
    }

    // ── Scale ──
    let scale = THREE.MathUtils.lerp(2.1, 1.35, p12);

    if (p34 > 0) {
      scale = THREE.MathUtils.lerp(1.35, 1.0, p34);
    }

    groupRef.current.position.set(
      0,
      posY,
      THREE.MathUtils.lerp(0, 0.1, p12)
    );

    groupRef.current.rotation.set(
      rotX,
      rotY + Math.sin(t * 0.4) * 0.012,
      THREE.MathUtils.lerp(0, -0.02, p12)
    );

    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile View Component — Masterpiece Luxury Horology
// ─────────────────────────────────────────────────────────────────────────────
interface MobileViewProps {
  isLoaderComplete: boolean;
  onWatchLoaded?: () => void;
}

export function MobileView({
  isLoaderComplete,
  onWatchLoaded,
}: MobileViewProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectRot, setInspectRot] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const velocityY = useRef(0);
  const lastDragY = useRef(0);

  const handleScroll = () => {
    if (isInspecting) return;

    const el = containerRef.current;

    if (!el) return;

    const maxScroll =
      el.scrollHeight - el.clientHeight;

    if (maxScroll <= 0) return;

    setScrollProgress(
      (el.scrollTop / maxScroll) * 3.0
    );
  };

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    setIsInspecting(false);

    containerRef.current
      ?.querySelector(id)
      ?.scrollIntoView({
        behavior: 'smooth',
      });
  };

  const startInspect = () => {
    setIsInspecting(true);
    setInspectRot({ x: 0, y: 0 });
    setMenuOpen(false);
  };

  const endInspect = () => {
    setIsInspecting(false);
  };

  // ── Pointer handling for 360° inspection ──
  const handlePointerDown = (
    e: React.PointerEvent
  ) => {
    if (!isInspecting) return;

    isDragging.current = true;

    lastPointer.current = {
      x: e.clientX,
      y: e.clientY,
    };

    lastDragY.current = e.clientY;
    velocityY.current = 0;

    (
      e.target as HTMLElement
    ).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (
    e: React.PointerEvent
  ) => {
    if (
      !isDragging.current ||
      !isInspecting
    ) {
      return;
    }

    const dx =
      e.clientX - lastPointer.current.x;

    const dy =
      e.clientY - lastPointer.current.y;

    velocityY.current = dy;

    lastPointer.current = {
      x: e.clientX,
      y: e.clientY,
    };

    setInspectRot((prev) => ({
      y: prev.y + dx * 0.009,
      x: Math.max(
        -0.6,
        Math.min(
          0.6,
          prev.x + dy * 0.009
        )
      ),
    }));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleSubscribe = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!emailValue.includes('@')) {
      return;
    }

    setEmailSubmitted(true);
  };

  // ── Section reveal opacity ──
  const sp = scrollProgress;

  const heroTextOpacity =
    Math.max(0, 1 - sp * 3.5);

  const specsOpacity =
    smoothstep(0.7, 1.1, sp) *
    (1 - smoothstep(1.6, 2.0, sp));

  const craftOpacity =
    smoothstep(1.7, 2.1, sp) *
    (1 - smoothstep(2.5, 2.9, sp));

  const vipOpacity =
    smoothstep(2.6, 3.0, sp);

  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden select-none"
      style={{
        background: '#050507',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FIXED 3D CANVAS

          IMPORTANT:
          - zIndex 15 keeps the watch visually ABOVE sections
          - pointerEvents none allows touch/scroll gestures
            to pass through to the scroll container
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        style={{
          position: 'fixed',
          inset: 0,

          // Watch visually above scroll sections
          zIndex: isInspecting ? 45 : 15,

          // CRITICAL:
          // The canvas never captures scrolling/touch input
          pointerEvents: 'none',
        }}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{
            position: [0, 0, 2.5],
            fov: 46,
          }}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          {/* Studio Horology 5-Point Lighting Rig */}
          <ambientLight intensity={1.2} />

          <directionalLight
            position={[4, 6, 5]}
            intensity={2.4}
            color="#FFFFFF"
          />

          <directionalLight
            position={[-4, -1, 3]}
            intensity={1.4}
            color="#C8DCFF"
          />

          <directionalLight
            position={[0, 7, -2]}
            intensity={1.6}
            color="#FFF4E8"
          />

          <pointLight
            position={[0, 0.5, 3]}
            intensity={1.8}
            color="#FFFFFF"
          />

          <Environment preset="city" />

          <Suspense fallback={null}>
            <MobileWatchScene
              scrollProgress={scrollProgress}
              isInspecting={isInspecting}
              inspectRot={inspectRot}
              isLoaderComplete={isLoaderComplete}
              onModelReady={onWatchLoaded}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FIXED HEADER — always visible
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'rgba(5,5,7,0.45)',
          borderBottom:
            '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <button
          onClick={() =>
            scrollToSection('#hero')
          }
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.32em',
            color: '#fff',
            cursor: 'pointer',
            fontFamily: 'Georgia, serif',
          }}
        >
          ATHENA
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <button
            onClick={startInspect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background:
                'rgba(255,255,255,0.07)',
              border:
                '1px solid rgba(255,255,255,0.18)',
              borderRadius: '9999px',
              padding:
                '0.35rem 0.75rem',
              fontSize: '0.6rem',
              fontFamily: 'monospace',
              letterSpacing: '0.18em',
              color:
                'rgba(255,255,255,0.88)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#60a5fa',
                animation:
                  'pulse 2s infinite',
              }}
            />

            360° VIEW
          </button>

          <button
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            style={{
              background:
                'rgba(255,255,255,0.06)',
              border:
                '1px solid rgba(255,255,255,0.13)',
              borderRadius: '50%',
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color:
                'rgba(255,255,255,0.88)',
            }}
            aria-label="Menu"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 7h16M4 12h16M4 17h16"
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          NAVIGATION DRAWER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 62,
            left: 0,
            right: 0,
            zIndex: 58,
            background:
              'rgba(7,7,11,0.98)',
            borderBottom:
              '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(32px)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            boxShadow:
              '0 24px 60px rgba(0,0,0,0.6)',
          }}
        >
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: '0.5rem',
              letterSpacing: '0.35em',
              color:
                'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}
          >
            ATHENA HOROLOGY
          </p>

          {[
            {
              id: '#hero',
              label: 'Overview & Model',
              idx: '01',
            },
            {
              id: '#timepiece',
              label:
                'Specifications & Dimensions',
              idx: '02',
            },
            {
              id: '#craftsmanship',
              label:
                'Haute Horlogerie Craft',
              idx: '03',
            },
            {
              id: '#coming-soon',
              label:
                'VIP Premiere Allocation',
              idx: '04',
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() =>
                scrollToSection(item.id)
              }
              style={{
                background: 'none',
                border: 'none',
                borderBottom:
                  '1px solid rgba(255,255,255,0.07)',
                padding: '0.75rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
                cursor: 'pointer',
                color:
                  'rgba(255,255,255,0.8)',
                fontSize: '0.7rem',
                fontFamily:
                  'system-ui, sans-serif',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.55rem',
                    color:
                      'rgba(255,255,255,0.3)',
                  }}
                >
                  {item.idx}
                </span>

                {item.label}
              </span>

              <span
                style={{
                  color:
                    'rgba(255,255,255,0.35)',
                }}
              >
                →
              </span>
            </button>
          ))}

          <button
            onClick={startInspect}
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '0.85rem',
              borderRadius: 9999,
              background: '#fff',
              color: '#000',
              border: 'none',
              fontSize: '0.62rem',
              fontFamily:
                'system-ui, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow:
                '0 8px 24px rgba(255,255,255,0.2)',
            }}
          >
            Launch 360° Tactile Inspection
          </button>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          360° INSPECTION OVERLAY
          No backdrop blur or dark background.
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {isInspecting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding:
              '4.5rem 1.5rem 2.5rem',
            touchAction: 'none',
          }}
        >
          {/* Top Instruction Pill */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background:
                  'rgba(0,0,0,0.55)',
                border:
                  '1px solid rgba(255,255,255,0.22)',
                borderRadius: 9999,
                padding:
                  '0.45rem 1.1rem',
                backdropFilter: 'blur(8px)',
                fontSize: '0.6rem',
                fontFamily: 'monospace',
                letterSpacing: '0.2em',
                color: '#fff',
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#93c5fd"
                strokeWidth="2"
                style={{
                  animation:
                    'spin 6s linear infinite',
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>

              DRAG TO ROTATE 360°
            </div>

            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.55rem',
                color:
                  'rgba(255,255,255,0.45)',
                letterSpacing: '0.15em',
              }}
            >
              Calibre A01 · Multi-Axis Viewport
            </p>
          </div>

          {/* Bottom Exit */}
          <button
            onClick={endInspect}
            style={{
              width: '100%',
              padding: '0.9rem',
              borderRadius: 9999,
              background: '#fff',
              color: '#000',
              border: 'none',
              fontSize: '0.62rem',
              fontFamily:
                'system-ui, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow:
                '0 10px 35px rgba(255,255,255,0.28)',
            }}
          >
            ✕ Exit Inspection
          </button>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SCROLLABLE SECTIONS

          z-index 10 sits BELOW the watch at z-index 15.

          IMPORTANT:
          touchAction: pan-y explicitly tells the browser
          that normal vertical touch gestures should scroll
          this container.
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          position: 'relative',

          // Below watch visually
          zIndex: isInspecting ? 0 : 10,

          width: '100%',
          height: '100%',

          overflowY: isInspecting
            ? 'hidden'
            : 'auto',

          overflowX: 'hidden',

          scrollbarWidth: 'none',

          // Scroll layer receives normal interaction
          pointerEvents: isInspecting
            ? 'none'
            : 'auto',

          // CRITICAL MOBILE SCROLL FIX
          touchAction: isInspecting
            ? 'none'
            : 'pan-y',

          overscrollBehaviorY: 'contain',
        }}
      >
        {/* ══ SECTION 1: HERO ══════════════════════════════════════════ */}
        <section
          id="hero"
          style={{
            minHeight: '100dvh',
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',

            // Signature high-key silver gradient
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
              opacity:
                Math.max(
                  0,
                  1 - heroTextOpacity < 0.8
                    ? 0
                    : 0.28
                ),
            }}
          >
            <span
              style={{
                fontSize:
                  'clamp(3.2rem, 17vw, 6rem)',
                fontWeight: 300,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color:
                  'rgba(140,145,155,1)',
                userSelect: 'none',
                lineHeight: 1,
                fontFamily:
                  'Georgia, serif',
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
              padding:
                '0 1.5rem 2.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              opacity:
                Math.max(
                  0,
                  heroTextOpacity
                ),
              transform: `translateY(${
                (1 -
                  Math.max(
                    0,
                    heroTextOpacity
                  )) *
                20
              }px)`,
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
                fontFamily:
                  'Georgia, serif',
                fontSize:
                  'clamp(1.9rem, 7.5vw, 2.5rem)',
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
                fontFamily:
                  'system-ui, sans-serif',
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
                onClick={startInspect}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem 0',
                  borderRadius: 9999,
                  background:
                    'rgba(255,255,255,0.75)',
                  border:
                    '1px solid rgba(255,255,255,0.9)',
                  color: '#18181b',
                  fontSize: '0.6rem',
                  fontFamily:
                    'system-ui, sans-serif',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  backdropFilter:
                    'blur(12px)',
                  boxShadow:
                    '0 4px 16px rgba(0,0,0,0.06)',
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"
                  />
                </svg>

                360° VIEW
              </button>

              <button
                onClick={() =>
                  scrollToSection(
                    '#timepiece'
                  )
                }
                style={{
                  flex: 1,
                  padding: '0.75rem 0',
                  borderRadius: 9999,
                  background: '#18181b',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.6rem',
                  fontFamily:
                    'system-ui, sans-serif',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform:
                    'uppercase',
                  cursor: 'pointer',
                  boxShadow:
                    '0 8px 24px rgba(0,0,0,0.28)',
                }}
              >
                DISCOVER ↓
              </button>
            </div>
          </div>
        </section>

        {/* ══ SECTION 2: SPECIFICATIONS ════════════════════════════════ */}
        <section
          id="timepiece"
          style={{
            minHeight: '100dvh',
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            background: '#050505',
          }}
        >
          <div
            style={{
              padding:
                '0 1.5rem 2.5rem',
              opacity: specsOpacity,
              transform: `translateY(${
                (1 - specsOpacity) * 20
              }px)`,
            }}
          >
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.52rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color:
                  'rgba(255,255,255,0.38)',
                marginBottom: '0.4rem',
              }}
            >
              ATHENA / A01
            </p>

            <h2
              style={{
                fontFamily:
                  'Georgia, serif',
                fontSize:
                  'clamp(1.5rem, 5.5vw, 2rem)',
                fontWeight: 300,
                color: '#fff',
                marginBottom: '0.55rem',
                lineHeight: 1.2,
              }}
            >
              A New Standard
              <br />
              In{' '}
              <em
                style={{
                  fontStyle: 'italic',
                  color:
                    'rgba(255,255,255,0.6)',
                }}
              >
                Automatic Engineering
              </em>
            </h2>

            <p
              style={{
                fontFamily:
                  'system-ui, sans-serif',
                fontSize: '0.72rem',
                color:
                  'rgba(255,255,255,0.48)',
                lineHeight: 1.65,
                marginBottom: '1.25rem',
                fontWeight: 300,
              }}
            >
              Forged Grade 5 titanium. Double-domed sapphire. Engineered around restraint, precision and permanence.
            </p>

            <div
              style={{
                width: '100%',
                height: 1,
                background:
                  'rgba(255,255,255,0.08)',
                marginBottom: '1rem',
              }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: '0.9rem 1.25rem',
              }}
            >
              {[
                {
                  label: 'CASE',
                  value: '42 MM',
                },
                {
                  label: 'MATERIAL',
                  value:
                    'GRADE 5 TITANIUM',
                },
                {
                  label: 'MOVEMENT',
                  value: 'AUTOMATIC',
                },
                {
                  label: 'CRYSTAL',
                  value:
                    'DOUBLE-DOMED SAPPHIRE',
                },
              ].map(
                ({
                  label,
                  value,
                }) => (
                  <div key={label}>
                    <p
                      style={{
                        fontFamily:
                          'monospace',
                        fontSize: '0.5rem',
                        letterSpacing:
                          '0.24em',
                        textTransform:
                          'uppercase',
                        color:
                          'rgba(255,255,255,0.32)',
                        marginBottom:
                          '0.2rem',
                      }}
                    >
                      {label}
                    </p>

                    <p
                      style={{
                        fontFamily:
                          'system-ui, sans-serif',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        letterSpacing:
                          '0.08em',
                        color:
                          'rgba(255,255,255,0.88)',
                      }}
                    >
                      {value}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* ══ SECTION 3: CRAFTSMANSHIP ══════════════════════════════════ */}
        <section
          id="craftsmanship"
          style={{
            minHeight: '100dvh',
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            background: '#070708',
          }}
        >
          <div
            style={{
              padding:
                '0 1.5rem 2.5rem',
              opacity: craftOpacity,
              transform: `translateY(${
                (1 - craftOpacity) * 20
              }px)`,
            }}
          >
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.52rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color:
                  'rgba(255,255,255,0.35)',
                marginBottom: '0.4rem',
              }}
            >
              CRAFTSMANSHIP
            </p>

            <h2
              style={{
                fontFamily:
                  'Georgia, serif',
                fontSize:
                  'clamp(1.5rem, 5.5vw, 2rem)',
                fontWeight: 300,
                color:
                  'rgba(255,255,255,0.92)',
                marginBottom: '0.55rem',
                lineHeight: 1.2,
              }}
            >
              Crafted With Intent
            </h2>

            <p
              style={{
                fontFamily:
                  'system-ui, sans-serif',
                fontSize: '0.72rem',
                color:
                  'rgba(255,255,255,0.42)',
                lineHeight: 1.65,
                marginBottom: '1.25rem',
                fontWeight: 300,
              }}
            >
              Every surface, proportion and interface is considered before the first movement begins.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              {[
                {
                  num: '01',
                  title:
                    'FORGED TITANIUM CASE',
                  body:
                    'Grade 5 titanium, machined to within 0.01mm. Hand-satin finished bevels.',
                },
                {
                  num: '02',
                  title:
                    'DOUBLE-DOMED SAPPHIRE',
                  body:
                    '9H hardness, zero-distortion geometry, dual-sided anti-reflective coating.',
                },
                {
                  num: '03',
                  title:
                    'CALIBRE A01 MOVEMENT',
                  body:
                    'In-house automatic engine with 72-hour power reserve.',
                },
              ].map(
                ({
                  num,
                  title,
                  body,
                }) => (
                  <div
                    key={num}
                    style={{
                      borderTop:
                        '1px solid rgba(255,255,255,0.09)',
                      paddingTop:
                        '0.65rem',
                      display: 'flex',
                      gap: '0.85rem',
                      alignItems:
                        'flex-start',
                    }}
                  >
                    <span
                      style={{
                        fontFamily:
                          'monospace',
                        fontSize: '0.52rem',
                        color:
                          'rgba(255,255,255,0.28)',
                        fontWeight: 700,
                        flexShrink: 0,
                        paddingTop: 2,
                      }}
                    >
                      {num}
                    </span>

                    <div>
                      <p
                        style={{
                          fontFamily:
                            'system-ui, sans-serif',
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          letterSpacing:
                            '0.16em',
                          textTransform:
                            'uppercase',
                          color:
                            'rgba(255,255,255,0.88)',
                          marginBottom:
                            '0.2rem',
                        }}
                      >
                        {title}
                      </p>

                      <p
                        style={{
                          fontFamily:
                            'system-ui, sans-serif',
                          fontSize: '0.68rem',
                          color:
                            'rgba(255,255,255,0.42)',
                          lineHeight: 1.6,
                          fontWeight: 300,
                        }}
                      >
                        {body}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* ══ SECTION 4: VIP PREMIERE ═══════════════════════════════════ */}
        <section
          id="coming-soon"
          style={{
            minHeight: '100dvh',
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '4.5rem',
            background: '#030303',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              padding: '0 1.5rem',
              width: '100%',
              maxWidth: 340,
              opacity: vipOpacity,
              transform: `translateY(${
                (1 - vipOpacity) * 20
              }px)`,
            }}
          >
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.52rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color:
                  'rgba(255,255,255,0.35)',
                marginBottom: '0.65rem',
              }}
            >
              ATHENA HOROLOGY
            </p>

            <h2
              style={{
                fontFamily:
                  'Georgia, serif',
                fontSize:
                  'clamp(1.9rem, 7vw, 2.6rem)',
                fontWeight: 300,
                color:
                  'rgba(255,255,255,0.92)',
                marginBottom: '0.35rem',
                lineHeight: 1.1,
              }}
            >
              Coming Soon
            </h2>

            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.58rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color:
                  'rgba(255,255,255,0.35)',
                marginBottom: '1.75rem',
              }}
            >
              Autumn 2026 Premiere
            </p>

            {emailSubmitted ? (
              <div
                style={{
                  background:
                    'rgba(52,211,153,0.08)',
                  border:
                    '1px solid rgba(52,211,153,0.3)',
                  borderRadius: 16,
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection:
                    'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background:
                      'rgba(52,211,153,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      'center',
                    color: '#6ee7b7',
                    fontSize: '1rem',
                  }}
                >
                  ✓
                </div>

                <p
                  style={{
                    fontFamily:
                      'system-ui, sans-serif',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#fff',
                  }}
                >
                  VIP Access Confirmed
                </p>

                <p
                  style={{
                    fontFamily:
                      'system-ui, sans-serif',
                    fontSize: '0.68rem',
                    color:
                      'rgba(255,255,255,0.5)',
                    lineHeight: 1.6,
                  }}
                >
                  You have been placed on the private allocation register.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                style={{
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: '0.65rem',
                  width: '100%',
                }}
              >
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) =>
                    setEmailValue(
                      e.target.value
                    )
                  }
                  placeholder="Enter email for private access"
                  required
                  style={{
                    width: '100%',
                    boxSizing:
                      'border-box',
                    background:
                      'rgba(255,255,255,0.05)',
                    border:
                      '1px solid rgba(255,255,255,0.14)',
                    borderRadius: 9999,
                    padding:
                      '0.8rem 1.5rem',
                    fontSize: '0.72rem',
                    fontFamily:
                      'system-ui, sans-serif',
                    color: '#fff',
                    outline: 'none',
                    textAlign: 'center',
                    letterSpacing:
                      '0.04em',
                  }}
                />

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: 9999,
                    background:
                      'rgba(255,255,255,0.92)',
                    color: '#050507',
                    border: 'none',
                    fontSize: '0.62rem',
                    fontFamily:
                      'system-ui, sans-serif',
                    fontWeight: 700,
                    letterSpacing:
                      '0.2em',
                    textTransform:
                      'uppercase',
                    cursor: 'pointer',
                    boxShadow:
                      '0 8px 24px rgba(255,255,255,0.18)',
                  }}
                >
                  Notify Me
                </button>
              </form>
            )}

            <p
              style={{
                fontFamily: 'monospace',
                fontSize: '0.48rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color:
                  'rgba(255,255,255,0.18)',
                marginTop: '3rem',
              }}
            >
              ATHENA HOROLOGY · GENÈVE
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
