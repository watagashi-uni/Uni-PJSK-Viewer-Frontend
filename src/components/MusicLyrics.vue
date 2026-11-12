<script setup lang="ts">
import { ref, shallowRef, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown, Languages, LocateFixed } from 'lucide-vue-next'
import {
  linePerformerIds, loadSongLyrics, lyricGaps, lyricParts, wordProgress,
  type LyricLine, type LyricWord, type SongLyrics,
} from '@/api/lyrics'
import { useSingerAvatars } from '@/composables/useSingerAvatars'
import SingerAvatars, { type SingerAvatar } from '@/components/player/SingerAvatars.vue'

const props = withDefaults(defineProps<{
  musicId: number
  vocalId?: number
  /** Audio bundle of the rendition: some lyrics name their reference version only by this. */
  assetbundle?: string
  vocalType?: string
  /** The audio being played is this song: lines follow the clock. Otherwise the lyrics are a plain reading view. */
  synced: boolean
  /** Position reported by the player a few times a second. */
  currentTime: number
  /** Length of the loaded audio; 0 while unknown. */
  duration: number
  playing: boolean
  /** Exact position for animation frames between the coarse updates. */
  clock?: () => number
  /** Silence in front of the song, so the intro marker starts with the music. */
  trimStart?: number
  /** panel: a card inside a page. immersive: fills a dark full-screen view. sidebar: fills a narrow column beside the page. */
  variant?: 'panel' | 'immersive' | 'sidebar'
}>(), { vocalId: undefined, assetbundle: undefined, vocalType: undefined, clock: undefined, trimStart: 0, variant: 'panel' })

const emit = defineEmits<{
  seek: [time: number]
  /** Portrait keys of whoever is singing now, or null when unknown or nobody is. */
  singing: [keys: string[] | null]
}>()

const TRANSLATION_KEY = 'player_lyricsTranslation'
/** Where the current line rests, as a fraction of the visible height. */
const ANCHOR_RATIO = { panel: 0.36, immersive: 0.3, sidebar: 0.3 } as const
const BROWSE_RESUME_MS = 4000

interface RenderPart { text: string; word?: LyricWord; avatars?: SingerAvatar[] }
interface LineItem { kind: 'line'; start: number; end: number; line: LyricLine; parts: RenderPart[]; singerKeys: string[] }
interface GapItem { kind: 'gap'; start: number; end: number }
type Item = LineItem | GapItem

const { performerAvatar } = useSingerAvatars()

const lyrics = shallowRef<SongLyrics | null>(null)
const loading = ref(false)
const failed = ref(false)
const expanded = ref(true)
const translated = ref(readTranslationPreference())
const following = ref(true)
/** Row the view is centred on: the last one that has started. -1 before the first. */
const anchor = ref(-1)
/** Rows being sung right now. */
const activeRows = ref<number[]>([])
const viewport = ref<HTMLElement>()
const track = ref<HTMLElement>()

let request = 0
let frame = 0
let resumeTimer: ReturnType<typeof setTimeout> | undefined
let resizeObserver: ResizeObserver | undefined
/** Timed words of the rows being sung, kept so each frame only touches those. */
const painted = new Map<number, HTMLElement[]>()
const rowMotion = new WeakMap<HTMLElement, Animation>()

function readTranslationPreference(): boolean {
  try {
    return localStorage.getItem(TRANSLATION_KEY) !== '0'
  } catch {
    return true
  }
}

async function load() {
  const serial = ++request
  lyrics.value = null
  loading.value = true
  failed.value = false
  following.value = true
  try {
    const data = await loadSongLyrics(props.musicId)
    if (serial === request) lyrics.value = data
  } catch {
    if (serial === request) failed.value = true
  } finally {
    if (serial === request) loading.value = false
  }
}
watch(() => props.musicId, load, { immediate: true })

// Singer assignments belong to the annotated rendition, not to every cover.
// That rendition is named by its vocal id, or by its audio bundle where no id was recorded.
const showPerformers = computed(() => {
  const data = lyrics.value
  if (!data) return false
  if (data.vocalId != null) return props.vocalId === data.vocalId
  return !!data.assetbundle && props.assetbundle === data.assetbundle
})
// Live recordings and renditions of another length do not share the annotated timing.
const mismatched = computed(() => !!lyrics.value && (
  props.vocalType === 'streaming_live'
  || (props.synced && props.duration > 0 && Math.abs(props.duration - lyrics.value.duration) >= 2)
))
/** Lines move with the music. Until the audio length is known the lyrics are shown as plain text. */
const live = computed(() => props.synced && !mismatched.value && props.duration > 0)
const hasTranslation = computed(() => !!lyrics.value?.lines.some(line => line.translation))

