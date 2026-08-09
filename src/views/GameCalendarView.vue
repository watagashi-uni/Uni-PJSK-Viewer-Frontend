<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight, Gift, Music2, X } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'

type CalendarCategory = 'event' | 'gacha' | 'music' | 'virtual_live' | 'login_bonus' | 'birthday'

interface EventInfo {
  id: number
  name: string
  startAt: number
  aggregateAt: number
}

interface GachaInfo {
  id: number
  name: string
  startAt: number
  endAt: number
  isShowPeriod?: boolean
}

interface MusicInfo {
  id: number
  title: string
  publishedAt: number
}

interface VirtualLiveSchedule {
  id: number
  startAt: number
  endAt: number
}

interface VirtualLiveInfo {
  id: number
  name: string
  startAt: number
  endAt: number
  virtualLiveSchedules?: VirtualLiveSchedule[]
}

interface CharacterInfo {
  id: number
  seq?: number
  firstName?: string
  givenName: string
}

interface CharacterProfile {
  characterId: number
  birthday?: string
}

interface LoginBonusInfo {
  id: number
  name: string
  startAt: number
  endAt: number
  limitedLoginBonusDetails?: LoginBonusDetail[]
}

interface LoginBonusDetail {
  id: number
  limitedLoginBonusId: number
  day: number
  resourceBoxId: number
}

interface ResourceDetail {
  seq: number
  resourceType: string
  resourceId?: number
  resourceQuantity: number
}

interface ResourceBox {
  id: number
  resourceBoxPurpose: string
  details: ResourceDetail[]
}

interface NamedResource {
  id: number
  name?: string
  prefix?: string
  assetbundleName?: string
  iconAssetbundleName?: string
}

interface RewardDay {
  day: number
  boxId: number
  rewards: ResourceDetail[]
}

interface CalendarEntry {
  key: string
  category: CalendarCategory
  timestamp: number
  title: string
  subtitle: string
  route?: string
  characterId?: number
  loginBonusId?: number
}

interface CalendarDay {
  key: string
  date: Date
  day: number
  currentMonth: boolean
  today: boolean
  entries: CalendarEntry[]
}

const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const today = new Date()
const currentMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDateKey = ref(toDateKey(today))
const isLoading = ref(true)
const loadError = ref('')
const events = ref<EventInfo[]>([])
const gachas = ref<GachaInfo[]>([])
const musics = ref<MusicInfo[]>([])
const virtualLives = ref<VirtualLiveInfo[]>([])
const characters = ref<CharacterInfo[]>([])
const characterProfiles = ref<CharacterProfile[]>([])
const loginBonuses = ref<LoginBonusInfo[]>([])
const selectedLoginBonusId = ref(0)
const resourceBoxes = ref<ResourceBox[]>([])
const resourceMaps = ref(new Map<string, Map<number, NamedResource>>())
const rewardLoading = ref(false)
const rewardLoaded = ref(false)
const rewardError = ref('')
const categoryEnabled = ref<Record<CalendarCategory, boolean>>({
  event: true,
  gacha: true,
  music: true,
  virtual_live: true,
  login_bonus: true,
  birthday: true,
})

const categoryMeta: Record<CalendarCategory, { label: string; dot: string; badge: string }> = {
  event: { label: '活动', dot: 'bg-primary', badge: 'badge-primary' },
  gacha: { label: '卡池', dot: 'bg-secondary', badge: 'badge-secondary' },
  music: { label: '歌曲', dot: 'bg-info', badge: 'badge-info' },
  virtual_live: { label: 'Virtual Live', dot: 'bg-warning', badge: 'badge-warning' },
  login_bonus: { label: '登录活动', dot: 'bg-accent', badge: 'badge-accent' },
  birthday: { label: '生日', dot: 'bg-success', badge: 'badge-success' },
}
const categoryOrder: CalendarCategory[] = ['event', 'gacha', 'music', 'virtual_live', 'login_bonus', 'birthday']
const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']

