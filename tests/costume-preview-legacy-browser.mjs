import assert from 'node:assert/strict'
import { chromium } from 'playwright'

// Standard Vite, without VITE_LOCAL_3D_STORE: exercise the existing online assets.
const base = process.env.BASE_URL ?? 'http://127.0.0.1:5179'
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 960 }, serviceWorkers: 'block' })
const errors = []
const requests = []
page.on('pageerror', error => errors.push(error.message))
page.on('request', request => requests.push(request.url()))

async function loaded() {
  await page.locator('progress').waitFor({ state: 'hidden', timeout: 120000 })
  assert.deepEqual(await page.locator('.text-error').allTextContents(), [], 'legacy preview reports no error')
}
const camera = () => page.evaluate(() => window.legacyPreviewEngine.getCameraDebugSnapshot())

try {
  await page.goto(`${base}/tests/fixtures/costume-preview.html`)
  await page.getByRole('button', { name: '加载 3D 预览', exact: true }).waitFor()
  // Observe the real engine's diagnostics without replacing its loading/rendering.
  await page.evaluate(async () => {
    const { Haruki3DEngine } = await import('/src/vendor/haruki-3d-engine/haruki-3d-engine-internal.js')
    const load = Haruki3DEngine.prototype.loadRenderRecipe
    Haruki3DEngine.prototype.loadRenderRecipe = function (...args) {
      window.legacyPreviewEngine = this
      return load.apply(this, args)
    }
  })
  await page.getByRole('button', { name: '加载 3D 预览', exact: true }).click()
  await loaded()
  assert.equal(await page.getByRole('button', { name: '显示原版背景', exact: true }).count(), 0)
  assert.ok(requests.some(url => url.startsWith('https://3d-export.unipjsk.com/jp/')))
  assert.equal(requests.some(url => url.includes('/__local_3d/')), false)
  const pixels = await page.locator('canvas').evaluate(canvas => new Promise(resolve => requestAnimationFrame(() => {
    const gl = canvas.getContext('webgl2')
    const rgba = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, rgba)
    const colors = new Set()
    for (let i = 0; i < rgba.length; i += 16) colors.add(`${rgba[i]},${rgba[i + 1]},${rgba[i + 2]},${rgba[i + 3]}`)
    resolve({ width: canvas.width, height: canvas.height, distinctColors: colors.size })
  })))
  assert.ok(pixels.width >= 500 && pixels.height >= 300 && pixels.distinctColors > 100, 'legacy GPU produced the character frame')
  await page.screenshot({ path: '/tmp/uni-viewer-3d-legacy.png' })

  const bounds = await page.locator('canvas').boundingBox()
  const initial = await camera()
  await page.mouse.move(bounds.x + bounds.width * 0.45, bounds.y + bounds.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width * 0.65, bounds.y + bounds.height * 0.5, { steps: 8 })
  await page.mouse.up()
  const rotated = await camera()
  assert.ok(Math.abs(rotated.azimuthDegrees - initial.azimuthDegrees) > 1, 'OrbitControls rotates the real camera')
  await page.mouse.wheel(0, -240)
  await page.waitForFunction(distance => window.legacyPreviewEngine.getCameraDebugSnapshot().distance < distance - 0.01, rotated.distance)
  const zoomed = await camera()
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(bounds.x + bounds.width * 0.7, bounds.y + bounds.height * 0.6, { steps: 5 })
  await page.mouse.up({ button: 'right' })
  assert.notDeepEqual((await camera()).target, zoomed.target, 'right drag still pans the camera target')
  await page.screenshot({ path: '/tmp/uni-viewer-3d-legacy-orbit.png' })

  await page.evaluate(() => { window.costumePreviewFixture.props.unit = 'missing_test_unit' })
  await page.locator('.text-error').waitFor({ timeout: 60000 })
  assert.match(await page.locator('.text-error').innerText(), /3D|HTTP/)
  await page.evaluate(() => { window.costumePreviewFixture.props.unit = 'piapro' })
  await loaded()
  assert.ok(await camera(), 'valid unit recovers on the existing engine')
  await page.evaluate(() => window.costumePreviewFixture.unmount())
  assert.equal(await page.locator('canvas').count(), 0)
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ result: 'PASS', pixels, screenshots: ['/tmp/uni-viewer-3d-legacy.png', '/tmp/uni-viewer-3d-legacy-orbit.png'] }))
} finally { await browser.close() }
