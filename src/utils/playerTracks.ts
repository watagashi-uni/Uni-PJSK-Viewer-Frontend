// Turns master rows into the self-contained track records the global player queues.
// A track keeps asset bundle names rather than URLs so a later change of asset host
// (or a queue restored on the next visit) still resolves to a working address.

export interface PlayerSinger {
  type: 'game' | 'outside'
  id: number
  /** Japanese name parts (game characters) so the display can follow the translation setting. */
  firstName?: string
  givenName?: string
  /** Outside characters only have a single name. */
  name?: string
  color?: string
}

/** A song as performed at a Connect Live: its own recording (and lyrics timed for it), not a game rendition. */
export interface ConnectLiveRef {
  /** Audio bundle of the performance, e.g. se_010_sp_live_trilogy02_0167_01_full */
  bundle: string
  /** Virtual live it was performed at. */
  liveId: number
  /** Content hash of its lyrics resource, when there is one. */
  lyrics?: string
  /** Artwork path when the song has no jacket (guest songs): the live's banner. */
  cover?: string
}

export interface PlayerTrackInfo {
  /** The song; 0 for a Connect Live performance of a song that is not in the game. */
  musicId: number
  vocalId: number
  title: string
  composer: string
  caption: string
  vocalType: string
  /** Jacket directory, e.g. jacket_s_050 */
  musicAssetbundle: string
  /** Vocal-specific jacket file inside that directory, when the rendition has its own cover. */
  jacketAssetbundle?: string
  /** Audio bundle, e.g. 0050_01 */
  vocalAssetbundle: string
  /** Leading silence to skip, in seconds. */
  trimStart: number
  singers: PlayerSinger[]
  connectLive?: ConnectLiveRef
}

/** A queue entry: the same rendition may be queued twice, so entries carry their own id. */
export interface PlayerTrack extends PlayerTrackInfo {
  uid: string
}

export interface TrackMusicRow {
  id: number
  title: string
  composer: string
  assetbundleName: string
  fillerSec?: number
  filterSec?: number
}

export interface TrackVocalRow {
  id: number
  musicId: number
  musicVocalType: string
  caption: string
  characters: { characterType: string; characterId: number }[]
  assetbundleName: string
}

export interface TrackSources {
  musics: TrackMusicRow[]
  vocals: TrackVocalRow[]
  characters: { id: number; firstName?: string; givenName: string }[]
  outsideCharacters: { id: number; name: string }[]
  characterUnits: { id: number; gameCharacterId: number; colorCode?: string }[]
  assetVariants: { musicVocalId: number; musicAssetType: string; assetbundleName: string }[]
}

export const TRACK_MASTERS = ['musics', 'musicVocals', 'gameCharacters', 'outsideCharacters', 'gameCharacterUnits', 'musicAssetVariants'] as const

/** Seconds of silence in front of the song: filterSec wins, fillerSec is the fallback. */
export function trimStartOf(music: Pick<TrackMusicRow, 'fillerSec' | 'filterSec'>): number {
  for (const value of [music.filterSec, music.fillerSec]) {
    const seconds = Number(value)
    if (Number.isFinite(seconds) && seconds > 0) return seconds
  }
  return 0
}

/** The rendition a song opens with: the SEKAI version when preferred and present, else the first. */
export function pickDefaultVocal<T extends Pick<TrackVocalRow, 'musicVocalType' | 'caption'>>(vocals: T[], preference: string): T | undefined {
  if (preference === 'sekai') {
    const sekai = vocals.find(v => v.musicVocalType === 'sekai' || v.caption.includes('セカイ'))
    if (sekai) return sekai
  }
  return vocals[0]
}

/** The character's own colour is the one on the unit row that shares its id. */
export function characterColor(units: TrackSources['characterUnits'], characterId: number): string | undefined {
  const row = units.find(u => u.id === characterId && u.gameCharacterId === characterId) ?? units.find(u => u.gameCharacterId === characterId)
  return row?.colorCode || undefined
}

export function buildTrack(music: TrackMusicRow, vocal: TrackVocalRow, sources: Pick<TrackSources, 'characters' | 'outsideCharacters' | 'characterUnits' | 'assetVariants'>): PlayerTrackInfo {
  const singers: PlayerSinger[] = []
  for (const member of vocal.characters) {
    if (member.characterType === 'game_character') {
      const row = sources.characters.find(c => c.id === member.characterId)
      if (row) singers.push({ type: 'game', id: row.id, firstName: row.firstName, givenName: row.givenName, color: characterColor(sources.characterUnits, row.id) })
    } else if (member.characterType === 'outside_character') {
      const row = sources.outsideCharacters.find(c => c.id === member.characterId)
      if (row) singers.push({ type: 'outside', id: row.id, name: row.name })
    }
  }
  return {
    musicId: music.id,
    vocalId: vocal.id,
    title: music.title,
    composer: music.composer,
    caption: vocal.caption,
    vocalType: vocal.musicVocalType,
    musicAssetbundle: music.assetbundleName,
    jacketAssetbundle: sources.assetVariants.find(v => v.musicVocalId === vocal.id && v.musicAssetType === 'jacket')?.assetbundleName,
    vocalAssetbundle: vocal.assetbundleName,
    trimStart: trimStartOf(music),
    singers,
  }
}

