'use client';

import React, { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

import { smoothstep } from '@/lib/math';
import { useResponsive } from '@/lib/useResponsive';
import { AthenaLoadingScreen } from '@/app/components/loader/AthenaLoadingScreen';
import { MobileFallbackScreen } from '@/app/components/mobile/MobileFallbackScreen';
import { WatchModel } from '@/app/components/watch/WatchModel';
import { Navbar } from '@/app/components/sections/Navbar';
import { HeroSection } from '@/app/components/sections/HeroSection';
import { TimepieceSection } from '@/app/components/sections/TimepieceSection';
import { CraftsmanshipSection } from '@/app/components/sections/CraftsmanshipSection';
import { ComingSoonSection } from '@/app/components/sections/ComingSoonSection';

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [winH, setWinH] = useState(1);
  const [isWatchLoaded, setIsWatchLoaded] = useState(false);
  const [isLoaderComplete, setIsLoaderComplete] = useState(false);
  const [isSessionCached, setIsSessionCached] = useState(false);
  const [navTarget, setNavTarget] = useState<{ targetScroll: number; timestamp: number } | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Check if the user has already visited in this session — skip loader on reload
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadyLoaded = sessionStorage.getItem('athena_loaded') === 'true';
      if (alreadyLoaded) {
        setIsSessionCached(true);
        setIsLoaderComplete(true);
      }
    }
  }, []);

  // Dynamic responsive detection (< 1024px viewport width)
  const { isMobile } = useResponsive();

  // Lenis Smooth Scroll Engine
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

  // Smooth Lenis navigation handler for Navbar and CTA buttons with direct trajectory coordination
  const handleNavigate = useCallback((target: string) => {
    let targetScrollRaw = 0;
    if (target === '#timepiece') targetScrollRaw = 1.0;
    else if (target === '#craftsmanship') targetScrollRaw = 2.0;
    else if (target === '#coming-soon') targetScrollRaw = 3.0;
    else if (target === '#hero') targetScrollRaw = 0.0;

    setNavTarget({ targetScroll: targetScrollRaw, timestamp: performance.now() });

    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        duration: 1.6,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      const el = document.querySelector(target);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Render mobile/tablet fallback if screen is under 1024px
  if (isMobile === true) {
    return <MobileFallbackScreen />;
  }

  const scrollRaw = scrollY / (winH || 1);

  // Synchronized HTML Opacity Thresholds
  const heroP = smoothstep(0.0, 0.4, scrollRaw);
  const timepieceP = smoothstep(0.6, 1.0, scrollRaw) * (1 - smoothstep(1.4, 1.8, scrollRaw));
  const craftP = smoothstep(1.6, 2.0, scrollRaw) * (1 - smoothstep(2.4, 2.8, scrollRaw));
  const comingSoonP = smoothstep(2.6, 3.0, scrollRaw);

  return (
    <div className="relative w-full" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Official Iris Aperture Loading Screen (Only shown on first visit) */}
      {!isSessionCached && (
        <AthenaLoadingScreen
          isWatchLoaded={isWatchLoaded}
          onComplete={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('athena_loaded', 'true');
            }
            setIsLoaderComplete(true);
          }}
        />
      )}

      {/* Fixed 3D WebGL Canvas */}
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
              navTarget={navTarget}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Fixed Luxury Navigation */}
      <Navbar isVisible={isLoaderComplete} onNavigate={handleNavigate} />

      {/* Section 1: Hero */}
      <HeroSection heroP={heroP} onNavigate={handleNavigate} />

      {/* Section 2: The Timepiece */}
      <TimepieceSection timepieceP={timepieceP} />

      {/* Section 3: Craftsmanship */}
      <CraftsmanshipSection craftP={craftP} />

      {/* Section 4: Coming Soon */}
      <ComingSoonSection comingSoonP={comingSoonP} />

      <style>{`
        @keyframes ctaBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(5px); }
        }
      `}</style>
    </div>
  );
}
