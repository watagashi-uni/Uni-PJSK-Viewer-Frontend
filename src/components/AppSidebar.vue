<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { Component } from 'vue'
import {
  Home, Music, Image, Users, Shirt, Trophy, Smile, Boxes, Wrench, BookOpen,
  Calendar, BarChart3, Gift, Radio, CalendarDays,
  Zap, FileImage, PenLine, Dices,
  User, History, Layers3, House,
  Settings, Info, Github, Palette, RefreshCw, Check,
} from 'lucide-vue-next'
import AccountSelector from '@/components/AccountSelector.vue'
import { useAccountStore } from '@/stores/account'
import { useSettingsStore } from '@/stores/settings'

interface NavItem {
  to: string
  label: string
  icon: Component
  // 额外归属到此入口的路径前缀（详情页等）
  also?: string[]
}

interface NavGroup {
  title?: string
  items: NavItem[]
}

const groups: NavGroup[] = [
  {
    items: [{ to: '/', label: '首页', icon: Home }],
  },
  {
    title: '图鉴',
    items: [
      { to: '/musics', label: '歌曲', icon: Music },
      { to: '/cards', label: '卡片', icon: Image },
      { to: '/characters', label: '角色', icon: Users },
      { to: '/costumes', label: '衣装', icon: Shirt },
      { to: '/honors', label: '称号', icon: Trophy },
      { to: '/stamps', label: '表情贴图', icon: Smile },
      { to: '/items', label: '物品', icon: Boxes },
      { to: '/area-items', label: '区域道具', icon: Wrench },
      { to: '/stories', label: '剧情', icon: BookOpen },
    ],
  },
  {
    title: '活动与卡池',
    items: [
      { to: '/events', label: '活动', icon: Calendar },
      { to: '/ranking', label: '实时榜线', icon: BarChart3 },
      { to: '/gachas', label: '卡池', icon: Gift, also: ['/gacha/'] },
      { to: '/vlives', label: '虚拟 Live', icon: Radio },
      { to: '/calendar', label: '游戏日历', icon: CalendarDays },
    ],
  },
  {
    title: '工具',
    items: [
      { to: '/deck-recommend', label: '自动组队', icon: Zap },
      { to: '/sus2img', label: '谱面转图片', icon: FileImage, also: ['/chart-share'] },
      { to: '/custom-score-maker', label: '谱面 Maker', icon: PenLine },
      { to: '/costumes/custom', label: '衣装自由搭配', icon: Dices },
    ],
  },
  {
    title: '我的',
    items: [
      { to: '/profile', label: '个人信息', icon: User },
      { to: '/card-collection', label: '养成进度', icon: Layers3 },
      { to: '/account-records', label: '账号记录', icon: History },
      { to: '/mysekai', label: 'MySekai', icon: House },
    ],
  },
]

const route = useRoute()
const accountStore = useAccountStore()
const settingsStore = useSettingsStore()

// 用最长前缀匹配决定高亮项，让详情页（/musics/123 等）也能定位到所属栏目，
// 同时避免 /costumes 与 /costumes/custom 同时高亮
const activePath = computed(() => {
  const path = route.path
  let best = ''
  let bestLength = -1
  for (const group of groups) {
    for (const item of group.items) {
      const prefixes = item.to === '/' ? [] : [item.to, ...(item.also ?? [])]
      if (item.to === '/' && path === '/') return '/'
      for (const prefix of prefixes) {
        const matches = path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)
        if (matches && prefix.length > bestLength) {
          best = item.to
          bestLength = prefix.length
        }
      }
    }
  }
  return best
})

function closeDrawer() {
  const toggle = document.getElementById('my-drawer-2') as HTMLInputElement | null
  if (toggle) toggle.checked = false
}

const themes = [
  { value: 'auto', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'moe', label: 'Moe' },
  { value: 'jirai', label: '地雷' },
]

function selectTheme(value: string) {
  settingsStore.setTheme(value)
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}

const refreshError = ref('')

async function runRefresh(kind: 'profile' | 'suite') {
  const userId = accountStore.currentUserId
  if (!userId) return
  refreshError.value = ''
  try {
    if (kind === 'profile') await accountStore.refreshProfile(userId)
    else await accountStore.refreshSuite(userId)
  } catch (e: any) {
    refreshError.value = e?.message || '刷新失败'
  }
}

function relativeTime(timestamp: number | undefined): string {
  if (!timestamp || !Number.isFinite(timestamp)) return ''
  const diff = Date.now() - timestamp
  const minute = 60_000
  if (diff < minute) return '刚刚'
  if (diff < 60 * minute) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < 24 * 60 * minute) return `${Math.floor(diff / (60 * minute))} 小时前`
  if (diff < 30 * 24 * 60 * minute) return `${Math.floor(diff / (24 * 60 * minute))} 天前`
  return new Date(timestamp).toLocaleDateString('zh-CN')
}

