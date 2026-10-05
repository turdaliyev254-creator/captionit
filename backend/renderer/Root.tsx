import React from 'react';
import { AbsoluteFill, Composition, OffthreadVideo } from 'remotion';
import type { CaptionStyle, Phrase } from '../../shared/captions';
import type { Overlay, Trim } from '../../shared/overlays';
import type { TransitionSettings } from '../../shared/transitions';
import { CaptionLayer } from './CaptionLayer';
import { GlassLayer } from './GlassLayer';
import { OverlayLayer } from './OverlayLayer';

export type CaptionedProps = {
  videoSrc: string;
  width: number;
  height: number;
  fps: number;
  duration: number; // seconds, after trimming
  trim: Trim; // in source seconds
  phrases: Phrase[]; // on the trimmed timeline
  overlays: Overlay[]; // on the trimmed timeline
  style: CaptionStyle;
  transition?: TransitionSettings;
  sfx?: Record<string, string>; // sound file name -> URL
};

const Captioned: React.FC<CaptionedProps> = ({ videoSrc, fps, trim, phrases, overlays, style, transition, sfx }) => (
  <AbsoluteFill style={{ backgroundColor: 'black' }}>
    <OffthreadVideo
      src={videoSrc}
      trimBefore={Math.round((trim?.start ?? 0) * fps)}
      trimAfter={trim ? Math.round(trim.end * fps) : undefined}
    />
    <OverlayLayer overlays={overlays ?? []} />
    <GlassLayer videoSrc={videoSrc} trim={trim} phrases={phrases} transition={transition} sfx={sfx} />
    <CaptionLayer phrases={phrases} style={style} />
  </AbsoluteFill>
);

export const Root: React.FC = () => (
  <Composition
    id="Captioned"
    component={Captioned as React.FC<any>}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={30}
    defaultProps={{} as CaptionedProps}
    calculateMetadata={({ props }) => {
      const p = props as unknown as CaptionedProps;
      return {
        width: p.width,
        height: p.height,
        fps: p.fps,
        durationInFrames: Math.max(1, Math.round(p.duration * p.fps)),
      };
    }}
  />
);
