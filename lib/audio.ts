/**
 * Procedural ambience.
 *
 * There are no audio files. Every bed is synthesised from one looping noise
 * buffer plus a drone oscillator, shaped by a filter — which means no
 * downloads, no page weight, and no licensing, and an act change is just a
 * filter sweep rather than a crossfade between two streams.
 *
 * ponytail: filtered noise, not sampled field recordings. If real recordings
 * ever matter more than the 0 KB, swap the noise source for buffers here and
 * nothing else changes.
 */

export type Bed = {
  /** Shape of the noise: the difference between wind, rain and room tone. */
  filter: BiquadFilterType;
  frequency: number;
  q: number;
  noiseGain: number;
  /** A low tone under the noise. 0 disables it. */
  droneHz: number;
  droneGain: number;
};

const ROOM: Bed = {
  filter: 'lowpass',
  frequency: 320,
  q: 0.7,
  noiseGain: 0.05,
  droneHz: 56,
  droneGain: 0.035,
};

export const BEDS: Record<string, Bed> = {
  // The room at 2am: fan hum and the faint whine of a monitor.
  room: ROOM,
  pull: { ...ROOM, frequency: 900, noiseGain: 0.07, droneGain: 0.05 },

  // Open field, golden hour: wide moving air, nothing mechanical.
  field: {
    filter: 'bandpass',
    frequency: 620,
    q: 0.4,
    noiseGain: 0.075,
    droneHz: 0,
    droneGain: 0,
  },

  // The window, the night it worked: fine rain on glass.
  signal: {
    filter: 'highpass',
    frequency: 1900,
    q: 0.6,
    noiseGain: 0.055,
    droneHz: 44,
    droneGain: 0.03,
  },

  classroom: {
    filter: 'lowpass',
    frequency: 480,
    q: 0.6,
    noiseGain: 0.04,
    droneHz: 72,
    droneGain: 0.022,
  },

  // Machine room: narrow, electrical, a little cold.
  terminal: {
    filter: 'bandpass',
    frequency: 2400,
    q: 3.2,
    noiseGain: 0.03,
    droneHz: 96,
    droneGain: 0.03,
  },

  badges: {
    filter: 'bandpass',
    frequency: 1500,
    q: 1.6,
    noiseGain: 0.028,
    droneHz: 84,
    droneGain: 0.028,
  },

  workshop: {
    filter: 'lowpass',
    frequency: 700,
    q: 0.7,
    noiseGain: 0.035,
    droneHz: 64,
    droneGain: 0.024,
  },

  arcade: {
    filter: 'bandpass',
    frequency: 1100,
    q: 1.1,
    noiseGain: 0.04,
    droneHz: 110,
    droneGain: 0.03,
  },

  // Dawn: the room again, warmer and quieter, birds implied not sampled.
  return: {
    filter: 'lowpass',
    frequency: 420,
    q: 0.6,
    noiseGain: 0.045,
    droneHz: 52,
    droneGain: 0.03,
  },
};

export const DEFAULT_BED = ROOM;

type Nodes = {
  ctx: AudioContext;
  master: GainNode;
  noiseGain: GainNode;
  filter: BiquadFilterNode;
  drone: OscillatorNode;
  droneGain: GainNode;
};

/** Two seconds of looping pink-ish noise. Cheap, and long enough not to tick. */
function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    // A one-pole lowpass turns white noise into something closer to pink,
    // which sits far better under speech and reads as "air" not "hiss".
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  return buffer;
}

export class Ambience {
  private nodes: Nodes | null = null;
  private current = '';

  /** Must be called from a user gesture — browsers refuse otherwise. */
  start(): void {
    if (this.nodes) {
      void this.nodes.ctx.resume();
      return;
    }

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = DEFAULT_BED.filter;
    filter.frequency.value = DEFAULT_BED.frequency;
    filter.Q.value = DEFAULT_BED.q;
    filter.connect(master);

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = DEFAULT_BED.noiseGain;
    noiseGain.connect(filter);

    const noise = ctx.createBufferSource();
    noise.buffer = makeNoiseBuffer(ctx);
    noise.loop = true;
    noise.connect(noiseGain);
    noise.start();

    const droneGain = ctx.createGain();
    droneGain.gain.value = DEFAULT_BED.droneGain;
    droneGain.connect(master);

    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = DEFAULT_BED.droneHz || 56;
    drone.connect(droneGain);
    drone.start();

    this.nodes = { ctx, master, noiseGain, filter, drone, droneGain };

    // Fade up rather than punching in.
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.2);
  }

  /** Cross-fades to an act's bed over a couple of seconds. */
  setAct(actKey: string): void {
    const n = this.nodes;
    if (!n || actKey === this.current) return;
    this.current = actKey;

    const bed = BEDS[actKey] ?? DEFAULT_BED;
    const t = n.ctx.currentTime;
    const glide = 2.0;

    n.filter.frequency.linearRampToValueAtTime(bed.frequency, t + glide);
    n.filter.Q.linearRampToValueAtTime(bed.q, t + glide);
    n.noiseGain.gain.linearRampToValueAtTime(bed.noiseGain, t + glide);
    n.droneGain.gain.linearRampToValueAtTime(bed.droneGain, t + glide);
    if (bed.droneHz > 0) {
      n.drone.frequency.linearRampToValueAtTime(bed.droneHz, t + glide);
    }

    // Filter type cannot be ramped, so switch it at the midpoint of the glide
    // where the difference is least audible.
    window.setTimeout(() => {
      if (this.nodes && this.current === actKey) {
        this.nodes.filter.type = bed.filter;
      }
    }, (glide / 2) * 1000);
  }

  /** Used by the toggle and by the Page Visibility handler. */
  setMuted(muted: boolean): void {
    const n = this.nodes;
    if (!n) return;
    const t = n.ctx.currentTime;
    n.master.gain.cancelScheduledValues(t);
    n.master.gain.setValueAtTime(n.master.gain.value, t);
    n.master.gain.linearRampToValueAtTime(muted ? 0 : 1, t + 0.45);
  }

  suspend(): void {
    void this.nodes?.ctx.suspend();
  }

  resume(): void {
    void this.nodes?.ctx.resume();
  }

  dispose(): void {
    const n = this.nodes;
    if (!n) return;
    this.nodes = null;
    try {
      n.drone.stop();
      void n.ctx.close();
    } catch {
      /* already torn down */
    }
  }
}
