<script setup lang="ts">
import { displayImageUrl } from '@/utils/derivedAssets'
import { computed, nextTick, onMounted, ref, type Component } from 'vue'
import { useModalDialog } from '@/composables/useModalDialog'
import { Cake, CalendarDays, CalendarMinus, ChevronDown, ChevronLeft, ChevronRight, Gift, Music2, Radio, Sparkles, Trophy, X } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import type { EventData, MusicData } from '@/types/master'
import { cardImageVariant } from '@/utils/card'
import { getEventLogoUrl } from '@/utils/event'
import { useCharacterName } from '@/composables/useCharacterName'
import { SCHEDULE_ZH, useResourceZh } from '@/composables/useResourceZh'
import ZhText from '@/components/ZhText.vue'

type CalendarCategory = 'event' | 'gacha' | 'music' | 'virtual_live' | 'login_bonus' | 'birthday'

type EventInfo = Pick<EventData, 'id' | 'name' | 'startAt' | 'aggregateAt' | 'eventType' | 'assetbundleName'>

interface GachaInfo {
  id: number
  name: string
  startAt: number
  endAt: number
  isShowPeriod?: boolean
}

type MusicInfo = Pick<MusicData, 'id' | 'title' | 'publishedAt' | 'assetbundleName'>

interface VirtualLiveSchedule {
  id: number
  startAt: number
  endAt: number
}

interface VirtualLiveInfo {
  id: number
  name: string
  startAt: number
  endAt: number
  virtualLiveSchedules?: VirtualLiveSchedule[]
}

interface CharacterInfo {
  id: number
  seq?: number
  firstName?: string
  givenName: string
}

interface CharacterProfile {
  characterId: number
  birthday?: string
}

interface LoginBonusInfo {
  id: number
  name: string
  startAt: number
  endAt: number
  limitedLoginBonusDetails?: LoginBonusDetail[]
}

interface LoginBonusDetail {
  id: number
  limitedLoginBonusId: number
  day: number
  resourceBoxId: number
}

interface ResourceDetail {
  seq: number
  resourceType: string
  resourceId?: number
  resourceQuantity: number
}

interface ResourceBox {
  id: number
  resourceBoxPurpose: string
  details: ResourceDetail[]
}

interface NamedResource {
  id: number
  name?: string
  prefix?: string
  assetbundleName?: string
  iconAssetbundleName?: string
}

interface RewardDay {
  day: number
  boxId: number
  rewards: ResourceDetail[]
}

interface CalendarEntry {
  key: string
  category: CalendarCategory
  timestamp: number
  title: string
  action: '开始' | '结算' | '开放' | '结束' | '发布' | '场次' | '生日'
  image?: string
  route?: string
  loginBonusId?: number
}

/** 同一天里标题和类型都相同的日程合成一条（Virtual Live 一天能开二十多场） */
interface EntryGroup {
  entry: CalendarEntry
  times: string[]
}

interface CalendarDay {
  key: string
  date: Date
  day: number
  currentMonth: boolean
  today: boolean
  groups: EntryGroup[]
  /** 当天出现的分类，手机月历上各画一个色点 */
  categories: CalendarCategory[]
}

const previewCategoryOrder: CalendarCategory[] = ['event', 'birthday', 'music', 'gacha', 'login_bonus', 'virtual_live']

const { characterName: formatCharacterName } = useCharacterName()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const { resourceDisplayZh } = useResourceZh()
const today = new Date()
const todayKey = toDateKey(today)
const currentMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDateKey = ref(todayKey)
const isLoading = ref(true)
const loadError = ref('')
const events = ref<EventInfo[]>([])
const gachas = ref<GachaInfo[]>([])
const musics = ref<MusicInfo[]>([])
const virtualLives = ref<VirtualLiveInfo[]>([])
const characters = ref<CharacterInfo[]>([])
const characterProfiles = ref<CharacterProfile[]>([])
const loginBonuses = ref<LoginBonusInfo[]>([])
const assetsHost = computed(() => settingsStore.assetsHost)
const failedAgendaImages = ref(new Set<string>())
const selectedLoginBonusId = ref(0)
const resourceBoxes = ref<ResourceBox[]>([])
const resourceMaps = ref(new Map<string, Map<number, NamedResource>>())
const rewardLoading = ref(false)
const rewardLoaded = ref(false)
const rewardError = ref('')
const categoryEnabled = ref<Record<CalendarCategory, boolean>>({
  event: true,
  gacha: true,
  music: true,
  virtual_live: true,
  login_bonus: true,
  birthday: true,
})

const categoryMeta: Record<CalendarCategory, { label: string; dot: string; text: string }> = {
  event: { label: '活动', dot: 'bg-primary', text: 'text-primary' },
  gacha: { label: '卡池', dot: 'bg-secondary', text: 'text-secondary' },
  music: { label: '歌曲', dot: 'bg-info', text: 'text-info' },
  virtual_live: { label: 'Virtual Live', dot: 'bg-warning', text: 'text-warning' },
  login_bonus: { label: '登录活动', dot: 'bg-accent', text: 'text-accent' },
  birthday: { label: '生日', dot: 'bg-success', text: 'text-success' },
}
const categoryIcons: Record<CalendarCategory, Component> = {
  event: Trophy,
  gacha: Sparkles,
  music: Music2,
  virtual_live: Radio,
  login_bonus: Gift,
  birthday: Cake,
}
const categoryOrder: CalendarCategory[] = ['event', 'gacha', 'music', 'virtual_live', 'login_bonus', 'birthday']
const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']

