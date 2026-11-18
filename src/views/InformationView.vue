<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, ExternalLink, Languages, Megaphone, RefreshCw, Search } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import InformationBadges from '@/components/InformationBadges.vue'
import { readQueryString, replaceListQuery } from '@/utils/routeQuery'
import {
  informationTagLabel,
  loadInformationIndex,
  type InformationIndex,
  type InformationItem,
} from '@/api/information'
import {
  formatInformationTime,
  informationStatus,
  relativeInformationTime,
} from '@/utils/information'

const route = useRoute()
const router = useRouter()

const index = ref<InformationIndex | null>(null)
const isLoading = ref(true)
const loadError = ref(false)
const refreshing = ref(false)
const now = ref(Date.now())

const searchQuery = ref(readQueryString(route.query, 'q'))
const tagFilter = ref(readQueryString(route.query, 'tag'))
const showEnded = ref(readQueryString(route.query, 'ended') === '1')
const PAGE_SIZE = 30
/** 官方已删掉的 banner 图（403），不留空框 */
const brokenThumbs = reactive(new Set<number>())
const visibleCount = ref(PAGE_SIZE)

const TAG_ORDER = ['information', 'event', 'gacha', 'music', 'campaign', 'update', 'bug']

/** 正文类公告（官方网站、Twitter 这种常驻链接另外放在页面底部） */
const notices = computed(() => (index.value?.items ?? []).filter(item => item.type !== 'content'))
const links = computed(() => (index.value?.items ?? []).filter(item => item.type === 'content' && !item.goneAt))

function isEnded(item: InformationItem) {
  return Boolean(item.goneAt) || Boolean(item.endAt && item.endAt < now.value)
}

const endedCount = computed(() => notices.value.filter(isEnded).length)

const tagCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const item of notices.value) {
    if (!showEnded.value && isEnded(item)) continue
    counts.set(item.tag, (counts.get(item.tag) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => {
    const ai = TAG_ORDER.indexOf(a[0])
    const bi = TAG_ORDER.indexOf(b[0])
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
  })
})

const filtered = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return notices.value.filter((item) => {
    if (!showEnded.value && isEnded(item)) return false
    if (tagFilter.value && item.tag !== tagFilter.value) return false
    if (query && !`${item.title}\n${item.titleZh ?? ''}`.toLowerCase().includes(query)) return false
    return true
  })
})

const visible = computed(() => filtered.value.slice(0, visibleCount.value))

watch([searchQuery, tagFilter, showEnded], () => {
  visibleCount.value = PAGE_SIZE
  void replaceListQuery(router, route, {
    q: searchQuery.value.trim(),
    tag: tagFilter.value || null,
    ended: showEnded.value ? '1' : null,
  })
})

function linkFor(item: InformationItem) {
  return item.key && item.page ? `/information/${item.key}` : null
}

async function load(force = false) {
  if (force) refreshing.value = true
  try {
    index.value = await loadInformationIndex(force)
    loadError.value = false
  } catch {
    if (!index.value) loadError.value = true
  } finally {
    now.value = Date.now()
    isLoading.value = false
    refreshing.value = false
  }
}

// 官方经常在开始前几分钟放出公告，打开页面时每分钟刷新一次列表
let timer: ReturnType<typeof setInterval> | undefined
function onVisibility() {
  if (document.visibilityState === 'visible') void load(true)
}

