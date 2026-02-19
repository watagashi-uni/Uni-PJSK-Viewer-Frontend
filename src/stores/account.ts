import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface StoredAccount {
    userId: string
    name: string
    lastRefresh: number
    uploadTime?: number  // suite API 的 upload_time (秒级时间戳)
}

const STORAGE_KEY = 'sekaiUserProfiles'
const SUITE_CACHE_PREFIX = 'suiteCache_'

export const useAccountStore = defineStore('account', () => {
    const accounts = ref<StoredAccount[]>([])
    const currentUserId = ref('')

    // suite 刷新中状态（全局可用）
    const suiteRefreshing = ref(false)
    const profileRefreshing = ref(false)

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

    function initialize() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) accounts.value = JSON.parse(raw)
        } catch { accounts.value = [] }
        const last = localStorage.getItem('account_currentUserId')
        if (last && accounts.value.some(a => a.userId === last)) {
            currentUserId.value = last
        } else if (accounts.value.length > 0 && accounts.value[0]) {
            currentUserId.value = accounts.value[0].userId
        }
    }

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.value))
    }

    function selectAccount(userId: string) {
        currentUserId.value = userId
        localStorage.setItem('account_currentUserId', userId)
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

    function removeAccount(userId: string) {
        accounts.value = accounts.value.filter(a => a.userId !== userId)
        localStorage.removeItem(`${SUITE_CACHE_PREFIX}${userId}`)
        if (currentUserId.value === userId) {
            currentUserId.value = accounts.value[0]?.userId || ''
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

    // ==================== Suite 缓存 ====================
    function getSuiteCache(userId: string): any | null {
        try {
            const raw = localStorage.getItem(`${SUITE_CACHE_PREFIX}${userId}`)
            return raw ? JSON.parse(raw) : null
        } catch { return null }
    }

    function saveSuiteCache(userId: string, data: any) {
        try {
            localStorage.setItem(`${SUITE_CACHE_PREFIX}${userId}`, JSON.stringify(data))
        } catch { /* localStorage 满了忽略 */ }
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
            if (acc) {
                acc.name = data.user.name
                acc.lastRefresh = Date.now()
                save()
            }
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
            saveSuiteCache(userId, data)
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
        getSuiteCache,
        saveSuiteCache,
        refreshProfile,
        refreshSuite,
    }
})
