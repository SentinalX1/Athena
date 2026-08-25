'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
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
    applyHandRotations(
      START_HOUR,
      START_MINUTE,
      START_SECOND,
      { hourHand, minuteHand, secondHand },
      initQ.current
    );
  }

  useEffect(() => {
    if (initQ.current && hourHand && minuteHand && secondHand) {
      applyHandRotations(
        START_HOUR,
        START_MINUTE,
        START_SECOND,
        { hourHand, minuteHand, secondHand },
        initQ.current
      );
      onModelReady?.();
    }
  }, [hourHand, minuteHand, secondHand, onModelReady]);

  const animTime = useRef(0);
  const smoothProgress = useRef(0);
  const floatTime = useRef(0);

  // Smooth inspect rotation damping
  const smoothInspectX = useRef(0);
  const smoothInspectY = useRef(0);

  useFrame((_, delta) => {
    if (!initQ.current || !groupRef.current) return;

    // Real-time time animation
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

    // 360° Tactile Inspection Mode
    if (isInspecting) {
      smoothInspectX.current = THREE.MathUtils.lerp(smoothInspectX.current, inspectRot.x, 0.12);
      smoothInspectY.current = THREE.MathUtils.lerp(smoothInspectY.current, inspectRot.y, 0.12);

      groupRef.current.position.set(0, 0.05, 0.1);
      groupRef.current.rotation.x = -0.20 + smoothInspectX.current;
      groupRef.current.rotation.y = smoothInspectY.current + Math.sin(t * 0.4) * 0.015;
      groupRef.current.rotation.z = 0;
      groupRef.current.scale.set(2.1, 2.1, 2.1);
      return;
    }

    // Smooth scroll interpolation
    smoothProgress.current = THREE.MathUtils.lerp(
      smoothProgress.current,
      scrollProgress,
      1 - Math.pow(0.001, delta)
    );
    const sp = smoothProgress.current;

    // Mobile Vertical Scroll Choreography:
    // 0.0 - 0.9 : Hero (Majestic Center Stage, high scale)
    // 0.9 - 1.8 : Specs Section (Upper stage showcase, angled dial)
    // 1.8 - 2.7 : Craftsmanship (Side crown & profile bevel showcase)
    // 2.7 - 3.5 : VIP Section (Lower stage macro silhouette)

    const pSec2 = smoothstep(0.4, 1.1, sp);
    const pSec3 = smoothstep(1.3, 2.1, sp);
    const pSec4 = smoothstep(2.3, 3.0, sp);

    const idleFloat = Math.sin(t * 0.8) * 0.015 * (1 - pSec2);

    // Y Position:
    // Starts at 0.12 (Hero center-upper), elevates smoothly to 0.42 (Specs), stays at 0.38 (Craft), lowers to -0.15 (VIP)
    let posY = 0.12 + idleFloat;
    if (sp >= 0.4 && sp < 1.5) {
      posY = THREE.MathUtils.lerp(0.12, 0.45, pSec2);
    } else if (sp >= 1.5 && sp < 2.5) {
      posY = THREE.MathUtils.lerp(0.45, 0.38, pSec3);
    } else if (sp >= 2.5) {
      posY = THREE.MathUtils.lerp(0.38, -0.16, pSec4);
    }

    // X Position: Subtle balance shifts
    let posX = 0;
    if (sp >= 1.5 && sp < 2.5) {
      posX = THREE.MathUtils.lerp(0.0, 0.08, pSec3);
    } else if (sp >= 2.5) {
      posX = THREE.MathUtils.lerp(0.08, 0.0, pSec4);
    }

    // Rotation: Keeps dial visible and well-lit across all sections
    const rotX = THREE.MathUtils.lerp(-0.28, -0.16, pSec2);
    let rotY = THREE.MathUtils.lerp(0.0, -0.32, pSec2);
    if (sp >= 1.5) {
      rotY = THREE.MathUtils.lerp(-0.32, 0.45, pSec3);
    }
    if (sp >= 2.5) {
      rotY = THREE.MathUtils.lerp(0.45, 0.0, pSec4);
    }

    // Scale: Generous scale on mobile portrait displays
    let scale = THREE.MathUtils.lerp(2.2, 1.58, pSec2);
    if (sp >= 2.5) {
      scale = THREE.MathUtils.lerp(1.58, 1.25, pSec4);
    }

    groupRef.current.position.set(posX, posY, THREE.MathUtils.lerp(0.0, 0.12, pSec2));
    groupRef.current.rotation.set(
      rotX,
      rotY + Math.sin(t * 0.4) * 0.015,
      THREE.MathUtils.lerp(0.0, -0.03, pSec2)
    );
    groupRef.current.scale.set(scale, scale, scale);
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

export function MobileView({ isLoaderComplete, onWatchLoaded }: MobileViewProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectRot, setInspectRot] = useState({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Scroll tracking inside mobile view
  const handleScroll = () => {
    if (isInspecting) return;
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;
    const progress = (el.scrollTop / maxScroll) * 3.0;
    setScrollProgress(progress);
  };

  const scrollToSection = (targetId: string) => {
    setMenuOpen(false);
    setIsInspecting(false);
    const el = containerRef.current?.querySelector(targetId);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const startInspect = () => {
    setIsInspecting(true);
    setInspectRot({ x: 0, y: 0 });
    setMenuOpen(false);
  };

  const endInspect = () => {
    setIsInspecting(false);
  };

  // Pointer drag events for 360° inspection mode
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isInspecting) return;
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !isInspecting) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    setInspectRot((prev) => ({
      y: prev.y + dx * 0.009,
      x: Math.max(-0.55, Math.min(0.55, prev.x + dy * 0.009)),
    }));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue || !emailValue.includes('@')) return;
    setEmailSubmitted(true);
  };

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#050507] text-white overflow-hidden select-none font-serif"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* ── Fixed 3D WebGL Canvas Layer with Studio Multi-Light Rig ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 2.5], fov: 46 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {/* Studio Horology Lighting: High ambient + balanced key/fill/rim so titanium & sapphire gleam */}
          <ambientLight intensity={1.1} />
          <directionalLight position={[3, 5, 4]} intensity={2.2} color="#FFFFFF" />
          <directionalLight position={[-3, -1, 3]} intensity={1.2} color="#D0E0FF" />
          <directionalLight position={[0, 6, -2]} intensity={1.5} color="#FFF5EA" />
          <pointLight position={[0, 0.2, 2.5]} intensity={1.4} color="#FFFFFF" />
          <Environment preset="city" />
          <Suspense fallback={null}>
            <MobileWatchScene
              scrollProgress={isInspecting ? 0 : scrollProgress}
              isInspecting={isInspecting}
              inspectRot={inspectRot}
              isLoaderComplete={isLoaderComplete}
              onModelReady={onWatchLoaded}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* ── Ambient Velvet Gradients (No grain / noise artifacts) ── */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 25%, rgba(195, 215, 245, 0.12) 0%, transparent 60%),
              radial-gradient(ellipse 70% 60% at 50% 85%, rgba(130, 155, 195, 0.08) 0%, transparent 70%)
            `,
          }}
        />
      </div>

      {/* ── Fixed Mobile Luxury Header ── */}
      <header className="absolute top-0 left-0 right-0 z-40 px-6 pt-5 pb-4 flex items-center justify-between pointer-events-auto backdrop-blur-lg bg-[#050507]/40 border-b border-white/[0.07]">
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('#hero');
          }}
          className="text-base font-bold tracking-[0.32em] text-white cursor-pointer select-none"
        >
          ATHENA
        </a>

        <div className="flex items-center gap-3">
          <button
            onClick={startInspect}
            className="flex items-center gap-1.5 bg-white/[0.08] hover:bg-white/15 border border-white/20 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-widest text-white/90 cursor-pointer active:scale-95 transition-all shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            360° VIEW
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full bg-white/[0.06] border border-white/15 text-white cursor-pointer active:scale-95 transition-all"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* ── Slide-Down Luxury Navigation Drawer ── */}
      {menuOpen && (
        <div className="absolute top-[65px] left-0 right-0 z-50 bg-[#07070b]/98 border-b border-white/15 backdrop-blur-2xl px-6 py-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top duration-300">
          <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-white/40 mb-1">
            ATHENA HOROLOGY
          </p>
          {[
            { id: '#hero', label: 'Overview & Model' },
            { id: '#timepiece', label: 'Specifications & Engineering' },
            { id: '#craftsmanship', label: 'Haute Horlogerie Craft' },
            { id: '#coming-soon', label: 'VIP Allocation' },
          ].map((item, idx) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="text-left font-sans text-xs tracking-[0.2em] uppercase text-white/80 hover:text-white py-2.5 border-b border-white/[0.07] last:border-0 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-white/30">0{idx + 1}</span>
                <span>{item.label}</span>
              </span>
              <span className="text-white/40 text-xs">→</span>
            </button>
          ))}
          <div className="pt-2">
            <button
              onClick={startInspect}
              className="w-full py-3.5 rounded-full bg-white text-black font-sans text-[10px] font-bold tracking-[0.22em] uppercase flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xl transition-all"
            >
              <span>Launch 360° Tactile Inspection</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 360° Tactile Inspection Mode Overlay ── */}
      {isInspecting && (
        <div className="absolute inset-0 z-40 pointer-events-auto flex flex-col justify-between p-6 pt-20 pb-12 bg-black/60 backdrop-blur-md">
          {/* Top Instruction Badge */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="bg-white/10 border border-white/25 text-white px-5 py-2 rounded-full text-[10px] font-mono tracking-widest flex items-center gap-2.5 shadow-2xl backdrop-blur-xl">
              <svg className="w-3.5 h-3.5 text-blue-300 animate-spin" style={{ animationDuration: '6s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>DRAG SCREEN TO ROTATE 360°</span>
            </div>
            <p className="text-[10px] font-mono text-white/50 tracking-wider">
              Calibre A01 Titanium · Multi-Axis GlTF Viewport
            </p>
          </div>

          {/* Bottom Exit Button */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={endInspect}
              className="w-full max-w-xs py-3.5 rounded-full font-sans text-xs tracking-[0.24em] uppercase font-bold bg-white text-black hover:bg-white/90 active:scale-95 transition-all shadow-[0_10px_35px_rgba(255,255,255,0.25)] cursor-pointer"
            >
              ✕ Exit Inspection
            </button>
          </div>
        </div>
      )}

      {/* ── Scrollable Narrative Container ── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`relative z-10 w-full h-full overflow-y-auto overflow-x-hidden ${
          isInspecting ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {/* ══════════════════════════════════════════════════════════════
            SECTION 1: HERO OVERVIEW
        ══════════════════════════════════════════════════════════════ */}
        <section
          id="hero"
          className="min-h-[100dvh] w-full flex flex-col justify-end px-6 pb-12 relative select-none"
        >
          {/* Subtle Ghost Brand Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <span className="text-[8rem] font-light tracking-[0.16em] text-white/20 select-none">
              ATHENA
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300/80" />
              <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">
                SWISS AUTOMATIC · GENÈVE
              </p>
            </div>

            <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-white mb-2 leading-none">
              Athena A01
            </h1>

            <p className="font-sans text-xs text-white/60 leading-relaxed max-w-[290px] mb-7 font-light">
              Pure mechanical restraint. Forged Grade 5 titanium with double-domed sapphire crystal.
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-3 w-full max-w-xs justify-center">
              <button
                onClick={startInspect}
                className="flex-1 py-3 px-4 rounded-full bg-white/[0.08] hover:bg-white/15 active:scale-95 border border-white/20 text-white font-sans text-[10px] font-medium tracking-[0.2em] uppercase transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <svg className="w-3.5 h-3.5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
                <span>360° Inspect</span>
              </button>

              <button
                onClick={() => scrollToSection('#timepiece')}
                className="flex-1 py-3 px-4 rounded-full bg-white text-black font-sans text-[10px] font-bold tracking-[0.22em] uppercase active:scale-95 transition-all shadow-[0_8px_25px_rgba(255,255,255,0.2)] cursor-pointer"
              >
                Explore ↓
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2: SPECIFICATIONS & ARCHITECTURAL PRECISION
        ══════════════════════════════════════════════════════════════ */}
        <section
          id="timepiece"
          className="min-h-[100dvh] w-full flex flex-col justify-end px-6 pb-12 relative"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(5,5,7,0.92) 20%, #050507 100%)',
          }}
        >
          <div className="relative z-10">
            <p className="font-mono text-[9px] tracking-[0.38em] uppercase text-blue-200/70 mb-1.5">
              SPECIFICATIONS & DIMENSIONS
            </p>
            <h2 className="text-3xl font-light text-white mb-2 leading-snug">
              Architectural Precision
            </h2>
            <p className="font-sans text-xs text-white/50 mb-6 leading-relaxed font-light max-w-sm">
              Engineered with extreme tolerances. Every curve, bevel and component is balanced for effortless ergonomics and lifetime permanence.
            </p>

            {/* Spec Cards — 4 Comprehensive Luxury Rows */}
            <div className="flex flex-col gap-2.5">
              {[
                {
                  label: 'CASE & PROFILE',
                  value: '42 MM',
                  desc: 'Forged Grade 5 Titanium billet. 9.4mm slim profile with hand-satin brushed bevels.',
                },
                {
                  label: 'CRYSTAL & OPTICS',
                  value: '9H SAPPHIRE',
                  desc: 'Double-domed sapphire with dual-sided anti-reflective vacuum vapor deposition.',
                },
                {
                  label: 'CALIBRE ENGINE',
                  value: '72H RESERVE',
                  desc: 'In-House Calibre A01 automatic mechanical movement beating at 28,800 vph.',
                },
                {
                  label: 'RATE & RESISTANCE',
                  value: 'COSC ±2S/DAY',
                  desc: 'Individually regulated across 5 positions. 100 metres / 10 ATM water resistance.',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[9px] tracking-[0.24em] uppercase text-white/40">
                      {item.label}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-white tracking-wider">
                      {item.value}
                    </span>
                  </div>
                  <p className="font-sans text-[11px] text-white/70 leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3: CRAFTSMANSHIP & HAUTE HORLOGERIE
        ══════════════════════════════════════════════════════════════ */}
        <section
          id="craftsmanship"
          className="min-h-[100dvh] w-full flex flex-col justify-end px-6 pb-12 relative bg-[#050507]"
        >
          <div className="relative z-10">
            <p className="font-mono text-[9px] tracking-[0.38em] uppercase text-blue-200/70 mb-1.5">
              HAUTE HORLOGERIE
            </p>
            <h2 className="text-3xl font-light text-white mb-2 leading-snug">
              Crafted With Intent
            </h2>
            <p className="font-sans text-xs text-white/50 mb-6 leading-relaxed font-light">
              Composed rather than merely assembled. The Athena A01 represents pure mechanical restraint across three core horological pillars.
            </p>

            {/* 3 Pillars Editorial Cards */}
            <div className="flex flex-col gap-3">
              {[
                {
                  num: 'I',
                  title: 'Forged Grade 5 Titanium',
                  desc: 'Machined from a single solid aerospace-grade titanium billet. 14 hours of multi-axis CNC milling and hand-satin finishing per case.',
                },
                {
                  num: 'II',
                  title: 'Double-Domed Sapphire',
                  desc: '9H hardness sapphire crystal with zero-distortion optical geometry and dual-sided anti-reflective vacuum vapor deposition.',
                },
                {
                  num: 'III',
                  title: 'In-House Calibre A01',
                  desc: 'Self-winding mechanical engine featuring a skeletonized tungsten micro-rotor and 72-hour continuous power reserve.',
                },
              ].map((pillar) => (
                <div
                  key={pillar.num}
                  className="flex items-start gap-3.5 bg-white/[0.03] border border-white/[0.09] rounded-2xl p-4 backdrop-blur-sm"
                >
                  <span className="font-serif text-lg text-blue-200/80 italic font-light px-2.5 py-0.5 rounded-xl bg-blue-500/10 border border-blue-400/20 flex-shrink-0">
                    {pillar.num}
                  </span>
                  <div>
                    <h3 className="font-sans text-xs font-semibold text-white/95 mb-1 tracking-wide">
                      {pillar.title}
                    </h3>
                    <p className="font-sans text-[11px] text-white/50 leading-relaxed font-light">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4: VIP PREMIERE RESERVATION
        ══════════════════════════════════════════════════════════════ */}
        <section
          id="coming-soon"
          className="min-h-[100dvh] w-full flex flex-col items-center justify-end px-6 pb-14 text-center relative bg-[#040406]"
        >
          <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
            <span className="font-mono text-[9px] tracking-[0.32em] uppercase text-blue-200/80 border border-blue-400/25 bg-blue-500/10 px-3.5 py-1.5 rounded-full mb-4">
              LIMITED PRODUCTION · 250 PIECES
            </span>

            <h2 className="text-3xl sm:text-4xl font-light text-white mb-1.5 leading-tight">
              Coming Soon
            </h2>
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/45 mb-6">
              Autumn 2026 Premiere
            </p>

            {emailSubmitted ? (
              <div className="w-full bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-5 flex flex-col items-center gap-2 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-9 h-9 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-300 text-base">
                  ✓
                </div>
                <p className="font-sans text-sm font-semibold text-white">
                  VIP Access Confirmed
                </p>
                <p className="font-sans text-xs text-white/60 leading-relaxed">
                  You have been placed on the private allocation register. Exclusive allocation details will be sent prior to public release.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-3 w-full">
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="Enter email for private allocation"
                  required
                  className="w-full bg-white/[0.06] border border-white/15 rounded-full px-5 py-3.5 text-xs text-white text-center placeholder-white/35 outline-none focus:border-white/40 font-sans transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="w-full bg-white text-black py-3.5 rounded-full font-sans text-xs font-bold tracking-[0.24em] uppercase cursor-pointer active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.22)] transition-all"
                >
                  REQUEST ACCESS
                </button>
              </form>
            )}

            <div className="w-16 h-px bg-white/15 my-8" />

            <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-white/30">
              ATHENA HOROLOGY · GENÈVE · SWISS CALIBRE A01
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
