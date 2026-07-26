import apiClient from '@/api/client'

let isChinaPromise: Promise<boolean> | null = null

/**
 * 探测访问端是否位于中国大陆（/api/location，返回 { isChina: boolean }）。
 * 会话级共享：设置页的源站自动选择与推送订阅上报共用一次请求。
 * 失败时返回 false，并清除缓存允许下次调用重试。
 */
export function detectIsChina(): Promise<boolean> {
    if (!isChinaPromise) {
        isChinaPromise = apiClient
            .get('/api/location')
            .then((res) => res.data?.isChina === true)
            .catch((error) => {
                console.error('Failed to detect location:', error)
                isChinaPromise = null
                return false
            })
    }

    return isChinaPromise
}
