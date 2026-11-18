import { masterApiBaseUrl } from './masterClient'

// 游戏内公告（お知らせ）的双语副本。index.json 每分钟随官方列表更新；
// 正文文件按内容哈希命名，同一个文件名的内容永远不变。

export const informationBaseUrl = `${masterApiBaseUrl}/information`

export type InformationTag = 'information' | 'event' | 'gacha' | 'music' | 'campaign' | 'bug' | 'update' | string

export interface InformationItem {
  id: number
  /** 官方网页 information/index.html?id=<key>；外部链接类公告没有 */
  key: string | null
  type: 'normal' | 'bug' | 'content' | string
  tag: InformationTag
  browse: 'internal' | 'external' | string
  /** 外部链接类公告的地址 */
  url?: string
  startAt: number
  endAt?: number
  order: number
  title: string
  titleZh: string | null
  /** 正文文件，相对 information/ */
  page?: string
  thumb?: string
  /** 标题和正文是否都已翻译 */
  done: boolean
  /** 第一次出现在官方列表的时间 */
  seenAt: number
  modifiedAt?: number | null
  /** 已从官方列表撤下的时间 */
  goneAt?: number
}

export interface InformationIndex {
  v: number
  updatedAt: number
  items: InformationItem[]
}

export interface InformationPage {
  v: number
  id: number
  key: string
  title: string
  titleZh: string | null
  /** 每行是 <span class="ib-s"><span class="ib-ja">…</span><span class="ib-zh">…</span></span> */
  html: string
  done: boolean
  modifiedAt: number | null
  /** 官方网页地址 */
  source: string
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

let indexCache: { at: number; data: InformationIndex } | null = null
let indexRequest: Promise<InformationIndex> | null = null
const INDEX_REUSE_MS = 15_000

/** 公告列表；15 秒内重复调用直接用上次的结果 */
export function loadInformationIndex(force = false): Promise<InformationIndex> {
  if (!force && indexCache && Date.now() - indexCache.at < INDEX_REUSE_MS) return Promise.resolve(indexCache.data)
  indexRequest ??= getJson<InformationIndex>(`${informationBaseUrl}/index.json`, { cache: 'no-cache' })
    .then((data) => {
      indexCache = { at: Date.now(), data }
      return data
    })
    .finally(() => { indexRequest = null })
  return indexRequest
}

const pageCache = new Map<string, Promise<InformationPage>>()

export function loadInformationPage(page: string): Promise<InformationPage> {
  let request = pageCache.get(page)
  if (!request) {
    request = getJson<InformationPage>(`${informationBaseUrl}/${page}`)
    request.catch(() => pageCache.delete(page))
    pageCache.set(page, request)
  }
  return request
}

export const informationTagLabels: Record<string, string> = {
  information: '公告',
  event: '活动',
  gacha: '招募',
  music: '歌曲',
  campaign: '宣传',
  bug: '问题',
  update: '更新',
}

export function informationTagLabel(tag: string): string {
  return informationTagLabels[tag] ?? tag
}

export function officialInformationUrl(key: string): string {
  return `https://production-web.sekai.colorfulpalette.org/information/index.html?id=${encodeURIComponent(key)}`
}
