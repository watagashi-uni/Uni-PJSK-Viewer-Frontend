<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { Calendar, Gift, Search, EyeOff } from 'lucide-vue-next'
import Pagination from '@/components/Pagination.vue'
import AssetImage from '@/components/AssetImage.vue'

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

const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const allGachas = ref<Gacha[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const sortOrder = ref<'desc' | 'asc'>('desc')
const currentPage = ref(1)
const itemsPerPage = 12

const assetsHost = 'https://assets.unipjsk.com'

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

// 搜索变化时重置页码
watch([searchQuery, sortOrder], () => {
  currentPage.value = 1
})

function getLogoUrl(gacha: Gacha): string {
  return `${assetsHost}/ondemand/gacha/${gacha.assetbundleName}/logo/logo.png`
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
  currentPage.value = page
}

function isLeak(gacha: Gacha): boolean {
  return gacha.startAt > Date.now()
}

onMounted(async () => {
  try {
    allGachas.value = await masterStore.getMaster<Gacha>('gachas')
  } catch (error) {
    console.error('加载卡池数据失败:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- 标题 -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <Gift class="w-6 h-6 text-primary" />
        卡池一览
      </h1>
    </div>

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

    <template v-else>
      <!-- 卡池列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <router-link
          v-for="gacha in paginatedGachas"
          :key="gacha.id"
          :to="`/gacha/${gacha.id}`"
          class="card bg-base-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group overflow-hidden relative"
        >
          <!-- 全卡片遮罩 (仅在开启遮罩模式下显示，Hover时消失) -->
          <div 
            v-if="isLeak(gacha) && settingsStore.maskSpoilers" 
            class="absolute inset-0 z-50 bg-base-100/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none"
          >
            <EyeOff class="w-8 h-8 mb-2 text-warning" />
            <span class="font-bold text-lg mb-1">即将开始</span>
            <span class="text-xs text-base-content/60">鼠标悬停查看</span>
          </div>

          <figure class="relative aspect-[7/2] bg-base-200 overflow-hidden flex items-center justify-center">
            <AssetImage 
              :src="getLogoUrl(gacha)" 
              :alt="gacha.name"
              class="h-full object-contain group-hover:scale-105 transition-transform"
            />
            
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
