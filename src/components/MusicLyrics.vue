<script setup lang="ts">
import { ref, shallowRef, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown, Languages, LocateFixed, Type } from 'lucide-vue-next'
import {
  linePerformerIds, loadSongLyrics, lyricGaps, lyricParts, lyricRuns, lyricsForVocal, pieceProgress, untimedFill, wordProgress,
  SAME_CUE_SEC, type LyricLine, type LyricsPayload, type LyricWord,
} from '@/api/lyrics'
import { useMasterStore } from '@/stores/master'
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
const RUBY_KEY = 'player_lyricsRuby'
const ROMAJI_KEY = 'player_lyricsRomaji'
/** Where the current line rests, as a fraction of the visible height. */
const ANCHOR_RATIO = { panel: 0.36, immersive: 0.3, sidebar: 0.3 } as const
const BROWSE_RESUME_MS = 4000
/** Delay between one row and the next as the lines glide into place. */
const ROW_STAGGER_MS = 30
/** Rows further down than this all start together with the last of them. */
const ROW_STAGGER_ROWS = 6
/** How firmly a row is pulled to its resting place, per second. */
const GLIDE_RATE = 10
/**
 * A line counts as started this much before its cue. A seek lands on the cue itself, and the
 * audio clock may read back a hair earlier, which would otherwise leave the line above current.
 */
const CUE_SLACK_SEC = 0.01
/** Phone-sized windows, where a line wraps into tall rows and only a few of them are in view. */
const NARROW_QUERY = '(max-width: 899px)'

interface RenderPart { text: string; word?: LyricWord; avatars?: SingerAvatar[] }
/** When a piece of text fills on a word-timed line; `share` is its stretch of a unit a reading cut. */
interface Fill { start: number; end: number; share?: [number, number] }
interface Segment { text: string; fill?: Fill }
/**
 * Text under a reading (drawn as ruby), or one piece of bare text. A portrait is glued to
 * `head`, the bit it must not be separated from when the row wraps; `tail` follows freely.
 */
type RenderRun =
  | { kind: 'ruby'; reading: string; segments: Segment[]; avatars?: SingerAvatar[]; timed: boolean; breaks?: boolean }
  | { kind: 'text'; avatars?: SingerAvatar[]; head: Segment[]; tail: Segment[]; breaks?: boolean }
/** From `start` on, these portraits are the ones singing (until the next voice of the line). */
interface Voice { start: number; keys: string[] }
interface LineItem { kind: 'line'; start: number; end: number; line: LyricLine; runs: RenderRun[]; singerKeys: string[]; voices?: Voice[] }
interface GapItem { kind: 'gap'; start: number; end: number }
type Item = LineItem | GapItem

const { performerAvatar } = useSingerAvatars()
const master = useMasterStore()

/** The song's lyrics resource, holding every rendition recorded for it. */
const resource = shallowRef<LyricsPayload | null>(null)
const loading = ref(false)
const failed = ref(false)
const expanded = ref(true)
const translated = ref(readPreference(TRANSLATION_KEY))
const rubied = ref(readPreference(RUBY_KEY))
/**
 * Romaji and the translation take turns under the lines: switching one on switches the
 * other off, so a line never grows two extra rows. Romaji starts off, the translation on.
 */
const romanized = ref(readPreference(ROMAJI_KEY, false) && !translated.value)
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
/** A filling element of a row being sung. A reading fills by the text under it. */
interface Painted { el: HTMLElement; fill?: Fill; under?: { painted: Painted; weight: number }[]; value?: string }
/** Filling elements of the rows being sung, kept so each frame only touches those. */
const painted = new Map<number, Painted[]>()
/** Portrait keys last reported through `singing`, so a frame only reports a change. */
let singingKey: string | null = null

/** On/off switches remembered across visits. */
function readPreference(key: string, initial = true): boolean {
  try {
    const saved = localStorage.getItem(key)
    return saved === null ? initial : saved !== '0'
  } catch {
    return initial
  }
}

async function load() {
  const serial = ++request
  resource.value = null
  loading.value = true
  failed.value = false
  following.value = true
  try {
    const data = await loadSongLyrics(props.musicId)
    if (serial === request) resource.value = data
  } catch {
    if (serial === request) failed.value = true
  } finally {
    if (serial === request) loading.value = false
  }
}
watch(() => props.musicId, load, { immediate: true })

