// Compact official chart JSON (sekai-chart-compact v1), published by Sekai
// next to each official SUS as `<difficulty>.v1.json`.
//
// Port of Sekai tools/chart-json/chart_compact.mjs (expand only), shared with
// sekai-mmw-preview-web src/lib/officialChartJson.ts; keep them
// identical. The expanded object is exactly what this app builds from the SUS
// (converter output + _mmwScoreEvents + _mmwSourceFormat), so JSON.stringify
// of it — and therefore the local chartKey — matches the SUS path byte for byte.

export const COMPACT_CHART_FORMAT = 'sekai-chart-compact'

type ChangeValue = number | string
export type CompactChart = {
  format: typeof COMPACT_CHART_FORMAT
  v: 1
  source: { sha256: string; size: number; waveOffsetMs?: number }
  chartKey: string
  ticksMax: number
  events: [number, number, ChangeValue][]
  notes: number[][]
  triggers: [number, number, string, string][] | null
}

const TRIGGER_TYPES = ['skill', 'fever-begin', 'fever-start'] as const

export function isCompactChart(value: unknown): value is CompactChart {
  const chart = value as CompactChart | null
  return !!chart && chart.format === COMPACT_CHART_FORMAT && chart.v === 1 && Array.isArray(chart.events)
    && Array.isArray(chart.notes) && typeof chart.chartKey === 'string'
}

export function expandCompactChart(compact: CompactChart): Record<string, unknown> {
  if (!isCompactChart(compact)) throw new Error('不支持的谱面 JSON 格式。')
  const at = (row: number[], index: number, fallback = 0) => row[index] ?? fallback
  let serial = 1
  const events = compact.events.map(([eventType, ticks, changeValue]) => {
    serial += 1
    return { $id: String(serial), id: serial - 1, eventType, ticks, changeValue }
  })
  const firstSerial = serial
  const ids = compact.notes.map((row, position) => firstSerial + position + at(row, 9))
  const idAt = (position: number) => ids[position] ?? -1
  const previous = new Array<number>(compact.notes.length).fill(-1)
  compact.notes.forEach((row, position) => { if (at(row, 8)) previous[position + at(row, 8)] = idAt(position) })
  let ticks = 0
  const notes = compact.notes.map((row, position) => {
    serial += 1
    ticks += at(row, 0)
    const flags = at(row, 5)
    return {
      $id: String(serial), id: idAt(position), ticks, laneStart: at(row, 1), laneEnd: at(row, 1) + at(row, 2),
      category: at(row, 3), type: flags & 1, speedRatio: row.length > 10 ? at(row, 10, 1) : 1, noteLineType: at(row, 7),
      noteBaseType: at(row, 4), previousConnectionId: previous[position] ?? -1,
      nextConnectionId: at(row, 8) ? idAt(position + at(row, 8)) : -1, direction: at(row, 6),
      isSkip: (flags & 2) !== 0, IsSingle: (flags & 4) !== 0, IsConnectedFirst: (flags & 8) !== 0,
      IsConnectedLast: (flags & 16) !== 0,
    }
  })
  const chart: Record<string, unknown> = {
    $id: '1', VersionCode: 1, MusicScoreEventDataList: events, EventArray: [], NoteList: notes,
    MusicScoreTicksMax: compact.ticksMax, MusicId: 0, FullComboDataHash: null,
  }
  if (Array.isArray(compact.triggers)) {
    chart._mmwScoreEvents = compact.triggers.map(([type, triggerTicks, susLane, susWidth]) => (
      { type: TRIGGER_TYPES[type], ticks: triggerTicks, susLane, susWidth }))
  }
  chart._mmwSourceFormat = 'sus'
  return chart
}
