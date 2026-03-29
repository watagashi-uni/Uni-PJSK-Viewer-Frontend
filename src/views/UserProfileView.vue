<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useAccountStore } from '@/stores/account'
import { useSettingsStore } from '@/stores/settings'
import AccountSelector from '@/components/AccountSelector.vue'
import ProfileHeader from '@/components/UserProfile/ProfileHeader.vue'
import ProfileDeck from '@/components/UserProfile/ProfileDeck.vue'
import ProfileCharacterRank from '@/components/UserProfile/ProfileCharacterRank.vue'
import ProfileAdvancedData from '@/components/UserProfile/ProfileAdvancedData.vue'
import {
  User, Download, Upload, Plus, Trash2, RefreshCw, Star, Zap, Trophy, Music, CircleHelp
} from 'lucide-vue-next'
import type {
  ProfileTabKey, UnitKey, AttrKey, ProfileData, CardInfo,
  GameCharacterUnit, GameCharacter, CharacterMissionV2, CharacterMissionV2Status,
  CharacterMissionV2ParameterGroup, ChallengeLiveHighScoreRewardRow,
  ResourceBoxRow, AreaItemLevelMasterRow, CharacterRankRow,
  MysekaiGateLevelRow, BondMasterRow, LevelMasterRow, BondsHonorMasterRow,
  ChallengeRow, PowerBonusRow, UnitBonusRow, AttrBonusRow, PowerBonusCharacterView,
  PowerBonusUnitView, PowerBonusAttrView, PowerBonusCharacterGroupView, BondViewRow,
  LeaderCountRow
} from '@/types/profile'

const masterStore = useMasterStore()
const accountStore = useAccountStore()
const settingsStore = useSettingsStore()
const assetsHost = computed(() => settingsStore.assetsHost)

const difficultyColors: Record<string, string> = {
  easy: 'bg-success text-success-content',
  normal: 'bg-info text-info-content',
  hard: 'bg-warning text-warning-content',
  expert: 'bg-error text-error-content',
  master: 'diff-master',
  append: 'diff-append',
}

const difficultyOrder = ['easy', 'normal', 'hard', 'expert', 'master', 'append']
const CHALLENGE_RESOURCE_BOX_PURPOSE = 'challenge_live_high_score'
const profileTabs: Array<{ key: ProfileTabKey; label: string }> = [
  { key: 'basic', label: '基本Profile' },
  { key: 'challenge', label: '挑战信息' },
  { key: 'bonus', label: '加成信息' },
  { key: 'bonds', label: '牵绊等级' },
  { key: 'leader', label: '队长次数' },
]

const unitOrder: UnitKey[] = ['light_sound', 'idol', 'street', 'theme_park', 'school_refusal', 'piapro']
const attrOrder: AttrKey[] = ['cool', 'cute', 'happy', 'mysterious', 'pure']
const unitLabelMap: Record<UnitKey, string> = {
  light_sound: 'Leo/need',
  idol: 'MORE MORE JUMP!',
  street: 'Vivid BAD SQUAD',
  theme_park: 'Wonderlands x Showtime',
  school_refusal: '25时、Nightcord见。',
  piapro: 'VIRTUAL SINGER',
}

const unitColorMap: Record<UnitKey, string> = {
  light_sound: '#4455dd',
  idol: '#88dd44',
  street: '#ee1166',
  theme_park: '#ff9900',
  school_refusal: '#884499',
  piapro: '#00bfbf',
}

const unitLogoMap: Record<UnitKey, string> = {
  light_sound: '/img/logo/logo_light_sound.png',
  idol: '/img/logo/logo_idol.png',
  street: '/img/logo/logo_street.png',
  theme_park: '/img/logo/logo_theme_park.png',
  school_refusal: '/img/logo/logo_school_refusal.png',
  piapro: '/img/logo/logo_piapro.png',
}

const suiteKeyMap = {
  challengeResults: ['userChallengeLiveSoloResults', 'user_challenge_live_solo_results'],
  challengeStages: ['userChallengeLiveSoloStages', 'user_challenge_live_solo_stages'],
  challengeRewardClaims: ['userChallengeLiveSoloHighScoreRewards', 'user_challenge_live_solo_high_score_rewards'],
  userAreas: ['userAreas', 'user_areas'],
  userCharacters: ['userCharacters', 'user_characters'],
  fixtureBonuses: ['userMysekaiFixtureGameCharacterPerformanceBonuses', 'user_mysekai_fixture_game_character_performance_bonuses'],
  userGates: ['userMysekaiGates', 'user_mysekai_gates'],
  userBonds: ['userBonds', 'user_bonds'],
  leaderMissions: ['userCharacterMissionV2s', 'user_character_mission_v2s'],
  leaderStatuses: ['userCharacterMissionV2Statuses', 'user_character_mission_v2_statuses'],
}

const accounts = computed(() => accountStore.accounts)
const currentUserId = computed(() => accountStore.currentUserId)
const profileData = ref<ProfileData | null>(null)
const isLoading = ref(false)
const isInitLoading = ref(true)
const errorMsg = ref('')
const newUserIdInput = ref('')
const showUserId = ref(true)
const characterTab = ref<'rank' | 'stage'>('rank')
const infoModalRef = ref<HTMLDialogElement | null>(null)
const profileTab = ref<ProfileTabKey>('basic')
const bondCharacterFilter = ref(0)

const allCards = ref<CardInfo[]>([])
const gameCharacterUnits = ref<GameCharacterUnit[]>([])
const gameCharacters = ref<GameCharacter[]>([])
const characterMissionV2ParameterGroups = ref<CharacterMissionV2ParameterGroup[]>([])
const challengeLiveHighScoreRewards = ref<ChallengeLiveHighScoreRewardRow[]>([])
const resourceBoxes = ref<ResourceBoxRow[]>([])
const areaItemLevels = ref<AreaItemLevelMasterRow[]>([])
const characterRanks = ref<CharacterRankRow[]>([])
const mysekaiGateLevels = ref<MysekaiGateLevelRow[]>([])
const bonds = ref<BondMasterRow[]>([])
const levels = ref<LevelMasterRow[]>([])
const bondsHonors = ref<BondsHonorMasterRow[]>([])

const currentProfileTabLabel = computed(() =>
  profileTabs.find(item => item.key === profileTab.value)?.label || '进阶信息')

const suiteData = computed<any | null>(() => {
  if (!currentUserId.value) return null
  return accountStore.getSuiteCache(currentUserId.value)
})

function getNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getArrayByKeys<T = any>(source: any, keys: string[]): T[] {
  if (!source || typeof source !== 'object') return []
  const containers = [
    source,
    source.updatedResources,
    source.updated_resources,
  ].filter(item => item && typeof item === 'object')
  for (const container of containers) {
    for (const key of keys) {
      const val = (container as any)[key]
      if (Array.isArray(val)) return val as T[]
    }
  }
  return []
}

function hasArrayByKeys(source: any, keys: string[]): boolean {
  if (!source || typeof source !== 'object') return false
  const containers = [
    source,
    source.updatedResources,
    source.updated_resources,
  ].filter(item => item && typeof item === 'object')
  return containers.some(container => keys.some(key => Array.isArray((container as any)[key])))
}