/**
 * The lines for the rendition being heard. Every rendition is sung to the same backing
 * track and shares one timeline; the singers are shown where they were annotated for it.
 */
const selection = computed(() => resource.value && lyricsForVocal(resource.value, { vocalId: props.vocalId, assetbundle: props.assetbundle }))
const lyrics = computed(() => selection.value?.lyrics ?? null)
// Another rendition picked: back to the current line.
watch([() => props.vocalId, () => props.assetbundle], () => resume())

interface CreditRow { id: number; lyricist?: string; composer?: string }
const credit = shallowRef<CreditRow | null>(null)
watch(() => props.musicId, async (id) => {
  credit.value = null
  try {
    const row = (await master.getMaster<CreditRow>('musics')).find(m => m.id === id)
    if (props.musicId === id) credit.value = row || null
  } catch {
    // The lyrics simply show without credits.
  }
}, { immediate: true })
/** Lyricist and composer, shown above the first line. Master writes "-" where there is none. */
const credits = computed(() => {
  const row = credit.value
  const named = (value?: string) => (value && value.trim() !== '-' ? value.trim() : '')
  return [['作词', named(row?.lyricist)], ['作曲', named(row?.composer)]].filter(([, name]) => name) as [string, string][]
})
/** Children of the track in front of the first row. */
const headRows = computed(() => (credits.value.length || untimedNote.value ? 1 : 0))
/** The Inst. ver. of a song has nothing to sing along to. */
const instrumental = computed(() => props.vocalType === 'instrumental')

// Singer assignments belong to the rendition they were written for, not to every cover.
const showPerformers = computed(() => !!selection.value?.singers)
// Live recordings and audio of another length do not share the annotated timing.
const mismatched = computed(() => !!lyrics.value && (
  props.vocalType === 'streaming_live'
  || (props.synced && props.duration > 0 && Math.abs(props.duration - lyrics.value.duration) >= 2)
))
/** Shown above the lines when they cannot follow this rendition. */
const untimedNote = computed(() => (lyrics.value?.lines.length && !instrumental.value && mismatched.value ? '暂无该演唱版本时间轴' : ''))
/** Lines move with the music. Until the audio length is known the lyrics are shown as plain text. */
const live = computed(() => props.synced && !instrumental.value && !mismatched.value && props.duration > 0)
const hasTranslation = computed(() => !!lyrics.value?.lines.some(line => line.translation))
const hasRuby = computed(() => !!lyrics.value?.lines.some(line => line.ruby?.length))
const hasRomaji = computed(() => !!lyrics.value?.lines.some(line => line.romaji))

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
    const split = lyricParts(line)
    const parts: RenderPart[] = split.map(part => ({ text: part.text, word: part.word }))
    let singerKeys: string[] = []
    let voices: Voice[] | undefined
    if (showPerformers.value) {
      const union = inSongOrder(linePerformerIds(line))
      singerKeys = union.map(p => performerAvatar(p).key)
      const sung = split.map((part, n) => ({ n, key: part.text.trim() ? setKey(part.performerIds) : '', ids: part.performerIds }))
      const mixed = new Set(sung.filter(p => p.key).map(p => p.key)).size > 1
      if (mixed) {
        // Singers trade off inside the line: mark each hand-over where it happens.
        let last = ''
        for (const piece of sung) {
          if (!piece.key || piece.key === last) continue
          last = piece.key
          parts[piece.n]!.avatars = inSongOrder(piece.ids).map(performerAvatar)
        }
        // With timed units the hand-overs have a time too, so the portraits outside the lyrics
        // can follow the voice being heard instead of lighting everyone on the line at once.
        if (line.words?.length) {
          let previous = ''
          for (const part of split) {
            if (!part.word || !part.text.trim() || !part.performerIds.length) continue
            const key = setKey(part.performerIds)
            if (key === previous) continue
            previous = key
            ;(voices ??= []).push({ start: part.word.start, keys: inSongOrder(part.performerIds).map(p => performerAvatar(p).key) })
          }
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
    // Cut the parts where readings begin and end. A portrait stays at the head of its part;
    // one that would land inside a reading leads the whole reading instead.
    // On a word-timed line every piece fills: a unit on its own clock, other text with its neighbours.
    const timed = !!line.words?.length
    const runs: RenderRun[] = []
    let lastPart = -1
    let offset = 0
    for (const run of lyricRuns(line, split)) {
      const pieces = run.pieces.map((piece) => {
        const avatars = piece.part !== lastPart ? parts[piece.part]!.avatars : undefined
        lastPart = piece.part
        const from = offset
        offset += piece.text.length
        const fill: Fill | undefined = piece.word
          ? { start: piece.word.start, end: piece.word.end, share: piece.share }
          : timed ? untimedFill(line.words, from, offset) : undefined
        return { text: piece.text, fill, word: piece.word, avatars }
      })
      if (run.reading !== undefined) {
        runs.push({ kind: 'ruby', reading: run.reading, segments: pieces, avatars: pieces.find(p => p.avatars)?.avatars, timed })
        continue
      }
      const piece = pieces[0]!
      // A timed unit stays whole beside its portrait; other text only lends its first word.
      const lead = !piece.avatars ? '' : piece.word ? piece.text : leadOf(piece.text)
      const cut = (text: string): Segment[] => (text ? [{ text, fill: piece.fill }] : [])
      runs.push({ kind: 'text', avatars: piece.avatars, head: cut(lead), tail: cut(piece.text.slice(lead.length)) })
    }
    // A new voice starts its own row, unless the text before it already ended one.
    let previousText = ''
    for (const run of runs) {
      if (run.avatars) run.breaks = !!previousText && !previousText.endsWith('\n')
      const text = (run.kind === 'ruby' ? run.segments : [...run.head, ...run.tail]).map(s => s.text).join('')
      if (text) previousText = text
    }
    result.push({ kind: 'line', start: line.start, end: line.end, line, runs, singerKeys, voices })
  })
  return result
})

