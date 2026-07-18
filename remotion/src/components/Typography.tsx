import type {CSSProperties, ReactNode} from 'react';
import {useCurrentFrame} from 'remotion';
import {COLORS, FONT_FAMILY} from '../constants';
import {easedInterpolate} from '../helpers/animation';

type AnimatedTextProps = {
  children: ReactNode;
  startFrame?: number;
  style?: CSSProperties;
};

export const AnimatedText = ({
  children,
  startFrame = 0,
  style,
}: AnimatedTextProps) => {
  const frame = useCurrentFrame();
  const opacity = easedInterpolate(
    frame,
    [startFrame, startFrame + 14],
    [0, 1],
  );
  const translateY = easedInterpolate(
    frame,
    [startFrame, startFrame + 18],
    [28, 0],
  );

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: FONT_FAMILY,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

type SceneTitleProps = {
  children: ReactNode;
  startFrame?: number;
  eyebrow?: string;
  align?: 'left' | 'center';
  style?: CSSProperties;
};

export const SceneTitle = ({
  children,
  startFrame = 4,
  eyebrow = 'PLORO AI',
  align = 'left',
  style,
}: SceneTitleProps) => (
  <div
    style={{
      position: 'absolute',
      top: 166,
      left: 72,
      right: 72,
      textAlign: align,
      zIndex: 20,
      ...style,
    }}
  >
    <AnimatedText
      startFrame={startFrame}
      style={{
        color: COLORS.cyan,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 5,
        marginBottom: 22,
      }}
    >
      {eyebrow}
    </AnimatedText>
    <AnimatedText
      startFrame={startFrame + 4}
      style={{
        color: COLORS.text,
        fontSize: 64,
        lineHeight: 1.02,
        fontWeight: 720,
        letterSpacing: -2.8,
        textShadow: '0 12px 38px rgba(0,0,0,0.5)',
      }}
    >
      {children}
    </AnimatedText>
  </div>
);

export const Caption = ({
  children,
  startFrame = 0,
  style,
}: AnimatedTextProps) => (
  <AnimatedText
    startFrame={startFrame}
    style={{
      color: COLORS.text,
      fontSize: 34,
      lineHeight: 1.2,
      fontWeight: 640,
      letterSpacing: -0.8,
      ...style,
    }}
  >
    {children}
  </AnimatedText>
);
