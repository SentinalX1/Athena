'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TOTAL_FRAMES, FRAME_PATHS } from '@/lib/constants';
import { KineticFramePlayer } from './KineticFramePlayer';

interface AthenaLoadingScreenProps {
  isWatchLoaded: boolean;
  onComplete: () => void;
}

/**
 * Fullscreen Iris Aperture Loading Screen:
 * - Silently decodes and pre-bakes all 91 frames into GPU ImageBitmap memory on the Caustic Sapphire atmosphere.
 * - Smoothly blooms into the kinetic 27-dot spinner once all bitmaps are in VRAM.
 * - Contracts inward via Iris Aperture reveal when both frames and 3D watch are fully ready.
 */
export function AthenaLoadingScreen({
  isWatchLoaded,
  onComplete,
}: AthenaLoadingScreenProps) {
  const [phase, setPhase] = useState<'preload' | 'spinning' | 'exiting' | 'done'>('preload');
  const [bitmaps, setBitmaps] = useState<(ImageBitmap | null)[]>(
    () => new Array(TOTAL_FRAMES).fill(null)
  );

  const framesReadyRef = useRef(false);
  const watchReadyRef = useRef(false);
  const spinStartTimeRef = useRef(0);

  const tryTriggerExit = () => {
    if (!framesReadyRef.current || !watchReadyRef.current) return;
    const spinElapsed = performance.now() - spinStartTimeRef.current;
    const delay = Math.max(0, 900 - spinElapsed);
    setTimeout(() => {
      setPhase('exiting');
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('athena_loaded', 'true');
        }
        setPhase('done');
        onComplete();
      }, 1150);
    }, delay);
  };

  // Phase 1: Preload all 91 frames into GPU ImageBitmap objects
  useEffect(() => {
    // Check if session is already cached
    if (typeof window !== 'undefined' && sessionStorage.getItem('athena_loaded') === 'true') {
      setPhase('done');
      onComplete();
      return;
    }

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
          if (cancelled || img.naturalWidth <= 0) {
            onFrameReady();
            return;
          }

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

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 2 trigger: watch model is ready => try exit
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
