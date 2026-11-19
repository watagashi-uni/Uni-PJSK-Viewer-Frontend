<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, ExternalLink, EyeOff, Languages, Megaphone } from 'lucide-vue-next'
import { useBackToList } from '@/composables/useBackToList'
import { useSpoilerWatermark } from '@/composables/useSpoilerWatermark'
import { useSettingsStore } from '@/stores/settings'
import InformationBadges from '@/components/InformationBadges.vue'
import {
  loadInformationIndex,
  loadInformationPage,
  officialInformationUrl,
  type InformationItem,
  type InformationPage,
} from '@/api/information'
import {
  formatInformationTime,
  informationStatus,
  isInformationSpoiler,
  relativeInformationTime,
} from '@/utils/information'

type Mode = 'both' | 'zh' | 'ja'
const MODE_KEY = 'information_mode'
const modes: { value: Mode; label: string }[] = [
  { value: 'both', label: '中日对照' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日文' },
]

const route = useRoute()
const router = useRouter()
const goBack = useBackToList('/information')
const settingsStore = useSettingsStore()

const key = computed(() => String(route.params.key ?? ''))
const item = ref<InformationItem | null>(null)
const page = ref<InformationPage | null>(null)
const isLoading = ref(true)
const loadError = ref(false)
const notFound = ref(false)
const now = ref(Date.now())

function readMode(): Mode {
  try {
    const saved = localStorage.getItem(MODE_KEY)
    if (saved === 'zh' || saved === 'ja' || saved === 'both') return saved
  } catch { /* 无痕模式等读不到存储时用默认值 */ }
  return 'both'
}

const mode = ref<Mode>(readMode())
watch(mode, (value) => {
  try { localStorage.setItem(MODE_KEY, value) } catch { /* 同上 */ }
})

const title = computed(() => page.value?.titleZh || item.value?.titleZh || page.value?.title || item.value?.title || '')
const titleJa = computed(() => page.value?.title || item.value?.title || '')
const showJaTitle = computed(() => mode.value !== 'zh' && titleJa.value !== title.value)
const status = computed(() => (item.value ? informationStatus(item.value, now.value) : null))

// 官方提前放出、还没到开始时间的公告：没开剧透时不显示标题和正文，开了之后加提示和水印
const isSpoiler = computed(() => !!item.value && isInformationSpoiler(item.value, now.value))
const spoilerHidden = computed(() => isSpoiler.value && !settingsStore.showSpoilers)
useSpoilerWatermark(() => isSpoiler.value && !!page.value)

watch([title, spoilerHidden], ([value, hidden]) => {
  if (hidden) document.title = '公告详情 - Uni PJSK Viewer'
  else if (value) document.title = `${value} - Uni PJSK Viewer`
})

/** 已显示的正文文件；列表里的文件名变了（追记、翻译完成）才重新下载 */
let currentPage = ''

async function load(force = false) {
  const wanted = key.value
  try {
    const index = await loadInformationIndex(force)
    if (wanted !== key.value) return
    const found = index.items.find(i => i.key === wanted) ?? null
    now.value = Date.now()
    item.value = found
    notFound.value = !found?.page
    // 被剧透设置挡住时不下载正文
    if (found && isInformationSpoiler(found, now.value) && !settingsStore.showSpoilers) {
      page.value = null
      currentPage = ''
    } else if (found?.page && found.page !== currentPage) {
      const loaded = await loadInformationPage(found.page)
      if (wanted !== key.value) return
      page.value = loaded
      currentPage = found.page
    }
    loadError.value = false
  } catch {
    if (!page.value) loadError.value = true
  } finally {
    now.value = Date.now()
    isLoading.value = false
  }
}

watch(key, () => {
  currentPage = ''
  item.value = null
  page.value = null
  isLoading.value = true
  notFound.value = false
  void load()
})

// 开关剧透后重新判断要不要显示正文
watch(() => settingsStore.showSpoilers, () => {
  if (!page.value) isLoading.value = true
  void load()
})

// 公告常被追记、翻译也可能稍后才完成：停留在页面上时每分钟检查一次
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  void load()
  timer = setInterval(() => {
    if (document.visibilityState === 'visible') void load(true)
  }, 60_000)
})
onBeforeUnmount(() => clearInterval(timer))