function getCharaUnit(characterId: number): UnitKey {
  if (characterId >= 21) return 'piapro'
  const unitMap: Record<number, UnitKey> = {
    1: 'light_sound', 2: 'light_sound', 3: 'light_sound', 4: 'light_sound',
    5: 'idol', 6: 'idol', 7: 'idol', 8: 'idol',
    9: 'street', 10: 'street', 11: 'street', 12: 'street',
    13: 'theme_park', 14: 'theme_park', 15: 'theme_park', 16: 'theme_park',
    17: 'school_refusal', 18: 'school_refusal', 19: 'school_refusal', 20: 'school_refusal',
  }
  return unitMap[characterId] || 'piapro'
}

function getCharaPillColor(characterId: number): string {
  return unitColorMap[getCharaUnit(characterId)] || '#00bfbf'
}

function getLeaderProgressColor(playCount: number): string {
  if (playCount > 50000) return '#64ff64'
  if (playCount > 40000) return '#ffff64'
  if (playCount > 30000) return '#ffc864'
  if (playCount > 20000) return '#ff9664'
  if (playCount > 10000) return '#ff6464'
  return '#ff3232'
}

function getChallengeProgressColor(score: number): string {
  if (score > 2500000) return '#64ff64'
  if (score > 2000000) return '#ffff64'
  if (score > 1500000) return '#ffc864'
  if (score > 1000000) return '#ff9664'
  if (score > 500000) return '#ff6464'
  return '#ff3232'
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function getUnitLogo(unit: UnitKey): string {
  return unitLogoMap[unit]
}

function getAttrIcon(attr: string): string {
  return `/newcard/attr_icon_${attr}.png`
}

function loadAccounts() {
  // accountStore already initialized in App.vue
}

function saveAccounts() {
  accountStore.save()
}

function loadProfileData() {
  if (!currentUserId.value) {
    profileData.value = null
    return
  }
  profileData.value = accountStore.getProfileCache(currentUserId.value)
}

async function fetchProfile(userId: string): Promise<ProfileData> {
  const data = await accountStore.refreshProfile(userId)
  return data
}

async function addAccount() {
  const uid = newUserIdInput.value.trim()
  if (!uid) {
    errorMsg.value = '请输入用户ID'
    return
  }
  if (accounts.value.some(a => a.userId === uid)) {
    errorMsg.value = '该账号已添加'
    return
  }

  isLoading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchProfile(uid)
    accountStore.addAccount({ userId: uid, name: data.user.name, lastRefresh: Date.now() })
    profileData.value = data
    await accountStore.selectAccount(uid)
    newUserIdInput.value = ''
  } catch (e: any) {
    errorMsg.value = e.message || '获取数据失败'
  } finally {
    isLoading.value = false
  }
}

async function refreshProfile() {
  if (!currentUserId.value) return
  isLoading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchProfile(currentUserId.value)
    profileData.value = data
  } catch (e: any) {
    errorMsg.value = e.message || '刷新失败'
  } finally {
    isLoading.value = false
  }
}

async function switchAccount(userId: string) {
  await accountStore.selectAccount(userId)
  loadProfileData()
  showUserId.value = false
}

function deleteAccount(userId: string) {
  accountStore.removeAccount(userId)
  loadProfileData()
}

function openAccountInfoModal() {
  infoModalRef.value?.showModal()
}

function exportAccounts() {
  const exportData: Record<string, any> = {}
  for (const acc of accounts.value) {
    const raw = accountStore.getProfileCache(acc.userId)
    exportData[acc.userId] = {
      account: acc,
      profile: raw || null,
    }
  }
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sekai_profiles_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importAccounts() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      for (const [userId, entry] of Object.entries(data) as [string, any][]) {
        if (!accounts.value.some(a => a.userId === userId)) {
          accountStore.addAccount(entry.account)
        }
        if (entry.profile) {
          await accountStore.saveProfileCache(userId, entry.profile)
        }
      }
      saveAccounts()
      if (!currentUserId.value && accounts.value.length > 0) {
        await accountStore.selectAccount(accounts.value[0]!.userId)
        loadProfileData()
      }
    } catch {
      errorMsg.value = '导入失败：文件格式不正确'
    }
  }
  input.click()
}

const charaNameByGameCharacterId = computed(() => {
  const map = new Map<number, string>()
  for (const chara of gameCharacters.value) {
    const id = Number(chara.id)
    if (!Number.isFinite(id)) continue
    map.set(id, `${chara.firstName || ''}${chara.givenName}`)
  }
  return map
})

const gameCharacterIdByUnitId = computed(() => {
  const map = new Map<number, number>()
  for (const unit of gameCharacterUnits.value) {
    const unitId = Number(unit.id)
    const gameCharacterId = Number(unit.gameCharacterId)
    if (!Number.isFinite(unitId) || !Number.isFinite(gameCharacterId)) continue
    map.set(unitId, gameCharacterId)
  }
  return map
})

function getCharaName(characterId: number): string {
  const normalizedId = Number(characterId)
  if (!Number.isFinite(normalizedId)) return String(characterId)

  const direct = charaNameByGameCharacterId.value.get(normalizedId)
  if (direct) return direct

  const mappedGameCharacterId = gameCharacterIdByUnitId.value.get(normalizedId)
  if (mappedGameCharacterId) {
    const mapped = charaNameByGameCharacterId.value.get(mappedGameCharacterId)
    if (mapped) return mapped
  }

  return `角色 ${normalizedId}`
}

function getCharaIcon(characterId: number): string {
  const unit = gameCharacterUnits.value.find(u => u.gameCharacterId === characterId && u.id <= 26)
  const unitId = unit?.id || characterId
  if (unitId <= 20) return `/img/chr_ts/chr_ts_90_${unitId}.png`
  if (characterId === 21) {
    return unitId === 21 ? '/img/chr_ts/chr_ts_90_21.png' : `/img/chr_ts/chr_ts_90_21_${unitId - 25}.png`
  }
  return `/img/chr_ts/chr_ts_90_${characterId}_2.png`
}

const lastRefreshText = computed(() => {
  const acc = accountStore.currentAccount
  if (!acc?.lastRefresh) return ''
  return new Date(acc.lastRefresh).toLocaleString('zh-CN')
})

const suiteUploadTimeText = computed(() => accountStore.uploadTimeText)

const suiteChallengeResults = computed(() => getArrayByKeys<any>(suiteData.value, suiteKeyMap.challengeResults))
const suiteChallengeStages = computed(() => getArrayByKeys<any>(suiteData.value, suiteKeyMap.challengeStages))
const suiteChallengeRewardClaims = computed(() => getArrayByKeys<any>(suiteData.value, suiteKeyMap.challengeRewardClaims))
const suiteUserAreas = computed(() => getArrayByKeys<any>(suiteData.value, suiteKeyMap.userAreas))
const suiteUserCharacters = computed(() => getArrayByKeys<any>(suiteData.value, suiteKeyMap.userCharacters))
const suiteFixtureBonuses = computed(() => getArrayByKeys<any>(suiteData.value, suiteKeyMap.fixtureBonuses))
const suiteUserGates = computed(() => getArrayByKeys<any>(suiteData.value, suiteKeyMap.userGates))
const suiteUserBonds = computed(() => getArrayByKeys<any>(suiteData.value, suiteKeyMap.userBonds))
const suiteLeaderMissions = computed(() => getArrayByKeys<CharacterMissionV2>(suiteData.value, suiteKeyMap.leaderMissions))
const suiteLeaderStatuses = computed(() => getArrayByKeys<CharacterMissionV2Status>(suiteData.value, suiteKeyMap.leaderStatuses))

