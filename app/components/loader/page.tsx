'use client';

import React, { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 91; // frame_00 to frame_90
const FRAME_DURATION = 30; // 0.03s = 30ms per frame

const FRAME_PATHS = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const padded = String(i).padStart(2, '0');
  return `/Loader/frame_${padded}_delay-0.03s.png`;
});

// 91-Frame Kinetic Player Component
function KineticFramePlayer({ size = 150 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    FRAME_PATHS.forEach((path, index) => {
      const img = new Image();
      img.src = path;
      loadedImages[index] = img;
    });
    imagesRef.current = loadedImages;
  }, []);

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

          const cropSize = Math.min(img.naturalWidth, img.naturalHeight) * 0.48;
          const sx = (img.naturalWidth - cropSize) / 2;
          const sy = (img.naturalHeight - cropSize) / 2;

          ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, cw, ch);

          const imgData = ctx.getImageData(0, 0, cw, ch);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const luminance = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            if (luminance < 25) {
              data[i + 3] = 0;
            } else {
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
  );
}

// Realistic White/Silver Hero Page Behind Loader
function TestWelcomePage() {
  return (
    <div
      className="relative w-full h-full min-h-screen flex flex-col items-center justify-between p-8 select-none font-serif text-zinc-900"
      style={{
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.97) 0%, rgba(228,231,234,0.82) 55%, rgba(212,215,219,1) 100%)',
      }}
    >
      {/* Ghost ATHENA watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          style={{
            fontSize: 'clamp(5rem, 16vw, 18rem)',
            fontWeight: 300,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(155,158,163,0.26)',
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          ATHENA
        </span>
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-6xl flex justify-between items-center px-4 py-4 text-xs tracking-[0.25em] uppercase font-sans">
        <span className="font-bold tracking-[0.3em] text-sm">ATHENA</span>
        <nav className="flex gap-8 text-[11px] text-zinc-700">
          <span>Timepieces</span>
          <span>Craftsmanship</span>
        </nav>
        <span className="px-4 py-1.5 rounded-full border border-zinc-400/40 text-[10px] text-zinc-800">
          Contact
        </span>
      </header>

      {/* Center Welcome Typography */}
      <div className="relative z-10 text-center my-auto flex flex-col items-center max-w-2xl">
        <p className="text-[10px] tracking-[0.4em] uppercase text-zinc-500 font-mono mb-3">
          HAUTE HORLOGERIE / A01
        </p>
        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-zinc-900 mb-4 leading-tight">
          Welcome to Athena
        </h1>
        <p className="text-xs md:text-sm font-sans text-zinc-600 max-w-md leading-relaxed">
          Forged Grade 5 titanium. A mechanical architecture engineered around restraint, precision and permanence.
        </p>
      </div>

      {/* Bottom CTA Button */}
      <div className="relative z-10 mb-8">
        <div className="inline-flex items-center gap-3 bg-white/70 backdrop-blur-md border border-white/90 rounded-full px-7 py-3 text-[11px] tracking-[0.22em] uppercase text-zinc-800 shadow-md font-sans">
          Discover The Collection
          <svg className="w-3 h-3 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Main Transition Orchestrator
export default function LoadingScreenShowcase() {
  const [styleType, setStyleType] = useState<'shutter' | 'dissolve' | 'vault'>('shutter');
  const [isExiting, setIsExiting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Auto trigger reveal after 2.8s on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleTriggerReveal();
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const handleTriggerReveal = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsComplete(true);
    }, 1200); // Transition animation duration
  };

  const handleReplay = (style: 'shutter' | 'dissolve' | 'vault') => {
    setStyleType(style);
    setIsComplete(false);
    setIsExiting(false);

    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsComplete(true);
      }, 1200);
    }, 2500);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#d4d7db] select-none">

      {/* 1. The Real White/Silver Hero Page Behind */}
      <div className="absolute inset-0">
        <TestWelcomePage />
      </div>

      {/* 2. The Loader Overlay System */}
      {!isComplete && (
        <div
          className={`absolute inset-0 z-50 pointer-events-none transition-all duration-1000 ${
            // STYLE 3: Deep Sapphire Optical Dissolve
            styleType === 'dissolve'
              ? isExiting
                ? 'opacity-0 scale-100 blur-sm'
                : 'opacity-100 scale-100 blur-0'
              : ''
          }`}
          style={
            // STYLE 1: Circular Iris Aperture
            styleType === 'shutter'
              ? {
                  clipPath: isExiting ? 'circle(0% at 50% 50%)' : 'circle(150% at 50% 50%)',
                  transition: 'clip-path 1.15s cubic-bezier(0.77, 0, 0.175, 1)',
                }
              : // STYLE 2: Upward Curtain Lift
              styleType === 'vault'
              ? {
                  transform: isExiting ? 'translateY(-100%)' : 'translateY(0%)',
                  transition: 'transform 1.1s cubic-bezier(0.77, 0, 0.175, 1)',
                }
              : {}
          }
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
              style={{
                background: 'radial-gradient(circle at 50% 50%, transparent 32%, rgba(2, 2, 4, 0.88) 100%)',
              }}
            />
          </div>

          {/* Central Dot Cluster with Exit Implosion / Scale */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.7,0,0.3,1)] ${
              isExiting ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
            }`}
          >
            <KineticFramePlayer size={150} />
          </div>
        </div>
      )}

      {/* 3. Interactive Floating Control Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/80 border border-black/10 backdrop-blur-xl shadow-xl">
        <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-600 font-mono pl-1">
          Exit Style:
        </span>
        {[
          { id: 'shutter', label: '1. Iris Aperture' },
          { id: 'vault', label: '2. Upward Curtain' },
          { id: 'dissolve', label: '3. Smooth Dissolve' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleReplay(item.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-[10px] tracking-[0.15em] uppercase font-mono transition-all duration-300 cursor-pointer ${
              styleType === item.id && !isComplete
                ? 'bg-zinc-900 text-white font-semibold shadow-md'
                : 'text-zinc-700 hover:text-black bg-black/5 hover:bg-black/10 border border-black/5'
            }`}
          >
            {item.label}
          </button>
        ))}

        <div className="w-[1px] h-4 bg-zinc-400/40 mx-1" />

        <button
          onClick={() => handleReplay(styleType)}
          className="px-3.5 py-1.5 rounded-full text-[10px] tracking-[0.15em] uppercase font-mono bg-zinc-900 text-white hover:bg-zinc-800 transition-all cursor-pointer"
        >
          ↻ Replay
        </button>
      </div>

    </div>
  );
}