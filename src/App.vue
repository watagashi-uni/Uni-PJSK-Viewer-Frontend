<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { useAccountStore } from '@/stores/account'
import { useOAuthStore } from '@/stores/oauth'
import { Music, Image, BarChart3, Info, Settings, Calendar, Gift, Share2, Zap, User, RefreshCw, Github } from 'lucide-vue-next'
import AccountSelector from '@/components/AccountSelector.vue'

const route = useRoute()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()
const oauthStore = useOAuthStore()

const refreshError = ref('')

const isFullscreen = computed(() => route.meta.fullscreen === true)

onMounted(async () => {
  if ('caches' in window) {
    caches.delete('external-images')
  }
  settingsStore.initialize()
  oauthStore.initialize()
  await accountStore.initialize()
  await masterStore.initialize()
})

async function handleProfileRefresh() {
  if (!accountStore.currentUserId) return
  refreshError.value = ''
  try {
    await accountStore.refreshProfile(accountStore.currentUserId)
  } catch (e: any) {
    refreshError.value = e.message
  }
}

async function handleSuiteRefresh() {
  if (!accountStore.currentUserId) return
  refreshError.value = ''
  try {
    await accountStore.refreshSuite(accountStore.currentUserId)
  } catch (e: any) {
    refreshError.value = e.message
  }
}
</script>

<template>
  <div v-if="isFullscreen" class="min-h-screen">
    <RouterView />
  </div>
  
  <div v-else class="drawer lg:drawer-open min-h-screen bg-base-200">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    
    <div class="drawer-content flex flex-col">
      <AppNavbar />
      
      <main class="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <RouterView />
      </main>
      
      <footer class="footer items-center p-4 bg-base-300 text-base-content mt-auto">
        <aside class="items-center grid-flow-col">
          <p>Uni PJSK Viewer © {{ new Date().getFullYear() }} - Created by 綿菓子ウニ</p>
        </aside>
      </footer>
    </div>
    
    <!-- Sidebar -->
    <div class="drawer-side z-50 overflow-hidden">
      <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
      <ul class="menu p-4 w-80 h-full overflow-y-auto overflow-x-hidden overscroll-y-contain flex flex-col flex-nowrap bg-base-100 text-base-content shadow-xl gap-2">
        <li class="mb-4 relative">
          <RouterLink to="/" class="text-2xl font-bold text-primary px-2 hover:bg-transparent pr-12">
            Uni PJSK
            <span class="text-base-content/60 text-sm font-normal">Viewer</span>
          </RouterLink>
          <a 
            href="https://github.com/watagashi-uni/Uni-PJSK-Viewer-Frontend" 
            target="_blank" 
            class="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-base-200 rounded-full transition-colors z-10"
            title="GitHub 仓库"
          >
            <Github class="w-5 h-5 text-base-content/60 hover:text-base-content" />
          </a>
        </li>

        <li>
          <RouterLink to="/musics" active-class="active">
            <Music class="w-5 h-5" /> 歌曲列表
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/cards" active-class="active">
            <Image class="w-5 h-5" /> 卡片查询
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/events" active-class="active">
            <Calendar class="w-5 h-5" /> 活动
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/ranking" active-class="active">
            <BarChart3 class="w-5 h-5" /> 实时榜线
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/gachas" active-class="active">
            <Gift class="w-5 h-5" /> 卡池
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/sus2img" active-class="active">
            <BarChart3 class="w-5 h-5" /> 谱面转图片
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/chart-share" active-class="active">
            <Share2 class="w-5 h-5" /> 谱面分享
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/deck-recommend" active-class="active">
            <Zap class="w-5 h-5" /> 自动组队
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/profile" active-class="active">
            <User class="w-5 h-5" /> 个人信息
          </RouterLink>
        </li>

        <div class="divider my-1"></div>

        <!-- 账号管理 -->
        <li class="menu-title text-xs mt-2">账号</li>
        <li v-if="accountStore.accounts.length > 0" class="px-2 mb-1 [&>*]:!bg-transparent [&>*:hover]:!bg-transparent">
          <AccountSelector
            :model-value="accountStore.currentUserId"
            @update:model-value="accountStore.selectAccount"
          />
        </li>
        <li v-else class="px-2">
          <span class="text-xs text-base-content/40 p-0 hover:bg-transparent cursor-default">
            在个人信息页添加账号
          </span>
        </li>
        <li v-if="accountStore.currentUserId" class="px-2">
          <div class="flex gap-1 p-0 hover:bg-transparent">
            <button
              class="btn btn-xs btn-ghost flex-1 gap-1"
              :disabled="accountStore.profileRefreshing"
              @click="handleProfileRefresh"
            >
              <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': accountStore.profileRefreshing }" />
              Profile
            </button>
            <button
              class="btn btn-xs btn-ghost flex-1 gap-1"
              :disabled="accountStore.suiteRefreshing"
              @click="handleSuiteRefresh"
            >
              <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': accountStore.suiteRefreshing }" />
              Suite
            </button>
          </div>
        </li>
        <li v-if="accountStore.currentUserId && (accountStore.lastRefreshText || accountStore.uploadTimeText)" class="px-2">
          <div class="flex flex-col gap-0 p-0 hover:bg-transparent cursor-default">
            <span v-if="accountStore.lastRefreshText" class="text-[10px] text-base-content/40">
              Profile: {{ accountStore.lastRefreshText }}
            </span>
            <span v-if="accountStore.uploadTimeText" class="text-[10px] text-base-content/40">
              Suite数据: {{ accountStore.uploadTimeText }}
            </span>
          </div>
        </li>
        <li v-if="refreshError" class="px-2">
          <span class="text-[10px] text-error p-0 hover:bg-transparent">{{ refreshError }}</span>
        </li>

        <div class="divider my-1"></div>
        
        <li>
          <RouterLink to="/about" active-class="active">
            <Info class="w-5 h-5" /> 关于项目
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/settings" active-class="active">
            <Settings class="w-5 h-5" /> 设置
          </RouterLink>
        </li>
      </ul>
    </div>
    
    <ToastContainer />
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
</style>