function toDateKey(date: Date | number): string {
  const value = typeof date === 'number' ? new Date(date) : date
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function characterName(characterId: number): string {
  const character = characters.value.find(row => row.id === characterId)
  return character ? formatCharacterName(character) : `角色 #${characterId}`
}

function characterIcon(characterId: number): string {
  if (characterId <= 20) return `/img/chr_ts/chr_ts_90_${characterId}.png`
  return `/img/chr_ts/chr_ts_90_${characterId}_2.png`
}

const permanentEntries = computed<CalendarEntry[]>(() => {
  const rows: CalendarEntry[] = []
  for (const event of events.value) {
    const shared = {
      category: 'event' as const,
      title: event.name,
      route: `/events/${event.id}`,
      image: getEventLogoUrl(event, assetsHost.value),
    }
    rows.push({ ...shared, key: `event-start-${event.id}`, timestamp: Number(event.startAt), action: '开始' })
    rows.push({ ...shared, key: `event-end-${event.id}`, timestamp: Number(event.aggregateAt), action: '结算' })
  }
  for (const gacha of gachas.value.filter(row => row.isShowPeriod !== false)) {
    rows.push({ key: `gacha-start-${gacha.id}`, category: 'gacha', timestamp: Number(gacha.startAt), title: gacha.name, action: '开放', route: `/gachas/${gacha.id}` })
    rows.push({ key: `gacha-end-${gacha.id}`, category: 'gacha', timestamp: Number(gacha.endAt), title: gacha.name, action: '结束', route: `/gachas/${gacha.id}` })
  }
  for (const music of musics.value) {
    const bundle = music.assetbundleName
    rows.push({
      key: `music-${music.id}`,
      category: 'music',
      timestamp: Number(music.publishedAt),
      title: music.title,
      action: '发布',
      route: `/musics/${music.id}`,
      image: bundle ? displayImageUrl(`${assetsHost.value}/startapp/music/jacket/${bundle}/${bundle}.png`) : undefined,
    })
  }
  for (const live of virtualLives.value) {
    const schedules = Array.isArray(live.virtualLiveSchedules) ? live.virtualLiveSchedules : []
    if (schedules.length) {
      for (const schedule of schedules) {
        rows.push({ key: `vlive-${live.id}-${schedule.id}`, category: 'virtual_live', timestamp: Number(schedule.startAt), title: live.name, action: '场次', route: `/vlives/${live.id}` })
      }
    } else if (live.startAt) {
      rows.push({ key: `vlive-${live.id}`, category: 'virtual_live', timestamp: Number(live.startAt), title: live.name, action: '开始', route: `/vlives/${live.id}` })
    }
  }
  for (const campaign of loginBonuses.value) {
    rows.push({ key: `login-bonus-start-${campaign.id}`, category: 'login_bonus', timestamp: Number(campaign.startAt), title: campaign.name, action: '开始', loginBonusId: campaign.id })
    rows.push({ key: `login-bonus-end-${campaign.id}`, category: 'login_bonus', timestamp: Number(campaign.endAt), title: campaign.name, action: '结束', loginBonusId: campaign.id })
  }
  return rows.filter(row => Number.isFinite(row.timestamp) && row.timestamp > 0)
})

const birthdayEntries = computed<CalendarEntry[]>(() => {
  const year = currentMonth.value.getFullYear()
  return characterProfiles.value.flatMap(profile => {
    const match = profile.birthday?.match(/(\d+)月(\d+)日/)
    if (!match) return []
    const timestamp = new Date(year, Number(match[1]) - 1, Number(match[2]), 12).getTime()
    return [{
      key: `birthday-${year}-${profile.characterId}`,
      category: 'birthday' as const,
      timestamp,
      title: `${characterName(profile.characterId)}的生日`,
      action: '生日',
      route: `/characters/${profile.characterId}`,
      image: characterIcon(profile.characterId),
    }]
  })
})

const allEntries = computed(() => [...permanentEntries.value, ...birthdayEntries.value])
const spoilerSafeEntries = computed(() => allEntries.value.filter(row => {
  if (settingsStore.showSpoilers) return true
  if (row.category === 'birthday') return toDateKey(row.timestamp) <= toDateKey(new Date())
  return row.timestamp <= Date.now()
}))
const filteredEntries = computed(() => spoilerSafeEntries.value.filter(row => categoryEnabled.value[row.category]))
const entriesByDate = computed(() => {
  const result = new Map<string, CalendarEntry[]>()
  for (const entry of filteredEntries.value) {
    const key = toDateKey(entry.timestamp)
    const list = result.get(key) || []
    list.push(entry)
    result.set(key, list)
  }
  for (const list of result.values()) list.sort((a, b) => a.timestamp - b.timestamp || a.category.localeCompare(b.category))
  return result
})

function groupEntries(entries: CalendarEntry[]): EntryGroup[] {
  const groups = new Map<string, EntryGroup>()
  for (const entry of entries) {
    const key = `${entry.category}|${entry.action}|${entry.title}|${entry.route ?? entry.loginBonusId ?? ''}`
    const group = groups.get(key)
    if (group) group.times.push(timeLabel(entry))
    else groups.set(key, { entry, times: [timeLabel(entry)] })
  }
  return [...groups.values()]
}

function isEnding(entry: CalendarEntry): boolean {
  return entry.action === '结束' || entry.action === '结算'
}

const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const first = new Date(year, month, 1)
  const mondayOffset = (first.getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, index - mondayOffset + 1)
    const key = toDateKey(date)
    const entries = entriesByDate.value.get(key) || []
    const groups = groupEntries(entries)
    return {
      key,
      date,
      day: date.getDate(),
      currentMonth: date.getMonth() === month,
      today: key === todayKey,
      groups,
      categories: categoryOrder.filter(category => entries.some(entry => entry.category === category)),
    }
  })
})

