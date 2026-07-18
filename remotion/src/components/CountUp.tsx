import type {CSSProperties} from 'react';
import {useCurrentFrame} from 'remotion';
import {FONT_FAMILY} from '../constants';
import {countValue} from '../helpers/animation';

type CountUpProps = {
  from?: number;
  to: number;
  durationInFrames: number;
  startFrame?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: CSSProperties;
};

export const CountUp = ({
  from = 0,
  to,
  durationInFrames,
  startFrame = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  style,
}: CountUpProps) => {
  const frame = useCurrentFrame();
  const value = countValue(
    frame - startFrame,
    durationInFrames,
    from,
    to,
    decimals,
  );

  return (
    <span
      style={{
        fontFamily: FONT_FAMILY,
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      {prefix}
      {value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};
