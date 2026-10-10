<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useAccountStore } from '@/stores/account'
import { useSettingsStore } from '@/stores/settings'
import {
  Music, Calendar, Clock, ChevronRight, BarChart3, Image, User, Gift,
  CalendarDays, Zap, BookOpen,
} from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import type { EventData, MusicData } from '@/types/master'

const masterStore = useMasterStore()
const accountStore = useAccountStore()
const settingsStore = useSettingsStore()
const assetsHost = computed(() => settingsStore.assetsHost)

const isLoading = ref(true)

// 每分钟刷新一次，用于倒计时与“今天/明天”判断
const now = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | undefined

import type { Gacha } from '@/types/gacha'

const events = ref<EventData[]>([])
const musics = ref<MusicData[]>([])
const gachas = ref<Gacha[]>([])
interface VirtualLiveSummary {
  id: number
  name: string
  startAt: number
}

interface LoginBonusSummary {
  id: number
  name: string
  startAt: number
  endAt: number
}

type ScheduleCategory = 'event' | 'gacha' | 'music' | 'virtual_live' | 'login_bonus'

interface ScheduleItem {
  key: string
  category: ScheduleCategory
  timestamp: number
  title: string
  subtitle: string
  route: string
}

const virtualLives = ref<VirtualLiveSummary[]>([])
const loginBonuses = ref<LoginBonusSummary[]>([])

const scheduleMeta: Record<ScheduleCategory, { label: string; badge: string; dot: string }> = {
  event: { label: '活动', badge: 'badge-primary', dot: 'bg-primary' },
  gacha: { label: '卡池', badge: 'badge-secondary', dot: 'bg-secondary' },
  music: { label: '歌曲', badge: 'badge-info', dot: 'bg-info' },
  virtual_live: { label: 'Live', badge: 'badge-warning', dot: 'bg-warning' },
  login_bonus: { label: '登录', badge: 'badge-accent', dot: 'bg-accent' },
}

// 活动类型映射
const eventTypeMap: Record<string, { label: string; color: string }> = {
  marathon: { label: '马拉松', color: 'badge-primary' },
  cheerful_carnival: { label: '5v5', color: 'badge-secondary' },
  world_bloom: { label: 'World Link', color: 'badge-accent' },
}

// 当前活动（主页严格不显示未开始的活动）
type CurrentEventType = EventData & { status: string; statusLabel: string }
const currentEvent = computed<CurrentEventType | null>(() => {
  const nowMs = now.value

  // 1. 查找正在进行的活动
  const ongoing = events.value.find(e => nowMs >= e.startAt && nowMs <= e.aggregateAt)
  if (ongoing) {
    return { ...ongoing, status: 'ongoing', statusLabel: '正在进行' } as CurrentEventType
  }
  
  // 2. 查找最近已经开始过的活动（已结束）
  const startedEvents = events.value.filter(e => nowMs >= e.startAt)
  if (startedEvents.length === 0) return null
  
  // 取最近结束的活动
  const latest = startedEvents[0]
  return { ...latest, status: 'ended', statusLabel: '已结束' } as CurrentEventType
})

// 最近新曲（前5首，主页严格不显示未发布的歌曲）
const recentMusics = computed(() => {
  const list = musics.value.filter(m => m.publishedAt <= now.value)
  
  // 按发布时间倒序，如果相同按 ID 倒序
  list.sort((a, b) => {
    if (b.publishedAt !== a.publishedAt) {
      return b.publishedAt - a.publishedAt
    }
    return b.id - a.id
  })
  
  return list.slice(0, 5)
})

// 正在进行中的限时卡池：常驻卡池（剩余一年以上）不在首页展示，按结束时间先后排序
const ongoingGachas = computed(() => {
  const permanentThreshold = now.value + 365 * 24 * 60 * 60 * 1000
  return gachas.value
    .filter(g => now.value >= g.startAt && now.value <= g.endAt && g.endAt < permanentThreshold)
    .sort((a, b) => a.endAt - b.endAt || b.startAt - a.startAt)
})

