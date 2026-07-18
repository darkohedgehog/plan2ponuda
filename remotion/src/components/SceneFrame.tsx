import type {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLORS} from '../constants';
import {clampedInterpolate, fadeEnvelope} from '../helpers/animation';

type SceneFrameProps = {
  children: ReactNode;
  durationInFrames: number;
  fadeFrames?: number;
  style?: CSSProperties;
};

export const SceneFrame = ({
  children,
  durationInFrames,
  fadeFrames = 8,
  style,
}: SceneFrameProps) => {
  const frame = useCurrentFrame();
  const opacity = fadeEnvelope(frame, durationInFrames, fadeFrames);
  const entranceBlur = clampedInterpolate(frame, [0, fadeFrames], [18, 0]);
  const exitBlur = clampedInterpolate(
    frame,
    [durationInFrames - fadeFrames, durationInFrames],
    [0, 18],
  );

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        background: COLORS.black,
        color: COLORS.text,
        opacity,
        filter: `blur(${Math.max(entranceBlur, exitBlur)}px)`,
        ...style,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 46%, rgba(20,99,255,0.17), transparent 44%), linear-gradient(180deg, #020611 0%, #06162f 52%, #020611 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.16,
          backgroundImage:
            'linear-gradient(rgba(54,215,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(54,215,255,0.08) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 28%, black 72%, transparent 100%)',
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
