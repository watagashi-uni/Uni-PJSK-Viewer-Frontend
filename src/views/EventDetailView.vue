<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSeoMeta, useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { useBackToList } from '@/composables/useBackToList'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { useAccountStore } from '@/stores/account'
import { 
  Calendar, Clock, Trophy, Music, CreditCard, 
  Sparkles, ChevronLeft, ChevronRight, BarChart3, ShoppingBasket, Minus, Plus, RotateCcw, Swords
} from 'lucide-vue-next'
import SekaiCard from '@/components/SekaiCard.vue'
import AssetImage from '@/components/AssetImage.vue'
import SekaiHonor from '@/components/SekaiHonor.vue'
import AccountSelector from '@/components/AccountSelector.vue'
import type { EventData } from '@/types/master'

const route = useRoute()
// 上一页是列表时后退以保留筛选与页码，否则打开列表
const goBack = useBackToList('/events')
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()

const assetsHost = computed(() => settingsStore.assetsHost)

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
  prefix?: string
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
    resourceQuantity?: number
  }>
}

interface EventExchangeCost {
  resourceType: string
  resourceId: number
  resourceQuantity: number
}

interface EventExchange {
  id: number
  seq: number
  resourceBoxId: number
  exchangeLimit?: number
  eventExchangeCost: EventExchangeCost
}

interface EventExchangeSummary {
  id: number
  eventId: number
  assetbundleName: string
  startAt: number
  endAt: number
  eventExchanges: EventExchange[]
}

interface MaterialInfo {
  id: number
  name: string
}

interface TicketInfo {
  id: number
  name: string
}

interface BoostItemInfo {
  id: number
  name: string
}

interface EventItemInfo {
  id: number
  eventId: number
  name: string
  assetbundleName?: string
}

interface MysekaiMaterialInfo {
  id: number
  name: string
  iconAssetbundleName: string
}

interface CheerfulCarnivalSummary {
  id: number
  eventId: number
  theme: string
  midtermAnnounce1At?: number
  midtermAnnounce2At?: number
  assetbundleName: string
}

interface CheerfulCarnivalTeam {
  id: number
  eventId: number
  seq: number
  teamName: string
  assetbundleName: string
}

