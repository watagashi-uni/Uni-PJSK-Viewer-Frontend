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
- `VITE_API_BASE_URL`: backend API base URL (master/version/chart-share/sus2img etc.)
- `VITE_CHART_PREVIEW_URL`: chart preview service URL used in music detail page
- `VITE_TOOLBOX_OAUTH_BASE_URL`: Haruki toolbox OAuth server base URL
- `VITE_TOOLBOX_OAUTH_CLIENT_ID`: OAuth client id for toolbox game-data read scope

## Contributing

1. Create a branch: `git checkout -b feature/<name>`
2. Implement and self-check: `npm run lint && npm run build`
3. Commit: `git commit -m "feat: ..."` (or `fix/chore/refactor`)
4. Open a PR with scope, impact, and screenshots for UI changes

### Dependencies / References

| Project | License |
|---|---|
| [Sekai-World/sekai-viewer](https://github.com/Sekai-World/sekai-viewer) | GPL-3.0 |
| [xfl03/sekai-calculator](https://github.com/xfl03/sekai-calculator) | LGPL-2.1 |
| [xfl03/33KitFrontend](https://github.com/xfl03/33KitFrontend) | — |
| [Next-SEKAI/sonolus-next-sekai-editor](https://github.com/Next-SEKAI/sonolus-next-sekai-editor) | MIT |
| [pjsekai/scores](https://gitlab.com/pjsekai/scores) | [MIT](https://gitlab.com/pjsekai/scores/-/blob/main/LICENSE?ref_type=heads) |
| [NeuraXmy/lunabot](https://github.com/NeuraXmy/lunabot) | [MIT](https://github.com/NeuraXmy/lunabot/blob/master/LICENSE) |
