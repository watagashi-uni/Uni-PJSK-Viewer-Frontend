import { shallowRef } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useCharacterName } from '@/composables/useCharacterName'
import { useZh } from '@/composables/useZh'
import { characterColor, characterPortrait, type PlayerSinger, type TrackSources } from '@/utils/playerTracks'
import { performerCharacterId } from '@/api/lyrics'
import type { SingerAvatar } from '@/components/player/SingerAvatars.vue'

type UnitRow = TrackSources['characterUnits'][number]
type CharacterRow = TrackSources['characters'][number]

const units = shallowRef<UnitRow[]>([])
const characters = shallowRef<CharacterRow[]>([])
let requested = false

/**
 * Singers as portraits. Names follow the translation setting; the ring colour is
 * each character's own colour from master data, loaded once for the whole app.
 */
export function useSingerAvatars() {
  const master = useMasterStore()
  const { characterName } = useCharacterName()
  const zhOutside = useZh('outsideCharacters')

  if (!requested) {
    requested = true
    void Promise.all([master.getMaster<UnitRow>('gameCharacterUnits'), master.getMaster<CharacterRow>('gameCharacters')])
      .then(([unitRows, characterRows]) => {
        units.value = unitRows
        characters.value = characterRows
      })
      .catch(() => { requested = false })
  }

  /** Singers of a rendition, as stored on a queued track. */
  function trackAvatars(singers: PlayerSinger[]): SingerAvatar[] {
    return singers.map((singer) => {
      if (singer.type === 'game') {
        return {
          key: `game-${singer.id}`,
          name: characterName(singer),
          src: characterPortrait(singer.id),
          color: singer.color || characterColor(units.value, singer.id),
        }
      }
      const name = singer.name || ''
      return { key: `outside-${singer.id}`, name: zhOutside.t('name', name) || name, src: null }
    })
  }

  /** A singer named in a lyrics file; the cast gets a portrait, guests their initial. */
  function performerAvatar(performer: { performerId: string; name: string; color?: string }): SingerAvatar {
    const characterId = performerCharacterId(performer.performerId)
    if (characterId === null) return { key: performer.performerId, name: performer.name, src: null, color: performer.color }
    const row = characters.value.find(c => c.id === characterId)
    return {
      key: `game-${characterId}`,
      name: row ? characterName(row) : performer.name,
      src: characterPortrait(characterId),
      color: characterColor(units.value, characterId) || performer.color,
    }
  }

  function singerNames(singers: PlayerSinger[], separator = '・'): string {
    return trackAvatars(singers).map(s => s.name).filter(Boolean).join(separator)
  }

  return { trackAvatars, performerAvatar, singerNames }
}
