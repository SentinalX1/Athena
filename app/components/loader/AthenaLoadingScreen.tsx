'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TOTAL_FRAMES, FRAME_DURATION } from '@/lib/constants';
import { KineticFramePlayer } from './KineticFramePlayer';

interface AthenaLoadingScreenProps {
  isWatchLoaded: boolean;
  onComplete: () => void;
}

/**
 * Fullscreen Iris Aperture Loading Screen:
 * - Plays the 91-frame kinetic dot matrix from a single 200 KB sprite sheet.
 * - Displays Frame 00 instantly on mount (0ms blank screen).
 * - Guarantees at least one complete kinetic cycle before closing so the animation finishes gracefully.
 * - Contracts smoothly via Iris Aperture reveal when the 3D watch is ready in the background.
 */
export function AthenaLoadingScreen({
  isWatchLoaded,
  onComplete,
}: AthenaLoadingScreenProps) {
  const [phase, setPhase] = useState<'active' | 'exiting' | 'done'>('active');

  const startTimeRef = useRef<number>(0);
  const exitTriggeredRef = useRef(false);

  useEffect(() => {
    // Check if session is already cached
    if (typeof window !== 'undefined' && sessionStorage.getItem('athena_loaded') === 'true') {
      setPhase('done');
      onComplete();
      return;
    }

    startTimeRef.current = performance.now();
  }, [onComplete]);

  // Exit trigger: ensure at least 1 full animation cycle (~2.73s) before closing
  useEffect(() => {
    if (!isWatchLoaded || exitTriggeredRef.current || phase !== 'active') return;

    const minCycleDuration = TOTAL_FRAMES * FRAME_DURATION; // 91 * 30ms = 2730ms
    const elapsed = performance.now() - startTimeRef.current;
    const remainingDelay = Math.max(0, minCycleDuration - elapsed);

    exitTriggeredRef.current = true;

    const timer = setTimeout(() => {
      setPhase('exiting');
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('athena_loaded', 'true');
        }
        setPhase('done');
        onComplete();
      }, 1150);
    }, remainingDelay);

    return () => clearTimeout(timer);
  }, [isWatchLoaded, phase, onComplete]);

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
            background:
              'conic-gradient(from 180deg at 50% 50%, #040407 0deg, rgba(70,85,110,0.14) 90deg, #040407 180deg, rgba(110,95,75,0.09) 270deg, #040407 360deg)',
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
          style={{
            background:
              'radial-gradient(circle at 50% 50%, transparent 32%, rgba(2, 2, 4, 0.88) 100%)',
          }}
        />
      </div>

      {/* Center Kinetic Dot Matrix — Clean & Instant */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          phase === 'active'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-75'
        }`}
      >
        <KineticFramePlayer size={150} />
      </div>
    </div>
  );
}