function toDateKey(date: Date | number): string {
  const value = typeof date === 'number' ? new Date(date) : date
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function characterName(characterId: number): string {
  const character = characters.value.find(row => row.id === characterId)
  return character ? `${character.firstName || ''}${character.givenName}` : `角色 #${characterId}`
}

function characterIcon(characterId: number): string {
  if (characterId <= 20) return `/img/chr_ts/chr_ts_90_${characterId}.png`
  return `/img/chr_ts/chr_ts_90_${characterId}_2.png`
}

const permanentEntries = computed<CalendarEntry[]>(() => {
  const rows: CalendarEntry[] = []
  for (const event of events.value) {
    rows.push({ key: `event-start-${event.id}`, category: 'event', timestamp: Number(event.startAt), title: event.name, subtitle: '活动开始', route: `/events/${event.id}` })
    rows.push({ key: `event-end-${event.id}`, category: 'event', timestamp: Number(event.aggregateAt), title: event.name, subtitle: '活动结算', route: `/events/${event.id}` })
  }
  for (const gacha of gachas.value.filter(row => row.isShowPeriod !== false)) {
    rows.push({ key: `gacha-start-${gacha.id}`, category: 'gacha', timestamp: Number(gacha.startAt), title: gacha.name, subtitle: '卡池开放', route: `/gacha/${gacha.id}` })
    rows.push({ key: `gacha-end-${gacha.id}`, category: 'gacha', timestamp: Number(gacha.endAt), title: gacha.name, subtitle: '卡池结束', route: `/gacha/${gacha.id}` })
  }
  for (const music of musics.value) {
    rows.push({ key: `music-${music.id}`, category: 'music', timestamp: Number(music.publishedAt), title: music.title, subtitle: '歌曲发布', route: `/musics/${music.id}` })
  }
  for (const live of virtualLives.value) {
    const schedules = Array.isArray(live.virtualLiveSchedules) ? live.virtualLiveSchedules : []
    if (schedules.length) {
      for (const schedule of schedules) {
        rows.push({ key: `vlive-${live.id}-${schedule.id}`, category: 'virtual_live', timestamp: Number(schedule.startAt), title: live.name, subtitle: 'Virtual Live 场次', route: `/vlives/${live.id}` })
      }
    } else if (live.startAt) {
      rows.push({ key: `vlive-${live.id}`, category: 'virtual_live', timestamp: Number(live.startAt), title: live.name, subtitle: 'Virtual Live 开始', route: `/vlives/${live.id}` })
    }
  }
  for (const campaign of loginBonuses.value) {
    rows.push({ key: `login-bonus-start-${campaign.id}`, category: 'login_bonus', timestamp: Number(campaign.startAt), title: campaign.name, subtitle: '登录活动开始', loginBonusId: campaign.id })
    rows.push({ key: `login-bonus-end-${campaign.id}`, category: 'login_bonus', timestamp: Number(campaign.endAt), title: campaign.name, subtitle: '登录活动结束', loginBonusId: campaign.id })
  }
  return rows.filter(row => Number.isFinite(row.timestamp) && row.timestamp > 0)
})

const birthdayEntries = computed<CalendarEntry[]>(() => {
  const year = currentMonth.value.getFullYear()
  return characterProfiles.value.flatMap(profile => {
    const match = profile.birthday?.match(/(\d+)月(\d+)日/)
    if (!match) return []
    const timestamp = new Date(year, Number(match[1]) - 1, Number(match[2]), 12).getTime()
    return [{
      key: `birthday-${year}-${profile.characterId}`,
      category: 'birthday' as const,
      timestamp,
      title: `${characterName(profile.characterId)}的生日`,
      subtitle: '角色生日',
      route: `/characters/${profile.characterId}`,
      characterId: profile.characterId,
    }]
  })
})

const allEntries = computed(() => [...permanentEntries.value, ...birthdayEntries.value])
const spoilerSafeEntries = computed(() => allEntries.value.filter(row => {
  if (settingsStore.showSpoilers) return true
  if (row.category === 'birthday') return toDateKey(row.timestamp) <= toDateKey(new Date())
  return row.timestamp <= Date.now()
}))
const filteredEntries = computed(() => spoilerSafeEntries.value.filter(row => categoryEnabled.value[row.category]))
const entriesByDate = computed(() => {
  const result = new Map<string, CalendarEntry[]>()
  for (const entry of filteredEntries.value) {
    const key = toDateKey(entry.timestamp)
    const list = result.get(key) || []
    list.push(entry)
    result.set(key, list)
  }
  for (const list of result.values()) list.sort((a, b) => a.timestamp - b.timestamp || a.category.localeCompare(b.category))
  return result
})

const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const first = new Date(year, month, 1)
  const mondayOffset = (first.getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, index - mondayOffset + 1)
    const key = toDateKey(date)
    return {
      key,
      date,
      day: date.getDate(),
      currentMonth: date.getMonth() === month,
      today: key === toDateKey(today),
      entries: entriesByDate.value.get(key) || [],
    }
  })
})

