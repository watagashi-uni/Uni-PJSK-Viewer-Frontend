<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountStore } from '@/stores/account'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import AccountSelector from '@/components/AccountSelector.vue'
import AssetImage from '@/components/AssetImage.vue'
import { RefreshCw, Sofa, DoorOpen, Disc3, Search } from 'lucide-vue-next'

type TabKey = 'furniture' | 'gate' | 'record'

interface FixtureRow {
  id: number
  name: string
  flavorText: string
  assetbundleName: string
  fixtureType: string
  settableLayoutType: string
  mainGenreId: number
  subGenreId: number
  gridWidth: number
  gridDepth: number
  gridHeight: number
  colorCount: number
  isAssembled: boolean
  isDisassembled: boolean
  isGameCharacterAction: boolean
  playerActionType: string
  firstPutCost: number
  secondPutCost: number
  tagIds: number[]
}

interface BlueprintRow {
  id: number
  craftType: string
  craftTargetId: number
  isEnableSketch: boolean
  isObtainedByConvert: boolean
  craftCountLimit: number | null
  isAvailableWithoutPossession: boolean
}

interface GenreRow {
  id: number
  name: string
}

interface BlueprintMaterialCostRow {
  mysekaiBlueprintId: number
  mysekaiMaterialId: number
  seq: number
  quantity: number
}

interface FixtureOnlyDisassembleMaterialRow {
  mysekaiFixtureId: number
  mysekaiMaterialId: number
  seq: number
  quantity: number
}

interface FixtureTagRow {
  id: number
  name: string
  tagType: string
}

interface FurnitureMainGroup {
  id: number
  name: string
  total: number
  trackedTotal: number
  owned: number
  subGroups: Array<{
    id: number
    name: string
    items: FixtureRow[]
  }>
}

interface GateMaterialRow {
  groupId: number
  mysekaiMaterialId: number
  quantity: number
}

interface MaterialRow {
  id: number
  name: string
  iconAssetbundleName: string
}

interface MusicRecordRow {
  id: number
  externalId: number
  mysekaiMusicTrackType: string
}

interface MusicRow {
  id: number
  title: string
  assetbundleName: string
}

interface MusicTagRow {
  musicId: number
  musicTag: string
}

interface GateCostItem {
  materialId: number
  quantity: number
  cumulative: number
  owned: number | null
  missing: number | null
}

interface GateLevelRow {
  level: number
  costs: GateCostItem[]
  rowMissing: number
}

interface GateView {
  gateId: number
  label: string
  currentLevel: number
  maxLevel: number
  rows: GateLevelRow[]
}

interface RecordItem {
  recordId: number
  musicId: number
  title: string
  group: string
  owned: boolean
}

interface GameCharacterRow {
  id: number
  firstName: string
  givenName: string
}

interface GameCharacterUnitRow {
  id: number
  gameCharacterId: number
  unit: string
}

interface MysekaiCharacterTalkConditionRow {
  id: number
  conditionType: string
  conditionTypeValue: number
}

interface MysekaiCharacterTalkConditionGroupRow {
  id: number
  groupId: number
  conditionId: number
}

interface MysekaiCharacterTalkRow {
  id: number
  characterUnitGroupId: number
  conditionGroupId: number
  archiveGroupId: number
}

interface MysekaiGameCharacterUnitGroupRow {
  id: number
  unitIds: number[]
}

interface CharacterArchiveMysekaiCharacterTalkGroupRow {
  id: number
  archiveDisplayType: string
}

interface MysekaiGateCharacterLotteryRow {
  gameCharacterUnitId: number
}

interface TalkCharacterOption {
  characterId: number
  label: string
}

interface TalkUnitOption {
  key: string
  label: string
  shortLabel: string
}

interface FixtureTalkStat {
  total: number
  read: number
  unread: number
}

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const tabOptions: Array<{ key: TabKey, label: string }> = [
  { key: 'furniture', label: '家具库存' },
  { key: 'gate', label: '大门' },
  { key: 'record', label: '唱片' },
]

const unitAliasMap: Record<string, string> = {
  light_sound: 'ln',
  idol: 'mmj',
  street: 'vbs',
  theme_park: 'ws',
  school_refusal: 'n25',
  piapro: 'vs',
}

const unitLabelMap: Record<string, string> = {
  light_sound: 'Leo/need',
  idol: 'MORE MORE JUMP!',
  street: 'Vivid BAD SQUAD',
  theme_park: 'Wonderlands x Showtime',
  school_refusal: '25时、Nightcord见。',
  piapro: 'VIRTUAL SINGER',
}

const unitLogoMap: Record<string, string> = {
  light_sound: '/img/logo/logo_light_sound.png',
  idol: '/img/logo/logo_idol.png',
  street: '/img/logo/logo_street.png',
  theme_park: '/img/logo/logo_theme_park.png',
  school_refusal: '/img/logo/logo_school_refusal.png',
  piapro: '/img/logo/logo_piapro.png',
}

const unitOrder = ['light_sound', 'idol', 'street', 'theme_park', 'school_refusal', 'piapro']

const showUserData = ref(false)
const isMasterLoading = ref(true)
const isAutoLoading = ref(false)
const isManualRefreshing = ref(false)
const errorMsg = ref('')
const fixtureDetailModalRef = ref<HTMLDialogElement | null>(null)
const selectedFixtureId = ref<number | null>(null)

const furnitureSearch = ref('')
const selectedMainGenre = ref(0)
const onlyOwned = ref(false)
const selectedTalkCharacterId = ref(0)
const selectedTalkUnit = ref('')

const autoLoadedUserIds = ref<Set<string>>(new Set())
const autoShowResolvedUserIds = ref<Set<string>>(new Set())
const fixtureImageIndex = ref<Record<number, number>>({})
const selectedGateId = ref(0)

const fixtures = ref<FixtureRow[]>([])
const blueprints = ref<BlueprintRow[]>([])
const mainGenres = ref<GenreRow[]>([])
const subGenres = ref<GenreRow[]>([])
const blueprintMaterialCosts = ref<BlueprintMaterialCostRow[]>([])
const fixtureOnlyDisassembleMaterials = ref<FixtureOnlyDisassembleMaterialRow[]>([])
const fixtureTags = ref<FixtureTagRow[]>([])
const gateMaterialGroups = ref<GateMaterialRow[]>([])
const mysekaiMaterials = ref<MaterialRow[]>([])
const musicRecords = ref<MusicRecordRow[]>([])
const musics = ref<MusicRow[]>([])
const musicTags = ref<MusicTagRow[]>([])
const gameCharacters = ref<GameCharacterRow[]>([])
const gameCharacterUnits = ref<GameCharacterUnitRow[]>([])
const mysekaiCharacterTalkConditions = ref<MysekaiCharacterTalkConditionRow[]>([])
const mysekaiCharacterTalkConditionGroups = ref<MysekaiCharacterTalkConditionGroupRow[]>([])
const mysekaiCharacterTalks = ref<MysekaiCharacterTalkRow[]>([])
const mysekaiGameCharacterUnitGroups = ref<MysekaiGameCharacterUnitGroupRow[]>([])
const characterArchiveMysekaiCharacterTalkGroups = ref<CharacterArchiveMysekaiCharacterTalkGroupRow[]>([])
const mysekaiGateCharacterLotteries = ref<MysekaiGateCharacterLotteryRow[]>([])

const mysekaiAssetsHost = computed(() => String(settingsStore.ASSETS_HOST_GLOBAL || '').replace(/\/+$/, ''))

function parseTab(value: unknown): TabKey {
  if (value === 'gate') return 'gate'
  if (value === 'record') return 'record'
  return 'furniture'
}

const activeTab = computed<TabKey>({
  get: () => parseTab(route.query.tab),
  set: (value) => {
    router.replace({ query: { ...route.query, tab: value } })
  },
})

const selectedUserId = computed({
  get: () => accountStore.currentUserId || '',
  set: (val: string) => {
    void accountStore.selectAccount(val)
  },
})

const currentMysekaiCache = computed<any | null>(() => {
  if (!selectedUserId.value) return null
  return accountStore.getMysekaiCache(selectedUserId.value)
})

const currentSuiteCache = computed<any | null>(() => {
  if (!selectedUserId.value) return null
  return accountStore.getSuiteCache(selectedUserId.value)
})

const hasMysekaiBlueprintData = computed(() => {
  const rows = currentMysekaiCache.value?.updatedResources?.userMysekaiBlueprints
  return showUserData.value && Array.isArray(rows)
})

const hasSuiteGateData = computed(() => {
  const gates = currentSuiteCache.value?.userMysekaiGates
  const mats = currentSuiteCache.value?.userMysekaiMaterials
  return showUserData.value && Array.isArray(gates) && Array.isArray(mats)
})

const hasRecordData = computed(() => {
  const rows = currentMysekaiCache.value?.updatedResources?.userMysekaiMusicRecords
  return showUserData.value && Array.isArray(rows)
})

const hasSuiteTalkData = computed(() => {
  const rows = currentSuiteCache.value?.userMysekaiCharacterTalks
  return showUserData.value && Array.isArray(rows)
})

const mysekaiUploadTimeText = computed(() => {
  const ts = normalizeUnixSeconds(currentMysekaiCache.value?.upload_time)
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleString('zh-CN', { hour12: false })
})

const mysekaiSource = computed(() => {
  const source = String(currentMysekaiCache.value?.source || '').trim()
  return source
})

const refreshing = computed(() => {
  return isManualRefreshing.value || accountStore.suiteRefreshing || accountStore.mysekaiRefreshing
})

const isAutoLoadingHintVisible = computed(() => {
  return showUserData.value && isAutoLoading.value
})

