export type RarityLevel = 0 | 1 | 2

export interface SceneConfig {
    siteId: number
    name: string
    imagePath: string
    physicalWidth: number
    offsetX: number
    offsetY: number
    xDirection: 1 | -1
    yDirection: 1 | -1
    reverseXY: boolean
}

export interface RawFixture {
    mysekaiSiteHarvestFixtureId?: number
    userMysekaiSiteHarvestFixtureStatus?: string
    positionX?: number
    positionZ?: number
}

export interface RawDrop {
    resourceType?: string
    resourceId?: number
    quantity?: number
    positionX?: number
    positionZ?: number
    mysekaiSiteHarvestResourceDropStatus?: string
}

export interface RawHarvestMap {
    mysekaiSiteId?: number
    userMysekaiSiteHarvestFixtures?: RawFixture[]
    userMysekaiSiteHarvestResourceDrops?: RawDrop[]
}

export interface ParsedMySekaiData {
    uploadTime: number | null
    source: string
    harvestMaps: Record<number, RawHarvestMap>
    ownedMusicRecordIds: Set<number>
}

export interface AggregatedResource {
    key: string
    type: string
    id: number
    quantity: number
    smallIcon: boolean
    deleted: boolean
    rarity: RarityLevel
    texture: string
    hasAttachment: boolean
}

export interface PointGroup {
    key: string
    fixtureId: number
    gameX: number
    gameZ: number
    resources: Record<string, AggregatedResource>
}

export interface PositionedPoint extends PointGroup {
    drawX: number
    drawY: number
}

export interface ResourceRenderCall {
    id: string
    left: number
    top: number
    size: number
    quantity: number
    texture: string
    rarity: RarityLevel
    smallIcon: boolean
    hasAttachment: boolean
    drawOrder: number
}

export interface ResourceStat {
    id: string
    type: string
    itemId: number
    texture: string
    count: number
    rarity: RarityLevel
}

export type TabKey = 'furniture' | 'gate' | 'record'

export interface FixtureRow {
    id: number
    name: string
    flavorText: string
    assetbundleName: string
    fixtureType: string
    settableLayoutType: string
    mainGenreId: number
    subGenreId: number
    gridWidth: number
    gridDepth: number
    gridHeight: number
    colorCount: number
    isAssembled: boolean
    isDisassembled: boolean
    isGameCharacterAction: boolean
    playerActionType: string
    firstPutCost: number
    secondPutCost: number
    tagIds: number[]
}

export interface BlueprintRow {
    id: number
    craftType: string
    craftTargetId: number
    isEnableSketch: boolean
    isObtainedByConvert: boolean
    craftCountLimit: number | null
    isAvailableWithoutPossession: boolean
}

export interface GenreRow {
    id: number
    name: string
}

export interface BlueprintMaterialCostRow {
    mysekaiBlueprintId: number
    mysekaiMaterialId: number
    seq: number
    quantity: number
}

export interface FixtureOnlyDisassembleMaterialRow {
    mysekaiFixtureId: number
    mysekaiMaterialId: number
    seq: number
    quantity: number
}

export interface FixtureTagRow {
    id: number
    name: string
    tagType: string
}

export interface FurnitureMainGroup {
    id: number
    name: string
    total: number
    trackedTotal: number
    owned: number
    subGroups: Array<{
        id: number
        name: string
        items: FixtureRow[]
    }>
}

export interface GateMaterialRow {
    groupId: number
    mysekaiMaterialId: number
    quantity: number
}

export interface MaterialRow {
    id: number
    name: string
    iconAssetbundleName: string
}

export interface MusicRecordRow {
    id: number
    externalId: number
    mysekaiMusicTrackType: string
}

export interface MusicRow {
    id: number
    title: string
    assetbundleName: string
}

export interface MusicTagRow {
    musicId: number
    musicTag: string
}

export interface GateCostItem {
    materialId: number
    quantity: number
    cumulative: number
    owned: number | null
    missing: number | null
}

export interface GateLevelRow {
    level: number
    costs: GateCostItem[]
    rowMissing: number
}

export interface GateView {
    gateId: number
    label: string
    currentLevel: number
    maxLevel: number
    rows: GateLevelRow[]
}

export interface RecordItem {
    recordId: number
    musicId: number
    title: string
    group: string
    owned: boolean
}

export interface GameCharacterRow {
    id: number
    firstName: string
    givenName: string
}

export interface GameCharacterUnitRow {
    id: number
    gameCharacterId: number
    unit: string
}

export interface MysekaiCharacterTalkConditionRow {
    id: number
    conditionType: string
    conditionTypeValue: number
}

export interface MysekaiCharacterTalkConditionGroupRow {
    id: number
    groupId: number
    conditionId: number
}

export interface MysekaiCharacterTalkRow {
    id: number
    characterUnitGroupId: number
    conditionGroupId: number
    archiveGroupId: number
}

export interface MysekaiGameCharacterUnitGroupRow {
    id: number
    unitIds: number[]
}

export interface CharacterArchiveMysekaiCharacterTalkGroupRow {
    id: number
    archiveDisplayType: string
}

export interface MysekaiGateCharacterLotteryRow {
    gameCharacterUnitId: number
}

export interface TalkCharacterOption {
    characterId: number
    label: string
}

export interface TalkUnitOption {
    key: string
    label: string
    shortLabel: string
}

export interface FixtureTalkStat {
    total: number
    read: number
    unread: number
}
