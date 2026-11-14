import { masterApiBaseUrl } from './masterClient'

export interface LyricWord { from: number; to: number; start: number; end: number }
/** Reading of `text.slice(from, to)`, in the same UTF-16 offsets as the timed units. */
export interface LyricRuby { from: number; to: number; reading: string }
export interface LyricLine {
  words?: LyricWord[]
  start: number
  end: number
  text: string
  translation?: string
  segments?: { text: string; performerIds: string[] }[]
  performerIds?: string[]
  ruby?: LyricRuby[]
  /** The line in romaji, when it has Japanese to read. */
  romaji?: string
  /** Where the romaji comes from (sekaipedia, reviewed, generated); informative only. */
  romajiSource?: string
}
export interface LyricPerformer {
  performerId: string
  name: string
  color?: string
  /** Game character sung as, or null for a guest singer. */
  characterId?: number | null
  outsideCharacterId?: number | null
}
export interface SongLyrics {
  musicId: number
  duration: number
  vocalId?: number
  assetbundle?: string
  format: 'lrc' | 'bilingual_json'
  lines: LyricLine[]
  performers?: LyricPerformer[]
  credits?: Record<string, string>
  sources?: [string, string | null, string | null][]
}
/** Who sings one default row in another rendition. */
export interface LyricSingers {
  /** Zero-based row of the default rendition, counted before any display merging (see defaultRows). */
  row: number
  segments?: { text: string; performerIds: string[] }[]
  performerIds?: string[]
  /** Words this rendition sings on the row instead of the default ones (reviewed), with their translation. */
  text?: string
  translation?: string
}
/**
 * Another rendition of the song. Every rendition is sung to the same backing track, so it
 * shares the default timeline; the singers differ, and on a few rows the words.
 */
export interface LyricVersion {
  vocalId: number
  assetbundle: string
  /** Length of this rendition's audio. */
  duration: number
  performers: LyricPerformer[]
  source: 'A' | 'B' | 'C' | 'D'
  singers: LyricSingers[]
}
interface Cued { cueStart: number; text: string }
/** A song resource as published: the default rendition at the top, other renditions in `versions`. */
export interface LyricsPayload extends Omit<SongLyrics, 'lines'> {
  lines?: LyricLine[]
  lrc?: string
  translationLrc?: string
  wordLines?: (LyricLine & { cueStart: number })[]
  rubyLines?: (Cued & { ruby: LyricRuby[] })[]
  romajiLines?: (Cued & { romaji: string; source?: string })[]
  /** Start and end of LRC rows sung without units; word timing wins over it. */
  lineTimings?: (Cued & { start: number; end: number; source?: string })[]
  versions?: LyricVersion[]
}
interface LyricIndex { v: number; songs: Record<string, string> }
const base = `${masterApiBaseUrl}/lyrics`
let indexRequest: Promise<LyricIndex> | undefined
/**
 * Song resources as published, by music id (the index, read once a session, gives each its
 * one content hash). The rendition to play is derived from them on demand.
 */
const pending = new Map<number, Promise<LyricsPayload | null>>()

/** An LRC row with the time tag it was written under, kept for matching the extra fields to it. */
interface LrcRow extends LyricLine { cueStart: number }

/** Two time tags written for the same moment (their parsed values may differ by float error). */
const CUE_MATCH_SEC = 0.001

function sameCue(entry: Cued, row: LrcRow): boolean {
  return Math.abs(entry.cueStart - row.cueStart) < CUE_MATCH_SEC && entry.text === row.text
}

/**
 * Every time tag of a row with text, in tag order (stable, so rows of one moment keep their
 * file order). A tag with no text is a cue too: the singing stops there, so it ends the row before it.
 */
function lrcRows(text: string, duration: number): LrcRow[] {
  const rows: LrcRow[] = []
  const cues: number[] = []
  for (const row of text.split(/\r?\n/)) {
    const stamps = [...row.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)]
    const content = row.replace(/\[\d+:\d+(?:\.\d+)?\]/g, '').trim()
    for (const stamp of stamps) {
      const start = Number(stamp[1]) * 60 + Number(stamp[2])
      if (start < 0 || start > duration) continue
      cues.push(start)
      if (content) rows.push({ cueStart: start, start, end: duration, text: content })
    }
  }
  rows.sort((a, b) => a.cueStart - b.cueStart)
  cues.sort((a, b) => a - b)
  for (const row of rows) row.end = cues.find(cue => cue > row.cueStart) ?? duration
  return rows
}

