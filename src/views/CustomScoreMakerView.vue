<script setup lang="ts">
import { computed, onMounted, ref, toRef } from 'vue'
import { BarChart3, Eye, Heart, Music2, Play, PlayCircle, RefreshCw, Search, Sparkles, Copy } from 'lucide-vue-next'
import { renderSusToSvg, revokeSus2ImgResult, type Sus2ImgFrontendResult } from 'sekai-sus2img'
import AssetImage from '@/components/AssetImage.vue'
import apiClient from '@/api/client'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { toRomaji } from '@/utils/kanaToRomaji'

declare global {
  interface Window {
    SekaiSusJsonConverter?: {
      jsonToSus: (scoreJson: unknown, options?: Record<string, unknown>) => string
    }
    SekaiSusJsonConverterVersion?: string
  }
}

type FeedTab = 'ranking' | 'new' | 'search' | 'official_all'
type RankingMode = 'daily' | 'total'
type SearchOrder = 'new_arrival' | 'review_count' | 'review_count_daily'
type ScoreSource = 'user' | 'official'

interface FeedResponse {
  userCustomMusicScorePublishedList?: UserScoreItem[]
  customMusicScoreOfficialCreatorPublishedList?: OfficialScoreStat[]
}

interface UserScoreItem {
  userCustomMusicScoreInfoJson?: {
    musicId?: number
    title?: string
    userCustomMusicScorePath?: string
  }
  userCustomMusicScoreId: string
  userId: number
  userName: string
  musicId: number
  customMusicScoreTags?: number[]
  musicDifficultyType: string
  playLevel: number
  description?: string
  isDerivativeAllowed?: boolean
  previewStartTimeSec?: number
  publishedAt?: number
  reviewCount?: number
  playCount?: number
  fullComboRate?: number
  customMusicScoreSearchSortValue?: number
}

interface OfficialScoreStat {
  customMusicScoreId: string
  reviewCount?: number
  playCount?: number
  fullComboRate?: number
  customMusicScoreSearchSortValue?: number
}

interface OfficialCreator {
  id: number
  scoreId: string
  customMusicScoreOfficialCreatorProfileId: number
  musicId: number
  musicDifficultyType: string
  playLevel: number
  title: string
  description?: string
  tagId1?: number
  tagId2?: number
  tagId3?: number
  isDerivativeAllowed?: boolean
  previewStartTimeSec?: number
  publishedStartAt?: number
}

interface OfficialCreatorProfile {
  id: number
  name: string
}

interface CustomMusicScoreTag {
  id: number
  name: string
}

interface MusicMaster {
  id: number
  title: string
  lyricist?: string
  composer?: string
  arranger?: string
  assetbundleName: string
  publishedAt?: number
  pronunciation?: string
  fillerSec?: number
  filterSec?: number
}

interface MusicVocal {
  musicId: number
  caption: string
  assetbundleName: string
}

interface DisplayScore {
  key: string
  source: ScoreSource
  customMusicScoreId: string
  userCustomMusicScorePath?: string
  title: string
  creatorName: string
  creatorUserId?: number
  musicId: number
  musicTitle: string
  jacketAssetbundleName?: string
  musicDifficultyType: string
  playLevel: number
  description: string
  tagIds: number[]
  publishedAt?: number
  reviewCount: number
  playCount: number
  fullComboRate: number
  customMusicScoreSearchSortValue: number
  previewStartTimeSec?: number
  isDerivativeAllowed?: boolean
}

interface ChartSusUploadResponse {
  success: boolean
  id?: string
  path?: string
  url?: string
  message?: string
}

const GAME_API_HOST = 'https://api.unipjsk.com'
const GAME_SCORE_BLOB_FULL_BASE = '/blob/custom-music-score/full'
const CHART_PLAYBACK_HOST = 'https://chartview.unipjsk.com'
const CONVERTER_CACHE_KEY = 'custom-score-maker-20260430-critical-color-v10'
const CONVERTER_SCRIPT_URL = `/sus_json_converter.js?cacheKey=${encodeURIComponent(CONVERTER_CACHE_KEY)}`

const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const activeTab = ref<FeedTab>('ranking')
const rankingMode = ref<RankingMode>('total')
const searchMusicId = ref('')
const searchMode = ref<'music' | 'id'>('music')
const searchScoreId = ref('')
const musicSearchQuery = ref('')
const musicSearchResults = ref<MusicMaster[]>([])
const selectedSearchMusic = ref<MusicMaster | null>(null)
const searchOrder = ref<SearchOrder>('new_arrival')
const searchDifficulty = ref('')
const isLoading = ref(false)
const isMasterLoading = ref(false)
const error = ref('')
const scores = ref<DisplayScore[]>([])

const selectedScore = ref<DisplayScore | null>(null)
const selectedSus = ref('')
const selectedSusConverterKey = ref('')
const selectedSvg = ref('')
const selectedPreviewUrl = ref('')
const isFetchingScore = ref(false)
const isRenderingPreview = ref(false)
const scoreError = ref('')
const previewInfo = ref('')
const scoreTaskLabel = ref('')

