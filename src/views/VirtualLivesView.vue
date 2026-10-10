<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { useNotificationStore } from '@/stores/notification'
import { Calendar, Radio, PlayCircle, Clock, Bell, BellRing, Search } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import Pagination from '@/components/Pagination.vue'
import PageHeader from '@/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const notificationStore = useNotificationStore()

const isVliveSubscribed = computed(() => notificationStore.hasSubscription('vlive'))
async function toggleVliveSub() {
  if (!notificationStore.isSupported) {
    alert('iOS Safari 浏览器不支持直接推送。\n请点击底部“共享”按钮 -> “添加到主屏幕”，然后从桌面打开本网站即可开启推送通知。')
    return
  }
  if (notificationStore.isAndroid && !isVliveSubscribed.value) {
    const ok = confirm('注意：安卓设备依赖谷歌 FCM 推送服务，国内网络可能无法连接，导致无法开启或收到推送。\n\n建议开启代理后再试，或使用 iOS/桌面端接收推送。\n\n是否继续尝试？')
    if (!ok) return
  }
  try {
    await notificationStore.toggleSubscription('vlive')
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.toLowerCase().includes('registration failed') || msg.toLowerCase().includes('push service') || msg.includes('订阅失败')) {
      alert('订阅失败：无法连接推送服务。\n\n安卓设备依赖谷歌 FCM 服务，国内网络通常无法连接。\n建议开启代理后重试，或使用 iOS / 桌面端设备接收推送。')
    } else {
      alert('订阅切换失败: ' + msg)
    }
  }
}

const vlives = ref<any[]>([])
function readQueryString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

// 搜索词与“展示已结束”保存在 URL query 中, 返回时可恢复
const searchQuery = ref(readQueryString(route.query.q))
const showEnded = ref(route.query.ended === '1')
const isLoading = ref(true)

const currentPage = computed(() => Number(route.query.page) || 1)
const pageSize = 24

const assetsHost = computed(() => settingsStore.assetsHost)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>

// 更新当前时间，用于状态反应 (状态与排期精确到分钟, 30 秒刷新足够)
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 30_000)
})
onUnmounted(() => {
  clearInterval(timer)
})

const typeMap: Record<string, { label: string; color: string }> = {
  normal: { label: '普通 Live', color: 'badge-primary' },
  cheerful_carnival: { label: 'Cheerful Carnival', color: 'badge-secondary' },
  streaming: { label: 'Connect Live', color: 'badge-accent' },
  virtual_message: { label: 'Virtual Message', color: 'badge-info' },
  beginner: { label: 'Welcome Live', color: 'badge-success' },
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

watch([searchQuery, showEnded], ([q, ended]) => {
  const nextQ = q || undefined
  const nextEnded = ended ? '1' : undefined
  if ((route.query.q ?? undefined) === nextQ && (route.query.ended ?? undefined) === nextEnded) return
  router.replace({ query: { ...route.query, q: nextQ, ended: nextEnded, page: undefined } })
})

// 浏览器前进/后退时同步筛选状态
watch(() => [route.query.q, route.query.ended], ([q, ended]) => {
  const nextQ = readQueryString(q)
  if (searchQuery.value !== nextQ) searchQuery.value = nextQ
  const nextEnded = ended === '1'
  if (showEnded.value !== nextEnded) showEnded.value = nextEnded
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
    return { status: 'ongoing', label: '进行中', color: 'badge-success', icon: PlayCircle }
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

</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5">
    <PageHeader title="虚拟 Live" :description="`查看演出排期、节目单与参加奖励 · ${filteredVlives.length} 场`">
      <template #icon><Radio class="h-8 w-8 text-primary" /></template>
      <template #actions>
        <button
          v-if="notificationStore.isSupported || notificationStore.isIOS"
          class="btn btn-sm gap-1"
          :class="isVliveSubscribed ? 'btn-primary' : 'btn-ghost'"
          @click="toggleVliveSub"
        >
          <BellRing v-if="isVliveSubscribed" class="w-4 h-4" />
          <Bell v-else class="w-4 h-4" />
          {{ isVliveSubscribed ? '已订阅 Live' : '订阅 Live' }}
        </button>
      </template>
    </PageHeader>

    <div class="flex flex-col gap-3 rounded-xl border border-base-200 bg-base-100 p-3 shadow-sm sm:flex-row sm:items-center">
      <label class="input input-sm input-bordered flex min-w-0 flex-1 items-center gap-2">
        <Search class="h-4 w-4 opacity-45" />
        <input v-model="searchQuery" type="text" class="grow min-w-0" placeholder="搜索 Live 名称或 ID…" />
      </label>
      <label class="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-base-200/65 px-3 py-2 sm:justify-start">
        <span class="text-sm font-medium">展示已结束</span>
        <input v-model="showEnded" type="checkbox" class="toggle toggle-sm toggle-primary" />
      </label>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <RouterLink 
        v-for="vlive in paginatedVlives" 
        :key="vlive.id"
        :to="'/vlives/' + vlive.id"
        class="group block overflow-hidden rounded-xl border border-base-200 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
      >
        <figure class="relative bg-base-200 aspect-[122/52]">
          <AssetImage 
            :src="getBannerUrl(vlive.assetbundleName)" 
            :alt="vlive.name"
            class="w-full h-full object-cover"
          />
          
          <!-- 状态角标 -->
          <div class="absolute left-2 top-2 z-20 badge badge-sm gap-1 border-0 font-bold shadow-sm" :class="getStatusInfo(vlive).color">
            <component :is="getStatusInfo(vlive).icon" v-if="getStatusInfo(vlive).icon" class="w-3 h-3" />
            {{ getStatusInfo(vlive).label }}
          </div>
          
          <!-- 类型角标 -->
          <div class="absolute bottom-2 left-2 z-20">
            <span class="badge badge-sm" :class="typeMap[vlive.virtualLiveType]?.color || 'badge-ghost'">
              {{ typeMap[vlive.virtualLiveType]?.label || vlive.virtualLiveType }}
            </span>
          </div>

          <div class="absolute top-2 right-2 z-20">
            <span class="badge badge-sm border-0 bg-black/50 text-white">
              #{{ vlive.id }}
            </span>
          </div>
        </figure>
        
        <div class="space-y-2.5 p-3">
          <h2 class="line-clamp-2 min-h-10 text-[15px] font-bold leading-5 transition-colors group-hover:text-primary">{{ vlive.name }}</h2>
          
          <div class="flex items-start gap-2 text-xs leading-4 text-base-content/60">
            <Calendar class="w-3.5 h-3.5 flex-shrink-0" />
            <span>{{ formatDate(getScheduleBounds(vlive).start) }} – {{ formatDate(getScheduleBounds(vlive).end) }}</span>
          </div>

          <!-- 下一排期信息 -->
          <div v-if="getNextSchedule(vlive)" class="flex items-center justify-between overflow-hidden rounded-lg bg-primary/8 px-2.5 py-2 text-xs text-primary">
            <div class="flex items-center gap-1.5 flex-1 min-w-0">
              <Clock class="w-3.5 h-3.5 flex-shrink-0" />
              <span class="truncate">下一场: {{ formatDate(getNextSchedule(vlive)!.next.startAt) }}</span>
            </div>
            <span class="ml-2 shrink-0 font-bold">
              剩余 {{ getNextSchedule(vlive)?.remainingCount }} 场
            </span>
          </div>
          <div v-else-if="getStatusInfo(vlive).status === 'ongoing'" class="flex items-center justify-center rounded-lg bg-warning/15 p-2 text-xs text-base-content/80">
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
