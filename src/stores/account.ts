import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { openDB } from 'idb'

export interface StoredAccount {
    userId: string
    name: string
    lastRefresh: number
    uploadTime?: number  // suite API 的 upload_time (秒级时间戳)
}

const STORAGE_KEY = 'sekaiUserProfiles'
const SUITE_CACHE_PREFIX = 'suiteCache_'
const PROFILE_DATA_KEY = 'sekaiUserProfileData'

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
    const profileRefreshing = ref(false)

    // 内存中的缓存（UI 界面可以直接读取）
    const suiteCaches = ref<Record<string, any>>({})
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

        const last = localStorage.getItem('account_currentUserId')
        if (last && accounts.value.some(a => a.userId === last)) {
            await selectAccount(last)
        } else if (accounts.value.length > 0 && accounts.value[0]) {
            await selectAccount(accounts.value[0].userId)
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
            const [suiteData, profileData] = await Promise.all([
                db.get('caches', `suite_${userId}`),
                db.get('caches', `profile_${userId}`)
            ])
            if (suiteData) suiteCaches.value[userId] = suiteData
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

        try {
            const db = await dbPromise
            const tx = db.transaction('caches', 'readwrite')
            tx.store.delete(`suite_${userId}`)
            tx.store.delete(`profile_${userId}`)
            await tx.done
            delete suiteCaches.value[userId]
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
            const url = `https://api.unipjsk.com/api/user/%7Buser_id%7D/${userId}/profile`
            const res = await fetch(url)
            if (!res.ok) {
                if (res.status === 404) throw new Error('用户不存在')
                if (res.status === 403) throw new Error('该用户未公开Profile')
                throw new Error(`请求失败: ${res.status}`)
            }
            const data = await res.json()
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
            const resp = await fetch(`https://suite-api.haruki.seiunx.com/public/jp/suite/${userId}`)
            if (!resp.ok) {
                if (resp.status === 404) throw new Error('用户未上传数据')
                if (resp.status === 403) throw new Error('用户未勾选公开访问')
                throw new Error(`HTTP ${resp.status}`)
            }
            const data = await resp.json()
            if (data.upload_time) {
                updateUploadTime(userId, data.upload_time)
            }
            await saveSuiteCache(userId, data)
            return data
        } finally {
            suiteRefreshing.value = false
        }
    }

    return {
        accounts,
        currentUserId,
        currentAccount,
        uploadTimeText,
        lastRefreshText,
        suiteRefreshing,
        profileRefreshing,
        initialize,
        save,
        selectAccount,
        addAccount,
        removeAccount,
        updateUploadTime,
        saveProfileCache,
        getProfileCache,
        getSuiteCache,
        saveSuiteCache,
        loadDataForUser,
        refreshProfile,
        refreshSuite,
    }
})
