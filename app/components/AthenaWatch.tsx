'use client';

import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function AthenaWatch(props: JSX.IntrinsicElements['group']) {
  // Load full scene graph preserving all parent/child transforms & matrix hierarchies
  const { scene } = useGLTF('/models/AthenaWatch.glb');
  const { camera } = useThree();

  // Find hand objects inside the preserved scene graph
  const hourHand = scene.getObjectByName('HandHour');
  const minuteHand = scene.getObjectByName('HandMinute');
  const secondHand = scene.getObjectByName('HandSecond');

  // Auto-fit camera position to watch bounding box
  useEffect(() => {
    if (!scene) return;
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Center model at group origin if needed
    scene.position.sub(center);

    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const fitDist = (maxDim / 2) / Math.tan(fov / 2) * 1.35;
    camera.position.set(0, 0, fitDist);
    camera.near = fitDist / 100;
    camera.far = fitDist * 10;
    camera.updateProjectionMatrix();
  }, [camera, scene]);

  // Live time rotation loop
  useFrame(() => {
    const now = new Date();

    const milliseconds = now.getMilliseconds();
    const seconds = now.getSeconds() + milliseconds / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;

    // Convert values into Radians (Clockwise rotation)
    const secAngle = -((seconds / 60) * Math.PI * 2);
    const minAngle = -((minutes / 60) * Math.PI * 2);
    const hrAngle = -((hours / 12) * Math.PI * 2);

    if (secondHand) secondHand.rotation.z = secAngle;
    if (minuteHand) minuteHand.rotation.z = minAngle;
    if (hourHand) hourHand.rotation.z = hrAngle;
  });

  return (
    <group {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/AthenaWatch.glb');
