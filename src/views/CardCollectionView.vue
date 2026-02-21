<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useAccountStore } from '@/stores/account'
import { useSettingsStore } from '@/stores/settings'
import { RefreshCw, BookOpen, AlertTriangle } from 'lucide-vue-next'
import confetti from 'canvas-confetti'
import SekaiCard from '@/components/SekaiCard.vue'
import AccountSelector from '@/components/AccountSelector.vue'

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
  firstName?: string
  givenName: string
}

const router = useRouter()
const masterStore = useMasterStore()
const accountStore = useAccountStore()
const settingsStore = useSettingsStore()

const cards = ref<Card[]>([])
const characters = ref<Character[]>([])
const isLoading = ref(true)

const selectedUserId = computed({
  get: () => accountStore.currentUserId || '',
  set: (val: string) => accountStore.selectAccount(val)
})
const selectedCharacterId = ref<number | null>(null)

// Computed for user data
const suiteData = computed(() => {
  if (!selectedUserId.value) return null
  return accountStore.getSuiteCache(selectedUserId.value)
})

const userCardsMap = computed(() => {
  if (!suiteData.value?.userCards) return new Map()
  const map = new Map<number, any>()
  for (const c of suiteData.value.userCards) {
    map.set(c.cardId, c)
  }
  return map
})

const now = Date.now()

// Rarity ordering
const rarityOrder = ['rarity_4', 'rarity_birthday', 'rarity_3', 'rarity_2', 'rarity_1']
const rarityLabels: Record<string, string> = {
  rarity_4: '4★',
  rarity_birthday: 'Birthday',
  rarity_3: '3★',
  rarity_2: '2★',
  rarity_1: '1★',
}

// Current character valid cards
const characterCards = computed(() => {
  if (!selectedCharacterId.value) return []
  return cards.value.filter(c => {
    // Filter by selected character
    if (c.characterId !== selectedCharacterId.value) return false
    // Filter spoiler content if setting is on
    if (!settingsStore.showSpoilers && c.releaseAt > now) return false
    return true
  }).sort((a, b) => b.id - a.id) // Sort by ID descending (newest first)
})

// Grouped by rarity
const groupedCards = computed(() => {
  const groups: Record<string, Card[]> = {}
  for (const rarity of rarityOrder) {
    groups[rarity] = []
  }
  for (const c of characterCards.value) {
    if (!groups[c.cardRarityType]) {
      groups[c.cardRarityType] = []
    }
    groups[c.cardRarityType]!.push(c)
  }
  return groups
})

// Collection statistics
const totalCards = computed(() => characterCards.value.length)
const ownedCards = computed(() => {
  if (!selectedUserId.value || totalCards.value === 0) return 0
  return characterCards.value.filter(c => userCardsMap.value.has(c.id)).length
})
const collectionRate = computed(() => {
  if (totalCards.value === 0) return 0
  return (ownedCards.value / totalCards.value) * 100
})

const isFullCollection = computed(() => {
  return totalCards.value > 0 && ownedCards.value === totalCards.value
})

const hasTrainedCard = (rarity: string) => rarity === 'rarity_3' || rarity === 'rarity_4'

// Trigger Confetti
watch([isFullCollection, selectedCharacterId], ([full], [oldFull]) => {
  if (full && !oldFull && !isLoading.value) {
    triggerConfetti()
  }
})

function triggerConfetti() {
  const duration = 3000
  const end = Date.now() + duration
  
  ;(function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#ffb7b2', '#ff9cebm', '#e2f0cb', '#b5ead7', '#c7ceea']
    })
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#ffb7b2', '#ff9cebm', '#e2f0cb', '#b5ead7', '#c7ceea']
    })
    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}

async function refreshUserCards() {
  if (!selectedUserId.value) return
  await accountStore.refreshSuite(selectedUserId.value)
}

function getMasterRank(cardId: number): number {
  const c = userCardsMap.value.get(cardId)
  return c?.masterRank || 0
}

