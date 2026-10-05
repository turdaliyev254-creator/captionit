import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Phrase } from '../../shared/captions';
import type { Trim } from '../../shared/overlays';
import { PANEL_WIDTH, panelLeft, sfxCues, SWEEP, transitionTimes, TransitionSettings } from '../../shared/transitions';

// Glass transition for the export. A panel-sized copy of the video is drawn inside the panel and
// run through an SVG filter: rib-shaped displacement (fluted glass), slight zoom (lens), split
// colour channels (chromatic aberration) and a touch of frosting. The rim and light streaks are CSS.
// Captions are drawn above this layer so they stay readable during a sweep.

const FILTER_ID = 'captionit-glass';
const LENS_ZOOM = 1.06;

function geometry(width: number, height: number) {
  const u = width / 1080; // canvas units, like the caption engine
  const band = Math.round(width * PANEL_WIDTH);
  const period = band / 7;
  const amp = period * 0.45; // rib displacement, px
  const margin = Math.ceil(amp + 12 * u); // source pixels either side the ribs can reach
  return { u, band, period, amp, margin, ca: Math.max(2, 4 * u) };
}

// Displacement map: red ramps 0..1 across every rib (x shift), green stays 0.5 (no y shift).
// Gray outside the panel. Positioned in the filtered element's own box, so ribs travel with it.
function ribMap(w: number, h: number, margin: number, band: number, period: number) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<defs><linearGradient id="r" gradientUnits="userSpaceOnUse" x1="${margin}" x2="${margin + period}" y1="0" y2="0" spreadMethod="repeat">` +
    `<stop offset="0" stop-color="rgb(0,128,0)"/><stop offset="1" stop-color="rgb(255,128,0)"/></linearGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="rgb(128,128,0)"/>` +
    `<rect x="${margin}" width="${band}" height="${h}" fill="url(#r)"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const GlassFilter: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const g = geometry(width, height);
  const w = g.band + 2 * g.margin;
  const channel = (r: number, gr: number, b: number) => `${r} 0 0 0 0  0 ${gr} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }}>
      <defs>
        <filter id={FILTER_ID} x={0} y={0} width={w} height={height} filterUnits="userSpaceOnUse"
          primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage href={ribMap(w, height, g.margin, g.band, g.period)} x={0} y={0} width={w} height={height}
            preserveAspectRatio="none" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={2 * g.amp} xChannelSelector="R" yChannelSelector="G" result="ribs" />
          <feColorMatrix in="ribs" type="matrix" values={channel(1, 0, 0)} result="red" />
          <feOffset in="red" dx={g.ca} result="redShift" />
          <feColorMatrix in="ribs" type="matrix" values={channel(0, 1, 0)} result="green" />
          <feColorMatrix in="ribs" type="matrix" values={channel(0, 0, 1)} result="blue" />
          <feOffset in="blue" dx={-g.ca} result="blueShift" />
          <feComposite in="redShift" in2="green" operator="arithmetic" k2={1} k3={1} result="rg" />
          <feComposite in="rg" in2="blueShift" operator="arithmetic" k2={1} k3={1} result="rgb" />
          <feGaussianBlur in="rgb" stdDeviation={0.7 * g.u} />
        </filter>
      </defs>
    </svg>
  );
};

type PanelProps = { videoSrc: string; trimStartFrame: number; from: number; t0: number };

const Panel: React.FC<PanelProps> = ({ videoSrc, trimStartFrame, from, t0 }) => {
  const frame = useCurrentFrame(); // relative to this sweep's Sequence
  const { fps, width, height } = useVideoConfig();
  const g = geometry(width, height);
  const left = panelLeft([t0], t0 + frame / fps);
  if (left === null) return null;
  const x = left * width;
  const strip = g.band + 2 * g.margin;
  const edge = g.margin + g.ca; // how far the filter can reach
  const clipLeft = Math.max(0, edge - (x - g.margin));
  const clipRight = Math.max(0, x - g.margin + strip - (width - edge));

  return (
    <div style={{ position: 'absolute', left: x, top: 0, width: g.band, height, overflow: 'hidden' }}>
      {/* The strip under the panel plus margins, refracted by the filter. Near the frame edges the
          filter would pull in empty pixels (colour fringes), so that sliver shows the plain video. */}
      <div style={{
        position: 'absolute', left: -g.margin, top: 0, width: strip, height, overflow: 'hidden', filter: `url(#${FILTER_ID})`,
        clipPath: `inset(0 ${clipRight}px 0 ${clipLeft}px)`,
      }}>
        <div style={{
          position: 'absolute', left: g.margin - x, top: 0, width, height,
          transform: `scale(${LENS_ZOOM})`, transformOrigin: `${x + g.band / 2}px 50%`,
        }}>
          <OffthreadVideo src={videoSrc} muted trimBefore={trimStartFrame + from} style={{ width, height }} />
        </div>
      </div>
      {/* Frosting, fresnel glow at the edges, bright rim and two diagonal light streaks. */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(255,255,255,0.05)',
        boxShadow: `inset ${14 * g.u}px 0 ${30 * g.u}px rgba(255,255,255,0.28), inset -${14 * g.u}px 0 ${30 * g.u}px rgba(255,255,255,0.28)`,
        borderLeft: `${3 * g.u}px solid rgba(255,255,255,0.7)`,
        borderRight: `${3 * g.u}px solid rgba(255,255,255,0.7)`,
        backgroundImage:
          'linear-gradient(105deg, transparent 22%, rgba(255,255,255,0.22) 27%, transparent 32%,' +
          ' transparent 38%, rgba(255,255,255,0.12) 40%, transparent 42%)',
      }} />
    </div>
  );
};

type Props = {
  videoSrc: string;
  trim: Trim;
  phrases: Phrase[];
  transition?: TransitionSettings;
  sfx?: Record<string, string>; // file name -> URL, only files present on the server
};

export const GlassLayer: React.FC<Props> = ({ videoSrc, trim, phrases, transition, sfx = {} }) => {
  const { fps, width, height, durationInFrames } = useVideoConfig();
  if (!transition || transition.mode === 'none') return null;
  const times = transitionTimes(phrases, transition.mode, durationInFrames / fps);
  if (!times.length) return null;
  const trimStartFrame = Math.round((trim?.start ?? 0) * fps);
  const sweepFrames = Math.ceil(SWEEP * fps) + 1;

  return (
    <AbsoluteFill>
      <GlassFilter width={width} height={height} />
      {times.map((t0) => {
        const from = Math.round(t0 * fps);
        return (
          <Sequence key={`g${t0}`} from={from} durationInFrames={sweepFrames} layout="none">
            <Panel videoSrc={videoSrc} trimStartFrame={trimStartFrame} from={from} t0={from / fps} />
          </Sequence>
        );
      })}
      {transition.sfx &&
        sfxCues(times).map((c, i) =>
          sfx[c.file] ? (
            <Sequence key={`s${i}`} from={Math.round(c.at * fps)} layout="none">
              <Audio src={sfx[c.file]} volume={c.volume} />
            </Sequence>
          ) : null,
        )}
    </AbsoluteFill>
  );
};
