<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useMasterStore } from '@/stores/master'
import { Settings, Trash2, Database, Eye, Palette, RefreshCw, Languages } from 'lucide-vue-next'
import { clearAllCache } from '@/utils/masterDB'

const settingsStore = useSettingsStore()
const masterStore = useMasterStore()

const isClearing = ref(false)
const isClearingTranslation = ref(false)

const themes = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'auto', label: '跟随系统' },
]



async function handleClearCache() {
  if (!confirm('确定要清空本地缓存吗？这将删除所有已缓存的数据，下次访问时需要重新下载。')) {
    return
  }
  
  isClearing.value = true
  try {
    await clearAllCache()
    // 清除 sessionStorage
    sessionStorage.clear()
    // 重新初始化
    await masterStore.refresh()
    alert('缓存已清空！')
  } catch (e) {
    alert('清空缓存失败：' + (e instanceof Error ? e.message : '未知错误'))
  } finally {
    isClearing.value = false
  }
}

async function handleClearTranslationCache() {
  isClearingTranslation.value = true
  try {
    await masterStore.refreshTranslations()
    alert('翻译已刷新！')
  } catch (e) {
    alert('刷新翻译失败：' + (e instanceof Error ? e.message : '未知错误'))
  } finally {
    isClearingTranslation.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 flex items-center gap-3">
      <Settings class="w-8 h-8" />
      设置
    </h1>

    <div class="space-y-6">
      <!-- 显示设置 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">
            <Eye class="w-5 h-5" />
            显示设置
          </h2>
          
          <!-- 剧透开关 -->
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-4">
              <input 
                type="checkbox" 
                class="toggle toggle-primary" 
                v-model="settingsStore.showSpoilers"
              />
              <div>
                <span class="label-text font-medium">显示剧透内容</span>
                <p class="text-sm text-base-content/60">开启后将显示尚未发布的歌曲和卡片</p>
              </div>
            </label>
          </div>

          <!-- 剧透遮罩开关 -->
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-4">
              <input 
                type="checkbox" 
                class="toggle toggle-primary" 
                v-model="settingsStore.maskSpoilers"
                :disabled="!settingsStore.showSpoilers"
              />
              <div :class="{ 'opacity-50': !settingsStore.showSpoilers }">
                <span class="label-text font-medium">启用剧透遮罩</span>
                <p class="text-sm text-base-content/60">开启后剧透内容默认被遮挡，点击即可查看</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- 主题设置 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">
            <Palette class="w-5 h-5" />
            主题设置
          </h2>
          
          <div class="flex gap-2">
            <button 
              v-for="theme in themes"
              :key="theme.value"
              class="btn btn-sm"
              :class="settingsStore.theme === theme.value ? 'btn-primary' : 'btn-ghost'"
              @click="settingsStore.setTheme(theme.value as 'light' | 'dark' | 'auto')"
            >
              {{ theme.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 缓存管理 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">
            <Database class="w-5 h-5" />
            缓存管理
          </h2>
          
          <p class="text-sm text-base-content/60 mb-4">
            Master 数据会缓存到本地 IndexedDB，加快后续访问速度。如遇到数据显示异常，可尝试清空缓存。
          </p>
          
          <button 
            class="btn btn-error btn-outline"
            :disabled="isClearing"
            @click="handleClearCache"
          >
            <RefreshCw v-if="isClearing" class="w-4 h-4 animate-spin" />
            <Trash2 v-else class="w-4 h-4" />
            {{ isClearing ? '清空中...' : '清空master缓存' }}
          </button>
        </div>
      </div>

      <!-- 翻译缓存 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">
            <Languages class="w-5 h-5" />
            翻译缓存
          </h2>
          
          <p class="text-sm text-base-content/60 mb-4">
            翻译数据会缓存1天。如果翻译数据有更新，可手动清空缓存以获取最新内容。
          </p>
          
          <button 
            class="btn btn-warning btn-outline"
            :disabled="isClearingTranslation"
            @click="handleClearTranslationCache"
          >
            <RefreshCw v-if="isClearingTranslation" class="w-4 h-4 animate-spin" />
            <Trash2 v-else class="w-4 h-4" />
            {{ isClearingTranslation ? '刷新中...' : '刷新翻译' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
