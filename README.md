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
VITE_CHART_PREVIEW_URL=http://localhost:5175
VITE_TOOLBOX_OAUTH_BASE_URL=https://toolbox-api-direct.haruki.seiunx.com
VITE_TOOLBOX_OAUTH_CLIENT_ID=uni-viewer-public
```

Variable notes:
- `VITE_API_BASE_URL`: fixed version API base URL. Other viewer backend requests use the `apiEndpoint` value returned by `GET /api/version`, falling back to this value if missing.
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
