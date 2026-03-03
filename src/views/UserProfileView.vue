<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useAccountStore } from '@/stores/account'
import { useSettingsStore } from '@/stores/settings'
import AssetImage from '@/components/AssetImage.vue'
import SekaiCard from '@/components/SekaiCard.vue'
import SekaiProfileHonor from '@/components/SekaiProfileHonor.vue'
import AccountSelector from '@/components/AccountSelector.vue'
import {
  User, Eye, EyeOff, Download, Upload, Plus, Trash2, RefreshCw, Star, Zap, Trophy, Music, CircleHelp, X
} from 'lucide-vue-next'

const masterStore = useMasterStore()
const accountStore = useAccountStore()
const settingsStore = useSettingsStore()
const assetsHost = computed(() => settingsStore.assetsHost)



interface ProfileData {
  totalPower: {
    areaItemBonus: number
    basicCardTotalPower: number
    characterRankBonus: number
    honorBonus: number
    mysekaiFixtureGameCharacterPerformanceBonus: number
    mysekaiGateLevelBonus: number
    totalPower: number
  }
  user: { name: string; rank: number; userId: number }
  userCards: Array<{
    cardId: number
    defaultImage: string
    level: number
    masterRank: number
    specialTrainingStatus: string
  }>
  userChallengeLiveSoloResult?: { characterId: number; highScore: number }
  userChallengeLiveSoloStages?: Array<{ characterId: number; rank: number }>
  userCharacters: Array<{ characterId: number; characterRank: number }>
  userDeck: {
    deckId: number
    leader: number
    member1: number
    member2: number
    member3: number
    member4: number
    member5: number
    name: string
    subLeader: number
    userId: number
  }
  userMusicDifficultyClearCount: Array<{
    allPerfect: number
    fullCombo: number
    liveClear: number
    musicDifficultyType: string
  }>
  userProfile: {
    profileImageType: string
    twitterId: string
    userId: number
    word: string
  }
  userProfileHonors: Array<{
    bondsHonorViewType: string
    bondsHonorWordId: number
    honorId: number
    honorLevel: number
    profileHonorType: string
    seq: number
  }>
  userMultiLiveTopScoreCount: { mvp: number; superStar: number }
  userHonorMissions: Array<{ honorMissionType: string; progress: number }>
}

