import {describe, expect, it} from 'vitest';
import config from '../public/audio/ploroai-buildweek-ending.json';

describe('Build Week narration contract', () => {
  it('uses the existing OpenAI narrator configuration', () => {
    expect(config.model).toBe('gpt-4o-mini-tts');
    expect(config.voice).toBe('cedar');
    expect(config.response_format).toBe('mp3');
    expect(config.speed).toBe(1.7);
  });

  it('uses the approved narration sentence exactly', () => {
    expect(config.input).toBe(
      'Ploro AI was designed, developed, tested and documented using OpenAI GPT-5.6 and Codex.',
    );
  });

  it('requests the existing calm professional delivery', () => {
    expect(config.instructions).toContain('calm');
    expect(config.instructions).toContain('professional');
    expect(config.instructions).toContain('approximately 4.4 seconds');
  });
});
