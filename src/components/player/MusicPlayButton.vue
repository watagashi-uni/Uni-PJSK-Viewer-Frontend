<script setup lang="ts">
import { computed, ref } from 'vue'
import { Loader2, Pause, Play } from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'

// Play button laid over a jacket in song lists: starts the song in the site-wide
// player (in the rendition preferred in settings) and turns into pause while it plays.
const props = defineProps<{ musicId: number; title?: string }>()

const player = usePlayerStore()
const resolving = ref(false)
const active = computed(() => player.isCurrent(props.musicId))
const playing = computed(() => active.value && player.isPlaying)
const busy = computed(() => resolving.value || (playing.value && player.isBuffering))

async function onClick() {
  if (active.value) {
    player.toggle()
    return
  }
  resolving.value = true
  try {
    const track = await player.trackOf(props.musicId)
    if (track) player.playNow(track)
  } catch (error) {
    console.error('无法播放歌曲:', error)
  } finally {
    resolving.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="music-play"
    :class="{ active }"
    :aria-label="playing ? `暂停${title ? `「${title}」` : ''}` : `播放${title ? `「${title}」` : ''}`"
    :title="playing ? '暂停' : '播放'"
    @click.prevent.stop="onClick"
  >
    <Loader2 v-if="busy" class="h-[45%] w-[45%] animate-spin" />
    <Pause v-else-if="playing" class="h-[45%] w-[45%]" fill="currentColor" />
    <Play v-else class="ml-[6%] h-[45%] w-[45%]" fill="currentColor" />
  </button>
</template>

<style scoped>
.music-play {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.92);
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.28);
  color: #16181d;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.2s ease, background-color 0.2s;
}

.music-play:hover {
  transform: scale(1.08);
}

.music-play:active {
  transform: scale(0.94);
}

.music-play.active {
  background: var(--color-primary);
  color: var(--color-primary-content);
}
</style>
