<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useMasterStore } from '@/stores/master'
import SekaiCard from '@/components/SekaiCard.vue'
import SekaiProfileHonor from '@/components/SekaiProfileHonor.vue'
import { RefreshCw } from 'lucide-vue-next'
import { request } from '@/utils/request'
import type { EventData, CardData } from '@/types/master'

const masterStore = useMasterStore()

interface CharacterData {
  id: number
  firstName?: string
  givenName: string
  unit: string
}

interface WorldBloomData {
  id: number
  eventId: number
  gameCharacterId: number
  worldBloomChapterType: string
  chapterNo: number
  chapterStartAt: number
  aggregateAt: number
}

// 状态
const activeTab = ref<'top100' | 'borders'>('top100')
const isLoading = ref(false)
const eventId = ref<number | null>(null)
const eventName = ref('')
const currentEvent = ref<EventData | null>(null)
const lastUpdate = ref<number>(0)
const currentTime = ref(Date.now())
const selectedWorldBloomCharacterId = ref<number | null>(null)

// 数据
const top100Data = ref<any[]>([])
const borderData = ref<any[]>([])
const top100ChapterData = ref<Record<number, any[]>>({})
const borderChapterData = ref<Record<number, any[]>>({})
const cardsMap = ref<Record<number, any>>({})
const charactersMap = ref<Record<number, CharacterData>>({})
const worldBloomChapters = ref<WorldBloomData[]>([])
const top100Error = ref('')
const borderError = ref('')
let timeTimer: number | undefined

const isWorldBloomEvent = computed(() => currentEvent.value?.eventType === 'world_bloom' && worldBloomChapters.value.length > 0)

const rankingRows = computed(() => {
  if (!selectedWorldBloomCharacterId.value) {
    return activeTab.value === 'top100' ? top100Data.value : borderData.value
  }

  const dataMap = activeTab.value === 'top100' ? top100ChapterData.value : borderChapterData.value
  return dataMap[selectedWorldBloomCharacterId.value] || []
})

const currentError = computed(() => activeTab.value === 'top100' ? top100Error.value : borderError.value)

// 初始化
onMounted(async () => {
  timeTimer = window.setInterval(() => {
    currentTime.value = Date.now()
  }, 60 * 1000)
  await initData()
})

onUnmounted(() => {
  if (timeTimer) window.clearInterval(timeTimer)
})

async function initData() {
  isLoading.value = true
  try {
    if (!masterStore.isReady) {
      await masterStore.initialize()
    }

    // 1. 获取当前活动
    const events = await masterStore.getMaster<EventData>('events')
    const now = Date.now()
    
    // 查找正在进行或最近结束的活动
    const ongoing = events.find(e => now >= e.startAt && now <= e.aggregateAt)
    let targetEvent = ongoing
    
    if (!targetEvent) {
      // 如果没有正在进行的，找最近开始过的（即刚结束的）
      const startedEvents = events.filter(e => now >= e.startAt)
      if (startedEvents.length > 0) {
        // ID 倒序（通常 ID 越大越新）或按 startAt 倒序
        targetEvent = startedEvents.sort((a, b) => b.startAt - a.startAt)[0]
      }
    }

    if (targetEvent) {
      currentEvent.value = targetEvent
      eventId.value = targetEvent.id
      eventName.value = targetEvent.name
      
      // 预加载卡片和角色数据以便渲染
      const [cards, characters] = await Promise.all([
        masterStore.getMaster<CardData>('cards'),
        masterStore.getMaster<CharacterData>('gameCharacters'),
      ])
      cards.forEach(c => {
        cardsMap.value[c.id] = c
      })
      characters.forEach(c => {
        charactersMap.value[c.id] = c
      })

      if (targetEvent.eventType === 'world_bloom') {
        const worldBlooms = await masterStore.getMaster<WorldBloomData>('worldBlooms')
        worldBloomChapters.value = worldBlooms
          .filter(wb => wb.eventId === targetEvent.id && wb.worldBloomChapterType === 'game_character')
          .sort((a, b) => a.chapterNo - b.chapterNo)
      } else {
        worldBloomChapters.value = []
        selectedWorldBloomCharacterId.value = null
      }

      // 加载首屏数据 (Top 100)
      if (activeTab.value === 'top100') {
        await fetchTop100()
      } else {
        await fetchBorders()
      }
    }
  } catch (e) {
    console.error('Failed to init ranking data:', e)
  } finally {
    isLoading.value = false
  }
}

