/**
 * 部分卡牌（如 1167、1458–1463）在 cards master 中标记为 initialSpecialTrainingStatus: 'done'，
 * 获得时即为特训后状态，不存在特训前的卡面、立绘与缩略图。
 * 参数接受任意卡牌对象：各页面的局部卡牌类型不一定声明了这个字段。
 */
export function isTrainedOnlyCard(card: unknown): boolean {
    return typeof card === 'object' && card !== null
        && (card as { initialSpecialTrainingStatus?: unknown }).initialSpecialTrainingStatus === 'done'
}

/** 缩略图/卡面的资源后缀：特训后或只有特训后形态的卡使用 after_training */
export function cardImageVariant(card: unknown, trained: boolean): 'after_training' | 'normal' {
    return trained || isTrainedOnlyCard(card) ? 'after_training' : 'normal'
}
