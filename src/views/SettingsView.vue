<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useMasterStore } from '@/stores/master'
import { useNotificationStore } from '@/stores/notification'
import { Settings, Trash2, Database, Eye, Palette, RefreshCw, Languages, Mic, Bell, AlertTriangle, MonitorSmartphone, Send } from 'lucide-vue-next'
import { clearAllCache } from '@/utils/masterDB'

const settingsStore = useSettingsStore()
const masterStore = useMasterStore()
const notificationStore = useNotificationStore()

onMounted(() => {
  notificationStore.initialize()
})

async function togglePush(event: Event) {
  const isChecked = (event.target as HTMLInputElement).checked
  try {
    if (isChecked) {
      if (!notificationStore.subscribedTopics.length) {
        notificationStore.subscribedTopics = []
      }
      await notificationStore.subscribe(notificationStore.subscribedTopics)
    } else {
      await notificationStore.unsubscribe()
    }
  } catch(e: any) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('Registration failed') || msg.includes('push service') || msg.includes('订阅失败')) {
      alert('通知设置失败：无法连接推送服务。\n\n安卓设备依赖谷歌 FCM 服务，国内网络通常无法连接。\n建议开启代理后重试，或使用 iOS / 桌面端设备接收推送。')
    } else {
      alert('通知设置失败: ' + msg)
    }
    ;(event.target as HTMLInputElement).checked = false
  }
}

async function testPush() {
  try {
    await notificationStore.testNotification()
    alert('测试推送已发送！请检查设备横幅。')
  } catch (e) {
    alert('测试推送发送失败: ' + (e instanceof Error ? e.message : String(e)))
  }
}

function isTopicSubscribed(topic: string) {
  return notificationStore.subscribedTopics.includes(topic)
}

async function toggleTopic(topic: string) {
  try {
    await notificationStore.toggleSubscription(topic)
  } catch (e) {
    alert('订阅切换失败: ' + (e instanceof Error ? e.message : String(e)))
  }
}

const isClearing = ref(false)
const isClearingTranslation = ref(false)

const themes = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'moe', label: 'Moe' },
  { value: 'jirai', label: '地雷' },
  { value: 'auto', label: '跟随系统' },
]

const vocalOptions = [
  { value: 'sekai', label: 'Sekai 版' },
  { value: 'virtual_singer', label: 'Virtual Singer 版' },
]