const hasChallengeSuiteData = computed(() =>
  hasArrayByKeys(suiteData.value, suiteKeyMap.challengeResults) &&
  hasArrayByKeys(suiteData.value, suiteKeyMap.challengeStages) &&
  hasArrayByKeys(suiteData.value, suiteKeyMap.challengeRewardClaims))

const hasBonusSuiteData = computed(() =>
  hasArrayByKeys(suiteData.value, suiteKeyMap.userAreas))

const hasBondsSuiteData = computed(() =>
  hasArrayByKeys(suiteData.value, suiteKeyMap.userBonds) &&
  hasArrayByKeys(suiteData.value, suiteKeyMap.userCharacters))

const hasLeaderCountData = computed(() =>
  hasArrayByKeys(suiteData.value, suiteKeyMap.leaderMissions) &&
  hasArrayByKeys(suiteData.value, suiteKeyMap.leaderStatuses))

const leaderCountMaxPlayCount = computed(() => {
  const groups = characterMissionV2ParameterGroups.value
    .filter(item => Number(item.id) === 1)
    .map(item => Number(item.requirement))
    .filter(value => Number.isFinite(value))
  return groups.length > 0 ? Math.max(...groups) : 0
})

const leaderCountRows = computed<LeaderCountRow[]>(() => {
  const missions = suiteLeaderMissions.value
  const statuses = suiteLeaderStatuses.value
  const maxPlayCount = leaderCountMaxPlayCount.value

  const exSeqPlayCountList = characterMissionV2ParameterGroups.value
    .filter(item => Number(item.id) === 101)
    .map(item => ({
      seq: Number(item.seq),
      requirement: Number(item.requirement),
    }))
    .filter(item => Number.isFinite(item.seq) && Number.isFinite(item.requirement))
    .sort((a, b) => a.seq - b.seq)

  function getExRequirementBySeq(seq: number): number {
    let requirement = 0
    for (const item of exSeqPlayCountList) {
      if (item.seq > seq) break
      requirement = item.requirement
    }
    return requirement
  }

  const playCounts = new Map<number, number>()
  const exCounts = new Map<number, number>()
  const exLevels = new Map<number, number>()

  for (const item of missions) {
    const cid = getNumber(item.characterId, NaN)
    const progress = getNumber(item.progress, NaN)
    if (!Number.isFinite(cid) || !Number.isFinite(progress)) continue
    if (item.characterMissionType === 'play_live') {
      playCounts.set(cid, progress)
    } else if (item.characterMissionType === 'play_live_ex') {
      exCounts.set(cid, progress)
      exLevels.set(cid, 0)
    }
  }

  for (const status of statuses) {
    if (getNumber(status.parameterGroupId) !== 101) continue
    const cid = getNumber(status.characterId, NaN)
    const seq = getNumber(status.seq, NaN)
    if (!Number.isFinite(cid) || !Number.isFinite(seq)) continue
    exLevels.set(cid, Math.max(exLevels.get(cid) ?? 0, seq))
    exCounts.set(cid, (exCounts.get(cid) ?? 0) + getExRequirementBySeq(seq))
  }

  const rows: LeaderCountRow[] = []
  for (let cid = 1; cid <= 26; cid += 1) {
    const playCount = playCounts.has(cid) ? (playCounts.get(cid) ?? 0) : null
    rows.push({
      characterId: cid,
      playCount,
      exLevel: exLevels.has(cid) ? (exLevels.get(cid) ?? 0) : null,
      exCount: exCounts.has(cid) ? (exCounts.get(cid) ?? 0) : null,
      progress: playCount !== null && maxPlayCount > 0
        ? Math.max(0, Math.min(playCount / maxPlayCount, 1))
        : 0,
    })
  }
  return rows
})

const leaderCountSummary = computed(() => {
  const rows = leaderCountRows.value
  const availableRows = rows.filter(row => row.playCount !== null)
  const totalPlayCount = availableRows.reduce((sum, row) => sum + (row.playCount ?? 0), 0)
  const totalExCount = rows.reduce((sum, row) => sum + (row.exCount ?? 0), 0)
  const maxPlayCount = availableRows.length > 0
    ? Math.max(...availableRows.map(row => row.playCount ?? 0))
    : 0
  return {
    availableRows: availableRows.length,
    totalPlayCount,
    totalExCount,
    maxPlayCount,
  }
})

const challengeMaxScore = computed(() => {
  const rows = challengeLiveHighScoreRewards.value.map(item => getNumber(item.highScore))
  return rows.length > 0 ? Math.max(...rows) : 1
})

const challengeRewardById = computed(() => {
  const map = new Map<number, ChallengeLiveHighScoreRewardRow>()
  for (const row of challengeLiveHighScoreRewards.value) {
    map.set(getNumber(row.id), row)
  }
  return map
})

const resourceBoxByPurposeAndId = computed(() => {
  const map = new Map<string, ResourceBoxRow>()
  for (const box of resourceBoxes.value) {
    const id = getNumber(box.id, NaN)
    if (!Number.isFinite(id)) continue
    const purpose = String((box as any).resourceBoxPurpose ?? '')
    if (!purpose) continue
    map.set(`${purpose}_${id}`, box)
  }
  return map
})

const challengeResourceBoxById = computed(() => {
  const map = new Map<number, ResourceBoxRow>()
  for (const box of resourceBoxes.value) {
    const id = getNumber(box.id, NaN)
    const purpose = String((box as any).resourceBoxPurpose ?? '')
    if (!Number.isFinite(id) || purpose !== CHALLENGE_RESOURCE_BOX_PURPOSE) continue
    if (!map.has(id)) map.set(id, box)
  }
  return map
})

const resourceBoxByIdFallback = computed(() => {
  const map = new Map<number, ResourceBoxRow>()
  for (const box of resourceBoxes.value) {
    const id = getNumber(box.id, NaN)
    if (!Number.isFinite(id) || map.has(id)) continue
    map.set(id, box)
  }
  return map
})

