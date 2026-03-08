<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { useNotificationStore } from '@/stores/notification'
import { Calendar, EyeOff, Radio, PlayCircle, Clock, Bell, BellRing } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import Pagination from '@/components/Pagination.vue'

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const notificationStore = useNotificationStore()

const isVliveSubscribed = computed(() => notificationStore.hasSubscription('vlive'))
async function toggleVliveSub() {
  try {
    await notificationStore.toggleSubscription('vlive')
  } catch (e) {
    alert('订阅切换失败: ' + (e instanceof Error ? e.message : String(e)))
  }
}

const vlives = ref<any[]>([])
const searchQuery = ref('')
const showEnded = ref(false)
const isLoading = ref(true)

const currentPage = computed(() => Number(route.query.page) || 1)
const pageSize = 24

const assetsHost = computed(() => settingsStore.assetsHost)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>

// 更新当前时间，用于状态反应
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onUnmounted(() => {
  clearInterval(timer)
})

const typeMap: Record<string, { label: string; color: string }> = {
  normal: { label: '普通', color: 'badge-primary' },
  after_event: { label: '活动后', color: 'badge-secondary' },
  cheer: { label: 'Cheer', color: 'badge-accent' },
}

const filteredVlives = computed(() => {
  let result = vlives.value

  // 是否展示已结束
  if (!showEnded.value) {
    result = result.filter((v: any) => getStatusInfo(v).status !== 'ended')
  }

  // 名字搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((v: any) => 
      v.name.toLowerCase().includes(query) ||
      v.id.toString().includes(query)
    )
  }

  // 过滤掉迎新 Live (beginner)
  result = result.filter((v: any) => v.virtualLiveType !== 'beginner')

  // 防剧透开关
  if (!settingsStore.showSpoilers) {
    result = result.filter((v: any) => v.startAt <= now.value)
  }

  // 按开始时间倒序，最新的在上面
  return [...result].sort((a: any, b: any) => b.startAt - a.startAt)
})

const totalPages = computed(() => Math.ceil(filteredVlives.value.length / pageSize))

const paginatedVlives = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredVlives.value.slice(start, end)
})

watch([searchQuery, showEnded], () => {
  router.push({ query: { ...route.query, page: '1' } })
})

