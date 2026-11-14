<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { Calendar, ChevronRight, Trophy, Users, EyeOff, Globe, Search } from 'lucide-vue-next'
import { getEventLogoUrl, isTestEvent } from '@/utils/event'
import EventBanner from '@/components/EventBanner.vue'
import type { EventData } from '@/types/master'
import { pushListPage, readQueryPage, readQueryString, replaceListQuery } from '@/utils/routeQuery'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import ZhText from '@/components/ZhText.vue'
import { useZh } from '@/composables/useZh'

const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const zhEvents = useZh('events')

const events = ref<EventData[]>([])
const route = useRoute()
const router = useRouter()

// 筛选状态写在 URL 里，从活动详情返回时保持不变
const searchQuery = ref(readQueryString(route.query, 'q'))
const selectedType = ref<string>(readQueryString(route.query, 'type'))

watch([searchQuery, selectedType], () => {
  void replaceListQuery(router, route, { q: searchQuery.value.trim(), type: selectedType.value })
})
const isLoading = ref(true)
const loadError = ref(false)

const assetsHost = computed(() => settingsStore.assetsHost)

// 活动类型映射
const eventTypeMap: Record<string, { label: string; color: string }> = {
  marathon: { label: '马拉松', color: 'badge-primary' },
  cheerful_carnival: { label: '5v5', color: 'badge-secondary' },
  world_bloom: { label: 'World Link', color: 'badge-accent' },
}

// 筛选后的活动列表
const filteredEvents = computed(() => {
  let result = events.value

  // 按类型筛选
  if (selectedType.value) {
    result = result.filter(e => e.eventType === selectedType.value)
  }

  // 按名称搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(e => 
      zhEvents.searchText('name', e.name).toLowerCase().includes(query) ||
      e.id.toString().includes(query)
    )
  }

  // 剧透过滤
  if (!settingsStore.showSpoilers) {
    const now = Date.now()
    result = result.filter(e => e.startAt <= now)
  }

  // 按 ID 倒序
  return [...result].sort((a, b) => b.id - a.id)
})

// 分页：一次渲染全部 ~190 张 banner 太重
const PAGE_SIZE = 24
const currentPage = computed(() => readQueryPage(route.query))
const totalPages = computed(() => Math.max(1, Math.ceil(filteredEvents.value.length / PAGE_SIZE)))
const paginatedEvents = computed(() => {
  const page = Math.min(currentPage.value, totalPages.value)
  return filteredEvents.value.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
})

function handlePageChange(page: number) {
  void pushListPage(router, route, page)
}

const typeOptions = [
  { value: '', label: '全部', icon: null },
  { value: 'marathon', label: '马拉松', icon: Trophy },
  { value: 'cheerful_carnival', label: '5v5', icon: Users },
  { value: 'world_bloom', label: 'World Link', icon: Globe },
]

const now = Date.now()

// 正在进行的活动，放在列表最上面当主视觉
const featuredArtFailed = ref(false)
const featuredLogoFailed = ref(false)
const featuredEvent = computed(() => {
  if (searchQuery.value || selectedType.value || currentPage.value > 1) return null
  return events.value.find(e => now >= e.startAt && now < e.aggregateAt && !isTestEvent(e)) ?? null
})

function remainingText(endAt: number): string {
  const ms = Math.max(0, endAt - now)
  const days = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  if (days > 0) return `${days} 天 ${hours} 小时`
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  return hours > 0 ? `${hours} 小时 ${minutes} 分` : `${Math.max(minutes, 1)} 分钟`
}

// 格式化日期
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

