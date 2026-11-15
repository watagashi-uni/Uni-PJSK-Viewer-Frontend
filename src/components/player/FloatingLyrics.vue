<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AArrowDown, AArrowUp, Lock, LockOpen, X } from 'lucide-vue-next'
import { useFloatingLyrics, FLOATING_SIZE_MAX, FLOATING_SIZE_MIN, FLOATING_WIDTH_MIN } from '@/composables/useFloatingLyrics'
import { useMvSettings, SUBTITLE_EXTRAS } from '@/composables/useMvSettings'
import { useVocalLyrics } from '@/composables/useVocalLyrics'
import { usePlayerStore } from '@/stores/player'
import { trackEvent } from '@/utils/analytics'
import type { SubtitleExtra } from '@/utils/musicVideos'
import MvSubtitles from '@/components/player/MvSubtitles.vue'

// Karaoke lyrics of whatever the site player plays, floating over every page like the desktop
// lyrics of a music app. Drag to move, drag the corner to scale, lock to let clicks through.
const player = usePlayerStore()
const { prefs, toggle } = useFloatingLyrics()
const { settings } = useMvSettings()

const track = computed(() => player.current)
const shown = computed(() => prefs.enabled && !!track.value && !player.nowPlayingOpen)
const {
  timedLyrics, hasTranslation, hasRomaji, showPerformers, note,
} = useVocalLyrics(() => (prefs.enabled ? track.value : null), () => true)
const extra = computed<SubtitleExtra>(() => {
  if (settings.extra === 'translation' && !hasTranslation.value) return 'none'
  if (settings.extra === 'romaji' && !hasRomaji.value) return 'none'
  return settings.extra
})
const heading = computed(() => (track.value ? [track.value.title, track.value.caption].filter(Boolean).join(' · ') : ''))

watch(() => prefs.enabled, (value) => {
  if (value) trackEvent('floating-lyrics', { mode: prefs.mode })
})

// ----- where it sits -----

const box = ref<HTMLElement>()
const viewport = ref({ width: 0, height: 0 })
const height = ref(0)
/** The box with its toolbar showing (hover, or a tap on a touch screen). */
const awake = ref(false)
let wakeTimer: ReturnType<typeof setTimeout> | undefined

function readViewport() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
}

const width = computed(() => Math.max(FLOATING_WIDTH_MIN, Math.min(prefs.width, viewport.value.width - 16)))
const left = computed(() => prefs.x * Math.max(0, viewport.value.width - width.value))
const bottom = computed(() => prefs.y * Math.max(0, viewport.value.height - height.value))
/** Too close to the top of the window for the toolbar above it: the toolbar goes under it. */
const barBelow = computed(() => viewport.value.height - bottom.value - height.value < 48)

let resizeObserver: ResizeObserver | undefined
watch(box, (el) => {
  resizeObserver?.disconnect()
  if (!el) return
  resizeObserver = new ResizeObserver(() => { height.value = el.offsetHeight })
  resizeObserver.observe(el)
  height.value = el.offsetHeight
}, { flush: 'post' })

onMounted(() => {
  readViewport()
  window.addEventListener('resize', readViewport)
})

// ----- moving and scaling -----

type Gesture =
  | { kind: 'move'; id: number; x: number; y: number; left: number; bottom: number; moved: boolean }
  | { kind: 'scale'; id: number; x: number; width: number; size: number }
let gesture: Gesture | null = null

function wake(sticky = false) {
  awake.value = true
  clearTimeout(wakeTimer)
  if (sticky) wakeTimer = setTimeout(() => { awake.value = false }, 3500)
}

function onPointerDown(event: PointerEvent) {
  if (prefs.locked || event.button > 0) return
  if ((event.target as HTMLElement).closest('button')) return
  box.value?.setPointerCapture(event.pointerId)
  gesture = { kind: 'move', id: event.pointerId, x: event.clientX, y: event.clientY, left: left.value, bottom: bottom.value, moved: false }
}

function onScaleDown(event: PointerEvent) {
  if (prefs.locked || event.button > 0) return
  event.stopPropagation()
  box.value?.setPointerCapture(event.pointerId)
  gesture = { kind: 'scale', id: event.pointerId, x: event.clientX, width: width.value, size: prefs.size }
}

