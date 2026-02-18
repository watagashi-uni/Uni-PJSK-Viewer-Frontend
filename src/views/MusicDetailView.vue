<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { 
  Play, Pause, BarChart2, Eye, Download, ChevronLeft, 
  Disc3, Sparkles, Mic, Volume2, VolumeX, SkipBack, SkipForward,
  PlayCircle, Zap
} from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'

interface Music {
  id: number
  title: string
  pronunciation: string
  lyricist: string
  composer: string
  arranger: string
  publishedAt: number
  fillerSec: number
  categories: string[]
  assetbundleName: string
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

interface EventData {
  id: number
  eventType: string
  name: string
  assetbundleName: string
  startAt: number
  aggregateAt: number
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

const route = useRoute()
const masterStore = useMasterStore()

const musicId = computed(() => Number(route.params.id))
const music = ref<Music | null>(null)
const difficulties = ref<MusicDifficulty[]>([])
const vocals = ref<MusicVocal[]>([])
const translation = ref<string>('')
const relatedEvent = ref<EventData | null>(null)
const characters = ref<Character[]>([])
const outsideCharacters = ref<OutsideCharacter[]>([])
const isLoading = ref(true)

const assetsHost = 'https://assets.unipjsk.com'
const chartHost = 'https://charts-new.unipjsk.com/moe/svg'
const chartPreviewHost = import.meta.env.VITE_CHART_PREVIEW_URL || ''

// ===== 自定义播放器状态 =====
const audioRef = ref<HTMLAudioElement | null>(null)
const currentVocalIndex = ref(0)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const isMuted = ref(false)
const isDragging = ref(false)
const isAudioLoaded = ref(false)

// 用于无缝切换 vocal 的状态
const pendingSeekTime = ref<number | null>(null)  // 待恢复的播放位置
const pendingAutoPlay = ref(false)  // 待恢复的播放状态

// 当前选中的声乐
const currentVocal = computed(() => vocals.value[currentVocalIndex.value] || null)

// 音频URL
const currentAudioUrl = computed(() => {
  if (!currentVocal.value) return ''
  return `${assetsHost}/ondemand/music/long/${currentVocal.value.assetbundleName}/${currentVocal.value.assetbundleName}.mp3`
})

// 进度百分比
const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// 格式化时间 mm:ss
function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 切换播放/暂停
function togglePlay() {
  if (!audioRef.value) return
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
}

// 音频事件处理
function onPlay() {
  isPlaying.value = true
}

function onPause() {
  isPlaying.value = false
}

function onTimeUpdate() {
  if (!isDragging.value && audioRef.value) {
    currentTime.value = audioRef.value.currentTime
  }
}

function onLoadedMetadata() {
  if (audioRef.value) {
    duration.value = audioRef.value.duration
    isAudioLoaded.value = true
    
    // 如果有待恢复的播放位置（vocal 切换场景）
    if (pendingSeekTime.value !== null) {
      const seekTo = Math.min(pendingSeekTime.value, audioRef.value.duration)
      audioRef.value.currentTime = seekTo
      currentTime.value = seekTo
      
      // 如果之前是播放状态，继续播放
      if (pendingAutoPlay.value) {
        audioRef.value.play()
      }
      
      // 清除待恢复状态
      pendingSeekTime.value = null
      pendingAutoPlay.value = false
    } else if (music.value && music.value.fillerSec > 0) {
      // 首次加载时跳过 fillerSec
      audioRef.value.currentTime = music.value.fillerSec
      currentTime.value = music.value.fillerSec
    }
  }
}

function onEnded() {
  isPlaying.value = false
}

// 进度条拖拽
function onProgressMouseDown(e: MouseEvent) {
  isDragging.value = true
  updateProgressFromEvent(e)
  document.addEventListener('mousemove', onProgressMouseMove)
  document.addEventListener('mouseup', onProgressMouseUp)
}

function onProgressMouseMove(e: MouseEvent) {
  if (isDragging.value) {
    updateProgressFromEvent(e)
  }
}

function onProgressMouseUp() {
  if (isDragging.value && audioRef.value) {
    audioRef.value.currentTime = currentTime.value
  }
  isDragging.value = false
  document.removeEventListener('mousemove', onProgressMouseMove)
  document.removeEventListener('mouseup', onProgressMouseUp)
}

function updateProgressFromEvent(e: MouseEvent) {
  const progressBar = (e.target as HTMLElement).closest('.progress-bar-container') as HTMLElement
  if (!progressBar) return
  const rect = progressBar.getBoundingClientRect()
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
  const percent = x / rect.width
  currentTime.value = percent * duration.value
}

// 点击进度条跳转
function seekToPosition(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const percent = x / rect.width
  if (audioRef.value) {
    audioRef.value.currentTime = percent * duration.value
    currentTime.value = percent * duration.value
  }
}

// 音量控制
function onVolumeChange(e: Event) {
  const target = e.target as HTMLInputElement
  volume.value = parseFloat(target.value)
  if (audioRef.value) {
    audioRef.value.volume = volume.value
  }
  if (volume.value > 0) {
    isMuted.value = false
  }
}

function toggleMute() {
  isMuted.value = !isMuted.value
  if (audioRef.value) {
    audioRef.value.muted = isMuted.value
  }
}

// 切换声乐版本（无缝切换）
function selectVocal(index: number) {
  if (index === currentVocalIndex.value) return
  
  // 保存当前播放状态和进度
  const wasPlaying = isPlaying.value
  const savedTime = currentTime.value
  
  if (audioRef.value) {
    audioRef.value.pause()
  }
  
  // 设置待恢复的状态
  pendingSeekTime.value = savedTime
  pendingAutoPlay.value = wasPlaying
  
  // 切换 vocal
  currentVocalIndex.value = index
  isAudioLoaded.value = false
}

// 快退/快进 10秒
function skipBackward() {
  if (audioRef.value) {
    audioRef.value.currentTime = Math.max(0, audioRef.value.currentTime - 10)
  }
}

function skipForward() {
  if (audioRef.value) {
    audioRef.value.currentTime = Math.min(duration.value, audioRef.value.currentTime + 10)
  }
}

// 下载当前音频
async function downloadAudio() {
  if (!currentVocal.value || !music.value) return
  const url = currentAudioUrl.value
  const fileName = `${music.value.title} - ${currentVocal.value.caption}.mp3`
  
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
}

// 清理事件监听
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onProgressMouseMove)
  document.removeEventListener('mouseup', onProgressMouseUp)
})

