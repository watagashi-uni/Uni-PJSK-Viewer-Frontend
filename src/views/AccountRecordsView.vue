<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { CalendarDays, Flower2, History, LayoutGrid, Search, Swords } from 'lucide-vue-next'
import AccountSelector from '@/components/AccountSelector.vue'
import SekaiCard from '@/components/SekaiCard.vue'
import { useAccountStore } from '@/stores/account'
import { useMasterStore } from '@/stores/master'
import type { GameCharacterData } from '@/types/master'

type RecordsTab = 'events' | 'world_bloom' | 'rank' | 'decks'

interface EventInfo {
  id: number
  name: string
  startAt: number
  aggregateAt: number
}

interface UserEventRow {
  eventId?: number
  event_id?: number
  eventPoint?: number
  event_point?: number
  rank?: number
  rankingRewardReceivedAt?: number
}

interface WorldBloomInfo {
  eventId: number
  gameCharacterId: number
  chapterNo: number
  chapterStartAt: number
  aggregateAt: number
}

interface UserWorldBloomRow {
  eventId?: number
  event_id?: number
  gameCharacterId?: number
  game_character_id?: number
  worldBloomChapterPoint?: number
  world_bloom_chapter_point?: number
  rank?: number
}

interface RankMatchSeason {
  id: number
  name: string
  startAt: number
  aggregatedAt: number
}

interface RankMatchTier {
  id: number
  rankMatchGradeId: number
  rankMatchClassId: number
  tier: number
}

interface NamedMaster {
  id: number
  name: string
}

interface UserRankMatchSeason {
  rankMatchSeasonId: number
  rankMatchTierId: number
  playCount: number
  winCount: number
  loseCount: number
  drawCount: number
  rank?: number
  maxConsecutiveWinCount: number
  penaltyCount: number
  totalTierPoint: number
}

interface CardInfo {
  id: number
  characterId: number
  cardRarityType: string
  attr: string
  assetbundleName: string
}

interface UserCardInfo {
  cardId: number
  level: number
  skillLevel?: number
  masterRank: number
  defaultImage?: string
  specialTrainingStatus?: string
}

interface UserDeckInfo {
  deckId: number
  name: string
  leader: number
  subLeader: number
  member1: number
  member2: number
  member3: number
  member4: number
  member5: number
}

const masterStore = useMasterStore()
const accountStore = useAccountStore()

const events = ref<EventInfo[]>([])
const rankMatchSeasons = ref<RankMatchSeason[]>([])
const rankMatchTiers = ref<RankMatchTier[]>([])
const rankMatchGrades = ref<NamedMaster[]>([])
const rankMatchClasses = ref<NamedMaster[]>([])
const cards = ref<CardInfo[]>([])
const worldBlooms = ref<WorldBloomInfo[]>([])
const characters = ref<GameCharacterData[]>([])
const isLoading = ref(true)
const loadError = ref('')
const activeTab = ref<RecordsTab>('events')
const eventSearch = ref('')
const rankedOnly = ref(false)
const bloomSearch = ref('')
const bloomRankedOnly = ref(false)

const selectedUserId = computed({
  get: () => accountStore.currentUserId || '',
  set: value => { void accountStore.selectAccount(value) },
})
const suite = computed<any | null>(() => selectedUserId.value ? accountStore.getSuiteCache(selectedUserId.value) : null)
const eventMap = computed(() => new Map(events.value.map(event => [event.id, event])))
const seasonMap = computed(() => new Map(rankMatchSeasons.value.map(season => [season.id, season])))
const tierMap = computed(() => new Map(rankMatchTiers.value.map(tier => [tier.id, tier])))
const gradeMap = computed(() => new Map(rankMatchGrades.value.map(grade => [grade.id, grade])))
const classMap = computed(() => new Map(rankMatchClasses.value.map(item => [item.id, item])))
const cardMap = computed(() => new Map(cards.value.map(card => [card.id, card])))
const characterMap = computed(() => new Map(characters.value.map(character => [character.id, character])))
const worldBloomMap = computed(() => new Map(worldBlooms.value.map(row => [
  `${row.eventId}_${row.gameCharacterId}`,
  row,
])))

function suiteArray<T>(camelKey: string, snakeKey: string): T[] {
  const value = suite.value?.[camelKey] ?? suite.value?.[snakeKey]
  return Array.isArray(value) ? value : []
}

