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
}
export interface SongLyrics {
  musicId: number
  duration: number
  vocalId?: number
  assetbundle?: string
  format: 'lrc' | 'bilingual_json'
  lines: LyricLine[]
  performers?: { performerId: string; name: string; color?: string }[]
  credits?: Record<string, string>
  sources?: [string, string | null, string | null][]
}
interface Payload extends Omit<SongLyrics, 'lines'> {
  lines?: LyricLine[]
  lrc?: string
  translationLrc?: string
  wordLines?: (LyricLine & { cueStart: number })[]
  rubyLines?: { cueStart: number; text: string; ruby: LyricRuby[] }[]
  romajiLines?: { cueStart: number; text: string; romaji: string }[]
}
interface LyricIndex { v: number; songs: Record<string, string> }
const base = `${masterApiBaseUrl}/lyrics`
let indexRequest: Promise<LyricIndex> | undefined
const pending = new Map<number, Promise<SongLyrics | null>>()

/**
 * LRC may contain multiple timestamps per line; preserve simultaneous cues.
 * A timestamp with no text is a cue too: the singing stops there, so it ends the line before it.
 */
export function parseLrc(text: string, duration: number): LyricLine[] {
  const lines: LyricLine[] = []
  const cues: number[] = []
  for (const row of text.split(/\r?\n/)) {
    const stamps = [...row.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)]
    const content = row.replace(/\[\d+:\d+(?:\.\d+)?\]/g, '').trim()
    for (const stamp of stamps) {
      const start = Number(stamp[1]) * 60 + Number(stamp[2])
      if (start < 0 || start > duration) continue
      cues.push(start)
      if (content) lines.push({ start, end: duration, text: content })
    }
  }
  lines.sort((a, b) => a.start - b.start)
  cues.sort((a, b) => a - b)
  for (const line of lines) line.end = cues.find(cue => cue > line.start) ?? duration
  return lines
}

export function normalizeLyrics(data: Payload): SongLyrics {
  const lines = data.format === 'lrc' ? parseLrc(data.lrc || '', data.duration) : data.lines || []
  if (data.format === 'lrc') {
    // A translation row belongs to one line: the first that starts while the row is current.
    // Lines that follow under the same row get none of their own, so a sentence written for
    // several lines is shown once instead of being repeated under each of them.
    for (const cue of parseLrc(data.translationLrc || '', data.duration)) {
      const owner = lines.find(line => cue.start <= line.start + 0.05 && cue.end > line.start)
      if (owner) owner.translation = owner.translation ? `${owner.translation} ${cue.text}` : cue.text
    }
  }
  if (data.format === 'lrc') {
    // Readings are keyed by the original cue, so they are matched before word timing moves the line.
    for (const line of lines) {
      const read = data.rubyLines?.find(r => Math.abs(r.cueStart - line.start) < 0.001 && r.text === line.text)
      if (read) line.ruby = read.ruby
      const romaji = data.romajiLines?.find(r => Math.abs(r.cueStart - line.start) < 0.001 && r.text === line.text)
      if (romaji) line.romaji = romaji.romaji
    }
    for (const line of lines) {
      const timed = data.wordLines?.find(w => Math.abs(w.cueStart - line.start) < 0.001 && w.text === line.text)
      if (timed) { line.words = timed.words; line.start = timed.start; line.end = timed.end }
    }
  }
  for (const line of lines) {
    if (line.ruby) line.ruby = validRuby(line.ruby, line.text)
    if (typeof line.romaji !== 'string' || !line.romaji.trim()) delete line.romaji
    // Invalid or overlapping text ranges fall back to line timing.
    if (line.words && !line.words.every((w, i, all) => Number.isInteger(w.from) && Number.isInteger(w.to) && w.from >= 0 && w.to > w.from && w.to <= line.text.length && Number.isFinite(w.start) && Number.isFinite(w.end) && w.start >= 0 && w.end >= w.start && (i === 0 || w.from >= all[i - 1]!.to))) line.words = undefined
  }
  return { ...data, lines: mergeSharedCues(playbackTiming(lines.filter(l => Number.isFinite(l.start) && Number.isFinite(l.end) && l.end >= l.start && l.text).sort((a, b) => a.start - b.start))) }
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
 */
export function playbackTiming(lines: LyricLine[]): LyricLine[] {
  const timed = lines.map((line, i) => {
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
  const sorted = timed.map((line, i) => ({ line, i })).sort((a, b) => a.line.start - b.line.start || a.i - b.i).map(e => e.line)
  sorted.forEach((line, i) => {
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

/** Small session index, then one immutable content-hashed song resource on demand. */
export function loadSongLyrics(musicId: number): Promise<SongLyrics | null> {
  if (pending.has(musicId)) return pending.get(musicId)!
  const task = (async () => {
    indexRequest ??= fetchJson<LyricIndex>('version.json').catch(error => { indexRequest = undefined; throw error })
    const index = await indexRequest
    const hash = index.songs[String(musicId)]
    if (!hash) return null
    if (!/^[a-f0-9]{16}$/.test(hash)) throw new Error('Invalid lyrics version')
    const data = await fetchJson<Payload>(`${musicId}.${hash}.json`)
    if (data.musicId !== musicId || !Number.isFinite(data.duration)) throw new Error('Invalid lyrics')
    return normalizeLyrics(data)
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
