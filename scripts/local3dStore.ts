import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

/** Local-only, read-only original-bundle fixtures. Not included in builds. */
export function local3dStore(): Plugin {
  return {
    name: 'local-original-3d-store',
    apply: 'serve',
    configureServer(server) {
      if (process.env.VITE_LOCAL_3D_STORE !== '1') return
      const root = fs.realpathSync(process.env.SEKAI_LOCAL_3D_STORE ?? '/data/xy/cs-unity-ref/store')
      server.middlewares.use('/__local_3d', (req, res) => {
        if (!['GET', 'HEAD'].includes(req.method ?? '')) { res.statusCode = 405; res.end(); return }
        let pathname: string
        try { pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname) }
        catch { res.statusCode = 400; res.end(); return }
        if (!/\.(?:json|msgpack\.br|unityfs\.br|png|webp)$/.test(pathname)) { res.statusCode = 404; res.end(); return }
        try {
          const file = fs.realpathSync(path.resolve(root, '.' + pathname))
          if (!file.startsWith(root + path.sep)) { res.statusCode = 403; res.end(); return }
          const stat = fs.statSync(file)
          if (!stat.isFile()) { res.statusCode = 404; res.end(); return }
          const types: Record<string, string> = { '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' }
          res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream')
          res.setHeader('Content-Length', stat.size)
          res.setHeader('Cache-Control', 'no-cache')
          // The engine decompresses .br packages itself; omit Content-Encoding.
          if (req.method === 'HEAD') { res.end(); return }
          fs.createReadStream(file).on('error', () => res.destroy()).pipe(res)
        } catch { res.statusCode = 404; res.end() }
      })
    },
  }
}
