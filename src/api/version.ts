import { versionApiClient } from './client'
import { applyApiEndpointFromVersion, type ApiEndpointPayload } from './endpoint'

export interface VersionInfo extends ApiEndpointPayload {
    dataVersion: string
    assetVersion: string
    appVersion: string
    updatedAt: string
    enableCnAssets?: boolean
}

/**
 * 获取当前 master 数据版本号
 */
export async function getVersion(): Promise<VersionInfo> {
    const response = await versionApiClient.get<VersionInfo>('/api/version')
    applyApiEndpointFromVersion(response.data)
    return response.data
}

export function isCnAssetsEnabled(versionInfo: VersionInfo): boolean {
    return versionInfo.enableCnAssets === true
}
