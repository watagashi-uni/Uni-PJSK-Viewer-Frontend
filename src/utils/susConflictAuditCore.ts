type FlickType = 'none' | 'default' | 'left' | 'right'

type SusDataLine = {
  header: string
  data: string
  measure: number
  lineIndex: number
}

type ParsedBarLength = {
  bar: number
  length: number
  sourceOrder: number
}

type ParsedSusNote = {
  tick: number
  measure: number
  slotIndex: number
  slotTotal: number
  barProgress: number
  positionKey: number
  bar: number
  lane: number
  importLane: number
  width: number
  type: number
  speedRatio: number
  longNo: number
  laneType: number
  sourceOrder: number
}

type ParsedFormatIssue = {
  id: string
  title: string
  severity: ConflictDiagnostic['severity']
  markerLabel: string
  measure: number
  bar: number
  barProgress: number
  slotIndex: number
  slotTotal: number
  importLane: number
  lane: number
  width: number
  laneType: number
  longNo: number
  tick: number
  summary: string
  trackText?: string
}

type ParsedHighSpeed = {
  measure: number
  tickOffset: number
  barProgress: number
  speedRatio: number
  sourceOrder: number
  tick: number
}

type ParsedSus = {
  rawNotes: ParsedSusNote[]
  barlengths: ParsedBarLength[]
  makerEventBars: number[]
  formatIssues: ParsedFormatIssue[]
  highSpeeds: ParsedHighSpeed[]
}

type MarkerRole = 'kept' | 'suppressed' | 'source'

export type ConflictMarker = {
  id: string
  role: MarkerRole
  label: string
  bar: number
  susLane: number
  width: number
  /** laneType from the SUS note: 1=tap, 3=slide, 5=directional, 9=guide */
  noteLaneType?: number
  /** type from the SUS note (TapType / DirectionalType / SlideType enum value) */
  noteType?: number
}

export type ConflictDiagnostic = {
  id: string
  category:
    | 'tap_overlap'
    | 'hold_coverage'
    | 'visible_overlap'
    | 'hold_relay_same_time'
    | 'hold_node_exact_overlap'
    | 'same_kind_duplicate'
    | 'destructive_merge'
    | 'speed_overwrite'
    | 'import_drop'
    | 'export_cleanup'
    | 'child_speed_inherited'
    | 'ambiguous_overlap'
    | 'dense_speed_guide_after_hispeed'
  stage: 'import' | 'maker' | 'preview'
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

type ParsedNoteCell = {
  value: string
  speedRatio: number
  slotIndex: number
}

type ParsedNoteCells = {
  cells: ParsedNoteCell[]
  slotTotal: number
  speedMode: boolean
  discardedText: boolean
  invalidSpeed: boolean
}

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
  positionKey: number
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
  categorySource: ParsedSusNote
  criticalSource: ParsedSusNote | null
  flickSource: ParsedSusNote | null
  lineTypeSource: ParsedSusNote | null
  speedSource: ParsedSusNote
  longNoSource: ParsedSusNote
  updateSources: ParsedSusNote[]
  guideDict: boolean
}

type ImportDictionary = Map<number, Map<number, ImportNoteInfo>>

type ImportMergeClass =
  | 'expected_composition'
  | 'same_kind_duplicate'
  | 'destructive_merge'
  | 'speed_overwrite'

type ImportMergeDecision = {
  classification: ImportMergeClass
  reasons: string[]
  existingSource: ParsedSusNote
}

type RuntimeNode = {
  info: ImportNoteInfo
  kind: ImportCategory
  category: ImportCategory
  critical: boolean
  effectiveSpeed: number
  parent: RuntimeNode | null
  root: RuntimeNode
  children: RuntimeNode[]
}

type GameImportResult = {
  diagnostics: ConflictDiagnostic[]
  roots: RuntimeNode[]
}

const SPEED_NOTE_REGEX = /([0-9a-z]{2}),([-]*[0-9]+.?[0-9]*) /g
const FLOAT_TEXT_REGEX = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u
const TICKS_PER_BAR = 1920

const f32 = (value: number): number => Math.fround(value)

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

const isDigitString = (value: string): boolean => value.length > 0 && /^[0-9]+$/u.test(value)

const isLowerSusChar = (value: string): boolean => /^[0-9a-z]$/u.test(value)

const isSusChar = (value: string): boolean => /^[0-9a-z]$/u.test(value.toLowerCase())

const parseSusDigit = (value: string): number => isSusChar(value) ? Number.parseInt(value, 36) : -1

const parseSusHexDigit = (value: string): number => /^[0-9a-f]$/u.test(value) ? Number.parseInt(value, 16) : -1

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

const getNoteWidth = (value: string): number => {
  const parsed = parseSusDigit(value)
  return parsed >= 1 && parsed <= 14 ? parsed : -1
}

const parseFloat32 = (text: string, fallback: number): { value: number; valid: boolean } => {
  const normalized = text.trim()
  if (!FLOAT_TEXT_REGEX.test(normalized)) {
    return { value: f32(fallback), valid: false }
  }
  const parsed = Number(normalized)
  const rounded = f32(parsed)
  if (!Number.isFinite(parsed) || !Number.isFinite(rounded)) {
    return { value: f32(fallback), valid: false }
  }
  return { value: rounded, valid: true }
}

const parseInt32 = (text: string): number | null => {
  if (!/^[+-]?\d+$/u.test(text)) {
    return null
  }
  const parsed = Number(text)
  return Number.isInteger(parsed) && parsed >= -2147483648 && parsed <= 2147483647
    ? parsed
    : null
}

const approximatelyFloat32 = (left: number, right: number): boolean => {
  const difference = Math.abs(left - right)
  return difference < Math.max(0.000001 * Math.max(Math.abs(left), Math.abs(right)), 1.401298e-45 * 8)
}

const getEffectiveHighSpeedChanges = (events: ParsedHighSpeed[]): ParsedHighSpeed[] => {
  const sorted = [...events].sort((left, right) => {
    if (left.measure !== right.measure) {
      return left.measure - right.measure
    }
    if (left.barProgress !== right.barProgress) {
      return left.barProgress - right.barProgress
    }
    return left.sourceOrder - right.sourceOrder
  })
  const result: ParsedHighSpeed[] = []
  let currentSpeed = f32(1)
  let index = 0
  while (index < sorted.length) {
    const first = sorted[index]
    if (!first) {
      index += 1
      continue
    }
    let finalAtPosition = first
    index += 1
    while (
      index < sorted.length
      && sorted[index]?.measure === first.measure
      && approximatelyFloat32(sorted[index]?.barProgress ?? 0, first.barProgress)
    ) {
      finalAtPosition = sorted[index] ?? finalAtPosition
      index += 1
    }
    if (finalAtPosition.speedRatio !== currentSpeed) {
      result.push(finalAtPosition)
      currentSpeed = finalAtPosition.speedRatio
    }
  }
  return result
}

