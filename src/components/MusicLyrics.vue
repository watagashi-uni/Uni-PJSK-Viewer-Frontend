<script setup lang="ts">
import { ref, shallowRef, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { loadSongLyrics, lyricParts, wordProgress, type LyricLine, type SongLyrics } from '@/api/lyrics'

const props = defineProps<{ musicId: number; vocalId?: number; assetbundle?: string; vocalType?: string; currentTime: number; duration: number; audio?: HTMLAudioElement | null; playing: boolean }>()
const emit = defineEmits<{ seek: [time: number] }>()
const clock = ref(props.currentTime)
let frame = 0
function sampleClock() {
  clock.value = props.audio?.currentTime ?? props.currentTime
  frame = requestAnimationFrame(sampleClock)
}
const playbackTime = computed(() => props.playing && expanded.value ? clock.value : props.currentTime)
const lyrics = shallowRef<SongLyrics | null>(null)
const loading = ref(false)
const failed = ref(false)
const expanded = ref(true)
const translated = ref(true)
watch(() => playbackTime.value, time => { clock.value = time })
watch([() => props.playing, () => props.audio, expanded], () => {
  cancelAnimationFrame(frame)
  clock.value = props.audio?.currentTime ?? props.currentTime
  if (props.playing && expanded.value) frame = requestAnimationFrame(sampleClock)
}, { immediate: true })
const displayLines = computed(() => (lyrics.value?.lines || []).map(line => ({ ...line, parts: lyricParts(line) })))
const following = ref(true)
const viewport = ref<HTMLElement>()
let request = 0
let resumeTimer: ReturnType<typeof setTimeout> | undefined
async function load() {
  const serial = ++request
  lyrics.value = null
  loading.value = true
  failed.value = false
  following.value = true
  try {
    const data = await loadSongLyrics(props.musicId)
    if (serial === request) lyrics.value = data
  } catch { if (serial === request) failed.value = true }
  finally { if (serial === request) loading.value = false }
}
watch(() => props.musicId, load, { immediate: true })
// Singer assignments belong to the annotated rendition, not to every cover.
const showPerformers = computed(() => !!lyrics.value && props.vocalId === lyrics.value.vocalId)
const compatible = computed(() => lyrics.value && props.duration > 0 && Math.abs(props.duration - lyrics.value.duration) < 2 && props.vocalType !== 'streaming_live')
const activeIndex = computed(() => {
  const lines = lyrics.value?.lines || []
  let index = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.start > playbackTime.value) break
    index = i
  }
  return index
})
function isActive(line: LyricLine) { return playbackTime.value >= line.start && playbackTime.value < line.end }
function singers(line: LyricLine) {
  if (!showPerformers.value) return ''
  const ids = new Set([...(line.performerIds || []), ...(line.segments || []).flatMap(s => s.performerIds)])
  return (lyrics.value?.performers || []).filter(p => ids.has(p.performerId)).map(p => p.name).join(' · ')
}
function segmentTitle(ids: string[]) {
  return showPerformers.value ? (lyrics.value?.performers || []).filter(p => ids.includes(p.performerId)).map(p => p.name).join(' · ') : ''
}
async function center() {
  await nextTick()
  if (!following.value || !expanded.value) return
  const box = viewport.value
  const line = box?.querySelector<HTMLElement>(`[data-line="${Math.max(0, activeIndex.value)}"]`)
  if (box && line) box.scrollTo({ top: line.offsetTop - box.clientHeight / 2 + line.offsetHeight / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}
watch([activeIndex, expanded, following, compatible, translated], center)
function browse() {
  following.value = false
  clearTimeout(resumeTimer)
  resumeTimer = setTimeout(() => { following.value = true }, 6000)
}
function seek(time: number) { following.value = true; emit('seek', time); void center() }
onBeforeUnmount(() => { request++; cancelAnimationFrame(frame); clearTimeout(resumeTimer) })
</script>

<template>
  <section class="lyrics-panel mt-5" aria-label="同步歌词">
    <div class="flex items-center justify-between gap-2 px-4 py-3">
      <button class="btn btn-ghost btn-sm" :aria-expanded="expanded" @click="expanded = !expanded">歌词 <span aria-hidden="true">{{ expanded ? '⌃' : '⌄' }}</span></button>
      <div v-if="lyrics && expanded" class="flex items-center gap-2">
        <button v-if="!following" class="btn btn-ghost btn-xs" @click="following = true">回到当前句</button>
        <button class="btn btn-ghost btn-xs" :aria-pressed="translated" @click="translated = !translated">{{ translated ? '隐藏译文' : '显示译文' }}</button>
      </div>
    </div>
    <template v-if="expanded">
      <p v-if="loading" class="lyrics-status" role="status">正在加载歌词…</p>
      <p v-else-if="failed" class="lyrics-status">歌词加载失败 <button class="btn btn-ghost btn-xs" @click="load">重试</button></p>
      <p v-else-if="!lyrics?.lines.length" class="lyrics-status">暂无歌词</p>
      <p v-else-if="!duration" class="lyrics-status">等待音频加载…</p>
      <p v-else-if="!compatible" class="lyrics-status">当前音频版本暂无匹配的歌词</p>
      <template v-else>
        <div ref="viewport" class="lyrics-scroll" tabindex="0" aria-label="歌词，点击任意句跳转播放" @wheel.passive="browse" @touchstart.passive="browse" @keydown="browse">
          <div class="lyrics-lines">
            <button v-for="(line, index) in displayLines" :key="index" :data-line="index" class="lyric-line" :class="{ active: isActive(line), nearby: Math.abs(index - activeIndex) <= 1 }" :aria-current="isActive(line) ? 'true' : undefined" @click="seek(line.start)">
              <span v-if="singers(line)" class="lyric-singers">{{ singers(line) }}</span>
              <span class="lyric-original"><template v-if="line.words?.length"><span v-for="(part, n) in line.parts" :key="n" :title="segmentTitle(part.performerIds)" :class="{ 'lyric-word': part.word && isActive(line) }" :style="part.word && isActive(line) ? { '--word-progress': `${wordProgress(playbackTime, part.word) * 100}%` } : undefined">{{ part.text }}</span></template><template v-else-if="line.segments?.length"><span v-for="(segment, n) in line.segments" :key="n" :title="segmentTitle(segment.performerIds)">{{ segment.text }}</span></template><template v-else>{{ line.text }}</template></span>
              <span v-if="translated && line.translation" class="lyric-translation">{{ line.translation }}</span>
            </button>
          </div>
        </div>
        <details v-if="Object.keys(lyrics.credits || {}).length || lyrics.sources?.length" class="px-5 pb-3 text-xs opacity-60">
          <summary class="cursor-pointer">歌词来源与译者</summary>
          <p v-for="(name, role) in lyrics.credits" :key="role" class="mt-2">{{ role === 'translation' ? '翻译' : role }}：{{ name }}</p>
          <p v-for="source in lyrics.sources" :key="source[0]" class="mt-2"><a :href="source[0]" target="_blank" rel="noopener noreferrer" class="underline">歌词来源</a><template v-if="source[1]"> · <a v-if="source[2]" :href="source[2]" target="_blank" rel="noopener noreferrer" class="underline">{{ source[1] }}</a><span v-else>{{ source[1] }}</span></template></p>
        </details>
      </template>
    </template>
  </section>
</template>

<style scoped>
.lyrics-panel { border-radius: 1rem; overflow: hidden; background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 14%, transparent), color-mix(in srgb, var(--color-secondary) 10%, transparent)); }
.lyrics-status { padding: 3rem 1rem; text-align: center; opacity: .6; font-size: .9rem; }
.lyrics-scroll { height: clamp(280px, 46vh, 450px); overflow-y: auto; position: relative; overscroll-behavior: contain; scrollbar-width: none; mask-image: linear-gradient(transparent, black 12%, black 88%, transparent); }
.lyrics-scroll::-webkit-scrollbar { display: none; }
.lyrics-lines { padding: 130px clamp(1.25rem, 4vw, 3rem) 190px; }
.lyric-line { display: block; width: 100%; text-align: left; padding: 1rem 0; opacity: .25; filter: blur(.6px); transform-origin: left center; transition: opacity .35s, filter .35s, transform .35s; cursor: pointer; }
.lyric-line.nearby { opacity: .45; filter: none; }
.lyric-line.active, .lyric-line:hover, .lyric-line:focus-visible { opacity: 1; filter: none; }
.lyric-line.active { transform: scale(1.025); }
.lyric-original { display: block; font-size: clamp(1.3rem, 3vw, 2rem); font-weight: 800; line-height: 1.5; overflow-wrap: anywhere; white-space: pre-wrap; }
.lyric-word { background: linear-gradient(to right, currentColor 0%, currentColor var(--word-progress), color-mix(in srgb, currentColor 28%, transparent) var(--word-progress), color-mix(in srgb, currentColor 28%, transparent) 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
@media (forced-colors: active) { .lyric-word { background: none; -webkit-text-fill-color: currentColor; } }
.lyric-translation { display: block; margin-top: .5rem; font-size: clamp(.875rem, 1.8vw, 1.05rem); line-height: 1.65; opacity: .75; white-space: pre-wrap; }
.lyric-singers { display: block; margin-bottom: .35rem; font-size: .7rem; font-weight: 600; letter-spacing: .04em; opacity: .65; }
@media (prefers-reduced-motion: reduce) { .lyric-line { transition: none; transform: none; filter: none; } }
</style>
