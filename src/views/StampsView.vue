<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download, ImageDown, Search, Smile, X } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import type { GameCharacterData, StampData } from '@/types/master'

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const stamps = ref<StampData[]>([])
const characters = ref<GameCharacterData[]>([])
const isLoading = ref(true)
const loadError = ref('')
const selectedStamp = ref<StampData | null>(null)
const actionMessage = ref('')

const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const selectedCharacterId = ref(typeof route.query.character === 'string' ? route.query.character : '')
const selectedType = ref(typeof route.query.type === 'string' ? route.query.type : '')
const currentPage = computed(() => Math.max(1, Number(route.query.page) || 1))
const pageSize = 48
const now = Date.now()

const assetsHost = computed(() => settingsStore.assetsHost)

const typeOptions = [
  { value: 'illustration', label: '角色插画' },
  { value: 'text', label: '文字贴图' },
  { value: 'cheerful_carnival_message', label: '欢乐嘉年华消息' },
  { value: 'non_character_illustration', label: '其他插画' },
]

const unitOrder: Record<string, number> = {
  light_sound: 1,
  idol: 2,
  street: 3,
  theme_park: 4,
  school_refusal: 5,
  piapro: 6,
}

const characterMap = computed(() => new Map(characters.value.map(character => [character.id, character])))

const characterOptions = computed(() => {
  const counts = new Map<number, number>()
  for (const stamp of stamps.value) {
    if (stamp.characterId1) counts.set(stamp.characterId1, (counts.get(stamp.characterId1) || 0) + 1)
  }
  return [...characters.value]
    .filter(character => counts.has(character.id))
    .sort((a, b) => (unitOrder[a.unit] || 99) - (unitOrder[b.unit] || 99) || a.seq - b.seq)
    .map(character => ({ ...character, count: counts.get(character.id) || 0 }))
})

const filteredStamps = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return stamps.value
    .filter(stamp => settingsStore.showSpoilers || stamp.archivePublishedAt <= now)
    .filter(stamp => !selectedCharacterId.value || stamp.characterId1 === Number(selectedCharacterId.value))
    .filter(stamp => !selectedType.value || stamp.stampType === selectedType.value)
    .filter(stamp => {
      if (!query) return true
      const character = stamp.characterId1 ? characterMap.value.get(stamp.characterId1) : undefined
      const characterName = character ? `${character.firstName || ''}${character.givenName}` : ''
      return [stamp.id, stamp.name, stamp.description, stamp.assetbundleName, characterName]
        .some(value => String(value || '').toLocaleLowerCase().includes(query))
    })
    .sort((a, b) => b.archivePublishedAt - a.archivePublishedAt || b.id - a.id)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredStamps.value.length / pageSize)))
const paginatedStamps = computed(() => {
  const safePage = Math.min(currentPage.value, totalPages.value)
  return filteredStamps.value.slice((safePage - 1) * pageSize, safePage * pageSize)
})

watch([searchQuery, selectedCharacterId, selectedType], () => {
  const query: Record<string, string> = {}
  if (searchQuery.value.trim()) query.q = searchQuery.value.trim()
  if (selectedCharacterId.value) query.character = selectedCharacterId.value
  if (selectedType.value) query.type = selectedType.value
  void router.replace({ query })
})

watch(totalPages, total => {
  if (currentPage.value > total) void setPage(total)
})

function setPage(page: number) {
  const query = { ...route.query }
  if (page > 1) query.page = String(page)
  else delete query.page
  return router.push({ query })
}

function getStampUrl(stamp: StampData): string {
  return `${assetsHost.value}/startapp/stamp/${stamp.assetbundleName}/${stamp.assetbundleName}.png`
}

function cleanName(name: string): string {
  return name.replace(/^\[スタンプ\]/, '').trim()
}

function getCharacterName(stamp: StampData): string {
  if (!stamp.characterId1) return '无指定角色'
  const character = characterMap.value.get(stamp.characterId1)
  return character ? `${character.firstName || ''}${character.givenName}` : `角色 #${stamp.characterId1}`
}

function getTypeLabel(type: string): string {
  return typeOptions.find(option => option.value === type)?.label || type
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function isSpoiler(stamp: StampData): boolean {
  return stamp.archivePublishedAt > now
}

async function downloadStamp(stamp: StampData) {
  actionMessage.value = ''
  const url = getStampUrl(stamp)
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const objectUrl = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `${stamp.assetbundleName}.png`
    link.click()
    URL.revokeObjectURL(objectUrl)
    actionMessage.value = '原图下载已开始'
  } catch (error) {
    console.error('下载贴图失败:', error)
    window.open(url, '_blank', 'noopener,noreferrer')
    actionMessage.value = '浏览器阻止了直接下载，已尝试打开原图'
  }
}

