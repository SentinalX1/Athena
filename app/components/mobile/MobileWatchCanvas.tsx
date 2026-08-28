'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { MobileWatchScene } from './MobileWatchScene';

interface MobileWatchCanvasProps {
  scrollProgress: number;
  isInspecting: boolean;
  inspectRot: { x: number; y: number };
  isLoaderComplete: boolean;
  onWatchLoaded?: () => void;
}

export function MobileWatchCanvas({
  scrollProgress,
  isInspecting,
  inspectRot,
  isLoaderComplete,
  onWatchLoaded,
}: MobileWatchCanvasProps) {
  return (
    /*
     * IMPORTANT:
     * - zIndex 15 keeps the watch visually ABOVE sections
     * - zIndex 50 during inspection places watch ABOVE the backdrop blur
     * - pointerEvents none allows touch/scroll gestures to pass through
     */
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: isInspecting ? 50 : 15 }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2.5], fov: 46 }}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Studio Horology 5-Point Lighting Rig */}
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 6, 5]}   intensity={2.4} color="#FFFFFF" />
        <directionalLight position={[-4, -1, 3]} intensity={1.4} color="#C8DCFF" />
        <directionalLight position={[0, 7, -2]}  intensity={1.6} color="#FFF4E8" />
        <pointLight       position={[0, 0.5, 3]} intensity={1.8} color="#FFFFFF" />
        <Environment preset="city" />

        <Suspense fallback={null}>
          <MobileWatchScene
            scrollProgress={scrollProgress}
            isInspecting={isInspecting}
            inspectRot={inspectRot}
            isLoaderComplete={isLoaderComplete}
            onModelReady={onWatchLoaded}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
