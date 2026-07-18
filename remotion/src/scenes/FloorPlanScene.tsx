import {useCurrentFrame} from 'remotion';
import {SceneFrame} from '../components/SceneFrame';
import {ScreenshotStage} from '../components/ScreenshotStage';
import {SceneTitle} from '../components/Typography';
import {ASSETS, COLORS, FONT_FAMILY} from '../constants';
import {
  clampedInterpolate,
  easedInterpolate,
  staggeredProgress,
} from '../helpers/animation';

const DURATION = 105;
const ASPECT_RATIO = 1734 / 907;

const ROOMS = [
  {left: 43, top: 44, width: 20, height: 31, start: 42},
  {left: 65, top: 47, width: 11, height: 29, start: 55},
  {left: 43, top: 30, width: 17, height: 15, start: 29},
  {left: 65, top: 30, width: 12, height: 15, start: 34},
] as const;

export const FloorPlanScene = () => {
  const frame = useCurrentFrame();
  const scanTop = easedInterpolate(frame, [17, 83], [27, 80]);
  const scanOpacity =
    clampedInterpolate(frame, [10, 18], [0, 1]) *
    clampedInterpolate(frame, [82, 92], [1, 0]);

  return (
    <SceneFrame durationInFrames={DURATION}>
      <SceneTitle>Upload your floor plan</SceneTitle>
      <ScreenshotStage
        asset={ASSETS.floorPlan}
        frame={frame}
        durationInFrames={DURATION}
        aspectRatio={ASPECT_RATIO}
        width={1020}
        centerY={1015}
        pushFrom={0.985}
        pushTo={1.035}
      >
        <div
          style={{
            position: 'absolute',
            left: '22.2%',
            right: '3.3%',
            top: `${scanTop}%`,
            height: 3,
            opacity: scanOpacity,
            background: COLORS.cyan,
            boxShadow:
              '0 0 8px #fff, 0 0 24px #36d7ff, 0 0 55px rgba(20,99,255,0.95)',
          }}
        />
        {ROOMS.map((room, index) => {
          const progress = staggeredProgress(frame, room.start, 12);
          return (
            <div
              key={`${room.left}-${room.top}`}
              style={{
                position: 'absolute',
                left: `${room.left}%`,
                top: `${room.top}%`,
                width: `${room.width}%`,
                height: `${room.height}%`,
                border: `2px solid ${COLORS.cyan}`,
                borderRadius: 5,
                opacity: progress * 0.9,
                background: 'rgba(20,99,255,0.07)',
                boxShadow:
                  index === 0
                    ? '0 0 26px rgba(54,215,255,0.55)'
                    : '0 0 18px rgba(54,215,255,0.36)',
              }}
            />
          );
        })}
      </ScreenshotStage>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 1375,
          transform: 'translateX(-50%)',
          padding: '14px 24px',
          borderRadius: 999,
          border: '1px solid rgba(54,215,255,0.38)',
          background: 'rgba(4,18,42,0.78)',
          color: COLORS.cyan,
          fontFamily: FONT_FAMILY,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 2.4,
          opacity: clampedInterpolate(frame, [18, 30], [0, 1]),
          boxShadow: '0 14px 42px rgba(0,0,0,0.34)',
        }}
      >
        AI SCAN ACTIVE
      </div>
    </SceneFrame>
  );
};
