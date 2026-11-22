// Where a karaoke line too long for one row is cut into rows. Kept free of imports so it can be
// tested on its own.

/** One thing on the line: a character, or something that never splits (a word under a reading). */
export interface RowAtom {
  width: number
  /** The character, for a single character; absent for a block. */
  ch?: string
}

/** Atoms `from`–`to` (end excluded) make one row; a space or line break cut at is left out. */
export interface RowRange { from: number; to: number }

/** Most rows a line is cut into; one longer still wraps inside its rows. */
export const MAX_ROWS = 3
/** A cut at a space counts as this share of the room shorter: rows split there when they can. */
const SPACE_BONUS = 0.22
/** A cut after a comma or a full stop, a little less so. */
const PUNCT_BONUS = 0.08

const SPACE = /^[\s\u3000]$/u
const LATIN = /^[\p{Script=Latin}\p{Nd}'’-]$/u
/** Not at the start of a row: closing marks, small kana, the long vowel mark. */
const NO_START = /^[、。，．,.!?！？:;：；)）」』】〕〉》"”’…・ーぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ~〜～]$/u
/** Not at the end of a row: opening marks. */
const NO_END = /^[(（「『【〔〈《"“‘]$/u
const PUNCT = /^[、。，,!?！？]$/u

interface Cut { at: number; skip: number; bonus: number }

/** Where a row may end before atom `i`: at a space (dropped), or between two characters that allow it. */
function cutsOf(atoms: readonly RowAtom[], from: number, to: number): Cut[] {
  const cuts: Cut[] = []
  for (let i = from + 1; i < to; i++) {
    const before = atoms[i - 1]!
    const atom = atoms[i]!
    if (atom.ch !== undefined && SPACE.test(atom.ch)) {
      // The space goes; a run of spaces is cut at its first.
      if (before.ch !== undefined && SPACE.test(before.ch)) continue
      let skip = 1
      while (i + skip < to && atoms[i + skip]!.ch !== undefined && SPACE.test(atoms[i + skip]!.ch!)) skip++
      if (i + skip < to) cuts.push({ at: i, skip, bonus: SPACE_BONUS })
      continue
    }
    if (before.ch !== undefined && SPACE.test(before.ch)) continue
    if (before.ch !== undefined && atom.ch !== undefined && LATIN.test(before.ch) && LATIN.test(atom.ch)) continue
    if (atom.ch !== undefined && NO_START.test(atom.ch)) continue
    if (before.ch !== undefined && NO_END.test(before.ch)) continue
    cuts.push({ at: i, skip: 0, bonus: before.ch !== undefined && PUNCT.test(before.ch) ? PUNCT_BONUS : 0 })
  }
  return cuts
}

/** Rows of one stretch without line breaks, as few as fit `room`, at most `maxRows`. */
function splitStretch(atoms: readonly RowAtom[], from: number, to: number, room: number, maxRows: number): RowRange[] {
  const sums = [0]
  for (let i = from; i < to; i++) sums.push(sums[sums.length - 1]! + atoms[i]!.width)
  const width = (a: number, b: number) => sums[b - from]! - sums[a - from]!
  if (width(from, to) <= room || maxRows < 2) return [{ from, to }]
  const cuts = cutsOf(atoms, from, to)
  if (!cuts.length) return [{ from, to }]

  let best: { cost: number; ranges: RowRange[]; fits: boolean } | null = null
  const consider = (chosen: Cut[]) => {
    const ranges: RowRange[] = []
    let start = from
    let bonus = 0
    for (const cut of chosen) {
      ranges.push({ from: start, to: cut.at })
      start = cut.at + cut.skip
      bonus += cut.bonus
    }
    ranges.push({ from: start, to })
    const widths = ranges.map(r => width(r.from, r.to))
    const over = widths.reduce((sum, w) => sum + Math.max(0, w - room), 0)
    // The widest row as narrow as can be, nothing over the room, cuts at spaces preferred.
    const cost = Math.max(...widths) + over * 4 - bonus * room
    if (!best || cost < best.cost) best = { cost, ranges, fits: over === 0 }
  }
  for (let rows = 2; rows <= maxRows; rows++) {
    best = null
    if (rows === 2) {
      for (const cut of cuts) consider([cut])
    } else {
      for (let a = 0; a < cuts.length; a++) {
        for (let b = a + 1; b < cuts.length; b++) {
          if (cuts[b]!.at >= cuts[a]!.at + cuts[a]!.skip + 1) consider([cuts[a]!, cuts[b]!])
        }
      }
    }
    const found = best as { cost: number; ranges: RowRange[]; fits: boolean } | null
    if (found && (found.fits || rows === maxRows)) return found.ranges
  }
  return [{ from, to }]
}

/**
 * The rows a line is shown in: one when it fits `room`, otherwise cut into as few rows as fit
 * (at most MAX_ROWS), as even as they can be and at a space where there is one. A line break
 * in the text always starts a new row.
 */
export function splitRows(atoms: readonly RowAtom[], room: number, maxRows = MAX_ROWS): RowRange[] {
  const rows: RowRange[] = []
  let start = 0
  const stretches: RowRange[] = []
  atoms.forEach((atom, i) => {
    if (atom.ch !== '\n') return
    stretches.push({ from: start, to: i })
    start = i + 1
  })
  stretches.push({ from: start, to: atoms.length })
  const pieces = stretches.filter(s => s.to > s.from)
  for (const stretch of pieces) {
    rows.push(...splitStretch(atoms, stretch.from, stretch.to, room, Math.max(1, maxRows - pieces.length + 1)))
  }
  return rows.length ? rows : [{ from: 0, to: atoms.length }]
}
