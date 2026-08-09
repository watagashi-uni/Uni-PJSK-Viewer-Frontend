<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { CalendarDays, CheckCircle2, Flower2, History, LayoutGrid, ListChecks, Search, Star, Swords } from 'lucide-vue-next'
import AccountSelector from '@/components/AccountSelector.vue'
import AssetImage from '@/components/AssetImage.vue'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import SekaiCard from '@/components/SekaiCard.vue'
import { useAccountStore } from '@/stores/account'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import type { GameCharacterData } from '@/types/master'

type RecordsTab = 'events' | 'world_bloom' | 'challenge' | 'rank' | 'decks' | 'missions'

interface EventInfo {
  id: number
  name: string
  assetbundleName?: string
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

interface UserChallengeDeck {
  characterId: number
  leader?: number
  support1?: number
  support2?: number
  support3?: number
  support4?: number
}

interface UserChallengeResult {
  characterId: number
  highScore: number
}

interface UserChallengeStage {
  characterId: number
  rank: number
  challengeLiveStageStatus: string
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

interface CharacterMissionInfo {
  id: number
  characterMissionType: string
  characterId: number
  parameterGroupId: number
  sentence: string
  progressSentence: string
}

interface CharacterMissionParameter {
  id: number
  seq: number
  requirement: number
  exp?: number
}

interface UserCharacterMission {
  characterId: number
  characterMissionType: string
  progress: number
}

interface UserCharacterMissionStatus {
  missionId: number
  characterId: number
  parameterGroupId: number
  seq: number
  missionStatus: string
}

interface UserCharacterRank {
  characterId: number
  characterRank: number
  exp: number
  totalExp?: number
}

const masterStore = useMasterStore()
const accountStore = useAccountStore()
const settingsStore = useSettingsStore()

const events = ref<EventInfo[]>([])
const rankMatchSeasons = ref<RankMatchSeason[]>([])
const rankMatchTiers = ref<RankMatchTier[]>([])
const rankMatchGrades = ref<NamedMaster[]>([])
const rankMatchClasses = ref<NamedMaster[]>([])
const cards = ref<CardInfo[]>([])
const worldBlooms = ref<WorldBloomInfo[]>([])
const characters = ref<GameCharacterData[]>([])
const characterMissions = ref<CharacterMissionInfo[]>([])
const characterMissionParameters = ref<CharacterMissionParameter[]>([])
const isLoading = ref(true)
const loadError = ref('')
const activeTab = ref<RecordsTab>('events')
const eventSearch = ref('')
const rankedOnly = ref(false)
const eventPage = ref(1)
const bloomSearch = ref('')
const bloomRankedOnly = ref(false)
const challengeSearch = ref('')
const challengeSort = ref<'character' | 'score' | 'stage'>('score')
const missionSearch = ref('')
const missionSort = ref<'rank' | 'completion' | 'character'>('rank')
const selectedMissionCharacterId = ref<number | null>(null)
const eventPageSize = 24

const assetsHost = computed(() => settingsStore.assetsHost)
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
const userChallengeDecks = computed(() => suiteArray<UserChallengeDeck>('userChallengeLiveSoloDecks', 'user_challenge_live_solo_decks'))
const userChallengeResults = computed(() => suiteArray<UserChallengeResult>('userChallengeLiveSoloResults', 'user_challenge_live_solo_results'))
const userChallengeStages = computed(() => suiteArray<UserChallengeStage>('userChallengeLiveSoloStages', 'user_challenge_live_solo_stages'))
const userRankSeasons = computed(() => suiteArray<UserRankMatchSeason>('userRankMatchSeasons', 'user_rank_match_seasons'))
const userDecks = computed(() => suiteArray<UserDeckInfo>('userDecks', 'user_decks'))
const userCards = computed(() => suiteArray<UserCardInfo>('userCards', 'user_cards'))
const userCharacterMissions = computed(() => suiteArray<UserCharacterMission>('userCharacterMissionV2s', 'user_character_mission_v2s'))
const userCharacterMissionStatuses = computed(() => suiteArray<UserCharacterMissionStatus>('userCharacterMissionV2Statuses', 'user_character_mission_v2_statuses'))
const userCharacterRanks = computed(() => suiteArray<UserCharacterRank>('userCharacters', 'user_characters'))
const userCardMap = computed(() => new Map(userCards.value.map(card => [card.cardId, card])))
const userCharacterRankMap = computed(() => new Map(userCharacterRanks.value.map(row => [Number(row.characterId), row])))

const missionTypeLabels: Record<string, string> = {
  play_live: '担任队长完成 Live',
  play_live_ex: '担任队长完成 Live EX',
  waiting_room: '成员进入等候室',
  waiting_room_ex: '成员进入等候室 EX',
  collect_costume_3d: '收集 3D 服装',
  collect_stamp: '收集表情贴图',
  read_area_talk: '阅读区域对话',
  read_card_episode_first: '阅读前篇卡片剧情',
  read_card_episode_second: '阅读后篇卡片剧情',
  collect_another_vocal: '收集 Another Vocal',
  area_item_level_up_character: '升级角色区域道具',
  area_item_level_up_unit: '升级组合区域道具',
  area_item_level_up_reality_world: '升级属性区域道具',
  collect_member: '收集成员卡片',
  skill_level_up_rare: '提升高稀有度技能等级',
  skill_level_up_standard: '提升常规卡片技能等级',
  master_rank_up_rare: '提升高稀有度 Master Rank',
  master_rank_up_standard: '提升常规卡片 Master Rank',
  collect_character_archive_voice: '收集角色语音',
  collect_mysekai_fixture: '制作角色 MySekai 家具',
  collect_mysekai_canvas: '制作角色 MySekai 画布',
  read_mysekai_fixture_unique_character_talk: '阅读 MySekai 家具对话',
}

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
const eventTotalPages = computed(() => Math.max(1, Math.ceil(filteredEventRows.value.length / eventPageSize)))
const paginatedEventRows = computed(() => filteredEventRows.value.slice(
  (eventPage.value - 1) * eventPageSize,
  eventPage.value * eventPageSize,
))

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

const worldBloomGroups = computed(() => {
  const groups = new Map<number, {
    eventId: number
    event?: EventInfo
    rows: typeof filteredWorldBloomRows.value
    totalPoint: number
    bestRank: number
  }>()
  for (const row of filteredWorldBloomRows.value) {
    const group = groups.get(row.eventId) || {
      eventId: row.eventId,
      event: row.event,
      rows: [],
      totalPoint: 0,
      bestRank: 0,
    }
    group.rows.push(row)
    group.totalPoint += row.point
    if (row.rank > 0 && (!group.bestRank || row.rank < group.bestRank)) group.bestRank = row.rank
    groups.set(row.eventId, group)
  }
  return [...groups.values()]
    .map(group => ({ ...group, rows: [...group.rows].sort((a, b) => (a.chapter?.chapterNo || 0) - (b.chapter?.chapterNo || 0)) }))
    .sort((a, b) => b.eventId - a.eventId)
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

const challengeResultMap = computed(() => new Map(userChallengeResults.value.map(row => [
  Number(row.characterId),
  Number(row.highScore || 0),
])))

const challengeStageMap = computed(() => {
  const result = new Map<number, number>()
  for (const row of userChallengeStages.value) {
    if (row.challengeLiveStageStatus !== 'complete') continue
    const id = Number(row.characterId)
    const rank = Number(row.rank || 0)
    result.set(id, Math.max(result.get(id) || 0, rank))
  }
  return result
})

const challengeRows = computed(() => {
  const query = challengeSearch.value.trim().toLocaleLowerCase()
  return userChallengeDecks.value.map(deck => ({
    deck,
    character: characterMap.value.get(Number(deck.characterId)),
    highScore: challengeResultMap.value.get(Number(deck.characterId)) || 0,
    maxStage: challengeStageMap.value.get(Number(deck.characterId)) || 0,
  })).filter(row => !query || [
    row.deck.characterId,
    row.character ? getCharacterName(row.character) : '',
  ].some(value => String(value || '').toLocaleLowerCase().includes(query)))
    .sort((a, b) => {
      if (challengeSort.value === 'score') return b.highScore - a.highScore || a.deck.characterId - b.deck.characterId
      if (challengeSort.value === 'stage') return b.maxStage - a.maxStage || b.highScore - a.highScore
      return a.deck.characterId - b.deck.characterId
    })
})

const challengeSummary = computed(() => {
  const rows = userChallengeDecks.value.map(deck => ({
    characterId: Number(deck.characterId),
    highScore: challengeResultMap.value.get(Number(deck.characterId)) || 0,
    maxStage: challengeStageMap.value.get(Number(deck.characterId)) || 0,
  }))
  return {
    deckCount: rows.length,
    totalScore: rows.reduce((sum, row) => sum + row.highScore, 0),
    bestScore: rows.reduce((best, row) => row.highScore > best.highScore ? row : best, { characterId: 0, highScore: 0, maxStage: 0 }),
    maxStage: rows.reduce((best, row) => row.maxStage > best.maxStage ? row : best, { characterId: 0, highScore: 0, maxStage: 0 }),
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

const missionParameterMap = computed(() => {
  const result = new Map<number, CharacterMissionParameter[]>()
  for (const row of characterMissionParameters.value) {
    const list = result.get(Number(row.id)) || []
    list.push(row)
    result.set(Number(row.id), list)
  }
  for (const list of result.values()) list.sort((a, b) => Number(a.seq) - Number(b.seq))
  return result
})

const userMissionProgressMap = computed(() => new Map(userCharacterMissions.value.map(row => [
  `${Number(row.characterId)}_${row.characterMissionType}`,
  Number(row.progress || 0),
])))

const userMissionStatusMap = computed(() => {
  const result = new Map<number, UserCharacterMissionStatus[]>()
  for (const row of userCharacterMissionStatuses.value) {
    const list = result.get(Number(row.missionId)) || []
    list.push(row)
    result.set(Number(row.missionId), list)
  }
  return result
})

const characterMissionRows = computed(() => characters.value.map(character => {
  const definitions = characterMissions.value.filter(row => Number(row.characterId) === character.id)
  const missions = definitions.map(definition => {
    const parameters = missionParameterMap.value.get(Number(definition.parameterGroupId)) || []
    const statuses = userMissionStatusMap.value.get(Number(definition.id)) || []
    const achievedSeqs = new Set(statuses.map(row => Number(row.seq)))
    const isEx = definition.characterMissionType.endsWith('_ex')
    const nextSeq = statuses.reduce((max, row) => Math.max(max, Number(row.seq)), 0) + 1
    const exParameter = [...parameters].reverse().find(row => Number(row.seq) <= nextSeq)
    const next = isEx
      ? (exParameter ? { ...exParameter, seq: nextSeq } : undefined)
      : parameters.find(row => !achievedSeqs.has(Number(row.seq)))
    const progress = userMissionProgressMap.value.get(`${character.id}_${definition.characterMissionType}`) || 0
    const received = statuses.filter(row => row.missionStatus === 'received').length
    const claimable = statuses.filter(row => row.missionStatus !== 'received').length
    return {
      definition,
      isEx,
      progress,
      received,
      claimable,
      total: parameters.length,
      next,
      remaining: next ? Math.max(0, Number(next.requirement) - progress) : 0,
      ratio: next?.requirement ? Math.min(1, progress / Number(next.requirement)) : 1,
    }
  })
  const rank = userCharacterRankMap.value.get(character.id)
  const received = missions.reduce((sum, row) => sum + row.received, 0)
  const claimable = missions.reduce((sum, row) => sum + row.claimable, 0)
  const finiteReceived = missions.filter(row => !row.isEx).reduce((sum, row) => sum + row.received, 0)
  const finiteTotal = missions.filter(row => !row.isEx).reduce((sum, row) => sum + row.total, 0)
  const nearest = missions.filter(row => row.next)
    .sort((a, b) => b.ratio - a.ratio || a.remaining - b.remaining)
    .slice(0, 3)
  return {
    character,
    rank,
    missions: missions.sort((a, b) => a.definition.id - b.definition.id),
    received,
    claimable,
    total: finiteTotal,
    completion: finiteTotal ? finiteReceived / finiteTotal : 0,
    completedTypes: missions.filter(row => !row.isEx && !row.next).length,
    nearest,
  }
}))

const filteredCharacterMissionRows = computed(() => {
  const query = missionSearch.value.trim().toLocaleLowerCase()
  return characterMissionRows.value
    .filter(row => !query || [
      row.character.id,
      getCharacterName(row.character),
      row.character.firstNameEnglish,
      row.character.givenNameEnglish,
    ].some(value => String(value || '').toLocaleLowerCase().includes(query)))
    .sort((a, b) => {
      if (missionSort.value === 'completion') return b.completion - a.completion || b.received - a.received
      if (missionSort.value === 'rank') return Number(b.rank?.characterRank || 0) - Number(a.rank?.characterRank || 0) || a.character.seq - b.character.seq
      return a.character.seq - b.character.seq
    })
})

const selectedCharacterMission = computed(() => characterMissionRows.value.find(row => row.character.id === selectedMissionCharacterId.value))

const characterMissionSummary = computed(() => {
  const rows = characterMissionRows.value
  const rankRows = rows.filter(row => row.rank)
  return {
    characterCount: rankRows.length,
    received: rows.reduce((sum, row) => sum + row.received, 0),
    claimable: rows.reduce((sum, row) => sum + row.claimable, 0),
    averageRank: rankRows.length ? rankRows.reduce((sum, row) => sum + Number(row.rank?.characterRank || 0), 0) / rankRows.length : 0,
  }
})

function deckCards(deck: UserDeckInfo) {
  return [deck.member1, deck.member2, deck.member3, deck.member4, deck.member5]
    .map(cardId => ({ cardId, master: cardMap.value.get(cardId), user: userCardMap.value.get(cardId) }))
    .filter(row => row.master)
}

function challengeDeckCards(deck: UserChallengeDeck) {
  return [deck.leader, deck.support1, deck.support2, deck.support3, deck.support4]
    .filter((cardId): cardId is number => Number(cardId) > 0)
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

function characterIcon(characterId: number): string {
  if (characterId <= 20) return `/img/chr_ts/chr_ts_90_${characterId}.png`
  return `/img/chr_ts/chr_ts_90_${characterId}_2.png`
}

function missionTypeLabel(type: string): string {
  return missionTypeLabels[type] || type.replace(/_/g, ' ')
}

function eventBanner(event?: EventInfo): string {
  if (!event?.assetbundleName) return ''
  return `${assetsHost.value}/startapp/home/banner/${event.assetbundleName}/${event.assetbundleName}.png`
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

watch([eventSearch, rankedOnly], () => { eventPage.value = 1 })
watch(eventTotalPages, total => { eventPage.value = Math.min(eventPage.value, total) })

onMounted(async () => {
  try {
    const [eventData, seasonData, tierData, gradeData, classData, cardData, bloomData, characterData, missionData, missionParameterData] = await Promise.all([
      masterStore.getMaster<EventInfo>('events'),
      masterStore.getMaster<RankMatchSeason>('rankMatchSeasons'),
      masterStore.getMaster<RankMatchTier>('rankMatchTiers'),
      masterStore.getMaster<NamedMaster>('rankMatchGrades'),
      masterStore.getMaster<NamedMaster>('rankMatchClasses'),
      masterStore.getMaster<CardInfo>('cards'),
      masterStore.getMaster<WorldBloomInfo>('worldBlooms'),
      masterStore.getMaster<GameCharacterData>('gameCharacters'),
      masterStore.getMaster<CharacterMissionInfo>('characterMissionV2s'),
      masterStore.getMaster<CharacterMissionParameter>('characterMissionV2ParameterGroups'),
    ])
    events.value = eventData
    rankMatchSeasons.value = seasonData
    rankMatchTiers.value = tierData
    rankMatchGrades.value = gradeData
    rankMatchClasses.value = classData
    cards.value = cardData
    worldBlooms.value = bloomData
    characters.value = characterData
    characterMissions.value = missionData
    characterMissionParameters.value = missionParameterData
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
    <PageHeader title="账号记录" description="活动、角色任务、World Bloom、挑战 Live、排位赛季与卡组的统一履历。">
      <template #icon><History class="w-8 h-8 text-primary" /></template>
      <template v-if="accountStore.accounts.length" #actions><div class="sm:w-56"><AccountSelector v-model="selectedUserId" /></div></template>
    </PageHeader>

    <div v-if="isLoading" class="space-y-4"><div class="skeleton h-24 rounded-xl"></div><div class="skeleton h-96 rounded-xl"></div></div>
    <div v-else-if="loadError" class="alert alert-error">账号记录加载失败：{{ loadError }}</div>
    <div v-else-if="!selectedUserId" class="alert alert-info"><span>请先在个人信息页添加账号并刷新 Suite。</span><RouterLink to="/profile" class="btn btn-sm btn-primary">前往个人信息</RouterLink></div>
    <template v-else>
      <div class="tabs tabs-boxed bg-base-100 p-1 w-fit max-w-full h-auto flex-wrap shadow-sm">
        <button class="tab gap-2" :class="{ 'tab-active': activeTab === 'events' }" @click="activeTab = 'events'"><CalendarDays class="w-4 h-4" />活动履历</button>
        <button class="tab gap-2" :class="{ 'tab-active': activeTab === 'missions' }" @click="activeTab = 'missions'"><ListChecks class="w-4 h-4" />角色任务</button>
        <button class="tab gap-2" :class="{ 'tab-active': activeTab === 'world_bloom' }" @click="activeTab = 'world_bloom'"><Flower2 class="w-4 h-4" />World Bloom</button>
        <button class="tab gap-2" :class="{ 'tab-active': activeTab === 'challenge' }" @click="activeTab = 'challenge'"><Star class="w-4 h-4" />挑战 Live</button>
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
          <div v-if="paginatedEventRows.length" class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <article v-for="row in paginatedEventRows" :key="row.id" class="card bg-base-100 border border-base-200 shadow-sm overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
              <RouterLink v-if="row.master" :to="`/events/${row.id}`" class="block bg-base-200 aspect-[122/52] overflow-hidden"><AssetImage v-if="eventBanner(row.master)" :src="eventBanner(row.master)" :alt="row.master.name" class="w-full h-full object-cover hover:scale-[1.02] transition-transform" /></RouterLink>
              <div v-else class="aspect-[122/52] bg-base-200 grid place-items-center text-base-content/30"><CalendarDays class="w-10 h-10" /></div>
              <div class="card-body p-3 gap-2.5">
                <div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="text-xs text-base-content/45">活动 #{{ row.id }} · {{ formatDate(row.master?.startAt) }}</p><RouterLink v-if="row.master" :to="`/events/${row.id}`" class="font-bold link link-hover line-clamp-2">{{ row.master.name }}</RouterLink><p v-else class="font-bold">活动 #{{ row.id }}</p></div><span v-if="row.rank" class="badge badge-primary badge-outline shrink-0">#{{ formatNumber(row.rank) }}</span></div>
                <div class="grid grid-cols-2 gap-1.5 text-xs"><div class="rounded-lg bg-base-200/70 px-2.5 py-2"><p class="text-[10px] text-base-content/45">活动点</p><p class="font-bold text-primary">{{ formatNumber(row.point) }}</p></div><div class="rounded-lg bg-base-200/70 px-2.5 py-2"><p class="text-[10px] text-base-content/45">最终排名</p><p class="font-bold">{{ row.rank ? `#${formatNumber(row.rank)}` : '—' }}</p></div></div>
              </div>
            </article>
          </div>
          <div v-else class="card bg-base-100 border border-base-200"><div class="card-body items-center py-12 text-base-content/45">没有匹配的活动记录</div></div>
          <Pagination v-if="eventTotalPages > 1" :current-page="eventPage" :total-pages="eventTotalPages" base-url="/account-records" @page-change="eventPage = $event" />
        </template>
      </section>

      <section v-else-if="activeTab === 'missions'" class="space-y-4">
        <div v-if="!userCharacterMissions.length && !userCharacterMissionStatuses.length" class="alert alert-info">当前 Suite 没有角色任务数据。</div>
        <template v-else>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">有记录角色</div><div class="stat-value text-2xl">{{ characterMissionSummary.characterCount }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">平均 Character Rank</div><div class="stat-value text-2xl text-primary">{{ characterMissionSummary.averageRank.toFixed(1) }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">已领取里程碑</div><div class="stat-value text-2xl">{{ formatNumber(characterMissionSummary.received) }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">待领取里程碑</div><div class="stat-value text-2xl text-secondary">{{ formatNumber(characterMissionSummary.claimable) }}</div></div>
          </div>

          <div class="card bg-base-100 shadow-sm"><div class="card-body p-4"><div class="flex flex-wrap gap-3"><label class="input input-bordered input-sm flex items-center gap-2 grow max-w-lg"><Search class="w-4 h-4 opacity-50" /><input v-model="missionSearch" class="grow" placeholder="搜索角色名称或 ID…" /></label><select v-model="missionSort" class="select select-bordered select-sm"><option value="rank">Character Rank 排序</option><option value="completion">任务完成度排序</option><option value="character">角色顺序</option></select></div></div></div>

          <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            <article v-for="row in filteredCharacterMissionRows" :key="row.character.id" class="card bg-base-100 border border-base-200 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
              <div class="card-body p-4 gap-4">
                <div class="flex items-center gap-3">
                  <div class="avatar shrink-0"><div class="w-14 rounded-full bg-base-200 ring-2 ring-base-200"><img :src="characterIcon(row.character.id)" :alt="getCharacterName(row.character)" loading="lazy" /></div></div>
                  <div class="min-w-0 grow"><RouterLink :to="`/characters/${row.character.id}`" class="font-bold link link-hover truncate block">{{ getCharacterName(row.character) }}</RouterLink><p class="text-xs text-base-content/45">{{ row.character.firstNameEnglish }} {{ row.character.givenNameEnglish }}</p></div>
                  <div class="text-right shrink-0"><p class="text-[10px] text-base-content/45">Character Rank</p><p class="text-2xl font-black text-primary">{{ row.rank?.characterRank || '—' }}</p><p v-if="row.rank" class="text-[10px] text-base-content/45">EXP {{ row.rank.exp }}</p></div>
                </div>

                <div>
                  <div class="flex justify-between text-xs mb-1.5"><span>已领取 {{ formatNumber(row.received) }} 个里程碑</span><span>有限任务 {{ formatPercent(row.completion * 100) }}</span></div>
                  <progress class="progress progress-primary w-full h-2" :value="row.completion" max="1"></progress>
                  <div class="flex gap-2 mt-2 text-[11px] text-base-content/50"><span>{{ row.completedTypes }} 类有限任务已满级</span><span v-if="row.claimable" class="text-secondary font-medium">{{ row.claimable }} 项待领取</span></div>
                </div>

                <div class="space-y-2">
                  <p class="text-[11px] font-bold uppercase tracking-wide text-base-content/45">距离最近的目标</p>
                  <div v-for="mission in row.nearest" :key="mission.definition.id" class="rounded-lg bg-base-200/65 px-3 py-2">
                    <div class="flex justify-between gap-3 text-xs"><span class="font-medium truncate">{{ missionTypeLabel(mission.definition.characterMissionType) }}</span><span class="shrink-0 tabular-nums">{{ formatNumber(mission.progress) }} / {{ formatNumber(mission.next!.requirement) }}</span></div>
                    <progress class="progress progress-secondary w-full h-1.5 mt-1" :value="mission.progress" :max="mission.next!.requirement || 1"></progress>
                  </div>
                  <p v-if="!row.nearest.length" class="rounded-lg bg-success/10 text-success text-sm px-3 py-3 flex items-center gap-2"><CheckCircle2 class="w-4 h-4" />所有任务里程碑均已完成</p>
                </div>

                <button class="btn btn-sm btn-ghost border border-base-200" @click="selectedMissionCharacterId = row.character.id">查看全部 {{ row.missions.length }} 类任务</button>
              </div>
            </article>
          </div>
          <div v-if="!filteredCharacterMissionRows.length" class="card bg-base-100 border border-base-200"><div class="card-body items-center py-12 text-base-content/45">没有匹配的角色</div></div>
        </template>
      </section>

      <section v-else-if="activeTab === 'world_bloom'" class="space-y-4">
        <div v-if="!userWorldBlooms.length" class="alert alert-info">当前 Suite 没有 World Bloom 章节履历数据。</div>
        <template v-else>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">参与章节 / 活动</div><div class="stat-value text-2xl">{{ worldBloomSummary.count }} / {{ worldBloomSummary.eventCount }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">累计 Chapter Point</div><div class="stat-value text-2xl text-primary">{{ formatNumber(worldBloomSummary.totalPoint) }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">单章最高</div><div class="stat-value text-xl">{{ formatNumber(worldBloomSummary.maxPoint.point) }}</div><div class="stat-desc">{{ worldBloomSummary.maxPoint.character ? getCharacterName(worldBloomSummary.maxPoint.character) : '-' }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">最佳 Chapter Rank</div><div class="stat-value text-xl text-secondary">#{{ worldBloomSummary.bestRank ? formatNumber(worldBloomSummary.bestRank.rank) : '-' }}</div><div class="stat-desc">{{ worldBloomSummary.bestRank?.character ? getCharacterName(worldBloomSummary.bestRank.character) : '' }}</div></div>
          </div>
          <div class="card bg-base-100 shadow-sm"><div class="card-body p-4"><div class="flex flex-wrap gap-3"><label class="input input-bordered input-sm flex items-center gap-2 grow max-w-lg"><Search class="w-4 h-4 opacity-50" /><input v-model="bloomSearch" class="grow" placeholder="搜索活动、角色或 ID…" /></label><label class="label cursor-pointer gap-2"><input v-model="bloomRankedOnly" type="checkbox" class="checkbox checkbox-sm checkbox-primary" /><span class="label-text">仅显示有排名</span></label></div></div></div>
          <div v-if="worldBloomGroups.length" class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            <article v-for="group in worldBloomGroups" :key="group.eventId" class="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
              <RouterLink v-if="group.event" :to="`/events/${group.eventId}`" class="block aspect-[122/38] bg-base-200 overflow-hidden"><AssetImage v-if="eventBanner(group.event)" :src="eventBanner(group.event)" :alt="group.event.name" class="w-full h-full object-cover hover:scale-[1.02] transition-transform" /></RouterLink>
              <div class="card-body p-3 gap-2.5">
                <div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="text-xs text-base-content/45">World Bloom #{{ group.eventId }} · {{ formatDate(group.event?.startAt) }}</p><RouterLink v-if="group.event" :to="`/events/${group.eventId}`" class="font-bold link link-hover line-clamp-2">{{ group.event.name }}</RouterLink><p v-else class="font-bold">活动 #{{ group.eventId }}</p></div><div class="text-right shrink-0"><p class="font-bold text-primary">{{ formatNumber(group.totalPoint) }}</p><p class="text-[10px] text-base-content/45">Total Chapter Point</p></div></div>
                <div class="divide-y divide-base-200 rounded-xl border border-base-200 overflow-hidden">
                  <div v-for="row in group.rows" :key="row.characterId" class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2.5 py-2 bg-base-100">
                    <span class="badge badge-secondary badge-outline badge-sm whitespace-nowrap">Chapter {{ row.chapter?.chapterNo || '?' }}</span>
                    <div class="min-w-0"><RouterLink v-if="row.character" :to="`/characters/${row.characterId}`" class="text-sm font-medium link link-hover truncate block">{{ getCharacterName(row.character) }}</RouterLink><span v-else class="text-sm">角色 #{{ row.characterId }}</span><p class="text-[10px] text-base-content/45">{{ formatDate(row.chapter?.chapterStartAt || row.event?.startAt) }}</p></div>
                    <div class="text-right"><p class="text-sm font-bold">{{ formatNumber(row.point) }}</p><p class="text-[10px]" :class="row.rank ? 'text-secondary' : 'text-base-content/35'">{{ row.rank ? `Rank #${formatNumber(row.rank)}` : 'No rank' }}</p></div>
                  </div>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="card bg-base-100 border border-base-200"><div class="card-body items-center py-12 text-base-content/45">没有匹配的 World Bloom 记录</div></div>
        </template>
      </section>

      <section v-else-if="activeTab === 'challenge'" class="space-y-4">
        <div v-if="!userChallengeDecks.length" class="alert alert-info">当前 Suite 没有挑战 Live 卡组数据。</div>
        <template v-else>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">角色卡组</div><div class="stat-value text-2xl">{{ challengeSummary.deckCount }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">角色最高分合计</div><div class="stat-value text-xl text-primary">{{ formatNumber(challengeSummary.totalScore) }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">单角色最高分</div><div class="stat-value text-xl">{{ formatNumber(challengeSummary.bestScore.highScore) }}</div><div class="stat-desc">{{ characterMap.get(challengeSummary.bestScore.characterId) ? getCharacterName(characterMap.get(challengeSummary.bestScore.characterId)!) : '-' }}</div></div>
            <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">最高完成 Stage</div><div class="stat-value text-xl text-secondary">{{ challengeSummary.maxStage.maxStage }}</div><div class="stat-desc">{{ characterMap.get(challengeSummary.maxStage.characterId) ? getCharacterName(characterMap.get(challengeSummary.maxStage.characterId)!) : '-' }}</div></div>
          </div>
          <div class="card bg-base-100 shadow-sm"><div class="card-body p-4"><div class="flex flex-wrap gap-3"><label class="input input-bordered input-sm flex items-center gap-2 grow max-w-lg"><Search class="w-4 h-4 opacity-50" /><input v-model="challengeSearch" class="grow" placeholder="搜索角色或 ID…" /></label><select v-model="challengeSort" class="select select-bordered select-sm"><option value="score">最高分排序</option><option value="stage">Stage 排序</option><option value="character">角色顺序</option></select></div></div></div>
          <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            <article v-for="row in challengeRows" :key="row.deck.characterId" class="card bg-base-100 shadow-sm border border-base-200">
              <div class="card-body p-3 gap-2.5">
                <div class="flex items-center justify-between gap-3">
                  <div><RouterLink v-if="row.character" :to="`/characters/${row.deck.characterId}`" class="link link-hover font-bold">{{ getCharacterName(row.character) }}</RouterLink><span v-else class="font-bold">角色 #{{ row.deck.characterId }}</span><p class="text-xs text-base-content/45">挑战 Live 专用卡组</p></div>
                  <div class="flex gap-2 text-right"><span class="badge badge-primary badge-outline">{{ formatNumber(row.highScore) }} 分</span><span class="badge badge-secondary badge-outline">Stage {{ row.maxStage }}</span></div>
                </div>
                <div class="grid grid-cols-5 gap-1.5">
                  <div v-for="(card, index) in challengeDeckCards(row.deck)" :key="card.cardId" class="min-w-0">
                    <RouterLink :to="`/cards/${card.cardId}`" class="block hover:scale-105 transition-transform"><SekaiCard v-if="card.master" :card="card.master" :trained="card.user?.defaultImage === 'special_training'" :master-rank="card.user?.masterRank || 0" /></RouterLink>
                    <p class="text-[10px] text-center mt-1 truncate"><span v-if="index === 0" class="text-primary font-bold">Leader · </span>Lv.{{ card.user?.level || '?' }}</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
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

      <section v-else-if="activeTab === 'decks'" class="space-y-4">
        <div v-if="!userDecks.length" class="alert alert-info">当前 Suite 没有保存卡组数据。</div>
        <div v-else class="grid md:grid-cols-2 xl:grid-cols-3 gap-3"><article v-for="deck in userDecks" :key="deck.deckId" class="card bg-base-100 shadow-sm border border-base-200"><div class="card-body p-3"><div class="flex items-center justify-between"><h2 class="font-bold text-sm flex items-center gap-2"><LayoutGrid class="w-4 h-4 text-primary" />{{ deck.name || `卡组 ${deck.deckId}` }}</h2><span class="badge badge-sm badge-outline">Deck {{ deck.deckId }}</span></div><div class="grid grid-cols-5 gap-1.5"><div v-for="row in deckCards(deck)" :key="row.cardId" class="min-w-0"><RouterLink :to="`/cards/${row.cardId}`" class="block hover:scale-105 transition-transform"><SekaiCard v-if="row.master" :card="row.master" :trained="row.user?.defaultImage === 'special_training'" :master-rank="row.user?.masterRank || 0" /></RouterLink><p class="text-[9px] text-center mt-1 truncate">Lv.{{ row.user?.level || '?' }}<span v-if="row.cardId === deck.leader" class="text-primary"> · L</span></p></div></div></div></article></div>
      </section>
    </template>

    <div v-if="selectedCharacterMission" class="modal modal-open" role="dialog">
      <button class="modal-backdrop" aria-label="关闭任务详情" @click="selectedMissionCharacterId = null"></button>
      <div class="modal-box max-w-4xl p-0 overflow-hidden">
        <div class="sticky top-0 z-10 bg-base-100 border-b border-base-200 p-5 flex items-center gap-3">
          <div class="avatar shrink-0"><div class="w-12 rounded-full bg-base-200"><img :src="characterIcon(selectedCharacterMission.character.id)" :alt="getCharacterName(selectedCharacterMission.character)" /></div></div>
          <div class="min-w-0 grow"><h2 class="font-bold text-lg">{{ getCharacterName(selectedCharacterMission.character) }} · 角色任务</h2><p class="text-xs text-base-content/50">Character Rank {{ selectedCharacterMission.rank?.characterRank || '—' }} · 已领取 {{ selectedCharacterMission.received }} 个里程碑</p></div>
          <button class="btn btn-sm btn-circle btn-ghost" aria-label="关闭" @click="selectedMissionCharacterId = null">✕</button>
        </div>
        <div class="p-4 sm:p-5 max-h-[72vh] overflow-y-auto">
          <div class="grid md:grid-cols-2 gap-3">
            <div v-for="mission in selectedCharacterMission.missions" :key="mission.definition.id" class="rounded-xl border border-base-200 p-3 space-y-2" :class="{ 'bg-success/5 border-success/20': !mission.next }">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0"><h3 class="text-sm font-bold">{{ missionTypeLabel(mission.definition.characterMissionType) }}</h3><p class="text-[10px] text-base-content/40">{{ mission.definition.characterMissionType }}</p></div>
                <span v-if="!mission.next" class="badge badge-success badge-sm gap-1 shrink-0"><CheckCircle2 class="w-3 h-3" />完成</span>
                <span v-else-if="mission.claimable" class="badge badge-secondary badge-sm shrink-0">待领取 {{ mission.claimable }}</span>
                <span v-else-if="mission.isEx" class="badge badge-outline badge-sm shrink-0">EX Lv.{{ mission.next.seq }}</span>
              </div>
              <template v-if="mission.next">
                <div class="flex justify-between text-xs"><span>当前 {{ formatNumber(mission.progress) }}</span><span>下一级 {{ formatNumber(mission.next.requirement) }}</span></div>
                <progress class="progress progress-primary w-full h-2" :value="mission.progress" :max="mission.next.requirement || 1"></progress>
                <p class="text-xs text-base-content/55">还差 <strong class="text-base-content">{{ formatNumber(mission.remaining) }}</strong> · 已领取 {{ mission.received }}<template v-if="!mission.isEx"> / {{ mission.total }}</template> 级</p>
              </template>
              <p v-else class="text-xs text-success">已领取全部 {{ mission.total }} 级里程碑</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
