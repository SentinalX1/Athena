'use client';

import React, { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function AthenaWatch(props: JSX.IntrinsicElements['group']) {
  const { scene } = useGLTF('/models/AthenaWatch.glb');
  const { camera } = useThree();

  const hourHand = scene.getObjectByName('HandHour');
  const minuteHand = scene.getObjectByName('HandMinute');
  const secondHand = scene.getObjectByName('HandSecond');

  // 1. Capture pristine initial rotations synchronously during render.
  // Storing them in userData ensures they survive Fast Refresh and Strict Mode.
  useMemo(() => {
    if (!scene) return;
    
    if (hourHand && hourHand.userData.initZ === undefined) {
      hourHand.userData.initZ = hourHand.rotation.z;
    }
    if (minuteHand && minuteHand.userData.initZ === undefined) {
      minuteHand.userData.initZ = minuteHand.rotation.z;
    }
    if (secondHand && secondHand.userData.initZ === undefined) {
      secondHand.userData.initZ = secondHand.rotation.z;
    }
  }, [scene, hourHand, minuteHand, secondHand]);

  useEffect(() => {
    if (!scene) return;

    // 2. Prevent the double-subtraction centering bug (explained below)
    if (!scene.userData.centered) {
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      scene.position.sub(center);
      scene.userData.centered = true; // Mark as centered so it doesn't run twice

      const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
      const fitDist = ((maxDim / 2) / Math.tan(fov / 2)) * 1.35;
      camera.position.set(0, 0, fitDist);
      camera.near = fitDist / 100;
      camera.far = fitDist * 10;
      camera.updateProjectionMatrix();
    }
  }, [camera, scene]);

  useFrame(() => {
    const now = new Date();

    const milliseconds = now.getMilliseconds();
    const seconds = now.getSeconds() + milliseconds / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    // Calculate rotation angles (Clockwise around Z)
    const secAngle = -((seconds / 60) * Math.PI * 2);
    const minAngle = -((minutes / 60) * Math.PI * 2);
    const hrAngle = -((hours / 12) * Math.PI * 2);

    // 3. Add the angle to the pristine baseline stored in userData
    if (secondHand) {
      secondHand.rotation.z = secondHand.userData.initZ + secAngle;
    }
    if (minuteHand) {
      minuteHand.rotation.z = minuteHand.userData.initZ + minAngle;
    }
    if (hourHand) {
      hourHand.rotation.z = hourHand.userData.initZ + hrAngle;
    }
  });

  return (
    <group {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/AthenaWatch.glb');