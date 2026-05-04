## 2026-05-04 — Slice 1 Learnings

- ES6 default parameters: explicitly passing `undefined` as an argument causes the default value to be used. This is correct JS behavior but unintuitive when testing `storage.get(key, undefined)`.
- Vitest runs ESM modules natively with zero config when `"type": "module"` is set in package.json.
- `DOMException` is available as a global in Node.js ≥ 17, making it suitable for testing storage error handling.
- `createStorage` uses lazy backend probing — `isFallback()` only returns true after a storage operation has been attempted and failed. This is by design to avoid eager initialization overhead.

## Open Decisions

- Engine state shape: should we use a flat state object or nested screens? Decision deferred to Slice 2.
- Timer modeling: should timer ticks be engine actions or store-side side effects? Decision deferred to Slice 3.
