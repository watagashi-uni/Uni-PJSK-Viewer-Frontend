<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronDown, Info, ListMusic, Loader2, MicVocal, Pause, Play, Repeat, Repeat1, SkipBack, SkipForward, Volume1, Volume2,
} from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'
import { useSingerAvatars } from '@/composables/useSingerAvatars'
import MusicLyrics from '@/components/MusicLyrics.vue'
import PlayerQueue from '@/components/player/PlayerQueue.vue'
import PlayerScrubber from '@/components/player/PlayerScrubber.vue'
import SingerAvatars from '@/components/player/SingerAvatars.vue'
import ZhText from '@/components/ZhText.vue'
import { drawBackdrop, paintBackdrop } from '@/utils/blurredCover'

const route = useRoute()
const router = useRouter()
const player = usePlayerStore()
const { trackAvatars } = useSingerAvatars()

const root = ref<HTMLElement>()
const glowA = ref<HTMLCanvasElement>()
const glowB = ref<HTMLCanvasElement>()
const track = computed(() => player.current)
const open = computed(() => player.nowPlayingOpen && !!track.value)
const cover = computed(() => (track.value ? player.coverUrl(track.value) : ''))
const avatars = computed(() => (track.value ? trackAvatars(track.value.singers) : []))
const singerNames = computed(() => avatars.value.map(s => s.name).filter(Boolean).join('・'))
const repeatLabel = computed(() => ({ off: '循环：关', all: '循环：列表', one: '循环：单曲' })[player.repeat])

/** Who the lyrics say is singing this very line. */
const singing = ref<string[] | null>(null)
// Light up portraits only when every voice on the line is one of the listed singers;
// otherwise a guest without a portrait here would wrongly dim the whole cast.
const litSingers = computed(() => {
  const keys = singing.value
  if (!keys || player.nowPlayingPanel !== 'lyrics') return null
  const known = new Set(avatars.value.map(s => s.key))
  return keys.every(key => known.has(key)) ? keys : null
})
watch(() => track.value?.uid, () => { singing.value = null })

// The backdrop is the artwork blurred once into a tiny bitmap that the GPU stretches and turns.
// Blurring the full-size artwork with a CSS filter while it turns had to be redone every frame,
// which kept the machine busy (and its fans spinning) even with the music paused.
let backdropRequest = 0
watch([cover, glowA, glowB], async ([url, a, b]) => {
  const serial = ++backdropRequest
  if (!url || !a || !b) return
  const bitmap = await paintBackdrop(url)
  if (serial !== backdropRequest || !bitmap) return
  drawBackdrop(a, bitmap)
  drawBackdrop(b, bitmap, true)
}, { flush: 'post' })

// The backdrop turns slowly while the music plays and holds still when it is paused.
// A paused animation, whether a CSS animation or Web Animation, still has the whole screen
// redrawn every frame, so a paused one is frozen in place and dropped, and picked up again
// from the same angle when the music resumes.
const SPIN = { a: { duration: 60000, direction: 'normal' }, b: { duration: 44000, direction: 'reverse' } } as const
const spinAt = { a: 0, b: 0 }
const spinning = new Map<'a' | 'b', { el: HTMLCanvasElement; animation: Animation }>()
watch([glowA, glowB, () => player.isPlaying], ([a, b, playing]) => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  for (const [key, el] of [['a', a], ['b', b]] as const) {
    const current = spinning.get(key)
    // Stop when the music stops, or when the view closed and took the layer with it.
    if (current && (!playing || still || current.el !== el)) {
      spinAt[key] = Number(current.animation.currentTime ?? 0)
      if (current.el === el) current.animation.commitStyles()
      current.animation.cancel()
      spinning.delete(key)
    }
    if (el && !spinning.has(key) && playing && !still) {
      const animation = el.animate(
        [{ transform: 'scale(2.6) rotate(0deg)' }, { transform: 'scale(2.6) rotate(360deg)' }],
        { duration: SPIN[key].duration, direction: SPIN[key].direction, iterations: Infinity },
      )
      animation.currentTime = spinAt[key]
      spinning.set(key, { el, animation })
    }
  }
}, { flush: 'post', immediate: true })