function handlePageChange(page: number) {
  router.push({ query: { ...route.query, page: page.toString() } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getBannerUrl(assetbundleName: string): string {
  return `${assetsHost.value}/ondemand/virtual_live/select/banner/${assetbundleName}/${assetbundleName}.png`
}

function getScheduleBounds(vlive: any) {
  if (!vlive.virtualLiveSchedules || vlive.virtualLiveSchedules.length === 0) {
    return { start: vlive.startAt, end: vlive.endAt }
  }
  const schedules = vlive.virtualLiveSchedules
  let minStart = schedules[0].startAt
  let maxEnd = schedules[0].endAt
  for (const s of schedules) {
    if (s.startAt < minStart) minStart = s.startAt
    if (s.endAt > maxEnd) maxEnd = s.endAt
  }
  return { start: minStart, end: maxEnd }
}

function getStatusInfo(vlive: any) {
  const current = now.value
  const bounds = getScheduleBounds(vlive)
  
  if (current < bounds.start) {
    return { status: 'upcoming', label: '即将开始', color: 'badge-warning', icon: Clock }
  }
  if (current >= bounds.start && current <= bounds.end) {
    return { status: 'ongoing', label: '进行中', color: 'badge-success text-white', icon: PlayCircle }
  }
  return { status: 'ended', label: '已结束', color: 'badge-ghost', icon: null }
}

function getNextSchedule(vlive: any) {
  const current = now.value
  const schedules = vlive.virtualLiveSchedules || []
  const futureSchedules = schedules.filter((s: any) => s.startAt > current)
  
  if (futureSchedules.length === 0) return null
  
  futureSchedules.sort((a: any, b: any) => a.startAt - b.startAt)
  return {
    next: futureSchedules[0],
    remainingCount: futureSchedules.length
  }
}

onMounted(async () => {
  try {
    const data = await masterStore.getMaster<any>('virtualLives')
    vlives.value = data
  } catch (e) {
    console.error('加载 Virtual Live 数据失败:', e)
  } finally {
    isLoading.value = false
  }
})

function isLeak(vlive: any): boolean {
  return vlive.startAt > now.value
}
</script>

<template>
  <div class="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h1 class="text-3xl font-bold mb-6 flex items-center gap-3">
      <Radio class="w-8 h-8" />
      虚拟 Live
    </h1>

    <div class="flex flex-wrap gap-4 mb-6">
      <div class="form-control flex-1 min-w-[200px]">
        <div class="input-group">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="搜索 Live 名称或 ID..." 
            class="input input-bordered w-full"
          />
        </div>
      </div>

      <div class="flex items-center">
        <label class="label cursor-pointer gap-2 bg-base-200 px-3 py-1 rounded-lg">
          <span class="label-text font-medium text-sm">展示已结束</span>
          <input type="checkbox" class="toggle toggle-sm toggle-primary" v-model="showEnded" />
        </label>
      </div>

      <button 
        v-if="notificationStore.isSupported"
        class="btn btn-sm gap-1"
        :class="isVliveSubscribed ? 'btn-primary' : 'btn-ghost'"
        @click="toggleVliveSub"
      >
        <BellRing v-if="isVliveSubscribed" class="w-4 h-4" />
        <Bell v-else class="w-4 h-4" />
        {{ isVliveSubscribed ? '已订阅 Live' : '订阅 Live' }}
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <RouterLink 
        v-for="vlive in paginatedVlives" 
        :key="vlive.id"
        :to="'/vlives/' + vlive.id"
        class="card bg-base-100 shadow-lg hover:shadow-xl transition-all overflow-hidden relative group block animate-fade-in-up"
      >
        <!-- 遮罩 -->
        <div 
          v-if="isLeak(vlive) && settingsStore.maskSpoilers" 
          class="absolute inset-0 z-50 bg-base-100/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none"
        >
          <EyeOff class="w-8 h-8 mb-2 text-warning" />
          <span class="font-bold text-lg mb-1">即将开始</span>
          <span class="text-xs text-base-content/60">鼠标悬停查看</span>
        </div>

        <figure class="relative bg-base-200 aspect-[122/52]">
          <AssetImage 
            :src="getBannerUrl(vlive.assetbundleName)" 
            :alt="vlive.name"
            class="w-full h-full object-cover"
          />
          
          <!-- 状态角标 -->
          <div class="absolute top-2 left-2 z-20 badge font-bold shadow-md gap-1" :class="getStatusInfo(vlive).color">
            <component v-if="getStatusInfo(vlive).icon" :is="getStatusInfo(vlive).icon" class="w-3 h-3" />
            {{ getStatusInfo(vlive).label }}
          </div>
          
          <!-- 类型角标 -->
          <div class="absolute bottom-2 left-2 z-20">
            <span class="badge" :class="typeMap[vlive.virtualLiveType]?.color || 'badge-ghost'">
              {{ typeMap[vlive.virtualLiveType]?.label || vlive.virtualLiveType }}
            </span>
          </div>

          <div class="absolute top-2 right-2 z-20">
            <span class="badge badge-ghost bg-black/50 text-white border-0">
              #{{ vlive.id }}
            </span>
          </div>
        </figure>
        
        <div class="card-body p-4 gap-2">
          <h2 class="card-title text-[15px] leading-tight line-clamp-2 min-h-[40px]">{{ vlive.name }}</h2>
          
          <div class="text-xs text-base-content/70 whitespace-nowrap bg-base-200 p-2 rounded-md flex items-center gap-2">
            <Calendar class="w-3.5 h-3.5 flex-shrink-0" />
            <span>{{ formatDate(getScheduleBounds(vlive).start) }} ~ {{ formatDate(getScheduleBounds(vlive).end) }}</span>
          </div>

          <!-- 下一排期信息 -->
          <div v-if="getNextSchedule(vlive)" class="text-xs text-primary bg-primary/10 p-2 rounded-md flex justify-between items-center whitespace-nowrap overflow-hidden">
            <div class="flex items-center gap-1.5 flex-1 min-w-0">
              <Clock class="w-3.5 h-3.5 flex-shrink-0" />
              <span class="truncate">下一场: {{ formatDate(getNextSchedule(vlive)!.next.startAt) }}</span>
            </div>
            <span class="font-bold shrink-0 ml-2 border border-primary/30 px-1.5 rounded-sm">
              剩余 {{ getNextSchedule(vlive)?.remainingCount }} 场
            </span>
          </div>
          <div v-else-if="getStatusInfo(vlive).status === 'ongoing'" class="text-xs text-warning bg-warning/10 p-2 rounded-md flex items-center justify-center">
            所有场次已结束 / 随时入场
          </div>
        </div>
      </RouterLink>
    </div>

    <!-- 分页控件 -->
    <Pagination
      v-if="totalPages > 1 && !isLoading"
      :current-page="currentPage"
      :total-pages="totalPages"
      base-url="/vlives"
      @page-change="handlePageChange"
    />

    <!-- 空状态 -->
    <div v-if="!isLoading && filteredVlives.length === 0" class="text-center py-20 text-base-content/60">
      没有找到符合条件的虚拟 Live
    </div>
  </div>
</template>
