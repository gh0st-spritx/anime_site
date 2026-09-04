import gsap from 'gsap';
import type { SceneOptions } from './useSceneTimeline.ts';

export type Choreography = {
  options: SceneOptions;
  build: (timeline: gsap.core.Timeline, scene: HTMLElement) => void;
};

/** Scoped query helpers — every selector is relative to the act element. */
const q = (scene: HTMLElement, selector: string) =>
  gsap.utils.toArray<HTMLElement>(selector, scene);
const one = (scene: HTMLElement, selector: string) =>
  scene.querySelector<HTMLElement>(selector);

/**
 * Per-act scroll choreography.
 *
 * Everything here animates FROM a visible resting state, never TO one. If the
 * timeline never runs — reduced motion, no JavaScript, a script error — the act
 * is already in its readable final form. That is what makes the fallbacks real
 * rather than a degraded copy of the animation.
 */
export const CHOREOGRAPHY: Record<string, Choreography> = {
  /* Act 0 — The Room. The camera pushes toward the monitor and the glow takes
     over. The football stays behind, which is the point. */
  room: {
    options: { pin: true, track: 1.3, scrub: 1 },
    build: (tl, scene) => {
      const inner = one(scene, '.act-inner');
      const football = one(scene, '.football');
      const cue = one(scene, '.scroll-cue');

      if (cue) tl.to(cue, { autoAlpha: 0, duration: 0.12 }, 0);

      if (inner) {
        tl.to(
          inner,
          { scale: 1.18, y: -40, transformOrigin: '50% 40%', ease: 'power1.in' },
          0,
        ).to(inner, { autoAlpha: 0, duration: 0.35 }, 0.55);
      }

      // The ball drifts further under the desk as the camera leaves it.
      if (football) {
        tl.to(
          football,
          { y: 60, x: 18, rotate: 24, autoAlpha: 0, ease: 'power1.in' },
          0,
        );
      }

      tl.fromTo(
        scene,
        { '--room-bloom': 0 },
        { '--room-bloom': 1, ease: 'power2.in' },
        0.4,
      );
    },
  },

  /* Act 1 — The Pull. The monitor glow blows past the viewport and becomes the
     sky of Act 2. The shortest act, and the only pure transition. */
  pull: {
    options: { pin: true, track: 0.8, scrub: 0.8 },
    build: (tl, scene) => {
      const bloom = one(scene, '.pull-bloom');
      if (!bloom) return;

      tl.fromTo(
        bloom,
        { scale: 0.55, autoAlpha: 0.5, filter: 'blur(14px)' },
        { scale: 9, autoAlpha: 1, filter: 'blur(0px)', ease: 'power2.in' },
        0,
      );
    },
  },

  /* Act 2 — The Field. A slow lateral camera drift; the copy arrives on that
     drift rather than on a separate trigger, so text and camera read as one
     movement. */
  field: {
    options: { pin: true, track: 1.4, scrub: 1.1 },
    build: (tl, scene) => {
      const quote = one(scene, '.pull-quote');

      // The camera drifts the scenery. Sliding the copy instead pushes it off
      // the left edge on narrow viewports and costs legibility for nothing.
      const layers = q(scene, '.plate-layer');
      layers.forEach((layer, depth) => {
        tl.fromTo(
          layer,
          { xPercent: 4 + depth * 3, scale: 1.08 },
          { xPercent: -(4 + depth * 3), scale: 1.08, ease: 'none' },
          0,
        );
      });

      tl.fromTo(
        q(scene, '.act-kicker, .act-title, .act-body p'),
        { autoAlpha: 0, y: 34 },
        { autoAlpha: 1, y: 0, stagger: 0.12, ease: 'power2.out' },
        0,
      );

      if (quote) {
        tl.fromTo(
          quote,
          { autoAlpha: 0, x: 30 },
          { autoAlpha: 1, x: 0, ease: 'power2.out' },
          0.45,
        );
      }
    },
  },

  /* Act 3 — The Signal. Three beats: the dark, the machine coming up, the link
     going live. The terminal is revealed BY SCROLL POSITION, never by a timer —
     a fake typing animation would keep running while the reader is elsewhere. */
  signal: {
    options: { pin: true, track: 2.2, scrub: 1 },
    build: (tl, scene) => {
      const lines = q(scene, '.terminal-line');
      const terminal = one(scene, '.terminal');
      const quote = one(scene, '.pull-quote');

      tl.fromTo(
        q(scene, '.act-kicker, .act-title'),
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, stagger: 0.1, ease: 'power2.out', duration: 0.4 },
        0,
      );

      tl.fromTo(
        q(scene, '.act-body p'),
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, stagger: 0.18, ease: 'power2.out', duration: 0.5 },
        0.2,
      );

      if (terminal) {
        tl.fromTo(
          terminal,
          { autoAlpha: 0, y: 40 },
          { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.5 },
          0.75,
        );
      }

      if (lines.length) {
        tl.fromTo(
          lines,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            stagger: { each: 0.045, ease: 'none' },
            duration: 0.05,
            ease: 'none',
          },
          0.95,
        );
      }

      // The screen fills with light as the copy turns.
      tl.fromTo(
        scene,
        { '--signal-glow': 0 },
        { '--signal-glow': 1, ease: 'power2.in', duration: 0.6 },
        1.3,
      );

      if (quote) {
        tl.fromTo(
          quote,
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.4 },
          1.7,
        );
      }
    },
  },
};
