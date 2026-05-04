/**
 * Randomness abstraction layer.
 * Provides default, seeded, and daily (date-based) random number generators.
 * All functions return a number in the range [0, 1), same as Math.random.
 */

/**
 * Creates a default random number generator using Math.random.
 * @returns {() => number}
 */
export function createRandom() {
  return () => Math.random();
}

/**
 * Creates a seeded pseudo-random number generator.
 * Uses a simple xorshift algorithm for reproducibility.
 * @param {number|string} seed
 * @returns {() => number}
 */
export function createSeededRandom(seed) {
  let state = hashSeed(seed);

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    // Convert to positive 32-bit integer, then to [0, 1)
    const positive = (state >>> 0) / 4294967296;
    return positive;
  };
}

/**
 * Creates a daily random generator that produces the same sequence
 * for everyone on the same date.
 * @param {string} dateSeed - Date string in YYYY-MM-DD format
 * @returns {() => number}
 */
export function dailyRandom(dateSeed) {
  if (!dateSeed || typeof dateSeed !== 'string') {
    throw new TypeError('dailyRandom requires a date string (YYYY-MM-DD)');
  }
  return createSeededRandom(dateSeed);
}

/**
 * Generates a random integer in [min, max] using the provided RNG.
 * @param {() => number} rng
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Hash a seed value into a 32-bit integer.
 * @param {number|string} seed
 * @returns {number}
 */
function hashSeed(seed) {
  if (typeof seed === 'number') {
    return seed === 0 ? 123456789 : Math.abs(seed | 0);
  }
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash === 0 ? 123456789 : hash;
}
