<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, X, CornerDownLeft, Clock, Loader2, Palette,
  Calendar, BarChart3, Zap, CalendarDays, Music, Image, BookOpen, User, Users, Gift, Radio, FileText, Sparkles,
} from 'lucide-vue-next'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import { useModalDialog } from '@/composables/useModalDialog'
import { useSearchIndex, type SearchSource } from '@/composables/useSearchIndex'
import { useSettingsStore } from '@/stores/settings'
import { trackEvent } from '@/utils/analytics'
import { joinSearchText, searchEntries, type SearchEntry, type SearchKind } from '@/utils/globalSearch'
import { extraPages, navGroups, type NavItem } from '@/utils/navigation'
import { themeOptions } from '@/utils/themes'

const router = useRouter()
const settings = useSettingsStore()
const search = useGlobalSearch()
const index = useSearchIndex()

const { onDialogClose } = useModalDialog('searchDialog', () => search.isOpen.value, () => search.close())

const KIND_LABELS: Record<SearchKind, string> = {
  page: '页面',
  character: '角色',
  music: '歌曲',
  card: '卡片',
  event: '活动',
  gacha: '卡池',
  vlive: '虚拟 Live',
  action: '操作',
}
const KIND_ICONS: Record<SearchKind, Component> = {
  page: FileText,
  character: Users,
  music: Music,
  card: Image,
  event: Calendar,
  gacha: Gift,
  vlive: Radio,
  action: Sparkles,
}
const KIND_ORDER: readonly SearchKind[] = ['page', 'action', 'character', 'music', 'card', 'event', 'gacha', 'vlive']
/** 横幅图（活动、卡池、虚拟 Live）用宽缩略图，其余是方形 */
const WIDE_KINDS: readonly SearchKind[] = ['event', 'gacha', 'vlive']
const SOURCE_KINDS: readonly SearchSource[] = ['character', 'music', 'event', 'card', 'gacha', 'vlive']
const PREVIEW_LIMIT = 4
const FULL_LIMIT = 60
const DEBOUNCE_MS = 120
const RECENT_KEY = 'global_search_recent'
const RECENT_LIMIT = 6

// ---------------------------------------------------------------- 固定条目：页面和操作

const pageItems: NavItem[] = [...navGroups.flatMap(group => group.items), ...extraPages]
const pageIcons = new Map<string, Component>(pageItems.map(item => [item.to, item.icon]))
const pageEntries: SearchEntry[] = pageItems.map((item, position) => ({
  kind: 'page',
  id: item.to,
  title: item.label,
  sub: item.description,
  meta: '',
  path: item.to,
  image: '',
  keys: joinSearchText([item.label]),
  hay: joinSearchText([item.label, item.description, item.keywords]),
  order: -position,
  hiddenUntil: 0,
  num: -1,
}))

const actionEntries: SearchEntry[] = themeOptions.map((theme, position) => ({
  kind: 'action',
  id: `theme:${theme.value}`,
  title: `切换主题：${theme.label}`,
  sub: theme.description,
  meta: '',
  path: '',
  image: '',
  keys: joinSearchText([`主题 ${theme.label}`, theme.label]),
  hay: joinSearchText([`切换主题 ${theme.label}`, theme.description, 'theme 外观 配色 皮肤 夜间 黑暗']),
  order: -position,
  hiddenUntil: 0,
  num: -1,
}))

function runAction(entry: SearchEntry): void {
  if (entry.id.startsWith('theme:')) settings.setTheme(entry.id.slice('theme:'.length))
}

// ---------------------------------------------------------------- 输入与搜索

const inputRef = ref<HTMLInputElement | null>(null)
const bodyRef = ref<HTMLElement | null>(null)
const query = ref('')
const debounced = ref('')
const activeKind = ref<SearchKind | 'all'>('all')
const activeIndex = ref(0)
let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(query, (value) => {
  const text = value.trim()
  // 第一次输入时才加载卡片、卡池这些大表
  if (text) index.ensureAll()
  clearTimeout(debounceTimer)
  if (!text) {
    debounced.value = ''
    return
  }
  debounceTimer = setTimeout(() => { debounced.value = text }, DEBOUNCE_MS)
})

