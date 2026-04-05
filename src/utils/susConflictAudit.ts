import { applyRebase } from 'sekai-sus2img/src/rebase'
import { parseSusText } from 'sekai-sus2img/src/parser'

type FlickType = 'none' | 'default' | 'left' | 'right'
type NoteType = 'tap' | 'hold' | 'holdMid' | 'holdEnd'
type HoldStepType = 'normal' | 'hidden' | 'skip'
type HoldNoteType = 'normal' | 'hidden' | 'guide'

type SusDataLine = {
  header: string
  data: string
  measure: number
}

type ParsedSusNote = {
  tick: number
  measure: number
  slotIndex: number
  slotTotal: number
  bar: number
  lane: number
  width: number
  type: number
  sourceOrder: number
}

type ParsedSlideNote = ParsedSusNote

type ParsedBar = {
  measure: number
  ticksPerMeasure: number
  ticks: number
}

type ParsedBarLength = {
  bar: number
  length: number
}

type ParsedSus = {
  taps: ParsedSusNote[]
  directionals: ParsedSusNote[]
  slides: ParsedSlideNote[][]
  guides: ParsedSlideNote[][]
  barlengths: ParsedBarLength[]
}

type AuditNote = {
  id: number
  type: NoteType
  parentId: number
  tick: number
  lane: number
  susLane: number
  width: number
  critical: boolean
  friction: boolean
  flick: FlickType
  sourceOrder: number
  measure: number
  slotIndex: number
  slotTotal: number
  bar: number
}

type HoldStep = {
  id: number
  type: HoldStepType
}

type HoldNote = {
  start: HoldStep
  steps: HoldStep[]
  end: number
  startType: HoldNoteType
  endType: HoldNoteType
}

type AuditScore = {
  notes: Map<number, AuditNote>
  holdNotes: Map<number, HoldNote>
}

type MarkerRole = 'kept' | 'suppressed' | 'source'

export type ConflictMarker = {
  id: string
  role: MarkerRole
  label: string
  bar: number
  susLane: number
  width: number
}

export type ConflictDiagnostic = {
  id: string
  category: 'tap_overlap' | 'hold_coverage' | 'visible_overlap' | 'hold_relay_same_time' | 'hold_node_exact_overlap'
  severity: 'dedup' | 'crash'
  title: string
  summary: string
  measure: number
  positionText: string
  trackText: string
  markers: ConflictMarker[]
  sortTick: number
  sortLane: number
}

export type RenderSentenceLayout = {
  barStart: number
  barStop: number
  width: number
  height: number
  tx: number
  ty: number
}

export type RenderOverlayContext = {
  score: {
    notes: Array<{ bar: { toNumber(): number } }>
    getEvent(bar: number): { sentenceLength?: number | null; section?: string | null }
    getTimeDelta(barFrom: number, barTo: number): number
  }
  laneWidth: number
  lanePadding: number
  timePadding: number
  timeHeight: number
  nLanes: number
  totalHeight: number
  sentenceLayouts: RenderSentenceLayout[]
}

const MIN_LANE = 0
const MAX_LANE = 11

const DEFAULT_LANE_WIDTH = 16
const DEFAULT_LANE_PADDING = 40
const DEFAULT_TIME_PADDING = 32
const DEFAULT_N_LANES = 12

const gcd = (left: number, right: number): number => {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) {
    const temp = a % b
    a = b
    b = temp
  }
  return a || 1
}

const trim = (value: string): string => value.trim()

const startsWith = (value: string, prefix: string): boolean => value.startsWith(prefix)

const endsWith = (value: string, suffix: string): boolean => value.endsWith(suffix)

const isDigitString = (value: string): boolean => value.length > 0 && /^[0-9]+$/u.test(value)

const splitWhitespace = (value: string): string[] => value.trim().split(/\s+/u).filter(Boolean)

const parseLine = (measureOffset: number, line: string): SusDataLine => {
  const separatorIndex = line.indexOf(':')
  const header = trim(line.slice(1, separatorIndex === -1 ? undefined : separatorIndex))
  const data = separatorIndex === -1 ? '' : trim(line.slice(separatorIndex + 1))
  const headerMeasure = header.slice(0, 3)
  const measure = isDigitString(headerMeasure) ? Number.parseInt(headerMeasure, 10) + measureOffset : measureOffset
  return { header, data, measure }
}

const isCommand = (line: string): boolean => {
  if (line.length < 2) {
    return false
  }
  if (/\d/u.test(line.charAt(1))) {
    return false
  }
  if (line.includes('"')) {
    const lineSplit = splitWhitespace(line)
    if (lineSplit.length < 2) {
      return false
    }
    if (lineSplit[0]?.includes(':')) {
      return false
    }
    const firstQuote = line.indexOf('"')
    const lastQuote = line.lastIndexOf('"')
    return firstQuote !== lastQuote && lastQuote !== -1
  }
  return !line.includes(':')
}

