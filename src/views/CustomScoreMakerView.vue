<script setup lang="ts">
import { computed, onMounted, ref, toRef } from 'vue'
import { BarChart3, Copy, Eye, Heart, Music2, Play, PlayCircle, RefreshCw, Search, Sparkles, User, X } from 'lucide-vue-next'
import { renderCustomScoreJsonToSvg, revokeSus2ImgResult, type Sus2ImgFrontendResult } from '@/vendor/sekai-sus2img'
import AssetImage from '@/components/AssetImage.vue'
import SekaiProfileHonor from '@/components/SekaiProfileHonor.vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { toRomaji } from '@/utils/kanaToRomaji'

type FeedTab = 'ranking' | 'new' | 'search' | 'official_all'
type RankingMode = 'daily' | 'total'
type SearchOrder = 'new_arrival' | 'review_count' | 'review_count_daily' | 'popular_daily' | 'high_difficulty' | 'random'
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
  userId: string | number
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
  favoriteCount?: number
  bookmarkCount?: number
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

interface CardMaster {
  id: number
  assetbundleName: string
}

interface MusicVocal {
  musicId: number
  musicVocalType?: string
  caption: string
  characters: { characterType: string; characterId: number }[]
  assetbundleName: string
}

interface Character {
  id: number
  firstName?: string
  givenName: string
}

interface OutsideCharacter {
  id: number
  name: string
}

interface DisplayScore {
  key: string
  source: ScoreSource
  customMusicScoreId: string
  userCustomMusicScorePath?: string
  title: string
  creatorName: string
  creatorUserId?: string
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
  favoriteCount: number
  customMusicScoreSearchSortValue: number
  previewStartTimeSec?: number
  isDerivativeAllowed?: boolean
}

interface AuthorUserCard {
  cardId: number
  level?: number
  masterRank?: number
  specialTrainingStatus?: string
  defaultImage?: string
}

interface AuthorProfileHonor {
  seq: number
  profileHonorType: string
  honorId: number
  honorLevel: number
  bondsHonorViewType: string
  bondsHonorWordId: number
}

interface AuthorProfile {
  name: string
  userCard?: AuthorUserCard
  userProfile?: {
    userId: string | number
    word?: string
    twitterId?: string
    profileImageType?: string
  }
  userProfileHonors?: AuthorProfileHonor[]
  userHonorMissions?: Array<{ honorMissionType: string; progress: number }>
  isMysekaiOwnerAcceptVisitForFriend?: boolean
  userPlayerFrames?: unknown[]
}

interface AuthorResponse extends FeedResponse {
  userCustomMusicScoreAuthorProfile?: AuthorProfile
}

const GAME_API_HOST = 'https://api.unipjsk.com'
const GAME_SCORE_BLOB_FULL_BASE = '/blob/custom-music-score/full'
const CHART_PLAYBACK_HOST = import.meta.env.VITE_CUSTOM_SCORE_3D_PREVIEW_URL || 'https://chartview.unipjsk.com'

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
const rankingLevelMin = ref('26')
const rankingLevelMax = ref('36')
const isLoading = ref(false)
const isMasterLoading = ref(false)
const error = ref('')
const scores = ref<DisplayScore[]>([])

const selectedScore = ref<DisplayScore | null>(null)
const selectedScoreJson = ref<unknown | null>(null)
const selectedScoreJsonText = ref('')
const selectedSvg = ref('')
const selectedPreviewUrl = ref('')
const isFetchingScore = ref(false)
const isRenderingPreview = ref(false)
const scoreError = ref('')
const previewInfo = ref('')
const scoreTaskLabel = ref('')
const copyMessage = ref('')

const officialCreators = ref<OfficialCreator[]>([])
const officialProfiles = ref<OfficialCreatorProfile[]>([])
const tags = ref<CustomMusicScoreTag[]>([])
const musics = ref<MusicMaster[]>([])
const cards = ref<CardMaster[]>([])
const vocals = ref<MusicVocal[]>([])
const characters = ref<Character[]>([])
const outsideCharacters = ref<OutsideCharacter[]>([])

