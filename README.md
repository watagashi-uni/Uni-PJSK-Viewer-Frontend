# Uni PJSK Viewer Frontend

Project SEKAI data viewer frontend (Vue 3 + Vite + TypeScript + Pinia).

## Development

### Requirements
- Node.js LTS
- npm

### Run locally
```bash
npm install
npm run dev
```

### Build and checks
```bash
npm run build
npm run lint
npm run preview
```

### Environment variables
Configuration flow:

1. Create `.env.development` in the project root.
2. Fill values based on your API deployment.
3. Run `npm run dev`.

Example:
```env
VITE_API_BASE_URL=https://viewer-api.unipjsk.com
VITE_MASTER_API_BASE_URL=https://jp-master.unipjsk.com
VITE_CHART_PREVIEW_URL=http://localhost:5175
VITE_TOOLBOX_OAUTH_BASE_URL=https://toolbox-api-direct.haruki.seiunx.com
VITE_TOOLBOX_OAUTH_CLIENT_ID=uni-viewer-public
```

Variable notes:
- `VITE_MASTER_API_BASE_URL`: master and version API base URL, defaulting to `https://jp-master.unipjsk.com`. Master responses use browser-native Brotli decoding; version requests bypass the service worker cache.
- `VITE_API_BASE_URL`: fallback viewer backend URL. Other viewer backend requests use the `apiEndpoint` value returned by the master host's `GET /api/version`, falling back to this value if missing.
- `VITE_CHART_PREVIEW_URL`: chart preview service URL used in music detail page
- `VITE_TOOLBOX_OAUTH_BASE_URL`: Haruki toolbox OAuth server base URL
- `VITE_TOOLBOX_OAUTH_CLIENT_ID`: OAuth client id for toolbox game-data read access; the server-side client should allow both `game-data:read` and `offline_access` so the browser can keep a refresh token

If you want to deploy your own backend, you can refer to [API_README.md](API_README.md).

## Contributing

1. Create a branch: `git checkout -b feature/<name>`
2. Implement and self-check: `npm run lint && npm run build`
3. Commit: `git commit -m "feat: ..."` (or `fix/chore/refactor`)
4. Open a PR with scope, impact, and screenshots for UI changes

### Dependencies / References