const getBars = (barLengths: ParsedBarLength[], ticksPerBeat: number): ParsedBar[] => {
  const bars: ParsedBar[] = []
  bars.push({
    measure: barLengths[0]?.bar ?? 0,
    ticksPerMeasure: Math.floor((barLengths[0]?.length ?? 4) * ticksPerBeat),
    ticks: 0,
  })

  for (let index = 1; index < barLengths.length; index += 1) {
    const current = barLengths[index]
    const previous = barLengths[index - 1]
    if (!current || !previous) {
      continue
    }

    bars.push({
      measure: current.bar,
      ticksPerMeasure: Math.floor(current.length * ticksPerBeat),
      ticks: Math.floor((current.bar - previous.bar) * previous.length * ticksPerBeat),
    })
  }

  bars.sort((left, right) => left.measure - right.measure)
  return bars
}

const getTicks = (bars: ParsedBar[], measure: number, index: number, total: number): number => {
  let barIndex = 0
  let accumulatedBarTicks = 0

  for (let currentIndex = 0; currentIndex < bars.length; currentIndex += 1) {
    const current = bars[currentIndex]
    if (!current) {
      continue
    }
    if (current.measure > measure) {
      break
    }
    barIndex = currentIndex
    accumulatedBarTicks += current.ticks
  }

  const bar = bars[barIndex]
  if (!bar) {
    return 0
  }

  return accumulatedBarTicks
    + ((measure - bar.measure) * bar.ticksPerMeasure)
    + Math.floor((index * bar.ticksPerMeasure) / total)
}

const getNoteStream = (stream: ParsedSlideNote[]): ParsedSlideNote[][] => {
  const sorted = [...stream].sort((left, right) =>
    left.tick === right.tick ? left.sourceOrder - right.sourceOrder : left.tick - right.tick,
  )

  const result: ParsedSlideNote[][] = []
  let current: ParsedSlideNote[] = []
  let newSlide = true

  for (const note of sorted) {
    if (newSlide) {
      current = []
      newSlide = false
    }

    current.push(note)
    if (note.type === 2) {
      result.push(current)
      newSlide = true
    }
  }

  return result
}

const noteKey = (note: { tick: number; lane: number }): string => `${note.tick}-${note.lane}`

const getPositionText = (measure: number, slotIndex: number, slotTotal: number): string => {
  if (slotIndex === 0) {
    return `第 ${measure} 小节 开头`
  }

  const divisor = gcd(slotIndex, slotTotal)
  const numerator = slotIndex / divisor
  const denominator = slotTotal / divisor
  return `第 ${measure} 小节 ${numerator}/${denominator}`
}

const getTrackText = (lane: number, width: number): string => {
  const start = lane + 1
  const end = lane + width
  return width > 1 ? `轨道 ${start}-${end}` : `轨道 ${start}`
}

const noteKindLabel = (note: AuditNote): string => {
  if (note.type === 'hold') {
    return 'Hold 起点'
  }
  if (note.type === 'holdMid') {
    return 'Hold 中继'
  }
  if (note.type === 'holdEnd') {
    if (note.flick) {
      return 'Hold Flick 终点'
    }
    return 'Hold 终点'
  }
  if (note.friction) {
    return note.critical ? 'Critical Trace' : 'Trace'
  }
  if (note.flick !== 'none') {
    return note.critical ? 'Critical Flick' : 'Flick'
  }
  if (note.critical) {
    return 'Critical Tap'
  }
  return 'Tap'
}

