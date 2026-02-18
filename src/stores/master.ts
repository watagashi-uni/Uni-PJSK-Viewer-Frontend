import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getVersion } from '@/api/version'
import { getMasterData, getMusicTranslations, type MasterDataName } from '@/api/master'
import {
    getStoredVersion,
    setStoredVersion,
    getCachedData,
    setCachedData,
    clearAllCache,
    clearTranslationCache,
    getTranslationTimestamp,
    setTranslationTimestamp,
} from '@/utils/masterDB'

export const useMasterStore = defineStore('master', () => {
    // 状态
    const version = ref<string | null>(null)
    const isLoading = ref(false)
    const loadingFile = ref('')
    const cache = ref<Record<string, any[]>>({})
    const translations = ref<Record<number, string>>({})

    // 计算属性
    const isReady = computed(() => version.value !== null)

    /**
     * 初始化：检查版本并决定是否需要更新缓存
     */
    let initPromise: Promise<void> | null = null

    /**
     * 初始化：检查版本并决定是否需要更新缓存
     */
    async function initialize(): Promise<void> {
        // 如果已经初始化完成，直接返回
        if (isReady.value) return

        // 如果正在初始化，返回当前的 Promise
        if (initPromise) return initPromise

        initPromise = (async () => {
            try {
                // 获取服务器版本
                const serverInfo = await getVersion()
                const serverVersion = serverInfo.dataVersion

                // 获取本地版本
                const localVersion = await getStoredVersion()

                if (localVersion !== serverVersion) {
                    // 版本不同，清空缓存
                    console.log(`版本更新: ${localVersion} -> ${serverVersion}`)
                    await clearAllCache()
                    await setStoredVersion(serverVersion)

                    // 清空内存缓存（不清除翻译）
                    cache.value = {}
                }

                version.value = serverVersion
            } catch (error) {
                console.error('初始化 master 版本失败:', error)
                // 尝试使用本地版本
                const localVersion = await getStoredVersion()
                if (localVersion) {
                    version.value = localVersion
                }
            }
        })()

        try {
            await initPromise
        } finally {
            initPromise = null
        }
    }

    const pendingRequests = new Map<string, Promise<any>>()

    /**
     * 获取 master 数据（优先使用缓存，防止重复请求）
     */
    async function getMaster<T = any>(name: MasterDataName): Promise<T[]> {
        // 1. 检查内存缓存
        if (cache.value[name]) {
            return cache.value[name] as T[]
        }

        // 2. 检查是否有正在进行的请求（防止并发重复请求）
        if (pendingRequests.has(name)) {
            return pendingRequests.get(name) as Promise<T[]>
        }

        // 3. 创建新请求逻辑
        const promise = (async () => {
            // 3.1 检查 IndexedDB 缓存
            const cachedData = await getCachedData<T>(name)
            if (cachedData) {
                cache.value[name] = cachedData
                return cachedData
            }

            // 3.2 从服务器获取
            if (!version.value) {
                throw new Error('Version not initialized. Call initialize() first.')
            }

            isLoading.value = true
            loadingFile.value = name

            try {
                const data = await getMasterData<T>(name, version.value)
                await setCachedData(name, data)
                cache.value[name] = data
                return data
            } finally {
                isLoading.value = false
                loadingFile.value = ''
            }
        })()

        // 记录请求
        pendingRequests.set(name, promise)

        try {
            return await promise
        } finally {
            // 请求完成后移除记录
            pendingRequests.delete(name)
        }
    }

    /**
     * 获取歌曲翻译数据（带 1 天 TTL 缓存）
     */
    async function getTranslations(): Promise<Record<number, string>> {
        const ONE_DAY_MS = 24 * 60 * 60 * 1000

        // 1. 检查内存缓存是否有效
        if (Object.keys(translations.value).length > 0) {
            // 检查时间戳
            const timestamp = await getTranslationTimestamp()
            if (timestamp && Date.now() - timestamp < ONE_DAY_MS) {
                return translations.value
            }
        }

        // 2. 检查 IndexedDB 缓存是否有效
        const timestamp = await getTranslationTimestamp()
        if (timestamp && Date.now() - timestamp < ONE_DAY_MS) {
            const cachedData = await getCachedData<Record<number, string>>('translations')
            if (cachedData && typeof cachedData === 'object' && !Array.isArray(cachedData)) {
                translations.value = cachedData as Record<number, string>
                return translations.value
            }
        }

        // 3. 缓存过期或不存在，从服务器重新获取
        try {
            console.log('翻译缓存已过期或不存在，重新获取...')
            const data = await getMusicTranslations()
            translations.value = data
            await setCachedData('translations', data as any)
            await setTranslationTimestamp(Date.now())
            return data
        } catch (error) {
            console.error('获取翻译数据失败:', error)
            return {}
        }
    }

    /**
     * 强制刷新翻译（跳过所有缓存）
     */
    async function refreshTranslations(): Promise<Record<number, string>> {
        // 清除所有缓存
        await clearTranslationCache()
        translations.value = {}

        // 直接从服务器获取
        try {
            const data = await getMusicTranslations()
            translations.value = data
            await setCachedData('translations', data as any)
            await setTranslationTimestamp(Date.now())
            return data
        } catch (error) {
            console.error('刷新翻译数据失败:', error)
            return {}
        }
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
        cache.value = {}
        translations.value = {}
        version.value = null
        await initialize()
    }

    return {
        // 状态
        version,
        isLoading,
        loadingFile,
        cache,
        translations,
        // 计算属性
        isReady,
        // 方法
        initialize,
        getMaster,
        getMasters,
        getTranslations,
        refreshTranslations,
        refresh,
    }
})
