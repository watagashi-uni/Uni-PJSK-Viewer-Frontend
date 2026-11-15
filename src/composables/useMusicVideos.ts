import { computed, effectScope, shallowRef, watch } from 'vue'
import { useMasterStore } from '@/stores/master'
import {
  musicVideoSources, type MusicVideoCategoryRow, type MusicVideoSource, type MusicVideoVariantRow,
} from '@/utils/musicVideos'

/** Categories of each song, and the video of each rendition that has its own; loaded once for the whole app. */
const categories = shallowRef<Map<number, Set<string>> | null>(null)
const variants = shallowRef<Map<number, string>>(new Map())
let request: Promise<void> | null = null
let watching = false

/** Which 2D MVs a song rendition has. Empty until master data is in, or when it has none. */
export function useMusicVideos() {
  const master = useMasterStore()

  function load() {
    request ??= Promise.all([
      master.getMaster<MusicVideoCategoryRow>('musicCategories'),
      master.getMaster<MusicVideoVariantRow>('musicAssetVariants'),
    ]).then(([categoryRows, variantRows]) => {
      const byMusic = new Map<number, Set<string>>()
      for (const row of categoryRows) {
        let set = byMusic.get(row.musicId)
        if (!set) byMusic.set(row.musicId, set = new Set())
        set.add(row.musicCategoryName)
      }
      categories.value = byMusic
      variants.value = new Map(variantRows.filter(row => row.musicAssetType === 'mv').map(row => [row.musicVocalId, row.assetbundleName]))
    }).catch(() => {
      // Without the categories no song offers an MV; asked again on next use.
      request = null
    })
  }
  load()
  if (!watching) {
    watching = true
    // Outlives the component that first asked: the data is shared by every view.
    effectScope(true).run(() => {
      watch(() => master.cacheRevision, () => {
        request = null
        load()
      })
    })
  }

  function sourcesFor(track: { musicId: number; vocalId: number; vocalType: string } | null | undefined): MusicVideoSource[] {
    if (!track) return []
    return musicVideoSources(track.musicId, { id: track.vocalId, type: track.vocalType }, categories.value?.get(track.musicId), variants.value.get(track.vocalId))
  }

  /** Master data is in: an empty list now means the song has no MV. */
  const ready = computed(() => categories.value !== null)

  return { sourcesFor, ready }
}