/** LRC may contain multiple timestamps per line; preserve simultaneous cues. */
export function parseLrc(text: string, duration: number): LyricLine[] {
  return lrcRows(text, duration).map(({ start, end, text }) => ({ start, end, text }))
}

/**
 * The rows of the default rendition as written, before any timing is applied or rows are
 * merged for display: the lines of a bilingual song, or every tagged LRC row with its
 * translation, readings and romaji. The singers of other renditions name rows of this list.
 */
function defaultRows(data: LyricsPayload): LyricLine[] {
  if (data.format !== 'lrc') return Array.isArray(data.lines) ? data.lines : []
  const rows = lrcRows(data.lrc || '', data.duration)
  // A translation row is written under the time tag of the row it translates. A row with
  // no translation under its own tag has none: the one before it is not carried on.
  for (const cue of lrcRows(data.translationLrc || '', data.duration)) {
    const owner = rows.find(row => Math.abs(row.cueStart - cue.cueStart) < CUE_MATCH_SEC)
    if (owner) owner.translation = owner.translation ? `${owner.translation} ${cue.text}` : cue.text
  }
  for (const row of rows) {
    const read = data.rubyLines?.find(r => sameCue(r, row))
    if (read) row.ruby = read.ruby
    const romaji = data.romajiLines?.find(r => sameCue(r, row))
    if (romaji) {
      row.romaji = romaji.romaji
      if (romaji.source) row.romajiSource = romaji.source
    }
  }
  return rows
}

const rowCache = new WeakMap<LyricsPayload, LyricLine[]>()
function cachedRows(data: LyricsPayload): LyricLine[] {
  let rows = rowCache.get(data)
  if (!rows) rowCache.set(data, rows = defaultRows(data))
  return rows
}

/**
 * The song timed on the default timeline, which every rendition shares. The singers are
 * the default rendition's, those of `version`, or none (`null`: a rendition nobody
 * annotated, whose singers are unknown).
 */
export function normalizeLyrics(data: LyricsPayload, version?: LyricVersion | null): SongLyrics {
  const fixed = new Set<LyricLine>()
  const own = version === undefined
  const singers = new Map<number, LyricSingers>()
  for (const entry of (version && Array.isArray(version.singers) ? version.singers : [])) if (Number.isInteger(entry?.row)) singers.set(entry.row, entry)
  const lines = cachedRows(data).map((row, index) => {
    const line: LyricLine & { cueStart?: number } = { ...row }
    if (!own) {
      // Singers belong to the rendition they were written for.
      delete line.segments
      delete line.performerIds
      const entry = singers.get(index)
      if (entry?.segments) line.segments = entry.segments
      if (entry?.performerIds) line.performerIds = entry.performerIds
      if (typeof entry?.text === 'string' && entry.text) {
        // Other words on this row: the default readings, romaji and units no longer fit them.
        line.text = entry.text
        delete line.ruby
        delete line.romaji
        delete line.romajiSource
        delete line.words
        if (typeof entry.translation === 'string' && entry.translation) line.translation = entry.translation
        else delete line.translation
      }
    }
    if (data.format !== 'lrc') return line
    // Matched by the original tag and text, so one timing never decides which entry another follows.
    // The row as written decides, even where this rendition sings other words on it.
    const cued = row as LrcRow
    const timing = data.lineTimings?.find(t => sameCue(t, cued))
    const timed = data.wordLines?.find(w => sameCue(w, cued))
    if (timed) {
      if (line.text === row.text) line.words = timed.words
      line.start = timed.start
      line.end = timed.end
    } else if (timing && Number.isFinite(timing.start) && Number.isFinite(timing.end)) {
      line.start = timing.start
      line.end = timing.end
      fixed.add(line)
    }
    return line
  })
  const song: SongLyrics = { musicId: data.musicId, duration: data.duration, format: data.format, lines: displayLines(lines, fixed) }
  if (version) {
    song.vocalId = version.vocalId
    song.assetbundle = version.assetbundle
    if (Number.isFinite(version.duration) && version.duration > 0) song.duration = version.duration
    song.performers = version.performers
  } else if (own) {
    if (data.vocalId != null) song.vocalId = data.vocalId
    if (data.assetbundle != null) song.assetbundle = data.assetbundle
    if (data.performers) song.performers = data.performers
  }
  if (data.credits) song.credits = data.credits
  if (data.sources) song.sources = data.sources
  return song
}

