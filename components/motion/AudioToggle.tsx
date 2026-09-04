'use client';

import { useEffect, useRef, useState } from 'react';
import { Ambience } from '../../lib/audio.ts';
import { useActiveAct } from './useActiveAct.ts';

const STORAGE_KEY = 'sh_audio';

/**
 * Opt-in ambient sound.
 *
 * Always silent until the visitor asks for it, whatever the admin setting says
 * — browsers block autoplay, and ambushing someone with sound is worse than a
 * quiet first second. The `audioDefaultOn` setting only decides whether the
 * control invites them; it never starts playback on its own.
 */
export default function AudioToggle({ armed }: { armed: boolean }) {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const ambience = useRef<Ambience | null>(null);
  const actKey = useActiveAct();

  // Only render once mounted, so the button's state matches localStorage
  // rather than flipping after hydration.
  useEffect(() => setReady(true), []);

  /**
   * Restore a previous opt-in.
   *
   * The button is NOT flipped to "on" here: audio cannot legally start without
   * a gesture, and showing "on" over silence would be a lie. Instead the first
   * real interaction resumes what the visitor already chose, once.
   */
  useEffect(() => {
    let wanted = false;
    try {
      wanted = localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      /* private mode */
    }
    if (!wanted) return;

    const resume = () => {
      ambience.current ??= new Ambience();
      ambience.current.start();
      ambience.current.setMuted(false);
      setOn(true);
      detach();
    };
    const detach = () => {
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };

    window.addEventListener('pointerdown', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
    return detach;
  }, []);

  useEffect(() => {
    ambience.current?.setAct(actKey);
  }, [actKey]);

  // Do not keep playing into a tab nobody is looking at.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) ambience.current?.suspend();
      else if (on) ambience.current?.resume();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [on]);

  useEffect(() => () => ambience.current?.dispose(), []);

  function toggle() {
    const next = !on;
    setOn(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* private mode; the toggle still works for this visit */
    }

    if (next) {
      // Constructing the AudioContext here keeps it inside the user gesture.
      ambience.current ??= new Ambience();
      ambience.current.start();
      ambience.current.setAct(actKey);
      ambience.current.setMuted(false);
    } else {
      ambience.current?.setMuted(true);
    }
  }

  if (!ready) return null;

  return (
    <button
      type="button"
      className="audio-toggle"
      data-on={on ? 'true' : 'false'}
      data-armed={armed ? 'true' : undefined}
      onClick={toggle}
      aria-pressed={on}
      title={on ? 'Turn sound off' : 'Turn sound on'}
    >
      <span className="audio-icon" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="sr">
        {on ? 'Turn ambient sound off' : 'Turn ambient sound on'}
      </span>
    </button>
  );
}