// 获取歌手名称列表
function getVocalSingers(vocal: MusicVocal): string {
  return vocal.characters.map(c => {
    if (c.characterType === 'game_character') {
      const char = characters.value.find(ch => ch.id === c.characterId)
      if (char) {
        return (char.firstName || '') + char.givenName
      }
    } else if (c.characterType === 'outside_character') {
      const outsideChar = outsideCharacters.value.find(ch => ch.id === c.characterId)
      if (outsideChar) {
        return outsideChar.name
      }
    }
    return ''
  }).filter(Boolean).join('・')
}

// 难度颜色映射
const difficultyColors: Record<string, string> = {
  easy: 'bg-[#6EE1D6] border-[#6EE1D6]',
  normal: 'bg-[#34DDFF] border-[#34DDFF]',
  hard: 'bg-[#FBCC26] border-[#FBCC26]',
  expert: 'bg-[#EA5B75] border-[#EA5B75]',
  master: 'bg-[#C656EA] border-[#C656EA]',
  append: 'bg-[#EE78DC] border-[#EE78DC]',
}

const difficultyLabels: Record<string, string> = {
  easy: 'EASY',
  normal: 'NORMAL',
  hard: 'HARD',
  expert: 'EXPERT',
  master: 'MASTER',
  append: 'APPEND',
}

// 封面图片 URL (startapp)
const coverUrl = computed(() => {
  if (!music.value) return ''
  return `${assetsHost}/startapp/music/jacket/${music.value.assetbundleName}/${music.value.assetbundleName}.png`
})

