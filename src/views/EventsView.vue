<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { Calendar, Trophy, Users, EyeOff, Globe } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import type { EventData } from '@/types/master'
import { readQueryString, replaceListQuery } from '@/utils/routeQuery'
import PageHeader from '@/components/PageHeader.vue'

const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

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
      e.name.toLowerCase().includes(query) ||
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

// 格式化日期
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 获取 banner 图片 URL
function getBannerUrl(assetbundleName: string): string {
  return `${assetsHost.value}/startapp/home/banner/${assetbundleName}/${assetbundleName}.png`
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
  <div>
    <PageHeader title="活动" class="mb-6"><template #icon><Calendar /></template></PageHeader>

    <!-- 筛选区 -->
    <div class="flex flex-wrap gap-4 mb-6">
      <!-- 搜索框 -->
      <div class="form-control flex-1 min-w-[200px]">
        <div class="input-group">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="搜索活动名称或ID..." 
            class="input input-bordered w-full"
          />
        </div>
      </div>

      <!-- 类型筛选 -->
      <div class="flex flex-wrap gap-2">
        <button 
          class="btn btn-sm"
          :class="selectedType === '' ? 'btn-primary' : 'btn-ghost'"
          @click="selectedType = ''"
        >
          全部
        </button>
        <button 
          class="btn btn-sm"
          :class="selectedType === 'marathon' ? 'btn-primary' : 'btn-ghost'"
          @click="selectedType = 'marathon'"
        >
          <Trophy class="w-4 h-4" />
          马拉松
        </button>
        <button 
          class="btn btn-sm"
          :class="selectedType === 'cheerful_carnival' ? 'btn-secondary' : 'btn-ghost'"
          @click="selectedType = 'cheerful_carnival'"
        >
          <Users class="w-4 h-4" />
          5v5
        </button>
        <button 
          class="btn btn-sm"
          :class="selectedType === 'world_bloom' ? 'btn-accent' : 'btn-ghost'"
          @click="selectedType = 'world_bloom'"
        >
          <Globe class="w-4 h-4" />
          World Link
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" role="alert" class="alert alert-error">
      <span>活动数据加载失败，请检查网络后重试。</span>
      <button type="button" class="btn btn-sm" @click="loadData">重试</button>
    </div>

    <!-- 活动列表 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <RouterLink 
        v-for="event in filteredEvents" 
        :key="event.id"
        :to="`/events/${event.id}`"
        class="card bg-base-100 shadow-lg hover:shadow-xl transition-all overflow-hidden animate-fade-in-up relative group"
      >
        <!-- Banner 图片 -->
        <figure class="relative">
          <AssetImage 
            :src="getBannerUrl(event.assetbundleName)" 
            :alt="event.name"
            class="w-full aspect-[122/52] object-cover"
          />
          
          <!-- 简单角标 (替代之前的内部遮罩) -->
          <div v-if="event.startAt > Date.now()" class="absolute top-2 left-2 z-20 badge badge-warning gap-1 font-bold shadow-md">
            <EyeOff class="w-3 h-3" /> 即将开始
          </div>
          <div v-else-if="Date.now() >= event.startAt && Date.now() < event.aggregateAt" class="absolute top-2 left-2 z-20 badge badge-success gap-1 font-bold shadow-md">
            <Calendar class="w-3 h-3" /> 进行中
          </div>

          <!-- 活动类型标签 (位置调整) -->
          <div class="absolute bottom-2 left-2 z-20">
            <span 
              class="badge"
              :class="eventTypeMap[event.eventType]?.color || 'badge-ghost'"
            >
              {{ eventTypeMap[event.eventType]?.label || event.eventType }}
            </span>
          </div>
          <!-- 活动 ID -->
          <div class="absolute top-2 right-2 z-20">
            <span class="badge badge-ghost bg-black/50 text-white border-0">
              #{{ event.id }}
            </span>
          </div>
        </figure>
        
        <div class="card-body p-4">
          <h2 class="card-title text-sm line-clamp-2">{{ event.name }}</h2>
          <p class="text-xs text-base-content/60">
            {{ formatDate(event.startAt) }} ~ {{ formatDate(event.aggregateAt) }}
          </p>
        </div>
      </RouterLink>
    </div>

    <!-- 空状态 -->
    <div v-if="!isLoading && !loadError && filteredEvents.length === 0" class="text-center py-20 text-base-content/60">
      没有找到符合条件的活动
    </div>
  </div>
</template>
