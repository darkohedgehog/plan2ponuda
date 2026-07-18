import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {BrandLogo} from '../components/BrandLogo';
import {LightSweep} from '../components/LightSweep';
import {SceneFrame} from '../components/SceneFrame';
import {ScreenshotStage} from '../components/ScreenshotStage';
import {AnimatedText} from '../components/Typography';
import {ASSETS, BUILD_WEEK_COPY, COLORS} from '../constants';

const DURATION_IN_FRAMES = 150;
const SCREENSHOT_ASPECT_RATIO = 3024 / 1964;

export const CodexBuildWeekScene = () => {
  const frame = useCurrentFrame();
  const endingOpacity = interpolate(frame, [104, 118], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const contentOpacity = interpolate(frame, [98, 112], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <SceneFrame durationInFrames={DURATION_IN_FRAMES} fadeFrames={8}>
      <AbsoluteFill style={{opacity: contentOpacity}}>
        <AnimatedText
          startFrame={8}
          style={{
            position: 'absolute',
            top: 132,
            left: 64,
            right: 64,
            zIndex: 20,
            color: COLORS.text,
            fontSize: 62,
            lineHeight: 1.03,
            fontWeight: 730,
            letterSpacing: -2.8,
            textAlign: 'center',
            textShadow: '0 14px 42px rgba(0,0,0,0.62)',
          }}
        >
          {BUILD_WEEK_COPY.headline}
        </AnimatedText>

        <ScreenshotStage
          asset={ASSETS.codexBuildWeek}
          frame={frame}
          durationInFrames={112}
          aspectRatio={SCREENSHOT_ASPECT_RATIO}
          width={1000}
          centerY={850}
          pushFrom={0.985}
          pushTo={1.025}
          foregroundStyle={{borderRadius: 22}}
        >
          <Img
            src={staticFile(ASSETS.codexBuildWeek)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              clipPath: 'inset(93.8% 89.2% 0.8% 0.5%)',
              filter: 'blur(9px)',
              transform: 'scale(1.012)',
            }}
          />
          <LightSweep startFrame={28} durationInFrames={20} />
        </ScreenshotStage>

        <AnimatedText
          startFrame={18}
          style={{
            position: 'absolute',
            top: 1268,
            left: 86,
            right: 86,
            zIndex: 20,
            color: COLORS.textMuted,
            fontSize: 38,
            lineHeight: 1.22,
            fontWeight: 540,
            letterSpacing: -0.8,
            textAlign: 'center',
            textShadow: '0 10px 34px rgba(0,0,0,0.65)',
          }}
        >
          {BUILD_WEEK_COPY.supporting.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </AnimatedText>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          opacity: endingOpacity,
          zIndex: 40,
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at 50% 48%, rgba(20,99,255,0.22), transparent 34%), #020611',
        }}
      >
        <BrandLogo startFrame={112} width={620} />
      </AbsoluteFill>
    </SceneFrame>
  );
};
