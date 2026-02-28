<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, watch, toRef, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { useAccountStore } from '@/stores/account'
import { Search, ArrowUpDown, Languages, Trophy, List, LayoutGrid, RefreshCw, Layers, Github, Camera, Loader2 } from 'lucide-vue-next'
import { toPng } from 'html-to-image'
import MusicCard from '@/components/MusicCard.vue'
import Pagination from '@/components/Pagination.vue'
import AssetImage from '@/components/AssetImage.vue'
import { toRomaji } from '@/utils/kanaToRomaji'
import AccountSelector from '@/components/AccountSelector.vue'

interface Music {
  id: number
  title: string
  publishedAt: number
  assetbundleName: string
  composer: string
  pronunciation: string
  categories: string[]
}

interface MusicDifficulty {
  id: number
  musicId: number
  musicDifficulty: string
  playLevel: number
  totalNoteCount: number
}

interface LimitedTimeMusic {
  id: number
  musicId: number
  startAt: number
  endAt: number
}

interface UserMusicResult {
  musicId: number
  musicDifficultyType: string
  playResult: string
  highScore: number
  playType: string
}

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()

const musics = ref<Music[]>([])
const musicDifficulties = ref<MusicDifficulty[]>([])
const limitedMusics = ref<LimitedTimeMusic[]>([])
const pjskb30Map = ref<Map<string, number>>(new Map())
const usePjskb30 = ref(true)
const translations = toRef(masterStore, 'translations')
const isLoading = ref(true)

const assetsHost = computed(() => settingsStore.assetsHost)

// 稳定的空引用，避免在模版中使用 || {} / || [] 每次渲染都创建新对象导致子组件重渲染
const EMPTY_OBJ: Record<string, any> = Object.freeze({})
const EMPTY_ARR: string[] = Object.freeze([]) as unknown as string[]

