<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { AlertTriangle, BookOpen, CheckCircle2, RefreshCw, Search, Sparkles } from 'lucide-vue-next'
import confetti from 'canvas-confetti'
import AccountSelector from '@/components/AccountSelector.vue'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import SekaiCard from '@/components/SekaiCard.vue'
import { useAccountStore } from '@/stores/account'
import { useMasterStore } from '@/stores/master'

interface Card {
  id: number
  characterId: number
  cardRarityType: string
  attr: string
  prefix: string
  assetbundleName: string
  releaseAt: number
}

interface Character {
  id: number
  seq?: number
  firstName?: string
  givenName: string
}

interface UserCardEpisode {
  cardEpisodeId: number
  scenarioStatus: string
  isNotSkipped?: boolean
}

interface UserCard {
  cardId: number
  level: number
  skillLevel?: number
  masterRank?: number
  specialTrainingStatus?: string
  defaultImage?: string
  episodes?: UserCardEpisode[]
}

type OwnershipFilter = 'all' | 'owned' | 'missing'
type ProgressFilter = 'all' | 'story_unread' | 'untrained' | 'not_maxed'

const masterStore = useMasterStore()
const accountStore = useAccountStore()

const cards = ref<Card[]>([])
const characters = ref<Character[]>([])
const isLoading = ref(true)
const loadError = ref('')
const selectedCharacterId = ref(1)
const search = ref('')
const selectedRarity = ref('')
const ownershipFilter = ref<OwnershipFilter>('all')
const progressFilter = ref<ProgressFilter>('all')
const page = ref(1)
const pageSize = 72

const rarityLabels: Record<string, string> = {
  rarity_4: '4★',
  rarity_birthday: 'Birthday / Anniversary',
  rarity_3: '3★',
  rarity_2: '2★',
  rarity_1: '1★',
}
const rarityOrder = ['rarity_4', 'rarity_birthday', 'rarity_3', 'rarity_2', 'rarity_1']

const selectedUserId = computed({
  get: () => accountStore.currentUserId || '',
  set: value => { void accountStore.selectAccount(value) },
})

const suiteData = computed<any | null>(() => selectedUserId.value ? accountStore.getSuiteCache(selectedUserId.value) : null)
const rawUserCards = computed<UserCard[]>(() => {
  const value = suiteData.value?.userCards ?? suiteData.value?.user_cards
  return Array.isArray(value) ? value : []
})
const hasCardData = computed(() => Array.isArray(suiteData.value?.userCards ?? suiteData.value?.user_cards))
const userCardsMap = computed(() => new Map(rawUserCards.value.map(card => [Number(card.cardId), card])))
const characterMap = computed(() => new Map(characters.value.map(character => [character.id, character])))
const releasedCards = computed(() => cards.value.filter(card => Number(card.releaseAt || 0) <= Date.now()))

function hasTraining(card: Card): boolean {
  return card.cardRarityType === 'rarity_3' || card.cardRarityType === 'rarity_4'
}

function isTrained(card: Card): boolean {
  return userCardsMap.value.get(card.id)?.specialTrainingStatus === 'done'
}

function episodeStats(cardId: number): { read: number; total: number } {
  const episodes = userCardsMap.value.get(cardId)?.episodes || []
  return {
    read: episodes.filter(episode => episode.scenarioStatus === 'already_read').length,
    total: episodes.length,
  }
}

function isMaxed(cardId: number): boolean {
  const card = userCardsMap.value.get(cardId)
  return Boolean(card && Number(card.masterRank || 0) >= 5 && Number(card.skillLevel || 1) >= 4)
}

const collectionSummary = computed(() => {
  const owned = releasedCards.value.filter(card => userCardsMap.value.has(card.id))
  const trainable = owned.filter(hasTraining)
  const masterCardIds = new Set(cards.value.map(card => card.id))
  const episodes = rawUserCards.value.flatMap(card => card.episodes || [])
  return {
    total: releasedCards.value.length,
    owned: owned.length,
    suiteTotal: rawUserCards.value.length,
    unmapped: rawUserCards.value.filter(card => !masterCardIds.has(Number(card.cardId))).length,
    collectionRate: releasedCards.value.length ? owned.length / releasedCards.value.length : 0,
    trained: trainable.filter(isTrained).length,
    trainable: trainable.length,
    storyRead: episodes.filter(episode => episode.scenarioStatus === 'already_read').length,
    storyTotal: episodes.length,
    maxed: rawUserCards.value.filter(card => Number(card.masterRank || 0) >= 5 && Number(card.skillLevel || 1) >= 4).length,
  }
})

