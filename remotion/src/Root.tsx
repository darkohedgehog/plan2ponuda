import {Composition} from 'remotion';
import {VIDEO} from './constants';
import {PloroDemo} from './PloroDemo';

export const RemotionRoot = () => (
  <Composition
    id="PloroAIDemo"
    component={PloroDemo}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
