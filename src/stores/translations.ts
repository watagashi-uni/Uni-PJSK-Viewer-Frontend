import { defineStore } from 'pinia'
import { markRaw, shallowReactive } from 'vue'
import { clearZhCache, loadZhTable, type ZhTable } from '@/api/translations'

export interface ZhEntry {
  text: string
  /** 机翻 */
  ai: boolean
}

export const useTranslationStore = defineStore('translations', () => {
  // 表数据很大且只读，只让“某张表已加载”这件事成为响应式依赖
  const tables = shallowReactive(new Map<string, ZhTable | null>())
  const pending = new Set<string>()

  function ensure(name: string): void {
    if (tables.has(name) || pending.has(name)) return
    pending.add(name)
    void loadZhTable(name)
      .then((table) => { tables.set(name, table ? markRaw(table) : null) })
      .catch(() => { tables.set(name, null) })
      .finally(() => pending.delete(name))
  }

  function ensureAll(names: readonly string[]): void {
    for (const name of names) ensure(name)
  }

  function isLoaded(name: string): boolean {
    return tables.has(name)
  }

  /** 查找日文原文的译文；没有译文或与原文相同时返回 undefined。 */
  function lookup(table: string, path: string, jp: string | null | undefined): ZhEntry | undefined {
    if (!jp) return undefined
    const data = tables.get(table)
    if (!data) return undefined
    const official = data.o[path]?.[jp]
    if (official) return official === jp ? undefined : { text: official, ai: false }
    const ai = data.a[path]?.[jp]
    return ai && ai !== jp ? { text: ai, ai: true } : undefined
  }

  async function clear(): Promise<void> {
    await clearZhCache()
    const names = [...tables.keys()]
    tables.clear()
    ensureAll(names)
  }

  return { tables, ensure, ensureAll, isLoaded, lookup, clear }
})
