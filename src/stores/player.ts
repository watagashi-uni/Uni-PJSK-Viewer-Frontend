import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useMasterStore } from '@/stores/master'
import { trackEvent } from '@/utils/analytics'
import {
  append, clearUpcoming as clearUpcomingState, insertNext, moveItem, nextIndex, previousIndex, removeAt,
  shuffleUpcoming as shuffleUpcomingState, type QueueState, type RepeatMode,
} from '@/utils/playerQueue'
import {
  isPlayerTrack, loadTrackSources, trackAudioPath, trackCoverPath, trackFor,
  type PlayerTrack, type PlayerTrackInfo, type TrackSources,
} from '@/utils/playerTracks'

const STORAGE_KEY = 'player_state'
const LYRICS_SIDEBAR_KEY = 'player_lyricsSidebar'
/** The lyrics column only docks beside the page when the window leaves room for both. */
const LYRICS_SIDEBAR_MIN_WIDTH = '(min-width: 1280px)'
/** Rewritten every few seconds while playing, so it is kept apart from the (possibly long) queue. */
const POSITION_KEY = 'player_position'
const REPEAT_MODES: readonly RepeatMode[] = ['off', 'all', 'one']
/** "Previous" restarts the song once it has played this long, like most players. */
const RESTART_THRESHOLD_SEC = 3
const SKIP_SEC = 10

interface StoredState {
  v: 1
  queue: PlayerTrack[]
  index: number
  volume: number
  muted: boolean
  repeat: RepeatMode
}

interface StoredPosition {
  uid: string
  time: number
  duration: number
}

/**
 * Site-wide music player. One <audio> element lives here, outside the component
 * tree, so playback carries on while pages come and go; the bar, the full-screen
 * view and the song page are all just views of this state.
 */