// 格式化发布时间
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 获取下载链接
function getDownloadUrl(difficulty: string): string {
  const paddedId = String(musicId.value).padStart(4, '0')
  return `${assetsHost}/startapp/music/music_score/${paddedId}_01/${difficulty}`
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
}

// 打开谱面播放预览
function openChartPreview(difficulty: string) {
  if (!chartPreviewHost) {
    alert('谱面预览服务未配置')
    return
  }
  const susUrl = getDownloadUrl(difficulty)
  const bgmUrl = currentAudioUrl.value
  const offset = music.value?.fillerSec ? music.value.fillerSec * 1000 : 0
  
  const previewUrl = `${chartPreviewHost}/?sus=${encodeURIComponent(susUrl)}&bgm=${encodeURIComponent(bgmUrl)}&offset=${offset}`
  window.open(previewUrl, '_blank', 'width=600,height=800,resizable=yes')
}

// 加载数据
async function loadData() {
  isLoading.value = true
  try {
    const [
      musicsData, 
      difficultiesData, 
      vocalsData, 
      translationsData,
      eventsData,
      eventMusicsData,
      charactersData,
      outsideCharactersData
    ] = await Promise.all([
      masterStore.getMaster<Music>('musics'),
      masterStore.getMaster<MusicDifficulty>('musicDifficulties'),
      masterStore.getMaster<MusicVocal>('musicVocals'),
      masterStore.getTranslations(),
      masterStore.getMaster<EventData>('events'),
      masterStore.getMaster<EventMusic>('eventMusics'),
      masterStore.getMaster<Character>('gameCharacters'),
      masterStore.getMaster<OutsideCharacter>('outsideCharacters'),
    ])
    
    // 设置角色数据
    characters.value = charactersData
    outsideCharacters.value = outsideCharactersData

    // 获取歌曲数据
    music.value = musicsData.find(m => m.id === musicId.value) || null

    // 获取翻译
    translation.value = translationsData[musicId.value] || ''

    // 获取难度数据
    difficulties.value = difficultiesData
      .filter(d => d.musicId === musicId.value)
      .sort((a, b) => {
        const order = ['easy', 'normal', 'hard', 'expert', 'master', 'append']
        return order.indexOf(a.musicDifficulty) - order.indexOf(b.musicDifficulty)
      })

    // 获取声乐数据
    vocals.value = vocalsData.filter(v => v.musicId === musicId.value)
    
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
    .filter(([cat]) => music.value!.categories.includes(cat))
    .map(([, icon]) => icon)
})