const challengeRows = computed<ChallengeRow[]>(() => {
  const resultByCid = new Map<number, number>()
  const rankByCid = new Map<number, number>()
  const completedByCid = new Map<number, Set<number>>()
  const maxScore = challengeMaxScore.value

  for (const row of suiteChallengeResults.value) {
    const cid = getNumber(row.characterId, NaN)
    const score = getNumber(row.highScore)
    if (!Number.isFinite(cid)) continue
    resultByCid.set(cid, score)
  }

  for (const row of suiteChallengeStages.value) {
    const cid = getNumber(row.characterId, NaN)
    const rank = getNumber(row.rank)
    if (!Number.isFinite(cid)) continue
    rankByCid.set(cid, Math.max(rankByCid.get(cid) ?? 0, rank))
  }

  for (const row of suiteChallengeRewardClaims.value) {
    const rewardId = getNumber(row.challengeLiveHighScoreRewardId ?? row.challenge_live_high_score_reward_id, NaN)
    if (!Number.isFinite(rewardId)) continue
    let cid = getNumber(row.characterId ?? row.gameCharacterId ?? row.challengeLiveCharacterId, NaN)
    if (!Number.isFinite(cid)) {
      const reward = challengeRewardById.value.get(rewardId)
      cid = getNumber(reward?.characterId, NaN)
    }
    if (!Number.isFinite(cid)) continue
    const set = completedByCid.get(cid) ?? new Set<number>()
    set.add(rewardId)
    completedByCid.set(cid, set)
  }

  const rows: ChallengeRow[] = []
  for (let cid = 1; cid <= 26; cid += 1) {
    let remainJewel = 0
    let remainFragment = 0
    const completed = completedByCid.get(cid) ?? new Set<number>()

    for (const reward of challengeLiveHighScoreRewards.value) {
      if (getNumber(reward.characterId) !== cid) continue
      if (completed.has(getNumber(reward.id))) continue
      const boxId = getNumber(reward.resourceBoxId, NaN)
      if (!Number.isFinite(boxId)) continue
      const box =
        challengeResourceBoxById.value.get(boxId) ??
        resourceBoxByPurposeAndId.value.get(`${CHALLENGE_RESOURCE_BOX_PURPOSE}_${boxId}`) ??
        resourceBoxByIdFallback.value.get(boxId)
      for (const detail of box?.details ?? []) {
        const resourceType = String((detail as any).resourceType ?? (detail as any).resource_type ?? '')
        const quantity = getNumber((detail as any).resourceQuantity ?? (detail as any).resource_quantity)
        const resourceId = getNumber((detail as any).resourceId ?? (detail as any).resource_id, NaN)
        if (resourceType === 'jewel') {
          remainJewel += quantity
        } else if (resourceType === 'material' && resourceId === 15) {
          remainFragment += quantity
        }
      }
    }

    const score = resultByCid.get(cid) ?? 0
    rows.push({
      characterId: cid,
      rank: rankByCid.get(cid) ?? 0,
      highScore: score,
      remainJewel,
      remainFragment,
      progress: maxScore > 0 ? Math.max(0, Math.min(score / maxScore, 1)) : 0,
    })
  }
  return rows
})

const challengeSummary = computed(() => {
  const totalJewel = challengeRows.value.reduce((sum, row) => sum + row.remainJewel, 0)
  const totalFragment = challengeRows.value.reduce((sum, row) => sum + row.remainFragment, 0)
  return {
    totalJewel,
    totalFragment,
  }
})

const areaItemLevelByKey = computed(() => {
  const map = new Map<string, AreaItemLevelMasterRow>()
  for (const row of areaItemLevels.value) {
    map.set(`${getNumber(row.areaItemId)}_${getNumber(row.level)}`, row)
  }
  return map
})

const userCharacterRankMap = computed(() => {
  const map = new Map<number, number>()
  for (const item of suiteUserCharacters.value) {
    const cid = getNumber(item.characterId, NaN)
    const rank = getNumber(item.characterRank)
    if (!Number.isFinite(cid)) continue
    map.set(cid, rank)
  }
  if (map.size === 0) {
    for (const item of profileData.value?.userCharacters ?? []) {
      map.set(getNumber(item.characterId), getNumber(item.characterRank))
    }
  }
  return map
})

const powerBonusCharacterRows = computed<PowerBonusCharacterView[]>(() => {
  const charaMap = new Map<number, PowerBonusRow>()
  for (let cid = 1; cid <= 26; cid += 1) {
    charaMap.set(cid, { areaItem: 0, rank: 0, fixture: 0, total: 0 })
  }

  for (const area of suiteUserAreas.value) {
    for (const areaItem of area.areaItems ?? []) {
      const itemId = getNumber(areaItem.areaItemId, NaN)
      const lv = getNumber(areaItem.level)
      if (!Number.isFinite(itemId)) continue
      const row = areaItemLevelByKey.value.get(`${itemId}_${lv}`)
      if (!row) continue
      const targetCid = getNumber(row.targetGameCharacterId, NaN)
      if (Number.isFinite(targetCid) && targetCid > 0) {
        const bonus = charaMap.get(targetCid)
        if (bonus) bonus.areaItem += getNumber(row.power1BonusRate)
      }
    }
  }

  for (const [cid, rank] of userCharacterRankMap.value.entries()) {
    const rankRow = characterRanks.value.find(item =>
      getNumber(item.characterId) === cid && getNumber(item.characterRank) === rank)
    if (!rankRow) continue
    const bonus = charaMap.get(cid)
    if (!bonus) continue
    bonus.rank += getNumber(rankRow.power1BonusRate)
  }

  for (const item of suiteFixtureBonuses.value) {
    const cid = getNumber(item.gameCharacterId, NaN)
    if (!Number.isFinite(cid)) continue
    const bonus = charaMap.get(cid)
    if (!bonus) continue
    bonus.fixture += getNumber(item.totalBonusRate) * 0.1
  }

  const rows: PowerBonusCharacterView[] = []
  for (let cid = 1; cid <= 26; cid += 1) {
    const bonus = charaMap.get(cid) ?? { areaItem: 0, rank: 0, fixture: 0, total: 0 }
    bonus.total = bonus.areaItem + bonus.rank + bonus.fixture
    rows.push({ characterId: cid, ...bonus })
  }
  return rows
})

const powerBonusUnitRows = computed<PowerBonusUnitView[]>(() => {
  const unitMap = new Map<UnitKey, UnitBonusRow>()
  for (const unit of unitOrder) {
    unitMap.set(unit, { areaItem: 0, gate: 0, total: 0 })
  }

  for (const area of suiteUserAreas.value) {
    for (const areaItem of area.areaItems ?? []) {
      const itemId = getNumber(areaItem.areaItemId, NaN)
      const lv = getNumber(areaItem.level)
      if (!Number.isFinite(itemId)) continue
      const row = areaItemLevelByKey.value.get(`${itemId}_${lv}`)
      if (!row) continue
      const targetUnit = String(row.targetUnit ?? 'any') as UnitKey | 'any'
      if (targetUnit !== 'any' && unitMap.has(targetUnit)) {
        const bonus = unitMap.get(targetUnit)!
        bonus.areaItem += getNumber(row.power1BonusRate)
      }
    }
  }

  let maxGateBonus = 0
  for (const gate of suiteUserGates.value) {
    const gateId = getNumber(gate.mysekaiGateId, NaN)
    const gateLevel = getNumber(gate.mysekaiGateLevel)
    if (!Number.isFinite(gateId)) continue
    const gateRow = mysekaiGateLevels.value.find(item =>
      getNumber(item.mysekaiGateId) === gateId && getNumber(item.level) === gateLevel)
    if (!gateRow) continue
    const bonusRate = getNumber(gateRow.powerBonusRate)
    maxGateBonus = Math.max(maxGateBonus, bonusRate)
    const unit = unitOrder[Math.max(0, gateId - 1)]
    if (!unit || !unitMap.has(unit)) continue
    unitMap.get(unit)!.gate += bonusRate
  }
  unitMap.get('piapro')!.gate += maxGateBonus

  return unitOrder.map(unit => {
    const row = unitMap.get(unit)!
    row.total = row.areaItem + row.gate
    return { unit, ...row }
  })
})

