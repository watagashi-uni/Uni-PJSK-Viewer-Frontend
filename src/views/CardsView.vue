<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { EyeOff, RefreshCw } from 'lucide-vue-next'
import { useAccountStore } from '@/stores/account'
import Pagination from '@/components/Pagination.vue'
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

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()

const showUserCards = ref(false)
const selectedUserId = computed({
  get: () => accountStore.currentUserId || '',
  set: (val: string) => accountStore.selectAccount(val)
})

// 计算该用户的 suite 缓存数据
const suiteData = computed(() => {
  if (!selectedUserId.value) return null
  return accountStore.getSuiteCache(selectedUserId.value)
})

// 卡片拥有状态 Map: cardId -> userCard detail
const userCardsMap = computed(() => {
  if (!showUserCards.value || !suiteData.value?.userCards) return new Map()
  const map = new Map<number, any>()
  for (const c of suiteData.value.userCards) {
    map.set(c.cardId, c)
  }
  return map
})

function getMasterRank(cardId: number): number {
  if (!showUserCards.value) return 0
  const c = userCardsMap.value.get(cardId)
  return c ? c.masterRank : 0
}

async function refreshUserCards() {
  if (!selectedUserId.value) return
  await accountStore.refreshSuite(selectedUserId.value)
}

const cards = ref<Card[]>([])
const characters = ref<Character[]>([])
const isLoading = ref(true)



// 从 URL 读取筛选条件
const selectedCharaIds = computed<number[]>(() => {
  const param = route.query.charaIds
  if (!param) return []
  if (typeof param === 'string') {
    return param.split(',').map(Number).filter(n => !isNaN(n))
  }
  return []
})

const selectedRarities = computed<string[]>(() => {
  const param = route.query.rarities
  if (!param) return []
  if (typeof param === 'string') {
    return param.split(',').filter(Boolean)
  }
  return []
})

// 只看已拥有卡片
const filterOwnedOnly = computed<boolean>(() => {
  return route.query.owned === '1'
})

// 稀有度列表
const rarityList = [
  { value: 'rarity_1', label: '一星' },
  { value: 'rarity_2', label: '二星' },
  { value: 'rarity_3', label: '三星' },
  { value: 'rarity_4', label: '四星' },
  { value: 'rarity_birthday', label: '生日卡' },
]

// 分页配置
const pageSize = 30
const currentPage = computed(() => Number(route.query.page) || 1)
const totalPages = computed(() => Math.ceil(filteredCards.value.length / pageSize))

const now = Date.now()

// 过滤后的卡片列表
const filteredCards = computed(() => {
  let result = [...cards.value]
  
  // 按 ID 排序（最新优先）
  result.sort((a, b) => b.id - a.id)
  
  // 过滤剧透内容
  if (!settingsStore.showSpoilers) {
    result = result.filter(c => c.releaseAt <= now)
  }
  
  // 只看拥有的卡
  if (filterOwnedOnly.value && showUserCards.value && suiteData.value?.userCards) {
    result = result.filter(c => userCardsMap.value.has(c.id))
  }
  
  // 按角色筛选 (多选)
  if (selectedCharaIds.value.length > 0) {
    result = result.filter(c => selectedCharaIds.value.includes(c.characterId))
  }
  
  // 按稀有度筛选 (多选)
  if (selectedRarities.value.length > 0) {
    result = result.filter(c => selectedRarities.value.includes(c.cardRarityType))
  }
  
  return result
})

// 当前页的卡片
const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredCards.value.slice(start, start + pageSize)
})

// 获取角色名字
function getCharaName(characterId: number): string {
  const chara = characters.value.find(c => c.id === characterId)
  if (!chara) return ''
  return (chara.firstName || '') + chara.givenName
}

// 判断是否为剧透内容
function isLeak(releaseAt: number): boolean {
  return releaseAt > now
}



// 更新 URL 筛选参数
function updateFilters(charaIds: number[], rarities: string[], owned: boolean, page: string = '1') {
  const query: Record<string, string> = { page }
  if (charaIds.length > 0) {
    query.charaIds = charaIds.join(',')
  }
  if (rarities.length > 0) {
    query.rarities = rarities.join(',')
  }
  if (owned) {
    query.owned = '1'
  }
  router.push({ query })
}