const blueprintIdToFixtureId = computed(() => {
  const map = new Map<number, number>()
  for (const row of blueprints.value) {
    if (row.craftType === 'mysekai_fixture') {
      map.set(row.id, row.craftTargetId)
    }
  }
  return map
})

const ownedFixtureIds = computed(() => {
  const set = new Set<number>()
  if (!hasMysekaiBlueprintData.value) return set

  const rows = currentMysekaiCache.value?.updatedResources?.userMysekaiBlueprints || []
  for (const row of rows) {
    const blueprintId = pickNumber(row, ['mysekaiBlueprintId', 'blueprintId'])
    if (blueprintId === null) continue
    const fixtureId = blueprintIdToFixtureId.value.get(blueprintId)
    if (fixtureId !== undefined) {
      set.add(fixtureId)
    }
  }
  return set
})

function isFixtureOwnershipTracked(row: FixtureRow | null | undefined): boolean {
  if (!row) return false
  return row.fixtureType !== 'canvas'
}

function isFixtureOwnedByAccount(row: FixtureRow): boolean {
  if (!isFixtureOwnershipTracked(row)) {
    // Canvas 不在账号蓝图状态里，默认按已拥有处理
    return true
  }
  return ownedFixtureIds.value.has(row.id)
}

const allFurniture = computed(() => {
  return fixtures.value
    .filter((row) => row.fixtureType !== 'gate')
    .sort((a, b) => a.id - b.id)
})

const mainGenreNameMap = computed(() => {
  const map = new Map<number, string>()
  for (const row of mainGenres.value) {
    map.set(row.id, row.name)
  }
  return map
})

const subGenreNameMap = computed(() => {
  const map = new Map<number, string>()
  for (const row of subGenres.value) {
    map.set(row.id, row.name)
  }
  return map
})

const mainGenreOptions = computed(() => {
  const used = new Set<number>()
  for (const row of allFurniture.value) {
    if (row.mainGenreId > 0) {
      used.add(row.mainGenreId)
    }
  }

  return [...used]
    .sort((a, b) => a - b)
    .map((id) => ({
      id,
      name: mainGenreNameMap.value.get(id) || `分类 ${id}`,
    }))
})

const gameCharacterNameMap = computed(() => {
  const map = new Map<number, string>()
  for (const row of gameCharacters.value) {
    map.set(row.id, `${row.firstName || ''}${row.givenName || ''}`.trim() || `角色 ${row.id}`)
  }
  return map
})

const mysekaiCharacterUnitIdSet = computed(() => {
  const set = new Set<number>()
  for (const row of mysekaiGateCharacterLotteries.value) {
    if (row.gameCharacterUnitId > 0) {
      set.add(row.gameCharacterUnitId)
    }
  }
  return set
})

const talkCharacterOptions = computed<TalkCharacterOption[]>(() => {
  const ids = new Set<number>()
  for (const row of gameCharacterUnits.value) {
    if (mysekaiCharacterUnitIdSet.value.has(row.id)) {
      ids.add(row.gameCharacterId)
    }
  }

  return [...ids]
    .sort((a, b) => a - b)
    .map((characterId) => ({
      characterId,
      label: gameCharacterNameMap.value.get(characterId) || `角色 ${characterId}`,
    }))
})

const selectedTalkCharacterUnitRows = computed(() => {
  if (selectedTalkCharacterId.value <= 0) return []
  return gameCharacterUnits.value.filter((row) => {
    if (row.gameCharacterId !== selectedTalkCharacterId.value) return false
    return mysekaiCharacterUnitIdSet.value.has(row.id)
  })
})

const talkUnitOptions = computed<TalkUnitOption[]>(() => {
  const map = new Map<string, TalkUnitOption>()
  for (const row of selectedTalkCharacterUnitRows.value) {
    const key = row.unit
    const shortLabel = unitAliasMap[key] || key
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: unitLabelMap[key] || key,
        shortLabel: shortLabel.toUpperCase(),
      })
    }
  }

  return unitOrder
    .map((key) => map.get(key))
    .filter((item): item is TalkUnitOption => !!item)
})

const selectedTalkCharacterUnitIds = computed(() => {
  const set = new Set<number>()
  for (const row of selectedTalkCharacterUnitRows.value) {
    if (selectedTalkUnit.value && row.unit !== selectedTalkUnit.value) continue
    set.add(row.id)
  }
  return set
})

const suiteReadTalkIds = computed(() => {
  const set = new Set<number>()
  if (!hasSuiteTalkData.value) return set
  const rows = currentSuiteCache.value?.userMysekaiCharacterTalks || []
  for (const row of rows) {
    const talkId = pickNumber(row, ['mysekaiCharacterTalkId', 'characterTalkId'])
    if (talkId === null || talkId <= 0) continue
    if (Boolean(row?.isRead)) {
      set.add(talkId)
    }
  }
  return set
})

const talkConditionIdToFixtureIds = computed(() => {
  const map = new Map<number, Set<number>>()
  for (const row of mysekaiCharacterTalkConditions.value) {
    if (row.conditionType !== 'mysekai_fixture_id') continue
    if (row.conditionTypeValue <= 0) continue
    if (!map.has(row.id)) map.set(row.id, new Set())
    map.get(row.id)!.add(row.conditionTypeValue)
  }
  return map
})

const talkConditionGroupToFixtureIds = computed(() => {
  const map = new Map<number, Set<number>>()
  for (const row of mysekaiCharacterTalkConditionGroups.value) {
    const fixtureIds = talkConditionIdToFixtureIds.value.get(row.conditionId)
    if (!fixtureIds || fixtureIds.size === 0) continue
    if (!map.has(row.groupId)) map.set(row.groupId, new Set())
    const target = map.get(row.groupId)!
    for (const fixtureId of fixtureIds) {
      target.add(fixtureId)
    }
  }
  return map
})

const talkArchiveDisplaySet = computed(() => {
  const set = new Set<number>()
  for (const row of characterArchiveMysekaiCharacterTalkGroups.value) {
    if (row.archiveDisplayType === 'normal') {
      set.add(row.id)
    }
  }
  return set
})

const talkUnitGroupIdToUnitIds = computed(() => {
  const map = new Map<number, number[]>()
  for (const row of mysekaiGameCharacterUnitGroups.value) {
    map.set(row.id, row.unitIds)
  }
  return map
})

const selectedTalkFixtureSummary = computed(() => {
  const fixtureStats = new Map<number, FixtureTalkStat>()
  if (selectedTalkCharacterId.value <= 0 || selectedTalkCharacterUnitIds.value.size === 0) {
    return { total: 0, read: 0, fixtureStats }
  }

  const archiveMap = new Map<number, { fixtureIds: Set<number>, hasRead: boolean }>()
  for (const talk of mysekaiCharacterTalks.value) {
    if (!talkArchiveDisplaySet.value.has(talk.archiveGroupId)) continue

    const unitIds = talkUnitGroupIdToUnitIds.value.get(talk.characterUnitGroupId) || []
    const matched = unitIds.some((id) => selectedTalkCharacterUnitIds.value.has(id))
    if (!matched) continue

    const fixtureIds = talkConditionGroupToFixtureIds.value.get(talk.conditionGroupId)
    if (!fixtureIds || fixtureIds.size === 0) continue

    const archiveId = talk.archiveGroupId || talk.id
    if (!archiveMap.has(archiveId)) {
      archiveMap.set(archiveId, { fixtureIds: new Set<number>(), hasRead: false })
    }
    const archive = archiveMap.get(archiveId)!
    for (const fixtureId of fixtureIds) {
      archive.fixtureIds.add(fixtureId)
    }
    if (suiteReadTalkIds.value.has(talk.id)) {
      archive.hasRead = true
    }
  }

  let total = 0
  let read = 0
  for (const item of archiveMap.values()) {
    total += 1
    if (item.hasRead) read += 1
    for (const fixtureId of item.fixtureIds) {
      if (!fixtureStats.has(fixtureId)) {
        fixtureStats.set(fixtureId, { total: 0, read: 0, unread: 0 })
      }
      const stat = fixtureStats.get(fixtureId)!
      stat.total += 1
      if (item.hasRead) {
        stat.read += 1
      } else {
        stat.unread += 1
      }
    }
  }

  return { total, read, fixtureStats }
})

const selectedTalkFixtureStats = computed(() => selectedTalkFixtureSummary.value.fixtureStats)

const selectedTalkTotal = computed(() => selectedTalkFixtureSummary.value.total)
const selectedTalkRead = computed(() => selectedTalkFixtureSummary.value.read)
const selectedTalkUnread = computed(() => Math.max(0, selectedTalkTotal.value - selectedTalkRead.value))
const selectedTalkCharacterLabel = computed(() => {
  if (selectedTalkCharacterId.value <= 0) return ''
  return gameCharacterNameMap.value.get(selectedTalkCharacterId.value) || `角色 ${selectedTalkCharacterId.value}`
})
const selectedTalkFurnitureCount = computed(() => {
  if (selectedTalkCharacterId.value <= 0) return 0
  let count = 0
  for (const row of allFurniture.value) {
    if (selectedTalkFixtureStats.value.has(row.id)) {
      count += 1
    }
  }
  return count
})

