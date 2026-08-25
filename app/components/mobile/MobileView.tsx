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
// Mobile 3D Watch Model & Scene Controller
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

    // Time animation
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
      smoothInspectX.current = THREE.MathUtils.lerp(smoothInspectX.current, inspectRot.x, 0.14);
      smoothInspectY.current = THREE.MathUtils.lerp(smoothInspectY.current, inspectRot.y, 0.14);

      groupRef.current.position.set(0, 0.05, 0.1);
      groupRef.current.rotation.x = -0.22 + smoothInspectX.current;
      groupRef.current.rotation.y = smoothInspectY.current + Math.sin(t * 0.4) * 0.015;
      groupRef.current.rotation.z = 0;
      groupRef.current.scale.set(1.95, 1.95, 1.95);
      return;
    }

    // Smooth scroll interpolation
    smoothProgress.current = THREE.MathUtils.lerp(
      smoothProgress.current,
      scrollProgress,
      1 - Math.pow(0.001, delta)
    );
    const sp = smoothProgress.current;

    // Mobile Vertical Scroll Choreography
    const pSec2 = smoothstep(0.3, 1.0, sp);
    const pSec3 = smoothstep(1.2, 2.0, sp);
    const pSec4 = smoothstep(2.2, 3.0, sp);

    const idleFloat = Math.sin(t * 0.85) * 0.018 * (1 - pSec2);

    // Y Position (elevates up to leave space for mobile content cards)
    let posY = 0.08 + idleFloat;
    if (sp >= 0.3 && sp < 1.5) {
      posY = THREE.MathUtils.lerp(0.08, 0.44, pSec2);
    } else if (sp >= 1.5 && sp < 2.5) {
      posY = THREE.MathUtils.lerp(0.44, 0.40, pSec3);
    } else if (sp >= 2.5) {
      posY = THREE.MathUtils.lerp(0.40, -0.12, pSec4);
    }

    // Rotation Mapping
    const rotX = THREE.MathUtils.lerp(-0.25, -0.12, pSec2);
    let rotY = THREE.MathUtils.lerp(0.0, -0.38, pSec2);
    if (sp >= 1.5) {
      rotY = THREE.MathUtils.lerp(-0.38, 0.72, pSec3);
    }
    if (sp >= 2.5) {
      rotY = THREE.MathUtils.lerp(0.72, 0.0, pSec4);
    }

    // Scale Mapping
    let scale = THREE.MathUtils.lerp(2.0, 1.48, pSec2);
    if (sp >= 2.5) {
      scale = THREE.MathUtils.lerp(1.48, 1.20, pSec4);
    }

    groupRef.current.position.set(0, posY, THREE.MathUtils.lerp(0.0, 0.15, pSec2));
    groupRef.current.rotation.set(
      rotX,
      rotY + Math.sin(t * 0.4) * 0.015,
      THREE.MathUtils.lerp(0.0, -0.04, pSec2)
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
// Mobile Hybrid View Component
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
  const [activeSpec, setActiveSpec] = useState<number>(0);
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
    const progress = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
    setScrollProgress(progress * 3.0);
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

  const specsList = [
    {
      label: 'CASE',
      title: 'Grade 5 Forged Titanium',
      value: '42 MM',
      detail: 'Machined from a single billet with 14 hours of multi-axis hand satin finishing. 9.4mm profile.',
    },
    {
      label: 'CRYSTAL',
      title: 'Double-Domed Sapphire',
      value: '9H HARDNESS',
      detail: 'Dual-sided anti-reflective vacuum vapor deposition for absolute optical clarity from any angle.',
    },
    {
      label: 'CALIBRE',
      title: 'In-House Calibre A01',
      value: '72H RESERVE',
      detail: 'Self-winding mechanical engine with skeletonized tungsten rotor, beating at 28,800 vibrations per hour.',
    },
    {
      label: 'PRECISION',
      title: 'COSC Certified Rate',
      value: '±2 SEC / DAY',
      detail: 'Individually regulated across 5 positions and 3 temperatures in Geneva atelier.',
    },
  ];

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#040407] text-white overflow-hidden select-none font-serif"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Fixed 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 2.5], fov: 48 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 6, 4]} intensity={1.8} color="#FFFFFF" />
          <directionalLight position={[-3, -2, -2]} intensity={0.5} color="#B4C8FF" />
          <pointLight position={[0, 1, 2.2]} intensity={1.0} color="#FFF8F0" />
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

      {/* Caustic Atmosphere Background */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div
          className="absolute inset-0 opacity-40 animate-pulse"
          style={{
            animationDuration: '8s',
            background: `
              radial-gradient(ellipse 70% 50% at 30% 20%, rgba(185, 205, 235, 0.16) 0%, transparent 65%),
              radial-gradient(ellipse 60% 60% at 75% 75%, rgba(140, 160, 200, 0.12) 0%, transparent 70%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            mixBlendMode: 'overlay',
            filter: 'contrast(160%) brightness(105%)',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Sleek Floating Header */}
      <header className="absolute top-0 left-0 right-0 z-40 px-5 pt-4 pb-3 flex items-center justify-between pointer-events-auto backdrop-blur-md bg-black/20 border-b border-white/[0.06]">
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('#hero');
          }}
          className="text-sm font-bold tracking-[0.3em] text-white cursor-pointer select-none"
        >
          ATHENA
        </a>

        <div className="flex items-center gap-2.5">
          <button
            onClick={startInspect}
            className="flex items-center gap-1.5 bg-white/[0.07] border border-white/15 px-2.5 py-1 rounded-full text-[9px] font-mono tracking-widest text-blue-200 cursor-pointer active:scale-95 transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            360°
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-full bg-white/[0.05] border border-white/10 text-white cursor-pointer active:scale-95 transition-all"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Slide-Down Luxury Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-[54px] left-0 right-0 z-50 bg-[#06060c]/95 border-b border-white/10 backdrop-blur-2xl px-6 py-6 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top duration-300">
          <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-white/30 mb-1">NAVIGATION</p>
          {[
            { id: '#hero', label: '01. The Overview' },
            { id: '#timepiece', label: '02. Specifications & Dimensions' },
            { id: '#craftsmanship', label: '03. Haute Horlogerie Craft' },
            { id: '#coming-soon', label: '04. VIP Premiere Reservation' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="text-left font-sans text-xs tracking-[0.2em] uppercase text-white/80 hover:text-white py-2 border-b border-white/[0.05] last:border-0 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>{item.label}</span>
              <span className="text-white/30 text-xs">→</span>
            </button>
          ))}
          <div className="pt-2">
            <button
              onClick={startInspect}
              className="w-full py-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Launch 360° Tactile Inspection</span>
            </button>
          </div>
        </div>
      )}

      {/* 360° Tactile Inspection HUD Overlay */}
      {isInspecting && (
        <div className="absolute inset-0 z-40 pointer-events-auto flex flex-col justify-between p-6 pt-16 pb-12 bg-black/40 backdrop-blur-xs">
          {/* Top Instruction Badge */}
          <div className="flex flex-col items-center gap-1">
            <div className="bg-blue-500/20 border border-blue-400/40 text-blue-200 px-4 py-1.5 rounded-full text-[10px] font-mono tracking-widest flex items-center gap-2 animate-pulse">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
              <span>DRAG IN ANY DIRECTION TO ROTATE</span>
            </div>
            <p className="text-[10px] font-mono text-white/40 tracking-wider">Athena Calibre A01 · 3D Viewport</p>
          </div>

          {/* Bottom Exit Button */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={endInspect}
              className="w-full max-w-xs py-3.5 rounded-full font-sans text-xs tracking-[0.24em] uppercase font-bold bg-white text-black hover:bg-white/90 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)] cursor-pointer"
            >
              ✕ Exit 360° Inspection
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Mobile Choreography Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`relative z-10 w-full h-full overflow-y-auto overflow-x-hidden ${
          isInspecting ? 'pointer-events-none' : 'pointer-events-auto'
        }`}
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {/* ── SECTION 1: HERO ── */}
        <section
          id="hero"
          className="min-h-[100dvh] w-full flex flex-col justify-end p-5 pb-10 relative select-none"
        >
          {/* Ghost Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
            <span className="text-[7.5rem] font-light tracking-[0.15em] text-white/20 select-none">
              A01
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <p className="font-mono text-[9px] tracking-[0.45em] uppercase text-blue-200/70 mb-2 animate-pulse">
              SWISS AUTOMATIC · GENÈVE
            </p>

            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-2 leading-tight">
              Athena A01
            </h1>

            <p className="font-sans text-xs text-white/50 leading-relaxed max-w-[280px] mb-6 font-light">
              Pure mechanical restraint. Forged Grade 5 titanium with double-domed sapphire crystal.
            </p>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2.5 w-full max-w-xs justify-center">
              <button
                onClick={startInspect}
                className="flex-1 py-3 px-4 rounded-full bg-white/[0.08] hover:bg-white/15 active:scale-95 border border-white/20 text-white font-sans text-[10px] tracking-[0.2em] uppercase transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer shadow-lg"
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

        {/* ── SECTION 2: THE TIMEPIECE & SPECS ── */}
        <section
          id="timepiece"
          className="min-h-[100dvh] w-full flex flex-col justify-end p-5 pb-8 relative"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(4,4,7,0.92) 28%, #040407 100%)',
          }}
        >
          <div className="relative z-10">
            <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-blue-300/60 mb-1">
              SPECIFICATIONS
            </p>
            <h2 className="text-2xl font-light text-white mb-2 leading-snug">
              Architectural Precision
            </h2>
            <p className="font-sans text-xs text-white/45 mb-4 leading-relaxed max-w-xs font-light">
              Every curve, bevel and component is balanced for effortless ergonomics and lifetime durability.
            </p>

            {/* Spec Cards 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {specsList.map((item, idx) => (
                <button
                  key={item.label}
                  onClick={() => setActiveSpec(idx)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    activeSpec === idx
                      ? 'bg-blue-500/15 border-blue-400/40 shadow-lg'
                      : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]'
                  }`}
                >
                  <p className="font-mono text-[8px] tracking-[0.25em] uppercase text-white/35 mb-1">
                    {item.label}
                  </p>
                  <p className="font-sans text-xs font-semibold text-white/95 leading-tight">
                    {item.value}
                  </p>
                  <p className="font-sans text-[10px] text-white/45 mt-0.5 truncate">
                    {item.title}
                  </p>
                </button>
              ))}
            </div>

            {/* Expanded Spec Detail Box */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[8px] tracking-widest uppercase text-blue-300">
                  {specsList[activeSpec].label} DETAILS
                </span>
                <span className="font-mono text-[9px] text-white/40">
                  {specsList[activeSpec].value}
                </span>
              </div>
              <p className="font-sans text-[11px] text-white/70 leading-relaxed font-light">
                {specsList[activeSpec].detail}
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: CRAFTSMANSHIP ── */}
        <section
          id="craftsmanship"
          className="min-h-[100dvh] w-full flex flex-col justify-end p-5 pb-8 relative bg-[#040407]"
        >
          <div className="relative z-10">
            <p className="font-mono text-[9px] tracking-[0.35em] uppercase text-blue-300/60 mb-1">
              HAUTE HORLOGERIE
            </p>
            <h2 className="text-2xl font-light text-white mb-2 leading-snug">
              Crafted With Intent
            </h2>
            <p className="font-sans text-xs text-white/45 mb-4 leading-relaxed font-light">
              Composed rather than merely assembled. The Athena A01 embodies three pillars of mechanical excellence.
            </p>

            {/* 3 Pillars List */}
            <div className="flex flex-col gap-2.5">
              {[
                {
                  num: '01',
                  title: 'Forged Grade 5 Titanium',
                  desc: 'Machined from a single solid billet. 14 hours of multi-axis CNC milling and hand-satin finishing per case.',
                },
                {
                  num: '02',
                  title: 'Double-Domed Sapphire',
                  desc: '9H hardness with dual-sided anti-reflective vacuum vapor deposition for zero optical distortion.',
                },
                {
                  num: '03',
                  title: 'In-House Calibre A01',
                  desc: 'Self-winding mechanical caliber with skeletonized tungsten micro-rotor and 72-hour power reserve.',
                },
              ].map((pillar) => (
                <div
                  key={pillar.num}
                  className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3.5 backdrop-blur-sm"
                >
                  <span className="font-mono text-[10px] text-blue-300 border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 rounded-lg flex-shrink-0">
                    {pillar.num}
                  </span>
                  <div>
                    <h3 className="font-sans text-xs font-semibold text-white/90 mb-0.5">
                      {pillar.title}
                    </h3>
                    <p className="font-sans text-[11px] text-white/40 leading-relaxed font-light">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 4: VIP PREMIERE RESERVATION ── */}
        <section
          id="coming-soon"
          className="min-h-[100dvh] w-full flex flex-col items-center justify-end p-5 pb-10 text-center relative bg-[#030305]"
        >
          <div className="relative z-10 w-full max-w-xs flex flex-col items-center">
            <span className="font-mono text-[8px] tracking-[0.35em] uppercase text-blue-300/60 border border-blue-400/20 bg-blue-500/10 px-3 py-1 rounded-full mb-3">
              LIMITED PRODUCTION · 250 PIECES
            </span>

            <h2 className="text-3xl font-light text-white mb-1 leading-tight">
              Coming Soon
            </h2>
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/40 mb-6">
              Autumn 2026 Premiere
            </p>

            {emailSubmitted ? (
              <div className="w-full bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4 flex flex-col items-center gap-1.5 shadow-xl animate-in zoom-in-95 duration-300">
                <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-300 mb-1">
                  ✓
                </div>
                <p className="font-sans text-xs font-semibold text-white">
                  VIP Access Confirmed
                </p>
                <p className="font-sans text-[10px] text-white/50 leading-snug">
                  You will receive exclusive allocation details prior to public release.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2.5 w-full">
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="Enter email for private allocation"
                  required
                  className="w-full bg-white/[0.05] border border-white/15 rounded-full px-4 py-3 text-xs text-white text-center placeholder-white/30 outline-none focus:border-blue-400/60 font-sans transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="w-full bg-white text-black py-3 rounded-full font-sans text-[10px] font-bold tracking-[0.24em] uppercase cursor-pointer active:scale-95 shadow-[0_8px_25px_rgba(255,255,255,0.2)] transition-all"
                >
                  REQUEST ACCESS
                </button>
              </form>
            )}

            <div className="w-12 h-px bg-white/10 my-6" />

            <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-white/25">
              ATHENA HOROLOGY · GENÈVE
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