/** 正文里的链接：其他公告在站内打开，目录锚点平滑滚动，其余的在新标签页打开（HTML 里已带 target） */
function onBodyClick(event: MouseEvent) {
  const anchor = (event.target as HTMLElement | null)?.closest('a')
  if (!anchor) return
  const info = anchor.getAttribute('data-info')
  if (info && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
    event.preventDefault()
    void router.push(`/information/${info}`)
    return
  }
  const href = anchor.getAttribute('href') ?? ''
  if (href.startsWith('#')) {
    event.preventDefault()
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-4">
    <button type="button" class="back-link" @click="goBack">
      <ChevronLeft class="h-4 w-4" />
      返回公告列表
    </button>

    <div v-if="isLoading" class="space-y-3">
      <div class="skeleton h-28 rounded-box"></div>
      <div class="skeleton h-96 rounded-box"></div>
    </div>

    <div v-else-if="loadError" role="alert" class="alert alert-error">
      <span>公告加载失败，请检查网络后重试。</span>
      <button type="button" class="btn btn-sm" @click="load(true)">重试</button>
    </div>

    <!-- 还没到公开时间：标题也不显示 -->
    <div v-else-if="spoilerHidden" class="panel flex flex-col items-center gap-3 px-6 py-10 text-center">
      <EyeOff class="h-12 w-12 text-warning opacity-60" />
      <h1 class="text-lg font-bold">涉及剧透内容</h1>
      <p class="text-sm text-base-content/60">这条公告官方提前放出，还没到公开时间。根据你的设置，剧透内容已隐藏。</p>
      <button type="button" class="btn btn-primary btn-outline btn-sm" @click="settingsStore.setSpoilers(true)">
        允许显示剧透
      </button>
    </div>

    <div v-else-if="notFound && !page" class="empty-state">
      <Megaphone />
      <p>没有找到这条公告，可能还没有同步或已经很久以前撤下了。</p>
      <a :href="officialInformationUrl(key)" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-ghost gap-1.5">
        查看官方页面 <ExternalLink class="h-3.5 w-3.5" />
      </a>
    </div>

    <template v-else-if="page">
      <header class="panel info-head">
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <InformationBadges v-if="item" :tag="item.tag" :status="status" />
          <span v-if="item" class="num text-base-content/60">
            {{ formatInformationTime(item.startAt, true) }}
            <template v-if="item.endAt"> – {{ formatInformationTime(item.endAt, true) }}</template>
          </span>
          <span
            v-if="page.modifiedAt && item && page.modifiedAt > item.startAt + 60_000"
            class="text-base-content/45"
            :title="formatInformationTime(page.modifiedAt, true)"
          >更新于 {{ relativeInformationTime(page.modifiedAt, now) }}</span>
        </div>
        <h1 class="info-head__title" lang="zh-Hans">{{ mode === 'ja' ? titleJa : title }}</h1>
        <p v-if="showJaTitle && mode !== 'ja'" class="info-head__ja" lang="ja">{{ titleJa }}</p>
        <div class="flex flex-wrap items-center gap-2 pt-1">
          <div class="flex gap-1.5" role="group" aria-label="显示语言">
            <button
              v-for="option in modes"
              :key="option.value"
              type="button"
              class="chip"
              :class="{ 'is-active': mode === option.value }"
              :aria-pressed="mode === option.value"
              @click="mode = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <a :href="page.source" target="_blank" rel="noopener noreferrer" class="chip ml-auto">
            官方原文 <ExternalLink class="h-3 w-3 opacity-60" />
          </a>
        </div>
      </header>

      <div v-if="isSpoiler" role="note" class="alert alert-warning text-sm">
        <EyeOff class="h-4 w-4" />
        <span>剧透内容：这条公告官方提前放出，{{ item ? formatInformationTime(item.startAt, true) : '' }} 才正式公开，请勿转载或截图外传。</span>
      </div>

      <div v-if="!page.done && mode !== 'ja'" class="alert alert-info text-sm">
        <Languages class="h-4 w-4" />
        <span>部分内容还在翻译，暂时显示日文，完成后这里会自动更新。</span>
      </div>

      <!-- 正文由同步服务按白名单清洗过（只留排版标签，去掉脚本、事件属性和不安全的样式），每行都带中日两种文字，用 CSS 切换 -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <article class="panel info-body" :class="`is-${mode}`" lang="ja" @click="onBodyClick" v-html="page.html"></article>

      <p class="px-1 text-xs leading-relaxed text-base-content/45">
        中文由 AI 根据官方日文公告翻译，可能有误，日期、奖励等以官方原文为准。时间按你的设备时区显示，正文里的时间是日本时间（UTC+9）。
      </p>
    </template>
  </div>
</template>

<style scoped>
.info-head {
  display: grid;
  gap: 0.375rem;
  padding: 1rem 1.125rem;
}

.info-head__title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.info-head__ja {
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

/* ---- 正文：沿用官方网页的 class ---- */
.info-body {
  padding: 1.125rem 1.125rem 1.5rem;
  font-size: 0.9375rem;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

@media (min-width: 640px) {
  .info-body {
    padding: 1.5rem 1.75rem 2rem;
  }
}

.info-body :deep(img) {
  display: inline-block;
  max-width: 100%;
  height: auto;
  vertical-align: middle;
}

.info-body :deep(.banner) {
  margin-bottom: 0.75rem;
  text-align: center;
}

.info-body :deep(.banner img) {
  width: 100%;
  border-radius: var(--radius-field);
}

.info-body :deep(p) {
  margin: 0;
}

.info-body :deep(.information-body-heading) {
  margin: 1.5rem 0 0.75rem;
  padding: 0.5rem 0.875rem;
  border-left: 4px solid var(--color-primary);
  border-radius: 0 var(--radius-field) var(--radius-field) 0;
  background-color: color-mix(in oklab, var(--color-primary) 10%, var(--color-base-100));
  font-size: 1.0625rem;
  font-weight: 700;
  line-height: 1.6;
}

.info-body :deep(.information-body-element) {
  margin-top: 1rem;
}

.info-body :deep(.information-body-element-heading) {
  margin-top: 0.75rem;
  color: color-mix(in oklab, var(--color-primary) 80%, var(--color-base-content));
  font-weight: 700;
}

.info-body :deep(.information-body-element-hr) {
  margin: 0.25rem 0 0.5rem;
  border: 0;
  border-top: 1px solid var(--color-base-300);
}

.info-body :deep(.information-body-element-body) {
  margin-bottom: 0.5rem;
}

.info-body :deep(table) {
  max-width: 100%;
  border-collapse: collapse;
}

.info-body :deep(td),
.info-body :deep(th) {
  padding: 0.25rem 0.375rem;
  vertical-align: middle;
}

.info-body :deep(a[href]) {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.info-body :deep([id^='ib-']) {
  scroll-margin-top: 5rem;
}

/* ---- 中日对照：每行的日文在上、中文在下 ---- */
.info-body.is-both :deep(.ib-ja) {
  color: color-mix(in oklab, var(--color-base-content) 58%, transparent);
  font-size: 0.92em;
}

.info-body.is-both :deep(.ib-zh)::before {
  content: '\A';
  white-space: pre;
}

.info-body.is-zh :deep(.ib-ja),
.info-body.is-ja :deep(.ib-zh) {
  display: none;
}
</style>