const userEvents = computed(() => suiteArray<UserEventRow>('userEvents', 'user_events'))
const userWorldBlooms = computed(() => suiteArray<UserWorldBloomRow>('userWorldBlooms', 'user_world_blooms'))
const userRankSeasons = computed(() => suiteArray<UserRankMatchSeason>('userRankMatchSeasons', 'user_rank_match_seasons'))
const userDecks = computed(() => suiteArray<UserDeckInfo>('userDecks', 'user_decks'))
const userCards = computed(() => suiteArray<UserCardInfo>('userCards', 'user_cards'))
const userCardMap = computed(() => new Map(userCards.value.map(card => [card.cardId, card])))

const eventRows = computed(() => userEvents.value.map(row => {
  const id = Number(row.eventId ?? row.event_id)
  return {
    id,
    master: eventMap.value.get(id),
    point: Number(row.eventPoint ?? row.event_point ?? 0),
    rank: Number(row.rank || 0),
  }
}).sort((a, b) => b.id - a.id))

const filteredEventRows = computed(() => {
  const query = eventSearch.value.trim().toLocaleLowerCase()
  return eventRows.value
    .filter(row => !rankedOnly.value || row.rank > 0)
    .filter(row => !query || [row.id, row.master?.name].some(value => String(value || '').toLocaleLowerCase().includes(query)))
})

const eventSummary = computed(() => {
  const ranked = eventRows.value.filter(row => row.rank > 0)
  const maxPoint = eventRows.value.reduce((best, row) => row.point > best.point ? row : best, { id: 0, point: 0 } as typeof eventRows.value[number])
  const bestRank = ranked.reduce((best, row) => !best || row.rank < best.rank ? row : best, null as typeof ranked[number] | null)
  return {
    count: eventRows.value.length,
    totalPoint: eventRows.value.reduce((sum, row) => sum + row.point, 0),
    maxPoint,
    bestRank,
  }
})

const worldBloomRows = computed(() => userWorldBlooms.value.map(row => {
  const eventId = Number(row.eventId ?? row.event_id)
  const characterId = Number(row.gameCharacterId ?? row.game_character_id)
  return {
    eventId,
    characterId,
    event: eventMap.value.get(eventId),
    character: characterMap.value.get(characterId),
    chapter: worldBloomMap.value.get(`${eventId}_${characterId}`),
    point: Number(row.worldBloomChapterPoint ?? row.world_bloom_chapter_point ?? 0),
    rank: Number(row.rank || 0),
  }
}).sort((a, b) => b.eventId - a.eventId || (b.chapter?.chapterNo || 0) - (a.chapter?.chapterNo || 0)))

const filteredWorldBloomRows = computed(() => {
  const query = bloomSearch.value.trim().toLocaleLowerCase()
  return worldBloomRows.value
    .filter(row => !bloomRankedOnly.value || row.rank > 0)
    .filter(row => !query || [
      row.eventId,
      row.event?.name,
      row.characterId,
      row.character ? getCharacterName(row.character) : '',
    ].some(value => String(value || '').toLocaleLowerCase().includes(query)))
})

const worldBloomSummary = computed(() => {
  const ranked = worldBloomRows.value.filter(row => row.rank > 0)
  const maxPoint = worldBloomRows.value.reduce((best, row) => row.point > best.point ? row : best, { point: 0 } as typeof worldBloomRows.value[number])
  const bestRank = ranked.reduce((best, row) => !best || row.rank < best.rank ? row : best, null as typeof ranked[number] | null)
  return {
    count: worldBloomRows.value.length,
    eventCount: new Set(worldBloomRows.value.map(row => row.eventId)).size,
    totalPoint: worldBloomRows.value.reduce((sum, row) => sum + row.point, 0),
    maxPoint,
    bestRank,
  }
})

const rankRows = computed(() => userRankSeasons.value.map(row => {
  const tier = tierMap.value.get(row.rankMatchTierId)
  return {
    ...row,
    season: seasonMap.value.get(row.rankMatchSeasonId),
    tier,
    grade: tier ? gradeMap.value.get(tier.rankMatchGradeId) : undefined,
    rankClass: tier ? classMap.value.get(tier.rankMatchClassId) : undefined,
    decisionCount: Number(row.winCount || 0) + Number(row.loseCount || 0) + Number(row.drawCount || 0),
  }
}).sort((a, b) => b.rankMatchSeasonId - a.rankMatchSeasonId))

const rankSummary = computed(() => {
  const play = rankRows.value.reduce((sum, row) => sum + Number(row.playCount || 0), 0)
  const wins = rankRows.value.reduce((sum, row) => sum + Number(row.winCount || 0), 0)
  const decisions = rankRows.value.reduce((sum, row) => sum + row.decisionCount, 0)
  const bestRank = rankRows.value.filter(row => Number(row.rank || 0) > 0)
    .reduce((best, row) => !best || Number(row.rank) < Number(best.rank) ? row : best, null as typeof rankRows.value[number] | null)
  return { play, wins, winRate: decisions ? wins / decisions * 100 : 0, bestRank }
})