interface CardInfo {
  id: number
  characterId: number
  cardRarityType: string
  attr: string
  assetbundleName: string
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

interface CharacterMissionV2 {
  characterId: number
  characterMissionType: string
  progress: number
}

interface CharacterMissionV2Status {
  characterId: number
  parameterGroupId: number
  seq: number
}

interface CharacterMissionV2ParameterGroup {
  id: number
  seq: number
  requirement: number
}

interface LeaderCountRow {
  characterId: number
  playCount: number | null
  exLevel: number | null
  exCount: number | null
  progress: number
}
const accounts = computed(() => accountStore.accounts)
const currentUserId = computed(() => accountStore.currentUserId)
const profileData = ref<ProfileData | null>(null)
const leaderCountModalRef = ref<HTMLDialogElement | null>(null)
const isLoading = ref(false)
const isInitLoading = ref(true)
const errorMsg = ref('')
const newUserIdInput = ref('')
const showUserId = ref(true)
const characterTab = ref<'rank' | 'stage'>('rank')
const infoModalRef = ref<HTMLDialogElement | null>(null)

// Master data
const allCards = ref<CardInfo[]>([])
const gameCharacterUnits = ref<GameCharacterUnit[]>([])
const gameCharacters = ref<GameCharacter[]>([])
const characterMissionV2ParameterGroups = ref<CharacterMissionV2ParameterGroup[]>([])

const suiteData = computed(() => {
  if (!currentUserId.value) return null
  return accountStore.getSuiteCache(currentUserId.value)
})

// ==================== 难度颜色 ====================
const difficultyColors: Record<string, string> = {
  easy: 'bg-success text-success-content',
  normal: 'bg-info text-info-content',
  hard: 'bg-warning text-warning-content',
  expert: 'bg-error text-error-content',
  master: 'diff-master',
  append: 'diff-append',
}

const difficultyOrder = ['easy', 'normal', 'hard', 'expert', 'master', 'append']

// ==================== 团队颜色 ====================
const unitColorMap: Record<string, string> = {
  light_sound: '#4455dd',
  idol: '#88dd44',
  street: '#ee1166',
  theme_park: '#ff9900',
  school_refusal: '#884499',
  piapro: '#00bfbf',
}

// 根据角色ID获取所属团队
function getCharaUnit(characterId: number): string {
  if (characterId >= 21) return 'piapro'
  const unitMap: Record<number, string> = {
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

// Helper: Get honor by sequence
function getHonor(seq: number) {
  if (!profileData.value?.userProfileHonors) return undefined
  return profileData.value.userProfileHonors.find((h) => h.seq === seq)
}

// ==================== 账号管理 ====================
function loadAccounts() {
  // accountStore already initialized in App.vue
}

function saveAccounts() {
  accountStore.save()
}

function loadProfileData() {
  if (!currentUserId.value) { profileData.value = null; return }
  profileData.value = accountStore.getProfileCache(currentUserId.value)
}

async function fetchProfile(userId: string): Promise<ProfileData> {
  const data = await accountStore.refreshProfile(userId)
  return data
}

async function addAccount() {
  const uid = newUserIdInput.value.trim()
  if (!uid) { errorMsg.value = '请输入用户ID'; return }
  if (accounts.value.some(a => a.userId === uid)) { errorMsg.value = '该账号已添加'; return }

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
      profile: raw ? raw : null,
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

// ==================== 计算属性 ====================


const lastRefreshText = computed(() => {
  const acc = accountStore.currentAccount
  if (!acc?.lastRefresh) return ''
  return new Date(acc.lastRefresh).toLocaleString('zh-CN')
})

const suiteUploadTimeText = computed(() => accountStore.uploadTimeText)

const hasLeaderCountData = computed(() => {
  const missions = suiteData.value?.userCharacterMissionV2s
  const statuses = suiteData.value?.userCharacterMissionV2Statuses
  return Array.isArray(missions) && Array.isArray(statuses)
})

const leaderCountMaxPlayCount = computed(() => {
  const groups = characterMissionV2ParameterGroups.value
    .filter(item => Number(item.id) === 1)
    .map(item => Number(item.requirement))
    .filter(value => Number.isFinite(value))
  return groups.length > 0 ? Math.max(...groups) : 0
})

const leaderCountRows = computed<LeaderCountRow[]>(() => {
  const missions = Array.isArray(suiteData.value?.userCharacterMissionV2s)
    ? suiteData.value.userCharacterMissionV2s as CharacterMissionV2[]
    : []
  const statuses = Array.isArray(suiteData.value?.userCharacterMissionV2Statuses)
    ? suiteData.value.userCharacterMissionV2Statuses as CharacterMissionV2Status[]
    : []
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
    const cid = Number(item.characterId)
    const progress = Number(item.progress)
    if (!Number.isFinite(cid) || !Number.isFinite(progress)) continue
    if (item.characterMissionType === 'play_live') {
      playCounts.set(cid, progress)
    } else if (item.characterMissionType === 'play_live_ex') {
      exCounts.set(cid, progress)
      exLevels.set(cid, 0)
    }
  }

  for (const status of statuses) {
    if (Number(status.parameterGroupId) !== 101) continue
    const cid = Number(status.characterId)
    const seq = Number(status.seq)
    if (!Number.isFinite(cid) || !Number.isFinite(seq)) continue

    const currentLevel = exLevels.get(cid) ?? 0
    exLevels.set(cid, Math.max(currentLevel, seq))

    const currentExCount = exCounts.get(cid) ?? 0
    exCounts.set(cid, currentExCount + getExRequirementBySeq(seq))
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

// 卡组数据
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

// 难度统计排序
const sortedClearCounts = computed(() => {
  if (!profileData.value) return []
  return difficultyOrder
    .map(d => profileData.value!.userMusicDifficultyClearCount.find(c => c.musicDifficultyType === d))
    .filter(Boolean) as ProfileData['userMusicDifficultyClearCount']
})

// 角色头像
function getCharaIcon(characterId: number): string {
  // 用 gameCharacterUnits 找到 unitId
  const unit = gameCharacterUnits.value.find(u => u.gameCharacterId === characterId && u.id <= 26)
  const unitId = unit?.id || characterId
  if (unitId <= 20) return `/img/chr_ts/chr_ts_90_${unitId}.png`
  if (characterId === 21) return unitId === 21 ? '/img/chr_ts/chr_ts_90_21.png' : `/img/chr_ts/chr_ts_90_21_${unitId - 25}.png`
  return `/img/chr_ts/chr_ts_90_${characterId}_2.png`
}

// 挑战Live最高角色图标
const challengeCharaIcon = computed(() => {
  if (!profileData.value?.userChallengeLiveSoloResult) return ''
  return getCharaIcon(profileData.value.userChallengeLiveSoloResult.characterId)
})

// 角色分组：21-24一行, 25-26一行, 1-20每行四个
const characterRows = computed(() => {
  if (!profileData.value) return []
  const chars = profileData.value.userCharacters
  const rows: Array<Array<{ characterId: number; value: number }>> = []

  // VS row 1: 21-24
  const vs1 = [21, 22, 23, 24]
    .map(id => {
      const c = chars.find(ch => ch.characterId === id)
      if (!c) return null
      const value = characterTab.value === 'rank'
        ? c.characterRank
        : getMaxStage(id)
      return { characterId: id, value }
    })
    .filter(Boolean) as Array<{ characterId: number; value: number }>
  if (vs1.length > 0) rows.push(vs1)

  // VS row 2: 25-26
  const vs2 = [25, 26]
    .map(id => {
      const c = chars.find(ch => ch.characterId === id)
      if (!c) return null
      const value = characterTab.value === 'rank'
        ? c.characterRank
        : getMaxStage(id)
      return { characterId: id, value }
    })
    .filter(Boolean) as Array<{ characterId: number; value: number }>
  if (vs2.length > 0) rows.push(vs2)

  // 1-20: 每行4个
  for (let i = 1; i <= 20; i += 4) {
    const row = []
    for (let j = i; j < i + 4 && j <= 20; j++) {
      const c = chars.find(ch => ch.characterId === j)
      if (!c) continue
      const value = characterTab.value === 'rank'
        ? c.characterRank
        : getMaxStage(j)
      row.push({ characterId: j, value })
    }
    if (row.length > 0) rows.push(row)
  }
  return rows
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

function openLeaderCountModal() {
  leaderCountModalRef.value?.showModal()
}

// ==================== 初始化 ====================
onMounted(async () => {
  try {
    if (!masterStore.isReady) await masterStore.initialize()
    const [cardsData, unitsData, charactersData, missionParamGroups] = await Promise.all([
      masterStore.getMaster<CardInfo>('cards'),
      masterStore.getMaster<GameCharacterUnit>('gameCharacterUnits'),
      masterStore.getMaster<GameCharacter>('gameCharacters'),
      getFirstAvailableMaster<CharacterMissionV2ParameterGroup>([
        'characterMissionV2ParameterGroups',
        'character_mission_v2_parameter_groups',
      ]),
    ])
    allCards.value = cardsData
    gameCharacterUnits.value = unitsData
    gameCharacters.value = charactersData
    characterMissionV2ParameterGroups.value = missionParamGroups
  } catch (e) {
    console.error('加载master数据失败:', e)
  }

  loadAccounts()
  if (accounts.value.length > 0) {
    await accountStore.selectAccount(accounts.value[0]!.userId)
    loadProfileData()
  }
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
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-success/30 bg-success/10 p-4">
                <p class="text-sm font-medium text-success">已勾选公开访问</p>
                <p class="text-sm text-base-content/75 mt-1">可直接刷新 Suite，但你的详细数据会对任何人可读取。</p>
              </div>
              <div class="rounded-xl border border-warning/30 bg-warning/10 p-4">
                <p class="text-sm font-medium text-warning">未勾选公开访问</p>
                <p class="text-sm text-base-content/75 mt-1">刷新时走 OAuth 授权，仅当前浏览器可访问，安全性更高。</p>
              </div>
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

      <dialog ref="leaderCountModalRef" class="modal">
        <div class="modal-box max-w-none w-[min(1400px,92vw)] h-[90vh] p-0 overflow-hidden">
          <div class="h-full flex flex-col">
            <div class="px-4 md:px-5 py-3 border-b border-base-300 flex items-start gap-3">
              <div class="min-w-0">
                <h3 class="text-xl font-semibold">队长次数视图</h3>
                <p class="text-xs text-base-content/60 mt-1">全屏展示角色队长次数、EX等级和EX次数</p>
              </div>
              <div class="ml-auto flex items-center gap-2">
                <span v-if="leaderCountMaxPlayCount > 0" class="badge badge-ghost">上限 {{ leaderCountMaxPlayCount.toLocaleString() }}</span>
                <form method="dialog">
                  <button class="btn btn-sm btn-ghost btn-circle" aria-label="关闭队长次数视图">
                    <X class="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            <div v-if="hasLeaderCountData" class="px-4 md:px-5 py-3 border-b border-base-300">
              <div class="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div class="rounded-lg bg-base-200 px-3 py-2">
                <p class="text-[11px] text-base-content/60">角色数据</p>
                <p class="text-lg font-semibold">{{ leaderCountSummary.availableRows }} / 26</p>
              </div>
              <div class="rounded-lg bg-base-200 px-3 py-2">
                <p class="text-[11px] text-base-content/60">总队长次数</p>
                <p class="text-lg font-semibold">{{ leaderCountSummary.totalPlayCount.toLocaleString() }}</p>
              </div>
              <div class="rounded-lg bg-base-200 px-3 py-2">
                <p class="text-[11px] text-base-content/60">总EX次数</p>
                <p class="text-lg font-semibold">{{ leaderCountSummary.totalExCount.toLocaleString() }}</p>
              </div>
              <div class="rounded-lg bg-base-200 px-3 py-2">
                <p class="text-[11px] text-base-content/60">最高队长次数</p>
                <p class="text-lg font-semibold">{{ leaderCountSummary.maxPlayCount.toLocaleString() }}</p>
              </div>
              </div>
            </div>

            <div class="flex-1 overflow-auto p-3 md:p-4">
              <div v-if="!hasLeaderCountData" class="alert alert-info">
                <span class="text-sm">当前账号没有可用的队长次数数据，请先点击“刷新Suite”。</span>
              </div>
              <div v-else class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <div
                  v-for="row in leaderCountRows"
                  :key="row.characterId"
                  class="rounded-2xl border border-base-300 bg-base-100 px-3 py-2.5 shadow-sm"
                >
                  <div class="flex items-center gap-2.5 mb-2.5">
                    <div class="w-10 h-10 rounded-full overflow-hidden ring-2 flex-shrink-0" :style="{ borderColor: getCharaPillColor(row.characterId) }">
                      <img :src="getCharaIcon(row.characterId)" class="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p class="text-base font-bold">{{ getCharaName(row.characterId) }}</p>
                      <p class="text-xs text-base-content/60">ID: {{ row.characterId }}</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-3 gap-2 mb-2.5">
                    <div class="rounded-lg bg-base-200 px-2 py-1.5 text-center">
                      <p class="text-[11px] text-base-content/60">队长次数</p>
                      <p class="font-semibold">{{ row.playCount === null ? '-' : row.playCount.toLocaleString() }}</p>
                    </div>
                    <div class="rounded-lg bg-base-200 px-2 py-1.5 text-center">
                      <p class="text-[11px] text-base-content/60">EX等级</p>
                      <p class="font-semibold">{{ row.exLevel === null ? '-' : `x${row.exLevel}` }}</p>
                    </div>
                    <div class="rounded-lg bg-base-200 px-2 py-1.5 text-center">
                      <p class="text-[11px] text-base-content/60">EX次数</p>
                      <p class="font-semibold">{{ row.exCount === null ? '-' : row.exCount.toLocaleString() }}</p>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-[11px] text-base-content/60">
                      <span>进度</span>
                      <span>{{ (row.progress * 100).toFixed(1) }}%</span>
                    </div>
                    <div class="w-full h-3 rounded-full bg-base-300 overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        :style="{
                          width: `${(row.progress * 100).toFixed(2)}%`,
                          backgroundColor: getLeaderProgressColor(row.playCount || 0),
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <!-- ==================== Profile 展示 ==================== -->
      <template v-if="profileData">
        <div class="grid grid-cols-1 min-[1150px]:grid-cols-2 gap-6">
          <!-- ========== 左侧：用户信息 ========== -->
          <div class="space-y-6">
            <!-- 用户基本信息 -->
            <div class="card bg-base-100 shadow-lg">
              <div class="card-body">
                <div class="flex items-center gap-4 mb-4">
                  <!-- Leader Avatar based on first deck card -->
                  <div v-if="deckCards.length > 0 && deckCards[0]?.masterCard" class="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 shadow-sm rounded-full overflow-hidden border-2 border-primary/20 bg-base-200">
                    <AssetImage
                      :src="`${assetsHost}/startapp/thumbnail/chara/${deckCards[0].masterCard.assetbundleName}_${deckCards[0]?.trained ? 'after_training' : 'normal'}.png`"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h2 class="text-2xl font-bold truncate">{{ profileData.user.name }}</h2>
                    <div class="flex items-center gap-2 mt-1 flex-nowrap">
                      <span class="badge badge-primary flex-shrink-0">等级 {{ profileData.user.rank }}</span>
                      <button
                        class="btn btn-xs btn-ghost gap-1 min-w-0 flex-shrink"
                        @click="showUserId = !showUserId"
                      >
                        <Eye v-if="showUserId" class="w-3 h-3 flex-shrink-0" />
                        <EyeOff v-else class="w-3 h-3 flex-shrink-0" />
                        <span class="truncate">id:{{ showUserId ? profileData.user.userId : '保密' }}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 称号 (3-in-a-row with placeholders) -->
                <div class="flex items-center gap-1 h-10 sm:h-12 mb-4 max-w-full">
                  <template v-for="i in 3" :key="i">
                    <div v-if="getHonor(i)" class="h-full shrink min-w-0">
                      <SekaiProfileHonor
                        :data="getHonor(i)!"
                        :user-honor-missions="profileData.userHonorMissions"
                        class="h-full w-auto max-w-full block"
                      />
                    </div>
                    <div v-else class="h-full shrink min-w-0">
                      <img
                        v-if="i === 1"
                        src="/honor/frame_degree_m_1.png"
                        class="h-full w-auto max-w-full opacity-50"
                        alt="empty-slot-main"
                      />
                      <img
                        v-else
                        src="/honor/frame_degree_s_1.png"
                        class="h-full w-auto max-w-full opacity-50"
                        alt="empty-slot-sub"
                      />
                    </div>
                  </template>
                </div>

                <!-- Twitter ID -->
                <div class="flex items-center gap-2 text-sm mb-1">
                  <span class="font-medium">𝕏</span>
                  <span v-if="profileData.userProfile.twitterId?.trim()">@{{ profileData.userProfile.twitterId.trim() }}</span>
                  <span v-else class="text-base-content/40">未设置</span>
                </div>
                <!-- 签名 -->
                <div class="text-sm text-base-content/70 italic">
                  <template v-if="profileData.userProfile.word">「{{ profileData.userProfile.word }}」</template>
                  <span v-else class="text-base-content/40 not-italic">暂无签名</span>
                </div>
              </div>
            </div>

            <!-- 卡组 (Deck) -->
            <div class="card bg-base-100 shadow-lg">
              <div class="card-body">
                <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
                  <Star class="w-5 h-5 text-primary" />
                  卡组 - {{ profileData.userDeck.name }}
                </h3>
                <div class="grid grid-cols-5 gap-1 sm:gap-2">
                  <div
                    v-for="dc in deckCards"
                    :key="dc.cardId"
                    class="text-center"
                  >
                    <RouterLink
                      :to="`/cards/${dc.cardId}`"
                      class="block hover:scale-105 transition-transform"
                    >
                      <SekaiCard
                        :card="dc.masterCard"
                        :trained="dc.trained"
                        :master-rank="dc.userCard?.masterRank || 0"
                      />
                    </RouterLink>
                    <div class="text-[10px] sm:text-xs mt-1 truncate">
                      <span class="font-medium">Lv.{{ dc.userCard?.level || '?' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
            <div class="card bg-base-100 shadow-lg">
              <div class="card-body">
                <h3 class="text-lg font-medium mb-3">
                  {{ characterTab === 'rank' ? 'CHARACTER RANK' : 'CHALLENGE LIVE STAGE' }}
                </h3>
                <!-- Tab 切换 -->
                <div class="tabs tabs-boxed mb-4 justify-center">
                  <button
                    class="tab"
                    :class="{ 'tab-active': characterTab === 'rank' }"
                    @click="characterTab = 'rank'"
                  >
                    角色等级
                  </button>
                  <button
                    class="tab"
                    :class="{ 'tab-active': characterTab === 'stage' }"
                    @click="characterTab = 'stage'"
                  >
                    挑战Live Stage
                  </button>
                </div>

                <!-- 角色网格 (pill layout, fill width) -->
                <div class="space-y-2">
                  <div
                    v-for="(row, rowIdx) in characterRows"
                    :key="rowIdx"
                    class="grid grid-cols-4 gap-2"
                  >
                    <div
                      v-for="item in row"
                      :key="item.characterId"
                      class="flex items-center gap-1 rounded-full pr-3"
                      :style="{ backgroundColor: getCharaPillColor(item.characterId) + '40' }"
                    >
                      <div class="w-9 h-9 rounded-full overflow-hidden ring-2 flex-shrink-0" :style="{ borderColor: getCharaPillColor(item.characterId) }">
                        <img :src="getCharaIcon(item.characterId)" class="w-full h-full object-cover" />
                      </div>
                      <span class="text-sm font-bold flex-1 text-center">{{ item.value }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card bg-base-100 shadow-lg">
              <div class="card-body">
                <div class="flex items-center gap-3">
                  <div>
                    <h3 class="text-lg font-medium">队长次数</h3>
                    <p class="text-xs text-base-content/60 mt-0.5">点击按钮打开队长次数视图</p>
                  </div>
                  <button
                    class="btn btn-primary btn-sm ml-auto"
                    :disabled="!hasLeaderCountData"
                    @click="openLeaderCountModal"
                  >
                    全屏查看
                  </button>
                </div>
                <p v-if="!hasLeaderCountData" class="text-xs text-base-content/60 mt-2">
                  需要先点击上方“刷新Suite”才能查看队长次数。
                </p>
              </div>
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

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-success/30 bg-success/10 p-4">
                <p class="text-sm font-medium text-success">已勾选公开访问</p>
                <p class="text-sm text-base-content/75 mt-1">可直接刷新 Suite，但你的详细数据会对任何人可读取。</p>
              </div>
              <div class="rounded-xl border border-warning/30 bg-warning/10 p-4">
                <p class="text-sm font-medium text-warning">未勾选公开访问</p>
                <p class="text-sm text-base-content/75 mt-1">刷新时走 OAuth 授权，仅当前浏览器可访问，安全性更高。</p>
              </div>
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
