<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, Calendar, CheckCircle2, ChevronRight, FastForward, Library, Play, RefreshCw, Search, Sparkles, X } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import AccountSelector from '@/components/AccountSelector.vue'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import StoryReader from '@/components/StoryReader.vue'
import { useAccountStore } from '@/stores/account'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import type { EventData } from '@/types/master'

interface StoryEpisode {
  id: number
  episodeNo: number
  episodeNoLabel?: string
  title: string
  assetbundleName: string
  scenarioId: string
  unitStoryEpisodeGroupId?: number
}

interface EventStory {
  id: number
  eventId: number
  outline?: string
  assetbundleName: string
  eventStoryEpisodes: StoryEpisode[]
}

interface EventStoryUnit {
  eventStoryId: number
  unit: string
  eventStoryUnitRelation: string
}

interface UnitStoryChapter {
  id: number
  unit: string
  chapterNo: number
  title: string
  assetbundleName: string
  episodes: StoryEpisode[]
}

interface UnitStory {
  unit: string
  seq: number
  chapters: UnitStoryChapter[]
}

interface UnitEpisodeGroup {
  id: number
  unit: string
  unitEpisodeCategory?: string
  outline?: string
  assetbundleName: string
}

interface SpecialStory {
  id: number
  seq: number
  title: string
  assetbundleName: string
  startAt: number
  endAt: number
  episodes: StoryEpisode[]
}

type StoryTab = 'event' | 'unit' | 'special'
type StoryKind = StoryTab
type EpisodeAccountStatus = 'read' | 'skipped' | 'unread' | 'unknown'

interface UserEpisodeStatus {
  storyType?: string
  episodeId?: number
  episode_id?: number
  status?: string
  isNotSkipped?: boolean
  is_not_skipped?: boolean
}

interface SelectedStory {
  kind: StoryKind
  id: number | string
  title: string
  outline?: string
  assetbundleName: string
  episodes: StoryEpisode[]
  unit?: string
  startAt?: number
}

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()

const events = ref<EventData[]>([])
const eventStories = ref<EventStory[]>([])
const eventStoryUnits = ref<EventStoryUnit[]>([])
const unitStories = ref<UnitStory[]>([])
const unitEpisodeGroups = ref<UnitEpisodeGroup[]>([])
const specialStories = ref<SpecialStory[]>([])
const isLoading = ref(true)
const loadError = ref('')

const searchQuery = ref('')
const episodeSearch = ref('')
const selectedUnit = ref('')
const eventPage = ref(1)
const specialPage = ref(1)
const selectedStory = ref<SelectedStory | null>(null)
const selectedEpisode = ref<StoryEpisode | null>(null)
const refreshError = ref('')
const pageSize = 12
const now = Date.now()

const unitOptions = [
  { value: 'light_sound', label: 'Leo/need', logo: '/img/logo/logo_light_sound.png' },
  { value: 'idol', label: 'MORE MORE JUMP!', logo: '/img/logo/logo_idol.png' },
  { value: 'street', label: 'Vivid BAD SQUAD', logo: '/img/logo/logo_street.png' },
  { value: 'theme_park', label: 'Wonderlands×Showtime', logo: '/img/logo/logo_theme_park.png' },
  { value: 'school_refusal', label: '25时、Nightcord见。', logo: '/img/logo/logo_school_refusal.png' },
  { value: 'piapro', label: 'VIRTUAL SINGER', logo: '/img/logo/logo_piapro.png' },
]

const assetsHost = computed(() => settingsStore.assetsHost)
const activeTab = computed<StoryTab>(() => {
  if (route.query.tab === 'unit') return 'unit'
  if (route.query.tab === 'special') return 'special'
  return 'event'
})
const eventMap = computed(() => new Map(events.value.map(event => [event.id, event])))
const unitEpisodeGroupMap = computed(() => new Map(unitEpisodeGroups.value.map(group => [group.id, group])))
const suiteData = computed<any | null>(() => accountStore.currentUserId
  ? accountStore.getSuiteCache(accountStore.currentUserId)
  : null)

function suiteRows(...keys: string[]): UserEpisodeStatus[] | null {
  for (const key of keys) {
    const rows = suiteData.value?.[key]
    if (Array.isArray(rows)) return rows
  }
  return null
}

