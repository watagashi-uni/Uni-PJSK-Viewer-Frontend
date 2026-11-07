import { masterApiClient } from './masterClient'
import { applyApiEndpointFromVersion, type ApiEndpointPayload } from './endpoint'

export interface VersionInfo extends ApiEndpointPayload {
    dataVersion: string
    assetVersion: string
    appVersion: string
    updatedAt: string
    enableCnAssets?: boolean
    cnAssetsHost?: string
    /** 语言 → 当前译文版本哈希，对应 translations/<语言>/version.<哈希>.json */
    translations?: Record<string, string>
}

export const DEFAULT_CN_ASSETS_HOST = 'https://assets-esa.unipjsk.com'
// 只接受 assets-*.unipjsk.com，Service Worker 按同一规则把各源图片合并到一份缓存
const CN_ASSETS_HOST_PATTERN = /^https:\/\/assets-[a-z0-9-]+\.unipjsk\.com$/

export function normalizeCnAssetsHost(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null
    }

    const host = value.trim().replace(/\/+$/, '').toLowerCase()
    return CN_ASSETS_HOST_PATTERN.test(host) ? host : null
}

let inflightVersion: Promise<VersionInfo> | null = null
// 本次会话最近一次成功取到的版本信息，供译文加载器复用，不再单独请求
let latestVersion: Promise<VersionInfo | null> | null = null

/**
 * 获取当前 master 数据版本号。
 * 仅合并同一时刻在途的并发调用（如启动时 settings 与 master 同时查询）；
 * 请求结束即失效，每次新调用都重新访问服务器，保证版本更新能立刻被发现。
 */
export function getVersion(): Promise<VersionInfo> {
    if (inflightVersion) {
        return inflightVersion
    }

    const promise = (async () => {
        try {
            const response = await masterApiClient.get<VersionInfo>('/api/version', { params: { t: Date.now() } })
            applyApiEndpointFromVersion(response.data)
            return response.data
        } finally {
            inflightVersion = null
        }
    })()

    inflightVersion = promise
    const previous = latestVersion
    latestVersion = promise.catch(() => previous ?? null)
    return promise
}

/** 本次会话的版本信息；还没有请求过时发起一次（与其他并发请求合并） */
export function getSessionVersionInfo(): Promise<VersionInfo | null> {
    return latestVersion ?? getVersion().catch(() => null)
}

export function isCnAssetsEnabled(versionInfo: VersionInfo): boolean {
    return versionInfo.enableCnAssets === true
}
