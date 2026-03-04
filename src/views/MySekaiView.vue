<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useSettingsStore } from '@/stores/settings'
import { useMasterStore } from '@/stores/master'

type RarityLevel = 0 | 1 | 2

interface SceneConfig {
  siteId: number
  name: string
  imagePath: string
  sketchImagePath: string
  physicalWidth: number
  offsetX: number
  offsetY: number
  xDirection: 1 | -1
  yDirection: 1 | -1
  reverseXY: boolean
}

interface RawFixture {
  mysekaiSiteHarvestFixtureId?: number
  userMysekaiSiteHarvestFixtureStatus?: string
  positionX?: number
  positionZ?: number
}

interface RawDrop {
  resourceType?: string
  resourceId?: number
  quantity?: number
  positionX?: number
  positionZ?: number
  mysekaiSiteHarvestResourceDropStatus?: string
}

interface RawHarvestMap {
  mysekaiSiteId?: number
  userMysekaiSiteHarvestFixtures?: RawFixture[]
  userMysekaiSiteHarvestResourceDrops?: RawDrop[]
}

interface ParsedMySekaiData {
  uploadTime: number | null
  source: string
  harvestMaps: Record<number, RawHarvestMap>
  ownedMusicRecordIds: Set<number>
}

interface AggregatedResource {
  key: string
  type: string
  id: number
  quantity: number
  smallIcon: boolean
  deleted: boolean
  rarity: RarityLevel
  texture: string
  hasAttachment: boolean
}

interface PointGroup {
  key: string
  fixtureId: number
  gameX: number
  gameZ: number
  resources: Record<string, AggregatedResource>
}

interface PositionedPoint extends PointGroup {
  drawX: number
  drawY: number
}

interface ResourceRenderCall {
  id: string
  left: number
  top: number
  size: number
  quantity: number
  texture: string
  rarity: RarityLevel
  smallIcon: boolean
  hasAttachment: boolean
  drawOrder: number
}

interface ResourceStat {
  id: string
  type: string
  itemId: number
  texture: string
  count: number
  rarity: RarityLevel
}

const SITE_SCENES: SceneConfig[] = [
  {
    siteId: 5,
    name: 'さいしょの原っぱ',
    imagePath: '/img/mysekai/grassland.png',
    sketchImagePath: '/img/mysekai/grassland_sketch.png',
    physicalWidth: 33.333,
    offsetX: 0,
    offsetY: -40,
    xDirection: -1,
    yDirection: -1,
    reverseXY: true,
  },
  {
    siteId: 7,
    name: '彩りの花畑',
    imagePath: '/img/mysekai/flowergarden.png',
    sketchImagePath: '/img/mysekai/flowergarden_sketch.png',
    physicalWidth: 24.806,
    offsetX: -62.015,
    offsetY: 20.672,
    xDirection: -1,
    yDirection: -1,
    reverseXY: true,
  },
  {
    siteId: 6,
    name: '願いの砂浜',
    imagePath: '/img/mysekai/beach.png',
    sketchImagePath: '/img/mysekai/beach_sketch.png',
    physicalWidth: 20.513,
    offsetX: 0,
    offsetY: 80,
    xDirection: 1,
    yDirection: -1,
    reverseXY: false,
  },
  {
    siteId: 8,
    name: '忘れ去られた場所',
    imagePath: '/img/mysekai/memorialplace.png',
    sketchImagePath: '/img/mysekai/memorialplace_sketch.png',
    physicalWidth: 21.333,
    offsetX: 0,
    offsetY: -106.667,
    xDirection: 1,
    yDirection: -1,
    reverseXY: false,
  },
]

const SITE_SCENE_MAP: Record<number, SceneConfig> = Object.fromEntries(
  SITE_SCENES.map((scene) => [scene.siteId, scene]),
)

const MAP_IMAGE_SCALE = 0.75
const SITE_ORDER = [5, 7, 6, 8]
const MUSIC_RECORD_FALLBACK = '/img/mysekai/icon/Texture2D/item_surplus_music_record.png'

const RARE_RES_KEYS: Record<1 | 2, string[]> = {
  1: [
    'mysekai_material_32',
    'mysekai_material_33',
    'mysekai_material_34',
    'mysekai_material_61',
    'mysekai_material_64',
    'mysekai_material_65',
    'mysekai_material_66',
    'mysekai_material_93',
    'mysekai_material_94',
    'mysekai_music_record_0~9999',
  ],
  2: [
    'mysekai_material_5',
    'mysekai_material_12',
    'mysekai_material_20',
    'mysekai_material_24',
    'mysekai_fixture_121',
    'material_17',
    'material_170',
    'material_173',
    'mysekai_material_67~92',
    'material_174~203',
  ],
}

const accountStore = useAccountStore()
const settingsStore = useSettingsStore()
const masterStore = useMasterStore()

