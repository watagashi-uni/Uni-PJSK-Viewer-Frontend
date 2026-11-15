import { effectScope, reactive, watch } from 'vue'
import type { SubtitleMode } from '@/utils/musicVideos'

/**
 * Karaoke lyrics floating over the site, like the desktop lyrics of music apps. Where the box
 * sits is kept as a share of the room left around it, so it stays in view as the window changes.
 */
export interface FloatingLyricsPrefs {
  enabled: boolean
  /** Clicks pass through; it can no longer be moved by accident. */
  locked: boolean
  mode: SubtitleMode
  /** Lyric size in px, and the width of the box. */
  size: number
  width: number
  /** 0 = left edge, 1 = right edge of the room left beside the box. */
  x: number
  /** 0 = bottom edge, 1 = top edge of the room left above the box. */
  y: number
}

export const FLOATING_SIZE_MIN = 14
export const FLOATING_SIZE_MAX = 72
export const FLOATING_WIDTH_MIN = 260

const STORAGE_KEY = 'player_floatingLyrics'

function defaults(): FloatingLyricsPrefs {
  const narrow = typeof window !== 'undefined' && window.innerWidth < 640
  return {
    enabled: false,
    locked: false,
    mode: 'ktv',
    size: narrow ? 20 : 30,
    width: narrow ? 360 : 880,
    x: 0.5,
    y: narrow ? 0.14 : 0.1,
  }
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback
}

function read(): FloatingLyricsPrefs {
  const prefs = defaults()
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<FloatingLyricsPrefs> | null
    if (saved && typeof saved === 'object') {
      prefs.enabled = saved.enabled === true
      prefs.locked = saved.locked === true
      if (saved.mode === 'ktv' || saved.mode === 'lyrics') prefs.mode = saved.mode
      prefs.size = clamp(saved.size, FLOATING_SIZE_MIN, FLOATING_SIZE_MAX, prefs.size)
      prefs.width = clamp(saved.width, FLOATING_WIDTH_MIN, 4000, prefs.width)
      prefs.x = clamp(saved.x, 0, 1, prefs.x)
      prefs.y = clamp(saved.y, 0, 1, prefs.y)
    }
  } catch {
    // Unreadable: the defaults.
  }
  return prefs
}

let prefs: FloatingLyricsPrefs | null = null

export function useFloatingLyrics() {
  if (!prefs) {
    const state = reactive(read())
    // Outlives whichever component asked first: the bar's button and the box share it.
    effectScope(true).run(() => {
      watch(state, (value) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
        } catch {
          // The layout simply does not persist.
        }
      }, { deep: true })
    })
    prefs = state
  }
  const state = prefs

  function toggle() {
    state.enabled = !state.enabled
    // Switched on again: it can be moved, or the user might not find how to.
    if (state.enabled) state.locked = false
  }

  return { prefs: state, toggle }
}
