<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import {
  linePerformerIds, lyricParts, lyricRuns, pieceProgress, untimedFill, wordProgress, type SongLyrics,
} from '@/api/lyrics'
import { useSingerAvatars } from '@/composables/useSingerAvatars'
import type { SubtitleExtra, SubtitleMode } from '@/utils/musicVideos'
import { countInDots, subtitleTimeline, type SubtitleTiming } from '@/utils/mvSubtitleTimeline'

/**
 * Lyrics drawn over a video.
 * - lyrics: the line being sung, centred at the bottom, like film subtitles.
 * - ktv: karaoke rows. Lines take turns on an upper row (left) and a lower row (right); each
 *   fills in word by word as it is sung, and the next line waits in the row the last one left.
 */

const props = withDefaults(defineProps<{
  lyrics: SongLyrics
  mode: SubtitleMode
  /**
   * over: on the picture. below: in the free space under it, sized to that space.
   * float: on its own, sized by `--f-size`, as tall as its lines (floating lyrics).
   */
  placement?: 'over' | 'below' | 'float'
  /** What goes under each line. */
  extra?: SubtitleExtra
  /** Readings over the kanji. */
  ruby?: boolean
  /** Sung text takes the colour of whoever sings it (KTV). */
  singerColors?: boolean
  /** The singers were annotated for this rendition. */
  showPerformers?: boolean
  /** Shown in the corner of the picture in KTV mode, e.g. "title / composer". */
  heading?: string
  /** Lead-in silence of the audio: the first line is counted in from there, not from 0. */
  trimStart?: number
  currentTime: number
  playing: boolean
  clock?: () => number
}>(), { placement: 'over', extra: 'none', ruby: true, singerColors: true, showPerformers: false, trimStart: 0, clock: undefined, heading: '' })

/** A line counts as started this much before its cue (a seek may read back a hair early). */
const CUE_SLACK_SEC = 0.01
/** The count-in before a verse: this many dots, going out one by one. */
const COUNT_DOTS = 4
const COUNT_SEC = 3

/** When a piece of text fills; `share` is its stretch of a unit that a reading cut. */
interface Fill { start: number; end: number; share?: [number, number] }
/** Something that fills: a piece of text, or a reading, which fills along with the text under it. */
interface Target { fill?: Fill; under?: { key: number; weight: number }[] }
/** How sung text is coloured: one singer's colour, or a blend of everyone singing it together. */
type Paint = { solid: string } | { blend: string }
/**
 * `chars`: on a line with a blend, the text one character to a box. A browser that leaves the
 * spacing between characters (letter spacing, readings stretched over their text) out of a
 * text-clipped background would otherwise draw the blend beside the letters (Safari).
 */
interface Piece { key: number; text: string; paint?: Paint; chars?: string[] }
interface Run { pieces: Piece[]; reading?: { key: number; text: string; paint?: Paint; chars?: string[] } }
interface SubLine extends SubtitleTiming {
  index: number
  start: number
  end: number
  /** Sung with units: fills word by word. Otherwise the whole line lights up when it starts. */
  timed: boolean
  runs: Run[]
  text: string
  translation?: string
  romaji?: string
  /** Colour of whoever sings a line without units. */
  paint?: Paint
  /** Somewhere on the line several sing together: their colours blend. */
  blend: boolean
}

const { performerAvatar } = useSingerAvatars()

const root = ref<HTMLElement>()
/** Lines on screen now, by index. */
const shown = ref<number[]>([])
/** Dots left in the count-in, and the line they lead. */
const countdown = shallowRef<{ index: number; dots: number } | null>(null)

let targets = new Map<number, Target>()