const GACHA_PREVIEW_COUNT = 6
const showAllGachas = ref(false)
const visibleGachas = computed(() => showAllGachas.value ? ongoingGachas.value : ongoingGachas.value.slice(0, GACHA_PREVIEW_COUNT))

const allScheduleItems = computed<ScheduleItem[]>(() => {
  const rows: ScheduleItem[] = []
  for (const event of events.value) {
    rows.push({ key: `event-start-${event.id}`, category: 'event', timestamp: event.startAt, title: event.name, subtitle: '活动开始', route: `/events/${event.id}` })
    rows.push({ key: `event-end-${event.id}`, category: 'event', timestamp: event.aggregateAt, title: event.name, subtitle: '活动结算', route: `/events/${event.id}` })
  }
  for (const gacha of gachas.value) {
    rows.push({ key: `gacha-start-${gacha.id}`, category: 'gacha', timestamp: gacha.startAt, title: gacha.name, subtitle: '卡池开放', route: `/gacha/${gacha.id}` })
    rows.push({ key: `gacha-end-${gacha.id}`, category: 'gacha', timestamp: gacha.endAt, title: gacha.name, subtitle: '卡池结束', route: `/gacha/${gacha.id}` })
  }
  for (const music of musics.value) {
    rows.push({ key: `music-${music.id}`, category: 'music', timestamp: music.publishedAt, title: music.title, subtitle: '歌曲发布', route: `/musics/${music.id}` })
  }
  for (const live of virtualLives.value) {
    rows.push({ key: `live-${live.id}`, category: 'virtual_live', timestamp: live.startAt, title: live.name, subtitle: 'Virtual Live 开始', route: `/vlives/${live.id}` })
  }
  for (const campaign of loginBonuses.value) {
    rows.push({ key: `login-start-${campaign.id}`, category: 'login_bonus', timestamp: campaign.startAt, title: campaign.name, subtitle: '登录活动开始', route: '/calendar' })
    rows.push({ key: `login-end-${campaign.id}`, category: 'login_bonus', timestamp: campaign.endAt, title: campaign.name, subtitle: '登录活动结束', route: '/calendar' })
  }
  return rows.filter(row => Number.isFinite(row.timestamp) && row.timestamp > 0)
})

const upcomingScheduleItems = computed(() => {
  const horizon = now.value + 90 * 24 * 60 * 60 * 1000
  return allScheduleItems.value
    .filter(row => row.timestamp > now.value && row.timestamp <= horizon)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 7)
})

const recentScheduleItems = computed(() => {
  return allScheduleItems.value
    .filter(row => row.timestamp <= now.value)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 7)
})

const isShowingUpcomingSchedule = computed(() => settingsStore.showSpoilers && upcomingScheduleItems.value.length > 0)
const homeScheduleItems = computed(() => isShowingUpcomingSchedule.value ? upcomingScheduleItems.value : recentScheduleItems.value)
const scheduleTitle = computed(() => isShowingUpcomingSchedule.value ? '接下来' : '最近动态')

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function scheduleDay(timestamp: number): string {
  const diffDays = Math.round((startOfDay(timestamp) - startOfDay(now.value)) / DAY_MS)
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === -1) return '昨天'
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function scheduleClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function durationText(ms: number): string {
  if (ms <= 0) return '已结束'
  const days = Math.floor(ms / DAY_MS)
  const hours = Math.floor((ms % DAY_MS) / (60 * 60 * 1000))
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / 60000)
  if (days > 0) return `${days} 天 ${hours} 小时`
  if (hours > 0) return `${hours} 小时 ${minutes} 分`
  return `${Math.max(minutes, 1)} 分钟`
}