const parseNoteCells = (rawData: string): ParsedNoteCells => {
  const data = rawData.split('\t').join('')
  const cells: ParsedNoteCell[] = []
  let discardedText = false
  let invalidSpeed = false

  if (data.includes(',')) {
    SPEED_NOTE_REGEX.lastIndex = 0
    let cursor = 0
    let slotTotal = 0
    let match = SPEED_NOTE_REGEX.exec(data)
    while (match) {
      if (/\S/u.test(data.slice(cursor, match.index))) {
        discardedText = true
      }
      const value = (match[1] ?? '').toLowerCase()
      const parsedSpeed = parseFloat32(match[2] ?? '', 1)
      invalidSpeed ||= !parsedSpeed.valid
      if (value !== '00') {
        cells.push({ value, speedRatio: parsedSpeed.value, slotIndex: slotTotal })
      }
      slotTotal += 1
      cursor = SPEED_NOTE_REGEX.lastIndex
      match = SPEED_NOTE_REGEX.exec(data)
    }
    if (/\S/u.test(data.slice(cursor))) {
      discardedText = true
    }
    return { cells, slotTotal, speedMode: true, discardedText, invalidSpeed }
  }

  let cursor = 0
  let slotTotal = 0
  while (cursor < data.length) {
    while (cursor < data.length && /\s/u.test(data[cursor] ?? '')) {
      cursor += 1
    }
    if (
      cursor + 1 < data.length
      && isSusChar(data[cursor] ?? '')
      && isSusChar(data[cursor + 1] ?? '')
    ) {
      const value = data.slice(cursor, cursor + 2).toLowerCase()
      if (value !== '00') {
        cells.push({ value, speedRatio: 1, slotIndex: slotTotal })
      }
      slotTotal += 1
      cursor += 2
      continue
    }
    if (cursor < data.length && !/\s/u.test(data[cursor] ?? '')) {
      discardedText = true
    }
    cursor += 1
  }
  return { cells, slotTotal, speedMode: false, discardedText, invalidSpeed }
}

const roundToEven = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0
  }
  const lower = Math.floor(value)
  const fraction = value - lower
  if (fraction < 0.5) {
    return lower
  }
  if (fraction > 0.5) {
    return lower + 1
  }
  return lower % 2 === 0 ? lower : lower + 1
}

const barLengthTicks = (timeSignature: number): number =>
  f32(f32(f32(timeSignature) * f32(0.25)) * f32(TICKS_PER_BAR))

const getMakerTicks = (
  barLengths: ParsedBarLength[],
  makerEventBars: number[],
  bar: number,
  barProgress: number,
): number => {
  const changes = [...barLengths]
  if (!changes.some((change) => change.bar === 0)) {
    changes.push({ bar: 0, length: 4, sourceOrder: -1 })
  }
  changes.sort((left, right) => left.bar === right.bar
    ? left.sourceOrder - right.sourceOrder
    : left.bar - right.bar)

  const boundaries = [...new Set([0, ...makerEventBars, ...changes.map((change) => change.bar)])]
    .sort((left, right) => left - right)
  let ticks = 0
  let currentBar = 0
  let currentBarLength = f32(TICKS_PER_BAR)
  let changeIndex = 0
  for (const boundary of boundaries) {
    const nextBar = Math.min(bar, boundary)
    if (nextBar - currentBar >= 1) {
      ticks += Math.trunc(f32(currentBarLength * f32(nextBar - currentBar)))
      currentBar = nextBar
    }
    if (boundary > bar) {
      break
    }
    while (changeIndex < changes.length && (changes[changeIndex]?.bar ?? Number.POSITIVE_INFINITY) <= boundary) {
      const change = changes[changeIndex]
      if (change) {
        currentBarLength = barLengthTicks(change.length)
      }
      changeIndex += 1
    }
  }
  if (bar - currentBar >= 1) {
    ticks += Math.trunc(f32(currentBarLength * f32(bar - currentBar)))
  }
  return ticks + roundToEven(f32(currentBarLength * f32(barProgress)))
}

const getPositionText = (measure: number, slotIndex: number, slotTotal: number): string => {
  if (slotIndex === 0 || slotTotal <= 0) {
    return `第 ${measure} 小节 开头`
  }
  const divisor = gcd(slotIndex, slotTotal)
  return `第 ${measure} 小节 ${slotIndex / divisor}/${slotTotal / divisor}`
}

const getTrackText = (lane: number, width: number): string => {
  const start = lane + 1
  const end = lane + width
  return width > 1 ? `轨道 ${start}-${end}` : `轨道 ${start}`
}