const parseSusTextForAudit = (content: string): ParsedSus => {
  let ticksPerBeat = 480
  let measureOffset = 0
  let nextSourceOrder = 0
  const barlengths: ParsedBarLength[] = []
  const noteLines: SusDataLine[] = []

  const lines = content.split(/\r?\n/u)
  for (const rawLine of lines) {
    const line = trim(rawLine)
    if (!startsWith(line, '#')) {
      continue
    }

    if (isCommand(line)) {
      const keyPos = line.indexOf(' ')
      if (keyPos === -1) {
        continue
      }
      const key = line.slice(1, keyPos).toUpperCase()
      const value = line.slice(keyPos + 1)

      if (key === 'MEASUREBS') {
        measureOffset = Number.parseInt(value, 10) || 0
      } else if (key === 'REQUEST') {
        const requestArgs = splitWhitespace(value.split('"').join(''))
        if (requestArgs[0] === 'ticks_per_beat') {
          ticksPerBeat = Number.parseInt(requestArgs[1] ?? '480', 10) || 480
        }
      }
      continue
    }

    const parsedLine = parseLine(measureOffset, line)
    if (parsedLine.header.length !== 5 && parsedLine.header.length !== 6) {
      continue
    }

    if (endsWith(parsedLine.header, '02') && isDigitString(parsedLine.header)) {
      barlengths.push({
        bar: parsedLine.measure,
        length: Number.parseFloat(parsedLine.data) || 4,
      })
      continue
    }

    noteLines.push(parsedLine)
  }

  if (barlengths.length === 0) {
    barlengths.push({ bar: 0, length: 4 })
  }

  const bars = getBars(barlengths, ticksPerBeat)
  const sus: ParsedSus = {
    taps: [],
    directionals: [],
    slides: [],
    guides: [],
    barlengths,
  }

  const slideStreams = new Map<number, ParsedSlideNote[]>()
  const guideStreams = new Map<number, ParsedSlideNote[]>()

  const appendNotes = (line: SusDataLine): ParsedSusNote[] => {
    const notes: ParsedSusNote[] = []
    for (let index = 0; index + 1 < line.data.length; index += 2) {
      if (line.data[index] === '0' && line.data[index + 1] === '0') {
        continue
      }

      notes.push({
        tick: getTicks(bars, line.measure, index, line.data.length),
        measure: line.measure,
        slotIndex: index,
        slotTotal: line.data.length,
        bar: line.measure + index / line.data.length,
        lane: Number.parseInt(line.header.slice(4, 5), 36),
        width: Number.parseInt(line.data.slice(index + 1, index + 2), 36),
        type: Number.parseInt(line.data.slice(index, index + 1), 36),
        sourceOrder: nextSourceOrder++,
      })
    }
    return notes
  }

  for (const line of noteLines) {
    const { header } = line
    if (header.length === 5 && header[3] === '1') {
      sus.taps.push(...appendNotes(line))
      continue
    }
    if (header.length === 5 && header[3] === '5') {
      sus.directionals.push(...appendNotes(line))
      continue
    }
    if (header.length === 6 && header[3] === '3') {
      const channel = Number.parseInt(header.slice(5, 6), 36)
      const stream = slideStreams.get(channel) ?? []
      stream.push(...appendNotes(line))
      slideStreams.set(channel, stream)
      continue
    }
    if (header.length === 6 && header[3] === '9') {
      const channel = Number.parseInt(header.slice(5, 6), 36)
      const stream = guideStreams.get(channel) ?? []
      stream.push(...appendNotes(line))
      guideStreams.set(channel, stream)
    }
  }

  for (const stream of slideStreams.values()) {
    sus.slides.push(...getNoteStream(stream))
  }
  for (const stream of guideStreams.values()) {
    sus.guides.push(...getNoteStream(stream))
  }

  return sus
}

const notesOverlapWithSharedSide = (left: AuditNote, right: AuditNote): boolean => {
  if (left.tick !== right.tick) {
    return false
  }

  const leftStart = left.lane
  const leftEnd = left.lane + left.width
  const rightStart = right.lane
  const rightEnd = right.lane + right.width
  return leftStart < rightEnd && rightStart < leftEnd && (leftStart === rightStart || leftEnd === rightEnd)
}

const sortHoldSteps = (score: AuditScore, hold: HoldNote): void => {
  hold.steps.sort((left, right) => {
    const leftNote = score.notes.get(left.id)
    const rightNote = score.notes.get(right.id)
    if (!leftNote || !rightNote) {
      return 0
    }
    return leftNote.tick === rightNote.tick ? leftNote.lane - rightNote.lane : leftNote.tick - rightNote.tick
  })
}

const isTapCandidateForOverlapDedup = (note: AuditNote): boolean => note.type === 'tap' && !note.friction

const isVisibleHoldMid = (
  score: AuditScore,
  holdStepTypesById: Map<number, HoldStepType>,
  note: AuditNote,
): boolean => {
  if (note.type !== 'holdMid') {
    return false
  }
  const hold = score.holdNotes.get(note.parentId)
  if (!hold || hold.startType === 'guide' || hold.endType === 'guide') {
    return false
  }
  return holdStepTypesById.get(note.id) === 'normal'
}

const isVisibleHoldStart = (score: AuditScore, note: AuditNote): boolean => {
  if (note.type !== 'hold') {
    return false
  }
  return score.holdNotes.get(note.id)?.startType === 'normal'
}

