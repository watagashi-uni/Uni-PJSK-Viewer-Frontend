<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSeoMeta, useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { 
  Calendar, Clock, Trophy, Music, CreditCard, 
  Sparkles, ChevronLeft, ChevronRight, BarChart3 
} from 'lucide-vue-next'
import SekaiCard from '@/components/SekaiCard.vue'
import AssetImage from '@/components/AssetImage.vue'
import SekaiHonor from '@/components/SekaiHonor.vue'

const route = useRoute()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const assetsHost = computed(() => settingsStore.assetsHost)

interface EventData {
  id: number
  eventType: string
  name: string
  assetbundleName: string
  startAt: number
  aggregateAt: number
  closedAt: number
  unit: string
  eventRankingRewardRanges?: {
    id: number
    fromRank: number
    toRank: number
    eventRankingRewards: {
        id: number
        resourceBoxId: number
    }[]
  }[]
}

interface EventMusic {
  eventId: number
  musicId: number
}

interface EventCard {
  eventId: number
  cardId: number
}

interface EventDeckBonus {
  eventId: number
  gameCharacterUnitId?: number
  cardAttr?: string
  bonusRate: number
}

interface GameCharacterUnit {
  id: number
  gameCharacterId: number
  unit: string
}

interface MusicInfo {
  id: number
  title: string
  composer: string
  arranger: string
  lyricist: string
  assetbundleName: string
}

interface CardInfo {
  id: number
  characterId: number
  assetbundleName: string
  cardRarityType: string
  attr: string
  supportUnit: string
  releaseAt: number
}

interface MusicVocal {
  id: number
  musicId: number
  characters: { characterId: number }[]
}

interface ResourceBox {
  resourceBoxPurpose: string
  id: number
  details: Array<{
    resourceType: string
    resourceId?: number
    resourceLevel?: number
  }>
}

const event = ref<EventData | null>(null)
const eventMusics = ref<EventMusic[]>([])
const eventCards = ref<EventCard[]>([])
const eventBonuses = ref<EventDeckBonus[]>([])
const gameCharacterUnits = ref<GameCharacterUnit[]>([])
const musics = ref<MusicInfo[]>([])
const cards = ref<CardInfo[]>([])
const musicVocals = ref<MusicVocal[]>([])
const resourceBoxes = ref<ResourceBox[]>([])

const isLoading = ref(true)
const currentImageIndex = ref(0)

// 活动类型映射
const eventTypeMap: Record<string, { label: string; color: string }> = {
  marathon: { label: '马拉松', color: 'badge-primary' },
  cheerful_carnival: { label: '5v5', color: 'badge-secondary' },
  world_bloom: { label: 'World Link', color: 'badge-accent' },
}

// 团队颜色映射
const unitColorMap: Record<string, string> = {
  light_sound: '#4455dd',
  idol: '#88dd44',
  street: '#ee1166',
  theme_park: '#ff9900',
  school_refusal: '#884499',
  piapro: '#00bfbf',
}

// 活动状态
const eventStatus = computed(() => {
  if (!event.value) return { status: 'unknown', label: '', progress: 0 }
  
  const now = Date.now()
  const start = event.value.startAt
  const end = event.value.aggregateAt
  
  if (now < start) {
    return { status: 'upcoming', label: '未开始', progress: 0 }
  } else if (now > end) {
    return { status: 'ended', label: '已结束', progress: 100 }
  } else {
    const total = end - start
    const elapsed = now - start
    const remaining = end - now
    const progress = Math.round((elapsed / total) * 100)
    
    // 格式化剩余时间
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    
    let label = ''
    if (days > 0) label = `剩余 ${days}天${hours}小时`
    else if (hours > 0) label = `剩余 ${hours}小时${minutes}分钟`
    else label = `剩余 ${minutes}分钟`
    
    return { status: 'ongoing', label, progress }
  }
})