const parseSusTextForAudit = (content: string): ParsedSus => {
  let ticksPerBeat = 480
  let nextSourceOrder = 0
  let nextBarLengthOrder = 0
  const rawNotes: ParsedSusNote[] = []
  const barlengths: ParsedBarLength[] = []
  const makerEventBars = new Set<number>([0])
  const bpmIds = new Set<string>()
  const formatIssues: ParsedFormatIssue[] = []
  const highSpeeds: ParsedHighSpeed[] = []
  let nextHighSpeedOrder = 0

  const appendTimelineFormatIssue = (
    id: string,
    title: string,
    summary: string,
    measure: number,
    trackText = '时间轴',
  ): void => {
    formatIssues.push({
      id,
      title,
      severity: 'dedup',
      markerLabel: '格式不受支持',
      measure,
      bar: measure,
      barProgress: 0,
      slotIndex: 0,
      slotTotal: 1,
      importLane: -1,
      lane: -1,
      width: 1,
      laneType: -1,
      longNo: -1,
      tick: 0,
      summary,
      trackText,
    })
  }

  const appendNotes = (line: SusDataLine, laneType: number, longNo: number): void => {
    const parsed = parseNoteCells(line.data)
    const laneChar = line.header.slice(4, 5)
    const importLane = getImportLane(laneChar)
    const lane = parseSusDigit(laneChar)

    if (parsed.discardedText || parsed.invalidSpeed) {
      const details = [
        parsed.discardedText ? '这一行有部分内容不符合游戏支持的格式，因此不会被读取' : '',
        parsed.invalidSpeed ? '这一行的差速数值无效，游戏会按 1x 处理' : '',
      ].filter(Boolean).join('；')
      formatIssues.push({
        id: `note-format-${line.lineIndex}`,
        title: parsed.speedMode ? '差速音符格式不完整' : '这一行含有游戏无法读取的字符',
        severity: 'dedup',
        markerLabel: '格式被忽略',
        measure: line.measure,
        bar: line.measure,
        barProgress: 0,
        slotIndex: 0,
        slotTotal: 1,
        importLane,
        lane,
        width: 1,
        laneType,
        longNo,
        tick: 0,
        summary: parsed.speedMode
          ? `${details}。请把每个差速音符写成“音符,速度 ”，并保留每项末尾的空格。`
          : `${details}。请检查这一行，确保每个音符都由两个有效的 SUS 字符组成。`,
      })
    }

    for (const cell of parsed.cells) {
      if (parsed.slotTotal <= 0) {
        continue
      }
      const barProgress = f32(f32(cell.slotIndex) / f32(parsed.slotTotal))
      const positionKey = f32(f32(line.measure) + barProgress)
      rawNotes.push({
        tick: 0,
        measure: line.measure,
        slotIndex: cell.slotIndex,
        slotTotal: parsed.slotTotal,
        barProgress,
        positionKey,
        bar: line.measure + barProgress,
        lane,
        importLane,
        width: getNoteWidth(cell.value.slice(1, 2)),
        type: parseSusDigit(cell.value.slice(0, 1)),
        speedRatio: cell.speedRatio,
        longNo,
        laneType,
        sourceOrder: nextSourceOrder++,
      })
    }
  }

  const appendUnsupportedLongChannelIssue = (
    line: SusDataLine,
    laneType: number,
    channel: string,
  ): void => {
    const parsed = parseNoteCells(line.data)
    const first = parsed.cells[0]
    if (!first || parsed.slotTotal <= 0) {
      return
    }
    const laneChar = line.header.slice(4, 5)
    const importLane = getImportLane(laneChar)
    const barProgress = f32(f32(first.slotIndex) / f32(parsed.slotTotal))
    formatIssues.push({
      id: 'unsupported-long-channel',
      title: '部分长条或 Guide 使用了游戏不支持的编号',
      severity: 'dedup',
      markerLabel: `编号 ${channel} 不受支持`,
      measure: line.measure,
      bar: line.measure + barProgress,
      barProgress,
      slotIndex: first.slotIndex,
      slotTotal: parsed.slotTotal,
      importLane,
      lane: parseSusDigit(laneChar),
      width: Math.max(1, getNoteWidth(first.value.slice(1, 2))),
      laneType,
      longNo: -1,
      tick: 0,
      summary: `检测到编号 ${channel}。游戏只识别 0–f，这一编号对应的整组长条或 Guide 都会消失。请减少同一时段并存的长条/Guide，确保只使用 0–f；这里只标出第一个位置。`,
    })
  }

  const appendUnsupportedNoteChannelIssue = (
    line: SusDataLine,
    laneType: number,
    isLong: boolean,
  ): void => {
    const parsed = parseNoteCells(line.data)
    const first = parsed.cells[0]
    if (!first || parsed.slotTotal <= 0) {
      return
    }
    const laneChar = line.header.slice(4, 5)
    const importLane = getImportLane(laneChar)
    const barProgress = f32(f32(first.slotIndex) / f32(parsed.slotTotal))
    formatIssues.push({
      id: `unsupported-note-channel-${line.lineIndex}`,
      title: isLong ? '游戏不支持这一类长条通道' : '游戏不支持这一类音符通道',
      severity: 'dedup',
      markerLabel: `行类型 ${laneType} 不受支持`,
      measure: line.measure,
      bar: line.measure + barProgress,
      barProgress,
      slotIndex: first.slotIndex,
      slotTotal: parsed.slotTotal,
      importLane,
      lane: parseSusDigit(laneChar),
      width: Math.max(1, getNoteWidth(first.value.slice(1, 2))),
      laneType,
      longNo: -1,
      tick: 0,
      summary: isLong
        ? `检测到行类型 ${laneType} 的长条写法，但游戏只会把行类型 3 作为 Hold、行类型 9 作为 Guide；这一行不会生成音符。请改用对应的 3/9 通道。`
        : `检测到行类型 ${laneType} 的普通音符写法，但游戏只会读取行类型 1 和 5；这一行不会生成音符。请检查 SUS 通道编号。`,
    })
  }

  const lines = content.split('\n')
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex] ?? ''
    if (rawLine.includes('#REQUEST "ticks_per_beat')) {
      const match = /^#REQUEST ticks_per_beat (\d+)/u.exec(rawLine.split('"').join(''))
      if (match) {
        const parsedTicksPerBeat = parseInt32(match[1] ?? '')
        if (parsedTicksPerBeat === null) {
          appendTimelineFormatIssue(
            `ticks-per-beat-range-${lineIndex}`,
            'ticks_per_beat 超出了游戏可读取的范围',
            `这一数值无法转换成游戏使用的 32 位整数，因此游戏会继续使用之前的 ${ticksPerBeat}。请改成 1–2147483647 之间的整数。`,
            0,
            '全谱面',
          )
        } else {
          ticksPerBeat = parsedTicksPerBeat
          if (parsedTicksPerBeat === 0) {
            appendTimelineFormatIssue(
              `ticks-per-beat-zero-${lineIndex}`,
              'ticks_per_beat 不能为 0',
              '游戏会接受这个数值，但所有按 tickOffset 写入的全局变速和音效音量事件都会落到小节开头。请改成正常的正整数，通常为 480。',
              0,
              '全谱面',
            )
          }
        }
      }
    }
    const measureBaseMatch = /^#MEASUREBS\s+([+-]?\d+)/u.exec(rawLine)
    if (measureBaseMatch) {
      const measureBase = Number.parseInt(measureBaseMatch[1] ?? '0', 10)
      if (measureBase !== 0) {
        appendTimelineFormatIssue(
          'unsupported-measure-base',
          '游戏不支持 MEASUREBS 小节偏移',
          `检测到 MEASUREBS ${measureBase}。游戏会忽略这条命令，后续形如 #000… 的内容仍会被当成第 0 小节，可能造成大范围错位和覆盖。请在导出时避免超过 999 小节，或先把谱面整体移回 0–999 小节。`,
          measureBase,
          '全谱面',
        )
      }
    }
    const bpmDefinition = /^#BPM([0-9A-Z]{2}):(.+)/u.exec(rawLine)
    if (bpmDefinition) {
      bpmIds.add(bpmDefinition[1] ?? '')
    }
    if (rawLine.includes('#TIL00') || rawLine.includes('#VOLUME')) {
      const normalized = rawLine.split('"').join('').split(',').join('\r')
      const embeddedEventRegex = /(\d+)'\d+:[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:\r|$)/gu
      let embeddedMatch = embeddedEventRegex.exec(normalized)
      while (embeddedMatch) {
        makerEventBars.add(Number.parseInt(embeddedMatch[1] ?? '0', 10))
        embeddedMatch = embeddedEventRegex.exec(normalized)
      }
    }
    if (rawLine.includes('#TIL00')) {
      const normalized = rawLine
        .split('"').join('')
        .split('#TIL00:').join('')
        .split(',').join('\r')
        .trim()
      const highSpeedRegex = /(\d+)'(\d+):([-+]?(?:\d+(?:\.\d*)?|\.\d+))(?:\r|$)/gu
      let highSpeedMatch = highSpeedRegex.exec(normalized)
      while (highSpeedMatch) {
        const parsedSpeed = parseFloat32(highSpeedMatch[3] ?? '', 1)
        highSpeeds.push({
          measure: Number.parseInt(highSpeedMatch[1] ?? '0', 10),
          tickOffset: Number.parseInt(highSpeedMatch[2] ?? '0', 10),
          barProgress: 0,
          speedRatio: parsedSpeed.value,
          sourceOrder: nextHighSpeedOrder++,
          tick: 0,
        })
        highSpeedMatch = highSpeedRegex.exec(normalized)
      }
    }
    if (!rawLine.startsWith('#')) {
      continue
    }
    const separatorIndex = rawLine.indexOf(':')
    if (separatorIndex === -1) {
      continue
    }
    const header = rawLine.slice(1, separatorIndex)
    const data = rawLine.slice(separatorIndex + 1)
    if (data.length === 0 || !isDigitString(header.slice(0, 3))) {
      continue
    }
    const measure = Number.parseInt(header.slice(0, 3), 10)
    const line: SusDataLine = { header, data, measure, lineIndex }

    if (
      header.length === 5
      && isLowerSusChar(header[3] ?? '')
      && isLowerSusChar(header[4] ?? '')
    ) {
      const eventType = header.slice(3, 5)
      if (eventType === '02') {
        if (data.includes(',')) {
          appendTimelineFormatIssue(
            `time-signature-speed-format-${lineIndex}`,
            '带差速格式的拍号行不会被游戏读取',
            '02 拍号通道中出现了逗号，游戏会跳过整行，导致后续音符的时间和 Maker tick 发生偏移。请把拍号写成普通数值，例如“#00002:4”。',
            measure,
          )
        } else {
          barlengths.push({
            bar: measure,
            length: parseFloat32(data, 4).value,
            sourceOrder: nextBarLengthOrder++,
          })
          makerEventBars.add(measure)
        }
        continue
      }
      if (eventType === '08') {
        if (data.includes(',')) {
          appendTimelineFormatIssue(
            `bpm-speed-format-${lineIndex}`,
            '带差速格式的 BPM 行不会被游戏读取',
            '08 BPM 通道中出现了逗号，游戏会跳过整行，对应的 BPM 变化不会生效。请使用普通的两字符 BPM 编号。',
            measure,
          )
        } else {
          const bpmCells = parseNoteCells(data)
          if (bpmCells.cells.some((cell) => bpmIds.has(cell.value.toUpperCase()) || bpmIds.has(cell.value))) {
            makerEventBars.add(measure)
          }
        }
        continue
      }
      const laneType = parseSusDigit(header[3] ?? '')
      if (laneType === 1 || laneType === 5) {
        appendNotes(line, laneType, -1)
      } else {
        appendUnsupportedNoteChannelIssue(line, laneType, false)
      }
      continue
    }

    if (
      header.length === 6
      && /^[0-9]$/u.test(header[3] ?? '')
      && isLowerSusChar(header[4] ?? '')
      && isLowerSusChar(header[5] ?? '')
    ) {
      const laneType = parseSusDigit(header[3] ?? '')
      if (laneType !== 3 && laneType !== 9) {
        const parsed = parseNoteCells(line.data)
        const importLane = getImportLane(header[4] ?? '')
        const isFeverEventLine = laneType === 1
          && importLane === 13
          && parsed.cells.length > 0
          && parsed.cells.every((cell) => {
            const noteType = parseSusDigit(cell.value.slice(0, 1))
            return noteType === 1 || noteType === 2
          })
        if (!isFeverEventLine) {
          appendUnsupportedNoteChannelIssue(line, laneType, true)
        }
        continue
      }
      const longNo = parseSusHexDigit(header[5] ?? '')
      if (longNo !== -1) {
        appendNotes(line, laneType, longNo)
      } else if (/^[g-z]$/u.test(header[5] ?? '')) {
        appendUnsupportedLongChannelIssue(line, laneType, header[5] ?? '')
      }
    }
  }

  if (barlengths.length === 0) {
    barlengths.push({ bar: 0, length: 4, sourceOrder: -1 })
  }
  for (const note of rawNotes) {
    note.tick = getMakerTicks(barlengths, [...makerEventBars], note.measure, note.barProgress)
  }
  for (const issue of formatIssues) {
    issue.tick = getMakerTicks(barlengths, [...makerEventBars], issue.measure, issue.barProgress)
  }
  for (const highSpeed of highSpeeds) {
    let timeSignature = f32(4)
    for (const change of [...barlengths].sort((left, right) => left.bar === right.bar
      ? left.sourceOrder - right.sourceOrder
      : left.bar - right.bar)) {
      if (change.bar > highSpeed.measure) {
        break
      }
      timeSignature = change.length
    }
    const sourceBarTicks = f32(f32(timeSignature) * f32(ticksPerBeat))
    highSpeed.barProgress = sourceBarTicks > 0
      ? Math.max(0, f32(f32(highSpeed.tickOffset) / sourceBarTicks))
      : 0
    highSpeed.tick = getMakerTicks(
      barlengths,
      [...makerEventBars],
      highSpeed.measure,
      highSpeed.barProgress,
    )
  }
  return {
    rawNotes,
    barlengths,
    makerEventBars: [...makerEventBars],
    formatIssues,
    highSpeeds: getEffectiveHighSpeedChanges(highSpeeds),
  }
}

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

