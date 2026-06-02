export const API_ENDPOINT_KEY = 'apiEndpoint'

export type ApiEndpointPayload = {
    [API_ENDPOINT_KEY]?: string | null
}

const fixedApiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || '') ?? ''

let activeApiBaseUrl = fixedApiBaseUrl
let endpointResolved = false
let endpointPromise: Promise<void> | null = null

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
            const response = await fetch(buildUrl(fixedApiBaseUrl, '/api/version'))
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
