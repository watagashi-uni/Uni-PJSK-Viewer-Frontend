<script lang="ts">
import type { CostumeGroup } from '@/types/costume'

// RouterView 以 fullPath 为 key，query 变化会重建整个视图；
// costume3ds 有 11 万+ 条目，用模块作用域缓存聚合结果避免每次重建都重新聚合
let costumeGroupsCache: { source: unknown; groups: CostumeGroup[] } | null = null
</script>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { Shirt, Search, EyeOff, CreditCard } from 'lucide-vue-next'
import Pagination from '@/components/Pagination.vue'
import CostumeThumb from '@/components/CostumeThumb.vue'
import { buildCostumeGroups, COSTUME_PART_LABELS } from '@/utils/costume'
import type { Costume3d, CardCostume3d, CostumePart } from '@/types/costume'

interface Character {
  id: number
  firstName?: string
  givenName: string
}

// 列表项：某个衣装组的某个部件（服装组附带的头饰/发型会在对应 tab 单独成项）
interface CostumeListItem {
  key: string
  group: CostumeGroup
  part: CostumePart
}

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const characters = ref<Character[]>([])
const costumeGroups = ref<CostumeGroup[]>([])
const isLoading = ref(true)

const now = Date.now()

// URL 中的筛选状态
const selectedCharaId = computed(() => {
  const id = Number(route.query.charaId)
  return Number.isInteger(id) && id > 0 ? id : null
})
const selectedPart = computed(() => {
  const part = route.query.part
  return part === 'head' || part === 'hair' ? part : 'body'
})
const selectedSource = computed(() => {
  const source = route.query.source
  return source === 'own' || source === 'distributed' || source === 'none' ? source : 'all'
})
const searchQuery = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
const sortOrder = computed(() => (route.query.sort === 'asc' ? 'asc' : 'desc'))

const searchInput = ref('')

// 分页配置
const pageSize = 60
const currentPage = computed(() => Number(route.query.page) || 1)
const totalPages = computed(() => Math.ceil(filteredItems.value.length / pageSize))

const partTabs = [
  { value: 'body', label: '服装' },
  { value: 'head', label: '头饰' },
  { value: 'hair', label: '发型' },
]

const sourceTabs = [
  { value: 'all', label: '全部来源' },
  { value: 'own', label: '本角色卡片' },
  { value: 'distributed', label: '他角色卡片配布' },
  { value: 'none', label: '非卡片' },
]

function getCharaName(characterId: number | null): string {
  const chara = characters.value.find(c => c.id === characterId)
  if (!chara) return ''
  return (chara.firstName || '') + chara.givenName
}

const characterOptions = computed(() => {
  return [...characters.value]
    .sort((a, b) => a.id - b.id)
    .map(chara => ({
      value: chara.id,
      label: (chara.firstName || '') + chara.givenName,
      icon: `/img/chr_ts/chr_ts_90_${chara.id}.png`,
    }))
})

// 当前角色下、按剧透设置可见的衣装（用于计算各 tab 数量）
const visibleBaseGroups = computed(() => {
  if (selectedCharaId.value === null) return []
  let result = costumeGroups.value.filter(g => g.characterId === selectedCharaId.value)
  if (!settingsStore.showSpoilers) {
    result = result.filter(g => g.publishedAt <= now)
  }
  return result
})

// 每个 tab 的数量：按部件统计（一套服装的附属头饰/发型分别计入对应 tab）
const partCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const group of visibleBaseGroups.value) {
    for (const part of group.parts) {
      counts.set(part.partType, (counts.get(part.partType) || 0) + 1)
    }
  }
  return counts
})

const filteredItems = computed(() => {
  const items: CostumeListItem[] = []
  const query = searchQuery.value.toLowerCase()
  for (const group of visibleBaseGroups.value) {
    if (selectedSource.value === 'own' && group.cardLinkType !== 'own') continue
    if (selectedSource.value === 'distributed' && group.cardLinkType !== 'distributed') continue
    if (selectedSource.value === 'none' && group.cardId !== undefined) continue
    if (query && !group.name.toLowerCase().includes(query)) continue
    const part = group.parts.find(p => p.partType === selectedPart.value)
    if (part) {
      items.push({ key: `${group.key}:${part.partType}`, group, part })
    }
  }

  items.sort((a, b) => {
    return sortOrder.value === 'desc'
      ? b.group.representativeId - a.group.representativeId
      : a.group.representativeId - b.group.representativeId
  })

  return items
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredItems.value.slice(start, start + pageSize)
})