// 监听 Tab 切换实现按需加载
watch(activeTab, async (newTab) => {
  if (newTab === 'borders' && borderData.value.length === 0) {
    await fetchBorders()
  }
})

// 点击刷新按钮
async function refreshData() {
  if (activeTab.value === 'top100') {
    await fetchTop100()
  } else {
    // Refresh both or just borders? Usually just refresh what's active.
    await fetchBorders()
  }
}

// 抽取 Top 100 逻辑
async function fetchTop100() {
  if (!eventId.value) return
  isLoading.value = true
  top100Error.value = ''
  try {
    const data = await request.getProfile<any>(`/api/user/%7Buser_id%7D/event/${eventId.value}/ranking?rankingViewType=top100`)
    if (data.rankings) {
      top100Data.value = data.rankings
      top100ChapterData.value = parseWorldBloomChapterRankings(data.userWorldBloomChapterRankings, 'rankings')
    } else {
      console.warn('Unknown Top 100 data format:', data)
      top100Data.value = []
      top100ChapterData.value = {}
    }
    lastUpdate.value = Date.now()
  } catch (e) {
    console.error('Fetch top 100 failed:', e)
    top100Error.value = '加载 Top 100 失败'
  } finally {
    isLoading.value = false
  }
}

// 抽取 Border 逻辑
async function fetchBorders() {
  if (!eventId.value) return
  isLoading.value = true
  borderError.value = ''
  try {
    const data = await request.getProfile<any>(`/api/event/${eventId.value}/ranking-border`)
    if (data.borderRankings) {
      borderData.value = data.borderRankings.sort((a: any, b: any) => a.rank - b.rank)
      borderChapterData.value = parseWorldBloomChapterRankings(data.userWorldBloomChapterRankingBorders, 'borderRankings')
    } else {
      console.warn('Unknown Border data format:', data)
      borderData.value = []
      borderChapterData.value = {}
    }
    lastUpdate.value = Date.now()
  } catch (e) {
    console.error('Fetch borders failed:', e)
    borderError.value = '加载榜线失败'
  } finally {
    isLoading.value = false
  }
}

// Helper: 获取卡片信息
function getCardInfo(cardId: number) {
  return cardsMap.value[cardId] || { 
    id: cardId, 
    cardRarityType: 'rarity_1', 
    assetbundleName: '', 
    attr: 'cool' 
  }
}

function parseWorldBloomChapterRankings(chapters: any[] | undefined, rankingKey: string) {
  if (!Array.isArray(chapters)) return {}

  return chapters.reduce<Record<number, any[]>>((acc, chapter) => {
    const characterId = Number(chapter?.gameCharacterId)
    const rankings = chapter?.[rankingKey]
    if (characterId && Array.isArray(rankings)) {
      acc[characterId] = rankingKey === 'borderRankings'
        ? [...rankings].sort((a: any, b: any) => a.rank - b.rank)
        : rankings
    }
    return acc
  }, {})
}

function getCharacterName(characterId: number) {
  const character = charactersMap.value[characterId]
  if (!character) return `角色 ${characterId}`
  return `${character.firstName || ''}${character.givenName}`
}

function getCharacterIcon(characterId: number) {
  if (characterId <= 20) return `/img/chr_ts/chr_ts_90_${characterId}.png`
  if (characterId === 21) return '/img/chr_ts/chr_ts_90_21.png'
  return `/img/chr_ts/chr_ts_90_${characterId}_2.png`
}

function isChapterOngoing(chapter: WorldBloomData) {
  return currentTime.value >= chapter.chapterStartAt && currentTime.value <= chapter.aggregateAt
}

// Helper: 格式化分数
function formatScore(score: number) {
  return score.toLocaleString()
}

// Helper: Get honor by sequence
function getHonor(honors: any[], seq: number) {
  if (!honors) return undefined
  return honors.find((h: any) => h.seq === seq)
}


