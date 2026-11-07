import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getVersion } from '@/api/version'
import { getMasterData, type MasterDataName } from '@/api/master'
import {
    getStoredVersion,
    setStoredVersion,
    getCachedData,
    setCachedData,
    clearAllCache,
} from '@/utils/masterDB'

export const useMasterStore = defineStore('master', () => {
    // 状态
    const version = ref<string | null>(null)
    const isLoading = ref(false)
    const loadingFile = ref('')
    const cache = ref<Record<string, any[]>>({})
    const assetVersion = ref<string | null>(null)
    const cacheRevision = ref(0)

    // 计算属性
    const isReady = computed(() => version.value !== null)

    /**
     * 初始化：检查版本并决定是否需要更新缓存
     */
    let initPromise: Promise<void> | null = null
    let versionCheckPromise: Promise<void> | null = null
    const pendingRequests = new Map<string, Promise<any>>()

    function invalidateMasterCache(): void {
        cache.value = {}
        cacheRevision.value += 1
    }

    /**
     * 从本地缓存恢复版本号，保证离线或弱网时仍可读取已缓存的 master 数据。
     */
    async function restoreStoredVersion(): Promise<string | undefined> {
        const localVersion = await getStoredVersion()
        if (localVersion) {
            version.value = localVersion
        }
        return localVersion
    }

    /**
     * 同步服务器版本；如果版本变化，立即清空本地 master 缓存。
     */
    async function syncVersion(): Promise<void> {
        if (versionCheckPromise) {
            return versionCheckPromise
        }

        versionCheckPromise = (async () => {
            const localVersion = await getStoredVersion()

            try {
                const serverInfo = await getVersion()
                const serverVersion = serverInfo.dataVersion

                if (localVersion !== serverVersion) {
                    console.log(`版本更新: ${localVersion} -> ${serverVersion}`)
                    await clearAllCache()
                    await setStoredVersion(serverVersion)
                    invalidateMasterCache()
                }

                version.value = serverVersion
                assetVersion.value = serverInfo.assetVersion || null
            } catch (error) {
                console.error('同步 master 版本失败:', error)

                if (localVersion) {
                    version.value = localVersion
                    return
                }

                if (version.value) {
                    return
                }

                throw error
            }
        })()

        try {
            await versionCheckPromise
        } finally {
            versionCheckPromise = null
        }
    }

    /**
     * 在后台检查版本，不阻塞当前页面使用现有缓存。
     * 每次调用都真实检查服务器版本，保证版本更新后能立刻被发现。
     */
    function checkVersionInBackground(): void {
        void syncVersion().catch((error) => {
            console.error('后台检查 master 版本失败:', error)
        })
    }

    /**
     * 初始化：检查版本并决定是否需要更新缓存
     */
    async function initialize(): Promise<void> {
        // 如果已经初始化完成，直接返回
        if (isReady.value) return

        // 如果正在初始化，返回当前的 Promise
        if (initPromise) return initPromise

        initPromise = (async () => {
            const localVersion = await restoreStoredVersion()

            if (localVersion) {
                checkVersionInBackground()
                return
            }

            await syncVersion()
        })()

        try {
            await initPromise
        } finally {
            initPromise = null
        }
    }

    /**
     * 获取 master 数据（优先使用缓存，防止重复请求）
     */
    async function getMaster<T = any>(name: MasterDataName): Promise<T[]> {
        // 1. 检查内存缓存
        if (cache.value[name]) {
            checkVersionInBackground()
            return cache.value[name] as T[]
        }

        // 2. 创建新请求逻辑
        const promise = (async () => {
            // 2.1 检查 IndexedDB 缓存
            const cachedData = await getCachedData<T>(name)
            if (cachedData) {
                cache.value[name] = cachedData
                checkVersionInBackground()
                return cachedData
            }

            // 2.2 从服务器获取
            if (!version.value) {
                await initialize()
                if (!version.value) {
                    throw new Error('Version not initialized. Call initialize() first.')
                }
            }

            const requestVersion = version.value
            const requestRevision = cacheRevision.value
            const requestKey = `${name}:${requestVersion}:${requestRevision}`

            if (pendingRequests.has(requestKey)) {
                return pendingRequests.get(requestKey) as Promise<T[]>
            }

            isLoading.value = true
            loadingFile.value = name

            const networkPromise = (async () => {
                try {
                    const data = await getMasterData<T>(name, requestVersion)

                    if (requestVersion !== version.value || requestRevision !== cacheRevision.value) {
                        return getMaster<T>(name)
                    }

                    await setCachedData(name, data)
                    cache.value[name] = data
                    return data
                } finally {
                    isLoading.value = false
                    loadingFile.value = ''
                    pendingRequests.delete(requestKey)
                }
            })()

            pendingRequests.set(requestKey, networkPromise)
            return networkPromise
        })()

        return promise
    }

    /**
     * 批量获取多个 master 数据
     */
    async function getMasters(names: MasterDataName[]): Promise<void> {
        isLoading.value = true

        try {
            for (const name of names) {
                loadingFile.value = name
                await getMaster(name)
            }
        } finally {
            isLoading.value = false
            loadingFile.value = ''
        }
    }

    /**
     * 清空所有缓存并重新初始化
     */
    async function refresh(): Promise<void> {
        await clearAllCache()
        invalidateMasterCache()
        assetVersion.value = null
        version.value = null
        await initialize()
    }

    return {
        // 状态
        version,
        isLoading,
        loadingFile,
        cache,
        assetVersion,
        cacheRevision,
        // 计算属性
        isReady,
        // 方法
        initialize,
        syncVersion,
        checkVersionInBackground,
        getMaster,
        getMasters,
        refresh,
    }
})
