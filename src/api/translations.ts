import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { masterApiBaseUrl } from './masterClient'
import { getSessionVersionInfo } from './version'

// 简体中文译名数据：version.json 指向按内容哈希命名的表和剧情文件，
// 哈希不变就一直用本地副本，只有变化的文件才重新下载。

export const zhBaseUrl = `${masterApiBaseUrl}/translations/zh-Hans`

/** 字段路径 → 日文原文 → 中文 */
export type ZhFieldMap = Record<string, Record<string, string>>
/** o 为官方或人工译文，a 为机翻 */
export interface ZhTable { o: ZhFieldMap; a: ZhFieldMap }
export type ZhStorySource = 'official' | 'auto-story' | 'toolbox' | 'ai'
export interface ZhStory {
  src: ZhStorySource
  /** 日文说话人显示名 → 中文 */
  names: Record<string, string>
  /** 与日服 TalkData 下标对齐 */
  lines: (string | null)[]
  /** SpecialEffectData 下标 → 地点、字幕卡、全屏旁白的中文 */
  effects: Record<string, string>
}
/**
 * 剧情索引的值：哈希，或 [哈希, 来源]。带来源时不用下载文件就能知道是不是机翻，
 * 关闭 AI 译文时可以省掉下载。
 */
export type ZhStoryIndexEntry = string | [hash: string, src: ZhStorySource]
export type ZhStoryIndex = Record<string, ZhStoryIndexEntry>
export function storyIndexHash(entry: ZhStoryIndexEntry | undefined): string | undefined {
  return Array.isArray(entry) ? entry[0] : entry
}
export function storyIndexSource(entry: ZhStoryIndexEntry | undefined): ZhStorySource | undefined {
  return Array.isArray(entry) ? entry[1] : undefined
}

/** 一个故事（活动、主线章节、卡面、特别篇）的 AI 梗概 */
export interface ZhStorySummary {
  title: string
  /** 整个故事的总结，段落以换行分隔；只有一话的故事没有 */
  summary?: string
  /** scenarioId → 这一话的梗概 */
  episodes: Record<string, string>
}

export interface ZhVersion {
  v: number
  lang: string
  updatedAt: number
  d: Record<string, string>
  s: string
  /** 剧情梗概索引的哈希 */
  sum?: string
}

interface Stored<T> { hash: string; data: T }
/** hash：经 /api/version 下发的译文版本哈希；走 version.json 时为空 */
interface StoredVersion { fetchedAt: number; data: ZhVersion; hash?: string }

interface ZhDBSchema extends DBSchema {
  meta: { key: string; value: StoredVersion | Stored<ZhStoryIndex> | Stored<Record<string, string>> }
  tables: { key: string; value: Stored<ZhTable> }
  stories: { key: string; value: Stored<ZhStory> }
  summaries: { key: string; value: Stored<ZhStorySummary> }
}

const DB_NAME = 'viewer-translations'
const LANG = 'zh-Hans'
const VERSION_HASH = /^[0-9a-f]{6,64}$/
// 后备路径：/api/version 没给哈希时，10 分钟内重新打开页面直接用本地的 version.json，不发请求
const VERSION_REUSE_MS = 10 * 60 * 1000

let dbPromise: Promise<IDBPDatabase<ZhDBSchema> | null> | null = null

function getDB(): Promise<IDBPDatabase<ZhDBSchema> | null> {
  if (!dbPromise) {
    dbPromise = openDB<ZhDBSchema>(DB_NAME, 2, {
      upgrade(db) {
        for (const name of ['meta', 'tables', 'stories', 'summaries'] as const) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name)
        }
      },
    }).catch((error) => {
      // 隐私模式等环境没有 IndexedDB 时只用内存缓存
      console.warn('翻译缓存不可用:', error)
      return null
    })
  }
  return dbPromise
}

async function dbGet<S extends 'meta' | 'tables' | 'stories' | 'summaries'>(store: S, key: string): Promise<ZhDBSchema[S]['value'] | undefined> {
  try {
    const db = await getDB()
    return (await db?.get(store, key)) as ZhDBSchema[S]['value'] | undefined
  } catch {
    return undefined
  }
}

