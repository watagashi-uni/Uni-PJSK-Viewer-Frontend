<script setup lang="ts">
import { ref, computed, onMounted, watch, toRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { Search, ArrowUpDown, Languages } from 'lucide-vue-next'
import MusicCard from '@/components/MusicCard.vue'
import Pagination from '@/components/Pagination.vue'
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

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const musics = ref<Music[]>([])
const musicDifficulties = ref<MusicDifficulty[]>([])
const translations = toRef(masterStore, 'translations')
const isLoading = ref(true)

// Assets host based on login status
const assetsHost = 'https://assets.unipjsk.com'

// 状态
const searchText = ref('')
const sortKey = ref<'publishedAt' | 'id' | 'level'>('publishedAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const selectedDiffType = ref<string>('master')

// 分页配置
const pageSize = 30
const currentPage = computed(() => Number(route.query.page) || 1)

// 难度映射
const musicDifficultiesMap = computed(() => {
  const map: Record<number, Record<string, number>> = {}
  musicDifficulties.value.forEach(d => {
    if (!map[d.musicId]) map[d.musicId] = {}
    const musicMap = map[d.musicId]
    if (musicMap) {
      musicMap[d.musicDifficulty] = d.playLevel
    }
  })
  return map
})

// 当前时间戳
const now = Date.now()

// 过滤和排序后的歌曲列表
const filteredMusics = computed(() => {
  let result = [...musics.value]

  // 1. 过滤剧透内容
  if (!settingsStore.showSpoilers) {
    result = result.filter(m => m.publishedAt <= now)
  }

  // 2. 搜索过滤
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

  // 3. 排序
  result.sort((a, b) => {
    let cmp = 0
    if (sortKey.value === 'publishedAt') {
      cmp = a.publishedAt - b.publishedAt
      // 如果发布时间相同，按 ID 排序
      if (cmp === 0) cmp = a.id - b.id
    } else if (sortKey.value === 'id') {
      cmp = a.id - b.id
    } else if (sortKey.value === 'level') {
      const levelA = musicDifficultiesMap.value[a.id]?.[selectedDiffType.value] || 0
      const levelB = musicDifficultiesMap.value[b.id]?.[selectedDiffType.value] || 0
      cmp = levelA - levelB
      // 如果等级相同，按发布时间排序
      if (cmp === 0) {
        cmp = a.publishedAt - b.publishedAt
      }
    }
    
    return sortOrder.value === 'asc' ? cmp : -cmp
  })
  
  return result
})

// 总页数
const totalPages = computed(() => Math.ceil(filteredMusics.value.length / pageSize))

// 当前页的歌曲
const paginatedMusics = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredMusics.value.slice(start, start + pageSize)
})

// 加载数据
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

// 页码变化
function handlePageChange(page: number) {
  router.push({ query: { ...route.query, page: page.toString() } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 切换排序
function toggleSort(key: 'publishedAt' | 'id' | 'level') {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'desc' // 默认降序
  }
}

// 判断是否为剧透内容
function isLeak(publishedAt: number): boolean {
  return publishedAt > now
}

// 获取翻译
function getTranslation(id: number): string {
  return translations.value[id] || ''
}

onMounted(loadData)

// 监听路由变化
watch(() => route.query.page, () => {
  // 如果页码变化，不需要重新加载数据，只需要计算属性更新
})
</script>

<template>
  <div>
    <!-- 工具栏 -->
    <div class="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
      <!-- 搜索框 -->
      <div class="relative w-full md:w-80">
        <input 
          v-model="searchText"
          type="text"
          placeholder="搜索歌曲..."
          class="input input-bordered w-full pl-10"
        />
        <Search class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
      </div>

      <!-- 排序控制 -->
      <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
        <div class="join">
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

        <!-- 定数排序时显示的难度选择 -->
        <select 
          v-if="sortKey === 'level'"
          v-model="selectedDiffType"
          class="select select-bordered select-sm"
        >
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
          <option value="expert">Expert</option>
          <option value="master">Master</option>
          <option value="append">Append</option>
        </select>

        <!-- 贡献翻译 -->
        <a 
          href="https://paratranz.cn/projects/18073" 
          target="_blank" 
          rel="noopener noreferrer"
          class="btn btn-ghost btn-sm gap-1 ml-auto text-primary/70 hover:text-primary"
        >
          <Languages class="w-4 h-4" />
          贡献翻译
        </a>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- 歌曲网格 -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
        class="animate-fade-in-up"
      />
    </div>

    <!-- 无结果 -->
    <div v-if="!isLoading && paginatedMusics.length === 0" class="text-center py-20">
      <p class="text-base-content/60">没有找到歌曲</p>
    </div>

    <!-- 分页 -->
    <Pagination
      v-if="totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      base-url="/musics"
      @page-change="handlePageChange"
    />
  </div>
</template>