const items = computed<Item[]>(() => {
  const data = lyrics.value
  if (!data) return []
  const performers = data.performers || []
  const inSongOrder = (ids: string[]) => performers.filter(p => ids.includes(p.performerId))
  const setKey = (ids: string[]) => [...ids].sort().join('+')
  const gaps = lyricGaps(data.lines, props.trimStart)
  const result: Item[] = []
  let previousKey = ''
  data.lines.forEach((line, index) => {
    const gap = gaps.find(g => g.before === index)
    if (gap) {
      result.push({ kind: 'gap', start: gap.start, end: gap.end })
      previousKey = ''
    }
    const parts: RenderPart[] = lyricParts(line).map(part => ({ text: part.text, word: part.word }))
    let singerKeys: string[] = []
    if (showPerformers.value) {
      const union = inSongOrder(linePerformerIds(line))
      singerKeys = union.map(p => performerAvatar(p).key)
      const sung = lyricParts(line).map((part, n) => ({ n, key: part.text.trim() ? setKey(part.performerIds) : '', ids: part.performerIds }))
      const mixed = new Set(sung.filter(p => p.key).map(p => p.key)).size > 1
      if (mixed) {
        // Singers trade off inside the line: mark each hand-over where it happens.
        let last = ''
        for (const piece of sung) {
          if (!piece.key || piece.key === last) continue
          last = piece.key
          parts[piece.n]!.avatars = inSongOrder(piece.ids).map(performerAvatar)
        }
        previousKey = ''
      } else {
        // One voice (or one group) for the whole line: their portraits lead the line, on the
        // same row as the words, whenever they differ from whoever sang the line before.
        const key = setKey(union.map(p => p.performerId))
        if (key && key !== previousKey && parts[0]) parts[0].avatars = union.map(performerAvatar)
        previousKey = key
      }
    }
    result.push({ kind: 'line', start: line.start, end: line.end, line, parts, singerKeys })
  })
  return result
})

function now(): number {
  return props.clock ? props.clock() : props.currentTime
}

function rowElement(index: number): HTMLElement | undefined {
  return track.value?.children[index] as HTMLElement | undefined
}

/** Recompute which rows are current and advance the word fills. Runs every animation frame while playing. */
function tick(time: number) {
  const list = items.value
  let last = -1
  const active: number[] = []
  for (let i = 0; i < list.length; i++) {
    const item = list[i]!
    if (item.start > time) break
    last = i
    if (time < item.end) active.push(i)
  }
  if (last !== anchor.value) anchor.value = last
  const previous = activeRows.value
  if (active.length !== previous.length || active.some((row, n) => row !== previous[n])) activeRows.value = active
  paint(time, active)
}

function paint(time: number, active: number[]) {
  for (const [index, words] of painted) {
    if (active.includes(index)) continue
    for (const word of words) {
      word.style.removeProperty('--p')
      delete word.dataset.p
    }
    rowElement(index)?.style.removeProperty('--gap-progress')
    painted.delete(index)
  }
  for (const index of active) {
    const row = rowElement(index)
    if (!row) continue
    let words = painted.get(index)
    if (!words) {
      words = [...row.querySelectorAll<HTMLElement>('.ly-word')]
      painted.set(index, words)
    }
    const item = items.value[index]
    if (item?.kind === 'gap') {
      row.style.setProperty('--gap-progress', wordProgress(time, item).toFixed(3))
      continue
    }
    for (const word of words) {
      const progress = wordProgress(time, { start: Number(word.dataset.s), end: Number(word.dataset.e) })
      const value = progress.toFixed(3)
      if (word.dataset.p === value) continue
      word.dataset.p = value
      // The fill edge is a soft 12% ramp, so it runs from just before the word to just past it.
      word.style.setProperty('--p', `${(progress * 112 - 6).toFixed(1)}%`)
    }
  }
}

function clearPaint() {
  paint(0, [])
  anchor.value = -1
  activeRows.value = []
}

