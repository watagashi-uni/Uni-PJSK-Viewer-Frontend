<script setup lang="ts">
import { computed } from 'vue'

export interface SingerAvatar {
  key: string
  name: string
  /** Character portrait; guests without one get their initial instead. */
  src: string | null
  color?: string
}

const props = withDefaults(defineProps<{
  singers: SingerAvatar[]
  /** Diameter in px. */
  size?: number
  max?: number
  /** Keys of the singers heard right now: they light up, the rest step back. Null leaves everyone equal. */
  activeKeys?: string[] | null
}>(), { size: 24, max: 6, activeKeys: null })

const shown = computed(() => props.singers.slice(0, props.singers.length > props.max ? props.max - 1 : props.max))
const rest = computed(() => props.singers.length - shown.value.length)
const names = computed(() => props.singers.map(s => s.name).filter(Boolean).join('・'))

function initial(name: string): string {
  return ([...name.trim()][0] || '♪').toUpperCase()
}

/** Guests have no official colour: derive a stable one from the name. */
function fallbackColor(name: string): string {
  let hash = 0
  for (const char of name) hash = (hash * 31 + (char.codePointAt(0) || 0)) % 360
  return `hsl(${hash} 55% 52%)`
}

function state(singer: SingerAvatar): string | undefined {
  if (!props.activeKeys) return undefined
  return props.activeKeys.includes(singer.key) ? 'lit' : 'dim'
}
</script>

<template>
  <span
    v-if="singers.length"
    class="singer-avatars"
    :style="{ '--avatar-size': `${size}px` }"
    role="img"
    :aria-label="names"
    :title="names"
  >
    <span
      v-for="singer in shown"
      :key="singer.key"
      class="singer-avatar"
      :class="state(singer)"
      :style="{ '--avatar-color': singer.color || fallbackColor(singer.name) }"
    >
      <img v-if="singer.src" :src="singer.src" alt="" draggable="false" loading="lazy" />
      <span v-else class="singer-initial">{{ initial(singer.name) }}</span>
    </span>
    <span v-if="rest > 0" class="singer-avatar singer-more">+{{ rest }}</span>
  </span>
</template>

<style scoped>
.singer-avatars {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  flex-shrink: 0;
}

.singer-avatar {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--avatar-size);
  height: var(--avatar-size);
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 999px;
  background: var(--avatar-color, #8b92a5);
  box-shadow: 0 0 0 1.5px var(--avatar-color, #8b92a5), 0 0 0 3px var(--avatar-gap, transparent);
  transition: transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.35s ease, filter 0.35s ease, box-shadow 0.35s ease;
}

.singer-avatar + .singer-avatar {
  margin-left: calc(var(--avatar-size) * -0.26);
}

.singer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* The portraits carry their own white rim: crop into it so the colour ring sits on the face. */
  transform: scale(1.12);
  user-select: none;
}

.singer-initial {
  color: #fff;
  font-size: calc(var(--avatar-size) * 0.46);
  font-weight: 700;
  line-height: 1;
}

.singer-more {
  background: color-mix(in srgb, currentColor 22%, transparent);
  box-shadow: none;
  font-size: calc(var(--avatar-size) * 0.38);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.singer-avatar.lit {
  z-index: 1;
  transform: scale(1.14);
  box-shadow: 0 0 0 2px var(--avatar-color, #8b92a5), 0 0 14px 1px color-mix(in srgb, var(--avatar-color, #8b92a5) 75%, transparent);
}

.singer-avatar.dim {
  opacity: 0.45;
  filter: saturate(0.55);
  transform: scale(0.94);
}
</style>
