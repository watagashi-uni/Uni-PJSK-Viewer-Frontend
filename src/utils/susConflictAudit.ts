import { applyRebase } from '@/vendor/sekai-sus2img/rebase'
import { parseSusText } from '@/vendor/sekai-sus2img/parser'

type FlickType = 'none' | 'default' | 'left' | 'right'

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
  importLane: number
  width: number
  type: number
  longNo: number
  laneType: number
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
  rawNotes: ParsedSusNote[]
  taps: ParsedSusNote[]
  directionals: ParsedSusNote[]
  slides: ParsedSlideNote[][]
  guides: ParsedSlideNote[][]
  barlengths: ParsedBarLength[]
}

type ParsedHoldNode = ParsedSlideNote & {
  holdIndex: number
  isGuide: boolean
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
  category:
    | 'tap_overlap'
    | 'hold_coverage'
    | 'visible_overlap'
    | 'hold_relay_same_time'
    | 'hold_node_exact_overlap'
    | 'import_slot_merge'
    | 'single_note_cleanup'
    | 'ambiguous_overlap'
  severity: 'dedup' | 'crash' | 'render_bug'
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

const getImportLane = (laneNo: string): number => {
  switch (laneNo) {
    case '2': return 0
    case '3': return 1
    case '4': return 2
    case '5': return 3
    case '6': return 4
    case '7': return 5
    case '8': return 6
    case '9': return 7
    case 'a': return 8
    case 'b': return 9
    case 'c': return 10
    case 'd': return 11
    case 'f': return 13
    case 'e': return -2
    default: return -1
  }
}

const parseSusHexDigit = (value: string): number => /^[0-9a-f]$/u.test(value) ? Number.parseInt(value, 16) : -1

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
    if (
      (parsedLine.header.length !== 5 && parsedLine.header.length !== 6)
      || !isDigitString(parsedLine.header.slice(0, 3))
    ) {
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
    rawNotes: [],
    taps: [],
    directionals: [],
    slides: [],
    guides: [],
    barlengths,
  }

  const slideStreams = new Map<number, ParsedSlideNote[]>()
  const guideStreams = new Map<number, ParsedSlideNote[]>()

  const appendNotes = (line: SusDataLine, laneType: number, longNo: number): ParsedSusNote[] => {
    const notes: ParsedSusNote[] = []
    for (let index = 0; index + 1 < line.data.length; index += 2) {
      if (line.data[index] === '0' && line.data[index + 1] === '0') {
        continue
      }

      const sourceOrder = nextSourceOrder++
      const laneChar = line.header.slice(4, 5).toLowerCase()
      notes.push({
        tick: getTicks(bars, line.measure, index, line.data.length),
        measure: line.measure,
        slotIndex: index,
        slotTotal: line.data.length,
        bar: line.measure + index / line.data.length,
        lane: Number.parseInt(laneChar, 36),
        importLane: getImportLane(laneChar),
        width: Number.parseInt(line.data.slice(index + 1, index + 2), 36),
        type: Number.parseInt(line.data.slice(index, index + 1), 36),
        longNo,
        laneType,
        sourceOrder,
      })
    }
    sus.rawNotes.push(...notes)
    return notes
  }

  for (const line of noteLines) {
    const { header } = line
    if (header.length === 5 && header[3] === '1') {
      sus.taps.push(...appendNotes(line, 1, -1))
      continue
    }
    if (header.length === 5 && header[3] === '5') {
      sus.directionals.push(...appendNotes(line, 5, -1))
      continue
    }
    if (header.length === 6 && header[3] === '3') {
      const channel = parseSusHexDigit(header.slice(5, 6).toLowerCase())
      const stream = slideStreams.get(channel) ?? []
      stream.push(...appendNotes(line, 3, channel))
      slideStreams.set(channel, stream)
      continue
    }
    if (header.length === 6 && header[3] === '9') {
      const channel = parseSusHexDigit(header.slice(5, 6).toLowerCase())
      const stream = guideStreams.get(channel) ?? []
      stream.push(...appendNotes(line, 9, channel))
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

const makeSlideNodeDiagnostic = (
  category: ConflictDiagnostic['category'],
  first: ParsedSlideNote | ParsedHoldNode,
  second: ParsedSlideNote | ParsedHoldNode,
  title: string,
  summary: string,
  severity: ConflictDiagnostic['severity'] = 'crash',
): ConflictDiagnostic => ({
  id: `${category}-${first.sourceOrder}-${second.sourceOrder}`,
  category,
  severity,
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

type ImportCategory =
  | 'Normal'
  | 'Long'
  | 'Connection'
  | 'Flick'
  | 'Friction'
  | 'FrictionHide'
  | 'FrictionLong'
  | 'FrictionHideLong'
  | 'FrictionFlick'
  | 'Guide'
  | 'GuideEnd'
  | 'GuideHidden'
  | 'Hidden'
  | 'Skip'

type ImportNoteInfo = {
  bar: number
  barProgress: number
  tick: number
  importLane: number
  width: number
  category: ImportCategory
  critical: boolean
  flick: FlickType
  lineType: 'linear' | 'easeIn' | 'easeOut'
  speedRatio: number
  longNo: number
  isSkip: boolean
  source: ParsedSusNote
  updateSources: ParsedSusNote[]
  guideDict: boolean
}

type ImportDictionary = Map<string, ImportNoteInfo>

const importSlotKey = (note: { tick: number; importLane: number }): string => `${note.tick}:${note.importLane}`

const importCategoryLabel = (category: ImportCategory): string => {
  switch (category) {
    case 'Long': return 'Hold 头'
    case 'Connection': return 'Hold 可视中继'
    case 'Hidden': return 'Hold 隐藏中继'
    case 'Guide': return 'Guide 头'
    case 'GuideEnd': return 'Guide 尾'
    case 'GuideHidden': return 'Guide 隐藏节点'
    case 'Flick': return 'Flick'
    case 'Friction': return 'Trace'
    case 'FrictionHide': return 'Hidden Trace'
    case 'FrictionLong': return 'Trace Hold'
    case 'FrictionHideLong': return 'Hidden Trace Hold'
    case 'FrictionFlick': return 'Trace Flick'
    case 'Skip': return 'Skip 标记'
    default: return 'Tap'
  }
}

const noteInfoLabel = (note: ImportNoteInfo): string => {
  const critical = note.critical ? 'Critical ' : ''
  return `${critical}${importCategoryLabel(note.category)}`
}

const parsedNoteLabel = (note: ParsedSusNote, category: ImportCategory): string => {
  const critical =
    (note.laneType === 1 && (note.type === 2 || note.type === 6 || note.type === 8))
      ? 'Critical '
      : ''
  return `${critical}${importCategoryLabel(category)}`
}

const isGuideCategory = (category: ImportCategory): boolean =>
  category === 'Guide' || category === 'GuideEnd' || category === 'GuideHidden'

const isLongOrGuideStructural = (category: ImportCategory): boolean =>
  category === 'Long'
  || category === 'Connection'
  || category === 'Hidden'
  || category === 'Guide'
  || category === 'GuideEnd'
  || category === 'GuideHidden'
  || category === 'FrictionLong'
  || category === 'FrictionHideLong'

const isSingleCleanupCategory = (category: ImportCategory): boolean =>
  category === 'Hidden'

const isHoldOrGuideEndpoint = (note: ImportNoteInfo): boolean => {
  if (note.guideDict) {
    return false
  }
  if (note.longNo === -1) {
    return false
  }
  return note.category !== 'Connection' && note.category !== 'Hidden' && note.category !== 'Skip'
}

const laneOverlapsInclusive = (
  left: { importLane: number; width: number },
  right: { importLane: number; width: number },
): boolean => {
  const leftStart = Math.max(0, Math.min(11, left.importLane))
  const leftEnd = Math.max(0, Math.min(11, left.importLane + left.width - 1))
  const rightStart = Math.max(0, Math.min(11, right.importLane))
  const rightEnd = Math.max(0, Math.min(11, right.importLane + right.width - 1))
  return Math.min(leftStart, leftEnd) <= Math.max(rightStart, rightEnd)
    && Math.min(rightStart, rightEnd) <= Math.max(leftStart, leftEnd)
}

const makeImportMarker = (
  role: MarkerRole,
  idPrefix: string,
  label: string,
  note: ParsedSusNote | ImportNoteInfo,
): ConflictMarker => {
  const source = 'source' in note ? note.source : note
  const importLane = 'importLane' in note ? note.importLane : source.importLane
  return {
    id: `${idPrefix}-${source.sourceOrder}`,
    role,
    label,
    bar: source.bar,
    susLane: importLane + 2,
    width: 'width' in note ? note.width : source.width,
  }
}

const makeImportDiagnostic = (
  category: ConflictDiagnostic['category'],
  severity: ConflictDiagnostic['severity'],
  target: ParsedSusNote | ImportNoteInfo,
  source: ParsedSusNote | ImportNoteInfo,
  title: string,
  summary: string,
): ConflictDiagnostic => {
  const targetSource = 'source' in target ? target.source : target
  const sourceSource = 'source' in source ? source.source : source
  const targetLane = 'importLane' in target ? target.importLane : targetSource.importLane
  const targetWidth = 'width' in target ? target.width : targetSource.width
  return {
    id: `${category}-${sourceSource.sourceOrder}-${targetSource.sourceOrder}`,
    category,
    severity,
    title,
    summary,
    measure: targetSource.measure,
    positionText: getPositionText(targetSource.measure, targetSource.slotIndex, targetSource.slotTotal),
    trackText: getTrackText(targetLane, targetWidth),
    markers: [
      makeImportMarker('source', 'source', '已存在', source),
      makeImportMarker('suppressed', 'target', '合并/覆盖', target),
    ],
    sortTick: targetSource.tick,
    sortLane: targetLane,
  }
}

const cloneNoteInfo = (note: ImportNoteInfo): ImportNoteInfo => ({
  ...note,
  updateSources: [...note.updateSources],
})

const updateNoteInfo = (current: ImportNoteInfo, incoming: ImportNoteInfo): void => {
  if (incoming.category !== 'Normal') {
    if (incoming.category === 'Long' && current.category === 'Friction') {
      current.category = 'FrictionLong'
    } else if (incoming.category === 'Flick' && current.category === 'Friction') {
      current.category = 'FrictionFlick'
    } else if (incoming.category === 'Long' && current.category === 'FrictionHide') {
      current.category = 'FrictionHideLong'
    } else {
      current.category = incoming.category
    }
  }
  if (incoming.critical) {
    current.critical = true
  }
  if (incoming.flick !== 'none') {
    current.flick = incoming.flick
  }
  if (incoming.lineType !== 'linear') {
    current.lineType = incoming.lineType
  }
  if (incoming.speedRatio !== 1) {
    current.speedRatio = incoming.speedRatio
  }
  if (incoming.longNo !== -1) {
    current.longNo = incoming.longNo
  }
  current.updateSources.push(incoming.source)
}

const shouldReportImportMerge = (current: ImportNoteInfo, incoming: ImportNoteInfo): boolean => {
  if (current.width !== incoming.width) {
    return true
  }
  if (current.longNo !== -1 && incoming.longNo !== -1 && current.longNo !== incoming.longNo) {
    return true
  }
  if (
    isLongOrGuideStructural(current.category)
    && isLongOrGuideStructural(incoming.category)
    && current.category !== 'Skip'
    && incoming.category !== 'Skip'
  ) {
    return true
  }
  return false
}

const importCategoryForSusNote = (note: ParsedSusNote): ImportCategory | null => {
  if (note.longNo === -1 && note.laneType === 1) {
    switch (note.type) {
      case 1:
      case 2: return 'Normal'
      case 3: return 'Skip'
      case 5:
      case 6: return 'Friction'
      case 7:
      case 8: return 'FrictionHide'
      default: return null
    }
  }
  if (note.longNo === -1 && note.laneType === 5) {
    switch (note.type) {
      case 1:
      case 3:
      case 4: return 'Flick'
      case 2:
      case 5:
      case 6: return 'Normal'
      default: return null
    }
  }
  if (note.longNo !== -1 && note.laneType === 3) {
    switch (note.type) {
      case 1: return 'Long'
      case 2: return 'Normal'
      case 3: return 'Connection'
      case 5: return 'Hidden'
      default: return null
    }
  }
  if (note.longNo !== -1 && note.laneType === 9) {
    switch (note.type) {
      case 1: return 'Guide'
      case 2: return 'GuideEnd'
      case 3:
      case 5: return 'GuideHidden'
      default: return null
    }
  }
  return null
}

const importNoteInfoFromSusNote = (note: ParsedSusNote, category: ImportCategory, guideDict: boolean): ImportNoteInfo => {
  const flick: FlickType =
    note.laneType === 5 && note.type === 3
      ? 'left'
      : note.laneType === 5 && note.type === 4
        ? 'right'
        : note.laneType === 5 && note.type === 1
          ? 'default'
          : 'none'
  const lineType =
    note.laneType === 5 && note.type === 2
      ? 'easeIn'
      : note.laneType === 5 && (note.type === 5 || note.type === 6)
        ? 'easeOut'
        : 'linear'
  return {
    bar: note.measure,
    barProgress: note.slotTotal > 0 ? note.slotIndex / note.slotTotal : 0,
    tick: note.tick,
    importLane: note.importLane,
    width: note.width,
    category,
    critical: note.laneType === 1 && (note.type === 2 || note.type === 6 || note.type === 8),
    flick,
    lineType,
    speedRatio: 1,
    longNo: note.longNo,
    isSkip: category === 'Skip',
    source: note,
    updateSources: [note],
    guideDict,
  }
}

const addToImportDictionary = (
  dict: ImportDictionary,
  incoming: ImportNoteInfo,
  diagnostics: ConflictDiagnostic[],
): ImportNoteInfo => {
  const key = importSlotKey(incoming)
  const current = dict.get(key)
  if (!current) {
    dict.set(key, cloneNoteInfo(incoming))
    return incoming
  }

  if (shouldReportImportMerge(current, incoming)) {
    const widthText = current.width !== incoming.width
      ? `；游戏会保留先进入槽位的宽度 ${current.width}，后续宽度 ${incoming.width} 不会重新开一个 note`
      : ''
    const longNoText = current.longNo !== -1 && incoming.longNo !== -1 && current.longNo !== incoming.longNo
      ? `；两个 long/guide channel 分别是 ${current.longNo.toString(16)} 和 ${incoming.longNo.toString(16)}`
      : ''
    diagnostics.push(
      makeImportDiagnostic(
        'import_slot_merge',
        'dedup',
        incoming.source,
        current,
        'SUS 导入槽位合并',
        `${parsedNoteLabel(incoming.source, incoming.category)} 与已存在的 ${noteInfoLabel(current)} 在同一时刻、同一 laneStart 导入槽位，游戏会合并到同一个 NoteInfo，不会生成两个独立 note${widthText}${longNoText}。`,
      ),
    )
  }

  updateNoteInfo(current, incoming)
  return current
}

const applyGuideInheritance = (target: ImportNoteInfo, inherited: ImportNoteInfo | undefined): void => {
  if (!inherited) {
    return
  }
  if (inherited.critical) {
    target.critical = true
  }
  if (inherited.flick !== 'none') {
    target.flick = inherited.flick
  }
  if (inherited.lineType !== 'linear') {
    target.lineType = inherited.lineType
  }
}

const isValidImportNote = (note: ParsedSusNote): boolean =>
  note.width >= 1
  && note.width <= 14
  && note.importLane >= 0
  && note.width + note.importLane < 13

const buildImportDictionaries = (sus: ParsedSus): {
  normalDict: ImportDictionary
  guideDict: ImportDictionary
  diagnostics: ConflictDiagnostic[]
} => {
  const diagnostics: ConflictDiagnostic[] = []
  const normalDict: ImportDictionary = new Map()
  const guideDict: ImportDictionary = new Map()

  const rawNotes = [...sus.rawNotes].sort((left, right) => left.sourceOrder - right.sourceOrder)
  for (const note of rawNotes) {
    if (!isValidImportNote(note)) {
      continue
    }
    const category = importCategoryForSusNote(note)
    if (!category) {
      continue
    }

    if (!isGuideCategory(category)) {
      const normalIncoming = importNoteInfoFromSusNote(note, category, false)
      addToImportDictionary(normalDict, normalIncoming, diagnostics)
    }

    const inherited = normalDict.get(importSlotKey(note))
    if (isGuideCategory(category)) {
      const guideIncoming = importNoteInfoFromSusNote(note, category, true)
      applyGuideInheritance(guideIncoming, inherited)
      addToImportDictionary(guideDict, guideIncoming, diagnostics)
    } else {
      const guideCurrent = guideDict.get(importSlotKey(note))
      if (guideCurrent) {
        const guideUpdate = importNoteInfoFromSusNote(note, category, true)
        if (shouldReportImportMerge(guideCurrent, guideUpdate)) {
          diagnostics.push(
            makeImportDiagnostic(
              'import_slot_merge',
              'dedup',
              guideUpdate.source,
              guideCurrent,
              'Guide 导入槽位被普通 note 更新',
              `${parsedNoteLabel(guideUpdate.source, guideUpdate.category)} 与已存在的 ${noteInfoLabel(guideCurrent)} 位于同一 guide 导入槽位，游戏会更新 guide 的属性，不会生成额外 guide 节点。`,
            ),
          )
        }
        updateNoteInfo(guideCurrent, guideUpdate)
      }
    }
  }

  return { normalDict, guideDict, diagnostics }
}

const findConnectedImportNotes = (notes: ImportNoteInfo[]): Set<ImportNoteInfo> => {
  const connected = new Set<ImportNoteInfo>()
  const byLongNo = new Map<string, ImportNoteInfo[]>()

  for (const note of notes) {
    if (note.longNo === -1) {
      continue
    }
    const key = `${note.guideDict ? 'guide' : 'normal'}:${note.longNo}`
    const list = byLongNo.get(key) ?? []
    list.push(note)
    byLongNo.set(key, list)
  }

  for (const list of byLongNo.values()) {
    const sorted = [...list].sort((left, right) =>
      left.tick === right.tick ? left.source.sourceOrder - right.source.sourceOrder : left.tick - right.tick,
    )
    const hasRoot = sorted.some((note) =>
      note.guideDict ? note.category === 'Guide' : note.category === 'Long' || note.category === 'FrictionLong' || note.category === 'FrictionHideLong',
    )
    if (!hasRoot || sorted.length < 2) {
      continue
    }
    for (const note of sorted) {
      connected.add(note)
    }
  }

  return connected
}

const buildGameImportDiagnostics = (sus: ParsedSus): ConflictDiagnostic[] => {
  const { normalDict, guideDict, diagnostics } = buildImportDictionaries(sus)
  const finalNotes = [...normalDict.values(), ...guideDict.values()]
  const connectedNotes = findConnectedImportNotes(finalNotes)
  const diagnosticIds = new Set(diagnostics.map((diagnostic) => diagnostic.id))

  const pushDiagnostic = (diagnostic: ConflictDiagnostic): void => {
    if (diagnosticIds.has(diagnostic.id)) {
      return
    }
    diagnosticIds.add(diagnostic.id)
    diagnostics.push(diagnostic)
  }

  for (const note of finalNotes) {
    if (!isSingleCleanupCategory(note.category) || connectedNotes.has(note)) {
      continue
    }
    const cover = finalNotes.find((other) =>
      other !== note
      && connectedNotes.has(other)
      && other.tick === note.tick
      && laneOverlapsInclusive(note, other),
    )
    if (!cover) {
      continue
    }
    pushDiagnostic(
      makeImportDiagnostic(
        'single_note_cleanup',
        'dedup',
        note,
        cover,
        '单独 trace/guide/hidden 会被清理',
        `${noteInfoLabel(note)} 是没有连接关系的单独节点，并且与同刻 connected ${noteInfoLabel(cover)} 重叠；游戏导出 Maker JSON 前会删除这个单独节点。`,
      ),
    )
  }

  const sortedNotes = [...finalNotes].sort((left, right) =>
    left.tick === right.tick
      ? left.importLane === right.importLane
        ? left.source.sourceOrder - right.source.sourceOrder
        : left.importLane - right.importLane
      : left.tick - right.tick,
  )

  for (let leftIndex = 0; leftIndex < sortedNotes.length; leftIndex += 1) {
    const left = sortedNotes[leftIndex]
    if (!left || left.guideDict || !isHoldOrGuideEndpoint(left)) {
      continue
    }
    for (let rightIndex = leftIndex + 1; rightIndex < sortedNotes.length; rightIndex += 1) {
      const right = sortedNotes[rightIndex]
      if (!right || right.tick !== left.tick) {
        break
      }
      if (right.guideDict || left.longNo === right.longNo) {
        continue
      }
      if (!laneOverlapsInclusive(left, right)) {
        continue
      }
      const sameStartAndWidth = left.importLane === right.importLane && left.width === right.width
      if (sameStartAndWidth) {
        continue
      }
      pushDiagnostic(
        makeImportDiagnostic(
          'ambiguous_overlap',
          'render_bug',
          right,
          left,
          '长条/guide 端点同刻重叠',
          `${noteInfoLabel(left)} 与 ${noteInfoLabel(right)} 在同一时刻范围重叠，但没有落在同一个导入槽位；这类写法不会按字典合并，却容易在长条头尾、去头尾 hold 或 guide 头尾解析/预览时产生歧义。`,
        ),
      )
    }
  }

  return diagnostics
}

const buildAuditScore = (sus: ParsedSus): { diagnostics: ConflictDiagnostic[] } => {
  const diagnostics: ConflictDiagnostic[] = buildGameImportDiagnostics(sus)

  const crashDiagnosticIds = new Set<string>()

  const reportNodeDiagnostic = (
    category: ConflictDiagnostic['category'],
    first: ParsedSlideNote | ParsedHoldNode,
    second: ParsedSlideNote | ParsedHoldNode,
    title: string,
    summary: string,
    severity: ConflictDiagnostic['severity'] = 'crash',
  ): void => {
    const diagnostic = makeSlideNodeDiagnostic(category, first, second, title, summary, severity)
    if (!crashDiagnosticIds.has(diagnostic.id)) {
      crashDiagnosticIds.add(diagnostic.id)
      diagnostics.push(diagnostic)
    }
  }

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

      reportNodeDiagnostic(
        'hold_relay_same_time',
        current,
        next,
        '会导致本家预览崩溃：同一长条中继点同刻',
        '同一根长条上存在两个处于完全同一时间的中继点，不管可见还是不可见，都可能让本家预览直接崩溃。',
      )
    }
  }

  for (const guide of sus.guides) {
    const relayNodes = guide
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

      reportNodeDiagnostic(
        'hold_relay_same_time',
        current,
        next,
        '会导致渲染 bug：同一 guide 中继点同刻',
        '同一根 guide 上存在两个处于完全同一时间的中继点，可能导致本家预览渲染异常。',
        'render_bug',
      )
    }
  }

  const holdNodes: ParsedHoldNode[] = [
    ...sus.slides.flatMap((slide, holdIndex) =>
      slide.map((note) => ({
        ...note,
        holdIndex,
        isGuide: false,
      })),
    ),
    ...sus.guides.flatMap((guide, guideIndex) =>
      guide.map((note) => ({
        ...note,
        holdIndex: sus.slides.length + guideIndex,
        isGuide: true,
      })),
    ),
  ]

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
      if (first.isGuide || second.isGuide) {
        continue
      }
      reportNodeDiagnostic(
        'hold_node_exact_overlap',
        first,
        second,
        '会导致本家预览崩溃：不同长条节点完全重合',
        '两根不同长条的节点在同一时间、同一轨道范围完全重合，这类写法可能让本家预览直接崩溃。',
      )
    }
  }

  diagnostics.sort((left, right) => {
    if (left.severity !== right.severity) {
      const severityOrder: Record<ConflictDiagnostic['severity'], number> = {
        crash: 0,
        render_bug: 1,
        dedup: 2,
      }
      return severityOrder[left.severity] - severityOrder[right.severity]
    }
    return left.sortTick === right.sortTick ? left.sortLane - right.sortLane : left.sortTick - right.sortTick
  })

  return { diagnostics }
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