function loop() {
  tick(now())
  frame = requestAnimationFrame(loop)
}

watch([live, () => props.playing, expanded, items], () => {
  cancelAnimationFrame(frame)
  frame = 0
  // Rows may have been re-rendered: forget the cached word elements.
  painted.clear()
  if (!live.value || !expanded.value) {
    clearPaint()
    return
  }
  tick(now())
  if (props.playing) frame = requestAnimationFrame(loop)
}, { immediate: true, flush: 'post' })

// Paused: a seek still moves the lyrics.
watch(() => props.currentTime, () => {
  if (live.value && expanded.value && !frame) tick(now())
})

watch(activeRows, (rows) => {
  if (!showPerformers.value || !rows.length) {
    emit('singing', null)
    return
  }
  const keys = new Set<string>()
  for (const row of rows) {
    const item = items.value[row]
    if (item?.kind === 'line') item.singerKeys.forEach(key => keys.add(key))
  }
  emit('singing', keys.size ? [...keys] : null)
})

function reducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** How far a row currently sits from its resting place while a previous move is still settling. */
function settlingOffset(row: HTMLElement): number {
  const motion = rowMotion.get(row)
  if (!motion || motion.playState === 'finished' || motion.playState === 'idle') return 0
  const transform = getComputedStyle(row).transform
  return transform && transform !== 'none' ? new DOMMatrixReadOnly(transform).m42 : 0
}

/**
 * Bring the current line to its resting place. The container jumps there at once;
 * each visible row then glides from where it was, the rows below starting a beat
 * later than the one above, which gives the list its elastic, flowing motion.
 */
function follow(animate: boolean) {
  const box = viewport.value
  const list = track.value
  if (!box || !list) return
  const row = rowElement(Math.max(0, anchor.value))
  if (!row) return
  const lead = box.clientHeight * ANCHOR_RATIO[props.variant]
  const target = Math.max(0, Math.min(box.scrollHeight - box.clientHeight, anchor.value < 0 ? 0 : row.offsetTop - lead))
  const delta = target - box.scrollTop
  if (Math.abs(delta) < 0.5) return
  if (!animate || reducedMotion()) {
    box.scrollTop = target
    return
  }
  const top = Math.min(box.scrollTop, target) - 120
  const bottom = Math.max(box.scrollTop, target) + box.clientHeight + 120
  const moving: { row: HTMLElement; index: number; from: number }[] = []
  for (let i = 0; i < list.children.length; i++) {
    const el = list.children[i] as HTMLElement
    if (el.offsetTop + el.offsetHeight < top || el.offsetTop > bottom) continue
    moving.push({ row: el, index: i, from: settlingOffset(el) + delta })
  }
  box.scrollTop = target
  for (const { row: el, index, from } of moving) {
    rowMotion.get(el)?.cancel()
    const order = Math.max(0, Math.min(9, index - anchor.value + 1))
    rowMotion.set(el, el.animate(
      [{ transform: `translate3d(0, ${from}px, 0)` }, { transform: 'translate3d(0, 0, 0)' }],
      { duration: 760, delay: order * 46, easing: 'cubic-bezier(0.2, 0.95, 0.25, 1)', fill: 'backwards' },
    ))
  }
}

watch(anchor, () => {
  if (live.value && following.value) follow(true)
}, { flush: 'post' })

watch(following, (value) => {
  if (value && live.value) follow(true)
}, { flush: 'post' })

// Layout changed under the current line: put it back without a flourish.
watch([translated, items, expanded, live], async () => {
  await nextTick()
  if (live.value && following.value) follow(false)
}, { flush: 'post' })

watch(translated, (value) => {
  try {
    localStorage.setItem(TRANSLATION_KEY, value ? '1' : '0')
  } catch {
    // Preference simply does not persist.
  }
})

watch(viewport, (box, _old, onCleanup) => {
  if (!box) return
  resizeObserver = new ResizeObserver(() => {
    box.style.setProperty('--ly-height', `${box.clientHeight}px`)
    if (live.value && following.value) follow(false)
  })
  resizeObserver.observe(box)
  box.style.setProperty('--ly-height', `${box.clientHeight}px`)
  onCleanup(() => resizeObserver?.disconnect())
}, { flush: 'post' })

