'use client';

import React, { useEffect, useRef } from 'react';
import {
  TOTAL_FRAMES,
  FRAME_DURATION,
  SPRITESHEET_PATH,
  SPRITESHEET_COLS,
  SPRITESHEET_FRAME_SIZE,
} from '@/lib/constants';

interface KineticFramePlayerProps {
  size?: number;
}

/**
 * Ultra-fast GPU Sprite Sheet Player:
 * - Renders 91 kinetic frames from a single pre-baked transparent sprite sheet.
 * - Single HTTP request (200 KB) with instant hardware drawImage blitting.
 */
export function KineticFramePlayer({ size = 150 }: KineticFramePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let cancelled = false;

    const img = new Image();
    img.src = SPRITESHEET_PATH;

    const startTime = performance.now();

    const drawFrame = (frameIndex: number) => {
      const col = frameIndex % SPRITESHEET_COLS;
      const row = Math.floor(frameIndex / SPRITESHEET_COLS);
      const sx = col * SPRITESHEET_FRAME_SIZE;
      const sy = row * SPRITESHEET_FRAME_SIZE;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
        sx,
        sy,
        SPRITESHEET_FRAME_SIZE,
        SPRITESHEET_FRAME_SIZE,
        0,
        0,
        canvas.width,
        canvas.height
      );
    };

    const render = (now: number) => {
      if (cancelled) return;

      if (img.complete && img.naturalWidth > 0) {
        const elapsed = now - startTime;
        const currentFrame = Math.floor(elapsed / FRAME_DURATION) % TOTAL_FRAMES;
        drawFrame(currentFrame);
      }

      animId = requestAnimationFrame(render);
    };

    if (img.complete) {
      drawFrame(0);
    } else {
      img.onload = () => {
        if (!cancelled) drawFrame(0);
      };
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={SPRITESHEET_FRAME_SIZE}
      height={SPRITESHEET_FRAME_SIZE}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      className="pointer-events-none block select-none"
    />
  );
}
