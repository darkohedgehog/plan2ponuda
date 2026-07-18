import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SceneFrame} from '../components/SceneFrame';
import {ScreenshotStage} from '../components/ScreenshotStage';
import {ASSETS, COLORS, FONT_FAMILY} from '../constants';

const DURATION = 60;
const BENEFITS = [
  'Save hours',
  'Improve accuracy',
  'Generate quotations',
  'AI-assisted workflow',
] as const;

export const PosterScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <SceneFrame durationInFrames={DURATION} fadeFrames={7}>
      <ScreenshotStage
        asset={ASSETS.poster}
        frame={frame}
        durationInFrames={DURATION}
        aspectRatio={1}
        width={920}
        centerY={845}
        pushFrom={0.97}
        pushTo={1.035}
      />
      <div
        style={{
          position: 'absolute',
          left: 66,
          right: 66,
          top: 1360,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          padding: 24,
          borderRadius: 26,
          border: '1px solid rgba(54,215,255,0.24)',
          background: 'rgba(3,14,33,0.82)',
          boxShadow: '0 30px 90px rgba(0,0,0,0.38)',
          backdropFilter: 'blur(18px)',
        }}
      >
        {BENEFITS.map((benefit, index) => {
          const progress = spring({
            frame: frame - (8 + index * 8),
            fps,
            durationInFrames: 15,
            config: {damping: 200, stiffness: 120},
          });
          return (
            <div
              key={benefit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                minHeight: 66,
                color: COLORS.text,
                fontFamily: FONT_FAMILY,
                fontSize: 25,
                fontWeight: 640,
                opacity: progress,
                transform: `translateY(${(1 - progress) * 14}px)`,
              }}
            >
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  flex: '0 0 auto',
                  color: COLORS.black,
                  background: COLORS.cyan,
                  fontSize: 20,
                  fontWeight: 900,
                  boxShadow: `0 0 18px rgba(54,215,255,0.6)`,
                }}
              >
                ✓
              </span>
              {benefit}
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
};