const filteredFurniture = computed(() => {
  const keyword = furnitureSearch.value.trim().toLowerCase()

  return allFurniture.value.filter((row) => {
    if (selectedMainGenre.value > 0 && row.mainGenreId !== selectedMainGenre.value) {
      return false
    }

    if (onlyOwned.value && hasMysekaiBlueprintData.value && !isFixtureOwnedByAccount(row)) {
      return false
    }

    if (selectedTalkCharacterId.value > 0) {
      const stat = selectedTalkFixtureStats.value.get(row.id)
      if (!stat || stat.total <= 0) {
        return false
      }
    }

    if (!keyword) return true
    const nameMatched = row.name.toLowerCase().includes(keyword)
    const idMatched = String(row.id).includes(keyword)
    return nameMatched || idMatched
  })
})

const groupedFurniture = computed<FurnitureMainGroup[]>(() => {
  const grouped = new Map<number, Map<number, FixtureRow[]>>()

  for (const row of filteredFurniture.value) {
    const mainId = row.mainGenreId > 0 ? row.mainGenreId : -1
    const subId = row.subGenreId > 0 ? row.subGenreId : -1
    if (!grouped.has(mainId)) grouped.set(mainId, new Map())
    const subMap = grouped.get(mainId)!
    if (!subMap.has(subId)) subMap.set(subId, [])
    subMap.get(subId)!.push(row)
  }

  const groups: FurnitureMainGroup[] = []
  const sortedMainIds = [...grouped.keys()].sort((a, b) => a - b)

  for (const mainId of sortedMainIds) {
    const subMap = grouped.get(mainId)!
    const subGroups = [...subMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([subId, items]) => ({
        id: subId,
        name: subId > 0 ? (subGenreNameMap.value.get(subId) || `子分类 ${subId}`) : '未细分',
        items: [...items].sort((x, y) => x.id - y.id),
      }))

    const flatItems = subGroups.flatMap((group) => group.items)
    const trackedItems = flatItems.filter((item) => isFixtureOwnershipTracked(item))
    const owned = hasMysekaiBlueprintData.value
      ? trackedItems.filter((item) => isFixtureOwnedByAccount(item)).length
      : 0

    groups.push({
      id: mainId,
      name: mainId > 0 ? (mainGenreNameMap.value.get(mainId) || `分类 ${mainId}`) : '未分类',
      total: flatItems.length,
      trackedTotal: trackedItems.length,
      owned,
      subGroups,
    })
  }

  return groups
})

const furnitureOwnedCount = computed(() => {
  if (!hasMysekaiBlueprintData.value) return 0
  let count = 0
  for (const row of allFurniture.value) {
    if (!isFixtureOwnershipTracked(row)) continue
    if (isFixtureOwnedByAccount(row)) count += 1
  }
  return count
})

const furnitureTrackedTotal = computed(() => {
  return allFurniture.value.filter((row) => isFixtureOwnershipTracked(row)).length
})

const furnitureProgress = computed(() => {
  if (!furnitureTrackedTotal.value || !hasMysekaiBlueprintData.value) return 0
  return (furnitureOwnedCount.value / furnitureTrackedTotal.value) * 100
})

const materialIconMap = computed(() => {
  const map = new Map<number, string>()
  for (const row of mysekaiMaterials.value) {
    if (row.iconAssetbundleName) {
      map.set(row.id, row.iconAssetbundleName)
    }
  }
  return map
})

const materialNameMap = computed(() => {
  const map = new Map<number, string>()
  for (const row of mysekaiMaterials.value) {
    map.set(row.id, row.name)
  }
  return map
})

const fixtureTagNameMap = computed(() => {
  const map = new Map<number, string>()
  for (const row of fixtureTags.value) {
    map.set(row.id, row.name)
  }
  return map
})

const fixtureMapById = computed(() => {
  const map = new Map<number, FixtureRow>()
  for (const row of fixtures.value) {
    map.set(row.id, row)
  }
  return map
})

const blueprintByFixtureId = computed(() => {
  const map = new Map<number, BlueprintRow>()
  for (const row of blueprints.value) {
    if (row.craftType === 'mysekai_fixture') {
      map.set(row.craftTargetId, row)
    }
  }
  return map
})

const selectedFixture = computed(() => {
  if (selectedFixtureId.value === null) return null
  return fixtureMapById.value.get(selectedFixtureId.value) || null
})

const selectedFixtureMainGenreName = computed(() => {
  const row = selectedFixture.value
  if (!row) return ''
  return mainGenreNameMap.value.get(row.mainGenreId) || `分类 ${row.mainGenreId}`
})

const selectedFixtureSubGenreName = computed(() => {
  const row = selectedFixture.value
  if (!row) return ''
  if (row.subGenreId <= 0) return '未细分'
  return subGenreNameMap.value.get(row.subGenreId) || `子分类 ${row.subGenreId}`
})

const selectedFixtureTagNames = computed(() => {
  const row = selectedFixture.value
  if (!row) return []
  return row.tagIds
    .map((id) => fixtureTagNameMap.value.get(id) || '')
    .filter((name) => !!name)
})

const selectedFixtureBlueprint = computed(() => {
  const row = selectedFixture.value
  if (!row) return null
  return blueprintByFixtureId.value.get(row.id) || null
})

const selectedFixtureBlueprintCosts = computed(() => {
  const blueprint = selectedFixtureBlueprint.value
  if (!blueprint) return []
  return blueprintMaterialCosts.value
    .filter((item) => item.mysekaiBlueprintId === blueprint.id)
    .sort((a, b) => a.seq - b.seq)
})

const selectedFixtureRecycleCosts = computed(() => {
  const row = selectedFixture.value
  if (!row) return []
  return fixtureOnlyDisassembleMaterials.value
    .filter((item) => item.mysekaiFixtureId === row.id)
    .sort((a, b) => a.seq - b.seq)
})

const selectedFixtureOwned = computed(() => {
  const row = selectedFixture.value
  if (!row) return false
  return isFixtureOwnedByAccount(row)
})

const selectedFixtureStatusVisible = computed(() => {
  if (!hasMysekaiBlueprintData.value) return false
  return isFixtureOwnershipTracked(selectedFixture.value)
})

const userGateLevels = computed(() => {
  const map = new Map<number, number>()
  if (!hasSuiteGateData.value) return map

  const rows = currentSuiteCache.value.userMysekaiGates || []
  for (const row of rows) {
    const gateId = pickNumber(row, ['mysekaiGateId', 'gateId'])
    const gateLevel = pickNumber(row, ['mysekaiGateLevel', 'gateLevel'])
    if (gateId !== null && gateLevel !== null) {
      map.set(gateId, gateLevel)
    }
  }
  return map
})

const userMaterialCounts = computed(() => {
  const map = new Map<number, number>()
  if (!hasSuiteGateData.value) return map

  const rows = currentSuiteCache.value.userMysekaiMaterials || []
  for (const row of rows) {
    const materialId = pickNumber(row, ['mysekaiMaterialId', 'materialId'])
    const quantity = pickNumber(row, ['quantity'])
    if (materialId !== null && quantity !== null) {
      map.set(materialId, quantity)
    }
  }
  return map
})

const gateViews = computed<GateView[]>(() => {
  const grouped = new Map<number, Map<number, Array<{ materialId: number, quantity: number }>>>()

  for (const row of gateMaterialGroups.value) {
    const gateId = Math.floor(row.groupId / 1000)
    const level = row.groupId % 1000
    if (!Number.isFinite(gateId) || !Number.isFinite(level) || level <= 0) continue

    if (!grouped.has(gateId)) grouped.set(gateId, new Map())
    const levelMap = grouped.get(gateId)!
    if (!levelMap.has(level)) levelMap.set(level, [])
    levelMap.get(level)!.push({ materialId: row.mysekaiMaterialId, quantity: row.quantity })
  }

  const views: GateView[] = []
  const gateOrder = [...grouped.keys()].sort((a, b) => a - b)

  for (const gateId of gateOrder) {
    const levelMap = grouped.get(gateId)!
    const levels = [...levelMap.keys()].sort((a, b) => a - b)
    const maxLevel = levels.length > 0 ? levels[levels.length - 1]! : 0
    const currentLevel = hasSuiteGateData.value ? (userGateLevels.value.get(gateId) || 0) : 0
    const fromLevel = hasSuiteGateData.value ? currentLevel + 1 : 1

    const running = new Map<number, number>()
    const rows: GateLevelRow[] = []

    for (const level of levels) {
      if (level < fromLevel) continue
      const costs = levelMap.get(level) || []
      const renderedCosts: GateCostItem[] = []
      let rowMissing = 0

      for (const cost of costs) {
        const prev = running.get(cost.materialId) || 0
        const cumulative = prev + cost.quantity
        running.set(cost.materialId, cumulative)

        let owned: number | null = null
        let missing: number | null = null
        if (hasSuiteGateData.value) {
          owned = userMaterialCounts.value.get(cost.materialId) || 0
          missing = Math.max(0, cumulative - owned)
          rowMissing += missing
        }

        renderedCosts.push({
          materialId: cost.materialId,
          quantity: cost.quantity,
          cumulative,
          owned,
          missing,
        })
      }

      rows.push({ level, costs: renderedCosts, rowMissing })
    }

    views.push({
      gateId,
      label: getGateLabel(gateId),
      currentLevel,
      maxLevel,
      rows,
    })
  }

  return views
})

const selectedGate = computed(() => {
  return gateViews.value.find((item) => item.gateId === selectedGateId.value) || null
})

const ownedRecordIds = computed(() => {
  const set = new Set<number>()
  if (!hasRecordData.value) return set

  const rows = currentMysekaiCache.value?.updatedResources?.userMysekaiMusicRecords || []
  for (const row of rows) {
    const id = pickNumber(row, ['mysekaiMusicRecordId', 'musicRecordId'])
    if (id !== null) set.add(id)
  }
  return set
})