function dayPreviewLabel(group: EntryGroup): string {
  const { category, action } = group.entry
  if (category === 'virtual_live') return `演出 · ${group.times.length} 场`
  if (category === 'birthday') return '角色生日'
  return `${categoryMeta[category].label}${action}`
}

const unfilteredAgendaDates = computed(() => new Set(spoilerSafeEntries.value.map(entry => toDateKey(entry.timestamp))))
const emptyDayLabels = {
  future: '未来日程已隐藏',
  filtered: '无匹配日程',
  empty: '暂无日程',
}

function emptyAgendaReason(dateKey: string): keyof typeof emptyDayLabels {
  if (!settingsStore.showSpoilers && dateKey > todayKey) return 'future'
  return unfilteredAgendaDates.value.has(dateKey) ? 'filtered' : 'empty'
}

const desktopDays = computed(() => {
  const days = calendarDays.value
  const lastInMonth = days.map(day => day.currentMonth).lastIndexOf(true)
  const cellCount = Math.ceil((lastInMonth + 1) / 7) * 7

  return days.slice(0, cellCount).map((day, index) => {
    let preview: EntryGroup | undefined
    if (day.currentMonth) {
      for (const category of previewCategoryOrder) {
        preview = day.groups.find(group => group.entry.category === category && !isEnding(group.entry))
        if (preview) break
      }
      preview ??= day.groups[0]
    }
    const previewLabel = preview ? dayPreviewLabel(preview) : ''
    const emptyLabel = day.currentMonth && !day.groups.length ? emptyDayLabels[emptyAgendaReason(day.key)] : ''
    const accessibleLabel = [
      `${day.date.getMonth() + 1}月${day.day}日`,
      emptyLabel || `${day.groups.length} 项日程`,
      ...(preview ? [`${previewLabel}：${preview.entry.title}`] : []),
    ].join('，')
    return { ...day, weekend: index % 7 >= 5, preview, previewLabel, emptyLabel, accessibleLabel }
  })
})

const monthAgenda = computed(() => {
  const days = calendarDays.value.filter(day => day.currentMonth && day.groups.length > 0)
  return { days: days.length, groups: days.reduce((total, day) => total + day.groups.length, 0) }
})

const monthCategoryCounts = computed(() => {
  const key = monthKey(currentMonth.value)
  const result = Object.fromEntries(categoryOrder.map(category => [category, 0])) as Record<CalendarCategory, number>
  for (const entry of spoilerSafeEntries.value) {
    if (toDateKey(entry.timestamp).startsWith(key)) result[entry.category] += 1
  }
  return result
})

const selectedGroups = computed(() => calendarDays.value.find(day => day.key === selectedDateKey.value)?.groups ?? [])
const isViewingToday = computed(() => selectedDateKey.value === todayKey)
const agendaEmptyText = computed(() => {
  const reason = emptyAgendaReason(selectedDateKey.value)
  if (reason === 'future') return emptyDayLabels.future
  return reason === 'filtered' ? '当天有日程，但已被筛选条件隐藏' : '当天没有日程'
})
const selectedDateLabel = computed(() => {
  const [year, month, day] = selectedDateKey.value.split('-').map(Number)
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(year || 0, (month || 1) - 1, day || 1))
})
const monthLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(currentMonth.value))
const canGoNextMonth = computed(() => settingsStore.showSpoilers || monthKey(currentMonth.value) < monthKey(today))
const selectedLoginBonus = computed(() => loginBonuses.value.find(row => row.id === selectedLoginBonusId.value) || null)
const { onDialogClose: onLoginBonusDialogClose } = useModalDialog('loginBonusDialog', () => !!selectedLoginBonus.value, () => { selectedLoginBonusId.value = 0 })
const loginBonusBoxMap = computed(() => new Map(resourceBoxes.value
  .filter(box => box.resourceBoxPurpose === 'login_bonus')
  .map(box => [box.id, box])))
const selectedRewardDays = computed<RewardDay[]>(() => {
  if (!selectedLoginBonus.value || !rewardLoaded.value) return []
  return [...(selectedLoginBonus.value.limitedLoginBonusDetails || [])]
    .sort((a, b) => a.day - b.day)
    .map(detail => ({
      day: detail.day,
      boxId: detail.resourceBoxId,
      rewards: [...(loginBonusBoxMap.value.get(detail.resourceBoxId)?.details || [])].sort((a, b) => a.seq - b.seq),
    }))
})

function setMonth(offset: number) {
  const nextMonth = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + offset, 1)
  if (!settingsStore.showSpoilers && monthKey(nextMonth) > monthKey(today)) return
  currentMonth.value = nextMonth
  selectedDateKey.value = toDateKey(currentMonth.value)
}

function goToday() {
  currentMonth.value = new Date(today.getFullYear(), today.getMonth(), 1)
  selectedDateKey.value = todayKey
}

const detailPanelRef = ref<HTMLElement | null>(null)

