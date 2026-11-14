<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSeoMeta, useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { useBackToList } from '@/composables/useBackToList'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { useAccountStore } from '@/stores/account'
import { 
  Calendar, Trophy, Music, CreditCard, BookOpen,
  Sparkles, ChevronLeft, ChevronRight, BarChart3, ShoppingBasket, Minus, Plus, RotateCcw, Swords
} from 'lucide-vue-next'
import SekaiCard from '@/components/SekaiCard.vue'
import AssetImage from '@/components/AssetImage.vue'
import EventImagePlaceholder from '@/components/EventImagePlaceholder.vue'
import SekaiHonor from '@/components/SekaiHonor.vue'
import AccountSelector from '@/components/AccountSelector.vue'
import type { EventData } from '@/types/master'
import { cardImageVariant } from '@/utils/card'
import { getEventBannerUrl, getEventLogoUrl, isTestEvent } from '@/utils/event'
import ZhText from '@/components/ZhText.vue'
import { useResourceZh } from '@/composables/useResourceZh'
import StorySummaryPanel from '@/components/StorySummaryPanel.vue'
import { useSpoilerWatermark } from '@/composables/useSpoilerWatermark'

const route = useRoute()
// 上一页是列表时后退以保留筛选与页码，否则打开列表
const goBack = useBackToList('/events')
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const { resourceDisplayZh } = useResourceZh()
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

interface EventStorySummary {
  id: number
  eventId: number
  outline?: string
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
// 显示未公开内容时加剧透水印，判断与剧透过滤使用同一个时间
useSpoilerWatermark(() => !!event.value && event.value.startAt > Date.now())
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
const eventStories = ref<EventStorySummary[]>([])
const missingCheerfulTeamImages = ref<Set<number>>(new Set())
const exchangeQuantities = ref<Record<number, number>>({})
const manualBadgeCount = ref(0)

const isLoading = ref(true)
const selectedImageLabel = ref('Logo')
const failedImageUrls = ref(new Set<string>())

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

// 未开始的活动沿用剧情页的剧透设置
const eventStoryLink = computed(() => {
  if (!event.value) return ''
  if (!settingsStore.showSpoilers && event.value.startAt > currentTime.value) return ''
  const story = eventStories.value.find(item => item.eventId === event.value?.id)
  return story ? `/stories?story=${story.id}` : ''
})
const eventStoryId = computed(() => eventStoryLink.value ? eventStories.value.find(item => item.eventId === event.value?.id)?.id : undefined)
const eventOutline = computed(() => eventStoryLink.value ? eventStories.value.find(item => item.eventId === event.value?.id)?.outline || '' : '')

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
  if (!event.value?.assetbundleName) return []
  const assetName = event.value.assetbundleName
  const bannerUrl = getEventBannerUrl(event.value, assetsHost.value)
  return [
    { label: 'Logo', url: `${assetsHost.value}/ondemand/event/${assetName}/logo/logo.png` },
    { label: '背景', url: `${assetsHost.value}/ondemand/event/${assetName}/screen/bg.png` },
    { label: '角色', url: `${assetsHost.value}/ondemand/event/${assetName}/screen/character.png` },
    ...(bannerUrl ? [{ label: 'Banner', url: bannerUrl }] : []),
  ]
})

// 顶部主视觉：活动界面的背景大图；加载失败（很早期的活动或测试活动）时退回纯色横幅
const heroArtFailed = ref(false)
const heroLogoFailed = ref(false)
const heroArtUrl = computed(() => {
  if (!event.value?.assetbundleName || heroArtFailed.value) return ''
  return `${assetsHost.value}/ondemand/event/${event.value.assetbundleName}/screen/bg.png`
})
const heroLogoUrl = computed(() => (event.value ? getEventLogoUrl(event.value, assetsHost.value) : ''))

const availableEventImages = computed(() => eventImages.value.filter(img => !failedImageUrls.value.has(img.url)))
const currentImage = computed(() => availableEventImages.value.find(img => img.label === selectedImageLabel.value)
  ?? availableEventImages.value[0])