const visibleMonthEntries = computed(() => {
  const key = monthKey(currentMonth.value)
  return filteredEntries.value.filter(row => toDateKey(row.timestamp).startsWith(key)).sort((a, b) => a.timestamp - b.timestamp)
})

const monthCategoryCounts = computed(() => {
  const key = monthKey(currentMonth.value)
  const result = Object.fromEntries(categoryOrder.map(category => [category, 0])) as Record<CalendarCategory, number>
  for (const entry of spoilerSafeEntries.value) {
    if (toDateKey(entry.timestamp).startsWith(key)) result[entry.category] += 1
  }
  return result
})

const activeDays = computed(() => new Set(visibleMonthEntries.value.map(entry => toDateKey(entry.timestamp))).size)
const selectedEntries = computed(() => entriesByDate.value.get(selectedDateKey.value) || [])
const selectedDateLabel = computed(() => {
  const [year, month, day] = selectedDateKey.value.split('-').map(Number)
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(year || 0, (month || 1) - 1, day || 1))
})
const monthLabel = computed(() => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(currentMonth.value))
const canGoNextMonth = computed(() => settingsStore.showSpoilers || monthKey(currentMonth.value) < monthKey(today))
const assetsHost = computed(() => settingsStore.assetsHost)
const selectedLoginBonus = computed(() => loginBonuses.value.find(row => row.id === selectedLoginBonusId.value) || null)
const loginBonusBoxMap = computed(() => new Map(resourceBoxes.value
  .filter(box => box.resourceBoxPurpose === 'login_bonus')
  .map(box => [box.id, box])))
const selectedRewardDays = computed<RewardDay[]>(() => {
  if (!selectedLoginBonus.value || !rewardLoaded.value) return []
  return [...(selectedLoginBonus.value.limitedLoginBonusDetails || [])]
    .sort((a, b) => a.day - b.day)
    .map(detail => ({
      day: detail.day,
      boxId: detail.resourceBoxId,
      rewards: [...(loginBonusBoxMap.value.get(detail.resourceBoxId)?.details || [])].sort((a, b) => a.seq - b.seq),
    }))
})

function setMonth(offset: number) {
  const nextMonth = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + offset, 1)
  if (!settingsStore.showSpoilers && monthKey(nextMonth) > monthKey(today)) return
  currentMonth.value = nextMonth
  selectedDateKey.value = toDateKey(currentMonth.value)
}

function goToday() {
  currentMonth.value = new Date(today.getFullYear(), today.getMonth(), 1)
  selectedDateKey.value = toDateKey(today)
}

function selectDay(day: CalendarDay) {
  if (!day.currentMonth) {
    currentMonth.value = new Date(day.date.getFullYear(), day.date.getMonth(), 1)
  }
  selectedDateKey.value = day.key
}

function toggleCategory(category: CalendarCategory) {
  categoryEnabled.value[category] = !categoryEnabled.value[category]
}

function timeLabel(entry: CalendarEntry): string {
  if (entry.category === 'birthday') return '全天'
  return new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString('zh-CN')
}

function openLoginBonus(id?: number) {
  if (!id) return
  selectedLoginBonusId.value = id
  void ensureRewardData()
}

function closeLoginBonus() {
  selectedLoginBonusId.value = 0
}

