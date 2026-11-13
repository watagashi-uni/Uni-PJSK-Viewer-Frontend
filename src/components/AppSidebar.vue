<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { User, Settings, Info, Github, Palette, RefreshCw, Check, Search } from 'lucide-vue-next'
import AccountSelector from '@/components/AccountSelector.vue'
import { useAccountStore } from '@/stores/account'
import { useSettingsStore } from '@/stores/settings'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import { navGroups, resolveActiveNav } from '@/utils/navigation'
import { themeOptions } from '@/utils/themes'

const route = useRoute()
const accountStore = useAccountStore()
const settingsStore = useSettingsStore()
const search = useGlobalSearch()

const activePath = computed(() => resolveActiveNav(route.path))

function closeDrawer() {
  const toggle = document.getElementById('my-drawer-2') as HTMLInputElement | null
  if (toggle) toggle.checked = false
}

function openSearch() {
  closeDrawer()
  search.open()
}

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
  <aside class="app-sidebar">
    <div class="app-sidebar__head">
      <RouterLink to="/" class="app-brand" @click="closeDrawer">
        <span class="app-brand__mark" aria-hidden="true"><i></i><i></i></span>
        <span class="app-brand__name">Uni PJSK</span>
        <span class="app-brand__sub">Viewer</span>
      </RouterLink>
      <button type="button" class="app-search-trigger" @click="openSearch">
        <Search class="h-4 w-4 shrink-0" />
        <span class="flex-1 truncate text-left">搜索歌曲、卡片、活动</span>
        <span class="kbd-hint hidden lg:inline-flex">{{ search.shortcutLabel }}</span>
      </button>
    </div>

    <nav class="app-sidebar__nav" aria-label="主导航">
      <template v-for="(group, groupIndex) in navGroups" :key="groupIndex">
        <p v-if="group.title" class="app-nav-title">{{ group.title }}</p>
        <ul>
          <li v-for="item in group.items" :key="item.to">
            <RouterLink
              :to="item.to"
              class="app-nav-item"
              :class="{ 'is-active': activePath === item.to }"
              :aria-current="activePath === item.to ? 'page' : undefined"
              @click="closeDrawer"
            >
              <component :is="item.icon" class="h-[1.05rem] w-[1.05rem] shrink-0" />
              <span class="truncate">{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </template>
    </nav>

    <div class="app-sidebar__foot">
      <template v-if="accountStore.accounts.length > 0">
        <AccountSelector
          placement="top"
          :model-value="accountStore.currentUserId"
          @update:model-value="accountStore.selectAccount"
        />
        <div v-if="accountStore.currentUserId" class="grid grid-cols-2 gap-1.5">
          <button
            class="app-refresh"
            :disabled="accountStore.profileRefreshing"
            :title="`从公开接口刷新等级、卡组、名片等资料（${profileAge || '未刷新'}）`"
            @click="runRefresh('profile')"
          >
            <span class="flex items-center gap-1 text-xs font-medium">
              <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': accountStore.profileRefreshing }" />
              刷新资料
            </span>
            <span class="hidden truncate text-[11px] text-base-content/50 lg:block">{{ profileAge || '未刷新' }}</span>
          </button>
          <button
            class="app-refresh"
            :disabled="accountStore.suiteRefreshing"
            :title="`获取你在 Haruki 工具箱上传的完整游戏数据（${suiteAge ? `上传于 ${suiteAge}` : '未同步'}）`"
            @click="runRefresh('suite')"
          >
            <span class="flex items-center gap-1 text-xs font-medium">
              <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': accountStore.suiteRefreshing }" />
              同步数据
            </span>
            <span class="hidden truncate text-[11px] text-base-content/50 lg:block">{{ suiteAge ? `上传于 ${suiteAge}` : '未同步' }}</span>
          </button>
        </div>
        <p v-if="refreshError" class="px-1 text-xs text-error">{{ refreshError }}</p>
      </template>
      <RouterLink
        v-else
        to="/profile"
        class="btn btn-sm btn-primary btn-soft w-full"
        @click="closeDrawer"
      >
        <User class="h-4 w-4" /> 绑定游戏账号
      </RouterLink>

      <div class="relative flex items-center gap-0.5">
        <RouterLink
          to="/settings"
          class="app-nav-item flex-1"
          :class="{ 'is-active': route.path === '/settings' }"
          @click="closeDrawer"
        >
          <Settings class="h-[1.05rem] w-[1.05rem] shrink-0" /> 设置
        </RouterLink>
        <div class="dropdown dropdown-top static">
          <button tabindex="0" class="btn btn-ghost btn-sm btn-square" title="切换主题" aria-label="切换主题">
            <Palette class="h-4 w-4" />
          </button>
          <!-- 相对整行底栏定位，宽度和侧边栏一致，窄屏上也不会被裁掉 -->
          <ul tabindex="0" class="dropdown-content inset-x-0 z-30 mb-2 rounded-box border border-base-300 bg-base-100 p-1.5">
            <li v-for="t in themeOptions" :key="t.value">
              <button
                type="button"
                class="flex w-full items-center gap-2.5 rounded-field px-2 py-1.5 text-left text-sm hover:bg-base-content/7"
                :class="{ 'font-semibold text-primary': settingsStore.theme === t.value }"
                @click="selectTheme(t.value)"
              >
                <span class="theme-dot" :class="{ 'is-split': t.preview.length > 1 }" aria-hidden="true">
                  <i v-for="name in t.preview" :key="name" :data-theme="name"></i>
                </span>
                <span class="flex-1">{{ t.label }}</span>
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
  </aside>
</template>

<style>
/* 不加 scoped：主题装饰（style.css 里的地雷花边）要能选中 .app-sidebar */
.app-sidebar {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  max-width: 86vw;
  height: 100%;
  border-right: 1px solid var(--color-base-300);
  background-color: var(--color-base-100);
  background-image: var(--sidebar-pattern);
  background-size: var(--sidebar-pattern-size);
  background-position: 0 0, 20px 20px;
  color: var(--color-base-content);
}

.app-sidebar__head {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 0.75rem 0.5rem;
}

.app-brand {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0 0.375rem;
  border-radius: var(--radius-field);
  font-family: var(--font-display);
}

/* 两条斜切色块：品牌色 + 辅色 */
.app-brand__mark {
  display: flex;
  gap: 2px;
  align-self: center;
  margin-right: 0.15rem;
  transform: skewX(-14deg);
}

.app-brand__mark i {
  display: block;
  width: 0.3125rem;
  height: 1.125rem;
  border-radius: 1px;
  background-color: var(--color-primary);
}

.app-brand__mark i + i {
  height: 0.75rem;
  align-self: flex-end;
  background-color: var(--color-secondary);
}

/* 侧边栏里是纵向排列，品牌不拉满整行；手机顶栏里由顶栏负责垂直居中 */
.app-sidebar__head .app-brand {
  align-self: flex-start;
}

.app-brand__name {
  font-size: 1.1875rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.75rem;
}

.app-brand__sub {
  color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
  font-size: 0.75rem;
  font-weight: 500;
}

.app-search-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.5rem 0 0.625rem;
  border: 1px solid var(--color-base-300);
  border-radius: var(--radius-field);
  background-color: color-mix(in oklab, var(--color-base-content) 4%, var(--color-base-100));
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
  font-size: 0.8125rem;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.app-search-trigger:hover {
  border-color: color-mix(in oklab, var(--color-primary) 50%, var(--color-base-300));
  color: var(--color-base-content);
}

.app-sidebar__nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0 0.5rem 0.75rem;
}

