import apiClient from './client'

export interface VersionInfo {
    dataVersion: string
    assetVersion: string
    appVersion: string
    updatedAt: string
}

/**
 * 获取当前 master 数据版本号
 */
export async function getVersion(): Promise<VersionInfo> {
    const response = await apiClient.get<VersionInfo>('/api/version')
    return response.data
}