// 获取活动图片列表
const eventImages = computed(() => {
  if (!event.value) return []
  const assetName = event.value.assetbundleName
  return [
    { label: 'Logo', url: `${assetsHost.value}/ondemand/event/${assetName}/logo/logo.png` },
    { label: '背景', url: `${assetsHost.value}/ondemand/event/${assetName}/screen/bg.png` },
    { label: '角色', url: `${assetsHost.value}/ondemand/event/${assetName}/screen/character.png` },
    { label: 'Banner', url: `${assetsHost.value}/startapp/home/banner/${assetName}/${assetName}.png` },
  ]
})

// 获取活动加成属性
const bonusAttr = computed(() => {
  const bonus = eventBonuses.value.find(b => b.eventId === event.value?.id && b.cardAttr && b.bonusRate === 50)
  return bonus?.cardAttr || null
})

// 获取活动加成角色（50%加成）及其对应属性的卡牌
const bonusCharacterCards = computed(() => {
  if (!event.value || !bonusAttr.value) return []
  
  const charUnitIds = eventBonuses.value
    .filter(b => b.eventId === event.value?.id && b.gameCharacterUnitId && b.bonusRate === 50)
    .map(b => b.gameCharacterUnitId!)
  
  return charUnitIds.map(unitId => {
    const unit = gameCharacterUnits.value.find(u => u.id === unitId)
    if (!unit) return null
    
    // 生成头像文件名
    let iconFile = ''
    if (unitId <= 20) {
      iconFile = `img/chr_ts/chr_ts_90_${unitId}.png`
    } else if (unit.gameCharacterId === 21) {
      iconFile = unitId === 21 ? 'img/chr_ts/chr_ts_90_21.png' : `img/chr_ts/chr_ts_90_21_${unitId - 25}.png`
    } else {
      iconFile = `img/chr_ts/chr_ts_90_${unit.gameCharacterId}_2.png`
    }
    
    // 查找该角色该属性的所有卡牌
    const charCards = cards.value.filter(card => {
      if (card.characterId !== unit.gameCharacterId) return false
      if (card.attr !== bonusAttr.value) return false
      if (card.characterId > 20 && card.supportUnit !== 'none' && card.supportUnit !== unit.unit) return false
      if (card.releaseAt && card.releaseAt > event.value!.aggregateAt) return false
      return true
    }).map(card => ({
      id: card.id,
      assetbundleName: card.assetbundleName,
      cardRarityType: card.cardRarityType,
      attr: card.attr // Added attr for SekaiCard
    }))
    
    return { unitId, unit: unit.unit, iconFile, cards: charCards }
  }).filter(c => c && c.cards.length > 0)
})

// 获取活动歌曲信息
const eventMusicList = computed(() => {
  if (!event.value) return []
  return eventMusics.value
    .filter(em => em.eventId === event.value?.id)
    .map(em => {
      const music = musics.value.find(m => m.id === em.musicId)
      if (!music) return null
      
      // 获取歌手信息
      const vocal = musicVocals.value.find(v => v.musicId === music.id)
      
      return { 
        id: music.id, 
        title: music.title,
        composer: music.composer,
        lyricist: music.lyricist,
        arranger: music.arranger,
        assetbundleName: music.assetbundleName,
        hasSinger: !!vocal
      }
    })
    .filter(Boolean)
})

// 获取活动卡牌信息
const eventCardList = computed(() => {
  if (!event.value) return []
  return eventCards.value
    .filter(ec => ec.eventId === event.value?.id)
    .map(ec => {
      const card = cards.value.find(c => c.id === ec.cardId)
      return card ? { 
        id: card.id, 
        assetbundleName: card.assetbundleName,
        cardRarityType: card.cardRarityType,
        attr: card.attr
      } : null
    })
    .filter(Boolean)
})