function togglePanel(name: 'lyrics' | 'queue') {
  player.nowPlayingPanel = player.nowPlayingPanel === name ? 'none' : name
}

function close() {
  player.nowPlayingOpen = false
}

function openSongPage() {
  const id = track.value?.musicId
  close()
  if (id !== undefined) void router.push(`/musics/${id}`)
}

function seekFromLyrics(time: number) {
  player.seek(time)
  if (!player.isPlaying) player.play()
}

function onVolumeInput(event: Event) {
  player.setVolume(Number((event.target as HTMLInputElement).value))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    close()
  } else if (event.key === ' ' && event.target === root.value) {
    event.preventDefault()
    player.toggle()
  }
}

// The page underneath must not scroll while the view covers it.
watch(open, async (value) => {
  document.documentElement.style.overflow = value ? 'hidden' : ''
  if (value) {
    await nextTick()
    root.value?.focus({ preventScroll: true })
  }
})
// Following a link (or going back) leaves the full-screen view.
watch(() => route.fullPath, close)
onBeforeUnmount(() => { document.documentElement.style.overflow = '' })
</script>

<template>
  <Teleport to="body">
    <Transition name="np">
      <div
        v-if="open && track"
        ref="root"
        class="np"
        :class="`np--${player.nowPlayingPanel}`"
        role="dialog"
        aria-modal="true"
        aria-label="正在播放"
        tabindex="-1"
        @keydown="onKeydown"
      >
        <!-- The artwork, blown up and blurred, slowly turning: the whole view takes the colours of the song. -->
        <div class="np-backdrop" aria-hidden="true">
          <canvas ref="glowA" class="np-glow np-glow--a"></canvas>
          <canvas ref="glowB" class="np-glow np-glow--b"></canvas>
          <div class="np-shade"></div>
        </div>

        <header class="np-top">
          <button class="np-icon" aria-label="收起" title="收起" @click="close">
            <ChevronDown class="h-6 w-6" />
          </button>
          <div class="np-tabs">
            <button class="np-tab" :class="{ on: player.nowPlayingPanel === 'lyrics' }" :aria-pressed="player.nowPlayingPanel === 'lyrics'" @click="togglePanel('lyrics')">
              <MicVocal class="h-4 w-4" /> 歌词
            </button>
            <button class="np-tab" :class="{ on: player.nowPlayingPanel === 'queue' }" :aria-pressed="player.nowPlayingPanel === 'queue'" @click="togglePanel('queue')">
              <ListMusic class="h-4 w-4" /> 队列
            </button>
          </div>
        </header>

        <div class="np-body">
          <div class="np-stage">
            <div class="np-head">
              <div class="np-art" :class="{ playing: player.isPlaying }">
                <img :src="cover" :alt="track.title" crossorigin="anonymous" />
              </div>
              <div class="np-meta">
                <h2 class="np-title"><ZhText :text="track.title" table="musics" path="title" main-class="np-line" sub-class="np-line np-title-sub" /></h2>
                <p class="np-caption"><ZhText :text="track.caption" table="musicVocals" path="caption" layout="inline" /></p>
                <div v-if="avatars.length" class="np-singers">
                  <SingerAvatars :singers="avatars" :size="34" :max="8" :active-keys="litSingers" />
                  <span class="np-singer-names">{{ singerNames }}</span>
                </div>
              </div>
            </div>

            <div class="np-controls">
              <PlayerScrubber
                layout="stacked"
                :time="player.currentTime"
                :duration="player.duration"
                :disabled="!player.isLoaded"
                @seek="player.seek"
              />
              <p v-if="player.hasError" class="np-error">音频加载失败，点击播放重试</p>
              <div class="np-transport">
                <button class="np-icon np-icon--small" :class="{ on: player.repeat !== 'off' }" :aria-label="repeatLabel" :title="repeatLabel" @click="player.cycleRepeat()">
                  <Repeat1 v-if="player.repeat === 'one'" class="h-5 w-5" />
                  <Repeat v-else class="h-5 w-5" />
                </button>
                <button class="np-icon" aria-label="上一首" title="上一首" @click="player.previous()">
                  <SkipBack class="h-7 w-7" fill="currentColor" />
                </button>
                <button class="np-play" :aria-label="player.isPlaying ? '暂停' : '播放'" @click="player.toggle()">
                  <Loader2 v-if="player.isPlaying && player.isBuffering" class="h-9 w-9 animate-spin" />
                  <Pause v-else-if="player.isPlaying" class="h-10 w-10" fill="currentColor" />
                  <Play v-else class="ml-1 h-10 w-10" fill="currentColor" />
                </button>
                <button class="np-icon" aria-label="下一首" title="下一首" :disabled="!player.hasNext" @click="player.next()">
                  <SkipForward class="h-7 w-7" fill="currentColor" />
                </button>
                <button class="np-icon np-icon--small" aria-label="歌曲详情" title="歌曲详情" @click="openSongPage">
                  <Info class="h-5 w-5" />
                </button>
              </div>
              <div class="np-volume">
                <Volume1 class="h-4 w-4 shrink-0 opacity-60" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  aria-label="音量"
                  class="np-range"
                  :value="player.muted ? 0 : player.volume"
                  :style="{ '--fill': `${(player.muted ? 0 : player.volume) * 100}%` }"
                  @input="onVolumeInput"
                />
                <Volume2 class="h-4 w-4 shrink-0 opacity-60" />
              </div>
            </div>
          </div>

          <div v-if="player.nowPlayingPanel !== 'none'" class="np-side">
            <MusicLyrics
              v-if="player.nowPlayingPanel === 'lyrics'"
              variant="immersive"
              synced
              :music-id="track.musicId"
              :vocal-id="track.vocalId"
              :assetbundle="track.vocalAssetbundle"
              :vocal-type="track.vocalType"
              :current-time="player.currentTime"
              :duration="player.isLoaded ? player.duration : 0"
              :playing="player.isPlaying"
              :clock="player.sampleTime"
              :trim-start="track.trimStart"
              @seek="seekFromLyrics"
              @singing="singing = $event"
            />
            <PlayerQueue v-else class="np-queue" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.np {
  position: fixed;
  z-index: 60;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0b0c11;
  color: #fff;
  outline: none;
}

