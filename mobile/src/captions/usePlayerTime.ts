import { useEffect, useState } from 'react';
import type { VideoPlayer } from 'expo-video';

// Reads the player's position every animation frame (or every `intervalMs`) and re-renders only
// the component that calls it. Keep callers small: the whole editor must not re-render at 60 fps.
export function usePlayerTime(player: VideoPlayer, intervalMs?: number) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    let last = -1;
    const read = () => {
      const t = player.currentTime;
      if (t !== last) {
        last = t;
        setTime(t);
      }
    };
    if (intervalMs) {
      const id = setInterval(read, intervalMs);
      return () => clearInterval(id);
    }
    let raf = 0;
    const tick = () => {
      read();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [player, intervalMs]);
  return time;
}

// Looping clock for style thumbnails.
export function useLoopClock(period: number) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      setTime(((Date.now() - start) / 1000) % period);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [period]);
  return time;
}