const model = computed<SubLine[]>(() => {
  const data = props.lyrics
  const performers = data.performers || []
  // One singer: their colour. Several together: their colours blended top to bottom, which
  // reads the same on every letter however the line is cut into pieces.
  const colorOf = (ids: string[]): Paint | undefined => {
    if (!props.singerColors || !props.showPerformers || !ids.length) return undefined
    const colors = [...new Set(ids.flatMap((id) => {
      const performer = performers.find(p => p.performerId === id)
      const color = performer ? performerAvatar(performer).color : undefined
      return color ? [color] : []
    }))]
    if (!colors.length) return undefined
    if (colors.length === 1) return { solid: colors[0]! }
    const stops = colors.map((color, n) => `${color} ${Math.round(18 + (64 * n) / (colors.length - 1))}%`)
    return { blend: `linear-gradient(180deg, ${stops.join(', ')})` }
  }
  const fills = new Map<number, Target>()
  let key = 0
  const timeline = subtitleTimeline(data.lines, props.trimStart)
  const lines = data.lines.map((line, index): SubLine => {
    const parts = lyricParts(line)
    const timed = !!line.words?.length
    let offset = 0
    const runs = lyricRuns(line, parts).map((run): Run => {
      const pieces = run.pieces.map((piece): Piece => {
        const from = offset
        offset += piece.text.length
        const own = key++
        if (timed) {
          const fill = piece.word
            ? { start: piece.word.start, end: piece.word.end, share: piece.share }
            : untimedFill(line.words, from, offset) ?? { start: line.start, end: line.start }
          fills.set(own, { fill })
        }
        return { key: own, text: piece.text, paint: colorOf(parts[piece.part]!.performerIds) }
      })
      if (run.reading === undefined) return { pieces }
      const own = key++
      if (timed) fills.set(own, { under: pieces.map(p => ({ key: p.key, weight: p.text.length })) })
      return { pieces, reading: { key: own, text: run.reading, paint: pieces[0]?.paint } }
    })
    return {
      index,
      start: line.start,
      end: line.end,
      timed,
      runs,
      text: line.text,
      translation: line.translation,
      romaji: line.romaji,
      paint: timed ? undefined : colorOf(linePerformerIds(line)),
      blend: false,
      ...timeline[index]!,
    }
  })
  for (const line of lines) {
    line.blend = isBlend(line.paint) || line.runs.some(run => isBlend(run.reading?.paint) || run.pieces.some(piece => isBlend(piece.paint)))
    if (!line.blend) continue
    for (const run of line.runs) {
      for (const piece of run.pieces) piece.chars = Array.from(piece.text)
      if (run.reading) run.reading.chars = Array.from(run.reading.text)
    }
  }
  targets = fills
  return lines
})

const rows = computed<[SubLine | undefined, SubLine | undefined]>(() => {
  const lines = model.value
  const pick = (slot: 0 | 1) => {
    let found: SubLine | undefined
    for (const index of shown.value) if (lines[index]?.slot === slot) found = lines[index]
    return found
  }
  return [pick(0), pick(1)]
})

const stack = computed(() => shown.value.map(index => model.value[index]).filter((line): line is SubLine => !!line))

function paintStyle(paint: Paint | undefined) {
  if (!paint) return undefined
  return 'solid' in paint ? { '--c': paint.solid } : { '--g': paint.blend }
}

function isBlend(paint: Paint | undefined): boolean {
  return !!paint && 'blend' in paint
}

function subOf(line: SubLine): string {
  const text = props.extra === 'translation' ? line.translation : props.extra === 'romaji' ? line.romaji : ''
  // A "translation" that only repeats the words (calls, English lines) is not shown twice.
  return text && text.trim() !== line.text.trim() ? text : ''
}

function now(): number {
  return props.clock ? props.clock() : props.currentTime
}

function visibleAt(time: number): number[] {
  const list: number[] = []
  for (const line of model.value) {
    if (props.mode === 'ktv') {
      if (time >= line.show - CUE_SLACK_SEC && time < line.hide) list.push(line.index)
    } else if (time >= line.start - CUE_SLACK_SEC && time < line.until) {
      list.push(line.index)
    }
  }
  return list
}

/** Elements that fill, collected once each time other lines come on screen. */
let painted: { el: HTMLElement; target: Target; value?: string }[] = []
let plainLines: { el: HTMLElement; start: number }[] = []

function collect() {
  painted = []
  plainLines = []
  const box = root.value
  if (!box || props.mode !== 'ktv') return
  for (const el of box.querySelectorAll<HTMLElement>('[data-k]')) {
    const target = targets.get(Number(el.dataset.k))
    if (target) painted.push({ el, target })
  }
  for (const el of box.querySelectorAll<HTMLElement>('[data-plain]')) plainLines.push({ el, start: Number(el.dataset.plain) })
}

function progress(time: number, target: Target): number {
  if (target.fill) return pieceProgress(wordProgress(time, target.fill), target.fill.share)
  let done = 0
  let total = 0
  for (const { key, weight } of target.under || []) {
    const under = targets.get(key)
    if (!under) continue
    done += progress(time, under) * weight
    total += weight
  }
  return total ? done / total : 0
}

