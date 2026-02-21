import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

type GameDataType = 'suite' | 'mysekai'

interface PendingAuthState {
    state: string
    codeVerifier: string
    targetUserId: string
    returnTo: string
}

interface StoredOAuthToken {
    accessToken: string
    refreshToken: string
    scope: string
    expiresAt: number | null
}

const TOOLBOX_BASE_URL = (import.meta.env.VITE_TOOLBOX_OAUTH_BASE_URL || 'https://toolbox-api-direct.haruki.seiunx.com').replace(/\/+$/, '')
const TOKEN_STORAGE_KEY = 'toolbox_oauth_tokens'
const PENDING_AUTH_KEY = 'toolbox_oauth_pending'

function toBase64Url(input: Uint8Array): string {
    const raw = String.fromCharCode(...input)
    return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomBase64Url(bytesLength = 32): string {
    const bytes = new Uint8Array(bytesLength)
    crypto.getRandomValues(bytes)
    return toBase64Url(bytes)
}

async function sha256Base64Url(plainText: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plainText))
    return toBase64Url(new Uint8Array(digest))
}

function createOAuthError(message: string, status?: number, oauthError?: string): Error {
    const error = new Error(message) as Error & { status?: number, oauthError?: string }
    if (status !== undefined) error.status = status
    if (oauthError) error.oauthError = oauthError
    return error
}

async function parseJsonSafe(res: Response): Promise<any> {
    try {
        return await res.json()
    } catch {
        return null
    }
}

