<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ChevronUp, ListMusic, Loader2, MicVocal, Pause, Play, Power, Repeat, Repeat1, SkipBack, SkipForward, Volume2, VolumeX, X,
} from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'
import { useSingerAvatars } from '@/composables/useSingerAvatars'
import PlayerQueue from '@/components/player/PlayerQueue.vue'
import PlayerScrubber from '@/components/player/PlayerScrubber.vue'
import SingerAvatars from '@/components/player/SingerAvatars.vue'
import ZhText from '@/components/ZhText.vue'

const route = useRoute()
const player = usePlayerStore()
const { trackAvatars } = useSingerAvatars()

const track = computed(() => player.current)
const queueOpen = ref(false)
const progress = computed(() => (player.duration > 0 ? Math.max(0, Math.min(1, player.currentTime / player.duration)) : 0))
const repeatLabel = computed(() => ({ off: '循环：关', all: '循环：列表', one: '循环：单曲' })[player.repeat])

// The queue sheet belongs to the page it was opened on.
watch(() => route.fullPath, () => { queueOpen.value = false })
watch(track, (value) => { if (!value) queueOpen.value = false })

function onVolumeInput(event: Event) {
  player.setVolume(Number((event.target as HTMLInputElement).value))
}

function closePlayer() {
  queueOpen.value = false
  player.close()
}
</script>

<template>
  <Transition name="player-dock">
    <div v-if="track" class="player-dock">
      <div v-if="queueOpen" class="player-scrim" @click="queueOpen = false"></div>

      <Transition name="player-pop">
        <div v-if="queueOpen" class="player-pop" role="dialog" aria-label="播放队列" @keydown.esc="queueOpen = false">
          <PlayerQueue class="min-h-0 flex-1" />
          <button class="player-pop-stop" @click="closePlayer">
            <Power class="h-3.5 w-3.5" /> 停止播放并关闭播放器
          </button>
        </div>
      </Transition>

      <div class="player-bar" role="region" aria-label="音乐播放器">
        <!-- Small screens have no room for a scrubber: the top edge shows the position instead. -->
        <div class="player-edge" aria-hidden="true"><div :style="{ transform: `scaleX(${progress})` }"></div></div>

        <button class="player-now" aria-label="打开正在播放" @click="player.openNowPlaying()">
          <span class="player-cover">
            <img :src="player.coverUrl(track)" alt="" crossorigin="anonymous" />
            <span class="player-cover-hint" aria-hidden="true"><ChevronUp class="h-5 w-5" /></span>
          </span>
          <span class="min-w-0 flex-1 text-left">
            <span class="player-title"><ZhText :text="track.title" table="musics" path="title" layout="inline" /></span>
            <span class="player-sub">
              <span v-if="player.hasError" class="text-error">音频加载失败，点击播放重试</span>
              <template v-else>
                <SingerAvatars :singers="trackAvatars(track.singers)" :size="18" :max="5" />
                <span class="truncate"><ZhText :text="track.caption" table="musicVocals" path="caption" layout="inline" /></span>
              </template>
            </span>
          </span>
        </button>

        <div class="player-transport">
          <button class="player-btn player-btn--wide" aria-label="上一首" title="上一首" @click="player.previous()">
            <SkipBack class="h-4 w-4" fill="currentColor" />
          </button>
          <button class="player-play" :aria-label="player.isPlaying ? '暂停' : '播放'" @click="player.toggle()">
            <Loader2 v-if="player.isPlaying && player.isBuffering" class="h-5 w-5 animate-spin" />
            <Pause v-else-if="player.isPlaying" class="h-5 w-5" fill="currentColor" />
            <Play v-else class="ml-0.5 h-5 w-5" fill="currentColor" />
          </button>
          <button class="player-btn" aria-label="下一首" title="下一首" :disabled="!player.hasNext" @click="player.next()">
            <SkipForward class="h-4 w-4" fill="currentColor" />
          </button>
        </div>

        <PlayerScrubber
          class="player-seek"
          :time="player.currentTime"
          :duration="player.duration"
          :disabled="!player.isLoaded"
          @seek="player.seek"
        />

        <div class="player-tools">
          <button
            class="player-btn player-btn--desktop"
            :class="{ on: player.repeat !== 'off' }"
            :aria-label="repeatLabel"
            :title="repeatLabel"
            @click="player.cycleRepeat()"
          >
            <Repeat1 v-if="player.repeat === 'one'" class="h-4 w-4" />
            <Repeat v-else class="h-4 w-4" />
          </button>
          <button
            class="player-btn player-btn--wide"
            :class="{ on: player.lyricsSidebarShown }"
            aria-label="歌词"
            title="歌词"
            :aria-pressed="player.lyricsSidebarShown"
            @click="player.toggleLyrics()"
          >
            <MicVocal class="h-4 w-4" />
          </button>
          <button
            class="player-btn"
            :class="{ on: queueOpen }"
            aria-label="播放队列"
            title="播放队列"
            :aria-expanded="queueOpen"
            @click="queueOpen = !queueOpen"
          >
            <ListMusic class="h-4 w-4" />
            <span v-if="player.upcoming.length" class="player-badge">{{ player.upcoming.length > 99 ? '99+' : player.upcoming.length }}</span>
          </button>
          <div class="player-volume">
            <button class="player-btn" :aria-label="player.muted || player.volume === 0 ? '取消静音' : '静音'" @click="player.toggleMute()">
              <VolumeX v-if="player.muted || player.volume === 0" class="h-4 w-4" />
              <Volume2 v-else class="h-4 w-4" />
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              aria-label="音量"
              class="player-range"
              :value="player.muted ? 0 : player.volume"
              :style="{ '--fill': `${(player.muted ? 0 : player.volume) * 100}%` }"
              @input="onVolumeInput"
            />
          </div>
          <button class="player-btn" aria-label="关闭播放器" title="关闭播放器" @click="closePlayer">
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Sits at the end of the page column and sticks to the bottom of the window, so it
   never covers the footer and always matches the width of the content beside the sidebar. */