const characterStats = computed(() => characters.value.map(character => {
  const characterCards = releasedCards.value.filter(card => card.characterId === character.id)
  const owned = characterCards.filter(card => userCardsMap.value.has(card.id))
  const unread = owned.reduce((sum, card) => {
    const story = episodeStats(card.id)
    return sum + Math.max(0, story.total - story.read)
  }, 0)
  return {
    character,
    total: characterCards.length,
    owned: owned.length,
    unread,
    rate: characterCards.length ? owned.length / characterCards.length : 0,
  }
}))

const filteredCards = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return releasedCards.value
    .filter(card => !selectedCharacterId.value || card.characterId === selectedCharacterId.value)
    .filter(card => !selectedRarity.value || card.cardRarityType === selectedRarity.value)
    .filter(card => {
      const owned = userCardsMap.value.has(card.id)
      if (ownershipFilter.value === 'owned') return owned
      if (ownershipFilter.value === 'missing') return !owned
      return true
    })
    .filter(card => {
      if (progressFilter.value === 'all') return true
      const userCard = userCardsMap.value.get(card.id)
      if (!userCard) return false
      if (progressFilter.value === 'story_unread') {
        const story = episodeStats(card.id)
        return story.total > story.read
      }
      if (progressFilter.value === 'untrained') return hasTraining(card) && !isTrained(card)
      return !isMaxed(card.id)
    })
    .filter(card => {
      if (!query) return true
      const character = characterMap.value.get(card.characterId)
      return [card.id, card.prefix, character?.firstName, character?.givenName]
        .some(value => String(value || '').toLocaleLowerCase().includes(query))
    })
    .sort((a, b) => b.id - a.id)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredCards.value.length / pageSize)))
