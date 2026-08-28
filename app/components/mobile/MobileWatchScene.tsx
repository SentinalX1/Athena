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

export interface MobileWatchPose {
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
}

/**
 * Calculates the exact 3D pose for a given mobile scroll progress
 */
export function getMobilePoseForScroll(sp: number, t: number = 0): MobileWatchPose {
  const p12 = smoothstep(0.3, 1.0, sp); // Hero → Specs
  const p23 = smoothstep(1.3, 2.0, sp); // Specs → Craft
  const p34 = smoothstep(2.3, 3.0, sp); // Craft → VIP

  const idleFloat = Math.sin(t * 0.85) * 0.012 * (1 - p12);

  // Y Position: watch always inside camera frustum
  let posY = 0.06 + idleFloat;
  if (p12 > 0) {
    posY = THREE.MathUtils.lerp(0.06, 0.26, p12);
  }
  if (p23 > 0) {
    posY = THREE.MathUtils.lerp(0.26, 0.22, p23);
  }
  if (p34 > 0) {
    posY = THREE.MathUtils.lerp(0.22, 0.05, p34);
  }

  // Rotation
  const rotX = THREE.MathUtils.lerp(-0.25, -0.12, p12);

  let rotY = THREE.MathUtils.lerp(0.0, -0.3, p12);
  if (p23 > 0) {
    rotY = THREE.MathUtils.lerp(-0.3, 0.42, p23);
  }
  if (p34 > 0) {
    rotY = THREE.MathUtils.lerp(0.42, 0.0, p34);
  }

  // Scale
  let scale = THREE.MathUtils.lerp(2.1, 1.35, p12);
  if (p34 > 0) {
    scale = THREE.MathUtils.lerp(1.35, 1.0, p34);
  }

  return {
    posX: 0,
    posY,
    posZ: THREE.MathUtils.lerp(0, 0.1, p12),
    rotX,
    rotY: rotY + Math.sin(t * 0.4) * 0.012,
    rotZ: THREE.MathUtils.lerp(0, -0.02, p12),
    scale,
  };
}

export interface MobileWatchSceneProps {
  scrollProgress: number;
  isInspecting: boolean;
  inspectRot: { x: number; y: number };
  isLoaderComplete: boolean;
  onModelReady?: () => void;
  navTarget?: { targetScroll: number; timestamp: number } | null;
}

