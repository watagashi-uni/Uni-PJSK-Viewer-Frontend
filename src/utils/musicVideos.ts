// 2D MVs as the game ships them: silent videos played over the song's own audio.
//
// - Songs in the `mv_2d` category have one in live/2dmode/sekai_mv/{id}; a rendition with an
//   `mv` asset variant plays the video named there instead (live/2dmode/sekai_mv/8001, …).
// - Songs in the `original` category have the creator's MV in live/2dmode/original_mv/{id}.
//
// Each video runs from the start of the long audio, lead-in silence included, so its position
// is the audio position as it is.

export type MusicVideoKind = 'sekai' | 'original'

export interface MusicVideoSource {
  kind: MusicVideoKind
  /** Directory and file name inside the kind's folder, e.g. 0342 or 8005. */
  bundle: string
}

/** These videos are only on the overseas asset host, whichever source the reader picked. */
export const MUSIC_VIDEO_HOST = 'https://assets.unipjsk.com'

export const MUSIC_VIDEO_LABEL: Record<MusicVideoKind, string> = {
  sekai: '2D MV',
  original: '原曲 MV',
}

export interface MusicVideoCategoryRow { musicId: number; musicCategoryName: string }
export interface MusicVideoVariantRow { musicVocalId: number; musicAssetType: string; assetbundleName: string }

function padded(musicId: number): string {
  return String(musicId).padStart(4, '0')
}

/**
 * The 2D MVs a rendition can be watched with, the one it opens with first: the creator's MV
 * for the creator's own recording, the game's MV for every other rendition.
 */
export function musicVideoSources(
  musicId: number,
  vocal: { id: number; type: string },
  categories: ReadonlySet<string> | undefined,
  variant: string | undefined,
): MusicVideoSource[] {
  if (!Number.isInteger(musicId) || musicId <= 0 || !categories) return []
  const list: MusicVideoSource[] = []
  if (categories.has('mv_2d')) {
    list.push({ kind: 'sekai', bundle: variant && /^[\w-]+$/.test(variant) ? variant : padded(musicId) })
  }
  if (categories.has('original')) list.push({ kind: 'original', bundle: padded(musicId) })
  if (vocal.type === 'original_song') list.sort((a, b) => Number(b.kind === 'original') - Number(a.kind === 'original'))
  return list
}

export function musicVideoUrl(source: MusicVideoSource): string {
  return `${MUSIC_VIDEO_HOST}/ondemand/live/2dmode/${source.kind}_mv/${source.bundle}/${source.bundle}.mp4`
}

/** Subtitles over the MV: film-style lines, or karaoke rows that fill as they are sung. */
export type SubtitleMode = 'lyrics' | 'ktv'
/** What goes under each subtitle line. */
export type SubtitleExtra = 'none' | 'translation' | 'romaji'