const unitEpisodeStatusRows = computed(() => suiteRows('userUnitEpisodeStatuses', 'user_unit_episode_statuses'))
const specialEpisodeStatusRows = computed(() => suiteRows('userSpecialEpisodeStatuses', 'user_special_episode_statuses'))
const eventEpisodeStatusRows = computed(() => suiteRows('userEventEpisodeStatuses', 'user_event_episode_statuses'))
const archiveEventEpisodeStatusRows = computed(() => suiteRows('userArchiveEventEpisodeStatuses', 'user_archive_event_episode_statuses'))
const hasAnyStoryStatusData = computed(() => [
  unitEpisodeStatusRows.value,
  specialEpisodeStatusRows.value,
  eventEpisodeStatusRows.value,
  archiveEventEpisodeStatusRows.value,
].some(rows => rows !== null))

function rowsForStoryKind(kind: StoryKind): UserEpisodeStatus[] | null {
  if (kind === 'unit') return unitEpisodeStatusRows.value
  if (kind === 'special') return specialEpisodeStatusRows.value
  const sources = [eventEpisodeStatusRows.value, archiveEventEpisodeStatusRows.value]
  if (sources.every(rows => rows === null)) return null
  return sources.flatMap(rows => rows || [])
}

function episodeStatusMap(kind: StoryKind): Map<number, EpisodeAccountStatus> | null {
  const rows = rowsForStoryKind(kind)
  if (rows === null) return null
  const map = new Map<number, EpisodeAccountStatus>()
  for (const row of rows) {
    const episodeId = Number(row.episodeId ?? row.episode_id)
    if (!Number.isFinite(episodeId) || row.status !== 'already_read') continue
    const isNotSkipped = row.isNotSkipped ?? row.is_not_skipped ?? false
    const status: EpisodeAccountStatus = isNotSkipped ? 'read' : 'skipped'
    if (status === 'read' || map.get(episodeId) !== 'read') map.set(episodeId, status)
  }
  return map
}

const episodeStatusMaps = computed(() => ({
  event: episodeStatusMap('event'),
  unit: episodeStatusMap('unit'),
  special: episodeStatusMap('special'),
}))

const storyStats = computed(() => ({
  events: eventStories.value.length,
  unitChapters: unitStories.value.reduce((sum, story) => sum + story.chapters.length, 0),
  special: specialStories.value.length,
  episodes: eventStories.value.reduce((sum, story) => sum + story.eventStoryEpisodes.length, 0)
    + unitStories.value.reduce((sum, story) => sum + story.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.episodes.length, 0), 0)
    + specialStories.value.reduce((sum, story) => sum + story.episodes.length, 0),
}))

const mainUnitByEventStory = computed(() => {
  const map = new Map<number, string>()
  for (const item of eventStoryUnits.value) {
    if (item.eventStoryUnitRelation === 'main' || !map.has(item.eventStoryId)) map.set(item.eventStoryId, item.unit)
  }
  return map
})

const filteredEventStories = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return eventStories.value
    .filter(story => settingsStore.showSpoilers || (eventMap.value.get(story.eventId)?.startAt || 0) <= now)
    .filter(story => !selectedUnit.value || mainUnitByEventStory.value.get(story.id) === selectedUnit.value)
    .filter(story => {
      if (!query) return true
      const event = eventMap.value.get(story.eventId)
      return [story.id, event?.name, story.outline, ...story.eventStoryEpisodes.map(episode => episode.title)]
        .some(value => String(value || '').toLocaleLowerCase().includes(query))
    })
    .sort((a, b) => b.eventId - a.eventId)
})

const eventTotalPages = computed(() => Math.max(1, Math.ceil(filteredEventStories.value.length / pageSize)))
const paginatedEventStories = computed(() => filteredEventStories.value.slice((eventPage.value - 1) * pageSize, eventPage.value * pageSize))

