'use client';

import { useEffect, useRef, useState } from 'react';
import mountScrollWorld, { type ScrollWorldConfig } from './scrub-engine.js';
import FilmLeader from './FilmLeader.tsx';

/**
 * Mounts the scroll-scrubbed film.
 *
 * The engine owns the video chain and the copy over it; this wires it to the
 * database-driven config and holds the leader in front until the opening clips
 * are cached.
 *
 * The whole story is also rendered as plain HTML behind this by the server, so
 * a visitor with no JavaScript — or a search engine — still reads everything.
 * That fallback is hidden only once the film has actually mounted.
 */
export default function ScrollWorld({ config }: { config: ScrollWorldConfig }) {
  const host = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el || mounted.current) return;
    mounted.current = true;

    // Reduced motion: the engine falls back to stills on its own, but there is
    // no reason to hold anyone behind a countdown for a film they will not see.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) setReady(true);

    mountScrollWorld(el, config);
  }, [config]);

  /**
   * Marks the film as mounted so CSS can hide the server-rendered fallback.
   *
   * Kept out of the mount effect deliberately: React StrictMode mounts, cleans
   * up and remounts in development, and the mount guard would skip the second
   * pass — leaving the flag cleared and the fallback story showing under the
   * film. Nothing here needs undoing, so nothing is undone.
   */
  useEffect(() => {
    document.documentElement.dataset.worldMounted = 'true';
  }, []);

  // The opening clips: enough to scroll into the room without stalling.
  const preload = config.sections
    .slice(0, 2)
    .map((s) => s.clip)
    .concat((config.connectors ?? []).slice(0, 1).map((c) => c ?? undefined))
    .filter((u): u is string => Boolean(u));

  return (
    <>
      {!ready && <FilmLeader preload={preload} onDone={() => setReady(true)} />}
      <div ref={host} className="world" />
    </>
  );
}