const eventProgress = computed(() => {
  const event = currentEvent.value
  if (!event || event.status !== 'ongoing') return 0
  const total = event.aggregateAt - event.startAt
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, ((now.value - event.startAt) / total) * 100))
})

const greeting = computed(() => {
  const hour = new Date(now.value).getHours()
  if (hour < 5) return '夜深了'
  if (hour < 11) return '早上好'
  if (hour < 13) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const todayLabel = computed(() => new Date(now.value).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }))

// 格式化日期
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}


// 用户账号信息
const currentUserProfile = computed(() => {
  const userId = accountStore.currentUserId
  if (!userId) {
    if (accountStore.accounts.length > 0) {
      return accountStore.accounts[0]
    }
    return null
  }
  return accountStore.accounts.find(a => a.userId === userId) || null
})

const currentUserSuite = computed(() => {
  if (!currentUserProfile.value) return null
  return accountStore.getSuiteCache(currentUserProfile.value.userId)
})

const leaderCard = computed(() => {
  // 优先尝试从 profileData 读取 (更准确)
  if (currentUserProfileData.value?.userDeck?.member1 && currentUserProfileData.value?.userCards) {
    const cardId = currentUserProfileData.value.userDeck.member1
    const userCardInfo = currentUserProfileData.value.userCards.find((c: any) => c.cardId === cardId)
    // 根据特殊训练状态判断是否觉醒
    const isTrained = userCardInfo?.specialTrainingStatus === 'done' || userCardInfo?.defaultImage === 'training'
    
    const masterCard = masterStore.cache['cards']?.find((c: any) => c.id === cardId)
    if (masterCard && userCardInfo) {
      return {
        ...masterCard,
        userCardInfo: {
          ...userCardInfo,
          defaultImage: isTrained ? 'training' : 'normal'
        }
      }
    }
  }

  // 后备从 suiteCache 读取
  if (!currentUserSuite.value?.userDecks || !currentUserSuite.value?.userCards) return null
  const mainDeck = currentUserSuite.value.userDecks[0]
  if (!mainDeck?.member1) return null
  
  const userCardInfo = currentUserSuite.value.userCards.find((c: any) => c.cardId === mainDeck.member1)
  if (!userCardInfo) return null
  
  // Need to find master store card info
  const masterCard = masterStore.cache['cards']?.find((c: any) => c.id === mainDeck.member1)
  
  return {
    ...masterCard,
    userCardInfo
  }
})

const currentUserProfileData = computed(() => {
  if (!currentUserProfile.value) return null
  return accountStore.getProfileCache(currentUserProfile.value.userId)
})

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
})