const noteInfoLabel = (note: ImportNoteInfo): string =>
  `${note.critical ? 'Critical ' : ''}${importCategoryLabel(note.category)}`

const parsedNoteLabel = (note: ParsedSusNote, category: ImportCategory): string => {
  const critical = note.laneType === 1 && (note.type === 2 || note.type === 6 || note.type === 8)
  return `${critical ? 'Critical ' : ''}${importCategoryLabel(category)}`
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
    width: Math.max(1, 'width' in note ? note.width : source.width),
    noteLaneType: source.laneType,
    noteType: source.type,
  }
}

const makeImportDiagnostic = (
  category: ConflictDiagnostic['category'],
  stage: ConflictDiagnostic['stage'],
  severity: ConflictDiagnostic['severity'],
  target: ParsedSusNote | ImportNoteInfo,
  source: ParsedSusNote | ImportNoteInfo,
  title: string,
  summary: string,
  markerLabels: { source: string; target: string } = {
    source: '已有槽位',
    target: '后写入',
  },
): ConflictDiagnostic => {
  const targetSource = 'source' in target ? target.source : target
  const sourceSource = 'source' in source ? source.source : source
  const targetLane = 'importLane' in target ? target.importLane : targetSource.importLane
  const targetWidth = 'width' in target ? target.width : targetSource.width
  return {
    id: `${category}-${sourceSource.sourceOrder}-${targetSource.sourceOrder}`,
    category,
    stage,
    severity,
    title,
    summary,
    measure: targetSource.measure,
    positionText: getPositionText(targetSource.measure, targetSource.slotIndex, targetSource.slotTotal),
    trackText: getTrackText(targetLane, targetWidth),
    markers: [
      makeImportMarker('source', 'source', markerLabels.source, source),
      makeImportMarker('suppressed', 'target', markerLabels.target, target),
    ],
    sortTick: targetSource.tick,
    sortLane: targetLane,
  }
}

const makeSingleNoteDiagnostic = (
  category: ConflictDiagnostic['category'],
  stage: ConflictDiagnostic['stage'],
  note: ParsedSusNote,
  title: string,
  summary: string,
): ConflictDiagnostic => ({
  id: `${category}-${note.sourceOrder}`,
  category,
  stage,
  severity: 'dedup',
  title,
  summary,
  measure: note.measure,
  positionText: getPositionText(note.measure, note.slotIndex, note.slotTotal),
  trackText: note.importLane >= 0 && note.importLane <= 11
    ? getTrackText(note.importLane, Math.max(1, note.width))
    : '无效轨道',
  markers: note.importLane >= 0 && note.importLane <= 11
    ? [makeImportMarker('suppressed', 'dropped', '不会进入结果', note)]
    : [],
  sortTick: note.tick,
  sortLane: note.importLane,
})

