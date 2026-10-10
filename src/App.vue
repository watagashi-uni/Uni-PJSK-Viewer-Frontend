<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useModalDialog } from '@/composables/useModalDialog'
import { RouterView, useRoute } from 'vue-router'
import { isRouteLoading } from '@/router'
import AppNavbar from '@/components/AppNavbar.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { useAccountStore } from '@/stores/account'
import { useOAuthStore } from '@/stores/oauth'
import { useNotificationStore } from '@/stores/notification'
import AppSidebar from '@/components/AppSidebar.vue'

const route = useRoute()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()
const oauthStore = useOAuthStore()
const notificationStore = useNotificationStore()
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
  oauthStore.initialize()
  await accountStore.initialize()
  void masterStore.initialize().catch((error) => {
    console.error('初始化 master 版本失败:', error)
  })
  await notificationStore.initialize()
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
    
    <div class="drawer-content flex flex-col">
      <AppNavbar />
      
      <main class="flex-1 w-full max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:py-8">
        <RouterView :key="routerViewKey" />
      </main>
      
      <footer class="mt-auto border-t border-base-300 px-4 py-4 text-xs text-base-content/50 sm:px-6">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span>Uni PJSK Viewer © {{ currentYear }} · 綿菓子ウニ</span>
          <span v-if="masterStore.version" class="font-mono">数据 {{ masterStore.version }}<template v-if="masterStore.assetVersion && masterStore.assetVersion !== masterStore.version"> · 资源 {{ masterStore.assetVersion }}</template></span>
        </div>
      </footer>
    </div>
    
    <div class="drawer-side z-50">
      <label for="my-drawer-2" aria-label="关闭菜单" class="drawer-overlay"></label>
      <AppSidebar />
    </div>
    
    <ToastContainer />

    <!-- OAuth 授权确认弹窗 -->
    <dialog ref="oauthConfirmDialog" class="modal" @close="onOAuthConfirmClose">
      <div class="modal-box">
        <h3 class="text-lg font-bold">需要 OAuth 授权</h3>
        <p class="py-4">你没有勾选公开访问，需要 OAuth 授权本站访问游戏数据。是否现在去授权？</p>
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
</template>

<style>
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
  height: 4px;
  overflow: hidden;
  pointer-events: none;
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
}

.route-progress__bar {
  width: 45%;
  height: 100%;
  border-radius: 0 999px 999px 0;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-primary));
  box-shadow: 0 0 10px color-mix(in srgb, var(--color-primary) 80%, transparent);
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