function selectDay(day: CalendarDay) {
  if (!day.currentMonth) {
    currentMonth.value = new Date(day.date.getFullYear(), day.date.getMonth(), 1)
  }
  selectedDateKey.value = day.key
  // 平板上月历很高，选完把详情滚进视野；手机上详情就在紧凑月历下面，桌面端在右侧，都不用滚
  if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px) and (max-width: 1279.98px)').matches) {
    void nextTick(() => detailPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }
}

function toggleCategory(category: CalendarCategory) {
  categoryEnabled.value[category] = !categoryEnabled.value[category]
}

function timeLabel(entry: CalendarEntry): string {
  if (entry.category === 'birthday') return '全天'
  return new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString('zh-CN')
}

function openLoginBonus(id?: number) {
  if (!id) return
  selectedLoginBonusId.value = id
  void ensureRewardData()
}

function closeLoginBonus() {
  selectedLoginBonusId.value = 0
}

async function ensureRewardData() {
  if (rewardLoaded.value || rewardLoading.value) return
  rewardLoading.value = true
  rewardError.value = ''
  try {
    const [boxes, materials, boosts, practice, skill, tickets, cards, stamps, mysekaiMaterials, mysekaiTools, fixtures, avatars, profileResources] = await Promise.all([
      masterStore.getMaster<ResourceBox>('resourceBoxes'),
      masterStore.getMaster<NamedResource>('materials'),
      masterStore.getMaster<NamedResource>('boostItems'),
      masterStore.getMaster<NamedResource>('practiceTickets'),
      masterStore.getMaster<NamedResource>('skillPracticeTickets'),
      masterStore.getMaster<NamedResource>('gachaTickets'),
      masterStore.getMaster<NamedResource>('cards'),
      masterStore.getMaster<NamedResource>('stamps'),
      masterStore.getMaster<NamedResource>('mysekaiMaterials'),
      masterStore.getMaster<NamedResource>('mysekaiTools'),
      masterStore.getMaster<NamedResource>('mysekaiFixtures'),
      masterStore.getMaster<NamedResource>('avatarCoordinates'),
      masterStore.getMaster<NamedResource>('customProfileCollectionResources'),
    ])
    resourceBoxes.value = boxes
    resourceMaps.value = new Map([
      ['material', new Map(materials.map(row => [row.id, row]))],
      ['boost_item', new Map(boosts.map(row => [row.id, row]))],
      ['practice_ticket', new Map(practice.map(row => [row.id, row]))],
      ['skill_practice_ticket', new Map(skill.map(row => [row.id, row]))],
      ['gacha_ticket', new Map(tickets.map(row => [row.id, row]))],
      ['card', new Map(cards.map(row => [row.id, row]))],
      ['stamp', new Map(stamps.map(row => [row.id, row]))],
      ['mysekai_material', new Map(mysekaiMaterials.map(row => [row.id, row]))],
      ['mysekai_tool', new Map(mysekaiTools.map(row => [row.id, row]))],
      ['mysekai_fixture', new Map(fixtures.map(row => [row.id, row]))],
      ['avatar_coordinate', new Map(avatars.map(row => [row.id, row]))],
      ['custom_profile_collection_resource', new Map(profileResources.map(row => [row.id, row]))],
    ])
    rewardLoaded.value = true
  } catch (error) {
    rewardError.value = error instanceof Error ? error.message : '奖励数据加载失败'
  } finally {
    rewardLoading.value = false
  }
}

const resourceTypeLabels: Record<string, string> = {
  jewel: '水晶', coin: '金币', virtual_coin: '虚拟币', material: '素材', boost_item: '体力道具',
  practice_ticket: '练习券', skill_practice_ticket: '技能券', gacha_ticket: '招募券', card: '成员',
  stamp: '表情贴图', mysekai_material: 'MySekai 素材', mysekai_tool: 'MySekai 工具',
  mysekai_fixture: 'MySekai 家具', avatar_coordinate: '虚拟形象套装',
  custom_profile_collection_resource: '个人资料素材',
}

function resourceName(resource: ResourceDetail): string {
  const typeLabel = resourceTypeLabels[resource.resourceType] || resource.resourceType
  const id = Number(resource.resourceId || 0)
  if (!id) return typeLabel
  const row = resourceMaps.value.get(resource.resourceType)?.get(id)
  if (resource.resourceType === 'card' && row?.prefix) return `「${row.prefix}」`
  if (resource.resourceType === 'stamp' && row?.name) return row.name.replace(/^\[スタンプ\]/, '')
  return row?.name || `${typeLabel} #${id}`
}

function resourceIcon(resource: ResourceDetail): string {
  const id = Number(resource.resourceId || 0)
  const row = resourceMaps.value.get(resource.resourceType)?.get(id)
  if (['jewel', 'coin', 'virtual_coin'].includes(resource.resourceType)) return `${assetsHost.value}/startapp/thumbnail/common_material/${resource.resourceType}.png`
  if (resource.resourceType === 'material') return `${assetsHost.value}/startapp/thumbnail/material/material${id}.png`
  if (resource.resourceType === 'boost_item') return `${assetsHost.value}/startapp/thumbnail/boost_item/boost_item${id}.png`
  if (resource.resourceType === 'practice_ticket') return `${assetsHost.value}/startapp/thumbnail/practice_ticket/ticket${id}.png`
  if (resource.resourceType === 'skill_practice_ticket') return `${assetsHost.value}/startapp/thumbnail/skill_practice_ticket/ticket${id}.png`
  if (resource.resourceType === 'gacha_ticket' && row?.assetbundleName) return `${assetsHost.value}/startapp/thumbnail/gacha_ticket/${row.assetbundleName}.png`
  if (resource.resourceType === 'card' && row?.assetbundleName) return displayImageUrl(`${assetsHost.value}/startapp/thumbnail/chara/${row.assetbundleName}_${cardImageVariant(row, false)}.png`)
  if (resource.resourceType === 'stamp' && row?.assetbundleName) return `${assetsHost.value}/startapp/stamp/${row.assetbundleName}/${row.assetbundleName}.png`
  if (resource.resourceType === 'mysekai_material' && row?.iconAssetbundleName) return `${assetsHost.value}/ondemand/mysekai/thumbnail/material/${row.iconAssetbundleName}.png`
  if (resource.resourceType === 'mysekai_tool' && row?.assetbundleName) return `${assetsHost.value}/ondemand/mysekai/thumbnail/tool/${row.assetbundleName}.png`
  return ''
}

