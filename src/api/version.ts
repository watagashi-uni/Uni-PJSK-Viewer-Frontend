import { versionApiClient } from './client'
import { applyApiEndpointFromVersion, type ApiEndpointPayload } from './endpoint'

export interface VersionInfo extends ApiEndpointPayload {
    dataVersion: string
    assetVersion: string
    appVersion: string
    updatedAt: string
    enableCnAssets?: boolean
}

let inflightVersion: Promise<VersionInfo> | null = null

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
            const response = await versionApiClient.get<VersionInfo>('/api/version')
            applyApiEndpointFromVersion(response.data)
            return response.data
        } finally {
            inflightVersion = null
        }
    })()

    inflightVersion = promise
    return promise
}

export function isCnAssetsEnabled(versionInfo: VersionInfo): boolean {
    return versionInfo.enableCnAssets === true
}