const powerBonusAttrRows = computed<PowerBonusAttrView[]>(() => {
  const attrMap = new Map<AttrKey, AttrBonusRow>()
  for (const attr of attrOrder) {
    attrMap.set(attr, { areaItem: 0, total: 0 })
  }
  for (const area of suiteUserAreas.value) {
    for (const areaItem of area.areaItems ?? []) {
      const itemId = getNumber(areaItem.areaItemId, NaN)
      const lv = getNumber(areaItem.level)
      if (!Number.isFinite(itemId)) continue
      const row = areaItemLevelByKey.value.get(`${itemId}_${lv}`)
      if (!row) continue
      const attr = String(row.targetCardAttr ?? 'any') as AttrKey | 'any'
      if (attr !== 'any' && attrMap.has(attr)) {
        const bonus = attrMap.get(attr)!
        bonus.areaItem += getNumber(row.power1BonusRate)
      }
    }
  }
  return attrOrder.map(attr => {
    const row = attrMap.get(attr)!
    row.total = row.areaItem
    return { attr, ...row }
  })
})

const powerBonusCharacterGroupRows = computed<PowerBonusCharacterGroupView[]>(() => {
  const grouped = new Map<UnitKey, PowerBonusCharacterView[]>()
  for (const unit of unitOrder) {
    grouped.set(unit, [])
  }
  for (const row of powerBonusCharacterRows.value) {
    const unit = getCharaUnit(row.characterId)
    grouped.get(unit)?.push(row)
  }
  return unitOrder.map(unit => ({
    unit,
    rows: grouped.get(unit) ?? [],
  }))
})

const bondCharacterOptions = computed(() => [
  { id: 0, name: 'Top25 总览' },
  ...Array.from({ length: 26 }, (_, idx) => {
    const id = idx + 1
    return { id, name: getCharaName(id) }
  }),
])

const bondMaxLevel = computed(() => {
  const levelRows = levels.value
    .filter(item => item.levelType === 'bonds')
    .map(item => getNumber(item.level))
  return levelRows.length > 0 ? Math.max(...levelRows) : 0
})

const bondTotalExpByLevel = computed(() => {
  const map = new Map<number, number>()
  for (const row of levels.value) {
    if (row.levelType !== 'bonds') continue
    map.set(getNumber(row.level), getNumber(row.totalExp))
  }
  return map
})

const bondHonorByGroupId = computed(() => {
  const map = new Map<number, BondsHonorMasterRow[]>()
  for (const row of bondsHonors.value) {
    const groupId = getNumber(row.bondsGroupId, NaN)
    if (!Number.isFinite(groupId)) continue
    const list = map.get(groupId) ?? []
    list.push(row)
    map.set(groupId, list)
  }
  for (const [groupId, list] of map.entries()) {
    const sorted = [...list].sort((a, b) => getNumber(a.id) - getNumber(b.id))
    map.set(groupId, sorted)
  }
  return map
})

function getBondHonorRequiredRank(desc: unknown): number | null {
  const text = String(desc ?? '')
  if (!text) return null
  const nums = text.match(/\d+/g)
  if (!nums || nums.length === 0) return null
  const value = Number(nums[nums.length - 1])
  return Number.isFinite(value) ? value : null
}

const bondRows = computed<BondViewRow[]>(() => {
  const bondRankMap = new Map<number, { rank: number; exp: number }>()
  for (const row of suiteUserBonds.value) {
    const groupId = getNumber(row.bondsGroupId ?? row.bondGroupId, NaN)
    if (!Number.isFinite(groupId)) continue
    bondRankMap.set(groupId, {
      rank: getNumber(row.rank),
      exp: getNumber(row.exp),
    })
  }

  const rankMap = userCharacterRankMap.value
  const allBondPairs: Array<{ groupId: number; c1: number; c2: number }> = []
  const pairDedup = new Set<string>()
  const unitToGameMap = gameCharacterIdByUnitId.value

  const normalizeBondCharacterId = (value: number): number => {
    if (!Number.isFinite(value) || value <= 0) return value
    if (value > 26 && unitToGameMap.has(value)) {
      return unitToGameMap.get(value) ?? value
    }
    return value
  }

  for (const row of bonds.value) {
    const groupId = getNumber(row.groupId, NaN)
    if (!Number.isFinite(groupId)) continue
    const rawC1 = getNumber(row.characterId1, Math.floor(groupId / 100) % 100)
    const rawC2 = getNumber(row.characterId2, groupId % 100)
    const c1 = normalizeBondCharacterId(rawC1)
    const c2 = normalizeBondCharacterId(rawC2)
    if (c1 <= 0 || c2 <= 0) continue
    const k1 = Math.min(c1, c2)
    const k2 = Math.max(c1, c2)
    const dedupKey = `${groupId}_${k1}_${k2}`
    if (pairDedup.has(dedupKey)) continue
    pairDedup.add(dedupKey)
    allBondPairs.push({ groupId, c1, c2 })
  }

  let selectedPairs = allBondPairs
  if (bondCharacterFilter.value > 0) {
    selectedPairs = allBondPairs.filter(pair => pair.c1 === bondCharacterFilter.value || pair.c2 === bondCharacterFilter.value)
      .map(pair => pair.c1 === bondCharacterFilter.value ? pair : { ...pair, c1: pair.c2, c2: pair.c1 })
      .sort((a, b) => a.c2 - b.c2)
  } else {
    selectedPairs = [...allBondPairs]
      .sort((a, b) => (bondRankMap.get(b.groupId)?.rank ?? 0) - (bondRankMap.get(a.groupId)?.rank ?? 0))
      .slice(0, 25)
      .map(pair => {
        const rank1 = rankMap.get(pair.c1) ?? 0
        const rank2 = rankMap.get(pair.c2) ?? 0
        return rank1 >= rank2 ? pair : { ...pair, c1: pair.c2, c2: pair.c1 }
      })
  }

  const maxLevel = bondMaxLevel.value
  return selectedPairs.map(pair => {
    const rank1 = rankMap.get(pair.c1) ?? 0
    const rank2 = rankMap.get(pair.c2) ?? 0
    const bondData = bondRankMap.get(pair.groupId)
    const level = bondData?.rank ?? 0
    const exp = bondData?.exp ?? 0

    let needExpText = '-'
    if (bondData) {
      if (level >= maxLevel) {
        needExpText = 'MAX'
      } else {
        const currentTotal = bondTotalExpByLevel.value.get(level) ?? 0
        const nextTotal = bondTotalExpByLevel.value.get(level + 1) ?? currentTotal
        const levelNeed = Math.max(0, nextTotal - currentTotal - exp)
        needExpText = String(levelNeed)
      }
    }

    const groupHonors = bondHonorByGroupId.value.get(pair.groupId) ?? []
    let honorId: number | null = null
    let honorLevel = 0
    if (level > 0 && groupHonors.length > 0) {
      const honorProgress = groupHonors.map(honor => {
        const levels = Array.isArray(honor.levels) ? honor.levels : []
        const unlockThreshold = levels.length > 0
          ? (getBondHonorRequiredRank(levels[0]?.description) ?? Number.MAX_SAFE_INTEGER)
          : Number.MAX_SAFE_INTEGER
        const unlockedCount = levels.reduce((count, item) => {
          const required = getBondHonorRequiredRank(item.description)
          return required !== null && level >= required ? count + 1 : count
        }, 0)
        return {
          honorId: getNumber(honor.id),
          unlockThreshold,
          unlockedCount,
        }
      })
      const available = honorProgress
        .filter(item => item.unlockedCount > 0)
        .sort((a, b) => a.unlockThreshold - b.unlockThreshold)
      const selected = available[available.length - 1]
      if (selected) {
        honorId = selected.honorId
        honorLevel = selected.unlockedCount
      }
    }

    return {
      c1: pair.c1,
      c2: pair.c2,
      rank1,
      rank2,
      bondLevel: level,
      needExpText,
      progress: maxLevel > 0 ? Math.max(0, Math.min(level / maxLevel, 1)) : 0,
      capBlocked: bondData ? (Math.min(rank1, rank2) <= level && level < maxLevel) : false,
      honorId,
      honorLevel,
    }
  })
})