onMounted(async () => {
  try {
    const [eventData, gachaData, musicData, liveData, characterData, profileData, loginBonusData] = await Promise.all([
      masterStore.getMaster<EventInfo>('events'),
      masterStore.getMaster<GachaInfo>('gachas'),
      masterStore.getMaster<MusicInfo>('musics'),
      masterStore.getMaster<VirtualLiveInfo>('virtualLives'),
      masterStore.getMaster<CharacterInfo>('gameCharacters'),
      masterStore.getMaster<CharacterProfile>('characterProfiles'),
      masterStore.getMaster<LoginBonusInfo>('limitedLoginBonuses'),
    ])
    events.value = eventData
    gachas.value = gachaData
    musics.value = musicData
    virtualLives.value = liveData
    characters.value = characterData.filter(row => row.id <= 26)
    characterProfiles.value = profileData
    loginBonuses.value = loginBonusData
  } catch (error) {
    console.error('加载游戏日历失败:', error)
    loadError.value = '游戏资料加载失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-4 md:space-y-5">
    <PageHeader title="游戏日历" description="活动、卡池、新曲、Virtual Live、登录活动和角色生日的日程。">
      <template #icon><CalendarDays /></template>
    </PageHeader>

    <div v-if="isLoading" class="space-y-4"><div class="skeleton h-24 rounded-xl"></div><div class="skeleton h-[34rem] rounded-xl"></div></div>
    <div v-else-if="loadError" class="alert alert-error">游戏日历加载失败：{{ loadError }}</div>
    <template v-else>
      <!-- 月份切换 + 分类筛选 -->
      <div class="panel space-y-3 p-3 sm:p-4">
        <div class="flex flex-wrap items-center gap-2">
          <div class="cal-month">
            <button type="button" class="cal-month__btn" aria-label="上个月" @click="setMonth(-1)"><ChevronLeft class="h-4 w-4" /></button>
            <span class="cal-month__label num" aria-live="polite">{{ monthLabel }}</span>
            <button type="button" class="cal-month__btn" aria-label="下个月" :disabled="!canGoNextMonth" @click="setMonth(1)"><ChevronRight class="h-4 w-4" /></button>
          </div>
          <button type="button" class="chip" :class="{ 'is-off': isViewingToday }" :disabled="isViewingToday" @click="goToday">今天</button>
          <p class="ml-auto text-right text-xs leading-5 text-base-content/55">
            <span class="num font-semibold text-primary">{{ monthAgenda.groups }}</span> 项日程<span class="hidden sm:inline"> · <span class="num font-semibold text-base-content/80">{{ monthAgenda.days }}</span> 天有安排</span>
          </p>
        </div>
        <div class="flex flex-wrap gap-1.5" role="group" aria-label="日程分类">
          <button
            v-for="category in categoryOrder"
            :key="category"
            type="button"
            class="chip"
            :class="{ 'is-off': !categoryEnabled[category] }"
            :aria-pressed="categoryEnabled[category]"
            @click="toggleCategory(category)"
          >
            <span class="h-2 w-2 rounded-full" :class="categoryMeta[category].dot"></span>
            {{ categoryMeta[category].label }}
            <span class="chip__count">{{ monthCategoryCounts[category] }}{{ category === 'virtual_live' ? ' 场' : '' }}</span>
          </button>
        </div>
        <p v-if="!settingsStore.showSpoilers" class="text-xs text-base-content/45">剧透已关闭，只显示已经发生的日程；可在<RouterLink to="/settings" class="link">设置</RouterLink>中开启未来内容。</p>
      </div>

      <div class="cal-layout grid grid-cols-1 items-start gap-4 md:gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <!-- 桌面月历每天突出一项，其余日程在选中当天后查看。 -->
        <div class="cal-month-surface card hidden overflow-hidden border border-base-200 bg-base-100 md:block">
          <div class="grid grid-cols-7 border-b border-base-200">
            <div
              v-for="(weekday, index) in weekdayLabels"
              :key="weekday"
              class="cal-weekday"
              :class="{ 'is-weekend': index >= 5 }"
            >
              周{{ weekday }}
            </div>
          </div>
          <div class="grid grid-cols-7 gap-px bg-base-200">
            <button
              v-for="day in desktopDays"
              :key="day.key"
              type="button"
              class="cal-day"
              :class="{
                'is-outside': !day.currentMonth,
                'is-weekend': day.weekend,
                'is-selected': selectedDateKey === day.key,
              }"
              :aria-label="day.accessibleLabel"
              :aria-current="day.today ? 'date' : undefined"
              :aria-pressed="selectedDateKey === day.key"
              @click="selectDay(day)"
            >
              <span class="cal-day__top">
                <span class="cal-day__number num" :class="{ 'is-today': day.today }">{{ day.day }}</span>
                <span
                  v-if="day.preview?.entry.image && !failedAgendaImages.has(day.preview.entry.image)"
                  class="cal-day__art"
                  :class="{ 'is-event-logo': day.preview.entry.category === 'event', 'is-avatar': day.preview.entry.category === 'birthday' }"
                >
                  <AssetImage :src="day.preview.entry.image" class="block size-full" :class="day.preview.entry.category === 'event' ? 'object-contain' : 'object-cover'" @error="failedAgendaImages.add(day.preview.entry.image)" />
                </span>
                <span v-else-if="day.preview" class="cal-day__art is-icon" :class="categoryMeta[day.preview.entry.category].text" aria-hidden="true">
                  <component :is="categoryIcons[day.preview.entry.category]" class="size-4" />
                </span>
              </span>
              <span v-if="day.preview" class="cal-day__preview">
                <span class="cal-day__label" :class="isEnding(day.preview.entry) ? 'text-base-content/55' : categoryMeta[day.preview.entry.category].text">
                  <component :is="categoryIcons[day.preview.entry.category]" aria-hidden="true" class="size-3 shrink-0" />
                  <span class="truncate">{{ day.previewLabel }}</span>
                </span>
                <span class="cal-day__title" :title="day.preview.entry.title">
                  <ZhText :text="day.preview.entry.title" v-bind="SCHEDULE_ZH[day.preview.entry.category] || {}" layout="inline" />
                </span>
              </span>
              <span v-else-if="day.emptyLabel" class="cal-day__empty">
                <CalendarMinus aria-hidden="true" class="size-5" />
                <span>{{ day.emptyLabel }}</span>
              </span>
              <span v-if="day.preview && day.groups.length > 1" class="cal-day__more num">另有 {{ day.groups.length - 1 }} 项</span>
            </button>
          </div>
        </div>

        <!-- 手机：紧凑月历，每天用色点表示有哪几类日程，点一天在下面看详情 -->
        <div class="panel p-2 md:hidden">
          <div class="grid grid-cols-7 pb-1">
            <span v-for="weekday in weekdayLabels" :key="weekday" class="py-1 text-center text-[11px] font-semibold text-base-content/45">{{ weekday }}</span>
          </div>
          <div class="grid grid-cols-7 gap-y-0.5">
            <button
              v-for="day in calendarDays"
              :key="day.key"
              type="button"
              class="cal-cell"
              :class="{
                'is-outside': !day.currentMonth,
                'is-today': day.today,
                'is-selected': selectedDateKey === day.key,
              }"
              :aria-label="`${day.date.getMonth() + 1}月${day.day}日，${day.groups.length} 项日程`"
              :aria-pressed="selectedDateKey === day.key"
              @click="selectDay(day)"
            >
              <span class="cal-cell__num num">{{ day.day }}</span>
              <span class="cal-cell__dots" aria-hidden="true">
                <i v-for="category in day.categories" :key="category" :class="categoryMeta[category].dot"></i>
              </span>
            </button>
          </div>
        </div>

        <aside ref="detailPanelRef" class="card min-w-0 border border-base-200 bg-base-100" aria-labelledby="agenda-heading">
          <div class="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-base-200 px-4 py-3.5">
            <h2 id="agenda-heading" class="flex items-center gap-2 text-sm font-bold">
              <CalendarDays aria-hidden="true" class="size-4 shrink-0 text-primary" />
              <span>{{ selectedDateLabel }}</span>
            </h2>
            <span v-if="selectedGroups.length" class="num text-xs text-base-content/60">{{ selectedGroups.length }} 项日程</span>
          </div>
          <ul v-if="selectedGroups.length" :key="selectedDateKey" class="divide-y divide-base-200 px-4 xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain">
            <li v-for="group in selectedGroups" :key="group.entry.key" class="py-3">
              <component
                :is="group.entry.route ? 'RouterLink' : 'button'"
                :to="group.entry.route || undefined"
                :type="group.entry.route ? undefined : 'button'"
                class="group flex w-full items-start gap-3 text-left"
                @click="group.entry.route ? undefined : openLoginBonus(group.entry.loginBonusId)"
              >
                <span
                  v-if="group.entry.image && !failedAgendaImages.has(group.entry.image)"
                  class="cal-entry-art"
                  :class="{ 'is-event-logo': group.entry.category === 'event', 'is-avatar': group.entry.category === 'birthday' }"
                >
                  <AssetImage :src="group.entry.image" class="block size-full" :class="group.entry.category === 'event' ? 'object-contain' : 'object-cover'" @error="failedAgendaImages.add(group.entry.image)" />
                </span>
                <span v-else class="cal-entry-icon" :class="categoryMeta[group.entry.category].text">
                  <component :is="categoryIcons[group.entry.category]" aria-hidden="true" class="size-[1.125rem]" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
                    <span class="font-semibold" :class="isEnding(group.entry) ? 'text-base-content/60' : categoryMeta[group.entry.category].text">
                      {{ categoryMeta[group.entry.category].label }}<template v-if="group.entry.category !== 'birthday'"> · {{ group.entry.action }}</template>
                    </span>
                    <span v-if="group.times.length === 1" class="num text-base-content/65">{{ group.times[0] }}</span>
                  </span>
                  <span class="mt-1 block text-sm font-medium leading-snug wrap-anywhere group-hover:text-primary">
                    <ZhText :text="group.entry.title" v-bind="SCHEDULE_ZH[group.entry.category] || {}" sub-class="text-xs font-normal" />
                  </span>
                </span>
                <ChevronRight aria-hidden="true" class="mt-1 size-4 shrink-0 text-base-content/35 group-hover:text-primary" />
              </component>
              <details v-if="group.times.length > 1" class="cal-sessions mt-2">
                <summary class="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold hover:bg-base-200">
                  <ChevronDown aria-hidden="true" class="cal-sessions__chevron size-3.5" />
                  <span class="num">{{ group.times.length }} 场</span>
                  <span class="num font-normal text-base-content/65">{{ group.times[0] }} 起</span>
                </summary>
                <div class="mt-1.5 flex flex-wrap gap-1 px-2">
                  <span v-for="(time, index) in group.times" :key="index" class="cal-time num">{{ time }}</span>
                </div>
              </details>
            </li>
          </ul>
          <div v-else class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-base-content/65">
            <p>{{ agendaEmptyText }}</p>
            <button v-if="!isViewingToday" type="button" class="btn btn-ghost btn-sm text-primary" @click="goToday">返回今天</button>
          </div>
        </aside>
      </div>
    </template>

    <dialog ref="loginBonusDialog" class="modal" @close="onLoginBonusDialogClose">
      <div v-if="selectedLoginBonus" class="modal-box max-w-4xl p-0">
        <div class="relative h-20 overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20">
          <div class="absolute inset-0 grid place-items-center"><Gift class="h-10 w-10 text-primary/20" /></div>
          <button class="btn btn-circle btn-sm absolute! right-3 top-3 border-0 bg-base-100/85" aria-label="关闭" @click="closeLoginBonus"><X class="h-4 w-4" /></button>
        </div>
        <header class="relative -mt-5 space-y-2 border-b border-base-200 px-5 pb-4">
          <div class="flex flex-wrap items-center gap-2"><span class="badge badge-accent">登录活动</span><span class="badge badge-ghost">#{{ selectedLoginBonus.id }}</span><span class="badge badge-ghost">{{ selectedLoginBonus.limitedLoginBonusDetails?.length || 0 }} 天</span></div>
          <h2 class="text-lg font-bold md:text-xl"><ZhText :text="selectedLoginBonus.name" table="limitedLoginBonuses" path="name" sub-class="text-sm font-normal" /></h2>
          <p class="text-xs text-base-content/55">{{ formatDate(selectedLoginBonus.startAt) }} — {{ formatDate(selectedLoginBonus.endAt) }}</p>
        </header>
        <div class="max-h-[58vh] overflow-y-auto bg-base-200/40 p-4">
          <div v-if="rewardLoading" class="flex justify-center py-16"><span class="loading loading-spinner loading-lg text-primary"></span></div>
          <div v-else-if="rewardError" class="alert alert-error"><span>{{ rewardError }}</span><button class="btn btn-sm" @click="ensureRewardData">重试</button></div>
          <div v-else-if="selectedRewardDays.length" class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="day in selectedRewardDays" :key="`${selectedLoginBonus.id}-${day.day}`" class="rounded-xl border border-base-200 bg-base-100 p-3">
              <div class="mb-2 flex items-center justify-between"><span class="font-bold text-primary">Day {{ day.day }}</span><span class="text-[10px] text-base-content/35">Box #{{ day.boxId }}</span></div>
              <div v-if="day.rewards.length" class="space-y-2">
                <div v-for="reward in day.rewards" :key="`${reward.seq}-${reward.resourceType}-${reward.resourceId || 0}`" class="flex items-center gap-2">
                  <AssetImage v-if="resourceIcon(reward)" :src="resourceIcon(reward)" :alt="resourceName(reward)" class="h-9 w-9 shrink-0 object-contain" />
                  <div v-else class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10"><Gift class="h-4 w-4 text-primary" /></div>
                  <div class="min-w-0 flex-1"><p class="truncate text-xs" :title="resourceName(reward)"><ZhText :text="resourceName(reward)" :zh="resourceDisplayZh(reward.resourceType, resourceName(reward)) ?? null" layout="inline" /></p><p class="font-bold">× {{ formatNumber(reward.resourceQuantity) }}</p></div>
                </div>
              </div>
              <p v-else class="text-xs text-base-content/40">奖励箱数据缺失</p>
            </div>
          </div>
          <div v-else class="py-12 text-center text-sm text-base-content/40">该登录活动没有每日奖励记录</div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="closeLoginBonus">关闭</button></form>
    </dialog>
  </div>
</template>

<style scoped>
/* 月份切换：‹ 2026年11月 › */
.cal-month {
  display: inline-flex;
  align-items: center;
  height: 2.25rem;
  border: 1px solid var(--color-base-300);
  border-radius: 999px;
  background-color: var(--color-base-100);
}

.cal-month__btn {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 100%;
  border-radius: 999px;
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
}

.cal-month__btn:hover:not(:disabled) {
  background-color: color-mix(in oklab, var(--color-base-content) 7%, transparent);
  color: var(--color-base-content);
}

.cal-month__btn:disabled {
  opacity: 0.3;
}

.cal-month__label {
  min-width: 6.25rem;
  text-align: center;
  font-size: 0.9375rem;
  font-weight: 700;
}

/* 手机月历的一格：日期数字 + 一排分类色点 */
.cal-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1875rem;
  min-width: 0;
  padding: 0.25rem 0 0.3125rem;
  border-radius: var(--radius-field);
}