onMounted(() => {
  void load()
  timer = setInterval(() => {
    if (document.visibilityState === 'visible') void load(true)
  }, 60_000)
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5">
    <PageHeader title="游戏公告" description="日服游戏内公告的中日对照版，每分钟同步一次，标题和正文由 AI 翻译。">
      <template #icon><Megaphone /></template>
      <template #actions>
        <span v-if="index" class="flex items-center gap-2 text-xs text-base-content/55">
          <span>同步于 {{ relativeInformationTime(index.updatedAt, now) }}</span>
          <button type="button" class="btn btn-ghost btn-xs btn-square" :disabled="refreshing" title="刷新" @click="load(true)">
            <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': refreshing }" />
          </button>
        </span>
      </template>
    </PageHeader>

    <div class="toolbar">
      <label class="input input-bordered input-sm flex h-9 min-w-[12rem] flex-1 items-center gap-2 sm:max-w-xs">
        <Search class="h-4 w-4 opacity-50" />
        <input v-model="searchQuery" type="text" placeholder="搜索标题（中文或日文）" class="grow" />
      </label>
      <div class="flex flex-wrap gap-1.5" role="group" aria-label="公告类型">
        <button type="button" class="chip" :class="{ 'is-active': !tagFilter }" :aria-pressed="!tagFilter" @click="tagFilter = ''">全部</button>
        <button
          v-for="[tag, count] in tagCounts"
          :key="tag"
          type="button"
          class="chip"
          :class="{ 'is-active': tagFilter === tag }"
          :aria-pressed="tagFilter === tag"
          @click="tagFilter = tagFilter === tag ? '' : tag"
        >
          {{ informationTagLabel(tag) }}<span class="chip__count">{{ count }}</span>
        </button>
      </div>
      <button
        v-if="endedCount"
        type="button"
        class="chip ml-auto"
        :class="{ 'is-active': showEnded }"
        :aria-pressed="showEnded"
        @click="showEnded = !showEnded"
      >
        显示已结束<span class="chip__count">{{ endedCount }}</span>
      </button>
    </div>

    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 8" :key="i" class="skeleton h-20 rounded-box"></div>
    </div>

    <div v-else-if="loadError" role="alert" class="alert alert-error">
      <span>公告列表加载失败，请检查网络后重试。</span>
      <button type="button" class="btn btn-sm" @click="load(true)">重试</button>
    </div>

    <template v-else>
      <ul class="space-y-2.5">
        <li v-for="item in visible" :key="item.id">
          <component
            :is="linkFor(item) ? 'RouterLink' : 'div'"
            :to="linkFor(item) ?? undefined"
            class="tile info-row"
            :class="{ 'is-ended': isEnded(item) }"
          >
            <img v-if="item.thumb && !brokenThumbs.has(item.id)" :src="item.thumb" alt="" loading="lazy" class="info-row__thumb" @error="brokenThumbs.add(item.id)" />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1.5 text-xs">
                <InformationBadges :tag="item.tag" :status="informationStatus(item, now)" />
                <time class="num text-base-content/55" :datetime="new Date(item.startAt).toISOString()" :title="formatInformationTime(item.startAt, true)">
                  {{ formatInformationTime(item.startAt) }}
                </time>
                <span v-if="item.endAt" class="num text-base-content/40">至 {{ formatInformationTime(item.endAt) }}</span>
                <span v-if="!item.done" class="flex items-center gap-1 text-base-content/45"><Languages class="h-3 w-3" />翻译中</span>
              </div>
              <h2 class="info-row__title" lang="zh-Hans">{{ item.titleZh || item.title }}</h2>
              <p v-if="item.titleZh" class="info-row__ja" lang="ja">{{ item.title }}</p>
            </div>
          </component>
        </li>
      </ul>

      <div v-if="visibleCount < filtered.length" class="text-center">
        <button type="button" class="btn btn-sm btn-ghost gap-2" @click="visibleCount += PAGE_SIZE">
          <ChevronDown class="h-4 w-4" /> 显示更多（还有 {{ filtered.length - visibleCount }} 条）
        </button>
      </div>

      <div v-if="filtered.length === 0" class="empty-state">
        <Megaphone />
        <p>没有符合条件的公告</p>
      </div>

      <section v-if="links.length" class="space-y-2 pt-2">
        <h2 class="text-sm font-semibold text-base-content/60">官方链接</h2>
        <div class="flex flex-wrap gap-1.5">
          <a v-for="item in links" :key="item.id" :href="item.url" target="_blank" rel="noopener noreferrer" class="chip">
            {{ item.titleZh || item.title }}
            <ExternalLink class="h-3 w-3 opacity-60" />
          </a>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.info-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 0.875rem;
}

.info-row.is-ended {
  opacity: 0.65;
}

.info-row__thumb {
  display: none;
  flex: none;
  width: 9rem;
  aspect-ratio: 16 / 7;
  border-radius: calc(var(--radius-field) - 0.125rem);
  background-color: var(--color-base-200);
  object-fit: cover;
}

@media (min-width: 640px) {
  .info-row__thumb {
    display: block;
  }
}

.info-row__title {
  margin-top: 0.3rem;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.info-row__ja {
  margin-top: 0.125rem;
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
  font-size: 0.8125rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
</style>