const assetsHostOptions = [
  { value: settingsStore.ASSETS_HOST_CN, label: '国内源', desc: 'https://assets-direct.unipjsk.com/' },
  { value: settingsStore.ASSETS_HOST_GLOBAL, label: '海外源', desc: 'https://assets.unipjsk.com/' },
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
                v-model="settingsStore.showSpoilers" 
                type="checkbox" 
                class="toggle toggle-primary"
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
                v-model="settingsStore.maskSpoilers" 
                type="checkbox" 
                class="toggle toggle-primary"
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
              @click="settingsStore.setTheme(theme.value as 'light' | 'dark' | 'auto' | 'moe' | 'jirai')"
            >
              {{ theme.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 音频设置 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">
            <Mic class="w-5 h-5" />
            默认 Vocal 版本
          </h2>
          
          <div class="flex flex-col gap-2">
            <div class="flex gap-2">
              <button 
                v-for="option in vocalOptions"
                :key="option.value"
                class="btn btn-sm"
                :class="settingsStore.defaultVocal === option.value ? 'btn-primary' : 'btn-ghost'"
                @click="settingsStore.setDefaultVocal(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 资源源站 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">
            <Database class="w-5 h-5" />
            资源源站
          </h2>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in assetsHostOptions"
              :key="option.value"
              class="btn btn-sm"
              :class="settingsStore.assetsHost === option.value ? 'btn-primary' : 'btn-ghost'"
              @click="settingsStore.setAssetsHost(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
          <div class="mb-2"></div>
          <p class="text-xs text-base-content/50">
            国内源：适合大陆地区访问 ｜ 海外源：Cloudflare CDN，适合海外地区访问
          </p>
        </div>
      </div>

      <!-- 推送通知设置 -->
      <div v-if="notificationStore.isSupported || notificationStore.isIOS" class="card bg-base-100 shadow-lg border-2 border-primary/20">
        <div class="card-body">
          <h2 class="card-title text-lg mb-2 flex items-center gap-2 text-primary">
            <Bell class="w-5 h-5" />
            推送通知 (Beta)
          </h2>

          <!-- iOS 非 PWA 模式：引导添加到桌面 -->
          <div v-if="!notificationStore.isSupported && notificationStore.isIOS" class="alert shadow-sm py-3">
            <MonitorSmartphone class="w-5 h-5 shrink-0 text-info" />
            <div>
              <h3 class="font-bold text-sm">iOS 推送需要添加到主屏幕</h3>
              <div class="text-xs mt-1">
                iOS Safari 浏览器不支持直接推送通知。请点击底部
                <strong>"共享"</strong> 按钮 -> <strong>"添加到主屏幕"</strong>，
                然后从桌面图标打开本网站，即可在此处开启推送通知。
              </div>
            </div>
          </div>

          <!-- 正常支持推送的环境 -->
          <template v-if="notificationStore.isSupported">
            <div class="form-control mb-4">
              <label class="label cursor-pointer justify-start gap-4 p-0">
                <input 
                  type="checkbox" 
                  class="toggle toggle-primary"
                  :checked="notificationStore.isSubscribed"
                  :disabled="notificationStore.isLoading"
                  @change="togglePush"
                />
                <div>
                  <span class="label-text font-medium text-base">开启网页推送</span>
                  <p class="text-sm text-base-content/60">接收新歌、活动和虚拟 Live 提醒</p>
                </div>
              </label>
            </div>

            <!-- 安卓警告 (不再依赖 isChina，对所有安卓显示) -->
            <div v-if="notificationStore.isAndroid" class="alert alert-warning shadow-sm py-2 mb-4">
              <AlertTriangle class="w-5 h-5 shrink-0" />
              <div>
                <h3 class="font-bold text-sm">重要：Android 限制</h3>
                <div class="text-xs">
                  国内通常无法连接 FCM 服务，可能导致您<strong>无法收到推送，或甚至无法开启推送开关</strong>。请通过下方的“发送测试”验证。
                </div>
              </div>
            </div>

            <!-- iOS未添加到桌面警告 (提升到外层) -->
            <div v-if="notificationStore.isIOS && !notificationStore.isStandalone" class="alert shadow-sm py-2 mb-4">
              <MonitorSmartphone class="w-5 h-5 shrink-0 text-info" />
              <div>
                <h3 class="font-bold text-sm">iOS 用户指南</h3>
                <div class="text-xs">
                  由于 iOS 限制，如果您希望在后台稳定接收推送，请点击 Safari 底部<strong>“共享”</strong> -> <strong>“添加到主屏幕”</strong>，然后从桌面打开本网站再进行订阅测试。
                </div>
              </div>
            </div>

            <div v-if="notificationStore.isSubscribed" class="bg-base-200 rounded-lg p-4 space-y-4">
              <div>
                <p class="font-medium text-sm mb-3 opacity-80">推送内容：</p>
                <div class="flex flex-col gap-2">
                  <label class="label cursor-pointer justify-start gap-3 py-1">
                    <input
                      type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                      :checked="isTopicSubscribed('music')"
                      @change="toggleTopic('music')"
                    />
                    <span class="label-text">新歌曲上线提醒</span>
                  </label>
                  <label class="label cursor-pointer justify-start gap-3 py-1">
                    <input
                      type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                      :checked="isTopicSubscribed('vlive')"
                      @change="toggleTopic('vlive')"
                    />
                    <span class="label-text">虚拟 Live 提醒</span>
                  </label>
                  <label class="label cursor-pointer justify-start gap-3 py-1">
                    <input
                      type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                      :checked="isTopicSubscribed('apd')"
                      @change="toggleTopic('apd')"
                    />
                    <span class="label-text">新 APPEND 谱面提醒</span>
                  </label>
                </div>
              </div>

              <!-- (Warnings moved out) -->

              <button class="btn btn-sm btn-outline btn-primary w-full mt-2" @click="testPush">
                <Send class="w-4 h-4" />
                发送测试推送
              </button>
            </div>
          </template>
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
    </div>
  </div>
</template>
