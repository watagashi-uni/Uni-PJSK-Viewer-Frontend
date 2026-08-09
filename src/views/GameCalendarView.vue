<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarDays, ChevronLeft, ChevronRight, Music2 } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import { useMasterStore } from '@/stores/master'

type CalendarCategory = 'event' | 'gacha' | 'music' | 'virtual_live' | 'birthday'

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

interface CalendarEntry {
  key: string
  category: CalendarCategory
  timestamp: number
  title: string
  subtitle: string
  route: string
  characterId?: number
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
const categoryEnabled = ref<Record<CalendarCategory, boolean>>({
  event: true,
  gacha: true,
  music: true,
  virtual_live: true,
  birthday: true,
})

const categoryMeta: Record<CalendarCategory, { label: string; dot: string; badge: string }> = {
  event: { label: '活动', dot: 'bg-primary', badge: 'badge-primary' },
  gacha: { label: '卡池', dot: 'bg-secondary', badge: 'badge-secondary' },
  music: { label: '歌曲', dot: 'bg-info', badge: 'badge-info' },
  virtual_live: { label: 'Virtual Live', dot: 'bg-warning', badge: 'badge-warning' },
  birthday: { label: '生日', dot: 'bg-success', badge: 'badge-success' },
}
const categoryOrder: CalendarCategory[] = ['event', 'gacha', 'music', 'virtual_live', 'birthday']
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
const filteredEntries = computed(() => allEntries.value.filter(row => categoryEnabled.value[row.category]))
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
  for (const entry of allEntries.value) {
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

function setMonth(offset: number) {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + offset, 1)
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

onMounted(async () => {
  try {
    const [eventData, gachaData, musicData, liveData, characterData, profileData] = await Promise.all([
      masterStore.getMaster<EventInfo>('events'),
      masterStore.getMaster<GachaInfo>('gachas'),
      masterStore.getMaster<MusicInfo>('musics'),
      masterStore.getMaster<VirtualLiveInfo>('virtualLives'),
      masterStore.getMaster<CharacterInfo>('gameCharacters'),
      masterStore.getMaster<CharacterProfile>('characterProfiles'),
    ])
    events.value = eventData
    gachas.value = gachaData
    musics.value = musicData
    virtualLives.value = liveData
    characters.value = characterData.filter(row => row.id <= 26)
    characterProfiles.value = profileData
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
    <PageHeader title="游戏日历" description="在同一时间轴查看活动、卡池、歌曲发布、Virtual Live 场次与角色生日。">
      <template #icon><CalendarDays class="w-8 h-8 text-primary" /></template>
    </PageHeader>

    <div v-if="isLoading" class="space-y-4"><div class="skeleton h-24 rounded-xl"></div><div class="skeleton h-[34rem] rounded-xl"></div></div>
    <div v-else-if="loadError" class="alert alert-error">游戏日历加载失败：{{ loadError }}</div>
    <template v-else>
      <div class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body p-4 gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="join"><button class="btn btn-sm join-item" aria-label="上个月" @click="setMonth(-1)"><ChevronLeft class="w-4 h-4" /></button><button class="btn btn-sm join-item min-w-32" @click="goToday">{{ monthLabel }}</button><button class="btn btn-sm join-item" aria-label="下个月" @click="setMonth(1)"><ChevronRight class="w-4 h-4" /></button></div>
            <div class="flex gap-4 text-sm"><span><strong class="text-primary">{{ visibleMonthEntries.length }}</strong> 条日程</span><span><strong>{{ activeDays }}</strong> 个活跃日期</span><button class="link link-primary" @click="goToday">回到今天</button></div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-for="category in categoryOrder" :key="category" class="btn btn-xs gap-1.5" :class="categoryEnabled[category] ? 'btn-neutral' : 'btn-ghost opacity-45'" @click="toggleCategory(category)"><span class="w-2 h-2 rounded-full" :class="categoryMeta[category].dot"></span>{{ categoryMeta[category].label }} <span class="opacity-60">{{ monthCategoryCounts[category] }}</span></button>
          </div>
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
              <RouterLink v-for="entry in selectedEntries" :key="entry.key" :to="entry.route" class="flex gap-3 py-3 group">
                <img v-if="entry.characterId" :src="characterIcon(entry.characterId)" :alt="entry.title" class="w-10 h-10 rounded-full bg-base-200 shrink-0" />
                <div v-else class="w-10 h-10 rounded-lg grid place-items-center shrink-0" :class="categoryMeta[entry.category].dot"><Music2 v-if="entry.category === 'music'" class="w-4 h-4 text-white" /><span v-else class="text-white text-[10px] font-bold">{{ timeLabel(entry) }}</span></div>
                <div class="min-w-0"><div class="flex items-center gap-2"><span class="badge badge-xs" :class="categoryMeta[entry.category].badge">{{ entry.subtitle }}</span><span class="text-[10px] text-base-content/40">{{ timeLabel(entry) }}</span></div><p class="text-sm font-medium mt-1 group-hover:text-primary line-clamp-2">{{ entry.title }}</p></div>
              </RouterLink>
            </div>
            <div v-else class="py-10 text-center text-sm text-base-content/40">这一天没有符合筛选条件的日程</div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