.np-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.np-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70vmax;
  max-width: none;
  height: 70vmax;
  margin: -35vmax 0 0 -35vmax;
  transform: scale(2.6);
}

.np-glow--b {
  top: 78%;
  left: 82%;
  opacity: 0.7;
  mix-blend-mode: soft-light;
}

.np-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(10 11 16 / 0.5), rgb(10 11 16 / 0.72));
}

.np-top {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: calc(0.625rem + env(safe-area-inset-top, 0px)) clamp(0.75rem, 2vw, 1.5rem) 0.625rem;
}

.np-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.15s, transform 0.15s, opacity 0.15s;
}

.np-icon:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.12);
}

.np-icon:active:not(:disabled) {
  transform: scale(0.9);
}

.np-icon:disabled {
  opacity: 0.3;
  cursor: default;
}

.np-icon--small {
  width: 2.5rem;
  height: 2.5rem;
  opacity: 0.65;
}

.np-icon--small.on,
.np-icon--small:hover {
  opacity: 1;
}

.np-icon--small.on {
  background: rgb(255 255 255 / 0.16);
}

.np-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.1);
  backdrop-filter: blur(20px);
}

.np-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
  opacity: 0.7;
  cursor: pointer;
  transition: background-color 0.2s, opacity 0.2s;
}

.np-tab:hover,
.np-tab.on {
  opacity: 1;
}

.np-tab.on {
  background: rgb(255 255 255 / 0.22);
}

.np-body {
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
  padding: 0.25rem clamp(1rem, 5vw, 2rem) calc(1.25rem + env(safe-area-inset-bottom, 0px));
}

.np-stage {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(1rem, 3.5vh, 2.25rem);
}

.np-stage > * {
  width: min(100%, 27rem, 52vh);
}

.np-head {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: clamp(1rem, 3vh, 2rem);
}

