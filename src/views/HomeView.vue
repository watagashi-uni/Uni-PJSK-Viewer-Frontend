<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useAccountStore } from '@/stores/account'
import { useSettingsStore } from '@/stores/settings'
import { 
  Music, Calendar, Clock, 
  ChevronRight, Sparkles, BarChart3,
  CreditCard, User, Gift, Palette,
  ExternalLink, Link, CalendarDays, History, House, Layers3, BookOpen, Radio, Users
} from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import type { EventData, MusicData } from '@/types/master'

const masterStore = useMasterStore()
const accountStore = useAccountStore()
const settingsStore = useSettingsStore()
const assetsHost = computed(() => settingsStore.assetsHost)

const dataVersion = computed(() => masterStore.version || '加载中...')
const assetVersion = computed(() => masterStore.assetVersion || '加载中...')
const isLoading = ref(true)

const themesList = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'moe', label: 'Moe' },
  { value: 'jirai', label: '地雷' },
  { value: 'auto', label: '跟随系统' }
]

function selectTheme(val: any) {
  settingsStore.setTheme(val)
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

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
  const now = Date.now()
  
  // 1. 查找正在进行的活动
  const ongoing = events.value.find(e => now >= e.startAt && now <= e.aggregateAt)
  if (ongoing) {
    return { ...ongoing, status: 'ongoing', statusLabel: '正在进行' } as CurrentEventType
  }
  
  // 2. 查找最近已经开始过的活动（已结束）
  const startedEvents = events.value.filter(e => now >= e.startAt)
  if (startedEvents.length === 0) return null
  
  // 取最近结束的活动
  const latest = startedEvents[0]
  return { ...latest, status: 'ended', statusLabel: '已结束' } as CurrentEventType
})

// 最近新曲（前5首，主页严格不显示未发布的歌曲）
const recentMusics = computed(() => {
  const now = Date.now()
  let list = musics.value.filter(m => m.publishedAt <= now)
  
  // 按发布时间倒序，如果相同按 ID 倒序
  list.sort((a, b) => {
    if (b.publishedAt !== a.publishedAt) {
      return b.publishedAt - a.publishedAt
    }
    return b.id - a.id
  })
  
  return list.slice(0, 5)
})

// 正在进行中的卡池
const ongoingGachas = computed(() => {
  const now = Date.now()
  let list = gachas.value.filter(g => now >= g.startAt && now <= g.endAt)
  list.sort((a, b) => b.startAt - a.startAt)
  return list
})

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
  const now = Date.now()
  const horizon = now + 90 * 24 * 60 * 60 * 1000
  return allScheduleItems.value
    .filter(row => row.timestamp > now && row.timestamp <= horizon)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 6)
})

const recentScheduleItems = computed(() => {
  const now = Date.now()
  return allScheduleItems.value
    .filter(row => row.timestamp <= now)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6)
})

const isShowingUpcomingSchedule = computed(() => settingsStore.showSpoilers && upcomingScheduleItems.value.length > 0)
const homeScheduleItems = computed(() => isShowingUpcomingSchedule.value ? upcomingScheduleItems.value : recentScheduleItems.value)
const scheduleTitle = computed(() => isShowingUpcomingSchedule.value ? '近期日程' : '最近动态')

function scheduleTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  const nowKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (dateKey === nowKey) return `今天 ${time}`
  return date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

const gachaScrollContainer = ref<HTMLElement | null>(null)
function handleGachaScroll(e: WheelEvent) {
  if (!gachaScrollContainer.value) return
  // 如果是垂直滚动（传统鼠标滚轮）
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    e.preventDefault() // 阻止页面整体下滚
    gachaScrollContainer.value.scrollLeft += e.deltaY * 1.5 // 稍微放大一点滚动速度
  }
  // 触控板横向滑动不阻止默认行为，保留原生惯性
}

