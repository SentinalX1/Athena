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

// 91-Frame Kinetic Loader Resources
const TOTAL_FRAMES = 91; // frame_00 to frame_90
const FRAME_DURATION = 30; // 30ms per frame

const FRAME_PATHS = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const padded = String(i).padStart(2, '0');
  return `/Loader/frame_${padded}_delay-0.03s.png`;
});

// KineticFramePlayer receives pre-baked GPU bitmaps from parent — zero CPU in rAF loop.
function KineticFramePlayer({
  size = 150,
  bitmaps,
}: {
  size?: number;
  bitmaps: (ImageBitmap | null)[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let currentFrame = 0;

    const render = (now: number) => {
      const delta = now - lastTime;
      if (delta >= FRAME_DURATION) {
        currentFrame = (currentFrame + Math.floor(delta / FRAME_DURATION)) % TOTAL_FRAMES;
        lastTime = now - (delta % FRAME_DURATION);
        const bmp = bitmaps[currentFrame];
        if (bmp) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [bitmaps]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      style={{ width: `${size}px`, height: `${size}px` }}
      className="pointer-events-none block"
    />
  );
}

// Final Production Loading Screen - Removed percentage counter
function AthenaLoadingScreen({
  isWatchLoaded,
  onComplete,
}: {
  isWatchLoaded: boolean;
  onComplete: () => void;
}) {
  // phase: 'preload' | 'spinning' | 'exiting' | 'done'
  const [phase, setPhase] = useState<'preload' | 'spinning' | 'exiting' | 'done'>('preload');
  const [bitmaps, setBitmaps] = useState<(ImageBitmap | null)[]>(
    () => new Array(TOTAL_FRAMES).fill(null)
  );

  // Track whether frames AND model are both ready
  const framesReadyRef = useRef(false);
  const watchReadyRef = useRef(false);
  const spinStartTimeRef = useRef(0);

  // Attempt iris close — only if both frames and watch are ready,
  // and spinner has played for at least 900ms
  const tryTriggerExit = () => {
    if (!framesReadyRef.current || !watchReadyRef.current) return;
    const spinElapsed = performance.now() - spinStartTimeRef.current;
    const delay = Math.max(0, 900 - spinElapsed);
    setTimeout(() => {
      setPhase('exiting');
      setTimeout(() => {
        setPhase('done');
        onComplete();
      }, 1150);
    }, delay);
  };

  // Phase 1: Preload all 91 frames into GPU ImageBitmap objects
  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;
    const newBitmaps: (ImageBitmap | null)[] = new Array(TOTAL_FRAMES).fill(null);

    const onFrameReady = () => {
      loadedCount += 1;

      if (loadedCount === TOTAL_FRAMES) {
        if (cancelled) return;
        setBitmaps([...newBitmaps]);
        framesReadyRef.current = true;
        spinStartTimeRef.current = performance.now();
        if (!cancelled) {
          setPhase('spinning');
          tryTriggerExit();
        }
      }
    };

    FRAME_PATHS.forEach((path, index) => {
      const img = new Image();
      img.src = path;
      img
        .decode()
        .then(() => {
          if (cancelled || img.naturalWidth <= 0) { onFrameReady(); return; }

          const cropSize = Math.min(img.naturalWidth, img.naturalHeight) * 0.48;
          const sx = (img.naturalWidth - cropSize) / 2;
          const sy = (img.naturalHeight - cropSize) / 2;

          const offscreen = new OffscreenCanvas(300, 300);
          const offCtx = offscreen.getContext('2d') as OffscreenCanvasRenderingContext2D;
          offCtx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 300, 300);

          const imgData = offCtx.getImageData(0, 0, 300, 300);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
            d[i + 3] = lum < 25 ? 0 : Math.min(255, (lum / 220) * 255);
          }
          offCtx.putImageData(imgData, 0, 0);

          createImageBitmap(offscreen)
            .then((bmp) => {
              if (!cancelled) newBitmaps[index] = bmp;
              onFrameReady();
            })
            .catch(() => onFrameReady());
        })
        .catch(() => onFrameReady());
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 2 trigger: watch becomes ready => try to close
  useEffect(() => {
    if (!isWatchLoaded) return;
    watchReadyRef.current = true;
    tryTriggerExit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWatchLoaded]);

  if (phase === 'done') return null;

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden select-none"
      style={{
        clipPath: phase === 'exiting' ? 'circle(0% at 50% 50%)' : 'circle(150% at 50% 50%)',
        transition: 'clip-path 1.15s cubic-bezier(0.77, 0, 0.175, 1)',
      }}
    >
      {/* Caustic Sapphire Background */}
      <div className="absolute inset-0 bg-[#040407]">
        <div
          className="absolute inset-0 opacity-45 animate-pulse"
          style={{
            animationDuration: '7s',
            background: `
              radial-gradient(ellipse 65% 45% at 24% 22%, rgba(185, 205, 235, 0.17) 0%, rgba(95, 115, 145, 0.05) 42%, transparent 68%),
              radial-gradient(ellipse 55% 55% at 78% 70%, rgba(140, 160, 200, 0.12) 0%, transparent 58%),
              radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.04) 0%, transparent 75%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'conic-gradient(from 180deg at 50% 50%, #040407 0deg, rgba(70,85,110,0.14) 90deg, #040407 180deg, rgba(110,95,75,0.09) 270deg, #040407 360deg)',
            filter: 'blur(50px)',
          }}
        />
        <div
          className="absolute inset-0 opacity-35"
          style={{
            mixBlendMode: 'overlay',
            filter: 'contrast(160%) brightness(105%)',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 50%, transparent 32%, rgba(2, 2, 4, 0.88) 100%)' }}
        />
      </div>

      {/* Kinetic spinner — fades in once all 91 frames are in VRAM */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          phase === 'spinning'
            ? 'opacity-100 scale-100'
            : phase === 'exiting'
            ? 'opacity-0 scale-75'
            : 'opacity-0 scale-75 pointer-events-none'
        }`}
      >
        <KineticFramePlayer size={150} bitmaps={bitmaps} />
      </div>
    </div>
  );
}

// ─── Mobile Fallback Advisory Screen ──────────────────────────────────────────
function MobileFallbackScreen() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="relative w-full h-screen min-h-screen bg-[#040407] text-white flex flex-col items-center justify-center p-6 sm:p-10 select-none overflow-hidden font-serif">
      {/* Caustic Atmosphere Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-40 animate-pulse"
          style={{
            animationDuration: '8s',
            background: `
              radial-gradient(ellipse 70% 50% at 30% 20%, rgba(185, 205, 235, 0.16) 0%, transparent 60%),
              radial-gradient(ellipse 60% 60% at 75% 75%, rgba(140, 160, 200, 0.12) 0%, transparent 65%)
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
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(2, 2, 4, 0.92) 100%)',
          }}
        />
      </div>

      {/* Centered Advisory Content */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center max-w-sm sm:max-w-md px-4 py-8">
        {/* Minimalist Animated Desktop Loupe Icon */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-blue-500/10 blur-xl animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl border border-white/15 bg-white/[0.03] backdrop-blur-md flex items-center justify-center shadow-2xl">
            <svg
              className="w-7 h-7 text-white/80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.25"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-400/80 animate-ping" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-400" />
          </div>
        </div>

        {/* Sub-label */}
        <p className="font-mono text-[10px] tracking-[0.35em] uppercase text-blue-200/60 mb-3">
          DESKTOP EXPERIENCE ONLY
        </p>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white/95 mb-4 leading-snug">
          Please View on a Larger Display
        </h1>

        {/* Body Description */}
        <p className="font-sans text-xs sm:text-sm text-white/45 leading-relaxed mb-6 max-w-xs sm:max-w-sm font-light">
          The Athena interactive 3D timepiece showcase features high-precision WebGL horology and mechanical scroll choreography engineered exclusively for desktop and laptop screens.
        </p>

        {/* Copy Link Button */}
        <div className="flex flex-col gap-3 w-full mt-4 sm:mt-5 max-w-xs">
          <button
            onClick={handleCopyLink}
            className="w-full py-3.5 px-6 rounded-full font-sans text-xs tracking-[0.2em] uppercase font-medium bg-white/10 hover:bg-white/15 active:scale-[0.98] border border-white/20 text-white transition-all backdrop-blur-md cursor-pointer flex items-center justify-center gap-2.5 shadow-lg"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Link Copied to Clipboard</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Link for Desktop</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer Pinned to Bottom */}
      <footer className="absolute bottom-6 left-0 right-0 z-10 flex flex-col items-center gap-1.5 px-4 pointer-events-none">
        <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/30 text-center">
          ATHENA HOROLOGY · SWISS CALIBRE A01
        </p>
      </footer>
    </div>
  );
}

// Clock Hand Synchronization Engine
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

const HOLD_DURATION = 0.25;  // Hold the 10:10:30 catalog pose for 0.25s after reveal
const SWEEP_DURATION = 2.10; // Smoothly rotate to user's local time over 2.1s

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
    // Hold 10:10:30 display pose
    applyHandRotations(START_HOUR, START_MINUTE, START_SECOND, hands, initQuats);
    return;
  }

  const sweepElapsed = elapsedTime - HOLD_DURATION;
  const progress = Math.min(1, sweepElapsed / SWEEP_DURATION);
  const eased = 1 - Math.pow(1 - progress, 3); // Smooth mechanical cubic deceleration

  // Clockwise sweep to target time
  let diffHr = (targetHr - START_HOUR) % 12;
  if (diffHr < 0) diffHr += 12;

  let diffMin = (targetMin - START_MINUTE) % 60;
  if (diffMin < 0) diffMin += 60;

  const currentHr = START_HOUR + diffHr * eased;
  const currentMin = START_MINUTE + diffMin * eased;
  const currentSec = START_SECOND + sweepElapsed;

  applyHandRotations(currentHr, currentMin, currentSec, hands, initQuats);
}