const musicTagMap = computed(() => {
  const map = new Map<number, string[]>()
  for (const row of musicTags.value) {
    if (!map.has(row.musicId)) map.set(row.musicId, [])
    map.get(row.musicId)!.push(row.musicTag)
  }
  return map
})

const musicMap = computed(() => {
  const map = new Map<number, MusicRow>()
  for (const row of musics.value) {
    map.set(row.id, row)
  }
  return map
})

const recordItems = computed<RecordItem[]>(() => {
  const items: RecordItem[] = []

  for (const row of musicRecords.value) {
    const trackType = (row.mysekaiMusicTrackType || '').trim()
    if (trackType && trackType !== 'music') continue

    const music = musicMap.value.get(row.externalId)
    const tags = musicTagMap.value.get(row.externalId) || []

    items.push({
      recordId: row.id,
      musicId: row.externalId,
      title: music?.title || `Music ${row.externalId}`,
      group: resolveMusicGroup(tags),
      owned: hasRecordData.value ? ownedRecordIds.value.has(row.id) : false,
    })
  }

  items.sort((a, b) => a.musicId - b.musicId)
  return items
})

const recordGroupDefs: Array<{ key: string, label: string, logo: string }> = [
  { key: 'light_sound', label: 'Leo/need', logo: '/img/logo/logo_light_sound.png' },
  { key: 'idol', label: 'MORE MORE JUMP!', logo: '/img/logo/logo_idol.png' },
  { key: 'street', label: 'Vivid BAD SQUAD', logo: '/img/logo/logo_street.png' },
  { key: 'theme_park', label: 'Wonderlands x Showtime', logo: '/img/logo/logo_theme_park.png' },
  { key: 'school_refusal', label: '25时、Nightcord见。', logo: '/img/logo/logo_school_refusal.png' },
  { key: 'vocaloid', label: 'VIRTUAL SINGER', logo: '/img/logo/logo_piapro.png' },
  { key: 'other', label: '其他', logo: '' },
]

const recordsByGroup = computed(() => {
  const map = new Map<string, RecordItem[]>()
  for (const def of recordGroupDefs) {
    map.set(def.key, [])
  }

  for (const item of recordItems.value) {
    const key = map.has(item.group) ? item.group : 'other'
    map.get(key)!.push(item)
  }

  return map
})

const recordOwnedCount = computed(() => {
  if (!hasRecordData.value) return 0
  let count = 0
  for (const item of recordItems.value) {
    if (item.owned) count += 1
  }
  return count
})

watch(() => route.query.tab, (value) => {
  const tab = parseTab(value)
  if (tab !== value) {
    router.replace({ query: { ...route.query, tab } })
  }
}, { immediate: true })

watch(gateViews, (rows) => {
  if (!rows.length) {
    selectedGateId.value = 0
    return
  }
  const found = rows.some((row) => row.gateId === selectedGateId.value)
  if (!found) {
    selectedGateId.value = rows[0]!.gateId
  }
})

watch(hasMysekaiBlueprintData, (ready) => {
  if (!ready) {
    onlyOwned.value = false
  }
})

watch(selectedTalkCharacterId, (characterId) => {
  if (characterId <= 0) {
    selectedTalkUnit.value = ''
    return
  }
  const hasCurrentUnit = talkUnitOptions.value.some((item) => item.key === selectedTalkUnit.value)
  if (!hasCurrentUnit) {
    selectedTalkUnit.value = ''
  }
})

watch(talkUnitOptions, (rows) => {
  if (!selectedTalkUnit.value) return
  if (!rows.some((row) => row.key === selectedTalkUnit.value)) {
    selectedTalkUnit.value = ''
  }
})

watch(selectedUserId, (userId) => {
  if (!userId) return
  if (autoShowResolvedUserIds.value.has(userId)) return

  const mysekaiCached = accountStore.getMysekaiCache(userId)
  const suiteCached = accountStore.getSuiteCache(userId)
  const hasLocalData =
    Array.isArray(mysekaiCached?.updatedResources?.userMysekaiBlueprints) ||
    Array.isArray(mysekaiCached?.updatedResources?.userMysekaiMusicRecords) ||
    Array.isArray(suiteCached?.userMysekaiGates) ||
    Array.isArray(suiteCached?.userMysekaiMaterials)

  if (hasLocalData) {
    showUserData.value = true
  }

  const next = new Set(autoShowResolvedUserIds.value)
  next.add(userId)
  autoShowResolvedUserIds.value = next
}, { immediate: true })

watch([showUserData, selectedUserId], async ([show, userId]) => {
  if (!show || !userId) return
  await autoLoadUserDataOnce(userId)
}, { immediate: true })

onMounted(async () => {
  await loadMasterData()
})

