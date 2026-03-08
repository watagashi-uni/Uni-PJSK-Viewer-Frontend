export class RequestError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = 'RequestError';
    }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options)
    if (!res.ok) {
        throw new RequestError(res.status, `HTTP Error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>
}

const profileBase = (import.meta.env.VITE_PROFILE_API_BASE_URL || '').replace(/\/+$/, '')
const suiteBase = (import.meta.env.VITE_SUITE_API_BASE_URL || '').replace(/\/+$/, '')
const defaultBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export const request = {
    getProfile<T = any>(path: string, options?: RequestInit) {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`
        return fetchJson<T>(`${profileBase}${normalizedPath}`, options)
    },

    getSuite<T = any>(path: string, options?: RequestInit) {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`
        return fetchJson<T>(`${suiteBase}${normalizedPath}`, options)
    },

    get<T = any>(path: string, options?: RequestInit) {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`
        return fetchJson<T>(`${defaultBase}${normalizedPath}`, options)
    },

    post<T = any>(path: string, body?: BodyInit | null, options?: RequestInit) {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`
        return fetchJson<T>(`${defaultBase}${normalizedPath}`, { ...options, method: 'POST', body })
    },

    fetchRaw(url: string, options?: RequestInit) {
        return fetch(url, options)
    }
}