interface ResultGroup {
  kind: SearchKind
  items: SearchEntry[]
  total: number
}

const groups = computed<ResultGroup[]>(() => {
  const text = debounced.value
  if (!text) return []
  const options = { now: Date.now(), showSpoilers: settings.showSpoilers }
  return KIND_ORDER.map((kind) => {
    const source = kind === 'page' ? pageEntries : kind === 'action' ? actionEntries : index.entries[kind]
    const limit = activeKind.value === kind ? FULL_LIMIT : PREVIEW_LIMIT
    return { kind, ...searchEntries(source, text, { ...options, limit }) }
  })
})

const matchedGroups = computed(() => groups.value.filter(group => group.total > 0))
const totalMatches = computed(() => matchedGroups.value.reduce((sum, group) => sum + group.total, 0))
const visibleGroups = computed(() => (
  activeKind.value === 'all' ? matchedGroups.value : matchedGroups.value.filter(group => group.kind === activeKind.value)
))

// 换了关键词后，之前选中的分类可能已经没有结果
watch(matchedGroups, (list) => {
  if (activeKind.value !== 'all' && !list.some(group => group.kind === activeKind.value)) activeKind.value = 'all'
})

const loadingSources = computed(() => SOURCE_KINDS.filter(source => index.states[source] === 'loading'))
const failedSources = computed(() => SOURCE_KINDS.filter(source => index.states[source] === 'error'))

// ---------------------------------------------------------------- 没有输入时：常用入口和最近打开

interface QuickLink {
  label: string
  hint: string
  path: string
  icon: Component
}

/** 当前（或最近一期）活动，活动数据加载好之后才有 */
const currentEvent = computed(() => {
  const now = Date.now()
  let latest: SearchEntry | undefined
  for (const entry of index.entries.event) {
    if (entry.hiddenUntil <= now && (!latest || entry.order > latest.order)) latest = entry
  }
  return latest
})

const quickLinks = computed<QuickLink[]>(() => [
  {
    label: '当期活动',
    hint: currentEvent.value?.title ?? '活动详情和奖励',
    path: currentEvent.value?.path ?? '/events',
    icon: Calendar,
  },
  { label: '实时榜线', hint: '排名和分数线', path: '/ranking', icon: BarChart3 },
  { label: '自动组队', hint: '按活动推荐卡组', path: '/deck-recommend', icon: Zap },
  { label: '游戏日历', hint: '近期日程', path: '/calendar', icon: CalendarDays },
  { label: '歌曲', hint: '谱面和试听', path: '/musics', icon: Music },
  { label: '卡片', hint: '卡面和技能', path: '/cards', icon: Image },
  { label: '剧情', hint: '活动和主线', path: '/stories', icon: BookOpen },
  { label: '个人信息', hint: '名片和卡组', path: '/profile', icon: User },
])

type RecentEntry = Pick<SearchEntry, 'kind' | 'id' | 'title' | 'sub' | 'meta' | 'path' | 'image'>

function readRecent(): RecentEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(item => item && typeof item.path === 'string' && typeof item.title === 'string' && item.kind in KIND_LABELS)
      .slice(0, RECENT_LIMIT)
  } catch {
    return []
  }
}

const recent = ref<RecentEntry[]>(readRecent())

function remember(entry: SearchEntry | RecentEntry): void {
  const { kind, id, title, sub, meta, path, image } = entry
  recent.value = [
    { kind, id, title, sub, meta, path, image },
    ...recent.value.filter(item => !(item.kind === kind && item.id === id)),
  ].slice(0, RECENT_LIMIT)
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value)) } catch { /* 存储不可用 */ }
}

function clearRecent(): void {
  recent.value = []
  try { localStorage.removeItem(RECENT_KEY) } catch { /* 存储不可用 */ }
}

