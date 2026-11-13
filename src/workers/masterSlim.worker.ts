// 搜索面板用的 master 精简器：cards、gachas 这类表解压后有二三十 MB，
// 在这里下载、解析并只留下搜索要用的几个字段，主线程不碰完整数据。
import { getCachedData } from '@/utils/masterDB'

export interface SlimRequest {
  id: number
  name: string
  url: string
  fields: string[]
}

export interface SlimResponse {
  id: number
  rows?: Record<string, unknown>[]
  error?: string
}

async function loadRows(name: string, url: string): Promise<Record<string, unknown>[]> {
  // 本地已有缓存时直接用（反序列化也发生在这个线程里）
  try {
    const cached = await getCachedData<Record<string, unknown>>(name)
    if (cached) return cached
  } catch {
    // IndexedDB 不可用时走网络
  }
  // 带版本号的地址是 immutable 的，浏览器会走 HTTP 缓存
  const response = await fetch(url, { credentials: 'omit' })
  if (!response.ok) throw new Error(`${response.status} ${name}`)
  return response.json() as Promise<Record<string, unknown>[]>
}

addEventListener('message', (event: MessageEvent<SlimRequest>) => {
  const { id, name, url, fields } = event.data
  void loadRows(name, url)
    .then((rows) => {
      const slim = rows.map((row) => {
        const picked: Record<string, unknown> = {}
        for (const field of fields) picked[field] = row[field]
        return picked
      })
      postMessage({ id, rows: slim } satisfies SlimResponse)
    })
    .catch((error: unknown) => {
      postMessage({ id, error: error instanceof Error ? error.message : String(error) } satisfies SlimResponse)
    })
})
