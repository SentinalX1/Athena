import * as THREE from 'three';
import {
  BAKED_HOUR,
  BAKED_MINUTE,
  BAKED_SECOND,
  START_HOUR,
  START_MINUTE,
  START_SECOND,
  HOLD_DURATION,
  SWEEP_DURATION,
} from './constants';

const _qDelta = new THREE.Quaternion();
const _axis = new THREE.Vector3(0, 0, 1);

export interface HandQuaternions {
  hour: THREE.Quaternion;
  minute: THREE.Quaternion;
  second: THREE.Quaternion;
}

export interface WatchHands {
  hourHand?: THREE.Object3D;
  minuteHand?: THREE.Object3D;
  secondHand?: THREE.Object3D;
}

/**
 * Applies exact target time rotations (hr, min, sec) to watch hand meshes.
 */
export function applyHandRotations(
  hr: number,
  min: number,
  sec: number,
  hands: WatchHands,
  initQuats: HandQuaternions
) {
  if (hands.hourHand) {
    _qDelta.setFromAxisAngle(_axis, -(((hr - BAKED_HOUR) / 12) * Math.PI * 2));
    hands.hourHand.quaternion.multiplyQuaternions(initQuats.hour, _qDelta);
  }
  if (hands.minuteHand) {
    _qDelta.setFromAxisAngle(_axis, -(((min - BAKED_MINUTE) / 60) * Math.PI * 2));
    hands.minuteHand.quaternion.multiplyQuaternions(initQuats.minute, _qDelta);
  }
  if (hands.secondHand) {
    _qDelta.setFromAxisAngle(_axis, -(((sec - BAKED_SECOND) / 60) * Math.PI * 2));
    hands.secondHand.quaternion.multiplyQuaternions(initQuats.second, _qDelta);
  }
}

/**
 * Handles the smooth mechanical sweep animation from 10:10:30 catalog pose
 * into the user's real-time local clock with cubic deceleration.
 */
export function updateWatchHandsAnimation(
  elapsedTime: number,
  hands: WatchHands,
  initQuats: HandQuaternions
) {
  const now = new Date();
  const targetSec = now.getSeconds() + now.getMilliseconds() / 1000;
  const targetMin = now.getMinutes() + targetSec / 60;
  const targetHr = (now.getHours() % 12) + targetMin / 60;

  if (elapsedTime <= HOLD_DURATION) {
    // Hold 10:10:30 catalog pose
    applyHandRotations(START_HOUR, START_MINUTE, START_SECOND, hands, initQuats);
    return;
  }

  const sweepElapsed = elapsedTime - HOLD_DURATION;
  const progress = Math.min(1, sweepElapsed / SWEEP_DURATION);
  const eased = 1 - Math.pow(1 - progress, 3); // Smooth mechanical cubic deceleration

  // Clockwise sweep to target time
  let diffHr = (targetHr - START_HOUR) % 12;
  if (diffHr < 0) diffHr += 12;

  let diffMin = (targetMin - START_MINUTE) % 60;
  if (diffMin < 0) diffMin += 60;

  const currentHr = START_HOUR + diffHr * eased;
  const currentMin = START_MINUTE + diffMin * eased;
  const currentSec = START_SECOND + sweepElapsed;

  applyHandRotations(currentHr, currentMin, currentSec, hands, initQuats);
}
