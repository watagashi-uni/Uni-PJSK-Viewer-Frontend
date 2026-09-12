// Standalone static preview. Bind only to loopback or the machine's Tailscale IP.
// STORY_PREVIEW_HOST=100.x.y.z STORY_PREVIEW_DIR=dist-story-preview node scripts/story-preview.mjs
import http from 'node:http'
import https from 'node:https'
import { createReadStream } from 'node:fs'
import { stat, realpath } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBrotliDecompress, createGzip } from 'node:zlib'
import { pipeline } from 'node:stream'

const root = await realpath(resolve(process.env.STORY_PREVIEW_DIR || fileURLToPath(new URL('../dist-story-preview', import.meta.url))))
const host = process.env.STORY_PREVIEW_HOST || '127.0.0.1'
const port = Number(process.env.STORY_PREVIEW_PORT || 4175)
if (host !== '127.0.0.1' && !/^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d+\.\d+$/.test(host)) throw new Error('Bind the preview to loopback or a Tailscale IPv4 address')
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.wasm': 'application/wasm', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }
const server = http.createServer(async (request, response) => {
  const fail = (code, message) => { if (!response.headersSent) response.writeHead(code, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }); response.end(message) }
  if (!['GET', 'HEAD'].includes(request.method)) return fail(405, 'Read-only preview')
  try {
    const url = new URL(request.url, 'http://preview.local')
    const proxy = url.pathname.startsWith('/preview-master/api/') ? ['https://jp-master.unipjsk.com', '/preview-master']
      : url.pathname.startsWith('/preview-api/api/') ? ['https://viewer-api.unipjsk.com', '/preview-api'] : null
    if (proxy) {
      // Only the public reads used by this preview. Never proxy arbitrary URLs,
      // authorization headers, cookies, or production write endpoints.
      const path = url.pathname.slice(proxy[1].length)
      if (!(proxy[1] === '/preview-master'
        ? /^\/api\/(?:version|master\/[\w.-]+\/[\w.-]+)$/.test(path)
        : /^\/api\/(?:translations\/[\w-]+|location|version)$/.test(path))) return fail(404, 'Unsupported preview API route')
      const upstream = https.request(new URL(path + url.search, proxy[0]), { method: request.method, headers: { 'Accept-Encoding': 'br, gzip', 'User-Agent': 'Sekai-story-preview/1' }, timeout: 30000 }, incoming => {
        const headers = { ...incoming.headers, 'cache-control': 'no-store' }
        delete headers['set-cookie']; delete headers['access-control-allow-origin']
        // COS stores master JSON as Brotli. Plain HTTP tailnet clients may not
        // decode br, unlike trustworthy localhost. Serve those bytes as gzip.
        const transcode = incoming.headers['content-encoding'] === 'br'
        if (transcode) {
          headers['content-encoding'] = 'gzip'
          delete headers['content-length']; delete headers.etag; delete headers['content-md5']
        }
        response.writeHead(incoming.statusCode || 502, headers)
        if (transcode && request.method !== 'HEAD') pipeline(incoming, createBrotliDecompress(), createGzip(), response, error => { if (error) response.destroy() })
        else pipeline(incoming, response, error => { if (error) response.destroy() })
      })
      upstream.on('timeout', () => upstream.destroy(new Error('Upstream timeout')))
      upstream.on('error', () => fail(502, 'Upstream unavailable'))
      response.on('close', () => upstream.destroy())
      upstream.end(); return
    }
    let name = decodeURIComponent(url.pathname)
    if (name === '/') name = '/index.html'
    if (name.includes('\0') || name.split('/').some(part => part.startsWith('.') && part !== '')) return fail(404, 'Not found')
    let path = resolve(root, '.' + name)
    if (!path.startsWith(root + sep)) return fail(404, 'Not found')
    let info = await stat(path).catch(() => null)
    if (!info?.isFile()) {
      if (extname(name) || name.startsWith('/preview-')) return fail(404, 'Not found')
      path = resolve(root, 'index.html'); info = await stat(path)
    }
    if (!(await realpath(path)).startsWith(root + sep)) return fail(404, 'Not found')
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' })
    if (request.method === 'HEAD') response.end()
    else createReadStream(path).on('error', () => response.destroy()).pipe(response)
  } catch { fail(400, 'Invalid request') }
})
server.listen(port, host, () => console.log(`Story preview ready: http://${host}:${port}/stories`))
