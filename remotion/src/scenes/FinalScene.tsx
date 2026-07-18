import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandLogo} from '../components/BrandLogo';
import {SceneFrame} from '../components/SceneFrame';
import {AnimatedText} from '../components/Typography';
import {COLORS, FONT_FAMILY} from '../constants';
import {clampedInterpolate} from '../helpers/animation';

const DURATION = 60;

export const FinalScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const glow = spring({
    frame,
    fps,
    durationInFrames: 30,
    config: {damping: 200, stiffness: 90},
  });
  const finalFade = clampedInterpolate(frame, [49, 60], [1, 0]);

  return (
    <SceneFrame
      durationInFrames={DURATION}
      fadeFrames={7}
      style={{opacity: finalFade}}
    >
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div
          style={{
            position: 'absolute',
            top: 300,
            width: 900,
            height: 900,
            borderRadius: '50%',
            transform: `scale(${0.72 + glow * 0.28})`,
            background:
              'radial-gradient(circle, rgba(54,215,255,0.27), rgba(20,99,255,0.14) 35%, transparent 70%)',
            filter: 'blur(24px)',
          }}
        />
        <div style={{position: 'absolute', top: 460}}>
          <BrandLogo width={730} startFrame={2} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 72,
            right: 72,
            top: 1140,
            textAlign: 'center',
            fontFamily: FONT_FAMILY,
          }}
        >
          <AnimatedText
            startFrame={14}
            style={{
              color: COLORS.text,
              fontSize: 76,
              lineHeight: 1,
              fontWeight: 740,
              letterSpacing: -3.2,
            }}
          >
            Join Early Access
          </AnimatedText>
          <AnimatedText
            startFrame={22}
            style={{
              marginTop: 34,
              color: COLORS.cyan,
              fontSize: 40,
              fontWeight: 650,
              letterSpacing: 0.5,
            }}
          >
            ploroai.io
          </AnimatedText>
        </div>
      </AbsoluteFill>
    </SceneFrame>
  );
};
