<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { GripVertical, ListX, Shuffle, X } from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'
import { useSingerAvatars } from '@/composables/useSingerAvatars'
import SingerAvatars from '@/components/player/SingerAvatars.vue'
import ZhText from '@/components/ZhText.vue'

const player = usePlayerStore()
const { trackAvatars } = useSingerAvatars()

const list = ref<HTMLElement>()
/** Row being dragged, where it would land, and how far the pointer has carried it. */
const drag = ref<{ from: number; to: number; offset: number } | null>(null)
let dragStartY = 0
let dragStartScroll = 0
let rowPitch = 0

const upcomingCount = computed(() => player.upcoming.length)

onMounted(async () => {
  await nextTick()
  const box = list.value
  const row = box?.children[player.index] as HTMLElement | undefined
  // Open on the current track with one played track visible above it.
  if (box && row) box.scrollTop = Math.max(0, row.offsetTop - box.offsetTop - row.offsetHeight)
})

function onGripDown(event: PointerEvent, index: number) {
  if (event.button > 0) return
  const grip = event.currentTarget as HTMLElement
  const row = grip.closest<HTMLElement>('.queue-row')
  const next = row?.nextElementSibling as HTMLElement | null
  const previous = row?.previousElementSibling as HTMLElement | null
  if (!row) return
  // Distance between row tops, so the gap between rows is part of each step.
  rowPitch = next ? next.offsetTop - row.offsetTop : previous ? row.offsetTop - previous.offsetTop : row.offsetHeight
  dragStartY = event.clientY
  dragStartScroll = list.value?.scrollTop ?? 0
  grip.setPointerCapture(event.pointerId)
  drag.value = { from: index, to: index, offset: 0 }
}

function onGripMove(event: PointerEvent) {
  const state = drag.value
  if (!state || !rowPitch) return
  const offset = event.clientY - dragStartY + ((list.value?.scrollTop ?? 0) - dragStartScroll)
  const to = Math.max(0, Math.min(player.queue.length - 1, state.from + Math.round(offset / rowPitch)))
  drag.value = { from: state.from, to, offset }
}

function onGripUp() {
  const state = drag.value
  drag.value = null
  if (state && state.to !== state.from) player.move(state.from, state.to)
}

function onGripKey(event: KeyboardEvent, index: number) {
  const step = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
  if (!step) return
  event.preventDefault()
  const target = index + step
  if (target < 0 || target >= player.queue.length) return
  player.move(index, target)
  void nextTick(() => {
    (list.value?.children[target] as HTMLElement | undefined)?.querySelector<HTMLElement>('.queue-grip')?.focus()
  })
}

function rowStyle(index: number) {
  const state = drag.value
  if (!state) return undefined
  if (index === state.from) return { transform: `translateY(${state.offset}px)`, zIndex: 2, transition: 'none' }
  // Rows between the origin and the landing slot step aside.
  if (state.to > state.from && index > state.from && index <= state.to) return { transform: `translateY(${-rowPitch}px)` }
  if (state.to < state.from && index >= state.to && index < state.from) return { transform: `translateY(${rowPitch}px)` }
  return undefined
}
</script>

