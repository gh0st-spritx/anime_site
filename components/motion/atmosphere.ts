/**
 * One particle system, parameterised per act — not four systems.
 *
 * `drift` is a direction in normalised screen space; `sway` is how much
 * horizontal wander each particle picks up, which is the difference between
 * rain (none) and dust (a lot).
 */
export type Atmosphere = {
  count: number;
  color: [number, number, number];
  size: number;
  /** Screen-space travel per second, x and y. */
  drift: [number, number];
  sway: number;
  opacity: number;
};

const DUST: Atmosphere = {
  count: 220,
  color: [0.65, 0.85, 1.0],
  size: 2.4,
  drift: [0.004, -0.012],
  sway: 0.55,
  opacity: 0.5,
};

export const ATMOSPHERE: Record<string, Atmosphere> = {
  // The room at 2am: dust turning slowly in the monitor light.
  room: DUST,
  pull: { ...DUST, count: 90, opacity: 0.28 },

  // Golden hour by the river: pollen and seed heads, lifting.
  field: {
    count: 260,
    color: [1.0, 0.88, 0.62],
    size: 3.1,
    drift: [0.014, -0.02],
    sway: 0.9,
    opacity: 0.55,
  },

  // The window, the night he got in: fine rain, falling hard and straight.
  signal: {
    count: 420,
    color: [0.6, 0.95, 0.78],
    size: 1.5,
    drift: [-0.01, 0.16],
    sway: 0.05,
    opacity: 0.32,
  },

  classroom: {
    count: 150,
    color: [1.0, 0.82, 0.6],
    size: 2.2,
    drift: [0.006, -0.008],
    sway: 0.5,
    opacity: 0.36,
  },

  // Packets of light travelling between hosts.
  terminal: {
    count: 300,
    color: [0.45, 0.92, 1.0],
    size: 1.9,
    drift: [0.055, 0.0],
    sway: 0.08,
    opacity: 0.42,
  },

  badges: {
    count: 180,
    color: [0.72, 0.6, 1.0],
    size: 2.6,
    drift: [0.0, -0.014],
    sway: 0.4,
    opacity: 0.4,
  },

  workshop: {
    count: 140,
    color: [0.8, 0.9, 1.0],
    size: 2.0,
    drift: [0.004, -0.01],
    sway: 0.45,
    opacity: 0.3,
  },

  arcade: {
    count: 240,
    color: [0.85, 0.6, 1.0],
    size: 2.3,
    drift: [0.02, -0.016],
    sway: 0.6,
    opacity: 0.45,
  },

  // Dawn: motes in the first light through the window.
  return: {
    count: 200,
    color: [1.0, 0.78, 0.6],
    size: 2.8,
    drift: [0.008, -0.006],
    sway: 0.7,
    opacity: 0.5,
  },
};

export const DEFAULT_ATMOSPHERE = DUST;

/** The largest count any act asks for — the buffer is allocated once, to this. */
export const MAX_PARTICLES = Math.max(
  ...Object.values(ATMOSPHERE).map((a) => a.count),
);