const accounts = computed(() => accountStore.accounts)
const assetsHost = computed(() => String(settingsStore.assetsHost || '').replace(/\/+$/, ''))
const remoteMysekaiThumbnailBase = computed(() => `${assetsHost.value}/ondemand/mysekai/thumbnail`)
const currentUserId = computed({
  get: () => accountStore.currentUserId,
  set: (value) => accountStore.selectAccount(value),
})
const currentMysekaiCache = computed<any | null>(() => {
  if (!currentUserId.value) return null
  return accountStore.getMysekaiCache(currentUserId.value)
})

const imageRef = ref<HTMLImageElement | null>(null)
const selectedSiteId = ref<number>(SITE_ORDER[0] ?? 5)
const showHarvested = ref(false)
const useOriginalMapImage = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')
const parsedData = ref<ParsedMySekaiData | null>(null)
const uploadTime = ref<number | null>(null)
const visibleResources = ref<Set<string>>(new Set())

const mysekaiMaterialIconNames = ref<Record<number, string>>({})
const mysekaiItemIconNames = ref<Record<number, string>>({})
const mysekaiFixtureAssetbundleNames = ref<Record<number, string>>({})
const mysekaiSiteHarvestFixtureAssetbundleNames = ref<Record<number, string>>({})
const mysekaiMusicRecordMusicIds = ref<Record<number, number>>({})
const musicJacketAssetbundleNames = ref<Record<number, string>>({})
const hasLoadedMysekaiMasters = ref(false)
let loadMysekaiMastersPromise: Promise<void> | null = null

const imageMetrics = ref({
  width: 0,
  height: 0,
  naturalWidth: 1,
  naturalHeight: 1,
})

const selectedScene = computed(() => SITE_SCENE_MAP[selectedSiteId.value] ?? SITE_SCENES[0]!)
const selectedSceneImagePath = computed(() => {
  return useOriginalMapImage.value ? selectedScene.value.imagePath : selectedScene.value.sketchImagePath
})

const uploadTimeStr = computed(() => {
  if (!uploadTime.value) return ''
  return new Date(uploadTime.value * 1000).toLocaleString('zh-CN', { hour12: false })
})

const sourceLabel = computed(() => {
  const source = parsedData.value?.source?.trim()
  return source ? `来源: ${source}` : ''
})

const isDataStale = computed(() => {
  if (!uploadTime.value) return false
  return uploadTime.value < getLatestRefreshUnixSeconds(new Date())
})

const currentSiteMap = computed(() => parsedData.value?.harvestMaps[selectedSiteId.value])

const pointGroups = computed<PointGroup[]>(() => {
  return buildPointGroups(currentSiteMap.value, showHarvested.value, parsedData.value?.ownedMusicRecordIds ?? new Set())
})

const positionedPoints = computed<PositionedPoint[]>(() => {
  const metrics = imageMetrics.value
  if (metrics.width <= 0 || metrics.height <= 0) return []

  return pointGroups.value.map((point) => {
    const pos = gameToCanvasPosition(point.gameX, point.gameZ, selectedScene.value, metrics)
    return { ...point, drawX: pos.x, drawY: pos.y }
  })
})

const resourceStats = computed<ResourceStat[]>(() => {
  const stats: Record<string, ResourceStat> = {}

  for (const point of pointGroups.value) {
    for (const res of Object.values(point.resources)) {
      if (res.deleted || !res.texture) continue
      const id = `${res.type}:${res.id}`
      if (!stats[id]) {
        stats[id] = {
          id,
          type: res.type,
          itemId: res.id,
          texture: res.texture,
          count: 0,
          rarity: res.rarity,
        }
      }
      stats[id].count += res.quantity
      if (res.rarity > stats[id].rarity) {
        stats[id].rarity = res.rarity
      }
    }
  }

  return Object.values(stats).sort((a, b) => {
    if (a.rarity !== b.rarity) return b.rarity - a.rarity
    if (a.count !== b.count) return b.count - a.count
    return a.id.localeCompare(b.id)
  })
})

const isFilterActive = computed(() => visibleResources.value.size > 0)

