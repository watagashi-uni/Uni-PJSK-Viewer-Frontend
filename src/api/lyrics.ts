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
  performers?: { performerId: string; name: string }[]
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
    const translated = parseLrc(data.translationLrc || '', data.duration)
    for (const line of lines) {
      // Chinese cues are independent line groups, sometimes spanning several original lines.
      line.translation = translated.filter(t => t.start <= line.start + 0.05 && t.end > line.start).map(t => t.text).join(' ')
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

export function lyricParts(line: LyricLine): { text: string; word?: LyricWord; performerIds: string[] }[] {
  const parts: { text: string; word?: LyricWord; performerIds: string[] }[] = []
  const roles = (from: number, to: number) => {
    let offset = 0
    return [...new Set((line.segments || []).flatMap(s => {
      const left = offset; offset += s.text.length
      return left < to && offset > from ? s.performerIds : []
    }))]
  }
  let cursor = 0
  for (const word of line.words || []) {
    if (word.from > cursor) parts.push({ text: line.text.slice(cursor, word.from), performerIds: roles(cursor, word.from) })
    parts.push({ text: line.text.slice(word.from, word.to), word, performerIds: roles(word.from, word.to) })
    cursor = word.to
  }
  if (cursor < line.text.length) parts.push({ text: line.text.slice(cursor), performerIds: roles(cursor, line.text.length) })
  return parts
}