// 3D Watch Component
type WatchProps = ThreeElements['group'] & {
  scrollRaw: number;
  isLoaderComplete: boolean;
  onModelReady?: () => void;
};

function WatchModel({ scrollRaw, isLoaderComplete, onModelReady, ...props }: WatchProps) {
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
      onModelReady?.();
    }
  }, [hourHand, minuteHand, secondHand, onModelReady]);

  const smoothRaw = useRef(0);
  const floatTime = useRef(0);
  const animTime = useRef(0);

  useFrame((_, delta) => {
    if (!mounted || !initQ.current || !groupRef.current) return;

    // Only start the time calibration animation once the loader has completely opened
    if (isLoaderComplete) {
      animTime.current += delta;
      updateWatchHandsAnimation(animTime.current, { hourHand, minuteHand, secondHand }, initQ.current);
    } else {
      // Hold static 10:10:30 while loading screen is active
      applyHandRotations(START_HOUR, START_MINUTE, START_SECOND, { hourHand, minuteHand, secondHand }, initQ.current);
    }

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
      posY = THREE.MathUtils.lerp(-0.05, -0.35, pSec4);
    }

    // Rotation Mapping
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

// Main Home Page Component
export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [winH, setWinH] = useState(1);
  const [isWatchLoaded, setIsWatchLoaded] = useState(false);
  const [isLoaderComplete, setIsLoaderComplete] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Dynamic Mobile & Viewport Width Detection
  useEffect(() => {
    const handleCheckMobile = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      // Below 1024px is mobile / tablet viewports where 3D editorial layout stacks
      // Above 1024px (including 1280, 1440, 1768x1382, 1920) is full desktop 3D experience
      const isMobileViewport = width < 1024;
      setIsMobile(isMobileViewport);
    };

    handleCheckMobile();
    window.addEventListener('resize', handleCheckMobile);
    return () => window.removeEventListener('resize', handleCheckMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

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

    lenisRef.current = lenis;

    lenis.on('scroll', (e: { scroll: number }) => {
      setScrollY(e.scroll);
    });

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
  }, [isMobile]);

  // Lock scrolling during loading sequence
  useEffect(() => {
    if (!isLoaderComplete && lenisRef.current) {
      lenisRef.current.stop();
    } else if (isLoaderComplete && lenisRef.current) {
      lenisRef.current.start();
    }
  }, [isLoaderComplete]);

  // If mobile device or viewport width < 1024px, show luxury desktop advisory screen
  if (isMobile === true) {
    return <MobileFallbackScreen />;
  }

  const scrollRaw = scrollY / (winH || 1);

  // Synchronized HTML Opacities & Thresholds
  const heroP = smoothstep(0.0, 0.4, scrollRaw);
  const timepieceP = smoothstep(0.6, 1.0, scrollRaw) * (1 - smoothstep(1.4, 1.8, scrollRaw));
  const craftP = smoothstep(1.6, 2.0, scrollRaw) * (1 - smoothstep(2.4, 2.8, scrollRaw));
  const comingSoonP = smoothstep(2.6, 3.0, scrollRaw);

  return (
    <div className="relative w-full" style={{ fontFamily: 'Georgia, serif' }}>

      {/* Official Iris Aperture Loading Screen */}
      <AthenaLoadingScreen
        isWatchLoaded={isWatchLoaded}
        onComplete={() => setIsLoaderComplete(true)}
      />

      {/* Fixed 3D Canvas */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 2.5], fov: 40 }} style={{ position: 'absolute', inset: 0 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[4, 8, 5]} intensity={1.6} color="#FFFFFF" />
          <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#C8D8FF" />
          <pointLight position={[0, 1, 2.5]} intensity={0.8} color="#FFF8F0" />
          <Environment preset="city" />
          <Suspense fallback={null}>
            <WatchModel
              scrollRaw={scrollRaw}
              isLoaderComplete={isLoaderComplete}
              onModelReady={() => setIsWatchLoaded(true)}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Fixed Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-7 mix-blend-difference text-white transition-opacity duration-700 ${isLoaderComplete ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
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
          padding: '0.65rem 1.45rem', paddingTop: '0.75rem', paddingBottom: '0.60rem',
          marginTop: '0.35rem',
          background: 'transparent', cursor: 'pointer', color: 'white'
        }}>Contact</button>
      </header>

      {/* SECTION 1: HERO */}
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

      {/* SECTION 2: THE TIMEPIECE (Watch docked LEFT, Copy on RIGHT) */}
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

      {/* SECTION 3: CRAFTSMANSHIP (Watch docked RIGHT, Copy on LEFT) */}
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

      {/* SECTION 4: COMING SOON */}
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