async function loadMasterData() {
  isMasterLoading.value = true
  try {
    const [
      fixtureRaw,
      blueprintRaw,
      mainGenreRaw,
      subGenreRaw,
      blueprintMaterialCostRaw,
      fixtureOnlyDisassembleRaw,
      fixtureTagRaw,
      gateMaterialRaw,
      materialRaw,
      musicRecordRaw,
      musicRaw,
      musicTagRaw,
      gameCharacterRaw,
      gameCharacterUnitRaw,
      talkConditionRaw,
      talkConditionGroupRaw,
      talkRaw,
      talkCharacterUnitGroupRaw,
      archiveTalkGroupRaw,
      gateCharacterLotteryRaw,
    ] = await Promise.all([
      getFirstAvailableMaster(['mysekaiFixtures', 'mysekai_fixtures']),
      getFirstAvailableMaster(['mysekaiBlueprints', 'mysekai_blueprints']),
      getFirstAvailableMaster(['mysekaiFixtureMainGenres', 'mysekai_fixture_maingenres', 'mysekai_fixture_main_genres']),
      getFirstAvailableMaster(['mysekaiFixtureSubGenres', 'mysekai_fixture_subgenres', 'mysekai_fixture_sub_genres']),
      getFirstAvailableMaster(['mysekaiBlueprintMysekaiMaterialCosts', 'mysekai_blueprint_mysekai_material_costs']),
      getFirstAvailableMaster(['mysekaiFixtureOnlyDisassembleMaterials', 'mysekai_fixture_only_disassemble_materials']),
      getFirstAvailableMaster(['mysekaiFixtureTags', 'mysekai_fixture_tags']),
      getFirstAvailableMaster(['mysekaiGateMaterialGroups', 'mysekai_gate_material_groups']),
      getFirstAvailableMaster(['mysekaiMaterials', 'mysekai_materials']),
      getFirstAvailableMaster(['mysekaiMusicRecords', 'mysekai_musicrecords', 'mysekai_music_records']),
      getFirstAvailableMaster(['musics']),
      getFirstAvailableMaster(['musicTags', 'music_tags']),
      getFirstAvailableMaster(['gameCharacters', 'game_characters']),
      getFirstAvailableMaster(['gameCharacterUnits', 'game_character_units']),
      getFirstAvailableMaster(['mysekaiCharacterTalkConditions', 'mysekai_character_talk_conditions']),
      getFirstAvailableMaster(['mysekaiCharacterTalkConditionGroups', 'mysekai_character_talk_condition_groups']),
      getFirstAvailableMaster(['mysekaiCharacterTalks', 'mysekai_character_talks']),
      getFirstAvailableMaster(['mysekaiGameCharacterUnitGroups', 'mysekai_game_character_unit_groups']),
      getFirstAvailableMaster(['characterArchiveMysekaiCharacterTalkGroups', 'character_archive_mysekai_character_talk_groups']),
      getFirstAvailableMaster(['mysekaiGateCharacterLotteries', 'mysekai_gate_character_lotteries']),
    ])

    fixtures.value = fixtureRaw.map((row: any) => {
      const grid = row?.gridSize || {}
      const anotherColors = Array.isArray(row?.mysekaiFixtureAnotherColors) ? row.mysekaiFixtureAnotherColors : []
      const tagGroup = row?.mysekaiFixtureTagGroup || {}
      const tagIds = Object.keys(tagGroup)
        .filter((key) => key !== 'id' && key.toLowerCase().includes('tagid'))
        .map((key) => Number(tagGroup[key]))
        .filter((num) => Number.isFinite(num) && num > 0)

      return {
      id: pickNumber(row, ['id', 'mysekaiFixtureId']) || 0,
      name: pickString(row, ['name']) || '未命名家具',
      flavorText: pickString(row, ['flavorText']) || '',
      assetbundleName: pickString(row, ['assetbundleName']) || '',
      fixtureType: pickString(row, ['mysekaiFixtureType']) || '',
      settableLayoutType: pickString(row, ['mysekaiSettableLayoutType']) || '',
      mainGenreId: pickNumber(row, ['mysekaiFixtureMainGenreId']) || 0,
      subGenreId: pickNumber(row, ['mysekaiFixtureSubGenreId']) || -1,
      gridWidth: pickNumber(grid, ['width']) || 0,
      gridDepth: pickNumber(grid, ['depth']) || 0,
      gridHeight: pickNumber(grid, ['height']) || 0,
      colorCount: Math.max(1, 1 + anotherColors.length),
      isAssembled: Boolean(row?.isAssembled),
      isDisassembled: Boolean(row?.isDisassembled),
      isGameCharacterAction: Boolean(row?.isGameCharacterAction),
      playerActionType: pickString(row, ['mysekaiFixturePlayerActionType']) || 'no_action',
      firstPutCost: pickNumber(row, ['firstPutCost']) || 0,
      secondPutCost: pickNumber(row, ['secondPutCost']) || 0,
      tagIds,
    }}).filter((item: FixtureRow) => item.id > 0)

    blueprints.value = blueprintRaw.map((row: any) => ({
      id: pickNumber(row, ['id', 'mysekaiBlueprintId']) || 0,
      craftType: pickString(row, ['mysekaiCraftType']) || '',
      craftTargetId: pickNumber(row, ['craftTargetId']) || 0,
      isEnableSketch: Boolean(row?.isEnableSketch),
      isObtainedByConvert: Boolean(row?.isObtainedByConvert),
      craftCountLimit: pickNumber(row, ['craftCountLimit']),
      isAvailableWithoutPossession: Boolean(row?.isAvailableWithoutPossession),
    })).filter((row: BlueprintRow) => row.id > 0)

    mainGenres.value = mainGenreRaw.map((row: any) => ({
      id: pickNumber(row, ['id']) || 0,
      name: pickString(row, ['name']) || '',
    })).filter((row: GenreRow) => row.id > 0)

    subGenres.value = subGenreRaw.map((row: any) => ({
      id: pickNumber(row, ['id']) || 0,
      name: pickString(row, ['name']) || '',
    })).filter((row: GenreRow) => row.id > 0)

    blueprintMaterialCosts.value = blueprintMaterialCostRaw.map((row: any) => ({
      mysekaiBlueprintId: pickNumber(row, ['mysekaiBlueprintId']) || 0,
      mysekaiMaterialId: pickNumber(row, ['mysekaiMaterialId']) || 0,
      seq: pickNumber(row, ['seq']) || 0,
      quantity: pickNumber(row, ['quantity']) || 0,
    })).filter((row: BlueprintMaterialCostRow) => row.mysekaiBlueprintId > 0 && row.mysekaiMaterialId > 0 && row.quantity > 0)

    fixtureOnlyDisassembleMaterials.value = fixtureOnlyDisassembleRaw.map((row: any) => ({
      mysekaiFixtureId: pickNumber(row, ['mysekaiFixtureId']) || 0,
      mysekaiMaterialId: pickNumber(row, ['mysekaiMaterialId']) || 0,
      seq: pickNumber(row, ['seq']) || 0,
      quantity: pickNumber(row, ['quantity']) || 0,
    })).filter((row: FixtureOnlyDisassembleMaterialRow) => row.mysekaiFixtureId > 0 && row.mysekaiMaterialId > 0 && row.quantity > 0)

    fixtureTags.value = fixtureTagRaw.map((row: any) => ({
      id: pickNumber(row, ['id']) || 0,
      name: pickString(row, ['name']) || '',
      tagType: pickString(row, ['mysekaiFixtureTagType']) || '',
    })).filter((row: FixtureTagRow) => row.id > 0 && !!row.name)

    gateMaterialGroups.value = gateMaterialRaw.map((row: any) => ({
      groupId: pickNumber(row, ['groupId']) || 0,
      mysekaiMaterialId: pickNumber(row, ['mysekaiMaterialId']) || 0,
      quantity: pickNumber(row, ['quantity']) || 0,
    })).filter((row: GateMaterialRow) => row.groupId > 0 && row.mysekaiMaterialId > 0 && row.quantity > 0)

    mysekaiMaterials.value = materialRaw.map((row: any) => ({
      id: pickNumber(row, ['id', 'mysekaiMaterialId']) || 0,
      name: pickString(row, ['name']) || `材料 ${pickNumber(row, ['id', 'mysekaiMaterialId']) || '?'}`,
      iconAssetbundleName: pickString(row, ['iconAssetbundleName']) || '',
    })).filter((row: MaterialRow) => row.id > 0)

    musicRecords.value = musicRecordRaw.map((row: any) => ({
      id: pickNumber(row, ['id', 'mysekaiMusicRecordId']) || 0,
      externalId: pickNumber(row, ['externalId']) || 0,
      mysekaiMusicTrackType: pickString(row, ['mysekaiMusicTrackType']) || '',
    })).filter((row: MusicRecordRow) => row.id > 0 && row.externalId > 0)

    musics.value = musicRaw.map((row: any) => ({
      id: pickNumber(row, ['id']) || 0,
      title: pickString(row, ['title']) || `歌曲 ${pickNumber(row, ['id']) || '?'}`,
      assetbundleName: pickString(row, ['assetbundleName']) || '',
    })).filter((row: MusicRow) => row.id > 0)

    musicTags.value = musicTagRaw.map((row: any) => ({
      musicId: pickNumber(row, ['musicId']) || 0,
      musicTag: pickString(row, ['musicTag', 'musicTagType', 'tag']) || '',
    })).filter((row: MusicTagRow) => row.musicId > 0 && !!row.musicTag)

    gameCharacters.value = gameCharacterRaw.map((row: any) => ({
      id: pickNumber(row, ['id', 'gameCharacterId']) || 0,
      firstName: pickString(row, ['firstName']) || '',
      givenName: pickString(row, ['givenName']) || '',
    })).filter((row: GameCharacterRow) => row.id > 0)

    gameCharacterUnits.value = gameCharacterUnitRaw.map((row: any) => ({
      id: pickNumber(row, ['id', 'gameCharacterUnitId']) || 0,
      gameCharacterId: pickNumber(row, ['gameCharacterId']) || 0,
      unit: pickString(row, ['unit']) || '',
    })).filter((row: GameCharacterUnitRow) => row.id > 0 && row.gameCharacterId > 0 && !!row.unit)

    mysekaiCharacterTalkConditions.value = talkConditionRaw.map((row: any) => ({
      id: pickNumber(row, ['id']) || 0,
      conditionType: pickString(row, ['mysekaiCharacterTalkConditionType']) || '',
      conditionTypeValue: pickNumber(row, ['mysekaiCharacterTalkConditionTypeValue']) || 0,
    })).filter((row: MysekaiCharacterTalkConditionRow) => row.id > 0 && !!row.conditionType)

    mysekaiCharacterTalkConditionGroups.value = talkConditionGroupRaw.map((row: any) => ({
      id: pickNumber(row, ['id']) || 0,
      groupId: pickNumber(row, ['groupId', 'mysekaiCharacterTalkConditionGroupId']) || 0,
      conditionId: pickNumber(row, ['mysekaiCharacterTalkConditionId']) || 0,
    })).filter((row: MysekaiCharacterTalkConditionGroupRow) => row.id > 0 && row.groupId > 0 && row.conditionId > 0)

    mysekaiCharacterTalks.value = talkRaw.map((row: any) => ({
      id: pickNumber(row, ['id', 'mysekaiCharacterTalkId']) || 0,
      characterUnitGroupId: pickNumber(row, ['mysekaiGameCharacterUnitGroupId']) || 0,
      conditionGroupId: pickNumber(row, ['mysekaiCharacterTalkConditionGroupId']) || 0,
      archiveGroupId: pickNumber(row, ['characterArchiveMysekaiCharacterTalkGroupId']) || 0,
    })).filter((row: MysekaiCharacterTalkRow) => row.id > 0 && row.characterUnitGroupId > 0 && row.conditionGroupId > 0)

    mysekaiGameCharacterUnitGroups.value = talkCharacterUnitGroupRaw.map((row: any) => {
      const unitIds: number[] = []
      for (let idx = 1; idx <= 9; idx += 1) {
        const unitId = pickNumber(row, [`gameCharacterUnitId${idx}`])
        if (unitId && unitId > 0) {
          unitIds.push(unitId)
        }
      }
      return {
        id: pickNumber(row, ['id', 'mysekaiGameCharacterUnitGroupId']) || 0,
        unitIds,
      }
    }).filter((row: MysekaiGameCharacterUnitGroupRow) => row.id > 0 && row.unitIds.length > 0)

    characterArchiveMysekaiCharacterTalkGroups.value = archiveTalkGroupRaw.map((row: any) => ({
      id: pickNumber(row, ['id', 'characterArchiveMysekaiCharacterTalkGroupId']) || 0,
      archiveDisplayType: pickString(row, ['archiveDisplayType']) || '',
    })).filter((row: CharacterArchiveMysekaiCharacterTalkGroupRow) => row.id > 0)

    mysekaiGateCharacterLotteries.value = gateCharacterLotteryRaw.map((row: any) => ({
      gameCharacterUnitId: pickNumber(row, ['gameCharacterUnitId']) || 0,
    })).filter((row: MysekaiGateCharacterLotteryRow) => row.gameCharacterUnitId > 0)
  } catch (e) {
    console.error('加载 MySekai master 数据失败', e)
    errorMsg.value = '加载 master 数据失败，请稍后重试'
  } finally {
    isMasterLoading.value = false
  }
}

async function getFirstAvailableMaster(names: string[]): Promise<any[]> {
  for (const name of names) {
    try {
      const rows = await masterStore.getMaster<any>(name)
      if (Array.isArray(rows) && rows.length > 0) {
        return rows
      }
    } catch {
      // ignore and try next name
    }
  }
  return []
}

async function autoLoadUserDataOnce(userId: string) {
  if (autoLoadedUserIds.value.has(userId)) return

  const mysekaiCached = accountStore.getMysekaiCache(userId)
  const suiteCached = accountStore.getSuiteCache(userId)
  const hasMysekaiCachedData =
    Array.isArray(mysekaiCached?.updatedResources?.userMysekaiBlueprints) ||
    Array.isArray(mysekaiCached?.updatedResources?.userMysekaiMusicRecords)
  const hasSuiteCachedData =
    Array.isArray(suiteCached?.userMysekaiGates) &&
    Array.isArray(suiteCached?.userMysekaiMaterials)

  const nextSet = new Set(autoLoadedUserIds.value)
  nextSet.add(userId)
  autoLoadedUserIds.value = nextSet

  if (hasMysekaiCachedData && hasSuiteCachedData) {
    return
  }

  const tasks: Array<Promise<any>> = [
    accountStore.refreshMysekai(userId),
    accountStore.refreshSuite(userId),
  ]

  isAutoLoading.value = true
  try {
    const results = await Promise.allSettled(tasks)
    const failed = results.find((item) => item.status === 'rejected') as PromiseRejectedResult | undefined
    if (failed) {
      errorMsg.value = failed.reason?.message || '自动加载账号数据失败'
    }
  } finally {
    isAutoLoading.value = false
  }
}