// ---------------------------------------------------------------- 键盘选择

type Row =
  | { type: 'quick'; key: string; link: QuickLink }
  | { type: 'entry'; key: string; entry: SearchEntry | RecentEntry }

const showingResults = computed(() => debounced.value !== '')

/** 当前画面上可以用方向键选中的全部条目，顺序和显示一致 */
const rows = computed<Row[]>(() => {
  if (showingResults.value) {
    return visibleGroups.value.flatMap(group => (
      group.items.map<Row>(entry => ({ type: 'entry', key: `${entry.kind}:${entry.id}`, entry }))
    ))
  }
  return [
    ...quickLinks.value.map<Row>(link => ({ type: 'quick', key: `quick:${link.label}`, link })),
    ...recent.value.map<Row>(entry => ({ type: 'entry', key: `recent:${entry.kind}:${entry.id}`, entry })),
  ]
})

const rowIndex = computed(() => new Map(rows.value.map((row, position) => [row.key, position])))
function indexOf(key: string): number {
  return rowIndex.value.get(key) ?? -1
}

watch(rows, () => { activeIndex.value = 0 })

function scrollActiveIntoView(): void {
  void nextTick(() => {
    bodyRef.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  })
}

function move(step: number): void {
  const count = rows.value.length
  if (!count) return
  activeIndex.value = (activeIndex.value + step + count) % count
  scrollActiveIntoView()
}

function close(): void {
  search.close()
}

function openEntry(entry: SearchEntry | RecentEntry): void {
  trackEvent('global-search', { kind: entry.kind })
  if (entry.kind === 'action') {
    runAction(entry as SearchEntry)
    close()
    return
  }
  remember(entry)
  close()
}

function activate(row: Row | undefined): void {
  if (!row) return
  if (row.type === 'quick') {
    trackEvent('global-search', { kind: 'quick' })
    close()
    void router.push(row.link.path)
    return
  }
  const { entry } = row
  openEntry(entry)
  if (entry.path) void router.push(entry.path)
}

function onInputKeydown(event: KeyboardEvent): void {
  // 输入法选字时的回车、方向键不处理
  if (event.isComposing) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    activate(rows.value[activeIndex.value])
  }
}

function clearQuery(): void {
  query.value = ''
  inputRef.value?.focus()
}

// ---------------------------------------------------------------- 打开 / 关闭

watch(
  () => search.isOpen.value,
  (open) => {
    if (!open) return
    query.value = search.initialQuery.value
    debounced.value = search.initialQuery.value.trim()
    activeKind.value = 'all'
    activeIndex.value = 0
    recent.value = readRecent()
    // 点开搜索才开始加载数据
    index.ensureBasics()
    if (debounced.value) index.ensureAll()
    void nextTick(() => {
      inputRef.value?.focus()
      inputRef.value?.select()
    })
  },
  { immediate: true },
)

// 通过链接跳转后收起面板
const stopAfterEach = router.afterEach(() => {
  if (search.isOpen.value) close()
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  stopAfterEach()
})

// ---------------------------------------------------------------- 展示

const failedImages = ref(new Set<string>())

function imageUrl(entry: SearchEntry | RecentEntry): string {
  if (!entry.image || failedImages.value.has(entry.image)) return ''
  return entry.image.startsWith('/') ? entry.image : `${settings.assetsHost}/${entry.image}`
}

function onImageError(entry: SearchEntry | RecentEntry): void {
  failedImages.value = new Set(failedImages.value).add(entry.image)
}

function entryIcon(entry: SearchEntry | RecentEntry): Component {
  if (entry.kind === 'page') return pageIcons.get(entry.path) ?? FileText
  if (entry.kind === 'action') return Palette
  return KIND_ICONS[entry.kind]
}

