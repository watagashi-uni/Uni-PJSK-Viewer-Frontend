import { defineStore } from 'pinia'
import { markRaw, shallowReactive, shallowRef } from 'vue'
import { clearZhCache, loadZhTable, loadZhVersion, type ZhTable, type ZhVersion } from '@/api/translations'

export interface ZhEntry {
  text: string
  /** 机翻 */
  ai: boolean
}

export const useTranslationStore = defineStore('translations', () => {
  // 文件数据很大且只读，只让“某个文件已加载”这件事成为响应式依赖
  const files = shallowReactive(new Map<string, ZhTable | null>())
  const pending = new Set<string>()
  const version = shallowRef<ZhVersion | null>(null)
  const versionReady = shallowRef(false)
  let versionRequest: Promise<void> | null = null

  function syncVersion(): Promise<void> {
    versionRequest ??= loadZhVersion()
      .then((value) => { version.value = value })
      .catch(() => { version.value = null })
      .finally(() => { versionReady.value = true })
    return versionRequest
  }

  /**
   * 大表的长字段单独成文件（`<表>~<字段路径>`），其余字段留在 `<表>` 里。
   * 列表页只下载名称所在的主文件，说明类字段等用到时再下载。
   */
  function fileFor(table: string, path: string): string {
    const split = `${table}~${path}`
    return version.value?.d[split] ? split : table
  }

  function loadFile(name: string): void {
    if (files.has(name) || pending.has(name)) return
    pending.add(name)
    void loadZhTable(name)
      .then((table) => { files.set(name, table ? markRaw(table) : null) })
      .catch(() => { files.set(name, null) })
      .finally(() => pending.delete(name))
  }

  /** 下载一张表的主文件；给出 path 时下载该字段所在的文件 */
  function ensure(table: string, path?: string): void {
    if (!versionReady.value) {
      void syncVersion().then(() => ensure(table, path))
      return
    }
    loadFile(path ? fileFor(table, path) : table)
  }

  function ensureAll(tables: readonly string[]): void {
    for (const table of tables) ensure(table)
  }

  function isLoaded(table: string, path?: string): boolean {
    return versionReady.value && files.has(path ? fileFor(table, path) : table)
  }

  /** 查找日文原文的译文；没有译文或与原文相同时返回 undefined。只读已下载的文件。 */
  function lookup(table: string, path: string, jp: string | null | undefined): ZhEntry | undefined {
    if (!jp || !versionReady.value) return undefined
    const data = files.get(fileFor(table, path))
    if (!data) return undefined
    const official = data.o[path]?.[jp]
    if (official) return official === jp ? undefined : { text: official, ai: false }
    const ai = data.a[path]?.[jp]
    return ai && ai !== jp ? { text: ai, ai: true } : undefined
  }

  async function clear(): Promise<void> {
    await clearZhCache()
    const names = [...files.keys()]
    files.clear()
    versionRequest = null
    versionReady.value = false
    await syncVersion()
    for (const name of names) loadFile(name)
  }

  return { files, version, ensure, ensureAll, isLoaded, lookup, fileFor, clear }
})