/**
 * Clean the lines and arrange them for display. Lines in `fixed` have timing given for
 * exactly them, which the display rules (see playbackTiming) leave as it is.
 */
function displayLines(lines: LyricLine[], fixed: Set<LyricLine>): LyricLine[] {
  for (const line of lines) {
    if (line.ruby) {
      const ruby = validRuby(line.ruby, line.text)
      if (ruby) line.ruby = ruby
      else delete line.ruby
    }
    if (typeof line.romaji !== 'string' || !line.romaji.trim()) {
      delete line.romaji
      delete line.romajiSource
    }
    // Singers whose parts do not spell out the line cannot be placed on it.
    if (line.segments && (!Array.isArray(line.segments) || line.segments.map(s => s.text).join('') !== line.text)) delete line.segments
    // Invalid or overlapping text ranges fall back to line timing.
    if (line.words && !(Array.isArray(line.words) && line.words.every((w, i, all) => Number.isInteger(w.from) && Number.isInteger(w.to) && w.from >= 0 && w.to > w.from && w.to <= line.text.length && Number.isFinite(w.start) && Number.isFinite(w.end) && w.start >= 0 && w.end >= w.start && (i === 0 || w.from >= all[i - 1]!.to)))) delete line.words
  }
  const valid = lines.filter(l => Number.isFinite(l.start) && Number.isFinite(l.end) && l.end >= l.start && l.text).sort((a, b) => a.start - b.start)
  const shown = mergeSharedCues(playbackTiming(valid, line => fixed.has(line)))
  for (const line of shown) delete (line as Partial<LrcRow>).cueStart
  return shown
}

/** Which rendition of the song is being heard; the vocal id decides, the audio bundle only where there is none. */
export interface VocalIdentity { vocalId?: number; assetbundle?: string }

/** The rendition in the resource for this vocal: the default one, another, or none recorded. */
export function findVersion(data: LyricsPayload, vocal: VocalIdentity): 'default' | LyricVersion | null {
  const versions = Array.isArray(data.versions) ? data.versions : []
  if (vocal.vocalId != null) {
    if (data.vocalId === vocal.vocalId) return 'default'
    const version = versions.find(v => v.vocalId === vocal.vocalId)
    if (version) return version
    // A default rendition recorded only by its audio bundle.
    return data.vocalId == null && !!vocal.assetbundle && data.assetbundle === vocal.assetbundle ? 'default' : null
  }
  if (!vocal.assetbundle) return null
  if (data.assetbundle === vocal.assetbundle) return 'default'
  return versions.find(v => v.assetbundle === vocal.assetbundle) ?? null
}

export interface VocalLyrics {
  lyrics: SongLyrics
  /** Who sings each line is known for this rendition. */
  singers: boolean
}

const derived = new WeakMap<LyricsPayload, Map<string, SongLyrics>>()

/**
 * The lyrics to show while a vocal plays: the shared timeline, with the singers of that
 * rendition when they were annotated. Built once per rendition, so switching back is free.
 */
export function lyricsForVocal(data: LyricsPayload, vocal: VocalIdentity): VocalLyrics {
  let built = derived.get(data)
  if (!built) derived.set(data, built = new Map())
  const match = findVersion(data, vocal)
  const key = match === 'default' ? 'default' : match ? `vocal-${match.vocalId}` : 'unknown'
  if (!built.has(key)) built.set(key, normalizeLyrics(data, match === 'default' ? undefined : match))
  return { lyrics: built.get(key)!, singers: match !== null }
}

/**
 * Rows the source split out of one cue but timed only as a whole (no units, the same start
 * and end) become one line, their rows kept as line breaks inside it. Nothing tells when each
 * row is sung, so they could only ever light up, scroll and be clicked together: as one line
 * they read as the single lyric line they are instead of several lines lit at once.
 */
export function mergeSharedCues(lines: LyricLine[]): LyricLine[] {
  const merged: LyricLine[] = []
  for (let i = 0; i < lines.length;) {
    const first = lines[i]!
    let j = i + 1
    while (j < lines.length && !first.words?.length && !lines[j]!.words?.length
      && Math.abs(lines[j]!.start - first.start) <= SAME_CUE_SEC && Math.abs(lines[j]!.end - first.end) <= SAME_CUE_SEC) j++
    merged.push(j - i > 1 ? joinRows(lines.slice(i, j)) : first)
    i = j
  }
  return merged
}

