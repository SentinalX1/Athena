'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { useGLTF, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Pre-allocated vectors for zero-GC pressure inside useFrame
const _qDelta = new THREE.Quaternion();
const _axis   = new THREE.Vector3(0, 0, 1);

type Props = ThreeElements['group'];

function WatchModel(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { scene } = useGLTF('/models/AthenaWatch.glb');

  const hourHand   = scene.getObjectByName('HandHour')   as THREE.Object3D | undefined;
  const minuteHand = scene.getObjectByName('HandMinute') as THREE.Object3D | undefined;
  const secondHand = scene.getObjectByName('HandSecond') as THREE.Object3D | undefined;

  // Center model origin explicitly on load
  useEffect(() => {
    if (!scene || scene.userData.centered) return;
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    scene.position.sub(center); // Align geometry center to (0,0,0)
    scene.userData.centered = true;
  }, [scene]);

  // Capture pristine initial quaternions before useFrame mutates them
  const initQ = useRef<{
    hour:   THREE.Quaternion;
    minute: THREE.Quaternion;
    second: THREE.Quaternion;
  } | null>(null);

  if (!initQ.current && hourHand && minuteHand && secondHand) {
    initQ.current = {
      hour:   hourHand.quaternion.clone(),
      minute: minuteHand.quaternion.clone(),
      second: secondHand.quaternion.clone(),
    };
  }

  // Exact hand-sync logic with local Z rotation & baked pose compensation
  useFrame(() => {
    if (!mounted || !initQ.current) return;

    const now = new Date();
    const sec = now.getSeconds() + now.getMilliseconds() / 1000;
    const min = now.getMinutes() + sec / 60;
    const hr  = (now.getHours() % 12) + now.getMinutes() / 60;

    // Baked pose offsets in Blender (10:10:40)
    const BAKED_HOUR   = 10 + 10 / 60;
    const BAKED_MINUTE = 10 + 40 / 60;
    const BAKED_SECOND = 40;

    const hrAngle  = -(((hr   - BAKED_HOUR)   / 12) * Math.PI * 2);
    const minAngle = -(((min  - BAKED_MINUTE) / 60) * Math.PI * 2);
    const secAngle = -(((sec  - BAKED_SECOND) / 60) * Math.PI * 2);

    if (hourHand) {
      _qDelta.setFromAxisAngle(_axis, hrAngle);
      hourHand.quaternion.multiplyQuaternions(initQ.current.hour, _qDelta);
    }

    if (minuteHand) {
      _qDelta.setFromAxisAngle(_axis, minAngle);
      minuteHand.quaternion.multiplyQuaternions(initQ.current.minute, _qDelta);
    }

    if (secondHand) {
      _qDelta.setFromAxisAngle(_axis, secAngle);
      secondHand.quaternion.multiplyQuaternions(initQ.current.second, _qDelta);
    }
  });

  return (
    <group {...props} rotation={[0.2, 0, 0]} position={[0, -0.3, 0]} dispose={null}>
      <primitive object={scene} scale={3.5} />
    </group>
  );
}

export default function HeroCrownPortrait() {
  return (
    <section className="relative w-full h-screen bg-gradient-to-b from-[#F8F9FA] via-[#E9ECEF] to-[#DEE2E6] flex flex-col items-center justify-between overflow-hidden select-none">
      
      {/* Background Radial Light Burst */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.95)_0%,_rgba(233,236,239,0)_65%)] pointer-events-none" />

      {/* Fixed Header Navigation */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-8 py-8 flex items-center justify-between text-zinc-800">
        <div className="text-xl font-bold tracking-[0.25em] font-serif">ATHENA</div>
        <nav className="hidden md:flex items-center space-x-10 text-[11px] uppercase tracking-[0.25em] text-zinc-600 font-medium">
          <a href="#timepieces" className="hover:text-black transition">Timepieces</a>
          <a href="#craftsmanship" className="hover:text-black transition">Craftsmanship</a>
          <a href="#heritage" className="hover:text-black transition">Heritage</a>
        </nav>
        <button className="text-[11px] uppercase tracking-[0.2em] border border-zinc-400 px-6 py-2.5 rounded-full hover:bg-black hover:text-white transition">
          Contact
        </button>
      </header>

      {/* Large Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <h1 className="text-[16vw] font-serif font-light text-zinc-300/35 tracking-[0.12em] leading-none text-center uppercase">
          ATHENA
        </h1>
      </div>

      {/* 3D Viewport with Close-up Camera */}
      <div className="absolute inset-0 z-10 w-full h-full">
        <Canvas camera={{ position: [0, 0, 2.5], fov: 40 }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 8, 5]} intensity={1.8} color="#FFFFFF" />
          <directionalLight position={[-5, -2, -2]} intensity={0.5} color="#D1E8FF" />
          <pointLight position={[0, 1, 2]} intensity={1.0} color="#FFF8E7" />

          <Environment preset="city" />

          <Suspense fallback={null}>
            <Float speed={1.0} rotationIntensity={0.05} floatIntensity={0.1}>
              <WatchModel />
            </Float>
          </Suspense>
        </Canvas>
      </div>

      {/* Bottom Frosted CTA Pill */}
      <div className="relative z-20 mb-10">
        <button className="flex items-center gap-3 bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] px-8 py-3.5 rounded-full text-zinc-800 text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-white transition-all">
          <span>Discover The Collection</span>
          <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

    </section>
  );
}

useGLTF.preload('/models/AthenaWatch.glb');