<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, nextTick, watch } from 'vue'
import { useModalDialog } from '@/composables/useModalDialog'
import { useSeoMeta, useHead } from '@unhead/vue'
import { useRoute, useRouter } from 'vue-router'
import { useBackToList } from '@/composables/useBackToList'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { useAccountStore } from '@/stores/account'
import { useZh } from '@/composables/useZh'
import { Mp3Encoder } from '@breezystack/lamejs'
import {
  Play, Pause, BarChart2, Eye, Download, ChevronLeft, ChevronDown,
  Disc3, Sparkles, Volume2, VolumeX, SkipBack, SkipForward,
  PlayCircle, Zap, X, FileImage, Loader2, ZoomIn, ZoomOut, Maximize,
  Activity, CheckCircle2, LockKeyhole, ExternalLink, ListPlus, ListStart, Maximize2, Check, Info, LetterText
} from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import MusicLyrics from '@/components/MusicLyrics.vue'
import PlayerScrubber from '@/components/player/PlayerScrubber.vue'
import SingerAvatars from '@/components/player/SingerAvatars.vue'
import MusicQueueButton from '@/components/player/MusicQueueButton.vue'
import { loadSongLyrics, lyricsForVocal } from '@/api/lyrics'
import { usePlayerStore } from '@/stores/player'
import { useSingerAvatars } from '@/composables/useSingerAvatars'
import { buildTrack, type PlayerTrackInfo } from '@/utils/playerTracks'
import { alignFurigana } from '@/utils/furigana'
import { parseSusBpm, type SusBpmEvent } from '@/utils/susBpm'
import type { EventData } from '@/types/master'
import { renderSusToSvg, type Sus2ImgFrontendResult } from '@/vendor/sekai-sus2img'
import ChartJudgmentPreview from '@/components/ChartJudgmentPreview.vue'
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, difficultyBackground, difficultyStyle } from '@/utils/difficulty'
import { trackEvent } from '@/utils/analytics'
import { useCharacterName } from '@/composables/useCharacterName'
import ZhText from '@/components/ZhText.vue'
import { useSpoilerWatermark } from '@/composables/useSpoilerWatermark'

interface Music {
  id: number
  title: string
  pronunciation: string
  lyricist: string
  composer: string
  arranger: string
  publishedAt: number
  fillerSec?: number
  filterSec?: number
  assetbundleName: string
  releaseConditionId: number
  musicCollaborationId?: number
}

interface MusicCategory {
  musicId: number
  musicCategoryName: string
}

interface MusicDifficulty {
  id: number
  musicId: number
  musicDifficulty: string
  playLevel: number
  totalNoteCount: number
}

interface MusicVocal {
  id: number
  musicId: number
  musicVocalType: string
  caption: string
  characters: { characterType: string; characterId: number }[]
  assetbundleName: string
}

interface EventMusic {
  eventId: number
  musicId: number
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

interface GameCharacterUnit {
  id: number
  gameCharacterId: number
  unit: string
  colorCode?: string
}

interface MusicVideoCharacter {
  id: number
  musicId: number
  defaultMusicType: 'sekai' | 'original_music'
  gameCharacterUnitId: number
  dancePriority: number
  seq: number
}

interface LimitedTimeMusic {
  id: number
  musicId: number
  startAt: number
  endAt: number
}

interface ReleaseCondition {
  id: number
  sentence: string
  releaseConditionType: string
}

interface MusicCollaboration {
  id: number
  label: string
}

interface MusicOriginal {
  id: number
  musicId: number
  videoLink: string
}

interface MusicAssetVariant {
  id: number
  musicVocalId: number
  seq: number
  musicAssetType: string
  assetbundleName: string
}

type PreviewPayload = {
  sus: string
  collaboration?: string
  bgm?: string
  cover?: string
  offset?: number
  title?: string
  lyricist?: string
  composer?: string
  arranger?: string
  vocal?: string
  difficulty?: string | number
}

const { characterName } = useCharacterName()
const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()
const player = usePlayerStore()
const { trackAvatars } = useSingerAvatars()

const musicId = computed(() => Number(route.params.id))
const music = ref<Music | null>(null)
// 显示未公开内容时加剧透水印，判断与剧透过滤使用同一个时间
useSpoilerWatermark(() => !!music.value && music.value.publishedAt > Date.now())
const musicCategories = ref<string[]>([])
const difficulties = ref<MusicDifficulty[]>([])
const vocals = ref<MusicVocal[]>([])
const zhMusics = useZh('musics')
const zhOutside = useZh('outsideCharacters')
const zhMusicEnabled = zhMusics.enabled
const translation = computed(() => zhMusics.t('title', music.value?.title) || '')
const relatedEvent = ref<EventData | null>(null)
const characters = ref<Character[]>([])
const outsideCharacters = ref<OutsideCharacter[]>([])
const gameCharacterUnits = ref<GameCharacterUnit[]>([])
const musicVideoCharacters = ref<MusicVideoCharacter[]>([])
const limitedMusics = ref<LimitedTimeMusic[]>([])
const releaseConditions = ref<ReleaseCondition[]>([])
const musicCollaborations = ref<MusicCollaboration[]>([])
const musicOriginals = ref<MusicOriginal[]>([])
const musicAssetVariants = ref<MusicAssetVariant[]>([])
const isLoading = ref(true)

const assetsHost = computed(() => settingsStore.assetsHost)
const chartPlaybackHost = 'https://chartview.unipjsk.com'

// ===== 试听：本页只是全站播放器的遥控器，音频由 player store 持有，离开页面后继续播放 =====
const currentVocalIndex = ref(0)

// ===== 谱面 SVG 预览 =====
const chartSvgPreviewOpen = ref(false)
const { onDialogClose: onChartSvgPreviewDialogClose } = useModalDialog('chartSvgPreviewDialog', () => chartSvgPreviewOpen.value, () => closeChartSvgPreview())
const chartSvgPreviewLoading = ref(false)
const chartSvgPreviewError = ref<string | null>(null)
const chartSvgPreviewSvgText = ref<string | null>(null)
const chartJudgmentPreviewRef = ref<InstanceType<typeof ChartJudgmentPreview> | null>(null)
const chartSvgPreviewImageUrl = ref('')
const chartSvgPreviewWidth = ref(0)
const chartSvgPreviewHeight = ref(0)
const previewDifficultyData = ref<MusicDifficulty | null>(null)
let chartSvgPreviewResult: Sus2ImgFrontendResult | null = null
const isDownloadingPreviewPng = ref(false)

// 缩放控制
const previewZoom = ref(1)
const previewSvgWrapperRef = ref<HTMLDivElement | null>(null)

function previewZoomIn() {
  previewZoom.value = Math.min(5, Math.round(previewZoom.value * 1.25 * 100) / 100)
}

function previewZoomOut() {
  previewZoom.value = Math.max(0.1, Math.round(previewZoom.value * 0.8 * 100) / 100)
}

function previewZoomFit() {
  if (!previewSvgWrapperRef.value || !chartSvgPreviewSvgText.value) {
    previewZoom.value = 1
    return
  }
  const wrapper = previewSvgWrapperRef.value
  // wrapper 无固定高度会撑开到内容高度，需取其父级（scroll 容器）的可视高度
  const viewport = wrapper.parentElement
  if (!viewport) {
    previewZoom.value = 1
    return
  }
  const viewportHeight = viewport.clientHeight - 32 // padding
  const currentScale = previewZoom.value || 1
  const svgEl = wrapper.querySelector('svg')
  if (!svgEl) {
    previewZoom.value = 1
    return
  }
  const svgHeight = svgEl.getBoundingClientRect().height / currentScale
  if (svgHeight > 0 && viewportHeight > 0) {
    previewZoom.value = Math.round((viewportHeight / svgHeight) * 100) / 100
  }
}

// 当前选中的声乐
const currentVocal = computed(() => vocals.value[currentVocalIndex.value] || null)
const suiteData = computed<any | null>(() => {
  if (!accountStore.currentUserId) return null
  return accountStore.getSuiteCache(accountStore.currentUserId) || null
})
const musicOwnershipRows = computed<any[] | null>(() => {
  const rows = suiteData.value?.userMusics ?? suiteData.value?.user_musics
  return Array.isArray(rows) ? rows : null
})
const ownedMusicIds = computed(() => new Set((musicOwnershipRows.value || [])
  .map(row => Number(row?.musicId ?? row?.music_id))
  .filter(Number.isFinite)))
const hasMusicOwnership = computed(() => musicOwnershipRows.value !== null)
const isCurrentMusicOwned = computed(() => ownedMusicIds.value.has(musicId.value))
const vocalOwnershipRows = computed<any[] | null>(() => {
  const rows = suiteData.value?.userMusicVocals ?? suiteData.value?.user_music_vocals
  return Array.isArray(rows) ? rows : null
})
const ownedVocalIds = computed(() => new Set((vocalOwnershipRows.value || [])
  .map(row => Number(row?.musicVocalId ?? row?.music_vocal_id))
  .filter(Number.isFinite)))
const hasVocalOwnership = computed(() => vocalOwnershipRows.value !== null)
const separatelyPurchasedVocalTypes = new Set(['another_vocal', 'streaming_live'])
const purchasableVocals = computed(() => vocals.value.filter(vocal => separatelyPurchasedVocalTypes.has(vocal.musicVocalType)))
const purchasedVocalCount = computed(() => purchasableVocals.value.filter(vocal => ownedVocalIds.value.has(vocal.id)).length)

type VocalAccountStatus = 'available' | 'purchased' | 'not_purchased' | 'music_missing'

function getVocalAccountStatus(vocal: MusicVocal): VocalAccountStatus | null {
  if (separatelyPurchasedVocalTypes.has(vocal.musicVocalType)) {
    if (!hasVocalOwnership.value) return null
    return ownedVocalIds.value.has(vocal.id) ? 'purchased' : 'not_purchased'
  }
  if (!hasMusicOwnership.value) return null
  return isCurrentMusicOwned.value ? 'available' : 'music_missing'
}

function getVocalAccountLabel(vocal: MusicVocal): string {
  const status = getVocalAccountStatus(vocal)
  if (status === 'available') return '随歌曲可用'
  if (status === 'purchased') return '已购买'
  if (status === 'not_purchased') return '未购买'
  if (status === 'music_missing') return '歌曲未获取'
  return ''
}

function isVocalAvailable(vocal: MusicVocal): boolean {
  const status = getVocalAccountStatus(vocal)
  return status === 'available' || status === 'purchased'
}

const audioTrimStartSec = computed(() => {
  if (!music.value) return 0
  const filterSec = Number(music.value.filterSec)
  if (Number.isFinite(filterSec) && filterSec > 0) return filterSec

  const fillerSec = Number(music.value.fillerSec)
  if (Number.isFinite(fillerSec) && fillerSec > 0) return fillerSec

  return 0
})

// 音频URL
const currentAudioUrl = computed(() => {
  if (!currentVocal.value) return ''
  return `${assetsHost.value}/ondemand/music/long/${currentVocal.value.assetbundleName}/${currentVocal.value.assetbundleName}.mp3`
})

/** 当前选中版本对应的播放条目 */
function vocalTrack(vocal: MusicVocal): PlayerTrackInfo | null {
  if (!music.value) return null
  return buildTrack(music.value, vocal, {
    characters: characters.value,
    outsideCharacters: outsideCharacters.value,
    characterUnits: gameCharacterUnits.value,
    assetVariants: musicAssetVariants.value,
  })
}

const currentTrack = computed(() => (currentVocal.value ? vocalTrack(currentVocal.value) : null))
const vocalAvatars = computed(() => new Map(vocals.value.map(vocal => [vocal.id, trackAvatars(vocalTrack(vocal)?.singers ?? [])])))

// 全站播放器正在播放这首歌 / 这个版本时，下面的控件直接反映并控制它
const isActiveSong = computed(() => player.isCurrent(musicId.value))
const isActiveVocal = computed(() => !!currentVocal.value && player.isCurrent(musicId.value, currentVocal.value.id))
const isPlaying = computed(() => isActiveVocal.value && player.isPlaying)
const isAudioLoaded = computed(() => isActiveVocal.value && player.isLoaded)
const currentTime = computed(() => (isActiveVocal.value ? player.currentTime : audioTrimStartSec.value))
const duration = computed(() => (isActiveVocal.value ? player.duration : 0))

// 歌词独占一栏：没有歌词的歌（纯音乐等）不留空栏；
// 右侧的全站歌词栏已经在显示这首歌时，页面内不再重复一份
const hasLyrics = ref<boolean | null>(null)
const showLyricsColumn = computed(() => hasLyrics.value !== false && !(player.lyricsSidebarShown && isActiveSong.value))
onMounted(() => {
  loadSongLyrics(musicId.value)
    .then((data) => { hasLyrics.value = !!data && lyricsForVocal(data, {}).lyrics.lines.length > 0 })
    // 加载失败时保留歌词栏，里面有重试按钮
    .catch(() => { hasLyrics.value = true })
})

// 队列里切到这首歌的其他版本（或进入页面时它已在播放）：选中项跟着走
function syncVocalWithPlayer() {
  const track = player.current
  if (!track || track.musicId !== musicId.value) return
  const index = vocals.value.findIndex(vocal => vocal.id === track.vocalId)
  if (index !== -1) currentVocalIndex.value = index
}
watch(() => player.current, syncVocalWithPlayer)

function seekToLyric(time: number) {
  const track = currentTrack.value
  if (!track) return
  // 还没在播放这个版本：点歌词即从该句开始播放
  if (!isActiveVocal.value) player.playNow(track)
  player.seek(time)
  if (!player.isPlaying) player.play()
}

// 播放 / 暂停；这首歌还不在播放器里时，立即开始播放并保留已有队列
function togglePlay() {
  const track = currentTrack.value
  if (!track) return
  if (isActiveVocal.value) player.toggle()
  else player.playNow(track)
}

// 加入队列后的短暂确认
const queuedFeedback = ref<'next' | 'end' | null>(null)
let queuedFeedbackTimer: ReturnType<typeof setTimeout> | undefined
function addToQueue(position: 'next' | 'end') {
  const track = currentTrack.value
  if (!track) return
  if (position === 'next') player.playNext([track])
  else player.enqueue([track])
  queuedFeedback.value = position
  clearTimeout(queuedFeedbackTimer)
  queuedFeedbackTimer = setTimeout(() => { queuedFeedback.value = null }, 1600)
}

// 音量控制（全站播放器共用）
function onVolumeChange(e: Event) {
  player.setVolume(parseFloat((e.target as HTMLInputElement).value))
}

// 切换声乐版本：正在听这首歌时原位替换并保持进度，否则只是选中
function selectVocal(index: number) {
  if (index === currentVocalIndex.value) return
  currentVocalIndex.value = index
  const track = currentTrack.value
  if (track && isActiveSong.value) player.switchRendition(track)
}

// 下载当前音频
function sanitizeFileName(name: string): string {
  return Array.from(name, (char) => {
    const code = char.charCodeAt(0)
    if (code <= 31 || '<>:"/\\|?*'.includes(char)) {
      return '_'
    }
    return char
  }).join('').trim()
}

function buildAudioBaseName(): string {
  if (!currentVocal.value || !music.value) return 'audio'
  return sanitizeFileName(`${music.value.title} - ${currentVocal.value.caption}`)
}

async function downloadAudio() {
  if (!currentVocal.value || !music.value) return
  const url = currentAudioUrl.value
  const fileName = `${buildAudioBaseName()}.mp3`
  
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('下载失败:', error)
    window.open(url, '_blank')
  }
  trackEvent('music-audio-download', { vocalType: currentVocal.value?.musicVocalType, trimmed: false })
}

