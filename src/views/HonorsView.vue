<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Trophy, Users, X } from 'lucide-vue-next'
import Pagination from '@/components/Pagination.vue'
import SekaiHonor from '@/components/SekaiHonor.vue'
import SekaiHonorBonds from '@/components/SekaiHonorBonds.vue'
import { useMasterStore } from '@/stores/master'
import type { GameCharacterData } from '@/types/master'

interface HonorLevel {
  level: number
  description: string
}

interface HonorData {
  id: number
  seq: number
  groupId: number
  honorRarity?: string
  name: string
  assetbundleName?: string
  levels: HonorLevel[]
}

interface HonorGroup {
  id: number
  name: string
  pronunciation?: string
  honorType: string
  backgroundAssetbundleName?: string
  frameName?: string
}

interface BondsHonorLevel {
  level: number
  description: string
}

interface BondsHonor {
  id: number
  seq: number
  bondsGroupId: number
  gameCharacterUnitId1: number
  gameCharacterUnitId2: number
  honorRarity: string
  name: string
  pronunciation?: string
  description?: string
  levels: BondsHonorLevel[]
}

interface BondsHonorWord {
  id: number
  seq: number
  bondsGroupId: number
  assetbundleName: string
  name: string
  description?: string
}

interface GameCharacterUnit {
  id: number
  gameCharacterId: number
  unit: string
}

type HonorTab = 'normal' | 'bonds'

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()

const honors = ref<HonorData[]>([])
const honorGroups = ref<HonorGroup[]>([])
const bondsHonors = ref<BondsHonor[]>([])
const bondsHonorWords = ref<BondsHonorWord[]>([])
const gameCharacterUnits = ref<GameCharacterUnit[]>([])
const characters = ref<GameCharacterData[]>([])
const isLoading = ref(true)
const loadError = ref('')

const normalSearch = ref('')
const selectedHonorType = ref('')
const selectedRarity = ref('')
const selectedEventGroup = ref(0)
const normalPage = ref(1)
const selectedHonor = ref<HonorData | null>(null)
const selectedHonorLevel = ref(1)

const bondsSearch = ref('')
const selectedBondsCharacter = ref(0)
const selectedBondsRarity = ref('')
const bondsPage = ref(1)
const selectedBondsHonor = ref<BondsHonor | null>(null)
const selectedBondsLevel = ref(1)
const selectedBondsWordId = ref(0)
const reverseBonds = ref(false)

const normalPageSize = 24
const bondsPageSize = 12

const typeOptions = [
  { value: 'character', label: '角色成长' },
  { value: 'achievement', label: '成就' },
  { value: 'event', label: '活动' },
  { value: 'rank_match', label: '排位赛' },
  { value: 'birthday', label: '生日 / 纪念日' },
]

const rarityOptions = [
  { value: 'low', label: '普通' },
  { value: 'middle', label: '中级' },
  { value: 'high', label: '高级' },
  { value: 'highest', label: '最高级' },
]

const activeTab = computed<HonorTab>(() => route.query.tab === 'bonds' ? 'bonds' : 'normal')
const honorGroupMap = computed(() => new Map(honorGroups.value.map(group => [group.id, group])))
const characterMap = computed(() => new Map(characters.value.map(character => [character.id, character])))
const characterUnitMap = computed(() => new Map(gameCharacterUnits.value.map(unit => [unit.id, unit])))

const wordsByBondsGroup = computed(() => {
  const map = new Map<number, BondsHonorWord[]>()
  for (const word of bondsHonorWords.value) {
    const list = map.get(word.bondsGroupId) || []
    list.push(word)
    map.set(word.bondsGroupId, list)
  }
  for (const list of map.values()) list.sort((a, b) => a.seq - b.seq)
  return map
})

const eventGroupOptions = computed(() => honorGroups.value
  .filter(group => group.honorType === 'event')
  .sort((a, b) => b.id - a.id))