function isLeak(group: CostumeGroup): boolean {
  return group.publishedAt > now
}

function itemThumb(item: CostumeListItem): string {
  return item.part.variants[0]?.assetbundleName ?? ''
}

function itemSummary(item: CostumeListItem): string {
  if (item.part.partType === 'body') {
    const parts = item.group.parts.map(p => COSTUME_PART_LABELS[p.partType] || p.partType).join(' + ')
    const colors = Math.max(...item.group.parts.map(p => p.variants.length))
    return `${parts} · ${colors} 色`
  }
  const label = COSTUME_PART_LABELS[item.part.partType] || item.part.partType
  const attached = item.group.parts.some(p => p.partType === 'body') ? ' · 衣装附属' : ''
  return `${label} · ${item.part.variants.length} 色${attached}`
}

// 更新 URL 筛选参数（patch 中值为 undefined 表示删除该参数）
function pushQuery(patch: Record<string, string | undefined>, page: string = '1') {
  const query: Record<string, string> = {}
  for (const key of ['charaId', 'part', 'source', 'q', 'sort']) {
    const value = route.query[key]
    if (typeof value === 'string' && value) query[key] = value
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete query[key]
    else query[key] = value
  }
  query.page = page
  router.push({ query })
}

function selectCharacter(id: number) {
  if (selectedCharaId.value === id) return
  pushQuery({ charaId: String(id) })
}

function selectPart(part: string) {
  pushQuery({ part: part === 'body' ? undefined : part })
}

function selectSource(source: string) {
  pushQuery({ source: source === 'all' ? undefined : source })
}

function applySearch() {
  if ((searchInput.value || '') === searchQuery.value) return
  pushQuery({ q: searchInput.value || undefined })
}

function toggleSort() {
  pushQuery({ sort: sortOrder.value === 'desc' ? 'asc' : undefined })
}

function handlePageChange(page: number) {
  pushQuery({}, page.toString())
}

