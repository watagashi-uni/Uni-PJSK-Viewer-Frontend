import { defineStore } from 'pinia'
import { computed, markRaw, ref, shallowReactive, watch } from 'vue'
import { loadZhSummary, type ZhStorySummary } from '@/api/translations'
import { useSettingsStore } from '@/stores/settings'

const REVEAL_KEY = 'story-summary-revealed'

function readRevealed(): boolean {
  try { return sessionStorage.getItem(REVEAL_KEY) === '1' } catch { return false }
}

/**
 * 剧情梗概（AI 生成）。只在打开某个故事时下载它的那一个文件；
 * 关闭译名显示或关闭 AI 译文时不显示也不下载。
 * “显示总结”的选择在本次会话内记住，默认收起以免剧透。
 */
export const useStorySummaryStore = defineStore('storySummaries', () => {
  const settings = useSettingsStore()
  const items = shallowReactive(new Map<string, ZhStorySummary | null>())
  const pending = new Set<string>()
  const revealed = ref(readRevealed())
  const enabled = computed(() => settings.translationMode !== 'off' && !settings.hideAiTranslation)

  watch(revealed, (value) => {
    try { sessionStorage.setItem(REVEAL_KEY, value ? '1' : '0') } catch { /* 存储不可用 */ }
  })

  function ensure(key: string | null | undefined): void {
    if (!key || !enabled.value || items.has(key) || pending.has(key)) return
    pending.add(key)
    void loadZhSummary(key)
      .then((value) => { items.set(key, value ? markRaw(value) : null) })
      .catch(() => { items.set(key, null) })
      .finally(() => pending.delete(key))
  }

  function get(key: string | null | undefined): ZhStorySummary | null | undefined {
    if (!key || !enabled.value) return undefined
    return items.get(key)
  }

  function isLoading(key: string | null | undefined): boolean {
    return !!key && enabled.value && !items.has(key)
  }

  /** 搜索只用已经下载的梗概，不为搜索单独下载 */
  function searchText(key: string): string {
    const item = get(key)
    if (!item) return ''
    return [item.summary, ...Object.values(item.episodes)].filter(Boolean).join(' ')
  }

  return { items, revealed, enabled, ensure, get, isLoading, searchText }
})
