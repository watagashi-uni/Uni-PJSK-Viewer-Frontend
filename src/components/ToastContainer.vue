<script setup lang="ts">
import { useMasterStore } from '@/stores/master'
import { useAccountStore } from '@/stores/account'
import { ref, onMounted } from 'vue'
import { Download, RefreshCw, X, CheckCircle2 } from 'lucide-vue-next'

const masterStore = useMasterStore()
const accountStore = useAccountStore()

// PWA 更新状态
const needRefresh = ref(false)
const updateServiceWorker = ref<(() => void) | null>(null)

// 监听 PWA 更新事件
onMounted(async () => {
  // 动态导入 PWA 注册模块
  const { useRegisterSW } = await import('virtual:pwa-register/vue')
  
  const { needRefresh: nr, updateServiceWorker: usw } = useRegisterSW({
    onNeedRefresh() {
      needRefresh.value = true
    },
    onOfflineReady() {
      console.log('PWA: App ready for offline use')
    },
  })
  
  // 同步响应式状态
  needRefresh.value = nr.value
  updateServiceWorker.value = usw
})

function handleUpdate() {
  if (updateServiceWorker.value) {
    updateServiceWorker.value()
  }
}

function dismissUpdate() {
  needRefresh.value = false
}
</script>

<template>
  <Teleport to="body">
    <!-- Suite 刷新来源 Toast（上方居中） -->
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,24rem)]">
      <Transition name="slide-up">
        <div
          v-if="accountStore.suiteRefreshToastMessage"
          class="alert shadow-2xl bg-base-100 border border-success/40"
        >
          <CheckCircle2 class="w-5 h-5 text-success" />
          <div>
            <h3 class="font-bold text-sm">{{ accountStore.suiteRefreshToastMessage }}</h3>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Toast 容器 (底部右侧) -->
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      <!-- PWA 更新提示 Toast -->
      <Transition name="slide-up">
        <div 
          v-if="needRefresh"
          class="alert shadow-2xl bg-base-100 border border-primary/30"
        >
          <RefreshCw class="w-5 h-5 text-primary animate-spin" />
          <div>
            <h3 class="font-bold text-sm">有新版本可用</h3>
            <p class="text-xs text-base-content/60">点击更新以获取最新功能</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-sm btn-ghost" @click="dismissUpdate">
              <X class="w-4 h-4" />
            </button>
            <button class="btn btn-sm btn-primary" @click="handleUpdate">
              <Download class="w-4 h-4" /> 更新
            </button>
          </div>
        </div>
      </Transition>
      
      <!-- Master 数据加载 Toast -->
      <Transition name="slide-up">
        <div 
          v-if="masterStore.isLoading"
          class="alert shadow-2xl bg-base-100 border border-base-300"
        >
          <span class="loading loading-spinner loading-sm text-primary"></span>
          <div>
            <h3 class="font-bold text-sm">正在加载数据</h3>
            <p v-if="masterStore.loadingFile" class="text-xs text-base-content/60">
              {{ masterStore.loadingFile }}.json
            </p>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
