<script setup lang="ts">
import { useMasterStore } from '@/stores/master'
import { useAccountStore } from '@/stores/account'
import { applyPwaUpdate, subscribeToPwaState } from '@/pwa'
import { ref, onMounted, onUnmounted } from 'vue'
import { useModalDialog } from '@/composables/useModalDialog'
import { Download, RefreshCw, X, CheckCircle2 } from 'lucide-vue-next'

const masterStore = useMasterStore()
const accountStore = useAccountStore()
const { onDialogClose: onSuiteNotFoundClose } = useModalDialog(
  'suiteNotFoundDialog',
  () => accountStore.suiteNotFoundModalVisible,
  () => accountStore.dismissSuiteNotFoundModal(),
)

// PWA 更新状态
const needRefresh = ref(false)
let unsubscribePwaState: (() => void) | undefined

// 监听 PWA 更新事件
onMounted(() => {
  unsubscribePwaState = subscribeToPwaState((state) => {
    needRefresh.value = state.needRefresh
  })
})
onUnmounted(() => unsubscribePwaState?.())

function handleUpdate() {
  void applyPwaUpdate()
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
            <p v-if="accountStore.suiteRefreshToastHint" class="text-xs text-base-content/70 mt-1">
              {{ accountStore.suiteRefreshToastHint }}
            </p>
          </div>
          <button type="button" class="btn btn-sm btn-ghost" aria-label="关闭" @click="accountStore.dismissSuiteRefreshToast">
            <X class="w-4 h-4" />
          </button>
        </div>
      </Transition>
    </div>

    <dialog ref="suiteNotFoundDialog" class="modal modal-bottom sm:modal-middle" @close="onSuiteNotFoundClose">
      <div class="modal-box">
        <h3 class="font-bold text-lg">没有找到上传数据</h3>
        <div class="py-3 space-y-3">
          <p class="text-sm text-base-content/80">
            Haruki工具箱没有查询到该玩家的数据。你可能需要前往
            <a
              href="https://haruki.seiunx.com"
              target="_blank"
              rel="noopener noreferrer"
              class="link link-primary font-medium"
            >Haruki工具箱</a>
            先注册账号、绑定游戏账号验证后上传自己的数据，才能使用此功能。不注册验证单纯上传是查不到的
          </p>
          <div class="rounded-lg border border-info/30 bg-info/5 p-3">
            <p class="text-sm font-medium text-info mb-1">已上传但没有公开？</p>
            <p class="text-sm text-base-content/70">
              如果你已经上传了数据但未开启公开访问，可以通过 OAuth 授权来获取你的私有数据。
            </p>
            <button
              v-if="accountStore.currentUserId"
              class="btn btn-sm btn-info btn-outline mt-2"
              @click="accountStore.startOAuthForUser(accountStore.currentUserId)"
            >
              进行 OAuth 授权
            </button>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn btn-primary" @click="accountStore.dismissSuiteNotFoundModal">我知道了</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @submit.prevent="accountStore.dismissSuiteNotFoundModal">
        <button type="button" @click="accountStore.dismissSuiteNotFoundModal">关闭</button>
      </form>
    </dialog>


    <!-- Toast 容器 (底部右侧) -->
    <div class="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-3 sm:left-auto sm:max-w-sm">
      <!-- PWA 更新提示 Toast -->
      <Transition name="slide-up">
        <div 
          v-if="needRefresh"
          class="alert shadow-2xl bg-base-100 border border-primary/30"
        >
          <RefreshCw class="w-5 h-5 text-primary" />
          <div>
            <h3 class="font-bold text-sm">有新版本可用</h3>
            <p class="text-xs text-base-content/60">点击更新以获取最新功能</p>
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn btn-sm btn-ghost" aria-label="关闭" @click="dismissUpdate">
              <X class="w-4 h-4" />
            </button>
            <button class="btn btn-sm btn-primary" @click="handleUpdate">
              <Download class="w-4 h-4" /> 更新
            </button>
          </div>
        </div>
      </Transition>
      
      <!-- 游戏资料加载 Toast -->
      <Transition name="slide-up">
        <div 
          v-if="masterStore.isLoading"
          class="alert shadow-2xl bg-base-100 border border-base-300"
        >
          <span class="loading loading-spinner loading-sm text-primary"></span>
          <div>
            <h3 class="font-bold text-sm">正在加载游戏资料</h3>
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