onMounted(loadData)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4">
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- 歌曲详情 -->
    <template v-else-if="music">
      <!-- 顶部导航 -->
      <div class="mb-4">
        <RouterLink to="/musics" class="btn btn-ghost btn-sm gap-2 pl-0">
          <ChevronLeft class="w-4 h-4" /> 返回列表
        </RouterLink>
      </div>

      <div class="flex flex-col md:flex-row gap-8">
        
        <!-- 左侧：封面与基本信息 -->
        <div class="md:w-1/3 flex flex-col items-center">
          <!-- 封面 -->
          <div class="relative group w-full max-w-sm">
            <a :href="coverUrl" target="_blank" class="block rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
              <AssetImage 
                :src="coverUrl" 
                :alt="music.title"
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

          <!-- 标题区 -->
          <div class="text-center mt-6 w-full">
            <h1 class="text-2xl font-bold text-base-content select-all">{{ music.title }}</h1>
            
            <!-- 读音 (平假名) -->
            <p v-if="music.pronunciation" class="text-sm font-medium text-primary mt-1 select-all font-mono opacity-80">
              {{ music.pronunciation }}
            </p>
            
            <!-- 翻译 -->
            <p v-if="translation" class="text-base-content/70 mt-2 select-all">{{ translation }}</p>
            <a 
              v-else
              href="https://paratranz.cn/projects/18073" 
              target="_blank" 
              rel="noopener noreferrer"
              class="text-sm text-primary/60 hover:text-primary mt-2 inline-flex items-center gap-1 transition-colors"
            >
              贡献翻译 →
            </a>
          </div>
          
          <div class="mt-6 w-full space-y-3 px-4">
             <div class="flex justify-between items-center text-sm border-b border-base-200 pb-2">
               <span class="text-base-content/60">作词</span>
               <span class="font-medium truncate max-w-[70%] select-all">{{ music.lyricist }}</span>
             </div>
             <div class="flex justify-between items-center text-sm border-b border-base-200 pb-2">
               <span class="text-base-content/60">作曲</span>
               <span class="font-medium truncate max-w-[70%] select-all">{{ music.composer }}</span>
             </div>
             <div class="flex justify-between items-center text-sm border-b border-base-200 pb-2">
               <span class="text-base-content/60">编曲</span>
               <span class="font-medium truncate max-w-[70%] select-all">{{ music.arranger }}</span>
             </div>
             <div class="flex justify-between items-center text-sm border-b border-base-200 pb-2">
               <span class="text-base-content/60">发布日期</span>
               <span class="font-medium">{{ formatDate(music.publishedAt) }}</span>
             </div>
             <div class="flex justify-between items-center text-sm border-b border-base-200 pb-2">
               <span class="text-base-content/60">ID</span>
               <span class="font-medium font-mono">#{{ music.id }}</span>
             </div>
          </div>

          <!-- 关联活动 -->
          <div v-if="relatedEvent" class="w-full mt-8">
            <h3 class="text-sm font-bold text-base-content/60 mb-3 flex items-center gap-2">
              <Sparkles class="w-4 h-4" /> 收录于活动
            </h3>
            <RouterLink 
              :to="`/events/${relatedEvent.id}`"
              class="block card bg-base-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden"
            >
              <figure class="aspect-[2/1]">
                <AssetImage 
                  :src="`${assetsHost}/startapp/home/banner/${relatedEvent.assetbundleName}/${relatedEvent.assetbundleName}.png`" 
                  alt="Event Banner" 
                  class="w-full h-full object-cover"
                />
              </figure>
              <div class="card-body p-3">
                <p class="text-sm font-medium">
                  <span class="badge badge-sm badge-ghost mr-2">#{{ relatedEvent.id }}</span>
                  {{ relatedEvent.name }}
                </p>
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- 右侧：音频与谱面 -->
        <div class="md:w-2/3 space-y-8">
          
          <!-- 自定义音频播放器 -->
          <div class="custom-player-card relative overflow-hidden rounded-2xl shadow-xl border border-white/10">
            <!-- 背景渐变 -->
            <div class="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 backdrop-blur-xl"></div>
            <div class="absolute inset-0 bg-base-100/80"></div>
            
            <!-- 隐藏的 audio 元素 -->
            <audio 
              ref="audioRef"
              :src="currentAudioUrl"
              @play="onPlay"
              @pause="onPause"
              @timeupdate="onTimeUpdate"
              @loadedmetadata="onLoadedMetadata"
              @ended="onEnded"
              preload="metadata"
            ></audio>
            
            <div class="relative z-10 p-5">
              <!-- 标题行 -->
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Disc3 class="w-4 h-4 text-primary" />
                  </div>
                  试听
                </h2>
                <div class="flex items-center gap-2">
                  <span v-if="music.fillerSec > 0" class="text-xs text-base-content/50 bg-base-200/50 px-3 py-1 rounded-full">
                    自动跳过空白
                  </span>
                  <!-- 下载按钮 -->
                  <button 
                    @click="downloadAudio"
                    class="btn btn-ghost btn-sm gap-1.5 hover:bg-base-200/50"
                    :disabled="!currentVocal"
                  >
                    <Download class="w-4 h-4" />
                    <span class="hidden sm:inline">下载</span>
                  </button>
                </div>
              </div>

              <!-- 当前播放版本信息 -->
              <div class="mb-4 p-3 bg-base-200/30 rounded-xl">
                <p class="font-semibold text-base-content">{{ currentVocal?.caption || '加载中...' }}</p>
                <p v-if="currentVocal && getVocalSingers(currentVocal)" class="text-sm text-base-content/60 flex items-center gap-1 mt-1">
                  <Mic class="w-3 h-3 shrink-0" />
                  <span>{{ getVocalSingers(currentVocal) }}</span>
                </p>
              </div>

              <!-- 播放控制区 -->
              <div class="space-y-3">
                <!-- 进度条 -->
                <div 
                  class="progress-bar-container group relative h-2 bg-base-300/50 rounded-full cursor-pointer"
                  @click="seekToPosition"
                  @mousedown="onProgressMouseDown"
                >
                  <div class="absolute inset-y-0 left-0 bg-base-content/10 rounded-full" style="width: 100%"></div>
                  <div 
                    class="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full"
                    :style="{ width: `${progressPercent}%` }"
                  ></div>
                  <div 
                    class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity -ml-2"
                    :style="{ left: `${progressPercent}%` }"
                  ></div>
                </div>

                <!-- 时间 + 控制按钮 -->
                <div class="flex items-center justify-between">
                  <span class="text-xs text-base-content/60 font-mono w-12">{{ formatTime(currentTime) }}</span>
                  
                  <!-- 播放控制按钮组 -->
                  <div class="flex items-center gap-2">
                    <button 
                      @click="skipBackward"
                      class="btn btn-ghost btn-sm btn-circle hover:bg-base-200/50"
                      title="后退10秒"
                    >
                      <SkipBack class="w-4 h-4" />
                    </button>
                    
                    <button 
                      @click="togglePlay"
                      class="btn btn-primary btn-circle w-11 h-11 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                      :disabled="!isAudioLoaded"
                    >
                      <Pause v-if="isPlaying" class="w-5 h-5" />
                      <Play v-else class="w-5 h-5 ml-0.5" />
                    </button>
                    
                    <button 
                      @click="skipForward"
                      class="btn btn-ghost btn-sm btn-circle hover:bg-base-200/50"
                      title="前进10秒"
                    >
                      <SkipForward class="w-4 h-4" />
                    </button>
                  </div>
                  
                  <span class="text-xs text-base-content/60 font-mono w-12 text-right">{{ formatTime(duration) }}</span>
                </div>

                <!-- 音量控制 -->
                <div class="flex items-center gap-2 pt-2">
                  <button @click="toggleMute" class="btn btn-ghost btn-xs btn-circle">
                    <VolumeX v-if="isMuted || volume === 0" class="w-4 h-4 text-base-content/60" />
                    <Volume2 v-else class="w-4 h-4 text-base-content/60" />
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    :value="volume"
                    @input="onVolumeChange"
                    class="range range-xs range-primary w-24"
                  />
                </div>
              </div>

              <!-- 版本选择列表 -->
              <div v-if="vocals.length > 1" class="mt-5 pt-4 border-t border-base-200/50">
                <p class="text-xs text-base-content/60 mb-3 font-medium">选择版本 ({{ vocals.length }})</p>
                <div class="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  <button
                    v-for="(vocal, index) in vocals"
                    :key="vocal.id"
                    @click="selectVocal(index)"
                    class="w-full text-left p-3 rounded-xl transition-all flex items-start gap-3"
                    :class="currentVocalIndex === index 
                      ? 'bg-primary/15 ring-1 ring-primary/30' 
                      : 'bg-base-200/30 hover:bg-base-200/60'"
                  >
                    <!-- 播放指示器 -->
                    <div class="shrink-0 mt-0.5">
                      <div 
                        v-if="currentVocalIndex === index && isPlaying" 
                        class="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                      >
                        <div class="flex gap-0.5">
                          <span class="w-0.5 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                          <span class="w-0.5 h-3 bg-white rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                          <span class="w-0.5 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                        </div>
                      </div>
                      <Disc3 v-else class="w-5 h-5" :class="currentVocalIndex === index ? 'text-primary' : 'text-base-content/40'" />
                    </div>
                    
                    <!-- 版本信息 -->
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-sm" :class="currentVocalIndex === index ? 'text-primary' : 'text-base-content'">
                        {{ vocal.caption }}
                      </p>
                      <p v-if="getVocalSingers(vocal)" class="text-xs text-base-content/50 mt-0.5 truncate">
                        {{ getVocalSingers(vocal) }}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 谱面列表 -->
          <div>
            <h2 class="text-xl font-bold mb-4 flex items-center gap-2 px-2">
              <BarChart2 class="w-6 h-6 text-secondary" />
              谱面详情
            </h2>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-3">
              <div 
                v-for="diff in difficulties" 
                :key="diff.id"
                class="relative flex flex-col items-center bg-base-100 rounded-xl shadow-sm border-t-4 p-2 sm:p-4 transition-all hover:shadow-md hover:-translate-y-1"
                :class="(difficultyColors[diff.musicDifficulty] || 'bg-gray-400 border-gray-400').split(' ')[1]"
              >
                <!-- 难度标签 -->
                <div 
                  class="badge text-white font-bold mb-3 border-none px-4 py-3"
                  :class="(difficultyColors[diff.musicDifficulty] || 'bg-gray-400 border-gray-400').split(' ')[0]"
                >
                  {{ difficultyLabels[diff.musicDifficulty] }}
                </div>
                
                <!-- 等级与各种数 -->
                <div class="text-3xl font-black text-base-content mb-1 tracking-tight">{{ diff.playLevel }}</div>
                <div class="text-xs text-base-content/50 font-medium uppercase tracking-wide mb-4 whitespace-nowrap">{{ diff.totalNoteCount }} COMBO</div>

                <!-- 按钮组 -->
                <div class="w-full space-y-2 mt-auto">
                   <!-- 预览 (External SVG) -->
                   <a 
                     :href="`${chartHost}/${music.id}/${diff.musicDifficulty}.svg`" 
                     target="_blank"
                     class="btn btn-sm btn-block btn-ghost btn-outline h-9 min-h-0 font-normal hover:bg-base-200 whitespace-nowrap"
                   >
                     <Eye class="w-4 h-4 shrink-0" /> 谱面预览
                   </a>
                   
                   <!-- 谱面播放预览 -->
                   <button 
                     v-if="chartPreviewHost"
                     @click="openChartPreview(diff.musicDifficulty)"
                     class="btn btn-sm btn-block btn-ghost btn-outline h-9 min-h-0 font-normal hover:bg-base-200 whitespace-nowrap"
                   >
                     <PlayCircle class="w-4 h-4 shrink-0" /> 谱面播放
                   </button>
                   
                   <!-- 下载文件 (.sus) -->
                   <button 
                     @click="forceDownload(diff.musicDifficulty)"
                     class="btn btn-sm btn-block btn-ghost btn-outline h-9 min-h-0 font-normal hover:bg-base-200 whitespace-nowrap"
                   >
                     <Download class="w-4 h-4 shrink-0" /> 谱面下载
                   </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 自动组队入口 -->
          <div class="mt-6">
            <RouterLink 
              :to="`/deck-recommend?musicId=${music.id}`"
              class="btn btn-primary btn-block gap-2"
            >
              <Zap class="w-5 h-5" />
              使用这首歌自动组队
            </RouterLink>
          </div>

        </div>
      </div>
    </template>

    <div v-else class="text-center py-20">
      <p class="text-base-content/60 text-lg">未找到该歌曲</p>
    </div>
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

/* 进度条容器 hover 效果 */
.progress-bar-container:hover {
  height: 0.625rem; /* h-2.5 */
}

/* 自定义 range 滑块样式优化 */
.range::-webkit-slider-thumb {
  transition: transform 0.15s ease;
}

.range:hover::-webkit-slider-thumb {
  transform: scale(1.2);
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: oklch(var(--bc) / 0.2);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: oklch(var(--bc) / 0.3);
}
</style>

