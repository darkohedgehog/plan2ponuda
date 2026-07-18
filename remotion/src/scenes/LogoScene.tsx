import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandLogo} from '../components/BrandLogo';
import {SceneFrame} from '../components/SceneFrame';
import {AnimatedText} from '../components/Typography';
import {COLORS, FONT_FAMILY} from '../constants';
import {clampedInterpolate} from '../helpers/animation';

const DURATION = 60;

export const LogoScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const glowProgress = spring({
    frame,
    fps,
    durationInFrames: 34,
    config: {damping: 200, stiffness: 90},
  });
  const glowOpacity = clampedInterpolate(frame, [0, 22], [0, 0.78]);

  return (
    <SceneFrame durationInFrames={DURATION}>
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'translateY(-190px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 830,
            height: 830,
            borderRadius: '50%',
            opacity: glowOpacity,
            transform: `scale(${0.72 + glowProgress * 0.28})`,
            background:
              'radial-gradient(circle, rgba(54,215,255,0.28) 0%, rgba(20,99,255,0.18) 35%, transparent 70%)',
            filter: 'blur(24px)',
          }}
        />
        <BrandLogo width={720} startFrame={3} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          top: 1170,
          textAlign: 'center',
          fontFamily: FONT_FAMILY,
        }}
      >
        <AnimatedText
          startFrame={15}
          style={{
            fontSize: 70,
            lineHeight: 1.05,
            fontWeight: 720,
            letterSpacing: -3,
            color: COLORS.text,
          }}
        >
          Electrical estimating.
        </AnimatedText>
        <AnimatedText
          startFrame={23}
          style={{
            marginTop: 14,
            fontSize: 70,
            lineHeight: 1.05,
            fontWeight: 720,
            letterSpacing: -3,
            color: COLORS.cyan,
          }}
        >
          Reinvented.
        </AnimatedText>
      </div>
    </SceneFrame>
  );
};
