import { applyRebase } from '@/vendor/sekai-sus2img/rebase'
import { parseSusText } from '@/vendor/sekai-sus2img/parser'
import type { ConflictDiagnostic } from './susConflictAuditCore'

export { analyzeSusConflicts } from './susConflictAuditCore'
export type { ConflictDiagnostic, ConflictMarker } from './susConflictAuditCore'

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

/** @deprecated Use renderSusToSvgWithConflictOverlay from sekai-sus2img instead. This duplicates renderer layout calculation. */
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

/** @deprecated Ghost notes and crash markers are now rendered natively by the integrated renderer via renderSusToSvgWithConflictOverlay. */
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