export function MobileWatchScene({
  scrollProgress,
  isInspecting,
  inspectRot,
  isLoaderComplete,
  onModelReady,
  navTarget,
}: MobileWatchSceneProps) {
  const { scene } = useGLTF('/models/AthenaWatch.glb');
  const groupRef = useRef<THREE.Group>(null);

  const hourHand = scene.getObjectByName('HandHour') as THREE.Object3D | undefined;
  const minuteHand = scene.getObjectByName('HandMinute') as THREE.Object3D | undefined;
  const secondHand = scene.getObjectByName('HandSecond') as THREE.Object3D | undefined;

  // Center model geometry once across all mounts
  React.useEffect(() => {
    if (!scene || scene.userData.centered) return;
    const box = new THREE.Box3().setFromObject(scene);
    scene.position.sub(box.getCenter(new THREE.Vector3()));
    scene.userData.centered = true;
  }, [scene]);

  const initQ = useRef<HandQuaternions | null>(null);
  if (!initQ.current && hourHand && minuteHand && secondHand) {
    if (!hourHand.userData.initialQuaternion) {
      hourHand.userData.initialQuaternion = hourHand.quaternion.clone();
    }
    if (!minuteHand.userData.initialQuaternion) {
      minuteHand.userData.initialQuaternion = minuteHand.quaternion.clone();
    }
    if (!secondHand.userData.initialQuaternion) {
      secondHand.userData.initialQuaternion = secondHand.quaternion.clone();
    }

    initQ.current = {
      hour: hourHand.userData.initialQuaternion.clone(),
      minute: minuteHand.userData.initialQuaternion.clone(),
      second: secondHand.userData.initialQuaternion.clone(),
    };

    // Apply exact 10:10:30 starting catalog pose
    applyHandRotations(
      START_HOUR,
      START_MINUTE,
      START_SECOND,
      { hourHand, minuteHand, secondHand },
      initQ.current
    );
  }

  React.useEffect(() => {
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

  const animTime = useRef(0);
  const smoothProgress = useRef(scrollProgress);
  const isFirstFrame = useRef(true);
  const floatTime = useRef(0);
  const smoothInspectX = useRef(0);
  const smoothInspectY = useRef(0);

  // Active pose tracking initialized to the current scroll progress
  const activePose = useRef<MobileWatchPose>(getMobilePoseForScroll(scrollProgress, 0));

  // Direct section-to-section navigation state
  const navTransition = useRef<{
    isNavigating: boolean;
    startPose: MobileWatchPose;
    targetScroll: number;
    startTime: number;
    duration: number;
  }>({
    isNavigating: false,
    startPose: { ...activePose.current },
    targetScroll: 0,
    startTime: 0,
    duration: 1400,
  });

  const prevNavTimestamp = useRef(0);
  if (navTarget && navTarget.timestamp !== prevNavTimestamp.current) {
    prevNavTimestamp.current = navTarget.timestamp;
    navTransition.current = {
      isNavigating: true,
      startPose: { ...activePose.current },
      targetScroll: navTarget.targetScroll,
      startTime: performance.now(),
      duration: 1400,
    };
  }

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
      navTransition.current.isNavigating = false;
      smoothInspectX.current = THREE.MathUtils.lerp(smoothInspectX.current, inspectRot.x, 0.12);
      smoothInspectY.current = THREE.MathUtils.lerp(smoothInspectY.current, inspectRot.y, 0.12);
      groupRef.current.position.set(0, 0.0, 0);
      groupRef.current.rotation.x = -0.15 + smoothInspectX.current;
      groupRef.current.rotation.y = smoothInspectY.current;
      groupRef.current.rotation.z = 0;
      groupRef.current.scale.setScalar(2.05);
      activePose.current = {
        posX: 0,
        posY: 0,
        posZ: 0,
        rotX: -0.15 + smoothInspectX.current,
        rotY: smoothInspectY.current,
        rotZ: 0,
        scale: 2.05,
      };
      return;
    }

    let pose: MobileWatchPose;

    // Direct Section-to-Section Navigation Trajectory (eliminates zig-zag)
    if (navTransition.current.isNavigating) {
      const elapsed = performance.now() - navTransition.current.startTime;
      const progress = Math.min(1, elapsed / navTransition.current.duration);
      const ease = Math.min(1, 1.001 - Math.pow(2, -10 * progress));

      const start = navTransition.current.startPose;
      const target = getMobilePoseForScroll(navTransition.current.targetScroll, t);

      pose = {
        posX: THREE.MathUtils.lerp(start.posX, target.posX, ease),
        posY: THREE.MathUtils.lerp(start.posY, target.posY, ease),
        posZ: THREE.MathUtils.lerp(start.posZ, target.posZ, ease),
        rotX: THREE.MathUtils.lerp(start.rotX, target.rotX, ease),
        rotY: THREE.MathUtils.lerp(start.rotY, target.rotY, ease),
        rotZ: THREE.MathUtils.lerp(start.rotZ, target.rotZ, ease),
        scale: THREE.MathUtils.lerp(start.scale, target.scale, ease),
      };

      smoothProgress.current = THREE.MathUtils.lerp(
        smoothProgress.current,
        navTransition.current.targetScroll,
        ease
      );

      if (progress >= 1) {
        navTransition.current.isNavigating = false;
      }
    } else {
      // Normal continuous scroll tracking
      if (isFirstFrame.current) {
        smoothProgress.current = scrollProgress;
        isFirstFrame.current = false;
      } else {
        smoothProgress.current = THREE.MathUtils.lerp(
          smoothProgress.current,
          scrollProgress,
          1 - Math.pow(0.001, delta)
        );
      }
      pose = getMobilePoseForScroll(smoothProgress.current, t);
    }

    activePose.current = pose;

    groupRef.current.position.set(pose.posX, pose.posY, pose.posZ);
    groupRef.current.rotation.set(pose.rotX, pose.rotY, pose.rotZ);
    groupRef.current.scale.setScalar(pose.scale);
  });

  return (
    <group ref={groupRef} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}