onMounted(async () => {
  try {
    const [stampData, characterData] = await Promise.all([
      masterStore.getMaster<StampData>('stamps'),
      masterStore.getMaster<GameCharacterData>('gameCharacters'),
    ])
    stamps.value = stampData
    characters.value = characterData
  } catch (error) {
    console.error('加载贴图图鉴失败:', error)
    loadError.value = error instanceof Error ? error.message : 'Master 数据加载失败'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <PageHeader title="表情贴图图鉴" description="按名称、角色、类型与来源检索游戏贴图，并下载透明 PNG 原图。"><template #icon><Smile class="w-8 h-8 text-primary" /></template></PageHeader>

    <section class="card bg-base-100 border border-base-200 shadow-sm">
      <div class="card-body p-4 gap-4">
        <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px_220px] gap-3">
          <label class="input input-bordered flex items-center gap-2">
            <Search class="w-4 h-4 opacity-50 shrink-0" />
            <input v-model="searchQuery" class="grow min-w-0" placeholder="搜索名称、来源、角色、ID…" />
            <button v-if="searchQuery" class="btn btn-ghost btn-xs btn-circle" aria-label="清空搜索" @click="searchQuery = ''">
              <X class="w-3.5 h-3.5" />
            </button>
          </label>

          <select v-model="selectedCharacterId" class="select select-bordered w-full">
            <option value="">全部角色</option>
            <option v-for="character in characterOptions" :key="character.id" :value="String(character.id)">
              {{ character.firstName || '' }}{{ character.givenName }}（{{ character.count }}）
            </option>
          </select>

          <select v-model="selectedType" class="select select-bordered w-full">
            <option value="">全部类型</option>
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="text-sm text-base-content/60 flex flex-wrap gap-x-4 gap-y-1">
          <span>共 {{ filteredStamps.length }} 张</span>
          <span v-if="!settingsStore.showSpoilers">未公开内容已按设置隐藏</span>
        </div>
      </div>
    </section>

    <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div v-for="index in 24" :key="index" class="skeleton aspect-square rounded-xl"></div>
    </div>

    <div v-else-if="loadError" class="alert alert-error">
      <span>贴图数据加载失败：{{ loadError }}</span>
    </div>

    <div v-else-if="paginatedStamps.length === 0" class="hero min-h-64 bg-base-100 rounded-xl border border-base-200">
      <div class="hero-content text-center">
        <div>
          <ImageDown class="w-12 h-12 mx-auto mb-3 opacity-30" />
          <h2 class="font-bold text-lg">没有匹配的贴图</h2>
          <button class="btn btn-sm btn-ghost mt-3" @click="searchQuery = ''; selectedCharacterId = ''; selectedType = ''">清除筛选</button>
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <button
        v-for="stamp in paginatedStamps"
        :key="stamp.id"
        type="button"
        class="card bg-base-100 border border-base-200 hover:border-primary/60 hover:-translate-y-0.5 hover:shadow-md transition-all text-left overflow-hidden group"
        @click="selectedStamp = stamp; actionMessage = ''"
      >
        <figure class="relative aspect-square bg-[radial-gradient(circle_at_center,var(--color-base-100),var(--color-base-200))] p-2">
          <AssetImage :src="getStampUrl(stamp)" :alt="cleanName(stamp.name)" class="w-full h-full object-contain group-hover:scale-105 transition-transform" />
          <div class="absolute top-2 right-2 badge badge-sm bg-base-100/80 border-0">#{{ stamp.id }}</div>
          <div v-if="isSpoiler(stamp) && settingsStore.maskSpoilers" class="absolute inset-0 bg-base-100/95 backdrop-blur-sm grid place-items-center font-bold text-warning">
            未公开
          </div>
        </figure>
        <div class="card-body p-3 gap-1 min-w-0">
          <h2 class="font-bold text-sm truncate" :title="cleanName(stamp.name)">{{ cleanName(stamp.name) }}</h2>
          <p class="text-xs text-base-content/50 truncate">{{ getCharacterName(stamp) }}</p>
        </div>
      </button>
    </div>

    <Pagination
      v-if="!isLoading && !loadError && totalPages > 1"
      :current-page="Math.min(currentPage, totalPages)"
      :total-pages="totalPages"
      base-url="/stamps"
      @page-change="setPage"
    />

    <dialog class="modal" :class="{ 'modal-open': selectedStamp }">
      <div v-if="selectedStamp" class="modal-box max-w-2xl p-0 overflow-hidden">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 z-20 bg-base-100/80" aria-label="关闭" @click="selectedStamp = null">
          <X class="w-4 h-4" />
        </button>
        <div class="grid md:grid-cols-[minmax(0,320px)_1fr]">
          <div class="aspect-square bg-[radial-gradient(circle_at_center,var(--color-base-100),var(--color-base-200))] p-5 grid place-items-center">
            <AssetImage :src="getStampUrl(selectedStamp)" :alt="cleanName(selectedStamp.name)" :lazy="false" class="w-full h-full object-contain" />
          </div>
          <div class="p-6 flex flex-col gap-4 min-w-0">
            <div>
              <div class="flex flex-wrap gap-2 mb-2">
                <span class="badge badge-primary badge-outline">#{{ selectedStamp.id }}</span>
                <span class="badge badge-ghost">{{ getTypeLabel(selectedStamp.stampType) }}</span>
              </div>
              <h2 class="text-xl font-bold">{{ cleanName(selectedStamp.name) }}</h2>
              <p class="text-sm text-base-content/60 mt-1">{{ getCharacterName(selectedStamp) }}</p>
            </div>

            <dl class="text-sm grid grid-cols-[5rem_1fr] gap-x-3 gap-y-2">
              <dt class="text-base-content/50">公开日期</dt>
              <dd>{{ formatDate(selectedStamp.archivePublishedAt) }}</dd>
              <dt class="text-base-content/50">资源名</dt>
              <dd class="font-mono text-xs break-all">{{ selectedStamp.assetbundleName }}</dd>
              <template v-if="selectedStamp.description">
                <dt class="text-base-content/50">获得方式</dt>
                <dd class="whitespace-pre-line">{{ selectedStamp.description }}</dd>
              </template>
            </dl>

            <div class="mt-auto">
              <button class="btn btn-primary btn-sm gap-2" @click="downloadStamp(selectedStamp)">
                <Download class="w-4 h-4" /> 下载透明 PNG
              </button>
              <p v-if="actionMessage" class="text-xs text-success mt-2">{{ actionMessage }}</p>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @submit.prevent="selectedStamp = null">
        <button @click="selectedStamp = null">关闭</button>
      </form>
    </dialog>
  </div>
</template>