export const usePlayerStore = defineStore('player', () => {
  const settings = useSettingsStore()
  const master = useMasterStore()

  const queue = ref<PlayerTrack[]>([])
  const index = ref(-1)
  const current = computed<PlayerTrack | null>(() => queue.value[index.value] ?? null)
  const upcoming = computed(() => queue.value.slice(index.value + 1))
  const hasNext = computed(() => nextIndex(index.value, queue.value.length, repeat.value, false) !== -1)

  const isPlaying = ref(false)
  const isBuffering = ref(false)
  /** Metadata of the current track is in: duration is known and seeking works. */
  const isLoaded = ref(false)
  const hasError = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const muted = ref(false)
  const repeat = ref<RepeatMode>('off')
  const nowPlayingOpen = ref(false)
  /** What sits beside the artwork in the full-screen view. */
  const nowPlayingPanel = ref<'none' | 'lyrics' | 'queue'>('lyrics')
  /** The reader wants lyrics in a column beside the page while browsing. */
  const lyricsSidebarOpen = ref(false)
  const wideScreen = ref(false)
  const lyricsSidebarShown = computed(() => lyricsSidebarOpen.value && wideScreen.value && !!current.value)

  let audio: HTMLAudioElement | null = null
  /** Queue entry whose audio is in the element; differs from the current one until it is first played. */
  let sourceUid: string | null = null
  /** Position to apply once metadata arrives. */
  let pendingSeek: number | null = null
  /** A new source is starting: the pause that unloading the old one emits is not the user pausing. */
  let switching = false
  let trackedUid: string | null = null
  let uidSeed = 0
  let lastPositionSavedAt = 0

  function audioUrl(track: PlayerTrackInfo): string {
    return `${settings.assetsHost}${trackAudioPath(track)}`
  }

  function coverUrl(track: PlayerTrackInfo): string {
    return `${settings.assetsHost}${trackCoverPath(track)}`
  }

  function element(): HTMLAudioElement {
    if (audio) return audio
    const el = new Audio()
    el.preload = 'metadata'
    el.volume = volume.value
    el.muted = muted.value
    el.addEventListener('play', () => {
      switching = false
      isPlaying.value = true
      const track = current.value
      // Only the first play of each queue entry counts; pausing and resuming is not a new listen.
      if (track && trackedUid !== track.uid) {
        trackedUid = track.uid
        trackEvent('music-play', { vocalType: track.vocalType })
      }
    })
    el.addEventListener('pause', () => {
      if (switching || el.ended) return
      isPlaying.value = false
      savePosition()
    })
    el.addEventListener('playing', () => { isBuffering.value = false })
    el.addEventListener('canplay', () => { isBuffering.value = false })
    el.addEventListener('waiting', () => { if (!el.paused) isBuffering.value = true })
    el.addEventListener('timeupdate', () => {
      if (!isLoaded.value || pendingSeek !== null) return
      currentTime.value = el.currentTime
      if (Date.now() - lastPositionSavedAt > 5000) savePosition()
    })
    el.addEventListener('durationchange', () => {
      if (Number.isFinite(el.duration) && el.duration > 0) duration.value = el.duration
    })
    el.addEventListener('loadedmetadata', () => {
      duration.value = Number.isFinite(el.duration) ? el.duration : 0
      isLoaded.value = true
      hasError.value = false
      if (pendingSeek !== null) {
        const target = Math.min(pendingSeek, Math.max(0, duration.value - 0.25))
        if (Math.abs(el.currentTime - target) > 0.25) el.currentTime = target
        currentTime.value = target
        pendingSeek = null
      }
      updatePositionState()
    })
    el.addEventListener('ended', onEnded)
    el.addEventListener('error', () => {
      // Clearing the source also raises an error event; only a failed track counts.
      if (!el.getAttribute('src')) return
      switching = false
      hasError.value = true
      isPlaying.value = false
      isBuffering.value = false
    })
    audio = el
    bindMediaSession()
    return el
  }

  function startPlayback() {
    const el = element()
    isPlaying.value = true
    const attempt = el.play()
    attempt?.catch((error: unknown) => {
      // A newer load() interrupting this play() is expected while skipping through the queue.
      if ((error as { name?: string } | null)?.name === 'AbortError') return
      switching = false
      isPlaying.value = false
      isBuffering.value = false
    })
  }

  /** Point the element at the current track. `seekTo` keeps a position (rendition switch, restored session). */
  function loadCurrent(autoplay: boolean, seekTo?: number) {
    const track = current.value
    if (!track) {
      unload()
      return
    }
    const el = element()
    const start = seekTo ?? track.trimStart
    sourceUid = track.uid
    pendingSeek = start > 0 ? start : null
    isLoaded.value = false
    hasError.value = false
    duration.value = 0
    currentTime.value = start
    isBuffering.value = autoplay
    switching = autoplay
    el.src = audioUrl(track)
    el.load()
    updateMediaMetadata()
    if (autoplay) startPlayback()
    else isPlaying.value = false
    savePosition()
  }

  function unload() {
    switching = false
    sourceUid = null
    pendingSeek = null
    isPlaying.value = false
    isBuffering.value = false
    isLoaded.value = false
    hasError.value = false
    currentTime.value = 0
    duration.value = 0
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
    updateMediaMetadata()
  }

  function onEnded() {
    const track = current.value
    const next = nextIndex(index.value, queue.value.length, repeat.value, true)
    if (!track || next === -1) {
      isPlaying.value = false
      savePosition()
      return
    }
    if (next === index.value) {
      restart()
      return
    }
    index.value = next
    loadCurrent(true)
  }

  function restart() {
    const track = current.value
    if (!track) return
    if (sourceUid !== track.uid || hasError.value) {
      loadCurrent(true)
      return
    }
    seek(track.trimStart)
    startPlayback()
  }

  // ----- transport -----

  function play() {
    const track = current.value
    if (!track) return
    if (sourceUid !== track.uid) {
      // First play of a restored or freshly queued track: pick up where the saved position left off.
      loadCurrent(true, currentTime.value > track.trimStart ? currentTime.value : undefined)
      return
    }
    if (hasError.value) {
      loadCurrent(true, currentTime.value)
      return
    }
    if (audio?.ended) seek(track.trimStart)
    startPlayback()
  }

  function pause() {
    switching = false
    if (audio && !audio.paused) audio.pause()
    else isPlaying.value = false
  }

  function toggle() {
    if (isPlaying.value) pause()
    else play()
  }

  function seek(time: number) {
    const track = current.value
    if (!track || !Number.isFinite(time)) return
    const limit = duration.value > 0 ? duration.value : Number.POSITIVE_INFINITY
    const target = Math.max(0, Math.min(limit, time))
    currentTime.value = target
    if (audio && sourceUid === track.uid && isLoaded.value) audio.currentTime = target
    else if (sourceUid === track.uid) pendingSeek = target
    updatePositionState()
  }

  function skip(seconds: number) {
    seek(sampleTime() + seconds)
  }

  function next() {
    const target = nextIndex(index.value, queue.value.length, repeat.value, false)
    if (target === -1) return
    if (target === index.value) {
      restart()
      return
    }
    index.value = target
    loadCurrent(true)
  }

  function previous() {
    const track = current.value
    if (!track) return
    const target = previousIndex(index.value, queue.value.length, repeat.value)
    if (sampleTime() - track.trimStart > RESTART_THRESHOLD_SEC || target === index.value) {
      if (sourceUid === track.uid && !hasError.value) seek(track.trimStart)
      else currentTime.value = track.trimStart
      return
    }
    index.value = target
    loadCurrent(true)
  }

  /** Live position straight from the element, for animation frames between timeupdate events. */
  function sampleTime(): number {
    return audio && isLoaded.value && pendingSeek === null && sourceUid === current.value?.uid ? audio.currentTime : currentTime.value
  }

  function setVolume(value: number) {
    volume.value = Math.max(0, Math.min(1, value))
    if (volume.value > 0) muted.value = false
    if (audio) {
      audio.volume = volume.value
      audio.muted = muted.value
    }
  }

  function toggleMute() {
    muted.value = !muted.value
    if (audio) audio.muted = muted.value
  }

  function cycleRepeat() {
    repeat.value = REPEAT_MODES[(REPEAT_MODES.indexOf(repeat.value) + 1) % REPEAT_MODES.length] ?? 'off'
  }

  // ----- queue -----

  function entry(info: PlayerTrackInfo): PlayerTrack {
    uidSeed += 1
    return { ...info, uid: `${Date.now().toString(36)}-${uidSeed.toString(36)}` }
  }

  function state(): QueueState<PlayerTrack> {
    return { queue: queue.value, index: index.value }
  }

  function apply(next: QueueState<PlayerTrack>) {
    queue.value = next.queue
    index.value = next.index
  }

  function sameRendition(a: PlayerTrackInfo, b: PlayerTrackInfo): boolean {
    return a.musicId === b.musicId && a.vocalId === b.vocalId
  }

  function isCurrent(musicId: number, vocalId?: number): boolean {
    const track = current.value
    return !!track && track.musicId === musicId && (vocalId === undefined || track.vocalId === vocalId)
  }

  /** Replace the whole queue and start at the given position. */
  function playTracks(infos: PlayerTrackInfo[], startAt = 0) {
    if (!infos.length) return
    queue.value = infos.map(entry)
    index.value = Math.max(0, Math.min(infos.length - 1, startAt))
    loadCurrent(true)
  }

  /** Play this rendition now; what was queued stays queued behind it. */
  function playNow(info: PlayerTrackInfo) {
    const existing = queue.value.findIndex(track => sameRendition(track, info))
    if (existing !== -1) {
      jumpTo(existing)
      return
    }
    const wasEmpty = index.value < 0
    apply(insertNext(state(), [entry(info)]))
    if (!wasEmpty) index.value += 1
    loadCurrent(true)
  }

  function playNext(infos: PlayerTrackInfo[]) {
    if (!infos.length) return
    apply(insertNext(state(), infos.map(entry)))
  }

  function enqueue(infos: PlayerTrackInfo[]) {
    if (!infos.length) return
    apply(append(state(), infos.map(entry)))
  }

  function jumpTo(position: number) {
    if (position < 0 || position >= queue.value.length) return
    if (position === index.value) {
      play()
      return
    }
    index.value = position
    loadCurrent(true)
  }

  /** Swap the current entry for another rendition of the same song without losing the position. */
  function switchRendition(info: PlayerTrackInfo) {
    const track = current.value
    if (!track) {
      playNow(info)
      return
    }
    if (sameRendition(track, info)) return
    const position = sampleTime()
    const wasPlaying = isPlaying.value
    queue.value = queue.value.map((item, i) => (i === index.value ? entry(info) : item))
    loadCurrent(wasPlaying, position)
  }

  function remove(position: number) {
    if (position < 0 || position >= queue.value.length) return
    const removingCurrent = position === index.value
    const wasPlaying = isPlaying.value
    apply(removeAt(state(), position))
    if (!removingCurrent) return
    if (!queue.value.length) close()
    else loadCurrent(wasPlaying)
  }

  function move(from: number, to: number) {
    apply(moveItem(state(), from, to))
  }

  function clearUpcoming() {
    apply(clearUpcomingState(state()))
  }

  function shuffleUpcoming() {
    apply(shuffleUpcomingState(state()))
  }

  /** Lyrics beside the page on a wide window; on a narrow one there is only room for the full-screen view. */
  function toggleLyrics() {
    if (!current.value) return
    if (wideScreen.value) lyricsSidebarOpen.value = !lyricsSidebarOpen.value
    else openNowPlaying('lyrics')
  }

  function openNowPlaying(panel?: 'none' | 'lyrics' | 'queue') {
    if (!current.value) return
    if (panel) nowPlayingPanel.value = panel
    nowPlayingOpen.value = true
  }

  /** Stop and dismiss the player. */
  function close() {
    queue.value = []
    index.value = -1
    nowPlayingOpen.value = false
    unload()
  }

  // ----- building tracks from master data -----

  let sourcesPromise: Promise<TrackSources> | null = null
  function trackSources(): Promise<TrackSources> {
    sourcesPromise ??= loadTrackSources(name => master.getMaster(name)).catch((error) => {
      sourcesPromise = null
      throw error
    })
    return sourcesPromise
  }
  watch(() => master.cacheRevision, () => { sourcesPromise = null })

  /** Track for a song, in the requested rendition or the one preferred in settings. */
  async function trackOf(musicId: number, vocalId?: number): Promise<PlayerTrackInfo | null> {
    return trackFor(await trackSources(), musicId, settings.defaultVocal, vocalId)
  }

  async function tracksOf(musicIds: number[]): Promise<PlayerTrackInfo[]> {
    const sources = await trackSources()
    return musicIds.map(id => trackFor(sources, id, settings.defaultVocal)).filter((track): track is PlayerTrackInfo => track !== null)
  }

  // ----- lock screen / media keys -----

  function singerText(track: PlayerTrackInfo): string {
    return track.singers.map(s => (s.type === 'game' ? `${s.firstName || ''}${s.givenName || ''}` : s.name || '')).filter(Boolean).join('・')
  }

  function updateMediaMetadata() {
    if (!('mediaSession' in navigator) || typeof window.MediaMetadata !== 'function') return
    const track = current.value
    navigator.mediaSession.metadata = track
      ? new window.MediaMetadata({
          title: track.title,
          artist: singerText(track) || track.composer,
          album: track.caption,
          artwork: [{ src: coverUrl(track), sizes: '512x512', type: 'image/png' }],
        })
      : null
  }

  function updatePositionState() {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return
    if (!(duration.value > 0)) return
    try {
      navigator.mediaSession.setPositionState({ duration: duration.value, position: Math.min(duration.value, Math.max(0, currentTime.value)), playbackRate: 1 })
    } catch {
      // Some browsers reject a position that momentarily exceeds the duration.
    }
  }

  function bindMediaSession() {
    if (!('mediaSession' in navigator)) return
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => play()],
      ['pause', () => pause()],
      ['previoustrack', () => previous()],
      ['nexttrack', () => next()],
      ['seekbackward', details => skip(-(details.seekOffset || SKIP_SEC))],
      ['seekforward', details => skip(details.seekOffset || SKIP_SEC)],
      ['seekto', (details) => { if (typeof details.seekTime === 'number') seek(details.seekTime) }],
    ]
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // Unsupported action on this browser.
      }
    }
  }

  // ----- persistence -----

  function persist() {
    try {
      if (!queue.value.length) {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(POSITION_KEY)
        return
      }
      const stored: StoredState = { v: 1, queue: queue.value, index: index.value, volume: volume.value, muted: muted.value, repeat: repeat.value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // Storage unavailable or full: the queue simply does not survive a reload.
    }
  }

  function savePosition() {
    lastPositionSavedAt = Date.now()
    const track = current.value
    if (!track) return
    try {
      const stored: StoredPosition = { uid: track.uid, time: currentTime.value, duration: duration.value }
      localStorage.setItem(POSITION_KEY, JSON.stringify(stored))
    } catch {
      // Same as above: resuming just starts the song over.
    }
  }

  /** Bring back the queue of the previous visit, paused where it stopped. Nothing is downloaded until played. */
  function initialize() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<StoredState> | null
      lyricsSidebarOpen.value = localStorage.getItem(LYRICS_SIDEBAR_KEY) === '1'
      if (!stored || stored.v !== 1 || !Array.isArray(stored.queue)) return
      const restored = stored.queue.filter(isPlayerTrack)
      if (typeof stored.volume === 'number' && Number.isFinite(stored.volume)) volume.value = Math.max(0, Math.min(1, stored.volume))
      muted.value = stored.muted === true
      if (stored.repeat && REPEAT_MODES.includes(stored.repeat)) repeat.value = stored.repeat
      if (!restored.length) return
      const savedTrack = Number.isInteger(stored.index) ? stored.queue[stored.index as number] : undefined
      const position = savedTrack ? restored.findIndex(track => track.uid === (savedTrack as PlayerTrack).uid) : -1
      queue.value = restored
      index.value = position === -1 ? 0 : position
      const saved = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null') as Partial<StoredPosition> | null
      if (saved && saved.uid === current.value?.uid) {
        const time = Number(saved.time)
        const length = Number(saved.duration)
        duration.value = Number.isFinite(length) && length > 0 ? length : 0
        // A song that had finished starts over rather than resuming at its last second.
        currentTime.value = Number.isFinite(time) && time > 0 && (!duration.value || time < duration.value - 1) ? time : 0
      }
    } catch {
      // Corrupt snapshot: start with an empty player.
    }
  }

  watch([queue, index, volume, muted, repeat], persist)
  watch(lyricsSidebarOpen, (value) => {
    try {
      localStorage.setItem(LYRICS_SIDEBAR_KEY, value ? '1' : '0')
    } catch {
      // Preference simply does not persist.
    }
  })
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', savePosition)
    const wide = window.matchMedia(LYRICS_SIDEBAR_MIN_WIDTH)
    wideScreen.value = wide.matches
    wide.addEventListener('change', (event) => { wideScreen.value = event.matches })
  }

  return {
    queue, index, current, upcoming, hasNext,
    isPlaying, isBuffering, isLoaded, hasError, currentTime, duration, volume, muted, repeat, nowPlayingOpen, nowPlayingPanel,
    lyricsSidebarOpen, lyricsSidebarShown, toggleLyrics,
    audioUrl, coverUrl, isCurrent, sampleTime,
    play, pause, toggle, seek, skip, next, previous, setVolume, toggleMute, cycleRepeat,
    playTracks, playNow, playNext, enqueue, jumpTo, switchRendition, remove, move, clearUpcoming, shuffleUpcoming, close, openNowPlaying,
    trackOf, tracksOf, initialize,
  }
})
