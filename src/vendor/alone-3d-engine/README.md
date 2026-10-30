# ALONE cross-role body integration

This independent checkout is based on `storyxy3/ALONE` commit
`1a49f794c93625c1c8f42f8ae68d37db31aa1ecd` (2026-10-26). It was created with a
shared clone from `/data/xy/ALONE`; that repository and the earlier
`/data/watagashi/Haruki-3D-Viewer-CrossBody` working tree were not modified.

The patch ports the earlier optional `bodyRoleId` recipe field. A foreign body
catalog is merged lazily and must match the active catalog's `masterVersion`.
The selected body and its character height come from that source role. Head,
hair, skin colors and compatibility stay on the active `roleId`; the existing
upstream `motionRoleId` still independently selects display motion. The new
base runtime's prepared-model key includes `bodyRoleId`.

The paused first frame also samples the selected body/facial animation at its
current time. A zero-time frame does not run motion Update/LateUpdate, consume
the pending spring settle, or integrate/reset spring bones. This fixes the
initial T-pose in static/reduced-motion consumers; a costume rebind retains its
motion time instead of restarting it.

The public factory accepts `framing?: "default" | "upper-body"`. Omitting it
or selecting `default` preserves the existing camera. `upper-body` selects the
existing `capture` / `official-default` camera at `(0, 1.25, 2.3)`, looking at
`(0, 1.25, 0)` with a 25-degree field of view. It does not enable the full-screen
CostumeShop UI composite. This is an opt-in presentation setting; Viewer keeps
its existing framing when it does not pass the option.

This build requires ALONE's original-bundle store. It cannot consume the old
exporter's mesh/runtime packages. The generated library is installed separately
as `src/vendor/alone-3d-engine`; the existing Viewer engine and aliases stay
available for the existing production assets. No Viewer application source is
part of this package.

Build and targeted checks:

```sh
bun install --frozen-lockfile
bun run build:lib
bun run build:types
bun test tests/render-recipe.test.mjs tests/accessory-package-selection.test.mjs tests/cross-body-registry.test.mjs tests/kernel-lifecycle-behavior.test.mjs tests/public-interface.test.mjs tests/runtime-module-entries.test.mjs tests/engine-module-behavior.test.mjs tests/runtime-original-motion.test.mjs
bun run build:consumer
bun scripts/checks/check-consumer-build.mjs
node tests/public-framing-browser.mjs
```

The checks cover cross-role lazy loading, master-version rejection, source body
height with active-role skin/head, independent body/motion roles, prepared-model
cache invalidation, initial body/facial sampling without time or spring steps,
the public API and lifecycle, and consumer worker/WASM rebundling. All 56
targeted tests passed on 2026-10-28. Consumer build emits the
upstream large-chunk warning for the official shader programs.

The MMW consumer's `tests/gameplay-result-character-gpu-browser.mjs` also passed
with the real local Miku bundle and WebGL renderer. The initial static pose's
silhouette overlaps the first playing frames by more than 0.8 IoU (the old
T-pose scored 0.54). Visual review confirms the normal initial costume pose;
reduced-motion samples stay identical, animation advances when enabled, and
the character background stays transparent.

`tests/public-framing-browser.mjs` constructs the public factory with real
WebGL contexts and compares the actual camera snapshots: omitted and explicit
default are identical, upper-body selects the existing close camera, and that
framing survives resize and view rotation without rotating the model itself.

After building, `node scripts/integration/vendor-build.mjs <destination> ...`
copies the generated output, `.d.ts` entry shims, this note, the source patch,
third-party notices and a SHA-256 file manifest. It does not commit, upload or
deploy anything.
