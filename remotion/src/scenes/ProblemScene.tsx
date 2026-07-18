import {useCurrentFrame} from 'remotion';
import {SceneFrame} from '../components/SceneFrame';
import {ScreenshotStage} from '../components/ScreenshotStage';
import {SceneTitle} from '../components/Typography';
import {ASSETS} from '../constants';

const DURATION = 75;

export const ProblemScene = () => {
  const frame = useCurrentFrame();

  return (
    <SceneFrame durationInFrames={DURATION}>
      <ScreenshotStage
        asset={ASSETS.problem}
        frame={frame}
        durationInFrames={DURATION}
        aspectRatio={1}
        width={930}
        centerY={1040}
        pushFrom={0.975}
        pushTo={1.035}
      />
      <SceneTitle eyebrow="THE OLD WAY">
        Manual quoting
        <br />
        takes hours.
      </SceneTitle>
    </SceneFrame>
  );
};