const makeFormatIssueDiagnostic = (issue: ParsedFormatIssue): ConflictDiagnostic => ({
  id: issue.id,
  category: 'import_drop',
  stage: 'import',
  severity: issue.severity,
  title: issue.title,
  summary: issue.summary,
  measure: issue.measure,
  positionText: getPositionText(issue.measure, issue.slotIndex, issue.slotTotal),
  trackText: issue.trackText
    ?? (issue.importLane >= 0 && issue.importLane <= 11 ? getTrackText(issue.importLane, issue.width) : '无效轨道'),
  markers: issue.importLane >= 0 && issue.importLane <= 11 ? [{
    id: `${issue.id}-marker`,
    role: 'suppressed',
    label: issue.markerLabel,
    bar: issue.bar,
    susLane: issue.importLane + 2,
    width: issue.width,
    noteLaneType: issue.laneType,
  }] : [],
  sortTick: issue.tick,
  sortLane: issue.importLane,
})

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
    current.categorySource = incoming.categorySource
  }
  if (incoming.critical) {
    current.critical = true
    current.criticalSource = incoming.criticalSource ?? incoming.source
  }
  if (incoming.flick !== 'none') {
    current.flick = incoming.flick
    current.flickSource = incoming.flickSource ?? incoming.source
  }
  if (incoming.lineType !== 'linear') {
    current.lineType = incoming.lineType
    current.lineTypeSource = incoming.lineTypeSource ?? incoming.source
  }
  if (incoming.speedRatio !== 1) {
    current.speedRatio = incoming.speedRatio
    current.speedSource = incoming.speedSource
  }
  if (incoming.longNo !== -1) {
    current.longNo = incoming.longNo
    current.longNoSource = incoming.longNoSource
  }
  current.updateSources.push(incoming.source)
}

