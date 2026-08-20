'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { smoothstep } from '@/lib/math';
import { START_HOUR, START_MINUTE, START_SECOND } from '@/lib/constants';
import {
  HandQuaternions,
  applyHandRotations,
  updateWatchHandsAnimation,
} from '@/lib/clockEngine';

export type WatchModelProps = ThreeElements['group'] & {
  scrollRaw: number;
  isLoaderComplete: boolean;
  onModelReady?: () => void;
};

export function WatchModel({
  scrollRaw,
  isLoaderComplete,
  onModelReady,
  ...props
}: WatchModelProps) {
  const [mounted, setMounted] = useState(false);

  const { scene } = useGLTF('/models/AthenaWatch.glb');
  const groupRef = useRef<THREE.Group>(null);

  const hourHand = scene.getObjectByName('HandHour') as THREE.Object3D | undefined;
  const minuteHand = scene.getObjectByName('HandMinute') as THREE.Object3D | undefined;
  const secondHand = scene.getObjectByName('HandSecond') as THREE.Object3D | undefined;

  useEffect(() => {
    if (!scene || scene.userData.centered) return;
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.sub(box.getCenter(new THREE.Vector3()));
    scene.userData.centered = true;
  }, [scene]);

  const initQ = useRef<HandQuaternions | null>(null);
  if (!initQ.current && hourHand && minuteHand && secondHand) {
    initQ.current = {
      hour: hourHand.quaternion.clone(),
      minute: minuteHand.quaternion.clone(),
      second: secondHand.quaternion.clone(),
    };
    // Initialize immediately in the 10:10:30 catalog pose
    applyHandRotations(
      START_HOUR,
      START_MINUTE,
      START_SECOND,
      { hourHand, minuteHand, secondHand },
      initQ.current
    );
  }

  useEffect(() => {
    setMounted(true);
    if (initQ.current && hourHand && minuteHand && secondHand) {
      applyHandRotations(
        START_HOUR,
        START_MINUTE,
        START_SECOND,
        { hourHand, minuteHand, secondHand },
        initQ.current
      );
      onModelReady?.();
    }
  }, [hourHand, minuteHand, secondHand, onModelReady]);

  const smoothRaw = useRef(0);
  const floatTime = useRef(0);
  const animTime = useRef(0);

  useFrame((_, delta) => {
    if (!mounted || !initQ.current || !groupRef.current) return;

    // Only start the time calibration animation once the loader has completely opened
    if (isLoaderComplete) {
      animTime.current += delta;
      updateWatchHandsAnimation(
        animTime.current,
        { hourHand, minuteHand, secondHand },
        initQ.current
      );
    } else {
      // Hold static 10:10:30 while loading screen is active
      applyHandRotations(
        START_HOUR,
        START_MINUTE,
        START_SECOND,
        { hourHand, minuteHand, secondHand },
        initQ.current
      );
    }

    // Smooth scroll interpolation
    smoothRaw.current = THREE.MathUtils.lerp(
      smoothRaw.current,
      scrollRaw,
      1 - Math.pow(0.0005, delta)
    );
    const sp = smoothRaw.current;

    floatTime.current += delta;
    const t = floatTime.current;

    // Timeline Progress Keys:
    // 0.0 -> 0.8 : Hero
    // 0.8 -> 1.8 : Section 2 (Timepiece - Watch Left, Text Right)
    // 1.8 -> 2.8 : Section 3 (Craftsmanship - Watch Right, Text Left)
    // 2.8 -> 3.8 : Section 4 (Coming Soon - Watch shrink/fade)

    const pSec2 = smoothstep(0.3, 1.0, sp);
    const pSec3 = smoothstep(1.2, 2.0, sp);
    const pSec4 = smoothstep(2.2, 3.0, sp);

    const idleFloat = Math.sin(t * 0.8) * 0.015 * (1 - pSec2);

    // X Position Target Mapping
    let posX = 0;
    if (sp < 1.0) {
      posX = THREE.MathUtils.lerp(0.0, -0.65, pSec2);
    } else if (sp >= 1.0 && sp < 2.0) {
      posX = THREE.MathUtils.lerp(-0.65, 0.62, pSec3);
    } else {
      posX = THREE.MathUtils.lerp(0.62, 0.0, pSec4);
    }

    // Y Position
    let posY = -0.05 + idleFloat;
    if (sp >= 2.0) {
      posY = THREE.MathUtils.lerp(-0.05, -0.35, pSec4);
    }

    // Rotation Mapping
    const rotX = THREE.MathUtils.lerp(-0.30, -0.20, pSec2);
    let rotY = THREE.MathUtils.lerp(0.0, -0.55, pSec2);
    if (sp >= 1.0) {
      rotY = THREE.MathUtils.lerp(-0.55, 0.65, pSec3);
    }

    // Scale Mapping
    let scale = THREE.MathUtils.lerp(2.75, 1.85, pSec2);
    if (sp >= 2.0) {
      scale = THREE.MathUtils.lerp(1.85, 1.20, pSec4);
    }

    groupRef.current.position.x = posX;
    groupRef.current.position.y = posY;
    groupRef.current.position.z = THREE.MathUtils.lerp(0.0, 0.20, pSec2);

    groupRef.current.rotation.x = rotX;
    groupRef.current.rotation.y = rotY + Math.sin(t * 0.4) * 0.01;
    groupRef.current.rotation.z = THREE.MathUtils.lerp(0.0, -0.05, pSec2);

    groupRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/AthenaWatch.glb');