const renderCalls = computed<ResourceRenderCall[]>(() => {
  const calls: ResourceRenderCall[] = []
  const metrics = imageMetrics.value
  if (metrics.width <= 0 || metrics.height <= 0) return calls

  const displayScale = metrics.width / Math.max(1, metrics.naturalWidth)
  const iconScale = MAP_IMAGE_SCALE * displayScale

  const largeBase = 39 * 1.15 * iconScale
  const smallBase = 19 * 1.15 * iconScale
  const largeGap = largeBase * 0.92
  const smallGap = smallBase * 0.76

  const filterActive = isFilterActive.value
  const visibleSet = visibleResources.value

  const getSize = (res: AggregatedResource): number => {
    const isMusicRecord = res.type === 'mysekai_music_record'
    let size = res.smallIcon ? smallBase : largeBase
    if (!res.smallIcon && res.type === 'mysekai_material' && res.id === 24) {
      size *= 1.5
    }
    if (!res.smallIcon && isMusicRecord) {
      size *= 1.5
    }
    return size
  }

  const pushCall = (res: AggregatedResource, rawLeft: number, rawTop: number) => {
    const isMusicRecord = res.type === 'mysekai_music_record'
    const size = getSize(res)
    const safeLeft = Math.max(size / 2, Math.min(metrics.width - size / 2, rawLeft))
    const safeTop = Math.max(size / 2, Math.min(metrics.height - size / 2, rawTop))

    const baseOrder = safeTop * 100 + safeLeft
    let drawOrder = baseOrder
    if (res.smallIcon) {
      drawOrder += 1_000_000
    } else if (res.rarity === 2) {
      drawOrder += 100_000
    }

    calls.push({
      id: `${res.type}:${res.id}`,
      left: safeLeft,
      top: safeTop,
      size,
      quantity: res.quantity,
      texture: res.texture,
      rarity: res.rarity,
      smallIcon: res.smallIcon,
      hasAttachment: isMusicRecord && res.hasAttachment,
      drawOrder,
    })
  }

  for (const point of positionedPoints.value) {
    const resources = Object.values(point.resources)
      .filter((res) => {
        if (res.deleted || !res.texture) return false
        if (!filterActive) return true
        return visibleSet.has(`${res.type}:${res.id}`)
      })
      .sort((a, b) => {
        if (b.quantity !== a.quantity) return b.quantity - a.quantity
        return a.id - b.id
      })

    if (resources.length === 0) continue

    const largeResources = resources.filter((res) => !res.smallIcon)
    const smallResources = resources.filter((res) => res.smallIcon)

    if (largeResources.length > 0) {
      const largeStartX = point.drawX - ((largeResources.length - 1) * largeGap) / 2
      for (let idx = 0; idx < largeResources.length; idx += 1) {
        const res = largeResources[idx]!
        const left = largeStartX + idx * largeGap
        pushCall(res, left, point.drawY)
      }

      if (smallResources.length > 0) {
        const anchorRight = largeStartX + (largeResources.length - 1) * largeGap + largeBase * 0.2
        const smallStartX = anchorRight - ((smallResources.length - 1) * smallGap) / 2
        const smallTop = point.drawY - largeBase * 0.6
        for (let idx = 0; idx < smallResources.length; idx += 1) {
          const res = smallResources[idx]!
          const left = smallStartX + idx * smallGap
          pushCall(res, left, smallTop)
        }
      }
    } else {
      const smallStartX = point.drawX - ((smallResources.length - 1) * smallGap) / 2
      for (let idx = 0; idx < smallResources.length; idx += 1) {
        const res = smallResources[idx]!
        const left = smallStartX + idx * smallGap
        pushCall(res, left, point.drawY)
      }
    }
  }

  calls.sort((a, b) => a.drawOrder - b.drawOrder)
  return calls
})

const spawnMarker = computed(() => {
  const metrics = imageMetrics.value
  if (metrics.width <= 0 || metrics.height <= 0) return null
  const pos = gameToCanvasPosition(0, 0, selectedScene.value, metrics)
  return pos
})

function normalizeUnixSeconds(timestamp: unknown): number | null {
  const value = Number(timestamp)
  if (!Number.isFinite(value) || value <= 0) return null
  if (value > 1_000_000_000_000) {
    return Math.floor(value / 1000)
  }
  return Math.floor(value)
}

function toNumberId(record: any, keys: string[]): number | null {
  for (const key of keys) {
    const value = Number(record?.[key])
    if (Number.isFinite(value)) {
      return value
    }
  }
  return null
}

