import { computed, ref, shallowRef, watch } from 'vue'
import { loadSongLyrics, lyricsForVocal, type LyricsPayload } from '@/api/lyrics'
import { loadConnectLiveLyrics } from '@/api/connectLive'
import type { PlayerTrackInfo } from '@/utils/playerTracks'

/** Which lyrics resource a track reads: the song's, or the one timed for a Connect Live recording. */
export function lyricsKey(track: PlayerTrackInfo | null | undefined): string | undefined {
  if (!track) return undefined
  if (track.connectLive) return `live:${track.connectLive.bundle}:${track.connectLive.lyrics ?? ''}`
  return `song:${track.musicId}`
}

/**
 * The lyrics of a song rendition, timed for the audio being heard, as the karaoke views use them.
 * Every rendition, live recordings and those of another length included, starts on the same
 * beat, so all of them follow the one timeline; only the singers differ.
 */
export function useVocalLyrics(track: () => PlayerTrackInfo | null | undefined) {
  const resource = shallowRef<LyricsPayload | null>(null)
  const loadedFor = ref<string | null>(null)
  const state = ref<'idle' | 'loading' | 'ready' | 'failed'>('idle')
  let request = 0

  async function load(key: string, current: PlayerTrackInfo) {
    const serial = ++request
    loadedFor.value = key
    resource.value = null
    state.value = 'loading'
    try {
      const live = current.connectLive
      const data = live ? await loadConnectLiveLyrics(live.bundle, live.lyrics) : await loadSongLyrics(current.musicId)
      if (serial !== request) return
      resource.value = data
      state.value = 'ready'
    } catch {
      if (serial === request) state.value = 'failed'
    }
  }

  watch(() => lyricsKey(track()), (key) => {
    const current = track()
    if (key !== undefined && current && (key !== loadedFor.value || state.value === 'failed')) void load(key, current)
  }, { immediate: true })

  const selection = computed(() => {
    const data = resource.value
    const current = track()
    if (!data || !current || loadedFor.value !== lyricsKey(current)) return null
    if (!current.connectLive && data.musicId !== current.musicId) return null
    return lyricsForVocal(data, { vocalId: current.connectLive ? undefined : current.vocalId, assetbundle: current.vocalAssetbundle })
  })
  const lyrics = computed(() => (selection.value?.lyrics.lines.length ? selection.value.lyrics : null))
  const instrumental = computed(() => track()?.vocalType === 'instrumental')
  /** Lyrics that can follow this audio line by line; null when there are none to follow. */
  const timedLyrics = computed(() => (!instrumental.value ? lyrics.value : null))
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
    return ''
  })

  return { lyrics, timedLyrics, hasTranslation, hasRomaji, hasRuby, showPerformers, note, state }
}
