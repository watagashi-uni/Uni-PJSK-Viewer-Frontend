<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, watch } from 'vue'
import { useModalDialog } from '@/composables/useModalDialog'
import { RouterView, useRoute } from 'vue-router'
import { isRouteLoading } from '@/router'
import AppNavbar from '@/components/AppNavbar.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import SpoilerRulesDialog from '@/components/SpoilerRulesDialog.vue'
import SpoilerWatermark from '@/components/SpoilerWatermark.vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { useAccountStore } from '@/stores/account'
import { useOAuthStore } from '@/stores/oauth'
import { useNotificationStore } from '@/stores/notification'
import AppSidebar from '@/components/AppSidebar.vue'
import PlayerBar from '@/components/player/PlayerBar.vue'
import NowPlayingView from '@/components/player/NowPlayingView.vue'
import PlayerLyricsSidebar from '@/components/player/PlayerLyricsSidebar.vue'
import { usePlayerStore } from '@/stores/player'
import { useGlobalSearch } from '@/composables/useGlobalSearch'

// 搜索面板的代码不进首屏包；空闲时预取，第一次按快捷键就能立刻输入。
// 这里只是组件代码，搜索用的数据仍然等到面板打开才加载
const loadGlobalSearch = () => import('@/components/GlobalSearch.vue')
const GlobalSearch = defineAsyncComponent(loadGlobalSearch)

const route = useRoute()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()
const oauthStore = useOAuthStore()
const notificationStore = useNotificationStore()
const playerStore = usePlayerStore()
const globalSearch = useGlobalSearch()
const { onDialogClose: onOAuthConfirmClose } = useModalDialog(
  'oauthConfirmDialog',
  () => accountStore.oauthConfirmVisible,
  () => accountStore.cancelOAuth(),
)

const currentYear = new Date().getFullYear()

const isFullscreen = computed(() => route.meta.fullscreen === true)
// key 只含 path：翻页/筛选等 query 变化由各页面自身响应（均为 computed/watch 驱动），
// 不整树重建；cacheRevision 变化（master 版本更新清缓存）时仍强制重建
const routerViewKey = computed(() => `${route.path}:${masterStore.cacheRevision}`)

onMounted(async () => {
  if ('caches' in window) {
    caches.delete('external-images')
  }
  settingsStore.initialize()
  globalSearch.installHotkeys()
  // Restores the queue of the last visit (paused); reads local storage only.
  playerStore.initialize()
  oauthStore.initialize()
  await accountStore.initialize()
  void masterStore.initialize().catch((error) => {
    console.error('初始化 master 版本失败:', error)
  })
  await notificationStore.initialize()
  if (typeof requestIdleCallback === 'function') requestIdleCallback(() => void loadGlobalSearch(), { timeout: 5000 })
  else setTimeout(() => void loadGlobalSearch(), 3000)
})

watch(
  () => route.fullPath,
  () => {
    masterStore.checkVersionInBackground()
  }
)
</script>

<template>
  <Transition name="route-progress">
    <div
      v-if="isRouteLoading"
      class="route-progress"
      role="progressbar"
      aria-label="页面加载中"
    >
      <div class="route-progress__bar"></div>
    </div>
  </Transition>

  <div v-if="isFullscreen" class="min-h-screen">
    <RouterView :key="routerViewKey" />
  </div>
  
  <div v-else class="drawer lg:drawer-open min-h-screen bg-base-200">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    
    <div class="drawer-content flex flex-col" :class="{ 'with-lyrics-sidebar': playerStore.lyricsSidebarShown }">
      <AppNavbar />
      
      <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <RouterView :key="routerViewKey" />
      </main>

      <footer class="mt-auto px-4 pb-5 pt-8 text-xs text-base-content/45 sm:px-6 lg:px-8">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-base-300 pt-4">
          <span>Uni PJSK Viewer © {{ currentYear }} 綿菓子ウニ</span>
          <span v-if="masterStore.version" class="num">数据 {{ masterStore.version }}<template v-if="masterStore.assetVersion && masterStore.assetVersion !== masterStore.version"> / 资源 {{ masterStore.assetVersion }}</template></span>
        </div>
      </footer>

      <!-- Sticks to the bottom of the window; playback itself lives in the player store and survives navigation. -->
      <PlayerBar />
    </div>
    
    <div class="drawer-side z-50">
      <label for="my-drawer-2" aria-label="关闭菜单" class="drawer-overlay"></label>
      <AppSidebar />
    </div>
    
    <PlayerLyricsSidebar />
    <ToastContainer />
    <SpoilerRulesDialog />
    <SpoilerWatermark />
    <GlobalSearch v-if="globalSearch.everOpened.value" />

    <!-- OAuth 授权确认弹窗 -->
    <dialog ref="oauthConfirmDialog" class="modal" @close="onOAuthConfirmClose">
      <div class="modal-box">
        <h3 class="text-lg font-bold">需要 OAuth 授权</h3>
        <p class="py-4 text-sm leading-6 text-base-content/75">你没有勾选公开访问，需要 OAuth 授权本站访问游戏数据。是否现在去授权？</p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="accountStore.cancelOAuth()">取消</button>
          <button class="btn btn-primary" @click="accountStore.confirmOAuth()">去授权</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @click="accountStore.cancelOAuth()">
        <button>关闭</button>
      </form>
    </dialog>
  </div>

  <NowPlayingView />
</template>

<style>
:root {
  --lyrics-sidebar-width: clamp(20rem, 25vw, 26rem);
}

/* The lyrics column is fixed to the right edge: the page (and the player bar inside it) makes room. */
.drawer-content.with-lyrics-sidebar {
  padding-right: var(--lyrics-sidebar-width);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.route-progress {
  position: fixed;
  z-index: 2000;
  top: 0;
  right: 0;
  left: 0;
  height: 3px;
  overflow: hidden;
  pointer-events: none;
  background: color-mix(in srgb, var(--color-primary) 16%, transparent);
}

.route-progress__bar {
  width: 45%;
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  animation: route-progress-slide 1.1s ease-in-out infinite;
}

.route-progress-enter-active,
.route-progress-leave-active {
  transition: opacity 0.15s ease;
}

.route-progress-enter-from,
.route-progress-leave-to {
  opacity: 0;
}

@keyframes route-progress-slide {
  0% {
    transform: translate3d(-100%, 0, 0) scaleX(0.5);
  }

  55% {
    transform: translate3d(80%, 0, 0) scaleX(1);
  }

  100% {
    transform: translate3d(225%, 0, 0) scaleX(0.55);
  }
}

@media (prefers-reduced-motion: reduce) {
  .route-progress__bar {
    animation: none;
  }
}
</style>