const filteredHonors = computed(() => {
  const query = normalSearch.value.trim().toLocaleLowerCase()
  return honors.value
    .filter(honor => {
      const group = honorGroupMap.value.get(honor.groupId)
      if (selectedHonorType.value && group?.honorType !== selectedHonorType.value) return false
      if (selectedRarity.value && honor.honorRarity !== selectedRarity.value) return false
      if (selectedEventGroup.value && honor.groupId !== selectedEventGroup.value) return false
      if (!query) return true
      return [honor.id, honor.name, group?.name, group?.pronunciation, ...honor.levels.map(level => level.description)]
        .some(value => String(value || '').toLocaleLowerCase().includes(query))
    })
    .sort((a, b) => b.seq - a.seq || b.id - a.id)
})

const normalTotalPages = computed(() => Math.max(1, Math.ceil(filteredHonors.value.length / normalPageSize)))
const paginatedHonors = computed(() => filteredHonors.value.slice(
  (normalPage.value - 1) * normalPageSize,
  normalPage.value * normalPageSize,
))

const characterOptions = computed(() => [...characters.value].sort((a, b) => a.seq - b.seq))

const filteredBondsHonors = computed(() => {
  const query = bondsSearch.value.trim().toLocaleLowerCase()
  return bondsHonors.value
    .filter(honor => {
      const unit1 = characterUnitMap.value.get(honor.gameCharacterUnitId1)
      const unit2 = characterUnitMap.value.get(honor.gameCharacterUnitId2)
      if (selectedBondsCharacter.value &&
        unit1?.gameCharacterId !== selectedBondsCharacter.value &&
        unit2?.gameCharacterId !== selectedBondsCharacter.value) return false
      if (selectedBondsRarity.value && honor.honorRarity !== selectedBondsRarity.value) return false
      if (!query) return true
      const words = wordsByBondsGroup.value.get(honor.bondsGroupId) || []
      return [honor.id, honor.name, honor.pronunciation, honor.description, ...words.map(word => word.name)]
        .some(value => String(value || '').toLocaleLowerCase().includes(query))
    })
    .sort((a, b) => b.seq - a.seq || b.id - a.id)
})

const bondsTotalPages = computed(() => Math.max(1, Math.ceil(filteredBondsHonors.value.length / bondsPageSize)))
const paginatedBondsHonors = computed(() => filteredBondsHonors.value.slice(
  (bondsPage.value - 1) * bondsPageSize,
  bondsPage.value * bondsPageSize,
))

const selectedBondsWords = computed(() => selectedBondsHonor.value
  ? wordsByBondsGroup.value.get(selectedBondsHonor.value.bondsGroupId) || []
  : [])

watch([normalSearch, selectedHonorType, selectedRarity, selectedEventGroup], () => { normalPage.value = 1 })
watch([bondsSearch, selectedBondsCharacter, selectedBondsRarity], () => { bondsPage.value = 1 })
watch(normalTotalPages, total => { normalPage.value = Math.min(normalPage.value, total) })
watch(bondsTotalPages, total => { bondsPage.value = Math.min(bondsPage.value, total) })
watch(selectedHonorType, type => {
  if (type !== 'event') selectedEventGroup.value = 0
})

function setTab(tab: HonorTab) {
  const query = { ...route.query }
  if (tab === 'bonds') query.tab = 'bonds'
  else delete query.tab
  void router.replace({ query })
}

function getTypeLabel(type?: string): string {
  return typeOptions.find(option => option.value === type)?.label || type || '其他'
}

function getRarityLabel(rarity?: string): string {
  return rarityOptions.find(option => option.value === rarity)?.label || rarity || '未知'
}

function maxLevel(levels: Array<{ level: number }>): number {
  return Math.max(1, ...levels.map(level => level.level))
}