function tick(time: number) {
  const next = visibleAt(time)
  const before = shown.value
  if (next.length !== before.length || next.some((index, n) => index !== before[n])) shown.value = next

  let count: { index: number; dots: number } | null = null
  if (props.mode === 'ktv') {
    for (const index of next) {
      const line = model.value[index]
      if (!line?.lead || time >= line.start) continue
      const dots = countInDots(line.start - time, COUNT_DOTS, COUNT_SEC)
      if (dots) count = { index, dots }
    }
  }
  if (count?.index !== countdown.value?.index || count?.dots !== countdown.value?.dots) countdown.value = count

  for (const entry of painted) {
    const value = progress(time, entry.target).toFixed(3)
    if (value === entry.value) continue
    entry.value = value
    entry.el.style.setProperty('--p', value)
  }
  for (const { el, start } of plainLines) el.classList.toggle('sung', time >= start - CUE_SLACK_SEC)
}

let frame = 0
function loop() {
  tick(now())
  frame = requestAnimationFrame(loop)
}

watch([() => props.playing, model, () => props.mode], () => {
  cancelAnimationFrame(frame)
  frame = 0
  tick(now())
  if (props.playing) frame = requestAnimationFrame(loop)
}, { immediate: true })

// Paused: a seek still moves the subtitles.
watch(() => props.currentTime, () => {
  if (!frame) tick(now())
})

// Other lines came on screen (or were drawn again): find what fills in them and bring it up to now.
watch([shown, model, () => props.mode, () => props.ruby, () => props.extra], async () => {
  await nextTick()
  collect()
  tick(now())
}, { flush: 'post' })

