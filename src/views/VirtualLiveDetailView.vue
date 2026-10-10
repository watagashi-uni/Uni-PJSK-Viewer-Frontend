<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBackToList } from '@/composables/useBackToList'
import { Calendar, ChevronLeft, Clock, Disc3, FileText, Gift, Radio, Ticket, Users } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import PageHeader from '@/components/PageHeader.vue'
import SekaiHonor from '@/components/SekaiHonor.vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'

interface VirtualLiveSchedule {
  id: number
  seq: number
  startAt: number
  endAt: number
  isAfterEvent?: boolean
}

interface BeginnerSchedule {
  id: number
  dayOfWeek: string
  startTime: string
  endTime: string
}

interface VirtualLiveCharacter {
  id: number
  seq: number
  gameCharacterUnitId?: number
  subGameCharacter2dId?: number
  virtualLivePerformanceType: string
}

interface VirtualLiveSetlist {
  id: number
  seq: number
  virtualLiveSetlistType: string
  virtualLiveStageId: number
  musicId?: number
  musicVocalId?: number
  character3dId1?: number
  character3dId2?: number
  character3dId3?: number
  character3dId4?: number
  character3dId5?: number
  character3dId6?: number
}

interface VirtualLiveReward {
  id: number
  virtualLiveType: string
  resourceBoxId: number
}

interface VirtualLiveInfo {
  virtualLiveId?: number
  summary?: string
  description?: string
}

interface VirtualLive {
  id: number
  virtualLiveType: string
  virtualLivePlatform: string
  name: string
  assetbundleName: string
  startAt: number
  endAt: number
  virtualLiveSetlists?: VirtualLiveSetlist[]
  virtualLiveBeginnerSchedules?: BeginnerSchedule[]
  virtualLiveSchedules?: VirtualLiveSchedule[]
  virtualLiveCharacters?: VirtualLiveCharacter[]
  virtualLiveRewards?: VirtualLiveReward[]
  virtualLiveInformation?: VirtualLiveInfo
}

interface GameCharacterUnit {
  id: number
  gameCharacterId: number
  unit: string
}

interface GameCharacter {
  id: number
  firstName?: string
  givenName: string
}

interface Character3d {
  id: number
  characterType: string
  characterId: number
}

interface Character2d {
  id: number
  characterType: string
  characterId: number
}

interface SubGameCharacter {
  id: number
  name: string
}

interface Music {
  id: number
  title: string
  assetbundleName: string
}

interface MusicVocal {
  id: number
  caption?: string
}

interface ResourceDetail {
  seq: number
  resourceType: string
  resourceId?: number
  resourceLevel?: number
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
  assetbundleName?: string
}

interface VirtualLiveTicket {
  id: number
  virtualLiveId: number
  virtualLiveScheduleId?: number
  virtualLiveTicketType: string
  name: string
  flavorText?: string
}

interface VirtualLivePamphlet {
  id: number
  virtualLiveId: number
  name: string
  flavorText?: string
}

interface ScheduleGroup {
  key: string
  label: string
  schedules: VirtualLiveSchedule[]
}

interface BeginnerScheduleGroup {
  key: string
  label: string
  schedules: BeginnerSchedule[]
}

const route = useRoute()
// 上一页是列表时后退以保留筛选与页码，否则打开列表
const goBack = useBackToList('/vlives')
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const vlive = ref<VirtualLive | null>(null)
const gameCharacterUnits = ref<GameCharacterUnit[]>([])
const gameCharacters = ref<GameCharacter[]>([])
const character3ds = ref<Character3d[]>([])
const character2ds = ref<Character2d[]>([])
const subGameCharacters = ref<SubGameCharacter[]>([])
const musics = ref<Music[]>([])
const musicVocals = ref<MusicVocal[]>([])
const resourceBoxes = ref<ResourceBox[]>([])
const honors = ref<NamedResource[]>([])
const stamps = ref<NamedResource[]>([])
const materials = ref<NamedResource[]>([])
const boostItems = ref<NamedResource[]>([])
const transitionItems = ref<NamedResource[]>([])
const tickets = ref<VirtualLiveTicket[]>([])
const pamphlets = ref<VirtualLivePamphlet[]>([])
const isLoading = ref(true)
const loadError = ref('')