function convertFloat32ToInt16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i] ?? 0))
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }
  return output
}

function encodeMp3(audioBuffer: AudioBuffer): Blob {
  const channelCount = Math.min(audioBuffer.numberOfChannels, 2)
  const sampleRate = audioBuffer.sampleRate
  const kbps = 192
  const encoder = new Mp3Encoder(channelCount, sampleRate, kbps)
  const left = convertFloat32ToInt16(audioBuffer.getChannelData(0))
  const right = channelCount > 1
    ? convertFloat32ToInt16(audioBuffer.getChannelData(1))
    : null
  const blockSize = 1152
  const mp3Chunks: ArrayBuffer[] = []

  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize)
    const buffer = channelCount > 1 && right
      ? encoder.encodeBuffer(leftChunk, right.subarray(i, i + blockSize))
      : encoder.encodeBuffer(leftChunk)

    if (buffer.length > 0) {
      mp3Chunks.push(Uint8Array.from(buffer).buffer.slice(0))
    }
  }

  const flush = encoder.flush()
  if (flush.length > 0) {
    mp3Chunks.push(Uint8Array.from(flush).buffer.slice(0))
  }

  return new Blob(mp3Chunks, { type: 'audio/mpeg' })
}

async function downloadTrimmedAudio() {
  if (!currentVocal.value || !music.value) return

  const trimSec = audioTrimStartSec.value
  if (trimSec <= 0) {
    await downloadAudio()
    return
  }

  const audioContext = new AudioContext()

  try {
    const response = await fetch(currentAudioUrl.value)
    const arrayBuffer = await response.arrayBuffer()
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0))
    const startFrame = Math.min(decoded.length, Math.max(0, Math.floor(trimSec * decoded.sampleRate)))
    const trimmedLength = Math.max(1, decoded.length - startFrame)
    const trimmedBuffer = audioContext.createBuffer(
      decoded.numberOfChannels,
      trimmedLength,
      decoded.sampleRate
    )

    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const source = decoded.getChannelData(channel).subarray(startFrame)
      trimmedBuffer.copyToChannel(source, channel, 0)
    }

    const mp3Blob = encodeMp3(trimmedBuffer)
    const blobUrl = URL.createObjectURL(mp3Blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `${buildAudioBaseName()} (trimmed).mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
    trackEvent('music-audio-download', { vocalType: currentVocal.value?.musicVocalType, trimmed: true })
  } catch (error) {
    console.error('裁切下载失败:', error)
    alert('去头部静音音频下载失败，请稍后重试。')
  } finally {
    await audioContext.close()
  }
}

onBeforeUnmount(() => {
  clearTimeout(queuedFeedbackTimer)
  if (chartSvgPreviewResult) {
    URL.revokeObjectURL(chartSvgPreviewResult.url)
    chartSvgPreviewResult = null
  }
})

// 获取歌手名称列表
function getVocalSingers(vocal: MusicVocal, separator = '・'): string {
  return vocal.characters.map(c => {
    if (c.characterType === 'game_character') {
      const char = characters.value.find(ch => ch.id === c.characterId)
      if (char) {
        return characterName(char)
      }
    } else if (c.characterType === 'outside_character') {
      const outsideChar = outsideCharacters.value.find(ch => ch.id === c.characterId)
      if (outsideChar) {
        // 与角色名一致：有译名时直接用中文名
        return zhOutside.t('name', outsideChar.name) || outsideChar.name
      }
    }
    return ''
  }).filter(Boolean).join(separator)
}

const difficultyLabels = DIFFICULTY_LABELS

function difficultyBadgeStyle(difficulty: string) {
  return { background: difficultyBackground(difficulty) }
}

// 谱面：一排难度选择 + 当前难度的操作，默认选中 MASTER
const selectedChartDifficulty = ref<string | null>(null)
const selectedChart = computed(() => {
  const list = difficulties.value
  return list.find(d => d.musicDifficulty === selectedChartDifficulty.value)
    ?? list.find(d => d.musicDifficulty === 'master')
    ?? list[list.length - 1]
    ?? null
})

function chartTabVars(difficulty: string) {
  const { background, color } = difficultyStyle(difficulty)
  return {
    '--diff': DIFFICULTY_COLORS[difficulty] || '#9ca3af',
    '--diff-bg': background,
    '--diff-fg': color,
  }
}

// 封面图片 URL (startapp)
const coverUrl = computed(() => {
  if (!music.value) return ''
  const fileName = currentVocal.value
    ? musicAssetVariants.value.find(variant => variant.musicVocalId === currentVocal.value?.id && variant.musicAssetType === 'jacket')?.assetbundleName
    : ''
  return `${assetsHost.value}/startapp/music/jacket/${music.value.assetbundleName}/${fileName || music.value.assetbundleName}.png`
})

function hasVocalJacket(vocalId: number): boolean {
  return musicAssetVariants.value.some(variant => variant.musicVocalId === vocalId && variant.musicAssetType === 'jacket')
}

// 格式化发布时间（包含具体时分秒）
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 获取下载链接
function getDownloadUrl(difficulty: string): string {
  const paddedId = String(musicId.value).padStart(4, '0')
  return `${assetsHost.value}/startapp/music/music_score/${paddedId}_01/${difficulty}`
}

// 强制下载文件（添加 .sus 后缀）
async function forceDownload(difficulty: string) {
  const url = getDownloadUrl(difficulty)
  const paddedId = String(musicId.value).padStart(4, '0')
  const fileName = `${paddedId}_${difficulty}.sus`
  
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('下载失败:', error)
    // 失败时直接打开链接
    window.open(url, '_blank')
  }
  trackEvent('chart-download', { format: 'sus', difficulty })
}

// ===== BPM 展示（点击后拉取谱面解析） =====
const bpmLoading = ref(false)
const bpmError = ref<string | null>(null)
const bpmEvents = ref<SusBpmEvent[] | null>(null)
const bpmDetailOpen = ref(false)

// 默认取 master 谱面；个别缺 master 时回退到已有的最高难度
const bpmSourceDifficulty = computed(() => {
  if (difficulties.value.some(d => d.musicDifficulty === 'master')) return 'master'
  return difficulties.value[difficulties.value.length - 1]?.musicDifficulty ?? 'master'
})

async function loadBpm() {
  if (bpmLoading.value) return
  bpmLoading.value = true
  bpmError.value = null
  try {
    const response = await fetch(getDownloadUrl(bpmSourceDifficulty.value))
    if (!response.ok) {
      throw new Error(`下载谱面文件失败：HTTP ${response.status}`)
    }
    bpmEvents.value = parseSusBpm(await response.text())
  } catch (e) {
    console.error('解析 BPM 失败:', e)
    bpmError.value = e instanceof Error ? e.message : '解析 BPM 失败'
  } finally {
    bpmLoading.value = false
  }
}

function formatBpmValue(value: number): string {
  return `${Number(value.toFixed(3))}`
}

// 与谱面预览 formatBar 口径一致：整数直接显示，小节内偏移保留小数
function formatBpmBar(value: number): string {
  if (Math.abs(value - Math.round(value)) < 1e-9) return `${Math.round(value)}`
  return `${Number(value.toFixed(4))}`
}

const bpmSummaryText = computed(() => {
  const events = bpmEvents.value
  if (!events || !events.length) return '—'
  const values = [...new Set(events.map(e => e.bpm))]
  if (values.length === 1) return formatBpmValue(values[0] ?? 0)
  return `${formatBpmValue(Math.min(...values))} ~ ${formatBpmValue(Math.max(...values))}`
})

// 打开谱面播放预览
function toHttpsUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl, window.location.origin)
    return parsed.protocol === 'https:' ? parsed.toString() : ''
  } catch {
    return ''
  }
}

function buildPreviewUrl(previewBase: string, payload: PreviewPayload) {
  if (!payload.sus) throw new Error('sus is required')

  const cfg: Record<string, string | number> = { s: payload.sus }
  if (payload.bgm) cfg.b = payload.bgm
  if (payload.cover) cfg.c = payload.cover
  if (typeof payload.offset === 'number' && Number.isFinite(payload.offset)) cfg.o = payload.offset
  if (payload.title) cfg.t = payload.title
  if (payload.lyricist) cfg.ly = payload.lyricist
  if (payload.composer) cfg.co = payload.composer
  if (payload.arranger) cfg.ar = payload.arranger
  if (payload.vocal) cfg.v = payload.vocal
  if (payload.collaboration?.trim()) cfg.cl = payload.collaboration.trim().slice(0, 120)
  if (payload.difficulty !== undefined && payload.difficulty !== null && String(payload.difficulty).trim() !== '') {
    cfg.d = payload.difficulty
  }

  const json = JSON.stringify(cfg)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0)
  }
  // chartview 要求 cfg 使用 base64url，不是 encodeURIComponent(JSON)
  const cfgBase64Url = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  return `${previewBase.replace(/\/$/, '')}/preview?cfg=${cfgBase64Url}`
}

function openChartPreview(difficulty: string) {
  const susUrl = toHttpsUrl(getDownloadUrl(difficulty))
  if (!susUrl || !music.value) {
    alert('谱面地址无效，请检查资源源设置（需 https）')
    return
  }

  const bgmUrl = toHttpsUrl(currentAudioUrl.value)
  const cover = toHttpsUrl(coverUrl.value)
  const offset = audioTrimStartSec.value ? Math.round(audioTrimStartSec.value * 1000) : 0
  const vocal = currentVocal.value ? getVocalSingers(currentVocal.value, ', ') : ''
  const difficultyOrder = ['easy', 'normal', 'hard', 'expert', 'master', 'append', 'eternal']
  const difficultyIndex = difficultyOrder.indexOf(difficulty.toLowerCase())

  const previewUrl = buildPreviewUrl(chartPlaybackHost, {
    sus: susUrl,
    bgm: bgmUrl || undefined,
    cover: cover || undefined,
    offset,
    title: music.value.title,
    lyricist: music.value.lyricist,
    composer: music.value.composer,
    arranger: music.value.arranger,
    vocal: vocal || undefined,
    collaboration: musicCollaborationLabel.value || undefined,
    difficulty: difficultyIndex >= 0 ? difficultyIndex : (difficultyLabels[difficulty] || difficulty.toUpperCase()),
  })

  window.open(previewUrl, '_blank')
  trackEvent('chart-preview', { type: '3d', difficulty })
}

// ===== 谱面 SVG 预览（前端 sus2img 生成） =====
async function openChartSvgPreview(diff: MusicDifficulty) {
  if (!music.value) return
  trackEvent('chart-preview', { type: 'image', difficulty: diff.musicDifficulty })

  // 清理上一次的结果
  if (chartSvgPreviewResult) {
    URL.revokeObjectURL(chartSvgPreviewResult.url)
    chartSvgPreviewResult = null
  }

  chartSvgPreviewOpen.value = true
  chartSvgPreviewLoading.value = true
  chartSvgPreviewError.value = null
  chartSvgPreviewSvgText.value = null
  previewDifficultyData.value = diff
  previewZoom.value = 1

  try {
    const susUrl = getDownloadUrl(diff.musicDifficulty)
    const response = await fetch(susUrl)
    if (!response.ok) {
      throw new Error(`下载谱面文件失败：HTTP ${response.status}`)
    }
    const susText = await response.text()

    const result = await renderSusToSvg({
      sus: susText,
      title: music.value.title,
      artist: music.value.composer || undefined,
      difficulty: difficultyLabels[diff.musicDifficulty] || diff.musicDifficulty.toUpperCase(),
      playlevel: String(diff.playLevel),
      pixel: '240',
      skin: 'custom01',
      jacket: coverUrl.value || undefined,
      isOfficial: true,
      interactiveJudgment: true,
    })

    chartSvgPreviewResult = result
    chartSvgPreviewImageUrl.value = result.url
    chartSvgPreviewSvgText.value = result.svgText
    chartSvgPreviewWidth.value = result.width
    chartSvgPreviewHeight.value = result.height
  } catch (e) {
    chartSvgPreviewError.value = e instanceof Error ? e.message : '生成谱面预览失败'
  } finally {
    chartSvgPreviewLoading.value = false
    if (chartSvgPreviewSvgText.value) {
      await nextTick()
      requestAnimationFrame(() => {
        previewZoomFit()
      })
    }
  }
}

function closeChartSvgPreview() {
  chartSvgPreviewOpen.value = false
  if (chartSvgPreviewResult) {
    URL.revokeObjectURL(chartSvgPreviewResult.url)
    chartSvgPreviewResult = null
  }
  chartSvgPreviewSvgText.value = null
}

async function downloadPreviewPng() {
  if (!chartSvgPreviewSvgText.value) return
  isDownloadingPreviewPng.value = true
  try {
    const svgText = chartJudgmentPreviewRef.value?.getSvgForExport() ?? chartSvgPreviewSvgText.value
    const width = chartSvgPreviewWidth.value || chartSvgPreviewResult?.width || 0
    const height = chartSvgPreviewHeight.value || chartSvgPreviewResult?.height || 0

    // 如果可以从已有结果获取尺寸，直接使用；否则从 SVG 解析
    let canvasWidth = width
    let canvasHeight = height
    if (!canvasWidth || !canvasHeight) {
      const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
      const svgEl = doc.documentElement
      canvasWidth = parseFloat(svgEl.getAttribute('width') || '0') || 0
      canvasHeight = parseFloat(svgEl.getAttribute('height') || '0') || 0
      if (!canvasWidth || !canvasHeight) {
        const vb = svgEl.getAttribute('viewBox')?.trim().split(/\s+/).map(Number)
        canvasWidth = vb?.[2] || 0
        canvasHeight = vb?.[3] || 0
      }
    }

    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('SVG 图片载入失败'))
      image.src = svgUrl
    })
    URL.revokeObjectURL(svgUrl)

    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(canvasWidth || image.naturalWidth)
    canvas.height = Math.ceil(canvasHeight || image.naturalHeight)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('浏览器不支持 Canvas')
    ctx.drawImage(image, 0, 0)

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG 导出失败'))), 'image/png')
    })

    const url = URL.createObjectURL(pngBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${sanitizeFileName(music.value!.title)}_${previewDifficultyData.value?.musicDifficulty ?? 'chart'}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    trackEvent('chart-download', { format: 'png', difficulty: previewDifficultyData.value?.musicDifficulty })
  } catch (e) {
    console.error('PNG 下载失败:', e)
    alert('PNG 下载失败，请稍后重试')
  } finally {
    isDownloadingPreviewPng.value = false
  }
}

// 加载数据
async function loadData() {
  isLoading.value = true
  try {
    const [
      musicsData,
      musicCategoryData,
      difficultiesData,
      vocalsData,
      eventsData,
      eventMusicsData,
      charactersData,
      outsideCharactersData,
      gameCharacterUnitData,
      musicVideoCharacterData,
      limitedData,
      releaseConditionData,
      musicCollaborationData,
      musicOriginalData,
      musicAssetVariantData,
    ] = await Promise.all([
      masterStore.getMaster<Music>('musics'),
      masterStore.getMaster<MusicCategory>('musicCategories'),
      masterStore.getMaster<MusicDifficulty>('musicDifficulties'),
      masterStore.getMaster<MusicVocal>('musicVocals'),
      masterStore.getMaster<EventData>('events'),
      masterStore.getMaster<EventMusic>('eventMusics'),
      masterStore.getMaster<Character>('gameCharacters'),
      masterStore.getMaster<OutsideCharacter>('outsideCharacters'),
      masterStore.getMaster<GameCharacterUnit>('gameCharacterUnits'),
      masterStore.getMaster<MusicVideoCharacter>('musicVideoCharacters'),
      masterStore.getMaster<LimitedTimeMusic>('limitedTimeMusics'),
      masterStore.getMaster<ReleaseCondition>('releaseConditions'),
      masterStore.getMaster<MusicCollaboration>('musicCollaborations'),
      masterStore.getMaster<MusicOriginal>('musicOriginals'),
      masterStore.getMaster<MusicAssetVariant>('musicAssetVariants'),
    ])
    
    // 设置角色数据
    characters.value = charactersData
    outsideCharacters.value = outsideCharactersData
    gameCharacterUnits.value = gameCharacterUnitData
    musicVideoCharacters.value = musicVideoCharacterData
    limitedMusics.value = limitedData
    releaseConditions.value = releaseConditionData
    musicCollaborations.value = musicCollaborationData
    musicOriginals.value = musicOriginalData
    musicAssetVariants.value = musicAssetVariantData

    // 获取歌曲数据
    music.value = musicsData.find(m => m.id === musicId.value) || null
    musicCategories.value = musicCategoryData
      .filter(category => category.musicId === musicId.value)
      .map(category => category.musicCategoryName)

    if (!music.value) {
      isLoading.value = false
      return
    }

    // 检查是否过期，受剧透过滤控制
    if (isExpired.value && !settingsStore.showSpoilers) {
      router.push('/musics')
      return
    }


    // 获取难度数据
    difficulties.value = difficultiesData
      .filter(d => d.musicId === musicId.value)
      .sort((a, b) => {
        const order = ['easy', 'normal', 'hard', 'expert', 'master', 'append']
        return order.indexOf(a.musicDifficulty) - order.indexOf(b.musicDifficulty)
      })

    // 获取声乐数据
    vocals.value = vocalsData.filter(v => v.musicId === musicId.value)
    
    // 根据设置选择默认 vocal
    if (settingsStore.defaultVocal === 'sekai') {
      const sekaiIndex = vocals.value.findIndex(v => 
        v.musicVocalType === 'sekai' || v.caption.includes('セカイ')
      )
      if (sekaiIndex !== -1) {
        currentVocalIndex.value = sekaiIndex
      } else {
        currentVocalIndex.value = 0
      }
    } else {
      currentVocalIndex.value = 0
    }
    // 这首歌已经在全站播放器里：显示正在播放的那个版本
    syncVocalWithPlayer()
    
    // 获取关联活动
    const eventMusic = eventMusicsData.find(em => em.musicId === musicId.value)
    if (eventMusic) {
      relatedEvent.value = eventsData.find(e => e.id === eventMusic.eventId) || null
    } else {
      relatedEvent.value = null
    }

  } catch (error) {
    console.error('加载歌曲详情失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 类别 -> 图标文件名映射
const categoryIconMap: Record<string, string> = {
  'mv_2d': 'mv_2d',
  'mv': 'mv_3d',
  'original': 'original',
}

const matchedIcons = computed(() => {
  if (!music.value) return []
  return Object.entries(categoryIconMap)
    .filter(([cat]) => musicCategories.value.includes(cat))
    .map(([, icon]) => icon)
})

const releaseConditionMap = computed(() => {
  return Object.fromEntries(releaseConditions.value.map(condition => [condition.id, condition]))
})

const musicReleaseConditionText = computed(() => {
  const id = music.value?.releaseConditionId
  if (!id) return ''
  if (id === 1) return '直接持有'
  if (id === 5) return '音乐商店购买'
  if (id === 10) return '礼物箱收取'
  return releaseConditionMap.value[id]?.sentence || `#${id}`
})

