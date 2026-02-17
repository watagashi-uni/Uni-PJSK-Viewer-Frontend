<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMasterStore } from '@/stores/master'
import { getVersion } from '@/api/version'
import { 
  Music, Calendar, Clock, 
  ChevronRight, Sparkles, BarChart3
} from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'

// 前端版本号 - 每次发布时更新
const FRONTEND_VERSION = '2.2.5'

const masterStore = useMasterStore()
const assetsHost = 'https://assets.unipjsk.com'

const dataVersion = ref<string>('加载中...')
const assetVersion = ref<string>('加载中...')
const appVersion = ref<string>('加载中...')
const isLoading = ref(true)

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

const events = ref<EventData[]>([])
const musics = ref<MusicData[]>([])

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

onMounted(async () => {
  try {
    // 1. 确保 masterStore 已初始化（如果 App.vue 还没完成初始化）
    if (!masterStore.isReady) {
      await masterStore.initialize()
    }
    
    // 2. 并行获取版本信息和 master 数据
    const [versionRes, eventsData, musicsData] = await Promise.all([
      getVersion(),
      masterStore.getMaster<EventData>('events'),
      masterStore.getMaster<MusicData>('musics')
    ])
    
    // 设置版本信息
    dataVersion.value = versionRes.dataVersion || '未知'
    assetVersion.value = versionRes.assetVersion || '未知'
    appVersion.value = versionRes.appVersion || '未知'
    
    // 设置数据 (events 需要倒序)
    events.value = eventsData.sort((a, b) => b.id - a.id)
    musics.value = musicsData
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
    <!-- 头部欢迎区 -->
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-base-100 p-6 rounded-xl shadow-sm">
      <div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Uni PJSK Viewer
        </h1>
        <p class="text-base-content/60 text-sm mt-1">
          v{{ FRONTEND_VERSION }} • Data: {{ dataVersion }} • Asset: {{ assetVersion }}
        </p>
      </div>
      <div class="flex gap-3">
        <RouterLink to="/musics" class="btn btn-primary btn-sm">
          <Music class="w-4 h-4" /> 歌曲列表
        </RouterLink>
        <RouterLink to="/events" class="btn btn-secondary btn-sm">
          <Calendar class="w-4 h-4" /> 活动总览
        </RouterLink>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：当前活动 (占 2 列) -->
      <div class="lg:col-span-2 space-y-6">
        <h2 class="text-xl font-bold flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-primary" />
          {{ currentEvent?.status === 'ongoing' ? '正在进行' : '最近活动' }}
        </h2>
        
        <div v-if="isLoading" class="skeleton h-64 w-full rounded-xl"></div>
        
        <div 
          v-else-if="currentEvent"
          class="block group relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <!-- 全卡片链接 -->
          <RouterLink :to="`/events/${currentEvent.id}`" class="absolute inset-0 z-0 cursor-pointer"></RouterLink>

          <!-- Banner 背景 -->
          <div class="aspect-[2/1] w-full relative pointer-events-none">
            <AssetImage 
              :src="`${assetsHost}/startapp/home/banner/${currentEvent.assetbundleName}/${currentEvent.assetbundleName}.png`"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            <!-- 内容 -->
            <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div class="flex items-center justify-between mb-2">
                <!-- Badges -->
                <div class="flex items-center gap-2">
                  <span 
                    class="badge border-none"
                    :class="eventTypeMap[currentEvent.eventType]?.color || 'badge-ghost'"
                  >
                    {{ eventTypeMap[currentEvent.eventType]?.label || currentEvent.eventType }}
                  </span>
                  <span 
                    v-if="currentEvent.status === 'ongoing'"
                    class="badge badge-success gap-1 border-none text-white"
                  >
                    <Clock class="w-3 h-3" />
                    {{ getRemainingTime(currentEvent) }}
                  </span>
                  <span 
                    v-else
                    class="badge badge-ghost gap-1 border-none text-white/80"
                  >
                    {{ currentEvent.statusLabel }}
                  </span>
                </div>

                <!-- 榜线按钮 (仅正在进行时显示) -->
                <RouterLink 
                  v-if="currentEvent.status === 'ongoing'"
                  to="/ranking"
                  class="btn btn-sm btn-primary z-10 pointer-events-auto gap-2 border-white/20 shadow-lg"
                >
                  <BarChart3 class="w-4 h-4" />
                  查看榜线
                </RouterLink>
              </div>
              
              <h3 class="text-2xl md:text-3xl font-bold mb-2">{{ currentEvent.name }}</h3>
              
              <div class="flex items-center gap-4 text-white/80 text-sm">
                <span class="flex items-center gap-1">
                  <Calendar class="w-4 h-4" />
                  {{ formatDate(currentEvent.startAt) }} - {{ formatDate(currentEvent.aggregateAt) }}
                </span>
                <span class="flex items-center gap-1">
                  <span class="badge badge-sm badge-outline text-white/80">#{{ currentEvent.id }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-10 text-base-content/60 bg-base-100 rounded-xl">
          暂无活动信息
        </div>
      </div>

      <!-- 右侧：最新歌曲 (占 1 列) -->
      <div class="space-y-4">
        <div class="flex justify-between items-end">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <Music class="w-5 h-5 text-secondary" />
            最新歌曲
          </h2>
          <RouterLink to="/musics" class="text-xs link link-hover opacity-60">
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
            class="flex items-center gap-3 p-3 bg-base-100 rounded-lg shadow-sm hover:shadow-md hover:bg-base-200 transition-all group"
          >
            <!-- 封面 -->
            <div class="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
              <AssetImage 
                :src="`${assetsHost}/startapp/music/jacket/${music.assetbundleName}/${music.assetbundleName}.png`"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            
            <!-- 信息 -->
            <div class="flex-1 min-w-0">
              <h4 class="font-medium truncate group-hover:text-primary transition-colors">
                {{ music.title }}
              </h4>
              <p class="text-xs text-base-content/60 truncate">
                {{ music.composer }}
              </p>
            </div>
            
            <ChevronRight class="w-4 h-4 text-base-content/30 group-hover:text-primary transition-colors" />
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