const isVisibleNote = (score: AuditScore, holdStepTypesById: Map<number, HoldStepType>, note: AuditNote): boolean => {
  if (note.type === 'tap') {
    return true
  }
  if (note.type === 'hold') {
    return score.holdNotes.get(note.id)?.startType === 'normal'
  }
  if (note.type === 'holdEnd') {
    return score.holdNotes.get(note.parentId)?.endType === 'normal'
  }
  if (note.type === 'holdMid') {
    const hold = score.holdNotes.get(note.parentId)
    return Boolean(hold && hold.startType !== 'guide' && hold.endType !== 'guide' && holdStepTypesById.get(note.id) === 'normal')
  }
  return false
}

const makeDiagnostic = (
  category: ConflictDiagnostic['category'],
  severity: ConflictDiagnostic['severity'],
  target: AuditNote,
  source: AuditNote,
  title: string,
  summary: string,
): ConflictDiagnostic => ({
  id: `${category}-${source.id}-${target.id}`,
  category,
  severity,
  title,
  summary,
  measure: target.measure,
  positionText: getPositionText(target.measure, target.slotIndex, target.slotTotal),
  trackText: getTrackText(target.lane, target.width),
  markers: [
    {
      id: `source-${source.id}`,
      role: 'source',
      label: source.id === target.id ? '当前音符' : `保留: ${noteKindLabel(source)}`,
      bar: source.bar,
      susLane: source.susLane,
      width: source.width,
    },
    {
      id: `target-${target.id}`,
      role: source.id === target.id ? 'source' : 'suppressed',
      label: source.id === target.id ? noteKindLabel(target) : `被隐藏: ${noteKindLabel(target)}`,
      bar: target.bar,
      susLane: target.susLane,
      width: target.width,
    },
  ],
  sortTick: target.tick,
  sortLane: target.lane,
})

const makeSlideNodeDiagnostic = (
  category: ConflictDiagnostic['category'],
  first: ParsedSlideNote,
  second: ParsedSlideNote,
  title: string,
  summary: string,
): ConflictDiagnostic => ({
  id: `${category}-${first.sourceOrder}-${second.sourceOrder}`,
  category,
  severity: 'crash',
  title,
  summary,
  measure: first.measure,
  positionText: getPositionText(first.measure, first.slotIndex, first.slotTotal),
  trackText: getTrackText(first.lane - 2, first.width),
  markers: [
    {
      id: `first-${first.sourceOrder}`,
      role: 'source',
      label: '节点 A',
      bar: first.bar,
      susLane: first.lane,
      width: first.width,
    },
    {
      id: `second-${second.sourceOrder}`,
      role: 'suppressed',
      label: '节点 B',
      bar: second.bar,
      susLane: second.lane,
      width: second.width,
    },
  ],
  sortTick: first.tick,
  sortLane: first.lane - 2,
})

