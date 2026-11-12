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

export interface PlayerTrackInfo {
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

export function trackAudioPath(track: Pick<PlayerTrackInfo, 'vocalAssetbundle'>): string {
  return `/ondemand/music/long/${track.vocalAssetbundle}/${track.vocalAssetbundle}.mp3`
}

export function trackCoverPath(track: Pick<PlayerTrackInfo, 'musicAssetbundle' | 'jacketAssetbundle'>): string {
  return `/startapp/music/jacket/${track.musicAssetbundle}/${track.jacketAssetbundle || track.musicAssetbundle}.png`
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
  return text('uid') && Number.isInteger(t.musicId) && Number.isInteger(t.vocalId)
    && text('title') && text('composer') && text('caption') && text('vocalType')
    && text('musicAssetbundle') && /^[\w-]+$/.test(t.musicAssetbundle as string)
    && text('vocalAssetbundle') && /^[\w-]+$/.test(t.vocalAssetbundle as string)
    && (t.jacketAssetbundle === undefined || (text('jacketAssetbundle') && /^[\w-]+$/.test(t.jacketAssetbundle as string)))
    && typeof t.trimStart === 'number' && Number.isFinite(t.trimStart) && t.trimStart >= 0
    && Array.isArray(t.singers)
    && t.singers.every(s => !!s && typeof s === 'object' && ((s as PlayerSinger).type === 'game' || (s as PlayerSinger).type === 'outside') && Number.isInteger((s as PlayerSinger).id))
}
