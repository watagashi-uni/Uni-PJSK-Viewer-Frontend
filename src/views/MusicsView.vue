<script setup lang="ts">
import { ref, computed, onMounted, watch, toRef, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { useAccountStore } from '@/stores/account'
import { Search, ArrowUpDown, Languages, Trophy, List, LayoutGrid, RefreshCw, User } from 'lucide-vue-next'
import MusicCard from '@/components/MusicCard.vue'
import Pagination from '@/components/Pagination.vue'
import AssetImage from '@/components/AssetImage.vue'
import { toRomaji } from '@/utils/kanaToRomaji'

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
  musicId: number
  musicDifficulty: string
  playLevel: number
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
const translations = toRef(masterStore, 'translations')
const isLoading = ref(true)

const assetsHost = 'https://assets.unipjsk.com'

// 状态
const searchText = ref('')
const sortKey = ref<'publishedAt' | 'id' | 'level'>('publishedAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const selectedDiffType = ref<string>('master')

// 视图模式
const viewMode = ref<'grid' | 'list' | 'b30'>('grid')

// 成绩数据（从缓存加载，不自动刷新）
const musicResultsMap = ref<Record<number, Record<string, string>>>({})
const hasSuiteData = ref(false)

// 成绩筛选
const resultFilter = ref<'all' | 'no_fc' | 'no_ap'>('all')
const filterDifficulty = ref<string>('master')

// 错误信息
const refreshError = ref('')

// 从缓存加载成绩（不调用 API）
function loadFromCache() {
  const uid = accountStore.currentUserId
  if (!uid) {
    musicResultsMap.value = {}
    hasSuiteData.value = false
    return
  }
  const cached = accountStore.getSuiteCache(uid)
  if (cached) {
    parseSuiteData(cached)
    hasSuiteData.value = true
  } else {
    musicResultsMap.value = {}
    hasSuiteData.value = false
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
    hasSuiteData.value = true
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

  for (const [musicIdStr, diffResults] of Object.entries(musicResultsMap.value)) {
    const musicId = Number(musicIdStr)
    for (const [diff, rank] of Object.entries(diffResults)) {
      if (rank !== 'AP' && rank !== 'FC') continue
      const level = diffMap[musicId]?.[diff]
      if (level === undefined) continue
      const score = rank === 'AP' ? level + 1.5 : level
      entries.push({ musicId, difficulty: diff, rank, playLevel: level, score })
    }
  }

  entries.sort((a, b) => b.score - a.score)
  return entries.slice(0, 30)
})

const b30Total = computed(() => b30List.value.reduce((sum, e) => sum + e.score, 0))

// 分页 (Grid视图)
const pageSize = 30
const currentPage = computed(() => Number(route.query.page) || 1)

// 无限滚动 (List视图)
const displayedCount = ref(50)
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const displayedMusics = computed(() => {
  return filteredMusics.value.slice(0, displayedCount.value)
})

function setupObserver() {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && displayedCount.value < filteredMusics.value.length) {
      displayedCount.value += 50
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

  if (!settingsStore.showSpoilers) {
    result = result.filter(m => m.publishedAt <= now)
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
      const rank = musicResultsMap.value[m.id]?.[diff] || ''
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

async function loadData() {
  isLoading.value = true
  try {
    const [musicData, diffData] = await Promise.all([
      masterStore.getMaster<Music>('musics'),
      masterStore.getMaster<MusicDifficulty>('musicDifficulties'),
      masterStore.getTranslations()
    ])
    musics.value = musicData
    musicDifficulties.value = diffData
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

function getMusicCoverUrl(musicId: number): string {
  const m = musics.value.find(m => m.id === musicId)
  if (!m) return ''
  return `${assetsHost}/startapp/music/jacket/${m.assetbundleName}/${m.assetbundleName}.png`
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
  displayedCount.value = 50
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
          v-if="sortKey === 'level'"
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
    <div v-if="accountStore.currentUserId" class="flex flex-wrap items-center gap-2 mb-4 bg-base-100 p-2 rounded-lg shadow-sm">
      <!-- 账号信息 -->
      <div v-if="accountStore.currentAccount" class="flex items-center gap-2 mr-2">
        <User class="w-4 h-4 text-primary" />
        <span class="text-sm font-bold">{{ accountStore.currentAccount.name }}</span>
        <span class="text-xs text-base-content/50">({{ accountStore.currentUserId }})</span>
      </div>

      <!-- Suite 刷新 -->
      <button
        class="btn btn-sm btn-ghost gap-1"
        :disabled="accountStore.suiteRefreshing"
        @click="handleSuiteRefresh"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': accountStore.suiteRefreshing }" />
        刷新
      </button>
      <span v-if="accountStore.uploadTimeText" class="text-xs text-base-content/50 hidden sm:inline">
        {{ accountStore.uploadTimeText }}
      </span>

      <!-- 错误提示 -->
      <span v-if="refreshError" class="text-xs text-error">{{ refreshError }}</span>

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
        <button class="join-item btn btn-sm" :class="viewMode === 'b30' ? 'btn-primary' : 'btn-ghost'" @click="viewMode = 'b30'">
          <Trophy class="w-4 h-4" />
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
        <div v-if="!hasSuiteData" class="text-center py-20 text-base-content/60">
          <p class="mb-2">暂无成绩数据</p>
          <button class="btn btn-primary btn-sm" @click="handleSuiteRefresh">
            刷新 Suite 数据
          </button>
        </div>
        <template v-else>
          <div class="flex items-center gap-3 mb-4">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <Trophy class="w-5 h-5 text-warning" /> Best 30
            </h2>
            <div class="badge badge-lg badge-primary">总分 {{ b30Total.toFixed(1) }}</div>
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
                :src="getMusicCoverUrl(entry.musicId)" 
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
                    {{ diffLabels[entry.difficulty] }} {{ entry.playLevel }}
                  </span>
                  <span :class="entry.rank === 'AP' ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-400 font-bold' : 'text-pink-400 font-bold'">
                    {{ entry.rank }}
                  </span>
                </div>
              </div>
              <div class="text-sm font-mono font-bold text-primary">{{ entry.score.toFixed(1) }}</div>
            </div>
          </div>
        </template>
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
                <th v-for="d in allDifficulties" :key="d" class="text-center w-20 lg:w-24"
                  :style="{ color: diffColors[d] }"
                >{{ diffLabels[d] }}</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="music in displayedMusics" :key="music.id" class="hover text-sm">
                <td class="p-2">
                  <AssetImage 
                    :src="`${assetsHost}/startapp/music/jacket/${music.assetbundleName}/${music.assetbundleName}.png`" 
                    :alt="music.title"
                    class="w-12 h-12 rounded object-cover"
                  />
                </td>
                <td class="p-2">
                  <RouterLink :to="`/musics/${music.id}`" class="hover:text-primary">
                    <div class="font-medium truncate max-w-[200px] lg:max-w-[400px]">{{ music.title }}</div>
                    <div v-if="getTranslation(music.id)" class="text-xs text-base-content/50 truncate max-w-[200px] lg:max-w-[400px]">{{ getTranslation(music.id) }}</div>
                  </RouterLink>
                </td>
                <td v-for="d in allDifficulties" :key="d" class="text-center p-2">
                  <template v-if="musicDifficultiesMap[music.id]?.[d] !== undefined">
                    <div class="text-xs text-base-content/50">{{ musicDifficultiesMap[music.id]?.[d] }}</div>
                    <div 
                      v-if="musicResultsMap[music.id]?.[d]"
                      class="font-bold px-1 rounded inline-block mt-0.5 min-w-[2rem] text-xs"
                      :class="{
                        'result-ap': musicResultsMap[music.id]?.[d] === 'AP',
                        'result-fc': musicResultsMap[music.id]?.[d] === 'FC',
                        'result-clear': musicResultsMap[music.id]?.[d] === 'C',
                      }"
                    >{{ musicResultsMap[music.id]?.[d] }}</div>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile List View -->
        <div class="block sm:hidden space-y-2">
          <div v-for="music in displayedMusics" :key="music.id" class="bg-base-100 p-2 rounded-lg flex gap-3 shadow-sm">
            <AssetImage 
              :src="`${assetsHost}/startapp/music/jacket/${music.assetbundleName}/${music.assetbundleName}.png`" 
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
                    <div 
                      v-if="musicResultsMap[music.id]?.[d]"
                      class="mt-0.5 text-[9px] font-bold px-0.5 rounded leading-none w-full text-center"
                      :class="{
                        'result-ap': musicResultsMap[music.id]?.[d] === 'AP',
                        'result-fc': musicResultsMap[music.id]?.[d] === 'FC',
                        'result-clear': musicResultsMap[music.id]?.[d] === 'C',
                        'text-base-content/50 border border-base-content/20': !musicResultsMap[music.id]?.[d]
                      }"
                    >{{ musicResultsMap[music.id]?.[d] }}</div>
                    <div v-else class="h-[13px]"></div>
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
            :key="music.id"
            :id="music.id"
            :title="music.title"
            :translation="getTranslation(music.id)"
            :composer="music.composer"
            :assetbundle-name="music.assetbundleName"
            :difficulties="musicDifficultiesMap[music.id] || {}"
            :is-leak="isLeak(music.publishedAt)"
            :assets-host="assetsHost"
            :categories="music.categories || []"
            :results="hasSuiteData ? (musicResultsMap[music.id] || {}) : undefined"
            class="animate-fade-in-up"
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
</template>

<style scoped>
.result-ap {
  background: linear-gradient(135deg, #F06292, #64B5F6);
  color: white;
}
.result-fc {
  background-color: #F06292;
  color: white;
}
.result-clear {
  background-color: rgba(255, 255, 255, 0.15);
  color: currentColor;
  border: 1px solid rgba(128, 128, 128, 0.3);
}
</style>
