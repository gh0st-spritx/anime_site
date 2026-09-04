'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The loading screen: an old projector leader counting down while the film's
 * opening clips are actually fetched.
 *
 * It is a real preloader, not a timed animation over an empty cache. The
 * countdown will not reach zero before the clips it is waiting on have
 * downloaded, so the first scroll always scrubs instantly instead of stalling
 * on a cold fetch. Clips are fetched with the same URLs the engine will use,
 * so its own request is served from cache.
 */
export default function FilmLeader({
  preload,
  onDone,
}: {
  preload: string[];
  onDone?: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(3);
  const [gone, setGone] = useState(false);
  const finished = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const started = performance.now();

    async function load() {
      if (preload.length === 0) {
        if (!cancelled) setProgress(1);
        return;
      }

      let done = 0;
      await Promise.all(
        preload.map(async (url) => {
          try {
            // Body must be consumed for the response to land in the HTTP cache.
            const res = await fetch(url, { cache: 'force-cache' });
            await res.blob();
          } catch {
            // A clip that will not load must not trap the visitor on the
            // loader — the film degrades to its still for that scene.
          } finally {
            done += 1;
            if (!cancelled) setProgress(done / preload.length);
          }
        }),
      );
    }

    void load().then(() => {
      if (cancelled || finished.current) return;
      finished.current = true;

      // Hold the leader long enough to read as a countdown rather than a
      // flash, but never longer than it takes to be ready.
      const elapsed = performance.now() - started;
      const minimum = 2400;
      const wait = Math.max(0, minimum - elapsed);
      window.setTimeout(() => {
        if (cancelled) return;
        setGone(true);
        window.setTimeout(() => onDone?.(), 700);
      }, wait);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3 → 2 → 1, paced against real progress so the number means something.
  useEffect(() => {
    const next = progress >= 0.66 ? 1 : progress >= 0.33 ? 2 : 3;
    setCount(next);
  }, [progress]);

  return (
    <div className="leader" data-gone={gone ? 'true' : undefined} aria-hidden={gone}>
      <div className="leader__grain" aria-hidden="true" />

      <div className="leader__reticle" aria-hidden="true">
        <svg viewBox="0 0 200 200" role="presentation">
          <circle className="leader__ring" cx="100" cy="100" r="86" />
          <circle
            className="leader__arc"
            cx="100"
            cy="100"
            r="86"
            style={{
              strokeDasharray: 2 * Math.PI * 86,
              strokeDashoffset: 2 * Math.PI * 86 * (1 - progress),
            }}
          />
          <line x1="100" y1="4" x2="100" y2="196" />
          <line x1="4" y1="100" x2="196" y2="100" />
        </svg>
        <span className="leader__count">{count}</span>
      </div>

      <p className="leader__status" role="status">
        <span className="sr">Loading the film, </span>
        {Math.round(progress * 100)}%
      </p>
    </div>
  );
}
