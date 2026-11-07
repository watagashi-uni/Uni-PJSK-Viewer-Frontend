import { useSettingsStore } from '@/stores/settings'
import { useTranslationStore, type ZhEntry } from '@/stores/translations'

/** 奖励、消耗等资源类型 → 名称所在的 master 表和字段 */
export const RESOURCE_ZH: Record<string, [table: string, path: string]> = {
  card: ['cards', 'prefix'],
  material: ['materials', 'name'],
  practice_ticket: ['practiceTickets', 'name'],
  skill_practice_ticket: ['skillPracticeTickets', 'name'],
  boost_item: ['boostItems', 'name'],
  event_item: ['eventItems', 'name'],
  gacha_ticket: ['gachaTickets', 'name'],
  gacha_ceil_item: ['gachaCeilItems', 'name'],
  stamp: ['stamps', 'name'],
  honor: ['honors', 'name'],
  costume_3d: ['costume3ds', 'name'],
  area_item: ['areaItems', 'name'],
  music: ['musics', 'title'],
  virtual_item: ['virtualItems', 'name'],
  penlight: ['penlights', 'name'],
  mysekai_material: ['mysekaiMaterials', 'name'],
  mysekai_item: ['mysekaiItems', 'name'],
  mysekai_fixture: ['mysekaiFixtures', 'name'],
  mysekai_tool: ['mysekaiTools', 'name'],
  avatar_accessory: ['avatarAccessories', 'name'],
  avatar_costume: ['avatarCostumes', 'name'],
  avatar_coordinate: ['avatarCoordinates', 'name'],
  avatar_motion: ['avatarMotions', 'name'],
  avatar_skin_color: ['avatarSkinColors', 'name'],
  custom_profile_collection_resource: ['customProfileCollectionResources', 'name'],
  virtual_live_transition_item: ['virtualLiveTransitionItems', 'name'],
  virtual_live_ticket: ['virtualLiveTickets', 'name'],
  paid_virtual_live_shop_item: ['paidVirtualLiveShopItems', 'name'],
}

/**
 * 资源名称的译文。名称查不到时返回 undefined；关闭译名显示时不下载。
 * 只按需下载实际出现的资源类型对应的表。
 */
export function useResourceZh() {
  const settings = useSettingsStore()
  const store = useTranslationStore()

  function resourceEntry(resourceType: string, jp: string | null | undefined): ZhEntry | undefined {
    const source = RESOURCE_ZH[resourceType]
    if (!source || !jp || settings.translationMode === 'off') return undefined
    store.ensure(source[0], source[1])
    return store.lookup(source[0], source[1], jp)
  }
  function resourceZh(resourceType: string, jp: string | null | undefined): string | undefined {
    return resourceEntry(resourceType, jp)?.text
  }
  /** 纯文本场合：中文优先时用译名，否则用原名 */
  function resourceLabel(resourceType: string, jp: string): string {
    return (settings.translationMode === 'zh-first' && resourceZh(resourceType, jp)) || jp
  }

  /**
   * 按页面上已经格式化好的名称查译文：成员名带「」，表情贴图去掉了“[スタンプ]”前缀，
   * 这里按同样的格式还原后再查，返回格式相同的中文。
   */
  function resourceDisplayZh(resourceType: string, display: string | null | undefined): string | undefined {
    if (!display) return undefined
    if (resourceType === 'card') {
      const prefix = /^「(.*)」$/.exec(display)?.[1]
      const zh = resourceZh('card', prefix ?? display)
      return zh && (prefix !== undefined ? `「${zh}」` : zh)
    }
    if (resourceType === 'stamp') {
      const zh = resourceZh('stamp', `[スタンプ]${display}`) ?? resourceZh('stamp', display)
      return zh?.replace(/^\[[^\]]*\]/, '').trim()
    }
    return resourceZh(resourceType, display)
  }

  return { resourceEntry, resourceZh, resourceLabel, resourceDisplayZh }
}

/** 日程条目（活动、卡池、歌曲等）标题所在的表和字段 */
export const SCHEDULE_ZH: Record<string, { table: string; path: string }> = {
  event: { table: 'events', path: 'name' },
  gacha: { table: 'gachas', path: 'name' },
  music: { table: 'musics', path: 'title' },
  virtual_live: { table: 'virtualLives', path: 'name' },
  login_bonus: { table: 'limitedLoginBonuses', path: 'name' },
}
