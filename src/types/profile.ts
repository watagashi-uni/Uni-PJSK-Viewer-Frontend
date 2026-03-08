export type AdvancedTabKey = 'challenge' | 'bonus' | 'bonds' | 'leader'
export type ProfileTabKey = 'basic' | AdvancedTabKey
export type UnitKey = 'light_sound' | 'idol' | 'street' | 'theme_park' | 'school_refusal' | 'piapro'
export type AttrKey = 'cool' | 'cute' | 'happy' | 'mysterious' | 'pure'

export interface ProfileData {
    totalPower: {
        areaItemBonus: number
        basicCardTotalPower: number
        characterRankBonus: number
        honorBonus: number
        mysekaiFixtureGameCharacterPerformanceBonus: number
        mysekaiGateLevelBonus: number
        totalPower: number
    }
    user: { name: string; rank: number; userId: number }
    userCards: Array<{
        cardId: number
        defaultImage: string
        level: number
        masterRank: number
        specialTrainingStatus: string
    }>
    userChallengeLiveSoloResult?: { characterId: number; highScore: number }
    userChallengeLiveSoloStages?: Array<{ characterId: number; rank: number }>
    userCharacters: Array<{ characterId: number; characterRank: number }>
    userDeck: {
        deckId: number
        leader: number
        member1: number
        member2: number
        member3: number
        member4: number
        member5: number
        name: string
        subLeader: number
        userId: number
    }
    userMusicDifficultyClearCount: Array<{
        allPerfect: number
        fullCombo: number
        liveClear: number
        musicDifficultyType: string
    }>
    userProfile: {
        profileImageType: string
        twitterId: string
        userId: number
        word: string
    }
    userProfileHonors: Array<{
        bondsHonorViewType: string
        bondsHonorWordId: number
        honorId: number
        honorLevel: number
        profileHonorType: string
        seq: number
    }>
    userMultiLiveTopScoreCount: { mvp: number; superStar: number }
    userHonorMissions: Array<{ honorMissionType: string; progress: number }>
}

export interface CardInfo {
    id: number
    characterId: number
    cardRarityType: string
    attr: string
    assetbundleName: string
}

export interface GameCharacterUnit {
    id: number
    gameCharacterId: number
    unit: string
}

export interface GameCharacter {
    id: number
    firstName?: string
    givenName: string
}

export interface CharacterMissionV2 {
    characterId: number
    characterMissionType: string
    progress: number
}

export interface CharacterMissionV2Status {
    characterId: number
    parameterGroupId: number
    seq: number
}

export interface CharacterMissionV2ParameterGroup {
    id: number
    seq: number
    requirement: number
}

export interface ChallengeLiveHighScoreRewardRow {
    id: number
    characterId: number
    highScore: number
    resourceBoxId: number
}

export interface ResourceBoxDetailRow {
    resourceType: string
    resourceId?: number
    resourceQuantity?: number
}

export interface ResourceBoxRow {
    resourceBoxPurpose: string
    id: number
    details?: ResourceBoxDetailRow[]
}

export interface AreaItemLevelMasterRow {
    areaItemId: number
    level: number
    targetUnit?: string
    targetCardAttr?: string
    targetGameCharacterId?: number | string
    power1BonusRate: number
}

export interface CharacterRankRow {
    characterId: number
    characterRank: number
    power1BonusRate: number
}

export interface MysekaiGateLevelRow {
    mysekaiGateId: number
    level: number
    powerBonusRate: number
}

export interface BondMasterRow {
    groupId: number
    characterId1?: number
    characterId2?: number
}

export interface LevelMasterRow {
    levelType: string
    level: number
    totalExp: number
}

export interface BondsHonorMasterRow {
    id: number
    bondsGroupId: number
    honorRarity?: string
    levels?: Array<{
        level: number
        description?: string
    }>
}

export interface ChallengeRow {
    characterId: number
    rank: number
    highScore: number
    remainJewel: number
    remainFragment: number
    progress: number
}

export interface PowerBonusRow {
    areaItem: number
    rank: number
    fixture: number
    total: number
}

export interface UnitBonusRow {
    areaItem: number
    gate: number
    total: number
}

export interface AttrBonusRow {
    areaItem: number
    total: number
}

export interface PowerBonusCharacterView extends PowerBonusRow {
    characterId: number
}

export interface PowerBonusUnitView extends UnitBonusRow {
    unit: UnitKey
}

export interface PowerBonusAttrView extends AttrBonusRow {
    attr: AttrKey
}

export interface PowerBonusCharacterGroupView {
    unit: UnitKey
    rows: PowerBonusCharacterView[]
}

export interface BondViewRow {
    c1: number
    c2: number
    rank1: number
    rank2: number
    bondLevel: number
    needExpText: string
    progress: number
    capBlocked: boolean
    honorId: number | null
    honorLevel: number
}

export interface LeaderCountRow {
    characterId: number
    playCount: number | null
    exLevel: number | null
    exCount: number | null
    progress: number
}