/** The reader took over the scroll position: stop following for a while. */
function browse() {
  if (!live.value) return
  following.value = false
  clearTimeout(resumeTimer)
  resumeTimer = setTimeout(() => { following.value = true }, BROWSE_RESUME_MS)
}

function resume() {
  clearTimeout(resumeTimer)
  following.value = true
}

function seek(time: number) {
  resume()
  emit('seek', time)
}

/**
 * The bit of text a portrait must not be separated from when the row wraps:
 * a whole Latin word, or one character for scripts written without spaces.
 */
function leadOf(text: string): string {
  return /^\s*(?:[A-Za-z0-9À-ÿ'’]+|\S)?/u.exec(text)?.[0] ?? ''
}

function isActive(index: number): boolean {
  return activeRows.value.includes(index)
}

function rowStyle(index: number) {
  return live.value ? { '--distance': Math.min(6, Math.abs(index - Math.max(0, anchor.value))) } : undefined
}

onMounted(() => {
  if (live.value) follow(false)
})

onBeforeUnmount(() => {
  request++
  cancelAnimationFrame(frame)
  clearTimeout(resumeTimer)
  resizeObserver?.disconnect()
})
</script>

<template>
  <section class="ly" :class="[`ly--${variant}`, { 'ly--fill': variant !== 'panel' }]" aria-label="同步歌词">
    <div class="ly-bar">
      <button v-if="variant === 'panel'" class="btn btn-ghost btn-sm gap-1" :aria-expanded="expanded" @click="expanded = !expanded">
        歌词 <ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': expanded }" />
      </button>
      <div v-if="lyrics?.lines.length && expanded && !mismatched" class="ly-actions">
        <Transition name="ly-chip">
          <button v-if="live && !following" class="ly-chip" @click="resume">
            <LocateFixed class="h-3.5 w-3.5" /> 回到当前句
          </button>
        </Transition>
        <button
          v-if="hasTranslation"
          class="ly-chip"
          :class="{ on: translated }"
          :aria-pressed="translated"
          :title="translated ? '隐藏译文' : '显示译文'"
          @click="translated = !translated"
        >
          <Languages class="h-3.5 w-3.5" /> 译文
        </button>
      </div>
    </div>

    <template v-if="expanded">
      <p v-if="loading" class="ly-status" role="status">正在加载歌词…</p>
      <p v-else-if="failed" class="ly-status">歌词加载失败 <button class="ly-chip ml-2" @click="load">重试</button></p>
      <p v-else-if="!lyrics?.lines.length" class="ly-status">暂无歌词</p>
      <p v-else-if="mismatched" class="ly-status">当前音频版本暂无匹配的歌词</p>
      <template v-else>
        <div
          ref="viewport"
          class="ly-viewport"
          :class="{ live, browsing: live && !following }"
          tabindex="0"
          :aria-label="live ? '歌词，点击任意句跳转播放' : '歌词，点击任意句从该处播放'"
          @wheel.passive="browse"
          @touchmove.passive="browse"
          @keydown="browse"
        >
          <div ref="track" class="ly-track">
            <div
              v-for="(item, index) in items"
              :key="index"
              class="ly-row"
              :class="{ active: isActive(index), past: live && index < anchor, 'ly-row--gap': item.kind === 'gap' }"
              :style="rowStyle(index)"
            >
              <div v-if="item.kind === 'gap'" class="ly-gap" aria-hidden="true"><i></i><i></i><i></i></div>
              <button v-else class="ly-line" :aria-current="isActive(index) ? 'true' : undefined" @click="seek(item.start)">
                <span class="ly-original" lang="ja"><template v-for="(part, n) in item.parts" :key="n"><template v-if="part.avatars"><span class="ly-glue" :class="{ 'ly-glue--break': n > 0 }"><SingerAvatars class="ly-handover" :singers="part.avatars" :size="variant === 'immersive' ? 28 : 22" /><span v-if="part.word" class="ly-word" :data-s="part.word.start" :data-e="part.word.end">{{ part.text }}</span><template v-else>{{ leadOf(part.text) }}</template></span><template v-if="!part.word">{{ part.text.slice(leadOf(part.text).length) }}</template></template><span v-else-if="part.word" class="ly-word" :data-s="part.word.start" :data-e="part.word.end">{{ part.text }}</span><template v-else>{{ part.text }}</template></template></span>
                <span v-if="translated && item.line.translation" class="ly-translation" lang="zh-CN">{{ item.line.translation }}</span>
              </button>
            </div>
          </div>
        </div>
        <details v-if="Object.keys(lyrics.credits || {}).length || lyrics.sources?.length" class="ly-credits">
          <summary>歌词来源与译者</summary>
          <p v-for="(name, role) in lyrics.credits" :key="role">{{ role === 'translation' ? '翻译' : role }}：{{ name }}</p>
          <p v-for="source in lyrics.sources" :key="source[0]"><a :href="source[0]" target="_blank" rel="noopener noreferrer" class="underline">歌词来源</a><template v-if="source[1]"> · <a v-if="source[2]" :href="source[2]" target="_blank" rel="noopener noreferrer" class="underline">{{ source[1] }}</a><span v-else>{{ source[1] }}</span></template></p>
        </details>
      </template>
    </template>
  </section>
</template>

<style scoped>
.ly {
  --ly-size: clamp(1.3rem, 2.7vw, 1.85rem);
  --ly-rest: 0.34;
  position: relative;
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.ly--panel {
  margin-top: 1.25rem;
  overflow: hidden;
  border-radius: 1rem;
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 14%, transparent), color-mix(in srgb, var(--color-secondary) 10%, transparent));
}

.ly--immersive {
  --ly-size: clamp(1.55rem, 2.3vw + 0.7rem, 2.7rem);
  --ly-rest: 0.3;
  color: #fff;
}

.ly--sidebar {
  --ly-size: clamp(1.2rem, 0.7vw + 0.8rem, 1.5rem);
  --ly-rest: 0.3;
}

/* Variants that take the whole height of their container instead of a fixed-height card. */
.ly--fill {
  height: 100%;
}

.ly-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}