const musicCollaborationLabel = computed(() => {
  const id = Number(music.value?.musicCollaborationId)
  if (!Number.isFinite(id)) return ''
  return musicCollaborations.value.find(collaboration => collaboration.id === id)?.label || ''
})

const musicOriginalLink = computed(() => {
  const link = musicOriginals.value.find(original => original.musicId === musicId.value)?.videoLink || ''
  return /^https?:\/\//i.test(link) ? link : ''
})

const musicVideoLineup = computed(() => {
  const unitMap = new Map(gameCharacterUnits.value.map(unit => [unit.id, unit]))
  return musicVideoCharacters.value
    .filter(row => row.musicId === musicId.value)
    .sort((a, b) => a.seq - b.seq || a.dancePriority - b.dancePriority)
    .map(row => {
      const unit = unitMap.get(row.gameCharacterUnitId)
      return {
        ...row,
        gameCharacterId: unit?.gameCharacterId || row.gameCharacterUnitId,
        unit: unit?.unit || '',
      }
    })
})

const musicVideoVersionLabel = computed(() => {
  const type = musicVideoLineup.value[0]?.defaultMusicType
  return type === 'original_music' ? 'Original ver.' : type === 'sekai' ? 'SEKAI ver.' : ''
})

function getCharacterName(characterId: number): string {
  const character = characters.value.find(row => row.id === characterId)
  if (!character) return `角色 #${characterId}`
  return characterName(character)
}

