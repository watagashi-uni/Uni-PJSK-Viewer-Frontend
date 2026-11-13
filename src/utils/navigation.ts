import type { Component } from 'vue'
import {
  Home, Music, Image, Users, Shirt, Trophy, Smile, Boxes, Wrench, BookOpen,
  Calendar, BarChart3, Gift, Radio, CalendarDays,
  Zap, FileImage, PenLine, Dices,
  User, History, Layers3, House, Settings, Info,
} from 'lucide-vue-next'

export interface NavItem {
  to: string
  label: string
  icon: Component
  /** 搜索面板里显示的一句说明 */
  description: string
  /** 搜索时额外匹配的词（别名、英文） */
  keywords?: string
  /** 额外归属到此入口的路径前缀（详情页等） */
  also?: string[]
}

export interface NavGroup {
  title?: string
  items: NavItem[]
}

/** 侧边栏导航，也是搜索面板里「页面」的来源 */
export const navGroups: NavGroup[] = [
  {
    items: [{ to: '/', label: '首页', icon: Home, description: '当期活动、卡池和近期日程', keywords: 'home 主页' }],
  },
  {
    title: '图鉴',
    items: [
      { to: '/musics', label: '歌曲', icon: Music, description: '歌曲、谱面难度和试听', keywords: 'music song 乐曲 曲目 谱面 定数' },
      { to: '/cards', label: '卡片', icon: Image, description: '卡面、技能和综合力', keywords: 'card 卡牌 卡面' },
      { to: '/characters', label: '角色', icon: Users, description: '角色档案和相关卡片', keywords: 'character 人物 生日' },
      { to: '/costumes', label: '衣装', icon: Shirt, description: '3D 衣装和发型', keywords: 'costume 服装 模型' },
      { to: '/honors', label: '称号', icon: Trophy, description: '普通称号和牵绊称号', keywords: 'honor 头衔 牵绊' },
      { to: '/stamps', label: '表情贴图', icon: Smile, description: '游戏内贴图，可下载原图', keywords: 'stamp 贴纸 表情' },
      { to: '/items', label: '物品', icon: Boxes, description: '素材、道具和交换券', keywords: 'item 素材 道具' },
      { to: '/area-items', label: '区域道具', icon: Wrench, description: '道具加成和升级所需素材', keywords: 'area item 家具 加成' },
      { to: '/stories', label: '剧情', icon: BookOpen, description: '活动、主线和卡面剧情', keywords: 'story 故事 剧本 live2d' },
    ],
  },
  {
    title: '活动与卡池',
    items: [
      { to: '/events', label: '活动', icon: Calendar, description: '历次活动和奖励', keywords: 'event 马拉松 5v5 world link' },
      { to: '/ranking', label: '实时榜线', icon: BarChart3, description: '当期活动的排名和分数线', keywords: 'ranking 排行 榜单 分数线' },
      { to: '/gachas', label: '卡池', icon: Gift, description: '招募卡池和出现率', keywords: 'gacha 招募 抽卡 扭蛋' },
      { to: '/vlives', label: '虚拟 Live', icon: Radio, description: '演出排期和节目单', keywords: 'virtual live 演唱会 afterlive' },
      { to: '/calendar', label: '游戏日历', icon: CalendarDays, description: '活动、卡池、歌曲和生日的日程', keywords: 'calendar 日程 时间表' },
    ],
  },
  {
    title: '工具',
    items: [
      { to: '/deck-recommend', label: '自动组队', icon: Zap, description: '按活动或歌曲推荐卡组', keywords: 'deck 组卡 配队 综合力' },
      { to: '/sus2img', label: '谱面转图片', icon: FileImage, description: 'SUS / JSON 谱面转图片和在线预览', keywords: 'sus chart 谱面预览 图片' },
      { to: '/custom-score-maker', label: '谱面 Maker', icon: PenLine, description: '浏览游戏内的自制谱面', keywords: 'custom score 自制谱 创作谱面' },
      { to: '/costumes/custom', label: '衣装自由搭配', icon: Dices, description: '自由组合服装、发饰和发型', keywords: 'costume 3d 换装 搭配' },
    ],
  },
  {
    title: '我的',
    items: [
      { to: '/profile', label: '个人信息', icon: User, description: '绑定账号，查看名片和卡组', keywords: 'profile 账号 绑定 名片' },
      { to: '/card-collection', label: '养成进度', icon: Layers3, description: '卡片收集、特训和剧情阅读情况', keywords: 'collection 收集 图鉴 特训' },
      { to: '/account-records', label: '账号记录', icon: History, description: '活动、挑战 Live 和排位的历史记录', keywords: 'records 履历 历史' },
      { to: '/mysekai', label: 'MySekai', icon: House, description: '家具、画布、唱片和天气', keywords: 'mysekai 我的世界 家具 蓝图' },
    ],
  },
]

/** 不在主导航里、但搜索面板要能找到的页面 */
export const extraPages: NavItem[] = [
  { to: '/settings', label: '设置', icon: Settings, description: '剧透、译名、主题、资源线路和通知', keywords: 'settings 配置 剧透 翻译 主题 缓存' },
  { to: '/about', label: '关于', icon: Info, description: '项目说明、数据来源和致谢', keywords: 'about 说明 github 致谢' },
]

/**
 * 用最长前缀匹配决定当前路径属于哪个入口，让详情页（/musics/123 等）也能定位到所属栏目，
 * 同时避免 /costumes 与 /costumes/custom 同时高亮
 */
export function resolveActiveNav(path: string): string {
  if (path === '/') return '/'
  let best = ''
  let bestLength = -1
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.to === '/') continue
      for (const prefix of [item.to, ...(item.also ?? [])]) {
        const matches = path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`)
        if (matches && prefix.length > bestLength) {
          best = item.to
          bestLength = prefix.length
        }
      }
    }
  }
  return best
}