const buildAuditScore = (sus: ParsedSus): { score: AuditScore; diagnostics: ConflictDiagnostic[] } => {
  const score: AuditScore = {
    notes: new Map<number, AuditNote>(),
    holdNotes: new Map<number, HoldNote>(),
  }
  const diagnostics: ConflictDiagnostic[] = []

  let nextId = 1

  const flicks = new Map<string, FlickType>()
  const criticals = new Set<string>()
  const stepIgnore = new Set<string>()
  const easeIns = new Set<string>()
  const easeOuts = new Set<string>()
  const slideKeys = new Set<string>()
  const frictions = new Set<string>()
  const hiddenHolds = new Set<string>()

  const crashDiagnosticIds = new Set<string>()

  for (const slide of sus.slides) {
    const relayNodes = slide
      .filter((note) => note.type === 3 || note.type === 5)
      .sort((left, right) =>
        left.tick === right.tick ? left.sourceOrder - right.sourceOrder : left.tick - right.tick,
      )

    for (let index = 0; index < relayNodes.length - 1; index += 1) {
      const current = relayNodes[index]
      const next = relayNodes[index + 1]
      if (!current || !next || current.tick !== next.tick) {
        continue
      }

      const diagnostic = makeSlideNodeDiagnostic(
        'hold_relay_same_time',
        current,
        next,
        '会导致本家预览崩溃：同一长条中继点同刻',
        '同一根长条上存在两个处于完全同一时间的中继点，不管可见还是不可见，都可能让本家预览直接崩溃。',
      )
      if (!crashDiagnosticIds.has(diagnostic.id)) {
        crashDiagnosticIds.add(diagnostic.id)
        diagnostics.push(diagnostic)
      }
    }
  }

  const holdNodes = sus.slides.flatMap((slide, holdIndex) =>
    slide.map((note) => ({
      ...note,
      holdIndex,
    })),
  )

  for (let leftIndex = 0; leftIndex < holdNodes.length; leftIndex += 1) {
    const left = holdNodes[leftIndex]
    if (!left) {
      continue
    }

    for (let rightIndex = leftIndex + 1; rightIndex < holdNodes.length; rightIndex += 1) {
      const right = holdNodes[rightIndex]
      if (!right || left.holdIndex === right.holdIndex) {
        continue
      }

      const samePosition =
        left.tick === right.tick
        && left.lane === right.lane
        && left.width === right.width

      if (!samePosition) {
        continue
      }

      const first = left.sourceOrder <= right.sourceOrder ? left : right
      const second = left.sourceOrder <= right.sourceOrder ? right : left
      const diagnostic = makeSlideNodeDiagnostic(
        'hold_node_exact_overlap',
        first,
        second,
        '会导致本家预览崩溃：不同长条节点完全重合',
        '两根不同长条的节点在同一时间、同一轨道范围完全重合，这类写法可能让本家预览直接崩溃。',
      )
      if (!crashDiagnosticIds.has(diagnostic.id)) {
        crashDiagnosticIds.add(diagnostic.id)
        diagnostics.push(diagnostic)
      }
    }
  }

  for (const slide of sus.slides) {
    for (const note of slide) {
      if (note.type === 1 || note.type === 2 || note.type === 3 || note.type === 5) {
        slideKeys.add(noteKey(note))
      }
    }
  }

  for (const directional of sus.directionals) {
    const key = noteKey(directional)
    switch (directional.type) {
      case 1:
        flicks.set(key, 'default')
        break
      case 3:
        flicks.set(key, 'left')
        break
      case 4:
        flicks.set(key, 'right')
        break
      case 2:
        easeIns.add(key)
        break
      case 5:
      case 6:
        easeOuts.add(key)
        break
      default:
        break
    }
  }

  for (const tap of sus.taps) {
    const key = noteKey(tap)
    switch (tap.type) {
      case 2:
        criticals.add(key)
        break
      case 3:
        stepIgnore.add(key)
        break
      case 5:
        frictions.add(key)
        break
      case 6:
        criticals.add(key)
        frictions.add(key)
        break
      case 7:
        hiddenHolds.add(key)
        break
      case 8:
        hiddenHolds.add(key)
        criticals.add(key)
        break
      default:
        break
    }
  }

  const shouldDropOverlappedTap = (candidate: AuditNote): AuditNote | null => {
    if (!isTapCandidateForOverlapDedup(candidate)) {
      return null
    }

    const candidateLeft = candidate.lane
    const candidateRight = candidate.lane + candidate.width
    for (const existing of score.notes.values()) {
      if (!isTapCandidateForOverlapDedup(existing)) {
        continue
      }
      if (existing.tick !== candidate.tick) {
        continue
      }
      const existingLeft = existing.lane
      const existingRight = existing.lane + existing.width
      const overlaps = candidateLeft < existingRight && existingLeft < candidateRight
      const sameSide = candidateLeft === existingLeft || candidateRight === existingRight
      if (overlaps && sameSide) {
        return existing
      }
    }
    return null
  }

  for (const tap of sus.taps) {
    if (tap.type === 7 || tap.type === 8) {
      continue
    }
    if (tap.lane - 2 < MIN_LANE || tap.lane - 2 > MAX_LANE) {
      continue
    }

    const key = noteKey(tap)
    if (slideKeys.has(key)) {
      continue
    }

    const note: AuditNote = {
      id: nextId++,
      type: 'tap',
      parentId: -1,
      tick: tap.tick,
      lane: tap.lane - 2,
      susLane: tap.lane,
      width: tap.width,
      critical: criticals.has(key),
      friction: frictions.has(key),
      flick: flicks.get(key) ?? 'none',
      sourceOrder: tap.sourceOrder,
      measure: tap.measure,
      slotIndex: tap.slotIndex,
      slotTotal: tap.slotTotal,
      bar: tap.bar,
    }

    const keeper = shouldDropOverlappedTap(note)
    if (keeper) {
      diagnostics.push(
        makeDiagnostic(
          'tap_overlap',
          'dedup',
          note,
          keeper,
          '同刻重叠音符被忽略',
          `${noteKindLabel(note)} 与更早出现的 ${noteKindLabel(keeper)} 在同一时刻共享边界重叠，按本家预览的规则会被忽略。`,
        ),
      )
      continue
    }

    score.notes.set(note.id, note)
  }

  const fillSlides = (slides: ParsedSlideNote[][], isGuide: boolean): void => {
    for (const slide of slides) {
      if (slide.length < 2) {
        continue
      }

      const start = slide.find((note) => note.type === 1 || note.type === 2)
      if (!start) {
        continue
      }

      const critical = criticals.has(noteKey(slide[0] ?? start))
      const hold: HoldNote = {
        start: { id: 0, type: 'normal' },
        steps: [],
        end: 0,
        startType: 'normal',
        endType: 'normal',
      }
      const startId = nextId++
      hold.steps = []

      for (const susNote of slide) {
        const key = noteKey(susNote)
        const ease = easeIns.has(key) ? 'easeIn' : easeOuts.has(key) ? 'easeOut' : 'linear'
        void ease

        switch (susNote.type) {
          case 1: {
            const note: AuditNote = {
              id: startId,
              type: 'hold',
              parentId: -1,
              tick: susNote.tick,
              lane: susNote.lane - 2,
              susLane: susNote.lane,
              width: susNote.width,
              critical,
              friction: !isGuide && frictions.has(key),
              flick: 'none',
              sourceOrder: susNote.sourceOrder,
              measure: susNote.measure,
              slotIndex: susNote.slotIndex,
              slotTotal: susNote.slotTotal,
              bar: susNote.bar,
            }

            hold.startType = isGuide ? 'guide' : hiddenHolds.has(key) ? 'hidden' : 'normal'
            score.notes.set(note.id, note)
            hold.start = { id: note.id, type: 'normal' }
            break
          }

          case 2: {
            const note: AuditNote = {
              id: nextId++,
              type: 'holdEnd',
              parentId: startId,
              tick: susNote.tick,
              lane: susNote.lane - 2,
              susLane: susNote.lane,
              width: susNote.width,
              critical: critical || criticals.has(key),
              friction: !isGuide && frictions.has(key),
              flick: isGuide ? 'none' : flicks.get(key) ?? 'none',
              sourceOrder: susNote.sourceOrder,
              measure: susNote.measure,
              slotIndex: susNote.slotIndex,
              slotTotal: susNote.slotTotal,
              bar: susNote.bar,
            }

            hold.endType = isGuide ? 'guide' : hiddenHolds.has(key) && note.flick === 'none' ? 'hidden' : 'normal'
            score.notes.set(note.id, note)
            hold.end = note.id
            break
          }

          case 3:
          case 5: {
            const stepType: HoldStepType =
              susNote.type === 3
                ? stepIgnore.has(key) ? 'skip' : 'normal'
                : 'hidden'

            const note: AuditNote = {
              id: nextId++,
              type: 'holdMid',
              parentId: startId,
              tick: susNote.tick,
              lane: susNote.lane - 2,
              susLane: susNote.lane,
              width: susNote.width,
              critical,
              friction: false,
              flick: 'none',
              sourceOrder: susNote.sourceOrder,
              measure: susNote.measure,
              slotIndex: susNote.slotIndex,
              slotTotal: susNote.slotTotal,
              bar: susNote.bar,
            }

            score.notes.set(note.id, note)
            hold.steps.push({ id: note.id, type: stepType })
            break
          }

          default:
            break
        }
      }

      if (hold.start.id && hold.end) {
        sortHoldSteps(score, hold)
        score.holdNotes.set(startId, hold)
      }
    }
  }

  fillSlides(sus.slides, false)
  fillSlides(sus.guides, true)

  const buildHoldStepTypes = (): Map<number, HoldStepType> => {
    const holdStepTypesById = new Map<number, HoldStepType>()
    for (const hold of score.holdNotes.values()) {
      for (const step of hold.steps) {
        holdStepTypesById.set(step.id, step.type)
      }
    }
    return holdStepTypesById
  }

  {
    const holdStepTypesById = buildHoldStepTypes()
    const noteIds = [...score.notes.keys()]
    const removedTapIds = new Set<number>()

    for (const sourceId of noteIds) {
      const source = score.notes.get(sourceId)
      if (!source) {
        continue
      }
      const visibleMid = isVisibleHoldMid(score, holdStepTypesById, source)
      const visibleStart = isVisibleHoldStart(score, source)
      if ((!visibleMid && !visibleStart) || source.friction) {
        continue
      }

      for (const targetId of noteIds) {
        if (sourceId === targetId) {
          continue
        }
        const target = score.notes.get(targetId)
        if (!target || !notesOverlapWithSharedSide(source, target)) {
          continue
        }

        const shouldSuppress = visibleMid
          ? target.type === 'holdEnd' || target.flick !== 'none' || target.friction
          : target.flick !== 'none'
        if (!shouldSuppress) {
          continue
        }

        diagnostics.push(
        makeDiagnostic(
          'hold_coverage',
          'dedup',
          target,
          source,
          'Hold 覆盖了同刻音符',
          `${noteKindLabel(source)} 在同一时刻覆盖了 ${noteKindLabel(target)}，后者会被隐藏。`,
        ),
      )

        if (target.type === 'tap') {
          removedTapIds.add(target.id)
        } else if (target.type === 'holdEnd') {
          const hold = score.holdNotes.get(target.parentId)
          if (hold && hold.endType === 'normal') {
            hold.endType = 'hidden'
          }
        }
      }
    }

    for (const removedId of removedTapIds) {
      score.notes.delete(removedId)
    }
  }

  {
    const holdStepTypesById = buildHoldStepTypes()
    const noteIds = [...score.notes.keys()].sort((leftId, rightId) => {
      const left = score.notes.get(leftId)
      const right = score.notes.get(rightId)
      if (!left || !right) {
        return 0
      }
      if (left.tick !== right.tick) {
        return left.tick - right.tick
      }
      if (left.sourceOrder !== right.sourceOrder) {
        return left.sourceOrder - right.sourceOrder
      }
      return left.id - right.id
    })

    const keptIds: number[] = []
    for (const noteId of noteIds) {
      const note = score.notes.get(noteId)
      if (!note || !isVisibleNote(score, holdStepTypesById, note)) {
        continue
      }

      let keeper: AuditNote | null = null
      for (const keptId of keptIds) {
        const kept = score.notes.get(keptId)
        if (!kept || !isVisibleNote(score, holdStepTypesById, kept)) {
          continue
        }

        const keptIsSolidTrace = kept.type === 'tap' && kept.friction
        const noteIsSolidTrace = note.type === 'tap' && note.friction
        if (keptIsSolidTrace && noteIsSolidTrace) {
          if (kept.tick !== note.tick) {
            continue
          }
          const keptLeft = kept.lane
          const keptRight = kept.lane + kept.width
          const noteLeft = note.lane
          const noteRight = note.lane + note.width
          const overlaps = keptLeft < noteRight && noteLeft < keptRight
          if (overlaps && keptLeft === noteLeft) {
            keeper = kept
            break
          }
          continue
        }
        if ((kept.friction || note.friction) && !(keptIsSolidTrace && noteIsSolidTrace)) {
          continue
        }
        if (keptIsSolidTrace !== noteIsSolidTrace && (keptIsSolidTrace || noteIsSolidTrace)) {
          continue
        }
        if (notesOverlapWithSharedSide(kept, note)) {
          keeper = kept
          break
        }
      }

      if (!keeper) {
        keptIds.push(noteId)
        continue
      }

      diagnostics.push(
        makeDiagnostic(
          'visible_overlap',
          'dedup',
          note,
          keeper,
          '最终可见判重隐藏了音符',
          `${noteKindLabel(note)} 与更早出现的 ${noteKindLabel(keeper)} 同刻共享边界重叠，最终显示时会被隐藏。`,
        ),
      )

      if (note.type === 'tap') {
        score.notes.delete(note.id)
        continue
      }
      if (note.type === 'hold') {
        const hold = score.holdNotes.get(note.id)
        if (hold) {
          hold.startType = 'hidden'
        }
        continue
      }
      if (note.type === 'holdEnd') {
        const hold = score.holdNotes.get(note.parentId)
        if (hold) {
          hold.endType = 'hidden'
        }
        continue
      }
      if (note.type === 'holdMid') {
        const hold = score.holdNotes.get(note.parentId)
        if (hold) {
          const step = hold.steps.find((item) => item.id === note.id)
          if (step) {
            step.type = 'hidden'
          }
        }
      }
    }
  }

  diagnostics.sort((left, right) => {
    if (left.severity !== right.severity) {
      return left.severity === 'crash' ? -1 : 1
    }
    return left.sortTick === right.sortTick ? left.sortLane - right.sortLane : left.sortTick - right.sortTick
  })

  return { score, diagnostics }
}

