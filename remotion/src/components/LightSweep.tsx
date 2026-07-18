import {useCurrentFrame} from 'remotion';
import {clampedInterpolate} from '../helpers/animation';

type LightSweepProps = {
  startFrame: number;
  durationInFrames?: number;
};

export const LightSweep = ({
  startFrame,
  durationInFrames = 16,
}: LightSweepProps) => {
  const frame = useCurrentFrame();
  const x = clampedInterpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [-160, 260],
  );
  const active =
    frame >= startFrame && frame <= startFrame + durationInFrames ? 1 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        borderRadius: 'inherit',
        pointerEvents: 'none',
        opacity: active,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          left: `${x}%`,
          width: '38%',
          height: '160%',
          transform: 'skewX(-18deg)',
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
          filter: 'blur(6px)',
        }}
      />
    </div>
  );
};