const challengeCharaIcon = computed(() => {
  if (!profileData.value?.userChallengeLiveSoloResult) return ''
  return getCharaIcon(profileData.value.userChallengeLiveSoloResult.characterId)
})

const characterRows = computed(() => {
  if (!profileData.value) return []
  const chars = profileData.value.userCharacters
  const rows: Array<Array<{ characterId: number; value: number }>> = []

  const vs1 = [21, 22, 23, 24]
    .map(id => {
      const c = chars.find(ch => ch.characterId === id)
      if (!c) return null
      return { characterId: id, value: characterTab.value === 'rank' ? c.characterRank : getMaxStage(id) }
    })
    .filter(Boolean) as Array<{ characterId: number; value: number }>
  if (vs1.length > 0) rows.push(vs1)

  const vs2 = [25, 26]
    .map(id => {
      const c = chars.find(ch => ch.characterId === id)
      if (!c) return null
      return { characterId: id, value: characterTab.value === 'rank' ? c.characterRank : getMaxStage(id) }
    })
    .filter(Boolean) as Array<{ characterId: number; value: number }>
  if (vs2.length > 0) rows.push(vs2)

  for (let i = 1; i <= 20; i += 4) {
    const row: Array<{ characterId: number; value: number }> = []
    for (let j = i; j < i + 4 && j <= 20; j += 1) {
      const c = chars.find(ch => ch.characterId === j)
      if (!c) continue
      row.push({
        characterId: j,
        value: characterTab.value === 'rank' ? c.characterRank : getMaxStage(j),
      })
    }
    if (row.length > 0) rows.push(row)
  }
  return rows
})

const deckCards = computed(() => {
  if (!profileData.value) return []
  const deck = profileData.value.userDeck
  const memberIds = [deck.member1, deck.member2, deck.member3, deck.member4, deck.member5]
  return memberIds.map(cardId => {
    const userCard = profileData.value!.userCards.find(c => c.cardId === cardId)
    const masterCard = allCards.value.find(c => c.id === cardId)
    if (!masterCard) return null
    return {
      cardId,
      masterCard,
      userCard,
      trained: userCard?.specialTrainingStatus === 'done',
    }
  }).filter(Boolean) as Array<{
    cardId: number
    masterCard: CardInfo
    userCard: ProfileData['userCards'][0] | undefined
    trained: boolean
  }>
})

const sortedClearCounts = computed(() => {
  if (!profileData.value) return []
  return difficultyOrder
    .map(d => profileData.value!.userMusicDifficultyClearCount.find(c => c.musicDifficultyType === d))
    .filter(Boolean) as ProfileData['userMusicDifficultyClearCount']
})

function getMaxStage(characterId: number): number {
  if (!profileData.value) return 0
  const stages = (profileData.value.userChallengeLiveSoloStages || []).filter(s => s.characterId === characterId)
  if (stages.length === 0) return 0
  return Math.max(...stages.map(s => s.rank))
}

async function getFirstAvailableMaster<T = any>(names: string[]): Promise<T[]> {
  for (const name of names) {
    try {
      const data = await masterStore.getMaster<T>(name)
      if (Array.isArray(data) && data.length > 0) return data
    } catch {
      // try next name
    }
  }
  return []
}

onMounted(async () => {
  try {
    if (!masterStore.isReady) await masterStore.initialize()
    const [
      cardsData,
      unitsData,
      charactersData,
      missionParamGroups,
      challengeRewardRows,
      resourceBoxRows,
      areaItemLevelRows,
      characterRankRows,
      gateLevelRows,
      bondRowsMaster,
      levelRows,
      bondHonorRows,
    ] = await Promise.all([
      masterStore.getMaster<CardInfo>('cards'),
      masterStore.getMaster<GameCharacterUnit>('gameCharacterUnits'),
      masterStore.getMaster<GameCharacter>('gameCharacters'),
      getFirstAvailableMaster<CharacterMissionV2ParameterGroup>([
        'characterMissionV2ParameterGroups',
        'character_mission_v2_parameter_groups',
      ]),
      getFirstAvailableMaster<ChallengeLiveHighScoreRewardRow>([
        'challengeLiveHighScoreRewards',
        'challenge_live_high_score_rewards',
      ]),
      getFirstAvailableMaster<ResourceBoxRow>(['resourceBoxes', 'resource_boxes']),
      getFirstAvailableMaster<AreaItemLevelMasterRow>(['areaItemLevels', 'area_item_levels']),
      getFirstAvailableMaster<CharacterRankRow>(['characterRanks', 'character_ranks']),
      getFirstAvailableMaster<MysekaiGateLevelRow>(['mysekaiGateLevels', 'mysekai_gate_levels']),
      getFirstAvailableMaster<BondMasterRow>(['bonds']),
      getFirstAvailableMaster<LevelMasterRow>(['levels']),
      getFirstAvailableMaster<BondsHonorMasterRow>(['bondsHonors', 'bonds_honors']),
    ])

    allCards.value = cardsData
    gameCharacterUnits.value = unitsData
    gameCharacters.value = charactersData
    characterMissionV2ParameterGroups.value = missionParamGroups
    challengeLiveHighScoreRewards.value = challengeRewardRows
    resourceBoxes.value = resourceBoxRows
    areaItemLevels.value = areaItemLevelRows
    characterRanks.value = characterRankRows
    mysekaiGateLevels.value = gateLevelRows
    bonds.value = bondRowsMaster
    levels.value = levelRows
    bondsHonors.value = bondHonorRows
  } catch (e) {
    console.error('加载master数据失败:', e)
  }

  loadAccounts()
  const hasCurrentAccount = !!currentUserId.value && accounts.value.some(a => a.userId === currentUserId.value)
  if (!hasCurrentAccount && accounts.value.length > 0) {
    await accountStore.selectAccount(accounts.value[0]!.userId)
  }
  loadProfileData()
  isInitLoading.value = false
})

