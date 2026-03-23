import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { openDB } from 'idb'
import { request } from '@/utils/request'
import { useOAuthStore } from '@/stores/oauth'

export interface StoredAccount {
    userId: string
    name: string
    lastRefresh: number
    uploadTime?: number  // suite API 的 upload_time (秒级时间戳)
}

const STORAGE_KEY = 'sekaiUserProfiles'
const SUITE_CACHE_PREFIX = 'suiteCache_'
const PROFILE_DATA_KEY = 'sekaiUserProfileData'

function isOAuthTokenError(error: any): boolean {
    const status = Number(error?.status)
    const oauthError = String(error?.oauthError || '').toLowerCase()
    const message = String(error?.message || '').toLowerCase()

    if ([400, 401, 403].includes(status)) return true
    if (oauthError === 'invalid_grant' || oauthError === 'invalid_token') return true
    if (message.includes('refresh token') || message.includes('refresh_token') || message.includes('invalid_grant') || message.includes('access_token')) return true
    if (message.includes('请重新授权') || message.includes('未找到 refresh_token') || message.includes('未获取到 access_token')) return true
    return false
}

function normalizeUnixSeconds(timestamp: unknown): number | null {
    const value = Number(timestamp)
    if (!Number.isFinite(value) || value <= 0) return null
    if (value > 1_000_000_000_000) {
        return Math.floor(value / 1000)
    }
    return Math.floor(value)
}

async function restartOAuthAuthorization(userId: string) {
    const oauthStore = useOAuthStore()
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`
    oauthStore.clearTokensForUser(userId)
    await oauthStore.startAuthorization(userId, returnTo)
    throw new Error('正在跳转 OAuth 授权页面...')
}

async function fetchSuiteByOAuth(userId: string): Promise<any> {
    const oauthStore = useOAuthStore()
    const accountStore = useAccountStore()
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`

    if (oauthStore.hasTokenForUser(userId)) {
        try {
            return await oauthStore.fetchGameData('jp', 'suite', userId)
        } catch (e: any) {
            if (isOAuthTokenError(e)) {
                await restartOAuthAuthorization(userId)
            } else {
                throw e
            }
        }
    }

    const shouldAuthorize = await accountStore.requestOAuthConfirm()
    if (!shouldAuthorize) {
        throw new Error('未完成 OAuth 授权，无法读取 Suite 数据')
    }
    await oauthStore.startAuthorization(userId, returnTo)
    throw new Error('正在跳转 OAuth 授权页面...')
}