function now(): number {
  return props.clock ? props.clock() : props.currentTime
}

function rowElement(index: number): HTMLElement | undefined {
  return track.value?.children[index + headRows.value] as HTMLElement | undefined
}

/** Recompute which rows are current and advance the word fills. Runs every animation frame while playing. */
function tick(time: number) {
  const list = items.value
  let last = -1
  const active: number[] = []
  for (let i = 0; i < list.length; i++) {
    const item = list[i]!
    if (item.start > time + CUE_SLACK_SEC) break
    last = i
    if (time < item.end) active.push(i)
  }
  // Rows of one cue start together: the view rests on the first of them, where the cue begins.
  let rest = last
  while (rest > 0 && list[last]!.start - list[rest - 1]!.start <= SAME_CUE_SEC) rest--
  if (rest !== anchor.value) anchor.value = rest
  const previous = activeRows.value
  if (active.length !== previous.length || active.some((row, n) => row !== previous[n])) activeRows.value = active
  paint(time, active)
  reportSinging(time, active)
}

/** Whoever is heard now: on a line where the singers trade off, the voice that has come in last. */
function reportSinging(time: number, active: number[]) {
  let keys: string[] | null = null
  if (showPerformers.value && active.length) {
    const heard = new Set<string>()
    for (const row of active) {
      const item = items.value[row]
      if (item?.kind !== 'line') continue
      const voices = item.voices
      if (!voices) {
        item.singerKeys.forEach(key => heard.add(key))
        continue
      }
      let voice = voices[0]!
      for (const next of voices) if (next.start <= time) voice = next
      voice.keys.forEach(key => heard.add(key))
    }
    if (heard.size) keys = [...heard]
  }
  const key = keys ? keys.join('|') : null
  if (key === singingKey) return
  singingKey = key
  emit('singing', keys)
}

