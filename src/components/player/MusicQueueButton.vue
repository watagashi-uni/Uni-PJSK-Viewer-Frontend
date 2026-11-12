<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { Check, ListPlus, Loader2 } from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'

// Adds a song (in the rendition preferred in settings) to the end of the play queue
// without interrupting what is playing. overlay: round button on a jacket; inline: small text-row button.
const props = withDefaults(defineProps<{
  musicId: number
  /** A specific rendition; the one preferred in settings when omitted. */
  vocalId?: number
  title?: string
  variant?: 'overlay' | 'inline'
}>(), { vocalId: undefined, title: '', variant: 'overlay' })

const player = usePlayerStore()
const state = ref<'idle' | 'busy' | 'done'>('idle')
let timer: ReturnType<typeof setTimeout> | undefined

async function onClick() {
  if (state.value === 'busy') return
  state.value = 'busy'
  try {
    const track = await player.trackOf(props.musicId, props.vocalId)
    if (track) player.enqueue([track])
    state.value = track ? 'done' : 'idle'
  } catch (error) {
    console.error('无法加入播放队列:', error)
    state.value = 'idle'
  }
  clearTimeout(timer)
  timer = setTimeout(() => { state.value = 'idle' }, 1400)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <button
    type="button"
    class="music-queue"
    :class="[`music-queue--${variant}`, { done: state === 'done' }]"
    :aria-label="state === 'done' ? '已加入播放队列' : `把${title ? `「${title}」` : '歌曲'}加入播放队列`"
    :title="state === 'done' ? '已加入播放队列' : '加入播放队列'"
    @click.prevent.stop="onClick"
  >
    <Loader2 v-if="state === 'busy'" class="h-[50%] w-[50%] animate-spin" />
    <Check v-else-if="state === 'done'" class="h-[50%] w-[50%]" />
    <ListPlus v-else class="h-[50%] w-[50%]" />
  </button>
</template>

<style scoped>
.music-queue {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.2s ease, background-color 0.2s, color 0.2s;
}

.music-queue:active {
  transform: scale(0.92);
}

.music-queue--overlay {
  width: 2rem;
  height: 2rem;
  background: rgb(22 24 29 / 0.62);
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.28);
  color: #fff;
  backdrop-filter: blur(8px);
}

.music-queue--overlay:hover {
  background: rgb(22 24 29 / 0.82);
}

.music-queue--inline {
  width: 1.5rem;
  height: 1.5rem;
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
}

.music-queue--inline:hover {
  background: color-mix(in srgb, var(--color-base-content) 10%, transparent);
  color: var(--color-base-content);
}

.music-queue.done {
  background: var(--color-success);
  color: var(--color-success-content);
}
</style>