async function ensureRewardData() {
  if (rewardLoaded.value || rewardLoading.value) return
  rewardLoading.value = true
  rewardError.value = ''
  try {
    const [boxes, materials, boosts, practice, skill, tickets, cards, stamps, mysekaiMaterials, mysekaiTools, fixtures, avatars, profileResources] = await Promise.all([
      masterStore.getMaster<ResourceBox>('resourceBoxes'),
      masterStore.getMaster<NamedResource>('materials'),
      masterStore.getMaster<NamedResource>('boostItems'),
      masterStore.getMaster<NamedResource>('practiceTickets'),
      masterStore.getMaster<NamedResource>('skillPracticeTickets'),
      masterStore.getMaster<NamedResource>('gachaTickets'),
      masterStore.getMaster<NamedResource>('cards'),
      masterStore.getMaster<NamedResource>('stamps'),
      masterStore.getMaster<NamedResource>('mysekaiMaterials'),
      masterStore.getMaster<NamedResource>('mysekaiTools'),
      masterStore.getMaster<NamedResource>('mysekaiFixtures'),
      masterStore.getMaster<NamedResource>('avatarCoordinates'),
      masterStore.getMaster<NamedResource>('customProfileCollectionResources'),
    ])
    resourceBoxes.value = boxes
    resourceMaps.value = new Map([
      ['material', new Map(materials.map(row => [row.id, row]))],
      ['boost_item', new Map(boosts.map(row => [row.id, row]))],
      ['practice_ticket', new Map(practice.map(row => [row.id, row]))],
      ['skill_practice_ticket', new Map(skill.map(row => [row.id, row]))],
      ['gacha_ticket', new Map(tickets.map(row => [row.id, row]))],
      ['card', new Map(cards.map(row => [row.id, row]))],
      ['stamp', new Map(stamps.map(row => [row.id, row]))],
      ['mysekai_material', new Map(mysekaiMaterials.map(row => [row.id, row]))],
      ['mysekai_tool', new Map(mysekaiTools.map(row => [row.id, row]))],
      ['mysekai_fixture', new Map(fixtures.map(row => [row.id, row]))],
      ['avatar_coordinate', new Map(avatars.map(row => [row.id, row]))],
      ['custom_profile_collection_resource', new Map(profileResources.map(row => [row.id, row]))],
    ])
    rewardLoaded.value = true
  } catch (error) {
    rewardError.value = error instanceof Error ? error.message : '奖励数据加载失败'
  } finally {
    rewardLoading.value = false
  }
}

const resourceTypeLabels: Record<string, string> = {
  jewel: '水晶', coin: '金币', virtual_coin: '虚拟币', material: '素材', boost_item: '体力道具',
  practice_ticket: '练习券', skill_practice_ticket: '技能券', gacha_ticket: '招募券', card: '成员',
  stamp: '表情贴图', mysekai_material: 'MySekai 素材', mysekai_tool: 'MySekai 工具',
  mysekai_fixture: 'MySekai 家具', avatar_coordinate: '虚拟形象套装',
  custom_profile_collection_resource: '个人资料素材',
}

function resourceName(resource: ResourceDetail): string {
  const typeLabel = resourceTypeLabels[resource.resourceType] || resource.resourceType
  const id = Number(resource.resourceId || 0)
  if (!id) return typeLabel
  const row = resourceMaps.value.get(resource.resourceType)?.get(id)
  if (resource.resourceType === 'card' && row?.prefix) return `「${row.prefix}」`
  if (resource.resourceType === 'stamp' && row?.name) return row.name.replace(/^\[スタンプ\]/, '')
  return row?.name || `${typeLabel} #${id}`
}

