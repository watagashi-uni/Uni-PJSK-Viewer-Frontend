# Viewer API README (Private Backend)

> This API server is **not open source**.  

## Base URL

Set via frontend env variable:

- `VITE_API_BASE_URL`

Examples:

- Production: `https://viewer-api.unipjsk.com`
- Local: `http://127.0.0.1:5000`

## CORS

`https://viewer-api.unipjsk.com` currently allows CORS for local frontend development origin:

- `http://localhost:5173`

## Auth

Endpoints listed in this document are public in current frontend usage (no auth header required).

## Endpoints Used by `viewer-vue`

### 1) Get API/Data Version

- `GET /api/version`
- Used by: master cache versioning

Response example:

```json
{
  "dataVersion": "6.3.5.11",
  "assetVersion": "6.3.5.10",
  "appVersion": "6.3.5"
}
```

### 2) Get Master Data

- `GET /api/master/{version}/{name}`
- Used by: all master data loading (musics, cards, events, etc.)

Path params:

- `version`: data version string
- `name`: master file name (without `.json`)

Notes:

- Server returns compact JSON.
- Supports compression negotiation via `Accept-Encoding` (`zstd`, `br`, `gzip`).

### 3) Get Music Translations

- `GET /api/translations/musics`
- Used by: translated music names in list/detail pages

Response type:

- `Record<number, string>`

### 4) Get Music Metas

- `GET /api/music_metas`
- Used by: calculator worker data provider

Success:

- `200` with JSON array/object from local `music_metas.json`

Failure:

- `503` if source file not found

### 5) Detect User Region (CN / Global assets)

- `GET /api/location`
- Used by: settings store to choose asset host

Response example:

```json
{
  "isChina": true
}
```

### 6) Get pjskb30 Constants

- `GET /api/pjskb30`
- Used by: music list constant display mode

Response:

- `text/plain` (TSV)
- Row format: `id\tdifficulty\tconstant`

### 7) SUS to Image

- `POST /api/sus2img`
- Content-Type: `multipart/form-data`
- Used by: `Sus2ImgView` backend rendering/fallback

Form fields (used by frontend):

- `chart`: SUS text content
- `rebase`: JSON string or empty
- `title`
- `artist`
- `author`
- `difficulty`
- `playlevel`
- `pixel`: integer string, max `600`
- `form`: `svg` | `png`
- `skin`: e.g. `custom01`

Success response:

```json
{
  "success": true,
  "format": "svg",
  "url": "https://.../api/chart/<filename>.svg"
}
```

Error response:

```json
{
  "success": false,
  "error": "error message"
}
```

### 8) Chart Share Upload (May be deleted in the future)

- `POST /api/chart-share`
- Content-Type: `multipart/form-data`
- Used by: `ChartShareView`

Form files:

- `sus`: `.sus` or `.txt` (max 10MB)
- `bgm`: `.mp3` (max 30MB)

Success response:

```json
{
  "success": true,
  "url": "https://.../s/<share_id>"
}
```

Error response:

```json
{
  "success": false,
  "message": "error message"
}
```

## Related Public File Endpoints (Indirect)

These are not posted directly by frontend forms, but are part of the returned URLs:

- `GET /api/chart/<filename>`
  - serves generated `.svg` / `.png` from `sus2img`
- `GET /s/<share_id>`
  - short URL redirect to chart preview page
- `GET /api/chart-share/<share_id>/<filename>`
  - serves `chart.sus` / `bgm.mp3`

## Frontend Reference Files

- `src/api/client.ts`
- `src/api/version.ts`
- `src/api/master.ts`
- `src/utils/dataProvider.ts`
- `src/views/Sus2ImgView.vue`
- `src/views/ChartShareView.vue`
- `src/views/MusicsView.vue`
- `src/stores/settings.ts`