const flattenedUnitChapters = computed(() => unitStories.value
  .flatMap(story => story.chapters.map(chapter => ({ ...chapter, unit: story.unit })))
  .filter(chapter => !selectedUnit.value || chapter.unit === selectedUnit.value)
  .filter(chapter => {
    const query = searchQuery.value.trim().toLocaleLowerCase()
    if (!query) return true
    return [chapter.title, getUnitLabel(chapter.unit), ...chapter.episodes.map(episode => episode.title)]
      .some(value => String(value || '').toLocaleLowerCase().includes(query))
  })
  .sort((a, b) => unitOrder(a.unit) - unitOrder(b.unit) || a.chapterNo - b.chapterNo))

const filteredSpecialStories = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return specialStories.value
    .filter(story => settingsStore.showSpoilers || story.startAt <= now)
    .filter(story => {
      if (!query) return true
      return [story.id, story.title, ...story.episodes.map(episode => episode.title)]
        .some(value => String(value || '').toLocaleLowerCase().includes(query))
    })
    .sort((a, b) => b.startAt - a.startAt || b.id - a.id)
})

const specialTotalPages = computed(() => Math.max(1, Math.ceil(filteredSpecialStories.value.length / pageSize)))
const paginatedSpecialStories = computed(() => filteredSpecialStories.value.slice((specialPage.value - 1) * pageSize, specialPage.value * pageSize))

const scenarioUrls = computed(() => {
  if (!selectedStory.value || !selectedEpisode.value) return []
  const host = String(assetsHost.value).replace(/\/+$/, '')
  const episode = selectedEpisode.value
  const story = selectedStory.value
  if (story.kind === 'event') {
    return [`${host}/ondemand/event_story/${story.assetbundleName}/scenario/${episode.scenarioId}.json`]
  }
  if (story.kind === 'unit') {
    return [`${host}/startapp/scenario/unitstory/${story.assetbundleName}/${episode.scenarioId}.json`]
  }
  return [
    `${host}/startapp/scenario/special/${episode.assetbundleName}/${episode.scenarioId}.json`,
    `${host}/startapp/scenario/special/${story.assetbundleName}/${episode.scenarioId}.json`,
  ]
})

const selectedEpisodeImageUrl = computed(() => {
  if (selectedStory.value?.kind !== 'event' || !selectedEpisode.value) return undefined
  return `${assetsHost.value}/ondemand/event_story/${selectedStory.value.assetbundleName}/episode_image/${selectedEpisode.value.assetbundleName}.png`
})

const selectedStoryBannerUrl = computed(() => selectedStory.value?.kind === 'event'
  ? `${assetsHost.value}/startapp/home/banner/${selectedStory.value.assetbundleName}/${selectedStory.value.assetbundleName}.png`
  : '')

const selectedStoryEpisodes = computed(() => {
  if (!selectedStory.value) return []
  const query = episodeSearch.value.trim().toLocaleLowerCase()
  if (!query) return selectedStory.value.episodes
  return selectedStory.value.episodes.filter(episode => [
    episode.episodeNo,
    episode.episodeNoLabel,
    episode.title,
    episode.scenarioId,
  ].some(value => String(value || '').toLocaleLowerCase().includes(query)))
})

const selectedEpisodeIndex = computed(() => {
  if (!selectedStory.value || !selectedEpisode.value) return -1
  return selectedStory.value.episodes.findIndex(episode => episode.id === selectedEpisode.value?.id)
})

const selectedStoryProgress = computed(() => selectedStory.value
  ? storyProgress(selectedStory.value.kind, selectedStory.value.episodes)
  : { available: false, read: 0, skipped: 0, unread: 0, total: 0 })

watch([searchQuery, selectedUnit], () => {
  eventPage.value = 1
  specialPage.value = 1
})
watch(eventTotalPages, total => { eventPage.value = Math.min(eventPage.value, total) })
watch(specialTotalPages, total => { specialPage.value = Math.min(specialPage.value, total) })

function unitOrder(unit: string): number {
  const index = unitOptions.findIndex(option => option.value === unit)
  return index < 0 ? 99 : index
}

function getUnitLabel(unit?: string): string {
  return unitOptions.find(option => option.value === unit)?.label || unit || '其他'
}

function getUnitLogo(unit?: string): string {
  return unitOptions.find(option => option.value === unit)?.logo || ''
}