.player-dock {
  position: sticky;
  z-index: 30;
  bottom: 0;
  padding: 0.5rem 0.75rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
  pointer-events: none;
}

.player-bar {
  --scrubber-color: var(--color-primary);
  position: relative;
  display: grid;
  max-width: 80rem;
  align-items: center;
  gap: 0.25rem 0.75rem;
  grid-template-columns: minmax(0, 1fr) auto auto;
  margin-inline: auto;
  padding: 0.5rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
  border-radius: 1.125rem;
  background: color-mix(in srgb, var(--color-base-100) 82%, transparent);
  box-shadow: 0 10px 40px -8px rgb(0 0 0 / 0.28), 0 2px 8px rgb(0 0 0 / 0.08);
  color: var(--color-base-content);
  pointer-events: auto;
  backdrop-filter: blur(24px) saturate(1.6);
}

.player-edge {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 2px;
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.player-edge div {
  height: 100%;
  background: var(--color-primary);
  transform-origin: left center;
}

.player-now {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
}

.player-cover {
  position: relative;
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.625rem;
  background: var(--color-base-300);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.2);
}

.player-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-cover-hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 0.45);
  color: #fff;
  opacity: 0;
  transition: opacity 0.15s;
}

.player-now:hover .player-cover-hint,
.player-now:focus-visible .player-cover-hint {
  opacity: 1;
}

.player-title {
  display: block;
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-sub {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.125rem;
  font-size: 0.75rem;
  color: color-mix(in srgb, currentColor 65%, transparent);
}

.player-transport,
.player-tools {
  display: flex;
  align-items: center;
  gap: 0.125rem;
}

.player-btn {
  position: relative;
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  color: color-mix(in srgb, currentColor 75%, transparent);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s, transform 0.15s;
}

.player-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-base-content) 9%, transparent);
  color: var(--color-base-content);
}

.player-btn:active:not(:disabled) {
  transform: scale(0.92);
}

.player-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.player-btn.on {
  color: var(--color-primary);
}

.player-play {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  background: var(--color-base-content);
  color: var(--color-base-100);
  cursor: pointer;
  transition: transform 0.15s;
}

.player-play:hover {
  transform: scale(1.06);
}

.player-play:active {
  transform: scale(0.94);
}

.player-badge {
  position: absolute;
  top: 0;
  right: -2px;
  min-width: 1rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-primary-content);
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1rem;
}

/* The scrubber root also carries its own display rule: outrank it. */
.player-bar .player-seek,
.player-volume,
.player-btn--wide,
.player-btn--desktop {
  display: none;
}

.player-range {
  width: 5rem;
  height: 1rem;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.player-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(to right, currentColor var(--fill), color-mix(in srgb, currentColor 18%, transparent) var(--fill));
}

.player-range::-moz-range-track {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(to right, currentColor var(--fill), color-mix(in srgb, currentColor 18%, transparent) var(--fill));
}

.player-range::-webkit-slider-thumb {
  width: 12px;
  height: 12px;
  margin-top: -4px;
  appearance: none;
  border-radius: 999px;
  background: var(--color-base-content);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.3);
}

.player-range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border: 0;
  border-radius: 999px;
  background: var(--color-base-content);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.3);
}

.player-scrim {
  position: fixed;
  inset: 0;
  pointer-events: auto;
}

.player-pop {
  position: relative;
  display: flex;
  width: min(26rem, 100%);
  max-height: min(60vh, 32rem);
  flex-direction: column;
  margin: 0 0 0.5rem auto;
  padding: 0.875rem 0.625rem 0.625rem;
  border: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
  border-radius: 1.125rem;
  background: color-mix(in srgb, var(--color-base-100) 92%, transparent);
  box-shadow: 0 16px 48px -8px rgb(0 0 0 / 0.35);
  color: var(--color-base-content);
  pointer-events: auto;
  backdrop-filter: blur(24px) saturate(1.6);
}

.player-pop-stop {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.15s, background-color 0.15s;
}

.player-pop-stop:hover {
  background: color-mix(in srgb, var(--color-error) 12%, transparent);
  color: var(--color-error);
  opacity: 1;
}

@media (min-width: 640px) {
  .player-btn--wide {
    display: grid;
  }
}

@media (min-width: 768px) {
  .player-bar {
    gap: 1rem;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.3fr) auto;
    padding: 0.5rem 0.75rem 0.5rem 0.5rem;
  }

  .player-edge {
    display: none;
  }

  .player-bar .player-seek {
    display: flex;
  }

  .player-btn--desktop {
    display: grid;
  }
}

@media (min-width: 1024px) {
  .player-volume {
    display: flex;
    align-items: center;
    gap: 0.125rem;
    margin-inline: 0.25rem;
  }
}

.player-dock-enter-active,
.player-dock-leave-active {
  transition: transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.3s ease;
}

.player-dock-enter-from,
.player-dock-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.player-pop-enter-active,
.player-pop-leave-active {
  transition: transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.2s ease;
  transform-origin: bottom right;
}

.player-pop-enter-from,
.player-pop-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
</style>