| Project | Usage | License |
|---|---|---|
| [Sekai-World/sekai-viewer](https://github.com/Sekai-World/sekai-viewer) | Project reference | GPL-3.0 |
| [xfl03/sekai-calculator](https://github.com/xfl03/sekai-calculator) | Event score calculation | LGPL-2.1 |
| [xfl03/33KitFrontend](https://github.com/xfl03/33KitFrontend) | Project reference | — |
| [pjsekai/scores](https://gitlab.com/pjsekai/scores) | SUS chart image rendering | [MIT](https://gitlab.com/pjsekai/scores/-/blob/main/LICENSE?ref_type=heads) |
| [watagashi-uni/Sekai-SUS-Parser](https://github.com/watagashi-uni/Sekai-SUS-Parser) | SUS-to-JSON WebAssembly parser used before chart rendering | [MIT](https://github.com/watagashi-uni/Sekai-SUS-Parser/blob/main/LICENSE) |
| [Team-Haruki/pjsekai-scores-rs](https://github.com/Team-Haruki/pjsekai-scores-rs) | Optional browser-side JSON-to-SVG renderer | [MIT](https://github.com/Team-Haruki/pjsekai-scores-rs/blob/main/LICENSE) |
| [Sekai-World/MikuMikuWorld](https://github.com/Sekai-World/MikuMikuWorld) | Basis of the modified JSON-to-SUS exporter | [MIT](https://github.com/Sekai-World/MikuMikuWorld/blob/master/LICENSE) |
| [Team-Haruki/Haruki-3D-Exporter](https://github.com/Team-Haruki/Haruki-3D-Exporter) | Costume 3D preview runtime asset export; author: storyxy3 | [MIT](https://github.com/Team-Haruki/Haruki-3D-Exporter/blob/main/LICENSE) |
| [Team-Haruki/sekai-scenario-player](https://github.com/Team-Haruki/sekai-scenario-player) | Live2D story playback | [MIT](https://github.com/Team-Haruki/sekai-scenario-player/blob/main/LICENSE) |
| [NeuraXmy/lunabot](https://github.com/NeuraXmy/lunabot) | Project reference | [MIT](https://github.com/NeuraXmy/lunabot/blob/master/LICENSE) |

### WebAssembly and generated JavaScript

The repository checks in browser-ready artifacts. `npm run build` does **not**
compile the C++ converters or the 3D exporter; Vite packages or copies their
prebuilt output.

#### SUS to JSON and chart images

The SUS parser is the C++17 implementation from
[Sekai-SUS-Parser](https://github.com/watagashi-uni/Sekai-SUS-Parser). With an
activated Emscripten SDK, the upstream WebAssembly target is built with:

```bash
emcmake cmake -S SusToJsonCpp -B build-wasm
cmake --build build-wasm --target sus_to_json_wasm
```

The two generated files are committed together:

- `public/wasm/sus-to-json/sus_to_json_wasm.wasm` contains the compiled parser.
- `public/wasm/sus-to-json/sus_to_json_wasm.js` is Emscripten's ES module
  loader and JavaScript/WASM glue, not a separate handwritten parser.

The frontend loads content-fingerprinted copies of both files. When rebuilding
the parser, update both fingerprinted copies and their paths in
`susToJsonWasm.ts` in the same commit. This prevents a service worker or CDN
from combining JavaScript glue from one Emscripten build with a binary from
another build.

`src/vendor/sekai-sus2img/susToJsonWasm.ts` dynamically imports the generated
loader, uses `locateFile` to resolve its adjacent `.wasm` file under Vite's base
URL, and wraps the exported `sus_to_json`, `sus_combo_count`, and `sus_free`
functions. The resulting JSON is then rendered into an image by the vendored
`sekai-sus2img` renderer, whose core rendering work is derived from
`pjsekai/scores`, or by the optional `pjsekai-scores-rs` WebAssembly renderer.
Both rendering engines always consume the C++ converter's JSON; the Rust
engine does not parse SUS in this frontend.

The Rust browser build is generated from `pjsekai-scores-rs` with its `wasm`
feature and `wasm-bindgen --target web`. Its checked-in browser artifacts are:

- `public/wasm/pjsekai-scores-rs/pjsekai_scores_rs_bg.wasm`
- `public/wasm/pjsekai-scores-rs/pjsekai_scores_rs.js`
- `public/wasm/pjsekai-scores-rs/LICENSE`

`src/vendor/sekai-sus2img/rustRendererWasm.ts` loads that pair only when the
user selects the Rust engine, passes the C++ JSON to `Score.fromJson`, and uses
`Drawing.svg` for rendering.

#### JSON to SUS

JSON-to-SUS conversion is based on a modified exporter extracted from
[MikuMikuWorld](https://github.com/Sekai-World/MikuMikuWorld) and compiled to
WebAssembly with Emscripten. The modified exporter source is not publicly
released; the original MikuMikuWorld project is licensed under MIT.

The checked-in build consists of
`public/wasm/json-to-sus/json_to_sus_wasm.wasm` and its generated Emscripten
loader `public/wasm/json-to-sus/json_to_sus_wasm.js`.
`src/vendor/sekai-sus2img/jsonToSusWasm.ts` loads this pair and provides the
TypeScript-facing conversion API. `public/sus_json_converter.js` is a separate
standalone pure-JavaScript converter and is not the Emscripten glue used by the
current conversion page.

#### Costume 3D preview

Costume preview runtime assets are produced by
[Haruki-3D-Exporter](https://github.com/Team-Haruki/Haruki-3D-Exporter), authored
by storyxy3 and released under MIT. The exporter converts Unity AssetBundles
offline into browser-oriented, Brotli-compressed MessagePack runtime packages.
The browser loads those packages through the prebuilt Haruki 3D Engine files in
`src/vendor/haruki-3d-engine/`; its generated worker chunks and Brotli WASM live
in the adjacent `assets/` directory.

Files under `public/wasm/` and generated bundles under
`src/vendor/haruki-3d-engine/` should be updated from their respective build
outputs rather than edited by hand.

The local branch `feat/3d-engine-local-update` also includes the newer
[ALONE engine](https://github.com/storyxy3/ALONE/tree/1a49f794c93625c1c8f42f8ae68d37db31aa1ecd)
under `src/vendor/alone-3d-engine/`. Its upstream commit was checked against
the remote `main` on 2026-10-28. This build preserves the local cross-role
`bodyRoleId` extension and adds the current original-bundle renderer,
transparent character canvas, archive background and independent costume
display motion selection. Source revision, patch, build commands and artifact
hashes are recorded in that directory's `SOURCE_MANIFEST.json`.

Run `npm run dev:3d` for this local preview at `http://127.0.0.1:5178`.
It reads `/data/xy/cs-unity-ref/store` through a read-only development endpoint;
override the location with `SEKAI_LOCAL_3D_STORE`. The current fixture has a
complete default Miku (`21:piapro`, body/head/hair `42/121/221`) and all 31
role motions. Other characters and costumes are not complete in this fixture
and report unavailable parts. The existing online asset service does not yet
provide this new format, so ordinary development and production builds retain
the existing engine and full online costume catalog. No asset upload or
deployment is part of this update.

The preview now keeps the custom wardrobe's unit selection synchronized with
the renderer, and initialization failures can be retried without reloading the
page. `npm run test:costume-preview` checks these host behaviors.
With `npm run dev:3d` running, `npm run test:costume-preview:browser`
loads the real Miku model and validates transparency, archive background,
motion selection, view rotation, fullscreen and error recovery. Set `BASE_URL`
for another local host, or `CHROMIUM_PATH` for a local Chromium executable.
The existing online-asset path is covered separately by
`npm run test:costume-preview:legacy`, against a normal dev server at
`http://127.0.0.1:5179` (or `BASE_URL`). It checks the real model and preserved
OrbitControls rotation, zoom, pan and unavailable-unit recovery.

ALONE is a private upstream with no project-level open-source license declared
at this revision; copyright remains with storyxy3 and its contributors. It is
not relabeled with the exporter's MIT license. Component licenses, copyright
notices and the original game-material attribution are retained in
`src/vendor/alone-3d-engine/THIRD_PARTY_NOTICES.md` and `licenses/`.
