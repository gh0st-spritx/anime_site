'use client';

import { useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMotionIntensity } from './MotionContext.tsx';

export type SceneOptions = {
  /** Hold the act in place while its timeline plays. */
  pin?: boolean;
  /** Tie progress to scroll position. A number is the catch-up in seconds. */
  scrub?: number | boolean;
  start?: string;
  end?: string;
};

/**
 * Attaches a scroll-scrubbed timeline to one act.
 *
 * Everything is created inside a gsap.context scoped to `ref`, so every tween
 * and trigger is reverted on unmount — no orphaned ScrollTriggers when React
 * remounts in development.
 *
 * At 'reduced' the build function is ignored entirely: the act simply fades in
 * once, with no pinning and no scrub. At 'off' nothing happens at all and the
 * act stays in its final, readable state. Neither path is a degraded version of
 * the animation — they are their own correct rendering.
 */
export function useSceneTimeline(
  ref: RefObject<HTMLElement | null>,
  build: (timeline: gsap.core.Timeline) => void,
  options: SceneOptions = {},
): void {
  const intensity = useMotionIntensity();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || intensity === 'off') return;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      if (intensity === 'reduced') {
        gsap.fromTo(
          element,
          { autoAlpha: 0.35 },
          {
            autoAlpha: 1,
            duration: 0.5,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          },
        );
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          start: options.start ?? 'top top',
          end: options.end ?? '+=100%',
          scrub: options.scrub ?? 1,
          pin: options.pin ?? false,
          pinSpacing: options.pin ?? false,
          anticipatePin: options.pin ? 1 : 0,
          invalidateOnRefresh: true,
        },
      });

      build(timeline);
    }, element);

    return () => context.revert();
    // `build` is redeclared every render; the act's choreography is static, so
    // re-running on intensity change alone is correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity, ref]);
}

/** Entrance for content that should rise into place without pinning the act. */
export function useSceneReveal(
  ref: RefObject<HTMLElement | null>,
  selector: string,
  options: { y?: number; stagger?: number; start?: string } = {},
): void {
  const intensity = useMotionIntensity();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || intensity === 'off') return;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>(selector, element);
      if (targets.length === 0) return;

      if (intensity === 'reduced') {
        gsap.set(targets, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.from(targets, {
        autoAlpha: 0,
        y: options.y ?? 26,
        duration: 0.85,
        ease: 'power2.out',
        stagger: options.stagger ?? 0.09,
        scrollTrigger: {
          trigger: element,
          start: options.start ?? 'top 72%',
          toggleActions: 'play none none reverse',
        },
      });
    }, element);

    return () => context.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity, ref, selector]);
}
