// Connect Live setlists and recordings. The lives themselves come from the virtualLives master
// (virtualLiveType "streaming"); which songs were performed, by whom and in what order is in
// the game's stage data, which is published as a small index next to the recordings.
import { timeoutSignal } from '../utils/abortSignal'
import type { LyricsPayload } from './lyrics'
import { characterColor, type PlayerSinger, type PlayerTrackInfo, type TrackSources } from '../utils/playerTracks'

/** Recordings, their lyrics and the index are only published on the overseas host. */
export const CONNECT_LIVE_HOST = 'https://assets.unipjsk.com'
const BASE = `${CONNECT_LIVE_HOST}/connect-live`

/** A game character by id, or anyone else (guest idols, a unit as a whole) by name. */
export type ConnectLiveSinger = number | string

export interface ConnectLivePart {
  title: string
  musicId: number | null
  singers?: ConnectLiveSinger[]
}

export interface ConnectLiveTrack {
  bundle: string
  title: string
  /** The song, when it is in the game; null for medleys (see parts) and guest songs. */
  musicId: number | null
  /** Songs of a medley, in the order they are sung. */
  parts?: ConnectLivePart[]
  singers: ConnectLiveSinger[]
  duration?: number
  /** Content hash of the lyrics timed for this recording. */
  lyrics?: string
  /** Why a recording sits apart from the setlist (extras only). */
  note?: string
}

export interface ConnectLiveShow {
  /** 第1公演, 第2公演…; empty when every show had the same setlist. */
  label: string
  tracks: ConnectLiveTrack[]
}

export interface ConnectLiveEntry {
  shows: ConnectLiveShow[]
  /** Recordings in the game data that no show used. */
  extras?: ConnectLiveTrack[]
}

export interface ConnectLiveIndex {
  v: number
  lives: Record<string, ConnectLiveEntry>
}

let indexRequest: Promise<ConnectLiveIndex> | null = null
const INDEX_BUCKET_MS = 5 * 60_000

export function loadConnectLiveIndex(): Promise<ConnectLiveIndex> {
  // The host keeps JSON for a long time whatever the object says; a five-minute bucket in the
  // query (part of the cache key) lets a republished index reach readers within minutes.
  indexRequest ??= fetch(`${BASE}/index.json?t=${Math.floor(Date.now() / INDEX_BUCKET_MS)}`, { credentials: 'omit', signal: timeoutSignal(15000) })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Connect Live: ${response.status}`)
      const data = await response.json() as ConnectLiveIndex
      if (!data || data.v !== 1 || typeof data.lives !== 'object') throw new Error('Invalid Connect Live index')
      return data
    })
    .catch((error) => {
      indexRequest = null
      throw error
    })
  return indexRequest
}

const lyricRequests = new Map<string, Promise<LyricsPayload>>()

/** The lyrics hash the current index gives a recording; undefined when the index has none for it. */
async function currentLyricsHash(bundle: string): Promise<string | undefined> {
  const index = await loadConnectLiveIndex()
  for (const entry of Object.values(index.lives)) {
    for (const track of [...entry.shows.flatMap(show => show.tracks), ...(entry.extras || [])]) {
      if (track.bundle === bundle) return track.lyrics
    }
  }
  return undefined
}

/**
 * Lyrics timed for one recording. A track restored from the saved queue carries the hash it was
 * queued with, so the current index decides which version to load; the saved hash is the fallback
 * when the index cannot be read. Resolves null when the recording has no lyrics.
 */
export async function loadConnectLiveLyrics(bundle: string, savedHash?: string): Promise<LyricsPayload | null> {
  let hash = savedHash
  try {
    const listed = await currentLyricsHash(bundle)
    hash = listed
  } catch {
    // Index unreachable: keep the saved reference.
  }
  return hash ? loadLyricsFile(bundle, hash) : null
}

/** One version of a recording's lyrics: an immutable, content-hashed resource. */
function loadLyricsFile(bundle: string, hash: string): Promise<LyricsPayload> {
  if (!/^[\w-]+$/.test(bundle) || !/^[a-f0-9]{16}$/.test(hash)) return Promise.reject(new Error('Invalid lyrics reference'))
  const key = `${bundle}.${hash}`
  let request = lyricRequests.get(key)
  if (!request) {
    request = fetch(`${BASE}/lyrics/${key}.json`, { credentials: 'omit', signal: timeoutSignal(15000) }).then(async (response) => {
      if (!response.ok) throw new Error(`Lyrics: ${response.status}`)
      const data = await response.json() as LyricsPayload
      if (!Number.isFinite(data.duration) || data.assetbundle !== bundle) throw new Error('Invalid lyrics')
      return data
    })
    lyricRequests.set(key, request)
    void request.catch(() => lyricRequests.delete(key))
  }
  return request
}

export function bannerPath(assetbundleName: string): string {
  return `/ondemand/virtual_live/select/banner/${assetbundleName}/${assetbundleName}.png`
}

/** The song whose jacket stands for a recording: the song itself, or a medley's first song. */
export function coverMusicId(track: ConnectLiveTrack): number | null {
  return track.musicId ?? track.parts?.find(p => p.musicId)?.musicId ?? null
}

export function playerSingers(singers: ConnectLiveSinger[], sources: Pick<TrackSources, 'characters' | 'characterUnits'>): PlayerSinger[] {
  return singers.map((singer): PlayerSinger => {
    if (typeof singer === 'number') {
      const row = sources.characters.find(c => c.id === singer)
      return { type: 'game', id: singer, firstName: row?.firstName, givenName: row?.givenName, color: characterColor(sources.characterUnits, singer) }
    }
    return { type: 'outside', id: 0, name: singer }
  })
}

export interface LiveInfo { id: number; name: string; assetbundleName: string }

export interface LiveTiming {
  startAt: number
  virtualLiveSchedules?: { startAt: number; isAfterEvent?: boolean }[]
}

/**
 * When each show of a live begins, in order. The virtual live opens days before its first show,
 * so the setlist counts as unreleased until the show itself starts; after-event talks are not shows.
 */
export function showStarts(live: LiveTiming): number[] {
  const starts = (live.virtualLiveSchedules || []).filter(s => !s.isAfterEvent).map(s => s.startAt).sort((a, b) => a - b)
  return starts.length ? starts : [live.startAt]
}

/** When a live's first show begins: before that its setlist and recordings are a spoiler. */
export function liveOpensAt(live: LiveTiming): number {
  return showStarts(live)[0]!
}

/** A performance as a track the site-wide player can queue. */
export function connectLiveTrack(track: ConnectLiveTrack, live: LiveInfo, showLabel: string, sources: TrackSources): PlayerTrackInfo {
  const musicId = coverMusicId(track)
  const music = musicId ? sources.musics.find(m => m.id === musicId) : undefined
  const liveName = live.name.replace(/^コネクトライブ\s*/, '')
  return {
    musicId: track.musicId ?? 0,
    vocalId: 0,
    title: track.title,
    composer: track.musicId ? music?.composer ?? '' : '',
    caption: ['Connect Live', liveName, showLabel].filter(Boolean).join(' · '),
    vocalType: 'connect_live',
    musicAssetbundle: music?.assetbundleName ?? '',
    vocalAssetbundle: track.bundle,
    trimStart: 0,
    singers: playerSingers(track.singers, sources),
    connectLive: {
      bundle: track.bundle,
      liveId: live.id,
      ...(track.lyrics ? { lyrics: track.lyrics } : {}),
      ...(music ? {} : { cover: bannerPath(live.assetbundleName) }),
    },
  }
}