.ly--fill .ly-bar {
  position: absolute;
  z-index: 2;
  top: 0;
  right: 0;
  padding: 0.25rem 0.5rem;
}

.ly-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-left: auto;
}

.ly-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 10%, transparent);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  opacity: 0.7;
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: opacity 0.2s, background-color 0.2s;
}

.ly-chip:hover,
.ly-chip.on {
  opacity: 1;
}

.ly-chip.on {
  background: color-mix(in srgb, currentColor 20%, transparent);
}

.ly-chip-enter-active,
.ly-chip-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.ly-chip-enter-from,
.ly-chip-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.ly-status {
  padding: 3rem 1rem;
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.6;
}

.ly--fill .ly-status {
  margin: auto;
}

.ly-viewport {
  position: relative;
  height: clamp(280px, 46vh, 450px);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  outline-offset: -2px;
  mask-image: linear-gradient(transparent, black 14%, black 82%, transparent);
}

.ly-viewport::-webkit-scrollbar {
  display: none;
}

.ly--fill .ly-viewport {
  flex: 1;
  height: auto;
  min-height: 0;
  /* Fully clear under the heading and the buttons that float over the top edge. */
  mask-image: linear-gradient(transparent 2.25rem, black 6.5rem, black 78%, transparent);
}

.ly-track {
  padding: 4.5rem clamp(1.25rem, 4vw, 3rem) 5rem;
}

/* Following the music: room above the first and below the last line so each can reach the resting place. */
.ly-viewport.live .ly-track {
  padding-top: calc(var(--ly-height, 400px) * 0.36);
  padding-bottom: calc(var(--ly-height, 400px) * 0.64);
}

.ly--immersive .ly-track {
  padding-inline: clamp(1rem, 3vw, 2.5rem);
}

.ly--sidebar .ly-track {
  padding-inline: 1.25rem;
}

.ly--fill .ly-viewport.live .ly-track {
  padding-top: calc(var(--ly-height, 600px) * 0.3);
  padding-bottom: calc(var(--ly-height, 600px) * 0.7);
}

