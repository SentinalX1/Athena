'use client';

import React, { useState } from 'react';

/**
 * Mobile and narrow viewport fallback advisory screen.
 */
export function MobileFallbackScreen() {
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
