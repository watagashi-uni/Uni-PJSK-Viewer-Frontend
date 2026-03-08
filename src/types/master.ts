/**
 * 共享的 Master Data 类型定义
 * 从各 View 文件中提取的公共接口，避免重复定义
 */

export interface EventData {
    id: number
    eventType: string
    name: string
    assetbundleName: string
    startAt: number
    aggregateAt: number
    closedAt?: number
    unit?: string
    eventRankingRewardRanges?: {
        id: number
        fromRank: number
        toRank: number
        eventRankingRewards: {
            id: number
            resourceBoxId: number
        }[]
    }[]
}

export interface MusicData {
    id: number
    title: string
    assetbundleName: string
    publishedAt: number
    composer: string
    lyricist?: string
}

export interface CardData {
    id: number
    characterId: number
    cardRarityType: string
    attr: string
    assetbundleName: string
}
