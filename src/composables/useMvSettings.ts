import { effectScope, reactive, ref, watch } from 'vue'
import type { MusicVideoKind, SubtitleExtra, SubtitleMode } from '@/utils/musicVideos'

export type SubtitleSize = 's' | 'm' | 'l'
export interface MvSettings {
  mode: SubtitleMode | 'off'
  extra: SubtitleExtra
  ruby: boolean
  singerColors: boolean
  size: SubtitleSize
}

export const SUBTITLE_MODES: { value: MvSettings['mode']; label: string }[] = [
  { value: 'off', label: '关闭' },
  { value: 'lyrics', label: '歌词字幕' },
  { value: 'ktv', label: 'KTV 字幕' },
]
export const SUBTITLE_EXTRAS: { value: SubtitleExtra; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'translation', label: '译文' },
  { value: 'romaji', label: '罗马音' },
]
export const SUBTITLE_SIZES: { value: SubtitleSize; label: string; scale: number }[] = [
  { value: 's', label: '小', scale: 0.82 },
  { value: 'm', label: '中', scale: 1 },
  { value: 'l', label: '大', scale: 1.22 },
]

// v3: KTV with singer colours and readings, nothing under the lines; choices made while
// testing start over.
const STORAGE_KEY = 'mv_subtitles_v3'

function read(): MvSettings {
  const settings: MvSettings = { mode: 'ktv', extra: 'none', ruby: true, singerColors: true, size: 'm' }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<MvSettings> | null
    if (saved && typeof saved === 'object') {
      if (SUBTITLE_MODES.some(m => m.value === saved.mode)) settings.mode = saved.mode!
      if (SUBTITLE_EXTRAS.some(e => e.value === saved.extra)) settings.extra = saved.extra!
      if (typeof saved.ruby === 'boolean') settings.ruby = saved.ruby
      if (typeof saved.singerColors === 'boolean') settings.singerColors = saved.singerColors
      if (SUBTITLE_SIZES.some(s => s.value === saved.size)) settings.size = saved.size!
    }
  } catch {
    // Unreadable: the defaults.
  }
  return settings
}

let settings: MvSettings | null = null
/** The MV kind picked during this visit; a song without it plays the one it has. */
const chosenKind = ref<MusicVideoKind | null>(null)

/** Subtitle choices, the same for every MV on the site and remembered across visits. */
export function useMvSettings() {
  if (!settings) {
    const state = reactive(read())
    // Outlives the player that first asked: the settings are shared by every one of them.
    effectScope(true).run(() => {
      watch(state, (value) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
        } catch {
          // The choice simply does not persist.
        }
      }, { deep: true })
    })
    settings = state
  }
  return { settings, chosenKind }
}