async function loadData() {
  isLoading.value = true
  loadError.value = false
  try {
    const data = await masterStore.getMaster<EventData>('events')
    events.value = data
  } catch (e) {
    console.error('加载活动数据失败:', e)
    loadError.value = true
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

</script>

<template>
  <div class="space-y-5">
    <PageHeader title="活动" description="历次活动的加成、奖励和剧情；点开可以看详情。"><template #icon><Calendar /></template></PageHeader>

    <!-- 当期活动：没有筛选条件、停在第一页时才显示 -->
    <RouterLink
      v-if="featuredEvent"
      :to="`/events/${featuredEvent.id}`"
      class="kv event-feature"
      :class="{ 'kv--plain': featuredArtFailed }"
    >
      <img
        v-if="!featuredArtFailed"
        :src="`${assetsHost}/ondemand/event/${featuredEvent.assetbundleName}/screen/bg.png`"
        alt=""
        class="kv__art"
        crossorigin="anonymous"
        @error="featuredArtFailed = true"
      />
      <div class="kv__body">
        <img
          v-if="!featuredLogoFailed"
          :src="getEventLogoUrl(featuredEvent, assetsHost)"
          :alt="featuredEvent.name"
          class="kv__logo"
          crossorigin="anonymous"
          @error="featuredLogoFailed = true"
        />
        <h2 class="kv__title"><ZhText :text="featuredEvent.name" table="events" path="name" sub-class="text-base mt-0.5" /></h2>
        <div class="kv__meta">
          <span class="kv-chip kv-chip--live">进行中 · 剩 {{ remainingText(featuredEvent.aggregateAt) }}</span>
          <span class="kv-chip">{{ eventTypeMap[featuredEvent.eventType]?.label || featuredEvent.eventType }}</span>
          <span class="kv-chip font-normal">{{ formatDate(featuredEvent.startAt) }} – {{ formatDate(featuredEvent.aggregateAt) }}</span>
          <span class="kv-chip kv-chip--solid ml-auto">查看详情 <ChevronRight class="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </RouterLink>

    <!-- 筛选区 -->
    <div class="toolbar">
      <label class="input input-bordered input-sm flex h-9 min-w-[12rem] flex-1 items-center gap-2 sm:max-w-xs">
        <Search class="h-4 w-4 opacity-50" />
        <input v-model="searchQuery" type="text" placeholder="搜索活动名称或 ID" class="grow" />
      </label>
      <div class="hide-scrollbar -mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1" role="group" aria-label="活动类型">
        <button
          v-for="option in typeOptions"
          :key="option.value"
          type="button"
          class="chip"
          :class="{ 'is-active': selectedType === option.value }"
          :aria-pressed="selectedType === option.value"
          @click="selectedType = option.value"
        >
          <component :is="option.icon" v-if="option.icon" class="h-3.5 w-3.5" />
          {{ option.label }}
        </button>
      </div>
      <span v-if="!isLoading && !loadError" class="ml-auto text-xs text-base-content/50">共 <span class="num">{{ filteredEvents.length }}</span> 期</span>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="index in 9" :key="index" class="skeleton h-56 rounded-box"></div>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" role="alert" class="alert alert-error">
      <span>活动数据加载失败，请检查网络后重试。</span>
      <button type="button" class="btn btn-sm" @click="loadData">重试</button>
    </div>

    <!-- 活动列表 -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="event in paginatedEvents"
        :key="event.id"
        :to="`/events/${event.id}`"
        class="tile event-card"
      >
        <!-- Banner 图片 -->
        <div class="relative">
          <EventBanner :event="event" :assets-host="assetsHost" />
          <span v-if="event.startAt > now" class="event-card__status bg-warning text-warning-content">
            <EyeOff class="h-3 w-3" /> 即将开始
          </span>
          <span v-else-if="now < event.aggregateAt" class="event-card__status bg-success text-success-content">
            <span class="event-card__pulse" aria-hidden="true"></span> 进行中
          </span>
        </div>

        <div class="flex flex-1 flex-col gap-1.5 p-3">
          <h2 class="text-sm font-semibold leading-snug"><ZhText :text="event.name" table="events" path="name" sub-class="font-normal text-xs" /></h2>
          <div class="mt-auto flex items-center gap-2 pt-1 text-xs text-base-content/55">
            <span class="event-card__type" :class="`is-${event.eventType}`">{{ eventTypeMap[event.eventType]?.label || event.eventType }}</span>
            <span class="num">{{ formatDate(event.startAt) }} – {{ formatDate(event.aggregateAt) }}</span>
            <span class="num ml-auto text-base-content/40">#{{ event.id }}</span>
          </div>
        </div>
      </RouterLink>
    </div>

    <Pagination
      v-if="!isLoading && !loadError && totalPages > 1"
      :current-page="Math.min(currentPage, totalPages)"
      :total-pages="totalPages"
      base-url="/events"
      @page-change="handlePageChange"
    />

    <!-- 空状态 -->
    <div v-if="!isLoading && !loadError && filteredEvents.length === 0" class="empty-state">
      <Calendar />
      <p>没有找到符合条件的活动</p>
    </div>
  </div>
</template>

<style scoped>
/* 当期活动的主视觉比详情页矮一些 */
.event-feature {
  transition: box-shadow 0.15s ease;
}

.event-feature:hover {
  box-shadow: 0 10px 30px -14px rgb(var(--shadow-rgb) / 0.45);
}

@media (min-width: 768px) {
  .event-feature {
    min-height: clamp(15rem, 24vw, 19rem);
  }
}

.event-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.event-card__status {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  height: 1.375rem;
  padding: 0 0.5rem;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.25);
  font-size: 0.6875rem;
  font-weight: 700;
}

.event-card__pulse {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 999px;
  background-color: currentColor;
  animation: event-pulse 1.6s ease-in-out infinite;
}

@keyframes event-pulse {
  50% { opacity: 0.35; }
}

/* 活动类型：一个色点 + 文字，颜色区分三种玩法 */
.event-card__type {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.3rem;
  color: color-mix(in oklab, var(--color-base-content) 75%, transparent);
  font-weight: 600;
}

.event-card__type::before {
  content: '';
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 999px;
  background-color: var(--color-primary);
}

.event-card__type.is-cheerful_carnival::before {
  background-color: var(--color-secondary);
}

.event-card__type.is-world_bloom::before {
  background-color: var(--color-accent);
}
</style>
