import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { Overlay, overlayFrame, overlaySize } from '../../shared/overlays';

// Remotion twin of mobile/src/editor/OverlayView.tsx. Overlay times here are on the trimmed timeline.
export const OverlayLayer: React.FC<{ overlays: Overlay[] }> = ({ overlays }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill>
      {overlays.map((o) => {
        const from = Math.round(o.start * fps);
        const duration = Math.max(1, Math.round((o.end - o.start) * fps));
        const a = overlayFrame(o, t);
        const { w, h } = overlaySize(o, width);
        return (
          <Sequence key={o.id} from={from} durationInFrames={duration} layout="none">
            {a && (
              <div
                style={{
                  position: 'absolute',
                  left: o.x * width - w / 2,
                  top: (o.y + a.dy) * height - h / 2,
                  width: w,
                  height: h,
                  opacity: a.opacity,
                  transform: `scale(${a.scale}) rotate(${o.rotation}deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {o.type === 'image' && o.src && <Img src={o.src} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                {o.type === 'video' && o.src && (
                  <OffthreadVideo src={o.src} muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
