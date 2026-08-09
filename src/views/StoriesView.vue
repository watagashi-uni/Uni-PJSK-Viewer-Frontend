<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, Calendar, ChevronRight, Search, X } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import Pagination from '@/components/Pagination.vue'
import StoryReader from '@/components/StoryReader.vue'
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
const specialStories = ref<SpecialStory[]>([])
const isLoading = ref(true)
const loadError = ref('')

const searchQuery = ref('')
const selectedUnit = ref('')
const eventPage = ref(1)
const specialPage = ref(1)
const selectedStory = ref<SelectedStory | null>(null)
const selectedEpisode = ref<StoryEpisode | null>(null)
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
    <header>
      <h1 class="text-3xl font-bold flex items-center gap-3"><BookOpen class="w-8 h-8 text-primary" />故事档案</h1>
      <p class="text-sm text-base-content/60 mt-2">收录活动、组合主线和特殊故事；活动故事可直接阅读完整台词，其他剧本资源上线后会自动启用。</p>
    </header>

    <div role="tablist" class="tabs tabs-box bg-base-100 border border-base-200 w-fit">
      <button role="tab" class="tab" :class="{ 'tab-active': activeTab === 'event' }" @click="setTab('event')">活动故事</button>
      <button role="tab" class="tab" :class="{ 'tab-active': activeTab === 'unit' }" @click="setTab('unit')">组合主线</button>
      <button role="tab" class="tab" :class="{ 'tab-active': activeTab === 'special' }" @click="setTab('special')">特殊故事</button>
    </div>

    <section class="card bg-base-100 border border-base-200 shadow-sm">
      <div class="card-body p-4 grid md:grid-cols-[minmax(0,1fr)_240px] gap-3">
        <label class="input input-bordered flex items-center gap-2">
          <Search class="w-4 h-4 opacity-50" /><input v-model="searchQuery" class="grow min-w-0" placeholder="搜索故事或章节标题…" />
          <button v-if="searchQuery" class="btn btn-xs btn-circle btn-ghost" aria-label="清空" @click="searchQuery = ''"><X class="w-3 h-3" /></button>
        </label>
        <select v-if="activeTab !== 'special'" v-model="selectedUnit" class="select select-bordered w-full">
          <option value="">全部组合</option>
          <option v-for="unit in unitOptions" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
        </select>
      </div>
    </section>

    <div v-if="isLoading" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4"><div v-for="index in 12" :key="index" class="skeleton h-56 rounded-xl"></div></div>
    <div v-else-if="loadError" class="alert alert-error">故事数据加载失败：{{ loadError }}</div>

    <template v-else-if="activeTab === 'event'">
      <p class="text-sm text-base-content/55">{{ filteredEventStories.length }} 个活动故事</p>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button v-for="story in paginatedEventStories" :key="story.id" class="card bg-base-100 border border-base-200 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden text-left" @click="openEventStory(story)">
          <figure class="aspect-[122/52] bg-base-200"><AssetImage :src="eventBanner(story)" :alt="eventMap.get(story.eventId)?.name" class="w-full h-full object-cover" /></figure>
          <div class="card-body p-4 gap-2">
            <div class="flex items-center gap-2"><img v-if="getUnitLogo(mainUnitByEventStory.get(story.id))" :src="getUnitLogo(mainUnitByEventStory.get(story.id))" class="h-5 max-w-20 object-contain" /><span class="badge badge-sm badge-ghost">{{ story.eventStoryEpisodes.length }} 话</span></div>
            <h2 class="font-bold line-clamp-2">{{ eventMap.get(story.eventId)?.name || `活动故事 #${story.id}` }}</h2>
            <p class="text-xs text-base-content/55 line-clamp-2">{{ story.outline }}</p>
          </div>
        </button>
      </div>
      <Pagination v-if="eventTotalPages > 1" :current-page="eventPage" :total-pages="eventTotalPages" base-url="/stories" @page-change="eventPage = $event" />
    </template>

    <template v-else-if="activeTab === 'unit'">
      <p class="text-sm text-base-content/55">{{ flattenedUnitChapters.length }} 个主线章节</p>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button v-for="chapter in flattenedUnitChapters" :key="chapter.id" class="card bg-base-100 border border-base-200 hover:shadow-lg transition-all text-left" @click="openUnitChapter(chapter)">
          <div class="card-body p-5">
            <img :src="getUnitLogo(chapter.unit)" :alt="getUnitLabel(chapter.unit)" class="h-10 max-w-40 object-contain object-left" />
            <h2 class="font-bold mt-2">{{ chapter.title }}</h2>
            <p class="text-sm text-base-content/55">{{ chapter.episodes.length }} 话</p>
            <div class="card-actions justify-end"><span class="btn btn-sm btn-ghost gap-1">查看选集 <ChevronRight class="w-4 h-4" /></span></div>
          </div>
        </button>
      </div>
    </template>

    <template v-else>
      <p class="text-sm text-base-content/55">{{ filteredSpecialStories.length }} 个特殊故事</p>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button v-for="story in paginatedSpecialStories" :key="story.id" class="card bg-base-100 border border-base-200 hover:shadow-lg transition-all text-left" @click="openSpecialStory(story)">
          <div class="card-body p-5">
            <div class="flex justify-between gap-3"><span class="badge badge-primary badge-outline">特殊故事</span><span class="text-xs text-base-content/45">#{{ story.id }}</span></div>
            <h2 class="font-bold line-clamp-3 mt-2">{{ story.title }}</h2>
            <p class="text-sm text-base-content/55 flex items-center gap-2"><Calendar class="w-4 h-4" />{{ formatDate(story.startAt) }} · {{ story.episodes.length }} 话</p>
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
          :scenario-id="selectedEpisode.scenarioId"
          :scenario-urls="scenarioUrls"
          :episode-image-url="selectedEpisodeImageUrl"
          @close="selectedEpisode = null"
        />
        <template v-else>
          <header class="p-5 border-b border-base-200 flex items-start gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-2"><span class="badge badge-primary badge-outline">{{ selectedStory.kind === 'event' ? '活动故事' : selectedStory.kind === 'unit' ? '组合主线' : '特殊故事' }}</span><span v-if="selectedStory.unit" class="badge badge-ghost">{{ getUnitLabel(selectedStory.unit) }}</span></div>
              <h2 class="font-bold text-xl">{{ selectedStory.title }}</h2>
              <p v-if="selectedStory.outline" class="text-sm leading-6 text-base-content/65 mt-2 whitespace-pre-line">{{ selectedStory.outline }}</p>
            </div>
            <button class="btn btn-sm btn-circle btn-ghost" aria-label="关闭" @click="closeStory"><X class="w-4 h-4" /></button>
          </header>
          <div class="p-4 max-h-[65vh] overflow-y-auto space-y-2 bg-base-200/50">
            <button v-for="episode in selectedStory.episodes" :key="episode.id" class="w-full flex items-center gap-3 bg-base-100 border border-base-200 rounded-xl p-4 text-left hover:border-primary transition-colors" @click="selectedEpisode = episode">
              <span class="badge badge-primary badge-outline shrink-0">{{ episode.episodeNoLabel || `第 ${episode.episodeNo} 话` }}</span>
              <span class="font-medium flex-1 min-w-0 truncate">{{ episode.title }}</span>
              <span v-if="selectedStory.kind !== 'event'" class="badge badge-sm badge-warning badge-outline shrink-0">在线资源待补</span>
              <ChevronRight class="w-4 h-4 shrink-0 opacity-50" />
            </button>
          </div>
        </template>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="closeStory">关闭</button></form>
    </dialog>
  </div>
</template>
