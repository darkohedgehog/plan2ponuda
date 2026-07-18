import type {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {clampedInterpolate, easedInterpolate} from '../helpers/animation';

type ScreenshotStageProps = {
  asset: string;
  frame: number;
  durationInFrames: number;
  aspectRatio: number;
  width?: number;
  centerY?: number;
  pushFrom?: number;
  pushTo?: number;
  shiftX?: number;
  shiftY?: number;
  foregroundStyle?: CSSProperties;
  children?: ReactNode;
};

export const ScreenshotStage = ({
  asset,
  frame,
  durationInFrames,
  aspectRatio,
  width = 1000,
  centerY = 980,
  pushFrom = 0.985,
  pushTo = 1.025,
  shiftX = 0,
  shiftY = 0,
  foregroundStyle,
  children,
}: ScreenshotStageProps) => {
  const scale = easedInterpolate(
    frame,
    [0, durationInFrames],
    [pushFrom, pushTo],
  );
  const parallax = clampedInterpolate(
    frame,
    [0, durationInFrames],
    [-14, 14],
  );

  return (
    <AbsoluteFill>
      <Img
        src={staticFile(asset)}
        style={{
          position: 'absolute',
          inset: -80,
          width: 1240,
          height: 2080,
          objectFit: 'cover',
          filter: 'blur(54px) saturate(0.9)',
          opacity: 0.48,
          transform: `scale(1.15) translateY(${parallax * -0.3}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(2,6,17,0.82) 0%, rgba(4,15,35,0.64) 46%, rgba(2,6,17,0.9) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: centerY,
          width,
          aspectRatio,
          transform: `translate(-50%, -50%) translate(${shiftX}px, ${shiftY + parallax}px) scale(${scale})`,
          borderRadius: 26,
          overflow: 'hidden',
          background: '#fff',
          boxShadow:
            '0 46px 120px rgba(0,0,0,0.58), 0 0 0 1px rgba(111,203,255,0.35), 0 0 70px rgba(20,99,255,0.2)',
          ...foregroundStyle,
        }}
      >
        <Img
          src={staticFile(asset)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
        {children}
      </div>
    </AbsoluteFill>
  );
};
