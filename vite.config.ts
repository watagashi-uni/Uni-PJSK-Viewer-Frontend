import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { local3dStore } from './scripts/local3dStore'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    local3dStore(),
    vue(),
    tailwindcss(),
    VitePWA({
      // 强制更新：新 SW 装好立即接管（skipWaiting + clientsClaim），push-sw.js 通知
      // 所有页面刷新到新版本，不再等用户点击。保留 prompt 是为了不让插件再注入
      // 自己的自动刷新逻辑，刷新统一由 push-sw.js 的握手负责。
      registerType: 'prompt',
      injectRegister: 'auto',
      workbox: {
        importScripts: ['push-sw.js'],
        skipWaiting: true,
        clientsClaim: true,
        // 只预缓存入口与 PWA 元数据；页面 chunk 继续按实际访问情况写入运行时缓存。
        globPatterns: ['**/*.{html,ico,svg,webmanifest}'],
        // 2. 排除隐藏页面和特定文件的预缓存
        globIgnores: [
          '**/node_modules/**/*',
          'sw.js',
          'workbox-*.js',
        ],
        // 允许缓存较大的资源文件 (如 masterdata 和 mp3)
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // 运行时缓存策略
        runtimeCaching: [
          {
            // 本地应用代码按需缓存。EdgeOne 可能为缺失资源返回 200 HTML，必须同时校验
            // 状态码和 MIME；错误响应仍会触发页面恢复逻辑，但绝不会写入 SW 缓存。
            urlPattern: /\.(?:js|css|wasm)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              // 使用新缓存名，避免继续读取旧版本可能已经污染的条目。
              cacheName: 'assets-runtime-cache-v2',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              plugins: [
                {
                  cachedResponseWillBeUsed: async ({ request, cachedResponse }) => {
                    if (!cachedResponse || cachedResponse.status !== 200) return null

                    const pathname = new URL(request.url).pathname.toLowerCase()
                    const contentType = cachedResponse.headers.get('content-type')?.toLowerCase() ?? ''

                    if (pathname.endsWith('.css')) {
                      return contentType.includes('text/css') ? cachedResponse : null
                    }
                    if (pathname.endsWith('.wasm')) {
                      return contentType.includes('application/wasm') ? cachedResponse : null
                    }
                    if (pathname.endsWith('.js')) {
                      return /(?:java|ecma)script/.test(contentType) ? cachedResponse : null
                    }
                    return null
                  },
                  cacheWillUpdate: async ({ request, response }) => {
                    if (response.status !== 200) return null

                    const pathname = new URL(request.url).pathname.toLowerCase()
                    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''

                    if (pathname.endsWith('.css')) {
                      return contentType.includes('text/css') ? response : null
                    }
                    if (pathname.endsWith('.wasm')) {
                      return contentType.includes('application/wasm') ? response : null
                    }
                    if (pathname.endsWith('.js')) {
                      return /(?:java|ecma)script/.test(contentType) ? response : null
                    }
                    return null
                  },
                },
              ],
            },
          },
          {
            // 3D role catalog：引擎契约要求保持新鲜（携带 masterVersion），网络优先、离线回退缓存
            urlPattern: /^https:\/\/3d-export\.unipjsk\.com\/.*runtime-role-catalog\.msgpack\.br/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pjsk-3d-catalog',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 3D 运行时资源：网格/贴图按内容寻址、registry 等带 masterVersion 查询参数，
            // 均可安全地缓存优先；LRU 上限控制占用
            urlPattern: /^https:\/\/3d-export\.unipjsk\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pjsk-3d-assets',
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
                purgeOnQuotaError: true,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 本地角色头像 (img/chr_ts/*.png) - 用户浏览后缓存，持久化存储
            urlPattern: /^.*\/img\/chr_ts\/chr_ts_.*\.png$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'chara-images-cache',
              expiration: {
                maxEntries: 150, // 足够容纳所有角色与部分变体
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 国内源（域名由 /api/version 下发，限 assets-*.unipjsk.com）与海外源的图片路径一致、
            // 画面等价（只是 PNG 压缩不同），共用一份缓存，
            // 切换源不必重新下载。音频走 Range 请求，谱面等非图片资源不走这条，仍由下方 NetworkOnly 处理。
            urlPattern: /^https:\/\/assets(?:-[a-z0-9-]+)?\.unipjsk\.com\/[^?#]*\.(?:png|jpe?g|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pjsk-shared-images',
              // cors：<img> 默认是 no-cors，只能拿到读不出状态码的 opaque 响应，404 会混进缓存。
              // no-cache：海外源的 404 带 max-age=14400 且没有校验器，不能信任 HTTP 缓存里的结果；
              // 已有的 200 带 ETag，重新验证只会得到 304，不会重新下载。
              fetchOptions: {
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-cache',
              },
              // 缓存键已统一，两个源不同的 Vary 头不应影响命中。
              matchOptions: {
                ignoreVary: true,
              },
              expiration: {
                maxEntries: 5000,
                maxAgeSeconds: 60 * 60 * 24 * 30,
                purgeOnQuotaError: true,
              },
              plugins: [
                {
                  // 这里的函数会被序列化进 sw.js，不能引用外部变量。
                  cacheKeyWillBeUsed: async ({ request }) => {
                    const url = new URL(request.url)
                    url.hostname = 'assets.unipjsk.com'
                    return url.href
                  },
                  // 只缓存真实图片：不写入 404 等错误，也不写入被当作 200 返回的 HTML 错误页。
                  cacheWillUpdate: async ({ response }) => {
                    if (response.status !== 200) return null
                    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
                    return contentType.startsWith('image/') ? response : null
                  },
                  // 国内源有 Referer 白名单，白名单外会 302 到海外源，而该 302 不带 CORS 头。
                  // CORS 拉取失败时退回页面的原始请求，保持未接入缓存时的表现（不写入缓存）。
                  handlerDidError: async ({ request }) => fetch(request),
                },
              ],
            },
          },
          {
            urlPattern: /^https:\/\/assets\.unipjsk\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/assets-[a-z0-9-]+\.unipjsk\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // COS version must always use the network; IndexedDB provides offline fallback.
            urlPattern: /^https:\/\/jp-master\.unipjsk\.com\/api\//i,
            handler: 'NetworkOnly',
          },
          {
            // 翻译 API - 使用 NetworkFirst，确保刷新时拿到最新数据
            urlPattern: /^https:\/\/viewer-api\.unipjsk\.com\/api\/translations\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'translations-cache',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24, // 1 天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 其他 API 请求 (master data 等)
            urlPattern: /^https:\/\/viewer-api\.unipjsk\.com\/api\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // 清理旧版本缓存
        cleanupOutdatedCaches: true,
        // 排除对 /img/ 和 /api/ 等路径的 fallback 拦截
        navigateFallbackDenylist: [
          /^\/assets\//,
          /^\/img\//,
          /^\/api\//,
          /^\/cursors\//,
          /^\/(?:sw|push-sw)\.js$/,
          /^\/workbox-[^/]+\.js$/,
        ],
      },
      manifest: {
        name: 'Uni PJSK Viewer',
        short_name: 'UniPJSK',
        description: 'A modern Project SEKAI resource viewer.',
        theme_color: '#34DDFF',
        icons: [
          {
            src: '/pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'moesekai-calculator': resolve(__dirname, 'src/vendor/moesekai-calculator/index.mjs'),
      // internal 在前：别名按前缀匹配，防止被 haruki-3d-engine 吞掉
      'haruki-3d-engine/internal': resolve(__dirname, 'src/vendor/haruki-3d-engine/haruki-3d-engine-internal.js'),
      'haruki-3d-engine': resolve(__dirname, 'src/vendor/haruki-3d-engine/haruki-3d-engine.js'),
      'alone-3d-engine': resolve(__dirname, 'src/vendor/alone-3d-engine/haruki-3d-engine.js'),
    },
  },
  optimizeDeps: {
    // brotli-wasm 通过 import.meta.url 引用 wasm，预打包会破坏其路径解析
    exclude: ['brotli-wasm'],
  },
  build: {
    rollupOptions: {
      output: {
        // 确保 chunk 文件名包含原始名称，以便 PWA 插件排除
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://viewer-api.unipjsk.com',
        changeOrigin: true,
      },
    },
  },
})