watch([() => event.value?.id, assetsHost], () => {
  selectedImageLabel.value = 'Logo'
  failedImageUrls.value = new Set()
  heroArtFailed.value = false
  heroLogoFailed.value = false
})

function markEventImageFailed(error: Event) {
  const url = (error.target as HTMLImageElement).getAttribute('src')
  if (url && eventImages.value.some(img => img.url === url)) failedImageUrls.value.add(url)
}

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
  moveImage(1)
}

function prevImage() {
  moveImage(-1)
}

function moveImage(offset: number) {
  const images = availableEventImages.value
  if (images.length < 2) return
  const index = images.findIndex(img => img.url === currentImage.value?.url)
  selectedImageLabel.value = images[(index + offset + images.length) % images.length]!.label
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
    const card = cardMap.value.get(id)
    return card?.assetbundleName ? `${assetsHost.value}/startapp/thumbnail/chara/${card.assetbundleName}_${cardImageVariant(card, false)}.png` : ''
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
           mysekaiMaterialData, cheerfulSummaryData, cheerfulTeamData, eventStoryData] = await Promise.all([
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
      masterStore.getMaster<EventStorySummary>('eventStories'),
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
    eventStories.value = eventStoryData
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
  const images = availableEventImages.value
  return images.find(img => img.label === 'Banner')?.url ?? images[0]?.url ?? ''
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
      <!-- 头部：活动主视觉 -->
      <section class="kv" :class="{ 'kv--plain': !heroArtUrl }">
        <img
          v-if="heroArtUrl"
          :key="heroArtUrl"
          :src="heroArtUrl"
          alt=""
          class="kv__art"
          crossorigin="anonymous"
          @error="heroArtFailed = true"
        />
        <div class="kv__top">
          <button type="button" class="kv-chip" @click="goBack">
            <ChevronLeft class="h-4 w-4" />
            活动列表
          </button>
          <div class="flex flex-wrap items-center gap-2">
            <RouterLink v-if="eventStoryLink" :to="eventStoryLink" class="kv-chip">
              <BookOpen class="h-4 w-4" />
              剧情
            </RouterLink>
            <!-- 榜线按钮 (仅正在进行时显示) -->
            <RouterLink v-if="eventStatus.status === 'ongoing'" to="/ranking" class="kv-chip kv-chip--solid">
              <BarChart3 class="h-4 w-4" />
              实时榜线
            </RouterLink>
          </div>
        </div>
        <div class="kv__body">
          <img
            v-if="!heroLogoFailed"
            :src="heroLogoUrl"
            :alt="event.name"
            class="kv__logo"
            crossorigin="anonymous"
            @error="heroLogoFailed = true"
          />
          <h1 class="kv__title"><ZhText :text="event.name" table="events" path="name" sub-class="text-base md:text-lg mt-0.5" /></h1>
          <div class="kv__meta">
            <span class="kv-chip num">#{{ event.id }}</span>
            <span class="kv-chip">{{ eventTypeMap[event.eventType]?.label || event.eventType }}</span>
            <span
              class="kv-chip"
              :class="{ 'kv-chip--live': eventStatus.status === 'ongoing', 'kv-chip--soon': eventStatus.status === 'upcoming' }"
            >
              {{ eventStatus.label }}
            </span>
            <span class="kv-chip font-normal">
              <Calendar class="h-3.5 w-3.5" />
              {{ formatDateTime(event.startAt) }} – {{ formatDateTime(event.aggregateAt) }}
            </span>
          </div>
        </div>
        <div
          v-if="eventStatus.status === 'ongoing'"
          class="kv__progress"
          role="progressbar"
          :aria-valuenow="Math.round(eventStatus.progress)"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="活动进度"
        >
          <i :style="{ width: `${eventStatus.progress}%` }"></i>
        </div>
      </section>

      <!-- 简介、剧情总结、账号成绩 -->
      <div v-if="eventOutline || eventStoryId || accountEventResult" class="card bg-base-100">
        <div class="card-body gap-4">
          <p v-if="eventOutline" class="text-sm leading-6 text-base-content/70 whitespace-pre-line text-left"><ZhText :text="eventOutline" table="eventStories" path="outline" sub-class="mt-2" /></p>
          <StorySummaryPanel v-if="eventStoryId" :story-key="`event_${eventStoryId}`" heading="活动剧情总结" :to="eventStoryLink" link-text="阅读活动剧情" class="text-left" />
          <div v-if="accountEventResult" class="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span class="font-medium text-primary">账号活动成绩</span>
            <span>活动点数：<strong>{{ formatNumber(Number(accountEventResult.eventPoint ?? accountEventResult.event_point ?? 0)) }}</strong></span>
            <span v-if="accountEventResult.rank">排名：<strong>#{{ formatNumber(Number(accountEventResult.rank)) }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Cheerful Carnival 阵营 -->
      <div v-if="cheerfulSummary && cheerfulTeams.length === 2" class="card bg-base-100">
        <div class="card-body gap-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="text-lg font-medium flex items-center gap-2">
                <Swords class="w-5 h-5 text-secondary" />
                Cheerful Carnival
              </h3>
              <p class="mt-1 text-sm text-base-content/60">对战主题</p>
              <p class="font-semibold leading-snug"><ZhText :text="cheerfulSummary.theme" table="cheerfulCarnivalSummaries" path="theme" layout="inline" /></p>
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
                  <p class="font-bold text-sm sm:text-base break-words"><ZhText :text="team.teamName" table="cheerfulCarnivalTeams" path="teamName" sub-class="text-xs font-normal" /></p>
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
      <div class="card bg-base-100">
        <div class="card-body">
          <h3 class="text-lg font-medium mb-3">活动视觉</h3>
          <div class="relative">
            <div class="flex justify-center items-center min-h-[300px] bg-base-200 rounded-lg overflow-hidden">
              <AssetImage
                v-if="currentImage"
                :key="currentImage.url"
                :src="currentImage.url"
                :alt="currentImage.label"
                class="max-w-full max-h-[500px] object-contain"
                @error="markEventImageFailed"
              />
              <EventImagePlaceholder v-else :test-event="isTestEvent(event)" class="min-h-[300px] w-full" />
            </div>
            
            <button 
              v-if="availableEventImages.length > 1"
              class="btn btn-circle btn-sm absolute! left-2 top-1/2 -translate-y-1/2"
              style="position: absolute;"
              type="button"
              aria-label="上一张"
              @click="prevImage"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <button 
              v-if="availableEventImages.length > 1"
              class="btn btn-circle btn-sm absolute! right-2 top-1/2 -translate-y-1/2"
              style="position: absolute;"
              type="button"
              aria-label="下一张"
              @click="nextImage"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
          
          <div v-if="availableEventImages.length" class="flex justify-center gap-2 mt-4">
            <button 
              v-for="img in availableEventImages"
              :key="img.url"
              class="btn btn-sm"
              :class="img.url === currentImage?.url ? 'btn-primary' : 'btn-ghost'"
              @click="selectedImageLabel = img.label"
            >
              {{ img.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 本期卡牌 -->
      <div class="card bg-base-100">
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
              class="transition-transform w-16 sm:w-20"
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
      <div class="card bg-base-100">
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
                  class="transition-transform w-12 sm:w-14"
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
      <div v-if="eventMusicList.length > 0" class="card bg-base-100">
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
                <p class="font-medium truncate"><ZhText :text="music?.title" table="musics" path="title" sub-class="text-xs font-normal" /></p>
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
      <div v-if="exchangeSummary" class="card bg-base-100">
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

          <!-- 汇总：已选、所需、当前、结果 -->
          <div class="exchange-summary">
            <div class="exchange-summary__cell">
              <span class="exchange-summary__label">已选</span>
              <span class="exchange-summary__value num">{{ formatNumber(selectedRewardCount) }}<small>次</small></span>
              <span class="exchange-summary__hint">共 {{ exchangeRows.length }} 种奖励</span>
            </div>
            <div class="exchange-summary__cell">
              <span class="exchange-summary__label">所需徽章</span>
              <span class="exchange-summary__value num text-primary"><AssetImage :src="eventBadgeIcon()" alt="" class="h-6 w-6 object-contain" />{{ formatNumber(selectedExchangeCost) }}</span>
              <span class="exchange-summary__hint">有限项目全换 {{ formatNumber(limitedFullCost) }}</span>
            </div>
            <div class="exchange-summary__cell">
              <span class="exchange-summary__label">当前徽章</span>
              <span v-if="accountBadgeCount !== null" class="exchange-summary__value num">{{ formatNumber(accountBadgeCount) }}</span>
              <input
                v-else
                v-model.number="manualBadgeCount"
                type="number"
                min="0"
                inputmode="numeric"
                placeholder="0"
                class="exchange-summary__input num"
                aria-label="手动输入当前活动徽章"
              />
              <span class="exchange-summary__hint">{{ accountBadgeCount !== null ? '来自账号数据' : '手动填写预算' }}</span>
            </div>
            <div class="exchange-summary__cell" :class="badgeDeficit ? 'is-short' : 'is-enough'">
              <span class="exchange-summary__label">预算结果</span>
              <span class="exchange-summary__value num">{{ badgeDeficit ? `缺 ${formatNumber(badgeDeficit)}` : '足够' }}</span>
              <span class="exchange-summary__hint">换完剩余 {{ formatNumber(Math.max(0, badgeBudget - selectedExchangeCost)) }}</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button type="button" class="chip" @click="selectAllLimited">有限项目全部选满</button>
            <button type="button" class="chip" @click="selectCardRewards">只加活动成员</button>
            <button type="button" class="chip" :disabled="selectedRewardCount === 0" :class="{ 'is-off': selectedRewardCount === 0 }" @click="resetExchangePlan"><RotateCcw class="h-3.5 w-3.5" />清空</button>
            <div v-if="accountStore.accounts.length" class="ml-auto w-full min-w-52 sm:w-auto"><AccountSelector v-model="selectedUserId" /></div>
          </div>

          <div class="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <div
              v-for="row in exchangeRows"
              :key="row.id"
              class="exchange-row"
              :class="{ 'is-picked': getExchangeQuantity(row.id) > 0 }"
            >
              <RouterLink v-if="row.reward.resourceType === 'card'" :to="`/cards/${row.reward.resourceId}`" class="exchange-row__icon"><AssetImage :src="resourceIcon(row.reward)" :alt="resourceName(row.reward)" class="h-full w-full object-cover" /></RouterLink>
              <div v-else class="exchange-row__icon p-1.5"><AssetImage :src="resourceIcon(row.reward)" :alt="resourceName(row.reward)" class="h-full w-full object-contain" /></div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium"><ZhText :text="resourceName(row.reward)" :zh="resourceDisplayZh(row.reward.resourceType, resourceName(row.reward)) ?? null" main-class="block truncate" sub-class="text-xs" /></p>
                <p class="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-base-content/55">
                  <span>每次 ×<span class="num">{{ formatNumber(row.reward.resourceQuantity || 1) }}</span></span>
                  <span class="inline-flex items-center gap-0.5"><AssetImage :src="eventBadgeIcon()" alt="单价" class="h-3.5 w-3.5 object-contain" /><span class="num">{{ formatNumber(row.cost.resourceQuantity) }}</span></span>
                  <span>{{ row.exchangeLimit ? `限 ${row.exchangeLimit} 次` : '不限次数' }}</span>
                </p>
              </div>
              <div class="exchange-row__ctl">
                <div class="stepper">
                  <button type="button" :disabled="getExchangeQuantity(row.id) <= 0" aria-label="减少兑换数量" @click="adjustExchangeQuantity(row, -1)"><Minus class="h-3.5 w-3.5" /></button>
                  <input
                    v-model.number="exchangeQuantities[row.id]"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    :max="row.exchangeLimit || 999"
                    placeholder="0"
                    :aria-label="`${resourceName(row.reward)} 兑换数量`"
                    @change="setExchangeQuantity(row, exchangeQuantities[row.id] || 0)"
                  />
                  <button type="button" :disabled="getExchangeQuantity(row.id) >= (row.exchangeLimit || 999)" aria-label="增加兑换数量" @click="adjustExchangeQuantity(row, 1)"><Plus class="h-3.5 w-3.5" /></button>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <button
                    v-if="row.exchangeLimit && getExchangeQuantity(row.id) < row.exchangeLimit"
                    type="button"
                    class="font-medium text-primary hover:underline"
                    @click="setExchangeQuantity(row, row.exchangeLimit)"
                  >
                    选满
                  </button>
                  <span class="num inline-flex items-center gap-0.5 font-semibold" :class="getExchangeQuantity(row.id) > 0 ? 'text-primary' : 'text-base-content/35'">
                    <AssetImage :src="eventBadgeIcon()" alt="活动徽章" class="h-4 w-4 object-contain" />{{ formatNumber(getExchangeQuantity(row.id) * row.cost.resourceQuantity) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 排名牌子 -->
    <div v-if="rankingHonors.length > 0" class="card bg-base-100 mt-6">
      <div class="card-body">
        <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
          <Trophy class="w-5 h-5" />
          牌子奖励
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div 
            v-for="honor in rankingHonors" 
            :key="honor.id"
            class="group relative rounded-2xl bg-base-200/40 border border-base-200 hover:bg-base-200 hover:shadow-md transition-all duration-300 overflow-hidden"
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
              <div class="w-full max-w-[280px] drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300">
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

<style scoped>
/* 兑换规划的汇总条：四格连在一起，中间用细线分开 */
.exchange-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid var(--color-base-300);
  border-radius: var(--radius-box);
  overflow: hidden;
}

@media (min-width: 1024px) {
  .exchange-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.exchange-summary__cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  padding: 0.75rem 1rem;
  /* 用外描边当分隔线：格子换行后也不会多出或缺少线 */
  box-shadow: 0 0 0 0.5px var(--color-base-300);
}

.exchange-summary__label {
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
  font-size: 0.75rem;
}

.exchange-summary__value {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 2rem;
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 2rem;
}

.exchange-summary__value small {
  margin-left: 0.125rem;
  color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
  font-size: 0.75rem;
  font-weight: 500;
}

.exchange-summary__hint {
  overflow: hidden;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
  font-size: 0.6875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.exchange-summary__input {
  width: 100%;
  max-width: 9rem;
  height: 2rem;
  padding: 0 0.625rem;
  border: 1px solid var(--color-base-300);
  border-radius: var(--radius-field);
  outline: none;
  background-color: var(--color-base-100);
  font-size: 1rem;
  font-weight: 700;
  appearance: textfield;
  -moz-appearance: textfield;
}

.exchange-summary__input:focus {
  border-color: var(--color-primary);
}

.exchange-summary__input::-webkit-inner-spin-button,
.exchange-summary__input::-webkit-outer-spin-button {
  margin: 0;
  -webkit-appearance: none;
}

.exchange-summary__cell.is-enough {
  background-color: color-mix(in oklab, var(--color-success) 9%, transparent);
}

.exchange-summary__cell.is-enough .exchange-summary__value {
  color: var(--color-success);
}

.exchange-summary__cell.is-short {
  background-color: color-mix(in oklab, var(--color-error) 9%, transparent);
}

.exchange-summary__cell.is-short .exchange-summary__value {
  color: var(--color-error);
}

/* 一条可兑换的奖励：选了数量的那几条描品牌色 */
.exchange-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-base-300);
  border-radius: var(--radius-box);
  background-color: var(--color-base-100);
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.exchange-row.is-picked {
  border-color: color-mix(in oklab, var(--color-primary) 55%, var(--color-base-300));
  background-color: color-mix(in oklab, var(--color-primary) 5%, var(--color-base-100));
}

/* 数量和小计：宽屏靠右竖排；手机上单独占一行，小计在左、步进器在右，名字就不会被挤成省略号 */
.exchange-row__ctl {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

@media (max-width: 639px) {
  .exchange-row {
    flex-wrap: wrap;
    row-gap: 0.5rem;
  }

  .exchange-row__ctl {
    flex-direction: row-reverse;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-left: 4rem;
  }
}

.exchange-row__icon {
  display: block;
  flex: none;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 0.625rem;
  background-color: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  overflow: hidden;
}
</style>
