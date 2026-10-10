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
    /** 'done' 表示获得时即为特训后，没有特训前形态 */
    initialSpecialTrainingStatus?: string
}

export interface GameCharacterData {
    id: number
    seq: number
    resourceId: number
    firstName?: string
    givenName: string
    firstNameEnglish?: string
    givenNameEnglish?: string
    unit: string
}

export interface CharacterProfileData {
    characterId: number
    characterVoice?: string
    birthday?: string
    height?: string
    school?: string
    schoolYear?: string
    hobby?: string
    specialSkill?: string
    favoriteFood?: string
    hatedFood?: string
    weak?: string
    introduction?: string
    scenarioId?: string
}

export interface UnitProfileData {
    unit: string
    unitName: string
    unitProfileName: string
    seq: number
    profileSentence?: string
    colorCode?: string
}

export type StampType =
    | 'illustration'
    | 'text'
    | 'cheerful_carnival_message'
    | 'non_character_illustration'

export interface StampData {
    id: number
    stampType: StampType | string
    seq: number
    name: string
    assetbundleName: string
    balloonAssetbundleName?: string
    characterId1?: number
    characterId2?: number
    gameCharacterUnitId?: number
    archivePublishedAt: number
    description?: string
}
