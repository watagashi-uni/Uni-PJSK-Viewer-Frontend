// @ts-nocheck
import { Fraction } from './fraction'
import { Tap, Directional, Slide, TapType, DirectionalType, SlideType } from './model'
import type { ConflictDiagnostic, ConflictMarker } from '@/utils/susConflictAudit'

export type CrashMarkerRender = {
  id: string
  diagnosticId: string
  bar: Fraction
  lane: number
  width: number
  label: string
  role: string
  color: string
  markerIndex: number
}

const MARKER_COLORS: Record<string, string> = {
  suppressed: '#ef4444',
  source: '#f59e0b',
  kept: '#14b8a6',
}

const markerColor = (role: string): string => MARKER_COLORS[role] ?? '#14b8a6'

/**
 * Converts dedup-category diagnostic markers into ghost Note objects
 * that the renderer can draw with reduced opacity.
 *
 * Only markers from diagnostics with severity 'dedup' produce ghost notes.
 */
export const buildGhostNotesFromDiagnostics = (
  diagnostics: ConflictDiagnostic[],
): (Tap | Directional | Slide)[] => {
  const ghostNotes: (Tap | Directional | Slide)[] = []

  for (const diagnostic of diagnostics) {
    if (diagnostic.severity !== 'dedup') {
      continue
    }

    for (const marker of diagnostic.markers) {
      if (marker.role !== 'suppressed') {
        continue
      }

      const ghost = createGhostNote(marker)
      if (ghost) {
        ghostNotes.push(ghost)
      }
    }
  }

  return ghostNotes
}

/**
 * Converts diagnostic markers into renderable marker overlay descriptors.
 * Covers ALL severity types — circles with labels help identify
 * source/suppressed/kept notes at a glance.
 */
export const buildCrashMarkersFromDiagnostics = (
  diagnostics: ConflictDiagnostic[],
): CrashMarkerRender[] => {
  const markers: CrashMarkerRender[] = []

  for (const diagnostic of diagnostics) {
    diagnostic.markers.forEach((marker, markerIndex) => {
      markers.push({
        id: marker.id,
        diagnosticId: diagnostic.id,
        bar: new Fraction(marker.bar),
        lane: marker.susLane - 2,
        width: marker.width,
        label: marker.label,
        role: marker.role,
        color: markerColor(marker.role),
        markerIndex,
      })
    })
  }

  return markers
}

/**
 * Generates invisible focus anchor descriptors for scroll-to targeting.
 * Covers all diagnostic categories — one anchor per diagnostic,
 * positioned at the first suppressed marker.
 */
export const buildFocusAnchorsFromDiagnostics = (
  diagnostics: ConflictDiagnostic[],
): CrashMarkerRender[] => {
  const anchors: CrashMarkerRender[] = []

  for (const diagnostic of diagnostics) {
    const suppressed = diagnostic.markers.find((m) => m.role === 'suppressed') ?? diagnostic.markers[0]
    if (!suppressed) {
      continue
    }

    anchors.push({
      id: `focus-${diagnostic.id}`,
      diagnosticId: diagnostic.id,
      bar: new Fraction(suppressed.bar),
      lane: suppressed.susLane - 2,
      width: suppressed.width,
      label: '',
      role: 'suppressed',
      color: 'transparent',
      markerIndex: 0,
    })
  }

  return anchors
}

/**
 * Creates a single ghost Note from a suppressed marker.
 * Returns null if the marker lacks noteLaneType/noteType data.
 */
const createGhostNote = (marker: ConflictMarker): Tap | Directional | Slide | null => {
  if (marker.noteLaneType === undefined || marker.noteType === undefined) {
    return null
  }

  const bar = new Fraction(marker.bar)
  const lane = marker.susLane
  const width = marker.width
  const type = marker.noteType

  switch (marker.noteLaneType) {
    case 1: {
      // Tap
      return new Tap({ bar, lane, width, type })
    }
    case 5: {
      // Directional — render as ghost flick + ghost note
      return new Directional({ bar, lane, width, type })
    }
    case 3:
    case 9: {
      // Slide or Guide — don't ghost individual nodes; a hold is a chain,
      // and ghosting a single relay/end node is misleading.
      // Circle markers alone are sufficient for hold-related diagnostics.
      return null
    }
    default:
      return null
  }
}
