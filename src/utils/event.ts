import type { EventData } from '@/types/master'

type EventAssets = Pick<EventData, 'eventType' | 'assetbundleName'>

// 已知的 Cheerful Carnival 测试活动沿用这组资源名，master 没有独立的测试标记。
export function isTestEvent(event: EventAssets): boolean {
  return event.eventType === 'cheerful_carnival'
    && /^event_cheerfutest\d*_\d{4}$/.test(event.assetbundleName)
}

export function getEventBannerUrl(event: EventAssets, assetsHost: string): string {
  if (isTestEvent(event) || !event.assetbundleName) return ''
  const bundle = event.assetbundleName
  return `${assetsHost}/startapp/home/banner/${bundle}/${bundle}.png`
}
