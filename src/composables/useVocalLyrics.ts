import { computed, ref, shallowRef, watch } from 'vue'
import { loadSongLyrics, lyricsForVocal, type LyricsPayload } from '@/api/lyrics'
import { usePlayerStore } from '@/stores/player'
import type { PlayerTrackInfo } from '@/utils/playerTracks'

/**
 * The lyrics of a song rendition, timed for the audio being heard, as the karaoke views use them.
 * `active`: the site player is on this rendition, so its audio length can be checked against them.
 */
export function useVocalLyrics(track: () => PlayerTrackInfo | null | undefined, active: () => boolean) {
  const player = usePlayerStore()
  const resource = shallowRef<LyricsPayload | null>(null)
  const loadedFor = ref<number | null>(null)
  const state = ref<'idle' | 'loading' | 'ready' | 'failed'>('idle')
  let request = 0

  async function load(musicId: number) {
    const serial = ++request
    loadedFor.value = musicId
    resource.value = null
    state.value = 'loading'
    try {
      const data = await loadSongLyrics(musicId)
      if (serial !== request) return
      resource.value = data
      state.value = 'ready'
    } catch {
      if (serial === request) state.value = 'failed'
    }
  }

  watch(() => track()?.musicId, (musicId) => {
    if (musicId !== undefined && (musicId !== loadedFor.value || state.value === 'failed')) void load(musicId)
  }, { immediate: true })

  const selection = computed(() => {
    const data = resource.value
    const current = track()
    if (!data || !current || data.musicId !== current.musicId) return null
    return lyricsForVocal(data, { vocalId: current.vocalId, assetbundle: current.vocalAssetbundle })
  })
  const lyrics = computed(() => (selection.value?.lyrics.lines.length ? selection.value.lyrics : null))
  const instrumental = computed(() => track()?.vocalType === 'instrumental')
  // Live recordings and audio of another length do not share the annotated timing.
  const mismatched = computed(() => !!lyrics.value && (
    track()?.vocalType === 'streaming_live'
    || (active() && player.isLoaded && player.duration > 0 && Math.abs(player.duration - lyrics.value.duration) >= 2)
  ))
  /** Lyrics that can follow this audio line by line; null when there are none to follow. */
  const timedLyrics = computed(() => (!instrumental.value && !mismatched.value ? lyrics.value : null))
  const hasTranslation = computed(() => !!lyrics.value?.lines.some(line => line.translation))
  const hasRomaji = computed(() => !!lyrics.value?.lines.some(line => line.romaji))
  const hasRuby = computed(() => !!lyrics.value?.lines.some(line => line.ruby?.length))
  /** Who sings each line is known for this rendition. */
  const showPerformers = computed(() => !!selection.value?.singers)
  /** Why there is nothing to follow along with, if so. */
  const note = computed(() => {
    if (instrumental.value) return '纯音乐，没有歌词'
    if (state.value === 'loading') return '正在加载歌词…'
    if (state.value === 'failed') return '歌词加载失败'
    if (!lyrics.value) return '这首歌暂无歌词'
    if (mismatched.value) return '暂无该演唱版本时间轴'
    return ''
  })

  return { lyrics, timedLyrics, hasTranslation, hasRomaji, hasRuby, showPerformers, note, state }
}