// 格式化日期
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化剩余时间
function getRemainingTime(event: EventData): string {
  const now = Date.now()
  const end = event.aggregateAt
  const remaining = end - now
  
  if (remaining <= 0) return '已结束'
  
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `剩余 ${days}天${hours}小时`
  return `剩余 ${hours}小时`
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

const accountDataTime = computed(() => {
  if (!currentUserProfile.value) return ''
  const hasSuiteTime = Boolean(currentUserProfile.value.uploadTime)
  const timestamp = hasSuiteTime
    ? Number(currentUserProfile.value.uploadTime) * 1000
    : Number(currentUserProfile.value.lastRefresh)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return ''
  const label = hasSuiteTime ? 'Suite 数据' : '资料刷新'
  return `${label}：${new Date(timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}`
})

onMounted(async () => {
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
    <!-- 头部欢迎区与用户简影 -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-base-100 p-6 rounded-xl shadow-sm">
      <!-- App Info & Theme Dropdown -->
      <div class="flex-1 flex flex-row items-center gap-2 sm:gap-4 w-full">
        <div class="min-w-0">
          <h1 class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
            Uni PJSK Viewer
          </h1>
          <p class="text-base-content/60 text-xs sm:text-sm mt-1 truncate">
            Data: {{ dataVersion }} • Asset: {{ assetVersion }}
          </p>
        </div>
        
        <!-- Theme Quick Selector -->
        <div class="dropdown dropdown-end z-20 ml-auto shrink-0">
          <label tabindex="0" class="btn btn-sm btn-ghost gap-1 px-2">
            <Palette class="w-4 h-4" />
            <span>
              {{ themesList.find(t => t.value === settingsStore.theme)?.label || '主题' }}
            </span>
          </label>
          <ul tabindex="0" class="dropdown-content z-20 menu p-2 shadow bg-base-100 rounded-box w-32">
            <li v-for="t in themesList" :key="t.value">
              <a 
                :class="{ 'active': settingsStore.theme === t.value }"
                @click="selectTheme(t.value)"
              >
                {{ t.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- User Profile Thumbnail -->
      <RouterLink v-if="currentUserProfile" to="/profile" class="flex items-center gap-3 bg-base-200/50 p-2 pr-4 rounded-full border border-base-200 shadow-sm shrink-0 hover:bg-base-200 transition-colors cursor-pointer">
        <div class="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shrink-0 bg-base-300">
          <AssetImage 
            v-if="leaderCard"
            :src="`${assetsHost}/startapp/thumbnail/chara/${leaderCard.assetbundleName}_${leaderCard.userCardInfo.defaultImage === 'training' ? 'after_training' : 'normal'}.png`"
            class="w-full h-full object-cover"
          />
          <User v-else class="w-6 h-6 m-3 text-base-content/30" />
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-sm">{{ currentUserProfile.name }}</span>
          <span class="text-xs text-base-content/60 font-medium">
            <span class="text-primary">Lv.{{ currentUserProfileData?.user?.rank || currentUserSuite?.user?.rank || '未知' }}</span>
          </span>
        </div>
      </RouterLink>
      <div v-else class="flex flex-col sm:flex-row items-center gap-3">
        <span class="text-sm text-base-content/60 text-center sm:text-left">尚未绑定账号</span>
        <RouterLink to="/profile" class="btn btn-sm btn-primary btn-outline rounded-full">去添加账号</RouterLink>
      </div>
    </div>
    
    <!-- 顶部快捷入口 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <RouterLink to="/musics" class="btn bg-base-100 border-base-200 hover:border-primary hover:bg-base-200 h-auto py-3 gap-2 justify-start shadow-sm hover:shadow-md transition-all">
        <Music class="w-5 h-5 flex-shrink-0 text-primary" /> 
        <div class="flex flex-col items-start leading-tight">
          <span class="font-bold text-base-content">歌曲一览</span>
          <span class="text-[10px] font-normal text-base-content/60">Musics</span>
        </div>
      </RouterLink>
      <RouterLink to="/cards" class="btn bg-base-100 border-base-200 hover:border-secondary hover:bg-base-200 h-auto py-3 gap-2 justify-start shadow-sm hover:shadow-md transition-all">
        <CreditCard class="w-5 h-5 flex-shrink-0 text-secondary" />
        <div class="flex flex-col items-start leading-tight">
          <span class="font-bold text-base-content">卡片一览</span>
          <span class="text-[10px] font-normal text-base-content/60">Cards</span>
        </div>
      </RouterLink>
      <RouterLink to="/events" class="btn bg-base-100 border-base-200 hover:border-accent hover:bg-base-200 h-auto py-3 gap-2 justify-start shadow-sm hover:shadow-md transition-all">
        <Calendar class="w-5 h-5 flex-shrink-0 text-accent" />
        <div class="flex flex-col items-start leading-tight">
          <span class="font-bold text-base-content">活动总览</span>
          <span class="text-[10px] font-normal text-base-content/60">Events</span>
        </div>
      </RouterLink>
      <RouterLink to="/gachas" class="btn bg-base-100 border-base-200 hover:border-orange-500 hover:bg-base-200 h-auto py-3 gap-2 justify-start shadow-sm hover:shadow-md transition-all">
        <Sparkles class="w-5 h-5 flex-shrink-0 text-orange-500" />
        <div class="flex flex-col items-start leading-tight">
          <span class="font-bold text-base-content">活动卡池</span>
          <span class="text-[10px] font-normal text-base-content/60">Gachas</span>
        </div>
      </RouterLink>
    </div>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
      <section class="card border border-base-200 bg-base-100 shadow-sm">
        <div class="card-body gap-3 p-4 md:p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="flex items-center gap-2 text-lg font-bold"><CalendarDays class="h-5 w-5 text-primary" />{{ scheduleTitle }}</h2>
              <p class="mt-0.5 text-xs text-base-content/45">{{ isShowingUpcomingSchedule ? '已开启未来内容，列出未来 90 天内接下来发生的事项' : settingsStore.showSpoilers ? '未来 90 天暂无日程，暂时显示最近动态' : '未来内容已隐藏，仅列出最近发生的事项' }}</p>
            </div>
            <RouterLink to="/calendar" class="btn btn-ghost btn-sm shrink-0">完整日历 <ChevronRight class="h-4 w-4" /></RouterLink>
          </div>
          <div v-if="isLoading" class="grid gap-2 sm:grid-cols-2"><div v-for="index in 4" :key="index" class="skeleton h-16 rounded-lg"></div></div>
          <div v-else-if="homeScheduleItems.length" class="grid gap-2 sm:grid-cols-2">
            <RouterLink v-for="item in homeScheduleItems" :key="item.key" :to="item.route" class="group flex min-w-0 items-center gap-3 rounded-xl border border-base-200 px-3 py-2.5 transition-colors hover:border-primary/35 hover:bg-base-200/45">
              <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="scheduleMeta[item.category].dot"></span>
              <div class="min-w-0 flex-1"><div class="flex items-center gap-1.5"><span class="badge badge-xs" :class="scheduleMeta[item.category].badge">{{ scheduleMeta[item.category].label }}</span><span class="truncate text-[10px] text-base-content/40">{{ item.subtitle }}</span></div><p class="mt-1 truncate text-sm font-medium group-hover:text-primary" :title="item.title">{{ item.title }}</p></div>
              <time class="shrink-0 text-[10px] text-base-content/45">{{ scheduleTime(item.timestamp) }}</time>
            </RouterLink>
          </div>
          <div v-else class="rounded-xl bg-base-200/45 py-8 text-center text-sm text-base-content/45">当前没有可显示的日程</div>
        </div>
      </section>

      <section class="card border border-base-200 bg-base-100 shadow-sm">
        <div class="card-body gap-3 p-4 md:p-5">
          <div><h2 class="text-lg font-bold">{{ currentUserProfile ? '账号工作台' : '常用工具' }}</h2><p v-if="currentUserProfile" class="mt-0.5 text-xs text-base-content/45">{{ currentUserProfile.name }}</p><p v-else class="mt-0.5 text-xs text-base-content/45">无需绑定账号也可以直接使用</p></div>
          <template v-if="currentUserProfile">
            <div class="grid grid-cols-2 gap-2">
              <RouterLink to="/card-collection" class="btn h-auto justify-start gap-2 border-base-200 bg-base-200/45 px-3 py-2.5"><Layers3 class="h-4 w-4 text-primary" /><span class="text-xs">养成进度</span></RouterLink>
              <RouterLink to="/account-records" class="btn h-auto justify-start gap-2 border-base-200 bg-base-200/45 px-3 py-2.5"><History class="h-4 w-4 text-secondary" /><span class="text-xs">账号记录</span></RouterLink>
              <RouterLink to="/deck-recommend" class="btn h-auto justify-start gap-2 border-base-200 bg-base-200/45 px-3 py-2.5"><Sparkles class="h-4 w-4 text-warning" /><span class="text-xs">卡组推荐</span></RouterLink>
              <RouterLink to="/mysekai" class="btn h-auto justify-start gap-2 border-base-200 bg-base-200/45 px-3 py-2.5"><House class="h-4 w-4 text-accent" /><span class="text-xs">MySekai</span></RouterLink>
              <RouterLink to="/characters" class="btn h-auto justify-start gap-2 border-base-200 bg-base-200/45 px-3 py-2.5"><Users class="h-4 w-4 text-info" /><span class="text-xs">角色成长</span></RouterLink>
              <RouterLink to="/profile" class="btn h-auto justify-start gap-2 border-base-200 bg-base-200/45 px-3 py-2.5"><User class="h-4 w-4" /><span class="text-xs">个人信息</span></RouterLink>
            </div>
            <p v-if="accountDataTime" class="mt-auto text-center text-[10px] text-base-content/35">{{ accountDataTime }}</p>
          </template>
          <div v-else class="grid grid-cols-2 gap-2">
            <RouterLink to="/calendar" class="btn h-auto justify-start gap-2 border-base-200 bg-base-200/45 px-3 py-2.5"><CalendarDays class="h-4 w-4 text-primary" /><span class="text-xs">游戏日历</span></RouterLink>
            <RouterLink to="/deck-recommend" class="btn h-auto justify-start gap-2 border-base-200 bg-base-200/45 px-3 py-2.5"><Sparkles class="h-4 w-4 text-warning" /><span class="text-xs">卡组推荐</span></RouterLink>
            <RouterLink to="/stories" class="btn h-auto justify-start gap-2 border-base-200 bg-base-200/45 px-3 py-2.5"><BookOpen class="h-4 w-4 text-secondary" /><span class="text-xs">故事档案</span></RouterLink>
            <RouterLink to="/sus2img" class="btn h-auto justify-start gap-2 border-base-200 bg-base-200/45 px-3 py-2.5"><Music class="h-4 w-4 text-info" /><span class="text-xs">谱面图片</span></RouterLink>
            <RouterLink to="/vlives" class="btn h-auto justify-start gap-2 border-base-200 bg-base-200/45 px-3 py-2.5"><Radio class="h-4 w-4 text-accent" /><span class="text-xs">Virtual Live</span></RouterLink>
            <RouterLink to="/profile" class="btn h-auto justify-start gap-2 border-primary/35 bg-primary/8 px-3 py-2.5"><User class="h-4 w-4 text-primary" /><span class="text-xs">添加账号</span></RouterLink>
          </div>
        </div>
      </section>
    </div>
    
    <!-- 主体两列内容 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：当前活动 (占 2 列) -->
      <div class="lg:col-span-2 space-y-6 min-w-0">
        <h2 class="text-xl font-bold flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-primary" />
          {{ currentEvent?.status === 'ongoing' ? '当前活动' : '最近活动' }}
        </h2>
        
        <div v-if="isLoading" class="skeleton h-64 w-full rounded-xl"></div>
        
        <RouterLink 
          v-else-if="currentEvent"
          :to="`/events/${currentEvent.id}`"
          class="block group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-base-200 bg-base-100 flex flex-col xl:flex-row cursor-pointer"
        >
          <!-- Banner 图片侧 (左侧/顶部) -->
          <div class="w-full xl:w-1/2 p-4 xl:p-6 xl:pr-0 flex flex-col items-center justify-start order-1 shrink-0 bg-base-100 z-10">
            <div class="w-full max-w-[488px] overflow-hidden rounded-lg shadow-sm relative pointer-events-none">
              <AssetImage 
                :src="`${assetsHost}/startapp/home/banner/${currentEvent.assetbundleName}/${currentEvent.assetbundleName}.png`"
                class="w-full aspect-[122/52] object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <!-- 左下角额外板块：活动快捷入口 -->
          </div>

          <!-- 内容侧 (右侧/底部) -->
          <div class="p-5 md:p-6 flex flex-col justify-center relative z-10 order-2 flex-1">
            <div class="flex items-center gap-2 mb-3">
              <span 
                class="badge border-none"
                :class="eventTypeMap[currentEvent.eventType]?.color || 'badge-ghost'"
              >
                {{ eventTypeMap[currentEvent.eventType]?.label || currentEvent.eventType }}
              </span>
              <span 
                v-if="currentEvent.status === 'ongoing'"
                class="badge badge-success gap-1 border-none text-white shadow-sm"
              >
                <Clock class="w-3 h-3" />
                {{ getRemainingTime(currentEvent) }}
              </span>
              <span 
                v-else
                class="badge badge-ghost gap-1 border-none text-base-content/80 shadow-sm"
              >
                {{ currentEvent.statusLabel }}
              </span>
            </div>
            
            <h3 class="text-xl md:text-2xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors">
              {{ currentEvent.name }}
            </h3>
            
            <div class="space-y-2 text-sm text-base-content/70">
              <div class="flex items-center gap-2">
                <Calendar class="w-4 h-4 opacity-50" />
                <span>{{ formatDate(currentEvent.startAt) }} - {{ formatDate(currentEvent.aggregateAt) }}</span>
              </div>
            </div>

            <!-- 榜线按钮放回由底部对齐 -->
            <div class="mt-auto pt-4">
              <RouterLink 
                v-if="currentEvent.status === 'ongoing'"
                to="/ranking"
                class="btn btn-sm btn-primary btn-outline w-fit z-20 relative pointer-events-auto shadow-sm"
                @click.stop
              >
                <BarChart3 class="w-4 h-4" />
                查看榜线
              </RouterLink>
            </div>
          </div>
        </RouterLink>
        <div v-else class="text-center py-10 text-base-content/60 bg-base-100 rounded-xl">
          暂无活动信息
        </div>

        <!-- 当前卡池板块 (放置在活动内容下方) -->
        <div v-if="ongoingGachas.length > 0" class="space-y-4 pt-2">
          <div class="flex justify-between items-end pb-2 border-b border-base-200">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <Gift class="w-5 h-5 text-orange-500" />
              正在进行的卡池
            </h2>
          </div>
          
          <!-- 横向滚动容器 -->
          <div 
            ref="gachaScrollContainer"
            class="flex overflow-x-auto gap-4 pb-4 w-full"
            @wheel="handleGachaScroll"
          >
            <RouterLink 
              v-for="gacha in ongoingGachas" 
              :key="gacha.id"
              :to="`/gacha/${gacha.id}`"
              class="shrink-0 w-[240px] md:w-[320px] aspect-[21/10] relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 bg-base-100 group border border-base-200 pointer-events-auto cursor-pointer flex items-center justify-center p-2"
            >
              <AssetImage 
                :src="`${assetsHost}/ondemand/gacha/${gacha.assetbundleName}/logo/logo.png`" 
                :alt="gacha.name"
                class="w-full h-full object-contain group-hover:scale-105 transition-transform"
              />
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- 右侧：最新歌曲 (占 1 列) -->
      <div class="space-y-4">
        <div class="flex justify-between items-end pb-2 border-b border-base-200">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <Music class="w-5 h-5 text-secondary" />
            最新歌曲
          </h2>
          <RouterLink to="/musics" class="text-xs link link-hover text-secondary">
            查看更多
          </RouterLink>
        </div>

        <div v-if="isLoading" class="space-y-4">
          <div v-for="i in 5" :key="i" class="skeleton h-16 w-full rounded-lg"></div>
        </div>

        <div v-else class="space-y-3">
          <RouterLink 
            v-for="music in recentMusics" 
            :key="music.id"
            :to="`/musics/${music.id}`"
            class="flex items-center gap-3 p-3 bg-base-100 border border-base-200 rounded-xl shadow-sm hover:shadow-md hover:border-secondary transition-all group"
          >
            <!-- 封面 -->
            <div class="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
              <AssetImage 
                :src="`${assetsHost}/startapp/music/jacket/${music.assetbundleName}/${music.assetbundleName}.png`"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            
            <!-- 信息 -->
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-sm truncate group-hover:text-secondary transition-colors">
                {{ music.title }}
              </h4>
              <p class="text-[10px] text-base-content/50 truncate mt-0.5 font-medium">
                {{ music.composer }}
              </p>
            </div>
            
            <ChevronRight class="w-4 h-4 text-base-content/30 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
          </RouterLink>
        </div>
      </div>
    </div>
    
    <!-- 友情链接 -->
    <div class="space-y-4 border-t border-base-200 pt-6">
      <h2 class="text-lg font-bold flex items-center gap-2 text-base-content/80 px-1">
        <Link class="w-4 h-4 opacity-70" />
        友情链接
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <a 
          href="https://pjsk.moe" 
          target="_blank" 
          rel="noopener noreferrer"
          class="flex items-center justify-between p-4 bg-base-100 border border-base-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all group"
        >
          <div class="flex flex-col">
            <span class="font-bold text-base-content group-hover:text-primary transition-colors">MoeSekai</span>
            <span class="text-xs text-base-content/50 mt-0.5">多功能 PJSK Viewer</span>
          </div>
          <ExternalLink class="w-4 h-4 text-base-content/30 group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
        </a>
        
        <a 
          href="https://haruki.seiunx.com" 
          target="_blank" 
          rel="noopener noreferrer"
          class="flex items-center justify-between p-4 bg-base-100 border border-base-200 rounded-xl shadow-sm hover:shadow-md hover:border-secondary/50 transition-all group"
        >
          <div class="flex flex-col">
            <span class="font-bold text-base-content group-hover:text-secondary transition-colors">Haruki 工具箱</span>
            <span class="text-xs text-base-content/50 mt-0.5">上传抓包数据</span>
          </div>
          <ExternalLink class="w-4 h-4 text-base-content/30 group-hover:text-secondary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
        </a>

        <a 
          href="https://3-3.dev" 
          target="_blank" 
          rel="noopener noreferrer"
          class="flex items-center justify-between p-4 bg-base-100 border border-base-200 rounded-xl shadow-sm hover:shadow-md hover:border-accent/50 transition-all group"
        >
          <div class="flex flex-col">
            <span class="font-bold text-base-content group-hover:text-accent transition-colors">33 Kit</span>
            <span class="text-xs text-base-content/50 mt-0.5">在线组卡 / 活动预测</span>
          </div>
          <ExternalLink class="w-4 h-4 text-base-content/30 group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
        </a>
      </div>
    </div>
  </div>
</template>
