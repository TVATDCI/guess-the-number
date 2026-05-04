import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStorage,
  createMemoryStorage,
} from '../src/storage.js';

describe('createMemoryStorage', () => {
  it('stores and retrieves string values', () => {
    const mem = createMemoryStorage();
    mem.setItem('key', 'value');
    expect(mem.getItem('key')).toBe('value');
  });

  it('returns null for missing keys', () => {
    const mem = createMemoryStorage();
    expect(mem.getItem('nope')).toBeNull();
  });

  it('removes keys', () => {
    const mem = createMemoryStorage();
    mem.setItem('key', 'value');
    mem.removeItem('key');
    expect(mem.getItem('key')).toBeNull();
  });

  it('clears all data', () => {
    const mem = createMemoryStorage();
    mem.setItem('a', '1');
    mem.setItem('b', '2');
    mem.clear();
    expect(mem.getItem('a')).toBeNull();
    expect(mem.getItem('b')).toBeNull();
  });
});

describe('createStorage with memory backend', () => {
  let storage;

  beforeEach(() => {
    const backend = createMemoryStorage();
    storage = createStorage(backend);
  });

  it('stores and retrieves JSON values', () => {
    storage.set('number', 42);
    expect(storage.get('number')).toBe(42);

    storage.set('obj', { a: 1 });
    expect(storage.get('obj')).toEqual({ a: 1 });

    storage.set('arr', [1, 2, 3]);
    expect(storage.get('arr')).toEqual([1, 2, 3]);
  });

  it('returns default value for missing keys', () => {
    expect(storage.get('missing')).toBeNull();
    expect(storage.get('missing', 'default')).toBe('default');
    expect(storage.get('missing', 0)).toBe(0);
  });

  it('removes keys', () => {
    storage.set('key', 'value');
    storage.remove('key');
    expect(storage.get('key')).toBeNull();
  });

  it('clears all data', () => {
    storage.set('a', 1);
    storage.set('b', 2);
    storage.clear();
    expect(storage.get('a')).toBeNull();
    expect(storage.get('b')).toBeNull();
  });

  it('returns null for non-JSON raw values', () => {
    const backend = createMemoryStorage();
    backend.setItem('bad', 'not json');
    const s = createStorage(backend);
    expect(s.get('bad')).toBeNull();
    expect(s.get('bad', 'fallback')).toBe('fallback');
  });
});

describe('createStorage schema versioning', () => {
  it('starts with schema version 0', () => {
    const storage = createStorage(createMemoryStorage());
    expect(storage.getSchemaVersion()).toBe(0);
  });

  it('sets and gets schema version', () => {
    const storage = createStorage(createMemoryStorage());
    storage.setSchemaVersion(2);
    expect(storage.getSchemaVersion()).toBe(2);
  });

  it('migrates when schema is outdated', () => {
    const storage = createStorage(createMemoryStorage());
    let migrated = false;
    storage.migrate(1, (fromVersion, s) => {
      expect(fromVersion).toBe(0);
      expect(s).toBe(storage);
      migrated = true;
    });
    expect(migrated).toBe(true);
    expect(storage.getSchemaVersion()).toBe(1);
  });

  it('does not migrate when schema is current', () => {
    const storage = createStorage(createMemoryStorage());
    storage.setSchemaVersion(3);
    let migrated = false;
    storage.migrate(3, () => {
      migrated = true;
    });
    expect(migrated).toBe(false);
  });

  it('migrates incrementally across versions', () => {
    const storage = createStorage(createMemoryStorage());
    const migrations = [];
    storage.migrate(3, (fromVersion) => {
      migrations.push(fromVersion);
    });
    expect(migrations).toEqual([0]);
    expect(storage.getSchemaVersion()).toBe(3);
  });
});

describe('createStorage fallback mode', () => {
  it('falls back to in-memory when backend throws SecurityError', () => {
    const badBackend = {
      getItem() { throw new DOMException('SecurityError', 'SecurityError'); },
      setItem() { throw new DOMException('SecurityError', 'SecurityError'); },
      removeItem() { throw new DOMException('SecurityError', 'SecurityError'); },
      clear() { throw new DOMException('SecurityError', 'SecurityError'); },
    };
    const storage = createStorage(badBackend);
    storage.set('key', 42);
    expect(storage.isFallback()).toBe(true);
    expect(storage.get('key')).toBe(42);
  });

  it('falls back to in-memory when backend throws QuotaExceededError', () => {
    const badBackend = {
      getItem() { throw new DOMException('QuotaExceeded', 'QuotaExceededError'); },
      setItem() { throw new DOMException('QuotaExceeded', 'QuotaExceededError'); },
      removeItem() { throw new DOMException('QuotaExceeded', 'QuotaExceededError'); },
      clear() { throw new DOMException('QuotaExceeded', 'QuotaExceededError'); },
    };
    const storage = createStorage(badBackend);
    storage.set('key', 'value');
    expect(storage.isFallback()).toBe(true);
    expect(storage.get('key')).toBe('value');
  });

  it('falls back on setItem after initial probe succeeds', () => {
    let shouldThrow = false;
    const flakyBackend = {
      getItem(k) {
        if (shouldThrow) throw new DOMException('QuotaExceeded', 'QuotaExceededError');
        return null;
      },
      setItem() {
        if (shouldThrow) throw new DOMException('QuotaExceeded', 'QuotaExceededError');
      },
      removeItem() {},
      clear() {},
    };
    const storage = createStorage(flakyBackend);
    expect(storage.isFallback()).toBe(false);
    shouldThrow = true;
    storage.set('key', 42);
    expect(storage.isFallback()).toBe(true);
    expect(storage.get('key')).toBe(42);
  });

  it('re-throws non-storage errors', () => {
    const badBackend = {
      getItem() { throw new Error('Something else'); },
      setItem() {},
      removeItem() {},
      clear() {},
    };
    const storage = createStorage(badBackend);
    expect(() => storage.get('key')).toThrow('Something else');
  });
});

describe('createStorage edge cases', () => {
  it('handles missing keys with custom defaults', () => {
    const storage = createStorage(createMemoryStorage());
    expect(storage.get('missing')).toBeNull();
    expect(storage.get('missing', 'default')).toBe('default');
    expect(storage.get('missing', 0)).toBe(0);
    expect(storage.get('missing', false)).toBe(false);
  });

  it('stores and retrieves boolean values', () => {
    const storage = createStorage(createMemoryStorage());
    storage.set('flag', true);
    expect(storage.get('flag')).toBe(true);
    storage.set('flag', false);
    expect(storage.get('flag')).toBe(false);
  });

  it('stores and retrieves nested objects', () => {
    const storage = createStorage(createMemoryStorage());
    const data = { user: { name: 'Kid', score: 100 } };
    storage.set('data', data);
    expect(storage.get('data')).toEqual(data);
  });
});
