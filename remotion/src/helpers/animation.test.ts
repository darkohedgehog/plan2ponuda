import {describe, expect, it} from 'vitest';
import {
  clampedInterpolate,
  countValue,
  fadeEnvelope,
  staggeredProgress,
} from './animation';

describe('animation helpers', () => {
  it('clamps interpolated values outside the input range', () => {
    expect(clampedInterpolate(-5, [0, 10], [0, 100])).toBe(0);
    expect(clampedInterpolate(5, [0, 10], [0, 100])).toBe(50);
    expect(clampedInterpolate(15, [0, 10], [0, 100])).toBe(100);
  });

  it('creates a fade-in, hold, and fade-out envelope', () => {
    expect(fadeEnvelope(0, 60, 10)).toBe(0);
    expect(fadeEnvelope(10, 60, 10)).toBe(1);
    expect(fadeEnvelope(45, 60, 10)).toBe(1);
    expect(fadeEnvelope(59, 60, 10)).toBeCloseTo(0.1);
  });

  it('stages progress deterministically', () => {
    expect(staggeredProgress(8, 10, 5)).toBe(0);
    expect(staggeredProgress(12.5, 10, 5)).toBe(0.5);
    expect(staggeredProgress(18, 10, 5)).toBe(1);
  });

  it('interpolates count-up values with predictable rounding', () => {
    expect(countValue(0, 12, 0, 24)).toBe(0);
    expect(countValue(6, 12, 0, 24)).toBe(12);
    expect(countValue(20, 12, 0, 24)).toBe(24);
    expect(countValue(5, 10, 10, 15, 1)).toBe(12.5);
  });
});