/** 把标题里命中的部分拆出来加粗显示 */
function highlight(text: string): [string, string, string] {
  const needle = debounced.value.replace(/^#/, '').toLowerCase()
  const at = needle ? text.toLowerCase().indexOf(needle) : -1
  if (at < 0) return [text, '', '']
  return [text.slice(0, at), text.slice(at, at + needle.length), text.slice(at + needle.length)]
}

function sourceNames(sources: readonly SearchSource[]): string {
  return sources.map(source => KIND_LABELS[source]).join('、')
}
</script>

<template>
  <dialog
    ref="searchDialog"
    class="gs"
    aria-label="搜索"
    @close="onDialogClose"
    @click.self="close"
  >
    <div class="gs__panel">
      <div class="gs__input-row">
        <Search class="h-5 w-5 shrink-0 text-base-content/45" />
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          inputmode="search"
          enterkeyhint="search"
          class="gs__input"
          placeholder="搜索歌曲、卡片、活动、角色、页面"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          role="combobox"
          aria-expanded="true"
          aria-controls="gs-list"
          aria-autocomplete="list"
          @keydown="onInputKeydown"
        />
        <button v-if="query" type="button" class="btn btn-ghost btn-xs btn-circle" aria-label="清空" @click="clearQuery">
          <X class="h-4 w-4" />
        </button>
        <button type="button" class="gs__close" @click="close">
          <span class="kbd-hint hidden sm:inline-flex">Esc</span>
          <span class="sm:hidden">取消</span>
        </button>
      </div>

      <!-- 分类：只列出有结果的 -->
      <div v-if="showingResults && matchedGroups.length > 1" class="gs__kinds hide-scrollbar">
        <button
          type="button"
          class="gs__kind"
          :class="{ 'is-active': activeKind === 'all' }"
          @click="activeKind = 'all'"
        >
          全部 <span class="num opacity-60">{{ totalMatches }}</span>
        </button>
        <button
          v-for="group in matchedGroups"
          :key="group.kind"
          type="button"
          class="gs__kind"
          :class="{ 'is-active': activeKind === group.kind }"
          @click="activeKind = group.kind"
        >
          {{ KIND_LABELS[group.kind] }} <span class="num opacity-60">{{ group.total }}</span>
        </button>
      </div>

      <div id="gs-list" ref="bodyRef" class="gs__body" role="listbox">
        <!-- 没有输入：常用入口 + 最近打开 -->
        <template v-if="!showingResults">
          <p class="gs__heading">常用入口</p>
          <div class="gs__quick">
            <RouterLink
              v-for="link in quickLinks"
              :key="link.label"
              :to="link.path"
              class="gs__quick-item"
              role="option"
              :aria-selected="activeIndex === indexOf(`quick:${link.label}`)"
              :data-active="activeIndex === indexOf(`quick:${link.label}`)"
              @mousemove="activeIndex = indexOf(`quick:${link.label}`)"
              @click="close"
            >
              <component :is="link.icon" class="h-[1.15rem] w-[1.15rem] shrink-0 text-primary" />
              <span class="min-w-0">
                <span class="block truncate text-sm font-medium">{{ link.label }}</span>
                <span class="block truncate text-xs text-base-content/55">{{ link.hint }}</span>
              </span>
            </RouterLink>
          </div>

          <template v-if="recent.length">
            <div class="gs__heading flex items-center justify-between">
              <span>最近打开</span>
              <button type="button" class="font-normal text-base-content/50 hover:text-base-content" @click="clearRecent">清除</button>
            </div>
            <RouterLink
              v-for="entry in recent"
              :key="`${entry.kind}:${entry.id}`"
              :to="entry.path"
              class="gs__item"
              role="option"
              :aria-selected="activeIndex === indexOf(`recent:${entry.kind}:${entry.id}`)"
              :data-active="activeIndex === indexOf(`recent:${entry.kind}:${entry.id}`)"
              @mousemove="activeIndex = indexOf(`recent:${entry.kind}:${entry.id}`)"
              @click="openEntry(entry)"
            >
              <span class="gs__thumb" :class="{ 'is-wide': WIDE_KINDS.includes(entry.kind) }">
                <img v-if="imageUrl(entry)" :src="imageUrl(entry)" alt="" loading="lazy" decoding="async" @error="onImageError(entry)" />
                <Clock v-else class="h-4 w-4" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium">{{ entry.title }}</span>
                <span v-if="entry.sub" class="block truncate text-xs text-base-content/55">{{ entry.sub }}</span>
              </span>
              <span class="gs__meta">{{ KIND_LABELS[entry.kind] }}</span>
            </RouterLink>
          </template>

          <p class="gs__tip">
            支持译名、日文读音和罗马音；输入 <span class="num font-medium text-base-content/70">#225</span> 这样的编号可以直接找到对应条目。
          </p>
        </template>

        <!-- 搜索结果 -->
        <template v-else>
          <section v-for="group in visibleGroups" :key="group.kind">
            <div class="gs__heading flex items-center justify-between">
              <span>{{ KIND_LABELS[group.kind] }}</span>
              <button
                v-if="activeKind === 'all' && group.total > group.items.length"
                type="button"
                class="font-normal text-primary hover:underline"
                @click="activeKind = group.kind"
              >
                查看全部 {{ group.total }} 条
              </button>
            </div>
            <component
              :is="entry.path ? 'RouterLink' : 'button'"
              v-for="entry in group.items"
              :key="`${entry.kind}:${entry.id}`"
              :to="entry.path || undefined"
              :type="entry.path ? undefined : 'button'"
              class="gs__item"
              role="option"
              :aria-selected="activeIndex === indexOf(`${entry.kind}:${entry.id}`)"
              :data-active="activeIndex === indexOf(`${entry.kind}:${entry.id}`)"
              @mousemove="activeIndex = indexOf(`${entry.kind}:${entry.id}`)"
              @click="openEntry(entry)"
            >
              <span class="gs__thumb" :class="{ 'is-wide': WIDE_KINDS.includes(entry.kind) }">
                <img v-if="imageUrl(entry)" :src="imageUrl(entry)" alt="" loading="lazy" decoding="async" @error="onImageError(entry)" />
                <component :is="entryIcon(entry)" v-else class="h-4 w-4" />
              </span>
              <span class="min-w-0 flex-1 text-left">
                <span class="block truncate text-sm font-medium">
                  <template v-for="(part, position) in highlight(entry.title)" :key="position">
                    <mark v-if="position === 1 && part" class="gs__mark">{{ part }}</mark>
                    <template v-else>{{ part }}</template>
                  </template>
                </span>
                <span v-if="entry.sub" class="block truncate text-xs text-base-content/55">{{ entry.sub }}</span>
              </span>
              <span v-if="entry.meta" class="gs__meta">{{ entry.meta }}</span>
              <CornerDownLeft class="gs__enter h-3.5 w-3.5" />
            </component>
          </section>

          <p v-if="loadingSources.length" class="gs__status" role="status">
            <Loader2 class="h-4 w-4 animate-spin" />
            正在加载{{ sourceNames(loadingSources) }}数据
          </p>
          <p v-for="source in failedSources" :key="source" class="gs__status">
            {{ KIND_LABELS[source] }}数据加载失败
            <button type="button" class="font-medium text-primary hover:underline" @click="index.retry(source)">重试</button>
          </p>

          <div v-if="!visibleGroups.length && !loadingSources.length" class="empty-state">
            <Search />
            <p>没有找到和「{{ debounced }}」有关的内容</p>
            <p class="text-xs">可以换成译名、日文原名、读音，或者用 #编号 查找</p>
          </div>
        </template>
      </div>

      <div class="gs__foot">
        <span><span class="kbd-hint">↑</span><span class="kbd-hint">↓</span> 选择</span>
        <span><span class="kbd-hint">Enter</span> 打开</span>
        <span><span class="kbd-hint">{{ search.shortcutLabel }}</span> 随时呼出</span>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.gs {
  position: fixed;
  inset: 0;
  width: 100vw;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-base-content);
  overflow: hidden;
}