// 切换角色选择
function toggleCharacter(id: number) {
  const current = [...selectedCharaIds.value]
  const idx = current.indexOf(id)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    current.push(id)
  }
  updateFilters(current, selectedRarities.value, filterOwnedOnly.value)
}

// 切换稀有度选择
function toggleRarity(value: string) {
  const current = [...selectedRarities.value]
  const idx = current.indexOf(value)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    current.push(value)
  }
  updateFilters(selectedCharaIds.value, current, filterOwnedOnly.value)
}

// 切换只看拥有
function toggleOwnedOnly() {
  updateFilters(selectedCharaIds.value, selectedRarities.value, !filterOwnedOnly.value)
}

// 加载数据
async function loadData() {
  isLoading.value = true
  try {
    const [cardsData, charactersData] = await Promise.all([
      masterStore.getMaster<Card>('cards'),
      masterStore.getMaster<Character>('gameCharacters'),
    ])
    cards.value = cardsData
    characters.value = charactersData
  } catch (error) {
    console.error('加载卡片数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 页码变化
function handlePageChange(page: number) {
  updateFilters(selectedCharaIds.value, selectedRarities.value, filterOwnedOnly.value, page.toString())
}

// 清除筛选
function clearFilters() {
  router.push({ query: { page: '1' } })
}

// 检查卡片是否有觉醒立绘
function hasTrainedCard(rarity: string): boolean {
  return rarity === 'rarity_3' || rarity === 'rarity_4'
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="pb-10">
    <!-- 拥有状态切换区 -->
    <div class="card bg-base-100 shadow-md mb-4 mt-2">
      <div class="card-body p-4 flex flex-row flex-wrap items-center gap-4">
        <label class="label cursor-pointer gap-2 p-0">
          <input type="checkbox" class="toggle toggle-primary toggle-sm" v-model="showUserCards" />
          <span class="label-text font-medium mt-0.5">显示拥有状态</span>
        </label>
        
        <template v-if="showUserCards">
          <div class="divider divider-horizontal mx-0"></div>
          <label class="label cursor-pointer gap-2 p-0">
            <input type="checkbox" class="toggle toggle-secondary toggle-sm" :checked="filterOwnedOnly" @change="toggleOwnedOnly" />
            <span class="label-text font-medium mt-0.5">只看已拥有</span>
          </label>
          <div class="divider divider-horizontal mx-0"></div>
          
          <div v-if="accountStore.accounts.length > 0" class="min-w-[150px] max-w-[220px]">
            <AccountSelector v-model="selectedUserId" />
          </div>
          <span v-else class="text-sm text-base-content/60">无绑定账号</span>
          
          <button
            v-if="selectedUserId"
            class="btn btn-sm btn-ghost gap-1"
            :disabled="accountStore.suiteRefreshing"
            @click="refreshUserCards"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': accountStore.suiteRefreshing }" />
            刷新数据
          </button>
        </template>
        
        <div class="divider divider-horizontal mx-0"></div>
        <RouterLink class="btn btn-sm btn-primary" to="/card-collection">
          图鉴状态
        </RouterLink>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div class="collapse collapse-arrow bg-base-100 shadow-sm mb-6 border border-base-200">
      <input type="checkbox" />
      <div class="collapse-title text-lg font-medium">
        筛选菜单
      </div>
      <div class="collapse-content">
        <!-- 清除筛选 -->
        <div class="mb-4">
          <button class="btn btn-sm btn-outline" @click="clearFilters">
            取消所有筛选
          </button>
        </div>
        
        <!-- 角色筛选 -->
        <div class="mb-4">
          <p class="text-sm text-base-content/60 mb-2">角色（可多选）</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="chara in characters"
              :key="chara.id"
              class="btn btn-sm"
              :class="selectedCharaIds.includes(chara.id) ? 'btn-primary' : 'btn-ghost'"
              @click="toggleCharacter(chara.id)"
            >
              {{ (chara.firstName || '') + chara.givenName }}
            </button>
          </div>
        </div>
        
        <!-- 稀有度筛选 -->
        <div>
          <p class="text-sm text-base-content/60 mb-2">稀有度（可多选）</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="rarity in rarityList"
              :key="rarity.value"
              class="btn btn-sm"
              :class="selectedRarities.includes(rarity.value) ? 'btn-primary' : 'btn-ghost'"
              @click="toggleRarity(rarity.value)"
            >
              {{ rarity.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- 卡片网格 -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
      <RouterLink
        v-for="card in paginatedCards"
        :key="card.id"
        :to="`/cards/${card.id}`"
        class="group animate-fade-in-up"
      >
        <!-- 卡片背景框 -->
        <div class="bg-base-100 rounded-xl p-3 shadow-md border border-base-200 hover:shadow-lg hover:border-primary/30 transition-all relative overflow-hidden">
        
          <!-- 全卡片遮罩 (仅在开启遮罩模式下显示，Hover时消失) -->
          <div 
            v-if="isLeak(card.releaseAt) && settingsStore.maskSpoilers" 
            class="absolute inset-0 z-50 bg-base-100/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none"
          >
            <EyeOff class="w-6 h-6 mb-2 text-warning" />
            <span class="font-bold text-sm mb-1">剧透内容</span>
            <span class="text-[10px] text-base-content/60">鼠标悬停查看</span>
          </div>

          <!-- 简单角标 (替代之前的内部遮罩) -->
          <div v-if="isLeak(card.releaseAt)" class="absolute top-1 right-1 z-40 badge badge-warning badge-xs gap-0.5">
             剧透
          </div>

          <!-- 统一大小的卡片容器 -->
          <div class="flex gap-1 justify-center relative">
            <!-- 普通卡面 -->
            <div class="w-20 sm:w-24 flex-shrink-0" :class="{ 'mx-auto': !hasTrainedCard(card.cardRarityType) }">
              <div class="relative aspect-square">
                <SekaiCard 
                  :card="card" 
                  :master-rank="getMasterRank(card.id)"
                  class="transition-transform group-hover:scale-105"
                />
                <!-- 未拥有遮罩 -->
                <div v-if="showUserCards && !userCardsMap.has(card.id)" class="absolute inset-0 bg-black/60 pointer-events-none z-30 transition-opacity"></div>
              </div>
              <div v-if="showUserCards && userCardsMap.has(card.id)" class="text-[10px] text-center mt-0.5 font-bold text-primary truncate leading-[1.2]">
                <span class="text-base-content/80">Lv.{{ userCardsMap.get(card.id).level }}</span><br/>
                <span class="text-secondary/80">SLv.{{ userCardsMap.get(card.id).skillLevel || 1 }}</span>
              </div>
            </div>
            
            <!-- 觉醒卡面 (3星/4星) -->
            <div v-if="hasTrainedCard(card.cardRarityType)" class="w-20 sm:w-24 flex-shrink-0">
              <div class="relative aspect-square">
                <SekaiCard 
                  :card="card" 
                  :trained="true"
                  :master-rank="getMasterRank(card.id)"
                  class="transition-transform group-hover:scale-105"
                />
                <!-- 未拥有遮罩 -->
                <div v-if="showUserCards && !userCardsMap.has(card.id)" class="absolute inset-0 bg-black/60 pointer-events-none z-30 transition-opacity"></div>
              </div>
              <div v-if="showUserCards && userCardsMap.has(card.id)" class="text-[10px] text-center mt-0.5 font-bold text-primary truncate leading-[1.2]">
                <span class="text-base-content/80">Lv.{{ userCardsMap.get(card.id).level }}</span><br/>
                <span class="text-secondary/80">SLv.{{ userCardsMap.get(card.id).skillLevel || 1 }}</span>
              </div>
            </div>
          </div>
          
          <!-- 卡片名称 -->
          <h3 class="font-semibold text-sm mt-2 line-clamp-2">{{ card.prefix }}</h3>
          <p class="text-xs text-base-content/60">{{ getCharaName(card.characterId) }}</p>
        </div>
      </RouterLink>
    </div>

    <!-- 无结果 -->
    <div v-if="!isLoading && paginatedCards.length === 0" class="text-center py-20">
      <p class="text-base-content/60">没有找到卡片</p>
    </div>

    <!-- 分页 -->
    <Pagination
      v-if="totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      base-url="/cards"
      @page-change="handlePageChange"
    />
  </div>
</template>