function paint(time: number, active: number[]) {
  for (const [index, words] of painted) {
    if (active.includes(index)) continue
    for (const { el } of words) el.style.removeProperty('--p')
    rowElement(index)?.style.removeProperty('--gap-progress')
    painted.delete(index)
  }
  for (const index of active) {
    const row = rowElement(index)
    if (!row) continue
    let words = painted.get(index)
    if (!words) {
      words = collectFills(row)
      painted.set(index, words)
    }
    const item = items.value[index]
    if (item?.kind === 'gap') {
      row.style.setProperty('--gap-progress', wordProgress(time, item).toFixed(3))
      continue
    }
    for (const word of words) {
      const value = fillProgress(time, word).toFixed(3)
      if (word.value === value) continue
      word.value = value
      // The fill edge is a soft 12% ramp, so it runs from just before the word to just past it.
      word.el.style.setProperty('--p', `${(Number(value) * 112 - 6).toFixed(1)}%`)
    }
  }
}

function collectFills(row: HTMLElement): Painted[] {
  const list: Painted[] = []
  const byElement = new Map<Element, Painted>()
  for (const el of row.querySelectorAll<HTMLElement>('.ly-word')) {
    const entry: Painted = { el }
    if (el.tagName === 'RT') {
      // Readings come after the text they sit over, so that text is already collected.
      entry.under = [...el.parentElement!.children].flatMap(child => {
        const under = byElement.get(child)
        return under ? [{ painted: under, weight: child.textContent?.length || 0 }] : []
      })
    } else {
      const share = el.dataset.a ? [Number(el.dataset.a), Number(el.dataset.b)] as [number, number] : undefined
      entry.fill = { start: Number(el.dataset.s), end: Number(el.dataset.e), share }
    }
    byElement.set(el, entry)
    list.push(entry)
  }
  return list
}

/** A unit cut by a reading fills across its pieces in turn, on the unit's own clock. */
function fillProgress(time: number, entry: Painted): number {
  if (entry.fill) return pieceProgress(wordProgress(time, entry.fill), entry.fill.share)
  let done = 0
  let total = 0
  for (const { painted: under, weight } of entry.under || []) {
    done += fillProgress(time, under) * weight
    total += weight
  }
  return total ? done / total : 0
}

function clearPaint() {
  paint(0, [])
  anchor.value = -1
  activeRows.value = []
  reportSinging(0, [])
}

function loop() {
  tick(now())
  frame = requestAnimationFrame(loop)
}