/** Track for a song, in the given rendition or the default one. Null when the song has no audio. */
export function trackFor(sources: TrackSources, musicId: number, preference: string, vocalId?: number): PlayerTrackInfo | null {
  const music = sources.musics.find(m => m.id === musicId)
  if (!music) return null
  const vocals = sources.vocals.filter(v => v.musicId === musicId)
  const vocal = (vocalId !== undefined && vocals.find(v => v.id === vocalId)) || pickDefaultVocal(vocals, preference)
  return vocal ? buildTrack(music, vocal, sources) : null
}

export async function loadTrackSources(getMaster: <T>(name: string) => Promise<T[]>): Promise<TrackSources> {
  const [musics, vocals, characters, outsideCharacters, characterUnits, assetVariants] = await Promise.all([
    getMaster<TrackMusicRow>('musics'),
    getMaster<TrackVocalRow>('musicVocals'),
    getMaster<TrackSources['characters'][number]>('gameCharacters'),
    getMaster<TrackSources['outsideCharacters'][number]>('outsideCharacters'),
    getMaster<TrackSources['characterUnits'][number]>('gameCharacterUnits'),
    getMaster<TrackSources['assetVariants'][number]>('musicAssetVariants'),
  ])
  return { musics, vocals, characters, outsideCharacters, characterUnits, assetVariants }
}

export function trackAudioPath(track: Pick<PlayerTrackInfo, 'vocalAssetbundle' | 'connectLive'>): string {
  if (track.connectLive) return connectLiveAudioPath(track.connectLive.bundle)
  return `/ondemand/music/long/${track.vocalAssetbundle}/${track.vocalAssetbundle}.mp3`
}

/** Connect Live recordings are published apart from the game assets (original MP3; a 128 kbps AAC sits next to it). */
export function connectLiveAudioPath(bundle: string): string {
  return `/connect-live/audio/${bundle}.mp3`
}

export function trackCoverPath(track: Pick<PlayerTrackInfo, 'musicAssetbundle' | 'jacketAssetbundle' | 'connectLive'>): string {
  if (!track.musicAssetbundle && track.connectLive?.cover) return track.connectLive.cover
  return `/startapp/music/jacket/${track.musicAssetbundle}/${track.jacketAssetbundle || track.musicAssetbundle}.png`
}

/** Two entries are the same recording: the same rendition of a song, or the same Connect Live performance. */
export function sameRecording(a: Pick<PlayerTrackInfo, 'musicId' | 'vocalId' | 'connectLive'>, b: Pick<PlayerTrackInfo, 'musicId' | 'vocalId' | 'connectLive'>): boolean {
  if (a.connectLive || b.connectLive) return !!a.connectLive && a.connectLive.bundle === b.connectLive?.bundle
  return a.musicId === b.musicId && a.vocalId === b.vocalId
}

function isConnectLiveRef(value: unknown): value is ConnectLiveRef {
  if (!value || typeof value !== 'object') return false
  const c = value as Record<string, unknown>
  return typeof c.bundle === 'string' && /^[\w-]+$/.test(c.bundle) && Number.isInteger(c.liveId)
    && (c.lyrics === undefined || (typeof c.lyrics === 'string' && /^[a-f0-9]{16}$/.test(c.lyrics)))
    && (c.cover === undefined || (typeof c.cover === 'string' && /^\/[\w/.-]+$/.test(c.cover)))
}

/** Portrait for a game character; outside characters have none. */
export function characterPortrait(characterId: number): string | null {
  return Number.isInteger(characterId) && characterId >= 1 && characterId <= 26 ? `/img/chr_ts/chr_ts_${characterId}.png` : null
}

/** Reject anything in a restored queue that is not a complete track record. */
export function isPlayerTrack(value: unknown): value is PlayerTrack {
  if (!value || typeof value !== 'object') return false
  const t = value as Record<string, unknown>
  const text = (key: string) => typeof t[key] === 'string'
  const live = t.connectLive
  if (live !== undefined && !isConnectLiveRef(live)) return false
  return text('uid') && Number.isInteger(t.musicId) && Number.isInteger(t.vocalId)
    && text('title') && text('composer') && text('caption') && text('vocalType')
    // A Connect Live performance of a song not in the game has no jacket and no game audio bundle.
    && text('musicAssetbundle') && (/^[\w-]+$/.test(t.musicAssetbundle as string) || (!!live && t.musicAssetbundle === ''))
    && text('vocalAssetbundle') && (/^[\w-]+$/.test(t.vocalAssetbundle as string) || (!!live && t.vocalAssetbundle === ''))
    && (t.jacketAssetbundle === undefined || (text('jacketAssetbundle') && /^[\w-]+$/.test(t.jacketAssetbundle as string)))
    && typeof t.trimStart === 'number' && Number.isFinite(t.trimStart) && t.trimStart >= 0
    && Array.isArray(t.singers)
    && t.singers.every(s => !!s && typeof s === 'object' && ((s as PlayerSinger).type === 'game' || (s as PlayerSinger).type === 'outside') && Number.isInteger((s as PlayerSinger).id))
}
