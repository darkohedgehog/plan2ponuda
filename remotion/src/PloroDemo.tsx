import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {ASSETS, COLORS, SCENE_BY_ID} from './constants';
import {FinalScene} from './scenes/FinalScene';
import {FloorPlanScene} from './scenes/FloorPlanScene';
import {LogoScene} from './scenes/LogoScene';
import {MaterialsScene} from './scenes/MaterialsScene';
import {OffersScene} from './scenes/OffersScene';
import {PosterScene} from './scenes/PosterScene';
import {ProblemScene} from './scenes/ProblemScene';
import {RoomDetectionScene} from './scenes/RoomDetectionScene';
import {CodexBuildWeekScene} from './scenes/CodexBuildWeekScene';

const duration = (id: keyof typeof SCENE_BY_ID) =>
  SCENE_BY_ID[id].to - SCENE_BY_ID[id].from;

export const PloroDemo = () => (
  <AbsoluteFill style={{backgroundColor: COLORS.black}}>
    <Sequence from={0} durationInFrames={660}>
      <Audio src={staticFile(ASSETS.voiceover)} />
    </Sequence>
    <Sequence
      from={SCENE_BY_ID.codexBuildWeek.from}
      durationInFrames={duration('codexBuildWeek')}
    >
      <Audio src={staticFile(ASSETS.buildWeekVoiceover)} />
    </Sequence>
    <Sequence
      name="LogoScene"
      from={SCENE_BY_ID.logo.from}
      durationInFrames={duration('logo')}
    >
      <LogoScene />
    </Sequence>
    <Sequence
      name="ProblemScene"
      from={SCENE_BY_ID.problem.from}
      durationInFrames={duration('problem')}
    >
      <ProblemScene />
    </Sequence>
    <Sequence
      name="FloorPlanScene"
      from={SCENE_BY_ID.floorPlan.from}
      durationInFrames={duration('floorPlan')}
    >
      <FloorPlanScene />
    </Sequence>
    <Sequence
      name="RoomDetectionScene"
      from={SCENE_BY_ID.roomDetection.from}
      durationInFrames={duration('roomDetection')}
    >
      <RoomDetectionScene />
    </Sequence>
    <Sequence
      name="MaterialsScene"
      from={SCENE_BY_ID.materials.from}
      durationInFrames={duration('materials')}
    >
      <MaterialsScene />
    </Sequence>
    <Sequence
      name="OffersScene"
      from={SCENE_BY_ID.offers.from}
      durationInFrames={duration('offers')}
    >
      <OffersScene />
    </Sequence>
    <Sequence
      name="PosterScene"
      from={SCENE_BY_ID.poster.from}
      durationInFrames={duration('poster')}
    >
      <PosterScene />
    </Sequence>
    <Sequence
      name="FinalScene"
      from={SCENE_BY_ID.final.from}
      durationInFrames={duration('final')}
    >
      <FinalScene />
    </Sequence>
    <Sequence
      name="CodexBuildWeekScene"
      from={SCENE_BY_ID.codexBuildWeek.from}
      durationInFrames={duration('codexBuildWeek')}
    >
      <CodexBuildWeekScene />
    </Sequence>
  </AbsoluteFill>
);
