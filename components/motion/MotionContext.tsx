'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { resolveIntensity, type Intensity } from '../../lib/motion.ts';

export type { Intensity };

const MotionContext = createContext<Intensity>('full');

export function useMotionIntensity(): Intensity {
  return useContext(MotionContext);
}

export default function MotionProvider({
  siteIntensity,
  children,
}: {
  siteIntensity: Intensity;
  children: React.ReactNode;
}) {
  // Start conservative. The server cannot know the visitor's preference, so
  // rendering as 'full' first would flash motion at someone who asked for none.
  const [prefersReduced, setPrefersReduced] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(query.matches);
    setMounted(true);

    const onChange = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const intensity = mounted
    ? resolveIntensity(siteIntensity, prefersReduced)
    : 'off';

  return (
    <MotionContext.Provider value={intensity}>
      {children}
    </MotionContext.Provider>
  );
}
