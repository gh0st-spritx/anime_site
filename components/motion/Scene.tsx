'use client';

import { useEffect, useRef, useState } from 'react';
import { useSceneTimeline } from './useSceneTimeline.ts';
import { useMotionIntensity } from './MotionContext.tsx';
import { CHOREOGRAPHY } from './choreography.ts';

/**
 * Attaches an act's choreography without turning the act into a client
 * component. The acts stay server-rendered — this only wraps them and drives
 * the timeline, so the semantic HTML and the no-JS reading are untouched.
 *
 * Pinning is done with CSS `position: sticky` on a taller track, NOT with
 * ScrollTrigger's `pin`. ScrollTrigger pins by wrapping the element in a spacer
 * div it inserts itself, which moves a React-owned node and makes React throw
 * "removeChild: node is not a child of this node" on the next reconcile. With
 * sticky, ScrollTrigger only reads scroll position and never touches the DOM.
 */
export default function Scene({
  actKey,
  children,
}: {
  actKey: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const intensity = useMotionIntensity();
  const choreography = CHOREOGRAPHY[actKey];

  /**
   * A pinned act is exactly one screen tall and must hold all its content.
   * Below roughly 640px — a landscape phone, a short laptop — the densest acts
   * overrun it and the next act bleeds in underneath. There, nothing pins and
   * the page simply scrolls, which is the honest reading rather than a
   * cramped one.
   */
  const [tallEnough, setTallEnough] = useState(true);
  useEffect(() => {
    const query = window.matchMedia('(min-height: 640px)');
    const apply = () => setTallEnough(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  const pinned =
    Boolean(choreography?.options.pin) && intensity === 'full' && tallEnough;
  const track = choreography?.options.track ?? 1;

  useSceneTimeline(
    ref,
    (timeline, scene) => choreography?.build(timeline, scene),
    { ...(choreography?.options ?? {}), pin: pinned },
  );

  return (
    <div
      ref={ref}
      className="scene"
      data-scene={actKey}
      data-pinned={pinned ? 'true' : undefined}
      style={pinned ? ({ '--track': track } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
