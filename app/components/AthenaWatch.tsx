'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

// Pre-allocate once — no GC pressure inside useFrame
const _qDelta = new THREE.Quaternion();
const _axis   = new THREE.Vector3(0, 0, 1); // Local Z axis for all hands

type Props = ThreeElements['group'];

export function AthenaWatch(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { scene } = useGLTF('/models/AthenaWatch.glb');
  const { camera } = useThree();

  const hourHand   = scene.getObjectByName('HandHour')   as THREE.Object3D | undefined;
  const minuteHand = scene.getObjectByName('HandMinute') as THREE.Object3D | undefined;
  const secondHand = scene.getObjectByName('HandSecond') as THREE.Object3D | undefined;

  // Capture the PRISTINE initial quaternions in a ref during render,
  // BEFORE useFrame ever has a chance to mutate them.
  const initQ = useRef<{
    hour:   THREE.Quaternion;
    minute: THREE.Quaternion;
    second: THREE.Quaternion;
  } | null>(null);

  // Fill initQ on first render where all three hands are available
  if (!initQ.current && hourHand && minuteHand && secondHand) {
    initQ.current = {
      hour:   hourHand.quaternion.clone(),
      minute: minuteHand.quaternion.clone(),
      second: secondHand.quaternion.clone(),
    };
  }

  // Center model and fit camera — runs once per scene load
  useEffect(() => {
    if (!scene || scene.userData.centered) return;
    const box    = new THREE.Box3().setFromObject(scene);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    scene.position.sub(center);
    scene.userData.centered = true;
    const fov     = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const fitDist = (maxDim / 2) / Math.tan(fov / 2) * 1.35;
    camera.position.set(0, 0, fitDist);
    camera.near = fitDist / 100;
    camera.far  = fitDist * 10;
    camera.updateProjectionMatrix();
  }, [camera, scene]);

  useFrame(() => {
    if (!mounted || !initQ.current) return;

    const now = new Date();

    // Each hand computed INDEPENDENTLY
    const sec = now.getSeconds() + now.getMilliseconds() / 1000;    // 0–60
    const min = now.getMinutes() + sec / 60;                         // 0–60 continuous
    const hr  = (now.getHours() % 12) + now.getMinutes() / 60;      // 0–12

    // Baked pose offsets in Blender (10:10:40)
    const BAKED_HOUR   = 10 + 10 / 60;   // 10:10 (approx 10.1667 hrs)
    const BAKED_MINUTE = 10 + 40 / 60;   // 10 mins 40 secs (approx 10.6667 mins)
    const BAKED_SECOND = 40;             // 40 secs

    const hrAngle  = -(((hr  - BAKED_HOUR)   / 12) * Math.PI * 2);
    const minAngle = -(((min - BAKED_MINUTE) / 60) * Math.PI * 2);
    const secAngle = -(((sec - BAKED_SECOND) / 60) * Math.PI * 2);

    // All hands spin around local Z axis (dial normal axis)
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
    <group {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/AthenaWatch.glb');