const officialCreators = ref<OfficialCreator[]>([])
const officialProfiles = ref<OfficialCreatorProfile[]>([])
const tags = ref<CustomMusicScoreTag[]>([])
const musics = ref<MusicMaster[]>([])
const vocals = ref<MusicVocal[]>([])

let svgRenderResult: Sus2ImgFrontendResult | null = null
let converterPromise: Promise<void> | null = null
let converterPromiseCacheKey = ''

const assetsHost = computed(() => settingsStore.assetsHost.replace(/\/+$/, ''))
const translations = toRef(masterStore, 'translations')

const officialCreatorByScoreId = computed(() => {
  const map = new Map<string, OfficialCreator>()
  for (const item of officialCreators.value) map.set(item.scoreId, item)
  return map
})

const officialProfileById = computed(() => {
  const map = new Map<number, OfficialCreatorProfile>()
  for (const item of officialProfiles.value) map.set(item.id, item)
  return map
})

const tagById = computed(() => {
  const map = new Map<number, CustomMusicScoreTag>()
  for (const item of tags.value) map.set(item.id, item)
  return map
})

const musicById = computed(() => {
  const map = new Map<number, MusicMaster>()
  for (const item of musics.value) map.set(item.id, item)
  return map
})

const endpointPath = computed(() => {
  if (activeTab.value === 'official_all') return ''

  const params = new URLSearchParams()
  if (searchDifficulty.value) {
    params.append('musicDifficultyType', searchDifficulty.value)
  }

  if (activeTab.value === 'new') {
    return `/api/user/{user_id}/custom-music-score/published/tab/new-arrival${params.toString() ? '?' + params.toString() : ''}`
  }

  if (activeTab.value === 'search') {
    if (searchMode.value === 'id' && searchScoreId.value.trim()) {
      return `/api/user/{user_id}/custom-music-score/published/search/${searchScoreId.value.trim()}`
    }
    if (searchMode.value === 'music' && searchMusicId.value.trim()) {
      params.append('musicId', searchMusicId.value.trim())
    }
    params.append('displayOrderCategory', searchOrder.value)
    return `/api/user/{user_id}/custom-music-score/published/search?${params.toString()}`
  }

  const suffix = rankingMode.value === 'daily' ? 'review-count-daily' : 'review-count'
  return `/api/user/{user_id}/custom-music-score/published/tab/ranking/${suffix}${params.toString() ? '?' + params.toString() : ''}`
})

onMounted(async () => {
  await loadMasterData()
  await loadFeed()
})

function revokeSvgResult() {
  if (svgRenderResult) {
    revokeSus2ImgResult(svgRenderResult)
    svgRenderResult = null
  }
}

function formatNumber(value: number | undefined) {
  return Math.trunc(Number(value ?? 0)).toLocaleString('zh-CN')
}

function formatPercent(value: number | undefined) {
  const numeric = Number(value ?? 0)
  return `${numeric.toFixed(numeric >= 10 ? 1 : 2)}%`
}

