import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface MasterDBSchema extends DBSchema {
    meta: {
        key: string
        value: string
    }
    data: {
        key: string
        value: any[]
    }
}

const DB_NAME = 'viewer-master'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<MasterDBSchema>> | null = null

/**
 * 获取 IndexedDB 数据库实例
 */
export function getMasterDB(): Promise<IDBPDatabase<MasterDBSchema>> {
    if (!dbPromise) {
        dbPromise = openDB<MasterDBSchema>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // 创建 meta 存储（版本号等元数据）
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta')
                }
                // 创建 data 存储（master 数据）
                if (!db.objectStoreNames.contains('data')) {
                    db.createObjectStore('data')
                }
            },
        })
    }
    return dbPromise
}

/**
 * 获取存储的版本号
 */
export async function getStoredVersion(): Promise<string | undefined> {
    const db = await getMasterDB()
    return db.get('meta', 'version')
}

/**
 * 保存版本号
 */
export async function setStoredVersion(version: string): Promise<void> {
    const db = await getMasterDB()
    await db.put('meta', version, 'version')
}

/**
 * 获取翻译数据的时间戳
 */
export async function getTranslationTimestamp(): Promise<number | undefined> {
    const db = await getMasterDB()
    const ts = await db.get('meta', 'translationTimestamp')
    return ts ? Number(ts) : undefined
}

/**
 * 保存翻译数据的时间戳
 */
export async function setTranslationTimestamp(timestamp: number): Promise<void> {
    const db = await getMasterDB()
    await db.put('meta', String(timestamp), 'translationTimestamp')
}

/**
 * 获取缓存的 master 数据
 */
export async function getCachedData<T = any>(name: string): Promise<T[] | undefined> {
    const db = await getMasterDB()
    return db.get('data', name) as Promise<T[] | undefined>
}

/**
 * 保存 master 数据到缓存
 */
export async function setCachedData<T = any>(name: string, data: T[]): Promise<void> {
    const db = await getMasterDB()
    await db.put('data', data, name)
}

/**
 * 清空所有缓存数据
 */
export async function clearAllCache(): Promise<void> {
    const db = await getMasterDB()
    // 清除除 translations 和 translationTimestamp 外的所有数据
    const tx = db.transaction(['data', 'meta'], 'readwrite')
    const dataStore = tx.objectStore('data')
    const metaStore = tx.objectStore('meta')

    // 获取所有 data key 并删除非 translations 的
    const dataKeys = await dataStore.getAllKeys()
    for (const key of dataKeys) {
        if (key !== 'translations') {
            await dataStore.delete(key)
        }
    }

    // 只删除 version，保留 translationTimestamp
    await metaStore.delete('version')
    await tx.done
}

/**
 * 清除翻译缓存
 */
export async function clearTranslationCache(): Promise<void> {
    const db = await getMasterDB()
    await db.delete('data', 'translations')
    await db.delete('meta', 'translationTimestamp')
}

/**
 * 删除指定的缓存数据
 */
export async function deleteCachedData(name: string): Promise<void> {
    const db = await getMasterDB()
    await db.delete('data', name)
}