</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-base-100 p-6 rounded-xl shadow-sm relative">
      <div class="flex flex-col items-center justify-center text-center gap-1">
        <h1 class="text-2xl font-bold flex items-center justify-center gap-2">
          <span class="text-primary">#{{ eventId }}</span> {{ eventName || '加载中...' }}
        </h1>
        <p class="text-base-content/60 text-sm flex items-center justify-center gap-2">
          <span>实时榜况</span>
          <span v-if="lastUpdate">
            更新于: {{ new Date(lastUpdate).toLocaleTimeString() }}
          </span>
        </p>
      </div>
      
      <div class="mt-4 flex justify-center md:mt-0 md:absolute md:right-6 md:top-1/2 md:-translate-y-1/2">
        <button 
          class="btn btn-primary btn-sm gap-2" 
          :disabled="isLoading" 
          @click="refreshData"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
          刷新
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div role="tablist" class="tabs tabs-boxed bg-base-100 p-2">
      <a 
        role="tab" 
        class="tab transition-all" 
        :class="{ 'tab-active bg-primary text-primary-content': activeTab === 'top100' }"
        @click="activeTab = 'top100'"
      >
        Top 100 (实时)
      </a>
      <a 
        role="tab" 
        class="tab transition-all" 
        :class="{ 'tab-active bg-primary text-primary-content': activeTab === 'borders' }"
        @click="activeTab = 'borders'"
      >
        榜线 (5分钟延迟)
      </a>
    </div>

    <!-- World Link character rankings -->
    <div v-if="isWorldBloomEvent" class="bg-base-100 p-3 rounded-xl shadow-sm">
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          class="btn btn-sm h-auto min-h-12 shrink-0 gap-2 px-3"
          :class="selectedWorldBloomCharacterId === null ? 'btn-primary' : 'btn-ghost'"
          @click="selectedWorldBloomCharacterId = null"
        >
          <span
            class="grid w-8 h-8 place-items-center rounded-full text-xs font-bold ring-1"
            :class="selectedWorldBloomCharacterId === null ? 'bg-primary-content text-primary ring-primary-content/40' : 'bg-base-200 text-base-content/70 ring-base-300'"
          >
            ALL
          </span>
          <span class="flex flex-col items-start leading-tight">
            <span>综合</span>
            <span class="text-[10px] font-normal opacity-80">总榜</span>
          </span>
        </button>
        <button
          v-for="chapter in worldBloomChapters"
          :key="chapter.id"
          class="btn btn-sm h-auto min-h-12 shrink-0 gap-2 px-2"
          :class="selectedWorldBloomCharacterId === chapter.gameCharacterId ? 'btn-primary' : 'btn-ghost'"
          @click="selectedWorldBloomCharacterId = chapter.gameCharacterId"
        >
          <span class="relative">
            <img
              :src="getCharacterIcon(chapter.gameCharacterId)"
              class="w-8 h-8 rounded-full object-cover ring-1"
              :class="isChapterOngoing(chapter) ? 'ring-success ring-2' : 'ring-base-300'"
              :alt="getCharacterName(chapter.gameCharacterId)"
            />
            <span
              class="absolute -bottom-1 -right-1 badge badge-xs border-none px-1"
              :class="isChapterOngoing(chapter) ? 'badge-success text-success-content' : selectedWorldBloomCharacterId === chapter.gameCharacterId ? 'badge-primary-content text-primary' : 'badge-neutral'"
            >
              {{ chapter.chapterNo }}
            </span>
          </span>
          <span class="flex flex-col items-start leading-tight">
            <span>{{ getCharacterName(chapter.gameCharacterId) }}</span>
            <span v-if="isChapterOngoing(chapter)" class="text-[10px] font-normal opacity-80">进行中</span>
          </span>
        </button>
      </div>
    </div>

    <!-- Unified Table View -->
    <div class="bg-base-100 rounded-xl shadow-sm overflow-hidden min-h-[300px]">
      <!-- Error State -->
      <div v-if="currentError" class="p-8 text-center text-error">
        {{ currentError }}
      </div>
      
      <!-- Empty State -->
      <div v-else-if="rankingRows.length === 0 && !isLoading" class="p-8 text-center text-base-content/60">
        暂无数据
      </div>
      
      <!-- Mobile List View -->
      <div class="md:hidden space-y-3 p-4">
        <div 
          v-for="row in rankingRows" 
          :key="`${selectedWorldBloomCharacterId || 'overall'}-${row.rank}`" 
          class="bg-base-100 p-3 rounded-lg border border-base-200 shadow-sm"
        >
          <!-- Top Row: Rank & Score -->
          <div class="flex justify-between items-center mb-2 pb-2 border-b border-base-100">
            <span class="font-bold font-mono text-lg text-primary">#{{ row.rank }}</span>
            <span class="font-mono text-sm">{{ formatScore(row.score) }} P</span>
          </div>

          <!-- Content Row -->
          <div class="flex gap-3">
            <!-- Card -->
            <div class="w-12 h-12 flex-shrink-0 relative">
              <SekaiCard 
                v-if="row.userCard"
                :card="getCardInfo(row.userCard.cardId)"
                :trained="row.userCard.defaultImage === 'special_training'"
                :master-rank="row.userCard.masterRank"
              />
            </div>

            <!-- Name & Honors -->
            <div class="flex-1 min-w-0 flex flex-col gap-1">
              <div class="font-bold text-sm truncate">{{ row.name }}</div>
              
              <!-- Honors (Wrap) -->
              <div class="flex flex-wrap gap-1">
                <template v-for="i in 3" :key="i">
                  <!-- 有数据则渲染 -->
                  <div v-if="getHonor(row.userProfileHonors, i)" class="h-6">
                    <SekaiProfileHonor 
                      :data="getHonor(row.userProfileHonors, i)" 
                      :user-honor-missions="row.userHonorMissions"
                      class="h-full w-auto block"
                    />
                  </div>
                  <!-- 无数据渲染占位符 Frame -->
                  <div v-else class="h-6">
                    <img 
                      v-if="i === 1"
                      src="/honor/frame_degree_m_1.png"
                      class="h-full w-auto opacity-50"
                      alt="empty-slot-main"
                    />
                    <img 
                      v-else
                      src="/honor/frame_degree_s_1.png"
                      class="h-full w-auto opacity-50"
                      alt="empty-slot-sub"
                    />
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="table table-md w-full">
          <thead>
            <tr>
              <th class="w-20 text-center">排名</th>
              <th>玩家信息</th>
              <th class="text-right w-32">分数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rankingRows" :key="`${selectedWorldBloomCharacterId || 'overall'}-${row.rank}`">
              <td class="text-center font-bold text-lg font-mono">#{{ row.rank }}</td>
              <td>
                <div class="flex items-start gap-4">
                  <!-- 卡片头像 -->
                  <div class="w-16 h-16 flex-shrink-0 relative">
                    <SekaiCard 
                      v-if="row.userCard"
                      :card="getCardInfo(row.userCard.cardId)"
                      :trained="row.userCard.defaultImage === 'special_training'"
                      :master-rank="row.userCard.masterRank"
                    />
                  </div>
                  
                  <!-- 名字和 Honor -->
                  <div class="flex flex-col gap-1 min-w-0">
                    <div class="font-bold text-lg truncate">{{ row.name }}</div>
                    <div class="flex items-center gap-1 h-8">
                      <!-- Honor 渲染: 3 个槽位。Seq 1 为 Main (宽), Seq 2/3 为 Sub (窄) -->
                      <template v-for="i in 3" :key="i">
                        <!-- 有数据则渲染 -->
                        <div v-if="getHonor(row.userProfileHonors, i)" class="h-full">
                          <SekaiProfileHonor 
                            :data="getHonor(row.userProfileHonors, i)" 
                            :user-honor-missions="row.userHonorMissions"
                            class="h-full w-auto block"
                          />
                        </div>
                        <!-- 无数据渲染占位符 Frame -->
                        <div v-else class="h-full">
                          <img 
                            v-if="i === 1"
                            src="/honor/frame_degree_m_1.png"
                            class="h-full w-auto opacity-50"
                            alt="empty-slot-main"
                          />
                          <img 
                            v-else
                            src="/honor/frame_degree_s_1.png"
                            class="h-full w-auto opacity-50"
                            alt="empty-slot-sub"
                          />
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </td>
              <td class="text-right font-mono text-xl whitespace-nowrap text-primary">
                {{ formatScore(row.score) }} P
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>


<style scoped>
/* 针对 SekaiCard 的微调，使其在表格中显示正常 */
:deep(.sekai-card-svg) {
  width: 100%;
  height: 100%;
}

/* 强制 Honor 组件高度跟随容器，宽度自适应，避免默认的 width: 100% 导致过大 */
:deep(.sekai-honor),
:deep(.sekai-honor-bonds) {
  width: auto !important;
  height: 100% !important;
}
</style>
