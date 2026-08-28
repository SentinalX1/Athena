'use client';

import { useEffect, useState, useRef } from 'react';
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

export interface WatchPose {
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
}

/**
 * Calculates the exact 3D pose for a given scroll position
 */
export function getPoseForScroll(sp: number, t: number = 0): WatchPose {
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

  return {
    posX,
    posY,
    posZ: THREE.MathUtils.lerp(0.0, 0.20, pSec2),
    rotX,
    rotY: rotY + Math.sin(t * 0.4) * 0.01,
    rotZ: THREE.MathUtils.lerp(0.0, -0.05, pSec2),
    scale,
  };
}

export type WatchModelProps = ThreeElements['group'] & {
  scrollRaw: number;
  isLoaderComplete: boolean;
  onModelReady?: () => void;
  navTarget?: { targetScroll: number; timestamp: number } | null;
};

export function WatchModel({
  scrollRaw,
  isLoaderComplete,
  onModelReady,
  navTarget,
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
  const isFirstFrame = useRef(true);
  const floatTime = useRef(0);
  const animTime = useRef(0);

  // Active pose tracking
  const activePose = useRef<WatchPose>(getPoseForScroll(0, 0));

  // Direct section-to-section navigation state
  const navTransition = useRef<{
    isNavigating: boolean;
    startPose: WatchPose;
    targetScroll: number;
    startTime: number;
    duration: number;
  }>({
    isNavigating: false,
    startPose: { ...activePose.current },
    targetScroll: 0,
    startTime: 0,
    duration: 1600,
  });

  const prevNavTimestamp = useRef(0);
  if (navTarget && navTarget.timestamp !== prevNavTimestamp.current) {
    prevNavTimestamp.current = navTarget.timestamp;
    navTransition.current = {
      isNavigating: true,
      startPose: { ...activePose.current },
      targetScroll: navTarget.targetScroll,
      startTime: performance.now(),
      duration: 1600,
    };
  }

  useFrame((_, delta) => {
    if (!mounted || !initQ.current || !groupRef.current) return;

    // Time calibration animation
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

    let pose: WatchPose;

    // Direct Section-to-Section Navigation Trajectory
    if (navTransition.current.isNavigating) {
      const elapsed = performance.now() - navTransition.current.startTime;
      const progress = Math.min(1, elapsed / navTransition.current.duration);
      const ease = Math.min(1, 1.001 - Math.pow(2, -10 * progress));

      const start = navTransition.current.startPose;
      const target = getPoseForScroll(navTransition.current.targetScroll, t);

      pose = {
        posX: THREE.MathUtils.lerp(start.posX, target.posX, ease),
        posY: THREE.MathUtils.lerp(start.posY, target.posY, ease),
        posZ: THREE.MathUtils.lerp(start.posZ, target.posZ, ease),
        rotX: THREE.MathUtils.lerp(start.rotX, target.rotX, ease),
        rotY: THREE.MathUtils.lerp(start.rotY, target.rotY, ease),
        rotZ: THREE.MathUtils.lerp(start.rotZ, target.rotZ, ease),
        scale: THREE.MathUtils.lerp(start.scale, target.scale, ease),
      };

      smoothRaw.current = THREE.MathUtils.lerp(
        smoothRaw.current,
        navTransition.current.targetScroll,
        ease
      );

      if (progress >= 1) {
        navTransition.current.isNavigating = false;
      }
    } else {
      // Normal continuous scroll tracking
      if (isFirstFrame.current) {
        smoothRaw.current = scrollRaw;
        isFirstFrame.current = false;
      } else {
        smoothRaw.current = THREE.MathUtils.lerp(
          smoothRaw.current,
          scrollRaw,
          1 - Math.pow(0.0005, delta)
        );
      }
      pose = getPoseForScroll(smoothRaw.current, t);
    }

    activePose.current = pose;

    groupRef.current.position.x = pose.posX;
    groupRef.current.position.y = pose.posY;
    groupRef.current.position.z = pose.posZ;

    groupRef.current.rotation.x = pose.rotX;
    groupRef.current.rotation.y = pose.rotY;
    groupRef.current.rotation.z = pose.rotZ;

    groupRef.current.scale.set(pose.scale, pose.scale, pose.scale);
  });

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/AthenaWatch.glb');