.np-art {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: clamp(0.75rem, 1.6vw, 1.25rem);
  background: rgb(255 255 255 / 0.08);
  box-shadow: 0 32px 80px -24px rgb(0 0 0 / 0.7), 0 8px 24px rgb(0 0 0 / 0.25);
  transform: scale(0.84);
  transition: transform 0.7s cubic-bezier(0.3, 1.3, 0.4, 1);
}

/* The cover leans in while music plays and steps back when paused. */
.np-art.playing {
  transform: none;
}

.np-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.np-meta {
  min-width: 0;
}

.np-title {
  font-size: clamp(1.2rem, 1.2vw + 0.9rem, 1.6rem);
  font-weight: 800;
  line-height: 1.25;
}

.np-title :deep(.np-line) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.np-title :deep(.np-title-sub) {
  font-size: 0.68em;
  font-weight: 600;
  opacity: 0.7;
}

.np-caption {
  margin-top: 0.2rem;
  overflow: hidden;
  font-size: 0.875rem;
  opacity: 0.65;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.np-singers {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 0.75rem;
  padding-left: 3px;
}

.np-singer-names {
  overflow: hidden;
  font-size: 0.8125rem;
  opacity: 0.75;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.np-controls {
  --scrubber-color: #fff;
  flex-shrink: 0;
}

.np-error {
  margin-top: 0.25rem;
  color: #fca5a5;
  font-size: 0.8125rem;
  text-align: center;
}

.np-transport {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.25rem;
}

.np-play {
  display: grid;
  width: 4.5rem;
  height: 4.5rem;
  place-items: center;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.15s, transform 0.15s;
}

.np-play:hover {
  background: rgb(255 255 255 / 0.12);
}

.np-play:active {
  transform: scale(0.9);
}

.np-volume {
  display: none;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.np-range {
  height: 1rem;
  flex: 1;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.np-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(to right, #fff var(--fill), rgb(255 255 255 / 0.22) var(--fill));
}

.np-range::-moz-range-track {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(to right, #fff var(--fill), rgb(255 255 255 / 0.22) var(--fill));
}

.np-range::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  margin-top: -5px;
  appearance: none;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.4);
}

.np-range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 0;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.4);
}

.np-side {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.np-queue {
  width: min(100%, 36rem);
  height: 100%;
  margin-inline: auto;
}

/* Narrow screens with lyrics or the queue open: the artwork shrinks into a header row,
   the panel takes the middle, and the transport stays within reach at the bottom. */
@media (max-width: 899px) {
  .np:not(.np--none) .np-stage {
    display: contents;
  }

  .np:not(.np--none) .np-head {
    flex-direction: row;
    flex-shrink: 0;
    align-items: center;
    gap: 0.875rem;
  }

  .np:not(.np--none) .np-art {
    width: 4rem;
    flex-shrink: 0;
    border-radius: 0.625rem;
    box-shadow: 0 8px 24px -6px rgb(0 0 0 / 0.6);
    transform: none;
  }

  .np:not(.np--none) .np-title {
    font-size: 1.0625rem;
  }

  .np:not(.np--none) .np-caption {
    font-size: 0.75rem;
  }

  .np:not(.np--none) .np-singers {
    margin-top: 0.3rem;
  }

  .np:not(.np--none) .np-singers :deep(.singer-avatars) {
    --avatar-size: 22px !important;
  }

  .np:not(.np--none) .np-singer-names {
    display: none;
  }

  .np:not(.np--none) .np-side {
    order: 2;
  }

  .np:not(.np--none) .np-controls {
    order: 3;
  }
}

@media (min-width: 900px) {
  .np-body {
    flex-direction: row;
    gap: clamp(2rem, 5vw, 6rem);
    padding: 0 clamp(2rem, 6vw, 7rem) clamp(1.5rem, 4vh, 3rem);
  }

  .np:not(.np--none) .np-stage {
    flex: 5;
  }

  .np-side {
    flex: 6;
    padding-block: 0.5rem;
  }

  .np-volume {
    display: flex;
  }
}

.np-enter-active,
.np-leave-active {
  transition: transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.35s ease;
}

.np-enter-from,
.np-leave-to {
  opacity: 0;
  transform: translateY(8%);
}
</style>
