import {useCurrentFrame} from 'remotion';
import {COLORS} from '../constants';
import {clampedInterpolate, easedInterpolate} from '../helpers/animation';

type CursorProps = {
  startFrame: number;
  endFrame: number;
  from: {x: number; y: number};
  to: {x: number; y: number};
  clickFrame: number;
  scale?: number;
};

export const Cursor = ({
  startFrame,
  endFrame,
  from,
  to,
  clickFrame,
  scale = 1,
}: CursorProps) => {
  const frame = useCurrentFrame();
  const x = easedInterpolate(frame, [startFrame, endFrame], [from.x, to.x]);
  const y = easedInterpolate(frame, [startFrame, endFrame], [from.y, to.y]);
  const opacity = clampedInterpolate(
    frame,
    [startFrame - 5, startFrame + 3],
    [0, 1],
  );
  const clickDistance = Math.abs(frame - clickFrame);
  const pulse = clampedInterpolate(clickDistance, [0, 8], [1, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        zIndex: 30,
        opacity,
        transform: `translate(-7px, -5px) scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: -19,
          top: -19,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `2px solid ${COLORS.cyan}`,
          opacity: pulse * 0.9,
          transform: `scale(${1 + (1 - pulse) * 0.55})`,
          boxShadow: `0 0 28px ${COLORS.cyan}`,
        }}
      />
      <svg
        width="42"
        height="52"
        viewBox="0 0 42 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{filter: 'drop-shadow(0 7px 8px rgba(0,0,0,0.52))'}}
      >
        <path
          d="M4 3L37 31H22L15 48L4 3Z"
          fill="#F7F9FF"
          stroke="#06162F"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