watch([live, () => props.playing, expanded, items, rubied], () => {
  cancelAnimationFrame(frame)
  frame = 0
  // Rows may have been re-rendered or now show other lines (another rendition): wipe the
  // fills off the elements kept from before, then forget them.
  for (const [index, words] of painted) {
    for (const { el } of words) el.style.removeProperty('--p')
    rowElement(index)?.style.removeProperty('--gap-progress')
  }
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


/**
 * On a narrow screen the rows move as one. Staggered there, each tall row in turn falls
 * behind the one above it and then catches up, which reads as the list bouncing.
 */
function rowStagger(): number {
  return matchMedia(NARROW_QUERY).matches ? 0 : ROW_STAGGER_MS
}

function reducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** A row on its way to its resting place. */
interface Glide {
  /** How far it sits from its resting place now, in px, and its speed, in px per second. */
  y: number
  v: number
  /** When it starts to move, on the clock of `performance.now()`. Until then it waits where it is. */
  hold: number
}
/**
 * Rows in motion. The rows are moved here, frame by frame, and where each one is follows
 * from what is kept here; nothing is read back from the page. Handed to the browser as an
 * animation, a row on iOS Safari could keep the offset it started from instead of moving,
 * so each line came to rest a line too low, or, where that offset was read back and built
 * on, lower with every line until the current line sank out of view.
 */
const glides = new Map<HTMLElement, Glide>()
let glideFrame = 0
/** When the rows were last moved. */
let glideTime = 0

/**
 * A row is pulled to rest like a critically damped spring, which settles without
 * overshooting: where it is and how fast it moves `seconds` later. Exact for any step,
 * so a long frame (or a tab coming back from the background) just lands further along.
 */
function springAt(y: number, v: number, seconds: number): [number, number] {
  const decay = Math.exp(-GLIDE_RATE * seconds)
  const pull = v + GLIDE_RATE * y
  return [(y + pull * seconds) * decay, (v - GLIDE_RATE * pull * seconds) * decay]
}

function place(row: HTMLElement, y: number) {
  row.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`
}

/** Move every gliding row on to where it is at `time`. */
function advanceGlides(time: number) {
  for (const [row, state] of glides) {
    const from = Math.max(glideTime, state.hold)
    if (time > from) [state.y, state.v] = springAt(state.y, state.v, (time - from) / 1000)
    if (!row.isConnected || (time >= state.hold && Math.abs(state.y) < 0.2 && Math.abs(state.v) < 5)) {
      row.style.removeProperty('transform')
      glides.delete(row)
    }
  }
  glideTime = time
}

function glideStep() {
  const time = performance.now()
  advanceGlides(time)
  for (const [row, state] of glides) place(row, state.y)
  glideFrame = glides.size ? requestAnimationFrame(glideStep) : 0
}

/** Put every row at rest at once. */
function stopGlides() {
  cancelAnimationFrame(glideFrame)
  glideFrame = 0
  for (const row of glides.keys()) row.style.removeProperty('transform')
  glides.clear()
}

/** Rows (not the credits in front of them) in document order. */
function rowElements(list: HTMLElement): HTMLElement[] {
  return [...list.children].slice(headRows.value) as HTMLElement[]
}

/**
 * Bring the current line to its resting place. The container jumps there at once;
 * each visible row is shifted back by the same amount, so nothing moves yet, and then
 * glides to rest (see springAt), the rows below starting a beat later than the one above, which gives
 * the list its flowing motion (on wide screens; see rowStagger).
 *
 * Lines often change again before the rows have settled. A row still gliding simply has
 * further to go and carries on at the speed it has; one waiting its turn is not sent to
 * the back again. Otherwise, with lines coming quickly, the lower rows would keep stopping
 * and starting, or stay behind and then catch up all at once.
 */
function follow(animate: boolean) {
  const box = viewport.value
  const list = track.value
  if (!box || !list) return
  const row = rowElement(Math.max(0, anchor.value))
  if (!row) return
  const lead = box.clientHeight * ANCHOR_RATIO[props.variant]
  const target = Math.max(0, Math.min(box.scrollHeight - box.clientHeight, anchor.value < 0 ? 0 : row.offsetTop - lead))
  const before = box.scrollTop
  if (!animate || reducedMotion()) {
    stopGlides()
    if (Math.abs(target - before) >= 0.5) box.scrollTop = target
    return
  }
  if (Math.abs(target - before) < 0.5) return
  box.scrollTop = target
  // The scroll position snaps to the pixel grid: move the rows by what it actually moved.
  const after = box.scrollTop
  const delta = after - before
  if (!delta) return
  const top = Math.min(before, after) - 120
  const bottom = Math.max(before, after) + box.clientHeight + 120
  const time = performance.now()
  // Bring the rows still gliding up to now, so each carries on from where it is on screen.
  advanceGlides(time)
  const stagger = rowStagger()
  rowElements(list).forEach((el, index) => {
    const turn = time + Math.max(0, Math.min(ROW_STAGGER_ROWS, index - anchor.value + 1)) * stagger
    const state = glides.get(el)
    if (state) {
      // Already moving: it keeps its speed. Still waiting: no later than it had to.
      state.y += delta
      state.hold = Math.min(state.hold, turn)
    } else if (el.offsetTop + el.offsetHeight >= top && el.offsetTop <= bottom) {
      glides.set(el, { y: delta, v: 0, hold: turn })
    } else {
      return
    }
    place(el, glides.get(el)!.y)
  })
  if (!glideFrame && glides.size) glideFrame = requestAnimationFrame(glideStep)
}

watch(anchor, () => {
  if (live.value && following.value) follow(true)
}, { flush: 'post' })

watch(following, (value) => {
  if (value && live.value) follow(true)
}, { flush: 'post' })

// Layout changed under the current line: put it back without a flourish.
watch([translated, rubied, romanized, items, expanded, live, headRows], async () => {
  await nextTick()
  if (!live.value) stopGlides()
  else if (following.value) follow(false)
}, { flush: 'post' })

function remember(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    // Preference simply does not persist.
  }
}
watch(translated, (value) => {
  remember(TRANSLATION_KEY, value)
  if (value) romanized.value = false
})
watch(rubied, value => remember(RUBY_KEY, value))
watch(romanized, (value) => {
  remember(ROMAJI_KEY, value)
  if (value) translated.value = false
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
  stopGlides()
  clearTimeout(resumeTimer)
  resizeObserver?.disconnect()
})
</script>

<template>
  <section class="ly" :class="[`ly--${variant}`, { 'ly--fill': variant !== 'panel', 'ly--paused': !playing }]" aria-label="同步歌词">
    <div class="ly-bar">
      <button v-if="variant === 'panel'" class="btn btn-ghost btn-sm gap-1" :aria-expanded="expanded" @click="expanded = !expanded">
        歌词 <ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': expanded }" />
      </button>
      <div v-if="lyrics?.lines.length && expanded && !instrumental" class="ly-actions">
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
        <button
          v-if="hasRuby"
          class="ly-chip"
          :class="{ on: rubied }"
          :aria-pressed="rubied"
          :title="rubied ? '隐藏注音' : '显示注音'"
          @click="rubied = !rubied"
        >
          <span class="ly-chip-kana" aria-hidden="true">あ</span> 注音
        </button>
        <button
          v-if="hasRomaji"
          class="ly-chip"
          :class="{ on: romanized }"
          :aria-pressed="romanized"
          :title="romanized ? '隐藏罗马音' : '显示罗马音'"
          @click="romanized = !romanized"
        >
          <Type class="h-3.5 w-3.5" /> 罗马音
        </button>
      </div>
    </div>

    <template v-if="expanded">
      <div v-if="instrumental" class="ly-status ly-status--inst">
        <p v-for="[role, name] in credits" :key="role" class="ly-credit">{{ role }}：{{ name }}</p>
        <p class="ly-inst">纯音乐，请欣赏</p>
      </div>
      <p v-else-if="loading" class="ly-status" role="status">正在加载歌词…</p>
      <p v-else-if="failed" class="ly-status">歌词加载失败 <button class="ly-chip ml-2" @click="load">重试</button></p>
      <p v-else-if="!lyrics?.lines.length" class="ly-status">暂无歌词</p>
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
            <div v-if="headRows" class="ly-head">
              <p v-if="untimedNote" class="ly-note" role="note">{{ untimedNote }}</p>
              <p v-for="[role, name] in credits" :key="role" class="ly-credit">{{ role }}：{{ name }}</p>
            </div>
            <div
              v-for="(item, index) in items"
              :key="index"
              class="ly-row"
              :class="{ active: isActive(index), past: live && index < anchor, 'ly-row--gap': item.kind === 'gap' }"
              :style="rowStyle(index)"
            >
              <div v-if="item.kind === 'gap'" class="ly-gap" aria-hidden="true"><i></i><i></i><i></i></div>
              <button v-else class="ly-line" :aria-current="isActive(index) ? 'true' : undefined" @click="seek(item.start)">
                <span class="ly-original" lang="ja"><template v-for="(run, n) in item.runs" :key="n"><span v-if="run.kind === 'ruby'" class="ly-ruby" :class="run.avatars && ['ly-glue', { 'ly-glue--break': run.breaks }]"><SingerAvatars v-if="run.avatars" class="ly-handover" :singers="run.avatars" :size="variant === 'immersive' ? 28 : 22" /><ruby><template v-for="(segment, k) in run.segments" :key="k"><span v-if="segment.fill" class="ly-word" :data-s="segment.fill.start" :data-e="segment.fill.end" :data-a="segment.fill.share?.[0]" :data-b="segment.fill.share?.[1]">{{ segment.text }}</span><template v-else>{{ segment.text }}</template></template><template v-if="rubied"><rp>(</rp><rt :class="{ 'ly-word': run.timed }">{{ run.reading }}</rt><rp>)</rp></template></ruby></span><template v-else><span v-if="run.avatars" class="ly-glue" :class="{ 'ly-glue--break': run.breaks }"><SingerAvatars class="ly-handover" :singers="run.avatars" :size="variant === 'immersive' ? 28 : 22" /><template v-for="(segment, k) in run.head" :key="k"><span v-if="segment.fill" class="ly-word" :data-s="segment.fill.start" :data-e="segment.fill.end" :data-a="segment.fill.share?.[0]" :data-b="segment.fill.share?.[1]">{{ segment.text }}</span><template v-else>{{ segment.text }}</template></template></span><template v-for="(segment, k) in run.tail" :key="k"><span v-if="segment.fill" class="ly-word" :data-s="segment.fill.start" :data-e="segment.fill.end" :data-a="segment.fill.share?.[0]" :data-b="segment.fill.share?.[1]">{{ segment.text }}</span><template v-else>{{ segment.text }}</template></template></template></template></span>
                <span v-if="romanized && item.line.romaji" class="ly-romaji" lang="ja-Latn">{{ item.line.romaji }}</span>
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
  /* Colour of the lyric text; lines out of focus are drawn as a soft shadow of it. */
  --ly-ink: var(--color-base-content);
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
  --ly-ink: #fff;
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

.ly-chip-kana {
  width: 0.875rem;
  font-family: 'Hiragino Sans', 'Yu Gothic UI', 'Noto Sans JP', sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
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

.ly-status--inst {
  opacity: 1;
}

.ly-inst {
  margin-top: 0.75rem;
  font-size: calc(var(--ly-size) * 0.8);
  font-weight: 700;
  opacity: 0.85;
}

.ly-status--inst .ly-credit {
  opacity: 0.55;
}

/* Lyricist and composer, above the first line like the opening of a booklet. */
.ly-head {
  padding-bottom: 0.9rem;
  font-size: max(calc(var(--ly-size) * 0.52), 0.8125rem);
  font-weight: 600;
  line-height: 1.6;
  opacity: 0.55;
}

.ly-credit {
  overflow-wrap: anywhere;
}

/* The lines are the default rendition's, read along without timing. */
.ly-note:not(:last-child) {
  margin-bottom: 0.4rem;
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
  color: var(--ly-ink);
  cursor: pointer;
  opacity: 0.86;
  transform-origin: left center;
  transition: opacity 0.5s ease, color 0.5s ease, text-shadow 0.5s ease, transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.ly-line:focus-visible {
  outline-offset: 4px;
  border-radius: 0.5rem;
}

/* Lines waiting their turn recede with distance; the reader can still pull any of them forward.
   They are softened by hiding the glyphs and showing only a blurred shadow of them. A blur
   filter on the row would look the same, but Safari draws a black line along the edge of a
   filtered row that lies next to the line being repainted while it is sung. */
.live .ly-line {
  opacity: var(--ly-rest);
  color: transparent;
  text-shadow: 0 0 calc(min(var(--distance, 0), 4) * 1.5px) var(--ly-ink);
  transform: scale(0.96);
}

.live .ly-row.active .ly-line,
.live .ly-line:hover,
.live .ly-line:focus-visible {
  opacity: 1;
  color: var(--ly-ink);
  text-shadow: none;
}

.live .ly-row.active .ly-line {
  transform: none;
}

.browsing .ly-line {
  opacity: 0.6;
  color: var(--ly-ink);
  text-shadow: none;
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
  background-image: linear-gradient(to right, currentColor calc(var(--p) - 6%), color-mix(in srgb, currentColor 34%, transparent) calc(var(--p) + 6%));
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

/* Romaji sits right under the words it reads, lighter than the lyric, before any translation. */
.ly-romaji {
  display: block;
  margin-top: 0.2em;
  font-size: max(0.56em, 0.8125rem);
  font-weight: 600;
  line-height: 1.45;
  letter-spacing: 0.01em;
  opacity: 0.68;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
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

/* Furigana: a reading sits over its text and is not split from it when the row wraps.
   It shares the line's colour and focus, but is not filled word by word. */
.ly-ruby {
  white-space: nowrap;
}

.ly-original rt {
  font-size: 0.44em;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.02em;
  text-align: center;
  opacity: 0.78;
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
}

/* Only the break being waited through breathes, and only while the music plays:
   hidden or paused dots that keep animating still cost a redraw every frame. */
.ly-row.active .ly-gap i {
  animation: ly-breathe 2.6s ease-in-out infinite;
}

.ly--paused .ly-row.active .ly-gap i {
  animation-play-state: paused;
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
    color: var(--ly-ink) !important;
    text-shadow: none !important;
  }

  .ly-gap i {
    animation: none;
  }
}
</style>