async function refreshCurrentUserData() {
  if (!selectedUserId.value) return

  isManualRefreshing.value = true
  errorMsg.value = ''
  try {
    const [mysekaiResult, suiteResult] = await Promise.allSettled([
      accountStore.refreshMysekai(selectedUserId.value),
      accountStore.refreshSuite(selectedUserId.value),
    ])

    if (mysekaiResult.status === 'rejected') {
      throw mysekaiResult.reason
    }
    if (suiteResult.status === 'rejected') {
      throw suiteResult.reason
    }
  } catch (e: any) {
    errorMsg.value = e?.message || '刷新失败'
  } finally {
    isManualRefreshing.value = false
  }
}

function pickNumber(row: any, keys: string[]): number | null {
  for (const key of keys) {
    const value = Number(row?.[key])
    if (Number.isFinite(value)) return value
  }
  return null
}

function pickString(row: any, keys: string[]): string {
  for (const key of keys) {
    const value = row?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function normalizeUnixSeconds(timestamp: unknown): number | null {
  const value = Number(timestamp)
  if (!Number.isFinite(value) || value <= 0) return null
  if (value > 1_000_000_000_000) {
    return Math.floor(value / 1000)
  }
  return Math.floor(value)
}

function getGateLabel(gateId: number): string {
  const map: Record<number, string> = {
    1: 'Leo/need 大门',
    2: 'MORE MORE JUMP! 大门',
    3: 'Vivid BAD SQUAD 大门',
    4: 'Wonderlands x Showtime 大门',
    5: '25时、Nightcord见。 大门',
  }
  return map[gateId] || `大门 ${gateId}`
}

function getGateLogo(gateId: number): string {
  const map: Record<number, string> = {
    1: '/img/logo/logo_light_sound.png',
    2: '/img/logo/logo_idol.png',
    3: '/img/logo/logo_street.png',
    4: '/img/logo/logo_theme_park.png',
    5: '/img/logo/logo_school_refusal.png',
  }
  return map[gateId] || ''
}

function getUnitLogo(unit: string): string {
  return unitLogoMap[unit] || ''
}

function clearTalkFilter() {
  selectedTalkCharacterId.value = 0
  selectedTalkUnit.value = ''
}

function getTalkCharacterIcon(characterId: number): string {
  if (characterId <= 0) return ''
  if (characterId <= 20) {
    return `/img/chr_ts/chr_ts_90_${characterId}.png`
  }

  // VS 角色在“全部组合”下统一使用默认头像
  if (characterId >= 21 && characterId <= 26 && !selectedTalkUnit.value) {
    return `/img/chr_ts/chr_ts_90_${characterId}.png`
  }

  const variantUnitRows = gameCharacterUnits.value.filter((row) => {
    if (row.gameCharacterId !== characterId) return false
    if (!mysekaiCharacterUnitIdSet.value.has(row.id)) return false
    return !selectedTalkUnit.value || row.unit === selectedTalkUnit.value
  })

  const variantUnitId = variantUnitRows[0]?.id || 0
  if (characterId === 21) {
    if (variantUnitId > 26) {
      return `/img/chr_ts/chr_ts_90_21_${variantUnitId - 25}.png`
    }
    return '/img/chr_ts/chr_ts_90_21.png'
  }
  return `/img/chr_ts/chr_ts_90_${characterId}_2.png`
}

function getFixtureTalkStat(fixtureId: number): FixtureTalkStat | null {
  return selectedTalkFixtureStats.value.get(fixtureId) || null
}

function resolveMusicGroup(tags: string[]): string {
  const filtered = [...new Set(tags.filter((tag) => tag && tag !== 'all'))]
  if (filtered.includes('light_music_club') || filtered.includes('light_sound')) return 'light_sound'
  if (filtered.includes('idol')) return 'idol'
  if (filtered.includes('street')) return 'street'
  if (filtered.includes('theme_park')) return 'theme_park'
  if (filtered.includes('school_refusal')) return 'school_refusal'
  if (filtered.includes('vocaloid') || filtered.includes('piapro') || filtered.includes('virtual_singer')) return 'vocaloid'
  return 'other'
}

function ensurePng(name: string): string {
  return name.endsWith('.png') ? name : `${name}.png`
}

function getFixtureImageCandidates(row: FixtureRow): string[] {
  const host = mysekaiAssetsHost.value
  const key = row.assetbundleName
  const candidates: string[] = []

  if (key) {
    if (row.fixtureType === 'surface_appearance' && row.settableLayoutType) {
      candidates.push(
        `${host}/ondemand/mysekai/thumbnail/surface_appearance/${key}/tex_${key}_${row.settableLayoutType}_1.png`,
      )
      candidates.push(
        `${host}/ondemand/mysekai/thumbnail/surface_appearance/${key}/tex_${key}_${row.settableLayoutType}_2.png`,
      )
    } else {
      candidates.push(`${host}/ondemand/mysekai/thumbnail/fixture/${ensurePng(`${key}_1`)}`)
      candidates.push(`${host}/ondemand/mysekai/thumbnail/fixture/${ensurePng(key)}`)
      candidates.push(`${host}/ondemand/mysekai/item_preview/fixture/${ensurePng(key)}`)
      candidates.push(`${host}/ondemand/mysekai/item_preview/fixture/${ensurePng(`${key}_${row.id}`)}`)
    }
  }

  return [...new Set(candidates)]
}

function getFixtureImageSrc(row: FixtureRow): string {
  const idx = fixtureImageIndex.value[row.id] || 0
  const candidates = getFixtureImageCandidates(row)
  return candidates[idx] || ''
}

function onFixtureImageError(row: FixtureRow) {
  const candidates = getFixtureImageCandidates(row)
  const idx = fixtureImageIndex.value[row.id] || 0
  if (idx + 1 >= candidates.length) return

  fixtureImageIndex.value = {
    ...fixtureImageIndex.value,
    [row.id]: idx + 1,
  }
}

function getMaterialIcon(materialId: number): string {
  const iconName = materialIconMap.value.get(materialId)
  if (!iconName) return ''
  return `${mysekaiAssetsHost.value}/ondemand/mysekai/thumbnail/material/${ensurePng(iconName)}`
}

function getMusicThumbnailUrl(musicId: number): string {
  const paddedId = musicId.toString().padStart(3, '0')
  return `${mysekaiAssetsHost.value}/startapp/thumbnail/music_jacket/jacket_s_${paddedId}.png`
}

function openFixtureDetail(fixtureId: number) {
  selectedFixtureId.value = fixtureId
  fixtureDetailModalRef.value?.showModal()
}

function closeFixtureDetail() {
  fixtureDetailModalRef.value?.close()
  selectedFixtureId.value = null
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-5 pb-10">
    <h1 class="text-3xl font-bold">MySekai</h1>

    <div class="card bg-base-100 shadow-md">
      <div class="card-body p-4 space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <label class="label cursor-pointer gap-2 p-0">
            <input v-model="showUserData" type="checkbox" class="toggle toggle-primary toggle-sm" />
            <span class="label-text font-medium">显示账号状态</span>
          </label>

          <template v-if="showUserData">
            <div class="w-px h-5 bg-base-300 hidden sm:block"></div>

            <div v-if="accountStore.accounts.length > 0" class="w-full sm:w-auto sm:min-w-[170px] sm:max-w-[260px]">
              <AccountSelector v-model="selectedUserId" />
            </div>
            <span v-else class="text-sm text-base-content/60">无绑定账号，请先在个人信息页添加账号</span>

            <button
              class="btn btn-sm btn-ghost gap-1"
              :disabled="!selectedUserId || refreshing"
              @click="refreshCurrentUserData"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': refreshing }" />
              刷新账号数据
            </button>
          </template>
        </div>

        <div
          v-if="showUserData && (mysekaiUploadTimeText || mysekaiSource || isAutoLoadingHintVisible || errorMsg)"
          class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/60"
        >
          <span v-if="mysekaiUploadTimeText">MySekai 更新: {{ mysekaiUploadTimeText }}</span>
          <span v-if="mysekaiSource">来源: {{ mysekaiSource }}</span>
          <span v-if="isAutoLoadingHintVisible" class="text-info">首次自动加载中</span>
          <span v-if="errorMsg" class="text-error">{{ errorMsg }}</span>
        </div>
      </div>
    </div>

    <div class="tabs tabs-boxed bg-base-100 shadow-sm p-1 w-fit">
      <button
        v-for="tab in tabOptions"
        :key="tab.key"
        class="tab"
        :class="activeTab === tab.key ? 'tab-active' : ''"
        @click="activeTab = tab.key"
      >
        <Sofa v-if="tab.key === 'furniture'" class="w-4 h-4 mr-1" />
        <DoorOpen v-else-if="tab.key === 'gate'" class="w-4 h-4 mr-1" />
        <Disc3 v-else class="w-4 h-4 mr-1" />
        {{ tab.label }}
      </button>
    </div>

    <div v-if="isMasterLoading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else>
      <div v-if="activeTab === 'furniture'" class="space-y-4">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <div class="badge badge-lg">总家具: {{ allFurniture.length }}</div>
              <div v-if="hasMysekaiBlueprintData" class="badge badge-primary badge-lg">
                已拥有: {{ furnitureOwnedCount }} / {{ furnitureTrackedTotal }}
              </div>
              <div v-if="hasMysekaiBlueprintData" class="badge badge-outline badge-lg">
                进度: {{ furnitureProgress.toFixed(1) }}%
              </div>
              <div v-if="!hasMysekaiBlueprintData" class="text-sm text-base-content/60">
                当前无蓝图抓包数据，展示全量家具。
              </div>
            </div>

            <div class="flex flex-wrap gap-2 items-center">
              <label class="input input-sm input-bordered flex items-center gap-2 w-full max-w-xs">
                <Search class="w-4 h-4" />
                <input v-model="furnitureSearch" type="text" placeholder="搜索家具名/ID" class="grow" />
              </label>

              <select v-model.number="selectedMainGenre" class="select select-sm select-bordered w-full max-w-xs">
                <option :value="0">全部分类</option>
                <option v-for="genre in mainGenreOptions" :key="genre.id" :value="genre.id">{{ genre.name }}</option>
              </select>

              <label class="label cursor-pointer gap-2 p-0" :class="{ 'opacity-60': !hasMysekaiBlueprintData }">
                <input
                  v-model="onlyOwned"
                  type="checkbox"
                  class="toggle toggle-secondary toggle-sm"
                  :disabled="!hasMysekaiBlueprintData"
                />
                <span class="label-text">只看已拥有</span>
              </label>
            </div>

            <div class="rounded-xl border border-base-200 bg-base-200/30 p-3 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium">家具对话筛选</span>
                <button
                  v-if="selectedTalkCharacterId > 0"
                  type="button"
                  class="btn btn-ghost btn-xs"
                  @click="clearTalkFilter"
                >
                  清空
                </button>
                <span v-if="selectedTalkCharacterId > 0" class="badge badge-outline">
                  {{ selectedTalkCharacterLabel }} · {{ selectedTalkFurnitureCount }} 件家具
                </span>
                <span v-if="selectedTalkCharacterId > 0 && hasSuiteTalkData" class="badge badge-primary">
                  对话 {{ selectedTalkRead }} / {{ selectedTalkTotal }}
                </span>
                <span
                  v-if="selectedTalkCharacterId > 0 && hasSuiteTalkData && selectedTalkUnread > 0"
                  class="badge badge-error badge-outline"
                >
                  未读 {{ selectedTalkUnread }}
                </span>
                <span v-if="selectedTalkCharacterId > 0 && !hasSuiteTalkData" class="text-xs text-base-content/60">
                  未检测到对话抓包，仅按 master 显示可触发家具
                </span>
              </div>

              <div v-if="talkCharacterOptions.length > 0" class="flex flex-wrap gap-1.5">
                <button
                  v-for="chara in talkCharacterOptions"
                  :key="`talk-chara-${chara.characterId}`"
                  type="button"
                  class="btn btn-xs px-2 gap-1.5"
                  :class="selectedTalkCharacterId === chara.characterId ? 'btn-primary' : 'btn-ghost'"
                  :title="chara.label"
                  @click="selectedTalkCharacterId = selectedTalkCharacterId === chara.characterId ? 0 : chara.characterId"
                >
                  <img
                    :src="getTalkCharacterIcon(chara.characterId)"
                    :alt="chara.label"
                    class="w-5 h-5 rounded-full object-cover"
                    loading="lazy"
                  />
                  <span class="text-[11px] hidden sm:inline">{{ chara.label }}</span>
                </button>
              </div>

              <div v-if="selectedTalkCharacterId > 0 && talkUnitOptions.length > 1" class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  class="btn btn-xs"
                  :class="selectedTalkUnit === '' ? 'btn-secondary' : 'btn-ghost'"
                  @click="selectedTalkUnit = ''"
                >
                  全部组合
                </button>
                <button
                  v-for="unit in talkUnitOptions"
                  :key="`talk-unit-${unit.key}`"
                  type="button"
                  class="btn btn-xs gap-1.5 px-2"
                  :class="selectedTalkUnit === unit.key ? 'btn-secondary' : 'btn-ghost'"
                  @click="selectedTalkUnit = unit.key"
                >
                  <img
                    v-if="getUnitLogo(unit.key)"
                    :src="getUnitLogo(unit.key)"
                    :alt="unit.label"
                    class="h-4 w-auto object-contain"
                    loading="lazy"
                  />
                  <span v-else>{{ unit.shortLabel }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="groupedFurniture.length === 0" class="text-center py-12 text-base-content/60">
          没有符合条件的家具
        </div>

        <div v-else class="space-y-3">
          <details
            v-for="group in groupedFurniture"
            :key="group.id"
            class="collapse collapse-arrow bg-base-100 border border-base-200"
          >
            <summary class="collapse-title py-3 px-4 flex flex-wrap items-center gap-2">
              <span class="font-semibold">{{ group.name }}</span>
              <span class="badge badge-ghost">{{ group.total }}</span>
              <span v-if="hasMysekaiBlueprintData && group.trackedTotal > 0" class="badge badge-outline">
                {{ group.owned }} / {{ group.trackedTotal }}
              </span>
            </summary>
            <div class="collapse-content px-4 pb-4">
              <div
                v-for="subGroup in group.subGroups"
                :key="`${group.id}-${subGroup.id}`"
                class="space-y-2 mb-4 last:mb-0"
              >
                <div class="text-xs font-medium text-base-content/70">{{ subGroup.name }}</div>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="row in subGroup.items"
                    :key="row.id"
                    class="relative w-[52px]"
                    :title="`${row.name} (#${row.id})`"
                  >
                    <button
                      type="button"
                      class="relative w-[52px] h-[52px] rounded-md bg-base-200 border border-base-300 overflow-hidden flex items-center justify-center"
                      @click="openFixtureDetail(row.id)"
                    >
                      <img
                        v-if="getFixtureImageSrc(row)"
                        :src="getFixtureImageSrc(row)"
                        :alt="row.name"
                        class="w-full h-full object-contain"
                        loading="lazy"
                        crossorigin="anonymous"
                        @error="onFixtureImageError(row)"
                      />
                      <div v-else class="text-[10px] text-base-content/50 text-center px-1">No</div>

                      <div
                        v-if="hasMysekaiBlueprintData && isFixtureOwnershipTracked(row) && !isFixtureOwnedByAccount(row)"
                        class="absolute inset-0 bg-black/55"
                        title="未拥有"
                      ></div>

                      <div
                        v-if="selectedTalkCharacterId > 0 && getFixtureTalkStat(row.id)"
                        class="absolute top-0.5 right-0.5 badge badge-xs px-1 min-h-0 h-4"
                        :class="!hasSuiteTalkData ? 'badge-neutral' : ((getFixtureTalkStat(row.id)?.unread || 0) > 0 ? 'badge-error' : 'badge-success')"
                      >
                        <template v-if="hasSuiteTalkData">
                          {{ getFixtureTalkStat(row.id)?.read }}/{{ getFixtureTalkStat(row.id)?.total }}
                        </template>
                        <template v-else>
                          {{ getFixtureTalkStat(row.id)?.total }}
                        </template>
                      </div>
                    </button>
                    <div class="text-[10px] text-center mt-1 text-base-content/70">
                      <div>#{{ row.id }}</div>
                      <div
                        v-if="selectedTalkCharacterId > 0 && hasSuiteTalkData && getFixtureTalkStat(row.id)"
                        :class="(getFixtureTalkStat(row.id)?.unread || 0) > 0 ? 'text-error' : 'text-success'"
                      >
                        未读 {{ getFixtureTalkStat(row.id)?.unread }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>

      <div v-else-if="activeTab === 'gate'" class="space-y-4">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4">
            <p class="text-sm text-base-content/70" v-if="!hasSuiteGateData">
              当前无可用 Suite 大门/材料数据，展示基础全量升级需求。
            </p>
            <p class="text-sm text-base-content/70" v-else>
              当前账号大门材料缺口已按累计需求计算。
            </p>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm" v-if="gateViews.length > 0">
          <div class="card-body p-4">
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span class="text-sm text-base-content/70 mr-1">选择大门:</span>
              <button
                v-for="gate in gateViews"
                :key="`switch-${gate.gateId}`"
                class="btn btn-xs sm:btn-sm gap-1.5 px-2 sm:px-3 h-8 sm:h-9 min-h-0"
                :class="selectedGateId === gate.gateId ? 'btn-primary' : 'btn-ghost'"
                @click="selectedGateId = gate.gateId"
              >
                <img
                  v-if="getGateLogo(gate.gateId)"
                  :src="getGateLogo(gate.gateId)"
                  class="h-4 sm:h-5 w-auto object-contain"
                  loading="lazy"
                />
                <span>Lv.{{ gate.currentLevel }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="selectedGate" :key="selectedGate.gateId" class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <img
                v-if="getGateLogo(selectedGate.gateId)"
                :src="getGateLogo(selectedGate.gateId)"
                class="h-8 w-auto object-contain"
                loading="lazy"
              />
              <h3 class="font-bold text-lg">{{ selectedGate.label }}</h3>
              <span class="badge badge-outline">当前 Lv.{{ selectedGate.currentLevel }}</span>
              <span class="badge badge-ghost">最大 Lv.{{ selectedGate.maxLevel }}</span>
            </div>

            <div v-if="selectedGate.rows.length === 0" class="text-sm text-success">该门已满级</div>

            <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-2 md:gap-3">
              <div
                v-for="row in selectedGate.rows"
                :key="`${selectedGate.gateId}-${row.level}`"
                class="rounded-xl border-2 border-base-300 bg-base-100 shadow-sm p-3 h-full"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold">Lv.{{ row.level }}</span>
                  <span v-if="hasSuiteGateData" class="text-xs" :class="row.rowMissing > 0 ? 'text-error' : 'text-success'">
                    {{ row.rowMissing > 0 ? `仍缺 ${row.rowMissing}` : '材料满足' }}
                  </span>
                </div>

                <div class="flex justify-center">
                  <div class="grid grid-cols-5 gap-1.5 sm:gap-2 md:gap-3 items-start w-full max-w-[760px]">
                    <div
                      v-for="cost in row.costs"
                      :key="`${selectedGate.gateId}-${row.level}-${cost.materialId}`"
                      class="flex flex-col items-center text-center gap-1 bg-base-200/60 rounded-md px-1 py-1.5 sm:px-2 sm:py-2 min-h-[92px] sm:min-h-[108px] md:min-h-[116px]"
                    >
                      <img
                        v-if="getMaterialIcon(cost.materialId)"
                        :src="getMaterialIcon(cost.materialId)"
                        class="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain"
                        loading="lazy"
                        crossorigin="anonymous"
                      />
                      <div v-else class="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded bg-base-300"></div>

                      <div class="text-[10px] sm:text-xs leading-tight">
                        <div>#{{ cost.materialId }} x{{ cost.quantity }}</div>
                        <div class="text-base-content/60">累计 {{ cost.cumulative }}</div>
                        <div v-if="cost.owned !== null" :class="(cost.missing || 0) > 0 ? 'text-error' : 'text-success'">
                          持有 {{ cost.owned }} / 缺 {{ cost.missing }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-sm text-base-content/60">暂无大门数据</div>
      </div>

      <div v-else class="space-y-4">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 flex flex-wrap items-center gap-2">
            <div class="badge badge-lg">总唱片: {{ recordItems.length }}</div>
            <div v-if="hasRecordData" class="badge badge-primary badge-lg">已获得: {{ recordOwnedCount }} / {{ recordItems.length }}</div>
            <div v-if="hasRecordData" class="badge badge-outline badge-lg">
              进度: {{ recordItems.length ? ((recordOwnedCount / recordItems.length) * 100).toFixed(1) : '0.0' }}%
            </div>
            <p v-if="!hasRecordData" class="text-sm text-base-content/60">当前无唱片抓包数据，展示全量唱片。</p>
          </div>
        </div>

        <details
          v-for="group in recordGroupDefs"
          :key="group.key"
          class="collapse collapse-arrow bg-base-100 border border-base-200"
        >
          <summary class="collapse-title py-3 px-4 flex flex-wrap items-center gap-2">
            <img
              v-if="group.logo"
              :src="group.logo"
              :alt="group.label"
              class="h-8 w-auto object-contain"
              loading="lazy"
            />
            <h3 v-else class="font-bold">{{ group.label }}</h3>
            <span class="badge badge-ghost">{{ (recordsByGroup.get(group.key) || []).length }} 首</span>
            <span v-if="hasRecordData" class="badge badge-outline">
              {{ (recordsByGroup.get(group.key) || []).filter(i => i.owned).length }} / {{ (recordsByGroup.get(group.key) || []).length }}
            </span>
          </summary>

          <div class="collapse-content px-4 pb-4">
            <div class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
              <div
                v-for="item in recordsByGroup.get(group.key) || []"
                :key="item.recordId"
                class="relative rounded-lg overflow-hidden border border-base-300 bg-base-200"
              >
                <AssetImage
                  :src="getMusicThumbnailUrl(item.musicId)"
                  :alt="item.title"
                  class="w-full aspect-square object-cover"
                  :class="{ 'opacity-35 grayscale': hasRecordData && !item.owned }"
                />
                <div v-if="hasRecordData && item.owned" class="absolute top-1 right-1 badge badge-success badge-xs">已持有</div>
                <div class="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-[10px] px-1 py-0.5 truncate" :title="item.title">
                  {{ item.title }}
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </template>

    <dialog ref="fixtureDetailModalRef" class="modal" @close="selectedFixtureId = null">
      <div class="modal-box max-w-4xl">
        <div v-if="selectedFixture" class="space-y-4">
          <div class="flex flex-wrap gap-4">
            <div class="w-36 h-36 rounded-lg border border-base-300 bg-base-200 flex items-center justify-center overflow-hidden shrink-0">
              <img
                v-if="getFixtureImageSrc(selectedFixture)"
                :src="getFixtureImageSrc(selectedFixture)"
                :alt="selectedFixture.name"
                class="w-full h-full object-contain"
                loading="lazy"
                crossorigin="anonymous"
                @error="onFixtureImageError(selectedFixture)"
              />
              <div v-else class="text-xs text-base-content/60">No Preview</div>
            </div>

            <div class="min-w-[240px] flex-1 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-bold text-xl">{{ selectedFixture.name }}</h3>
                <span class="badge badge-ghost">#{{ selectedFixture.id }}</span>
                <span v-if="selectedFixtureStatusVisible" class="badge" :class="selectedFixtureOwned ? 'badge-primary' : 'badge-outline'">
                  {{ selectedFixtureOwned ? '已拥有' : '未拥有' }}
                </span>
              </div>
              <p v-if="selectedFixture.flavorText" class="text-sm text-base-content/70">{{ selectedFixture.flavorText }}</p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>主分类: <span class="font-medium">{{ selectedFixtureMainGenreName }}</span></div>
                <div>子分类: <span class="font-medium">{{ selectedFixtureSubGenreName }}</span></div>
                <div>尺寸: <span class="font-medium">{{ selectedFixture.gridWidth }} x {{ selectedFixture.gridDepth }} x {{ selectedFixture.gridHeight }}</span></div>
                <div>颜色数: <span class="font-medium">{{ selectedFixture.colorCount }}</span></div>
                <div>互动: <span class="font-medium">{{ selectedFixture.isGameCharacterAction ? '角色互动' : '无' }} {{ selectedFixture.playerActionType !== 'no_action' ? `(${selectedFixture.playerActionType})` : '' }}</span></div>
              </div>
            </div>
          </div>

          <div v-if="selectedFixtureTagNames.length > 0">
            <h4 class="font-semibold mb-2">标签</h4>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="name in selectedFixtureTagNames" :key="name" class="badge badge-outline">{{ name }}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="rounded-lg border border-base-200 p-3 space-y-2">
              <h4 class="font-semibold">蓝图信息</h4>
              <div v-if="selectedFixtureBlueprint" class="text-sm space-y-1">
                <div>蓝图ID: #{{ selectedFixtureBlueprint.id }}</div>
                <div>可草图: {{ selectedFixtureBlueprint.isEnableSketch ? '是' : '否' }}</div>
                <div>可转换获得: {{ selectedFixtureBlueprint.isObtainedByConvert ? '是' : '否' }}</div>
                <div>无持有可见: {{ selectedFixtureBlueprint.isAvailableWithoutPossession ? '是' : '否' }}</div>
                <div>制作上限: {{ selectedFixtureBlueprint.craftCountLimit ?? '-' }}</div>
              </div>
              <div v-else class="text-sm text-base-content/60">无蓝图数据</div>

              <div class="pt-1">
                <div class="text-sm font-medium mb-2">制作材料</div>
                <div v-if="selectedFixtureBlueprintCosts.length > 0" class="grid grid-cols-2 gap-2">
                  <div
                    v-for="cost in selectedFixtureBlueprintCosts"
                    :key="`craft-${cost.mysekaiMaterialId}-${cost.seq}`"
                    class="flex items-center gap-2 rounded-md bg-base-200/70 px-2 py-1.5"
                  >
                    <img
                      v-if="getMaterialIcon(cost.mysekaiMaterialId)"
                      :src="getMaterialIcon(cost.mysekaiMaterialId)"
                      class="w-9 h-9 object-contain"
                      loading="lazy"
                      crossorigin="anonymous"
                    />
                    <div v-else class="w-9 h-9 rounded bg-base-300"></div>
                    <div class="text-xs leading-tight">
                      <div>{{ materialNameMap.get(cost.mysekaiMaterialId) || `材料 #${cost.mysekaiMaterialId}` }}</div>
                      <div class="text-base-content/60">x{{ cost.quantity }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-base-content/60">无材料需求</div>
              </div>
            </div>

            <div class="rounded-lg border border-base-200 p-3 space-y-2">
              <h4 class="font-semibold">分解返还材料</h4>
              <div v-if="selectedFixtureRecycleCosts.length > 0" class="grid grid-cols-2 gap-2">
                <div
                  v-for="cost in selectedFixtureRecycleCosts"
                  :key="`recycle-${cost.mysekaiMaterialId}-${cost.seq}`"
                  class="flex items-center gap-2 rounded-md bg-base-200/70 px-2 py-1.5"
                >
                  <img
                    v-if="getMaterialIcon(cost.mysekaiMaterialId)"
                    :src="getMaterialIcon(cost.mysekaiMaterialId)"
                    class="w-9 h-9 object-contain"
                    loading="lazy"
                    crossorigin="anonymous"
                  />
                  <div v-else class="w-9 h-9 rounded bg-base-300"></div>
                  <div class="text-xs leading-tight">
                    <div>{{ materialNameMap.get(cost.mysekaiMaterialId) || `材料 #${cost.mysekaiMaterialId}` }}</div>
                    <div class="text-base-content/60">x{{ cost.quantity }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-base-content/60">无分解返还数据</div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="closeFixtureDetail">关闭</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeFixtureDetail">close</button>
      </form>
    </dialog>
  </div>
</template>
