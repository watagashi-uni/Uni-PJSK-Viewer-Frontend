<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, ChevronRight, Library, Play, Search, Sparkles, X } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import StoryReader from '@/components/StoryReader.vue'
import { loadStoryMedia, storyAssetHost } from '@/utils/storyPlayback'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import type { EventData } from '@/types/master'
import { readQueryPage, readQueryString, replaceListQuery } from '@/utils/routeQuery'

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

type StoryTab = 'event' | 'unit' | 'card' | 'special'
type StoryKind = StoryTab
interface SpecialStory { id: number; title: string; startAt: number; assetbundleName: string; episodes: StoryEpisode[] }
interface StoryCard { id: number; prefix: string; characterId: number; releaseAt: number; assetbundleName: string }
interface CardEpisode extends Omit<StoryEpisode, 'episodeNo'> { cardId: number; cardEpisodePartType: string }
const specialStories = ref<SpecialStory[]>([])
const storyCards = ref<StoryCard[]>([])
const cardEpisodes = ref<CardEpisode[]>([])
const extraLoading = ref(false)
const extraError = ref('')
const extraPage = ref(1)
const extraLabels = { card: '卡面故事', special: '特别篇' } as const

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

const events = ref<EventData[]>([])
const eventStories = ref<EventStory[]>([])
const eventStoryUnits = ref<EventStoryUnit[]>([])
const unitStories = ref<UnitStory[]>([])
const unitEpisodeGroups = ref<UnitEpisodeGroup[]>([])
const isLoading = ref(true)
const loadError = ref('')

// 搜索、团体与页码写在 URL 里，离开再返回时保持不变
const searchQuery = ref(readQueryString(route.query, 'q'))
const episodeSearch = ref('')
const selectedUnit = ref(readQueryString(route.query, 'unit'))
const eventPage = ref(readQueryPage(route.query))

