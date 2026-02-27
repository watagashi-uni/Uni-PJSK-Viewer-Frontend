<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useAccountStore } from '@/stores/account'
import { useSettingsStore } from '@/stores/settings'
import { getVersion } from '@/api/version'
import { 
  Music, Calendar, Clock, 
  ChevronRight, Sparkles, BarChart3,
  CreditCard, User, Gift, Palette,
  ExternalLink, Link
} from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'

const FRONTEND_VERSION = '2.5.4'

const masterStore = useMasterStore()
const accountStore = useAccountStore()
const settingsStore = useSettingsStore()
const assetsHost = computed(() => settingsStore.assetsHost)

const dataVersion = ref<string>('加载中...')
const assetVersion = ref<string>('加载中...')
const appVersion = ref<string>('加载中...')
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

interface EventData {
  id: number
  eventType: string
  name: string
  assetbundleName: string
  startAt: number
  aggregateAt: number
}

interface MusicData {
  id: number
  title: string
  assetbundleName: string
  publishedAt: number
  composer: string
  lyricist: string
}

interface Gacha {
  id: number
  gachaType: string
  name: string
  seq: number
  assetbundleName: string
  gachaCeilItemId: number
  startAt: number
  endAt: number
}

const events = ref<EventData[]>([])
const musics = ref<MusicData[]>([])
const gachas = ref<Gacha[]>([])

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

onMounted(async () => {
  try {
    // 1. 确保 masterStore 已初始化（如果 App.vue 还没完成初始化）
    if (!masterStore.isReady) {
      await masterStore.initialize()
    }
    
    // 2. 并行获取版本信息和 master 数据
    const [versionRes, eventsData, musicsData, gachasData] = await Promise.all([
      getVersion(),
      masterStore.getMaster<EventData>('events'),
      masterStore.getMaster<MusicData>('musics'),
      masterStore.getMaster<Gacha>('gachas'),
      masterStore.getMaster<any>('cards')
    ])
    
    // 设置版本信息
    dataVersion.value = versionRes.dataVersion || '未知'
    assetVersion.value = versionRes.assetVersion || '未知'
    appVersion.value = versionRes.appVersion || '未知'
    
    // 设置数据 (events 需要倒序)
    events.value = eventsData.sort((a, b) => b.id - a.id)
    musics.value = musicsData
    gachas.value = gachasData
  } catch (e) {
    console.error('加载首页数据失败:', e)
    dataVersion.value = '获取失败'
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
            v{{ FRONTEND_VERSION }} • Data: {{ dataVersion }} • Asset: {{ assetVersion }}
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
