'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';

// Dynamically import the Canvas so it never SSRs (Three.js is browser-only)
const WatchCanvas = dynamic(() => import('./components/WatchCanvas'), {
  ssr: false,
});

function LiveClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDate(
        now.toLocaleDateString([], {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="live-clock">
      <span className="clock-time">{time}</span>
      <span className="clock-date">{date}</span>
    </div>
  );
}

export default function ClientPage() {
  return (
    <div className="athena-page">
      {/* ── Background gradient orbs ── */}
      <div className="orb orb-1" aria-hidden />
      <div className="orb orb-2" aria-hidden />
      <div className="orb orb-3" aria-hidden />

      {/* ── Top nav bar ── */}
      <header className="athena-header">
        <div className="brand">
          <span className="brand-letter">A</span>
          <span className="brand-name">THENA</span>
        </div>
        <nav className="nav-links">
          <a href="#collection">Collection</a>
          <a href="#about">Heritage</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      {/* ── Hero layout ── */}
      <main className="athena-hero" id="collection">
        {/* Left info panel */}
        <div className="hero-info">
          <p className="hero-eyebrow">Precision Timepiece</p>
          <h1 className="hero-title">
            Athena
            <br />
            <span className="hero-title-accent">Automatic</span>
          </h1>
          <p className="hero-desc">
            Swiss‑grade movement, hand‑assembled with obsessive precision.
            Every second is tracked to the millisecond — displayed live in
            real‑time 3D.
          </p>

          <LiveClock />

          <div className="hero-cta">
            <button className="btn-primary" id="btn-discover">
              Discover the Watch
            </button>
            <button className="btn-ghost" id="btn-specs">
              View Specs
            </button>
          </div>

          {/* Stat row */}
          <div className="stats-row">
            <div className="stat">
              <span className="stat-val">288</span>
              <span className="stat-label">Parts</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-val">50m</span>
              <span className="stat-label">Water Resist.</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-val">42h</span>
              <span className="stat-label">Power Reserve</span>
            </div>
          </div>
        </div>

        {/* 3-D watch canvas */}
        <div className="canvas-wrapper" aria-label="Interactive 3D watch">
          <Suspense
            fallback={
              <div className="canvas-loader">
                <div className="loader-ring" />
              </div>
            }
          >
            <WatchCanvas />
          </Suspense>
          <p className="canvas-hint">Drag to rotate · Scroll to zoom</p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="athena-footer">
        <span>© {new Date().getFullYear()} Athena Timepieces</span>
        <span className="footer-dot">·</span>
        <span>Crafted with precision</span>
      </footer>
    </div>
  );
}