function getCharacterIcon(characterId: number): string {
  if (characterId <= 20) return `/img/chr_ts/chr_ts_90_${characterId}.png`
  return `/img/chr_ts/chr_ts_90_${characterId}_2.png`
}

const musicOwnershipLabel = computed(() => {
  if (!music.value || !hasMusicOwnership.value) return ''
  const isMusicShopPurchase = releaseConditionMap.value[music.value.releaseConditionId]?.releaseConditionType === 'music_shop'
  if (isMusicShopPurchase) return isCurrentMusicOwned.value ? '已购买' : '未购买'
  return isCurrentMusicOwned.value ? '已获取' : '未获取'
})

// 注音 (furigana) - 实验性
const furiganaSegments = computed(() => {
  if (!music.value?.pronunciation) return []
  return alignFurigana(music.value.title, music.value.pronunciation)
})

const hasFurigana = computed(() => {
  return furiganaSegments.value.some(s => s.ruby)
})

// 动态设置网页标题
const defaultTitle = 'Uni PJSK Viewer'

const pageTitle = computed(() => {
  if (music.value) {
    return `${music.value.title} - Uni PJSK Viewer`
  }
  return defaultTitle
})

const pageDescription = computed(() => {
  if (music.value) {
    return `世界计划（PJSK / Project SEKAI）歌曲「${music.value.title}」。作词：${music.value.lyricist}，作曲：${music.value.composer}。查看该曲目的不同演唱版本试听、谱面预览及相关活动信息。`
  }
  return '查看世界计划（PJSK / Project SEKAI）的歌曲详细数据及试听资源。'
})

const pageImage = computed(() => {
  if (music.value) {
    return `${assetsHost.value}/startapp/music/jacket/${music.value.assetbundleName}/${music.value.assetbundleName}.png`
  }
  return ''
})

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogImage: pageImage,
  twitterCard: 'summary_large_image',
})

const pageKeywords = computed(() => {
  if (music.value) {
    return `世界计划, PJSK, Project SEKAI, ${music.value.title}, ${music.value.lyricist}, ${music.value.composer}, 试听, 谱面预览, 初音未来`
  }
  return '世界计划, PJSK, Project SEKAI, 歌曲, 试听, 谱面'
})

useHead({
  meta: [
    { name: 'keywords', content: pageKeywords }
  ]
})

// 头部的模糊封面要铺到内容区两端：main 有最大宽度，超宽屏时两侧还有空白，
// 量出 main 与内容区之间的距离，让背景向两侧延伸同样的长度
const musicHeadRef = ref<HTMLElement | null>(null)
const backdropBleed = ref({ left: 0, right: 0 })
let backdropObserver: ResizeObserver | undefined

