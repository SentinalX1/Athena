'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  Float,
} from '@react-three/drei';
import { AthenaWatch } from './AthenaWatch';

function WatchScene() {
  return (
    <>
      {/* Studio Lighting Setup for Metal & Glass Reflections */}
      <ambientLight intensity={1.2} />
      
      {/* Primary Key Light */}
      <directionalLight
        position={[5, 10, 7]}
        intensity={2.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      
      {/* Cool Rim / Back Light */}
      <directionalLight position={[-6, 4, -5]} intensity={1.5} color="#cce0ff" />
      
      {/* Warm Fill Light */}
      <directionalLight position={[0, -4, 5]} intensity={1.0} color="#ffeedd" />

      {/* Side Specular Highlights */}
      <pointLight position={[-4, 2, 3]} intensity={1.2} color="#ffffff" />
      <pointLight position={[4, -2, 3]} intensity={1.2} color="#ffd79e" />

      {/* Contact shadow beneath watch */}
      <ContactShadows
        position={[0, -1.8, 0]}
        opacity={0.6}
        scale={8}
        blur={2}
        far={4}
      />

      {/* Subtle floating motion */}
      <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.08}>
        <Suspense fallback={null}>
          <AthenaWatch
            rotation={[0.2, -0.2, 0]}
            position={[0, 0, 0]}
          />
        </Suspense>
      </Float>

      {/* OrbitControls */}
      <OrbitControls
        enablePan={false}
        minDistance={0.5}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.7}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </>
  );
}

export default function WatchCanvas() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <WatchScene />
    </Canvas>
  );
}
