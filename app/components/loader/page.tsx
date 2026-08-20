'use client';

import React, { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 91; // frame_00 to frame_90
const FRAME_DURATION = 30; // 0.03s = 30ms per frame

const FRAME_PATHS = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const padded = String(i).padStart(2, '0');
  return `/Loader/frame_${padded}_delay-0.03s.png`;
});

// ─── Polished 91-Frame Sequence Player (True Alpha Transparency) ──────────────
function KineticFramePlayer({ size = 150 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  // 1. Preload all 91 frames into memory
  useEffect(() => {
    let count = 0;
    const loadedImages: HTMLImageElement[] = [];

    FRAME_PATHS.forEach((path, index) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        count++;
        setLoadedCount(count);
      };
      loadedImages[index] = img;
    });

    imagesRef.current = loadedImages;
  }, []);

  // 2. Play the animation loop with centered crop and true black-to-transparent alpha
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let currentFrame = 0;

    const render = (now: number) => {
      const delta = now - lastTime;

      if (delta >= FRAME_DURATION) {
        const framesToAdvance = Math.floor(delta / FRAME_DURATION);
        currentFrame = (currentFrame + framesToAdvance) % TOTAL_FRAMES;
        lastTime = now - (delta % FRAME_DURATION);

        const img = imagesRef.current[currentFrame];
        if (img && img.complete && img.naturalWidth > 0) {
          const cw = canvas.width;
          const ch = canvas.height;
          ctx.clearRect(0, 0, cw, ch);

          // Crop tightly around the central dot cluster from the source image
          // Source images have the dots clustered in the central ~45%
          const cropSize = Math.min(img.naturalWidth, img.naturalHeight) * 0.48;
          const sx = (img.naturalWidth - cropSize) / 2;
          const sy = (img.naturalHeight - cropSize) / 2;

          ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, cw, ch);

          // Convert any black/dark backing pixels to 100% transparent alpha
          // Eliminates ANY rectangular border or box shadow completely
          const imgData = ctx.getImageData(0, 0, cw, ch);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const luminance = (r * 0.299 + g * 0.587 + b * 0.114);

            if (luminance < 25) {
              data[i + 3] = 0; // Pure transparent
            } else {
              // Smooth anti-aliased edge
              data[i + 3] = Math.min(255, (luminance / 220) * 255);
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      {/* Crisp Canvas without any drop-shadow box border */}
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
        className="pointer-events-none block"
      />

      {/* Subtle loader percentage while preloading */}
      {loadedCount < TOTAL_FRAMES && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono text-white/30 tracking-[0.25em]">
            {Math.round((loadedCount / TOTAL_FRAMES) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Polished Loader Screen ─────────────────────────────────────────────
export default function LoadingScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#040407] flex flex-col items-center justify-center select-none font-sans">
      
      {/* ── 1. Caustic Sapphire Background Atmosphere ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft breathing caustic sapphire light ribbons */}
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

        {/* Prismatic Shimmer Sheen */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'conic-gradient(from 180deg at 50% 50%, #040407 0deg, rgba(70,85,110,0.14) 90deg, #040407 180deg, rgba(110,95,75,0.09) 270deg, #040407 360deg)',
            filter: 'blur(50px)',
          }}
        />

        {/* High-Fidelity 35mm Film Grain Overlay */}
        <div
          className="absolute inset-0 opacity-35"
          style={{
            mixBlendMode: 'overlay',
            filter: 'contrast(160%) brightness(105%)',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Deep Edge Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 32%, rgba(2, 2, 4, 0.88) 100%)',
          }}
        />
      </div>

      {/* ── 2. Center Kinetic Dot Matrix ── */}
      <div className="relative z-20 flex flex-col items-center justify-center">
        <KineticFramePlayer size={150} />

      </div>

    </div>
  );
}