<template>
  <section class="queue" aria-label="播放队列">
    <header class="queue-head">
      <div class="min-w-0">
        <h2 class="queue-title">播放队列</h2>
        <p class="queue-count">共 {{ player.queue.length }} 首<template v-if="upcomingCount"> · 待播 {{ upcomingCount }} 首</template></p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <button class="queue-action" :disabled="upcomingCount < 2" title="打乱待播顺序" @click="player.shuffleUpcoming()">
          <Shuffle class="h-3.5 w-3.5" /> 随机
        </button>
        <button class="queue-action" :disabled="!upcomingCount" title="清空待播歌曲" @click="player.clearUpcoming()">
          <ListX class="h-3.5 w-3.5" /> 清空待播
        </button>
      </div>
    </header>

    <ol ref="list" class="queue-list" :class="{ sorting: drag }">
      <li
        v-for="(track, index) in player.queue"
        :key="track.uid"
        class="queue-row"
        :class="{ current: index === player.index, played: index < player.index, dragging: drag?.from === index }"
        :style="rowStyle(index)"
      >
        <button
          class="queue-grip"
          :aria-label="`移动「${track.title}」，可用上下方向键调整顺序`"
          @pointerdown="onGripDown($event, index)"
          @pointermove="onGripMove"
          @pointerup="onGripUp"
          @pointercancel="drag = null"
          @keydown="onGripKey($event, index)"
        >
          <GripVertical class="h-4 w-4" />
        </button>
        <button class="queue-main" :aria-current="index === player.index ? 'true' : undefined" @click="player.jumpTo(index)">
          <span class="queue-cover">
            <img :src="player.coverUrl(track)" alt="" loading="lazy" crossorigin="anonymous" />
            <span v-if="index === player.index" class="queue-playing" :class="{ paused: !player.isPlaying }" aria-hidden="true"><i></i><i></i><i></i></span>
          </span>
          <span class="min-w-0 flex-1 text-left">
            <span class="queue-name"><ZhText :text="track.title" table="musics" path="title" layout="inline" /></span>
            <span class="queue-sub">
              <SingerAvatars :singers="trackAvatars(track.singers)" :size="16" :max="5" />
              <span class="truncate"><ZhText :text="track.caption" table="musicVocals" path="caption" layout="inline" /></span>
            </span>
          </span>
        </button>
        <button class="queue-remove" :aria-label="`从队列移除「${track.title}」`" title="移除" @click="player.remove(index)">
          <X class="h-4 w-4" />
        </button>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.queue {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.queue-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.25rem 0.5rem 0.75rem;
}

.queue-title {
  font-size: 1rem;
  font-weight: 700;
}

.queue-count {
  font-size: 0.75rem;
  opacity: 0.6;
}

.queue-action {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 9%, transparent);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s;
}

.queue-action:hover:not(:disabled) {
  background: color-mix(in srgb, currentColor 18%, transparent);
}

.queue-action:disabled {
  opacity: 0.35;
  cursor: default;
}

.queue-list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, currentColor 25%, transparent) transparent;
}

.queue-row {
  position: relative;
  display: flex;
  height: 3.5rem;
  flex-shrink: 0;
  align-items: center;
  border-radius: 0.75rem;
  transition: background-color 0.15s, transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1);
}

.queue-row:hover,
.queue-row:focus-within {
  background: color-mix(in srgb, currentColor 7%, transparent);
}

.queue-row.current {
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.queue-row.played .queue-main {
  opacity: 0.5;
}

.queue-row.dragging {
  background: color-mix(in srgb, currentColor 16%, transparent);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.25);
}

.queue-grip {
  display: grid;
  width: 1.75rem;
  height: 100%;
  flex-shrink: 0;
  place-items: center;
  opacity: 0.35;
  cursor: grab;
  touch-action: none;
}

.queue-grip:hover,
.queue-grip:focus-visible {
  opacity: 0.9;
}

.queue-row.dragging .queue-grip {
  cursor: grabbing;
}

.queue-main {
  display: flex;
  min-width: 0;
  height: 100%;
  flex: 1;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.queue-cover {
  position: relative;
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.5rem;
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.queue-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.queue-playing {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: rgb(0 0 0 / 0.45);
}

.queue-playing i {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: #fff;
  transform-origin: center bottom;
  animation: queue-eq 0.9s ease-in-out infinite;
}

.queue-playing i:nth-child(2) { animation-delay: -0.3s; }
.queue-playing i:nth-child(3) { animation-delay: -0.6s; }
.queue-playing.paused i { animation-play-state: paused; }

@keyframes queue-eq {
  0%, 100% { transform: scaleY(0.35); }
  50% { transform: scaleY(1); }
}

.queue-name {
  display: block;
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-sub {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.15rem;
  font-size: 0.75rem;
  opacity: 0.65;
}

.queue-remove {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  opacity: 0.4;
  cursor: pointer;
  transition: opacity 0.15s, background-color 0.15s;
}

.queue-remove:hover,
.queue-remove:focus-visible {
  background: color-mix(in srgb, currentColor 12%, transparent);
  opacity: 1;
}
</style>
