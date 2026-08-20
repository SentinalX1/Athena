'use client';

import React, { useEffect, useRef } from 'react';
import { TOTAL_FRAMES, FRAME_DURATION } from '@/lib/constants';

interface KineticFramePlayerProps {
  size?: number;
  bitmaps: (ImageBitmap | null)[];
}

/**
 * GPU-accelerated frame player that renders pre-baked ImageBitmaps
 * with zero main-thread CPU pixel work during playback.
 */
export function KineticFramePlayer({
  size = 150,
  bitmaps,
}: KineticFramePlayerProps) {
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
