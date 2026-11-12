import { masterApiBaseUrl } from './masterClient'

export interface LyricWord { from: number; to: number; start: number; end: number }
export interface LyricLine {
  words?: LyricWord[]
  start: number
  end: number
  text: string
  translation?: string
  segments?: { text: string; performerIds: string[] }[]
  performerIds?: string[]
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
}
interface LyricIndex { v: number; songs: Record<string, string> }
const base = `${masterApiBaseUrl}/lyrics`
let indexRequest: Promise<LyricIndex> | undefined
const pending = new Map<number, Promise<SongLyrics | null>>()

/** LRC may contain multiple timestamps per line; preserve simultaneous cues. */
export function parseLrc(text: string, duration: number): LyricLine[] {
  const lines: LyricLine[] = []
  for (const row of text.split(/\r?\n/)) {
    const stamps = [...row.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)]
    const content = row.replace(/\[\d+:\d+(?:\.\d+)?\]/g, '').trim()
    if (!content) continue
    for (const stamp of stamps) {
      const start = Number(stamp[1]) * 60 + Number(stamp[2])
      if (start >= 0 && start <= duration) lines.push({ start, end: duration, text: content })
    }
  }
  lines.sort((a, b) => a.start - b.start)
  for (let i = 0; i < lines.length; i++) {
    lines[i]!.end = lines.slice(i + 1).find(line => line.start > lines[i]!.start)?.start ?? duration
  }
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
    for (const line of lines) {
      const timed = data.wordLines?.find(w => Math.abs(w.cueStart - line.start) < 0.001 && w.text === line.text)
      if (timed) { line.words = timed.words; line.start = timed.start; line.end = timed.end }
    }
  }
  for (const line of lines) {
    // Invalid or overlapping text ranges fall back to line timing.
    if (line.words && !line.words.every((w, i, all) => Number.isInteger(w.from) && Number.isInteger(w.to) && w.from >= 0 && w.to > w.from && w.to <= line.text.length && Number.isFinite(w.start) && Number.isFinite(w.end) && w.start >= 0 && w.end >= w.start && (i === 0 || w.from >= all[i - 1]!.to))) line.words = undefined
  }
  return { ...data, lines: lines.filter(l => Number.isFinite(l.start) && Number.isFinite(l.end) && l.end >= l.start && l.text).sort((a, b) => a.start - b.start) }
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
