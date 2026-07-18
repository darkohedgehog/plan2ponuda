import {Easing, interpolate} from 'remotion';

export const clampedInterpolate = (
  value: number,
  inputRange: readonly [number, number],
  outputRange: readonly [number, number],
): number =>
  interpolate(value, [...inputRange], [...outputRange], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const easedInterpolate = (
  value: number,
  inputRange: readonly [number, number],
  outputRange: readonly [number, number],
): number =>
  interpolate(value, [...inputRange], [...outputRange], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const fadeEnvelope = (
  frame: number,
  durationInFrames: number,
  fadeFrames = 10,
): number => {
  const fadeIn = clampedInterpolate(frame, [0, fadeFrames], [0, 1]);
  const fadeOut = clampedInterpolate(
    frame,
    [durationInFrames - fadeFrames, durationInFrames],
    [1, 0],
  );

  return Math.min(fadeIn, fadeOut);
};

export const staggeredProgress = (
  frame: number,
  startFrame: number,
  durationInFrames: number,
): number =>
  clampedInterpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
  );

export const countValue = (
  frame: number,
  durationInFrames: number,
  from: number,
  to: number,
  decimalPlaces = 0,
): number => {
  const value = clampedInterpolate(frame, [0, durationInFrames], [from, to]);
  const precision = 10 ** decimalPlaces;
  return Math.round(value * precision) / precision;
};
