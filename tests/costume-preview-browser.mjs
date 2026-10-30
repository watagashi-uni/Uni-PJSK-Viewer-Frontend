import assert from 'node:assert/strict'
import { chromium } from 'playwright'

// Run against npm run dev:3d with its local original-bundle store mounted.
const base = process.env.BASE_URL ?? 'http://127.0.0.1:5178'
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
  assert.deepEqual(await page.locator('.text-error').allTextContents(), [], 'preview reports no error')
}

async function canvasCoverage() {
  return page.locator('canvas').evaluate(canvas => new Promise(resolve => requestAnimationFrame(() => {
    const gl = canvas.getContext('webgl2')
    const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight
    const pixels = new Uint8Array(width * height * 4)
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    let opaque = 0
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) opaque++
    resolve({ width, height, coverage: opaque / (width * height) })
  })))
}

try {
  await page.goto(`${base}/tests/fixtures/costume-preview.html`)
  await page.getByRole('button', { name: '加载 3D 预览', exact: true }).waitFor()
  assert.equal(requests.some(url => url.includes('/original/bundles.json')), false, 'original assets stay lazy')
  await page.getByRole('button', { name: '加载 3D 预览', exact: true }).click()
  await loaded()
  const transparent = await canvasCoverage()
  assert.ok(transparent.width >= 500 && transparent.height >= 300)
  assert.ok(transparent.coverage > 0.01 && transparent.coverage < 0.8, `character has visible pixels with transparent surroundings: ${transparent.coverage}`)
  await page.screenshot({ path: '/tmp/uni-viewer-3d-transparent.png' })

  await page.getByRole('button', { name: '显示原版背景', exact: true }).click()
  await page.getByRole('button', { name: '隐藏原版背景', exact: true }).waitFor({ timeout: 60000 })
  const archive = await canvasCoverage()
  assert.ok(archive.coverage > 0.99, `archive covers the canvas: ${archive.coverage}`)
  await page.screenshot({ path: '/tmp/uni-viewer-3d-archive.png' })

  await page.getByLabel('展示动作来源').selectOption('1:light_sound')
  await loaded()
  assert.equal(await page.getByLabel('展示动作来源').inputValue(), '1:light_sound')
  assert.equal(await page.evaluate(() => window.costumePreviewFixture.props.characterId), 21, 'other motion keeps Miku selected')
  const canvas = page.locator('canvas')
  const bounds = await canvas.boundingBox()
  await page.mouse.move(bounds.x + bounds.width * 0.4, bounds.y + bounds.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width * 0.7, bounds.y + bounds.height * 0.5, { steps: 8 })
  await page.mouse.up()
  await page.screenshot({ path: '/tmp/uni-viewer-3d-motion-drag.png' })
  await page.getByRole('button', { name: '全屏', exact: true }).click()
  assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden')
  await page.keyboard.press('Escape')
  assert.equal(await page.evaluate(() => document.body.style.overflow), '')

  await page.getByRole('button', { name: '隐藏原版背景', exact: true }).click()
  await page.getByRole('button', { name: '显示原版背景', exact: true }).waitFor()
  assert.ok((await canvasCoverage()).coverage < 0.8)
  await page.evaluate(() => { window.costumePreviewFixture.props.characterId = 999 })
  await page.locator('.text-error').waitFor({ timeout: 60000 })
  assert.match(await page.locator('.text-error').innerText(), /3D|HTTP 404/)
  await page.evaluate(() => { window.costumePreviewFixture.props.characterId = 21 })
  await loaded()
  assert.ok((await canvasCoverage()).coverage > 0.01, 'supported role recovers after an unavailable role')
  await page.evaluate(() => window.costumePreviewFixture.unmount())
  assert.equal(await page.locator('canvas').count(), 0)
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ result: 'PASS', transparent, archive, screenshots: ['/tmp/uni-viewer-3d-transparent.png', '/tmp/uni-viewer-3d-archive.png', '/tmp/uni-viewer-3d-motion-drag.png'] }))
} finally { await browser.close() }