const parseRebaseJson = (text: string): Record<string, unknown> => {
  if (!text.trim()) {
    return {}
  }
  const parsed = JSON.parse(text)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('rebase.json 必须是对象')
  }
  return parsed as Record<string, unknown>
}

export const analyzeSusConflicts = (susText: string): ConflictDiagnostic[] => {
  const parsed = parseSusTextForAudit(susText)
  const { diagnostics } = buildAuditScore(parsed)
  return diagnostics
}

export const buildRenderOverlayContext = (
  susText: string,
  rebaseText: string,
  timeHeight: number,
): RenderOverlayContext => {
  const parsedScore = parseSusText(susText)
  const rebasedScore = rebaseText.trim() ? applyRebase(parsedScore, parseRebaseJson(rebaseText)) : parsedScore
  const score = rebasedScore as RenderOverlayContext['score']

  if (!score.notes.length) {
    throw new Error('谱面中没有可渲染的音符')
  }

  const sentenceLayouts: RenderSentenceLayout[] = []
  const nBars = Math.ceil(score.notes[score.notes.length - 1]?.bar.toNumber() ?? 0)

  let barStart = 0
  let totalWidth = 0
  let totalHeight = 0
  let previousSection: string | null = null
  let previousSentenceLength = 4

  for (let bar = 0; bar <= nBars; bar += 1) {
    const currentEvent = score.getEvent(bar)
    const currentSection = currentEvent.section ?? null
    const currentSentenceLength = currentEvent.sentenceLength || 4

    if (
      barStart !== bar
      && (
        currentSection !== previousSection
        || currentSentenceLength !== previousSentenceLength
        || bar === barStart + previousSentenceLength
        || bar === nBars
      )
    ) {
      const width = Math.round(DEFAULT_LANE_WIDTH * DEFAULT_N_LANES + DEFAULT_LANE_PADDING * 2)
      const height = Math.round(timeHeight * score.getTimeDelta(barStart, bar) + DEFAULT_TIME_PADDING * 2)
      sentenceLayouts.push({
        barStart,
        barStop: bar,
        width,
        height,
        tx: totalWidth + DEFAULT_LANE_PADDING,
        ty: 0,
      })
      totalWidth += width
      totalHeight = Math.max(totalHeight, height)
      barStart = bar
    }

    previousSection = currentSection
    previousSentenceLength = currentSentenceLength
  }

  for (const sentence of sentenceLayouts) {
    sentence.ty = totalHeight - sentence.height + DEFAULT_TIME_PADDING
  }

  return {
    score,
    laneWidth: DEFAULT_LANE_WIDTH,
    lanePadding: DEFAULT_LANE_PADDING,
    timePadding: DEFAULT_TIME_PADDING,
    timeHeight,
    nLanes: DEFAULT_N_LANES,
    totalHeight,
    sentenceLayouts,
  }
}

