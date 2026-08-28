'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { START_HOUR, START_MINUTE, START_SECOND } from '@/lib/constants';
import {
  HandQuaternions,
  applyHandRotations,
  updateWatchHandsAnimation,
} from '@/lib/clockEngine';
import { smoothstep } from '@/lib/math';

export interface MobileWatchSceneProps {
  scrollProgress: number;
  isInspecting: boolean;
  inspectRot: { x: number; y: number };
  isLoaderComplete: boolean;
  onModelReady?: () => void;
}

export function MobileWatchScene({
  scrollProgress,
  isInspecting,
  inspectRot,
  isLoaderComplete,
  onModelReady,
}: MobileWatchSceneProps) {
  const { scene } = useGLTF('/models/AthenaWatch.glb');
  const groupRef = useRef<THREE.Group>(null);

  const hourHand = scene.getObjectByName('HandHour') as THREE.Object3D | undefined;
  const minuteHand = scene.getObjectByName('HandMinute') as THREE.Object3D | undefined;
  const secondHand = scene.getObjectByName('HandSecond') as THREE.Object3D | undefined;

  // Center model geometry once
  const centeredRef = useRef(false);
  if (!centeredRef.current && scene) {
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.sub(box.getCenter(new THREE.Vector3()));
    centeredRef.current = true;
  }

  const initQ = useRef<HandQuaternions | null>(null);
  if (!initQ.current && hourHand && minuteHand && secondHand) {
    initQ.current = {
      hour: hourHand.quaternion.clone(),
      minute: minuteHand.quaternion.clone(),
      second: secondHand.quaternion.clone(),
    };
    applyHandRotations(
      START_HOUR,
      START_MINUTE,
      START_SECOND,
      { hourHand, minuteHand, secondHand },
      initQ.current
    );
    onModelReady?.();
  }

  const animTime = useRef(0);
  const smoothProgress = useRef(0);
  const floatTime = useRef(0);
  const smoothInspectX = useRef(0);
  const smoothInspectY = useRef(0);

  useFrame((_, delta) => {
    if (!initQ.current || !groupRef.current) return;

    // Watch hand animation
    if (isLoaderComplete) {
      animTime.current += delta;
      updateWatchHandsAnimation(
        animTime.current,
        { hourHand, minuteHand, secondHand },
        initQ.current
      );
    } else {
      applyHandRotations(
        START_HOUR,
        START_MINUTE,
        START_SECOND,
        { hourHand, minuteHand, secondHand },
        initQ.current
      );
    }

    floatTime.current += delta;
    const t = floatTime.current;

    // 360° Tactile Inspection Mode
    if (isInspecting) {
      smoothInspectX.current = THREE.MathUtils.lerp(smoothInspectX.current, inspectRot.x, 0.12);
      smoothInspectY.current = THREE.MathUtils.lerp(smoothInspectY.current, inspectRot.y, 0.12);
      groupRef.current.position.set(0, 0.0, 0);
      groupRef.current.rotation.x = -0.15 + smoothInspectX.current;
      groupRef.current.rotation.y = smoothInspectY.current;
      groupRef.current.rotation.z = 0;
      groupRef.current.scale.setScalar(2.05);
      return;
    }

    // Scroll-driven Choreography
    smoothProgress.current = THREE.MathUtils.lerp(
      smoothProgress.current,
      scrollProgress,
      1 - Math.pow(0.001, delta)
    );

    const sp = smoothProgress.current;

    // Transition weights per section
    const p12 = smoothstep(0.3, 1.0, sp);   // Hero → Specs
    const p23 = smoothstep(1.3, 2.0, sp);   // Specs → Craft
    const p34 = smoothstep(2.3, 3.0, sp);   // Craft → VIP

    const idleFloat = Math.sin(t * 0.85) * 0.012 * (1 - p12);

    // Y Position: watch always inside camera frustum
    let posY = 0.06 + idleFloat;
    if (p12 > 0) posY = THREE.MathUtils.lerp(0.06, 0.26, p12);
    if (p23 > 0) posY = THREE.MathUtils.lerp(0.26, 0.22, p23);
    if (p34 > 0) posY = THREE.MathUtils.lerp(0.22, 0.05, p34);

    // Rotation
    const rotX = THREE.MathUtils.lerp(-0.25, -0.12, p12);
    let rotY = THREE.MathUtils.lerp(0.0, -0.30, p12);
    if (p23 > 0) rotY = THREE.MathUtils.lerp(-0.30, 0.42, p23);
    if (p34 > 0) rotY = THREE.MathUtils.lerp(0.42, 0.0, p34);

    // Scale
    let scale = THREE.MathUtils.lerp(2.1, 1.35, p12);
    if (p34 > 0) scale = THREE.MathUtils.lerp(1.35, 1.0, p34);

    groupRef.current.position.set(0, posY, THREE.MathUtils.lerp(0, 0.1, p12));
    groupRef.current.rotation.set(
      rotX,
      rotY + Math.sin(t * 0.4) * 0.012,
      THREE.MathUtils.lerp(0, -0.02, p12)
    );
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}
