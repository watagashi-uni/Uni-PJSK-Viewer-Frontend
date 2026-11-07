import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { masterApiBaseUrl } from './masterClient'

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
export interface ZhVersion {
  v: number
  lang: string
  updatedAt: number
  d: Record<string, string>
  s: string
}

interface Stored<T> { hash: string; data: T }
interface StoredVersion { fetchedAt: number; data: ZhVersion }

interface ZhDBSchema extends DBSchema {
  meta: { key: string; value: StoredVersion | Stored<Record<string, string>> }
  tables: { key: string; value: Stored<ZhTable> }
  stories: { key: string; value: Stored<ZhStory> }
}

const DB_NAME = 'viewer-translations'
// 10 分钟内重新打开页面直接用本地的 version.json，不发请求
const VERSION_REUSE_MS = 10 * 60 * 1000

let dbPromise: Promise<IDBPDatabase<ZhDBSchema> | null> | null = null

function getDB(): Promise<IDBPDatabase<ZhDBSchema> | null> {
  if (!dbPromise) {
    dbPromise = openDB<ZhDBSchema>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('meta')
        db.createObjectStore('tables')
        db.createObjectStore('stories')
      },
    }).catch((error) => {
      // 隐私模式等环境没有 IndexedDB 时只用内存缓存
      console.warn('翻译缓存不可用:', error)
      return null
    })
  }
  return dbPromise
}

async function dbGet<S extends 'meta' | 'tables' | 'stories'>(store: S, key: string): Promise<ZhDBSchema[S]['value'] | undefined> {
  try {
    const db = await getDB()
    return (await db?.get(store, key)) as ZhDBSchema[S]['value'] | undefined
  } catch {
    return undefined
  }
}

async function dbPut<S extends 'meta' | 'tables' | 'stories'>(store: S, key: string, value: ZhDBSchema[S]['value']): Promise<void> {
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
      const stored = await dbGet('meta', 'version') as StoredVersion | undefined
      if (stored?.data && Date.now() - stored.fetchedAt < VERSION_REUSE_MS && Date.now() >= stored.fetchedAt) return stored.data
      try {
        const data = await fetchJson<ZhVersion>('version.json')
        if (!data || typeof data.d !== 'object') throw new Error('version.json 格式不支持')
        await dbPut('meta', 'version', { fetchedAt: Date.now(), data })
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

let storyIndexPromise: Promise<Record<string, string> | null> | null = null

/** 剧情索引只在打开剧情阅读器时读取。 */
export function loadZhStoryIndex(): Promise<Record<string, string> | null> {
  if (!storyIndexPromise) {
    storyIndexPromise = (async () => {
      const [version, stored] = await Promise.all([loadZhVersion(), dbGet('meta', 'storyIndex') as Promise<Stored<Record<string, string>> | undefined>])
      if (!version?.s) return stored?.data ?? null
      if (stored?.hash === version.s) return stored.data
      try {
        const data = await fetchJson<Record<string, string>>(`s/index.${version.s}.json`)
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
async function pruneStories(index: Record<string, string>): Promise<void> {
  try {
    const db = await getDB()
    if (!db) return
    const tx = db.transaction('stories', 'readwrite')
    for (let cursor = await tx.store.openCursor(); cursor; cursor = await cursor.continue()) {
      if (index[cursor.key] !== cursor.value.hash) await cursor.delete()
    }
    await tx.done
  } catch { /* 清理失败不影响使用 */ }
}

/** 读取一话剧情的译文，没有译文时返回 null。 */
export function loadZhStory(scenarioId: string): Promise<ZhStory | null> {
  return once(`s:${scenarioId}`, async () => {
    const [index, stored] = await Promise.all([loadZhStoryIndex(), dbGet('stories', scenarioId)])
    const hash = index?.[scenarioId]
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
  const db = await getDB()
  if (!db) return
  const tx = db.transaction(['meta', 'tables', 'stories'], 'readwrite')
  await Promise.all([tx.objectStore('meta').clear(), tx.objectStore('tables').clear(), tx.objectStore('stories').clear(), tx.done])
}
