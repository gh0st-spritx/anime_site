export type Intensity = 'full' | 'reduced' | 'off';

const RANK: Record<Intensity, number> = { full: 2, reduced: 1, off: 0 };

/**
 * The effective motion level is the MORE CONSERVATIVE of the site setting and
 * the visitor's own `prefers-reduced-motion`.
 *
 * A visitor asking for reduced motion always wins: the admin setting can only
 * reduce further, never escalate past what someone's system asked for.
 *
 * Pure policy, kept out of the component so it can be tested directly.
 */
export function resolveIntensity(
  site: Intensity,
  prefersReduced: boolean,
): Intensity {
  const ceiling: Intensity = prefersReduced ? 'reduced' : 'full';
  return RANK[site] <= RANK[ceiling] ? site : ceiling;
}

export function isIntensity(value: string): value is Intensity {
  return value === 'full' || value === 'reduced' || value === 'off';
}
