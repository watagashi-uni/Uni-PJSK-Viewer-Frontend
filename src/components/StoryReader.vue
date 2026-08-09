<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronLeft, ChevronRight, Copy, Search, X } from 'lucide-vue-next'

interface ScenarioTalk {
  WindowDisplayName?: string
  Body?: string
}

interface ScenarioData {
  ScenarioId?: string
  TalkData?: ScenarioTalk[]
}

const props = withDefaults(defineProps<{
  title: string
  episodeLabel?: string
  scenarioId: string
  scenarioUrls: string[]
  episodeImageUrl?: string
  hasPrevious?: boolean
  hasNext?: boolean
}>(), {
  episodeLabel: '',
  episodeImageUrl: undefined,
  hasPrevious: false,
  hasNext: false,
})

const emit = defineEmits<{ close: []; previous: []; next: [] }>()

const talks = ref<ScenarioTalk[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const loadedUrl = ref('')
const searchQuery = ref('')
const actionMessage = ref('')

const filteredTalks = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  if (!query) return talks.value.map((talk, index) => ({ talk, index }))
  return talks.value
    .map((talk, index) => ({ talk, index }))
    .filter(({ talk }) => [talk.WindowDisplayName, talk.Body]
      .some(value => String(value || '').toLocaleLowerCase().includes(query)))
})

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
        <img v-if="episodeImageUrl" :src="episodeImageUrl" :alt="title" class="w-full max-w-md mx-auto rounded-xl mb-5 border border-base-300 shadow-sm" />
        <div class="max-w-3xl mx-auto space-y-2">
          <article
            v-for="item in filteredTalks"
            :key="item.index"
            class="bg-base-100 rounded-xl border border-base-200 p-3 md:p-4 shadow-sm grid sm:grid-cols-[7.5rem_minmax(0,1fr)] gap-2 sm:gap-4"
            :class="{ 'border-l-4 border-l-primary/50': item.talk.WindowDisplayName }"
          >
            <div class="flex sm:block items-center justify-between gap-2"><h3 class="font-bold text-sm" :class="item.talk.WindowDisplayName ? 'text-primary' : 'text-base-content/45'">{{ item.talk.WindowDisplayName || '旁白' }}</h3><span class="text-[10px] text-base-content/30">#{{ item.index + 1 }}</span></div>
            <p class="whitespace-pre-line leading-7 text-[15px]">{{ item.talk.Body }}</p>
          </article>
          <div v-if="filteredTalks.length === 0" class="text-center py-16 text-base-content/50">没有匹配的台词</div>
        </div>
      </div>

      <footer class="px-3 md:px-5 py-2.5 border-t border-base-200 flex items-center justify-between gap-3 text-xs text-base-content/45 shrink-0 bg-base-100">
        <button class="btn btn-sm btn-ghost gap-1" :disabled="!hasPrevious" @click="emit('previous')"><ChevronLeft class="w-4 h-4" />上一话</button>
        <div class="text-center min-w-0"><span v-if="actionMessage" class="text-primary block">{{ actionMessage }}</span><span v-else class="truncate block" :title="loadedUrl">{{ filteredTalks.length }} / {{ talks.length }} 段台词</span></div>
        <button class="btn btn-sm btn-primary gap-1" :disabled="!hasNext" @click="emit('next')">下一话<ChevronRight class="w-4 h-4" /></button>
      </footer>
    </template>
  </div>
</template>