const authorOverlayOpen = ref(false)
const authorProfile = ref<AuthorProfile | null>(null)
const authorScores = ref<DisplayScore[]>([])
const authorLoading = ref(false)
const authorError = ref('')
const authorSelectedId = ref<string | null>(null)

let svgRenderResult: Sus2ImgFrontendResult | null = null
let feedRequestSerial = 0
let feedAbortController: AbortController | null = null
let copyMessageTimer: number | null = null

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

const cardById = computed(() => {
  const map = new Map<number, CardMaster>()
  for (const item of cards.value) map.set(item.id, item)
  return map
})

const rankingLevelRange = computed(() => {
  const minText = String(rankingLevelMin.value ?? '').trim()
  const maxText = String(rankingLevelMax.value ?? '').trim()
  const min = minText ? Number(minText) : null
  const max = maxText ? Number(maxText) : null
  return {
    min: Number.isFinite(min) ? min : null,
    max: Number.isFinite(max) ? max : null,
  }
})

const displayedScores = computed(() => {
  if (activeTab.value !== 'ranking') return scores.value
  const { min, max } = rankingLevelRange.value
  if (min === null && max === null) return scores.value
  return scores.value.filter((score) => {
    if (min !== null && score.playLevel < min) return false
    if (max !== null && score.playLevel > max) return false
    return true
  })
})

const authorTotalReviews = computed(() => authorScores.value.reduce((sum, score) => sum + score.reviewCount, 0))
const authorTotalPlays = computed(() => authorScores.value.reduce((sum, score) => sum + score.playCount, 0))

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
  if (activeTab.value !== 'search') {
    await loadFeed()
  }
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

async function parseGameApiJson(response: Response) {
  const text = await response.text()
  return JSON.parse(text.replace(/"userId"\s*:\s*(\d{16,})/g, '"userId":"$1"'))
}

async function loadMasterData() {
  isMasterLoading.value = true
  try {
    masterStore.getTranslations().catch((reason) => console.error('加载翻译失败:', reason))
    const [creatorData, profileData, tagData, musicData, cardData, vocalData, characterData, outsideCharacterData] = await Promise.all([
      masterStore.getMaster<OfficialCreator>('customMusicScoreOfficialCreators'),
      masterStore.getMaster<OfficialCreatorProfile>('customMusicScoreOfficialCreatorProfiles'),
      masterStore.getMaster<CustomMusicScoreTag>('customMusicScoreTags'),
      masterStore.getMaster<MusicMaster>('musics'),
      masterStore.getMaster<CardMaster>('cards'),
      masterStore.getMaster<MusicVocal>('musicVocals'),
      masterStore.getMaster<Character>('gameCharacters'),
      masterStore.getMaster<OutsideCharacter>('outsideCharacters'),
    ])
    officialCreators.value = creatorData
    officialProfiles.value = profileData
    tags.value = tagData
    musics.value = musicData
    cards.value = cardData
    vocals.value = vocalData
    characters.value = characterData
    outsideCharacters.value = outsideCharacterData
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
    creatorUserId: String(item.userId),
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
    favoriteCount: item.favoriteCount ?? item.bookmarkCount ?? 0,
    customMusicScoreSearchSortValue: item.customMusicScoreSearchSortValue ?? 9999,
    previewStartTimeSec: item.previewStartTimeSec,
    isDerivativeAllowed: item.isDerivativeAllowed,
  }
}

function mergeOfficialMasterScore(master: OfficialCreator, stat?: OfficialScoreStat): DisplayScore {
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
    reviewCount: stat?.reviewCount ?? 0,
    playCount: stat?.playCount ?? 0,
    fullComboRate: stat?.fullComboRate ?? 0,
    favoriteCount: 0,
    customMusicScoreSearchSortValue: stat?.customMusicScoreSearchSortValue ?? 0,
    previewStartTimeSec: master.previewStartTimeSec,
    isDerivativeAllowed: master.isDerivativeAllowed,
  }
}

