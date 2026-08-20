'use client';

import { useState, useEffect } from 'react';
import { DESKTOP_MIN_WIDTH } from './constants';

/**
 * Hook to dynamically detect mobile/tablet viewports and window resizing in real time.
 */
export function useResponsive(breakpoint: number = DESKTOP_MIN_WIDTH) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const handleCheckMobile = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      setIsMobile(width < breakpoint);
    };

    handleCheckMobile();
    window.addEventListener('resize', handleCheckMobile);
    return () => window.removeEventListener('resize', handleCheckMobile);
  }, [breakpoint]);

  return { isMobile };
}