function onPointerMove(event: PointerEvent) {
  if (!gesture || gesture.id !== event.pointerId) return
  if (gesture.kind === 'move') {
    const dx = event.clientX - gesture.x
    const dy = event.clientY - gesture.y
    if (!gesture.moved && Math.hypot(dx, dy) < 4) return
    gesture.moved = true
    const roomX = Math.max(1, viewport.value.width - width.value)
    const roomY = Math.max(1, viewport.value.height - height.value)
    prefs.x = Math.max(0, Math.min(1, (gesture.left + dx) / roomX))
    prefs.y = Math.max(0, Math.min(1, (gesture.bottom - dy) / roomY))
    return
  }
  // The corner scales the whole thing: wider box, larger lyrics, in proportion.
  const target = Math.max(FLOATING_WIDTH_MIN, Math.min(viewport.value.width - 16, gesture.width + (event.clientX - gesture.x)))
  const ratio = target / gesture.width
  prefs.width = Math.round(target)
  prefs.size = Math.round(Math.max(FLOATING_SIZE_MIN, Math.min(FLOATING_SIZE_MAX, gesture.size * ratio)))
}

function onPointerUp(event: PointerEvent) {
  if (!gesture || gesture.id !== event.pointerId) return
  // A tap without moving shows the toolbar on a touch screen.
  if (gesture.kind === 'move' && !gesture.moved && event.pointerType !== 'mouse') wake(true)
  gesture = null
}

function resize(step: number) {
  prefs.size = Math.max(FLOATING_SIZE_MIN, Math.min(FLOATING_SIZE_MAX, prefs.size + step))
}

function cycleExtra() {
  const options = SUBTITLE_EXTRAS.filter(item => item.value === 'none'
    || (item.value === 'translation' && hasTranslation.value)
    || (item.value === 'romaji' && hasRomaji.value))
  const index = options.findIndex(item => item.value === extra.value)
  settings.extra = options[(index + 1) % options.length]!.value
}

const extraLabel = computed(() => SUBTITLE_EXTRAS.find(item => item.value === extra.value)?.label ?? '无')

onBeforeUnmount(() => {
  window.removeEventListener('resize', readViewport)
  resizeObserver?.disconnect()
  clearTimeout(wakeTimer)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fl">
      <div
        v-if="shown"
        ref="box"
        class="fl"
        :class="{ 'fl--locked': prefs.locked, 'fl--awake': awake, 'fl--bar-below': barBelow }"
        :style="{ left: `${left}px`, bottom: `${bottom}px`, width: `${width}px`, '--f-size': `${prefs.size}px` }"
        role="region"
        aria-label="悬浮歌词"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @pointerenter="(e: PointerEvent) => { if (e.pointerType === 'mouse') wake() }"
        @pointerleave="(e: PointerEvent) => { if (e.pointerType === 'mouse') awake = false }"
      >
        <div v-if="!prefs.locked" class="fl-bar">
          <button class="fl-btn" title="锁定（锁定后可点穿）" aria-label="锁定" @click="prefs.locked = true">
            <LockOpen class="h-4 w-4" />
          </button>
          <div class="fl-seg" role="group" aria-label="歌词样式">
            <button :class="{ on: prefs.mode === 'ktv' }" :aria-pressed="prefs.mode === 'ktv'" @click="prefs.mode = 'ktv'">KTV</button>
            <button :class="{ on: prefs.mode === 'lyrics' }" :aria-pressed="prefs.mode === 'lyrics'" @click="prefs.mode = 'lyrics'">单行</button>
          </div>
          <button class="fl-btn fl-btn--text" title="每行下方：译文 / 罗马音 / 无" :disabled="!hasTranslation && !hasRomaji" @click="cycleExtra">
            {{ extraLabel }}
          </button>
          <button class="fl-btn" title="缩小" aria-label="缩小字号" :disabled="prefs.size <= FLOATING_SIZE_MIN" @click="resize(-2)">
            <AArrowDown class="h-4 w-4" />
          </button>
          <button class="fl-btn" title="放大" aria-label="放大字号" :disabled="prefs.size >= FLOATING_SIZE_MAX" @click="resize(2)">
            <AArrowUp class="h-4 w-4" />
          </button>
          <button class="fl-btn" title="关闭悬浮歌词" aria-label="关闭悬浮歌词" @click="toggle">
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="fl-body">
          <MvSubtitles
            v-if="timedLyrics"
            :lyrics="timedLyrics"
            :mode="prefs.mode"
            placement="float"
            :extra="extra"
            :ruby="settings.ruby"
            :singer-colors="settings.singerColors"
            :show-performers="showPerformers"
            :heading="heading"
            :trim-start="track?.trimStart ?? 0"
            :current-time="player.currentTime"
            :playing="player.isPlaying"
            :clock="player.sampleTime"
          />
          <p v-else class="fl-note">{{ note || heading }}</p>
        </div>

        <div v-if="!prefs.locked" class="fl-scale" title="拖动缩放" aria-hidden="true" @pointerdown="onScaleDown"></div>
        <button v-else class="fl-unlock" title="解锁悬浮歌词" aria-label="解锁悬浮歌词" @click="prefs.locked = false">
          <Lock class="h-3.5 w-3.5" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fl {
  position: fixed;
  z-index: 35;
  padding: 0.5rem 0.75rem;
  border-radius: 1rem;
  color: #fff;
  cursor: grab;
  touch-action: none;
  user-select: none;
  transition: background-color 0.2s, box-shadow 0.2s;
}

.fl:active {
  cursor: grabbing;
}

/* Unlocked and pointed at: a pane behind the lyrics shows where it can be grabbed. */
.fl:not(.fl--locked):hover,
.fl--awake:not(.fl--locked) {
  background: rgb(10 10 16 / 0.45);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.12), 0 10px 30px -12px rgb(0 0 0 / 0.5);
  backdrop-filter: blur(6px);
}

/* Locked: the lyrics let clicks through to the page; only the small unlock button catches them. */
.fl--locked {
  cursor: default;
  pointer-events: none;
  touch-action: auto;
}

.fl-bar {
  position: absolute;
  bottom: calc(100% + 0.375rem);
  left: 50%;
  display: flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: rgb(20 22 30 / 0.88);
  box-shadow: 0 8px 24px -8px rgb(0 0 0 / 0.5);
  backdrop-filter: blur(16px);
  font-size: 0.75rem;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 4px);
  transition: opacity 0.15s, transform 0.15s;
  white-space: nowrap;
}