function resourceIcon(resource: ResourceDetail): string {
  const id = Number(resource.resourceId || 0)
  const row = resourceMaps.value.get(resource.resourceType)?.get(id)
  if (['jewel', 'coin', 'virtual_coin'].includes(resource.resourceType)) return `${assetsHost.value}/startapp/thumbnail/common_material/${resource.resourceType}.png`
  if (resource.resourceType === 'material') return `${assetsHost.value}/startapp/thumbnail/material/material${id}.png`
  if (resource.resourceType === 'boost_item') return `${assetsHost.value}/startapp/thumbnail/boost_item/boost_item${id}.png`
  if (resource.resourceType === 'practice_ticket') return `${assetsHost.value}/startapp/thumbnail/practice_ticket/ticket${id}.png`
  if (resource.resourceType === 'skill_practice_ticket') return `${assetsHost.value}/startapp/thumbnail/skill_practice_ticket/ticket${id}.png`
  if (resource.resourceType === 'gacha_ticket' && row?.assetbundleName) return `${assetsHost.value}/startapp/thumbnail/gacha_ticket/${row.assetbundleName}.png`
  if (resource.resourceType === 'card' && row?.assetbundleName) return `${assetsHost.value}/startapp/thumbnail/chara/${row.assetbundleName}_normal.png`
  if (resource.resourceType === 'stamp' && row?.assetbundleName) return `${assetsHost.value}/startapp/stamp/${row.assetbundleName}/${row.assetbundleName}.png`
  if (resource.resourceType === 'mysekai_material' && row?.iconAssetbundleName) return `${assetsHost.value}/ondemand/mysekai/thumbnail/material/${row.iconAssetbundleName}.png`
  if (resource.resourceType === 'mysekai_tool' && row?.assetbundleName) return `${assetsHost.value}/ondemand/mysekai/thumbnail/tool/${row.assetbundleName}.png`
  return ''
}