function measureBackdropBleed() {
  const head = musicHeadRef.value
  const host = head?.closest('main')?.parentElement
  if (!head || !host) return
  const headRect = head.getBoundingClientRect()
  const hostRect = host.getBoundingClientRect()
  const hostStyle = getComputedStyle(host)
  // 取整向下，宁可差半个像素也不撑出横向滚动条
  const left = Math.max(0, Math.floor(headRect.left - hostRect.left - parseFloat(hostStyle.paddingLeft)))
  const right = Math.max(0, Math.floor(hostRect.right - parseFloat(hostStyle.paddingRight) - headRect.right))
  if (left !== backdropBleed.value.left || right !== backdropBleed.value.right) backdropBleed.value = { left, right }
}

watch(musicHeadRef, (head) => {
  backdropObserver?.disconnect()
  backdropObserver = undefined
  const host = head?.closest('main')?.parentElement
  if (!head || !host || typeof ResizeObserver === 'undefined') return
  backdropObserver = new ResizeObserver(measureBackdropBleed)
  backdropObserver.observe(head)
  backdropObserver.observe(host)
  measureBackdropBleed()
})

onBeforeUnmount(() => backdropObserver?.disconnect())

// 上一页是列表时后退以保留筛选与页码，否则打开列表
const goBack = useBackToList('/musics', ['/musics/search'])

onMounted(loadData)

const now = Date.now()
const currentLimitedData = computed(() => {
  return limitedMusics.value.find(lm => lm.musicId === musicId.value)
})

const isLimitedTime = computed(() => {
  const lm = currentLimitedData.value
  if (!lm) return false
  return now >= lm.startAt && now < lm.endAt
})

const isExpired = computed(() => {
  const lm = currentLimitedData.value
  if (!lm) return false
  return now >= lm.endAt
})
</script>

