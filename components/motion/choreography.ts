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
 * fromTo that skips an empty selection.
 *
 * Several acts legitimately have nothing to animate — no projects yet, no
 * plates until Phase 3 — and GSAP logs "target not found" for every empty
 * tween, on every scroll frame. Guarding here keeps the console usable.
 */
function fromTo(
  tl: gsap.core.Timeline,
  targets: HTMLElement[] | HTMLElement | null,
  from: gsap.TweenVars,
  to: gsap.TweenVars,
  position: number,
): void {
  if (!targets || (Array.isArray(targets) && targets.length === 0)) return;
  tl.fromTo(targets, from, to, position);
}

/**
 * Per-act scroll choreography.
 *
 * Everything here animates FROM a visible resting state, never TO one. If the
 * timeline never runs — reduced motion, no JavaScript, a script error — the act
 * is already in its readable final form. That is what makes the fallbacks real
 * rather than a degraded copy of the animation.
 */

/**
 * Depth parallax for an act's scenery.
 *
 * Layers move at different rates so the scene has real depth rather than a
 * flat pan. `sky` barely moves, `fore` moves most — the same rule a camera
 * obeys. Called by every act that has a plate.
 */
function parallax(
  tl: gsap.core.Timeline,
  scene: HTMLElement,
  amount = 1,
): void {
  const layers = q(scene, '.plate-layer');
  layers.forEach((layer, depth) => {
    const rate = (2 + depth * 3.5) * amount;
    fromTo(
      tl,
      layer,
      { yPercent: rate * 0.6, scale: 1.1 },
      { yPercent: -rate * 0.6, scale: 1.1, ease: 'none' },
      0,
    );
  });
}