// The lines on screen when the subtitles first appear were picked before the watch above
// existed, so it never heard of them: without this their words would not fill, and nothing
// would until other lines came on screen (often in the middle of the next line).
onMounted(() => {
  collect()
  tick(now())
})

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <div ref="root" class="mvs" :class="[`mvs--${mode}`, `mvs--${placement}`]" aria-hidden="true">
    <!-- Floating on its own, between lines: which song this is. -->
    <p v-if="placement === 'float' && heading && !shown.length" class="f-idle">{{ heading }}</p>
    <template v-if="mode === 'ktv'">
      <p v-if="heading && placement === 'over'" class="k-title">{{ heading }}</p>
      <div v-for="slot in ([0, 1] as const)" :key="slot" class="k-slot" :class="`k-slot--${slot}`">
        <Transition name="k-line">
          <div
            v-if="rows[slot]"
            :key="rows[slot]!.index"
            class="k-line"
            :class="{ 'k-line--plain': !rows[slot]!.timed, 'k-line--blend': isBlend(rows[slot]!.paint) }"
            :style="paintStyle(rows[slot]!.paint)"
            :data-plain="rows[slot]!.timed ? undefined : rows[slot]!.start"
          >
            <span v-if="countdown && countdown.index === rows[slot]!.index" class="k-count">
              <i v-for="n in COUNT_DOTS" :key="n" :class="{ out: n > countdown.dots }"></i>
            </span>
            <!-- The line twice in one place: as yet unsung underneath, sung on top and uncovered as it is sung. -->
            <span v-for="line in [rows[slot]!]" :key="line.index" class="k-text" lang="ja">
              <span class="k-layer k-layer--base"><template v-for="(run, r) in line.runs" :key="r"><ruby v-if="run.reading && ruby"><span v-for="piece in run.pieces" :key="piece.key" class="k-cell"><template v-if="piece.chars"><template v-for="(ch, c) in piece.chars" :key="c"><br v-if="ch === '\n'"><span v-else class="k-ch">{{ ch }}</span></template></template><template v-else>{{ piece.text }}</template></span><rt><span class="k-cell"><template v-if="run.reading.chars"><template v-for="(ch, c) in run.reading.chars" :key="c"><br v-if="ch === '\n'"><span v-else class="k-ch">{{ ch }}</span></template></template><template v-else>{{ run.reading.text }}</template></span></rt></ruby><template v-else><span v-for="piece in run.pieces" :key="piece.key" class="k-cell"><template v-if="piece.chars"><template v-for="(ch, c) in piece.chars" :key="c"><br v-if="ch === '\n'"><span v-else class="k-ch">{{ ch }}</span></template></template><template v-else>{{ piece.text }}</template></span></template></template></span>
              <span class="k-layer k-layer--top" aria-hidden="true"><template v-for="(run, r) in line.runs" :key="r"><ruby v-if="run.reading && ruby"><span v-for="piece in run.pieces" :key="piece.key" class="k-cell" :data-k="line.timed ? piece.key : undefined" :class="{ 'k-cell--blend': isBlend(piece.paint) }" :style="paintStyle(piece.paint)"><template v-if="piece.chars"><template v-for="(ch, c) in piece.chars" :key="c"><br v-if="ch === '\n'"><span v-else class="k-ch">{{ ch }}</span></template></template><template v-else>{{ piece.text }}</template></span><rt><span class="k-cell" :data-k="line.timed ? run.reading.key : undefined" :class="{ 'k-cell--blend': isBlend(run.reading.paint) }" :style="paintStyle(run.reading.paint)"><template v-if="run.reading.chars"><template v-for="(ch, c) in run.reading.chars" :key="c"><br v-if="ch === '\n'"><span v-else class="k-ch">{{ ch }}</span></template></template><template v-else>{{ run.reading.text }}</template></span></rt></ruby><template v-else><span v-for="piece in run.pieces" :key="piece.key" class="k-cell" :data-k="line.timed ? piece.key : undefined" :class="{ 'k-cell--blend': isBlend(piece.paint) }" :style="paintStyle(piece.paint)"><template v-if="piece.chars"><template v-for="(ch, c) in piece.chars" :key="c"><br v-if="ch === '\n'"><span v-else class="k-ch">{{ ch }}</span></template></template><template v-else>{{ piece.text }}</template></span></template></template></span>
              <span v-if="line.blend" class="k-layer k-layer--grad" aria-hidden="true"><template v-for="(run, r) in line.runs" :key="r"><ruby v-if="run.reading && ruby"><span v-for="piece in run.pieces" :key="piece.key" class="k-cell" :data-k="line.timed ? piece.key : undefined" :class="{ 'k-cell--blend': isBlend(piece.paint) }" :style="paintStyle(piece.paint)"><template v-if="piece.chars"><template v-for="(ch, c) in piece.chars" :key="c"><br v-if="ch === '\n'"><span v-else class="k-ch">{{ ch }}</span></template></template><template v-else>{{ piece.text }}</template></span><rt><span class="k-cell" :data-k="line.timed ? run.reading.key : undefined" :class="{ 'k-cell--blend': isBlend(run.reading.paint) }" :style="paintStyle(run.reading.paint)"><template v-if="run.reading.chars"><template v-for="(ch, c) in run.reading.chars" :key="c"><br v-if="ch === '\n'"><span v-else class="k-ch">{{ ch }}</span></template></template><template v-else>{{ run.reading.text }}</template></span></rt></ruby><template v-else><span v-for="piece in run.pieces" :key="piece.key" class="k-cell" :data-k="line.timed ? piece.key : undefined" :class="{ 'k-cell--blend': isBlend(piece.paint) }" :style="paintStyle(piece.paint)"><template v-if="piece.chars"><template v-for="(ch, c) in piece.chars" :key="c"><br v-if="ch === '\n'"><span v-else class="k-ch">{{ ch }}</span></template></template><template v-else>{{ piece.text }}</template></span></template></template></span>
            </span>
            <span v-if="subOf(rows[slot]!)" class="k-sub" :lang="extra === 'romaji' ? 'ja-Latn' : 'zh-CN'">{{ subOf(rows[slot]!) }}</span>
          </div>
        </Transition>
      </div>
    </template>

    <TransitionGroup v-else name="l-line" tag="div" class="l-stack">
      <div v-for="line in stack" :key="line.index" class="l-line">
        <span class="l-text" lang="ja"><template v-for="(run, r) in line.runs" :key="r"><ruby v-if="run.reading && ruby"><template v-for="piece in run.pieces" :key="piece.key">{{ piece.text }}</template><rt>{{ run.reading.text }}</rt></ruby><template v-else><template v-for="piece in run.pieces" :key="piece.key">{{ piece.text }}</template></template></template></span>
        <span v-if="subOf(line)" class="l-sub" :lang="extra === 'romaji' ? 'ja-Latn' : 'zh-CN'">{{ subOf(line) }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.mvs {
  /* Sizes follow the width of the picture (the frame is a size container). */
  --mvs-scale: 1;
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 5cqw calc(4.5cqh + var(--mvs-lift, 0px));
  font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Yu Gothic UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  pointer-events: none;
  transition: padding-bottom 0.25s ease;
  user-select: none;
}

/* ----- lyrics ----- */

.l-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6cqw;
}