function joinRows(rows: LyricLine[]): LyricLine {
  const line: LyricLine = { start: rows[0]!.start, end: Math.max(...rows.map(r => r.end)), text: rows.map(r => r.text).join('\n') }
  const translation = rows.map(r => r.translation).filter(Boolean).join('\n')
  if (translation) line.translation = translation
  // Romaji keeps one row per row of text, so each reads under its own words.
  if (rows.some(r => r.romaji)) line.romaji = rows.map(r => r.romaji || '').join('\n')
  if (rows.some(r => r.segments?.length || r.performerIds?.length)) {
    // Singers named for a whole row become a segment over that row, so each row keeps its own.
    line.segments = rows.flatMap((r, n) => {
      const own = r.segments?.length ? r.segments : [{ text: r.text, performerIds: r.performerIds || [] }]
      // Text past a row's last segment has no singer; it is kept so the next row's singers stay on that row.
      const covered = own.map(s => s.text).join('')
      const rest = r.text.startsWith(covered) && covered.length < r.text.length ? [{ text: r.text.slice(covered.length), performerIds: [] as string[] }] : []
      return [...(n ? [{ text: '\n', performerIds: [] as string[] }] : []), ...own, ...rest]
    })
    if (line.segments.map(s => s.text).join('') !== line.text) line.segments = undefined
  }
  let offset = 0
  const ruby = rows.flatMap((r) => {
    const shifted = (r.ruby || []).map(x => ({ ...x, from: x.from + offset, to: x.to + offset }))
    offset += r.text.length + 1
    return shifted
  })
  if (ruby.length) line.ruby = ruby
  return line
}

/** Lines whose cues start this close together were written for the same moment. */
export const SAME_CUE_SEC = 0.05
/** Word-timed lines that share less than this are sung one after the other, not together. */
const SHARED_SINGING_SEC = 0.1

/** Background vocals written wholly in brackets, heard over the main line rather than after it. */
function isBacking(text: string): boolean {
  return /^\s*[(（][^]*[)）]\s*$/.test(text)
}

function sungSpan(line: LyricLine): [number, number] | undefined {
  const words = line.words
  return words?.length ? [words[0]!.start, words.reduce((end, w) => Math.max(end, w.end), words[0]!.end)] : undefined
}

/**
 * When each line is current. The source often splits one cue across several rows that all
 * carry the cue's start and end, and lets a line's end run into the next line's start.
 * Taken as they are, every row of the cue lights up at once and two lines stay lit at each
 * hand-over. So:
 * - a word-timed row starts with its first unit, and an untimed row that follows a word-timed
 *   row of the same cue, or whose cue starts while such a row is being sung, starts once that
 *   row has been sung;
 * - a line ends when the next line that is not sung together with it begins (but never before
 *   its own units finish). Bracketed backing vocals and word-timed lines whose units overlap
 *   keep their own timing, since those really are heard at the same time.
 * Rows of one cue with no units have nothing to tell them apart and stay current together.
 * Lines `fixed` says were timed on their own (LRC line timings)
 * keep that timing, overlaps included; they still tell the lines around them when they are sung.
 */
export function playbackTiming(lines: LyricLine[], fixed: (line: LyricLine) => boolean = () => false): LyricLine[] {
  const kept = lines.map(fixed)
  const timed = lines.map((line, i) => {
    if (kept[i]) return { ...line }
    const span = sungSpan(line)
    if (span) return { ...line, start: span[0], end: Math.max(line.end, span[1]) }
    let start = line.start
    if (!isBacking(line.text)) {
      for (let k = 0; k < i; k++) {
        const before = lines[k]!
        const sung = sungSpan(before)
        if (!sung || isBacking(before.text)) continue
        const sameCue = Math.abs(before.start - line.start) <= SAME_CUE_SEC && Math.abs(before.end - line.end) <= SAME_CUE_SEC
        const during = line.start >= sung[0] - SAME_CUE_SEC && line.start < sung[1]
        if (sameCue || during) start = Math.max(start, sung[1])
      }
    }
    return { ...line, start: Math.min(line.end, start) }
  })
  const order = timed.map((line, i) => ({ line, i })).sort((a, b) => a.line.start - b.line.start || a.i - b.i)
  const sorted = order.map(e => e.line)
  sorted.forEach((line, i) => {
    if (kept[order[i]!.i]) return
    const span = sungSpan(line)
    for (let j = i + 1; j < sorted.length && sorted[j]!.start < line.end; j++) {
      const next = sorted[j]!
      if (next.start - line.start <= SAME_CUE_SEC) continue
      if (isBacking(line.text) || isBacking(next.text)) continue
      const other = sungSpan(next)
      if (span && other && Math.min(span[1], other[1]) - Math.max(span[0], other[0]) > SHARED_SINGING_SEC) continue
      line.end = Math.min(line.end, Math.max(next.start, span ? span[1] : line.start))
      break
    }
  })
  return sorted
}