async function loadData() {
  isLoading.value = true
  try {
    const [cData, chData] = await Promise.all([
      masterStore.getMaster<Card>('cards'),
      masterStore.getMaster<Character>('gameCharacters')
    ])
    cards.value = cData
    characters.value = chData.filter(c => c.id <= 26) // Only keep main characters 1-26
    
    // Auto select first character if none
    if (!selectedCharacterId.value && characters.value.length > 0) {
      selectedCharacterId.value = characters.value[0]?.id || 1
    }
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    isLoading.value = false
    if (isFullCollection.value) {
      triggerConfetti()
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6 pb-24 sm:pb-10">
    <div class="flex items-center gap-3">
      <button @click="router.back()" class="btn btn-ghost btn-sm px-2">
        ← 返回
      </button>
      <h1 class="text-3xl font-bold flex items-center gap-3">
        <BookOpen class="w-8 h-8 text-secondary" />
        角色图鉴进度
      </h1>
    </div>

    <!-- Account Selection & Control -->
    <div class="card bg-base-100 shadow-md">
      <div class="card-body p-4 flex flex-col sm:flex-row flex-wrap items-center gap-4">
        <label class="font-medium text-sm text-base-content/70">账号</label>
        <div v-if="accountStore.accounts.length > 0" class="min-w-[200px] w-auto">
          <AccountSelector v-model="selectedUserId" />
        </div>
        <span v-else class="text-sm text-error flex items-center gap-1">
          <AlertTriangle class="w-4 h-4"/> 无绑定账号，请前往个人信息页面添加。
        </span>
        
        <button
          v-if="selectedUserId"
          class="btn btn-sm btn-ghost gap-1"
          :disabled="accountStore.suiteRefreshing"
          @click="refreshUserCards"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': accountStore.suiteRefreshing }" />
          刷新数据
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else>
      <div class="flex flex-col lg:flex-row gap-6">
        
        <!-- Sidebar: Character Selector -->
        <div class="w-full lg:w-64 shrink-0 relative">
          <div class="card bg-base-100 shadow-lg lg:sticky lg:top-20">
            <div class="card-body p-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <h3 class="font-bold text-lg mb-3">选择角色</h3>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="chara in characters"
                  :key="chara.id"
                  @click="selectedCharacterId = chara.id"
                  class="btn btn-sm h-auto p-1"
                  :class="selectedCharacterId === chara.id ? 'btn-primary shadow-sm' : 'btn-ghost'"
                >
                  <img :src="`/chr_ts_90_${chara.id}.png`" class="w-8 h-8 rounded-full" :alt="chara.givenName" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content: Collection Status -->
        <div class="flex-1 space-y-6">
          
          <!-- Progress Card -->
          <div class="card bg-base-100 shadow-lg border-t-4 border-secondary overflow-hidden relative">
            <div v-if="isFullCollection" class="absolute inset-0 bg-gradient-to-r from-secondary/10 to-primary/10 pointer-events-none"></div>
            <div class="card-body">
              <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
                <div>
                  <h2 class="text-2xl font-bold flex items-center gap-2">
                    收集进度
                    <span v-if="isFullCollection" class="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-400 animate-pulse">
                      ✨ 恭喜全图鉴！ ✨
                    </span>
                  </h2>
                </div>
                <div class="text-right">
                  <div class="text-3xl font-black">
                    <span :class="isFullCollection ? 'text-secondary' : 'text-primary'">{{ ownedCards }}</span>
                    <span class="text-base-content/40 text-lg"> / {{ totalCards }}</span>
                  </div>
                </div>
              </div>
              <progress 
                class="progress w-full h-3" 
                :class="isFullCollection ? 'progress-secondary' : 'progress-primary'" 
                :value="collectionRate" 
                max="100"
              ></progress>
              <div class="text-right text-sm font-bold mt-1 text-base-content/60">{{ collectionRate.toFixed(1) }}%</div>
            </div>
          </div>

          <!-- Rarity Groups -->
          <div v-for="rarity in rarityOrder" :key="rarity" class="space-y-3">
            <template v-if="(groupedCards[rarity]?.length || 0) > 0">
              <h3 class="text-xl font-bold border-b border-base-200 pb-2 flex items-center gap-2">
                {{ rarityLabels[rarity] }} 
                <span class="text-sm font-normal text-base-content/50">
                  ({{ groupedCards[rarity]?.filter(c => userCardsMap.has(c.id)).length }} / {{ groupedCards[rarity]?.length }})
                </span>
              </h3>
              
              <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12 gap-2 sm:gap-3">
                <div
                  v-for="card in groupedCards[rarity]"
                  :key="card.id"
                  class="group relative"
                >
                  <!-- Card Display (Trained if available) -->
                  <div class="relative overflow-hidden rounded-lg shadow-sm">
                    <SekaiCard 
                      :card="card" 
                      :trained="hasTrainedCard(card.cardRarityType)"
                      :master-rank="getMasterRank(card.id)"
                      class="transition-transform group-hover:scale-105"
                    />
                    <!-- Unowned Mask -->
                    <div 
                      v-if="!userCardsMap.has(card.id)" 
                      class="absolute inset-0 bg-black/70 flex items-center justify-center transition-opacity z-30 pointer-events-none"
                    >
                    </div>
                  </div>
                  <!-- Card Level Overlay (if owned) -->
                  <div v-if="userCardsMap.has(card.id)" class="text-[8px] sm:text-[10px] text-center mt-0.5 font-bold text-primary leading-[1.1]">
                    <span class="text-base-content/80">Lv.{{ userCardsMap.get(card.id)?.level }}</span><br/>
                    <span class="text-secondary/80">SLv.{{ userCardsMap.get(card.id)?.skillLevel || 1 }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>

        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: oklch(var(--nc) / 0.2);
  border-radius: 4px;
}
</style>
