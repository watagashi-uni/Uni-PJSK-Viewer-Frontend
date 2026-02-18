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
        // 1. 移除 jpg, jpeg, png, mp3, json，只保留核心代码和图标
        globPatterns: ['**/*.{js,css,html,ico,svg}'],
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
            // 外部图片资源 (assets.unipjsk.com) - 不通过 SW 缓存，交给浏览器 HTTP 缓存处理
            // 避免 opaque response 导致 404 被缓存的问题
            urlPattern: /^https:\/\/assets\.unipjsk\.com\/.*/i,
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
      },
      manifest: {
        name: 'Uni PJSK Viewer',
        short_name: 'UniPJSK',
        description: 'A modern Project SEKAI resource viewer.',
        theme_color: '#34DDFF',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
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