export const CHOREOGRAPHY: Record<string, Choreography> = {
  /* Act 0 — The Room. The camera pushes toward the monitor and the glow takes
     over. The football stays behind, which is the point. */
  room: {
    options: { pin: true, track: 1.3, scrub: 1 },
    build: (tl, scene) => {
      parallax(tl, scene);
      const inner = one(scene, '.act-inner');
      const cue = one(scene, '.scroll-cue');

      if (cue) tl.to(cue, { autoAlpha: 0, duration: 0.12 }, 0);

      if (inner) {
        tl.to(
          inner,
          { scale: 1.18, y: -40, transformOrigin: '50% 40%', ease: 'power1.in' },
          0,
        ).to(inner, { autoAlpha: 0, duration: 0.35 }, 0.55);
      }

      fromTo(
        tl,
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

      fromTo(
        tl,
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
        fromTo(
          tl,
          layer,
          { xPercent: 4 + depth * 3, scale: 1.08 },
          { xPercent: -(4 + depth * 3), scale: 1.08, ease: 'none' },
          0,
        );
      });

      fromTo(
        tl,
        q(scene, '.act-kicker, .act-title, .act-body p'),
        { autoAlpha: 0, y: 34 },
        { autoAlpha: 1, y: 0, stagger: 0.12, ease: 'power2.out' },
        0,
      );

      if (quote) {
        fromTo(
          tl,
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
      parallax(tl, scene);
      const lines = q(scene, '.terminal-line');
      const terminal = one(scene, '.terminal');
      const quote = one(scene, '.pull-quote');

      fromTo(
        tl,
        q(scene, '.act-kicker, .act-title'),
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, stagger: 0.1, ease: 'power2.out', duration: 0.4 },
        0,
      );

      fromTo(
        tl,
        q(scene, '.act-body p'),
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, stagger: 0.18, ease: 'power2.out', duration: 0.5 },
        0.2,
      );

      if (terminal) {
        fromTo(
          tl,
          terminal,
          { autoAlpha: 0, y: 40 },
          { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.5 },
          0.75,
        );
      }

      if (lines.length) {
        fromTo(
          tl,
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
      fromTo(
        tl,
        scene,
        { '--signal-glow': 0 },
        { '--signal-glow': 1, ease: 'power2.in', duration: 0.6 },
        1.3,
      );

      if (quote) {
        fromTo(
          tl,
          quote,
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.4 },
          1.7,
        );
      }
    },
  },

  /* Act 4 — The Classroom. A horizontal timeline scrubbed by vertical scroll.
     Three stops: Sundarban College, the admission-exam year, NSU. */
  classroom: {
    options: { pin: true, track: 1.6, scrub: 1 },
    build: (tl, scene) => {
      parallax(tl, scene);
      fromTo(
        tl,
        q(scene, '.act-kicker, .act-title, .act-body p'),
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, stagger: 0.1, ease: 'power2.out', duration: 0.4 },
        0,
      );

      const stops = q(scene, '.timeline li');
      stops.forEach((stop, i) => {
        tl.fromTo(
          stop,
          { autoAlpha: 0, x: -36 },
          { autoAlpha: 1, x: 0, ease: 'power2.out', duration: 0.45 },
          0.45 + i * 0.32,
        );
      });

      // The grade warms through the lamp-lit middle stop, then cools to city.
      tl.fromTo(
        scene,
        { '--classroom-warm': 0 },
        { '--classroom-warm': 1, ease: 'sine.inOut', duration: 0.7 },
        0.4,
      ).to(scene, { '--classroom-warm': 0, ease: 'sine.inOut', duration: 0.7 }, 1.3);
    },
  },

  /* Act 5 — The Terminal. Skill bars fill on scrub. The numbers beside them are
     already in the HTML, so the honest figure survives with motion off. */
  terminal: {
    options: { pin: true, track: 1.5, scrub: 1 },
    build: (tl, scene) => {
      parallax(tl, scene);
      fromTo(
        tl,
        q(scene, '.act-kicker, .act-title, .act-body p'),
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, stagger: 0.09, ease: 'power2.out', duration: 0.4 },
        0,
      );

      const groups = q(scene, '.skills-group');
      groups.forEach((group, gi) => {
        tl.fromTo(
          group,
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.4 },
          0.35 + gi * 0.18,
        );
      });

      const bars = q(scene, '.skill-bar > span');
      fromTo(
        tl,
        bars,
        { scaleX: 0, transformOrigin: '0% 50%' },
        {
          scaleX: 1,
          ease: 'power2.out',
          duration: 0.7,
          stagger: 0.05,
        },
        0.55,
      );
    },
  },

  /* Act 6 — The Badges. Four cards assemble out of scattered fragments. */
  badges: {
    options: { pin: true, track: 1.3, scrub: 1 },
    build: (tl, scene) => {
      parallax(tl, scene);
      fromTo(
        tl,
        q(scene, '.act-kicker, .act-title, .act-body p'),
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, stagger: 0.09, ease: 'power2.out', duration: 0.4 },
        0,
      );

      const cards = q(scene, '.badge');
      cards.forEach((card, i) => {
        const drift = i % 2 === 0 ? -1 : 1;
        tl.fromTo(
          card,
          {
            autoAlpha: 0,
            y: 70,
            x: drift * 40,
            rotateZ: drift * 6,
            scale: 0.9,
          },
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            rotateZ: 0,
            scale: 1,
            ease: 'power3.out',
            duration: 0.6,
          },
          0.4 + i * 0.16,
        );
      });
    },
  },

  /* Act 7 — The Workshop. Pedestals light in sequence. With nothing on them,
     the empty-state line holds the frame — that is the designed state. */
  workshop: {
    options: { pin: true, track: 1.4, scrub: 1 },
    build: (tl, scene) => {
      parallax(tl, scene);
      fromTo(
        tl,
        q(scene, '.act-kicker, .act-title, .act-body p'),
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, stagger: 0.1, ease: 'power2.out', duration: 0.4 },
        0,
      );

      const plinths = q(scene, '.pedestal');
      plinths.forEach((plinth, i) => {
        tl.fromTo(
          plinth,
          { autoAlpha: 0, y: 40 },
          { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.4 },
          0.5 + i * 0.2,
        );
        const glow = plinth.querySelector('.pedestal-glow');
        if (glow) {
          tl.fromTo(
            glow,
            { autoAlpha: 0 },
            { autoAlpha: 1, ease: 'sine.out', duration: 0.5 },
            0.6 + i * 0.2,
          );
        }
      });

      fromTo(
        tl,
        q(scene, '.project'),
        { autoAlpha: 0, y: 40 },
        { autoAlpha: 1, y: 0, stagger: 0.1, ease: 'power2.out', duration: 0.45 },
        0.5,
      );

      fromTo(
        tl,
        q(scene, '.learning li'),
        { autoAlpha: 0, x: -20 },
        { autoAlpha: 1, x: 0, stagger: 0.08, ease: 'power2.out', duration: 0.4 },
        1.15,
      );
    },
  },

  /* Act 7.5 — The Arcade. Cards deal onto the shelf. */
  arcade: {
    options: { pin: true, track: 1.3, scrub: 1 },
    build: (tl, scene) => {
      parallax(tl, scene);
      fromTo(
        tl,
        q(scene, '.act-kicker, .act-title, .act-body p'),
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, stagger: 0.09, ease: 'power2.out', duration: 0.4 },
        0,
      );

      fromTo(
        tl,
        q(scene, '.game'),
        { autoAlpha: 0, y: 56, rotateZ: -4 },
        {
          autoAlpha: 1,
          y: 0,
          rotateZ: 0,
          ease: 'power3.out',
          duration: 0.5,
          stagger: 0.07,
        },
        0.4,
      );
    },
  },

  /* Act 8 — The Return. The room again at dawn. The football is on the desk.
     This is the payoff, so the entrance is unhurried and the contacts resolve
     last. */
  return: {
    options: { pin: true, track: 1.5, scrub: 1 },
    build: (tl, scene) => {
      parallax(tl, scene);
      fromTo(
        tl,
        q(scene, '.act-kicker, .act-title'),
        { autoAlpha: 0, y: 34 },
        { autoAlpha: 1, y: 0, stagger: 0.12, ease: 'power2.out', duration: 0.5 },
        0,
      );

      fromTo(
        tl,
        q(scene, '.act-body p'),
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.5 },
        0.35,
      );

      fromTo(
        tl,
        q(scene, '.contact'),
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, stagger: 0.08, ease: 'power2.out', duration: 0.4 },
        1.0,
      );

      fromTo(
        tl,
        q(scene, '.site-footer'),
        { autoAlpha: 0 },
        { autoAlpha: 1, ease: 'none', duration: 0.4 },
        1.4,
      );
    },
  },
};
