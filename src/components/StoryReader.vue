<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronLeft, ChevronRight, Copy, Image as ImageIcon, MapPin, Search, X } from 'lucide-vue-next'

interface ScenarioTalk {
  WindowDisplayName?: string
  Body?: string
}

interface ScenarioSnippet {
  Action?: number
  ReferenceIndex?: number
}

interface ScenarioSpecialEffect {
  EffectType?: number
  StringVal?: string
  StringValSub?: string
}

interface ScenarioData {
  ScenarioId?: string
  FirstBackground?: string
  Snippets?: ScenarioSnippet[]
  SpecialEffectData?: ScenarioSpecialEffect[]
  TalkData?: ScenarioTalk[]
}

interface TalkEntry {
  type: 'talk'
  key: string
  talk: ScenarioTalk
  talkIndex: number
}

interface SceneEntry {
  type: 'scene'
  key: string
  locationName: string
}

type TimelineEntry = TalkEntry | SceneEntry

const props = withDefaults(defineProps<{
  title: string
  episodeLabel?: string
  scenarioId: string
  scenarioUrls: string[]
  hasPrevious?: boolean
  hasNext?: boolean
}>(), {
  episodeLabel: '',
  hasPrevious: false,
  hasNext: false,
})

const emit = defineEmits<{ close: []; previous: []; next: [] }>()

const talks = ref<ScenarioTalk[]>([])
const timeline = ref<TimelineEntry[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const loadedUrl = ref('')
const searchQuery = ref('')
const actionMessage = ref('')

const filteredTimeline = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  if (!query) return timeline.value
  return timeline.value
    .filter((entry): entry is TalkEntry => entry.type === 'talk')
    .filter(entry => [entry.talk.WindowDisplayName, entry.talk.Body]
      .some(value => String(value || '').toLocaleLowerCase().includes(query)))
})

const visibleTalkCount = computed(() => filteredTimeline.value.filter(entry => entry.type === 'talk').length)

function buildTimeline(data: ScenarioData): TimelineEntry[] {
  const sourceTalks = Array.isArray(data.TalkData) ? data.TalkData : []
  const snippets = Array.isArray(data.Snippets) ? data.Snippets : []
  const effects = Array.isArray(data.SpecialEffectData) ? data.SpecialEffectData : []
  if (snippets.length === 0) {
    return sourceTalks
      .map((talk, talkIndex): TalkEntry => ({ type: 'talk', key: `talk-${talkIndex}`, talk, talkIndex }))
      .filter(entry => entry.talk.Body || entry.talk.WindowDisplayName)
  }

  const entries: TimelineEntry[] = []
  let currentBackground = String(data.FirstBackground || '')
  let hasPendingSceneChange = Boolean(currentBackground)
  let pendingLocationName = ''
  let sceneIndex = 0

  for (const snippet of snippets) {
    const referenceIndex = Number(snippet.ReferenceIndex ?? -1)
    if (snippet.Action === 6 && referenceIndex >= 0) {
      const effect = effects[referenceIndex]
      if (!effect) continue
      if (effect.EffectType === 7) {
        const nextBackground = String(effect.StringValSub || effect.StringVal || '')
        if (nextBackground && nextBackground !== currentBackground) {
          currentBackground = nextBackground
          hasPendingSceneChange = true
        }
      } else if ((effect.EffectType === 8 || effect.EffectType === 18) && effect.StringVal) {
        pendingLocationName = String(effect.StringVal).trim()
        hasPendingSceneChange = true
      }
      continue
    }

    if (snippet.Action !== 1 || referenceIndex < 0) continue
    const talk = sourceTalks[referenceIndex]
    if (!talk?.Body && !talk?.WindowDisplayName) continue
    if (hasPendingSceneChange) {
      entries.push({ type: 'scene', key: `scene-${sceneIndex++}`, locationName: pendingLocationName })
      hasPendingSceneChange = false
      pendingLocationName = ''
    }
    entries.push({ type: 'talk', key: `talk-${referenceIndex}`, talk, talkIndex: referenceIndex })
  }

  return entries.length > 0
    ? entries
    : sourceTalks
      .map((talk, talkIndex): TalkEntry => ({ type: 'talk', key: `talk-${talkIndex}`, talk, talkIndex }))
      .filter(entry => entry.talk.Body || entry.talk.WindowDisplayName)
}

async function copyScript() {
  const text = talks.value
    .map(talk => `${talk.WindowDisplayName || '旁白'}：${talk.Body || ''}`)
    .join('\n\n')
  try {
    await navigator.clipboard.writeText(text)
    actionMessage.value = '剧本文本已复制'
  } catch {
    actionMessage.value = '复制失败，请检查浏览器剪贴板权限'
  }
}

