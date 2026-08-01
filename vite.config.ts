import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',  // 改为 prompt 模式，让用户手动点击更新
      injectRegister: 'auto',
      workbox: {
        importScripts: ['push-sw.js'],
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
              cacheName: 'assets-runtime-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              plugins: [
                {
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
            // 外部图片资源 (assets.unipjsk.com) - 不通过 SW 缓存，交给浏览器 HTTP 缓存处理
            // 避免 opaque response 导致 404 被缓存的问题
            urlPattern: /^https:\/\/assets\.unipjsk\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/assets-direct\.unipjsk\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // 版本号优先走网络，离线时回退缓存，避免破坏 PWA 的离线可用性；
            // 在线时 NetworkFirst 总是走网络，长 maxAge 只影响离线兜底的可用窗口
            urlPattern: /^https:\/\/viewer-api\.unipjsk\.com\/api\/version(?:\?.*)?$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'version-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
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