const currentAccount = computed(() => accountStore.accounts.find(a => a.userId === accountStore.currentUserId))
const profileAge = computed(() => relativeTime(currentAccount.value?.lastRefresh))
const suiteAge = computed(() => {
  const seconds = Number(currentAccount.value?.uploadTime)
  return seconds > 0 ? relativeTime(seconds * 1000) : ''
})
</script>

<template>
  <div class="sidebar-wrapper relative z-10 flex h-full w-64 flex-col bg-base-100 text-base-content border-r border-base-300">
    <div class="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
      <RouterLink to="/" class="flex items-baseline gap-1.5 rounded-md px-1 text-lg font-bold" @click="closeDrawer">
        <span class="text-primary">Uni PJSK</span>
        <span class="text-xs font-normal text-base-content/50">Viewer</span>
      </RouterLink>
    </div>

    <nav class="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 pb-3" aria-label="主导航">
      <ul class="menu menu-sm w-full gap-0.5 p-0">
        <template v-for="(group, groupIndex) in groups" :key="groupIndex">
          <li v-if="group.title" class="menu-title mt-2.5 px-3 pb-0.5 pt-0 text-xs font-medium text-base-content/45">
            {{ group.title }}
          </li>
          <li v-for="item in group.items" :key="item.to">
            <RouterLink
              :to="item.to"
              class="gap-3 py-1.5"
              :class="{ 'menu-active active': activePath === item.to }"
              :aria-current="activePath === item.to ? 'page' : undefined"
              @click="closeDrawer"
            >
              <component :is="item.icon" class="h-4 w-4 shrink-0" />
              {{ item.label }}
            </RouterLink>
          </li>
        </template>
      </ul>
    </nav>

    <div class="border-t border-base-300 px-3 py-3 space-y-2">
      <template v-if="accountStore.accounts.length > 0">
        <AccountSelector
          placement="top"
          :model-value="accountStore.currentUserId"
          @update:model-value="accountStore.selectAccount"
        />
        <div v-if="accountStore.currentUserId" class="grid grid-cols-2 gap-1.5">
          <button
            class="btn btn-xs btn-ghost h-auto min-h-0 flex-col items-start gap-0 rounded-md px-2 py-1.5 text-left font-normal"
            :disabled="accountStore.profileRefreshing"
            title="从公开接口刷新等级、卡组、名片等资料"
            @click="runRefresh('profile')"
          >
            <span class="flex items-center gap-1 text-xs font-medium">
              <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': accountStore.profileRefreshing }" />
              刷新资料
            </span>
            <span class="text-[11px] text-base-content/45">{{ profileAge || '未刷新' }}</span>
          </button>
          <button
            class="btn btn-xs btn-ghost h-auto min-h-0 flex-col items-start gap-0 rounded-md px-2 py-1.5 text-left font-normal"
            :disabled="accountStore.suiteRefreshing"
            title="获取你在 Haruki 工具箱上传的完整游戏数据"
            @click="runRefresh('suite')"
          >
            <span class="flex items-center gap-1 text-xs font-medium">
              <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': accountStore.suiteRefreshing }" />
              同步数据
            </span>
            <span class="text-[11px] text-base-content/45">{{ suiteAge ? `上传于 ${suiteAge}` : '未同步' }}</span>
          </button>
        </div>
        <p v-if="refreshError" class="px-1 text-xs text-error">{{ refreshError }}</p>
      </template>
      <RouterLink
        v-else
        to="/profile"
        class="btn btn-sm btn-outline btn-primary w-full"
        @click="closeDrawer"
      >
        <User class="h-4 w-4" /> 绑定游戏账号
      </RouterLink>

      <div class="flex items-center gap-1">
        <RouterLink
          to="/settings"
          class="btn btn-ghost btn-sm flex-1 justify-start gap-2 px-2 font-normal"
          :class="{ 'btn-active': route.path === '/settings' }"
          @click="closeDrawer"
        >
          <Settings class="h-4 w-4" /> 设置
        </RouterLink>
        <div class="dropdown dropdown-top dropdown-end">
          <button tabindex="0" class="btn btn-ghost btn-sm btn-square" title="切换主题" aria-label="切换主题">
            <Palette class="h-4 w-4" />
          </button>
          <ul tabindex="0" class="dropdown-content menu menu-sm z-30 mb-1 w-32 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg">
            <li v-for="t in themes" :key="t.value">
              <button class="justify-between" @click="selectTheme(t.value)">
                {{ t.label }}
                <Check v-if="settingsStore.theme === t.value" class="h-3.5 w-3.5" />
              </button>
            </li>
          </ul>
        </div>
        <RouterLink
          to="/about"
          class="btn btn-ghost btn-sm btn-square"
          :class="{ 'btn-active': route.path === '/about' }"
          title="关于"
          aria-label="关于"
          @click="closeDrawer"
        >
          <Info class="h-4 w-4" />
        </RouterLink>
        <a
          href="https://github.com/watagashi-uni/Uni-PJSK-Viewer-Frontend"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-sm btn-square"
          title="GitHub 仓库"
          aria-label="GitHub 仓库"
        >
          <Github class="h-4 w-4" />
        </a>
      </div>
    </div>
  </div>
</template>
