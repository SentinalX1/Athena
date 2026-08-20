// 91-Frame Kinetic Loader Configuration
export const TOTAL_FRAMES = 91; // frame_00 to frame_90
export const FRAME_DURATION = 30; // 30ms per frame

export const FRAME_PATHS = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const padded = String(i).padStart(2, '0');
  return `/Loader/frame_${padded}_delay-0.03s.png`;
});

// Watch Hand Calibration Constants
export const BAKED_HOUR = 10 + 10 / 60;
export const BAKED_MINUTE = 10 + 40 / 60;
export const BAKED_SECOND = 40;

export const START_HOUR = 10 + 10 / 60; // 10:10 pose (Hour hand at 10)
export const START_MINUTE = 10;         // 10 minutes mark (Minute hand at 2 o'clock)
export const START_SECOND = 30;         // 30 seconds mark (Second hand at 6 o'clock)

export const HOLD_DURATION = 0.25;  // Hold the 10:10:30 catalog pose for 0.25s after reveal
export const SWEEP_DURATION = 2.10; // Smoothly rotate to user's local time over 2.1s

// Responsive Breakpoints
export const DESKTOP_MIN_WIDTH = 1024;
