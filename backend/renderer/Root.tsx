import React from 'react';
import { AbsoluteFill, Composition, OffthreadVideo } from 'remotion';
import type { CaptionStyle, Phrase } from '../../shared/captions';
import { CaptionLayer } from './CaptionLayer';

export type CaptionedProps = {
  videoSrc: string;
  width: number;
  height: number;
  fps: number;
  duration: number; // seconds
  phrases: Phrase[];
  style: CaptionStyle;
};

const Captioned: React.FC<CaptionedProps> = ({ videoSrc, phrases, style }) => (
  <AbsoluteFill style={{ backgroundColor: 'black' }}>
    <OffthreadVideo src={videoSrc} />
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
