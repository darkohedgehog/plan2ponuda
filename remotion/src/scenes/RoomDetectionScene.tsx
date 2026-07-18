import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Cursor} from '../components/Cursor';
import {SceneFrame} from '../components/SceneFrame';
import {ScreenshotStage} from '../components/ScreenshotStage';
import {SceneTitle} from '../components/Typography';
import {ASSETS, COLORS, FONT_FAMILY} from '../constants';
import {clampedInterpolate} from '../helpers/animation';

const DURATION = 120;
const ASPECT_RATIO = 1733 / 908;
const ROOM_NAMES = ['Living Room', 'Bedroom', 'Bathroom', 'Kitchen'] as const;

export const RoomDetectionScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <SceneFrame durationInFrames={DURATION}>
      <SceneTitle style={{top: 142}}>
        AI detects every room
        <br />
        automatically
      </SceneTitle>
      <ScreenshotStage
        asset={ASSETS.roomDetection}
        frame={frame}
        durationInFrames={DURATION}
        aspectRatio={ASPECT_RATIO}
        width={1020}
        centerY={960}
        pushFrom={0.99}
        pushTo={1.025}
      >
        <div
          style={{
            position: 'absolute',
            left: '59.7%',
            top: '43.8%',
            width: '36.1%',
            height: '7.4%',
            borderRadius: 7,
            border: `3px solid ${COLORS.cyan}`,
            opacity: clampedInterpolate(frame, [22, 35], [0, 1]),
            boxShadow:
              '0 0 8px rgba(255,255,255,0.75), 0 0 25px rgba(54,215,255,0.8)',
          }}
        />
        <Cursor
          startFrame={44}
          endFrame={78}
          from={{x: 82, y: 20}}
          to={{x: 45, y: 29}}
          clickFrame={82}
          scale={0.72}
        />
      </ScreenshotStage>
      <div
        style={{
          position: 'absolute',
          left: 64,
          right: 64,
          top: 1320,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
        }}
      >
        {ROOM_NAMES.map((name, index) => {
          const progress = spring({
            frame: frame - (25 + index * 12),
            fps,
            durationInFrames: 20,
            config: {damping: 200, stiffness: 110},
          });
          return (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px 24px',
                borderRadius: 18,
                border: '1px solid rgba(54,215,255,0.32)',
                background: 'rgba(5,22,49,0.82)',
                color: COLORS.text,
                fontFamily: FONT_FAMILY,
                fontSize: 27,
                fontWeight: 650,
                opacity: progress,
                transform: `translateY(${(1 - progress) * 18}px)`,
                boxShadow: '0 18px 48px rgba(0,0,0,0.28)',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: COLORS.cyan,
                  boxShadow: `0 0 16px ${COLORS.cyan}`,
                }}
              />
              {name}
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
};
