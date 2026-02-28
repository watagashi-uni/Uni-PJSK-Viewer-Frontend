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
        // 1. 取消 js/css 预缓存，只预留入口 HTML 和必要图标。其余资源按需下载
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
            // JS / CSS 按需缓存：用户访问到哪个页面加载的 chunk 就缓存那个，只缓存当前需要的
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-runtime-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
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
        navigateFallbackDenylist: [/^\/img\//, /^\/api\//, /^\/cursors\//],
      },
      manifest: {
        name: 'Uni PJSK Viewer',
        short_name: 'UniPJSK',
        description: 'A modern Project SEKAI resource viewer.',
        theme_color: '#34DDFF',
        icons: [
          {
            src: 'https://assets-direct.unipjsk.com/startapp/thumbnail/chara/res017_no037_after_training.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://assets-direct.unipjsk.com/startapp/thumbnail/chara/res017_no037_after_training.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'https://assets-direct.unipjsk.com/startapp/thumbnail/chara/res017_no037_after_training.png',
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
    },
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