function lastDescription(levels: Array<{ description: string }>): string {
  return levels[levels.length - 1]?.description || ''
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openHonor(honor: HonorData) {
  selectedHonor.value = honor
  selectedHonorLevel.value = maxLevel(honor.levels)
}

function getCharacterNameByUnitId(unitId: number): string {
  const characterId = characterUnitMap.value.get(unitId)?.gameCharacterId
  const character = characterId ? characterMap.value.get(characterId) : undefined
  return character ? `${character.firstName || ''}${character.givenName}` : `角色单元 #${unitId}`
}

function firstWordId(honor: BondsHonor): number {
  return wordsByBondsGroup.value.get(honor.bondsGroupId)?.[0]?.id || 0
}

function openBondsHonor(honor: BondsHonor) {
  selectedBondsHonor.value = honor
  selectedBondsLevel.value = maxLevel(honor.levels)
  selectedBondsWordId.value = firstWordId(honor)
  reverseBonds.value = false
}

onMounted(async () => {
  try {
    const [honorData, groupData, bondsData, wordData, unitData, characterData] = await Promise.all([
      masterStore.getMaster<HonorData>('honors'),
      masterStore.getMaster<HonorGroup>('honorGroups'),
      masterStore.getMaster<BondsHonor>('bondsHonors'),
      masterStore.getMaster<BondsHonorWord>('bondsHonorWords'),
      masterStore.getMaster<GameCharacterUnit>('gameCharacterUnits'),
      masterStore.getMaster<GameCharacterData>('gameCharacters'),
    ])
    honors.value = honorData
    honorGroups.value = groupData
    bondsHonors.value = bondsData
    bondsHonorWords.value = wordData
    gameCharacterUnits.value = unitData
    characters.value = characterData
  } catch (error) {
    console.error('加载称号图鉴失败:', error)
    loadError.value = error instanceof Error ? error.message : 'Master 数据加载失败'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <header>
      <h1 class="text-3xl font-bold flex items-center gap-3">
        <Trophy class="w-8 h-8 text-warning" /> 称号图鉴
      </h1>
      <p class="text-sm text-base-content/60 mt-2">浏览普通称号、活动排名称号和角色羁绊称号，并预览不同等级与文字组合。</p>
    </header>

    <div role="tablist" class="tabs tabs-box bg-base-100 border border-base-200 w-fit">
      <button role="tab" class="tab gap-2" :class="{ 'tab-active': activeTab === 'normal' }" @click="setTab('normal')">
        <Trophy class="w-4 h-4" /> 普通称号
      </button>
      <button role="tab" class="tab gap-2" :class="{ 'tab-active': activeTab === 'bonds' }" @click="setTab('bonds')">
        <Users class="w-4 h-4" /> 羁绊称号
      </button>
    </div>

    <div v-if="isLoading" class="grid md:grid-cols-2 gap-4">
      <div v-for="index in 10" :key="index" class="skeleton h-36 rounded-xl"></div>
    </div>
    <div v-else-if="loadError" class="alert alert-error">称号数据加载失败：{{ loadError }}</div>

    <template v-else-if="activeTab === 'normal'">
      <section class="card bg-base-100 border border-base-200 shadow-sm">
        <div class="card-body p-4 gap-3">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_160px_280px] gap-3">
            <label class="input input-bordered flex items-center gap-2">
              <Search class="w-4 h-4 opacity-50" />
              <input v-model="normalSearch" class="grow min-w-0" placeholder="搜索名称、条件或 ID…" />
              <button v-if="normalSearch" class="btn btn-ghost btn-xs btn-circle" aria-label="清空" @click="normalSearch = ''"><X class="w-3 h-3" /></button>
            </label>
            <select v-model="selectedHonorType" class="select select-bordered w-full">
              <option value="">全部类型</option>
              <option v-for="option in typeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
            <select v-model="selectedRarity" class="select select-bordered w-full">
              <option value="">全部稀有度</option>
              <option v-for="option in rarityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
            <select v-model.number="selectedEventGroup" class="select select-bordered w-full" :disabled="selectedHonorType !== 'event'">
              <option :value="0">全部活动</option>
              <option v-for="group in eventGroupOptions" :key="group.id" :value="group.id">#{{ group.id }} {{ group.name }}</option>
            </select>
          </div>
          <p class="text-sm text-base-content/55">找到 {{ filteredHonors.length }} 个称号</p>
        </div>
      </section>

      <div v-if="paginatedHonors.length" class="grid md:grid-cols-2 gap-4">
        <button
          v-for="honor in paginatedHonors"
          :key="honor.id"
          type="button"
          class="card bg-base-100 border border-base-200 hover:border-primary/50 hover:shadow-md transition-all text-left"
          @click="openHonor(honor)"
        >
          <div class="card-body p-4 gap-3">
            <SekaiHonor :honor-id="honor.id" :honor-level="maxLevel(honor.levels)" />
            <div class="min-w-0">
              <div class="flex flex-wrap gap-2 mb-1">
                <span class="badge badge-sm badge-ghost">#{{ honor.id }}</span>
                <span class="badge badge-sm badge-outline">{{ getTypeLabel(honorGroupMap.get(honor.groupId)?.honorType) }}</span>
                <span class="badge badge-sm badge-outline">{{ getRarityLabel(honor.honorRarity) }}</span>
              </div>
              <h2 class="font-bold truncate">{{ honorGroupMap.get(honor.groupId)?.name || honor.name }}</h2>
              <p class="text-xs text-base-content/55 truncate mt-1">{{ lastDescription(honor.levels) }}</p>
            </div>
          </div>
        </button>
      </div>
      <div v-else class="hero min-h-56 bg-base-100 rounded-xl border border-base-200"><p class="font-bold">没有匹配的称号</p></div>

      <Pagination
        v-if="normalTotalPages > 1"
        :current-page="normalPage"
        :total-pages="normalTotalPages"
        base-url="/honors"
        @page-change="normalPage = $event; scrollToTop()"
      />
    </template>

    <template v-else>
      <section class="card bg-base-100 border border-base-200 shadow-sm">
        <div class="card-body p-4 gap-3">
          <div class="grid grid-cols-1 md:grid-cols-[minmax(240px,1fr)_220px_180px] gap-3">
            <label class="input input-bordered flex items-center gap-2">
              <Search class="w-4 h-4 opacity-50" />
              <input v-model="bondsSearch" class="grow min-w-0" placeholder="搜索角色、羁绊文字或 ID…" />
              <button v-if="bondsSearch" class="btn btn-ghost btn-xs btn-circle" aria-label="清空" @click="bondsSearch = ''"><X class="w-3 h-3" /></button>
            </label>
            <select v-model.number="selectedBondsCharacter" class="select select-bordered w-full">
              <option :value="0">全部角色</option>
              <option v-for="character in characterOptions" :key="character.id" :value="character.id">{{ character.firstName || '' }}{{ character.givenName }}</option>
            </select>
            <select v-model="selectedBondsRarity" class="select select-bordered w-full">
              <option value="">全部稀有度</option>
              <option v-for="option in rarityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </div>
          <p class="text-sm text-base-content/55">找到 {{ filteredBondsHonors.length }} 个羁绊称号</p>
        </div>
      </section>

      <div v-if="paginatedBondsHonors.length" class="grid md:grid-cols-2 gap-4">
        <button
          v-for="honor in paginatedBondsHonors"
          :key="honor.id"
          type="button"
          class="card bg-base-100 border border-base-200 hover:border-secondary/50 hover:shadow-md transition-all text-left"
          @click="openBondsHonor(honor)"
        >
          <div class="card-body p-4 gap-3">
            <SekaiHonorBonds
              :honor-id="honor.id"
              :honor-level="maxLevel(honor.levels)"
              :bonds-honor-word-id="firstWordId(honor)"
            />
            <div>
              <div class="flex flex-wrap gap-2 mb-1">
                <span class="badge badge-sm badge-ghost">#{{ honor.id }}</span>
                <span class="badge badge-sm badge-outline">{{ getRarityLabel(honor.honorRarity) }}</span>
                <span class="badge badge-sm badge-outline">{{ wordsByBondsGroup.get(honor.bondsGroupId)?.length || 0 }} 种文字</span>
              </div>
              <h2 class="font-bold">{{ getCharacterNameByUnitId(honor.gameCharacterUnitId1) }} × {{ getCharacterNameByUnitId(honor.gameCharacterUnitId2) }}</h2>
              <p class="text-xs text-base-content/55 truncate mt-1">{{ lastDescription(honor.levels) }}</p>
            </div>
          </div>
        </button>
      </div>
      <div v-else class="hero min-h-56 bg-base-100 rounded-xl border border-base-200"><p class="font-bold">没有匹配的羁绊称号</p></div>

      <Pagination
        v-if="bondsTotalPages > 1"
        :current-page="bondsPage"
        :total-pages="bondsTotalPages"
        base-url="/honors?tab=bonds"
        @page-change="bondsPage = $event; scrollToTop()"
      />
    </template>

    <dialog class="modal" :class="{ 'modal-open': selectedHonor }">
      <div v-if="selectedHonor" class="modal-box max-w-2xl">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" aria-label="关闭" @click="selectedHonor = null"><X class="w-4 h-4" /></button>
        <h2 class="font-bold text-xl pr-10">{{ honorGroupMap.get(selectedHonor.groupId)?.name || selectedHonor.name }}</h2>
        <p class="text-sm text-base-content/55 mt-1">称号 #{{ selectedHonor.id }} · {{ getTypeLabel(honorGroupMap.get(selectedHonor.groupId)?.honorType) }}</p>
        <div class="bg-base-200 rounded-xl p-4 my-5"><SekaiHonor :honor-id="selectedHonor.id" :honor-level="selectedHonorLevel" /></div>
        <label class="form-control w-full">
          <span class="label-text mb-2">展示等级</span>
          <select v-model.number="selectedHonorLevel" class="select select-bordered">
            <option v-for="level in selectedHonor.levels" :key="level.level" :value="level.level">Lv.{{ level.level }} — {{ level.description }}</option>
          </select>
        </label>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="selectedHonor = null">关闭</button></form>
    </dialog>

    <dialog class="modal" :class="{ 'modal-open': selectedBondsHonor }">
      <div v-if="selectedBondsHonor" class="modal-box max-w-2xl">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" aria-label="关闭" @click="selectedBondsHonor = null"><X class="w-4 h-4" /></button>
        <h2 class="font-bold text-xl pr-10">{{ getCharacterNameByUnitId(selectedBondsHonor.gameCharacterUnitId1) }} × {{ getCharacterNameByUnitId(selectedBondsHonor.gameCharacterUnitId2) }}</h2>
        <p class="text-sm text-base-content/55 mt-1">羁绊称号 #{{ selectedBondsHonor.id }}</p>
        <div class="bg-base-200 rounded-xl p-4 my-5">
          <SekaiHonorBonds
            :honor-id="selectedBondsHonor.id"
            :honor-level="selectedBondsLevel"
            :bonds-honor-word-id="selectedBondsWordId"
            :bonds-honor-view-type="reverseBonds ? 'reverse' : 'normal'"
          />
        </div>
        <div class="grid md:grid-cols-2 gap-3">
          <label class="form-control">
            <span class="label-text mb-2">展示等级</span>
            <select v-model.number="selectedBondsLevel" class="select select-bordered">
              <option v-for="level in selectedBondsHonor.levels" :key="level.level" :value="level.level">Lv.{{ level.level }} — {{ level.description }}</option>
            </select>
          </label>
          <label class="form-control">
            <span class="label-text mb-2">称号文字</span>
            <select v-model.number="selectedBondsWordId" class="select select-bordered">
              <option v-for="word in selectedBondsWords" :key="word.id" :value="word.id">{{ word.name }}</option>
            </select>
          </label>
        </div>
        <label class="label cursor-pointer justify-start gap-3 mt-3">
          <input v-model="reverseBonds" type="checkbox" class="toggle toggle-secondary" />
          <span class="label-text">交换左右角色</span>
        </label>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="selectedBondsHonor = null">关闭</button></form>
    </dialog>
  </div>
</template>