.l-line {
  display: flex;
  max-width: 92%;
  flex-direction: column;
  align-items: center;
  /* Follows the picture, but stays readable on a phone held upright. */
  font-size: max(calc(var(--mvs-scale) * 2.9cqw), calc(var(--mvs-scale) * 13px));
  line-height: 1.3;
  text-align: center;
}

.l-text {
  color: #fff;
  font-weight: 700;
  white-space: pre-line;
  -webkit-text-stroke: 0.13em rgb(0 0 0 / 0.72);
  paint-order: stroke fill;
  text-shadow: 0 0.05em 0.35em rgb(0 0 0 / 0.55);
}

.l-text rt {
  font-size: 0.45em;
  font-weight: 600;
}

.l-sub {
  margin-top: 0.15em;
  color: #fff;
  font-size: 0.66em;
  font-weight: 600;
  white-space: pre-line;
  -webkit-text-stroke: 0.14em rgb(0 0 0 / 0.68);
  paint-order: stroke fill;
}

.l-line-enter-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.l-line-leave-active {
  position: absolute;
  opacity: 0;
}

.l-line-enter-from {
  opacity: 0;
  transform: translateY(0.25em);
}

/* ----- KTV ----- */

/* Karaoke-box lettering: heavy, spaced-out type. Unsung text is white edged in black; sung
   text turns a soft rose edged in white, with a warm glow around it. Readings sit over the
   words in the same lettering and fill along with them. */
.mvs--ktv {
  --k-size: max(calc(var(--mvs-scale) * 4.1cqw), calc(var(--mvs-scale) * 15px));
  --k-sung: #8f6f6c;
  --k-ink: #fff;
  --k-edge: #141014;
  --k-glow: rgb(255 240 200 / 0.9);
  --k-glow-soft: rgb(255 226 160 / 0.65);
  gap: 1.2cqw;
  font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic StdN', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif;
}

.k-slot {
  display: flex;
  min-height: calc(var(--k-size) * 1.3);
}

.k-slot--1 {
  justify-content: flex-end;
  text-align: right;
}

.k-line {
  position: relative;
  display: flex;
  max-width: 92%;
  flex-direction: column;
  font-size: var(--k-size);
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.3;
}

.k-slot--1 .k-line {
  align-items: flex-end;
}

.k-text {
  display: grid;
}

/* Both copies in the same cell lay out (and wrap) exactly alike. */
.k-layer {
  grid-area: 1 / 1;
  white-space: pre-line;
}

.k-text ruby {
  ruby-align: space-around;
}

.k-text rt {
  margin-bottom: 0.08em;
  font-size: 0.42em;
  font-weight: 700;
  letter-spacing: 0.18em;
}

/* A timed piece is its own box, so it can be uncovered on its own clock. */
.k-cell {
  display: inline-block;
  white-space: pre;
}

.k-line--plain .k-cell {
  display: inline;
  white-space: pre-line;
}

.k-layer--base {
  color: var(--k-ink);
  -webkit-text-stroke: 0.15em var(--k-edge);
  paint-order: stroke fill;
}

/* The sung copy glows as a whole: the glow follows the letters uncovered so far and lies
   under them, never over a neighbour. */
.k-layer--top {
  -webkit-text-stroke: 0.15em #fff;
  paint-order: stroke fill;
  filter: drop-shadow(0 0 0.05em var(--k-glow)) drop-shadow(0 0 0.16em var(--k-glow-soft));
}

.k-layer--top .k-cell {
  color: var(--c, var(--k-sung));
}

/* Several singing together: the letters are filled with a blend of their colours. It lies over
   the sung copy and only fills the letters, so their white edge stays as it is (a transparent
   fill there would leave the inner half of the edge showing, and turn thin letters white). */
/* The glow puts the sung copy in a layer of its own, painted over plain content: this one has
   to be lifted explicitly to stay on top of it. */
.k-layer--grad {
  position: relative;
  z-index: 1;
}

