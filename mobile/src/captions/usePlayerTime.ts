import { useEffect, useState } from 'react';
import type { VideoPlayer } from 'expo-video';

// Reads the player's position every animation frame so caption animations stay smooth.
export function usePlayerTime(player: VideoPlayer) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const t = player.currentTime;
      if (t !== last) {
        last = t;
        setTime(t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [player]);
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