const assetsHost = computed(() => settingsStore.assetsHost)
const gameCharacterUnitMap = computed(() => new Map(gameCharacterUnits.value.map(row => [row.id, row])))
const gameCharacterMap = computed(() => new Map(gameCharacters.value.map(row => [row.id, row])))
const character3dMap = computed(() => new Map(character3ds.value.map(row => [row.id, row])))
const character2dMap = computed(() => new Map(character2ds.value.map(row => [row.id, row])))
const subGameCharacterMap = computed(() => new Map(subGameCharacters.value.map(row => [row.id, row])))
const musicMap = computed(() => new Map(musics.value.map(row => [row.id, row])))
const musicVocalMap = computed(() => new Map(musicVocals.value.map(row => [row.id, row])))
const honorMap = computed(() => new Map(honors.value.map(row => [row.id, row])))
const stampMap = computed(() => new Map(stamps.value.map(row => [row.id, row])))
const materialMap = computed(() => new Map(materials.value.map(row => [row.id, row])))
const boostItemMap = computed(() => new Map(boostItems.value.map(row => [row.id, row])))
const transitionItemMap = computed(() => new Map(transitionItems.value.map(row => [row.id, row])))

const typeMap: Record<string, { label: string; color: string }> = {
  normal: { label: '普通 Live', color: 'badge-primary' },
  cheerful_carnival: { label: 'Cheerful Carnival', color: 'badge-secondary' },
  streaming: { label: 'Connect Live', color: 'badge-accent' },
  virtual_message: { label: 'Virtual Message', color: 'badge-info' },
  beginner: { label: 'Welcome Live', color: 'badge-success' },
}

const rewardTypeLabels: Record<string, string> = {
  normal: '参加奖励',
  paid: '付费观看奖励',
  archive: '回顾奖励',
  cheerful_carnival: 'Cheerful Carnival 奖励',
  streaming: 'Connect Live 奖励',
  virtual_message: 'Virtual Message 奖励',
  beginner: 'Welcome Live 奖励',
}

const weekdayMeta: Record<string, { label: string; order: number }> = {
  monday: { label: '周一', order: 1 },
  tuesday: { label: '周二', order: 2 },
  wednesday: { label: '周三', order: 3 },
  thursday: { label: '周四', order: 4 },
  friday: { label: '周五', order: 5 },
  saturday: { label: '周六', order: 6 },
  sunday: { label: '周日', order: 7 },
}