watch(currentUserId, async (newId) => {
  if (!newId) {
    profileData.value = null
    return
  }
  showUserId.value = false
  await accountStore.loadDataForUser(newId)
  loadProfileData()
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <h1 class="text-3xl font-bold flex items-center gap-3">
      <User class="w-8 h-8 text-primary" />
      用户档案
    </h1>

    <!-- 加载中 -->
    <div v-if="isInitLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else>
      <!-- ==================== 账号管理 ==================== -->
      <div class="card bg-base-100 shadow-lg overflow-visible relative z-30">
        <div class="card-body space-y-4">
          <!-- 添加账号 -->
          <div class="flex flex-wrap gap-2 items-end">
            <div class="form-control flex-1 min-w-[200px] max-w-sm">
              <label class="label"><span class="label-text font-medium">添加账号</span></label>
              <input
                v-model="newUserIdInput"
                type="text"
                placeholder="输入用户ID"
                class="input input-bordered w-full"
                @keyup.enter="addAccount"
              />
            </div>
            <button class="btn btn-primary" :disabled="isLoading" @click="addAccount">
              <Plus class="w-4 h-4" />
              添加
            </button>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMsg" class="alert alert-error py-2">
            <span class="text-sm">{{ errorMsg }}</span>
          </div>

          <!-- 已添加的账号列表 -->
          <div v-if="accounts.length > 0" class="flex flex-wrap gap-2 items-center">
            <div class="min-w-[200px] max-w-[280px]">
              <AccountSelector
                :model-value="currentUserId"
                :show-id="true"
                @update:model-value="switchAccount"
              />
            </div>
            <!-- 刷新 -->
            <button
              v-if="currentUserId"
              class="btn btn-sm btn-ghost gap-1"
              :disabled="isLoading"
              @click="refreshProfile"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
              刷新Profile
            </button>
            <!-- Suite 刷新 -->
            <button
              v-if="currentUserId"
              class="btn btn-sm btn-ghost gap-1"
              :disabled="accountStore.suiteRefreshing"
              @click="accountStore.refreshSuite(currentUserId)"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': accountStore.suiteRefreshing }" />
              刷新Suite
            </button>
            <!-- 删除 -->
            <button
              v-if="currentUserId"
              class="btn btn-sm btn-ghost text-error gap-1"
              @click="deleteAccount(currentUserId)"
            >
              <Trash2 class="w-3.5 h-3.5" />
              删除
            </button>
            <!-- 导出/导入 -->
            <button class="btn btn-sm btn-ghost gap-1" @click="exportAccounts">
              <Download class="w-3.5 h-3.5" />
              导出
            </button>
            <button class="btn btn-sm btn-ghost gap-1" @click="importAccounts">
              <Upload class="w-3.5 h-3.5" />
              导入
            </button>
            <button class="btn btn-sm btn-ghost gap-1" @click="openAccountInfoModal">
              <CircleHelp class="w-3.5 h-3.5" />
              账号信息说明
            </button>
          </div>

          <!-- 上次刷新时间 -->
          <p v-if="lastRefreshText" class="text-xs text-base-content/50">
            上次刷新: {{ lastRefreshText }}
            <template v-if="suiteUploadTimeText"> | Suite数据更新: {{ suiteUploadTimeText }}</template>
          </p>
        </div>
      </div>

      <dialog ref="infoModalRef" class="modal modal-bottom sm:modal-middle">
        <div class="modal-box max-w-3xl">
          <h3 class="text-lg font-semibold mb-3">账号信息说明</h3>
          <div class="space-y-3">
            <p class="text-sm text-base-content/70">当前仅支持日服 ID。</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-info/30 bg-info/10 p-4 space-y-2">
                <p class="text-sm font-medium text-info">公开基础数据（无需上传）</p>
                <p class="text-sm text-base-content/75">
                  添加账号后即可查看公开基础数据，例如卡组、角色等级、AP/FC 数量等。
                </p>
              </div>
              <div class="rounded-xl border border-base-300/70 bg-base-100/80 p-4 space-y-2">
                <p class="text-sm font-medium">Suite 详细数据（需上传）</p>
                <p class="text-sm text-base-content/70">
                  更详细数据（如完整打歌成绩、卡牌持有等）需要先上传到
                  <a
                    href="https://haruki.seiunx.com/upload-data"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link link-primary font-medium"
                  >
                    Haruki工具箱
                  </a>
                  。
                </p>
              </div>
            </div>
            <div class="rounded-xl border border-info/30 bg-info/10 p-4">
                <p class="text-sm font-medium text-info">OAuth 私有数据获取</p>
                <p class="text-sm text-base-content/75 mt-1">上传后的数据默认不公开。刷新 Suite 时会通过 OAuth 授权获取你的私有数据，仅当前浏览器可访问，安全性更高。</p>
              </div>
          </div>
          <div class="modal-action">
            <form method="dialog">
              <button class="btn btn-primary btn-sm">我知道了</button>
            </form>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <!-- ==================== Profile 展示 ==================== -->
      <template v-if="profileData">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="item in profileTabs"
            :key="item.key"
            type="button"
            class="btn btn-sm h-9 min-h-9 text-xs sm:text-sm"
            :class="profileTab === item.key ? 'btn-primary' : 'btn-ghost'"
            @click="profileTab = item.key"
          >
            <User v-if="item.key === 'basic'" class="w-3.5 h-3.5 mr-1.5" />
            <Star v-else-if="item.key === 'challenge'" class="w-3.5 h-3.5 mr-1.5" />
            <Zap v-else-if="item.key === 'bonus'" class="w-3.5 h-3.5 mr-1.5" />
            <Music v-else-if="item.key === 'bonds'" class="w-3.5 h-3.5 mr-1.5" />
            <Trophy v-else class="w-3.5 h-3.5 mr-1.5" />
            {{ item.label }}
          </button>
        </div>

        <div class="grid grid-cols-1 gap-6" :class="{ 'min-[1150px]:grid-cols-2': profileTab === 'basic' }">
          <!-- ========== 左侧：用户信息 ========== -->
          <div v-if="profileTab === 'basic'" class="space-y-6">
            <!-- 用户基本信息 -->
            <ProfileHeader
              :profile-data="profileData"
              :deck-cards="deckCards"
              :show-user-id="showUserId"
              :assets-host="assetsHost"
              @toggle-user-id="showUserId = !showUserId"
            />

            <!-- 卡组 (Deck) -->
            <ProfileDeck
              :deck-name="profileData.userDeck.name"
              :deck-cards="deckCards"
            />

            <!-- 综合力 -->
            <div class="card bg-base-100 shadow-lg">
              <div class="card-body">
                <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
                  <Zap class="w-5 h-5 text-primary" />
                  综合力
                  <span class="text-2xl font-bold text-primary ml-auto">
                    {{ profileData.totalPower.totalPower.toLocaleString() }}
                  </span>
                </h3>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-base-content/60">基础综合力</span>
                    <span class="font-medium">{{ profileData.totalPower.basicCardTotalPower.toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">区域道具</span>
                    <span class="font-medium">{{ profileData.totalPower.areaItemBonus.toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">角色等级</span>
                    <span class="font-medium">{{ profileData.totalPower.characterRankBonus.toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">称号</span>
                    <span class="font-medium">{{ profileData.totalPower.honorBonus.toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">MySekai娃娃</span>
                    <span class="font-medium">{{ profileData.totalPower.mysekaiFixtureGameCharacterPerformanceBonus.toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">MySekai门</span>
                    <span class="font-medium">{{ profileData.totalPower.mysekaiGateLevelBonus.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 难度清除统计 -->
            <div class="card bg-base-100 shadow-lg">
              <div class="card-body">
                <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
                  <Music class="w-5 h-5 text-primary" />
                  难度统计
                </h3>
                <!-- CLEAR -->
                <div class="mb-3">
                  <div class="text-center font-bold mb-1">CLEAR</div>
                  <div class="grid grid-cols-6 gap-1">
                    <div v-for="c in sortedClearCounts" :key="'clear-' + c.musicDifficultyType" class="text-center">
                      <div class="badge badge-sm w-full" :class="difficultyColors[c.musicDifficultyType]">
                        {{ c.musicDifficultyType.toUpperCase() }}
                      </div>
                      <div class="text-sm font-bold mt-0.5">{{ c.liveClear }}</div>
                    </div>
                  </div>
                </div>
                <!-- FULL COMBO -->
                <div class="mb-3">
                  <div class="text-center font-bold mb-1">FULL COMBO</div>
                  <div class="grid grid-cols-6 gap-1">
                    <div v-for="c in sortedClearCounts" :key="'fc-' + c.musicDifficultyType" class="text-center">
                      <div class="badge badge-sm w-full" :class="difficultyColors[c.musicDifficultyType]">
                        {{ c.musicDifficultyType.toUpperCase() }}
                      </div>
                      <div class="text-sm font-bold mt-0.5">{{ c.fullCombo }}</div>
                    </div>
                  </div>
                </div>
                <!-- ALL PERFECT -->
                <div>
                  <div class="text-center font-bold mb-1">ALL PERFECT</div>
                  <div class="grid grid-cols-6 gap-1">
                    <div v-for="c in sortedClearCounts" :key="'ap-' + c.musicDifficultyType" class="text-center">
                      <div class="badge badge-sm w-full" :class="difficultyColors[c.musicDifficultyType]">
                        {{ c.musicDifficultyType.toUpperCase() }}
                      </div>
                      <div class="text-sm font-bold mt-0.5">{{ c.allPerfect }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ========== 右侧：成就与角色 ========== -->
          <div class="space-y-6">
            <template v-if="profileTab === 'basic'">
              <!-- MULTI LIVE -->
              <div class="card bg-base-100 shadow-lg">
                <div class="card-body">
                  <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
                    <Trophy class="w-5 h-5 text-primary" />
                    MULTI LIVE
                  </h3>
                  <div class="flex gap-6 justify-center">
                    <div class="text-center">
                      <div class="badge badge-primary badge-lg mb-1">MVP</div>
                      <div class="text-2xl font-bold">{{ profileData.userMultiLiveTopScoreCount.mvp.toLocaleString() }}<span class="text-sm text-base-content/60 ml-1">回</span></div>
                    </div>
                    <div class="text-center">
                      <div class="badge badge-secondary badge-lg mb-1">SUPER STAR</div>
                      <div class="text-2xl font-bold">{{ profileData.userMultiLiveTopScoreCount.superStar.toLocaleString() }}<span class="text-sm text-base-content/60 ml-1">回</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CHALLENGE LIVE -->
              <div class="card bg-base-100 shadow-lg">
                <div class="card-body">
                  <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
                    <Star class="w-5 h-5 text-primary" />
                    CHALLENGE LIVE
                  </h3>
                  <div class="flex items-center gap-4 justify-center">
                    <span class="badge badge-primary badge-lg">SOLO</span>
                    <div v-if="challengeCharaIcon" class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary">
                      <img :src="challengeCharaIcon" class="w-full h-full object-cover" />
                    </div>
                    <span class="text-2xl font-bold">{{ (profileData.userChallengeLiveSoloResult?.highScore || 0).toLocaleString() }}</span>
                  </div>
                </div>
              </div>

              <!-- 角色等级 / 挑战Live Stage -->
              <ProfileCharacterRank
                :character-tab="characterTab"
                :character-rows="characterRows"
                :get-chara-pill-color="getCharaPillColor"
                :get-chara-icon="getCharaIcon"
                @update:character-tab="characterTab = $event"
              />
            </template>

            <div v-if="profileTab !== 'basic'" class="space-y-3">
              <ProfileAdvancedData
                :profile-tab="profileTab"
                :current-profile-tab-label="currentProfileTabLabel"
                :has-challenge-suite-data="hasChallengeSuiteData"
                :challenge-summary="challengeSummary"
                :challenge-max-score="challengeMaxScore"
                :challenge-rows="challengeRows"
                :has-bonus-suite-data="hasBonusSuiteData"
                :power-bonus-character-group-rows="powerBonusCharacterGroupRows"
                :unit-label-map="unitLabelMap"
                :power-bonus-unit-rows="powerBonusUnitRows"
                :power-bonus-attr-rows="powerBonusAttrRows"
                :has-bonds-suite-data="hasBondsSuiteData"
                :bond-character-filter="bondCharacterFilter"
                :bond-character-options="bondCharacterOptions"
                :bond-rows="bondRows"
                :has-leader-count-data="hasLeaderCountData"
                :leader-count-summary="leaderCountSummary"
                :leader-count-rows="leaderCountRows"
                :get-chara-icon="getCharaIcon"
                :get-chara-name="getCharaName"
                :get-challenge-progress-color="getChallengeProgressColor"
                :format-percent="formatPercent"
                :get-unit-logo="getUnitLogo"
                :get-attr-icon="getAttrIcon"
                :get-chara-pill-color="getCharaPillColor"
                :get-leader-progress-color="getLeaderProgressColor"
                @update:bond-character-filter="bondCharacterFilter = $event"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- 无数据提示 -->
      <div v-else-if="accounts.length === 0" class="py-8">
        <div class="card bg-gradient-to-br from-base-100 to-base-200 shadow-xl border border-primary/20 overflow-hidden">
          <div class="card-body space-y-5">
            <div class="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <User class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold">还没有添加账号</h3>
                  <p class="text-xs text-base-content/60">先添加账号，再按需同步 Suite 详细数据</p>
                </div>
              </div>
              <span class="badge badge-primary badge-outline">仅支持日服 ID</span>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-info/30 bg-info/10 p-4 space-y-2">
                <p class="text-sm font-medium text-info">公开基础数据（无需上传）</p>
                <p class="text-sm text-base-content/75">
                  添加账号后即可查看公开基础数据，例如卡组、角色等级、AP/FC 数量等。
                </p>
              </div>
              <div class="rounded-xl border border-base-300/70 bg-base-100/80 p-4 space-y-2">
                <p class="text-sm font-medium">Suite 详细数据（需上传）</p>
                <p class="text-sm text-base-content/70">
                  更详细数据（如完整打歌成绩、卡牌持有等）需要先上传到
                  <a
                    href="https://haruki.seiunx.com/upload-data"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link link-primary font-medium"
                  >
                    Haruki工具箱
                  </a>
                  。
                </p>
              </div>
            </div>

            <div class="rounded-xl border border-info/30 bg-info/10 p-4">
                <p class="text-sm font-medium text-info">OAuth 私有数据获取</p>
                <p class="text-sm text-base-content/75 mt-1">上传后的数据默认不公开。刷新 Suite 时会通过 OAuth 授权获取你的私有数据，仅当前浏览器可访问，安全性更高。</p>
              </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Honor 组件高度跟随容器，宽度自适应 */
:deep(.sekai-honor),
:deep(.sekai-honor-bonds) {
  width: auto !important;
  height: 100% !important;
}

/* 难度颜色: MASTER 紫色 */
.diff-master {
  background-color: #9b59b6;
  color: #fff;
}

/* 难度颜色: APPEND 浅紫色 */
.diff-append {
  background-color: #c39bd3;
  color: #fff;
}

</style>