const classifyImportMerge = (current: ImportNoteInfo, incoming: ImportNoteInfo): ImportMergeDecision => {
  const reasons: string[] = []
  let destructiveSource = current.categorySource
  const addDestructiveReason = (reason: string, source: ParsedSusNote): void => {
    if (reasons.length === 0) {
      destructiveSource = source
    }
    reasons.push(reason)
  }
  const merged = cloneNoteInfo(current)
  updateNoteInfo(merged, incoming)
  if (current.width !== incoming.width) {
    addDestructiveReason(
      `游戏会保留先写入的宽度 ${current.width}，后写入的宽度 ${incoming.width} 不会生效`,
      current.source,
    )
  }
  if (current.longNo !== -1 && incoming.longNo !== -1 && current.longNo !== incoming.longNo) {
    addDestructiveReason(
      `长条/Guide 编号会从 ${current.longNo.toString(16)} 改成 ${incoming.longNo.toString(16)}`,
      current.longNoSource,
    )
  }
  if (isLongRootCategory(current.category) && !isLongRootCategory(merged.category)) {
    addDestructiveReason(
      `${importCategoryLabel(current.category)} 的起点会被改成 ${importCategoryLabel(merged.category)}`,
      current.categorySource,
    )
  }
  if (isGuideCategory(current.category) && !isGuideCategory(merged.category)) {
    addDestructiveReason(
      `${importCategoryLabel(current.category)} 会被改成普通的 ${importCategoryLabel(merged.category)}`,
      current.categorySource,
    )
  }
  const sameLaneTypeSource = [...current.updateSources]
    .reverse()
    .find((source) => source.laneType === incoming.source.laneType)
  if (
    sameLaneTypeSource
    && incoming.category !== 'Normal'
    && current.category !== incoming.category
    && reasons.length === 0
  ) {
    addDestructiveReason(
      `${importCategoryLabel(current.category)} 会被改成 ${importCategoryLabel(incoming.category)}`,
      current.categorySource,
    )
  }
  const hasSpeedConflict = current.speedRatio !== 1
    && incoming.speedRatio !== 1
    && current.speedRatio !== incoming.speedRatio
  if (reasons.length > 0) {
    if (hasSpeedConflict) {
      reasons.push(`差速也会从 ${current.speedRatio}x 改成 ${incoming.speedRatio}x`)
    }
    return { classification: 'destructive_merge', reasons, existingSource: destructiveSource }
  }
  // NoteInfo.Update treats 1x as "no speed modifier". A composed note commonly
  // has one SUS row carrying the real Notespeed and another row left at 1x;
  // that default row does not overwrite the existing speed in the C# importer.
  if (hasSpeedConflict) {
    return {
      classification: 'speed_overwrite',
      reasons: [`同一位置只能保留一个差速，${current.speedRatio}x 与 ${incoming.speedRatio}x 不会同时生效`],
      existingSource: current.speedSource,
    }
  }
  if (sameLaneTypeSource) {
    return { classification: 'same_kind_duplicate', reasons: [], existingSource: sameLaneTypeSource }
  }
  return { classification: 'expected_composition', reasons: [], existingSource: current.source }
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

const importNoteInfoFromSusNote = (
  note: ParsedSusNote,
  category: ImportCategory,
  guideDict: boolean,
): ImportNoteInfo => {
  const flick: FlickType = note.laneType === 5 && note.type === 3
    ? 'left'
    : note.laneType === 5 && note.type === 4
      ? 'right'
      : note.laneType === 5 && note.type === 1
        ? 'default'
        : 'none'
  const lineType = note.laneType === 5 && note.type === 2
    ? 'easeIn'
    : note.laneType === 5 && (note.type === 5 || note.type === 6)
      ? 'easeOut'
      : 'linear'
  return {
    bar: note.measure,
    barProgress: note.barProgress,
    positionKey: note.positionKey,
    tick: note.tick,
    importLane: note.importLane,
    width: note.width,
    category,
    critical: note.laneType === 1 && (note.type === 2 || note.type === 6 || note.type === 8),
    flick,
    lineType,
    speedRatio: note.speedRatio,
    longNo: note.longNo,
    isSkip: category === 'Skip',
    source: note,
    categorySource: note,
    criticalSource: note.laneType === 1 && (note.type === 2 || note.type === 6 || note.type === 8)
      ? note
      : null,
    flickSource: flick !== 'none' ? note : null,
    lineTypeSource: lineType !== 'linear' ? note : null,
    speedSource: note,
    longNoSource: note,
    updateSources: [note],
    guideDict,
  }
}

const getImportNote = (dict: ImportDictionary, positionKey: number, lane: number): ImportNoteInfo | undefined =>
  dict.get(positionKey)?.get(lane)

const setImportNote = (dict: ImportDictionary, note: ImportNoteInfo): void => {
  let laneDict = dict.get(note.positionKey)
  if (!laneDict) {
    laneDict = new Map()
    dict.set(note.positionKey, laneDict)
  }
  laneDict.set(note.importLane, note)
}

const importDictionaryValues = (dict: ImportDictionary): ImportNoteInfo[] => {
  const result: ImportNoteInfo[] = []
  const positions = [...dict.keys()].sort((left, right) => left - right)
  for (const position of positions) {
    result.push(...(dict.get(position)?.values() ?? []))
  }
  return result
}

const addToImportDictionary = (
  dict: ImportDictionary,
  incoming: ImportNoteInfo,
  diagnostics: ConflictDiagnostic[],
): ImportNoteInfo => {
  const current = getImportNote(dict, incoming.positionKey, incoming.importLane)
  if (!current) {
    const created = cloneNoteInfo(incoming)
    setImportNote(dict, created)
    return created
  }

  const decision = classifyImportMerge(current, incoming)
  if (decision.classification !== 'expected_composition') {
    const titles: Record<Exclude<ImportMergeClass, 'expected_composition'>, string> = {
      same_kind_duplicate: '同一位置重复写入了同类音符',
      destructive_merge: '同一位置的音符会互相覆盖',
      speed_overwrite: '同一位置写入了不同的差速',
    }
    const detail = decision.reasons.length > 0 ? `；${decision.reasons.join('；')}` : ''
    diagnostics.push(makeImportDiagnostic(
      decision.classification,
      'import',
      'dedup',
      incoming,
      decision.existingSource,
      titles[decision.classification],
      `${parsedNoteLabel(incoming.source, incoming.category)} 与 ${noteInfoLabel(current)} 位于游戏认定的同一时间和同一轨道起点，因此只会留下一个音符${detail}。请删除重复项，或错开它们的时间/轨道。`,
    ))
  }
  updateNoteInfo(current, incoming)
  return current
}

const isGuideCategory = (category: ImportCategory): boolean =>
  category === 'Guide' || category === 'GuideEnd' || category === 'GuideHidden'

const applyGuideInheritance = (target: ImportNoteInfo, inherited: ImportNoteInfo | undefined): void => {
  if (!inherited) {
    return
  }
  if (inherited.critical) {
    target.critical = true
    target.criticalSource = inherited.criticalSource ?? inherited.source
  }
  if (inherited.flick !== 'none') {
    target.flick = inherited.flick
    target.flickSource = inherited.flickSource ?? inherited.source
  }
  if (inherited.lineType !== 'linear') {
    target.lineType = inherited.lineType
    target.lineTypeSource = inherited.lineTypeSource ?? inherited.source
  }
}

const isValidImportNote = (note: ParsedSusNote): boolean =>
  note.width !== -1 && note.importLane >= 0 && note.width + note.importLane < 13

const isIntentionalNonNote = (note: ParsedSusNote): boolean =>
  (note.laneType === 1 && (note.type === 4 || note.importLane === 13))

const buildImportDictionaries = (sus: ParsedSus): {
  normalDict: ImportDictionary
  guideDict: ImportDictionary
  diagnostics: ConflictDiagnostic[]
} => {
  const diagnostics = sus.formatIssues.map(makeFormatIssueDiagnostic)
  const normalDict: ImportDictionary = new Map()
  const guideDict: ImportDictionary = new Map()

  const rawNotes = [...sus.rawNotes].sort((left, right) => left.sourceOrder - right.sourceOrder)
  for (const note of rawNotes) {
    if (!isValidImportNote(note)) {
      if (!isIntentionalNonNote(note)) {
        diagnostics.push(makeSingleNoteDiagnostic(
          'import_drop',
          'import',
          note,
          '音符超出了游戏可用的轨道范围',
          `这个音符的起点或宽度超出游戏允许的范围，因此读取后会消失。请检查它的轨道位置和宽度（当前宽度：${note.width}）。`,
        ))
      }
      continue
    }
    const category = importCategoryForSusNote(note)
    if (!category) {
      if (!isIntentionalNonNote(note)) {
        diagnostics.push(makeSingleNoteDiagnostic(
          'import_drop',
          'import',
          note,
          '游戏不识别这个音符类型',
          `这一写法没有对应的游戏音符，因此读取后会消失。请检查音符种类和代码（行类型 ${note.laneType}，音符代码 ${note.type}）。`,
        ))
      }
      continue
    }

    if (!isGuideCategory(category)) {
      addToImportDictionary(normalDict, importNoteInfoFromSusNote(note, category, false), diagnostics)
    }

    const inherited = getImportNote(normalDict, note.positionKey, note.importLane)
    if (isGuideCategory(category)) {
      const guideIncoming = importNoteInfoFromSusNote(note, category, true)
      applyGuideInheritance(guideIncoming, inherited)
      addToImportDictionary(guideDict, guideIncoming, diagnostics)
    } else {
      const guideCurrent = getImportNote(guideDict, note.positionKey, note.importLane)
      if (guideCurrent) {
        const guideUpdate = importNoteInfoFromSusNote(note, category, true)
        applyGuideInheritance(guideUpdate, inherited)
        addToImportDictionary(guideDict, guideUpdate, diagnostics)
      }
    }
  }
  return { normalDict, guideDict, diagnostics }
}

const isLongRootCategory = (category: ImportCategory): boolean =>
  category === 'Long' || category === 'FrictionLong' || category === 'FrictionHideLong'

const isRuntimeSupportedCategory = (category: ImportCategory): boolean => category !== 'Skip'

const setRuntimeParent = (node: RuntimeNode, parent: RuntimeNode): void => {
  node.parent = parent
  node.root = parent
  if (parent.critical) {
    node.critical = true
  }
  switch (node.kind) {
    case 'Normal':
      node.category = 'Long'
      break
    case 'Friction':
      node.category = 'FrictionLong'
      break
    case 'FrictionHide':
      node.category = 'FrictionHideLong'
      break
    case 'GuideEnd':
      node.category = 'Guide'
      break
    default:
      break
  }
}

const attachRuntimeNode = (
  parent: RuntimeNode,
  node: RuntimeNode,
  diagnostics: ConflictDiagnostic[],
): void => {
  if (node.effectiveSpeed !== 1 && node.effectiveSpeed !== parent.effectiveSpeed) {
    diagnostics.push(makeImportDiagnostic(
      'child_speed_inherited',
      'maker',
      'dedup',
      node.info.speedSource,
      parent.info.speedSource,
      '长条中间节点的单独差速不会生效',
      `${noteInfoLabel(node.info)} 写了 ${node.effectiveSpeed}x，但连接成长条后会统一使用起点的 ${parent.effectiveSpeed}x。若要改变整条长条的速度，请修改起点的差速。`,
      {
        source: `起点 ${parent.effectiveSpeed}x`,
        target: `子节点 ${node.effectiveSpeed}x`,
      },
    ))
  }
  node.effectiveSpeed = parent.effectiveSpeed
  setRuntimeParent(node, parent)
  parent.children.push(node)
}

const simulateRuntime = (
  normalDict: ImportDictionary,
  guideDict: ImportDictionary,
  diagnostics: ConflictDiagnostic[],
): RuntimeNode[] => {
  const roots: RuntimeNode[] = []
  const tmpLong = new Map<number, RuntimeNode>()
  const tmpGuide = new Map<number, RuntimeNode>()

  const addRoot = (node: RuntimeNode): void => {
    roots.push(node)
  }

  const convert = (info: ImportNoteInfo): void => {
    if (!isRuntimeSupportedCategory(info.category)) {
      diagnostics.push(makeSingleNoteDiagnostic(
        'import_drop',
        'import',
        info.source,
        '单独的 Skip 标记不会生成音符',
        '这个位置最后只剩下 Skip 标记，没有可以附着的音符，因此读取后不会出现在谱面中。',
      ))
      return
    }

    const node = {} as RuntimeNode
    node.info = info
    node.kind = info.category
    node.category = info.category
    node.critical = info.critical
    node.effectiveSpeed = info.speedRatio
    node.parent = null
    node.root = node
    node.children = []

    if (info.category === 'Guide' || info.category === 'GuideEnd' || info.category === 'GuideHidden') {
      if (info.longNo === -1) {
        addRoot(node)
      } else if (info.category === 'Guide') {
        tmpGuide.set(info.longNo, node)
        addRoot(node)
      } else {
        const parent = tmpGuide.get(info.longNo)
        if (parent) {
          attachRuntimeNode(parent, node, diagnostics)
        } else {
          addRoot(node)
        }
      }
      return
    }

    if (info.category === 'Connection' || info.category === 'Hidden') {
      const parent = info.longNo === -1 ? undefined : tmpLong.get(info.longNo)
      if (parent) {
        attachRuntimeNode(parent, node, diagnostics)
      } else {
        addRoot(node)
      }
      return
    }

    if (info.longNo === -1) {
      addRoot(node)
    } else if (isLongRootCategory(info.category)) {
      tmpLong.set(info.longNo, node)
      addRoot(node)
    } else {
      const parent = tmpLong.get(info.longNo)
      if (parent) {
        attachRuntimeNode(parent, node, diagnostics)
      } else {
        addRoot(node)
      }
    }
  }

  for (const info of importDictionaryValues(normalDict)) {
    convert(info)
  }
  for (const info of importDictionaryValues(guideDict)) {
    convert(info)
  }
  return roots
}

const serializedCategory = (node: RuntimeNode): ImportCategory => {
  if (node.kind === 'FrictionHide' && node.category === 'FrictionHideLong') {
    return 'FrictionHide'
  }
  if (node.kind === 'Friction' && node.category === 'FrictionLong') {
    return 'Friction'
  }
  return node.category
}

const isCleanupCategory = (category: ImportCategory): boolean =>
  category === 'FrictionHide'
  || category === 'Guide'
  || category === 'GuideHidden'
  || category === 'Hidden'

const runtimeNodes = (roots: RuntimeNode[]): RuntimeNode[] =>
  roots.flatMap((root) => [root, ...root.children])

const isConnectedRuntimeNode = (node: RuntimeNode): boolean => node.root.children.length > 0

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

const isExpectedGuideModifierCleanup = (node: RuntimeNode, cover: RuntimeNode): boolean =>
  serializedCategory(node) === 'FrictionHide'
  && !node.info.guideDict
  && cover.info.guideDict
  && cover.root.kind === 'Guide'
  && cover.root.children.length > 0
  && node.info.positionKey === cover.info.positionKey
  && node.info.importLane === cover.info.importLane
  && node.info.width === cover.info.width
  && (node.info.critical || node.info.flick !== 'none' || node.info.lineType !== 'linear')
  && (!node.info.critical || cover.info.critical)
  && (node.info.flick === 'none' || node.info.flick === cover.info.flick)
  && (node.info.lineType === 'linear' || node.info.lineType === cover.info.lineType)

const addMakerCleanupDiagnostics = (roots: RuntimeNode[], diagnostics: ConflictDiagnostic[]): void => {
  const nodes = runtimeNodes(roots)
  const byTick = new Map<number, RuntimeNode[]>()
  for (const node of nodes) {
    const list = byTick.get(node.info.tick) ?? []
    list.push(node)
    byTick.set(node.info.tick, list)
  }

  for (const node of nodes) {
    if (!isCleanupCategory(serializedCategory(node)) || isConnectedRuntimeNode(node)) {
      continue
    }
    const covers = byTick.get(node.info.tick)?.filter((other) =>
      other !== node
      && isConnectedRuntimeNode(other)
      && laneOverlapsInclusive(node.info, other.info))
      ?? []
    if (covers.some((cover) => isExpectedGuideModifierCleanup(node, cover))) {
      continue
    }
    const cover = covers[0]
    if (!cover) {
      continue
    }
    diagnostics.push(makeImportDiagnostic(
      'export_cleanup',
      'maker',
      'dedup',
      node.info,
      cover.info,
      '重叠的独立节点会在生成谱面时消失',
      `${importCategoryLabel(serializedCategory(node))} 没有连接到其他节点，又与同一时刻的一条完整 ${importCategoryLabel(serializedCategory(cover))} 重叠，游戏生成最终谱面时会删除它。这里没有匹配到可安全合入 Guide 的辅助写法，请检查节点顺序、宽度和用途，或将它错开。`,
      {
        source: '重叠的已连接节点',
        target: '会被清理',
      },
    ))
  }
}

const buildGameImport = (sus: ParsedSus): GameImportResult => {
  const { normalDict, guideDict, diagnostics } = buildImportDictionaries(sus)
  const roots = simulateRuntime(normalDict, guideDict, diagnostics)
  addMakerCleanupDiagnostics(roots, diagnostics)
  return { diagnostics, roots }
}

const makePreviewDiagnostic = (
  category: ConflictDiagnostic['category'],
  severity: ConflictDiagnostic['severity'],
  first: RuntimeNode,
  second: RuntimeNode,
  title: string,
  summary: string,
): ConflictDiagnostic => ({
  id: `${category}-${first.info.source.sourceOrder}-${second.info.source.sourceOrder}`,
  category,
  stage: 'preview',
  severity,
  title,
  summary,
  measure: first.info.source.measure,
  positionText: getPositionText(
    first.info.source.measure,
    first.info.source.slotIndex,
    first.info.source.slotTotal,
  ),
  trackText: getTrackText(first.info.importLane, first.info.width),
  markers: [
    makeImportMarker('source', 'first', '节点 A', first.info),
    makeImportMarker('suppressed', 'second', '节点 B', second.info),
  ],
  sortTick: first.info.tick,
  sortLane: first.info.importLane,
})

const isLongChainRoot = (root: RuntimeNode): boolean =>
  root.children.length > 0 && isLongRootCategory(root.kind)

const isGuideChainRoot = (root: RuntimeNode): boolean =>
  root.children.length > 0 && root.kind === 'Guide'

const groupByMakerTick = (nodes: RuntimeNode[]): Map<number, RuntimeNode[]> => {
  const result = new Map<number, RuntimeNode[]>()
  for (const node of nodes) {
    const key = node.info.tick
    const list = result.get(key) ?? []
    list.push(node)
    result.set(key, list)
  }
  return result
}

const addRelayPreviewDiagnostics = (roots: RuntimeNode[], diagnostics: ConflictDiagnostic[]): void => {
  for (const root of roots) {
    const isGuide = isGuideChainRoot(root)
    if (!isGuide && !isLongChainRoot(root)) {
      continue
    }
    const relays = root.children.filter((node) => isGuide
      ? node.info.category === 'GuideHidden'
      : node.info.category === 'Connection' || node.info.category === 'Hidden' || node.info.isSkip)
    for (const samePosition of groupByMakerTick(relays).values()) {
      for (let index = 1; index < samePosition.length; index += 1) {
        const first = samePosition[index - 1]
        const second = samePosition[index]
        if (!first || !second) {
          continue
        }
        diagnostics.push(makePreviewDiagnostic(
          'hold_relay_same_time',
          isGuide ? 'render_bug' : 'crash',
          first,
          second,
          isGuide ? '同一 Guide 的中继节点完全同刻' : '同一长条的中继节点完全同刻',
          isGuide
            ? '同一条 Guide 中有两个中间节点位于完全相同的时刻，可能导致预览显示异常。请合并其中一个，或稍微错开时间。'
            : '同一条 Hold 中有两个中间节点位于完全相同的时刻，可能导致本家预览崩溃。请合并其中一个，或稍微错开时间。',
        ))
      }
    }
  }
}

const isRuntimeEndpoint = (node: RuntimeNode): boolean =>
  node.parent === null
  || (node.info.category !== 'Connection' && node.info.category !== 'Hidden' && !node.info.isSkip)

const addCrossChainPreviewDiagnostics = (roots: RuntimeNode[], diagnostics: ConflictDiagnostic[]): void => {
  const longNodes = roots
    .filter(isLongChainRoot)
    .flatMap((root) => [root, ...root.children])

  for (const samePosition of groupByMakerTick(longNodes).values()) {
    for (let leftIndex = 0; leftIndex < samePosition.length; leftIndex += 1) {
      const left = samePosition[leftIndex]
      if (!left) {
        continue
      }
      for (let rightIndex = leftIndex + 1; rightIndex < samePosition.length; rightIndex += 1) {
        const right = samePosition[rightIndex]
        if (!right || left.root === right.root) {
          continue
        }
        const sameRange = left.info.importLane === right.info.importLane && left.info.width === right.info.width
        if (sameRange) {
          diagnostics.push(makePreviewDiagnostic(
            'hold_node_exact_overlap',
            'crash',
            left,
            right,
            '不同长条的已连接节点完全重合',
            '两条不同 Hold 的节点在时间、轨道和宽度上完全相同，可能导致本家预览崩溃。请删除重复节点，或错开它们的时间/轨道。',
          ))
          continue
        }
        if (
          isRuntimeEndpoint(left)
          && isRuntimeEndpoint(right)
          && laneOverlapsInclusive(left.info, right.info)
        ) {
          diagnostics.push(makePreviewDiagnostic(
            'ambiguous_overlap',
            'render_bug',
            left,
            right,
            '不同长条端点同刻且范围重叠',
            '两条已连接 Hold 的端点处于同一时刻，而且轨道范围相交，可能造成预览路径异常。请错开端点的时间或轨道。',
          ))
        }
      }
    }
  }
}

const getRuntimeChainEndTick = (root: RuntimeNode): number =>
  Math.max(root.info.tick, ...root.children.map((child) => child.info.tick))

const addDenseSpeedGuideDiagnostics = (
  sus: ParsedSus,
  roots: RuntimeNode[],
  diagnostics: ConflictDiagnostic[],
): void => {
  // master.sus reproduces the game-side failure with 16 overlapping Notespeed Guides
  // starting within roughly a quarter beat of the last global hi-speed event.
  const maxDelayTicks = 120
  const minimumConcurrentGuides = 12
  const speedEvents = [...sus.highSpeeds].sort((left, right) => left.tick === right.tick
    ? left.sourceOrder - right.sourceOrder
    : left.tick - right.tick)
  const speedGuides = roots.filter((root) =>
    isGuideChainRoot(root)
    && root.effectiveSpeed !== 1
    && Number.isFinite(root.effectiveSpeed))
  const rootsByEvent = new Map<number, { event: ParsedHighSpeed; roots: RuntimeNode[] }>()

  for (const root of speedGuides) {
    let precedingEvent: ParsedHighSpeed | undefined
    for (const event of speedEvents) {
      if (event.tick > root.info.tick) {
        break
      }
      precedingEvent = event
    }
    if (!precedingEvent || root.info.tick - precedingEvent.tick > maxDelayTicks) {
      continue
    }
    const group = rootsByEvent.get(precedingEvent.sourceOrder) ?? { event: precedingEvent, roots: [] }
    group.roots.push(root)
    rootsByEvent.set(precedingEvent.sourceOrder, group)
  }

  for (const { event, roots: nearbyRoots } of rootsByEvent.values()) {
    let peakRoots: RuntimeNode[] = []
    for (const candidate of nearbyRoots) {
      const active = nearbyRoots.filter((root) =>
        root.info.tick <= candidate.info.tick
        && getRuntimeChainEndTick(root) >= candidate.info.tick)
      if (active.length > peakRoots.length) {
        peakRoots = active
      }
    }
    if (peakRoots.length < minimumConcurrentGuides) {
      continue
    }

    const first = [...peakRoots].sort((left, right) => left.info.tick - right.info.tick)[0]
    if (!first) {
      continue
    }
    const distinctSpeeds = [...new Set(peakRoots.map((root) => root.effectiveSpeed))]
      .sort((left, right) => left - right)
    diagnostics.push({
      id: `dense-speed-guide-after-hispeed-${event.sourceOrder}`,
      category: 'dense_speed_guide_after_hispeed',
      stage: 'preview',
      severity: 'render_bug',
      title: '全局变速后紧接着出现了过多差速 Guide',
      summary: `全局速度切到 ${event.speedRatio}x 后几乎立刻出现了 ${peakRoots.length} 条同时显示的差速 Guide（速度为 ${distinctSpeeds.join('/')}x）。游戏能够读入这些 Guide，但预览时它们可能闪到面板上方并停住，直到 Guide 结束才消失。建议减少同时出现的 Guide，或把它们与全局变速错开。`,
      measure: first.info.source.measure,
      positionText: getPositionText(
        first.info.source.measure,
        first.info.source.slotIndex,
        first.info.source.slotTotal,
      ),
      trackText: `多轨道（峰值 ${peakRoots.length} 条 Guide）`,
      markers: peakRoots.map((root, index) =>
        makeImportMarker('source', `dense-guide-${event.sourceOrder}-${index}`, `${root.effectiveSpeed}x Guide`, root.info)),
      sortTick: first.info.tick,
      sortLane: Math.min(...peakRoots.map((root) => root.info.importLane)),
    })
  }
}

const addPreviewDiagnostics = (
  sus: ParsedSus,
  roots: RuntimeNode[],
  diagnostics: ConflictDiagnostic[],
): void => {
  addRelayPreviewDiagnostics(roots, diagnostics)
  addCrossChainPreviewDiagnostics(roots, diagnostics)
  addDenseSpeedGuideDiagnostics(sus, roots, diagnostics)
}

const deduplicateDiagnostics = (diagnostics: ConflictDiagnostic[]): ConflictDiagnostic[] => {
  const seen = new Set<string>()
  return diagnostics.filter((diagnostic) => {
    if (seen.has(diagnostic.id)) {
      return false
    }
    seen.add(diagnostic.id)
    return true
  })
}

export const analyzeSusConflicts = (susText: string): ConflictDiagnostic[] => {
  const parsed = parseSusTextForAudit(susText)
  const { diagnostics, roots } = buildGameImport(parsed)
  addPreviewDiagnostics(parsed, roots, diagnostics)
  const result = deduplicateDiagnostics(diagnostics)
  const severityOrder: Record<ConflictDiagnostic['severity'], number> = {
    crash: 0,
    render_bug: 1,
    dedup: 2,
  }
  result.sort((left, right) => {
    if (left.severity !== right.severity) {
      return severityOrder[left.severity] - severityOrder[right.severity]
    }
    return left.sortTick === right.sortTick ? left.sortLane - right.sortLane : left.sortTick - right.sortTick
  })
  return result
}