const paginatedCards = computed(() => filteredCards.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const selectedCharacterStats = computed(() => characterStats.value.find(row => row.character.id === selectedCharacterId.value))
const isSelectedFullCollection = computed(() => Boolean(
  hasCardData.value &&
  selectedCharacterStats.value?.total &&
  selectedCharacterStats.value.owned === selectedCharacterStats.value.total,
))

function characterName(character?: Character): string {
  return character ? `${character.firstName || ''}${character.givenName}` : ''
}

function characterIcon(characterId: number): string {
  if (characterId <= 20) return `/img/chr_ts/chr_ts_90_${characterId}.png`
  return `/img/chr_ts/chr_ts_90_${characterId}_2.png`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function resetFilters() {
  search.value = ''
  selectedRarity.value = ''
  ownershipFilter.value = 'all'
  progressFilter.value = 'all'
}

function celebrateFullCollection() {
  const endAt = Date.now() + 1800
  const colors = ['#ff8fab', '#ffca3a', '#8ac926', '#4cc9f0', '#9b5de5']
  const frame = () => {
    confetti({ particleCount: 4, angle: 60, spread: 58, origin: { x: 0, y: 0.72 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 58, origin: { x: 1, y: 0.72 }, colors })
    if (Date.now() < endAt) requestAnimationFrame(frame)
  }
  frame()
}

async function refreshUserCards() {
  if (!selectedUserId.value) return
  await accountStore.refreshSuite(selectedUserId.value)
}

watch([selectedCharacterId, search, selectedRarity, ownershipFilter, progressFilter], () => { page.value = 1 })
watch(totalPages, total => { page.value = Math.min(page.value, total) })
watch([isSelectedFullCollection, selectedCharacterId], ([isFull, characterId], [wasFull, previousCharacterId]) => {
  if (!isLoading.value && isFull && (!wasFull || characterId !== previousCharacterId)) celebrateFullCollection()
})

onMounted(async () => {
  try {
    const [cardData, characterData] = await Promise.all([
      masterStore.getMaster<Card>('cards'),
      masterStore.getMaster<Character>('gameCharacters'),
    ])
    cards.value = cardData
    characters.value = characterData.filter(character => character.id <= 26).sort((a, b) => Number(a.seq || a.id) - Number(b.seq || b.id))
  } catch (error) {
    console.error('加载卡片图鉴进度失败:', error)
    loadError.value = error instanceof Error ? error.message : 'Master 数据加载失败'
  } finally {
    isLoading.value = false
    if (isSelectedFullCollection.value) celebrateFullCollection()
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <PageHeader title="卡片养成进度" description="集中查看卡片收集、特训、Master Rank、技能等级与支线剧情阅读状态。">
      <template #icon><BookOpen class="w-8 h-8 text-primary" /></template>
      <template v-if="accountStore.accounts.length" #actions><div class="sm:w-56"><AccountSelector v-model="selectedUserId" /></div></template>
    </PageHeader>

    <div v-if="isLoading" class="space-y-4"><div class="skeleton h-24 rounded-xl"></div><div class="skeleton h-96 rounded-xl"></div></div>
    <div v-else-if="loadError" class="alert alert-error">卡片养成进度加载失败：{{ loadError }}</div>
    <template v-else>
      <div v-if="!selectedUserId" class="alert alert-warning"><AlertTriangle class="w-5 h-5" /><span>尚未选择账号，可以浏览卡片；绑定账号后可查看完整养成状态。</span><RouterLink to="/profile" class="btn btn-sm btn-primary">前往个人信息</RouterLink></div>
      <div v-else-if="!hasCardData" class="alert alert-info"><span>当前缓存没有卡片数据，请刷新 Suite。</span><button class="btn btn-sm" :disabled="accountStore.suiteRefreshing" @click="refreshUserCards"><RefreshCw class="w-4 h-4" :class="{ 'animate-spin': accountStore.suiteRefreshing }" />刷新</button></div>

      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div class="stat bg-base-100 shadow-sm rounded-xl p-4 lg:col-span-1"><div class="stat-title text-xs">卡片收集</div><div class="stat-value text-2xl text-primary">{{ hasCardData ? collectionSummary.owned : '—' }} / {{ collectionSummary.total }}</div><div class="stat-desc"><template v-if="hasCardData">{{ formatPercent(collectionSummary.collectionRate) }}<template v-if="collectionSummary.unmapped"> · Suite {{ collectionSummary.suiteTotal }}，{{ collectionSummary.unmapped }} 张待 master</template></template><template v-else>当前 master 收录</template></div></div>
        <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">完成特训</div><div class="stat-value text-2xl">{{ hasCardData ? `${collectionSummary.trained} / ${collectionSummary.trainable}` : '—' }}</div><div class="stat-desc">已拥有的 3★ / 4★</div></div>
        <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">剧情已读</div><div class="stat-value text-2xl text-secondary">{{ hasCardData ? `${collectionSummary.storyRead} / ${collectionSummary.storyTotal}` : '—' }}</div><div class="stat-desc">前篇与后篇</div></div>
        <div class="stat bg-base-100 shadow-sm rounded-xl p-4"><div class="stat-title text-xs">MR / 技能双满</div><div class="stat-value text-2xl">{{ hasCardData ? collectionSummary.maxed : '—' }}</div><div class="stat-desc">Master Rank 5 · Skill 4</div></div>
        <div class="stat bg-base-100 shadow-sm rounded-xl p-4 col-span-2 lg:col-span-1"><div class="stat-title text-xs">当前角色</div><div class="stat-value text-xl truncate">{{ selectedCharacterId ? characterName(selectedCharacterStats?.character) : '全部角色' }}</div><div class="stat-desc">{{ selectedCharacterStats ? `${hasCardData ? selectedCharacterStats.owned : '—'} / ${selectedCharacterStats.total}${hasCardData ? ` · 未读 ${selectedCharacterStats.unread}` : ''}` : `${filteredCards.length} 张结果` }}</div></div>
      </div>

      <div class="grid lg:grid-cols-[17rem_minmax(0,1fr)] gap-5 items-start">
        <aside class="card bg-base-100 shadow-sm border border-base-200 lg:sticky lg:top-20">
          <div class="card-body p-4 gap-3">
            <div class="flex items-center justify-between"><h2 class="font-bold">角色收藏</h2><button class="btn btn-xs btn-ghost" :class="{ 'btn-active': selectedCharacterId === 0 }" @click="selectedCharacterId = 0">全部</button></div>
            <div class="grid grid-cols-5 lg:grid-cols-4 gap-2 max-h-72 lg:max-h-[68vh] overflow-y-auto pr-1">
              <button v-for="row in characterStats" :key="row.character.id" class="relative rounded-xl border p-1.5 transition-colors" :class="selectedCharacterId === row.character.id ? 'border-primary bg-primary/10' : 'border-base-200 hover:border-primary/40'" :title="`${characterName(row.character)} ${row.owned}/${row.total}`" @click="selectedCharacterId = row.character.id">
                <img :src="characterIcon(row.character.id)" :alt="characterName(row.character)" class="w-full aspect-square rounded-full bg-base-200" loading="lazy" />
                <span class="block mt-1 text-[10px] font-bold tabular-nums">{{ hasCardData ? row.owned : '—' }}/{{ row.total }}</span>
                <span v-if="hasCardData && row.unread" class="absolute top-0 right-0 badge badge-secondary badge-xs px-1">{{ row.unread }}</span>
              </button>
            </div>
          </div>
        </aside>

        <main class="space-y-4 min-w-0">
          <div class="card bg-base-100 shadow-sm border border-base-200">
            <div class="card-body p-4 gap-3">
              <div class="grid sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_auto_auto] gap-3">
                <label class="input input-bordered input-sm flex items-center gap-2"><Search class="w-4 h-4 opacity-50" /><input v-model="search" class="grow min-w-0" placeholder="搜索卡片名、角色或 ID…" /></label>
                <select v-model="selectedRarity" class="select select-bordered select-sm"><option value="">全部稀有度</option><option v-for="rarity in rarityOrder" :key="rarity" :value="rarity">{{ rarityLabels[rarity] }}</option></select>
                <button class="btn btn-sm btn-ghost" @click="resetFilters">重置筛选</button>
              </div>
              <div class="flex flex-wrap gap-2">
                <div class="join"><button v-for="option in [{ value: 'all', label: '全部' }, { value: 'owned', label: '已拥有' }, { value: 'missing', label: '未拥有' }]" :key="option.value" class="btn btn-xs join-item" :class="{ 'btn-primary': ownershipFilter === option.value }" @click="ownershipFilter = option.value as OwnershipFilter">{{ option.label }}</button></div>
                <div class="join"><button v-for="option in [{ value: 'all', label: '全部养成' }, { value: 'story_unread', label: '剧情未读' }, { value: 'untrained', label: '尚未特训' }, { value: 'not_maxed', label: 'MR / 技能未满' }]" :key="option.value" class="btn btn-xs join-item" :class="{ 'btn-secondary': progressFilter === option.value }" :disabled="!hasCardData && option.value !== 'all'" @click="progressFilter = option.value as ProgressFilter">{{ option.label }}</button></div>
              </div>
              <div class="flex items-center justify-between text-xs text-base-content/50"><span>找到 {{ filteredCards.length }} 张卡片</span><span v-if="hasCardData"><Sparkles class="w-3.5 h-3.5 inline mr-1" />点击卡片可查看详情</span></div>
            </div>
          </div>

          <div v-if="paginatedCards.length" class="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-3">
            <RouterLink v-for="card in paginatedCards" :key="card.id" :to="`/cards/${card.id}`" class="group card bg-base-100 border border-base-200 shadow-sm overflow-hidden hover:border-primary/40 hover:shadow-md transition-all">
              <div class="relative">
                <SekaiCard :card="card" :trained="isTrained(card)" :master-rank="userCardsMap.get(card.id)?.masterRank || 0" class="transition-transform group-hover:scale-[1.02]" :class="{ 'grayscale opacity-40': hasCardData && !userCardsMap.has(card.id) }" />
                <span class="absolute top-1 left-1 badge badge-xs bg-base-100/85 border-0">#{{ card.id }}</span>
                <div v-if="hasCardData && !userCardsMap.has(card.id)" class="absolute inset-0 grid place-items-center"><span class="badge badge-neutral badge-sm">未拥有</span></div>
                <span v-else-if="isTrained(card)" class="absolute top-1 right-1 badge badge-secondary badge-xs">特训</span>
              </div>
              <div class="p-2 space-y-1.5 min-w-0">
                <p class="text-xs font-bold truncate" :title="card.prefix">{{ card.prefix }}</p>
                <template v-if="userCardsMap.has(card.id)">
                  <div class="flex flex-wrap gap-1 text-[10px]"><span class="badge badge-xs badge-outline">Lv.{{ userCardsMap.get(card.id)?.level }}</span><span class="badge badge-xs badge-outline">MR {{ userCardsMap.get(card.id)?.masterRank || 0 }}</span><span class="badge badge-xs badge-outline">SLv.{{ userCardsMap.get(card.id)?.skillLevel || 1 }}</span></div>
                  <div class="flex items-center justify-between text-[10px]" :class="episodeStats(card.id).read === episodeStats(card.id).total ? 'text-success' : 'text-secondary'"><span class="flex items-center gap-1"><CheckCircle2 class="w-3 h-3" />剧情</span><span>{{ episodeStats(card.id).read }} / {{ episodeStats(card.id).total }}</span></div>
                </template>
                <p v-else class="text-[10px] text-base-content/40 truncate">{{ rarityLabels[card.cardRarityType] || card.cardRarityType }}</p>
              </div>
            </RouterLink>
          </div>
          <div v-else class="card bg-base-100 border border-base-200"><div class="card-body items-center py-14 text-center"><BookOpen class="w-10 h-10 text-base-content/20" /><p class="font-bold">没有匹配的卡片</p><button class="btn btn-sm btn-ghost" @click="resetFilters">清除筛选</button></div></div>
          <Pagination v-if="totalPages > 1" :current-page="page" :total-pages="totalPages" base-url="/card-collection" @page-change="page = $event" />
        </main>
      </div>
    </template>
  </div>
</template>
