import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { chromium } from 'playwright'

const base = process.env.BASE_URL || 'http://127.0.0.1:5189'
const localRoot = process.env.STORY_ASSET_ROOT && resolve(process.env.STORY_ASSET_ROOT)
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' })
const errors = [], failed = [], requests = []
page.on('pageerror', error => errors.push(error.message))
page.on('request', req => requests.push(req.url()))
page.on('response', res => { if (res.status() >= 400) failed.push({ status: res.status(), url: res.url() }) })
if (localRoot) {
  await page.route('https://assets.unipjsk.com/**', async route => {
    const relative = decodeURIComponent(new URL(route.request().url()).pathname.slice(1))
    const path = resolve(localRoot, relative)
    try {
      const file = relative === 'story-player/index.json' ? process.env.STORY_PLAYER_INDEX : path
      assert.ok(path.startsWith(localRoot + sep))
      const size = (await stat(file)).size
      const contentType = path.endsWith('.png') ? 'image/png' : path.endsWith('.mp3') ? 'audio/mpeg' : path.endsWith('.mp4') ? 'video/mp4' : path.endsWith('.moc3') ? 'application/octet-stream' : 'application/json'
      await route.fulfill({ status: 200, contentType, headers: { 'access-control-allow-origin': '*', 'content-length': String(size) }, body: await readFile(file) })
    } catch { await route.fulfill({ status: 404, headers: { 'access-control-allow-origin': '*' }, body: '' }) }
  })
}
try {
  await page.goto(`${base}/tests/fixtures/story-player.html`)
  await page.locator('.pjsk-start').waitFor({ timeout: 90000 })
  await page.locator('.pjsk-start').click()
  await page.locator('.pjsk-overlay').waitFor({ state: 'hidden', timeout: 90000 })
  await page.waitForFunction(() => Number(document.querySelector('[aria-label="台词进度"]').value) >= 0 && !!document.querySelector('.pjsk-player canvas'))
  await page.waitForTimeout(4000)
  assert.deepEqual(await page.locator('[role="alert"]').allTextContents(), [])
  await page.screenshot({ path: '/tmp/unipjsk-story-desktop.png' })
  // WebGL pixels prove a real Live2D character rendered (the backdrop is DOM).
  const coverage = await page.locator('.pjsk-player canvas').evaluate(canvas => new Promise(resolve => requestAnimationFrame(() => {
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    let visible = 0
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) visible++
    resolve(visible / (pixels.length / 4))
  })))
  assert.ok(coverage > 0.01, `Live2D rendered: alpha coverage ${coverage}`)
  assert.ok(requests.some(url => url.endsWith('.moc3')))
  assert.ok(requests.some(url => url.endsWith('.motion3.json')))
  assert.ok(requests.some(url => url.endsWith('.mp3')))
  await page.getByRole('button', { name: '文本模式', exact: true }).click()
  assert.equal(await page.locator('.pjsk-player').count(), 0, 'text mode releases the player')
  const lines = page.locator('.script-line')
  assert.ok(await lines.count() > 10)
  const targetLine = 4
  const text = await lines.nth(targetLine).locator('strong').innerText()
  await page.getByPlaceholder('搜索台词或人物…').fill(text)
  assert.ok(await lines.count() > 0)
  await page.getByPlaceholder('搜索台词或人物…').fill('')
  await lines.nth(targetLine).click()
  await page.locator('.pjsk-start').waitFor({ timeout: 30000 })
  await page.locator('.pjsk-start').click()
  await page.waitForFunction(line => Number(document.querySelector('[aria-label="台词进度"]').value) === line, targetLine, { timeout: 90000 })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: '/tmp/unipjsk-story-mobile.png' })
  // Force the iPhone-style fullscreen fallback: it must cover the viewport
  // even though the normal player is sized inside the reader.
  await page.evaluate(() => { document.querySelector('.pjsk-player').requestFullscreen = undefined })
  await page.locator('.pjsk-menu').click()
  await page.locator('[data-k="fullscreen"]').click()
  await page.locator('.pjsk-pseudo-fs').waitFor()
  const full = await page.locator('.pjsk-player').boundingBox()
  assert.ok(full.width >= 389 && full.height >= 843, `fullscreen covers viewport: ${JSON.stringify(full)}`)
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('.pjsk-pseudo-fs').count(), 0)
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.reload()
  await page.locator('.pjsk-start').waitFor({ timeout: 30000 })
  assert.equal(Number(await page.getByLabel('台词进度').inputValue()), targetLine, 'saved position restored')
  // Destroy while model preloads are still allowed to be pending.
  await page.evaluate(() => window.storyPlayerFixture.unmount())
  await page.waitForTimeout(1000)
  assert.equal(await page.locator('.pjsk-player').count(), 0)
  await page.route('https://assets.unipjsk.com/story-player/index.json', route => route.fulfill({ status: 503, headers: { 'access-control-allow-origin': '*' }, body: 'unavailable' }))
  await page.reload()
  await page.getByRole('button', { name: '阅读文本', exact: true }).waitFor({ timeout: 30000 })
  await page.getByRole('button', { name: '阅读文本', exact: true }).click()
  assert.ok(await page.locator('.script-line').count() > 10, 'text remains readable when the player index fails')
  assert.deepEqual(errors, [])
  const requiredFailures = failed.filter(x => /\.moc3$|\.model3$|\.motion3\.json$|\.physics3$|\/story-player\/index\.json$/.test(x.url))
  assert.deepEqual(requiredFailures.filter(x => x.status !== 503), [])
  console.log(JSON.stringify({ result: 'PASS', source: localRoot ? 'local' : 'public', coverage, requests: requests.length, optionalMissing: failed.length, screenshots: ['/tmp/unipjsk-story-desktop.png', '/tmp/unipjsk-story-mobile.png'] }))
} catch (error) {
  await page.screenshot({ path: '/tmp/unipjsk-story-failure.png' }).catch(() => {})
  console.error(JSON.stringify({ errors, failed, body: (await page.locator('body').innerText()).slice(0, 1500) }))
  throw error
} finally { await browser.close() }
