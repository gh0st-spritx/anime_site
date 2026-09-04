'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMotionIntensity } from './MotionContext.tsx';

let registered = false;

/**
 * Lenis inertia, driven from GSAP's ticker so ScrollTrigger and the smoothing
 * agree on one clock. Two independent RAF loops is the usual cause of scrub
 * jitter.
 *
 * Only mounts at 'full'. At 'reduced' and 'off' the page uses native scrolling
 * and no Lenis instance exists at all.
 */
export default function SmoothScroll() {
  const intensity = useMotionIntensity();

  useEffect(() => {
    if (!registered) {
      gsap.registerPlugin(ScrollTrigger);
      registered = true;
    }

    if (intensity !== 'full') {
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch devices already have native inertia; smoothing it twice
      // feels laggy and eats battery.
      syncTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [intensity]);

  return null;
}