.app-nav-title {
  margin: 0.875rem 0 0.25rem;
  padding: 0 0.625rem;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
  font-size: 0.75rem;
  font-weight: 500;
}

.app-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  height: 2.125rem;
  padding: 0 0.625rem;
  border-radius: var(--radius-field);
  color: color-mix(in oklab, var(--color-base-content) 82%, transparent);
  font-size: 0.875rem;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.app-nav-item:hover {
  background-color: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  color: var(--color-base-content);
}

.app-nav-item.is-active {
  background-color: color-mix(in oklab, var(--color-primary) 14%, transparent);
  color: var(--color-primary);
  font-weight: 600;
}

.app-sidebar__foot {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid var(--color-base-300);
  background-color: var(--color-base-100);
}

/* 主题菜单里的色点：每一格带 data-theme，取的是那个主题自己的主色 */
.theme-dot {
  display: flex;
  flex: none;
  width: 1rem;
  height: 1rem;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--color-base-content) 22%, transparent);
}

/* daisyUI 会给带 data-theme 的元素铺一层底色渐变，要去掉才看得到下面的颜色 */
.theme-dot i {
  display: block;
  flex: 1;
  background-color: var(--color-primary);
  background-image: none;
}

.theme-dot.is-split i {
  background-color: var(--color-base-100);
}

.app-refresh {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  padding: 0.375rem 0.5rem;
  border-radius: var(--radius-field);
  text-align: left;
  transition: background-color 0.12s ease;
}

.app-refresh:hover:not(:disabled) {
  background-color: color-mix(in oklab, var(--color-base-content) 6%, transparent);
}

.app-refresh:disabled {
  opacity: 0.6;
}
</style>
