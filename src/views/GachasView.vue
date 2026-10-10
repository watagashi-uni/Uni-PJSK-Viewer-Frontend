<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { pushListPage, readQueryPage, readQueryString, replaceListQuery } from '@/utils/routeQuery'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { Calendar, Gift, Search, EyeOff } from 'lucide-vue-next'
import Pagination from '@/components/Pagination.vue'
import AssetImage from '@/components/AssetImage.vue'

import type { Gacha } from '@/types/gacha'
import PageHeader from '@/components/PageHeader.vue'

const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const allGachas = ref<Gacha[]>([])
const isLoading = ref(true)
const loadError = ref(false)
const route = useRoute()
const router = useRouter()
// 搜索、排序与页码写在 URL 里，从卡池详情返回时保持不变
const searchQuery = ref(readQueryString(route.query, 'q'))
const sortOrder = ref<'desc' | 'asc'>(readQueryString(route.query, 'sort') === 'asc' ? 'asc' : 'desc')
const currentPage = computed(() => readQueryPage(route.query))
const itemsPerPage = 12

const assetsHost = computed(() => settingsStore.assetsHost)

// 筛选和排序
const filteredGachas = computed(() => {
  let result = [...allGachas.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(g => g.name.toLowerCase().includes(query))
  }

  // 剧透过滤
  if (!settingsStore.showSpoilers) {
    const now = Date.now()
    result = result.filter(g => g.startAt <= now)
  }
  
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
watch([searchQuery, sortOrder], () => {
  void replaceListQuery(router, route, {
    q: searchQuery.value.trim(),
    sort: sortOrder.value === 'asc' ? 'asc' : null,
  })
})

// 筛选后页数变少时，把越界页码拉回最后一页
watch(totalPages, (total) => {
  if (total > 0 && currentPage.value > total) void pushListPage(router, route, total)
})

// 卡池小图优先用首页 banner，加载失败回退 logo（logo 按 assetbundleName 必然存在），再失败显示占位。
// 复用其他卡池 assetbundleName 的池（复刻/常驻等）一定没有自己的 banner，直接从 logo 开始
const gachaImgStage = ref<Record<number, number>>({})

function gachaImgCandidates(gacha: Gacha): string[] {
  const urls: string[] = []
  if (gacha.assetbundleName === `ab_gacha_${gacha.id}`) {
    urls.push(`${assetsHost.value}/startapp/home/banner/banner_gacha${gacha.id}/banner_gacha${gacha.id}.png`)
  }
  urls.push(`${assetsHost.value}/ondemand/gacha/${gacha.assetbundleName}/logo/logo.png`)
  return urls
}

function gachaImgSrc(gacha: Gacha): string | undefined {
  return gachaImgCandidates(gacha)[gachaImgStage.value[gacha.id] ?? 0]
}

function onGachaImgError(gacha: Gacha) {
  gachaImgStage.value[gacha.id] = (gachaImgStage.value[gacha.id] ?? 0) + 1
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
  <div class="space-y-6">
    <!-- 标题 -->
    <PageHeader title="卡池"><template #icon><Gift /></template></PageHeader>

    <!-- 搜索和筛选 -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-4">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex-1 min-w-[200px]">
            <label class="input input-bordered flex items-center gap-2">
              <Search class="w-4 h-4 opacity-50" />
              <input 
                v-model="searchQuery" 
                type="text"
                placeholder="搜索卡池名称..." 
                class="grow"
              />
            </label>
          </div>
          <select v-model="sortOrder" class="select select-bordered select-sm">
            <option value="desc">最新优先</option>
            <option value="asc">最早优先</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" role="alert" class="alert alert-error">
      <span>卡池数据加载失败，请检查网络后重试。</span>
      <button type="button" class="btn btn-sm" @click="loadData">重试</button>
    </div>

    <template v-else>
      <!-- 卡池列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <router-link
          v-for="gacha in paginatedGachas"
          :key="gacha.id"
          :to="`/gacha/${gacha.id}`"
          class="card bg-base-100 shadow-sm hover:shadow-lg transition-all group overflow-hidden relative"
        >
          <figure class="relative aspect-[7/2] bg-base-200 overflow-hidden flex items-center justify-center">
            <AssetImage
              v-if="gachaImgSrc(gacha)"
              :src="gachaImgSrc(gacha)!"
              :alt="gacha.name"
              class="h-full object-contain transition-transform"
              @error="onGachaImgError(gacha)"
            />
            <Gift v-else class="w-10 h-10 text-base-content/20" />
            
            <!-- 简单角标 -->
            <div class="absolute top-2 right-2 flex gap-1">
              <span v-if="isLeak(gacha)" class="badge badge-warning badge-sm gap-1 font-bold shadow-md">
                <EyeOff class="w-3 h-3" /> 即将开始
              </span>
              <span 
                v-else
                class="badge badge-sm"
                :class="{
                  'badge-success': getGachaStatus(gacha) === 'active',
                  'badge-ghost': getGachaStatus(gacha) === 'ended'
                }"
              >
                {{ getGachaStatus(gacha) === 'active' ? '进行中' : '已结束' }}
              </span>
            </div>
          </figure>
          <div class="card-body p-3">
            <h2 class="font-medium text-sm line-clamp-1">{{ gacha.name }}</h2>
            <div class="text-xs text-base-content/60 flex items-center gap-1">
              <Calendar class="w-3 h-3" />
              {{ formatDate(gacha.startAt) }} ~ {{ formatDate(gacha.endAt) }}
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
      <div v-if="filteredGachas.length === 0" class="text-center py-20 text-base-content/50">
        <Gift class="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p>没有找到匹配的卡池</p>
      </div>
    </template>
  </div>
</template>