async function loadData() {
  isLoading.value = true
  try {
    const [costumesData, cardCostumesData, charactersData] = await Promise.all([
      masterStore.getMaster<Costume3d>('costume3ds'),
      masterStore.getMaster<CardCostume3d>('cardCostume3ds'),
      masterStore.getMaster<Character>('gameCharacters'),
    ])
    characters.value = charactersData

    if (costumeGroupsCache && costumeGroupsCache.source === costumesData) {
      costumeGroups.value = costumeGroupsCache.groups
    } else {
      const groups = buildCostumeGroups(costumesData, cardCostumesData)
      costumeGroupsCache = { source: costumesData, groups }
      costumeGroups.value = groups
    }
  } catch (error) {
    console.error('加载衣装数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  searchInput.value = searchQuery.value
  loadData()
})
</script>

<template>
  <div class="space-y-6 pb-10">
    <!-- 标题 -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold flex items-center gap-2">
        <Shirt class="w-6 h-6 text-primary" />
        衣装一览
      </h1>
    </div>

    <!-- 角色选择 -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body p-4">
        <div class="text-xs font-bold text-base-content/60 mb-2">选择角色</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="chara in characterOptions"
            :key="chara.value"
            class="btn btn-sm h-9 min-h-9 gap-1.5 pl-1.5 pr-2"
            :class="selectedCharaId === chara.value ? 'btn-primary' : 'btn-outline'"
            @click="selectCharacter(chara.value)"
          >
            <span class="h-6 w-6 overflow-hidden rounded-full bg-base-200 ring-1 ring-base-300">
              <img :src="chara.icon" :alt="chara.label" class="h-full w-full object-cover" />
            </span>
            {{ chara.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- 未选择角色的提示 -->
    <div v-else-if="selectedCharaId === null" class="text-center py-20 text-base-content/50">
      <Shirt class="w-16 h-16 mx-auto mb-4 opacity-30" />
      <p>请先选择一名角色查看衣装</p>
    </div>

    <template v-else>
      <!-- 筛选工具栏 -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4 space-y-3">
          <div class="flex flex-wrap gap-4 items-center">
            <div class="join">
              <button
                v-for="tab in partTabs"
                :key="tab.value"
                class="join-item btn btn-sm"
                :class="selectedPart === tab.value ? 'btn-primary' : 'btn-outline'"
                @click="selectPart(tab.value)"
              >
                {{ tab.label }}
                <span class="text-[10px] opacity-60">{{ partCounts.get(tab.value) || 0 }}</span>
              </button>
            </div>

            <div class="join">
              <button
                v-for="tab in sourceTabs"
                :key="tab.value"
                class="join-item btn btn-sm"
                :class="selectedSource === tab.value ? 'btn-secondary' : 'btn-outline'"
                @click="selectSource(tab.value)"
              >
                {{ tab.label }}
              </button>
            </div>

            <button class="btn btn-sm btn-ghost" @click="toggleSort">
              {{ sortOrder === 'desc' ? '最新优先' : '最早优先' }}
            </button>

            <form class="flex-1 min-w-[200px]" @submit.prevent="applySearch">
              <label class="input input-bordered input-sm flex items-center gap-2">
                <Search class="w-4 h-4 opacity-50" />
                <input
                  v-model="searchInput"
                  type="text"
                  placeholder="搜索衣装名称（日文）..."
                  class="grow"
                  @blur="applySearch"
                />
              </label>
            </form>
          </div>
        </div>
      </div>

      <!-- 衣装网格 -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <RouterLink
          v-for="item in paginatedItems"
          :key="item.key"
          :to="`/costumes/${item.group.representativeId}`"
          class="group animate-fade-in-up"
        >
          <div class="bg-base-100 rounded-xl p-3 shadow-md border border-base-200 hover:shadow-lg hover:border-primary/30 transition-all relative overflow-hidden h-full flex flex-col">
            <!-- 剧透遮罩 -->
            <div
              v-if="isLeak(item.group) && settingsStore.maskSpoilers"
              class="absolute inset-0 z-50 bg-base-100/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none"
            >
              <EyeOff class="w-6 h-6 mb-2 text-warning" />
              <span class="font-bold text-sm mb-1">剧透内容</span>
              <span class="text-[10px] text-base-content/60">鼠标悬停查看</span>
            </div>

            <div v-if="isLeak(item.group)" class="absolute top-1 right-1 z-40 badge badge-warning badge-xs">
              剧透
            </div>

            <!-- 卡片衣装角标：区分本角色卡片与他角色卡片配布 -->
            <div v-if="item.group.cardLinkType === 'own'" class="absolute top-1 left-1 z-40 badge badge-primary badge-xs gap-0.5">
              <CreditCard class="w-3 h-3" /> 卡片
            </div>
            <div v-else-if="item.group.cardLinkType === 'distributed'" class="absolute top-1 left-1 z-40 badge badge-secondary badge-xs gap-0.5">
              <CreditCard class="w-3 h-3" /> 配布
            </div>

            <!-- 缩略图（原图仅 128x128，固定小尺寸显示避免放大模糊） -->
            <div class="w-24 h-24 mx-auto bg-base-200 rounded-lg overflow-hidden">
              <CostumeThumb
                :assetbundle-name="itemThumb(item)"
                :alt="item.group.name"
                class="w-full h-full p-1 transition-transform group-hover:scale-105"
              />
            </div>

            <!-- 名称与信息 -->
            <h3 class="font-semibold text-sm mt-2 line-clamp-2 flex-1">{{ item.group.name }}</h3>
            <p class="text-[11px] text-base-content/60 mt-1">
              {{ itemSummary(item) }}
            </p>
          </div>
        </RouterLink>
      </div>

      <!-- 无结果 -->
      <div v-if="paginatedItems.length === 0" class="text-center py-20 text-base-content/50">
        <Shirt class="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p>{{ getCharaName(selectedCharaId) }} 没有找到符合条件的衣装</p>
      </div>

      <!-- 分页 -->
      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        base-url="/costumes"
        @page-change="handlePageChange"
      />
    </template>
  </div>
</template>
