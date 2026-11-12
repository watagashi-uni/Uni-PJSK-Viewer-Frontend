<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  time: number
  duration: number
  disabled?: boolean
  /** inline: time, bar, length on one row. stacked: bar with the times underneath. bare: bar only. */
  layout?: 'inline' | 'stacked' | 'bare'
}>(), { disabled: false, layout: 'inline' })

const emit = defineEmits<{ seek: [time: number] }>()

const KEY_STEP_SEC = 5
const bar = ref<HTMLElement>()
/** Position under the pointer while dragging; playback only jumps on release. */
const dragTime = ref<number | null>(null)

const shown = computed(() => dragTime.value ?? props.time)
const ratio = computed(() => (props.duration > 0 ? Math.max(0, Math.min(1, shown.value / props.duration)) : 0))

function format(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const whole = Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

function timeAt(event: PointerEvent): number {
  const rect = bar.value!.getBoundingClientRect()
  return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * props.duration
}

function onPointerDown(event: PointerEvent) {
  if (props.disabled || !(props.duration > 0) || event.button > 0) return
  bar.value!.setPointerCapture(event.pointerId)
  dragTime.value = timeAt(event)
}

function onPointerMove(event: PointerEvent) {
  if (dragTime.value !== null) dragTime.value = timeAt(event)
}

function onPointerUp(event: PointerEvent) {
  if (dragTime.value === null) return
  const target = timeAt(event)
  dragTime.value = null
  emit('seek', target)
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled || !(props.duration > 0)) return
  const targets: Record<string, number> = {
    ArrowLeft: props.time - KEY_STEP_SEC,
    ArrowDown: props.time - KEY_STEP_SEC,
    ArrowRight: props.time + KEY_STEP_SEC,
    ArrowUp: props.time + KEY_STEP_SEC,
    Home: 0,
    End: props.duration,
  }
  const target = targets[event.key]
  if (target === undefined) return
  event.preventDefault()
  emit('seek', Math.max(0, Math.min(props.duration, target)))
}
</script>

<template>
  <div class="scrubber" :class="[`scrubber--${layout}`, { dragging: dragTime !== null, disabled: disabled || !(duration > 0) }]">
    <span v-if="layout === 'inline'" class="scrubber-time">{{ format(shown) }}</span>
    <div
      ref="bar"
      class="scrubber-bar"
      role="slider"
      :tabindex="disabled ? -1 : 0"
      aria-label="播放进度"
      aria-valuemin="0"
      :aria-valuemax="Math.round(duration)"
      :aria-valuenow="Math.round(shown)"
      :aria-valuetext="`${format(shown)} / ${format(duration)}`"
      :aria-disabled="disabled || !(duration > 0)"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="dragTime = null"
      @keydown="onKeydown"
    >
      <div class="scrubber-rail">
        <div class="scrubber-fill" :style="{ transform: `scaleX(${ratio})` }"></div>
      </div>
      <div class="scrubber-thumb" :style="{ left: `${ratio * 100}%` }"></div>
    </div>
    <span v-if="layout === 'inline'" class="scrubber-time scrubber-time--end">{{ duration > 0 ? format(duration) : '--:--' }}</span>
    <div v-if="layout === 'stacked'" class="scrubber-times">
      <span class="scrubber-time">{{ format(shown) }}</span>
      <span class="scrubber-time">{{ duration > 0 ? `-${format(Math.max(0, duration - shown))}` : '--:--' }}</span>
    </div>
  </div>
</template>

<style scoped>
.scrubber {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.625rem;
}

.scrubber--stacked {
  display: block;
}

.scrubber-bar {
  position: relative;
  flex: 1;
  min-width: 0;
  /* Tall hit area around a slim rail. */
  padding: 0.5rem 0;
  cursor: pointer;
  touch-action: none;
  border-radius: 999px;
}

.scrubber.disabled .scrubber-bar {
  cursor: default;
}

.scrubber-rail {
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 18%, transparent);
  transition: height 0.2s ease, margin 0.2s ease;
}

.scrubber-fill {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: var(--scrubber-color, currentColor);
  transform-origin: left center;
}

.scrubber-thumb {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 999px;
  background: var(--scrubber-thumb, #fff);
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.35);
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.15s ease, transform 0.15s ease;
  pointer-events: none;
}

.scrubber-bar:hover .scrubber-rail,
.scrubber.dragging .scrubber-rail,
.scrubber-bar:focus-visible .scrubber-rail {
  height: 6px;
  margin: -1px 0;
}

.scrubber:not(.disabled) .scrubber-bar:hover .scrubber-thumb,
.scrubber.dragging .scrubber-thumb,
.scrubber-bar:focus-visible .scrubber-thumb {
  opacity: 1;
  transform: none;
}

.scrubber-time {
  flex-shrink: 0;
  min-width: 2.5rem;
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.6;
}

.scrubber-time--end {
  text-align: right;
}

.scrubber-times {
  display: flex;
  justify-content: space-between;
  margin-top: -0.125rem;
}

.scrubber-times .scrubber-time:last-child {
  text-align: right;
}
</style>
