import type { CardCostume3d, Costume3d, CostumeGroup, CostumePart } from '@/types/costume'

export const COSTUME_PART_ORDER = ['body', 'head', 'hair'] as const

export const COSTUME_PART_LABELS: Record<string, string> = {
    body: '服装',
    head: '头饰',
    hair: '发型',
}

export const COSTUME_TYPE_LABELS: Record<string, string> = {
    default: '初始',
    distribution: '配布',
    normal: '通常',
}

export const COSTUME_RARITY_LABELS: Record<string, string> = {
    normal: '普通',
    rare: '稀有',
}

/**
 * 衣装缩略图地址。衣装缩略图仅海外源有全量同步，调用方应固定传入海外源 host。
 */
export function costumeThumbUrl(assetsHost: string, assetbundleName: string): string {
    return `${assetsHost}/startapp/thumbnail/costume/${assetbundleName}.png`
}

/**
 * 把 costume3ds 条目按 (costume3dGroupId, characterId) 聚合成"一套衣装"，
 * 并通过 cardCostume3ds 关联来源卡片。
 *
 * cardCostume3ds 只登记卡片角色本人的衣装条目，但 4 星卡衣装几乎都会以相同
 * assetbundleName 按性别配布给其他角色（各自独立的 group），因此对没有直接
 * 关联的组再按资源名归因到来源卡片。
 *
 * @param allCostumes 用于构建"资源名 → 卡片"映射的完整条目列表；
 *                    costumes 传子集时（如详情页）需要显式传入完整列表
 */
export function buildCostumeGroups(
    costumes: Costume3d[],
    cardCostumes: CardCostume3d[],
    allCostumes: Costume3d[] = costumes,
): CostumeGroup[] {
    const cardIdByCostumeId = new Map<number, number>()
    for (const link of cardCostumes) {
        if (!cardIdByCostumeId.has(link.costume3dId)) {
            cardIdByCostumeId.set(link.costume3dId, link.cardId)
        }
    }

    const cardIdByAssetbundleName = new Map<string, number>()
    for (const costume of allCostumes) {
        const linked = cardIdByCostumeId.get(costume.id)
        if (linked !== undefined && !cardIdByAssetbundleName.has(costume.assetbundleName)) {
            cardIdByAssetbundleName.set(costume.assetbundleName, linked)
        }
    }

    const entriesByKey = new Map<string, Costume3d[]>()
    for (const costume of costumes) {
        const key = `${costume.costume3dGroupId}:${costume.characterId}`
        const list = entriesByKey.get(key)
        if (list) {
            list.push(costume)
        } else {
            entriesByKey.set(key, [costume])
        }
    }

    const groups: CostumeGroup[] = []
    for (const [key, entries] of entriesByKey) {
        const parts: CostumePart[] = []
        for (const partType of COSTUME_PART_ORDER) {
            const partEntries = entries
                .filter(e => e.partType === partType)
                .sort((a, b) => a.colorId - b.colorId)
            if (partEntries.length === 0) continue
            parts.push({
                partType,
                variants: partEntries.map(e => ({
                    costume3dId: e.id,
                    colorId: e.colorId,
                    colorName: e.colorName,
                    assetbundleName: e.assetbundleName,
                })),
                howToObtain: partEntries.find(e => e.howToObtain)?.howToObtain,
            })
        }
        const firstPart = parts[0]
        if (!firstPart) continue
        const representative = firstPart.variants[0]
        if (!representative) continue
        const repEntry = entries.find(e => e.id === representative.costume3dId)
        if (!repEntry) continue

        let cardId: number | undefined
        let cardLinkType: 'own' | 'distributed' | undefined
        for (const entry of entries) {
            const linked = cardIdByCostumeId.get(entry.id)
            if (linked !== undefined) {
                cardId = linked
                cardLinkType = 'own'
                break
            }
        }
        if (cardId === undefined) {
            for (const entry of entries) {
                const linked = cardIdByAssetbundleName.get(entry.assetbundleName)
                if (linked !== undefined) {
                    cardId = linked
                    cardLinkType = 'distributed'
                    break
                }
            }
        }

        groups.push({
            key,
            groupId: repEntry.costume3dGroupId,
            characterId: repEntry.characterId,
            representativeId: representative.costume3dId,
            name: repEntry.name,
            costume3dType: repEntry.costume3dType,
            rarity: repEntry.costume3dRarity,
            howToObtain: repEntry.howToObtain,
            designer: repEntry.designer,
            publishedAt: repEntry.publishedAt ?? repEntry.archivePublishedAt ?? 0,
            parts,
            thumbAssetbundleName: representative.assetbundleName,
            cardId,
            cardLinkType,
        })
    }
    return groups
}