.k-layer--grad .k-cell {
  color: transparent;
}

/* One character to a box on a line with a blend (see Piece), in every copy so they line up. */
.k-ch {
  display: inline-block;
  white-space: pre;
}

/* The blend runs top to bottom in each character, so it reads the same on every letter. It is
   drawn on the characters, not on the piece that is uncovered as it is sung (Safari draws a
   text-clipped background out of place on a clipped element). A line lit as a whole blends
   all over; a word-timed line only where several sing together. */
.k-layer--grad .k-cell--blend .k-ch,
.k-line--plain.k-line--blend .k-layer--grad .k-ch {
  background-image: var(--g);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.k-line:not(.k-line--plain) .k-layer--top .k-cell,
.k-line:not(.k-line--plain) .k-layer--grad .k-cell {
  /* Uncovered from the left; the margins keep the white edge of the letters. */
  clip-path: inset(-0.6em calc((1 - var(--p, 0)) * (100% + 0.3em) - 0.15em) -0.6em -0.15em);
}

.k-line--plain .k-layer--top,
.k-line--plain .k-layer--grad {
  opacity: 0;
  transition: opacity 0.15s;
}

.k-line--plain.sung .k-layer--top,
.k-line--plain.sung .k-layer--grad {
  opacity: 1;
}

.k-sub {
  margin-top: 0.12em;
  color: #fff;
  font-size: 0.48em;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: pre-line;
  -webkit-text-stroke: 0.18em var(--k-edge);
  paint-order: stroke fill;
}

/* The count-in: dots over the first word of a verse, going out one by one. */
.k-count {
  position: absolute;
  bottom: calc(100% + 0.15em);
  left: 0;
  display: flex;
  gap: 0.22em;
}

.k-slot--1 .k-count {
  right: 0;
  left: auto;
}

.k-count i {
  width: 0.34em;
  height: 0.34em;
  border: 0.07em solid #fff;
  border-radius: 999px;
  background: var(--k-sung);
  box-shadow: 0 0 0 0.05em var(--k-edge);
  transition: opacity 0.2s, transform 0.2s;
}

.k-count i.out {
  opacity: 0;
  transform: scale(0.4);
}

/* The song, in the corner of the picture as on a karaoke screen. */
.k-title {
  position: absolute;
  top: 3.5cqh;
  left: 3cqw;
  max-width: 60%;
  overflow: hidden;
  color: #2f8a3c;
  font-family: 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', 'Songti SC', serif;
  font-size: max(1.8cqw, 11px);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
  -webkit-text-stroke: 0.2em #f4f8ee;
  paint-order: stroke fill;
}

.k-line-enter-active {
  transition: opacity 0.15s ease;
}

.k-line-enter-from {
  opacity: 0;
}

.k-line-leave-active {
  display: none;
}

/* Under the picture: from the top of the free space, sized to a phone's width. */
.mvs--below {
  justify-content: flex-start;
  padding: 0.875rem 1rem 0;
}

.mvs--below .l-line {
  font-size: clamp(calc(var(--mvs-scale) * 16px), calc(var(--mvs-scale) * 4.4cqw), calc(var(--mvs-scale) * 28px));
}

.mvs--below.mvs--ktv {
  --k-size: clamp(calc(var(--mvs-scale) * 18px), calc(var(--mvs-scale) * 5cqw), calc(var(--mvs-scale) * 34px));
  gap: 0.75rem;
}

/* Floating lyrics: no picture to fit, a size of their own, and only as tall as the rows. */
.mvs--float {
  position: relative;
  inset: auto;
  justify-content: center;
  padding: 0;
}

.mvs--float.mvs--ktv {
  --k-size: var(--f-size, 28px);
  gap: calc(var(--f-size, 28px) * 0.2);
}

.mvs--float .l-stack {
  min-height: calc(var(--f-size, 28px) * 2.2);
  justify-content: flex-end;
}

.mvs--float .l-line {
  font-size: var(--f-size, 28px);
}

.f-idle {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: #fff;
  font-size: calc(var(--f-size, 28px) * 0.62);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  white-space: nowrap;
  -webkit-text-stroke: 0.16em rgb(20 16 20 / 0.85);
  paint-order: stroke fill;
  opacity: 0.85;
}

@media (forced-colors: active) {
  .k-layer--top,
  .k-layer--grad {
    display: none;
  }
}
</style>
