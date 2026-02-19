<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { Music, Image, BarChart3, Info, Settings, Calendar, Gift, Share2, Zap, User } from 'lucide-vue-next'

const route = useRoute()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

// Check if current route is fullscreen
const isFullscreen = computed(() => route.meta.fullscreen === true)

onMounted(async () => {
  // 清理旧版 SW 的 external-images 缓存（可能包含缓存的 404 opaque response）
  if ('caches' in window) {
    caches.delete('external-images')
  }
  
  // 初始化各个 store
  settingsStore.initialize()
  await masterStore.initialize()
})
</script>

<template>
  <!-- 全屏模式：直接渲染路由组件 -->
  <div v-if="isFullscreen" class="min-h-screen" data-theme="unipjsk">
    <RouterView />
  </div>
  
  <!-- 普通模式：带侧边栏布局 -->
  <div v-else class="drawer lg:drawer-open min-h-screen bg-base-200" data-theme="unipjsk">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    
    <!-- Drawer Content -->
    <div class="drawer-content flex flex-col">
      <!-- Navbar (Only visible on mobile/tablet or just a header) -->
      <AppNavbar />
      
      <!-- Global Alert Banner -->
      <!-- <AlertBanner 
        v-if="showBanner" 
        type="warning" 
        dismissible 
        @dismiss="dismissBanner"
        class="mx-4 mt-4"
      >
        <strong>⚠ 内测中！</strong> 该网站还在内部测试中，出现问题请及时反馈<br/>
        剧透内容默认不显示，如需查看请在设置页面开启
      </AlertBanner> -->
      
      <!-- Main Content -->
      <main class="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <RouterView />
      </main>
      
      <!-- Footer -->
      <footer class="footer items-center p-4 bg-base-300 text-base-content mt-auto">
        <aside class="items-center grid-flow-col">
          <p>Uni PJSK Viewer © {{ new Date().getFullYear() }} - Created by 綿菓子ウニ</p>
        </aside>
      </footer>
    </div>
    
    <!-- Drawer Side (Sidebar) -->
    <div class="drawer-side z-50">
      <label for="my-drawer-2" aria-label="close sidebar" class="drawer-overlay"></label>
      <ul class="menu p-4 w-80 min-h-full bg-base-100 text-base-content shadow-xl gap-2">
        <!-- Sidebar Header -->
        <li class="mb-4">
          <RouterLink to="/" class="text-2xl font-bold text-primary px-2 hover:bg-transparent">
            Uni PJSK
            <span class="text-base-content/60 text-sm font-normal">Viewer</span>
          </RouterLink>
        </li>

        <!-- Menu Items -->
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
            <User class="w-5 h-5" /> 用户档案
          </RouterLink>
        </li>
        
        <div class="divider"></div>
        
        <!-- System Links -->
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
    
    <!-- Toast 容器 (PWA 更新 + Master 加载) -->
    <ToastContainer />
  </div>
</template>

<style>
/* 全局过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