async function loadScenario() {
  isLoading.value = true
  errorMessage.value = ''
  const failures: string[] = []

  for (const url of [...new Set(props.scenarioUrls)]) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        failures.push(`${response.status} ${url}`)
        continue
      }
      const data = await response.json() as ScenarioData
      if (!Array.isArray(data.TalkData)) {
        failures.push(`格式不支持 ${url}`)
        continue
      }
      talks.value = data.TalkData.filter(talk => talk.Body || talk.WindowDisplayName)
      timeline.value = buildTimeline(data)
      loadedUrl.value = url
      isLoading.value = false
      return
    } catch (error) {
      failures.push(`${error instanceof Error ? error.message : '请求失败'} ${url}`)
    }
  }

  errorMessage.value = failures.length > 0
    ? `没有找到可读取的剧本资源（已尝试 ${failures.length} 个路径）`
    : '没有可用的剧本资源路径'
  isLoading.value = false
}

onMounted(loadScenario)
</script>

<template>
  <div class="flex flex-col h-[88vh] max-h-[88vh]">
    <header class="px-4 md:px-5 py-3.5 border-b border-base-200 flex items-center gap-3 shrink-0 bg-gradient-to-r from-primary/10 via-base-100 to-base-100">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 text-xs text-base-content/45"><span v-if="episodeLabel" class="badge badge-primary badge-sm">{{ episodeLabel }}</span><span class="font-mono truncate">{{ scenarioId }}</span></div>
        <h2 class="font-bold text-lg md:text-xl truncate mt-1">{{ title }}</h2>
      </div>
      <button class="btn btn-sm btn-circle btn-ghost" aria-label="关闭阅读器" @click="emit('close')"><X class="w-4 h-4" /></button>
    </header>

    <div v-if="isLoading" class="min-h-80 grid place-items-center"><span class="loading loading-spinner loading-lg"></span></div>

    <div v-else-if="errorMessage" class="p-6 min-h-72 grid place-items-center">
      <div class="text-center max-w-md">
        <p class="font-bold text-error">{{ errorMessage }}</p>
        <p class="text-sm text-base-content/55 mt-2">该条目仍会保留在故事目录中，资源补齐后无需修改页面即可读取。</p>
        <button class="btn btn-sm btn-ghost mt-4" @click="emit('close')">返回选集</button>
      </div>
    </div>

    <template v-else>
      <div class="p-3 border-b border-base-200 flex flex-col sm:flex-row gap-2 shrink-0 bg-base-100">
        <label class="input input-sm input-bordered flex items-center gap-2 flex-1">
          <Search class="w-4 h-4 opacity-50" />
          <input v-model="searchQuery" class="grow" placeholder="在本话台词中搜索…" />
        </label>
        <button class="btn btn-sm btn-outline gap-2" @click="copyScript"><Copy class="w-4 h-4" />复制全文</button>
      </div>

      <div class="overflow-y-auto overscroll-contain p-3 md:p-5 bg-base-200/60">
        <div class="max-w-3xl mx-auto space-y-2">
          <template v-for="entry in filteredTimeline" :key="entry.key">
            <div v-if="entry.type === 'scene'" class="flex items-center gap-3 py-2" role="separator">
              <span class="h-px flex-1 bg-base-300"></span>
              <span class="flex max-w-[80%] items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <MapPin v-if="entry.locationName" class="h-3.5 w-3.5 shrink-0" />
                <ImageIcon v-else class="h-3.5 w-3.5 shrink-0" />
                <span class="truncate">{{ entry.locationName || '场景切换' }}</span>
              </span>
              <span class="h-px flex-1 bg-base-300"></span>
            </div>
            <article
              v-else
              class="bg-base-100 rounded-xl border border-base-200 p-3 md:p-4 shadow-sm grid sm:grid-cols-[7.5rem_minmax(0,1fr)] gap-2 sm:gap-4"
              :class="{ 'border-l-4 border-l-primary/50': entry.talk.WindowDisplayName }"
            >
              <div class="flex sm:block items-center justify-between gap-2"><h3 class="font-bold text-sm" :class="entry.talk.WindowDisplayName ? 'text-primary' : 'text-base-content/45'">{{ entry.talk.WindowDisplayName || '旁白' }}</h3><span class="text-[10px] text-base-content/30">#{{ entry.talkIndex + 1 }}</span></div>
              <p class="whitespace-pre-line leading-7 text-[15px]">{{ entry.talk.Body }}</p>
            </article>
          </template>
          <div v-if="visibleTalkCount === 0" class="text-center py-16 text-base-content/50">没有匹配的台词</div>
        </div>
      </div>

      <footer class="px-3 md:px-5 py-2.5 border-t border-base-200 flex items-center justify-between gap-3 text-xs text-base-content/45 shrink-0 bg-base-100">
        <button class="btn btn-sm btn-ghost gap-1" :disabled="!hasPrevious" @click="emit('previous')"><ChevronLeft class="w-4 h-4" />上一话</button>
        <div class="text-center min-w-0"><span v-if="actionMessage" class="text-primary block">{{ actionMessage }}</span><span v-else class="truncate block" :title="loadedUrl">{{ visibleTalkCount }} / {{ talks.length }} 段台词</span></div>
        <button class="btn btn-sm btn-primary gap-1" :disabled="!hasNext" @click="emit('next')">下一话<ChevronRight class="w-4 h-4" /></button>
      </footer>
    </template>
  </div>
</template>
