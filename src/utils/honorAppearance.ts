export interface HonorStyleOption {
  id: number
  seq: number
  honorGroupId: number
  assetbundleName: string
  name: string
  description: string
}

export function getHonorLevelAppearance(level: number, isMedalDisplayed: boolean) {
  if (!Number.isFinite(level) || level < 1) return { normalDots: 0, upgradedDots: 0, medalTier: 0 }
  const step = Math.floor(level) - 1
  const dots = step % 10 + 1
  return {
    normalDots: Math.min(dots, 5),
    upgradedDots: Math.max(dots - 5, 0),
    medalTier: isMedalDisplayed ? Math.min(9, Math.floor(step / 10)) : 0,
  }
}

export function getLiveMasterHonorStarCount(level: number) {
  if (!Number.isFinite(level) || level < 1) return 0
  return (Math.floor(level) - 1) % 10 + 1
}

export function getHonorStyleOptions(
  styles: readonly HonorStyleOption[],
  levels: readonly { level: number; description: string }[],
  previewLevel: number,
) {
  // The style and honor level awarded together share the same requirement text.
  return styles.filter((style, index) => index === 0 || levels.some(level =>
    level.level <= previewLevel && level.description === style.description,
  ))
}

export function resolveProfileHonorStyle(
  styles: readonly HonorStyleOption[] | undefined,
  groupId: number,
  selectedId?: number | null,
) {
  let defaultStyle: HonorStyleOption | undefined
  for (const style of styles ?? []) {
    if (style.honorGroupId !== groupId) continue
    if (style.id === selectedId) return style.assetbundleName
    if (!defaultStyle || style.seq < defaultStyle.seq) defaultStyle = style
  }
  return defaultStyle?.assetbundleName
}