// 状态
const searchText = ref('')
const sortKey = ref<'publishedAt' | 'id' | 'level'>('publishedAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const selectedDiffType = ref<string>('master')

// 视图模式
const viewMode = ref<'grid' | 'list' | 'b30' | 'level'>('grid')

// 成绩数据（从缓存加载，不自动刷新）
// Suite 成绩数据量很大，使用 shallowRef 避免深层响应式代理导致卡顿
const musicResultsMap = shallowRef<Record<number, Record<string, string>>>({})
const showUserResults = ref(false)
const isDataLoaded = ref(false)
const hasSuiteData = computed(() => showUserResults.value && isDataLoaded.value)

// 成绩筛选
const resultFilter = ref<'all' | 'no_fc' | 'no_ap'>('all')
const filterDifficulty = ref<string>('master')

// 定数表展开状态
const expandedLevels = ref<Set<number>>(new Set())
function toggleLevel(level: number) {
  const s = new Set(expandedLevels.value)
  if (s.has(level)) s.delete(level)
  else s.add(level)
  expandedLevels.value = s
}

// 错误信息
const refreshError = ref('')

// 截图功能
const isGeneratingImage = ref(false)
const b30CaptureRef = ref<HTMLElement | null>(null)

async function captureB30() {
  if (!b30CaptureRef.value || isGeneratingImage.value) return
  isGeneratingImage.value = true
  try {
    // 确保此时离屏元素已经完成渲染更新
    await nextTick()
    
    // 获取容器的真实解析后背景色（应对 oklch CSS 变量）
    let bgColor = window.getComputedStyle(b30CaptureRef.value).backgroundColor
    if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
      const theme = document.documentElement.getAttribute('data-theme')
      bgColor = theme === 'dark' ? '#1d232a' : '#ffffff'
    }

    const dataUrl = await toPng(b30CaptureRef.value, {
      backgroundColor: bgColor,
      pixelRatio: 2, // 保证清晰度
      // 避免 Safari 中极个别图片因跨域/报错导致整个绘图抛错
      imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
    })
    
    // 生成带时间的文件名
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    let playerName = 'player'
    if (accountStore.currentUserId) {
      const acc = accountStore.accounts.find(a => a.userId === accountStore.currentUserId)
      if (acc && acc.name) playerName = acc.name
    }
    
    const link = document.createElement('a')
    link.download = `sekai_b30_${playerName}_${dateStr}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('生成 B30 截图失败:', err)
    alert('截图生成失败，请稍后重试。')
  } finally {
    isGeneratingImage.value = false
  }
}

const siteUrl = computed(() => window.location.origin)

// 从缓存加载成绩（不调用 API）
function loadFromCache() {
  const uid = accountStore.currentUserId
  if (!uid) {
    musicResultsMap.value = {}
    isDataLoaded.value = false
    return
  }
  const cached = accountStore.getSuiteCache(uid)
  if (cached) {
    parseSuiteData(cached)
    isDataLoaded.value = true
  } else {
    musicResultsMap.value = {}
    isDataLoaded.value = false
  }
}

// 手动刷新 suite
async function handleSuiteRefresh() {
  const uid = accountStore.currentUserId
  if (!uid) return
  refreshError.value = ''
  try {
    const data = await accountStore.refreshSuite(uid)
    parseSuiteData(data)
    isDataLoaded.value = true
  } catch (e: any) {
    refreshError.value = e.message
  }
}

function parseSuiteData(data: any) {
  const results: Record<number, Record<string, string>> = {}
  const userMusicResults: UserMusicResult[] = data.userMusicResults || []

  for (const r of userMusicResults) {
    if (!results[r.musicId]) results[r.musicId] = {}
    const entry = results[r.musicId]!
    const diff = r.musicDifficultyType
    const current = entry[diff] || ''
    const rank: string = { full_perfect: 'AP', full_combo: 'FC', clear: 'C' }[r.playResult] || ''
    if (!rank) continue
    const priority: Record<string, number> = { 'AP': 3, 'FC': 2, 'C': 1, '': 0 }
    if ((priority[rank] || 0) > (priority[current] || 0)) {
      entry[diff] = rank
    }
  }
  // 使用不可变替换触发更新，减少深层追踪成本
  musicResultsMap.value = results
}

// B30 计算
interface B30Entry {
  musicId: number
  difficulty: string
  rank: string
  playLevel: number
  score: number
}

const b30List = computed<B30Entry[]>(() => {
  if (!hasSuiteData.value) return []
  const entries: B30Entry[] = []
  const diffMap = musicDifficultiesMap.value
  const resultsMap = musicResultsMap.value
  const b30Map = pjskb30Map.value

  for (const [musicIdStr, diffResults] of Object.entries(resultsMap)) {
    const musicId = Number(musicIdStr)
    if (isExpired(musicId)) continue
    for (const [diff, rank] of Object.entries(diffResults)) {
      if (rank !== 'AP' && rank !== 'FC') continue
      const intLevel = diffMap[musicId]?.[diff]
      if (intLevel === undefined) continue
      // 是否使用 pjskb30 精准小数定数
      const constant = usePjskb30.value ? (b30Map.get(`${musicId}-${diff}`) ?? intLevel) : intLevel
      const score = rank === 'AP' ? constant + 1.5 : constant
      entries.push({ musicId, difficulty: diff, rank, playLevel: constant, score })
    }
  }

  entries.sort((a, b) => b.score - a.score)
  return entries.slice(0, 30)
})

const b30Rating = computed(() => {
  const total = b30List.value.reduce((sum, e) => sum + e.score, 0)
  return b30List.value.length > 0 ? total / 30 : 0
})

// 定数表整体进度
const levelStats = computed(() => {
  if (!hasSuiteData.value) return null
  const diffMap = musicDifficultiesMap.value
  const diff = selectedDiffType.value
  const resultsMap = musicResultsMap.value
  let ap = 0, fc = 0, clear = 0, total = 0
  
  for (const music of filteredMusics.value) {
    if (music.publishedAt > now || isExpired(music.id)) continue
    if (diffMap[music.id]?.[diff] !== undefined) {
      total++
      const rank = resultsMap[music.id]?.[diff]
      if (rank === 'AP') { ap++; fc++; clear++ }
      else if (rank === 'FC') { fc++; clear++ }
      else if (rank === 'C') { clear++ }
    }
  }
  return { ap, fc, clear, total }
})

// 定数表分组数据
const levelGroupedMusics = computed(() => {
  const diffMap = musicDifficultiesMap.value
  const diff = selectedDiffType.value
  const resultsMap = musicResultsMap.value
  const groups: Record<number, { musics: typeof musics.value, stats: { ap: number, fc: number, clear: number, total: number } }> = {}
  
  for (const music of filteredMusics.value) {
    if (music.publishedAt > now || isExpired(music.id)) continue
    const level = diffMap[music.id]?.[diff]
    if (level === undefined) continue
    
    if (!groups[level]) {
      groups[level] = { musics: [], stats: { ap: 0, fc: 0, clear: 0, total: 0 } }
    }
    groups[level].musics.push(music)
    
    groups[level].stats.total++
    const rank = resultsMap[music.id]?.[diff]
    if (rank === 'AP') {
      groups[level].stats.ap++
      groups[level].stats.fc++
      groups[level].stats.clear++
    } else if (rank === 'FC') {
      groups[level].stats.fc++
      groups[level].stats.clear++
    } else if (rank === 'C') {
      groups[level].stats.clear++
    }
  }
  
  const sortedLevels = Object.keys(groups).map(Number).sort((a, b) => b - a)
  
  return sortedLevels.map(level => {
    return {
      level,
      musics: groups[level]?.musics,
      stats: groups[level]?.stats
    }
  })
})

// 分页 (Grid视图)
const pageSize = 30
const currentPage = computed(() => Number(route.query.page) || 1)

// 无限滚动 (List视图)
const displayedCount = ref(30)
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
const enableHeavyAnimation = computed(() => !hasSuiteData.value)

const displayedMusics = computed(() => {
  return filteredMusics.value.slice(0, displayedCount.value)
})

function setupObserver() {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && displayedCount.value < filteredMusics.value.length) {
      displayedCount.value += 30
    }
  }, { rootMargin: '200px' })
  
  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
}

// 难度映射
const musicDifficultiesMap = computed(() => {
  const map: Record<number, Record<string, number>> = {}
  musicDifficulties.value.forEach(d => {
    if (!map[d.musicId]) map[d.musicId] = {}
    map[d.musicId]![d.musicDifficulty] = d.playLevel
  })
  return map
})

const now = Date.now()

// 过滤和排序
const filteredMusics = computed(() => {
  let result = [...musics.value]
  const resultsMap = musicResultsMap.value

  if (!settingsStore.showSpoilers) {
    result = result.filter(m => m.publishedAt <= now && !isExpired(m.id))
  }

  if (searchText.value) {
    const query = searchText.value.toLowerCase()
    result = result.filter(m => {
      const titleMatch = m.title.toLowerCase().includes(query)
      const transMatch = translations.value[m.id]?.toLowerCase().includes(query)
      const pronunciationMatch = m.pronunciation?.includes(query)
      const romajiMatch = toRomaji(m.pronunciation)?.toLowerCase().includes(query)
      return titleMatch || transMatch || pronunciationMatch || romajiMatch
    })
  }

  if (hasSuiteData.value && resultFilter.value !== 'all') {
    const diff = filterDifficulty.value
    result = result.filter(m => {
      const rank = resultsMap[m.id]?.[diff] || ''
      if (resultFilter.value === 'no_fc') return rank !== 'AP' && rank !== 'FC'
      if (resultFilter.value === 'no_ap') return rank !== 'AP'
      return true
    })
  }

  result.sort((a, b) => {
    let cmp = 0
    if (sortKey.value === 'publishedAt') {
      cmp = a.publishedAt - b.publishedAt
      if (cmp === 0) cmp = a.id - b.id
    } else if (sortKey.value === 'id') {
      cmp = a.id - b.id
    } else if (sortKey.value === 'level') {
      const levelA = musicDifficultiesMap.value[a.id]?.[selectedDiffType.value] || 0
      const levelB = musicDifficultiesMap.value[b.id]?.[selectedDiffType.value] || 0
      cmp = levelA - levelB
      if (cmp === 0) cmp = a.publishedAt - b.publishedAt
    }
    return sortOrder.value === 'asc' ? cmp : -cmp
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredMusics.value.length / pageSize))

const paginatedMusics = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredMusics.value.slice(start, start + pageSize)
})

async function loadPjskb30() {
  try {
    const resp = await fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/pjskb30')
    if (!resp.ok) return
    const text = await resp.text()
    const map = new Map<string, number>()
    for (const line of text.split('\n')) {
      if (!line) continue
      const [id, diff, val] = line.split('\t')
      if (id && diff && val) map.set(`${id}-${diff}`, parseFloat(val))
    }
    pjskb30Map.value = map
  } catch (e) {
    console.error('加载 pjskb30 定数失败:', e)
  }
}

async function loadData() {
  isLoading.value = true
  try {
    const [musicData, diffData, limitedData] = await Promise.all([
      masterStore.getMaster<Music>('musics'),
      masterStore.getMaster<MusicDifficulty>('musicDifficulties'),
      masterStore.getMaster<LimitedTimeMusic>('limitedTimeMusics')
    ])
    musics.value = musicData
    musicDifficulties.value = diffData
    limitedMusics.value = limitedData
    
    // 背景加载翻译，不阻塞主列表渲染
    masterStore.getTranslations().catch(e => console.error('加载翻译失败:', e))
  } catch (error) {
    console.error('加载歌曲数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

function handlePageChange(page: number) {
  router.push({ query: { ...route.query, page: page.toString() } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function toggleSort(key: 'publishedAt' | 'id' | 'level') {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'desc'
  }
}

function isLeak(publishedAt: number): boolean {
  return publishedAt > now
}

function getTranslation(id: number): string {
  return translations.value[id] || ''
}

function getMusicTitle(musicId: number): string {
  return musics.value.find(m => m.id === musicId)?.title || `#${musicId}`
}

function getMusicThumbnailUrl(musicId: number): string {
  const paddedId = musicId.toString().padStart(3, '0')
  const host = viewMode.value === 'level' ? 'https://assets.unipjsk.com' : assetsHost.value
  return `${host}/startapp/thumbnail/music_jacket/jacket_s_${paddedId}.png`
}

function isLimitedTime(musicId: number): boolean {
  const limited = limitedMusics.value.find(lm => lm.musicId === musicId)
  if (!limited) return false
  return now >= limited.startAt && now < limited.endAt
}

function isExpired(musicId: number): boolean {
  const limited = limitedMusics.value.find(lm => lm.musicId === musicId)
  if (!limited) return false
  return now >= limited.endAt
}

const diffColors: Record<string, string> = {
  easy: '#6EE1D6', normal: '#34DDFF', hard: '#FBCC26',
  expert: '#EA5B75', master: '#C656EA', append: '#EE78DC',
}

const diffLabels: Record<string, string> = {
  easy: 'EAS', normal: 'NOR', hard: 'HRD',
  expert: 'EXP', master: 'MAS', append: 'APD',
}

const allDifficulties = ['easy', 'normal', 'hard', 'expert', 'master', 'append']

onMounted(() => {
  loadData()
  // 从缓存加载成绩，不调用 API
  loadFromCache()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})

// 监听过滤/排序变化 -> 重置显示数量
watch([searchText, sortKey, sortOrder, resultFilter, filterDifficulty], () => {
  displayedCount.value = 30
  window.scrollTo({ top: 0, behavior: 'auto' })
})

// 监听视图切换 -> 重新设置 observer
watch(viewMode, async (newMode) => {
  if (newMode === 'list') {
    await nextTick()
    setupObserver()
  } else {
    if (observer) observer.disconnect()
  }
  
  if (newMode === 'b30' && pjskb30Map.value.size === 0) {
    loadPjskb30()
  }
})

// 监听侧边栏 suite 刷新完成 → 重新从缓存加载
watch(() => accountStore.suiteRefreshing, (isRefreshing, wasRefreshing) => {
  if (wasRefreshing && !isRefreshing) {
    loadFromCache()
  }
})

// 监听账号切换 → 从缓存加载
watch(() => accountStore.currentUserId, () => {
  loadFromCache()
})

watch(() => route.query.page, () => {})
</script>

<template>
  <div>
    <!-- 第一行：搜索框 + 排序 -->
    <div class="flex flex-col sm:flex-row gap-3 mb-3 items-center">
      <div class="relative w-full sm:w-72">
        <input 
          v-model="searchText"
          type="text"
          placeholder="搜索歌曲..."
          class="input input-bordered w-full pl-10 input-sm"
        />
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
      </div>

      <div class="flex items-center gap-2 flex-nowrap overflow-x-auto no-scrollbar">
        <div class="join shrink-0">
          <button 
            class="join-item btn btn-sm"
            :class="{ 'btn-primary': sortKey === 'publishedAt' }"
            @click="toggleSort('publishedAt')"
          >
            时间
            <ArrowUpDown v-if="sortKey === 'publishedAt'" class="w-3 h-3 ml-1" :class="{ 'rotate-180': sortOrder === 'asc' }" />
          </button>
          <button 
            class="join-item btn btn-sm"
            :class="{ 'btn-primary': sortKey === 'id' }"
            @click="toggleSort('id')"
          >
            ID
            <ArrowUpDown v-if="sortKey === 'id'" class="w-3 h-3 ml-1" :class="{ 'rotate-180': sortOrder === 'asc' }" />
          </button>
          <button 
            class="join-item btn btn-sm"
            :class="{ 'btn-primary': sortKey === 'level' }"
            @click="toggleSort('level')"
          >
            定数
            <ArrowUpDown v-if="sortKey === 'level'" class="w-3 h-3 ml-1" :class="{ 'rotate-180': sortOrder === 'asc' }" />
          </button>
        </div>

        <select 
          v-if="sortKey === 'level' || viewMode === 'level'"
          v-model="selectedDiffType"
          class="select select-bordered select-sm shrink-0 w-auto max-w-[100px]"
        >
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
          <option value="expert">Expert</option>
          <option value="master">Master</option>
          <option value="append">Append</option>
        </select>

        <a 
          href="https://paratranz.cn/projects/18073" 
          target="_blank" 
          rel="noopener noreferrer"
          class="btn btn-ghost btn-sm gap-1 text-primary/70 hover:text-primary ml-auto"
        >
          <Languages class="w-4 h-4" />
          贡献翻译
        </a>
      </div>
    </div>

    <!-- 第二行：成绩筛选 + 视图切换 + suite 刷新 -->
    <div class="flex flex-wrap items-center gap-2 mb-4 bg-base-100 p-2 rounded-lg shadow-sm">
      <label class="label cursor-pointer gap-2 p-0 mr-2">
        <input v-model="showUserResults" type="checkbox" class="toggle toggle-primary toggle-sm" />
        <span class="label-text font-medium mt-0.5">显示成绩数据</span>
      </label>

      <template v-if="showUserResults">
        <div class="divider divider-horizontal mx-0"></div>
        
        <!-- 账号信息 -->
        <div v-if="accountStore.accounts.length > 0" class="min-w-[150px] max-w-[220px]">
          <AccountSelector
            :model-value="accountStore.currentUserId"
            @update:model-value="accountStore.selectAccount"
          />
        </div>
        <span v-else class="text-sm text-base-content/60">无绑定账号</span>

        <!-- Suite 刷新 -->
        <button
          v-if="accountStore.currentUserId"
          class="btn btn-sm btn-ghost gap-1"
          :disabled="accountStore.suiteRefreshing"
          @click="handleSuiteRefresh"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': accountStore.suiteRefreshing }" />
          刷新
        </button>
        <span v-if="accountStore.uploadTimeText && accountStore.currentUserId" class="text-xs text-base-content/50 hidden sm:inline">
          {{ accountStore.uploadTimeText }}
        </span>

        <!-- 错误提示 -->
        <span v-if="refreshError" class="text-xs text-error">{{ refreshError }}</span>
      </template>

      <div class="flex-1"></div>

      <!-- 成绩筛选 (有数据时显示) -->
      <template v-if="hasSuiteData">
        <select v-model="resultFilter" class="select select-bordered select-sm">
          <option value="all">全部</option>
          <option value="no_fc">未FC</option>
          <option value="no_ap">未AP</option>
        </select>
        <select
          v-if="resultFilter !== 'all'"
          v-model="filterDifficulty"
          class="select select-bordered select-sm"
        >
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
          <option value="expert">Expert</option>
          <option value="master">Master</option>
          <option value="append">Append</option>
        </select>
        <div class="divider divider-horizontal mx-1"></div>
      </template>

      <!-- 视图切换 (总是显示) -->
      <div class="join">
        <button class="join-item btn btn-sm" :class="viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'" @click="viewMode = 'grid'">
          <LayoutGrid class="w-4 h-4" />
        </button>
        <button class="join-item btn btn-sm" :class="viewMode === 'list' ? 'btn-primary' : 'btn-ghost'" @click="viewMode = 'list'">
          <List class="w-4 h-4" />
        </button>
        <button class="join-item btn btn-sm" :class="viewMode === 'b30' ? 'btn-primary' : 'btn-ghost'" title="Best 30" @click="viewMode = 'b30'">
          <Trophy class="w-4 h-4" />
        </button>
        <button class="join-item btn btn-sm" :class="viewMode === 'level' ? 'btn-primary' : 'btn-ghost'" title="定数表" @click="viewMode = 'level'">
          <Layers class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else>
      <!-- B30 视图 -->
      <div v-if="viewMode === 'b30'" class="mb-6">
        <div v-if="!showUserResults" class="text-center py-20 text-base-content/60">
          <p class="mb-2">请先打开“显示成绩数据”开关</p>
        </div>
        <div v-else-if="!hasSuiteData" class="text-center py-20 text-base-content/60">
          <p class="mb-2">暂无成绩数据</p>
          <button class="btn btn-primary btn-sm" @click="handleSuiteRefresh">
            刷新 Suite 数据
          </button>
        </div>
        <template v-else>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-bold flex items-center gap-2">
                <Trophy class="w-5 h-5 text-warning" /> Best 30
              </h2>
              <div class="badge badge-lg badge-primary">Rating {{ b30Rating.toFixed(2) }}</div>
            </div>
            
            <div class="flex flex-wrap items-center gap-3 text-sm">
              <button 
                class="btn btn-sm btn-outline gap-1" 
                :disabled="isGeneratingImage || b30List.length === 0"
                @click="captureB30"
              >
                <Loader2 v-if="isGeneratingImage" class="w-4 h-4 animate-spin" />
                <Camera v-else class="w-4 h-4" />
                保存成图
              </button>
              
              <label class="cursor-pointer label p-0 gap-2">
                <span class="label-text">民间定数</span>
                <input type="checkbox" v-model="usePjskb30" class="toggle toggle-primary toggle-sm" />
              </label>
              <div class="text-xs text-base-content/40 border-l border-base-300 pl-3 leading-tight flex flex-col gap-1 justify-center">
                <div class="flex items-center gap-1">定数来源 <a href="https://github.com/auburnsummer/pjskb30" target="_blank" rel="noopener noreferrer" class="link link-hover flex items-center gap-1"><Github class="w-3 h-3" />pjskb30</a></div>
                <div>民间定数，仅供参考，如有意见可以受着，或者写一整套更好的给项目提pr</div>
              </div>
            </div>
          </div>

          <div v-if="b30List.length === 0" class="text-center py-10 text-base-content/50">
            无 FC/AP 成绩
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <div 
              v-for="(entry, idx) in b30List" 
              :key="`b30-${entry.musicId}-${entry.difficulty}`"
              class="flex items-center gap-3 p-2 rounded-lg bg-base-100 shadow-sm"
            >
              <span class="text-xs font-bold text-base-content/40 w-6 text-right">#{{ idx + 1 }}</span>
              <AssetImage 
                :src="getMusicThumbnailUrl(entry.musicId)" 
                :alt="getMusicTitle(entry.musicId)"
                class="w-10 h-10 rounded object-cover flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ getMusicTitle(entry.musicId) }}</div>
                <div class="flex items-center gap-2 text-xs">
                  <span 
                    class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                    :style="{ backgroundColor: diffColors[entry.difficulty], color: ['easy','normal','hard'].includes(entry.difficulty) ? 'black' : 'white' }"
                  >
                    {{ diffLabels[entry.difficulty] }} {{ entry.playLevel.toFixed(1) }}
                  </span>
                  <span
                    v-if="entry.rank === 'AP'"
                    class="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wide text-white"
                    style="background: linear-gradient(135deg, #a855f7, #7c3aed); text-shadow: 0 1px 2px rgba(0,0,0,.25)"
                  >AP</span>
                  <span
                    v-else-if="entry.rank === 'FC'"
                    class="px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wide text-white"
                    style="background: linear-gradient(135deg, #E04A4A, #9a3412); text-shadow: 0 1px 2px rgba(0,0,0,.25)"
                  >FC</span>
                </div>
              </div>
              <div class="text-sm font-mono font-bold text-primary">{{ entry.score.toFixed(1) }}</div>
            </div>
          </div>
        </template>
      </div>

      <!-- 定数表视图 -->
      <div v-else-if="viewMode === 'level'" :class="{ 'animate-fade-in-up': enableHeavyAnimation }">
        <!-- 总体进度条 -->
        <div v-if="showUserResults && hasSuiteData && levelStats" class="flex flex-wrap gap-4 items-center bg-base-100 p-3 mb-4 rounded-lg shadow-sm border border-base-200/50">
          <div class="font-bold border-r border-base-200 pr-4 drop-shadow-sm flex items-center gap-1 text-base sm:text-lg" :style="{ color: diffColors[selectedDiffType] }">
            {{ diffLabels[selectedDiffType] }} 的完成度
          </div>
          <div class="flex items-center gap-1">
            <img src="/img/icon_clear.png" class="h-4 sm:h-5 drop-shadow-sm" title="Clear" /> 
            <span>{{ levelStats.clear }} / {{ levelStats.total }}</span>
          </div>
          <div class="flex gap-4 text-sm font-bold opacity-90">
            <div class="flex items-center gap-1">
              <img src="/img/icon_allPerfect.png" class="h-4 sm:h-5 drop-shadow-sm" title="AP" /> 
              <span>{{ levelStats.ap }} / {{ levelStats.total }}</span>
            </div>
            <div class="flex items-center gap-1">
              <img src="/img/icon_fullCombo.png" class="h-4 sm:h-5 drop-shadow-sm" title="FC" /> 
              <span>{{ levelStats.fc }} / {{ levelStats.total }}</span>
            </div>
          </div>
        </div>

        <div v-if="levelGroupedMusics.length === 0" class="text-center py-20 text-base-content/50">
          没有找到数据
        </div>

        <!-- 折叠全部 -->
        <div class="flex gap-2 mb-3">
          <button class="btn btn-xs btn-ghost" @click="expandedLevels = new Set()">全部折叠</button>
        </div>

        <div v-for="group in levelGroupedMusics" :key="group.level" class="mb-3">
          <!-- 组标题（可点击展开/折叠） -->
          <div 
            class="flex items-center gap-3 px-1 py-1.5 cursor-pointer select-none rounded-lg hover:bg-base-200/50 transition-colors"
            @click="toggleLevel(group.level)"
          >
            <div
              class="px-3 py-0.5 rounded-full text-white font-black text-xl shadow-sm tracking-tighter"
              :style="{ backgroundColor: diffColors[selectedDiffType] }"
            >
              {{ group.level.toFixed(0) }}
            </div>
            <span class="text-xs text-base-content/50">{{ group.musics?.length || 0 }}首</span>
            <div v-if="showUserResults && hasSuiteData" class="flex gap-3 text-xs font-bold px-3 py-1 rounded-full shadow-sm bg-base-100 border border-base-200/50">
              <span class="flex items-center gap-1 text-base-content/80">
                ALL <span class="text-base-content">{{ group.stats?.total || 0 }}</span>
              </span>
              <span class="flex items-center gap-1 text-[#88DDFF]" title="Clear">
                <img src="/img/icon_clear.png" class="h-3.5" /> {{ group.stats?.clear || 0 }}
              </span>
              <span class="flex items-center gap-1 text-[#FF8EE6]" title="AP">
                <img src="/img/icon_allPerfect.png" class="h-3.5" /> {{ group.stats?.ap || 0 }}
              </span>
              <span class="flex items-center gap-1 text-[#FF66AA]" title="FC">
                <img src="/img/icon_fullCombo.png" class="h-3.5" /> {{ group.stats?.fc || 0 }}
              </span>
            </div>
            <span class="ml-auto text-xs text-base-content/30">{{ expandedLevels.has(group.level) ? '▲' : '▼' }}</span>
          </div>
          <!-- 封面墙（仅展开时渲染） -->
          <div v-if="expandedLevels.has(group.level)" class="flex flex-wrap gap-1.5 sm:gap-2 bg-base-100 p-2 sm:p-3 rounded-xl shadow-sm border border-base-200/50 mt-1.5">
            <RouterLink v-for="music in group.musics" :key="music.id" :to="`/musics/${music.id}`" class="relative group block shrink-0">
              <AssetImage 
                :src="getMusicThumbnailUrl(music.id)" 
                :alt="music.title"
                class="w-14 h-14 sm:w-[3.25rem] sm:h-[3.25rem] lg:w-[3.75rem] lg:h-[3.75rem] rounded shadow-sm group-hover:scale-105 transition-transform object-cover"
              />
              <template v-if="showUserResults">
                <img
                  v-if="musicResultsMap[music.id]?.[selectedDiffType] === 'AP'"
                  src="/img/icon_allPerfect.png"
                  class="absolute -bottom-1 -right-1 w-5 sm:w-5 h-auto drop-shadow-md"
                />
                <img
                  v-else-if="musicResultsMap[music.id]?.[selectedDiffType] === 'FC'"
                  src="/img/icon_fullCombo.png"
                  class="absolute -bottom-1 -right-1 w-5 sm:w-5 h-auto drop-shadow-md"
                />
                <img
                  v-else-if="musicResultsMap[music.id]?.[selectedDiffType] === 'C'"
                  src="/img/icon_clear.png"
                  class="absolute -bottom-1 -right-1 w-5 sm:w-5 h-auto drop-shadow-md"
                />
                <img
                  v-else-if="hasSuiteData"
                  src="/img/icon_notClear.png"
                  class="absolute -bottom-1 -right-1 w-5 sm:w-5 h-auto opacity-80 drop-shadow-md"
                />
              </template>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else-if="viewMode === 'list'">
        <!-- Desktop Table View -->
        <div class="hidden sm:block overflow-x-auto">
          <table class="table table-sm w-full">
            <thead>
              <tr>
                <th class="w-16"></th>
                <th>曲名</th>
                <th
                  v-for="d in allDifficulties" :key="d" class="text-center w-20 lg:w-24"
                  :style="{ color: diffColors[d] }"
                >
                  {{ diffLabels[d] }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="music in displayedMusics" :key="music.id" class="hover text-sm">
                <td class="p-2">
                  <AssetImage 
                    :src="getMusicThumbnailUrl(music.id)" 
                    :alt="music.title"
                    class="w-12 h-12 rounded object-cover"
                  />
                </td>
                <td class="p-2">
                  <RouterLink :to="`/musics/${music.id}`" class="hover:text-primary">
                    <div class="font-medium truncate max-w-[200px] lg:max-w-[400px]">{{ music.title }}</div>
                    <div v-if="getTranslation(music.id)" class="text-xs text-base-content/50 truncate max-w-[200px] lg:max-w-[400px]">{{ getTranslation(music.id) }}</div>
                  </RouterLink>
                  <div class="flex items-center gap-1 mt-1">
                    <div v-if="isLeak(music.publishedAt)" class="badge badge-sm badge-error text-error-content font-bold shadow-sm whitespace-nowrap">LEAK (#)</div>
                    <div v-else class="badge badge-sm badge-ghost text-base-content/60 font-bold shadow-sm whitespace-nowrap">#{{ music.id }}</div>
                    <div v-if="isLimitedTime(music.id)" class="badge badge-sm badge-warning text-warning-content font-bold shadow-sm whitespace-nowrap">期间限定</div>
                    <div v-else-if="isExpired(music.id)" class="badge badge-sm bg-base-300 text-base-content/60 font-bold border-none whitespace-nowrap">已过期</div>
                  </div>
                </td>
                <td v-for="d in allDifficulties" :key="d" class="text-center p-2">
                  <template v-if="musicDifficultiesMap[music.id]?.[d] !== undefined">
                    <div class="text-xs text-base-content/50">{{ musicDifficultiesMap[music.id]?.[d] }}</div>
                    <template v-if="showUserResults">
                      <img
                        v-if="musicResultsMap[music.id]?.[d] === 'AP'"
                        src="/img/icon_allPerfect.png"
                        alt="AP"
                        class="h-[24px] w-auto mx-auto mt-1 drop-shadow-sm"
                      />
                      <img
                        v-else-if="musicResultsMap[music.id]?.[d] === 'FC'"
                        src="/img/icon_fullCombo.png"
                        alt="FC"
                        class="h-[24px] w-auto mx-auto mt-1 drop-shadow-sm"
                      />
                      <img
                        v-else-if="musicResultsMap[music.id]?.[d] === 'C'"
                        src="/img/icon_clear.png"
                        alt="C"
                        class="h-[24px] w-auto mx-auto mt-1 drop-shadow-sm"
                      />
                      <img
                        v-else-if="hasSuiteData"
                        src="/img/icon_notClear.png"
                        alt="NC"
                        class="h-[24px] w-auto mx-auto mt-1 opacity-50 drop-shadow-sm"
                      />
                    </template>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile List View -->
        <div class="block sm:hidden space-y-2">
          <div v-for="music in displayedMusics" :key="music.id" class="bg-base-100 p-2 rounded-lg flex gap-3 shadow-sm cv-auto-row">
            <AssetImage 
              :src="getMusicThumbnailUrl(music.id)" 
              :alt="music.title"
              class="w-16 h-16 rounded object-cover shrink-0"
            />
            <div class="flex-1 min-w-0 flex flex-col gap-1">
              <RouterLink :to="`/musics/${music.id}`" class="hover:text-primary">
                <div class="font-medium truncate text-sm leading-tight">{{ music.title }}</div>
                <div v-if="getTranslation(music.id)" class="text-xs text-base-content/50 truncate leading-tight">{{ getTranslation(music.id) }}</div>
              </RouterLink>
              
              <div class="grid grid-cols-6 gap-0.5 mt-auto">
                <div v-for="d in allDifficulties" :key="d" class="flex flex-col items-center justify-center bg-base-200/50 rounded p-0.5">
                  <template v-if="musicDifficultiesMap[music.id]?.[d] !== undefined">
                    <span class="text-[10px] leading-none font-bold mb-0.5" :style="{ color: diffColors[d] }">{{ musicDifficultiesMap[music.id]?.[d] }}</span>
                    <template v-if="showUserResults">
                      <img
                        v-if="musicResultsMap[music.id]?.[d] === 'AP'"
                        src="/img/icon_allPerfect.png"
                        alt="AP"
                        class="h-[14px] w-auto mt-0.5 drop-shadow-sm"
                      />
                      <img
                        v-else-if="musicResultsMap[music.id]?.[d] === 'FC'"
                        src="/img/icon_fullCombo.png"
                        alt="FC"
                        class="h-[14px] w-auto mt-0.5 drop-shadow-sm"
                      />
                      <img
                        v-else-if="musicResultsMap[music.id]?.[d] === 'C'"
                        src="/img/icon_clear.png"
                        alt="C"
                        class="h-[14px] w-auto mt-0.5 drop-shadow-sm"
                      />
                      <img
                        v-else-if="hasSuiteData"
                        src="/img/icon_notClear.png"
                        alt="NC"
                        class="h-[14px] w-auto mt-0.5 opacity-50 drop-shadow-sm"
                      />
                      <div v-else class="h-[14px] mt-0.5"></div>
                    </template>
                  </template>
                  <template v-else>
                    <div class="h-full w-full"></div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <!-- 加载更多触发器 -->
        <div ref="loadMoreTrigger" class="h-10 flex justify-center items-center mt-4">
          <span v-if="displayedCount < filteredMusics.length" class="loading loading-spinner loading-md text-primary/50"></span>
          <span v-else class="text-xs text-base-content/40">已加载全部</span>
        </div>
      </div>

      <!-- 网格视图 (默认) -->
      <template v-else>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <MusicCard
            v-for="music in paginatedMusics"
            :id="music.id"
            :key="music.id"
            :title="music.title"
            :translation="getTranslation(music.id)"
            :composer="music.composer"
            :assetbundle-name="music.assetbundleName"
            :difficulties="musicDifficultiesMap[music.id] || EMPTY_OBJ"
            :is-leak="isLeak(music.publishedAt)"
            :is-limited-time="isLimitedTime(music.id)"
            :is-expired="isExpired(music.id)"
            :assets-host="assetsHost"
            :categories="music.categories || EMPTY_ARR"
            :results="hasSuiteData && showUserResults ? (musicResultsMap[music.id] || EMPTY_OBJ) : undefined"
            :class="{ 'animate-fade-in-up': enableHeavyAnimation }"
            class="cv-auto-card"
          />
        </div>

        <div v-if="paginatedMusics.length === 0" class="text-center py-20">
          <p class="text-base-content/60">没有找到歌曲</p>
        </div>

        <Pagination
          v-if="totalPages > 1"
          :current-page="currentPage"
          :total-pages="totalPages"
          base-url="/musics"
          @page-change="handlePageChange"
        />
      </template>
    </template>
  </div>

  <!-- 离屏渲染容器：专用于产生 3 列的 B30 截图 -->
  <div v-if="hasSuiteData && b30List.length > 0" class="fixed left-[-9999px] top-0 pointer-events-none" aria-hidden="true">
    <div 
      ref="b30CaptureRef" 
      class="w-[1120px] bg-base-100 p-8 text-base-content flex flex-col gap-6 font-sans antialiased"
      style="contain: none;"
    >
    <!-- 顶部：玩家信息与总览 -->
    <div class="flex justify-between items-end border-b border-base-200 pb-4">
      <div class="flex flex-col gap-1 justify-end">
        <h1 class="text-3xl font-black flex items-center gap-3">
          <Trophy class="w-8 h-8 text-warning" />
          Best 30
        </h1>
        <div class="mt-4 w-64 -mx-2 origin-left scale-[1.3] pl-2 pb-1">
          <AccountSelector
            :model-value="accountStore.currentUserId"
            :show-id="false"
            :readonly="true"
          />
        </div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <div class="badge badge-primary badge-lg text-lg py-4 px-6 font-bold shadow-sm">
          Rating {{ b30Rating.toFixed(3) }}
        </div>
        <div class="text-sm font-medium text-base-content/60">
          生成时间: {{ new Date().toLocaleString() }}
        </div>
      </div>
    </div>

    <!-- 中部：3 列网格排版 -->
    <div class="grid grid-cols-3 gap-3">
      <div 
        v-for="(entry, idx) in b30List" 
        :key="`cap-${entry.musicId}-${entry.difficulty}`"
        class="flex items-center gap-3 p-3 rounded-xl bg-base-200/40 border border-base-200/80"
      >
        <div class="text-sm font-black text-base-content/30 w-6 text-right shrink-0">#{{ idx + 1 }}</div>
        <AssetImage 
          :src="getMusicThumbnailUrl(entry.musicId)" 
          :alt="getMusicTitle(entry.musicId)"
          class="w-14 h-14 rounded-lg object-cover flex-shrink-0 shadow-sm"
          :lazy="false"
        />
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <div class="text-base font-bold truncate leading-tight mb-1" :title="getMusicTitle(entry.musicId)">
            {{ getMusicTitle(entry.musicId) }}
          </div>
          <div class="flex items-center gap-2">
            <span 
              class="px-2 py-0.5 rounded text-xs font-bold leading-none"
              :style="{ backgroundColor: diffColors[entry.difficulty], color: ['easy','normal','hard'].includes(entry.difficulty) ? 'black' : 'white' }"
            >
              {{ diffLabels[entry.difficulty] }} {{ entry.playLevel.toFixed(1) }}
            </span>
            <span
              v-if="entry.rank === 'AP'"
              class="px-2 py-0.5 rounded text-xs font-extrabold tracking-wide text-white leading-none shadow-sm"
              style="background: linear-gradient(135deg, #a855f7, #7c3aed);"
            >AP</span>
            <span
              v-else-if="entry.rank === 'FC'"
              class="px-2 py-0.5 rounded text-xs font-extrabold tracking-wide text-white leading-none shadow-sm"
              style="background: linear-gradient(135deg, #E04A4A, #9a3412);"
            >FC</span>
          </div>
        </div>
        <div class="text-lg font-mono font-black text-primary pr-2 shrink-0">{{ entry.score.toFixed(2) }}</div>
      </div>
    </div>

    <!-- 底部：网站信息声明 -->
    <div class="flex justify-between items-center border-t border-base-200 pt-4 text-sm text-base-content/50 font-medium">
      <div class="flex items-center gap-2">
        <span class="font-bold text-base-content/70">Uni PJSK Viewer</span>
        <span>•</span>
        <span>{{ siteUrl }}</span>
      </div>
      <div>
        定数来源: {{ usePjskb30 ? 'auburnsummer/pjskb30 (民间定数)' : '官方定数' }}
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
.cv-auto-card {
  content-visibility: auto;
  contain-intrinsic-size: auto 320px;
}

.cv-auto-row {
  content-visibility: auto;
  contain-intrinsic-size: 96px;
}

.cv-auto-level {
  content-visibility: auto;
  contain-intrinsic-size: 360px;
}
</style>
