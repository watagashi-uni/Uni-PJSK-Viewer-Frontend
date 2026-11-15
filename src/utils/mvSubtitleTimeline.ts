// When each lyric line is on screen as a subtitle over the MV. Kept free of imports so it can
// be tested on its own; the lines come in display order (see playbackTiming in api/lyrics).

/** Lines whose cues start this close together were written for the same moment (as SAME_CUE_SEC). */
const SAME_CUE_SEC = 0.05
/** Lyrics mode: a line stays this long after it ends, unless the next one comes sooner. */
export const LYRICS_LINGER_SEC = 0.5
/** KTV: how long before it is sung a line may appear at the latest… */
export const KTV_PREVIEW_SEC = 4
/** …and how long a finished line stays when nothing replaces it. */
export const KTV_LINGER_SEC = 1.2
/** A pause this long between lines starts a new verse: rows start over and are counted in. */
export const VERSE_GAP_SEC = 5

export interface TimedLine { start: number; end: number }

export interface SubtitleTiming {
  /** Lyrics mode: when the line leaves. */
  until: number
  /** KTV: upper row (0, left) or lower row (1, right). */
  slot: 0 | 1
  /** KTV: when the line is on screen. */
  show: number
  hide: number
  /** KTV: first line of a verse, counted in. */
  lead: boolean
}

/**
 * - Lyrics mode: a line holds a moment past its end, but gives way to the next one.
 * - KTV: rows alternate within a verse, and each verse starts over on the upper row. A line
 *   shows up once the line before it in its row is done (but no earlier than shortly before
 *   it is sung, and never after), the second line of a verse together with the first; and it
 *   leaves when the next line of its row takes its place, or a moment after it is sung.
 */
export function subtitleTimeline(lines: readonly TimedLine[], from = 0): SubtitleTiming[] {
  const timing: SubtitleTiming[] = lines.map(line => ({ until: line.end, slot: 0, show: line.start, hide: line.end, lead: false }))

  lines.forEach((line, i) => {
    const next = lines.slice(i + 1).find(other => other.start > line.start + SAME_CUE_SEC)
    timing[i]!.until = Math.max(line.end, Math.min(line.end + LYRICS_LINGER_SEC, next ? next.start : Number.POSITIVE_INFINITY))
  })

  let quietSince = from
  let row: 0 | 1 = 0
  const lastInRow: [number | undefined, number | undefined] = [undefined, undefined]
  lines.forEach((line, i) => {
    const own = timing[i]!
    own.lead = i === 0 || line.start - quietSince >= VERSE_GAP_SEC
    quietSince = Math.max(quietSince, line.end)
    if (own.lead) row = 0
    own.slot = row
    row = row === 0 ? 1 : 0
    const before = lastInRow[own.slot]
    const freed = before === undefined ? Number.NEGATIVE_INFINITY : lines[before]!.end
    const partner = timing[i - 1]
    const earliest = !own.lead && partner?.lead ? partner.show : line.start - KTV_PREVIEW_SEC
    own.show = Math.min(line.start, Math.max(freed, earliest))
    own.hide = line.end + KTV_LINGER_SEC
    if (before !== undefined) timing[before]!.hide = Math.min(timing[before]!.hide, own.show)
    lastInRow[own.slot] = i
  })
  return timing
}

/** Dots left in the count-in before a verse: `dots` going out one by one over `seconds`. */
export function countInDots(left: number, dots = 4, seconds = 3): number {
  if (!(left > 0) || left > seconds) return 0
  return Math.min(dots, Math.ceil(left / (seconds / dots)))
}
