import { describe, it, expect } from 'vitest';
import {
  createRandom,
  createSeededRandom,
  dailyRandom,
  randomInt,
} from '../src/random.js';

describe('createRandom', () => {
  it('returns numbers in [0, 1)', () => {
    const rng = createRandom();
    for (let i = 0; i < 50; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('produces different values on successive calls', () => {
    const rng = createRandom();
    const a = rng();
    const b = rng();
    expect(a).not.toBe(b);
  });
});

describe('createSeededRandom', () => {
  it('produces deterministic sequence for same seed (number)', () => {
    const rng1 = createSeededRandom(42);
    const rng2 = createSeededRandom(42);
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('produces deterministic sequence for same seed (string)', () => {
    const rng1 = createSeededRandom('hello');
    const rng2 = createSeededRandom('hello');
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = createSeededRandom(1);
    const rng2 = createSeededRandom(2);
    const first1 = rng1();
    const first2 = rng2();
    expect(first1).not.toBe(first2);
  });

  it('returns numbers in [0, 1)', () => {
    const rng = createSeededRandom(123);
    for (let i = 0; i < 50; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('handles seed of 0 without producing all zeros', () => {
    const rng = createSeededRandom(0);
    const values = Array.from({ length: 10 }, () => rng());
    expect(values.some(v => v !== 0)).toBe(true);
  });

  it('handles empty string seed', () => {
    const rng = createSeededRandom('');
    const values = Array.from({ length: 10 }, () => rng());
    expect(values.some(v => v !== 0)).toBe(true);
    expect(values.every(v => v >= 0 && v < 1)).toBe(true);
  });
});

describe('dailyRandom', () => {
  it('produces same sequence for same date string', () => {
    const rng1 = dailyRandom('2026-05-04');
    const rng2 = dailyRandom('2026-05-04');
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('produces different sequences for different dates', () => {
    const rng1 = dailyRandom('2026-05-04');
    const rng2 = dailyRandom('2026-05-05');
    const first1 = rng1();
    const first2 = rng2();
    expect(first1).not.toBe(first2);
  });

  it('throws for missing dateSeed', () => {
    expect(() => dailyRandom()).toThrow(TypeError);
  });

  it('throws for non-string dateSeed', () => {
    expect(() => dailyRandom(123)).toThrow(TypeError);
    expect(() => dailyRandom(null)).toThrow(TypeError);
  });
});

describe('randomInt', () => {
  it('returns integers in [min, max]', () => {
    const rng = createSeededRandom(99);
    for (let i = 0; i < 100; i++) {
      const n = randomInt(rng, 1, 10);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(10);
    }
  });

  it('works with min === max', () => {
    const rng = createRandom();
    expect(randomInt(rng, 5, 5)).toBe(5);
  });

  it('works with negative ranges', () => {
    const rng = createSeededRandom(77);
    for (let i = 0; i < 20; i++) {
      const n = randomInt(rng, -10, -5);
      expect(n).toBeGreaterThanOrEqual(-10);
      expect(n).toBeLessThanOrEqual(-5);
    }
  });
});
