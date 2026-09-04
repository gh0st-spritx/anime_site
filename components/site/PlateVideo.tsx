'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotionIntensity } from '../motion/MotionContext.tsx';

/**
 * An act's video loop, loaded only when it is actually worth loading.
 *
 * These clips are megabytes each — the field loop alone is over 6 MB — so
 * `preload="none"` and an IntersectionObserver mean a visitor who never
 * reaches an act never downloads its video, and someone on a phone or asking
 * for reduced motion never downloads any of them. The still plate underneath
 * is the poster, so the scene is complete either way.
 */
export default function PlateVideo({
  mediaId,
  posterId,
}: {
  mediaId: number;
  posterId: number | null;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [near, setNear] = useState(false);
  const intensity = useMotionIntensity();

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 768px)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    // Honour an explicit request to save data.
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const saveData = connection?.saveData === true;

    setAllowed(wide && !coarse && !saveData);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || !allowed || intensity !== 'full') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setNear(entry.isIntersecting);
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: '25% 0px' },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [allowed, intensity]);

  if (!allowed || intensity !== 'full') return null;

  return (
    <video
      ref={ref}
      className="plate-video"
      // Only give it a source once the act is close; before that this is an
      // empty element that costs nothing.
      src={near ? `/api/media/${mediaId}` : undefined}
      poster={posterId ? `/api/media/${posterId}` : undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
