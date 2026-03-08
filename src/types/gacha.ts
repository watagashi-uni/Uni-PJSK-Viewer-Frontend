export interface GachaPickup {
    id: number
    gachaId: number
    cardId: number
    gachaPickupType: string
}

export interface GachaBehavior {
    id: number
    gachaId: number
    gachaBehaviorType: string
    costResourceType: string
    costResourceQuantity: number
    spinCount: number
    groupId: number
    resourceCategory?: string
    gachaSpinnableType?: string
}

export interface GachaCardRarityRate {
    id: number
    gachaId: number
    cardRarityType: string
    rate: number
}

export interface GachaDetail {
    id: number
    gachaId: number
    cardId: number
    weight: number
    isWish: boolean
}

export interface Gacha {
    id: number
    gachaType: string
    name: string
    seq: number
    assetbundleName: string
    gachaCeilItemId: number
    startAt: number
    endAt: number
    gachaBehaviors?: GachaBehavior[]
    gachaCardRarityRates?: GachaCardRarityRate[]
    gachaDetails?: GachaDetail[]
    gachaInformation?: {
        summary: string
        description: string
    }
    gachaPickups?: GachaPickup[]
}

export interface Card {
    id: number
    characterId: number
    cardRarityType: string
    attr: string
    assetbundleName: string
    prefix: string
}

export interface SimulationResult {
    cardId: number
    card: Card | null
}

export interface SimulationStats {
    totalPulls: number
    totalJewels: number
    totalTickets: number
    rarityCount: Record<string, number>
}
