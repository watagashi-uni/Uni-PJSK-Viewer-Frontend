import type { EventData } from '@/types/master'
import { displayImageUrl } from '@/utils/derivedAssets'

type EventAssets = Pick<EventData, 'eventType' | 'assetbundleName'>

// 已知的 Cheerful Carnival 测试活动沿用这组资源名，master 没有独立的测试标记。
export function isTestEvent(event: EventAssets): boolean {
  return event.eventType === 'cheerful_carnival'
    && /^event_cheerfutest\d*_\d{4}$/.test(event.assetbundleName)
}

// logo 和背景大图用于页面展示，取 WebP；下载原图的地方自己拼 PNG 地址
export function getEventLogoUrl(event: Pick<EventData, 'assetbundleName'>, assetsHost: string): string {
  if (!event.assetbundleName) return ''
  return displayImageUrl(`${assetsHost}/ondemand/event/${event.assetbundleName}/logo/logo.png`)
}

export function getEventBackgroundUrl(event: Pick<EventData, 'assetbundleName'>, assetsHost: string): string {
  if (!event.assetbundleName) return ''
  return displayImageUrl(`${assetsHost}/ondemand/event/${event.assetbundleName}/screen/bg.png`)
}

export function getEventBannerUrl(event: EventAssets, assetsHost: string): string {
  if (isTestEvent(event) || !event.assetbundleName) return ''
  const bundle = event.assetbundleName
  return `${assetsHost}/startapp/home/banner/${bundle}/${bundle}.png`
}