function deckCards(deck: UserDeckInfo) {
  return [deck.member1, deck.member2, deck.member3, deck.member4, deck.member5]
    .map(cardId => ({ cardId, master: cardMap.value.get(cardId), user: userCardMap.value.get(cardId) }))
    .filter(row => row.master)
}

function tierLabel(row: typeof rankRows.value[number]): string {
  if (!row.tier) return `段位 #${row.rankMatchTierId}`
  return `${row.grade?.name || ''} ${row.rankClass?.name || ''}`.trim()
}

function getCharacterName(character: GameCharacterData): string {
  return `${character.firstName || ''}${character.givenName}`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatDate(value?: number): string {
  return value ? new Date(value).toLocaleDateString('zh-CN') : '未知日期'
}

onMounted(async () => {
  try {
    const [eventData, seasonData, tierData, gradeData, classData, cardData, bloomData, characterData] = await Promise.all([
      masterStore.getMaster<EventInfo>('events'),
      masterStore.getMaster<RankMatchSeason>('rankMatchSeasons'),
      masterStore.getMaster<RankMatchTier>('rankMatchTiers'),
      masterStore.getMaster<NamedMaster>('rankMatchGrades'),
      masterStore.getMaster<NamedMaster>('rankMatchClasses'),
      masterStore.getMaster<CardInfo>('cards'),
      masterStore.getMaster<WorldBloomInfo>('worldBlooms'),
      masterStore.getMaster<GameCharacterData>('gameCharacters'),
    ])
    events.value = eventData
    rankMatchSeasons.value = seasonData
    rankMatchTiers.value = tierData
    rankMatchGrades.value = gradeData
    rankMatchClasses.value = classData
    cards.value = cardData
    worldBlooms.value = bloomData
    characters.value = characterData
  } catch (error) {
    console.error('加载账号记录数据失败:', error)
    loadError.value = error instanceof Error ? error.message : 'Master 数据加载失败'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div><h1 class="text-3xl font-bold flex items-center gap-3"><History class="w-8 h-8 text-primary" />账号记录</h1><p class="text-sm text-base-content/60 mt-2">查看 Suite 中的活动、世界开花章节、排位赛季成绩和全部保存卡组。</p></div>
      <div class="min-w-56"><AccountSelector v-if="accountStore.accounts.length" v-model="selectedUserId" /></div>
    </header>

    <div v-if="isLoading" class="space-y-4"><div class="skeleton h-24 rounded-xl"></div><div class="skeleton h-96 rounded-xl"></div></div>
    <div v-else-if="loadError" class="alert alert-error">账号记录加载失败：{{ loadError }}</div>
    <div v-else-if="!selectedUserId" class="alert alert-info"><span>请先在个人信息页添加账号并刷新 Suite。</span><RouterLink to="/profile" class="btn btn-sm btn-primary">前往个人信息</RouterLink></div>
    <template v-else>
      <div class="tabs tabs-boxed bg-base-100 p-1 w-fit shadow-sm">
        <button class="tab gap-2" :class="{ 'tab-active': activeTab === 'events' }" @click="activeTab = 'events'"><CalendarDays class="w-4 h-4" />活动履历</button>
        <button class="tab gap-2" :class="{ 'tab-active': activeTab === 'world_bloom' }" @click="activeTab = 'world_bloom'"><Flower2 class="w-4 h-4" />世界开花</button>
        <button class="tab gap-2" :class="{ 'tab-active': activeTab === 'rank' }" @click="activeTab = 'rank'"><Swords class="w-4 h-4" />排位赛</button>
        <button class="tab gap-2" :class="{ 'tab-active': activeTab === 'decks' }" @click="activeTab = 'decks'"><LayoutGrid class="w-4 h-4" />保存卡组</button>
      </div>

      <section v-if="activeTab === 'events'" class="space-y-4">
        <div v-if="!userEvents.length" class="alert alert-info">当前 Suite 没有活动履历数据。</div>
        <template v-else>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">参与活动</div><div class="stat-value text-2xl">{{ eventSummary.count }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">累计活动点</div><div class="stat-value text-2xl text-primary">{{ formatNumber(eventSummary.totalPoint) }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">单次最高</div><div class="stat-value text-xl">{{ formatNumber(eventSummary.maxPoint.point) }}</div><div class="stat-desc">活动 #{{ eventSummary.maxPoint.id }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">历史最佳排名</div><div class="stat-value text-xl text-secondary">#{{ eventSummary.bestRank ? formatNumber(eventSummary.bestRank.rank) : '-' }}</div><div class="stat-desc">活动 #{{ eventSummary.bestRank?.id || '-' }}</div></div>
          </div>
          <div class="card bg-base-100 shadow-sm"><div class="card-body p-4"><div class="flex flex-wrap gap-3"><label class="input input-bordered input-sm flex items-center gap-2 grow max-w-lg"><Search class="w-4 h-4 opacity-50" /><input v-model="eventSearch" class="grow" placeholder="搜索活动名称或 ID…" /></label><label class="label cursor-pointer gap-2"><input v-model="rankedOnly" type="checkbox" class="checkbox checkbox-sm checkbox-primary" /><span class="label-text">仅显示有排名</span></label></div></div></div>
          <div class="card bg-base-100 shadow-sm overflow-hidden"><div class="overflow-x-auto"><table class="table table-zebra"><thead><tr><th>活动</th><th>日期</th><th class="text-right">活动点</th><th class="text-right">排名</th></tr></thead><tbody><tr v-for="row in filteredEventRows" :key="row.id"><td><RouterLink v-if="row.master" :to="`/events/${row.id}`" class="link link-hover font-medium">{{ row.master.name }}</RouterLink><span v-else class="font-medium">活动 #{{ row.id }}</span><p class="text-xs text-base-content/45">#{{ row.id }}</p></td><td class="text-sm whitespace-nowrap">{{ formatDate(row.master?.startAt) }}</td><td class="text-right font-medium">{{ formatNumber(row.point) }}</td><td class="text-right"><span v-if="row.rank" class="badge badge-primary badge-outline">#{{ formatNumber(row.rank) }}</span><span v-else class="text-base-content/35">—</span></td></tr></tbody></table></div></div>
        </template>
      </section>

      <section v-else-if="activeTab === 'world_bloom'" class="space-y-4">
        <div v-if="!userWorldBlooms.length" class="alert alert-info">当前 Suite 没有世界开花章节履历数据。</div>
        <template v-else>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">参与章节 / 活动</div><div class="stat-value text-2xl">{{ worldBloomSummary.count }} / {{ worldBloomSummary.eventCount }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">累计章节点</div><div class="stat-value text-2xl text-primary">{{ formatNumber(worldBloomSummary.totalPoint) }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">单章最高</div><div class="stat-value text-xl">{{ formatNumber(worldBloomSummary.maxPoint.point) }}</div><div class="stat-desc">{{ worldBloomSummary.maxPoint.character ? getCharacterName(worldBloomSummary.maxPoint.character) : '-' }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">历史最佳章节排名</div><div class="stat-value text-xl text-secondary">#{{ worldBloomSummary.bestRank ? formatNumber(worldBloomSummary.bestRank.rank) : '-' }}</div><div class="stat-desc">{{ worldBloomSummary.bestRank?.character ? getCharacterName(worldBloomSummary.bestRank.character) : '' }}</div></div>
          </div>
          <div class="card bg-base-100 shadow-sm"><div class="card-body p-4"><div class="flex flex-wrap gap-3"><label class="input input-bordered input-sm flex items-center gap-2 grow max-w-lg"><Search class="w-4 h-4 opacity-50" /><input v-model="bloomSearch" class="grow" placeholder="搜索活动、角色或 ID…" /></label><label class="label cursor-pointer gap-2"><input v-model="bloomRankedOnly" type="checkbox" class="checkbox checkbox-sm checkbox-primary" /><span class="label-text">仅显示有排名</span></label></div></div></div>
          <div class="card bg-base-100 shadow-sm overflow-hidden"><div class="overflow-x-auto"><table class="table table-zebra"><thead><tr><th>活动 / 章节</th><th>角色</th><th>日期</th><th class="text-right">章节点</th><th class="text-right">排名</th></tr></thead><tbody><tr v-for="row in filteredWorldBloomRows" :key="`${row.eventId}_${row.characterId}`"><td><RouterLink v-if="row.event" :to="`/events/${row.eventId}`" class="link link-hover font-medium">{{ row.event.name }}</RouterLink><span v-else class="font-medium">活动 #{{ row.eventId }}</span><p class="text-xs text-base-content/45">#{{ row.eventId }}<template v-if="row.chapter?.chapterNo"> · Chapter {{ row.chapter.chapterNo }}</template></p></td><td><RouterLink v-if="row.character" :to="`/characters/${row.characterId}`" class="link link-hover font-medium">{{ getCharacterName(row.character) }}</RouterLink><span v-else>角色 #{{ row.characterId }}</span></td><td class="text-sm whitespace-nowrap">{{ formatDate(row.chapter?.chapterStartAt || row.event?.startAt) }}</td><td class="text-right font-medium">{{ formatNumber(row.point) }}</td><td class="text-right"><span v-if="row.rank" class="badge badge-secondary badge-outline">#{{ formatNumber(row.rank) }}</span><span v-else class="text-base-content/35">—</span></td></tr></tbody></table></div></div>
        </template>
      </section>

      <section v-else-if="activeTab === 'rank'" class="space-y-4">
        <div v-if="!userRankSeasons.length" class="alert alert-info">当前 Suite 没有排位赛季数据。</div>
        <template v-else>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">参与赛季</div><div class="stat-value text-2xl">{{ userRankSeasons.length }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">总对局</div><div class="stat-value text-2xl">{{ formatNumber(rankSummary.play) }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">总胜场 / 胜率</div><div class="stat-value text-xl text-primary">{{ formatNumber(rankSummary.wins) }} / {{ formatPercent(rankSummary.winRate) }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">最佳赛季排名</div><div class="stat-value text-xl text-secondary">#{{ rankSummary.bestRank?.rank ? formatNumber(rankSummary.bestRank.rank) : '-' }}</div><div class="stat-desc">{{ rankSummary.bestRank?.season?.name || '' }}</div></div>
          </div>
          <div class="grid md:grid-cols-2 gap-4"><article v-for="row in rankRows" :key="row.rankMatchSeasonId" class="card bg-base-100 shadow-sm border border-base-200"><div class="card-body p-4 gap-3"><div class="flex justify-between gap-3"><div><p class="text-xs text-base-content/45">赛季 #{{ row.rankMatchSeasonId }} · {{ formatDate(row.season?.startAt) }}</p><h2 class="font-bold">{{ row.season?.name || `赛季 #${row.rankMatchSeasonId}` }}</h2></div><div class="text-right"><span class="badge badge-primary">{{ tierLabel(row) }}</span><p v-if="row.rank" class="text-xs mt-1">排名 #{{ formatNumber(row.rank) }}</p></div></div><div class="grid grid-cols-4 gap-2 text-center text-sm"><div class="rounded-lg bg-base-200 p-2"><p class="text-xs text-base-content/50">对局</p><strong>{{ row.playCount }}</strong></div><div class="rounded-lg bg-success/10 p-2"><p class="text-xs text-base-content/50">胜</p><strong class="text-success">{{ row.winCount }}</strong></div><div class="rounded-lg bg-error/10 p-2"><p class="text-xs text-base-content/50">负</p><strong class="text-error">{{ row.loseCount }}</strong></div><div class="rounded-lg bg-base-200 p-2"><p class="text-xs text-base-content/50">平</p><strong>{{ row.drawCount }}</strong></div></div><div class="flex justify-between text-xs text-base-content/55"><span>胜率 {{ formatPercent(row.decisionCount ? row.winCount / row.decisionCount * 100 : 0) }}</span><span>最高连胜 {{ row.maxConsecutiveWinCount }} · 处罚 {{ row.penaltyCount }}</span></div></div></article></div>
        </template>
      </section>

      <section v-else class="space-y-4">
        <div v-if="!userDecks.length" class="alert alert-info">当前 Suite 没有保存卡组数据。</div>
        <div v-else class="grid lg:grid-cols-2 gap-4"><article v-for="deck in userDecks" :key="deck.deckId" class="card bg-base-100 shadow-sm border border-base-200"><div class="card-body p-4"><div class="flex items-center justify-between"><h2 class="font-bold flex items-center gap-2"><LayoutGrid class="w-4 h-4 text-primary" />{{ deck.name || `卡组 ${deck.deckId}` }}</h2><span class="badge badge-outline">Deck {{ deck.deckId }}</span></div><div class="grid grid-cols-5 gap-2"><div v-for="row in deckCards(deck)" :key="row.cardId" class="min-w-0"><RouterLink :to="`/cards/${row.cardId}`" class="block hover:scale-105 transition-transform"><SekaiCard v-if="row.master" :card="row.master" :trained="row.user?.defaultImage === 'special_training'" :master-rank="row.user?.masterRank || 0" /></RouterLink><p class="text-[10px] text-center mt-1 truncate">Lv.{{ row.user?.level || '?' }}<span v-if="row.cardId === deck.leader" class="text-primary"> · L</span></p></div></div></div></article></div>
      </section>
    </template>
  </div>
</template>
