<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pushListPage, readQueryPage, readQueryString, replaceListQuery } from '@/utils/routeQuery'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { ArrowDownUp, Calendar, Gift, Search, EyeOff } from 'lucide-vue-next'
import Pagination from '@/components/Pagination.vue'
import GachaBanner from '@/components/GachaBanner.vue'

import type { Gacha } from '@/types/gacha'
import PageHeader from '@/components/PageHeader.vue'
import ZhText from '@/components/ZhText.vue'
import { useZh } from '@/composables/useZh'

const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const zhGachas = useZh('gachas')
const allGachas = ref<Gacha[]>([])
const isLoading = ref(true)
const loadError = ref(false)
const route = useRoute()
const router = useRouter()
// 搜索、排序与页码写在 URL 里，从卡池详情返回时保持不变
const searchQuery = ref(readQueryString(route.query, 'q'))
const sortOrder = ref<'desc' | 'asc'>(readQueryString(route.query, 'sort') === 'asc' ? 'asc' : 'desc')
type StatusFilter = '' | 'active' | 'ended'
const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'ended', label: '已结束' },
]
const initialStatus = readQueryString(route.query, 'status')
const statusFilter = ref<StatusFilter>(initialStatus === 'active' || initialStatus === 'ended' ? initialStatus : '')
const currentPage = computed(() => readQueryPage(route.query))
const itemsPerPage = 12

const assetsHost = computed(() => settingsStore.assetsHost)

// 筛选和排序
const filteredGachas = computed(() => {
  let result = [...allGachas.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(g => zhGachas.searchText('name', g.name).toLowerCase().includes(query))
  }

  // 剧透过滤
  if (!settingsStore.showSpoilers) {
    const now = Date.now()
    result = result.filter(g => g.startAt <= now)
  }

  if (statusFilter.value === 'active') result = result.filter(g => getGachaStatus(g) === 'active')
  else if (statusFilter.value === 'ended') result = result.filter(g => getGachaStatus(g) === 'ended')

  result.sort((a, b) => sortOrder.value === 'desc' ? b.startAt - a.startAt : a.startAt - b.startAt)
  return result
})

// 分页
const totalPages = computed(() => Math.ceil(filteredGachas.value.length / itemsPerPage))
const paginatedGachas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredGachas.value.slice(start, start + itemsPerPage)
})

// 搜索/排序变化时同步到 URL 并回到第一页
watch([searchQuery, sortOrder, statusFilter], () => {
  void replaceListQuery(router, route, {
    q: searchQuery.value.trim(),
    sort: sortOrder.value === 'asc' ? 'asc' : null,
    status: statusFilter.value || null,
  })
})

// 筛选后页数变少时，把越界页码拉回最后一页
watch(totalPages, (total) => {
  if (total > 0 && currentPage.value > total) void pushListPage(router, route, total)
})

/** 结束时间在几十年后的是常驻卡池 */
function isPermanent(gacha: Gacha): boolean {
  return gacha.endAt - Date.now() > 10 * 365 * 86_400_000
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function getGachaStatus(gacha: Gacha): 'upcoming' | 'active' | 'ended' {
  const now = Date.now()
  if (now < gacha.startAt) return 'upcoming'
  if (now > gacha.endAt) return 'ended'
  return 'active'
}

function handlePageChange(page: number) {
  void pushListPage(router, route, page)
}

function isLeak(gacha: Gacha): boolean {
  return gacha.startAt > Date.now()
}

async function loadData() {
  isLoading.value = true
  loadError.value = false
  try {
    allGachas.value = await masterStore.getMaster<Gacha>('gachas')
  } catch (error) {
    console.error('加载卡池数据失败:', error)
    loadError.value = true
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-5">
    <!-- 标题 -->
    <PageHeader title="卡池" description="历次招募卡池、出现率和模拟抽卡。"><template #icon><Gift /></template></PageHeader>

    <!-- 搜索和筛选 -->
    <div class="toolbar">
      <label class="input input-bordered input-sm flex h-9 min-w-[12rem] flex-1 items-center gap-2 sm:max-w-xs">
        <Search class="h-4 w-4 opacity-50" />
        <input v-model="searchQuery" type="text" placeholder="搜索卡池名称" class="grow" />
      </label>
      <div class="flex gap-1.5" role="group" aria-label="卡池状态">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          type="button"
          class="chip"
          :class="{ 'is-active': statusFilter === option.value }"
          :aria-pressed="statusFilter === option.value"
          @click="statusFilter = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <button
        type="button"
        class="chip ml-auto"
        :title="sortOrder === 'desc' ? '现在是最新的排在前面' : '现在是最早的排在前面'"
        @click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'"
      >
        <ArrowDownUp class="h-3.5 w-3.5" />
        {{ sortOrder === 'desc' ? '最新优先' : '最早优先' }}
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="index in 9" :key="index" class="skeleton h-52 rounded-box"></div>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" role="alert" class="alert alert-error">
      <span>卡池数据加载失败，请检查网络后重试。</span>
      <button type="button" class="btn btn-sm" @click="loadData">重试</button>
    </div>

    <template v-else>
      <!-- 卡池列表 -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <router-link
          v-for="gacha in paginatedGachas"
          :key="gacha.id"
          :to="`/gachas/${gacha.id}`"
          class="tile flex flex-col overflow-hidden"
        >
          <GachaBanner :gacha="gacha" :assets-host="assetsHost">
            <span v-if="isLeak(gacha)" class="gacha-status bg-warning text-warning-content">
              <EyeOff class="h-3 w-3" /> 即将开始
            </span>
            <span v-else-if="getGachaStatus(gacha) === 'active'" class="gacha-status bg-success text-success-content">进行中</span>
          </GachaBanner>
          <div class="flex flex-1 flex-col gap-1.5 p-3">
            <h2 class="line-clamp-2 text-sm font-semibold leading-snug"><ZhText :text="gacha.name" table="gachas" path="name" sub-class="text-xs font-normal" /></h2>
            <div class="mt-auto flex items-center gap-1.5 pt-1 text-xs text-base-content/55">
              <Calendar class="h-3 w-3" />
              <span class="num">{{ formatDate(gacha.startAt) }} – {{ isPermanent(gacha) ? '常驻' : formatDate(gacha.endAt) }}</span>
              <span class="num ml-auto text-base-content/40">#{{ gacha.id }}</span>
            </div>
          </div>
        </router-link>
      </div>

      <!-- 分页 -->
      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        base-url="/gachas"
        @page-change="handlePageChange"
      />

      <!-- 空状态 -->
      <div v-if="filteredGachas.length === 0" class="empty-state">
        <Gift />
        <p>没有找到匹配的卡池</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.gacha-status {
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
</style>