<template>
  <div class="max-w-6xl mx-auto sm:px-4">
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- 歌曲详情 -->
    <template v-else-if="music">
      <div class="music-page">
        <!-- 头部铺满内容区，模糊的封面从顶部一直延伸到下方内容 -->
        <header ref="musicHeadRef" class="music-head">
          <div
            class="music-head-backdrop"
            aria-hidden="true"
            :style="{ '--bleed-left': `${backdropBleed.left}px`, '--bleed-right': `${backdropBleed.right}px` }"
          >
            <img :src="coverUrl" alt="" crossorigin="anonymous" />
          </div>

          <!-- 顶部导航 -->
          <div class="music-back">
            <button class="btn btn-ghost btn-sm gap-2 pl-0" @click="goBack">
              <ChevronLeft class="w-4 h-4" /> 返回列表
            </button>
          </div>

          <!-- 头部：封面、曲名与播放操作 -->
          <section class="music-hero">
            <div class="music-hero-art">
              <a :href="coverUrl" target="_blank" rel="noopener noreferrer" class="block rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
                <AssetImage
                  :src="coverUrl"
                  :alt="music.title"
                  :lazy="false"
                  class="w-full h-auto object-cover aspect-square"
                />
              </a>
              <!-- 类别图标 -->
              <div v-if="matchedIcons.length" class="absolute bottom-3 left-3 flex gap-1.5 z-20">
                <img
                  v-for="cat in matchedIcons"
                  :key="cat"
                  :src="`/img/${cat}.png`"
                  :alt="cat"
                  class="w-8 h-8 drop-shadow-lg"
                />
              </div>
            </div>

            <div class="music-hero-info">
              <div v-if="isLimitedTime || isExpired || musicOwnershipLabel || musicCollaborationLabel" class="music-hero-badges">
                <div v-if="isLimitedTime" class="badge badge-warning text-warning-content font-bold shadow-sm h-auto py-1.5 px-3 flex flex-col text-center whitespace-normal leading-tight">
                  <span>期间限定</span>
                  <span class="text-[10px] sm:text-[11px] font-normal opacity-90 mt-0.5">
                    {{ formatDate(currentLimitedData!.startAt) }} - {{ formatDate(currentLimitedData!.endAt) }}
                  </span>
                </div>
                <div v-else-if="isExpired" class="badge bg-base-300 text-base-content/60 font-bold border-none">已过期</div>
                <div v-if="musicOwnershipLabel" class="badge" :class="isCurrentMusicOwned ? 'badge-success badge-outline' : 'badge-ghost'">{{ musicOwnershipLabel }}</div>
                <div v-if="musicCollaborationLabel" class="badge badge-secondary badge-outline max-w-full h-auto py-1 text-center whitespace-normal"><ZhText :text="musicCollaborationLabel" table="musicCollaborations" path="label" layout="inline" /></div>
              </div>

              <h1 v-if="music.pronunciation && hasFurigana" class="music-title select-all leading-relaxed">
                <template v-for="(seg, i) in furiganaSegments" :key="i">
                  <ruby v-if="seg.ruby">{{ seg.text }}<rp>(</rp><rt class="text-xs font-medium text-primary/70 select-none">{{ seg.ruby }}</rt><rp>)</rp></ruby><template v-else>{{ seg.text }}</template>
                </template>
              </h1>
              <h1 v-else class="music-title select-all">{{ music.title }}</h1>

              <!-- 翻译 -->
              <p v-if="translation" class="music-translation text-base-content/70 mt-1 select-all">{{ translation }}</p>
              <a
                v-else-if="zhMusicEnabled"
                href="https://paratranz.cn/projects/18073"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-primary/60 hover:text-primary mt-1 inline-flex items-center gap-1 transition-colors"
              >
                贡献翻译 →
              </a>

              <dl class="music-credits">
                <div><dt>作词</dt><dd class="select-all">{{ music.lyricist }}</dd></div>
                <div><dt>作曲</dt><dd class="select-all">{{ music.composer }}</dd></div>
                <div><dt>编曲</dt><dd class="select-all">{{ music.arranger }}</dd></div>
              </dl>

              <!-- 当前选中的版本 -->
              <div class="music-version">
                <div class="music-version-head flex flex-wrap items-center gap-2">
                  <p class="font-semibold text-base-content"><ZhText v-if="currentVocal?.caption" :text="currentVocal.caption" table="musicVocals" path="caption" layout="inline" /><template v-else>加载中...</template></p>
                  <span v-if="currentVocal && getVocalAccountStatus(currentVocal)" class="badge badge-sm gap-1" :class="isVocalAvailable(currentVocal) ? 'badge-success' : 'badge-ghost'">
                    <CheckCircle2 v-if="isVocalAvailable(currentVocal)" class="w-3 h-3" />
                    <LockKeyhole v-else class="w-3 h-3" />
                    {{ getVocalAccountLabel(currentVocal) }}
                  </span>
                  <span v-if="currentVocal && hasVocalJacket(currentVocal.id)" class="badge badge-sm badge-secondary badge-outline">专属封面</span>
                </div>
                <p v-if="currentVocal && getVocalSingers(currentVocal)" class="music-version-singers text-sm text-base-content/60 flex items-center gap-2 mt-2 pl-0.5">
                  <SingerAvatars :singers="vocalAvatars.get(currentVocal.id) || []" :size="26" :max="8" />
                  <span class="min-w-0">{{ getVocalSingers(currentVocal) }}</span>
                </p>
              </div>

              <!-- 播放与队列操作：音频在全站播放器里，离开本页继续播放 -->
              <div class="music-actions">
                <button class="btn btn-primary rounded-full gap-2 pl-5 pr-6 shadow-lg" :disabled="!currentTrack" @click="togglePlay">
                  <Loader2 v-if="isPlaying && player.isBuffering" class="w-5 h-5 animate-spin" />
                  <Pause v-else-if="isPlaying" class="w-5 h-5" fill="currentColor" />
                  <Play v-else class="w-5 h-5" fill="currentColor" />
                  {{ isPlaying ? '暂停' : isActiveVocal ? '继续播放' : '播放' }}
                </button>
                <button class="music-action btn btn-ghost btn-sm gap-1.5" :disabled="!currentTrack" title="排在当前歌曲之后播放" @click="addToQueue('next')">
                  <Check v-if="queuedFeedback === 'next'" class="w-4 h-4 text-success" />
                  <ListStart v-else class="w-4 h-4" />
                  {{ queuedFeedback === 'next' ? '已添加' : '下一首播放' }}
                </button>
                <button class="music-action btn btn-ghost btn-sm gap-1.5" :disabled="!currentTrack" title="添加到播放队列末尾" @click="addToQueue('end')">
                  <Check v-if="queuedFeedback === 'end'" class="w-4 h-4 text-success" />
                  <ListPlus v-else class="w-4 h-4" />
                  {{ queuedFeedback === 'end' ? '已添加' : '加入队列' }}
                </button>
                <div class="music-action-menu dropdown dropdown-end">
                  <button 
                    tabindex="0"
                    class="music-action btn btn-ghost btn-sm gap-1.5 hover:bg-base-200/50"
                    :disabled="!currentVocal"
                    aria-label="下载"
                  >
                    <Download class="w-4 h-4" />
                    <span>下载</span>
                  </button>
                  <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-20 w-56 p-2 shadow-lg border border-base-200">
                    <li>
                      <button :disabled="!currentVocal" @click="downloadAudio">
                        下载原音频
                      </button>
                    </li>
                    <li>
                      <button :disabled="!currentVocal || audioTrimStartSec <= 0" @click="downloadTrimmedAudio">
                        下载去头部静音音频
                      </button>
                    </li>
                  </ul>
                </div>
                <button v-if="isActiveSong" class="music-action btn btn-ghost btn-sm gap-1.5" title="全屏显示歌词" @click="player.openNowPlaying('lyrics')">
                  <Maximize2 class="w-4 h-4" /> 全屏
                </button>
              </div>

              <!-- 正在播放这个版本时的进度与音量 -->
              <div v-if="isActiveVocal" class="music-transport">
                <button class="btn btn-ghost btn-sm btn-circle" title="后退10秒" aria-label="后退10秒" :disabled="!isAudioLoaded" @click="player.skip(-10)">
                  <SkipBack class="w-4 h-4" />
                </button>
                <PlayerScrubber
                  class="detail-scrubber min-w-0 flex-1"
                  :time="currentTime"
                  :duration="duration"
                  :disabled="!isAudioLoaded"
                  @seek="player.seek"
                />
                <button class="btn btn-ghost btn-sm btn-circle" title="前进10秒" aria-label="前进10秒" :disabled="!isAudioLoaded" @click="player.skip(10)">
                  <SkipForward class="w-4 h-4" />
                </button>
                <div class="music-volume">
                  <button class="btn btn-ghost btn-xs btn-circle" :aria-label="player.muted || player.volume === 0 ? '取消静音' : '静音'" @click="player.toggleMute()">
                    <VolumeX v-if="player.muted || player.volume === 0" class="w-4 h-4 text-base-content/60" />
                    <Volume2 v-else class="w-4 h-4 text-base-content/60" />
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    aria-label="音量"
                    :value="player.muted ? 0 : player.volume"
                    class="range range-xs range-primary w-20 focus:outline-none focus:ring-0"
                    @input="onVolumeChange"
                  />
                </div>
              </div>
              <p v-if="isActiveVocal && player.hasError" class="mt-2 text-xs text-error">音频加载失败，点击播放重试</p>
            </div>
          </section>
        </header>

        <div class="music-body" :class="{ 'music-body--single': !showLyricsColumn }">
          <div class="music-main">
            <!-- 演唱版本 -->
            <section v-if="vocals.length > 1" class="music-section music-section--vocals">
              <h2 class="music-section-title">
                <Disc3 class="w-5 h-5 text-primary" /> 演唱版本
                <span class="music-section-note">
                  {{ vocals.length }} 个<template v-if="hasVocalOwnership && purchasableVocals.length"> · 特殊版本已购买 {{ purchasedVocalCount }}/{{ purchasableVocals.length }}</template>
                </span>
              </h2>
              <div class="max-h-[23rem] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <div
                  v-for="(vocal, index) in vocals"
                  :key="vocal.id"
                  class="vocal-row"
                  :class="{ selected: currentVocalIndex === index }"
                >
                  <button class="vocal-main" :aria-pressed="currentVocalIndex === index" @click="selectVocal(index)">
                    <!-- 播放指示器 -->
                    <span class="shrink-0 mt-0.5">
                      <span
                        v-if="currentVocalIndex === index && isPlaying"
                        class="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                      >
                        <span class="flex gap-0.5">
                          <span class="w-0.5 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                          <span class="w-0.5 h-3 bg-white rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                          <span class="w-0.5 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                        </span>
                      </span>
                      <Disc3 v-else class="w-5 h-5" :class="currentVocalIndex === index ? 'text-primary' : 'text-base-content/40'" />
                    </span>

                    <!-- 版本信息 -->
                    <span class="flex-1 min-w-0">
                      <span class="block font-medium text-sm" :class="currentVocalIndex === index ? 'text-primary' : 'text-base-content'">
                        <ZhText :text="vocal.caption" table="musicVocals" path="caption" layout="inline" />
                      </span>
                      <span v-if="getVocalSingers(vocal)" class="text-xs text-base-content/50 mt-1 flex items-center gap-1.5 pl-0.5">
                        <SingerAvatars :singers="vocalAvatars.get(vocal.id) || []" :size="18" :max="6" />
                        <span class="truncate">{{ getVocalSingers(vocal) }}</span>
                      </span>
                    </span>
                    <span class="flex shrink-0 flex-col items-end gap-1">
                      <span v-if="getVocalAccountStatus(vocal)" class="badge badge-xs" :class="isVocalAvailable(vocal) ? 'badge-success' : 'badge-ghost'">{{ getVocalAccountLabel(vocal) }}</span>
                      <span v-if="hasVocalJacket(vocal.id)" class="badge badge-xs badge-secondary badge-outline">专属封面</span>
                    </span>
                  </button>
                  <MusicQueueButton :music-id="musicId" :vocal-id="vocal.id" :title="`${music.title} ${vocal.caption}`" variant="inline" class="!h-8 !w-8 mr-1.5" />
                </div>
              </div>
            </section>

            <!-- 谱面 -->
            <section class="music-section music-section--charts">
              <h2 class="music-section-title">
                <BarChart2 class="w-5 h-5 text-secondary" /> 谱面详情
              </h2>
              <!-- 一排难度，下面是选中难度的操作 -->
              <div v-if="selectedChart" class="chart-picker">
                <div class="chart-tabs" role="radiogroup" aria-label="难度">
                  <button
                    v-for="diff in difficulties"
                    :key="diff.id"
                    class="chart-tab"
                    :class="{ active: selectedChart.id === diff.id }"
                    :style="chartTabVars(diff.musicDifficulty)"
                    role="radio"
                    :aria-checked="selectedChart.id === diff.id"
                    @click="selectedChartDifficulty = diff.musicDifficulty"
                  >
                    <span class="chart-tab-label">{{ difficultyLabels[diff.musicDifficulty] || diff.musicDifficulty.toUpperCase() }}</span>
                    <span class="chart-tab-level">{{ diff.playLevel }}</span>
                  </button>
                </div>
                <div class="chart-panel" :style="chartTabVars(selectedChart.musicDifficulty)">
                  <p class="chart-panel-meta">
                    <span class="chart-panel-label">{{ difficultyLabels[selectedChart.musicDifficulty] || selectedChart.musicDifficulty.toUpperCase() }}</span>
                    <span>Lv.<b>{{ selectedChart.playLevel }}</b></span>
                    <span class="opacity-40">·</span>
                    <span><b>{{ selectedChart.totalNoteCount }}</b> COMBO</span>
                  </p>
                  <div class="chart-panel-actions">
                    <button class="btn btn-sm" @click="openChartSvgPreview(selectedChart)">
                      <Eye class="w-4 h-4 shrink-0" /> 谱面预览
                    </button>
                    <button class="btn btn-sm" @click="openChartPreview(selectedChart.musicDifficulty)">
                      <PlayCircle class="w-4 h-4 shrink-0" /> 在线游玩
                    </button>
                    <button class="btn btn-sm" @click="forceDownload(selectedChart.musicDifficulty)">
                      <Download class="w-4 h-4 shrink-0" /> 谱面下载
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- 歌曲信息 -->
            <section class="music-section music-section--info">
              <h2 class="music-section-title">
                <Info class="w-5 h-5 text-accent" /> 歌曲信息
              </h2>
              <div class="music-facts">
                <div class="text-sm border-b border-base-200 pb-2">
                  <div class="flex justify-between items-center min-h-6">
                    <span class="text-base-content/60">BPM</span>
                    <span v-if="bpmLoading" class="loading loading-spinner loading-xs text-primary"></span>
                    <button
                      v-else-if="bpmError"
                      class="btn btn-ghost btn-xs h-6 min-h-0 px-2 font-normal text-error"
                      :title="bpmError"
                      @click="loadBpm"
                    >
                      加载失败，重试
                    </button>
                    <span v-else-if="bpmEvents" class="font-medium font-mono select-all">{{ bpmSummaryText }}</span>
                    <button
                      v-else
                      class="btn btn-ghost btn-xs h-6 min-h-0 px-2 font-normal text-primary gap-1"
                      @click="loadBpm"
                    >
                      <Activity class="w-3.5 h-3.5" /> 点击查看
                    </button>
                  </div>
                  <template v-if="bpmEvents && bpmEvents.length > 1">
                    <button
                      class="mt-1.5 flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
                      @click="bpmDetailOpen = !bpmDetailOpen"
                    >
                      <ChevronDown class="w-3 h-3 transition-transform" :class="{ 'rotate-180': bpmDetailOpen }" />
                      变速详情（{{ bpmEvents.length }} 段）
                    </button>
                    <div
                      v-if="bpmDetailOpen"
                      class="mt-1.5 max-h-36 overflow-y-auto custom-scrollbar rounded-lg bg-base-200/40 px-3 py-2 space-y-1"
                    >
                      <div
                        v-for="(ev, i) in bpmEvents"
                        :key="i"
                        class="flex justify-between items-center text-xs font-mono"
                      >
                        <span class="text-base-content/50">#{{ formatBpmBar(ev.bar) }} 小节起</span>
                        <span>{{ formatBpmValue(ev.bpm) }}</span>
                      </div>
                    </div>
                  </template>
                </div>
                <div class="flex justify-between items-center text-sm border-b border-base-200 pb-2">
                  <span class="text-base-content/60">发布日期</span>
                  <span class="font-medium">{{ formatDate(music.publishedAt) }}</span>
                </div>
                <div class="flex justify-between items-center gap-3 text-sm border-b border-base-200 pb-2">
                  <span class="text-base-content/60 shrink-0">乐曲获取方式</span>
                  <span class="font-medium text-right select-all"><ZhText :text="musicReleaseConditionText" table="releaseConditions" path="sentence" /></span>
                </div>
                <div v-if="musicOriginalLink" class="flex justify-between items-center gap-3 text-sm border-b border-base-200 pb-2">
                  <span class="text-base-content/60 shrink-0">原曲链接</span>
                  <a :href="musicOriginalLink" target="_blank" rel="noopener noreferrer" class="link link-primary inline-flex items-center gap-1 font-medium">
                    在新窗口打开 <ExternalLink class="w-3.5 h-3.5" />
                  </a>
                </div>
                <div class="flex justify-between items-center gap-3 text-sm border-b border-base-200 pb-2">
                  <span class="text-base-content/60 shrink-0">前置空白</span>
                  <span class="font-medium text-right">{{ audioTrimStartSec.toFixed(2) }} 秒<span v-if="audioTrimStartSec > 0" class="font-normal text-base-content/50"> · 播放时自动跳过</span></span>
                </div>
                <div class="flex justify-between items-center text-sm border-b border-base-200 pb-2">
                  <span class="text-base-content/60">ID</span>
                  <span class="font-medium font-mono">#{{ music.id }}</span>
                </div>
              </div>
            </section>

            <!-- 3D MV 默认编队 -->
            <section v-if="musicVideoLineup.length" class="music-section music-section--lineup">
              <h2 class="music-section-title">
                <PlayCircle class="w-5 h-5 text-primary" /> 3D MV 默认编队
                <span class="badge badge-sm badge-ghost ml-auto">{{ musicVideoVersionLabel }}</span>
              </h2>
              <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
                <RouterLink
                  v-for="member in musicVideoLineup"
                  :key="member.id"
                  :to="`/characters/${member.gameCharacterId}`"
                  class="group rounded-xl border border-base-200 bg-base-100 p-2 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div class="relative mx-auto h-11 w-11">
                    <img :src="getCharacterIcon(member.gameCharacterId)" :alt="getCharacterName(member.gameCharacterId)" class="h-full w-full rounded-full bg-base-200 object-cover ring-1 ring-base-300" />
                    <span class="absolute -bottom-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-content">{{ member.dancePriority }}</span>
                  </div>
                  <p class="mt-1.5 truncate text-[11px] font-medium" :title="getCharacterName(member.gameCharacterId)">{{ getCharacterName(member.gameCharacterId) }}</p>
                </RouterLink>
              </div>
            </section>

            <!-- 关联活动 -->
            <section v-if="relatedEvent" class="music-section music-section--event">
              <h2 class="music-section-title">
                <Sparkles class="w-5 h-5 text-secondary" /> 收录于活动
              </h2>
              <RouterLink
                :to="`/events/${relatedEvent.id}`"
                class="flex items-center gap-4 rounded-xl bg-base-200/40 p-2 pr-4 transition-colors hover:bg-base-200/80"
              >
                <AssetImage
                  :src="`${assetsHost}/startapp/home/banner/${relatedEvent.assetbundleName}/${relatedEvent.assetbundleName}.png`"
                  alt="活动横幅"
                  class="aspect-[2/1] w-40 shrink-0 rounded-lg object-cover sm:w-52"
                />
                <p class="min-w-0 text-sm font-medium">
                  <span class="badge badge-sm badge-ghost mr-2">#{{ relatedEvent.id }}</span>
                  <ZhText :text="relatedEvent.name" table="events" path="name" layout="inline" />
                </p>
              </RouterLink>
            </section>

            <!-- 自动组队入口 -->
            <div class="music-section--deck">
              <RouterLink
                :to="`/deck-recommend?musicId=${music.id}`"
                class="btn btn-primary btn-block gap-2"
              >
                <Zap class="w-5 h-5" />
                使用这首歌自动组队
              </RouterLink>
            </div>
          </div>

          <!-- 歌词：独立一栏，宽屏时固定在右侧随页面滚动 -->
          <aside v-if="showLyricsColumn" class="music-lyrics" aria-label="歌词">
            <h2 class="music-lyrics-title"><LetterText class="w-4 h-4" /> 歌词</h2>
            <MusicLyrics
              variant="sidebar"
              :music-id="musicId"
              :vocal-id="currentVocal?.id"
              :assetbundle="currentVocal?.assetbundleName"
              :vocal-type="currentVocal?.musicVocalType"
              :synced="isActiveVocal"
              :current-time="currentTime"
              :duration="isAudioLoaded ? duration : 0"
              :playing="isPlaying"
              :clock="player.sampleTime"
              :trim-start="audioTrimStartSec"
              @seek="seekToLyric"
            />
          </aside>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-20">
      <p class="text-base-content/60 text-lg">未找到该歌曲</p>
    </div>

    <!-- 谱面 SVG 预览弹窗 -->
    <dialog
      ref="chartSvgPreviewDialog"
      class="modal"
      @close="onChartSvgPreviewDialogClose"
    >
      <div
        class="modal-box fixed inset-0 flex h-screen w-screen max-w-none flex-col overflow-hidden rounded-none p-0"
      >
        <!-- 标题栏 -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-4 border-b border-base-200 shrink-0">
          <!-- 左侧：标题 + 难度 -->
          <div class="min-w-0 flex items-center gap-2 sm:gap-3">
            <h3 class="text-sm sm:text-lg font-bold truncate"><ZhText :text="music?.title" table="musics" path="title" layout="inline" /></h3>
            <span
              v-if="previewDifficultyData"
              class="badge text-white font-bold border-none px-2 py-1 sm:px-3 sm:py-2 text-xs"
              :style="difficultyBadgeStyle(previewDifficultyData.musicDifficulty)"
            >
              {{ difficultyLabels[previewDifficultyData.musicDifficulty] || previewDifficultyData.musicDifficulty.toUpperCase() }}
            </span>
            <span v-if="previewDifficultyData" class="text-xs text-base-content/50 hidden sm:inline">
              Lv.{{ previewDifficultyData.playLevel }}
              <span class="mx-1">·</span>
              {{ previewDifficultyData.totalNoteCount }} COMBO
            </span>
            <span class="min-w-0 truncate text-xs text-base-content/50" title="点击音符查看判定，可多选，再点关闭。">点击音符查看判定，可多选，再点关闭。</span>
          </div>

          <!-- 右侧：操作按钮 -->
          <div class="flex items-center gap-1 sm:gap-2 shrink-0">
            <!-- 缩放控制 -->
            <div class="flex items-center gap-0 sm:gap-0.5">
              <button class="btn btn-xs sm:btn-sm btn-ghost btn-square h-7 w-7 sm:h-8 sm:w-8" title="缩小" aria-label="缩小" @click="previewZoomOut">
                <ZoomOut class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <span class="text-[10px] sm:text-xs font-mono w-8 sm:w-12 text-center tabular-nums">{{ Math.round(previewZoom * 100) }}%</span>
              <button class="btn btn-xs sm:btn-sm btn-ghost btn-square h-7 w-7 sm:h-8 sm:w-8" title="放大" aria-label="放大" @click="previewZoomIn">
                <ZoomIn class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button class="btn btn-xs sm:btn-sm btn-ghost btn-square h-7 w-7 sm:h-8 sm:w-8" title="适应高度" aria-label="适应高度" @click="previewZoomFit">
                <Maximize class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
            <div class="w-px h-5 sm:h-6 bg-base-300 hidden sm:block"></div>
            <button class="btn btn-xs sm:btn-sm btn-ghost h-7 sm:h-8" :disabled="!chartSvgPreviewSvgText" @click="chartJudgmentPreviewRef?.clearJudgments()">取消全部判定</button>
            <button
              class="btn btn-xs sm:btn-sm btn-ghost btn-outline h-7 sm:h-8"
              title="下载 PNG"
              aria-label="下载 PNG"
              :disabled="!chartSvgPreviewSvgText || isDownloadingPreviewPng"
              @click="downloadPreviewPng"
            >
              <span v-if="isDownloadingPreviewPng" class="loading loading-spinner loading-xs"></span>
              <FileImage v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button class="btn btn-xs sm:btn-sm btn-ghost btn-circle h-7 w-7 sm:h-8 sm:w-8" aria-label="关闭" @click="closeChartSvgPreview">
              <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        <!-- 内容区 -->
        <div class="chart-svg-preview-canvas flex-1 overflow-auto bg-white p-2 text-slate-700 sm:p-4">
          <!-- 加载中 -->
          <div v-if="chartSvgPreviewLoading" class="flex h-full flex-col items-center justify-center gap-3 text-slate-600">
            <Loader2 class="w-8 h-8 animate-spin text-cyan-600" />
            <p class="text-sm">正在生成谱面预览…</p>
          </div>

          <!-- 错误 -->
          <div v-else-if="chartSvgPreviewError" class="flex items-center justify-center h-full">
            <div class="alert alert-error max-w-lg">
              <span>{{ chartSvgPreviewError }}</span>
            </div>
          </div>

          <!-- SVG 预览（带缩放） -->
          <div
            v-else-if="chartSvgPreviewSvgText"
            ref="previewSvgWrapperRef"
            class="min-w-full"
          >
            <!-- 外层容器：约束缩放后的实际尺寸，防止白边 -->
            <div
              :style="{
                width: (chartSvgPreviewWidth * previewZoom) + 'px',
                height: (chartSvgPreviewHeight * previewZoom) + 'px',
                overflow: 'hidden',
              }"
            >
              <ChartJudgmentPreview
                ref="chartJudgmentPreviewRef"
                class="origin-top-left"
                :style="{ transform: `scale(${previewZoom})` }"
                :svg-text="chartSvgPreviewSvgText"
                :image-url="chartSvgPreviewImageUrl"
              />
            </div>
          </div>
        </div>
      </div>

      <form method="dialog" class="modal-backdrop">
        <button @click="closeChartSvgPreview">关闭</button>
      </form>
    </dialog>
  </div>