/** Readings in text order; a malformed or overlapping one is dropped and its text shown bare. */
function validRuby(ruby: unknown, text: string): LyricRuby[] | undefined {
  if (!Array.isArray(ruby)) return undefined
  const valid = (ruby as LyricRuby[])
    .filter(r => r && Number.isInteger(r.from) && Number.isInteger(r.to) && r.from >= 0 && r.to > r.from && r.to <= text.length && typeof r.reading === 'string' && r.reading.trim())
    .sort((a, b) => a.from - b.from)
    .filter((r, i, all) => i === 0 || r.from >= all[i - 1]!.to)
  return valid.length ? valid.map(({ from, to, reading }) => ({ from, to, reading })) : undefined
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${base}/${path}`, { credentials: 'omit', cache: path === 'version.json' ? 'no-cache' : 'default', signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`Lyrics: ${response.status}`)
  return response.json() as Promise<T>
}

/**
 * Small session index, then one immutable content-hashed song resource on demand. The
 * resource is kept as published: each rendition is derived from it (see lyricsForVocal).
 */
export function loadSongLyrics(musicId: number): Promise<LyricsPayload | null> {
  if (pending.has(musicId)) return pending.get(musicId)!
  const task = (async () => {
    indexRequest ??= fetchJson<LyricIndex>('version.json').catch(error => { indexRequest = undefined; throw error })
    const index = await indexRequest
    const hash = index.songs[String(musicId)]
    if (!hash) return null
    if (!/^[a-f0-9]{16}$/.test(hash)) throw new Error('Invalid lyrics version')
    const data = await fetchJson<LyricsPayload>(`${musicId}.${hash}.json`)
    if (data.musicId !== musicId || !Number.isFinite(data.duration)) throw new Error('Invalid lyrics')
    return data
  })()
  pending.set(musicId, task)
  void task.catch(() => pending.delete(musicId))
  return task
}

/** Supplied units retain their own duration, including holds and gaps. */
export function wordProgress(time: number, word: Pick<LyricWord, 'start' | 'end'>): number {
  if (word.end <= word.start) return time >= word.start ? 1 : 0
  return Math.max(0, Math.min(1, (time - word.start) / (word.end - word.start)))
}

export interface LyricPart { text: string; word?: LyricWord; performerIds: string[] }

/**
 * A line cut at every timed unit and, between them, wherever the singers change,
 * so each piece can be filled on its own clock and labelled with who sings it.
 */
export function lyricParts(line: LyricLine): LyricPart[] {
  const parts: LyricPart[] = []
  const spans: { from: number; to: number; performerIds: string[] }[] = []
  let offset = 0
  for (const segment of line.segments || []) {
    spans.push({ from: offset, to: offset + segment.text.length, performerIds: segment.performerIds })
    offset += segment.text.length
  }
  const roles = (from: number, to: number) => [...new Set(spans.flatMap(s => (s.from < to && s.to > from ? s.performerIds : [])))]
  // Untimed text keeps the singer boundaries; text past the last segment has no singer.
  const plain = (from: number, to: number) => {
    let cursor = from
    for (const span of spans) {
      if (span.to <= cursor || span.from >= to) continue
      if (span.from > cursor) parts.push({ text: line.text.slice(cursor, span.from), performerIds: [] })
      const end = Math.min(span.to, to)
      parts.push({ text: line.text.slice(Math.max(cursor, span.from), end), performerIds: span.performerIds })
      cursor = end
    }
    if (cursor < to) parts.push({ text: line.text.slice(cursor, to), performerIds: [] })
  }
  let cursor = 0
  for (const word of line.words || []) {
    if (word.from > cursor) plain(cursor, word.from)
    parts.push({ text: line.text.slice(word.from, word.to), word, performerIds: roles(word.from, word.to) })
    cursor = word.to
  }
  if (cursor < line.text.length) plain(cursor, line.text.length)
  return parts
}

/** A piece of a part, cut where a reading begins or ends. */
export interface LyricPiece {
  text: string
  /** The part of `lyricParts()` this piece comes from. */
  part: number
  word?: LyricWord
  /** Where the piece lies inside its timed unit (0–1), when a reading cut the unit. */
  share?: [number, number]
}
/** Text under one reading, or a single piece with none. */
export interface LyricRun { reading?: string; pieces: LyricPiece[] }

/**
 * The parts of a line grouped under their readings. A timed unit that a reading boundary
 * falls inside is cut into pieces that keep the unit's own timing and fill in turn by its
 * progress, so no timing that is not in the data is invented.
 */
export function lyricRuns(line: LyricLine, parts: LyricPart[] = lyricParts(line)): LyricRun[] {
  const ruby = line.ruby || []
  const runs: LyricRun[] = []
  let offset = 0
  let current: { index: number; run: LyricRun } | undefined
  parts.forEach((part, index) => {
    const from = offset
    const to = offset + part.text.length
    offset = to
    const cuts = [from, ...ruby.flatMap(r => [r.from, r.to]).filter(at => at > from && at < to), to]
    for (let c = 0; c + 1 < cuts.length; c++) {
      const a = cuts[c]!
      const b = cuts[c + 1]!
      const piece: LyricPiece = { text: line.text.slice(a, b), part: index }
      if (part.word) {
        piece.word = part.word
        if (b - a < to - from) piece.share = [(a - from) / (to - from), (b - from) / (to - from)]
      }
      const reading = ruby.findIndex(r => r.from <= a && r.to >= b)
      if (reading < 0) {
        current = undefined
        runs.push({ pieces: [piece] })
      } else if (current?.index === reading) {
        current.run.pieces.push(piece)
      } else {
        current = { index: reading, run: { reading: ruby[reading]!.reading, pieces: [piece] } }
        runs.push(current.run)
      }
    }
  })
  return runs
}

/** Fill of one piece of a timed unit: the unit's progress, read across the stretch the piece covers. */
export function pieceProgress(progress: number, share?: [number, number]): number {
  if (!share) return progress
  return Math.max(0, Math.min(1, (progress - share[0]) / (share[1] - share[0])))
}

/** Longest time untimed text between two units takes to fill, so a long pause does not drag it out. */
const UNTIMED_FILL_SEC = 0.25

/**
 * When text no unit covers (punctuation, spaces, symbols) fills on a word-timed line:
 * right after the unit before it ends, catching up by the start of the unit after it.
 * Text in front of the first unit fills as that unit starts; text after the last, as it ends.
 * Lines without units have no fill: they are highlighted as a whole.
 */
export function untimedFill(words: LyricWord[] | undefined, from: number, to: number): { start: number; end: number } | undefined {
  let before: LyricWord | undefined
  let after: LyricWord | undefined
  for (const word of words || []) {
    if (word.to <= from) before = word
    else if (word.from >= to) {
      after = word
      break
    }
  }
  if (!before) return after && { start: after.start, end: after.start }
  if (!after) return { start: before.end, end: before.end }
  return { start: before.end, end: Math.max(before.end, Math.min(after.start, before.end + UNTIMED_FILL_SEC)) }
}

/** Everyone heard on a line, whether assigned to the whole line or to parts of it. */
export function linePerformerIds(line: LyricLine): string[] {
  return [...new Set([...(line.performerIds || []), ...(line.segments || []).flatMap(s => s.performerIds)])]
}

/**
 * The in-game cast is identified as "歌唱者-21" (game character 21). Guest singers
 * ("外部歌唱者-…") are numbered separately and have no in-game portrait.
 */
export function performerCharacterId(performerId: string): number | null {
  const match = /^(?:歌唱者-)?0*(\d{1,2})$/.exec(performerId)
  const id = match ? Number(match[1]) : 0
  return id >= 1 && id <= 26 ? id : null
}

export interface LyricGap { start: number; end: number }

/**
 * Stretches with nothing to sing (the intro and instrumental breaks) long enough
 * to deserve a "waiting" marker between the lines around them.
 */
export function lyricGaps(lines: Pick<LyricLine, 'start' | 'end'>[], from = 0, minimum = 5): (LyricGap & { before: number })[] {
  const gaps: (LyricGap & { before: number })[] = []
  let quietSince = from
  lines.forEach((line, index) => {
    if (line.start - quietSince >= minimum) gaps.push({ start: quietSince, end: line.start, before: index })
    quietSince = Math.max(quietSince, line.end)
  })
  return gaps
}