function pickFirstString(record: any, keys: string[]): string {
  for (const key of keys) {
    const value = record?.[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

function ensurePng(fileName: string): string {
  return fileName.endsWith('.png') ? fileName : `${fileName}.png`
}

async function getFirstAvailableMaster(names: string[]): Promise<any[]> {
  for (const name of names) {
    try {
      const data = await masterStore.getMaster<any>(name)
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
    } catch {
      // ignore and try next candidate
    }
  }
  return []
}

async function ensureMysekaiMasterIconMaps() {
  if (hasLoadedMysekaiMasters.value) return
  if (loadMysekaiMastersPromise) {
    await loadMysekaiMastersPromise
    return
  }

  loadMysekaiMastersPromise = (async () => {
    const [materials, items, records, siteHarvestFixtures, musics, fixtures] = await Promise.all([
      getFirstAvailableMaster(['mysekaiMaterials', 'mysekai_materials']),
      getFirstAvailableMaster(['mysekaiItems', 'mysekai_items']),
      getFirstAvailableMaster(['mysekaiMusicRecords', 'mysekai_musicrecords', 'mysekai_music_records']),
      getFirstAvailableMaster([
        'mysekaiSiteHarvestFixtures',
        'mysekai_site_harvest_fixtures',
      ]),
      getFirstAvailableMaster(['musics']),
      getFirstAvailableMaster(['mysekaiFixtures', 'mysekai_fixtures']),
    ])

    const materialMap: Record<number, string> = {}
    for (const item of materials) {
      const id = toNumberId(item, ['id', 'mysekaiMaterialId'])
      const icon = pickFirstString(item, ['iconAssetbundleName'])
      if (id !== null && icon) materialMap[id] = icon
    }
    mysekaiMaterialIconNames.value = materialMap

    const itemMap: Record<number, string> = {}
    for (const item of items) {
      const id = toNumberId(item, ['id', 'mysekaiItemId'])
      const icon = pickFirstString(item, ['iconAssetbundleName'])
      if (id !== null && icon) itemMap[id] = icon
    }
    mysekaiItemIconNames.value = itemMap

    const recordToMusicIdMap: Record<number, number> = {}
    for (const item of records) {
      const id = toNumberId(item, ['id', 'mysekaiMusicRecordId'])
      const externalMusicId = toNumberId(item, ['externalId'])
      if (id !== null && externalMusicId !== null) {
        recordToMusicIdMap[id] = externalMusicId
      }
    }
    mysekaiMusicRecordMusicIds.value = recordToMusicIdMap

    const musicJacketMap: Record<number, string> = {}
    for (const item of musics) {
      const id = toNumberId(item, ['id'])
      const assetbundleName = pickFirstString(item, ['assetbundleName'])
      if (id !== null && assetbundleName) {
        musicJacketMap[id] = assetbundleName
      }
    }
    musicJacketAssetbundleNames.value = musicJacketMap

    const siteHarvestFixtureMap: Record<number, string> = {}
    for (const item of siteHarvestFixtures) {
      const id = toNumberId(item, ['id', 'mysekaiSiteHarvestFixtureId'])
      const assetbundleName = pickFirstString(item, ['assetbundleName'])
      if (id !== null && assetbundleName) {
        siteHarvestFixtureMap[id] = assetbundleName
      }
    }
    mysekaiSiteHarvestFixtureAssetbundleNames.value = siteHarvestFixtureMap

    const fixtureMap: Record<number, string> = {}
    for (const item of fixtures) {
      const id = toNumberId(item, ['id', 'mysekaiFixtureId'])
      const assetbundleName = pickFirstString(item, ['assetbundleName'])
      if (id !== null && assetbundleName) {
        fixtureMap[id] = assetbundleName
      }
    }
    mysekaiFixtureAssetbundleNames.value = fixtureMap

    hasLoadedMysekaiMasters.value = true
  })()

  try {
    await loadMysekaiMastersPromise
  } catch (error) {
    console.warn('加载 MySekai master 图标映射失败，将使用兜底映射。', error)
  } finally {
    loadMysekaiMastersPromise = null
  }
}

function resolveFixturePreviewStem(resourceId: number): string {
  const byFixtureMaster = mysekaiFixtureAssetbundleNames.value[resourceId] || ''
  const bySiteFixtureMaster = mysekaiSiteHarvestFixtureAssetbundleNames.value[resourceId] || ''
  const baseName = byFixtureMaster || bySiteFixtureMaster

  if (baseName) {
    // 树苗/嫩芽类预览图在 assets 里是 {assetbundleName}_{id}.png
    if (baseName.includes('before_sapling1') || baseName.includes('before_sprout1')) {
      return `${baseName}_${resourceId}`
    }
    return baseName
  }

  // 仅保留最小兜底：你当前站点出现的树苗/嫩芽资源
  if (resourceId >= 118 && resourceId <= 121) {
    return `mdl_non1001_before_sapling1_${resourceId}`
  }
  if ((resourceId >= 126 && resourceId <= 130) || (resourceId >= 474 && resourceId <= 483)) {
    return `mdl_non1001_before_sprout1_${resourceId}`
  }
  return ''
}

function getResourceTexture(resourceType: string, resourceId: number): string {
  if (resourceType === 'mysekai_material') {
    const icon = mysekaiMaterialIconNames.value[resourceId]
    if (icon) {
      return `${remoteMysekaiThumbnailBase.value}/material/${ensurePng(icon)}`
    }
  } else if (resourceType === 'mysekai_item') {
    const icon = mysekaiItemIconNames.value[resourceId]
    if (icon) {
      return `${remoteMysekaiThumbnailBase.value}/item/${ensurePng(icon)}`
    }
  } else if (resourceType === 'mysekai_fixture') {
    const previewStem = resolveFixturePreviewStem(resourceId)
    if (previewStem) {
      return `${assetsHost.value}/ondemand/mysekai/item_preview/fixture/${ensurePng(previewStem)}`
    }
  } else if (resourceType === 'mysekai_music_record') {
    const musicId = mysekaiMusicRecordMusicIds.value[resourceId]
    const jacketAssetbundleName = musicId ? musicJacketAssetbundleNames.value[musicId] : ''
    if (jacketAssetbundleName) {
      return `${assetsHost.value}/startapp/music/jacket/${jacketAssetbundleName}/${jacketAssetbundleName}.png`
    }
    return MUSIC_RECORD_FALLBACK
  }

  return ''
}

function parseMySekaiPayload(payload: any): ParsedMySekaiData {
  const harvestMaps: Record<number, RawHarvestMap> = {}
  const maps = payload?.updatedResources?.userMysekaiHarvestMaps

  if (Array.isArray(maps)) {
    for (const map of maps) {
      const siteId = Number(map?.mysekaiSiteId)
      if (!Number.isFinite(siteId)) continue
      harvestMaps[siteId] = map
    }
  }

  const ownedMusicRecordIds = new Set<number>()
  const records = payload?.updatedResources?.userMysekaiMusicRecords
  if (Array.isArray(records)) {
    for (const record of records) {
      const id = Number(record?.mysekaiMusicRecordId)
      if (Number.isFinite(id)) {
        ownedMusicRecordIds.add(id)
      }
    }
  }

  return {
    uploadTime: normalizeUnixSeconds(payload?.upload_time),
    source: String(payload?.source ?? ''),
    harvestMaps,
    ownedMusicRecordIds,
  }
}

function getResourceRarity(resourceType: string, resourceId: number): RarityLevel {
  for (const rarity of [2, 1] as const) {
    const rules = RARE_RES_KEYS[rarity]
    for (const rule of rules) {
      const splitIdx = rule.lastIndexOf('_')
      if (splitIdx <= 0 || splitIdx >= rule.length - 1) continue

      const ruleType = rule.slice(0, splitIdx)
      if (ruleType !== resourceType) continue

      const suffix = rule.slice(splitIdx + 1)
      if (suffix.includes('~')) {
        const [minStr, maxStr] = suffix.split('~')
        const min = Number(minStr)
        const max = Number(maxStr)
        if (Number.isFinite(min) && Number.isFinite(max) && resourceId >= min && resourceId <= max) {
          return rarity
        }
      } else {
        const id = Number(suffix)
        if (Number.isFinite(id) && resourceId === id) {
          return rarity
        }
      }
    }
  }
  return 0
}

function isBirthdayDrop(resource: AggregatedResource): boolean {
  return resource.type === 'material' && resource.id >= 174 && resource.id <= 199
}

function buildPointGroups(siteMap: RawHarvestMap | undefined, includeHarvested: boolean, ownedMusicRecordIds: Set<number>): PointGroup[] {
  if (!siteMap) return []

  const points = new Map<string, PointGroup>()

  const ensurePoint = (x: number, z: number, fixtureId = 0): PointGroup => {
    const key = `${x}_${z}`
    const hit = points.get(key)
    if (hit) {
      if (fixtureId && !hit.fixtureId) {
        hit.fixtureId = fixtureId
      }
      return hit
    }

    const created: PointGroup = {
      key,
      fixtureId,
      gameX: x,
      gameZ: z,
      resources: {},
    }
    points.set(key, created)
    return created
  }

  const fixtures = Array.isArray(siteMap.userMysekaiSiteHarvestFixtures)
    ? siteMap.userMysekaiSiteHarvestFixtures
    : []

  for (const fixture of fixtures) {
    const status = String(fixture?.userMysekaiSiteHarvestFixtureStatus ?? '')
    if (!includeHarvested && status !== 'spawned') continue

    const x = Number(fixture?.positionX)
    const z = Number(fixture?.positionZ)
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue

    const fixtureId = Number(fixture?.mysekaiSiteHarvestFixtureId)
    ensurePoint(x, z, Number.isFinite(fixtureId) ? fixtureId : 0)
  }

  const drops = Array.isArray(siteMap.userMysekaiSiteHarvestResourceDrops)
    ? siteMap.userMysekaiSiteHarvestResourceDrops
    : []

  for (const drop of drops) {
    const status = String(drop?.mysekaiSiteHarvestResourceDropStatus ?? '')
    if (!includeHarvested && status !== 'before_drop') continue

    const x = Number(drop?.positionX)
    const z = Number(drop?.positionZ)
    const resourceType = String(drop?.resourceType ?? '')
    const resourceId = Number(drop?.resourceId)
    const quantity = Number(drop?.quantity ?? 0)

    if (!Number.isFinite(x) || !Number.isFinite(z)) continue
    if (!resourceType || !Number.isFinite(resourceId) || !Number.isFinite(quantity)) continue

    const point = ensurePoint(x, z)
    const resKey = `${resourceType}_${resourceId}`

    if (!point.resources[resKey]) {
      point.resources[resKey] = {
        key: resKey,
        type: resourceType,
        id: resourceId,
        quantity: 0,
        smallIcon: false,
        deleted: false,
        rarity: getResourceRarity(resourceType, resourceId),
        texture: getResourceTexture(resourceType, resourceId),
        hasAttachment: resourceType === 'mysekai_music_record' && ownedMusicRecordIds.has(resourceId),
      }
    }

    point.resources[resKey].quantity += quantity
  }

  for (const point of points.values()) {
    const resources = Object.values(point.resources)

    let hasMaterialDrop = false
    let isCottonFlower = false
    let isBirthdaySapling = false

    for (const res of resources) {
      if ((res.key === 'mysekai_material_1' || res.key === 'mysekai_material_6') && res.quantity === 6) {
        res.deleted = true
      }
      if (res.key === 'mysekai_material_21' || res.key === 'mysekai_material_22') {
        isCottonFlower = true
      }
      if (res.key.startsWith('mysekai_material')) {
        hasMaterialDrop = true
      }
      if (isBirthdayDrop(res) && res.quantity > 16) {
        isBirthdaySapling = true
      }
    }

    for (const res of resources) {
      if (!res.key.startsWith('mysekai_material') && hasMaterialDrop) {
        res.smallIcon = true
      }
      if (isCottonFlower && res.key !== 'mysekai_material_21' && res.key !== 'mysekai_material_22') {
        res.smallIcon = true
      }
      if (isBirthdaySapling) {
        res.smallIcon = !isBirthdayDrop(res)
      } else if (isBirthdayDrop(res)) {
        res.deleted = true
      }
    }
  }

  return [...points.values()].sort((a, b) => {
    if (a.gameZ !== b.gameZ) return a.gameZ - b.gameZ
    return a.gameX - b.gameX
  })
}

function gameToCanvasPosition(
  gameX: number,
  gameZ: number,
  scene: SceneConfig,
  metrics: { width: number; height: number; naturalWidth: number },
) {
  let x = gameX
  let z = gameZ

  if (scene.reverseXY) {
    const tmp = x
    x = z
    z = tmp
  }

  const gridWidth = scene.physicalWidth * (metrics.width / Math.max(1, metrics.naturalWidth))
  const originX = metrics.width / 2 + scene.offsetX
  const originY = metrics.height / 2 + scene.offsetY

  const rawX = originX + x * gridWidth * scene.xDirection
  const rawY = originY + z * gridWidth * scene.yDirection

  return {
    x: Math.max(0, Math.min(metrics.width, rawX)),
    y: Math.max(0, Math.min(metrics.height, rawY)),
  }
}

function extractJstDateParts(date: Date): { year: number; month: number; day: number; hour: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(date)
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
  }
}

function jstDateToUnixSeconds(year: number, month: number, day: number, hour: number): number {
  return Math.floor(Date.UTC(year, month - 1, day, hour - 9, 0, 0) / 1000)
}

function getLatestRefreshUnixSeconds(now: Date): number {
  const jst = extractJstDateParts(now)

  if (jst.hour >= 17) {
    return jstDateToUnixSeconds(jst.year, jst.month, jst.day, 17)
  }
  if (jst.hour >= 5) {
    return jstDateToUnixSeconds(jst.year, jst.month, jst.day, 5)
  }

  const prevMidnightUtc = Date.UTC(jst.year, jst.month - 1, jst.day, 0, 0, 0) - 24 * 60 * 60 * 1000
  const prev = new Date(prevMidnightUtc)
  return jstDateToUnixSeconds(prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate(), 17)
}

function refreshImageMetrics() {
  const image = imageRef.value
  if (!image) return

  const width = image.clientWidth
  const height = image.clientHeight
  if (!width || !height) return

  imageMetrics.value = {
    width,
    height,
    naturalWidth: image.naturalWidth || width,
    naturalHeight: image.naturalHeight || height,
  }
}

function toggleResource(resourceId: string) {
  const next = new Set(visibleResources.value)
  if (next.has(resourceId)) {
    next.delete(resourceId)
  } else {
    next.add(resourceId)
  }
  visibleResources.value = next
}

function clearResourceFilter() {
  visibleResources.value = new Set()
}

async function fetchUserData() {
  if (!currentUserId.value) {
    errorMsg.value = '请先选择一个账号'
    return
  }

  isLoading.value = true
  errorMsg.value = ''

  try {
    const loadMasterTask = ensureMysekaiMasterIconMaps()
    const [mysekaiResult, suiteResult] = await Promise.allSettled([
      accountStore.refreshMysekai(currentUserId.value),
      accountStore.refreshSuite(currentUserId.value),
    ])

    if (mysekaiResult.status === 'rejected') {
      throw mysekaiResult.reason
    }

    const payload = mysekaiResult.value || accountStore.getMysekaiCache(currentUserId.value)
    if (!payload) {
      throw new Error('未读取到 MySekai 数据')
    }

    const parsed = parseMySekaiPayload(payload)
    await loadMasterTask
    if (!Object.keys(parsed.harvestMaps).length) {
      throw new Error('返回数据缺少 userMysekaiHarvestMaps，无法绘制资源地图')
    }

    uploadTime.value = parsed.uploadTime
    parsedData.value = parsed
    if (parsed.uploadTime) {
      accountStore.updateUploadTime(currentUserId.value, parsed.uploadTime)
    }

    if (suiteResult.status === 'rejected') {
      errorMsg.value = `MySekai 已更新，Suite 刷新失败: ${suiteResult.reason?.message || '未知错误'}`
    }

    await nextTick()
    refreshImageMetrics()
  } catch (error: any) {
    errorMsg.value = error?.message || '获取数据失败'
  } finally {
    isLoading.value = false
  }
}

watch([parsedData, selectedSiteId, showHarvested], () => {
  visibleResources.value = new Set()
})

watch(currentMysekaiCache, async (cache) => {
  if (!cache) {
    parsedData.value = null
    uploadTime.value = null
    return
  }

  errorMsg.value = ''
  const parsed = parseMySekaiPayload(cache)
  uploadTime.value = parsed.uploadTime
  parsedData.value = parsed

  if (parsed.uploadTime && currentUserId.value) {
    accountStore.updateUploadTime(currentUserId.value, parsed.uploadTime)
  }

  await ensureMysekaiMasterIconMaps()
  await nextTick()
  refreshImageMetrics()
}, { immediate: true })

watch(
  () => selectedSceneImagePath.value,
  async () => {
    await nextTick()
    refreshImageMetrics()
  },
)

onMounted(() => {
  void ensureMysekaiMasterIconMaps()
  window.addEventListener('resize', refreshImageMetrics)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', refreshImageMetrics)
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <h1 class="text-3xl font-bold">MySekai 资源地图</h1>

    <div class="card bg-base-100 shadow-lg">
      <div class="card-body space-y-4">
        <div class="flex flex-wrap gap-3 items-center">
          <div
            v-if="uploadTimeStr"
            class="badge badge-lg gap-2"
            :class="isDataStale ? 'badge-warning' : 'badge-ghost'"
          >
            更新时间: {{ uploadTimeStr }}
            <span v-if="isDataStale" class="font-bold">(已过期)</span>
          </div>

          <div v-if="sourceLabel" class="badge badge-ghost badge-lg">
            {{ sourceLabel }}
          </div>

          <select
            v-if="accounts.length > 0"
            v-model="currentUserId"
            class="select select-bordered select-sm w-full max-w-xs"
          >
            <option disabled value="">选择账号</option>
            <option v-for="account in accounts" :key="account.userId" :value="account.userId">
              {{ account.userId }} - {{ account.name }}
            </option>
          </select>

          <div v-else class="text-sm text-error">
            请先在个人信息页面添加账号
          </div>

          <button class="btn btn-primary btn-sm" :disabled="!currentUserId || isLoading" @click="fetchUserData">
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            刷新MySekai数据
          </button>

          <span v-if="errorMsg" class="text-error text-sm">{{ errorMsg }}</span>
        </div>

        <div class="flex flex-wrap gap-4 items-end">
          <label class="form-control w-full max-w-xs">
            <div class="label"><span class="label-text">站点</span></div>
            <select v-model.number="selectedSiteId" class="select select-bordered select-sm">
              <option v-for="scene in SITE_SCENES" :key="scene.siteId" :value="scene.siteId">
                {{ scene.name }}
              </option>
            </select>
          </label>

          <label class="label cursor-pointer gap-2">
            <input v-model="showHarvested" type="checkbox" class="checkbox checkbox-sm" />
            <span class="label-text">包含已采集点</span>
          </label>

          <label class="label cursor-pointer gap-2">
            <input v-model="useOriginalMapImage" type="checkbox" class="toggle toggle-sm toggle-secondary" />
            <span class="label-text">不玩抽象了</span>
          </label>
        </div>
      </div>
    </div>

    <div v-if="resourceStats.length > 0" class="card bg-base-100 shadow-lg">
      <div class="card-body p-4 space-y-2">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-bold">
            资源筛选
            <span v-if="isFilterActive">({{ visibleResources.size }}/{{ resourceStats.length }})</span>
          </h3>
          <button v-if="isFilterActive" class="btn btn-ghost btn-xs" @click="clearResourceFilter">清空筛选</button>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="item in resourceStats"
            :key="item.id"
            class="resource-chip"
            :class="[
              visibleResources.has(item.id)
                ? (item.rarity === 2 ? 'resource-chip-super' : item.rarity === 1 ? 'resource-chip-rare' : 'resource-chip-normal')
                : (isFilterActive ? 'resource-chip-muted' : 'resource-chip-normal')
            ]"
            @click="toggleResource(item.id)"
          >
            <img :src="item.texture" class="w-4 h-4 object-contain" />
            <span class="text-xs font-bold">{{ item.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow-lg overflow-hidden">
      <div class="card-body p-0 relative w-full overflow-x-auto">
        <div class="relative inline-block w-full min-w-[900px]">
          <img
            ref="imageRef"
            :src="selectedSceneImagePath"
            class="block w-full h-auto"
            @load="refreshImageMetrics"
          />

          <div class="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div
              v-for="call in renderCalls"
              :key="`res-${call.id}-${call.left}-${call.top}-${call.drawOrder}`"
              class="resource-icon"
              :class="[
                call.rarity === 2 ? 'resource-icon-super' : (call.rarity === 1 ? 'resource-icon-rare' : ''),
                call.smallIcon ? 'resource-icon-small' : '',
              ]"
              :style="{
                left: `${call.left}px`,
                top: `${call.top}px`,
                width: `${call.size}px`,
                height: `${call.size}px`,
              }"
            >
              <img :src="call.texture" class="w-full h-full object-contain" />
              <span v-if="!call.smallIcon && call.quantity > 1" class="resource-qty">{{ call.quantity }}</span>
              <span v-if="call.hasAttachment" class="record-owned" title="已拥有该唱片">Owned</span>
            </div>

            <div
              v-if="spawnMarker"
              class="spawn-marker"
              :style="{ left: `${spawnMarker.x}px`, top: `${spawnMarker.y}px` }"
            />
          </div>
        </div>

        <div v-if="!currentSiteMap && parsedData" class="p-4 text-sm text-warning">
          当前站点没有抓包数据。
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resource-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: 1px solid transparent;
  border-radius: 9999px;
  padding: 0.15rem 0.5rem;
  transition: all 0.15s ease;
}

.resource-chip-normal {
  background: color-mix(in srgb, var(--fallback-b2, #e5e7eb) 70%, transparent);
  border-color: color-mix(in srgb, var(--fallback-b3, #d1d5db) 80%, transparent);
}

.resource-chip-rare {
  background: rgba(37, 99, 235, 0.16);
  border-color: rgba(37, 99, 235, 0.45);
}

.resource-chip-super {
  background: rgba(220, 38, 38, 0.16);
  border-color: rgba(220, 38, 38, 0.5);
}

.resource-chip-muted {
  opacity: 0.38;
  filter: grayscale(0.85);
}

.resource-icon {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  border: 1px solid rgba(59, 130, 246, 0.38);
  background: rgba(15, 23, 42, 0.35);
  box-shadow: 0 1px 4px rgba(2, 6, 23, 0.35);
}

.resource-icon-small {
  border-color: rgba(59, 130, 246, 0.55);
}

.resource-icon-super {
  border-width: 2px;
  border-color: rgba(239, 68, 68, 0.9);
  box-shadow:
    0 0 10px rgba(239, 68, 68, 0.92),
    0 0 18px rgba(239, 68, 68, 0.68),
    0 0 30px rgba(239, 68, 68, 0.45);
  animation: rareGlowPulseSuper 1.35s ease-in-out infinite;
}

.resource-icon-rare {
  border-color: rgba(56, 189, 248, 0.92);
  box-shadow:
    0 0 8px rgba(56, 189, 248, 0.88),
    0 0 14px rgba(56, 189, 248, 0.58),
    0 0 24px rgba(56, 189, 248, 0.38);
  animation: rareGlowPulse 1.6s ease-in-out infinite;
}

.resource-icon-rare img,
.resource-icon-super img {
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.6));
}

@keyframes rareGlowPulse {
  0%,
  100% {
    box-shadow:
      0 0 6px rgba(56, 189, 248, 0.7),
      0 0 12px rgba(56, 189, 248, 0.45),
      0 0 22px rgba(56, 189, 248, 0.28);
  }
  50% {
    box-shadow:
      0 0 11px rgba(56, 189, 248, 0.95),
      0 0 20px rgba(56, 189, 248, 0.72),
      0 0 34px rgba(56, 189, 248, 0.48);
  }
}

@keyframes rareGlowPulseSuper {
  0%,
  100% {
    box-shadow:
      0 0 8px rgba(239, 68, 68, 0.78),
      0 0 16px rgba(239, 68, 68, 0.58),
      0 0 28px rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow:
      0 0 14px rgba(239, 68, 68, 1),
      0 0 24px rgba(239, 68, 68, 0.82),
      0 0 42px rgba(239, 68, 68, 0.58);
  }
}

.resource-qty {
  position: absolute;
  right: -0.01rem;
  bottom: -0.01rem;
  line-height: 1;
  text-align: center;
  font-size: 0.44rem;
  font-weight: 700;
  color: #fff;
  background: transparent;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.9);
}

.record-owned {
  position: absolute;
  top: -0.45rem;
  right: -0.2rem;
  font-size: 0.52rem;
  font-weight: 700;
  color: #fef3c7;
  background: rgba(180, 83, 9, 0.85);
  padding: 0 0.15rem;
  border-radius: 0.2rem;
  line-height: 0.75rem;
  height: 0.75rem;
}

.spawn-marker {
  position: absolute;
  width: 14px;
  height: 14px;
  transform: translate(-50%, -50%) rotate(45deg);
  border: 2px solid rgba(15, 118, 110, 0.9);
  background: rgba(45, 212, 191, 0.35);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
}
</style>