function setTab(tab: StoryTab) {
  searchQuery.value = ''
  selectedUnit.value = ''
  const query: Record<string, string> = {}
  if (tab !== 'event') query.tab = tab
  void router.replace({ query })
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function eventBanner(story: EventStory): string {
  return `${assetsHost.value}/startapp/home/banner/${story.assetbundleName}/${story.assetbundleName}.png`
}

function unitChapterOutline(chapter: UnitStoryChapter): string {
  const groupId = chapter.episodes[0]?.unitStoryEpisodeGroupId
  return groupId ? unitEpisodeGroupMap.value.get(groupId)?.outline || '' : ''
}

function getEpisodeAccountStatus(kind: StoryKind, episodeId: number): EpisodeAccountStatus {
  const map = episodeStatusMaps.value[kind]
  if (map === null) return 'unknown'
  return map.get(episodeId) || 'unread'
}

function storyProgress(kind: StoryKind, episodes: StoryEpisode[]) {
  const available = episodeStatusMaps.value[kind] !== null
  let read = 0
  let skipped = 0
  for (const episode of episodes) {
    const status = getEpisodeAccountStatus(kind, episode.id)
    if (status === 'read') read += 1
    else if (status === 'skipped') skipped += 1
  }
  return { available, read, skipped, unread: Math.max(0, episodes.length - read - skipped), total: episodes.length }
}

function progressWidth(value: number, total: number): string {
  return total > 0 ? `${(value / total) * 100}%` : '0%'
}

async function handleSuiteRefresh() {
  if (!accountStore.currentUserId) return
  refreshError.value = ''
  try {
    await accountStore.refreshSuite(accountStore.currentUserId)
  } catch (error) {
    refreshError.value = error instanceof Error ? error.message : 'Suite 更新失败'
  }
}

function openEpisode(episode: StoryEpisode) {
  selectedEpisode.value = episode
}

function navigateEpisode(offset: number) {
  if (!selectedStory.value) return
  const nextEpisode = selectedStory.value.episodes[selectedEpisodeIndex.value + offset]
  if (nextEpisode) openEpisode(nextEpisode)
}

function openEventStory(story: EventStory) {
  const event = eventMap.value.get(story.eventId)
  selectedStory.value = {
    kind: 'event', id: story.id, title: event?.name || `活动故事 #${story.id}`,
    outline: story.outline, assetbundleName: story.assetbundleName,
    episodes: story.eventStoryEpisodes, unit: mainUnitByEventStory.value.get(story.id), startAt: event?.startAt,
  }
}

function openUnitChapter(chapter: UnitStoryChapter) {
  const firstEpisode = chapter.episodes[0]
  const group = firstEpisode?.unitStoryEpisodeGroupId
    ? unitEpisodeGroupMap.value.get(firstEpisode.unitStoryEpisodeGroupId)
    : undefined
  selectedStory.value = {
    kind: 'unit', id: chapter.id, title: chapter.title,
    outline: group?.outline, assetbundleName: chapter.assetbundleName,
    episodes: chapter.episodes, unit: chapter.unit,
  }
}

function openSpecialStory(story: SpecialStory) {
  selectedStory.value = {
    kind: 'special', id: story.id, title: story.title,
    assetbundleName: story.assetbundleName, episodes: story.episodes, startAt: story.startAt,
  }
}

function closeStory() {
  selectedEpisode.value = null
  selectedStory.value = null
  episodeSearch.value = ''
}

onMounted(async () => {
  try {
    const [eventData, eventStoryData, eventUnitData, unitStoryData, groupData, specialData] = await Promise.all([
      masterStore.getMaster<EventData>('events'),
      masterStore.getMaster<EventStory>('eventStories'),
      masterStore.getMaster<EventStoryUnit>('eventStoryUnits'),
      masterStore.getMaster<UnitStory>('unitStories'),
      masterStore.getMaster<UnitEpisodeGroup>('unitStoryEpisodeGroups'),
      masterStore.getMaster<SpecialStory>('specialStories'),
    ])
    events.value = eventData
    eventStories.value = eventStoryData
    eventStoryUnits.value = eventUnitData
    unitStories.value = unitStoryData
    unitEpisodeGroups.value = groupData
    specialStories.value = specialData
  } catch (error) {
    console.error('加载故事数据失败:', error)
    loadError.value = error instanceof Error ? error.message : 'Master 数据加载失败'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <PageHeader title="故事档案" description="活动、组合主线与特殊故事的统一目录，支持剧本阅读、台词搜索和账号阅读状态。"><template #icon><BookOpen class="w-8 h-8 text-primary" /></template></PageHeader>

    <section class="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div class="rounded-xl bg-base-100 border border-base-200 px-3 py-2"><p class="text-[11px] text-base-content/45">活动故事</p><p class="font-bold text-lg">{{ storyStats.events }}</p></div>
      <div class="rounded-xl bg-base-100 border border-base-200 px-3 py-2"><p class="text-[11px] text-base-content/45">主线章节</p><p class="font-bold text-lg">{{ storyStats.unitChapters }}</p></div>
      <div class="rounded-xl bg-base-100 border border-base-200 px-3 py-2"><p class="text-[11px] text-base-content/45">特殊故事</p><p class="font-bold text-lg">{{ storyStats.special }}</p></div>
      <div class="rounded-xl bg-base-100 border border-base-200 px-3 py-2"><p class="text-[11px] text-base-content/45">收录话数</p><p class="font-bold text-lg text-primary">{{ storyStats.episodes }}</p></div>
    </section>

    <div role="tablist" class="tabs tabs-box bg-base-100 border border-base-200 w-full sm:w-fit p-1">
      <button role="tab" class="tab flex-1 sm:flex-none gap-1.5" :class="{ 'tab-active': activeTab === 'event' }" @click="setTab('event')"><Sparkles class="w-4 h-4" />活动 <span class="hidden sm:inline">{{ storyStats.events }}</span></button>
      <button role="tab" class="tab flex-1 sm:flex-none gap-1.5" :class="{ 'tab-active': activeTab === 'unit' }" @click="setTab('unit')"><Library class="w-4 h-4" />主线 <span class="hidden sm:inline">{{ storyStats.unitChapters }}</span></button>
      <button role="tab" class="tab flex-1 sm:flex-none gap-1.5" :class="{ 'tab-active': activeTab === 'special' }" @click="setTab('special')"><BookOpen class="w-4 h-4" />特殊 <span class="hidden sm:inline">{{ storyStats.special }}</span></button>
    </div>

    <section class="card bg-base-100 border border-base-200 shadow-sm">
      <div class="card-body p-3 md:p-4 grid md:grid-cols-[minmax(0,1fr)_240px] gap-3">
        <label class="input input-bordered flex items-center gap-2">
          <Search class="w-4 h-4 opacity-50" /><input v-model="searchQuery" class="grow min-w-0" placeholder="搜索故事或章节标题…" />
          <button v-if="searchQuery" class="btn btn-xs btn-circle btn-ghost" aria-label="清空" @click="searchQuery = ''"><X class="w-3 h-3" /></button>
        </label>
        <select v-if="activeTab !== 'special'" v-model="selectedUnit" class="select select-bordered w-full">
          <option value="">全部组合</option>
          <option v-for="unit in unitOptions" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
        </select>
        <div class="md:col-span-2 flex flex-wrap items-center gap-2 border-t border-base-200 pt-3">
          <div v-if="accountStore.accounts.length" class="w-full sm:w-56">
            <AccountSelector :model-value="accountStore.currentUserId" @update:model-value="accountStore.selectAccount" />
          </div>
          <span v-else class="text-xs text-base-content/55">绑定账号后可查看游戏内阅读状态</span>
          <button v-if="accountStore.currentUserId" class="btn btn-xs btn-ghost gap-1" :disabled="accountStore.suiteRefreshing" @click="handleSuiteRefresh">
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': accountStore.suiteRefreshing }" />刷新 Suite
          </button>
          <span v-if="refreshError" class="text-xs text-error">{{ refreshError }}</span>
          <span v-else-if="accountStore.currentUserId && !hasAnyStoryStatusData" class="text-xs text-warning">当前 Suite API 未返回故事阅读字段，因此暂时无法展示账号状态</span>
          <span v-else-if="hasAnyStoryStatusData" class="text-xs text-base-content/55"><span class="text-success">绿色为读完</span>，<span class="text-warning">黄色为跳过</span></span>
          <p class="w-full text-xs text-base-content/45">本站打开故事不会记录或修改进度；页面状态只来自游戏账号 Suite。</p>
        </div>
      </div>
    </section>

    <div v-if="isLoading" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4"><div v-for="index in 12" :key="index" class="skeleton h-56 rounded-xl"></div></div>
    <div v-else-if="loadError" class="alert alert-error">故事数据加载失败：{{ loadError }}</div>

    <template v-else-if="activeTab === 'event'">
      <div class="flex items-center justify-between gap-3"><p class="text-sm font-medium">{{ filteredEventStories.length }} 个活动故事</p><span class="text-xs text-base-content/45">按活动时间从新到旧</span></div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button v-for="story in paginatedEventStories" :key="story.id" class="group card bg-base-100 border border-base-200 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden text-left" @click="openEventStory(story)">
          <figure class="relative aspect-[122/52] bg-base-200 overflow-hidden"><AssetImage :src="eventBanner(story)" :alt="eventMap.get(story.eventId)?.name" class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" /><span class="absolute top-2 right-2 badge badge-sm border-0 bg-base-100/90 text-base-content shadow-sm"><Play class="w-3 h-3" /> 可阅读</span></figure>
          <div class="card-body p-4 gap-2.5">
            <div class="flex items-center justify-between gap-2"><img v-if="getUnitLogo(mainUnitByEventStory.get(story.id))" :src="getUnitLogo(mainUnitByEventStory.get(story.id))" class="h-5 max-w-24 object-contain object-left" /><span class="text-[11px] text-base-content/45">{{ formatDate(eventMap.get(story.eventId)?.startAt) }}</span></div>
            <h2 class="font-bold line-clamp-2 leading-5">{{ eventMap.get(story.eventId)?.name || `活动故事 #${story.id}` }}</h2>
            <p class="text-xs leading-5 text-base-content/55 line-clamp-2 min-h-10">{{ story.outline }}</p>
            <div v-if="storyProgress('event', story.eventStoryEpisodes).available" class="flex items-center gap-2 pt-1">
              <div class="flex h-1.5 flex-1 overflow-hidden rounded-full bg-base-200"><span class="bg-success" :style="{ width: progressWidth(storyProgress('event', story.eventStoryEpisodes).read, story.eventStoryEpisodes.length) }"></span><span class="bg-warning" :style="{ width: progressWidth(storyProgress('event', story.eventStoryEpisodes).skipped, story.eventStoryEpisodes.length) }"></span></div>
              <span class="text-[11px] text-base-content/50 whitespace-nowrap">{{ storyProgress('event', story.eventStoryEpisodes).read }} 读完 · {{ storyProgress('event', story.eventStoryEpisodes).skipped }} 跳过</span>
            </div>
            <p v-else class="text-[11px] text-base-content/40 pt-1">共 {{ story.eventStoryEpisodes.length }} 话</p>
          </div>
        </button>
      </div>
      <Pagination v-if="eventTotalPages > 1" :current-page="eventPage" :total-pages="eventTotalPages" base-url="/stories" @page-change="eventPage = $event" />
    </template>

    <template v-else-if="activeTab === 'unit'">
      <p class="text-sm font-medium">{{ flattenedUnitChapters.length }} 个主线章节</p>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button v-for="chapter in flattenedUnitChapters" :key="chapter.id" class="group card bg-base-100 border border-base-200 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left overflow-hidden" @click="openUnitChapter(chapter)">
          <div class="h-1.5 bg-primary/70"></div><div class="card-body p-5 gap-3">
            <div class="flex items-center justify-between gap-3"><img :src="getUnitLogo(chapter.unit)" :alt="getUnitLabel(chapter.unit)" class="h-8 max-w-40 object-contain object-left" /><span class="badge badge-sm badge-ghost">Chapter {{ chapter.chapterNo }}</span></div>
            <h2 class="font-bold leading-5">{{ chapter.title }}</h2>
            <p class="text-xs leading-5 text-base-content/55 line-clamp-3 min-h-[3.75rem]">{{ unitChapterOutline(chapter) || `${getUnitLabel(chapter.unit)} 的组合主线故事。` }}</p>
            <div v-if="storyProgress('unit', chapter.episodes).available" class="flex items-center gap-2">
              <div class="flex h-1.5 flex-1 overflow-hidden rounded-full bg-base-200"><span class="bg-success" :style="{ width: progressWidth(storyProgress('unit', chapter.episodes).read, chapter.episodes.length) }"></span><span class="bg-warning" :style="{ width: progressWidth(storyProgress('unit', chapter.episodes).skipped, chapter.episodes.length) }"></span></div>
              <span class="text-[11px] text-base-content/50">{{ storyProgress('unit', chapter.episodes).read }} 读完 · {{ storyProgress('unit', chapter.episodes).skipped }} 跳过</span><ChevronRight class="w-4 h-4 opacity-40 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div v-else class="flex items-center gap-2 text-[11px] text-base-content/40"><span class="flex-1">共 {{ chapter.episodes.length }} 话</span><ChevronRight class="w-4 h-4 opacity-40 group-hover:translate-x-0.5 transition-transform" /></div>
          </div>
        </button>
      </div>
    </template>

    <template v-else>
      <p class="text-sm font-medium">{{ filteredSpecialStories.length }} 个特殊故事</p>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button v-for="story in paginatedSpecialStories" :key="story.id" class="group card bg-base-100 border border-base-200 hover:border-secondary/30 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left overflow-hidden" @click="openSpecialStory(story)">
          <div class="h-1.5 bg-secondary/70"></div><div class="card-body p-5 gap-3">
            <div class="flex justify-between gap-3"><span class="badge badge-secondary badge-outline badge-sm">特殊故事</span><span class="text-xs text-base-content/45">#{{ story.id }}</span></div>
            <h2 class="font-bold line-clamp-2 leading-5 min-h-10">{{ story.title }}</h2>
            <p class="text-xs text-base-content/55 flex items-center gap-2"><Calendar class="w-4 h-4" />{{ formatDate(story.startAt) }}</p>
            <div v-if="storyProgress('special', story.episodes).available" class="flex items-center gap-2">
              <div class="flex h-1.5 flex-1 overflow-hidden rounded-full bg-base-200"><span class="bg-success" :style="{ width: progressWidth(storyProgress('special', story.episodes).read, story.episodes.length) }"></span><span class="bg-warning" :style="{ width: progressWidth(storyProgress('special', story.episodes).skipped, story.episodes.length) }"></span></div>
              <span class="text-[11px] text-base-content/50">{{ storyProgress('special', story.episodes).read }} 读完 · {{ storyProgress('special', story.episodes).skipped }} 跳过</span><ChevronRight class="w-4 h-4 opacity-40 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div v-else class="flex items-center gap-2 text-[11px] text-base-content/40"><span class="flex-1">共 {{ story.episodes.length }} 话</span><ChevronRight class="w-4 h-4 opacity-40 group-hover:translate-x-0.5 transition-transform" /></div>
          </div>
        </button>
      </div>
      <Pagination v-if="specialTotalPages > 1" :current-page="specialPage" :total-pages="specialTotalPages" base-url="/stories?tab=special" @page-change="specialPage = $event" />
    </template>

    <dialog class="modal" :class="{ 'modal-open': selectedStory }">
      <div v-if="selectedStory" class="modal-box p-0" :class="selectedEpisode ? 'max-w-5xl' : 'max-w-3xl'">
        <StoryReader
          v-if="selectedEpisode"
          :key="selectedEpisode.id"
          :title="selectedEpisode.title"
          :episode-label="selectedEpisode.episodeNoLabel || `第 ${selectedEpisode.episodeNo} 话`"
          :scenario-id="selectedEpisode.scenarioId"
          :scenario-urls="scenarioUrls"
          :episode-image-url="selectedEpisodeImageUrl"
          :has-previous="selectedEpisodeIndex > 0"
          :has-next="selectedStory ? selectedEpisodeIndex < selectedStory.episodes.length - 1 : false"
          @close="selectedEpisode = null"
          @previous="navigateEpisode(-1)"
          @next="navigateEpisode(1)"
        />
        <template v-else>
          <div v-if="selectedStoryBannerUrl" class="relative aspect-[122/36] max-h-48 overflow-hidden bg-base-200"><AssetImage :src="selectedStoryBannerUrl" :alt="selectedStory.title" class="w-full h-full object-cover" /><div class="absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-transparent"></div></div>
          <header class="p-5 border-b border-base-200 flex items-start gap-3" :class="selectedStoryBannerUrl ? '-mt-8 relative z-10 pt-0' : ''">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <span class="badge badge-primary">{{ selectedStory.kind === 'event' ? '活动故事' : selectedStory.kind === 'unit' ? '组合主线' : '特殊故事' }}</span>
                <span v-if="selectedStory.unit" class="badge badge-ghost">{{ getUnitLabel(selectedStory.unit) }}</span>
                <template v-if="selectedStoryProgress.available"><span class="badge badge-success badge-outline">读完 {{ selectedStoryProgress.read }}</span><span class="badge badge-warning badge-outline">跳过 {{ selectedStoryProgress.skipped }}</span><span class="badge badge-ghost">未读 {{ selectedStoryProgress.unread }}</span></template>
              </div>
              <h2 class="font-bold text-xl">{{ selectedStory.title }}</h2>
              <p v-if="selectedStory.outline" class="text-sm leading-6 text-base-content/65 mt-2 whitespace-pre-line">{{ selectedStory.outline }}</p>
            </div>
            <button class="btn btn-sm btn-circle btn-ghost" aria-label="关闭" @click="closeStory"><X class="w-4 h-4" /></button>
          </header>
          <div class="p-4 border-b border-base-200 bg-base-100"><label class="input input-sm input-bordered flex items-center gap-2"><Search class="w-4 h-4 opacity-40" /><input v-model="episodeSearch" class="grow" placeholder="搜索本篇章节标题或剧本 ID…" /><button v-if="episodeSearch" class="btn btn-xs btn-circle btn-ghost" @click="episodeSearch = ''"><X class="w-3 h-3" /></button></label></div>
          <div class="p-3 md:p-4 max-h-[58vh] overflow-y-auto space-y-2 bg-base-200/50">
            <button v-for="episode in selectedStoryEpisodes" :key="episode.id" class="group w-full flex items-center gap-3 bg-base-100 border border-base-200 rounded-xl p-3 text-left hover:border-primary/50 hover:shadow-sm transition-all" @click="openEpisode(episode)">
              <span class="grid w-10 h-10 place-items-center rounded-lg shrink-0" :class="getEpisodeAccountStatus(selectedStory.kind, episode.id) === 'read' ? 'bg-success/10 text-success' : getEpisodeAccountStatus(selectedStory.kind, episode.id) === 'skipped' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'"><CheckCircle2 v-if="getEpisodeAccountStatus(selectedStory.kind, episode.id) === 'read'" class="w-5 h-5" /><FastForward v-else-if="getEpisodeAccountStatus(selectedStory.kind, episode.id) === 'skipped'" class="w-5 h-5" /><Play v-else class="w-4 h-4" /></span>
              <span class="min-w-0 flex-1"><span class="text-[11px] text-base-content/45">{{ episode.episodeNoLabel || `第 ${episode.episodeNo} 话` }} · {{ episode.scenarioId }}</span><span class="font-medium block truncate">{{ episode.title }}</span></span>
              <span v-if="getEpisodeAccountStatus(selectedStory.kind, episode.id) === 'read'" class="badge badge-success badge-outline badge-xs">读完</span>
              <span v-else-if="getEpisodeAccountStatus(selectedStory.kind, episode.id) === 'skipped'" class="badge badge-warning badge-outline badge-xs">跳过</span>
              <span v-else-if="getEpisodeAccountStatus(selectedStory.kind, episode.id) === 'unread'" class="badge badge-ghost badge-xs">未读</span>
              <ChevronRight class="w-4 h-4 shrink-0 opacity-40 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <div v-if="selectedStoryEpisodes.length === 0" class="py-16 text-center text-sm text-base-content/45">没有匹配的章节</div>
          </div>
        </template>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="closeStory">关闭</button></form>
    </dialog>
  </div>
</template>
