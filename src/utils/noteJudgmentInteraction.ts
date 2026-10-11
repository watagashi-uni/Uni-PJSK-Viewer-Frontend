import { JUDGMENT_COLORS, type NoteJudgment } from '@/vendor/sekai-sus2img/judgmentTiming'

const states = new WeakMap<SVGSVGElement, {
  profiles: NoteJudgment[]
  selected: Map<Element, SVGGElement>
}>()
const namespace = 'http://www.w3.org/2000/svg'

export function clearNoteJudgments(svg: SVGSVGElement | null) {
  if (!svg) return
  const state = states.get(svg)
  if (!state) return
  for (const [target, layer] of state.selected) {
    layer.remove()
    target.setAttribute('aria-pressed', 'false')
  }
  state.selected.clear()
}

/** Extract only metadata and clickable notes; keep expensive note art in a static image. */
export function createJudgmentOverlay(svgText: string): string {
  const source = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement
  const overlay = source.cloneNode(false) as Element
  for (const child of source.children) {
    if (child.hasAttribute('data-judge-profiles')) overlay.append(child.cloneNode(true))
    if (child.localName !== 'svg') continue
    const targets = child.querySelector('[data-judge-targets]')
    if (!targets) continue
    const column = child.cloneNode(false)
    column.appendChild(targets.cloneNode(true))
    overlay.append(column)
  }
  return new XMLSerializer().serializeToString(overlay)
}

/** Compose the selected lightweight layers with the original artwork only for export. */
export function mergeJudgmentsForExport(svgText: string, overlay: SVGSVGElement | null): string {
  if (!overlay?.querySelector('[data-selected-judgment]')) return svgText
  const source = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const columns = source.querySelectorAll('[data-judge-targets]')
  overlay.querySelectorAll('[data-judge-targets]').forEach((column, index) => {
    for (const layer of column.querySelectorAll('[data-selected-judgment]')) {
      columns[index]?.prepend(layer.cloneNode(true))
    }
  })
  return new XMLSerializer().serializeToString(source)
}

/** Delegate from the preview container: no Vue state update or full SVG replacement. */
export function toggleNoteJudgment(event: Event) {
  if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return
  const target = event.target instanceof Element ? event.target.closest('[data-judge-note]') : null
  const svg = target?.closest<SVGSVGElement>('svg[data-judge-preview]')
  if (!target || !svg) return
  event.preventDefault()
  let state = states.get(svg)
  if (!state) {
    const metadata = svg.querySelector('[data-judge-profiles]')?.textContent
    if (!metadata) return
    state = { profiles: JSON.parse(metadata) as NoteJudgment[], selected: new Map() }
    states.set(svg, state)
  }
  const existing = state.selected.get(target)
  if (existing) {
    existing.remove()
    target.setAttribute('aria-pressed', 'false')
    state.selected.delete(target)
    return
  }

  const judgment = state.profiles[Number(target.getAttribute('data-profile'))]
  const parent = target.parentElement
  if (!judgment || !parent) return
  const y = Number(target.getAttribute('data-center'))
  const x = Number(target.getAttribute('x'))
  const width = Number(target.getAttribute('width'))
  const pixels = Number(parent.getAttribute('data-pixels-per-frame'))
  const bottom = Number(parent.getAttribute('data-bottom'))
  const layer = document.createElementNS(namespace, 'g')
  layer.setAttribute('data-selected-judgment', target.getAttribute('data-judge-note')!)
  layer.setAttribute('pointer-events', 'none')
  const bands = judgment.checkpoint ? [{ grade: 'perfect' as const, from: 0, to: 0, conditional: true }] : judgment.bands
  for (const band of bands) {
    const top = Math.max(0, y - band.to * pixels)
    const end = Math.min(bottom, y - band.from * pixels)
    if (end < top) continue
    const rect = document.createElementNS(namespace, 'rect')
    const attrs = {
      x, y: top, width, height: judgment.checkpoint ? 2 : end - top,
      fill: JUDGMENT_COLORS[band.grade], 'fill-opacity': band.conditional ? 0.2 : 0.35,
      stroke: JUDGMENT_COLORS[band.grade], 'stroke-width': 0.7,
      'data-grade': band.grade,
    }
    for (const [key, value] of Object.entries(attrs)) rect.setAttribute(key, String(value))
    if (band.conditional) rect.setAttribute('stroke-dasharray', '3 2')
    layer.append(rect)
  }
  // The hit targets remain on top, so the selected note can always be clicked again.
  parent.prepend(layer)
  target.setAttribute('aria-pressed', 'true')
  state.selected.set(target, layer)
}