onMounted(async () => {
  nowTimer = setInterval(() => { now.value = Date.now() }, 60_000)
  try {
    masterStore.checkVersionInBackground()

    // 优先使用本地 master 缓存；version 在后台校验，变化时会触发当前页重新挂载。
    const [eventsData, musicsData, gachasData, , virtualLiveData, loginBonusData] = await Promise.all([
      masterStore.getMaster<EventData>('events'),
      masterStore.getMaster<MusicData>('musics'),
      masterStore.getMaster<Gacha>('gachas'),
      masterStore.getMaster<any>('cards'),
      masterStore.getMaster<VirtualLiveSummary>('virtualLives'),
      masterStore.getMaster<LoginBonusSummary>('limitedLoginBonuses'),
    ])
    
    // 设置数据 (events 需要倒序)
    events.value = eventsData.sort((a, b) => b.id - a.id)
    musics.value = musicsData
    gachas.value = gachasData
    virtualLives.value = virtualLiveData
    loginBonuses.value = loginBonusData
  } catch (e) {
    console.error('加载首页数据失败:', e)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- 问候 + 账号 -->
    <header class="flex items-center justify-between gap-4">
      <div class="min-w-0">
        <h1 class="truncate text-2xl font-bold tracking-tight">
          {{ greeting }}<template v-if="currentUserProfile">，{{ currentUserProfile.name }}</template>
        </h1>
        <p class="mt-0.5 text-sm text-base-content/55">{{ todayLabel }}</p>
      </div>
      <RouterLink
        v-if="currentUserProfile"
        to="/profile"
        class="flex shrink-0 items-center gap-2.5 rounded-full border border-base-300 bg-base-100 py-1 pl-1 pr-3 transition-colors hover:border-primary/50"
        title="查看个人信息"
      >
        <span class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-base-300">
          <AssetImage
            v-if="leaderCard"
            :src="`${assetsHost}/startapp/thumbnail/chara/${leaderCard.assetbundleName}_${leaderCard.userCardInfo.defaultImage === 'training' ? 'after_training' : 'normal'}.png`"
            :alt="currentUserProfile.name"
            class="h-full w-full object-cover"
          />
          <User v-else class="m-2 h-5 w-5 text-base-content/40" />
        </span>
        <span class="hidden text-sm sm:block">
          <span class="text-base-content/55">等级</span>
          <span class="ml-1 font-semibold">{{ currentUserProfileData?.user?.rank || currentUserSuite?.user?.rank || '—' }}</span>
        </span>
      </RouterLink>
      <RouterLink v-else to="/profile" class="btn btn-sm btn-primary btn-outline shrink-0">
        <User class="h-4 w-4" /> 绑定账号
      </RouterLink>
    </header>

    <!-- 手机端常用入口（桌面端由侧边栏提供） -->
    <nav class="grid grid-cols-4 gap-2 lg:hidden" aria-label="常用入口">
      <RouterLink
        v-for="entry in [
          { to: '/musics', label: '歌曲', icon: Music },
          { to: '/cards', label: '卡片', icon: Image },
          { to: '/events', label: '活动', icon: Calendar },
          { to: '/gachas', label: '卡池', icon: Gift },
          { to: '/ranking', label: '榜线', icon: BarChart3 },
          { to: '/calendar', label: '日历', icon: CalendarDays },
          { to: '/deck-recommend', label: '组队', icon: Zap },
          currentUserProfile ? { to: '/profile', label: '我的', icon: User } : { to: '/stories', label: '剧情', icon: BookOpen },
        ]"
        :key="entry.to"
        :to="entry.to"
        class="flex flex-col items-center gap-1 rounded-box border border-base-300 bg-base-100 py-2.5 text-xs active:bg-base-200"
      >
        <component :is="entry.icon" class="h-5 w-5 text-primary" />
        {{ entry.label }}
      </RouterLink>
    </nav>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="min-w-0 space-y-6 lg:col-span-2">
        <!-- 当前活动 -->
        <section aria-labelledby="home-event-title">
          <div class="mb-2 flex items-baseline justify-between">
            <h2 id="home-event-title" class="text-base font-semibold">
              {{ currentEvent?.status === 'ongoing' ? '正在进行的活动' : '最近的活动' }}
            </h2>
            <RouterLink to="/events" class="text-sm text-base-content/55 hover:text-primary">全部活动</RouterLink>
          </div>

          <div v-if="isLoading" class="skeleton h-56 w-full rounded-box"></div>
          <article v-else-if="currentEvent" class="overflow-hidden rounded-box border border-base-300 bg-base-100 md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <RouterLink :to="`/events/${currentEvent.id}`" class="block self-center bg-base-200 md:m-3 md:overflow-hidden md:rounded-lg" :aria-label="currentEvent.name">
              <AssetImage
                :src="`${assetsHost}/startapp/home/banner/${currentEvent.assetbundleName}/${currentEvent.assetbundleName}.png`"
                :alt="currentEvent.name"
                class="aspect-[122/52] w-full object-cover"
              />
            </RouterLink>
            <div class="flex flex-col gap-3 p-4 md:pl-1">
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="badge badge-sm badge-outline">{{ eventTypeMap[currentEvent.eventType]?.label || currentEvent.eventType }}</span>
                <span class="text-base-content/55">{{ formatDate(currentEvent.startAt) }} – {{ formatDate(currentEvent.aggregateAt) }}</span>
              </div>
              <RouterLink :to="`/events/${currentEvent.id}`" class="block text-lg font-bold leading-snug hover:text-primary">
                {{ currentEvent.name }}
              </RouterLink>

              <div v-if="currentEvent.status === 'ongoing'">
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="flex items-center gap-1.5 text-base-content/70"><Clock class="h-4 w-4" />距离结束</span>
                  <span class="font-semibold tabular-nums">{{ durationText(currentEvent.aggregateAt - now) }}</span>
                </div>
                <progress class="progress progress-primary h-1.5 w-full" :value="eventProgress" max="100" :aria-label="`活动进度 ${Math.round(eventProgress)}%`"></progress>
              </div>
              <p v-else class="text-sm text-base-content/55">已于 {{ formatDate(currentEvent.aggregateAt) }} 结束</p>

              <div class="mt-auto flex flex-wrap gap-2 pt-1">
                <RouterLink v-if="currentEvent.status === 'ongoing'" to="/ranking" class="btn btn-sm btn-primary">
                  <BarChart3 class="h-4 w-4" /> 实时榜线
                </RouterLink>
                <RouterLink :to="`/events/${currentEvent.id}`" class="btn btn-sm btn-ghost border-base-300">
                  活动详情 <ChevronRight class="h-4 w-4" />
                </RouterLink>
              </div>
            </div>
          </article>
          <p v-else class="rounded-box border border-dashed border-base-300 py-10 text-center text-sm text-base-content/55">暂时没有活动数据</p>
        </section>

        <!-- 进行中的卡池 -->
        <section v-if="isLoading || ongoingGachas.length" aria-labelledby="home-gacha-title">
          <div class="mb-2 flex items-baseline justify-between">
            <h2 id="home-gacha-title" class="text-base font-semibold">
              限时卡池 <span v-if="!isLoading" class="font-normal text-base-content/45">{{ ongoingGachas.length }}</span>
            </h2>
            <RouterLink to="/gachas" class="text-sm text-base-content/55 hover:text-primary">全部卡池</RouterLink>
          </div>
          <div v-if="isLoading" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div v-for="i in 3" :key="i" class="skeleton aspect-[2/1] rounded-box"></div>
          </div>
          <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <RouterLink
              v-for="gacha in visibleGachas"
              :key="gacha.id"
              :to="`/gacha/${gacha.id}`"
              class="group flex min-w-0 flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 transition-colors hover:border-primary/50"
            >
              <span class="flex aspect-[2/1] items-center justify-center p-2">
                <AssetImage
                  :src="`${assetsHost}/ondemand/gacha/${gacha.assetbundleName}/logo/logo.png`"
                  :alt="gacha.name"
                  class="h-full w-full object-contain"
                />
              </span>
              <span class="border-t border-base-300 px-2.5 py-1.5">
                <span class="block truncate text-xs font-medium group-hover:text-primary" :title="gacha.name">{{ gacha.name }}</span>
                <span class="block text-xs text-base-content/50">剩 {{ durationText(gacha.endAt - now) }}</span>
              </span>
            </RouterLink>
          </div>
          <button
            v-if="!isLoading && ongoingGachas.length > GACHA_PREVIEW_COUNT"
            type="button"
            class="btn btn-ghost btn-sm mt-2 w-full border-base-300"
            @click="showAllGachas = !showAllGachas"
          >
            {{ showAllGachas ? '收起' : `显示其余 ${ongoingGachas.length - GACHA_PREVIEW_COUNT} 个` }}
          </button>
        </section>
      </div>

      <aside class="min-w-0 space-y-6">
        <!-- 日程 -->
        <section aria-labelledby="home-schedule-title">
          <div class="mb-2 flex items-baseline justify-between">
            <h2 id="home-schedule-title" class="text-base font-semibold">{{ scheduleTitle }}</h2>
            <RouterLink to="/calendar" class="text-sm text-base-content/55 hover:text-primary">日历</RouterLink>
          </div>
          <div v-if="isLoading" class="space-y-2">
            <div v-for="i in 5" :key="i" class="skeleton h-12 rounded-lg"></div>
          </div>
          <ol v-else-if="homeScheduleItems.length" class="divide-y divide-base-300 overflow-hidden rounded-box border border-base-300 bg-base-100">
            <li v-for="item in homeScheduleItems" :key="item.key">
              <RouterLink :to="item.route" class="flex items-center gap-3 px-3 py-2.5 hover:bg-base-200/60">
                <span class="w-11 shrink-0 text-right leading-tight">
                  <span class="block text-xs font-medium">{{ scheduleDay(item.timestamp) }}</span>
                  <span class="block text-xs tabular-nums text-base-content/50">{{ scheduleClock(item.timestamp) }}</span>
                </span>
                <span class="h-8 w-0.5 shrink-0 rounded-full" :class="scheduleMeta[item.category].dot"></span>
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm" :title="item.title">{{ item.title }}</span>
                  <span class="block text-xs text-base-content/50">{{ item.subtitle }}</span>
                </span>
              </RouterLink>
            </li>
          </ol>
          <p v-else class="rounded-box border border-dashed border-base-300 py-8 text-center text-sm text-base-content/55">没有可显示的日程</p>
          <p v-if="!isLoading && !settingsStore.showSpoilers" class="mt-2 text-xs text-base-content/45">
            未来日程已隐藏，可在<RouterLink to="/settings" class="link">设置</RouterLink>中开启剧透显示。
          </p>
        </section>

        <!-- 新曲 -->
        <section aria-labelledby="home-music-title">
          <div class="mb-2 flex items-baseline justify-between">
            <h2 id="home-music-title" class="text-base font-semibold">最新歌曲</h2>
            <RouterLink to="/musics" class="text-sm text-base-content/55 hover:text-primary">全部歌曲</RouterLink>
          </div>
          <div v-if="isLoading" class="space-y-2">
            <div v-for="i in 5" :key="i" class="skeleton h-14 rounded-lg"></div>
          </div>
          <ul v-else class="divide-y divide-base-300 overflow-hidden rounded-box border border-base-300 bg-base-100">
            <li v-for="music in recentMusics" :key="music.id">
              <RouterLink :to="`/musics/${music.id}`" class="group flex items-center gap-3 px-3 py-2 hover:bg-base-200/60">
                <AssetImage
                  :src="`${assetsHost}/startapp/music/jacket/${music.assetbundleName}/${music.assetbundleName}.png`"
                  :alt="music.title"
                  class="h-11 w-11 shrink-0 rounded-md object-cover"
                />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium group-hover:text-primary">{{ music.title }}</span>
                  <span class="block truncate text-xs text-base-content/50">{{ music.composer }}</span>
                </span>
                <span class="shrink-0 text-xs text-base-content/45">{{ scheduleDay(music.publishedAt) }}</span>
              </RouterLink>
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <!-- 友站 -->
    <footer class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-base-300 pt-4 text-sm text-base-content/55">
      <span>友站</span>
      <a href="https://pjsk.moe" target="_blank" rel="noopener noreferrer" class="hover:text-primary" title="多功能 PJSK Viewer">MoeSekai ↗</a>
      <a href="https://haruki.seiunx.com" target="_blank" rel="noopener noreferrer" class="hover:text-primary" title="上传游戏数据">Haruki 工具箱 ↗</a>
      <a href="https://3-3.dev" target="_blank" rel="noopener noreferrer" class="hover:text-primary" title="在线组卡 / 活动预测">33 Kit ↗</a>
    </footer>
  </div>
</template>
