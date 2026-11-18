import type { InformationItem } from '@/api/information'

const DAY = 24 * 60 * 60 * 1000

export function formatInformationTime(ms: number | null | undefined, withYear = false): string {
  if (!ms) return ''
  const date = new Date(ms)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleString('zh-CN', {
    year: withYear || !sameYear ? 'numeric' : undefined,
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeInformationTime(ms: number, now = Date.now()): string {
  const diff = now - ms
  if (diff < 0) {
    const minutes = Math.ceil(-diff / 60_000)
    return minutes < 60 ? `${minutes} 分钟后` : `${Math.round(-diff / 3_600_000)} 小时后`
  }
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < DAY) return `${Math.floor(diff / 3_600_000)} 小时前`
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} 天前`
  return formatInformationTime(ms)
}

export type InformationStatus = 'upcoming' | 'new' | 'ended' | 'gone' | null

/** 列表角标：撤下 > 已结束 > 官方提前放出（还没到 startAt） > 24 小时内新出现 */
export function informationStatus(item: InformationItem, now = Date.now()): InformationStatus {
  if (item.goneAt) return 'gone'
  if (item.endAt && item.endAt < now) return 'ended'
  if (item.startAt > now) return 'upcoming'
  if (now - Math.max(item.startAt, item.seenAt) < DAY) return 'new'
  return null
}

export const informationStatusLabels: Record<Exclude<InformationStatus, null>, string> = {
  upcoming: '提前放出',
  new: '新',
  ended: '已结束',
  gone: '已撤下',
}
