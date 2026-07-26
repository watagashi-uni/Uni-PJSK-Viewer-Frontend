export interface Costume3d {
    id: number
    seq: number
    costume3dGroupId: number
    costume3dType: string
    name: string
    partType: string
    colorId: number
    colorName: string
    characterId: number
    costume3dRarity: string
    howToObtain?: string
    assetbundleName: string
    designer?: string
    publishedAt?: number
    archivePublishedAt?: number
}

export interface CardCostume3d {
    cardId: number
    costume3dId: number
    isInitialObtainHair?: boolean
}

export interface CostumeColorVariant {
    costume3dId: number
    colorId: number
    colorName: string
    assetbundleName: string
}

export interface CostumePart {
    partType: string
    variants: CostumeColorVariant[]
    /** 该部件单独的获取条件（如专属发型需要对应卡片 Master Rank 2） */
    howToObtain?: string
}

/**
 * 一套衣装：costume3dGroupId + characterId 组合下的全部部件与配色。
 * （注意 groupId 不能单独作为唯一键，愚人节衣装存在一个 group 跨多个角色的情况）
 */
export interface CostumeGroup {
    key: string
    groupId: number
    characterId: number
    /** 代表性条目 id（优先 body 的最小配色），用作详情页路由参数 */
    representativeId: number
    name: string
    costume3dType: string
    rarity: string
    howToObtain?: string
    designer?: string
    publishedAt: number
    parts: CostumePart[]
    thumbAssetbundleName: string
    /** 来源卡片（仅部分 4 星卡附带衣装时存在） */
    cardId?: number
    /**
     * 卡片关联方式：own = 本角色卡片直接关联（cardCostume3ds 登记），
     * distributed = 其他角色卡片衣装按资源名归因的配布版
     */
    cardLinkType?: 'own' | 'distributed'
}
