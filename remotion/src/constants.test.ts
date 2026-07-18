import {describe, expect, it} from 'vitest';
import {ASSETS, SCENES, VIDEO} from './constants';

describe('video contract', () => {
  it('uses the requested portrait render metadata', () => {
    expect(VIDEO).toEqual({
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 660,
    });
  });

  it('defines contiguous scenes covering every frame exactly once', () => {
    expect(SCENES[0]?.from).toBe(0);
    expect(SCENES.at(-1)?.to).toBe(VIDEO.durationInFrames);

    for (let index = 1; index < SCENES.length; index += 1) {
      expect(SCENES[index]?.from).toBe(SCENES[index - 1]?.to);
    }

    expect(SCENES.map(({from, to}) => to - from)).toEqual([
      60, 75, 105, 120, 90, 90, 60, 60,
    ]);
  });

  it('maps every supplied asset to its approved role', () => {
    expect(ASSETS).toEqual({
      logo: 'assets/logo.png',
      problem: 'assets/PloroAI7.png',
      floorPlan: 'assets/ploroai-demo1.png',
      roomDetection: 'assets/ploroai-demo2.png',
      materials: 'assets/ploroai-demo3.png',
      offers: 'assets/ploroai-demo4.png',
      poster: 'assets/PloroAI2.png',
      voiceover: 'audio/ploroai-english-voiceover.mp3',
    });
  });
});
