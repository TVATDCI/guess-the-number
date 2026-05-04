/**
 * Storage abstraction layer.
 * Wraps a storage backend (localStorage, Map, etc.) with error handling,
 * schema versioning, and graceful degradation.
 */

const CURRENT_SCHEMA_VERSION = 1;
const SCHEMA_KEY = '__version';

/**
 * Create a storage wrapper around a backend.
 * @param {object} backend - Must implement getItem(key), setItem(key, value), removeItem(key), clear()
 * @returns {Storage}
 */
export function createStorage(backend) {
  // In-memory fallback if backend is missing or throws on first access
  let activeBackend = backend;
  let inMemoryFallback = null;

  function ensureBackend() {
    if (inMemoryFallback) return inMemoryFallback;
    try {
      // Probe backend to detect private-mode or quota issues
      const probeKey = '__probe__';
      activeBackend.setItem(probeKey, '1');
      activeBackend.removeItem(probeKey);
      return activeBackend;
    } catch (err) {
      if (isStorageError(err)) {
        if (!inMemoryFallback) {
          inMemoryFallback = createMemoryStorage();
        }
        return inMemoryFallback;
      }
      throw err;
    }
  }

  function getRaw(key) {
    const store = ensureBackend();
    try {
      return store.getItem(key);
    } catch (err) {
      if (isStorageError(err)) {
        if (store === activeBackend && !inMemoryFallback) {
          inMemoryFallback = createMemoryStorage();
        }
        return inMemoryFallback ? inMemoryFallback.getItem(key) : null;
      }
      throw err;
    }
  }

  function setRaw(key, value) {
    const store = ensureBackend();
    try {
      store.setItem(key, value);
    } catch (err) {
      if (isStorageError(err)) {
        if (store === activeBackend && !inMemoryFallback) {
          inMemoryFallback = createMemoryStorage();
        }
        if (inMemoryFallback) {
          inMemoryFallback.setItem(key, value);
        }
        return;
      }
      throw err;
    }
  }

  function removeRaw(key) {
    const store = ensureBackend();
    try {
      store.removeItem(key);
    } catch (err) {
      if (isStorageError(err)) {
        if (store === activeBackend && !inMemoryFallback) {
          inMemoryFallback = createMemoryStorage();
        }
        if (inMemoryFallback) {
          inMemoryFallback.removeItem(key);
        }
        return;
      }
      throw err;
    }
  }

  function clearRaw() {
    const store = ensureBackend();
    try {
      store.clear();
    } catch (err) {
      if (isStorageError(err)) {
        if (store === activeBackend && !inMemoryFallback) {
          inMemoryFallback = createMemoryStorage();
        }
        if (inMemoryFallback) {
          inMemoryFallback.clear();
        }
        return;
      }
      throw err;
    }
  }

  function isStorageError(err) {
    return (
      err.name === 'QuotaExceededError' ||
      err.name === 'SecurityError' ||
      err.code === 22 || // LEGACY Safari QuotaExceeded
      err.code === 1014 || // LEGACY Firefox QuotaExceeded
      err.message?.toLowerCase().includes('quota') ||
      err.message?.toLowerCase().includes('storage')
    );
  }

  const storage = {
    /**
     * Get a value and parse it as JSON.
     * @param {string} key
     * @param {any} defaultValue
     * @returns {any}
     */
    get(key, defaultValue = null) {
      const raw = getRaw(key);
      if (raw === null || raw === undefined) return defaultValue;
      try {
        return JSON.parse(raw);
      } catch {
        return defaultValue;
      }
    },

    /**
     * Set a value, serializing to JSON.
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {
      setRaw(key, JSON.stringify(value));
    },

    /**
     * Remove a key.
     * @param {string} key
     */
    remove(key) {
      removeRaw(key);
    },

    /**
     * Clear all stored data.
     */
    clear() {
      clearRaw();
    },

    /**
     * Get current schema version from storage.
     * @returns {number}
     */
    getSchemaVersion() {
      const raw = getRaw(SCHEMA_KEY);
      if (!raw) return 0;
      const parsed = parseInt(raw, 10);
      return isNaN(parsed) ? 0 : parsed;
    },

    /**
     * Set schema version.
     * @param {number} version
     */
    setSchemaVersion(version) {
      setRaw(SCHEMA_KEY, String(version));
    },

    /**
     * Migrate data if schema version is outdated.
     * @param {number} targetVersion
     * @param {function} migrator - (fromVersion, storage) => void
     */
    migrate(targetVersion = CURRENT_SCHEMA_VERSION, migrator = null) {
      const current = this.getSchemaVersion();
      if (current < targetVersion) {
        if (migrator) {
          migrator(current, this);
        }
        this.setSchemaVersion(targetVersion);
      }
    },

    /**
     * Expose whether we're running in fallback mode.
     * @returns {boolean}
     */
    isFallback() {
      return inMemoryFallback !== null;
    },

    /**
     * Raw backend access for testing.
     * @returns {object}
     */
    _backend() {
      return ensureBackend();
    },
  };

  return storage;
}

/**
 * Create an in-memory storage backend compatible with the storage wrapper.
 * @returns {object}
 */
export function createMemoryStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
  };
}

/**
 * Create a localStorage backend for use in the browser.
 * @returns {object}
 */
export function createLocalStorageBackend() {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  throw new Error('localStorage is not available in this environment');
}