async function fetchMysekaiByOAuth(userId: string): Promise<any> {
    const oauthStore = useOAuthStore()
    const accountStore = useAccountStore()
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`

    if (oauthStore.hasTokenForUser(userId)) {
        try {
            return await oauthStore.fetchGameData('jp', 'mysekai', userId)
        } catch (e: any) {
            if (isOAuthTokenError(e)) {
                await restartOAuthAuthorization(userId)
            } else {
                throw e
            }
        }
    }

    const shouldAuthorize = await accountStore.requestOAuthConfirm()
    if (!shouldAuthorize) {
        throw new Error('未完成 OAuth 授权，无法读取 MySekai 数据')
    }
    await oauthStore.startAuthorization(userId, returnTo)
    throw new Error('正在跳转 OAuth 授权页面...')
}

const dbPromise = openDB('sekai-viewer-db', 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains('caches')) {
            db.createObjectStore('caches')
        }
    },
})

export const useAccountStore = defineStore('account', () => {
    const accounts = ref<StoredAccount[]>([])
    const currentUserId = ref('')

    // suite 刷新中状态（全局可用）
    const suiteRefreshing = ref(false)
    const mysekaiRefreshing = ref(false)
    const profileRefreshing = ref(false)
    const suiteRefreshToastMessage = ref('')
    const suiteRefreshToastHint = ref('')
    const suiteNotFoundModalVisible = ref(false)
    let suiteRefreshToastTimer: number | null = null

    // OAuth Confirm
    const oauthConfirmVisible = ref(false)
    let resolveOAuth: ((value: boolean) => void) | null = null

    function confirmOAuth() {
        if (resolveOAuth) resolveOAuth(true)
    }

    function cancelOAuth() {
        if (resolveOAuth) resolveOAuth(false)
    }

    async function requestOAuthConfirm(): Promise<boolean> {
        oauthConfirmVisible.value = true
        return new Promise((resolve) => {
            resolveOAuth = (value: boolean) => {
                oauthConfirmVisible.value = false
                resolve(value)
            }
        })
    }

    function dismissSuiteRefreshToast() {
        suiteRefreshToastMessage.value = ''
        suiteRefreshToastHint.value = ''
        if (suiteRefreshToastTimer !== null) {
            window.clearTimeout(suiteRefreshToastTimer)
            suiteRefreshToastTimer = null
        }
    }

    function showSuiteNotFoundModal() {
        suiteNotFoundModalVisible.value = true
    }

    function dismissSuiteNotFoundModal() {
        suiteNotFoundModalVisible.value = false
    }

    // 内存中的缓存（UI 界面可以直接读取）
    const suiteCaches = ref<Record<string, any>>({})
    const mysekaiCaches = ref<Record<string, any>>({})
    const profileCaches = ref<Record<string, any>>({})

    // 当前账号
    const currentAccount = computed(() =>
        accounts.value.find(a => a.userId === currentUserId.value)
    )

    // 当前账号 upload_time 格式化
    const uploadTimeText = computed(() => {
        if (!currentAccount.value?.uploadTime) return ''
        return new Date(currentAccount.value.uploadTime * 1000).toLocaleString('zh-CN')
    })

    // 当前账号 profile 刷新时间
    const lastRefreshText = computed(() => {
        if (!currentAccount.value?.lastRefresh) return ''
        return new Date(currentAccount.value.lastRefresh).toLocaleString('zh-CN')
    })

    async function initialize() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) accounts.value = JSON.parse(raw)
        } catch { accounts.value = [] }

        // 执行 LocalStorage 到 IndexedDB 的数据迁移
        await migrateLocalStorageToIDB()

        // 加载所有账号的缓存数据
        await Promise.all(accounts.value.map(a => loadDataForUser(a.userId)))

        const last = localStorage.getItem('account_currentUserId')
        if (last && accounts.value.some(a => a.userId === last)) {
            currentUserId.value = last
        } else if (accounts.value.length > 0 && accounts.value[0]) {
            currentUserId.value = accounts.value[0].userId
            localStorage.setItem('account_currentUserId', accounts.value[0].userId)
        }
    }

    async function migrateLocalStorageToIDB() {
        try {
            const db = await dbPromise
            const tx = db.transaction('caches', 'readwrite')

            // 迁移所有用户的 Suite 和 Profile
            for (const acc of accounts.value) {
                const uid = acc.userId

                // 迁移 Suite
                const suiteRaw = localStorage.getItem(`${SUITE_CACHE_PREFIX}${uid}`)
                if (suiteRaw) {
                    tx.store.put(JSON.parse(suiteRaw), `suite_${uid}`)
                    localStorage.removeItem(`${SUITE_CACHE_PREFIX}${uid}`)
                }

                // 迁移 Profile
                const profileRaw = localStorage.getItem(`${PROFILE_DATA_KEY}_${uid}`)
                if (profileRaw) {
                    tx.store.put(JSON.parse(profileRaw), `profile_${uid}`)
                    localStorage.removeItem(`${PROFILE_DATA_KEY}_${uid}`)
                }
            }
            await tx.done
        } catch (e) {
            console.error('Migration to IndexedDB failed', e)
        }
    }

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.value))
    }

    async function selectAccount(userId: string) {
        currentUserId.value = userId
        localStorage.setItem('account_currentUserId', userId)
        await loadDataForUser(userId)
    }

    async function loadDataForUser(userId: string) {
        if (!userId) return
        try {
            const db = await dbPromise
            const [suiteData, mysekaiData, profileData] = await Promise.all([
                db.get('caches', `suite_${userId}`),
                db.get('caches', `mysekai_${userId}`),
                db.get('caches', `profile_${userId}`)
            ])
            if (suiteData) suiteCaches.value[userId] = suiteData
            if (mysekaiData) mysekaiCaches.value[userId] = mysekaiData
            if (profileData) profileCaches.value[userId] = profileData
        } catch (e) {
            console.error('Failed to load user data from IDB:', e)
        }
    }

    function addAccount(account: StoredAccount) {
        const existing = accounts.value.find(a => a.userId === account.userId)
        if (existing) {
            existing.name = account.name
            existing.lastRefresh = account.lastRefresh
            if (account.uploadTime) existing.uploadTime = account.uploadTime
        } else {
            accounts.value.push(account)
        }
        save()
    }

    async function removeAccount(userId: string) {
        accounts.value = accounts.value.filter(a => a.userId !== userId)
        useOAuthStore().clearTokensForUser(userId)

        try {
            const db = await dbPromise
            const tx = db.transaction('caches', 'readwrite')
            tx.store.delete(`suite_${userId}`)
            tx.store.delete(`mysekai_${userId}`)
            tx.store.delete(`profile_${userId}`)
            await tx.done
            delete suiteCaches.value[userId]
            delete mysekaiCaches.value[userId]
            delete profileCaches.value[userId]

            // Clean up old localStorage fallback
            localStorage.removeItem(`${SUITE_CACHE_PREFIX}${userId}`)
            localStorage.removeItem(`${PROFILE_DATA_KEY}_${userId}`)
        } catch (e) {
            console.error('Failed to delete user caches', e)
        }

        if (currentUserId.value === userId) {
            const nextUserId = accounts.value[0]?.userId || ''
            if (nextUserId) {
                await selectAccount(nextUserId)
            } else {
                currentUserId.value = ''
                localStorage.removeItem('account_currentUserId')
            }
        }
        save()
    }

    function updateUploadTime(userId: string, uploadTime: number) {
        const acc = accounts.value.find(a => a.userId === userId)
        if (acc) {
            acc.uploadTime = uploadTime
            save()
        }
    }

    // ==================== Caches ====================
    function getSuiteCache(userId: string): any | null {
        return suiteCaches.value[userId] || null
    }

    async function saveSuiteCache(userId: string, data: any) {
        suiteCaches.value[userId] = data
        try {
            const db = await dbPromise
            await db.put('caches', JSON.parse(JSON.stringify(data)), `suite_${userId}`)
        } catch (e) { console.error('Failed to save suite to IDB', e) }
    }

    function getMysekaiCache(userId: string): any | null {
        return mysekaiCaches.value[userId] || null
    }

    async function saveMysekaiCache(userId: string, data: any) {
        mysekaiCaches.value[userId] = data
        try {
            const db = await dbPromise
            await db.put('caches', JSON.parse(JSON.stringify(data)), `mysekai_${userId}`)
        } catch (e) { console.error('Failed to save mysekai to IDB', e) }
    }

    function getProfileCache(userId: string): any | null {
        return profileCaches.value[userId] || null
    }

    async function saveProfileCache(userId: string, data: any) {
        profileCaches.value[userId] = data
        try {
            const db = await dbPromise
            await db.put('caches', JSON.parse(JSON.stringify(data)), `profile_${userId}`)
        } catch (e) { console.error('Failed to save profile to IDB', e) }
    }

    // ==================== API 刷新 ====================
    async function refreshProfile(userId: string) {
        profileRefreshing.value = true
        try {
            let data: any
            try {
                data = await request.getProfile<any>(`/api/user/%7Buser_id%7D/${userId}/profile`)
            } catch (err: any) {
                if (err.name === 'RequestError') {
                    if (err.status === 404) throw new Error('用户不存在')
                    if (err.status === 403) throw new Error('该用户未公开Profile')
                    throw new Error(`请求失败: ${err.status}`)
                }
                throw err
            }
            const acc = accounts.value.find(a => a.userId === userId)

            // 构建 userHonorMissions
            const masterClear = data.userMusicDifficultyClearCount?.find((d: any) => d.musicDifficultyType === 'master')
            data.userHonorMissions = masterClear
                ? [{ honorMissionType: 'master_full_perfect', progress: masterClear.allPerfect }]
                : []

            if (acc) {
                acc.name = data.user.name
                acc.lastRefresh = Date.now()
                save()
            }
            await saveProfileCache(userId, data)
            return data
        } finally {
            profileRefreshing.value = false
        }
    }

    async function refreshSuite(userId: string) {
        suiteRefreshing.value = true
        try {
            const oauthStore = useOAuthStore()
            const setSuiteRefreshToast = (source: 'public' | 'oauth') => {
                suiteRefreshToastMessage.value = source === 'public'
                    ? '已通过公开API更新'
                    : '已通过oauth认证更新'
                suiteRefreshToastHint.value = source === 'public'
                    ? '打开工具箱的公开访问不安全，有id就可以获取所有抓包信息，如在意可关闭公开访问，本站支持工具箱oauth私有数据获取'
                    : ''
                if (suiteRefreshToastTimer !== null) {
                    window.clearTimeout(suiteRefreshToastTimer)
                }
                suiteRefreshToastTimer = window.setTimeout(() => {
                    dismissSuiteRefreshToast()
                }, source === 'public' ? 12000 : 5000)
            }

            // 已有该账号 token 时，优先走 OAuth 受保护接口，避免先请求 public API
            if (oauthStore.hasTokenForUser(userId)) {
                try {
                    const oauthData = await oauthStore.fetchGameData('jp', 'suite', userId)
                    const uploadTime = normalizeUnixSeconds(oauthData.upload_time)
                    if (uploadTime) {
                        updateUploadTime(userId, uploadTime)
                    }
                    await saveSuiteCache(userId, oauthData)
                    setSuiteRefreshToast('oauth')
                    return oauthData
                } catch (e: any) {
                    if (Number(e?.status) === 404) {
                        showSuiteNotFoundModal()
                        throw new Error('用户未上传数据')
                    }
                    if (isOAuthTokenError(e)) {
                        await restartOAuthAuthorization(userId)
                    } else {
                        throw e
                    }
                }
            }

            let data: any
            try {
                data = await request.getSuite<any>(`/public/jp/suite/${userId}`)
            } catch (err: any) {
                if (err.name === 'RequestError') {
                    if (err.status === 404) {
                        showSuiteNotFoundModal()
                        throw new Error('用户未上传数据')
                    }
                    if (err.status === 403) {
                        data = await fetchSuiteByOAuth(userId)
                        const uploadTime = normalizeUnixSeconds(data.upload_time)
                        if (uploadTime) {
                            updateUploadTime(userId, uploadTime)
                        }
                        await saveSuiteCache(userId, data)
                        setSuiteRefreshToast('oauth')
                        return data
                    }
                    throw new Error(`HTTP ${err.status}`)
                }
                throw err
            }
            const uploadTime = normalizeUnixSeconds(data.upload_time)
            if (uploadTime) {
                updateUploadTime(userId, uploadTime)
            }
            await saveSuiteCache(userId, data)
            setSuiteRefreshToast('public')
            return data
        } finally {
            suiteRefreshing.value = false
        }
    }

    async function refreshMysekai(userId: string) {
        mysekaiRefreshing.value = true
        try {
            const oauthStore = useOAuthStore()

            if (oauthStore.hasTokenForUser(userId)) {
                try {
                    const oauthData = await oauthStore.fetchGameData('jp', 'mysekai', userId)
                    await saveMysekaiCache(userId, oauthData)
                    return oauthData
                } catch (e: any) {
                    if (isOAuthTokenError(e)) {
                        await restartOAuthAuthorization(userId)
                    } else {
                        throw e
                    }
                }
            }

            let data: any
            try {
                data = await request.getSuite<any>(`/public/jp/mysekai/${userId}`)
            } catch (err: any) {
                if (err.name === 'RequestError') {
                    if (err.status === 404) throw new Error('用户未上传 MySekai 数据')
                    if (err.status === 403) {
                        data = await fetchMysekaiByOAuth(userId)
                        await saveMysekaiCache(userId, data)
                        return data
                    }
                    throw new Error(`HTTP ${err.status}`)
                }
                throw err
            }
            await saveMysekaiCache(userId, data)
            return data
        } finally {
            mysekaiRefreshing.value = false
        }
    }

    return {
        accounts,
        currentUserId,
        currentAccount,
        uploadTimeText,
        lastRefreshText,
        suiteRefreshing,
        mysekaiRefreshing,
        profileRefreshing,
        suiteRefreshToastMessage,
        suiteRefreshToastHint,
        suiteNotFoundModalVisible,
        dismissSuiteRefreshToast,
        showSuiteNotFoundModal,
        dismissSuiteNotFoundModal,
        oauthConfirmVisible,
        confirmOAuth,
        cancelOAuth,
        requestOAuthConfirm,
        initialize,
        save,
        selectAccount,
        addAccount,
        removeAccount,
        updateUploadTime,
        saveProfileCache,
        getProfileCache,
        getSuiteCache,
        getMysekaiCache,
        saveSuiteCache,
        saveMysekaiCache,
        loadDataForUser,
        refreshProfile,
        refreshSuite,
        refreshMysekai,
    }
})
