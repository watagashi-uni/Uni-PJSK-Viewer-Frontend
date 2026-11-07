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
 * 清空所有缓存数据（中文译文在单独的 viewer-translations 库里，不受影响）
 */
export async function clearAllCache(): Promise<void> {
    const db = await getMasterDB()
    const tx = db.transaction(['data', 'meta'], 'readwrite')
    await Promise.all([
        tx.objectStore('data').clear(),
        // 旧版歌曲译名的时间戳，已改用 viewer-translations
        tx.objectStore('meta').delete('translationTimestamp'),
        tx.objectStore('meta').delete('version'),
        tx.done,
    ])
}

/**
 * 删除指定的缓存数据
 */
export async function deleteCachedData(name: string): Promise<void> {
    const db = await getMasterDB()
    await db.delete('data', name)
}