// 获取排名牌子
const rankingHonors = computed(() => {
  if (!event.value || !event.value.eventRankingRewardRanges) return []
  
  const honorsList = []
  
  for (const range of event.value.eventRankingRewardRanges) {
    let matchedHonor = null
    
    for (const reward of range.eventRankingRewards) {
      const box = resourceBoxes.value.find(
        b => b.id === reward.resourceBoxId && b.resourceBoxPurpose === 'event_ranking_reward'
      )
      
      if (box) {
        const honorDetail = box.details.find(d => d.resourceType === 'honor')
        if (honorDetail && honorDetail.resourceId) {
          matchedHonor = {
            id: range.id,
            fromRank: range.fromRank,
            toRank: range.toRank,
            rankString: range.fromRank === range.toRank ? `${range.fromRank}` : `${range.fromRank}-${range.toRank}`,
            honorId: honorDetail.resourceId,
            honorLevel: honorDetail.resourceLevel || 1
          }
          break
        }
      }
    }
    
    if (matchedHonor) {
      honorsList.push(matchedHonor)
    }
  }
  
  return honorsList.sort((a, b) => a.fromRank - b.fromRank)
})

// 格式化日期时间
function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 判断是否使用觉醒星
function useAfterTrainingStar(rarity: string): boolean {
  return rarity === 'rarity_3' || rarity === 'rarity_4'
}

// 切换图片
function nextImage() {
  currentImageIndex.value = (currentImageIndex.value + 1) % eventImages.value.length
}

function prevImage() {
  currentImageIndex.value = (currentImageIndex.value - 1 + eventImages.value.length) % eventImages.value.length
}

async function loadData() {
  isLoading.value = true
  try {
    const eventId = Number(route.params.id)
    
    const [eventsData, eventMusicsData, eventCardsData, eventBonusesData, 
           gameCharUnitsData, musicsData, cardsData, musicVocalsData, resourceBoxesData] = await Promise.all([
      masterStore.getMaster<EventData>('events'),
      masterStore.getMaster<EventMusic>('eventMusics'),
      masterStore.getMaster<EventCard>('eventCards'),
      masterStore.getMaster<EventDeckBonus>('eventDeckBonuses'),
      masterStore.getMaster<GameCharacterUnit>('gameCharacterUnits'),
      masterStore.getMaster<MusicInfo>('musics'),
      masterStore.getMaster<CardInfo>('cards'),
      masterStore.getMaster<MusicVocal>('musicVocals'),
      masterStore.getMaster<ResourceBox>('resourceBoxes'),
    ])

    event.value = eventsData.find(e => e.id === eventId) || null
    eventMusics.value = eventMusicsData
    eventCards.value = eventCardsData
    eventBonuses.value = eventBonusesData
    gameCharacterUnits.value = gameCharUnitsData
    musics.value = musicsData
    cards.value = cardsData
    musicVocals.value = musicVocalsData
    resourceBoxes.value = resourceBoxesData || []
  } catch (e) {
    console.error('加载活动数据失败:', e)
  } finally {
    isLoading.value = false
  }
}

const defaultTitle = 'Uni PJSK Viewer'

const pageTitle = computed(() => {
  if (event.value) {
    return `${event.value.name} - Uni PJSK Viewer`
  }
  return defaultTitle
})

const pageDescription = computed(() => {
  if (event.value) {
    const typeLabel = eventTypeMap[event.value.eventType]?.label || event.value.eventType
    return `世界计划(PJSK / Project SEKAI)活动「${event.value.name}」。活动类型：${typeLabel}。查看活动详细信息、当期加成卡牌、活动歌曲及奖励牌子等数据。`
  }
  return '查看世界计划(PJSK / Project SEKAI)的活动详细数据。'
})

const pageImage = computed(() => {
  if (eventImages.value.length > 0) {
    const banner = eventImages.value.find((img: any) => img.label === 'Banner')
    return banner ? banner.url : eventImages.value[0]?.url || ''
  }
  return ''
})

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogImage: pageImage,
  twitterCard: 'summary_large_image',
})

const pageKeywords = computed(() => {
  if (event.value) {
    const typeLabel = eventTypeMap[event.value.eventType]?.label || event.value.eventType
    return `世界计划, PJSK, Project SEKAI, ${event.value.name}, ${typeLabel}, 活动详情, 奖励牌子, 初音未来`
  }
  return '世界计划, PJSK, Project SEKAI, 游戏活动, 数据'
})

useHead({
  meta: [
    { name: 'keywords', content: pageKeywords }
  ]
})

onMounted(loadData)

watch(() => route.params.id, loadData)
</script>

