# SQLite Explorer

A fully browser-native SQL explorer — no backend, no server, no database process.
Data persists via the **Origin Private File System (OPFS)** API and queries run inside a **Web Worker** to keep the UI responsive.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, click **Load sample data**, then run SQL queries.

---

## What's inside

```
src/
  db.worker.js     — SQLite WASM runs here (off main thread)
  useDatabase.js   — React hook: promise-based API over the worker
  App.jsx          — UI: import panel, SQL editor, results table
  index.css        — Styles
vite.config.js     — COOP/COEP headers (required for OPFS + SharedArrayBuffer)
```

## Key concepts

### 1. SQLite via WebAssembly
`@sqlite.org/sqlite-wasm` compiles SQLite to WASM. It runs entirely in the browser — no network calls for queries.

### 2. OPFS (Origin Private File System)
The browser's native sandboxed file system. When available, the `.db` file lives in OPFS and **persists across page reloads** — try importing data, refreshing, and querying again. Falls back to in-memory if OPFS is unavailable (Firefox, Safari < 17).

### 3. Web Worker
All DB operations run in a worker thread. This means heavy queries don't freeze the UI. The main thread communicates with the worker via `postMessage` with a simple promise wrapper (`useDatabase.js`).

### 4. Cross-Origin Isolation
OPFS and `SharedArrayBuffer` (used by the WASM SQLite VFS) require these response headers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
The Vite plugin in `vite.config.js` adds these automatically in dev. For production, set them on your web server or CDN.

## Next steps to explore

- **Full-text search**: `CREATE VIRTUAL TABLE … USING fts5(…)` — SQLite has FTS built in
- **Charting**: pipe query results into Recharts or Chart.js
- **Multi-table imports**: import several CSVs and write JOIN queries
- **Export**: `db.export()` returns a `Uint8Array` you can download as a `.db` file
- **Sync**: POST the exported `.db` to R2 or S3 for cross-device persistence
- **electric-sql**: CRDT-based sync layer that builds on top of OPFS