interface ExchangeView {
  id: number
  seq: number
  exchangeLimit?: number
  cost: EventExchangeCost
  reward: ResourceBox['details'][number]
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
const eventExchangeSummaries = ref<EventExchangeSummary[]>([])
const materials = ref<MaterialInfo[]>([])
const practiceTickets = ref<TicketInfo[]>([])
const skillPracticeTickets = ref<TicketInfo[]>([])
const boostItems = ref<BoostItemInfo[]>([])
const eventItems = ref<EventItemInfo[]>([])
const mysekaiMaterials = ref<MysekaiMaterialInfo[]>([])
const cheerfulCarnivalSummaries = ref<CheerfulCarnivalSummary[]>([])
const cheerfulCarnivalTeams = ref<CheerfulCarnivalTeam[]>([])
const missingCheerfulTeamImages = ref<Set<number>>(new Set())
const exchangeQuantities = ref<Record<number, number>>({})
const manualBadgeCount = ref(0)

const isLoading = ref(true)
const currentImageIndex = ref(0)

const selectedUserId = computed({
  get: () => accountStore.currentUserId || '',
  set: value => { void accountStore.selectAccount(value) },
})

const materialMap = computed(() => new Map(materials.value.map(item => [item.id, item])))
const practiceTicketMap = computed(() => new Map(practiceTickets.value.map(item => [item.id, item])))
const skillPracticeTicketMap = computed(() => new Map(skillPracticeTickets.value.map(item => [item.id, item])))
const boostItemMap = computed(() => new Map(boostItems.value.map(item => [item.id, item])))
const eventItemMap = computed(() => new Map(eventItems.value.map(item => [item.id, item])))
const mysekaiMaterialMap = computed(() => new Map(mysekaiMaterials.value.map(item => [item.id, item])))
const cardMap = computed(() => new Map(cards.value.map(card => [card.id, card])))

const exchangeSummary = computed(() => eventExchangeSummaries.value.find(summary => summary.eventId === event.value?.id))
const eventExchangeBoxMap = computed(() => new Map(resourceBoxes.value
  .filter(box => box.resourceBoxPurpose === 'event_exchange')
  .map(box => [box.id, box])))

const exchangeRows = computed<ExchangeView[]>(() => {
  const rows: ExchangeView[] = []
  for (const exchange of exchangeSummary.value?.eventExchanges || []) {
    const reward = eventExchangeBoxMap.value.get(exchange.resourceBoxId)?.details?.[0]
    if (!reward) continue
    rows.push({
      id: exchange.id,
      seq: exchange.seq,
      exchangeLimit: exchange.exchangeLimit,
      cost: exchange.eventExchangeCost,
      reward,
    })
  }
  return rows.sort((a, b) => a.seq - b.seq)
})

const accountBadgeCount = computed<number | null>(() => {
  if (!selectedUserId.value || !exchangeSummary.value) return null
  const suite = accountStore.getSuiteCache(selectedUserId.value)
  const rows = suite?.userEventItems ?? suite?.user_event_items
  if (!Array.isArray(rows)) return null
  const itemId = exchangeSummary.value.eventExchanges[0]?.eventExchangeCost.resourceId
  const row = rows.find((item: any) => Number(item?.eventItemId ?? item?.event_item_id) === itemId)
  return Number(row?.quantity || 0)
})

const badgeBudget = computed(() => accountBadgeCount.value ?? manualBadgeCount.value)
const selectedExchangeCost = computed(() => exchangeRows.value.reduce((total, row) => {
  return total + getExchangeQuantity(row.id) * Number(row.cost.resourceQuantity || 0)
}, 0))
const selectedRewardCount = computed(() => exchangeRows.value.reduce((total, row) => {
  return total + getExchangeQuantity(row.id)
}, 0))
const limitedFullCost = computed(() => exchangeRows.value.reduce((total, row) => {
  return total + (row.exchangeLimit || 0) * Number(row.cost.resourceQuantity || 0)
}, 0))
const badgeDeficit = computed(() => Math.max(0, selectedExchangeCost.value - badgeBudget.value))
const accountEventResult = computed(() => {
  if (!selectedUserId.value || !event.value) return null
  const suite = accountStore.getSuiteCache(selectedUserId.value)
  const rows = suite?.userEvents ?? suite?.user_events
  if (!Array.isArray(rows)) return null
  return rows.find((row: any) => Number(row?.eventId ?? row?.event_id) === event.value?.id) || null
})

const cheerfulSummary = computed(() => cheerfulCarnivalSummaries.value
  .find(summary => summary.eventId === event.value?.id) || null)

const cheerfulTeams = computed(() => cheerfulCarnivalTeams.value
  .filter(team => team.eventId === event.value?.id)
  .sort((a, b) => a.seq - b.seq))

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

// 当前时间 (每分钟刷新一次, 驱动倒计时与进度条更新)
const currentTime = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | undefined

// 活动状态
const eventStatus = computed(() => {
  if (!event.value) return { status: 'unknown', label: '', progress: 0 }
  
  const now = currentTime.value
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function getExchangeQuantity(exchangeId: number): number {
  return Number(exchangeQuantities.value[exchangeId] || 0)
}

function setExchangeQuantity(row: ExchangeView, value: number) {
  const max = row.exchangeLimit ?? 999
  exchangeQuantities.value[row.id] = Math.min(max, Math.max(0, Math.floor(Number(value) || 0)))
}

function adjustExchangeQuantity(row: ExchangeView, delta: number) {
  setExchangeQuantity(row, getExchangeQuantity(row.id) + delta)
}

function resetExchangePlan() {
  exchangeQuantities.value = {}
}

function selectAllLimited() {
  const quantities: Record<number, number> = {}
  for (const row of exchangeRows.value) {
    if (row.exchangeLimit) quantities[row.id] = row.exchangeLimit
  }
  exchangeQuantities.value = quantities
}

function selectCardRewards() {
  const quantities = { ...exchangeQuantities.value }
  for (const row of exchangeRows.value) {
    if (row.reward.resourceType === 'card') quantities[row.id] = row.exchangeLimit || 1
  }
  exchangeQuantities.value = quantities
}

function resourceName(resource: ResourceBox['details'][number]): string {
  const id = Number(resource.resourceId || 0)
  const labels: Record<string, string> = {
    jewel: '水晶',
    coin: '金币',
    virtual_coin: '虚拟币',
  }
  const label = labels[resource.resourceType]
  if (label) return label
  if (resource.resourceType === 'card') {
    const card = cardMap.value.get(id)
    return card ? `「${card.prefix || `成员 #${id}`}」` : `成员 #${id}`
  }
  if (resource.resourceType === 'material') return materialMap.value.get(id)?.name || `素材 #${id}`
  if (resource.resourceType === 'practice_ticket') return practiceTicketMap.value.get(id)?.name || `练习券 #${id}`
  if (resource.resourceType === 'skill_practice_ticket') return skillPracticeTicketMap.value.get(id)?.name || `技能券 #${id}`
  if (resource.resourceType === 'boost_item') return boostItemMap.value.get(id)?.name || `体力道具 #${id}`
  if (resource.resourceType === 'event_item') return eventItemMap.value.get(id)?.name || `活动道具 #${id}`
  if (resource.resourceType === 'mysekai_material') return mysekaiMaterialMap.value.get(id)?.name || `MySekai 素材 #${id}`
  return `${resource.resourceType} #${id}`
}

function resourceIcon(resource: ResourceBox['details'][number]): string {
  const id = Number(resource.resourceId || 0)
  if (resource.resourceType === 'card') {
    const bundle = cardMap.value.get(id)?.assetbundleName
    return bundle ? `${assetsHost.value}/startapp/thumbnail/chara/${bundle}_normal.png` : ''
  }
  if (resource.resourceType === 'material') return `${assetsHost.value}/startapp/thumbnail/material/material${id}.png`
  if (resource.resourceType === 'practice_ticket') return `${assetsHost.value}/startapp/thumbnail/practice_ticket/ticket${id}.png`
  if (resource.resourceType === 'skill_practice_ticket') return `${assetsHost.value}/startapp/thumbnail/skill_practice_ticket/ticket${id}.png`
  if (resource.resourceType === 'boost_item') return `${assetsHost.value}/startapp/thumbnail/boost_item/boost_item${id}.png`
  if (['jewel', 'coin', 'virtual_coin'].includes(resource.resourceType)) {
    return `${assetsHost.value}/startapp/thumbnail/common_material/${resource.resourceType}.png`
  }
  if (resource.resourceType === 'event_item') {
    const bundle = eventItemMap.value.get(id)?.assetbundleName || 'badge_all'
    return `${assetsHost.value}/startapp/thumbnail/common_event/${bundle}/icon_eventbadge_3.png`
  }
  if (resource.resourceType === 'mysekai_material') {
    const bundle = mysekaiMaterialMap.value.get(id)?.iconAssetbundleName
    return bundle ? `${assetsHost.value}/ondemand/mysekai/thumbnail/material/${bundle}.png` : ''
  }
  return ''
}

function eventBadgeIcon(): string {
  const itemId = exchangeSummary.value?.eventExchanges[0]?.eventExchangeCost.resourceId || 0
  const bundle = eventItemMap.value.get(itemId)?.assetbundleName || 'badge_all'
  return `${assetsHost.value}/startapp/thumbnail/common_event/${bundle}/icon_eventbadge_3.png`
}

function cheerfulTeamImage(team: CheerfulCarnivalTeam): string {
  const eventBundle = cheerfulSummary.value?.assetbundleName || event.value?.assetbundleName || ''
  return `${assetsHost.value}/ondemand/event/${eventBundle}/team_image/${team.assetbundleName}.png`
}

function markCheerfulTeamImageMissing(teamId: number) {
  const missing = new Set(missingCheerfulTeamImages.value)
  missing.add(teamId)
  missingCheerfulTeamImages.value = missing
}

async function loadData() {
  isLoading.value = true
  try {
    const eventId = Number(route.params.id)
    
    const [eventsData, eventMusicsData, eventCardsData, eventBonusesData,
           gameCharUnitsData, musicsData, cardsData, musicVocalsData, resourceBoxesData,
           exchangeData, materialData, practiceData, skillPracticeData, boostData, eventItemData,
           mysekaiMaterialData, cheerfulSummaryData, cheerfulTeamData] = await Promise.all([
      masterStore.getMaster<EventData>('events'),
      masterStore.getMaster<EventMusic>('eventMusics'),
      masterStore.getMaster<EventCard>('eventCards'),
      masterStore.getMaster<EventDeckBonus>('eventDeckBonuses'),
      masterStore.getMaster<GameCharacterUnit>('gameCharacterUnits'),
      masterStore.getMaster<MusicInfo>('musics'),
      masterStore.getMaster<CardInfo>('cards'),
      masterStore.getMaster<MusicVocal>('musicVocals'),
      masterStore.getMaster<ResourceBox>('resourceBoxes'),
      masterStore.getMaster<EventExchangeSummary>('eventExchangeSummaries'),
      masterStore.getMaster<MaterialInfo>('materials'),
      masterStore.getMaster<TicketInfo>('practiceTickets'),
      masterStore.getMaster<TicketInfo>('skillPracticeTickets'),
      masterStore.getMaster<BoostItemInfo>('boostItems'),
      masterStore.getMaster<EventItemInfo>('eventItems'),
      masterStore.getMaster<MysekaiMaterialInfo>('mysekaiMaterials'),
      masterStore.getMaster<CheerfulCarnivalSummary>('cheerfulCarnivalSummaries'),
      masterStore.getMaster<CheerfulCarnivalTeam>('cheerfulCarnivalTeams'),
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
    eventExchangeSummaries.value = exchangeData
    materials.value = materialData
    practiceTickets.value = practiceData
    skillPracticeTickets.value = skillPracticeData
    boostItems.value = boostData
    eventItems.value = eventItemData
    mysekaiMaterials.value = mysekaiMaterialData
    cheerfulCarnivalSummaries.value = cheerfulSummaryData
    cheerfulCarnivalTeams.value = cheerfulTeamData
    missingCheerfulTeamImages.value = new Set()
    resetExchangePlan()
    manualBadgeCount.value = 0
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

onMounted(() => {
  nowTimer = setInterval(() => {
    currentTime.value = Date.now()
  }, 60_000)
  void loadData()
})

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
})

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
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div class="flex flex-wrap items-center gap-2 sm:gap-4">
              <button type="button" class="btn btn-ghost btn-sm" @click="goBack">
                <ChevronLeft class="w-4 h-4" />
                返回列表
              </button>
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
            <div class="flex justify-center text-sm mb-1">
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
          <div v-if="accountEventResult" class="mt-4 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span class="font-medium text-primary">账号活动成绩</span>
            <span>活动点数：<strong>{{ formatNumber(Number(accountEventResult.eventPoint ?? accountEventResult.event_point ?? 0)) }}</strong></span>
            <span v-if="accountEventResult.rank">排名：<strong>#{{ formatNumber(Number(accountEventResult.rank)) }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Cheerful Carnival 阵营 -->
      <div v-if="cheerfulSummary && cheerfulTeams.length === 2" class="card bg-base-100 shadow-lg">
        <div class="card-body gap-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="text-lg font-medium flex items-center gap-2">
                <Swords class="w-5 h-5 text-secondary" />
                Cheerful Carnival
              </h3>
              <p class="mt-1 text-sm text-base-content/60">对战主题</p>
              <p class="font-semibold leading-snug">{{ cheerfulSummary.theme }}</p>
            </div>
            <div class="flex flex-wrap gap-2 text-xs text-base-content/60">
              <span v-if="cheerfulSummary.midtermAnnounce1At" class="badge badge-ghost gap-1">
                中期发表 1 · {{ formatDateTime(cheerfulSummary.midtermAnnounce1At) }}
              </span>
              <span v-if="cheerfulSummary.midtermAnnounce2At" class="badge badge-ghost gap-1">
                中期发表 2 · {{ formatDateTime(cheerfulSummary.midtermAnnounce2At) }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-stretch gap-2 sm:gap-3">
            <template v-for="(team, index) in cheerfulTeams" :key="team.id">
              <div class="min-w-0 rounded-xl border border-base-200 bg-base-200/35 p-2.5 sm:p-3 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                <div class="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl bg-base-200 overflow-hidden">
                  <AssetImage
                    v-if="!missingCheerfulTeamImages.has(team.id)"
                    :src="cheerfulTeamImage(team)"
                    :alt="team.teamName"
                    class="w-full h-full object-contain"
                    @error="markCheerfulTeamImageMissing(team.id)"
                  />
                  <div v-else class="w-full h-full grid place-items-center text-base-content/30">
                    <Swords class="w-7 h-7" />
                  </div>
                </div>
                <div class="min-w-0 text-center sm:text-left">
                  <span class="text-[11px] uppercase tracking-wide text-base-content/45">Team {{ team.seq }}</span>
                  <p class="font-bold text-sm sm:text-base break-words">{{ team.teamName }}</p>
                </div>
              </div>
              <div v-if="index === 0" class="flex items-center justify-center" aria-hidden="true">
                <span class="w-9 h-9 rounded-full bg-secondary text-secondary-content text-xs font-black grid place-items-center shadow-sm">VS</span>
              </div>
            </template>
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
              />
            </div>
            
            <button 
              class="btn btn-circle btn-sm absolute! left-2 top-1/2 -translate-y-1/2"
              style="position: absolute;"
              type="button"
              aria-label="上一张"
              @click="prevImage"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button 
              class="btn btn-circle btn-sm absolute! right-2 top-1/2 -translate-y-1/2"
              style="position: absolute;"
              type="button"
              aria-label="下一张"
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
                class="w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0"
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

      <!-- 活动兑换规划 -->
      <div v-if="exchangeSummary" class="card bg-base-100 shadow-lg">
        <div class="card-body gap-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="text-lg font-medium flex items-center gap-2"><ShoppingBasket class="w-5 h-5" />活动兑换规划</h3>
              <p class="text-sm text-base-content/55 mt-1">选择想兑换的数量，自动汇总所需活动徽章。无限兑换项目不会计入“一键选满”。</p>
            </div>
            <div class="text-xs text-base-content/55 text-right">
              <p>开放：{{ formatDateTime(exchangeSummary.startAt) }}</p>
              <p>结束：{{ formatDateTime(exchangeSummary.endAt) }}</p>
            </div>
          </div>

          <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div class="stat bg-base-200 rounded-xl p-4">
              <div class="stat-title text-xs">已选兑换次数</div>
              <div class="stat-value text-2xl">{{ formatNumber(selectedRewardCount) }}</div>
              <div class="stat-desc">共 {{ exchangeRows.length }} 种奖励</div>
            </div>
            <div class="stat bg-base-200 rounded-xl p-4">
              <div class="stat-title text-xs">所需徽章</div>
              <div class="stat-value text-2xl text-primary">{{ formatNumber(selectedExchangeCost) }}</div>
              <div class="stat-desc">有限项目全换：{{ formatNumber(limitedFullCost) }}</div>
            </div>
            <div class="stat bg-base-200 rounded-xl p-4">
              <div class="stat-title text-xs">当前徽章</div>
              <div v-if="accountBadgeCount !== null" class="stat-value text-2xl">{{ formatNumber(accountBadgeCount) }}</div>
              <input v-else v-model.number="manualBadgeCount" type="number" min="0" class="input input-bordered input-sm mt-1 w-full max-w-40" aria-label="手动输入当前活动徽章" />
              <div class="stat-desc">{{ accountBadgeCount !== null ? '来自账号 suite' : '可手动输入预算' }}</div>
            </div>
            <div class="stat rounded-xl p-4" :class="badgeDeficit ? 'bg-error/10' : 'bg-success/10'">
              <div class="stat-title text-xs">预算结果</div>
              <div class="stat-value text-2xl" :class="badgeDeficit ? 'text-error' : 'text-success'">{{ badgeDeficit ? `缺 ${formatNumber(badgeDeficit)}` : '足够' }}</div>
              <div class="stat-desc">计划后剩余 {{ formatNumber(Math.max(0, badgeBudget - selectedExchangeCost)) }}</div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button class="btn btn-sm btn-primary" @click="selectAllLimited">有限项目全部选满</button>
            <button class="btn btn-sm btn-secondary" @click="selectCardRewards">只追加活动成员</button>
            <button class="btn btn-sm btn-ghost gap-1" @click="resetExchangePlan"><RotateCcw class="w-4 h-4" />清空</button>
            <div class="ml-auto min-w-52"><AccountSelector v-if="accountStore.accounts.length" v-model="selectedUserId" /></div>
          </div>

          <div class="grid md:grid-cols-2 gap-3">
            <div v-for="row in exchangeRows" :key="row.id" class="flex items-center gap-3 rounded-xl border border-base-200 bg-base-200/35 p-3">
              <RouterLink v-if="row.reward.resourceType === 'card'" :to="`/cards/${row.reward.resourceId}`" class="w-16 h-16 rounded-lg overflow-hidden bg-base-200 shrink-0 hover:scale-105 transition-transform"><AssetImage :src="resourceIcon(row.reward)" :alt="resourceName(row.reward)" class="w-full h-full object-cover" /></RouterLink>
              <div v-else class="w-16 h-16 rounded-lg bg-base-200 p-2 shrink-0"><AssetImage :src="resourceIcon(row.reward)" :alt="resourceName(row.reward)" class="w-full h-full object-contain" /></div>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-sm truncate">{{ resourceName(row.reward) }}</p>
                <p class="text-xs text-base-content/55">每次 ×{{ formatNumber(row.reward.resourceQuantity || 1) }} · 单价 {{ formatNumber(row.cost.resourceQuantity) }}</p>
                <p class="text-[11px] text-base-content/45">{{ row.exchangeLimit ? `限兑 ${row.exchangeLimit} 次` : '无限兑换' }}</p>
              </div>
              <div class="shrink-0 flex flex-col items-end gap-1">
                <div class="join">
                  <button class="join-item btn btn-xs" :disabled="getExchangeQuantity(row.id) <= 0" aria-label="减少兑换数量" @click="adjustExchangeQuantity(row, -1)"><Minus class="w-3 h-3" /></button>
                  <input v-model.number="exchangeQuantities[row.id]" type="number" min="0" :max="row.exchangeLimit || 999" class="join-item input input-bordered input-xs w-14 text-center px-1" @change="setExchangeQuantity(row, exchangeQuantities[row.id] || 0)" />
                  <button class="join-item btn btn-xs" :disabled="getExchangeQuantity(row.id) >= (row.exchangeLimit || 999)" aria-label="增加兑换数量" @click="adjustExchangeQuantity(row, 1)"><Plus class="w-3 h-3" /></button>
                </div>
                <div class="flex items-center gap-1 text-xs font-medium text-primary"><AssetImage :src="eventBadgeIcon()" alt="活动徽章" class="w-5 h-5 object-contain" />{{ formatNumber(getExchangeQuantity(row.id) * row.cost.resourceQuantity) }}</div>
              </div>
            </div>
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
