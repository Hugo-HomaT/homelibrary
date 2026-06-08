# Homa Asset Library — project guide

> Internal web tool for **Homa Games** to browse, preview and manage **3D models & textures**
> for playable ads. It is NOT an external marketplace.
>
> ℹ️ Heads-up: the project started as an Airbnb visual clone before pivoting, so older **git history**
> still references "airbnb". The package is now `homa-asset-library` and everything is branded
> **Homa Asset Library**.

## Run it

```bash
npm install      # first time
npm run dev      # Vite dev server on http://localhost:5173
```

Node 22 / npm 10. There is a Claude Code preview config in `.claude/launch.json` (name: `homa-dev`).

## Stack

- **React 18.3** + **Vite 5.4** (plain JSX, no TypeScript)
- **three 0.169** + **@react-three/fiber 8.17** + **@react-three/drei 9.114** (real WebGL previews)
- **Plain CSS** in `src/index.css` (no Tailwind). Theme via CSS variables at the top.

## Architecture

```
src/
  main.jsx                 entry
  App.jsx                  ALL app state: assets[], search query, category, type filter,
                           sort, favorites(Set), selection(Set), open modals, toasts.
  index.css                全 styling, animations, theme tokens (--accent #6d5efc, etc.)
  data.js                  seed catalog + categories + KIND_EMOJI + MODEL_KINDS/MODEL_FORMATS/TEX_FORMATS
  lib/
    webgl.js               hasWebGL() guard before mounting any <Canvas>
    textures.js            procedural canvas pattern generators + makeCanvasTexture()
    parseAsset.js          uploaded-file parsing: classify, image dims, three.js loaders,
                           countTris(), classifyRes(), formatBytes()
  components/
    Header.jsx             logo "Homa Asset Library", live search, New asset, bookmarks, Selection, menu
    CategoryBar.jsx        category scroller + type seg (All/3D/Textures) + sort dropdown
    AssetGrid.jsx          maps visible assets to cards + empty state
    AssetCard.jsx          one card (handles procedural AND uploaded)
    AssetModal.jsx         detail viewer (handles procedural AND uploaded)
    CreateAssetModal.jsx   the UPLOAD flow (dropzone, parsing, auto-detect, preview, dup guard)
    SelectionDrawer.jsx    selection "pack" drawer + export
    Toasts.jsx             toast notifications
    Footer.jsx             minimal internal footer
    Model3D.jsx            ALL three/r3f scene code (see below)
    ViewerControls.jsx     Rotate toggle + display-mode segment (Shaded / Wire / Shaded+wire)
```

### Model3D.jsx (the 3D core)
- `ProceduralModel({kind,palette})` — 16 procedural kinds built from primitives (crate, barrel, coin,
  gem, chest, sword, shield, rocket, tree, rock, planet, drone, character, key, potion, car).
- `Lights` + `StudioEnv` — lights + a **local** drei `<Environment>` made of `<Lightformer>`s
  (no network) so metals reflect and don't render black.
- `DisplayModeGroup({mode})` — wraps any model; traverses meshes and applies
  `'shaded' | 'wire' | 'shadedwire'`. `shadedwire` overlays `LineSegments(WireframeGeometry)`.
- `FitObject({object})` — clones an uploaded Object3D, clones its materials (so display-mode
  changes don't mutate the original), recenters + scales to fit.
- Exported viewers:
  - `ModelStage` / `UploadedModelStage` — lightweight auto-rotating canvas (used by cards on hover).
  - `ModelViewer` / `UploadedModelViewer` — full canvas: OrbitControls + grid + display mode (modals).
  - `TextureViewer` / `UploadedTextureViewer` — texture mapped on a sphere/cube/cylinder.

## The asset data model

`assets` is **state in App.jsx** (so uploads can be appended; new id = max+1, prepended to the array).

Two flavors of asset:

1. **Procedural seed assets** (the 30 in `data.js`): models have `kind` + `palette`; textures have
   `pattern` + `palette`. Rendered from procedural geometry / canvas patterns. Demo content.
2. **Uploaded assets** (`uploaded: true`): created via the upload modal.
   - model → `object3d` (parsed `THREE.Object3D`), `poly` (tri count or null)
   - texture → `imageUrl`, `width`, `height`

Common fields: `{ id, type:'model'|'texture', name, cats:[], formats:[], size, description?, res? }`.

Upload auto-detection (in `CreateAssetModal` + `lib/parseAsset.js`):
- **type/format** from file extensions; **resolution** from real image pixels; **tris** from parsed
  geometry (three.js GLTF/OBJ/FBX loaders, imported dynamically). Failures degrade gracefully
  (`object3d: null` → fallback preview, `tris: '—'`).
- **Duplicate-name safeguard**: case-insensitive name match against existing assets → inline error
  + disabled "Add to library".

## Product rules — DO / DON'T (the user is firm on these)

- ✅ Internal, **clean / épuré**, **full English** UI.
- ✅ Upload = real production flow (real files, auto-detected metadata, dedupe). No asking the user
  for things the files already encode.
- ✅ Keep: live 3D card previews (on hover), full 3D viewer (orbit/zoom + display modes),
  procedural texture swatches + PBR-map preview, **Selection** pack + export, bookmarks, live filters.
- ❌ NO marketplace cruft: no ratings/reviews, no download counts, no "PRO" tiers, no pricing,
  no "royalty-free"/marketing copy.
- ❌ No toy/"Sims 3" features (e.g. building an asset by picking a color/pattern). See the rejected
  approach in git/history — uploads must be the real thing.

## Gotchas

- **Cards mount live WebGL only on hover** to stay under the browser's WebGL-context limit. Modals
  use their own single canvas. Don't render many live `<Canvas>` at once.
- The Claude Code **`preview_screenshot` tool gets flaky** with continuously-rendering WebGL
  (auto-rotating viewers) — it timed out repeatedly mid-session. Prefer verifying with
  `preview_eval` (DOM/state assertions) + `preview_console_logs`; restart the preview server for a
  fresh renderer if you need a screenshot.
- React-controlled inputs: to drive them from `preview_eval`, use the native value setter +
  `dispatchEvent(new Event('input'/'change',{bubbles:true}))`. State commits after the task, so read
  in a **separate** eval call.
- Stale HMR console errors can appear during rapid edits — a full page reload clears them.
- Uploaded assets are **in-memory only** (lost on reload); object URLs aren't revoked.

## Open items / possible next steps

- Decide whether to keep the 30 procedural demo assets or ship an empty library (only real uploads).
- Persistence for uploads (localStorage / IndexedDB / backend) + real `.zip` pack export.
- Pre-rendered thumbnails for uploaded models (so cards show them without hover).
- Multi-tag upload + tag search; handle FBX/GLB external textures.
