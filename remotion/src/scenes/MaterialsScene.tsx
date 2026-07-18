import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CountUp} from '../components/CountUp';
import {SceneFrame} from '../components/SceneFrame';
import {ScreenshotStage} from '../components/ScreenshotStage';
import {SceneTitle} from '../components/Typography';
import {ASSETS, COLORS, FONT_FAMILY} from '../constants';

const DURATION = 90;
const ASPECT_RATIO = 1732 / 908;

const MATERIALS = [
  {
    name: 'Switches',
    quantity: 5,
    price: 14.5,
    accent: '#36d7ff',
  },
  {
    name: 'Light points',
    quantity: 7,
    price: 84,
    accent: '#1463ff',
  },
  {
    name: 'Installation',
    quantity: 12,
    price: 156,
    accent: '#63a4ff',
  },
] as const;

export const MaterialsScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <SceneFrame durationInFrames={DURATION}>
      <SceneTitle>Generate material estimates</SceneTitle>
      <ScreenshotStage
        asset={ASSETS.materials}
        frame={frame}
        durationInFrames={DURATION}
        aspectRatio={ASPECT_RATIO}
        width={1020}
        centerY={900}
        pushFrom={0.99}
        pushTo={1.025}
      >
        {[24, 54, 82].map((top, index) => {
          const progress = spring({
            frame: frame - (15 + index * 12),
            fps,
            durationInFrames: 18,
            config: {damping: 200, stiffness: 115},
          });
          return (
            <div
              key={top}
              style={{
                position: 'absolute',
                left: '22.2%',
                top: `${top}%`,
                width: '74.1%',
                height: index === 2 ? '13%' : '26%',
                borderRadius: 9,
                border: `2px solid rgba(54,215,255,${progress * 0.82})`,
                background: `rgba(20,99,255,${progress * 0.035})`,
                boxShadow: `0 0 ${progress * 26}px rgba(54,215,255,0.38)`,
                opacity: progress,
              }}
            />
          );
        })}
      </ScreenshotStage>
      <div
        style={{
          position: 'absolute',
          left: 54,
          right: 54,
          top: 1245,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {MATERIALS.map((material, index) => {
          const start = 25 + index * 12;
          const progress = spring({
            frame: frame - start,
            fps,
            durationInFrames: 20,
            config: {damping: 200, stiffness: 105},
          });

          return (
            <div
              key={material.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 170px 220px',
                alignItems: 'center',
                minHeight: 94,
                padding: '0 28px',
                borderRadius: 20,
                border: '1px solid rgba(119,190,255,0.25)',
                background:
                  'linear-gradient(90deg, rgba(6,31,66,0.92), rgba(5,19,42,0.82))',
                fontFamily: FONT_FAMILY,
                boxShadow: '0 18px 46px rgba(0,0,0,0.26)',
                opacity: progress,
                transform: `translateY(${(1 - progress) * 20}px)`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  fontSize: 26,
                  fontWeight: 650,
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 38,
                    borderRadius: 999,
                    background: material.accent,
                    boxShadow: `0 0 18px ${material.accent}`,
                  }}
                />
                {material.name}
              </div>
              <CountUp
                startFrame={start}
                durationInFrames={22}
                to={material.quantity}
                suffix=" pcs"
                style={{
                  color: COLORS.textMuted,
                  fontSize: 24,
                  fontWeight: 650,
                }}
              />
              <CountUp
                startFrame={start}
                durationInFrames={26}
                to={material.price}
                decimals={2}
                prefix="€"
                style={{
                  color: COLORS.cyan,
                  fontSize: 30,
                  fontWeight: 720,
                }}
              />
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
};
