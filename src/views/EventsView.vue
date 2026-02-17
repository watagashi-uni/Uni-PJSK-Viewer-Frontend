<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { Calendar, Trophy, Users, EyeOff } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'

const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

interface EventData {
  id: number
  eventType: string
  name: string
  assetbundleName: string
  startAt: number
  aggregateAt: number
  closedAt: number
  unit: string
}

const events = ref<EventData[]>([])
const searchQuery = ref('')
const selectedType = ref<string>('')
const isLoading = ref(true)

const assetsHost = 'https://assets.unipjsk.com'

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
  return `${assetsHost}/startapp/home/banner/${assetbundleName}/${assetbundleName}.png`
}

onMounted(async () => {
  try {
    const data = await masterStore.getMaster<EventData>('events')
    events.value = data
  } catch (e) {
    console.error('加载活动数据失败:', e)
  } finally {
    isLoading.value = false
  }
})

// 遮罩相关逻辑
function isLeak(event: EventData): boolean {
  return event.startAt > Date.now()
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6 flex items-center gap-3">
      <Calendar class="w-8 h-8" />
      活动列表
    </h1>

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
      <div class="flex gap-2">
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
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- 活动列表 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <RouterLink 
        v-for="event in filteredEvents" 
        :key="event.id"
        :to="`/events/${event.id}`"
        class="card bg-base-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden animate-fade-in-up relative group"
      >
        <!-- 全卡片遮罩 (仅在开启遮罩模式下显示，Hover时消失) -->
        <div 
          v-if="isLeak(event) && settingsStore.maskSpoilers" 
          class="absolute inset-0 z-50 bg-base-100/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none"
        >
          <EyeOff class="w-8 h-8 mb-2 text-warning" />
          <span class="font-bold text-lg mb-1">即将开始</span>
          <span class="text-xs text-base-content/60">鼠标悬停查看</span>
        </div>

        <!-- Banner 图片 -->
        <figure class="relative">
          <AssetImage 
            :src="getBannerUrl(event.assetbundleName)" 
            :alt="event.name"
            class="w-full h-32 object-cover"
          />
          
          <!-- 简单角标 (替代之前的内部遮罩) -->
          <div v-if="event.startAt > Date.now()" class="absolute top-2 left-2 z-20 badge badge-warning gap-1 font-bold shadow-md">
            <EyeOff class="w-3 h-3" /> 即将开始
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
    <div v-if="!isLoading && filteredEvents.length === 0" class="text-center py-20 text-base-content/60">
      没有找到符合条件的活动
    </div>
  </div>
</template>
