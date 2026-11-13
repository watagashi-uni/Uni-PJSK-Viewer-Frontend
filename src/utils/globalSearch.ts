// 全站搜索的匹配逻辑：纯函数，不依赖 Vue 和网络，索引的加载在 useSearchIndex 里。

export type SearchKind = 'page' | 'action' | 'music' | 'card' | 'character' | 'event' | 'gacha' | 'vlive'

export interface SearchEntry {
  kind: SearchKind
  /** 同一类里唯一 */
  id: string
  title: string
  sub: string
  /** 行尾的补充信息：作曲者、角色、日期等 */
  meta: string
  /** 站内路径；操作类条目为空 */
  path: string
  /** 资源主机下的相对路径，或以 / 开头的站内静态文件；没有图时为空 */
  image: string
  /** 归一化后的名称（原文、译名、读音各占一行），用来判断完全匹配和前缀匹配 */
  keys: string
  /** 归一化后的全部可搜索文本 */
  hay: string
  /** 同分时数值大的排前面（一般是开始时间） */
  order: number
  /** 这个时间之前属于未公开内容；0 表示始终可见 */
  hiddenUntil: number
  /** 用于 #123 这样按编号查找；没有编号时为 -1 */
  num: number
}

export interface SearchOptions {
  limit: number
  now: number
  showSpoilers: boolean
}

export interface SearchResult {
  items: SearchEntry[]
  /** 匹配到的总数（items 只取前 limit 条） */
  total: number
}

const KATAKANA_START = 0x30a1
const KATAKANA_END = 0x30f6
const KANA_OFFSET = 0x60

/** 全角转半角、转小写、片假名转平假名：让「ミク」「みく」「ＭＩＫＵ」互相匹配 */
export function normalizeSearchText(value: string | null | undefined): string {
  if (!value) return ''
  const folded = value.normalize('NFKC').toLowerCase()
  let out = ''
  for (let i = 0; i < folded.length; i++) {
    const code = folded.charCodeAt(i)
    out += code >= KATAKANA_START && code <= KATAKANA_END ? String.fromCharCode(code - KANA_OFFSET) : folded[i]
  }
  return out.trim()
}

/** 把若干段文本归一化后按行拼起来，空值跳过 */
export function joinSearchText(parts: readonly (string | null | undefined)[]): string {
  const lines: string[] = []
  for (const part of parts) {
    const text = normalizeSearchText(part)
    if (text && !lines.includes(text)) lines.push(text)
  }
  return lines.join('\n')
}

function scoreEntry(entry: SearchEntry, query: string, tokens: readonly string[], numeric: number): number {
  if (numeric >= 0 && entry.num === numeric) return 95
  const keys = entry.keys
  const at = keys.indexOf(query)
  if (at >= 0) {
    const startsLine = at === 0 || keys.charCodeAt(at - 1) === 10
    const end = at + query.length
    const endsLine = end === keys.length || keys.charCodeAt(end) === 10
    if (startsLine && endsLine) return 100
    if (startsLine) return 80
    return 60
  }
  const hay = entry.hay
  if (hay.includes(query)) return 45
  if (tokens.length > 1) {
    for (const token of tokens) {
      if (!hay.includes(token)) return 0
    }
    return 40
  }
  return 0
}

/**
 * 在一类条目里搜索。每个条目只做几次 indexOf，几千条数据也只要一两毫秒，
 * 所以直接在主线程同步执行；调用方负责防抖。
 */
export function searchEntries(entries: readonly SearchEntry[], rawQuery: string, options: SearchOptions): SearchResult {
  const query = normalizeSearchText(rawQuery)
  if (!query) return { items: [], total: 0 }

  const idMatch = /^#?(\d{1,7})$/.exec(query)
  const numeric = idMatch ? Number(idMatch[1]) : -1
  const tokens = query.split(/\s+/).filter(Boolean)
  // 「#123」只按编号找，去掉 # 后的数字仍可匹配名称里的数字
  const textQuery = query.startsWith('#') ? query.slice(1) : query
  if (!textQuery) return { items: [], total: 0 }

  const matched: { entry: SearchEntry; score: number }[] = []
  for (const entry of entries) {
    if (!options.showSpoilers && entry.hiddenUntil > options.now) continue
    const score = scoreEntry(entry, textQuery, tokens, numeric)
    if (score > 0) matched.push({ entry, score })
  }

  matched.sort((a, b) => b.score - a.score || b.entry.order - a.entry.order)
  return { items: matched.slice(0, options.limit).map(match => match.entry), total: matched.length }
}
