<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { Calendar, Clock, ChevronLeft, Users, Bell, BellRing } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import { useNotificationStore } from '@/stores/notification'

const route = useRoute()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const notificationStore = useNotificationStore()

const vlive = ref<any>(null)
const gameCharacterUnits = ref<any[]>([])
const isLoading = ref(true)

const topicId = computed(() => `vlive_${route.params.id}`)
const isSubscribedToThis = computed(() => notificationStore.hasSubscription(topicId.value))

async function toggleSub() {
  try {
    await notificationStore.toggleSubscription(topicId.value)
  } catch (e) {
    alert('订阅切换失败: ' + (e instanceof Error ? e.message : String(e)))
  }
}


const assetsHost = computed(() => settingsStore.assetsHost)

async function loadData() {
  isLoading.value = true
  const id = Number(route.params.id)
  try {
    const [vlivesData, charsData] = await Promise.all([
      masterStore.getMaster<any>('virtualLives'),
      masterStore.getMaster<any>('gameCharacterUnits')
    ])
    vlive.value = vlivesData.find((v: any) => v.id === id) || null
    gameCharacterUnits.value = charsData || []
  } catch (e) {
    console.error('加载Virtual Live数据失败：', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
watch(() => route.params.id, loadData)

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
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

const typeMap: Record<string, { label: string; color: string }> = {
  normal: { label: '普通', color: 'badge-primary' },
  after_event: { label: '活动后', color: 'badge-secondary' },
  cheer: { label: 'Cheer', color: 'badge-accent' },
}

const characters = computed(() => {
  if (!vlive.value || !vlive.value.virtualLiveCharacters) return []
  return vlive.value.virtualLiveCharacters.map((vc: any) => {
    const unit = gameCharacterUnits.value.find((u: any) => u.id === vc.gameCharacterUnitId)
    if (!unit) return null
    let iconFile = ''
    if (unit.id <= 20) {
      iconFile = `img/chr_ts/chr_ts_90_${unit.id}.png`
    } else if (unit.gameCharacterId === 21) {
      iconFile = unit.id === 21 ? 'img/chr_ts/chr_ts_90_21.png' : `img/chr_ts/chr_ts_90_21_${unit.id - 25}.png`
    } else {
      iconFile = `img/chr_ts/chr_ts_90_${unit.gameCharacterId}_2.png`
    }
    return { ...unit, iconFile }
  }).filter(Boolean)
})

const schedules = computed(() => {
  if (!vlive.value || !vlive.value.virtualLiveSchedules) return []
  return [...vlive.value.virtualLiveSchedules].sort((a: any, b: any) => a.seq - b.seq)
})
</script>

<template>
  <div class="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="!vlive" class="text-center py-20">
      <p class="text-xl text-base-content/60">虚拟 Live 不存在</p>
      <RouterLink to="/vlives" class="btn btn-primary mt-4">返回列表</RouterLink>
    </div>

    <div v-else class="space-y-6">
      
      <!-- 独立出来的 Header (返回按钮 + 标题等) -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <RouterLink to="/vlives" class="btn btn-ghost btn-sm">
              <ChevronLeft class="w-4 h-4" /> 返回
            </RouterLink>
            <span class="badge badge-lg">#{{ vlive.id }}</span>
            <span 
              class="badge badge-lg"
              :class="typeMap[vlive.virtualLiveType]?.color || 'badge-ghost'"
            >
              {{ typeMap[vlive.virtualLiveType]?.label || vlive.virtualLiveType }}
            </span>
          </div>
          
          <button 
            v-if="notificationStore.isSupported"
            class="btn btn-sm gap-2"
            :class="isSubscribedToThis ? 'btn-primary' : 'btn-ghost'"
            @click="toggleSub"
          >
            <BellRing v-if="isSubscribedToThis" class="w-4 h-4" />
            <Bell v-else class="w-4 h-4" />
            <span class="hidden sm:inline">{{ isSubscribedToThis ? '已订阅提醒' : '订阅提醒' }}</span>
          </button>
        </div>
        <h1 class="text-2xl font-bold ml-1">{{ vlive.name }}</h1>
      </div>

      <!-- 头部卡片 -->
      <div class="card bg-base-100 shadow-lg overflow-hidden">
        <figure class="relative bg-base-200 lg:h-[300px] flex items-center justify-center">
          <AssetImage 
            :src="getBannerUrl(vlive.assetbundleName)" 
            :alt="vlive.name"
            class="max-w-full max-h-full object-contain"
          />
        </figure>
        
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-base-200 p-4 rounded-lg">
            <div class="flex items-center gap-2">
              <Calendar class="w-4 h-4 text-primary" />
              <span class="text-base-content/60 w-16">开始时间:</span>
              <span class="font-medium">{{ formatDate(getScheduleBounds(vlive).start) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-primary" />
              <span class="text-base-content/60 w-16">结束时间:</span>
              <span class="font-medium">{{ formatDate(getScheduleBounds(vlive).end) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 登场角色 -->
      <div v-if="characters.length > 0" class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
            <Users class="w-5 h-5 text-primary" />
            登场角色
          </h3>
          <div class="flex flex-wrap gap-4">
            <div 
              v-for="charData in characters" 
              :key="charData.id"
              class="w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-sm"
            >
              <img 
                :src="`/${charData.iconFile}`"
                class="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 排期时刻表 -->
      <div v-if="schedules.length > 0" class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
            <Clock class="w-5 h-5 text-primary" />
            全场次排期时刻表
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div 
              v-for="sch in schedules" 
              :key="sch.id"
              class="bg-base-200 p-3 rounded-lg border border-base-300"
            >
              <div class="text-xs text-base-content/50 mb-1">第 {{ sch.seq }} 场</div>
              <div class="text-[13px] space-y-1">
                <div class="flex justify-between">
                  <span>{{ formatDate(sch.startAt).split(' ')[1] }}</span>
                  <span class="text-base-content/30">-</span>
                  <span>{{ formatDate(sch.endAt).split(' ')[1] }}</span>
                </div>
                <div class="text-xs text-base-content/60">{{ formatDate(sch.startAt).split(' ')[0] }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>