async function loadData() {
  isLoading.value = true
  loadError.value = ''
  const id = Number(route.params.id)
  try {
    const [
      vlivesData, unitsData, charactersData, character3dData, character2dData, subCharacterData, musicData, vocalData,
      boxesData, honorData, stampData, materialData, boostData, transitionData,
      ticketData, pamphletData,
    ] = await Promise.all([
      masterStore.getMaster<VirtualLive>('virtualLives'),
      masterStore.getMaster<GameCharacterUnit>('gameCharacterUnits'),
      masterStore.getMaster<GameCharacter>('gameCharacters'),
      masterStore.getMaster<Character3d>('character3ds'),
      masterStore.getMaster<Character2d>('character2ds'),
      masterStore.getMaster<SubGameCharacter>('subGameCharacters'),
      masterStore.getMaster<Music>('musics'),
      masterStore.getMaster<MusicVocal>('musicVocals'),
      masterStore.getMaster<ResourceBox>('resourceBoxes'),
      masterStore.getMaster<NamedResource>('honors'),
      masterStore.getMaster<NamedResource>('stamps'),
      masterStore.getMaster<NamedResource>('materials'),
      masterStore.getMaster<NamedResource>('boostItems'),
      masterStore.getMaster<NamedResource>('virtualLiveTransitionItems'),
      masterStore.getMaster<VirtualLiveTicket>('virtualLiveTickets'),
      masterStore.getMaster<VirtualLivePamphlet>('virtualLivePamphlets'),
    ])
    vlive.value = vlivesData.find(row => row.id === id) || null
    gameCharacterUnits.value = unitsData
    gameCharacters.value = charactersData
    character3ds.value = character3dData
    character2ds.value = character2dData
    subGameCharacters.value = subCharacterData
    musics.value = musicData
    musicVocals.value = vocalData
    resourceBoxes.value = boxesData
    honors.value = honorData
    stamps.value = stampData
    materials.value = materialData
    boostItems.value = boostData
    transitionItems.value = transitionData
    tickets.value = ticketData
    pamphlets.value = pamphletData
  } catch (error) {
    console.error('加载 Virtual Live 数据失败：', error)
    loadError.value = '游戏资料加载失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
watch(() => route.params.id, loadData)

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function dateKey(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
}

function timeLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString('zh-CN')
}

function getBannerUrl(assetbundleName: string): string {
  return `${assetsHost.value}/ondemand/virtual_live/select/banner/${assetbundleName}/${assetbundleName}.png`
}

function getScheduleBounds(row: VirtualLive) {
  const values = row.virtualLiveSchedules || []
  if (!values.length) return { start: row.startAt, end: row.endAt }
  return {
    start: Math.min(...values.map(item => item.startAt)),
    end: Math.max(...values.map(item => item.endAt)),
  }
}

function characterName(characterId: number): string {
  const character = gameCharacterMap.value.get(characterId)
  return character ? `${character.firstName || ''}${character.givenName}` : `角色 #${characterId}`
}

function characterIcon(unit: GameCharacterUnit): string {
  if (unit.gameCharacterId <= 20) return `/img/chr_ts/chr_ts_90_${unit.gameCharacterId}.png`
  if (unit.gameCharacterId === 21) return unit.id === 21 ? '/img/chr_ts/chr_ts_90_21.png' : `/img/chr_ts/chr_ts_90_21_${unit.id - 25}.png`
  return `/img/chr_ts/chr_ts_90_${unit.gameCharacterId}_2.png`
}

const cast = computed(() => [...(vlive.value?.virtualLiveCharacters || [])]
  .sort((a, b) => a.seq - b.seq)
  .map(row => {
    const unit = row.gameCharacterUnitId ? gameCharacterUnitMap.value.get(row.gameCharacterUnitId) : null
    if (unit) {
      return {
        ...row,
        name: characterName(unit.gameCharacterId),
        icon: characterIcon(unit),
      }
    }
    const character2d = row.subGameCharacter2dId ? character2dMap.value.get(row.subGameCharacter2dId) : null
    const subCharacter = character2d?.characterType === 'sub_game_character' ? subGameCharacterMap.value.get(character2d.characterId) : null
    return { ...row, name: subCharacter?.name || `特别出演 #${row.subGameCharacter2dId || row.id}`, icon: '' }
  })
)

const setlists = computed(() => [...(vlive.value?.virtualLiveSetlists || [])].sort((a, b) => a.seq - b.seq))
const musicSetlists = computed(() => setlists.value.filter(row => row.virtualLiveSetlistType === 'music' && row.musicId))
const setlistTypeCounts = computed(() => {
  const result = new Map<string, number>()
  for (const row of setlists.value) result.set(row.virtualLiveSetlistType, (result.get(row.virtualLiveSetlistType) || 0) + 1)
  return result
})

function setlistPerformers(row: VirtualLiveSetlist): string[] {
  const ids = [row.character3dId1, row.character3dId2, row.character3dId3, row.character3dId4, row.character3dId5, row.character3dId6]
  const names = ids.flatMap(id => {
    if (!id) return []
    const character3d = character3dMap.value.get(id)
    if (!character3d) return [`3D角色 #${id}`]
    if (character3d.characterType === 'game_character') return [characterName(character3d.characterId)]
    if (character3d.characterType === 'sub_game_character') return [subGameCharacterMap.value.get(character3d.characterId)?.name || `特别出演 #${character3d.characterId}`]
    return [`3D角色 #${id}`]
  })
  return [...new Set(names)]
}

const scheduleGroups = computed<ScheduleGroup[]>(() => {
  const groups = new Map<string, VirtualLiveSchedule[]>()
  for (const row of [...(vlive.value?.virtualLiveSchedules || [])].sort((a, b) => a.startAt - b.startAt || a.seq - b.seq)) {
    const key = dateKey(row.startAt)
    groups.set(key, [...(groups.get(key) || []), row])
  }
  return [...groups.entries()].map(([key, rows]) => ({ key, label: dateLabel(rows[0]!.startAt), schedules: rows }))
})

const beginnerScheduleGroups = computed<BeginnerScheduleGroup[]>(() => {
  const groups = new Map<string, BeginnerSchedule[]>()
  for (const row of vlive.value?.virtualLiveBeginnerSchedules || []) {
    groups.set(row.dayOfWeek, [...(groups.get(row.dayOfWeek) || []), row])
  }
  return [...groups.entries()]
    .sort((a, b) => (weekdayMeta[a[0]]?.order || 99) - (weekdayMeta[b[0]]?.order || 99))
    .map(([key, rows]) => ({
      key,
      label: weekdayMeta[key]?.label || key,
      schedules: rows.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
})

const rewardBoxMap = computed(() => new Map(resourceBoxes.value
  .filter(row => row.resourceBoxPurpose === 'virtual_live_reward')
  .map(row => [row.id, row])))
const rewardGroups = computed(() => (vlive.value?.virtualLiveRewards || []).map(row => ({
  ...row,
  details: [...(rewardBoxMap.value.get(row.resourceBoxId)?.details || [])].sort((a, b) => a.seq - b.seq),
})))

function resourceName(resource: ResourceDetail): string {
  const id = Number(resource.resourceId || 0)
  if (resource.resourceType === 'jewel') return '水晶'
  if (resource.resourceType === 'coin') return '金币'
  if (resource.resourceType === 'virtual_coin') return '虚拟币'
  if (resource.resourceType === 'honor') return honorMap.value.get(id)?.name || `称号 #${id}`
  if (resource.resourceType === 'stamp') return stampMap.value.get(id)?.name?.replace(/^\[スタンプ\]/, '') || `表情贴图 #${id}`
  if (resource.resourceType === 'material') return materialMap.value.get(id)?.name || `素材 #${id}`
  if (resource.resourceType === 'boost_item') return boostItemMap.value.get(id)?.name || `体力道具 #${id}`
  if (resource.resourceType === 'virtual_live_transition_item') return transitionItemMap.value.get(id)?.name || `Live 回顾道具 #${id}`
  return `${resource.resourceType}${id ? ` #${id}` : ''}`
}

function resourceIcon(resource: ResourceDetail): string {
  const id = Number(resource.resourceId || 0)
  if (['jewel', 'coin', 'virtual_coin'].includes(resource.resourceType)) return `${assetsHost.value}/startapp/thumbnail/common_material/${resource.resourceType}.png`
  if (resource.resourceType === 'material') return `${assetsHost.value}/startapp/thumbnail/material/material${id}.png`
  if (resource.resourceType === 'boost_item') return `${assetsHost.value}/startapp/thumbnail/boost_item/boost_item${id}.png`
  if (resource.resourceType === 'stamp') {
    const bundle = stampMap.value.get(id)?.assetbundleName
    return bundle ? `${assetsHost.value}/startapp/stamp/${bundle}/${bundle}.png` : ''
  }
  if (resource.resourceType === 'virtual_live_transition_item') {
    const bundle = transitionItemMap.value.get(id)?.assetbundleName
    return bundle ? `${assetsHost.value}/startapp/thumbnail/virtual_live_transition_item/${bundle}.png` : ''
  }
  return ''
}

const relatedTickets = computed(() => tickets.value.filter(row => row.virtualLiveId === vlive.value?.id))
const relatedPamphlets = computed(() => pamphlets.value.filter(row => row.virtualLiveId === vlive.value?.id))
const scheduleMap = computed(() => new Map((vlive.value?.virtualLiveSchedules || []).map(row => [row.id, row])))

function ticketScheduleLabel(ticket: VirtualLiveTicket): string {
  const schedule = ticket.virtualLiveScheduleId ? scheduleMap.value.get(ticket.virtualLiveScheduleId) : null
  if (!schedule) return ticket.virtualLiveTicketType === 'paid' ? '付费入场' : ticket.virtualLiveTicketType
  return `${dateLabel(schedule.startAt)} ${timeLabel(schedule.startAt)}`
}

const informationText = computed(() => {
  const description = vlive.value?.virtualLiveInformation?.description || ''
  return description
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&times;/g, '×')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
})
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5">
    <div v-if="isLoading" class="space-y-4"><div class="skeleton h-20 rounded-xl"></div><div class="skeleton h-64 rounded-xl"></div><div class="grid gap-3 lg:grid-cols-3"><div class="skeleton h-48 lg:col-span-2"></div><div class="skeleton h-48"></div></div></div>
    <div v-else-if="loadError" class="alert alert-error">Virtual Live 加载失败：{{ loadError }}</div>
    <div v-else-if="!vlive" class="rounded-xl border border-base-200 bg-base-100 py-20 text-center"><p class="text-xl text-base-content/60">Virtual Live 不存在</p><RouterLink to="/vlives" class="btn btn-primary mt-4">返回列表</RouterLink></div>

    <template v-else>
      <PageHeader :title="vlive.name" :description="`#${vlive.id} · ${typeMap[vlive.virtualLiveType]?.label || vlive.virtualLiveType} · ${vlive.virtualLivePlatform.toUpperCase()}`">
        <template #icon><Radio class="h-8 w-8 text-primary" /></template>
        <template #actions><button type="button" class="btn btn-sm btn-ghost" @click="goBack"><ChevronLeft class="h-4 w-4" />返回列表</button></template>
      </PageHeader>

      <section class="grid overflow-hidden rounded-xl border border-base-200 bg-base-100 shadow-sm lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.75fr)]">
        <figure class="flex aspect-[122/52] items-center justify-center bg-base-200/70 lg:aspect-auto">
          <AssetImage :src="getBannerUrl(vlive.assetbundleName)" :alt="vlive.name" class="h-full max-h-72 w-full object-contain" />
        </figure>
        <div class="flex flex-col justify-center gap-3 border-base-200 p-4 lg:border-l lg:p-5">
          <div class="flex flex-wrap gap-1.5"><span class="badge" :class="typeMap[vlive.virtualLiveType]?.color || 'badge-ghost'">{{ typeMap[vlive.virtualLiveType]?.label || vlive.virtualLiveType }}</span><span class="badge badge-ghost">{{ vlive.virtualLivePlatform.toUpperCase() }}</span></div>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2"><Calendar class="h-4 w-4 shrink-0 text-primary" /><span class="text-base-content/45">开始</span><strong class="ml-auto text-right">{{ formatDate(getScheduleBounds(vlive).start) }}</strong></div>
            <div class="flex items-center gap-2"><Clock class="h-4 w-4 shrink-0 text-primary" /><span class="text-base-content/45">结束</span><strong class="ml-auto text-right">{{ formatDate(getScheduleBounds(vlive).end) }}</strong></div>
          </div>
          <div class="grid grid-cols-3 divide-x divide-base-200 rounded-lg bg-base-200/55 py-2 text-center"><div><strong class="block text-lg">{{ cast.length }}</strong><span class="text-[10px] text-base-content/45">出演</span></div><div><strong class="block text-lg">{{ musicSetlists.length }}</strong><span class="text-[10px] text-base-content/45">歌曲</span></div><div><strong class="block text-lg">{{ vlive.virtualLiveSchedules?.length || 0 }}</strong><span class="text-[10px] text-base-content/45">场次</span></div></div>
        </div>
      </section>

      <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,.75fr)]">
        <main class="space-y-4">
          <section v-if="setlists.length" class="rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm md:p-5">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 class="flex items-center gap-2 text-lg font-bold"><Disc3 class="h-5 w-5 text-primary" />节目单</h2><div class="flex flex-wrap gap-1"><span class="badge badge-ghost">流程 {{ setlists.length }}</span><span class="badge badge-primary">歌曲 {{ musicSetlists.length }}</span><span v-if="setlistTypeCounts.get('mc')" class="badge badge-ghost">MC {{ setlistTypeCounts.get('mc') }}</span><span v-if="setlistTypeCounts.get('mc_timeline')" class="badge badge-ghost">Timeline MC {{ setlistTypeCounts.get('mc_timeline') }}</span><span v-if="setlistTypeCounts.get('virtual_message')" class="badge badge-ghost">Message {{ setlistTypeCounts.get('virtual_message') }}</span></div></div>
            <div v-if="musicSetlists.length" class="grid gap-2 sm:grid-cols-2">
              <RouterLink v-for="row in musicSetlists" :key="row.id" :to="`/musics/${row.musicId}`" class="group flex min-w-0 gap-3 rounded-xl border border-base-200 p-2.5 transition hover:border-primary/40 hover:bg-base-200/35">
                <AssetImage v-if="musicMap.get(row.musicId || 0)" :src="`${assetsHost}/startapp/music/jacket/${musicMap.get(row.musicId || 0)?.assetbundleName}/${musicMap.get(row.musicId || 0)?.assetbundleName}.png`" :alt="musicMap.get(row.musicId || 0)?.title || ''" class="h-16 w-16 shrink-0 rounded-lg object-cover" />
                <div class="min-w-0 flex-1"><div class="flex items-center gap-1.5 text-[10px] text-base-content/40"><span>#{{ row.seq }}</span><span>Stage {{ row.virtualLiveStageId }}</span></div><h3 class="mt-0.5 truncate font-bold group-hover:text-primary">{{ musicMap.get(row.musicId || 0)?.title || `歌曲 #${row.musicId}` }}</h3><p v-if="row.musicVocalId" class="truncate text-xs text-base-content/55">{{ musicVocalMap.get(row.musicVocalId)?.caption || `Vocal #${row.musicVocalId}` }}</p><p v-if="setlistPerformers(row).length" class="mt-1 line-clamp-2 text-[10px] text-base-content/45">出演：{{ setlistPerformers(row).join('、') }}</p></div>
              </RouterLink>
            </div>
            <p v-else class="rounded-lg bg-base-200/50 py-6 text-center text-sm text-base-content/45">该节目流程没有歌曲段落</p>
          </section>

          <section v-if="scheduleGroups.length || beginnerScheduleGroups.length" class="rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm md:p-5">
            <div class="mb-4 flex items-center justify-between"><h2 class="flex items-center gap-2 text-lg font-bold"><Clock class="h-5 w-5 text-primary" />场次安排</h2><span class="badge badge-ghost">{{ (vlive.virtualLiveSchedules?.length || 0) + (vlive.virtualLiveBeginnerSchedules?.length || 0) }} 场</span></div>
            <div v-if="scheduleGroups.length" class="grid gap-2 sm:grid-cols-2">
              <div v-for="group in scheduleGroups" :key="group.key" class="rounded-xl bg-base-200/45 p-3"><p class="mb-2 text-sm font-bold">{{ group.label }}</p><div class="flex flex-wrap gap-1.5"><span v-for="schedule in group.schedules" :key="schedule.id" class="badge h-auto gap-1 py-1" :class="schedule.isAfterEvent ? 'badge-secondary' : 'badge-ghost'"><span v-if="schedule.isAfterEvent">After Event</span><span>{{ timeLabel(schedule.startAt) }}–{{ timeLabel(schedule.endAt) }}</span></span></div></div>
            </div>
            <details v-if="beginnerScheduleGroups.length" class="collapse collapse-arrow mt-3 border border-base-200 bg-base-200/35"><summary class="collapse-title min-h-0 py-3 font-bold">每周循环场次</summary><div class="collapse-content space-y-3"><div v-for="group in beginnerScheduleGroups" :key="group.key" class="grid gap-2 sm:grid-cols-[5rem_1fr]"><strong class="text-sm">{{ group.label }}</strong><div class="flex flex-wrap gap-1"><span v-for="schedule in group.schedules" :key="schedule.id" class="badge badge-ghost">{{ schedule.startTime.slice(0, 5) }}–{{ schedule.endTime.slice(0, 5) }}</span></div></div></div></details>
          </section>

          <details v-if="informationText" class="collapse collapse-arrow border border-base-200 bg-base-100 shadow-sm">
            <summary class="collapse-title flex min-h-0 items-center gap-2 py-4 text-lg font-bold"><FileText class="h-5 w-5 text-primary" />官方说明</summary>
            <div class="collapse-content"><p class="max-h-[34rem] overflow-y-auto whitespace-pre-wrap rounded-xl bg-base-200/45 p-4 text-sm leading-7">{{ informationText }}</p></div>
          </details>
        </main>

        <aside class="space-y-4">
          <section v-if="cast.length" class="rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm">
            <div class="mb-3 flex items-center justify-between"><h2 class="flex items-center gap-2 font-bold"><Users class="h-5 w-5 text-primary" />出演角色</h2><span class="badge badge-sm badge-ghost">{{ cast.length }} 人</span></div>
            <div class="grid grid-cols-4 gap-x-2 gap-y-3">
              <div v-for="row in cast" :key="row.id" class="min-w-0 text-center">
                <img v-if="row.icon" :src="row.icon" :alt="row.name" class="mx-auto h-11 w-11 rounded-full bg-base-200 object-cover ring-2 ring-primary/15" />
                <div v-else class="mx-auto grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-primary/15">{{ row.name.slice(0, 1) }}</div>
                <p class="mt-1 truncate text-[10px]" :title="row.name">{{ row.name }}</p><p v-if="row.virtualLivePerformanceType === 'both'" class="text-[8px] text-primary">主场＋待机</p>
              </div>
            </div>
          </section>

          <section v-if="rewardGroups.length" class="rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm">
            <div class="mb-3 flex items-center justify-between"><h2 class="flex items-center gap-2 font-bold"><Gift class="h-5 w-5 text-primary" />参加奖励</h2><span class="badge badge-sm badge-ghost">{{ rewardGroups.length }} 组</span></div>
            <div class="space-y-3">
              <div v-for="group in rewardGroups" :key="group.id" class="rounded-xl bg-base-200/45 p-3"><div class="mb-2 flex items-center justify-between"><strong class="text-sm">{{ rewardTypeLabels[group.virtualLiveType] || group.virtualLiveType }}</strong><span class="text-[9px] text-base-content/35">Box #{{ group.resourceBoxId }}</span></div><div v-if="group.details.length" class="space-y-2"><div v-for="reward in group.details" :key="`${reward.seq}-${reward.resourceType}-${reward.resourceId || 0}`" class="flex items-center gap-2"><SekaiHonor v-if="reward.resourceType === 'honor' && reward.resourceId" :honor-id="reward.resourceId" :honor-level="reward.resourceLevel || 1" sub class="w-24 shrink-0" /><AssetImage v-else-if="resourceIcon(reward)" :src="resourceIcon(reward)" :alt="resourceName(reward)" class="h-9 w-9 shrink-0 object-contain" /><div v-else class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10"><Gift class="h-4 w-4 text-primary" /></div><div class="min-w-0 flex-1"><p class="truncate text-xs" :title="resourceName(reward)">{{ resourceName(reward) }}</p><p class="text-sm font-bold">× {{ formatNumber(reward.resourceQuantity) }}</p></div></div></div><p v-else class="text-xs text-base-content/40">奖励箱数据缺失</p></div>
            </div>
          </section>

          <section v-if="relatedTickets.length" class="rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm">
            <h2 class="mb-3 flex items-center gap-2 font-bold"><Ticket class="h-5 w-5 text-primary" />入场票券</h2><div class="space-y-2"><div v-for="item in relatedTickets" :key="item.id" class="rounded-xl bg-base-200/45 p-3"><div class="flex items-start justify-between gap-2"><strong class="text-sm">{{ item.name }}</strong><span class="badge badge-sm">{{ item.virtualLiveTicketType }}</span></div><p class="mt-1 text-xs text-base-content/55">{{ item.flavorText }}</p><p class="mt-2 text-[10px] text-primary">{{ ticketScheduleLabel(item) }}</p></div></div>
          </section>

          <section v-if="relatedPamphlets.length" class="rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm">
            <h2 class="mb-3 flex items-center gap-2 font-bold"><FileText class="h-5 w-5 text-primary" />场刊</h2><div class="space-y-2"><div v-for="item in relatedPamphlets" :key="item.id" class="rounded-xl bg-base-200/45 p-3"><strong class="text-sm">{{ item.name }}</strong><p class="mt-1 text-xs text-base-content/55">{{ item.flavorText }}</p></div></div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