.gs::backdrop {
  background-color: rgb(8 12 20 / 0.5);
}

.gs__panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: var(--color-base-100);
}

@media (min-width: 640px) {
  .gs__panel {
    width: min(42rem, calc(100vw - 2rem));
    height: auto;
    max-height: min(38rem, calc(100dvh - 12vh - 1.5rem));
    margin: 12vh auto 0;
    border: 1px solid var(--color-base-300);
    border-radius: var(--radius-box);
    box-shadow: var(--shadow-float);
    overflow: hidden;
  }
}

.gs__input-row {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid var(--color-base-300);
}

/* 16px：小于这个字号 iOS 会在聚焦时放大页面 */
.gs__input {
  flex: 1;
  min-width: 0;
  height: 2rem;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 1rem;
}

.gs__input::placeholder {
  color: color-mix(in oklab, var(--color-base-content) 40%, transparent);
}

.gs__close {
  flex: none;
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 500;
}

.gs__kinds {
  display: flex;
  flex: none;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-bottom: 1px solid var(--color-base-300);
  overflow-x: auto;
}

.gs__kind {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.3rem;
  height: 1.75rem;
  padding: 0 0.625rem;
  border-radius: 999px;
  background-color: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  color: color-mix(in oklab, var(--color-base-content) 75%, transparent);
  font-size: 0.8125rem;
  font-weight: 500;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.gs__kind:hover {
  background-color: color-mix(in oklab, var(--color-base-content) 11%, transparent);
}

.gs__kind.is-active {
  background-color: var(--color-primary);
  color: var(--color-primary-content);
}

.gs__body {
  flex: 1;
  min-height: 0;
  padding: 0.25rem 0.5rem 0.5rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.gs__heading {
  padding: 0.625rem 0.5rem 0.3rem;
  color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
  font-size: 0.75rem;
  font-weight: 600;
}

.gs__quick {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25rem;
}

@media (min-width: 640px) {
  .gs__quick {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.gs__quick-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-field);
}

.gs__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 3rem;
  padding: 0.3rem 0.5rem;
  border-radius: var(--radius-field);
}

.gs__quick-item[data-active="true"],
.gs__item[data-active="true"] {
  background-color: color-mix(in oklab, var(--color-primary) 11%, transparent);
}

.gs__thumb {
  display: grid;
  flex: none;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background-color: color-mix(in oklab, var(--color-base-content) 6%, transparent);
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
  overflow: hidden;
}

.gs__thumb.is-wide {
  width: 4.75rem;
}

.gs__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 卡池 logo 是透明底的不规则图形，完整显示而不是裁切 */
.gs__thumb.is-wide img {
  object-fit: contain;
}

.gs__mark {
  background: none;
  color: var(--color-primary);
  font-weight: 700;
}

.gs__meta {
  flex: none;
  max-width: 38%;
  overflow: hidden;
  color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gs__enter {
  display: none;
  flex: none;
  color: var(--color-primary);
}

@media (hover: hover) {
  .gs__item[data-active="true"] .gs__enter {
    display: block;
  }
}

.gs__status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
  font-size: 0.8125rem;
}

.gs__tip {
  padding: 0.875rem 0.5rem 0.375rem;
  color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
  font-size: 0.75rem;
  line-height: 1.25rem;
}

.gs__foot {
  display: none;
  flex: none;
  gap: 1rem;
  padding: 0.5rem 0.875rem;
  border-top: 1px solid var(--color-base-300);
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
  font-size: 0.75rem;
}

.gs__foot > span {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

@media (min-width: 640px) and (hover: hover) {
  .gs__foot {
    display: flex;
  }
}
</style>

<style>
/* 面板打开时页面不跟着滚动 */
:root:has(dialog.gs[open]) {
  overflow: hidden;
  scrollbar-gutter: stable;
}
</style>