const escapeXml = (value: string): string =>
  value
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')

export const annotateSvgWithConflict = (
  svgText: string,
  context: RenderOverlayContext,
  diagnostic: ConflictDiagnostic | null,
): string => {
  if (!diagnostic) {
    return svgText
  }

  const focusMarker = diagnostic.markers.find((marker) => marker.role === 'suppressed') ?? diagnostic.markers[0] ?? null

  const markers = diagnostic.markers
    .map((marker, index) => {
      const sentence = context.sentenceLayouts.find(
        (item) => item.barStart - 1 <= marker.bar && marker.bar < item.barStop + 1,
      )
      if (!sentence) {
        return ''
      }

      const cx = sentence.tx + context.laneWidth * (marker.susLane - 2 + marker.width / 2) + context.lanePadding
      const cy = sentence.ty + context.timeHeight * context.score.getTimeDelta(marker.bar, sentence.barStop) + context.timePadding
      const color = marker.role === 'suppressed' ? '#ef4444' : marker.role === 'source' ? '#f59e0b' : '#14b8a6'
      const labelY = cy - 18 - index * 18

      return [
        `<circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${Math.max(10, 8 + marker.width * 2)}" fill="${color}" fill-opacity="0.16" stroke="${color}" stroke-width="3" />`,
        `<circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="4" fill="${color}" />`,
        `<line x1="${cx.toFixed(3)}" y1="${cy.toFixed(3)}" x2="${cx.toFixed(3)}" y2="${labelY.toFixed(3)}" stroke="${color}" stroke-width="2" stroke-dasharray="4 3" />`,
        `<text x="${cx.toFixed(3)}" y="${labelY.toFixed(3)}" text-anchor="middle" font-size="16" font-weight="700" fill="${color}" stroke="#ffffff" stroke-width="4" paint-order="stroke fill">${escapeXml(marker.label)}</text>`,
      ].join('')
    })
    .filter(Boolean)
    .join('')

  const focusAnchor = (() => {
    if (!focusMarker) {
      return ''
    }

    const sentence = context.sentenceLayouts.find(
      (item) => item.barStart - 1 <= focusMarker.bar && focusMarker.bar < item.barStop + 1,
    )
    if (!sentence) {
      return ''
    }

    const cx = sentence.tx + context.laneWidth * (focusMarker.susLane - 2 + focusMarker.width / 2) + context.lanePadding
    const cy = sentence.ty + context.timeHeight * context.score.getTimeDelta(focusMarker.bar, sentence.barStop) + context.timePadding
    return `<circle id="sus-conflict-focus" cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="1" fill="transparent" />`
  })()

  if (!markers) {
    return svgText
  }

  const overlay = `<g id="sus-conflict-overlay">${focusAnchor}${markers}</g>`
  const closingTag = '</svg>'
  const index = svgText.lastIndexOf(closingTag)
  if (index === -1) {
    return svgText
  }
  return `${svgText.slice(0, index)}${overlay}${svgText.slice(index)}`
}