export const useOAuthStore = defineStore('oauth', () => {
    const tokensByUserId = ref<Record<string, StoredOAuthToken>>({})

    const hasToken = computed(() => Object.keys(tokensByUserId.value).length > 0)
    const clientId = computed(() => (import.meta.env.VITE_TOOLBOX_OAUTH_CLIENT_ID || '').trim())

    function saveTokensToStorage() {
        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokensByUserId.value))
    }

    function initialize() {
        try {
            const raw = localStorage.getItem(TOKEN_STORAGE_KEY)
            if (!raw) return
            const parsed = JSON.parse(raw) as Record<string, StoredOAuthToken> | StoredOAuthToken
            if (parsed && typeof parsed === 'object' && 'accessToken' in parsed) {
                // 兼容旧版单 token 存储：暂时挂到 unknown 桶
                tokensByUserId.value = { unknown: parsed as StoredOAuthToken }
            } else {
                tokensByUserId.value = parsed || {}
            }
        } catch {
            clearTokens()
        }
    }

    function clearTokens() {
        tokensByUserId.value = {}
        localStorage.removeItem(TOKEN_STORAGE_KEY)
    }

    function clearTokensForUser(userId: string) {
        if (!tokensByUserId.value[userId]) return
        delete tokensByUserId.value[userId]
        saveTokensToStorage()
    }

    function hasTokenForUser(userId: string): boolean {
        return Boolean(tokensByUserId.value[userId])
    }

    function getRedirectUri() {
        return `${window.location.origin}/oauth2/callback/code`
    }

    function savePendingAuth(pending: PendingAuthState) {
        sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(pending))
    }

    function loadPendingAuth(): PendingAuthState | null {
        try {
            const raw = sessionStorage.getItem(PENDING_AUTH_KEY)
            if (!raw) return null
            return JSON.parse(raw) as PendingAuthState
        } catch {
            return null
        }
    }

    function clearPendingAuth() {
        sessionStorage.removeItem(PENDING_AUTH_KEY)
    }

    function ensureClientId() {
        if (!clientId.value) {
            throw new Error('OAuth client_id 未配置，请先设置 VITE_TOOLBOX_OAUTH_CLIENT_ID')
        }
    }

    function saveTokenPayload(userId: string, payload: any) {
        const next: StoredOAuthToken = {
            accessToken: String(payload.access_token || ''),
            refreshToken: String(payload.refresh_token || ''),
            scope: String(payload.scope || ''),
            expiresAt: null,
        }
        if (typeof payload.expires_in === 'number') {
            next.expiresAt = Date.now() + payload.expires_in * 1000
        }
        tokensByUserId.value[userId] = next
        saveTokensToStorage()
    }

    async function startAuthorization(targetUserId: string, returnTo?: string) {
        ensureClientId()
        if (!targetUserId) {
            throw new Error('缺少目标游戏 ID，无法发起授权')
        }

        const state = randomBase64Url(24)
        const codeVerifier = randomBase64Url(32)
        const codeChallenge = await sha256Base64Url(codeVerifier)

        const pending: PendingAuthState = {
            state,
            codeVerifier,
            targetUserId,
            returnTo: returnTo || `${window.location.pathname}${window.location.search}${window.location.hash}`,
        }
        savePendingAuth(pending)

        const authUrl = new URL('/api/oauth2/authorize', TOOLBOX_BASE_URL)
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('client_id', clientId.value)
        authUrl.searchParams.set('redirect_uri', getRedirectUri())
        authUrl.searchParams.set('scope', 'user:read bindings:read game-data:read')
        authUrl.searchParams.set('state', state)
        authUrl.searchParams.set('code_challenge', codeChallenge)
        authUrl.searchParams.set('code_challenge_method', 'S256')

        window.location.assign(authUrl.toString())
    }

    async function handleAuthorizationCallback(params: {
        code?: string
        state?: string
        error?: string
        errorDescription?: string
    }): Promise<string> {
        ensureClientId()
        const pending = loadPendingAuth()
        if (!pending) {
            throw new Error('OAuth 状态已丢失，请重新发起授权')
        }

        if (params.error) {
            clearPendingAuth()
            throw createOAuthError(
                params.errorDescription || `授权失败: ${params.error}`,
                undefined,
                params.error
            )
        }

        if (!params.code) {
            throw new Error('授权回调缺少 code')
        }
        if (!params.state || params.state !== pending.state) {
            clearPendingAuth()
            throw new Error('授权 state 校验失败，请重试')
        }

        const body = new URLSearchParams()
        body.set('grant_type', 'authorization_code')
        body.set('client_id', clientId.value)
        body.set('code', params.code)
        body.set('redirect_uri', getRedirectUri())
        body.set('code_verifier', pending.codeVerifier)

        const tokenUrl = `${TOOLBOX_BASE_URL}/api/oauth2/token`
        const res = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        })
        const payload = await parseJsonSafe(res)
        if (!res.ok) {
            const desc = payload?.error_description || payload?.message || `换取 Token 失败 (${res.status})`
            throw createOAuthError(desc, res.status, payload?.error)
        }

        saveTokenPayload(pending.targetUserId, payload)
        clearPendingAuth()
        return pending.returnTo || '/'
    }

    async function refreshAccessToken(userId: string) {
        ensureClientId()
        const tokenData = tokensByUserId.value[userId]
        if (!tokenData?.refreshToken) {
            throw createOAuthError('未找到 refresh_token，请重新授权')
        }

        const body = new URLSearchParams()
        body.set('grant_type', 'refresh_token')
        body.set('client_id', clientId.value)
        body.set('refresh_token', tokenData.refreshToken)

        const tokenUrl = `${TOOLBOX_BASE_URL}/api/oauth2/token`
        const res = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        })
        const payload = await parseJsonSafe(res)
        if (!res.ok) {
            const desc = payload?.error_description || payload?.message || `刷新 Token 失败 (${res.status})`
            clearTokensForUser(userId)
            throw createOAuthError(desc, res.status, payload?.error)
        }
        saveTokenPayload(userId, payload)
    }

    async function getValidAccessToken(userId: string): Promise<string> {
        const tokenData = tokensByUserId.value[userId]
        const token = tokenData?.accessToken || ''
        const exp = tokenData?.expiresAt ?? null
        const shouldRefresh = !token || (exp !== null && Date.now() >= exp - 30_000)
        if (shouldRefresh) {
            await refreshAccessToken(userId)
        }
        const latest = tokensByUserId.value[userId]?.accessToken || ''
        if (!latest) {
            throw createOAuthError('未获取到 access_token，请重新授权')
        }
        return latest
    }

    async function fetchGameData(server: string, dataType: GameDataType, userId: string): Promise<any> {
        const token = await getValidAccessToken(userId)
        const url = `${TOOLBOX_BASE_URL}/api/oauth2/game-data/${encodeURIComponent(server)}/${encodeURIComponent(dataType)}/${encodeURIComponent(userId)}`
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        const payload = await parseJsonSafe(res)
        if (!res.ok) {
            const desc = payload?.error_description || payload?.message || `OAuth 游戏数据请求失败 (${res.status})`
            throw createOAuthError(desc, res.status, payload?.error)
        }
        return payload?.updatedData ?? payload
    }

    return {
        hasToken,
        hasTokenForUser,
        initialize,
        clearTokens,
        clearTokensForUser,
        startAuthorization,
        handleAuthorizationCallback,
        fetchGameData,
    }
})
