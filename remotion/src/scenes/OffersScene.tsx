import {useCurrentFrame} from 'remotion';
import {Cursor} from '../components/Cursor';
import {LightSweep} from '../components/LightSweep';
import {SceneFrame} from '../components/SceneFrame';
import {ScreenshotStage} from '../components/ScreenshotStage';
import {SceneTitle} from '../components/Typography';
import {ASSETS, COLORS} from '../constants';
import {clampedInterpolate} from '../helpers/animation';

const DURATION = 90;
const ASPECT_RATIO = 1541 / 1020;

export const OffersScene = () => {
  const frame = useCurrentFrame();
  const totalGlow = clampedInterpolate(frame, [18, 34], [0, 1]);
  const buttonGlow = clampedInterpolate(frame, [48, 62], [0, 1]);

  return (
    <SceneFrame durationInFrames={DURATION}>
      <SceneTitle>Export a professional quotation</SceneTitle>
      <ScreenshotStage
        asset={ASSETS.offers}
        frame={frame}
        durationInFrames={DURATION}
        aspectRatio={ASPECT_RATIO}
        width={1015}
        centerY={990}
        pushFrom={0.98}
        pushTo={1.035}
        shiftX={-4}
      >
        <div
          style={{
            position: 'absolute',
            left: '72.4%',
            top: '56.1%',
            width: '11.3%',
            height: '8.6%',
            borderRadius: 8,
            border: `3px solid rgba(54,215,255,${totalGlow})`,
            background: `rgba(20,99,255,${totalGlow * 0.05})`,
            boxShadow: `0 0 ${totalGlow * 32}px rgba(54,215,255,0.75)`,
            opacity: totalGlow,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '89.5%',
            top: '57.8%',
            width: '7%',
            height: '6.9%',
            borderRadius: 7,
            border: `2px solid rgba(54,215,255,${buttonGlow})`,
            boxShadow: `0 0 ${buttonGlow * 30}px rgba(54,215,255,0.9)`,
            opacity: buttonGlow,
            overflow: 'hidden',
          }}
        >
          <LightSweep startFrame={60} durationInFrames={15} />
        </div>
        <Cursor
          startFrame={35}
          endFrame={62}
          from={{x: 72, y: 33}}
          to={{x: 93, y: 61}}
          clickFrame={66}
          scale={0.75}
        />
      </ScreenshotStage>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 1415,
          width: 440,
          height: 2,
          transform: 'translateX(-50%)',
          background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent)`,
          opacity: buttonGlow * 0.8,
          boxShadow: `0 0 22px ${COLORS.cyan}`,
        }}
      />
    </SceneFrame>
  );
};
