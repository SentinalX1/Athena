'use client';

import React, { useState, useRef, useEffect } from 'react';
import Lenis from 'lenis';
import { smoothstep } from '@/lib/math';

import { MobileWatchCanvas } from './MobileWatchCanvas';
import { MobileHeader } from './MobileHeader';
import { MobileNavDrawer } from './MobileNavDrawer';
import { MobileInspectOverlay } from './MobileInspectOverlay';
import { MobileHeroSection } from './sections/MobileHeroSection';
import { MobileSpecsSection } from './sections/MobileSpecsSection';
import { MobileCraftsmanshipSection } from './sections/MobileCraftsmanshipSection';
import { MobileComingSoonSection } from './sections/MobileComingSoonSection';

// Mobile View — Orchestrator
// Manages Lenis scroll, inspection state, pointer gestures, and opacity math.

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
  const [navTarget, setNavTarget] = useState<{ targetScroll: number; timestamp: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const velocityY = useRef(0);
  const lastDragY = useRef(0);

  // Lenis Smooth Scroll Engine with scroll restoration across page reloads
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Restore saved scroll position from sessionStorage if present
    const savedScroll = sessionStorage.getItem('athena_mobile_scroll');
    if (savedScroll) {
      const parsed = parseFloat(savedScroll);
      if (!isNaN(parsed) && parsed > 0) {
        el.scrollTop = parsed;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll > 0) {
          setScrollProgress((parsed / maxScroll) * 3.0);
        }
      }
    }

    const lenis = new Lenis({
      wrapper: el,
      content: (el.firstElementChild as HTMLElement) || el,
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.8,
    });

    lenisRef.current = lenis;

    if (savedScroll) {
      const parsed = parseFloat(savedScroll);
      if (!isNaN(parsed) && parsed > 0) {
        lenis.scrollTo(parsed, { immediate: true });
      }
    }

    const onLenisScroll = (e: { scroll: number; limit: number }) => {
      if (isInspecting) return;
      const maxScroll = e.limit || (el.scrollHeight - el.clientHeight);
      if (maxScroll <= 0) return;
      const sp = (e.scroll / maxScroll) * 3.0;
      setScrollProgress(sp);
      sessionStorage.setItem('athena_mobile_scroll', e.scroll.toString());
    };

    lenis.on('scroll', onLenisScroll);

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pause / resume Lenis when entering / exiting inspection
  useEffect(() => {
    if (!lenisRef.current) return;
    isInspecting ? lenisRef.current.stop() : lenisRef.current.start();
  }, [isInspecting]);

  // Scroll handler (fallback for non-Lenis environments)
  const handleScroll = () => {
    if (isInspecting) return;
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;
    const sp = (el.scrollTop / maxScroll) * 3.0;
    setScrollProgress(sp);
    sessionStorage.setItem('athena_mobile_scroll', el.scrollTop.toString());
  };

  // Direct section navigation with smooth coordinated 3D trajectory
  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    setIsInspecting(false);

    let targetScrollRaw = 0;
    if (id === '#timepiece') targetScrollRaw = 1.0;
    else if (id === '#craftsmanship') targetScrollRaw = 2.0;
    else if (id === '#coming-soon') targetScrollRaw = 3.0;
    else if (id === '#hero') targetScrollRaw = 0.0;

    setNavTarget({ targetScroll: targetScrollRaw, timestamp: performance.now() });

    if (lenisRef.current) {
      lenisRef.current.scrollTo(id, {
        duration: 1.4,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      containerRef.current?.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const startInspect = () => {
    setIsInspecting(true);
    setInspectRot({ x: 0, y: 0 });
    setMenuOpen(false);
  };

  const endInspect = () => setIsInspecting(false);

  // Pointer handling for 360° drag-to-rotate
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isInspecting) return;
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    lastDragY.current = e.clientY;
    velocityY.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !isInspecting) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    velocityY.current = dy;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setInspectRot((prev) => ({
      y: prev.y + dx * 0.009,
      x: Math.max(-0.6, Math.min(0.6, prev.x + dy * 0.009)),
    }));
  };

  const handlePointerUp = () => { isDragging.current = false; };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue.includes('@')) return;
    setEmailSubmitted(true);
  };

  // Section reveal opacities (scroll-driven)
  const sp = scrollProgress;
  const heroTextOpacity = Math.max(0, 1 - sp * 3.5);
  const specsOpacity    = smoothstep(0.7, 1.1, sp) * (1 - smoothstep(1.6, 2.0, sp));
  const craftOpacity    = smoothstep(1.7, 2.1, sp) * (1 - smoothstep(2.5, 2.9, sp));
  const vipOpacity      = smoothstep(2.6, 3.0, sp);

  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden select-none bg-[#050507]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Inspection backdrop blur */}
      <div
        className="fixed inset-0 z-[35] pointer-events-none"
        style={{
          backdropFilter:       isInspecting ? 'blur(22px)' : 'none',
          WebkitBackdropFilter: isInspecting ? 'blur(22px)' : 'none',
          background:   isInspecting ? 'rgba(5,5,7,0.72)' : 'transparent',
          opacity:      isInspecting ? 1 : 0,
          transition:   'opacity 0.4s ease, backdrop-filter 0.4s ease, background 0.4s ease',
        }}
      />

      {/* Fixed 3D Canvas & lighting */}
      <MobileWatchCanvas
        scrollProgress={scrollProgress}
        isInspecting={isInspecting}
        inspectRot={inspectRot}
        isLoaderComplete={isLoaderComplete}
        onWatchLoaded={onWatchLoaded}
        navTarget={navTarget}
      />

      {/* Header & navigation drawer */}
      <MobileHeader
        isInspecting={isInspecting}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(!menuOpen)}
        onStartInspect={startInspect}
        onNavigateHome={() => scrollToSection('#hero')}
      />

      <MobileNavDrawer
        isOpen={menuOpen}
        onSelectSection={scrollToSection}
        onStartInspect={startInspect}
      />

      {/* 360° inspection overlay */}
      <MobileInspectOverlay
        isInspecting={isInspecting}
        onEndInspect={endInspect}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Scrollable sections */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative w-full h-full overflow-x-hidden [scrollbar-width:none] overscroll-y-contain"
        style={{
          zIndex:        isInspecting ? 0 : 10,
          overflowY:     isInspecting ? 'hidden' : 'auto',
          pointerEvents: isInspecting ? 'none' : 'auto',
          touchAction:   isInspecting ? 'none'  : 'pan-y',
        }}
      >
        <MobileHeroSection
          heroTextOpacity={heroTextOpacity}
          onStartInspect={startInspect}
          onScrollToSection={scrollToSection}
        />

        <MobileSpecsSection specsOpacity={specsOpacity} />

        <MobileCraftsmanshipSection craftOpacity={craftOpacity} />

        <MobileComingSoonSection
          vipOpacity={vipOpacity}
          emailValue={emailValue}
          emailSubmitted={emailSubmitted}
          onEmailChange={setEmailValue}
          onSubmit={handleSubscribe}
        />
      </div>
    </div>
  );
}
