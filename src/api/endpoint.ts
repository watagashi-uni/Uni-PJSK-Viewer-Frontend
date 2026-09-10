import { masterApiBaseUrl } from './masterClient'

export const API_ENDPOINT_KEY = 'apiEndpoint'

export type ApiEndpointPayload = {
    [API_ENDPOINT_KEY]?: string | null
}

const ENDPOINT_SNAPSHOT_KEY = 'apiEndpointSnapshot'

const fixedApiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || '') ?? ''

let activeApiBaseUrl = fixedApiBaseUrl
let endpointResolved = false
let endpointPromise: Promise<void> | null = null

restoreEndpointSnapshot()

/**
 * 恢复上次 version 下发的 endpoint 快照，启动时不必先等 /api/version 就能发 API 请求；
 * 后续 version 返回后由 applyApiEndpointFromVersion 覆盖。
 * Worker 环境无 localStorage，跳过恢复，保持原有的首次阻塞解析。
 */
function restoreEndpointSnapshot(): void {
    if (typeof localStorage === 'undefined') {
        return
    }

    const snapshot = localStorage.getItem(ENDPOINT_SNAPSHOT_KEY)
    if (snapshot === null) {
        return
    }

    activeApiBaseUrl = normalizeApiBaseUrl(snapshot) ?? fixedApiBaseUrl
    endpointResolved = true
}

function saveEndpointSnapshot(endpoint: string | null): void {
    if (typeof localStorage === 'undefined') {
        return
    }

    // 空字符串表示“已确认无自定义 endpoint”，与从未确认过（无此 key）区分
    localStorage.setItem(ENDPOINT_SNAPSHOT_KEY, endpoint ?? '')
}

function normalizeApiBaseUrl(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const trimmed = value.trim().replace(/\/+$/, '')
    if (!trimmed) {
        return null
    }

    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
        return trimmed
    }

    return null
}

function buildUrl(baseUrl: string, path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${baseUrl}${normalizedPath}`
}

export function getFixedApiBaseUrl(): string {
    return fixedApiBaseUrl
}

export function getActiveApiBaseUrl(): string {
    return activeApiBaseUrl
}

export function applyApiEndpointFromVersion(versionInfo: ApiEndpointPayload): void {
    const endpoint = normalizeApiBaseUrl(versionInfo[API_ENDPOINT_KEY])
    activeApiBaseUrl = endpoint ?? fixedApiBaseUrl
    endpointResolved = true
    saveEndpointSnapshot(endpoint)
}

export async function ensureApiEndpointReady(): Promise<void> {
    if (endpointResolved) {
        return
    }

    if (endpointPromise) {
        return endpointPromise
    }

    endpointPromise = (async () => {
        try {
            const response = await fetch(buildUrl(masterApiBaseUrl, '/api/version'), { cache: 'no-store' })
            if (!response.ok) {
                return
            }

            const versionInfo = await response.json() as ApiEndpointPayload
            applyApiEndpointFromVersion(versionInfo)
        } catch (error) {
            console.error('Failed to resolve API endpoint from version:', error)
        } finally {
            endpointResolved = true
            endpointPromise = null
        }
    })()

    return endpointPromise
}

export async function resolveApiUrl(path: string): Promise<string> {
    await ensureApiEndpointReady()
    return buildUrl(activeApiBaseUrl, path)
}