/* Bridges the gap to the box, so the pointer can reach the toolbar without leaving. */
.fl-bar::after {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  height: 0.5rem;
  content: '';
}

.fl--bar-below .fl-bar {
  top: calc(100% + 0.375rem);
  bottom: auto;
}

.fl--bar-below .fl-bar::after {
  top: auto;
  bottom: 100%;
}

.fl:hover .fl-bar,
.fl--awake .fl-bar {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, 0);
}

.fl-btn {
  display: grid;
  min-width: 1.875rem;
  height: 1.875rem;
  place-items: center;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.15s;
}

.fl-btn--text {
  padding: 0 0.6rem;
  font-weight: 600;
}

.fl-btn:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.14);
}

.fl-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.fl-seg {
  display: flex;
  padding: 0.125rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.08);
}

.fl-seg button {
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
  font-weight: 600;
  line-height: 1;
  opacity: 0.7;
  cursor: pointer;
}

.fl-seg button.on {
  background: rgb(255 255 255 / 0.22);
  opacity: 1;
}

.fl-body {
  position: relative;
  min-height: calc(var(--f-size) * 1.6);
}

.fl-note {
  display: grid;
  min-height: calc(var(--f-size) * 1.6);
  place-items: center;
  font-size: calc(var(--f-size) * 0.62);
  font-weight: 700;
  -webkit-text-stroke: 0.16em rgb(20 16 20 / 0.85);
  paint-order: stroke fill;
  opacity: 0.85;
}

.fl-scale {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 1.25rem;
  height: 1.25rem;
  border-right: 3px solid rgb(255 255 255 / 0.7);
  border-bottom: 3px solid rgb(255 255 255 / 0.7);
  border-bottom-right-radius: 1rem;
  cursor: ew-resize;
  opacity: 0;
  transition: opacity 0.15s;
}

.fl:hover .fl-scale,
.fl--awake .fl-scale {
  opacity: 1;
}

.fl-unlock {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  border-radius: 999px;
  background: rgb(20 22 30 / 0.7);
  cursor: pointer;
  opacity: 0.35;
  pointer-events: auto;
  transition: opacity 0.15s;
}

.fl-unlock:hover,
.fl-unlock:focus-visible {
  opacity: 1;
}

.fl-enter-active,
.fl-leave-active {
  transition: opacity 0.25s ease;
}

.fl-enter-from,
.fl-leave-to {
  opacity: 0;
}
</style>