</template>

<style scoped>
/* 播放时封面旋转动画 */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}

/* ===== 页面骨架：按内容区宽度（而非窗口宽度）排版，右侧歌词栏打开时也能自适应 ===== */
.music-page {
  container: music / inline-size;
}

.music-hero {
  position: relative;
  display: grid;
  gap: 1.125rem;
}

.music-hero-art {
  position: relative;
  width: min(100%, 17rem);
  margin-inline: auto;
}

.music-hero-art > a {
  box-shadow: 0 22px 44px -14px rgb(0 0 0 / 0.5);
}

.music-hero-info {
  position: relative;
  min-width: 0;
}

.music-hero-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.625rem;
}

.music-title {
  font-size: clamp(1.5rem, 2.2cqi + 0.9rem, 2.25rem);
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.music-credits {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.25rem;
  margin-top: 0.75rem;
  font-size: 0.875rem;
}

.music-credits > div {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 0.375rem;
}

.music-credits dt {
  flex-shrink: 0;
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
}

.music-credits dd {
  min-width: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.music-version {
  margin-top: 1rem;
}

.music-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  margin-top: 1rem;
}

.music-actions > .btn-primary {
  margin-right: 0.375rem;
}

.music-transport {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.75rem;
}

.music-transport .detail-scrubber {
  --scrubber-color: linear-gradient(to right, var(--color-primary), var(--color-secondary));
}

.music-volume {
  display: none;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;
}

.music-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1.25rem;
}