async function dbPut<S extends 'meta' | 'tables' | 'stories' | 'summaries'>(store: S, key: string, value: ZhDBSchema[S]['value']): Promise<void> {
  try {
    const db = await getDB()
    await db?.put(store, value as never, key)
  } catch (error) {
    console.warn('写入翻译缓存失败:', error)
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  // Content-Encoding: br 由浏览器解压
  const response = await fetch(`${zhBaseUrl}/${path}`, { credentials: 'omit' })
  if (!response.ok) throw new Error(`${response.status} ${path}`)
  return response.json() as Promise<T>
}

// 同一时刻对同一文件只发一次请求
const inflight = new Map<string, Promise<unknown>>()
function once<T>(key: string, task: () => Promise<T>): Promise<T> {
  const pending = inflight.get(key)
  if (pending) return pending as Promise<T>
  const promise = task().finally(() => inflight.delete(key))
  inflight.set(key, promise)
  return promise
}

let versionPromise: Promise<ZhVersion | null> | null = null

/** 每个会话最多请求一次 version.json；离线时用上次保存的版本。 */
export function loadZhVersion(): Promise<ZhVersion | null> {
  if (!versionPromise) {
    // 旧版歌曲译名在 Service Worker 里的缓存，已不再使用
    void globalThis.caches?.delete('translations-cache').catch(() => false)
    versionPromise = (async () => {
      const [stored, info] = await Promise.all([
        dbGet('meta', 'version') as Promise<StoredVersion | undefined>,
        getSessionVersionInfo().catch(() => null),
      ])
      // 主路径：master 的 /api/version 本来每次会话都会请求，里面带了译文版本哈希。
      // 与本地一致就不发请求；不同就下载按哈希命名、可长期缓存的 version.<哈希>.json
      const hash = info?.translations?.[LANG]
      const validHash = typeof hash === 'string' && VERSION_HASH.test(hash) ? hash : undefined
      if (validHash && stored?.data && stored.hash === validHash) return stored.data
      if (!validHash && stored?.data && Date.now() - stored.fetchedAt < VERSION_REUSE_MS && Date.now() >= stored.fetchedAt) return stored.data
      try {
        const data = await fetchJson<ZhVersion>(validHash ? `version.${validHash}.json` : 'version.json')
        if (!data || typeof data.d !== 'object') throw new Error('version.json 格式不支持')
        await dbPut('meta', 'version', { fetchedAt: Date.now(), data, hash: validHash })
        return data
      } catch (error) {
        console.warn('获取翻译版本失败:', error)
        return stored?.data ?? null
      }
    })()
    // 失败且本地没有副本时允许之后重试
    void versionPromise.then((value) => { if (!value) versionPromise = null })
  }
  return versionPromise
}

/**
 * 读取一张 master 表的译文。本地哈希与 version.json 一致时不发请求；
 * 新文件按表名覆盖旧文件，旧版本随之删除。
 */
export function loadZhTable(name: string): Promise<ZhTable | null> {
  return once(`d:${name}`, async () => {
    const [version, stored] = await Promise.all([loadZhVersion(), dbGet('tables', name)])
    const hash = version?.d[name]
    if (!version) return stored?.data ?? null
    if (!hash) return null
    if (stored?.hash === hash) return stored.data
    try {
      const data = await fetchJson<ZhTable>(`d/${name}.${hash}.json`)
      const table: ZhTable = { o: data.o || {}, a: data.a || {} }
      await dbPut('tables', name, { hash, data: table })
      return table
    } catch (error) {
      console.warn(`获取 ${name} 译文失败:`, error)
      return stored?.data ?? null
    }
  })
}

let storyIndexPromise: Promise<ZhStoryIndex | null> | null = null

/** 剧情索引只在打开剧情阅读器时读取。 */
export function loadZhStoryIndex(): Promise<ZhStoryIndex | null> {
  if (!storyIndexPromise) {
    storyIndexPromise = (async () => {
      const [version, stored] = await Promise.all([loadZhVersion(), dbGet('meta', 'storyIndex') as Promise<Stored<ZhStoryIndex> | undefined>])
      if (!version?.s) return stored?.data ?? null
      if (stored?.hash === version.s) return stored.data
      try {
        const data = await fetchJson<ZhStoryIndex>(`s/index.${version.s}.json`)
        await dbPut('meta', 'storyIndex', { hash: version.s, data })
        void pruneStories(data)
        return data
      } catch (error) {
        console.warn('获取剧情译文索引失败:', error)
        return stored?.data ?? null
      }
    })()
    void storyIndexPromise.then((value) => { if (!value) storyIndexPromise = null })
  }
  return storyIndexPromise
}

// 索引更新后删掉已被替换或下架的剧情译文
async function pruneStories(index: ZhStoryIndex): Promise<void> {
  try {
    const db = await getDB()
    if (!db) return
    const tx = db.transaction('stories', 'readwrite')
    for (let cursor = await tx.store.openCursor(); cursor; cursor = await cursor.continue()) {
      if (storyIndexHash(index[cursor.key]) !== cursor.value.hash) await cursor.delete()
    }
    await tx.done
  } catch { /* 清理失败不影响使用 */ }
}

/**
 * 不下载剧情文件就能得知的译文来源：索引里带了来源，或本地已有同一版本的文件。
 * 没有译文时返回 null，无法得知时返回 undefined。
 */
export async function peekZhStorySource(scenarioId: string): Promise<ZhStorySource | null | undefined> {
  const [index, stored] = await Promise.all([loadZhStoryIndex(), dbGet('stories', scenarioId)])
  const entry = index?.[scenarioId]
  if (index && !entry) return null
  const src = storyIndexSource(entry)
  if (src) return src
  if (stored && (!index || stored.hash === storyIndexHash(entry))) return stored.data.src
  return undefined
}

/** 读取一话剧情的译文，没有译文时返回 null。 */
export function loadZhStory(scenarioId: string): Promise<ZhStory | null> {
  return once(`s:${scenarioId}`, async () => {
    const [index, stored] = await Promise.all([loadZhStoryIndex(), dbGet('stories', scenarioId)])
    const hash = storyIndexHash(index?.[scenarioId])
    if (!index) return stored?.data ?? null
    if (!hash) return null
    if (stored?.hash === hash) return stored.data
    try {
      const data = await fetchJson<ZhStory>(`s/${encodeURIComponent(scenarioId)}.${hash}.json`)
      const story: ZhStory = { src: data.src, names: data.names || {}, lines: Array.isArray(data.lines) ? data.lines : [], effects: data.effects || {} }
      await dbPut('stories', scenarioId, { hash, data: story })
      return story
    } catch (error) {
      console.warn(`获取 ${scenarioId} 剧情译文失败:`, error)
      return stored?.data ?? null
    }
  })
}

/** 清空全部译文缓存，下次使用时重新下载。 */
export async function clearZhCache(): Promise<void> {
  versionPromise = null
  storyIndexPromise = null
  summaryIndexPromise = null
  const db = await getDB()
  if (!db) return
  const tx = db.transaction(['meta', 'tables', 'stories', 'summaries'], 'readwrite')
  await Promise.all([tx.objectStore('meta').clear(), tx.objectStore('tables').clear(), tx.objectStore('stories').clear(), tx.objectStore('summaries').clear(), tx.done])
}

let summaryIndexPromise: Promise<Record<string, string> | null> | null = null

/** 梗概索引：打开剧情目录或详情页的故事区块时才读取，每个会话一次 */
export function loadZhSummaryIndex(): Promise<Record<string, string> | null> {
  if (!summaryIndexPromise) {
    summaryIndexPromise = (async () => {
      const [version, stored] = await Promise.all([loadZhVersion(), dbGet('meta', 'summaryIndex') as Promise<Stored<Record<string, string>> | undefined>])
      if (!version?.sum) return version ? null : stored?.data ?? null
      if (stored?.hash === version.sum) return stored.data
      try {
        const data = await fetchJson<Record<string, string>>(`sum/index.${version.sum}.json`)
        await dbPut('meta', 'summaryIndex', { hash: version.sum, data })
        void pruneSummaries(data)
        return data
      } catch (error) {
        console.warn('获取剧情梗概索引失败:', error)
        return stored?.data ?? null
      }
    })()
    void summaryIndexPromise.then((value) => { if (!value) summaryIndexPromise = null })
  }
  return summaryIndexPromise
}

async function pruneSummaries(index: Record<string, string>): Promise<void> {
  try {
    const db = await getDB()
    if (!db) return
    const tx = db.transaction('summaries', 'readwrite')
    for (let cursor = await tx.store.openCursor(); cursor; cursor = await cursor.continue()) {
      if (index[cursor.key] !== cursor.value.hash) await cursor.delete()
    }
    await tx.done
  } catch { /* 清理失败不影响使用 */ }
}

/** 一个故事的梗概（键如 event_12、unit_3、card_100、special_5），没有时返回 null */
export function loadZhSummary(storyKey: string): Promise<ZhStorySummary | null> {
  return once(`sum:${storyKey}`, async () => {
    const [index, stored] = await Promise.all([loadZhSummaryIndex(), dbGet('summaries', storyKey)])
    const hash = index?.[storyKey]
    if (!index) return stored?.data ?? null
    if (!hash) return null
    if (stored?.hash === hash) return stored.data
    try {
      const data = await fetchJson<ZhStorySummary>(`sum/${encodeURIComponent(storyKey)}.${hash}.json`)
      const summary: ZhStorySummary = { title: data.title || '', summary: data.summary || undefined, episodes: data.episodes || {} }
      await dbPut('summaries', storyKey, { hash, data: summary })
      return summary
    } catch (error) {
      console.warn(`获取 ${storyKey} 梗概失败:`, error)
      return stored?.data ?? null
    }
  })
}
