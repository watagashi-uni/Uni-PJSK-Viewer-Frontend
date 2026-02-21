import type { DataProvider, MusicMeta } from 'sekai-calculator'
import apiClient from '@/api/client'

/**
 * Worker 端代理 DataProvider
 * 当需要数据时，向主线程发送请求，并等待主线程返回数据。
 */
export class WorkerProxyDataProvider implements DataProvider {
    private userId?: string
    private postMessage: (msg: any) => void
    private pendingRequests = new Map<string, { resolve: (data: any) => void, reject: (err: any) => void }>()
    private requestIdCounter = 0

    constructor(postMessage: (msg: any) => void, userId?: string) {
        this.postMessage = postMessage
        this.userId = userId
    }

    /**
     * 处理主线程返回的数据响应
     */
    handleResponse(requestId: string, data: any, error?: string) {
        const req = this.pendingRequests.get(requestId)
        if (req) {
            if (error) req.reject(new Error(error))
            else req.resolve(data)
            this.pendingRequests.delete(requestId)
        }
    }

    async getMasterData<T>(key: string): Promise<T[]> {
        // ingameNodes 兼容性处理：如果请求 ingameNodes，实际去请求 ingameNotes
        // 主线程 masterStore 会处理具体的获取逻辑
        const requestKey = key === 'ingameNodes' ? 'ingameNotes' : key

        return new Promise<T[]>((resolve, reject) => {
            const requestId = `req_${++this.requestIdCounter}`
            this.pendingRequests.set(requestId, { resolve, reject })

            // 发送请求给主线程
            this.postMessage({
                type: 'requestMaster',
                requestId,
                key: requestKey,
                originalKey: key
            })
        })
    }

    async getMusicMeta(): Promise<MusicMeta[]> {
        // 使用后端反代 /api/music_metas，避免前端 CORS 问题
        const res = await apiClient.get<MusicMeta[]>('/api/music_metas')
        return res.data
    }

    async getUserData<T>(key: string): Promise<T> {
        const all = await this.getUserDataAll()
        return all[key]
    }

    async getUserDataAll(): Promise<Record<string, any>> {
        if (!this.userId) throw new Error('未指定用户ID')
        return new Promise<Record<string, any>>((resolve, reject) => {
            const requestId = `req_${++this.requestIdCounter}`
            this.pendingRequests.set(requestId, { resolve, reject })

            // 由主线程读取 accountStore 缓存，避免 Worker 侧重复直连 public API
            this.postMessage({
                type: 'requestUserData',
                requestId,
                userId: this.userId,
            })
        })
    }
}