/* 窄屏单栏：各区块与歌词按阅读顺序交错排列（版本 → 歌词 → 谱面 → 其他） */
.music-main {
  display: contents;
}

.music-section {
  order: 4;
  min-width: 0;
  padding: 1rem;
  border-radius: 1.25rem;
  background: var(--color-base-100);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.06);
}

.music-section--vocals { order: 1; }
.music-section--charts { order: 3; }
.music-section--deck { order: 5; }

.music-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.875rem;
  font-size: 1rem;
  font-weight: 700;
}

.music-section-note {
  font-size: 0.75rem;
  font-weight: 500;
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
}

.music-facts {
  display: grid;
  gap: 0.75rem 2rem;
}

.vocal-row {
  display: flex;
  align-items: center;
  border-radius: 0.875rem;
  background: color-mix(in srgb, var(--color-base-200) 45%, transparent);
  transition: background-color 0.15s, box-shadow 0.15s;
}

.vocal-row:hover {
  background: color-mix(in srgb, var(--color-base-200) 90%, transparent);
}

.vocal-row.selected {
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 32%, transparent);
}

.vocal-main {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: inherit;
  text-align: left;
  cursor: pointer;
}

/* 歌词栏：一张与页面等高的卡片 */
.music-lyrics {
  position: relative;
  order: 2;
  height: min(64vh, 30rem);
  min-height: 18rem;
  overflow: hidden;
  border-radius: 1.25rem;
  background:
    linear-gradient(160deg, color-mix(in srgb, var(--color-primary) 13%, transparent), color-mix(in srgb, var(--color-secondary) 9%, transparent)),
    var(--color-base-100);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.06);
}

.music-lyrics-title {
  position: absolute;
  z-index: 2;
  top: 0.625rem;
  left: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 700;
  opacity: 0.6;
  pointer-events: none;
}

.music-back {
  margin-bottom: 1rem;
}

/* 头部向外抵消页面的左右与顶部留白，铺满内容区；封面模糊后垫在下面 */
.music-head {
  --bleed-x: 1rem;
  --bleed-top: 1.25rem;
  position: relative;
  isolation: isolate;
  margin: calc(-1 * var(--bleed-top)) calc(-1 * var(--bleed-x)) 0;
  padding: 0.5rem var(--bleed-x);
}

.music-head-backdrop {
  position: absolute;
  z-index: -1;
  inset: 0 calc(-1 * var(--bleed-right, 0px)) 0 calc(-1 * var(--bleed-left, 0px));
  overflow: hidden;
  pointer-events: none;
}

.music-head-backdrop img {
  position: absolute;
  top: -10%;
  left: -30%;
  width: 160%;
  max-width: none;
  height: 85%;
  object-fit: cover;
  opacity: 0.7;
  filter: blur(44px) saturate(1.6);
  transform: translateZ(0);
}

/* 上方保留封面的颜色，往下逐渐融进页面背景 */
.music-head-backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--color-base-200) 30%, transparent) 0%,
    color-mix(in srgb, var(--color-base-200) 50%, transparent) 40%,
    color-mix(in srgb, var(--color-base-200) 85%, transparent) 70%,
    var(--color-base-200) 100%
  );
}

.chart-picker {
  container: chart / inline-size;
}

.chart-tabs {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  gap: 0.375rem;
}

.chart-tab {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 0.0625rem;
  padding: 0.5rem 0 0.4375rem;
  overflow: hidden;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--diff) 16%, var(--color-base-100));
  color: var(--color-base-content);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, background-color 0.15s;
}

.chart-tab::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: var(--diff-bg);
}

.chart-tab.active {
  background: var(--diff-bg);
  color: var(--diff-fg);
  box-shadow: 0 6px 14px -6px color-mix(in srgb, var(--diff) 75%, transparent);
  transform: translateY(-1px);
}

.chart-tab-label {
  max-width: 100%;
  overflow: hidden;
  font-size: 0.5625rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-overflow: clip;
  white-space: nowrap;
  opacity: 0.75;
}

.chart-tab.active .chart-tab-label {
  opacity: 0.9;
}

.chart-tab-level {
  font-size: 1.25rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}

.chart-panel {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.875rem;
  background: color-mix(in srgb, var(--diff) 10%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--diff) 28%, transparent);
}

.chart-panel-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.5rem;
  margin-bottom: 0.625rem;
  font-size: 0.8125rem;
  color: color-mix(in srgb, var(--color-base-content) 70%, transparent);
}

.chart-panel-meta b {
  font-weight: 800;
  color: var(--color-base-content);
}

.chart-panel-label {
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: var(--diff-bg);
  color: var(--diff-fg);
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.chart-panel-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.chart-panel-actions .btn {
  height: 2.5rem;
  min-height: 0;
  gap: 0.25rem;
  padding-inline: 0.25rem;
  border: none;
  background: var(--color-base-100);
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
}

@media (min-width: 640px) {
  .music-head {
    /* 页面自身的 sm:px-4 加上 main 的 sm:px-6 */
    --bleed-x: 2.5rem;
  }
}

@media (min-width: 1024px) {
  .music-head {
    --bleed-top: 2rem;
  }
}

/* ===== 窄屏：内容居中，播放占满一行，其余操作平分成一排图标按钮 ===== */
@container music (width < 36rem) {
  .music-back {
    margin-bottom: 0.5rem;
  }

  .music-hero {
    text-align: center;
  }

  .music-hero-art {
    width: min(76%, 17rem);
  }

  .music-hero-badges,
  .music-credits,
  .music-version-head,
  .music-version-singers {
    justify-content: center;
  }

  .music-title {
    font-size: 1.625rem;
  }

  .music-credits {
    gap: 0.25rem 1rem;
    margin-top: 0.625rem;
  }

  .music-version {
    margin-top: 0.875rem;
  }

  .music-actions {
    gap: 0.25rem;
    margin-top: 1.125rem;
  }

  .music-actions > .btn-primary {
    flex: 1 0 100%;
    height: 3rem;
    margin: 0 0 0.25rem;
    font-size: 1rem;
  }

  .music-actions > .music-action,
  .music-action-menu {
    flex: 1 1 0;
    min-width: 0;
  }

  .music-action {
    height: auto;
    min-height: 0;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 0.125rem;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .music-action-menu > .music-action {
    width: 100%;
  }

  .music-action svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .music-transport {
    margin-top: 0.5rem;
  }
}

/* 宽一些的谱面区：难度说明和三个操作排成一行 */
@container chart (min-width: 32rem) {
  .chart-tab {
    padding: 0.625rem 0 0.5rem;
  }

  .chart-tab-label {
    font-size: 0.6875rem;
  }

  .chart-tab-level {
    font-size: 1.5rem;
  }

  .chart-panel {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .chart-panel-meta {
    flex: 1;
    margin-bottom: 0;
  }

  .chart-panel-actions {
    grid-template-columns: repeat(3, auto);
  }

  .chart-panel-actions .btn {
    padding-inline: 0.875rem;
  }
}

@container music (min-width: 36rem) {
  .music-head {
    padding-bottom: 0.75rem;
  }

  /* 宽屏背景是一条横幅：整张封面横向拉伸后模糊，左右各处带上封面对应位置的颜色 */
  .music-head-backdrop img {
    top: -15%;
    left: -5%;
    width: 110%;
    height: 95%;
    object-fit: fill;
    filter: blur(56px) saturate(1.6);
  }

  .music-hero {
    align-items: center;
    gap: 2rem;
    grid-template-columns: minmax(11rem, 16rem) minmax(0, 1fr);
  }

  .music-hero-art {
    width: 100%;
  }

  .music-section {
    padding: 1.25rem;
  }

  .music-volume {
    display: flex;
  }
}

@container music (min-width: 44rem) {
  .music-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 宽屏双栏：左侧是版本、谱面等资料，右侧歌词栏吸附在窗口内，不随资料滚走 */
@container music (min-width: 58rem) {
  .music-body:not(.music-body--single) {
    display: grid;
    align-items: start;
    gap: 1.5rem;
    grid-template-columns: minmax(0, 1fr) minmax(20rem, 25rem);
  }

  .music-body:not(.music-body--single) .music-main {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 1.25rem;
  }

  .music-body:not(.music-body--single) .music-facts {
    grid-template-columns: minmax(0, 1fr);
  }

  .music-body:not(.music-body--single) .music-lyrics {
    position: sticky;
    top: 1rem;
    /* 底部留出全站播放条的位置 */
    height: calc(100dvh - 7.5rem);
    min-height: 22rem;
  }
}

/* 自定义 range 滑块样式优化 */
.range::-webkit-slider-thumb {
  transition: transform 0.15s ease;
}

.range:hover::-webkit-slider-thumb {
  transform: scale(1.2);
}

.chart-svg-preview-canvas {
  scrollbar-color: #94a3b8 #f8fafc;
  color-scheme: light;
}

.chart-svg-preview-canvas::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.chart-svg-preview-canvas::-webkit-scrollbar-track {
  background: #f8fafc;
}

.chart-svg-preview-canvas::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border: 2px solid #f8fafc;
  border-radius: 999px;
}

.chart-svg-preview-canvas::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: color-mix(in oklab, var(--color-base-content) 20%, transparent);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: color-mix(in oklab, var(--color-base-content) 30%, transparent);
}
</style>
