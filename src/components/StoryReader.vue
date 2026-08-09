<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Copy, Search, X } from 'lucide-vue-next'

interface ScenarioTalk {
  WindowDisplayName?: string
  Body?: string
}

interface ScenarioData {
  ScenarioId?: string
  TalkData?: ScenarioTalk[]
}

const props = defineProps<{
  title: string
  scenarioId: string
  scenarioUrls: string[]
  episodeImageUrl?: string
}>()

const emit = defineEmits<{ close: [] }>()

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
  <div class="flex flex-col max-h-[88vh]">
    <header class="px-5 py-4 border-b border-base-200 flex items-start gap-3 shrink-0">
      <div class="min-w-0 flex-1">
        <p class="text-xs text-base-content/45 font-mono">{{ scenarioId }}</p>
        <h2 class="font-bold text-xl truncate">{{ title }}</h2>
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
      <div class="p-4 border-b border-base-200 flex flex-col sm:flex-row gap-3 shrink-0 bg-base-100">
        <label class="input input-sm input-bordered flex items-center gap-2 flex-1">
          <Search class="w-4 h-4 opacity-50" />
          <input v-model="searchQuery" class="grow" placeholder="在本话台词中搜索…" />
        </label>
        <button class="btn btn-sm btn-outline gap-2" @click="copyScript"><Copy class="w-4 h-4" />复制全文</button>
      </div>

      <div class="overflow-y-auto overscroll-contain p-4 md:p-6 bg-base-200/60">
        <img v-if="episodeImageUrl" :src="episodeImageUrl" :alt="title" class="w-full max-w-lg mx-auto rounded-xl mb-6 border border-base-300" />
        <div class="max-w-3xl mx-auto space-y-3">
          <article
            v-for="item in filteredTalks"
            :key="item.index"
            class="bg-base-100 rounded-xl border border-base-200 p-4 shadow-sm"
          >
            <div class="flex items-center justify-between gap-3 mb-2">
              <h3 class="font-bold text-primary">{{ item.talk.WindowDisplayName || '旁白' }}</h3>
            </div>
            <p class="whitespace-pre-line leading-7">{{ item.talk.Body }}</p>
          </article>
          <div v-if="filteredTalks.length === 0" class="text-center py-16 text-base-content/50">没有匹配的台词</div>
        </div>
      </div>

      <footer class="px-5 py-3 border-t border-base-200 flex justify-between gap-3 text-xs text-base-content/45 shrink-0">
        <span>{{ filteredTalks.length }} / {{ talks.length }} 段台词</span>
        <span v-if="actionMessage" class="text-primary">{{ actionMessage }}</span>
        <span v-else class="truncate hidden sm:block" :title="loadedUrl">资源已加载</span>
      </footer>
    </template>
  </div>
</template>