<template>
  <div>
    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- 活动不存在 -->
    <div v-else-if="!event" class="text-center py-20">
      <p class="text-xl text-base-content/60">活动不存在</p>
      <RouterLink to="/events" class="btn btn-primary mt-4">返回活动列表</RouterLink>
    </div>

    <!-- 活动详情 -->
    <div v-else class="space-y-6">
      <!-- 头部 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
              <RouterLink to="/events" class="btn btn-ghost btn-sm">
                <ChevronLeft class="w-4 h-4" />
                返回
              </RouterLink>
              <span class="badge badge-lg">#{{ event.id }}</span>
              <span 
                class="badge badge-lg"
                :class="eventTypeMap[event.eventType]?.color || 'badge-ghost'"
              >
                {{ eventTypeMap[event.eventType]?.label || event.eventType }}
              </span>
            </div>
            
            <!-- 榜线按钮 (仅正在进行时显示) -->
            <RouterLink 
              v-if="eventStatus.status === 'ongoing'"
              to="/ranking"
              class="btn btn-sm btn-primary gap-2"
            >
              <BarChart3 class="w-4 h-4" />
              查看榜线
            </RouterLink>
          </div>
          
          <h1 class="text-2xl font-bold mb-4">{{ event.name }}</h1>
          
          <!-- 活动状态进度条 -->
          <div class="mb-4">
            <div class="flex justify-between text-sm mb-1">
              <span>{{ formatDateTime(event.startAt) }}</span>
              <span 
                class="font-medium"
                :class="{
                  'text-success': eventStatus.status === 'ongoing',
                  'text-warning': eventStatus.status === 'upcoming',
                  'text-base-content/60': eventStatus.status === 'ended'
                }"
              >
                {{ eventStatus.label }}
              </span>
              <span>{{ formatDateTime(event.aggregateAt) }}</span>
            </div>
            <progress 
              class="progress w-full"
              :class="{
                'progress-success': eventStatus.status === 'ongoing',
                'progress-warning': eventStatus.status === 'upcoming',
                '': eventStatus.status === 'ended'
              }"
              :value="eventStatus.progress" 
              max="100"
            ></progress>
          </div>
          
          <!-- 基本信息 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="flex items-center gap-2">
              <Calendar class="w-4 h-4 text-primary" />
              <span class="text-base-content/60">开始:</span>
              <span>{{ formatDateTime(event.startAt) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-primary" />
              <span class="text-base-content/60">结束:</span>
              <span>{{ formatDateTime(event.aggregateAt) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Trophy class="w-4 h-4 text-primary" />
              <span class="text-base-content/60">类型:</span>
              <span>{{ eventTypeMap[event.eventType]?.label || event.eventType }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 图片轮播 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h3 class="text-lg font-medium mb-3">活动视觉</h3>
          <div class="relative">
            <div class="flex justify-center items-center min-h-[300px] bg-base-200 rounded-lg overflow-hidden">
              <AssetImage 
                :src="eventImages[currentImageIndex]?.url ?? ''"
                :alt="eventImages[currentImageIndex]?.label ?? ''"
                class="max-w-full max-h-[500px] object-contain"
                no-fallback
                @failed="nextImage"
              />
            </div>
            
            <button 
              class="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2"
              style="position: absolute;"
              @click="prevImage"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button 
              class="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2"
              style="position: absolute;"
              @click="nextImage"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
          
          <div class="flex justify-center gap-2 mt-4">
            <button 
              v-for="(img, idx) in eventImages" 
              :key="idx"
              class="btn btn-sm"
              :class="idx === currentImageIndex ? 'btn-primary' : 'btn-ghost'"
              @click="currentImageIndex = idx"
            >
              {{ img.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 本期卡牌 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
            <CreditCard class="w-5 h-5" />
            本期卡牌
          </h3>
          <div class="flex flex-wrap gap-3">
            <RouterLink 
              v-for="card in eventCardList" 
              :key="card?.id"
              :to="`/cards/${card?.id}`"
              class="hover:scale-105 transition-transform w-16 sm:w-20"
            >
              <SekaiCard 
                v-if="card" 
                :card="card" 
                :trained="useAfterTrainingStar(card.cardRarityType || '')" 
              />
            </RouterLink>
          </div>
          <p v-if="eventCardList.length === 0" class="text-base-content/60">暂无本期卡牌</p>
        </div>
      </div>

      <!-- 加成信息 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
            <Sparkles class="w-5 h-5" />
            加成信息
          </h3>
          
          <div class="space-y-4">
            <div 
              v-for="charData in bonusCharacterCards" 
              :key="charData?.unitId"
              class="flex items-center gap-3 flex-wrap"
            >
              <!-- 角色头像 -->
              <div 
                class="w-10 h-10 rounded-full overflow-hidden ring-2 flex-shrink-0"
                :style="{ borderColor: unitColorMap[charData?.unit || ''] || '#ccc' }"
              >
                <img 
                  :src="`/${charData?.iconFile}`"
                  class="w-full h-full object-cover"
                />
              </div>
              
              <!-- 属性图标 -->
              <img 
                v-if="bonusAttr"
                :src="`/newcard/attr_icon_${bonusAttr}.png`"
                class="w-8 h-8 flex-shrink-0"
              />
              
              <!-- 该角色该属性的卡牌 -->
              <div class="flex flex-wrap gap-2">
                <RouterLink 
                  v-for="card in charData?.cards" 
                  :key="card.id"
                  :to="`/cards/${card.id}`"
                  class="hover:scale-105 transition-transform w-12 sm:w-14"
                >
                  <SekaiCard 
                    :card="card" 
                    :trained="useAfterTrainingStar(card.cardRarityType)" 
                  />
                </RouterLink>
              </div>
            </div>
          </div>
          
          <p v-if="bonusCharacterCards.length === 0" class="text-base-content/60">暂无加成信息</p>
        </div>
      </div>



      <!-- 活动歌曲 -->
      <div v-if="eventMusicList.length > 0" class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
            <Music class="w-5 h-5" />
            活动歌曲
          </h3>
          <div class="space-y-3">
            <RouterLink 
              v-for="music in eventMusicList" 
              :key="music?.id"
              :to="`/musics/${music?.id}`"
              class="flex items-center gap-4 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
            >
              <!-- 歌曲封面 -->
              <AssetImage 
                :src="`${assetsHost}/startapp/music/jacket/${music?.assetbundleName}/${music?.assetbundleName}.png`"
                class="w-16 h-16 rounded shadow"
              />
              <!-- 歌曲信息 -->
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">{{ music?.title }}</p>
                <p class="text-sm text-base-content/60 truncate">
                  作曲: {{ music?.composer }}
                  <span v-if="music?.lyricist"> / 作词: {{ music?.lyricist }}</span>
                </p>
              </div>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- 排名牌子 -->
    <div v-if="rankingHonors.length > 0" class="card bg-base-100 shadow-lg mt-6">
      <div class="card-body">
        <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
          <Trophy class="w-5 h-5" />
          牌子奖励
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div 
            v-for="honor in rankingHonors" 
            :key="honor.id"
            class="group relative rounded-2xl bg-base-200/40 border border-base-200 hover:bg-base-200 hover:-translate-y-1 hover:shadow-md transition-all duration-300 overflow-hidden"
          >
            <!-- 排名标签 -->
            <div class="absolute top-0 left-0 bg-primary/90 backdrop-blur text-primary-content font-black italic px-4 py-1 rounded-br-2xl text-sm shadow-sm z-10 flex items-center gap-1">
              <span class="opacity-80 text-xs">TOP</span>
              <span>{{ honor.rankString }}</span>
            </div>
              
            <!-- 背景装饰图（可选，增加层次感） -->
            <div class="absolute inset-0 bg-gradient-to-br from-base-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <!-- 牌子图片容器 -->
            <div class="relative py-8 px-4 flex justify-center items-center h-full w-full">
              <div class="w-full max-w-[280px] drop-shadow-sm group-hover:drop-shadow-md group-hover:scale-105 transition-all duration-300">
                <SekaiHonor 
                  :honor-id="honor.honorId" 
                  :honor-level="honor.honorLevel"
                  main
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