function mergeOfficialScore(item: OfficialScoreStat): DisplayScore {
  const master = officialCreatorByScoreId.value.get(item.customMusicScoreId)
  if (master) {
    return mergeOfficialMasterScore(master, item)
  }

  return {
    key: `official:${item.customMusicScoreId}`,
    source: 'official',
    customMusicScoreId: item.customMusicScoreId,
    title: `官方指定谱面 ${item.customMusicScoreId}`,
    creatorName: '官方指定创作者',
    musicId: 0,
    musicTitle: '未知歌曲',
    musicDifficultyType: 'append',
    playLevel: 0,
    description: '',
    tagIds: [],
    reviewCount: item.reviewCount ?? 0,
    playCount: item.playCount ?? 0,
    fullComboRate: item.fullComboRate ?? 0,
    favoriteCount: 0,
    customMusicScoreSearchSortValue: item.customMusicScoreSearchSortValue ?? 9999,
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
  const requestId = ++feedRequestSerial
  feedAbortController?.abort()
  feedAbortController = new AbortController()

  error.value = ''
  scoreError.value = ''
  scores.value = []
  selectedScore.value = null
  selectedScoreJson.value = null
  selectedScoreJsonText.value = ''
  selectedSvg.value = ''
  revokeSvgResult()


  if (activeTab.value === 'search' && searchMode.value === 'id' && !searchScoreId.value.trim()) {
    isLoading.value = false
    feedAbortController = null
    return
  }

  if (activeTab.value === 'search' && searchMode.value === 'music' && !searchMusicId.value.trim()) {
    isLoading.value = false
    feedAbortController = null
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
      if (requestId !== feedRequestSerial) return
      scores.value = list.map((master) => mergeOfficialMasterScore(master)).sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
      return
    }

    if (activeTab.value === 'search' && searchMode.value === 'id') {
      const officialMaster = officialCreatorByScoreId.value.get(searchScoreId.value.trim())
      if (officialMaster) {
        if (requestId !== feedRequestSerial) return
        scores.value = [mergeOfficialMasterScore(officialMaster)]
        return
      }
    }

    const response = await fetch(`${GAME_API_HOST}${endpointPath.value}`, {
      signal: feedAbortController.signal,
    })
    if (!response.ok) {
      if (response.status === 404) throw new Error('未找到该谱面')
      throw new Error(`请求失败：HTTP ${response.status}`)
    }
    const data = await parseGameApiJson(response)
    if (requestId !== feedRequestSerial) return
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
    if (requestId !== feedRequestSerial) return
    if (reason instanceof DOMException && reason.name === 'AbortError') return
    error.value = reason instanceof Error ? reason.message : '加载谱面列表失败'
  } finally {
    if (requestId === feedRequestSerial) {
      isLoading.value = false
      feedAbortController = null
    }
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

function openPreviewBridge(kind: 'flat' | '3d') {
  const url = new URL('/custom-score-maker/preview-bridge', window.location.origin)
  url.searchParams.set('kind', kind)
  const previewTab = window.open(url.toString(), '_blank')
  previewTab?.focus()
  return previewTab
}

function replacePreviewTab(previewTab: Window | null, url: string) {
  if (!previewTab || previewTab.closed) return
  previewTab.location.replace(url)
}

async function ensureScoreJson(score: DisplayScore) {
  const jsonText = await ensureScoreJsonText(score)
  const scoreJson = JSON.parse(jsonText)
  selectedScoreJson.value = scoreJson
  return scoreJson
}

async function ensureScoreJsonText(score: DisplayScore) {
  if (selectedScore.value?.key === score.key && selectedScoreJsonText.value) {
    return selectedScoreJsonText.value
  }

  const base64Text = await fetchScoreBase64(score)
  scoreTaskLabel.value = '解压谱面中'
  const jsonText = await decodeScoreBase64(base64Text)

  selectedScore.value = score
  selectedScoreJson.value = null
  selectedScoreJsonText.value = jsonText

  return jsonText
}

async function renderJsonFlatPreview(score: DisplayScore, scoreJson = selectedScoreJson.value) {
  if (!scoreJson) return
  isRenderingPreview.value = true
  scoreTaskLabel.value = '生成平面预览中'
  selectedSvg.value = ''
  selectedPreviewUrl.value = ''
  revokeSvgResult()

  try {
    const result = await renderCustomScoreJsonToSvg({
      scoreJson,
      title: score.title,
      artist: score.musicTitle,
      author: score.creatorName,
      difficulty: score.musicDifficultyType.toUpperCase(),
      playlevel: String(score.playLevel || ''),
      songId: score.musicId,
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
  const previewTab = openPreviewBridge('flat')
  if (!previewTab) {
    scoreError.value = '浏览器拦截了新窗口，请允许弹窗后再试。'
    return
  }
  isFetchingScore.value = true
  scoreError.value = ''
  previewInfo.value = ''
  try {
    await ensureScoreJson(score)
    await renderJsonFlatPreview(score)
  } catch (reason) {
    scoreError.value = reason instanceof Error ? reason.message : '平面预览生成失败'
  } finally {
    isFetchingScore.value = false
  }

  if (!selectedSvg.value) {
    if (previewTab && !previewTab.closed) {
      previewTab.close()
    }
    return
  }
  replacePreviewTab(previewTab, selectedPreviewUrl.value)
}

function buildChartPreviewPayload(score: DisplayScore, scoreJson: unknown) {
  const music = musicById.value.get(score.musicId)
  const vocal = selectDefaultVocalForMusic(score.musicId)
  const offsetSec = Number(music?.filterSec || music?.fillerSec || 0)
  const vocalText = [vocal ? getVocalSingers(vocal, ', ') : '', `譜：${score.creatorName}`].filter(Boolean).join('  ')
  const requestId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return {
    type: 'sekai-mmw-preview:load',
    requestId,
    customScoreJson: scoreJson,
    title: score.title,
    difficulty: score.musicDifficultyType.toUpperCase(),
    bgm: vocal ? `${assetsHost.value}/ondemand/music/long/${vocal.assetbundleName}/${vocal.assetbundleName}.mp3` : null,
    cover: score.jacketAssetbundleName ? getJacketUrl(score) : null,
    rawOffsetMs: offsetSec > 0 ? Math.round(offsetSec * 1000) : null,
    lyricist: music?.lyricist || null,
    composer: music?.composer || null,
    arranger: music?.arranger || null,
    vocal: vocalText || null,
  }
}

function selectDefaultVocalForMusic(musicId: number) {
  const musicVocals = vocals.value.filter((item) => item.musicId === musicId)
  if (settingsStore.defaultVocal === 'sekai') {
    const sekaiVocal = musicVocals.find((item) => item.musicVocalType === 'sekai' || item.caption.includes('セカイ'))
    return sekaiVocal || musicVocals[0] || null
  }
  return musicVocals[0] || null
}

function getVocalSingers(vocal: MusicVocal, separator = '・'): string {
  return vocal.characters.map((item) => {
    if (item.characterType === 'game_character') {
      const character = characters.value.find((candidate) => candidate.id === item.characterId)
      if (character) return `${character.firstName || ''}${character.givenName}`
    } else if (item.characterType === 'outside_character') {
      const outsideCharacter = outsideCharacters.value.find((candidate) => candidate.id === item.characterId)
      if (outsideCharacter) return outsideCharacter.name
    }
    return ''
  }).filter(Boolean).join(separator)
}

function postChartPreviewPayload(previewTab: Window | null, payload: ReturnType<typeof buildChartPreviewPayload>) {
  if (!previewTab || previewTab.closed) {
    throw new Error('3D 预览窗口打开失败')
  }
  const previewBase = CHART_PLAYBACK_HOST.replace(/\/+$/, '')
  const targetOrigin = new URL(previewBase).origin
  let retryTimer: number | null = null
  let timeoutTimer: number | null = null

  const cleanup = () => {
    window.removeEventListener('message', handleReady)
    if (retryTimer !== null) window.clearInterval(retryTimer)
    if (timeoutTimer !== null) window.clearTimeout(timeoutTimer)
  }
  const send = () => {
    if (previewTab.closed) return
    try {
      previewTab.postMessage(payload, targetOrigin)
    } catch {
      // The bridge window may still be navigating to the cross-origin preview.
    }
  }
  const handleReady = (event: MessageEvent) => {
    if (event.source !== previewTab || event.origin !== targetOrigin) return
    if ((event.data as { type?: string } | null)?.type !== 'sekai-mmw-preview:ready') return
    send()
    cleanup()
  }

  window.addEventListener('message', handleReady)
  replacePreviewTab(previewTab, `${previewBase}/preview?post=1`)
  retryTimer = window.setInterval(send, 800)
  timeoutTimer = window.setTimeout(cleanup, 60000)
}

async function open3dPreview(score: DisplayScore) {
  const previewTab = openPreviewBridge('3d')
  if (!previewTab) {
    scoreError.value = '浏览器拦截了新窗口，请允许弹窗后再试。'
    return
  }

  previewInfo.value = ''
  scoreError.value = ''
  isFetchingScore.value = true
  try {
    const scoreJsonText = await ensureScoreJsonText(score)
    scoreTaskLabel.value = '生成 3D 预览链接中'
    postChartPreviewPayload(previewTab, buildChartPreviewPayload(score, scoreJsonText))
  } catch (reason) {
    if (previewTab && !previewTab.closed) previewTab.close()
    scoreError.value = reason instanceof Error ? reason.message : '3D 预览链接生成失败'
  } finally {
    isFetchingScore.value = false
    scoreTaskLabel.value = ''
  }
}

function copyScoreId(id: string) {
  navigator.clipboard.writeText(id)
    .then(() => {
      copyMessage.value = `已复制谱面 ID：${id}`
      if (copyMessageTimer !== null) window.clearTimeout(copyMessageTimer)
      copyMessageTimer = window.setTimeout(() => {
        copyMessage.value = ''
        copyMessageTimer = null
      }, 1800)
    })
    .catch((err) => {
      console.error('Failed to copy ID:', err)
      scoreError.value = '复制 ID 失败，请检查浏览器剪贴板权限。'
    })
}

function setRankingMode(mode: RankingMode) {
  if (rankingMode.value === mode) return
  rankingMode.value = mode
  void loadFeed()
}

function clearRankingLevelFilter() {
  rankingLevelMin.value = ''
  rankingLevelMax.value = ''
}

function getAuthorHonor(seq: number) {
  return authorProfile.value?.userProfileHonors?.find((honor) => honor.seq === seq) || null
}

function getAuthorCardUrl(profile: AuthorProfile | null) {
  const userCard = profile?.userCard
  if (!userCard?.cardId) return ''
  const card = cardById.value.get(userCard.cardId)
  if (!card?.assetbundleName) return ''
  const trained = userCard.specialTrainingStatus === 'done'
    || userCard.defaultImage === 'special_training'
    || userCard.defaultImage === 'training'
  return `${assetsHost.value}/startapp/thumbnail/chara/${card.assetbundleName}_${trained ? 'after_training' : 'normal'}.png`
}

function closeAuthorOverlay() {
  authorOverlayOpen.value = false
  authorProfile.value = null
  authorScores.value = []
  authorError.value = ''
  authorSelectedId.value = null
}

async function openAuthorOverlay(score: DisplayScore) {
  if (score.source !== 'user' || !score.creatorUserId) return
  authorOverlayOpen.value = true
  authorLoading.value = true
  authorError.value = ''
  authorSelectedId.value = score.creatorUserId
  authorProfile.value = null
  authorScores.value = []

  try {
    if (!musics.value.length || !cards.value.length) {
      await loadMasterData()
    }
    const response = await fetch(`${GAME_API_HOST}/api/user/{user_id}/custom-music-score/published/search/author/${encodeURIComponent(String(score.creatorUserId))}`)
    if (!response.ok) {
      throw new Error(`作者投稿加载失败：HTTP ${response.status}`)
    }
    const data = await parseGameApiJson(response) as AuthorResponse
    authorProfile.value = data.userCustomMusicScoreAuthorProfile ?? {
      name: score.creatorName,
      userProfile: { userId: score.creatorUserId },
    }
    authorScores.value = normalizeFeed({ userCustomMusicScorePublishedList: data.userCustomMusicScorePublishedList ?? [] })
  } catch (reason) {
    authorError.value = reason instanceof Error ? reason.message : '作者投稿加载失败'
  } finally {
    authorLoading.value = false
  }
}

function searchById() {
  if (!searchScoreId.value.trim()) return
  activeTab.value = 'search'
  searchMode.value = 'id'
  void loadFeed()
}

function selectTab(tab: FeedTab) {
  feedRequestSerial += 1
  feedAbortController?.abort()
  feedAbortController = null
  isLoading.value = false
  error.value = ''
  scores.value = []

  if (activeTab.value === tab) {
    if (tab === 'search') searchMode.value = 'music'
    return
  }
  activeTab.value = tab
  if (tab === 'ranking') {
    rankingMode.value = rankingMode.value || 'total'
  }
  if (tab === 'search') {
    return
  }
  void loadFeed()
}
</script>

<template>
  <div class="space-y-5">
    <div v-if="copyMessage" class="toast toast-end toast-bottom z-[200]">
      <div class="alert alert-success shadow-lg text-sm">
        <span>{{ copyMessage }}</span>
      </div>
    </div>

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
            <button class="btn btn-sm join-item" :class="{ 'btn-primary': rankingMode === 'daily', 'bg-base-200 border-none hover:bg-base-300': rankingMode !== 'daily' }" @click="setRankingMode('daily')">日排行榜</button>
            <button class="btn btn-sm join-item" :class="{ 'btn-primary': rankingMode === 'total', 'bg-base-200 border-none hover:bg-base-300': rankingMode !== 'total' }" @click="setRankingMode('total')">综合排行榜</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center gap-2 rounded-lg border border-base-200 bg-base-200/40 px-2 py-1 shadow-sm">
              <span class="text-xs font-medium text-base-content/60 whitespace-nowrap">难度筛选</span>
              <input
                v-model="rankingLevelMin"
                type="text"
                inputmode="numeric"
                placeholder="最低"
                class="input input-bordered input-sm h-8 min-h-8 w-16 bg-base-100 px-2 text-center font-mono"
                aria-label="最低难度"
              />
              <span class="text-base-content/35">-</span>
              <input
                v-model="rankingLevelMax"
                type="text"
                inputmode="numeric"
                placeholder="最高"
                class="input input-bordered input-sm h-8 min-h-8 w-16 bg-base-100 px-2 text-center font-mono"
                aria-label="最高难度"
              />
              <button
                class="btn btn-ghost btn-xs h-8 min-h-8 px-2"
                :disabled="!String(rankingLevelMin).trim() && !String(rankingLevelMax).trim()"
                title="清除难度筛选"
                @click="clearRankingLevelFilter"
              >
                <X class="h-3.5 w-3.5" />
              </button>
            </div>
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

      <div v-else-if="!displayedScores.length" class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body items-center py-16 text-center">
          <div class="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <Music2 class="w-8 h-8 text-base-content/30" />
          </div>
          <p class="text-base-content/60 font-medium">选择板块后点击加载或搜索。</p>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="(score, index) in displayedScores"
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
                  <button class="btn btn-xs btn-ghost gap-1 px-1.5 h-6 min-h-6 ml-auto opacity-50 hover:opacity-100" @click.stop="copyScoreId(score.customMusicScoreId)">
                    <Copy class="w-3 h-3" /> 复制ID
                  </button>
                </div>
                <h2 class="font-bold text-base leading-tight truncate text-base-content mb-1" :title="score.title">{{ score.title }}</h2>
                <p class="text-xs text-base-content/60 truncate" :title="score.musicTitle + ' · ' + score.creatorName">
                  <span class="font-medium text-base-content/80">{{ score.musicTitle }}</span>
                  <span class="mx-1.5 opacity-40">|</span>
                  <button
                    v-if="score.source === 'user'"
                    class="link link-hover inline-flex items-center gap-1 align-baseline font-medium text-primary"
                    @click.stop="openAuthorOverlay(score)"
                  >
                    <User class="h-3 w-3" />
                    {{ score.creatorName }}
                  </button>
                  <span v-else>{{ score.creatorName }}</span>
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

    <div v-if="authorOverlayOpen" class="fixed inset-0 z-[180] bg-base-300/70 p-3 backdrop-blur-sm sm:p-6">
      <div class="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-base-200 bg-base-100 shadow-2xl">
          <div class="z-10 shrink-0 flex items-center justify-between gap-3 border-b border-base-200 bg-base-100/95 p-4 backdrop-blur">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-wide text-base-content/45">作者投稿</p>
              <h2 class="truncate text-xl font-extrabold">{{ authorProfile?.name || '作者投稿一览' }}</h2>
            </div>
            <button class="btn btn-sm btn-circle btn-ghost" title="关闭" @click="closeAuthorOverlay">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            <div v-if="authorLoading" class="flex items-center justify-center gap-3 rounded-xl border border-base-200 bg-base-200/35 py-12 text-primary">
              <span class="loading loading-spinner loading-md"></span>
              <span class="text-sm font-medium">正在加载作者投稿</span>
            </div>

            <div v-else-if="authorError" class="alert alert-error text-sm">
              <span>{{ authorError }}</span>
            </div>

            <template v-else>
              <div class="grid items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
                <section class="rounded-xl border border-base-200 bg-base-200/30 p-3">
                  <div class="grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-1.5">
                    <div class="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-base-200 shadow-sm">
                      <AssetImage
                        v-if="getAuthorCardUrl(authorProfile)"
                        :src="getAuthorCardUrl(authorProfile)"
                        class="h-full w-full object-cover"
                      />
                      <div v-else class="grid h-full w-full place-items-center text-base-content/30">
                        <User class="h-7 w-7" />
                      </div>
                    </div>
                    <div class="grid h-14 min-w-0 grid-rows-[1.75rem_1.5rem] gap-1">
                      <h3 class="ml-1 flex min-w-0 items-center truncate text-lg font-bold leading-none">{{ authorProfile?.name || '未知作者' }}</h3>
                      <div class="flex h-6 min-w-0 items-center gap-1">
                        <template v-for="i in 3" :key="i">
                          <div v-if="getAuthorHonor(i)" class="h-full min-w-0 shrink">
                            <SekaiProfileHonor
                              :data="getAuthorHonor(i)!"
                              :force-sub="i !== 1"
                              :user-honor-missions="authorProfile?.userHonorMissions || []"
                              class="block h-full w-auto max-w-full"
                            />
                          </div>
                          <img
                            v-else
                            :src="i === 1 ? '/honor/frame_degree_m_1.png' : '/honor/frame_degree_s_1.png'"
                            class="h-full w-auto opacity-40"
                            alt="empty honor"
                          />
                        </template>
                      </div>
                    </div>
                  </div>

                  <p class="mt-4 whitespace-pre-wrap rounded-lg bg-base-100/70 p-3 text-sm text-base-content/70">
                    <template v-if="authorProfile?.userProfile?.word">{{ authorProfile.userProfile.word }}</template>
                    <span v-else class="text-base-content/40">暂无签名</span>
                  </p>
                </section>

                <section class="grid grid-cols-3 items-start gap-2 sm:gap-3">
                  <div class="rounded-xl border border-base-200 bg-base-200/30 p-3 sm:p-4">
                    <div class="text-xl font-extrabold text-primary sm:text-2xl">{{ formatNumber(authorScores.length) }}</div>
                    <div class="mt-1 text-xs font-medium text-base-content/50">投稿</div>
                  </div>
                  <div class="rounded-xl border border-base-200 bg-base-200/30 p-3 sm:p-4">
                    <div class="text-xl font-extrabold text-secondary sm:text-2xl">{{ formatNumber(authorTotalReviews) }}</div>
                    <div class="mt-1 flex items-center gap-1 text-xs font-medium text-base-content/50">
                      <Heart class="h-3 w-3" /> 喜欢
                    </div>
                  </div>
                  <div class="rounded-xl border border-base-200 bg-base-200/30 p-3 sm:p-4">
                    <div class="text-xl font-extrabold sm:text-2xl">{{ formatNumber(authorTotalPlays) }}</div>
                    <div class="mt-1 flex items-center gap-1 text-xs font-medium text-base-content/50">
                      <Play class="h-3 w-3" /> 游玩
                    </div>
                  </div>
                </section>
              </div>

              <div v-if="!authorScores.length" class="rounded-xl border border-base-200 bg-base-200/30 py-12 text-center text-sm text-base-content/50">
                暂无投稿
              </div>

              <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div
                  v-for="score in authorScores"
                  :key="score.key"
                  class="rounded-xl border border-base-200 bg-base-100 p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div class="flex gap-4">
                    <img
                      v-if="getJacketUrl(score)"
                      :src="getJacketUrl(score)"
                      :alt="score.musicTitle"
                      class="h-20 w-20 shrink-0 rounded-lg object-cover shadow-sm"
                      loading="lazy"
                    />
                    <div class="min-w-0 flex-1">
                      <div class="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span class="badge badge-sm font-bold text-white" :class="difficultyClass(score.musicDifficultyType)">
                          {{ score.musicDifficultyType.toUpperCase() }} {{ score.playLevel || '' }}
                        </span>
                        <button class="btn btn-xs btn-ghost ml-auto h-6 min-h-6 gap-1 px-1.5 opacity-60 hover:opacity-100" @click.stop="copyScoreId(score.customMusicScoreId)">
                          <Copy class="h-3 w-3" /> 复制ID
                        </button>
                      </div>
                      <h3 class="truncate font-bold" :title="score.title">{{ score.title }}</h3>
                      <p class="truncate text-xs text-base-content/55" :title="score.musicTitle">{{ score.musicTitle }}</p>
                      <p v-if="score.description" class="mt-2 line-clamp-2 rounded-lg bg-base-200/45 p-2 text-xs text-base-content/70">{{ score.description }}</p>
                    </div>
                  </div>

                  <div class="mt-3 grid grid-cols-3 gap-2">
                    <div class="rounded-lg bg-base-200/45 p-2 text-center">
                      <div class="font-bold text-primary/90">{{ formatNumber(score.reviewCount) }}</div>
                      <div class="text-[10px] text-base-content/50">喜欢</div>
                    </div>
                    <div class="rounded-lg bg-base-200/45 p-2 text-center">
                      <div class="font-bold text-secondary/90">{{ formatNumber(score.playCount) }}</div>
                      <div class="text-[10px] text-base-content/50">游玩</div>
                    </div>
                    <div class="rounded-lg bg-base-200/45 p-2 text-center">
                      <div class="font-bold text-accent/90">{{ formatPercent(score.fullComboRate) }}</div>
                      <div class="text-[10px] text-base-content/50">FC率</div>
                    </div>
                  </div>

                  <div class="mt-3 flex items-center justify-between border-t border-base-200/70 pt-3">
                    <div class="text-[10px] font-medium text-base-content/40">{{ formatDate(score.publishedAt) }}</div>
                    <div class="flex gap-2">
                      <button class="btn btn-xs btn-outline gap-1.5 rounded-lg" :disabled="isFetchingScore" @click="openFlatPreview(score)">
                        <Eye class="h-3.5 w-3.5" />
                        平面预览
                      </button>
                      <button class="btn btn-xs btn-primary gap-1.5 rounded-lg" :disabled="isFetchingScore" @click="open3dPreview(score)">
                        <PlayCircle class="h-3.5 w-3.5" />
                        3D预览
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.sekai-honor),
:deep(.sekai-honor-bonds) {
  width: auto !important;
  height: 100% !important;
}
</style>
