import { watchEffect } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useTranslationStore } from '@/stores/translations'

export interface CharacterNameParts {
  firstName?: string | null
  givenName?: string | null
}

/**
 * 角色名：只要开启了译名显示就用国服官方名（穂波→穗波、えむ→笑梦），
 * 没有译名的部分保留日文；只显示日文时用原名。
 */
export function useCharacterName() {
  const settings = useSettingsStore()
  const store = useTranslationStore()
  watchEffect(() => { if (settings.translationMode !== 'off') store.ensure('gameCharacters') })

  function jpName(character?: CharacterNameParts | null): string {
    return character ? `${character.firstName || ''}${character.givenName || ''}` : ''
  }
  function zhName(character?: CharacterNameParts | null): string {
    if (!character) return ''
    const part = (path: string, jp?: string | null) => (jp ? store.lookup('gameCharacters', path, jp)?.text ?? jp : '')
    return `${part('firstName', character.firstName)}${part('givenName', character.givenName)}`
  }
  function characterName(character?: CharacterNameParts | null): string {
    return settings.translationMode === 'off' ? jpName(character) : zhName(character)
  }
  /** 搜索时日文名和中文名都能匹配 */
  function characterSearch(character?: CharacterNameParts | null): string {
    const jp = jpName(character)
    const zh = zhName(character)
    return zh && zh !== jp ? `${jp} ${zh}` : jp
  }

  return { characterName, characterSearch, jpName, zhName }
}