.cal-cell__num {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  font-size: 0.9375rem;
  font-weight: 600;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.cal-cell.is-outside .cal-cell__num {
  color: color-mix(in oklab, var(--color-base-content) 28%, transparent);
  font-weight: 500;
}

.cal-cell.is-outside .cal-cell__dots {
  opacity: 0.35;
}

.cal-cell.is-today .cal-cell__num {
  color: var(--color-primary);
  font-weight: 800;
  box-shadow: inset 0 0 0 1.5px var(--color-primary);
}

.cal-cell.is-selected .cal-cell__num {
  background-color: var(--color-primary);
  color: var(--color-primary-content);
  box-shadow: none;
}

.cal-cell__dots {
  display: flex;
  justify-content: center;
  gap: 2px;
  height: 0.3125rem;
}

.cal-cell__dots i {
  width: 0.3125rem;
  height: 0.3125rem;
  border-radius: 999px;
}

@media (min-width: 80rem) {
  .cal-layout {
    position: relative;
  }

  /* 月历决定网格行高，议程限制在同一行的右侧网格区域内。 */
  .cal-layout > aside {
    position: absolute;
    grid-area: 1 / 2 / 2 / 3;
    inset-block-start: 0;
    inset-inline: 0;
    max-height: 100%;
    overflow: hidden;
  }
}

.cal-month-surface {
  --calendar-weekend: color-mix(in oklab, var(--color-primary) 3%, var(--color-base-100));
}

.cal-weekday {
  padding: 0.625rem 0.375rem;
  color: color-mix(in oklab, var(--color-base-content) 68%, transparent);
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.cal-weekday.is-weekend {
  background-color: var(--calendar-weekend);
  color: var(--color-primary);
}

.cal-day {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 6.125rem;
  grid-template-rows: auto auto 1fr;
  gap: 0.25rem;
  padding: 0.5rem clamp(0.375rem, 0.9vw, 0.75rem);
  background-color: var(--color-base-100);
  text-align: start;
  transition: background-color 0.12s ease;
}

.cal-day.is-weekend {
  background-color: var(--calendar-weekend);
}

.cal-day.is-outside {
  background-color: color-mix(in oklab, var(--color-base-200) 48%, var(--color-base-100));
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

.cal-day:hover {
  background-color: color-mix(in oklab, var(--color-primary) 6%, var(--color-base-100));
}

.cal-day.is-selected {
  background-color: color-mix(in oklab, var(--color-primary) 10%, var(--color-base-100));
  box-shadow: inset 0 3px 0 var(--color-primary);
}

.cal-day:focus-visible {
  outline-offset: -2px;
}

.cal-day__top {
  display: flex;
  min-height: 1.75rem;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
}

.cal-day__number {
  display: grid;
  width: 1.625rem;
  height: 1.625rem;
  flex: none;
  place-items: center;
  border-radius: 50%;
  color: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
}

.cal-day__number.is-today {
  background-color: var(--color-primary);
  color: var(--color-primary-content);
  font-weight: 750;
}

.cal-day__art {
  width: 1.75rem;
  height: 1.75rem;
  min-width: 0;
  overflow: hidden;
  border-radius: var(--radius-field);
  background-color: var(--color-base-200);
}

.cal-day__art.is-icon {
  display: grid;
  place-items: center;
  background-color: color-mix(in oklab, currentColor 10%, transparent);
}

.cal-day__art.is-event-logo,
.cal-entry-art.is-event-logo {
  border-radius: 0;
  background-color: transparent;
}

.cal-day__art.is-event-logo {
  width: 3.25rem;
}

.cal-day__art.is-avatar {
  border-radius: 50%;
}

.cal-day__preview {
  display: grid;
  min-width: 0;
  gap: 0.125rem;
}

.cal-day__label {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.625rem;
  font-weight: 650;
  line-height: 0.875rem;
}

.cal-day__title {
  display: -webkit-box;
  min-width: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 0.75rem;
  font-weight: 580;
  line-height: 1rem;
}

.cal-day__empty {
  position: absolute;
  inset: 0;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 0.125rem;
  padding: 0.25rem;
  color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
  text-align: center;
  font-size: 0.75rem;
  line-height: 1rem;
}

.cal-day__more {
  align-self: end;
  color: color-mix(in oklab, var(--color-base-content) 62%, transparent);
  font-size: 0.625rem;
  line-height: 0.875rem;
}

.cal-entry-art,
.cal-entry-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  overflow: hidden;
  border-radius: var(--radius-field);
}

.cal-entry-art {
  background-color: var(--color-base-200);
}

.cal-entry-art.is-event-logo {
  width: 4rem;
  height: 2rem;
}

.cal-entry-art.is-avatar {
  border-radius: 50%;
}

.cal-entry-icon {
  background-color: color-mix(in oklab, currentColor 10%, transparent);
}

.cal-sessions > summary::-webkit-details-marker {
  display: none;
}

.cal-sessions[open] .cal-sessions__chevron {
  transform: rotate(180deg);
}

.cal-time {
  padding: 0.0625rem 0.375rem;
  border-radius: 0.375rem;
  background-color: color-mix(in oklab, var(--color-base-content) 7%, transparent);
  color: color-mix(in oklab, var(--color-base-content) 70%, transparent);
  font-size: 0.6875rem;
}
</style>