.ly-line {
  display: block;
  width: 100%;
  padding: 0.7em 0;
  text-align: left;
  font-size: var(--ly-size);
  cursor: pointer;
  opacity: 0.86;
  transform-origin: left center;
  transition: opacity 0.5s ease, filter 0.5s ease, transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.ly-line:focus-visible {
  outline-offset: 4px;
  border-radius: 0.5rem;
}

/* Lines waiting their turn recede with distance; the reader can still pull any of them forward. */
.live .ly-line {
  opacity: var(--ly-rest);
  filter: blur(calc(min(var(--distance, 0), 4) * 0.75px));
  transform: scale(0.96);
}

.live .ly-row.active .ly-line,
.live .ly-line:hover,
.live .ly-line:focus-visible {
  opacity: 1;
  filter: none;
}

.live .ly-row.active .ly-line {
  transform: none;
}

.browsing .ly-line {
  opacity: 0.6;
  filter: none;
}

.ly-original {
  display: block;
  /* The site is set in Chinese fonts, which draw many kanji with Chinese shapes.
     Lyrics are Japanese: Latin from the system font, kana and kanji from a Japanese one. */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', 'Yu Gothic', Meiryo, 'Noto Sans JP', 'Noto Sans CJK JP', sans-serif;
  font-weight: 800;
  line-height: 1.38;
  letter-spacing: -0.005em;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

/* Sung text is solid, text still to come is faint, and the boundary sweeps across each timed unit. */
.ly-row.active .ly-word {
  --p: -6%;
  /* Safari lets a hairline of a text-clipped background leak along the edges of the box, which
     showed as a line above and below the current lyric. The box is therefore made larger than
     the glyphs (the padding and the negative margin cancel out, so nothing moves) and the
     gradient is kept off its outermost pixels: there is nothing at the edges left to leak. */
  margin-inline: -2px;
  padding: 0.2em 2px;
  background-image: linear-gradient(to right, currentColor calc(var(--p) - 6%), color-mix(in srgb, currentColor 34%, transparent) calc(var(--p) + 6%));
  background-repeat: no-repeat;
  background-position: center;
  background-size: calc(100% - 2px) calc(100% - 4px);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

@media (forced-colors: active) {
  .ly-row.active .ly-word {
    background: none;
    -webkit-text-fill-color: currentColor;
  }
}

.ly-translation {
  display: block;
  margin-top: 0.4em;
  /* Follows the lyric size, but never drops below a comfortable reading size in narrow columns. */
  font-size: max(0.66em, 0.875rem);
  font-weight: 600;
  line-height: 1.5;
  opacity: 0.72;
  white-space: pre-wrap;
}

/* A portrait never ends a row on its own: it wraps together with the first word it introduces. */
.ly-glue {
  white-space: nowrap;
}

/* When the singers change inside a line, the next voice starts its own row, portrait first. */
.ly-glue--break::before {
  content: '\A';
  white-space: pre;
}

/* Portraits sit in the text flow, at the head of the words they sing. */
.ly-handover {
  margin: -0.14em 0.32em 0 3px;
  -webkit-text-fill-color: currentColor;
}

/* Instrumental stretch: three dots fill up as the next line approaches. The row keeps
   its height when idle, so nothing below it shifts and the break reads as a stanza gap. */
.ly-gap {
  display: flex;
  gap: 0.5rem;
  height: calc(var(--ly-size) * 1.7);
  align-items: center;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.ly-row.active .ly-gap {
  opacity: 1;
}

.ly-viewport:not(.live) .ly-row--gap {
  display: none;
}

.ly-gap i {
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 999px;
  background: currentColor;
  opacity: clamp(0.28, calc(var(--gap-progress, 0) * 3 - var(--dot) + 0.28), 1);
  animation: ly-breathe 2.6s ease-in-out infinite;
}

.ly-gap i:nth-child(1) { --dot: 0; }
.ly-gap i:nth-child(2) { --dot: 1; animation-delay: 0.18s; }
.ly-gap i:nth-child(3) { --dot: 2; animation-delay: 0.36s; }

@keyframes ly-breathe {
  0%, 100% { transform: scale(0.86); }
  50% { transform: scale(1.12); }
}

.ly-credits {
  padding: 0 1.25rem 0.75rem;
  font-size: 0.75rem;
  opacity: 0.6;
}

.ly-credits summary {
  cursor: pointer;
}

.ly-credits p {
  margin-top: 0.5rem;
}

.ly--immersive .ly-credits {
  padding: 0.5rem clamp(1rem, 3vw, 2.5rem) 0;
  opacity: 0.5;
}

.ly--sidebar .ly-credits {
  padding: 0.5rem 1.25rem 0.75rem;
}

@media (prefers-reduced-motion: reduce) {
  .ly-line {
    transition: none;
    transform: none !important;
    filter: none !important;
  }

  .ly-gap i {
    animation: none;
  }
}
</style>
