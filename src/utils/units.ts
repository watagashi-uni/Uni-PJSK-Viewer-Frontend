/** 团体（组合）：筛选器、角色选择器共用的顺序、名称、logo 和代表色 */
export interface UnitInfo {
  value: string
  label: string
  /** 窄处用的简称 */
  short: string
  logo: string
  color: string
}

export const UNITS: readonly UnitInfo[] = [
  { value: 'light_sound', label: 'Leo/need', short: 'L/n', logo: '/img/logo/logo_light_sound.png', color: '#4455dd' },
  { value: 'idol', label: 'MORE MORE JUMP!', short: 'MMJ', logo: '/img/logo/logo_idol.png', color: '#88dd44' },
  { value: 'street', label: 'Vivid BAD SQUAD', short: 'VBS', logo: '/img/logo/logo_street.png', color: '#ee1166' },
  { value: 'theme_park', label: 'Wonderlands×Showtime', short: 'WxS', logo: '/img/logo/logo_theme_park.png', color: '#ff9900' },
  { value: 'school_refusal', label: '25时、Nightcord见。', short: '25时', logo: '/img/logo/logo_school_refusal.png', color: '#884499' },
  { value: 'piapro', label: 'VIRTUAL SINGER', short: 'VS', logo: '/img/logo/logo_piapro.png', color: '#33aaee' },
]

const UNIT_MAP = new Map(UNITS.map(unit => [unit.value, unit]))

export function getUnit(value: string | null | undefined): UnitInfo | undefined {
  return value ? UNIT_MAP.get(value) : undefined
}

/** 角色 ID → 所属团体。1–20 每四人一个团体，21–26 是虚拟歌手 */
export function unitOfCharacter(characterId: number): string {
  if (characterId >= 1 && characterId <= 20) return UNITS[Math.floor((characterId - 1) / 4)]!.value
  return 'piapro'
}

/** 角色头像（90px 圆形头像），1–26 都有 */
export function characterIconUrl(characterId: number): string {
  return `/img/chr_ts/chr_ts_90_${characterId}.png`
}

/** 选人界面的立牌（竖长图，名字印在图上）。普通成员 376×840，虚拟歌手 240×840 */
export function characterSelectUrl(characterId: number, assetsHost: string): string {
  return `${assetsHost}/startapp/character/character_select/chr_tl_${characterId}.png`
}

/** 透明底的大立绘（1920×1440，人物在画面中间） */
export function characterTrimUrl(characterId: number, assetsHost: string): string {
  return `${assetsHost}/startapp/character/character_trim/chr_trim_${characterId}.png`
}

/** Q 版小人（250×200，透明底） */
export function characterSdUrl(characterId: number, assetsHost: string): string {
  return `${assetsHost}/startapp/character/character_sd_l/chr_sp_${characterId}.png`
}