function formatDate(timestamp?: number) {
  if (!timestamp) return '未知时间'
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function difficultyClass(difficulty: string) {
  const key = difficulty.toLowerCase()
  if (key === 'expert') return 'badge-error'
  if (key === 'master') return 'badge-secondary'
  if (key === 'append') return 'badge-accent'
  if (key === 'hard') return 'badge-warning'
  if (key === 'normal') return 'badge-info'
  return 'badge-success'
}

function getTagNames(score: DisplayScore) {
  return score.tagIds
    .map((id) => tagById.value.get(id)?.name)
    .filter((name): name is string => Boolean(name))
}

function getJacketUrl(score: DisplayScore) {
  if (!score.jacketAssetbundleName) return ''
  return `${assetsHost.value}/startapp/music/jacket/${score.jacketAssetbundleName}/${score.jacketAssetbundleName}.png`
}

function getOfficialScoreUrl(scoreId: string) {
  return `${assetsHost.value}/ondemand/score_maker/custom_score/${encodeURIComponent(scoreId)}/full`
}

function getUserScoreUrl(scorePath: string) {
  return `${GAME_API_HOST}${GAME_SCORE_BLOB_FULL_BASE}/${scorePath}`
}

function searchMusic() {
  if (!musicSearchQuery.value.trim()) {
    musicSearchResults.value = []
    return
  }

  const query = musicSearchQuery.value.toLowerCase()
  const matched = musics.value.filter((music) => {
    const titleMatch = music.title.toLowerCase().includes(query)
    const translationMatch = translations.value[music.id]?.toLowerCase().includes(query)
    const pronunciationMatch = music.pronunciation?.includes(query)
    const romajiMatch = toRomaji(music.pronunciation || '').toLowerCase().includes(query)
    const idMatch = String(music.id) === query
    return titleMatch || translationMatch || pronunciationMatch || romajiMatch || idMatch
  })

  matched.sort((a, b) => {
    const publishedCompare = Number(b.publishedAt ?? 0) - Number(a.publishedAt ?? 0)
    if (publishedCompare !== 0) return publishedCompare
    return b.id - a.id
  })

  musicSearchResults.value = matched.slice(0, 10)
}

function selectSearchMusic(music: MusicMaster) {
  selectedSearchMusic.value = music
  searchMusicId.value = String(music.id)
  musicSearchQuery.value = ''
  musicSearchResults.value = []
}

function clearSearchMusic() {
  selectedSearchMusic.value = null
  searchMusicId.value = ''
  musicSearchQuery.value = ''
  musicSearchResults.value = []
}

function getMusicJacketUrl(music: MusicMaster) {
  return `${assetsHost.value}/startapp/music/jacket/${music.assetbundleName}/${music.assetbundleName}.png`
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function base64ToBytes(base64Text: string) {
  const normalized = base64Text
    .trim()
    .replace(/^data:[^,]+,/, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function tryGunzip(bytes: Uint8Array) {
  if (!('DecompressionStream' in window)) {
    throw new Error('当前浏览器不支持 gzip 解压')
  }

  const payload = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const stream = new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function decodeScoreBase64(base64Text: string) {
  const bytes = base64ToBytes(base64Text)
  let decoded = bytes
  try {
    decoded = await tryGunzip(bytes)
  } catch {
    decoded = bytes
  }
  return new TextDecoder().decode(decoded)
}

function loadSusConverter() {
  if (window.SekaiSusJsonConverter && window.SekaiSusJsonConverterVersion === CONVERTER_CACHE_KEY) {
    return Promise.resolve()
  }
  if (converterPromise && converterPromiseCacheKey === CONVERTER_CACHE_KEY) return converterPromise
  converterPromise = null
  converterPromiseCacheKey = CONVERTER_CACHE_KEY

  converterPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CONVERTER_SCRIPT_URL
    script.async = true
    script.onload = () => {
      if (window.SekaiSusJsonConverter) {
        window.SekaiSusJsonConverterVersion = CONVERTER_CACHE_KEY
        resolve()
      } else {
        reject(new Error('SUS 转换器加载后未注册'))
      }
    }
    script.onerror = () => reject(new Error('SUS 转换器加载失败'))
    document.head.appendChild(script)
  })

  return converterPromise
}

async function loadMasterData() {
  isMasterLoading.value = true
  try {
    masterStore.getTranslations().catch((reason) => console.error('加载翻译失败:', reason))
    const [creatorData, profileData, tagData, musicData, vocalData] = await Promise.all([
      masterStore.getMaster<OfficialCreator>('customMusicScoreOfficialCreators'),
      masterStore.getMaster<OfficialCreatorProfile>('customMusicScoreOfficialCreatorProfiles'),
      masterStore.getMaster<CustomMusicScoreTag>('customMusicScoreTags'),
      masterStore.getMaster<MusicMaster>('musics'),
      masterStore.getMaster<MusicVocal>('musicVocals'),
    ])
    officialCreators.value = creatorData
    officialProfiles.value = profileData
    tags.value = tagData
    musics.value = musicData
    vocals.value = vocalData
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '加载 masterdata 失败'
  } finally {
    isMasterLoading.value = false
  }
}

function mergeUserScore(item: UserScoreItem): DisplayScore {
  const musicId = item.userCustomMusicScoreInfoJson?.musicId ?? item.musicId
  const music = musicById.value.get(musicId)
  return {
    key: `user:${item.userCustomMusicScoreId}`,
    source: 'user',
    customMusicScoreId: item.userCustomMusicScoreId,
    userCustomMusicScorePath: item.userCustomMusicScoreInfoJson?.userCustomMusicScorePath,
    title: item.userCustomMusicScoreInfoJson?.title || `自制谱面 ${item.userCustomMusicScoreId}`,
    creatorName: item.userName,
    creatorUserId: item.userId,
    musicId,
    musicTitle: music?.title ?? `Music ${musicId}`,
    jacketAssetbundleName: music?.assetbundleName,
    musicDifficultyType: item.musicDifficultyType,
    playLevel: item.playLevel,
    description: item.description || '',
    tagIds: item.customMusicScoreTags ?? [],
    publishedAt: item.publishedAt,
    reviewCount: item.reviewCount ?? 0,
    playCount: item.playCount ?? 0,
    fullComboRate: item.fullComboRate ?? 0,
    customMusicScoreSearchSortValue: item.customMusicScoreSearchSortValue ?? 9999,
    previewStartTimeSec: item.previewStartTimeSec,
    isDerivativeAllowed: item.isDerivativeAllowed,
  }
}

function mergeOfficialScore(item: OfficialScoreStat): DisplayScore {
  const master = officialCreatorByScoreId.value.get(item.customMusicScoreId)
  const musicId = master?.musicId ?? 0
  const music = musicById.value.get(musicId)
  const profile = master ? officialProfileById.value.get(master.customMusicScoreOfficialCreatorProfileId) : null
  const tagIds = [master?.tagId1, master?.tagId2, master?.tagId3].filter((id): id is number => typeof id === 'number')

  return {
    key: `official:${item.customMusicScoreId}`,
    source: 'official',
    customMusicScoreId: item.customMusicScoreId,
    title: master?.title || `官方指定谱面 ${item.customMusicScoreId}`,
    creatorName: profile?.name || '官方指定创作者',
    musicId,
    musicTitle: music?.title ?? (musicId ? `Music ${musicId}` : '未知歌曲'),
    jacketAssetbundleName: music?.assetbundleName,
    musicDifficultyType: master?.musicDifficultyType ?? 'append',
    playLevel: master?.playLevel ?? 0,
    description: master?.description || '',
    tagIds,
    publishedAt: master?.publishedStartAt,
    reviewCount: item.reviewCount ?? 0,
    playCount: item.playCount ?? 0,
    fullComboRate: item.fullComboRate ?? 0,
    customMusicScoreSearchSortValue: item.customMusicScoreSearchSortValue ?? 9999,
    previewStartTimeSec: master?.previewStartTimeSec,
    isDerivativeAllowed: master?.isDerivativeAllowed,
  }
}

function normalizeFeed(data: FeedResponse) {
  const userScores = (data.userCustomMusicScorePublishedList ?? []).map(mergeUserScore)
  const officialScores = (data.customMusicScoreOfficialCreatorPublishedList ?? []).map(mergeOfficialScore)
  return [...userScores, ...officialScores].sort((a, b) => (
    a.customMusicScoreSearchSortValue - b.customMusicScoreSearchSortValue
    || b.reviewCount - a.reviewCount
    || b.playCount - a.playCount
  ))
}

async function loadFeed() {
  error.value = ''
  scoreError.value = ''
  scores.value = []
  selectedScore.value = null
  selectedSus.value = ''
  selectedSusConverterKey.value = ''
  selectedSvg.value = ''
  revokeSvgResult()


  if (activeTab.value === 'search' && searchMode.value === 'id' && !searchScoreId.value.trim()) {
    return
  }

  isLoading.value = true
  try {
    if (!musics.value.length) {
      await loadMasterData()
    }

    if (activeTab.value === 'official_all') {
      let list = officialCreators.value
      if (searchDifficulty.value) {
        list = list.filter(m => m.musicDifficultyType?.toLowerCase() === searchDifficulty.value)
      }
      scores.value = list.map((master): DisplayScore => {
        const musicId = master.musicId
        const music = musicById.value.get(musicId)
        const profile = officialProfileById.value.get(master.customMusicScoreOfficialCreatorProfileId)
        const tagIds = [master.tagId1, master.tagId2, master.tagId3].filter((id): id is number => typeof id === 'number')

        return {
          key: `official:${master.scoreId}`,
          source: 'official',
          customMusicScoreId: master.scoreId,
          title: master.title || `官方指定谱面 ${master.scoreId}`,
          creatorName: profile?.name || '官方指定创作者',
          musicId,
          musicTitle: music?.title ?? (musicId ? `Music ${musicId}` : '未知歌曲'),
          jacketAssetbundleName: music?.assetbundleName,
          musicDifficultyType: master.musicDifficultyType ?? 'append',
          playLevel: master.playLevel ?? 0,
          description: master.description || '',
          tagIds,
          publishedAt: master.publishedStartAt,
          reviewCount: 0,
          playCount: 0,
          fullComboRate: 0,
          customMusicScoreSearchSortValue: 0,
          previewStartTimeSec: master.previewStartTimeSec,
          isDerivativeAllowed: master.isDerivativeAllowed,
        }
      }).sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
      return
    }

    const response = await fetch(`${GAME_API_HOST}${endpointPath.value}`)
    if (!response.ok) {
      if (response.status === 404) throw new Error('未找到该谱面')
      throw new Error(`请求失败：HTTP ${response.status}`)
    }
    const data = await response.json()
    if (activeTab.value === 'search' && searchMode.value === 'id') {
      if (data && typeof data === 'object' && 'userCustomMusicScoreInfoJson' in data && 'userCustomMusicScoreId' in (data.userCustomMusicScoreInfoJson as any)) {
        scores.value = normalizeFeed({ userCustomMusicScorePublishedList: [data.userCustomMusicScoreInfoJson] } as any)
      } else {
        scores.value = normalizeFeed(data as FeedResponse)
      }
    } else {
      scores.value = normalizeFeed(data as FeedResponse)
    }
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '加载谱面列表失败'
  } finally {
    isLoading.value = false
  }
}

async function fetchScoreBase64(score: DisplayScore) {
  const url = score.source === 'official'
    ? getOfficialScoreUrl(score.customMusicScoreId)
    : score.userCustomMusicScorePath
      ? getUserScoreUrl(score.userCustomMusicScorePath)
      : ''

  if (!url) {
    throw new Error('这个用户自制谱面缺少 userCustomMusicScorePath')
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`谱面下载失败：HTTP ${response.status}`)
  }
  return await response.text()
}

function writeFlatPreviewLoading(previewTab: Window | null) {
  if (!previewTab || previewTab.closed) return

  previewTab.document.title = '正在生成平面预览...'
  previewTab.document.body.innerHTML = `
    <div style="min-height:100vh;display:grid;place-items:center;background:#1a1a2e;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="text-align:center;">
        <div style="font-size:20px;font-weight:700;margin-bottom:8px;">正在生成平面预览</div>
        <div style="font-size:14px;color:rgba(255,255,255,.65);">请稍候，生成完成后会自动显示。</div>
      </div>
    </div>
  `
  previewTab.focus()
}

function write3dPreviewLoading(previewTab: Window | null) {
  if (!previewTab || previewTab.closed) return

  previewTab.document.title = '正在生成 3D 预览链接...'
  previewTab.document.body.innerHTML = `
    <div style="min-height:100vh;display:grid;place-items:center;background:#1a1a2e;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="text-align:center;">
        <div style="font-size:20px;font-weight:700;margin-bottom:8px;">正在生成 3D 预览链接</div>
        <div style="font-size:14px;color:rgba(255,255,255,.65);">请稍候，链接生成完成后会自动跳转。</div>
      </div>
    </div>
  `
  previewTab.focus()
}

function navigatePreviewTarget(previewTab: Window | null, url: string) {
  if (previewTab && !previewTab.closed) {
    previewTab.location.href = url
    return
  }
  window.location.href = url
}

async function prepareScore(score: DisplayScore, renderPreview = true): Promise<boolean> {
  isFetchingScore.value = true
  scoreTaskLabel.value = '下载谱面中'
  scoreError.value = ''
  previewInfo.value = ''
  revokeSvgResult()
  selectedSvg.value = ''
  selectedPreviewUrl.value = ''

  try {
    await loadSusConverter()
    const base64Text = await fetchScoreBase64(score)
    scoreTaskLabel.value = '解压谱面中'
    const jsonText = await decodeScoreBase64(base64Text)
    scoreTaskLabel.value = '转换 SUS 中'
    const scoreJson = JSON.parse(jsonText)
    const converter = window.SekaiSusJsonConverter
    if (!converter) {
      throw new Error('SUS 转换器不可用')
    }

    const sus = converter.jsonToSus(scoreJson, {
      title: score.title,
      artist: score.musicTitle,
      designer: score.creatorName,
      songId: score.musicId,
    })

    selectedScore.value = score
    selectedSus.value = sus
    selectedSusConverterKey.value = CONVERTER_CACHE_KEY

    if (renderPreview) {
      await renderFlatPreview(score, sus)
    }
    return true
  } catch (reason) {
    scoreError.value = reason instanceof Error ? reason.message : '谱面转换失败'
    return false
  } finally {
    isFetchingScore.value = false
    scoreTaskLabel.value = ''
  }
}

async function renderFlatPreview(score: DisplayScore, susText = selectedSus.value) {
  if (!susText) return
  isRenderingPreview.value = true
  scoreTaskLabel.value = '生成平面预览中'
  selectedSvg.value = ''
  selectedPreviewUrl.value = ''
  revokeSvgResult()

  try {
    const result = await renderSusToSvg({
      sus: susText,
      title: score.title,
      artist: score.musicTitle,
      author: score.creatorName,
      difficulty: score.musicDifficultyType.toUpperCase(),
      playlevel: String(score.playLevel || ''),
      pixel: '220',
      skin: 'custom01',
      jacket: getJacketUrl(score),
    })
    svgRenderResult = result
    selectedSvg.value = result.svgText
    selectedPreviewUrl.value = result.url
  } catch (reason) {
    scoreError.value = reason instanceof Error ? reason.message : '平面预览生成失败'
  } finally {
    isRenderingPreview.value = false
    scoreTaskLabel.value = ''
  }
}

async function openFlatPreview(score: DisplayScore) {
  const previewTab = window.open('', '_blank')
  if (!previewTab) {
    scoreError.value = '浏览器拦截了新窗口，请允许弹窗后再试。'
    return
  }
  writeFlatPreviewLoading(previewTab)
  const ok = await prepareScore(score, true)
  if (!ok || !selectedSvg.value) {
    if (previewTab && !previewTab.closed) {
      previewTab.close()
    }
    return
  }
  if (previewTab && !previewTab.closed && selectedPreviewUrl.value) {
    previewTab.location.href = selectedPreviewUrl.value
  }
}

async function uploadSusForPreview(susText: string) {
  const response = await apiClient.post<ChartSusUploadResponse>('/api/chart-sus', { sus: susText })
  const data = response.data
  const path = data.path || data.url
  if (!data.success || !path) {
    throw new Error(data.message || 'SUS 临时链接生成失败')
  }
  return new URL(path, apiClient.defaults.baseURL || window.location.origin).toString()
}

async function buildChartPreviewUrl(score: DisplayScore, susText: string) {
  const music = musicById.value.get(score.musicId)
  const vocal = vocals.value.find((item) => item.musicId === score.musicId)
  const susUrl = await uploadSusForPreview(susText)
  const offsetSec = Number(music?.filterSec || music?.fillerSec || 0)

  const cfg: Record<string, string | number> = {
    s: susUrl,
    t: score.title,
    d: score.musicDifficultyType.toUpperCase(),
  }
  if (vocal) cfg.b = `${assetsHost.value}/ondemand/music/long/${vocal.assetbundleName}/${vocal.assetbundleName}.mp3`
  if (score.jacketAssetbundleName) cfg.c = getJacketUrl(score)
  if (offsetSec > 0) cfg.o = Math.round(offsetSec * 1000)
  if (music?.lyricist) cfg.ly = music.lyricist
  if (music?.composer) cfg.co = music.composer
  if (music?.arranger) cfg.ar = music.arranger
  if (vocal?.caption) cfg.v = vocal.caption

  const bytes = new TextEncoder().encode(JSON.stringify(cfg))
  const cfgBase64Url = bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  return `${CHART_PLAYBACK_HOST}/preview?cfg=${cfgBase64Url}`
}

async function open3dPreview(score: DisplayScore) {
  const previewTab = window.open('', '_blank')
  write3dPreviewLoading(previewTab)

  if (
    selectedScore.value?.key !== score.key ||
    !selectedSus.value ||
    selectedSusConverterKey.value !== CONVERTER_CACHE_KEY
  ) {
    await prepareScore(score, false)
  }
  if (!selectedSus.value) {
    if (previewTab && !previewTab.closed) previewTab.close()
    return
  }

  previewInfo.value = ''
  scoreError.value = ''
  scoreTaskLabel.value = '生成 3D 预览链接中'
  try {
    const previewUrl = await buildChartPreviewUrl(score, selectedSus.value)
    navigatePreviewTarget(previewTab, previewUrl)
  } catch (reason) {
    if (previewTab && !previewTab.closed) previewTab.close()
    scoreError.value = reason instanceof Error ? reason.message : '3D 预览链接生成失败'
  } finally {
    scoreTaskLabel.value = ''
  }
}

function copyScoreId(id: string) {
  navigator.clipboard.writeText(id).catch(err => {
    console.error('Failed to copy ID:', err)
  })
}

function searchById() {
  if (!searchScoreId.value.trim()) return
  activeTab.value = 'search'
  searchMode.value = 'id'
  loadFeed()
}

function selectTab(tab: FeedTab) {
  if (activeTab.value === tab) {
    if (tab === 'search') searchMode.value = 'music'
    return
  }
  activeTab.value = tab
  if (tab === 'ranking') {
    rankingMode.value = rankingMode.value || 'total'
  }
  void loadFeed()
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">谱面Maker</h1>
        <p class="text-sm text-base-content/60 mt-1">浏览游戏内自制谱面</p>
      </div>
      
      <div class="flex items-center gap-2 w-full lg:w-auto">
        <input
          v-model="searchScoreId"
          type="text"
          placeholder="输入投稿 ID 搜索..."
          class="input input-bordered input-sm w-full sm:w-64 focus:ring-2 focus:ring-primary/20 transition-all"
          @keydown.enter="searchById"
        />
        <button
          class="btn btn-sm btn-primary shadow-sm px-3"
          :disabled="isLoading || isMasterLoading || !searchScoreId.trim()"
          @click="searchById"
        >
          <Search class="w-4 h-4" />
        </button>
      </div>
    </div>

    <div class="alert alert-warning shadow-sm text-sm">
      <span>游戏内自制的谱面预览暂不成熟，长条节点会出错，仅供参考</span>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-1.5 bg-base-200/50 p-1.5 rounded-xl shadow-inner border border-base-200">
      <button
        class="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
        :class="activeTab === 'ranking' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/60 hover:text-base-content hover:bg-base-200/50'"
        @click="selectTab('ranking')"
      >
        <BarChart3 class="w-4 h-4" />
        排行榜
      </button>
      <button
        class="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
        :class="activeTab === 'new' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/60 hover:text-base-content hover:bg-base-200/50'"
        @click="selectTab('new')"
      >
        <Sparkles class="w-4 h-4" />
        新谱
      </button>
      <button
        class="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
        :class="activeTab === 'search' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/60 hover:text-base-content hover:bg-base-200/50'"
        @click="selectTab('search')"
      >
        <Search class="w-4 h-4" />
        按歌曲搜索
      </button>
      <button
        class="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
        :class="activeTab === 'official_all' ? 'bg-base-100 text-primary shadow-sm' : 'text-base-content/60 hover:text-base-content hover:bg-base-200/50'"
        @click="selectTab('official_all')"
      >
        <Music2 class="w-4 h-4" />
        官方指定创作者
      </button>
    </div>

    <div class="card bg-base-100 shadow-sm border border-base-200 relative z-30 overflow-visible">
      <div class="card-body p-4 sm:p-6 gap-4">
        <div v-if="activeTab === 'ranking'" class="flex flex-wrap items-center justify-between gap-3">
          <div class="join shadow-sm">
            <button class="btn btn-sm join-item" :class="{ 'btn-primary': rankingMode === 'daily', 'bg-base-200 border-none hover:bg-base-300': rankingMode !== 'daily' }" @click="rankingMode = 'daily'">日排行榜</button>
            <button class="btn btn-sm join-item" :class="{ 'btn-primary': rankingMode === 'total', 'bg-base-200 border-none hover:bg-base-300': rankingMode !== 'total' }" @click="rankingMode = 'total'">综合排行榜</button>
          </div>
          <div class="flex items-center gap-2">
            <select v-model="searchDifficulty" class="select select-bordered select-sm w-28 sm:w-32 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all" @change="loadFeed">
              <option value="">所有难度</option>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
              <option value="master">Master</option>
              <option value="append">Append</option>
            </select>
            <button class="btn btn-sm btn-primary gap-2 shadow-sm" :disabled="isLoading || isMasterLoading" @click="loadFeed">
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
              刷新
            </button>
          </div>
        </div>

        <div v-if="activeTab === 'new' || activeTab === 'official_all'" class="flex justify-end gap-2">
          <select v-model="searchDifficulty" class="select select-bordered select-sm w-28 sm:w-32 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all" @change="loadFeed">
            <option value="">所有难度</option>
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
            <option value="master">Master</option>
            <option value="append">Append</option>
          </select>
          <button class="btn btn-sm btn-primary gap-2 shadow-sm" :disabled="isLoading || isMasterLoading" @click="loadFeed">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
            刷新
          </button>
        </div>

        <div v-if="activeTab === 'search'" class="flex flex-col gap-4">
          <div v-if="searchMode === 'music'" class="grid md:grid-cols-[minmax(0,1fr)_120px_130px] gap-3">
            <div class="form-control w-full relative">
              <div class="relative group">
                <input
                  v-model="musicSearchQuery"
                  type="text"
                  placeholder="输入歌名、假名或 ID 搜索..."
                  class="input input-bordered w-full pr-10 focus:ring-2 focus:ring-primary/20 transition-all"
                  @input="searchMusic"
                  @focus="searchMusic"
                />
                <Search class="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 group-focus-within:text-primary transition-colors" />
              </div>

              <ul
                v-if="musicSearchResults.length > 0"
                class="menu bg-base-100/95 backdrop-blur-md border border-base-200 w-full rounded-box shadow-2xl absolute top-14 z-[100] max-h-72 flex-nowrap overflow-y-auto"
              >
                <li v-for="music in musicSearchResults" :key="music.id">
                  <a class="py-2.5 px-3 text-sm flex items-center gap-3 hover:bg-base-200 transition-colors" @click="selectSearchMusic(music)">
                    <AssetImage
                      :src="getMusicJacketUrl(music)"
                      class="w-10 h-10 rounded-md shrink-0 object-cover shadow-sm"
                    />
                    <div class="flex flex-col flex-1 min-w-0">
                      <span class="truncate font-medium">{{ music.title }}</span>
                      <span class="text-xs text-base-content/50 truncate">{{ toRomaji(music.pronunciation || '') }}</span>
                    </div>
                    <span class="badge badge-sm badge-ghost font-mono opacity-50">#{{ music.id }}</span>
                  </a>
                </li>
              </ul>
            </div>
            
            <select v-model="searchDifficulty" class="select select-bordered w-full focus:ring-2 focus:ring-primary/20 transition-all">
              <option value="">所有难度</option>
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
              <option value="master">Master</option>
              <option value="append">Append</option>
            </select>
            <select v-model="searchOrder" class="select select-bordered w-full focus:ring-2 focus:ring-primary/20 transition-all">
              <option value="new_arrival">新谱优先</option>
              <option value="popular_daily">日热度</option>
              <option value="high_difficulty">高难优先</option>
              <option value="random">随机探索</option>
            </select>
          </div>

          <div v-if="searchMode === 'music'" class="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div v-if="selectedSearchMusic" class="bg-base-200/40 border border-base-200 rounded-xl p-3 flex flex-1 items-center gap-3 min-w-0 w-full animate-in fade-in slide-in-from-top-2 duration-300">
              <AssetImage :src="getMusicJacketUrl(selectedSearchMusic)" class="w-14 h-14 rounded-lg shadow-sm object-cover ring-1 ring-base-content/5" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold truncate text-base-content">{{ selectedSearchMusic.title }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-base-content/60 font-mono">ID: {{ selectedSearchMusic.id }}</span>
                </div>
              </div>
              <button
                class="btn btn-sm btn-circle btn-ghost text-base-content/50 hover:text-error hover:bg-error/10 transition-colors"
                title="清除选择"
                @click="clearSearchMusic"
              >
                ×
              </button>
            </div>
            <div v-else class="flex-1"></div>
            
            <button
              class="btn btn-primary shadow-sm hover:shadow-md transition-all gap-2 w-full sm:w-32 shrink-0"
              :disabled="isLoading || isMasterLoading"
              @click="loadFeed"
            >
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
              搜索
            </button>
          </div>
        </div>

        <div v-if="error" class="alert alert-error shadow-sm text-sm">
          <span>{{ error }}</span>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <div v-if="scoreTaskLabel || scoreError || previewInfo" class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body p-4 gap-3">
          <div v-if="scoreTaskLabel" class="flex items-center gap-3 text-sm text-primary font-medium">
            <span class="loading loading-spinner loading-sm"></span>
            {{ scoreTaskLabel }}
          </div>
          <div v-if="scoreError" class="alert alert-error text-sm shadow-sm">
            <span>{{ scoreError }}</span>
          </div>
          <div v-if="previewInfo" class="alert alert-info text-sm shadow-sm">
            <span>{{ previewInfo }}</span>
          </div>
        </div>
      </div>

      <div v-if="isLoading || isMasterLoading" class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body items-center py-16">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <span class="text-sm text-base-content/60 mt-4 font-medium">正在加载谱面列表</span>
        </div>
      </div>

      <div v-else-if="!scores.length" class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body items-center py-16 text-center">
          <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <Music2 class="w-8 h-8 text-base-content/30" />
          </div>
          <p class="text-base-content/60 font-medium">选择板块后点击加载或搜索。</p>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="(score, index) in scores"
          :key="score.key"
          class="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
          :class="{ 'ring-2 ring-primary ring-offset-2 ring-offset-base-100': selectedScore?.key === score.key }"
        >
          <div class="card-body p-4 gap-4">
            <div class="flex gap-4">
              <div class="relative shrink-0">
                <img
                  v-if="getJacketUrl(score)"
                  :src="getJacketUrl(score)"
                  :alt="score.musicTitle"
                  class="w-24 h-24 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div class="absolute -top-2 -left-2 badge badge-neutral shadow-sm font-mono border-none">{{ index + 1 }}</div>
              </div>
              
              <div class="min-w-0 flex-1 flex flex-col">
                <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span class="badge badge-sm border-none shadow-sm" :class="score.source === 'official' ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/70'">
                    {{ score.source === 'official' ? '官方' : '自制' }}
                  </span>
                  <span class="badge badge-sm font-bold border-none shadow-sm text-white" :class="difficultyClass(score.musicDifficultyType)">
                    {{ score.musicDifficultyType.toUpperCase() }} {{ score.playLevel || '' }}
                  </span>
                  <button v-if="score.source === 'user'" class="btn btn-xs btn-ghost gap-1 px-1.5 h-6 min-h-6 ml-auto opacity-50 hover:opacity-100" @click.stop="copyScoreId(score.customMusicScoreId)">
                    <Copy class="w-3 h-3" /> 复制ID
                  </button>
                </div>
                <h2 class="font-bold text-base leading-tight truncate text-base-content mb-1" :title="score.title">{{ score.title }}</h2>
                <p class="text-xs text-base-content/60 truncate" :title="score.musicTitle + ' · ' + score.creatorName">
                  <span class="font-medium text-base-content/80">{{ score.musicTitle }}</span>
                  <span class="mx-1.5 opacity-40">|</span>
                  <span>{{ score.creatorName }}</span>
                </p>
                <p v-if="score.description" class="text-base-content/70 line-clamp-2 text-xs mt-2 leading-relaxed bg-base-200/50 p-2 rounded-lg">{{ score.description }}</p>
              </div>
            </div>

            <div v-if="getTagNames(score).length" class="flex flex-wrap gap-1.5">
              <span v-for="tag in getTagNames(score)" :key="tag" class="text-[10px] px-2.5 py-1 rounded-full bg-base-200 text-base-content/70 font-medium">{{ tag }}</span>
            </div>

            <div v-if="activeTab !== 'official_all'" class="grid grid-cols-3 gap-2 mt-auto pt-2">
              <div class="flex flex-col items-center justify-center rounded-xl bg-base-200/40 p-2 border border-base-200/50 transition-colors group-hover:bg-base-200/80">
                <div class="font-bold text-primary/90">{{ formatNumber(score.reviewCount) }}</div>
                <div class="text-[10px] text-base-content/50 flex items-center gap-1 mt-0.5 font-medium">
                  <Heart class="w-3 h-3" /> 喜欢
                </div>
              </div>
              <div class="flex flex-col items-center justify-center rounded-xl bg-base-200/40 p-2 border border-base-200/50 transition-colors group-hover:bg-base-200/80">
                <div class="font-bold text-secondary/90">{{ formatNumber(score.playCount) }}</div>
                <div class="text-[10px] text-base-content/50 flex items-center gap-1 mt-0.5 font-medium">
                  <Play class="w-3 h-3" /> 游玩
                </div>
              </div>
              <div class="flex flex-col items-center justify-center rounded-xl bg-base-200/40 p-2 border border-base-200/50 transition-colors group-hover:bg-base-200/80">
                <div class="font-bold text-accent/90">{{ formatPercent(score.fullComboRate) }}</div>
                <div class="text-[10px] text-base-content/50 mt-0.5 font-medium">FC率</div>
              </div>
            </div>

            <div class="flex items-center justify-between mt-2 pt-3 border-t border-base-200/60">
              <div class="text-[10px] text-base-content/40 font-medium">{{ formatDate(score.publishedAt) }}</div>
              <div class="flex gap-2">
                <button class="btn btn-sm btn-outline hover:btn-primary gap-1.5 rounded-lg border-base-300" :disabled="isFetchingScore" @click="openFlatPreview(score)">
                  <Eye class="w-3.5 h-3.5" />
                  平面预览
                </button>
                <button class="btn btn-sm btn-primary gap-1.5 rounded-lg shadow-sm" :disabled="isFetchingScore" @click="open3dPreview(score)">
                  <PlayCircle class="w-3.5 h-3.5" />
                  3D预览
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