function handleEventPageChange(page: number) {
  eventPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const selectedStory = ref<SelectedStory | null>(null)
const selectedEpisode = ref<StoryEpisode | null>(null)
const storyDialog = ref<HTMLDialogElement | null>(null)
watch(selectedStory, story => {
  if (story && !storyDialog.value?.open) storyDialog.value?.showModal()
  if (!story && storyDialog.value?.open) storyDialog.value.close()
}, { flush: 'post' })
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

const assetsHost = computed(() => storyAssetHost)
const activeTab = computed<StoryTab>(() => {
  if (['unit', 'card', 'special'].includes(String(route.query.tab))) return route.query.tab as StoryTab
  return 'event'
})
const eventMap = computed(() => new Map(events.value.map(event => [event.id, event])))
const unitEpisodeGroupMap = computed(() => new Map(unitEpisodeGroups.value.map(group => [group.id, group])))

const storyStats = computed(() => ({
  events: eventStories.value.length,
  unitChapters: unitStories.value.reduce((sum, story) => sum + story.chapters.length, 0),
  episodes: eventStories.value.reduce((sum, story) => sum + story.eventStoryEpisodes.length, 0)
    + unitStories.value.reduce((sum, story) => sum + story.chapters.reduce((chapterSum, chapter) => chapterSum + chapter.episodes.length, 0), 0),
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
  if (story.kind === 'card') return [`${host}/startapp/character/member/${story.assetbundleName}/${episode.scenarioId}.json`]
  if (story.kind === 'special') return [`${host}/startapp/scenario/special/${story.assetbundleName}/${episode.scenarioId}.json`]
  return []
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

watch([searchQuery, selectedUnit], () => {
  eventPage.value = 1
  extraPage.value = 1
})
const extraStories = computed<SelectedStory[]>(() => {
  const items: SelectedStory[] = activeTab.value === 'card'
    ? storyCards.value.filter(card => settingsStore.showSpoilers || card.releaseAt <= now).map(card => ({
      kind: 'card', id: card.id, title: card.prefix, assetbundleName: card.assetbundleName,
      episodes: cardEpisodes.value.filter(episode => episode.cardId === card.id).map((episode, i) => ({ ...episode, episodeNo: i + 1 })),
    }))
    : specialStories.value.filter(story => settingsStore.showSpoilers || story.startAt <= now).map(story => ({ ...story, kind: 'special' as const }))
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return items.filter(story => story.episodes.length && (!query || `${story.id} ${story.title} ${story.episodes.map(e => e.title).join(' ')}`.toLocaleLowerCase().includes(query))).reverse()
})
let extraRequest: Promise<void> | null = null
async function loadExtra() {
  if (!['card', 'special'].includes(activeTab.value)) return
  if (extraRequest) { await extraRequest; return loadExtra() }
  if (activeTab.value === 'card' && storyCards.value.length || activeTab.value === 'special' && specialStories.value.length) return
  const tab = activeTab.value
  extraLoading.value = true; extraError.value = ''
  extraRequest = (async () => {
    try {
      if (tab === 'card') {
        const [cards, episodes] = await Promise.all([masterStore.getMaster<StoryCard>('cards'), masterStore.getMaster<CardEpisode>('cardEpisodes')])
        storyCards.value = cards; cardEpisodes.value = episodes
      } else {
        const [stories, media] = await Promise.all([masterStore.getMaster<SpecialStory>('specialStories'), loadStoryMedia()])
        const available = new Set(media.specialScenarios || [])
        specialStories.value = stories.map(story => ({ ...story, episodes: story.episodes.filter(episode => available.has(`startapp/scenario/special/${story.assetbundleName}/${episode.scenarioId}.json`)) })).filter(story => story.episodes.length)
      }
    } catch { extraError.value = '目录加载失败，请重试' }
    finally { extraLoading.value = false; extraRequest = null }
  })()
  await extraRequest
}
watch(activeTab, () => { extraPage.value = 1; closeStory(); void loadExtra() })
watch(eventTotalPages, total => { eventPage.value = Math.min(eventPage.value, total) })

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
  const query: Record<string, string> = {}
  if (tab !== 'event') query.tab = tab
  void router.replace({ query })
}

// 切换标签页后清空筛选（在路由更新之后进行，避免与上面的 replace 互相覆盖）
watch(activeTab, () => {
  searchQuery.value = ''
  selectedUnit.value = ''
})

watch([searchQuery, selectedUnit, eventPage], () => {
  void replaceListQuery(router, route, {
    q: searchQuery.value.trim(),
    unit: selectedUnit.value,
    page: eventPage.value > 1 ? String(eventPage.value) : null,
  }, { resetPage: false })
})

function formatDate(timestamp?: number): string {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function eventBanner(story: EventStory): string {
  return `${assetsHost.value}/startapp/home/banner/${story.assetbundleName}/${story.assetbundleName}.png`
}

function episodeImage(episode: StoryEpisode): string {
  if (selectedStory.value?.kind !== 'event') return ''
  return `${assetsHost.value}/ondemand/event_story/${selectedStory.value.assetbundleName}/episode_image/${episode.assetbundleName}.png`
}

function unitChapterOutline(chapter: UnitStoryChapter): string {
  const groupId = chapter.episodes[0]?.unitStoryEpisodeGroupId
  return groupId ? unitEpisodeGroupMap.value.get(groupId)?.outline || '' : ''
}

function openEpisode(episode: StoryEpisode) {
  selectedEpisode.value = episode
  void router.replace({ query: { ...route.query, story: String(selectedStory.value?.id || ''), episode: String(episode.id) } })
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

function closeStory() {
  selectedEpisode.value = null
  selectedStory.value = null
  episodeSearch.value = ''
}

onMounted(async () => {
  try {
    const [eventData, eventStoryData, eventUnitData, unitStoryData, groupData] = await Promise.all([
      masterStore.getMaster<EventData>('events'),
      masterStore.getMaster<EventStory>('eventStories'),
      masterStore.getMaster<EventStoryUnit>('eventStoryUnits'),
      masterStore.getMaster<UnitStory>('unitStories'),
      masterStore.getMaster<UnitEpisodeGroup>('unitStoryEpisodeGroups'),
    ])
    events.value = eventData
    eventStories.value = eventStoryData
    eventStoryUnits.value = eventUnitData
    unitStories.value = unitStoryData
    unitEpisodeGroups.value = groupData
    await loadExtra()
    const storyId = String(route.query.story || '')
    if (activeTab.value === 'event') {
      const story = eventStories.value.find(item => String(item.id) === storyId && (settingsStore.showSpoilers || (eventMap.value.get(item.eventId)?.startAt || 0) <= now))
      if (story) openEventStory(story)
    } else if (activeTab.value === 'unit') {
      const chapter = flattenedUnitChapters.value.find(item => String(item.id) === storyId)
      if (chapter) openUnitChapter(chapter)
    } else selectedStory.value = extraStories.value.find(item => String(item.id) === storyId) || null
    const episode = selectedStory.value?.episodes.find(item => String(item.id) === String(route.query.episode))
    if (episode) selectedEpisode.value = episode
  } catch (error) {
    console.error('加载故事数据失败:', error)
    loadError.value = '游戏资料加载失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <PageHeader title="剧情档案" description="主线、活动、卡面与特别剧情，支持原文、语音与场景播放。"><template #icon><BookOpen class="w-8 h-8 text-primary" /></template></PageHeader>

    <section class="grid grid-cols-3 gap-2">
      <div class="rounded-xl bg-base-100 border border-base-200 px-3 py-2"><p class="text-[11px] text-base-content/45">活动故事</p><p class="font-bold text-lg">{{ storyStats.events }}</p></div>
      <div class="rounded-xl bg-base-100 border border-base-200 px-3 py-2"><p class="text-[11px] text-base-content/45">主线章节</p><p class="font-bold text-lg">{{ storyStats.unitChapters }}</p></div>
      <div class="rounded-xl bg-base-100 border border-base-200 px-3 py-2"><p class="text-[11px] text-base-content/45">收录话数</p><p class="font-bold text-lg text-primary">{{ storyStats.episodes }}</p></div>
    </section>

    <div role="tablist" class="tabs tabs-box bg-base-100 border border-base-200 w-full sm:w-fit p-1">
      <button role="tab" class="tab flex-1 sm:flex-none gap-1.5" :class="{ 'tab-active': activeTab === 'event' }" @click="setTab('event')"><Sparkles class="w-4 h-4" />活动 <span class="hidden sm:inline">{{ storyStats.events }}</span></button>
      <button role="tab" class="tab flex-1 sm:flex-none gap-1.5" :class="{ 'tab-active': activeTab === 'unit' }" @click="setTab('unit')"><Library class="w-4 h-4" />主线 <span class="hidden sm:inline">{{ storyStats.unitChapters }}</span></button>
      <button v-for="(label, tab) in extraLabels" :key="tab" role="tab" class="tab flex-1 sm:flex-none text-xs sm:text-sm" :class="{ 'tab-active': activeTab === tab }" @click="setTab(tab)">{{ label }}</button>
    </div>

    <section class="card bg-base-100 border border-base-200 shadow-sm">
      <div class="card-body p-3 md:p-4 grid md:grid-cols-[minmax(0,1fr)_240px] gap-3">
        <label class="input input-bordered flex items-center gap-2">
          <Search class="w-4 h-4 opacity-50" /><input v-model="searchQuery" class="grow min-w-0" placeholder="搜索故事或章节标题…" />
          <button v-if="searchQuery" class="btn btn-xs btn-circle btn-ghost" aria-label="清空" @click="searchQuery = ''"><X class="w-3 h-3" /></button>
        </label>
        <select v-if="activeTab === 'event' || activeTab === 'unit'" v-model="selectedUnit" class="select select-bordered w-full">
          <option value="">全部组合</option>
          <option v-for="unit in unitOptions" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
        </select>
        <p class="md:col-span-2 text-xs text-base-content/45">阅读进度保存在当前浏览器，不影响游戏账号。部分剧本没有配音，仍可阅读原文。</p>
      </div>
    </section>

    <div v-if="isLoading" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4"><div v-for="index in 12" :key="index" class="skeleton h-56 rounded-xl"></div></div>
    <div v-else-if="loadError" class="alert alert-error">故事数据加载失败：{{ loadError }}</div>

    <template v-else-if="activeTab === 'event'">
      <div class="flex items-center justify-between gap-3"><p class="text-sm font-medium">{{ filteredEventStories.length }} 个活动故事</p><span class="text-xs text-base-content/45">按活动时间从新到旧</span></div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button v-for="story in paginatedEventStories" :key="story.id" class="group card bg-base-100 border border-base-200 hover:border-primary/30 hover:shadow-lg transition-all overflow-hidden text-left" @click="openEventStory(story)">
          <figure class="relative aspect-[122/52] bg-base-200 overflow-hidden"><AssetImage :src="eventBanner(story)" :alt="eventMap.get(story.eventId)?.name" class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" /></figure>
          <div class="card-body p-4 gap-2.5">
            <div class="flex items-center justify-between gap-2"><img v-if="getUnitLogo(mainUnitByEventStory.get(story.id))" :src="getUnitLogo(mainUnitByEventStory.get(story.id))" class="h-5 max-w-24 object-contain object-left" /><span class="text-[11px] text-base-content/45">{{ formatDate(eventMap.get(story.eventId)?.startAt) }}</span></div>
            <h2 class="font-bold line-clamp-2 leading-5">{{ eventMap.get(story.eventId)?.name || `活动故事 #${story.id}` }}</h2>
            <p class="text-xs leading-5 text-base-content/55 line-clamp-2 min-h-10">{{ story.outline }}</p>
            <p class="text-[11px] text-base-content/40 pt-1">共 {{ story.eventStoryEpisodes.length }} 话</p>
          </div>
        </button>
      </div>
      <Pagination v-if="eventTotalPages > 1" :current-page="eventPage" :total-pages="eventTotalPages" base-url="/stories" @page-change="handleEventPageChange" />
    </template>

    <template v-else-if="activeTab === 'unit'">
      <p class="text-sm font-medium">{{ flattenedUnitChapters.length }} 个主线章节</p>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button v-for="chapter in flattenedUnitChapters" :key="chapter.id" class="group card bg-base-100 border border-base-200 hover:border-primary/30 hover:shadow-lg transition-all text-left overflow-hidden" @click="openUnitChapter(chapter)">
          <div class="h-1.5 bg-primary/70"></div><div class="card-body p-5 gap-3">
            <div class="flex items-center justify-between gap-3"><img :src="getUnitLogo(chapter.unit)" :alt="getUnitLabel(chapter.unit)" class="h-8 max-w-40 object-contain object-left" /><span class="badge badge-sm badge-ghost">Chapter {{ chapter.chapterNo }}</span></div>
            <h2 class="font-bold leading-5">{{ chapter.title }}</h2>
            <p class="text-xs leading-5 text-base-content/55 line-clamp-3 min-h-[3.75rem]">{{ unitChapterOutline(chapter) || `${getUnitLabel(chapter.unit)} 的组合主线故事。` }}</p>
            <div class="flex items-center gap-2 text-[11px] text-base-content/40"><span class="flex-1">共 {{ chapter.episodes.length }} 话</span><ChevronRight class="w-4 h-4 opacity-40 group-hover:translate-x-0.5 transition-transform" /></div>
          </div>
        </button>
      </div>
    </template>

    <template v-else-if="activeTab === 'card' || activeTab === 'special'">
      <div v-if="extraLoading" class="py-20 text-center"><span class="loading loading-spinner"></span><p class="mt-3 text-sm opacity-50">正在加载目录…</p></div>
      <div v-else-if="extraError" class="alert alert-error">{{ extraError }}<button class="btn btn-sm" @click="loadExtra">重试</button></div>
      <template v-else>
        <p class="text-sm opacity-60">{{ extraStories.length }} 篇故事 · {{ activeTab === 'card' ? '卡面前篇与后篇' : '仅展示已有可读剧本的特别篇' }}</p>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button v-for="story in extraStories.slice((extraPage - 1) * 12, extraPage * 12)" :key="story.id" class="card bg-base-100 border border-base-200 hover:border-primary text-left overflow-hidden" @click="selectedStory = story">
            <AssetImage v-if="story.kind === 'card'" :src="`${assetsHost}/startapp/character/member/${story.assetbundleName}/card_normal.jpg`" :alt="story.title" class="w-full aspect-video object-cover" />
            <div class="p-5 space-y-2"><span class="text-xs text-primary">{{ extraLabels[activeTab] }} / {{ story.id }}</span><h2 class="font-bold">{{ story.title }}</h2><p class="text-xs opacity-50">{{ story.episodes.length }} 话 · 点击选集</p></div>
          </button>
        </div>
        <div v-if="!extraStories.length" class="py-12 text-center opacity-50">没有匹配的故事</div>
        <div v-if="extraStories.length > 12" class="flex justify-center items-center gap-4"><button class="btn btn-sm" :disabled="extraPage === 1" @click="extraPage--">上一页</button><span class="text-xs">{{ extraPage }} / {{ Math.ceil(extraStories.length / 12) }}</span><button class="btn btn-sm" :disabled="extraPage * 12 >= extraStories.length" @click="extraPage++">下一页</button></div>
      </template>
    </template>

    <dialog ref="storyDialog" class="modal" :class="{ 'modal-open': selectedStory }" @cancel.prevent="closeStory">
      <div v-if="selectedStory" class="modal-box p-0" :class="selectedEpisode ? 'max-w-5xl max-h-[94dvh] w-[96vw]' : 'max-w-3xl'">
        <StoryReader
          v-if="selectedEpisode"
          :key="selectedEpisode.scenarioId"
          :title="selectedEpisode.title"
          :episode-label="selectedEpisode.episodeNoLabel || `第 ${selectedEpisode.episodeNo} 话`"
          :scenario-id="selectedEpisode.scenarioId"
          :scenario-urls="scenarioUrls"
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
                <span class="badge badge-primary">{{ selectedStory.kind === 'event' ? '活动故事' : selectedStory.kind === 'unit' ? '组合主线' : extraLabels[selectedStory.kind] }}</span>
                <span v-if="selectedStory.unit" class="badge badge-ghost">{{ getUnitLabel(selectedStory.unit) }}</span>
              </div>
              <h2 class="font-bold text-xl">{{ selectedStory.title }}</h2>
              <p v-if="selectedStory.outline" class="text-sm leading-6 text-base-content/65 mt-2 whitespace-pre-line">{{ selectedStory.outline }}</p>
            </div>
            <button class="btn btn-sm btn-circle btn-ghost" aria-label="关闭" @click="closeStory"><X class="w-4 h-4" /></button>
          </header>
          <div class="p-4 border-b border-base-200 bg-base-100"><label class="input input-sm input-bordered flex items-center gap-2"><Search class="w-4 h-4 opacity-40" /><input v-model="episodeSearch" class="grow" placeholder="搜索本篇章节标题或剧本 ID…" /><button v-if="episodeSearch" class="btn btn-xs btn-circle btn-ghost" @click="episodeSearch = ''"><X class="w-3 h-3" /></button></label></div>
          <div class="p-3 md:p-4 max-h-[58vh] overflow-y-auto space-y-2 bg-base-200/50">
            <button v-for="episode in selectedStoryEpisodes" :key="episode.id" class="group w-full flex items-center gap-3 bg-base-100 border border-base-200 rounded-xl p-2.5 text-left hover:border-primary/50 hover:shadow-sm transition-all" @click="openEpisode(episode)">
              <span v-if="selectedStory.kind === 'event'" class="relative aspect-[35/18] w-24 shrink-0 overflow-hidden rounded-lg bg-base-200 sm:w-32"><AssetImage :src="episodeImage(episode)" :alt="episode.title" class="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" /><span class="absolute inset-0 grid place-items-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100"><span class="grid h-8 w-8 place-items-center rounded-full bg-base-100/90 text-primary shadow"><Play class="h-3.5 w-3.5" /></span></span></span>
              <span v-else class="grid w-10 h-10 place-items-center rounded-lg shrink-0 bg-primary/10 text-primary"><Play class="w-4 h-4" /></span>
              <span class="min-w-0 flex-1"><span class="text-[11px] text-base-content/45">{{ episode.episodeNoLabel || `第 ${episode.episodeNo} 话` }} · {{ episode.scenarioId }}</span><span class="font-medium block truncate">{{ episode.title }}</span></span>
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
