'use client';

import { useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMotionIntensity } from './MotionContext.tsx';

export type SceneOptions = {
  /**
   * Hold the act in place while its timeline plays. Implemented with CSS
   * sticky on the track, not ScrollTrigger's `pin` — see Scene.tsx.
   */
  pin?: boolean;
  /** Extra scroll length, in viewport heights, while pinned. */
  track?: number;
  /** Tie progress to scroll position. A number is the catch-up in seconds. */
  scrub?: number | boolean;
  start?: string;
  end?: string;
};

/**
 * Attaches a scroll-scrubbed timeline to one act.
 *
 * Everything is created inside a gsap.context scoped to the scene, so every
 * tween and trigger is reverted on unmount — no orphaned ScrollTriggers when
 * React remounts in development.
 *
 * At 'reduced' the build function is ignored entirely: the act fades in once,
 * with no sticky track and no scrub. At 'off' nothing happens and the act stays
 * in its final, readable state. Neither is a degraded version of the animation
 * — they are their own correct rendering.
 */
export function useSceneTimeline(
  ref: RefObject<HTMLElement | null>,
  build: (timeline: gsap.core.Timeline, scene: HTMLElement) => void,
  options: SceneOptions = {},
): void {
  const intensity = useMotionIntensity();

  useLayoutEffect(() => {
    if (intensity === 'off') return;

    const track = ref.current;
    const scene = track?.firstElementChild;
    if (!track || !(scene instanceof HTMLElement)) return;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      if (intensity === 'reduced') {
        gsap.fromTo(
          scene,
          { autoAlpha: 0.4 },
          {
            autoAlpha: 1,
            duration: 0.5,
            ease: 'none',
            scrollTrigger: {
              trigger: scene,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          },
        );
        return;
      }

      const isPinned = Boolean(options.pin);

      const timeline = gsap.timeline({
        scrollTrigger: {
          // While sticky, the TRACK is what scrolls past; the act stays put.
          trigger: track,
          start: options.start ?? (isPinned ? 'top top' : 'top 78%'),
          end: options.end ?? (isPinned ? 'bottom bottom' : 'bottom 40%'),
          scrub: options.scrub ?? 1,
          invalidateOnRefresh: true,
        },
      });

      build(timeline, scene);
    }, track);

    return () => context.revert();
    // The choreography for an act is static; only intensity can change it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity, ref, options.pin]);
}
