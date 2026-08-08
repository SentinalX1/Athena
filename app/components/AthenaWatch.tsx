'use client';

import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function AthenaWatch(props: JSX.IntrinsicElements['group']) {
  const { scene } = useGLTF('/models/AthenaWatch.glb');
  const { camera } = useThree();

  const hourHand = scene.getObjectByName('HandHour');
  const minuteHand = scene.getObjectByName('HandMinute');
  const secondHand = scene.getObjectByName('HandSecond');

  // Initial rotations stored from glTF
  const initialRotations = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    if (!scene) return;

    if (hourHand) initialRotations.current['HandHour'] = hourHand.rotation.z;
    if (minuteHand) initialRotations.current['HandMinute'] = minuteHand.rotation.z;
    if (secondHand) initialRotations.current['HandSecond'] = secondHand.rotation.z;

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    scene.position.sub(center);

    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const fitDist = ((maxDim / 2) / Math.tan(fov / 2)) * 1.35;
    camera.position.set(0, 0, fitDist);
    camera.near = fitDist / 100;
    camera.far = fitDist * 10;
    camera.updateProjectionMatrix();
  }, [camera, scene, hourHand, minuteHand, secondHand]);

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

    if (secondHand) {
      const initZ = initialRotations.current['HandSecond'] || 0;
      secondHand.rotation.z = initZ + secAngle;
    }
    if (minuteHand) {
      const initZ = initialRotations.current['HandMinute'] || 0;
      minuteHand.rotation.z = initZ + minAngle;
    }
    if (hourHand) {
      const initZ = initialRotations.current['HandHour'] || 0;
      hourHand.rotation.z = initZ + hrAngle;
    }
  });

  return (
    <group {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/AthenaWatch.glb');
