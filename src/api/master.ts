import apiClient from './client'

// 允许获取的 master 数据类型 (不再限制，允许任意字符串)
export type MasterDataName = string

/**
 * 获取指定的 master 数据
 * @param name - master 数据类型名称
 * @param version - 版本号，用于 CDN 缓存
 */
export async function getMasterData<T = any>(name: MasterDataName, version: string): Promise<T[]> {
    const response = await apiClient.get<T[]>(`/api/master/${version}/${name}`)
    return response.data
}

/**
 * 获取歌曲翻译数据
 */
export async function getMusicTranslations(): Promise<Record<number, string>> {
    const response = await apiClient.get<Record<number, string>>('/api/translations/musics')
    return response.data
}
