'use client';

import { useEffect, useState } from 'react';

/**
 * The act currently filling most of the viewport.
 *
 * IntersectionObserver rather than a scroll handler: it does not run on every
 * frame, and it stays correct while acts are sticky-pinned.
 */
export function useActiveAct(): string {
  const [active, setActive] = useState('room');

  useEffect(() => {
    const acts = document.querySelectorAll<HTMLElement>('.act[data-act]');
    if (acts.length === 0) return;

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.act;
          if (key) ratios.set(key, entry.intersectionRatio);
        }

        let best = '';
        let bestRatio = 0;
        for (const [key, ratio] of ratios) {
          if (ratio > bestRatio) {
            best = key;
            bestRatio = ratio;
          }
        }
        if (best) setActive(best);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    acts.forEach((act) => observer.observe(act));
    return () => observer.disconnect();
  }, []);

  return active;
}