onMounted(async () => {
  try {
    const [eventData, gachaData, musicData, liveData, characterData, profileData, loginBonusData] = await Promise.all([
      masterStore.getMaster<EventInfo>('events'),
      masterStore.getMaster<GachaInfo>('gachas'),
      masterStore.getMaster<MusicInfo>('musics'),
      masterStore.getMaster<VirtualLiveInfo>('virtualLives'),
      masterStore.getMaster<CharacterInfo>('gameCharacters'),
      masterStore.getMaster<CharacterProfile>('characterProfiles'),
      masterStore.getMaster<LoginBonusInfo>('limitedLoginBonuses'),
    ])
    events.value = eventData
    gachas.value = gachaData
    musics.value = musicData
    virtualLives.value = liveData
    characters.value = characterData.filter(row => row.id <= 26)
    characterProfiles.value = profileData
    loginBonuses.value = loginBonusData
  } catch (error) {
    console.error('加载游戏日历失败:', error)
    loadError.value = error instanceof Error ? error.message : 'Master 数据加载失败'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <PageHeader title="游戏日历" description="在同一时间轴查看活动、卡池、歌曲发布、Virtual Live、登录活动与角色生日。">
      <template #icon><CalendarDays class="w-8 h-8 text-primary" /></template>
    </PageHeader>

    <div v-if="isLoading" class="space-y-4"><div class="skeleton h-24 rounded-xl"></div><div class="skeleton h-[34rem] rounded-xl"></div></div>
    <div v-else-if="loadError" class="alert alert-error">游戏日历加载失败：{{ loadError }}</div>
    <template v-else>
      <div class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body p-4 gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="join"><button class="btn btn-sm join-item" aria-label="上个月" @click="setMonth(-1)"><ChevronLeft class="w-4 h-4" /></button><button class="btn btn-sm join-item min-w-32" @click="goToday">{{ monthLabel }}</button><button class="btn btn-sm join-item" aria-label="下个月" :disabled="!canGoNextMonth" @click="setMonth(1)"><ChevronRight class="w-4 h-4" /></button></div>
            <div class="flex gap-4 text-sm"><span><strong class="text-primary">{{ visibleMonthEntries.length }}</strong> 条日程</span><span><strong>{{ activeDays }}</strong> 个活跃日期</span><button class="link link-primary" @click="goToday">回到今天</button></div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-for="category in categoryOrder" :key="category" class="btn btn-xs gap-1.5" :class="categoryEnabled[category] ? 'btn-neutral' : 'btn-ghost opacity-45'" @click="toggleCategory(category)"><span class="w-2 h-2 rounded-full" :class="categoryMeta[category].dot"></span>{{ categoryMeta[category].label }} <span class="opacity-60">{{ monthCategoryCounts[category] }}</span></button>
          </div>
          <p v-if="!settingsStore.showSpoilers" class="text-xs text-base-content/45">剧透已关闭，仅显示当前时刻及以前的日程；可在设置中开启未来内容。</p>
        </div>
      </div>

      <div class="grid xl:grid-cols-[minmax(0,1fr)_20rem] gap-5 items-start">
        <div class="hidden md:block card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div class="grid grid-cols-7 border-b border-base-200 bg-base-200/55"><div v-for="weekday in weekdayLabels" :key="weekday" class="py-2 text-center text-xs font-bold text-base-content/55">周{{ weekday }}</div></div>
          <div class="grid grid-cols-7">
            <button v-for="day in calendarDays" :key="day.key" class="min-h-32 border-r border-b border-base-200 p-2 text-left align-top overflow-hidden transition-colors" :class="[day.currentMonth ? 'bg-base-100 hover:bg-base-200/45' : 'bg-base-200/35 text-base-content/30', selectedDateKey === day.key ? 'ring-2 ring-inset ring-primary' : '']" @click="selectDay(day)">
              <span class="inline-grid place-items-center w-6 h-6 rounded-full text-xs font-bold" :class="day.today ? 'bg-primary text-primary-content' : ''">{{ day.day }}</span>
              <div class="mt-1 space-y-1">
                <div v-for="entry in day.entries.slice(0, 3)" :key="entry.key" class="flex items-center gap-1 min-w-0 text-[10px] leading-4"><span class="w-1.5 h-1.5 rounded-full shrink-0" :class="categoryMeta[entry.category].dot"></span><span class="truncate">{{ entry.title }}</span></div>
                <p v-if="day.entries.length > 3" class="text-[10px] text-primary font-bold">+{{ day.entries.length - 3 }} 条</p>
              </div>
            </button>
          </div>
        </div>

        <div class="md:hidden space-y-3">
          <template v-for="day in calendarDays.filter(row => row.currentMonth && row.entries.length)" :key="day.key">
            <button class="w-full card bg-base-100 border text-left" :class="selectedDateKey === day.key ? 'border-primary' : 'border-base-200'" @click="selectDay(day)"><div class="card-body p-3"><div class="flex justify-between"><strong>{{ day.date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }) }}</strong><span class="badge badge-sm">{{ day.entries.length }}</span></div><div class="flex flex-wrap gap-1"><span v-for="entry in day.entries.slice(0, 4)" :key="entry.key" class="badge badge-sm badge-outline" :class="categoryMeta[entry.category].badge">{{ entry.subtitle }}</span><span v-if="day.entries.length > 4" class="badge badge-sm">+{{ day.entries.length - 4 }}</span></div></div></button>
          </template>
          <div v-if="!calendarDays.some(row => row.currentMonth && row.entries.length)" class="card bg-base-100 border border-base-200"><div class="card-body items-center py-12 text-base-content/45">当前筛选在本月没有日程</div></div>
        </div>

        <aside class="card bg-base-100 border border-base-200 shadow-sm xl:sticky xl:top-20">
          <div class="card-body p-4 gap-3">
            <div><p class="text-xs text-base-content/45">日期详情</p><h2 class="font-bold">{{ selectedDateLabel }}</h2></div>
            <div v-if="selectedEntries.length" class="divide-y divide-base-200">
              <template v-for="entry in selectedEntries" :key="entry.key">
                <RouterLink v-if="entry.route" :to="entry.route" class="group flex gap-3 py-3">
                  <img v-if="entry.characterId" :src="characterIcon(entry.characterId)" :alt="entry.title" class="h-10 w-10 shrink-0 rounded-full bg-base-200" />
                  <div v-else class="grid h-10 w-10 shrink-0 place-items-center rounded-lg" :class="categoryMeta[entry.category].dot"><Music2 v-if="entry.category === 'music'" class="h-4 w-4 text-white" /><span v-else class="text-[10px] font-bold text-white">{{ timeLabel(entry) }}</span></div>
                  <div class="min-w-0"><div class="flex items-center gap-2"><span class="badge badge-xs" :class="categoryMeta[entry.category].badge">{{ entry.subtitle }}</span><span class="text-[10px] text-base-content/40">{{ timeLabel(entry) }}</span></div><p class="mt-1 line-clamp-2 text-sm font-medium group-hover:text-primary">{{ entry.title }}</p></div>
                </RouterLink>
                <button v-else class="group flex w-full gap-3 py-3 text-left" @click="openLoginBonus(entry.loginBonusId)">
                  <div class="grid h-10 w-10 shrink-0 place-items-center rounded-lg" :class="categoryMeta[entry.category].dot"><Gift class="h-4 w-4 text-white" /></div>
                  <div class="min-w-0"><div class="flex items-center gap-2"><span class="badge badge-xs" :class="categoryMeta[entry.category].badge">{{ entry.subtitle }}</span><span class="text-[10px] text-base-content/40">{{ timeLabel(entry) }}</span></div><p class="mt-1 line-clamp-2 text-sm font-medium group-hover:text-primary">{{ entry.title }}</p><p class="mt-0.5 text-[10px] text-base-content/40">点击查看每日奖励</p></div>
                </button>
              </template>
            </div>
            <div v-else class="py-10 text-center text-sm text-base-content/40">这一天没有符合筛选条件的日程</div>
          </div>
        </aside>
      </div>
    </template>

    <dialog class="modal" :class="{ 'modal-open': selectedLoginBonus }">
      <div v-if="selectedLoginBonus" class="modal-box max-w-4xl p-0">
        <div class="relative h-20 overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20">
          <div class="absolute inset-0 grid place-items-center"><Gift class="h-10 w-10 text-primary/20" /></div>
          <button class="btn btn-circle btn-sm absolute right-3 top-3 border-0 bg-base-100/85" aria-label="关闭" @click="closeLoginBonus"><X class="h-4 w-4" /></button>
        </div>
        <header class="relative -mt-5 space-y-2 border-b border-base-200 px-5 pb-4">
          <div class="flex flex-wrap items-center gap-2"><span class="badge badge-accent">登录活动</span><span class="badge badge-ghost">#{{ selectedLoginBonus.id }}</span><span class="badge badge-ghost">{{ selectedLoginBonus.limitedLoginBonusDetails?.length || 0 }} 天</span></div>
          <h2 class="text-lg font-bold md:text-xl">{{ selectedLoginBonus.name }}</h2>
          <p class="text-xs text-base-content/55">{{ formatDate(selectedLoginBonus.startAt) }} — {{ formatDate(selectedLoginBonus.endAt) }}</p>
        </header>
        <div class="max-h-[58vh] overflow-y-auto bg-base-200/40 p-4">
          <div v-if="rewardLoading" class="flex justify-center py-16"><span class="loading loading-spinner loading-lg text-primary"></span></div>
          <div v-else-if="rewardError" class="alert alert-error"><span>{{ rewardError }}</span><button class="btn btn-sm" @click="ensureRewardData">重试</button></div>
          <div v-else-if="selectedRewardDays.length" class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="day in selectedRewardDays" :key="`${selectedLoginBonus.id}-${day.day}`" class="rounded-xl border border-base-200 bg-base-100 p-3">
              <div class="mb-2 flex items-center justify-between"><span class="font-bold text-primary">Day {{ day.day }}</span><span class="text-[10px] text-base-content/35">Box #{{ day.boxId }}</span></div>
              <div v-if="day.rewards.length" class="space-y-2">
                <div v-for="reward in day.rewards" :key="`${reward.seq}-${reward.resourceType}-${reward.resourceId || 0}`" class="flex items-center gap-2">
                  <AssetImage v-if="resourceIcon(reward)" :src="resourceIcon(reward)" :alt="resourceName(reward)" class="h-9 w-9 shrink-0 object-contain" />
                  <div v-else class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10"><Gift class="h-4 w-4 text-primary" /></div>
                  <div class="min-w-0 flex-1"><p class="truncate text-xs" :title="resourceName(reward)">{{ resourceName(reward) }}</p><p class="font-bold">× {{ formatNumber(reward.resourceQuantity) }}</p></div>
                </div>
              </div>
              <p v-else class="text-xs text-base-content/40">奖励箱数据缺失</p>
            </div>
          </div>
          <div v-else class="py-12 text-center text-sm text-base-content/40">该登录活动没有每日奖励记录</div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="closeLoginBonus">关闭</button></form>
    </dialog>
  </div>
</template>
