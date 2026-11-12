<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Maximize2, X } from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'
import { useSingerAvatars } from '@/composables/useSingerAvatars'
import MusicLyrics from '@/components/MusicLyrics.vue'
import SingerAvatars from '@/components/player/SingerAvatars.vue'
import ZhText from '@/components/ZhText.vue'

// Lyrics in a column beside the page: keep reading along while browsing the rest of the site.
const player = usePlayerStore()
const { trackAvatars } = useSingerAvatars()

const track = computed(() => player.current)
const cover = computed(() => (track.value ? player.coverUrl(track.value) : ''))
const avatars = computed(() => (track.value ? trackAvatars(track.value.singers) : []))

/** Who the lyrics say is singing this very line. */
const singing = ref<string[] | null>(null)
// Light up portraits only when every voice on the line is one of the listed singers.
const litSingers = computed(() => {
  const keys = singing.value
  if (!keys) return null
  const known = new Set(avatars.value.map(s => s.key))
  return keys.every(key => known.has(key)) ? keys : null
})
watch(() => track.value?.uid, () => { singing.value = null })

function seekFromLyrics(time: number) {
  player.seek(time)
  if (!player.isPlaying) player.play()
}
</script>

<template>
  <Transition name="lyrics-side">
    <aside v-if="player.lyricsSidebarShown && track" class="lyrics-side" aria-label="歌词">
      <!-- A soft wash of the artwork behind the text, so the column takes on the colours of the song. -->
      <div class="lyrics-side-glow" aria-hidden="true"><img :src="cover" alt="" crossorigin="anonymous" /></div>

      <header class="lyrics-side-head">
        <button class="lyrics-side-cover" aria-label="全屏显示" title="全屏显示" @click="player.openNowPlaying('lyrics')">
          <img :src="cover" alt="" crossorigin="anonymous" />
        </button>
        <div class="min-w-0 flex-1">
          <p class="lyrics-side-title"><ZhText :text="track.title" table="musics" path="title" layout="inline" /></p>
          <p class="lyrics-side-sub">
            <SingerAvatars :singers="avatars" :size="20" :max="6" :active-keys="litSingers" />
            <span class="truncate"><ZhText :text="track.caption" table="musicVocals" path="caption" layout="inline" /></span>
          </p>
        </div>
        <button class="lyrics-side-btn" aria-label="全屏显示" title="全屏显示" @click="player.openNowPlaying('lyrics')">
          <Maximize2 class="h-4 w-4" />
        </button>
        <button class="lyrics-side-btn" aria-label="关闭歌词" title="关闭歌词" @click="player.lyricsSidebarOpen = false">
          <X class="h-4 w-4" />
        </button>
      </header>

      <div class="lyrics-side-body">
        <!-- Hidden under the full-screen view, which shows the same lyrics: no need to keep them moving twice. -->
        <MusicLyrics
          v-if="!player.nowPlayingOpen"
          variant="sidebar"
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
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.lyrics-side {
  position: fixed;
  z-index: 20;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  width: var(--lyrics-sidebar-width);
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid color-mix(in srgb, var(--color-base-content) 10%, transparent);
  background: var(--color-base-100);
  color: var(--color-base-content);
}

.lyrics-side-glow {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.lyrics-side-glow img {
  position: absolute;
  top: -10%;
  left: 50%;
  width: 150%;
  max-width: none;
  aspect-ratio: 1;
  object-fit: cover;
  opacity: 0.3;
  filter: blur(56px) saturate(1.7);
  transform: translateX(-50%);
}

.lyrics-side-head {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 0.75rem 0.5rem 1rem;
}

.lyrics-side-cover {
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.625rem;
  background: var(--color-base-300);
  box-shadow: 0 2px 10px rgb(0 0 0 / 0.2);
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}

.lyrics-side-cover:hover {
  transform: scale(1.06);
}

.lyrics-side-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lyrics-side-title {
  overflow: hidden;
  font-size: 0.9375rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lyrics-side-sub {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.2rem;
  padding-left: 2px;
  font-size: 0.75rem;
  color: color-mix(in srgb, currentColor 65%, transparent);
}

.lyrics-side-btn {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  color: color-mix(in srgb, currentColor 65%, transparent);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.lyrics-side-btn:hover {
  background: color-mix(in srgb, var(--color-base-content) 10%, transparent);
  color: var(--color-base-content);
}

.lyrics-side-body {
  position: relative;
  min-height: 0;
  flex: 1;
}

.lyrics-side-enter-active,
.lyrics-side-leave-active {
  transition: transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.3s ease;
}

.lyrics-side-enter-from,
.lyrics-side-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
