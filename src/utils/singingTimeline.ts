// Who is heard at a given moment, from the singers annotated on the lyric lines. Kept free of
// imports so it can be tested on its own.

export interface VoiceLine {
  start: number
  end: number
  text: string
  words?: { from: number; to: number; start: number; end: number }[]
  segments?: { text: string; performerIds: string[] }[]
  performerIds?: string[]
}

/** From `start` on, these performers sing the line (until the next cue of the line). */
export interface VoiceCue { start: number; ids: string[] }

function unique<T>(ids: T[]): T[] {
  return [...new Set(ids)]
}

/**
 * When each voice of a line comes in. On a word-timed line whose singers trade off, each unit
 * brings in the singers of the text under it; otherwise the line has one cue, everyone on it.
 */
export function lineVoices(line: VoiceLine): VoiceCue[] {
  const everyone = unique([...(line.performerIds || []), ...(line.segments || []).flatMap(s => s.performerIds)])
  const segments = line.segments || []
  if (!line.words?.length || !segments.length) return everyone.length ? [{ start: line.start, ids: everyone }] : []
  const spans: { from: number; to: number; ids: string[] }[] = []
  let offset = 0
  for (const segment of segments) {
    spans.push({ from: offset, to: offset + segment.text.length, ids: segment.performerIds })
    offset += segment.text.length
  }
  const cues: VoiceCue[] = []
  for (const word of line.words) {
    // Units over spaces or punctuation carry no voice of their own.
    if (!line.text.slice(word.from, word.to).trim()) continue
    const ids = unique(spans.filter(s => s.from < word.to && s.to > word.from).flatMap(s => s.ids))
    if (!ids.length) continue
    const last = cues[cues.length - 1]
    if (last && last.ids.join('+') === ids.join('+')) continue
    cues.push({ start: word.start, ids })
  }
  return cues.length ? cues : everyone.length ? [{ start: line.start, ids: everyone }] : []
}

/**
 * Everyone heard at `time`: the voice each line being sung has reached, all lines together.
 * Null when no line is being sung (an intro or a break), so the caller can keep what it had.
 */
export function singersAt(lines: readonly VoiceLine[], voices: readonly VoiceCue[][], time: number): string[] | null {
  let heard: string[] | null = null
  lines.forEach((line, index) => {
    if (time < line.start || time >= line.end) return
    const cues = voices[index] || []
    let current: VoiceCue | undefined
    for (const cue of cues) if (cue.start <= time) current = cue
    current ??= cues[0]
    if (!current) return
    heard = unique([...(heard || []), ...current.ids])
  })
  return heard
}

/** From `time` on, these characters are shown, each with a card not shown just before. */
export interface CastCue { time: number; characters: number[] }

export interface CastTimelineOptions {
  /** Characters in display order (only these are shown). */
  cast: number[]
  /** The character each performer is, where known. */
  characterOf: (performerId: string) => number | undefined
  /** A voice heard for less than this is let pass without changing the picture. */
  minHold?: number
  /** The same voice for this long moves on to new cards. */
  maxHold?: number
  /** Silence this long counts as a break: the next voice brings new cards, even the same one. */
  minBreak?: number
  maxPanels?: number
}

/**
 * Who is on screen over the whole song, worked out in advance so the picture can change exactly
 * as a voice comes in (and its cards be loaded before then):
 * - the whole cast until the first line;
 * - whoever is singing, side by side when several sing together;
 * - through a break, whoever sang last, with new cards when the singing resumes;
 * - new cards, too, when one voice holds the screen for long.
 */
export function castTimeline(lines: readonly VoiceLine[], options: CastTimelineOptions): CastCue[] {
  const { cast, characterOf } = options
  const minHold = options.minHold ?? 0.5
  const maxHold = options.maxHold ?? 14
  const maxPanels = options.maxPanels ?? 6
  const minBreak = options.minBreak ?? 1.5
  if (!cast.length) return []
  const voices = lines.map(lineVoices)
  const order = new Map(cast.map((id, n) => [id, n]))

  // Every moment the voice might change: cues, and lines starting and ending.
  const moments = unique(lines.flatMap((line, n) => [line.start, line.end, ...voices[n]!.map(cue => cue.start)])).sort((a, b) => a - b)
  type Span = { time: number; characters: number[] | null }
  const spans: Span[] = []
  for (const time of moments) {
    const ids = singersAt(lines, voices, time + 1e-4)
    const characters = ids
      ? unique(ids.map(characterOf).filter((id): id is number => id !== undefined && order.has(id)))
          .sort((a, b) => order.get(a)! - order.get(b)!)
          .slice(0, maxPanels)
      : null
    const value = characters && characters.length ? characters : null
    const last = spans[spans.length - 1]
    if (last && String(last.characters) === String(value)) continue
    spans.push({ time, characters: value })
  }

  // A voice heard only briefly is let pass, and a short silence is no break: the picture stays
  // on what came before.
  const kept = spans.filter((span, n) => {
    const next = spans[n + 1]
    if (!next) return true
    return next.time - span.time >= (span.characters ? minHold : minBreak)
  })

  const firstStart = lines.length ? Math.min(...lines.map(line => line.start)) : 0
  const cues: CastCue[] = [{ time: 0, characters: cast.slice(0, maxPanels) }]
  let shown = cues[0]!
  let breakSince: number | null = null
  for (const span of kept) {
    if (span.time < firstStart) continue
    if (!span.characters) {
      breakSince ??= span.time
      continue
    }
    const same = String(span.characters) === String(shown.characters)
    if (same && breakSince === null) continue
    breakSince = null
    shown = { time: span.time, characters: span.characters }
    cues.push(shown)
  }

  // One voice holding the screen for long: new cards every so often.
  const result: CastCue[] = []
  cues.forEach((cue, n) => {
    result.push(cue)
    const until = cues[n + 1]?.time ?? Math.max(cue.time, ...lines.map(line => line.end))
    for (let time = cue.time + maxHold; time < until - maxHold / 2; time += maxHold) {
      result.push({ time, characters: cue.characters })
    }
  })
  return result
}

/** The cue in effect at `time` (the last one at or before it). */
export function cueAt(cues: readonly { time: number }[], time: number): number {
  let low = 0
  let high = cues.length - 1
  let found = -1
  while (low <= high) {
    const middle = (low + high) >> 1
    if (cues[middle]!.time <= time) {
      found = middle
      low = middle + 1
    } else {
      high = middle - 1
    }
  }
  return found
}
