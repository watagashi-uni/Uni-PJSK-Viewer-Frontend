<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { 
  ChevronLeft, Gift, Calendar, Clock, Percent, 
  Dices, RotateCcw, CreditCard, Sparkles, EyeOff
} from 'lucide-vue-next'
import SekaiCard from '@/components/SekaiCard.vue'
import AssetImage from '@/components/AssetImage.vue'

// 类型定义
interface GachaPickup {
  id: number
  gachaId: number
  cardId: number
  gachaPickupType: string
}

interface Gacha {
  id: number
  gachaType: string
  name: string
  seq: number
  assetbundleName: string
  gachaCeilItemId: number
  startAt: number
  endAt: number
  gachaBehaviors: GachaBehavior[]
  gachaCardRarityRates: GachaCardRarityRate[]
  gachaDetails: GachaDetail[]
  gachaPickups?: GachaPickup[]
}

interface GachaBehavior {
  id: number
  gachaId: number
  gachaBehaviorType: string
  costResourceType: string
  costResourceQuantity: number
  spinCount: number
  groupId: number
  resourceCategory?: string
  gachaSpinnableType?: string
}

interface GachaCardRarityRate {
  id: number
  gachaId: number
  cardRarityType: string
  rate: number
}

interface GachaDetail {
  id: number
  gachaId: number
  cardId: number
  weight: number
  isWish: boolean
}

interface Card {
  id: number
  characterId: number
  cardRarityType: string
  attr: string
  assetbundleName: string
  prefix: string
}

interface SimulationResult {
  cardId: number
  card: Card | null
}

interface SimulationStats {
  totalPulls: number
  totalJewels: number
  totalTickets: number
  rarityCount: Record<string, number>
}

const route = useRoute()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const gacha = ref<Gacha | null>(null)
const cards = ref<Card[]>([])
const isLoading = ref(true)
const currentImageTab = ref(0)
const hasBg = ref(false)
const hasBanner = ref(false)

// 模拟抽卡状态
const simulationResults = ref<SimulationResult[]>([])
const rareCards = ref<SimulationResult[]>([])  // 保存的4星和生日卡
const simulationStats = ref<SimulationStats>({
  totalPulls: 0,
  totalJewels: 0,
  totalTickets: 0,
  rarityCount: {}
})

const assetsHost = 'https://assets.unipjsk.com'

const gachaId = computed(() => Number(route.params.id))

const logoUrl = computed(() => {
  if (!gacha.value) return ''
  return `${assetsHost}/ondemand/gacha/${gacha.value.assetbundleName}/logo/logo.png`
})

const bgUrl = computed(() => {
  if (!gacha.value) return ''
  return `${assetsHost}/ondemand/gacha/${gacha.value.assetbundleName}/screen/texture/bg_gacha${gacha.value.id}_1.png`
})

const bannerUrl = computed(() => {
  if (!gacha.value) return ''
  return `${assetsHost}/startapp/home/banner/banner_gacha${gacha.value.id}/banner_gacha${gacha.value.id}.png`
})

// 图片标签页配置
const imageTabs = computed(() => {
  const tabs = [{ key: 'logo', label: 'Logo', url: logoUrl.value }]
  if (hasBg.value) tabs.push({ key: 'bg', label: '背景', url: bgUrl.value })
  if (hasBanner.value) tabs.push({ key: 'banner', label: 'Banner', url: bannerUrl.value })
  return tabs
})

// 剧透判断
const isLeak = computed(() => {
  if (!gacha.value) return false
  return gacha.value.startAt > Date.now()
})

const shouldHideContent = computed(() => {
  if (!isLeak.value) return false
  return !settingsStore.showSpoilers
})

// 检测图片是否可用
function checkImageAvailability() {
  if (!gacha.value) return
  
  // 检查背景
  const bgImg = new Image()
  bgImg.onload = () => { hasBg.value = true }
  bgImg.onerror = () => { hasBg.value = false }
  bgImg.src = bgUrl.value
  
  // 检查 banner
  const bannerImg = new Image()
  bannerImg.onload = () => { hasBanner.value = true }
  bannerImg.onerror = () => { hasBanner.value = false }
  bannerImg.src = bannerUrl.value
}

// 本期卡牌 (Pickup) - 使用 gachaPickups 数组
const featuredCards = computed(() => {
  if (!gacha.value || !gacha.value.gachaPickups) return []
  return gacha.value.gachaPickups
    .map(pickup => {
      const card = cards.value.find(c => c.id === pickup.cardId)
      return card ? { id: card.id, assetbundleName: card.assetbundleName, cardRarityType: card.cardRarityType, attr: card.attr } : null
    })
    .filter(Boolean)
})

const rarityTypeToNum: Record<string, number> = {
  'rarity_1': 1,
  'rarity_2': 2,
  'rarity_3': 3,
  'rarity_4': 4,
  'rarity_birthday': 4
}



function useAfterTrainingStar(cardRarityType: string): boolean {
  return cardRarityType === 'rarity_3' || cardRarityType === 'rarity_4'
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getRateDisplay(rate: GachaCardRarityRate): string {
  const rarity = rarityTypeToNum[rate.cardRarityType] || 1
  return `${rarity}★: ${rate.rate}%`
}

function simulateSinglePull(isGuaranteed: boolean = false): SimulationResult {
  if (!gacha.value) return { cardId: 0, card: null }

  const rates = gacha.value.gachaCardRarityRates
  const details = gacha.value.gachaDetails

  let roll = Math.random() * 100
  let selectedRarityType = 'rarity_2'

  if (isGuaranteed) {
    const guaranteedRates = rates.filter(r => (rarityTypeToNum[r.cardRarityType] ?? 0) >= 3)
    const totalRate = guaranteedRates.reduce((sum, r) => sum + r.rate, 0)
    roll = Math.random() * totalRate
    let cumulative = 0
    for (const rate of guaranteedRates) {
      cumulative += rate.rate
      if (roll < cumulative) {
        selectedRarityType = rate.cardRarityType
        break
      }
    }
  } else {
    let cumulative = 0
    for (const rate of rates) {
      cumulative += rate.rate
      if (roll < cumulative) {
        selectedRarityType = rate.cardRarityType
        break
      }
    }
  }

  const eligibleDetails = details.filter(d => {
    const card = cards.value.find(c => c.id === d.cardId)
    return card && card.cardRarityType === selectedRarityType
  })

  if (eligibleDetails.length === 0) {
    return { cardId: 0, card: null }
  }

  const totalWeight = eligibleDetails.reduce((sum, d) => sum + d.weight, 0)
  let weightRoll = Math.random() * totalWeight
  let selectedCardId = eligibleDetails[0]?.cardId ?? 0

  for (const detail of eligibleDetails) {
    weightRoll -= detail.weight
    if (weightRoll <= 0) {
      selectedCardId = detail.cardId
      break
    }
  }

  const card = cards.value.find(c => c.id === selectedCardId) || null
  return { cardId: selectedCardId, card }
}

function doGacha(behavior: GachaBehavior) {
  const results: SimulationResult[] = []
  const spinCount = behavior.spinCount
  const isOverRarity3 = behavior.gachaBehaviorType.includes('over_rarity_3')
  const isOverRarity4 = behavior.gachaBehaviorType.includes('over_rarity_4')

  let noHighRarityCount = 0

  for (let i = 0; i < spinCount; i++) {
    const isLastInTen = (i + 1) % 10 === 0
    const needGuarantee = isLastInTen && noHighRarityCount >= 9 && (isOverRarity3 || isOverRarity4)

    const result = simulateSinglePull(needGuarantee)
    results.push(result)

    // 保存4星和生日卡
    if (result.card) {
      const rarity = result.card.cardRarityType
      if (rarity === 'rarity_4' || rarity === 'rarity_birthday') {
        rareCards.value.push(result)
      }
    }

    if (result.card) {
      const rarity = rarityTypeToNum[result.card.cardRarityType] || 1
      const threshold = isOverRarity4 ? 4 : 3
      if (rarity >= threshold) {
        noHighRarityCount = 0
      } else {
        noHighRarityCount++
      }
    }

    if (isLastInTen) {
      noHighRarityCount = 0
    }
  }

  simulationResults.value = results

  simulationStats.value.totalPulls += spinCount
  if (behavior.costResourceType === 'jewel' || behavior.costResourceType === 'paid_jewel') {
    simulationStats.value.totalJewels += behavior.costResourceQuantity
  } else if (behavior.costResourceType === 'gacha_ticket') {
    simulationStats.value.totalTickets += behavior.costResourceQuantity
  }

  for (const result of results) {
    if (result.card) {
      const rarityType = result.card.cardRarityType
      simulationStats.value.rarityCount[rarityType] = 
        (simulationStats.value.rarityCount[rarityType] || 0) + 1
    }
  }
}

function resetStats() {
  simulationResults.value = []
  rareCards.value = []
  simulationStats.value = {
    totalPulls: 0,
    totalJewels: 0,
    totalTickets: 0,
    rarityCount: {}
  }
}

function getBehaviorLabel(behavior: GachaBehavior): string {
  if (behavior.gachaSpinnableType === 'colorful_pass') return '大月卡'
  if (behavior.spinCount === 1) return '单抽'
  if (behavior.spinCount === 10) return '十连'
  return `${behavior.spinCount}连`
}

function getCostDisplay(behavior: GachaBehavior): string {
  if (behavior.gachaSpinnableType === 'colorful_pass') return '免费'
  if (behavior.resourceCategory === 'free_resource') return '免费'
  
  if (behavior.costResourceType === 'jewel') return `${behavior.costResourceQuantity} 水晶`
  if (behavior.costResourceType === 'paid_jewel') return `${behavior.costResourceQuantity} 付费水晶`
  if (behavior.costResourceType === 'gacha_ticket') return `${behavior.costResourceQuantity} 抽卡券`
  
  if (behavior.costResourceQuantity) return `${behavior.costResourceQuantity}`
  return ''
}


async function loadData() {
  isLoading.value = true
  hasBg.value = false
  hasBanner.value = false
  try {
    const [gachasData, cardsData] = await Promise.all([
      masterStore.getMaster<Gacha>('gachas'),
      masterStore.getMaster<Card>('cards')
    ])

    gacha.value = gachasData.find(g => g.id === gachaId.value) || null
    cards.value = cardsData

    if (gacha.value) {
      document.title = `${gacha.value.name} - PJSK Viewer`
      checkImageAvailability()
    }
  } catch (error) {
    console.error('加载卡池数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
watch(() => route.params.id, loadData)
</script>

<template>
  <div class="space-y-6">
    <!-- 返回按钮 -->
    <router-link to="/gachas" class="btn btn-ghost btn-sm gap-1">
      <ChevronLeft class="w-4 h-4" />
      返回卡池列表
    </router-link>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- 剧透警告/隐藏 -->
    <div v-else-if="shouldHideContent && gacha" class="card bg-base-100 shadow-lg p-10 text-center">
      <div class="flex flex-col items-center gap-4">
        <EyeOff class="w-16 h-16 text-warning opacity-50" />
        <h2 class="text-xl font-bold">涉及剧透内容</h2>
        <p class="opacity-60">此卡池尚未开始。根据您的设置，剧透内容已被隐藏。</p>
        <button class="btn btn-primary btn-outline" @click="settingsStore.toggleSpoilers()">
          允许显示剧透
        </button>
      </div>
    </div>

    <template v-else-if="gacha">
      <!-- 剧透 Banner (仅在 Mask 开启且是 Leak 时显示) -->
      <div v-if="isLeak && settingsStore.maskSpoilers" class="alert alert-warning shadow-sm">
        <EyeOff class="w-5 h-5" />
        <div>
          <h3 class="font-bold">即将开始的卡池</h3>
          <div class="text-xs">此卡池尚未在游戏中上线。</div>
        </div>
      </div>

      <!-- 卡池信息卡片 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <div class="flex items-center gap-2 mb-2">
            <span class="badge badge-lg">#{{ gacha.id }}</span>
          </div>
          
          <h1 class="text-2xl font-bold mb-4">{{ gacha.name }}</h1>

          <!-- 时间信息 -->
          <div class="flex flex-wrap gap-6 text-sm mb-4">
            <div class="flex items-center gap-2">
              <Calendar class="w-4 h-4 text-primary" />
              <span class="opacity-60">开始:</span>
              <span>{{ formatDateTime(gacha.startAt) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-primary" />
              <span class="opacity-60">结束:</span>
              <span>{{ formatDateTime(gacha.endAt) }}</span>
            </div>
          </div>

          <!-- 概率信息 -->
          <div class="flex items-center gap-2 flex-wrap">
            <Percent class="w-4 h-4 text-primary" />
            <span 
              v-for="rate in gacha.gachaCardRarityRates.filter(r => r.rate > 0)" 
              :key="rate.id"
              class="badge"
              :class="{
                'badge-warning': rarityTypeToNum[rate.cardRarityType] === 4,
                'badge-secondary': rarityTypeToNum[rate.cardRarityType] === 3,
                'badge-ghost': (rarityTypeToNum[rate.cardRarityType] ?? 0) <= 2
              }"
            >
              {{ getRateDisplay(rate) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 图片展示 -->
      <div class="card bg-base-100 shadow-lg overflow-hidden">
        <figure class="relative">
          <AssetImage 
            :src="imageTabs[currentImageTab]?.url || logoUrl" 
            :alt="gacha.name"
            class="w-full object-contain max-h-[400px]"
          />
        </figure>
        <div class="card-body py-3">
          <div class="flex gap-2">
            <button 
              v-for="(tab, idx) in imageTabs"
              :key="tab.key"
              class="btn btn-sm"
              :class="currentImageTab === idx ? 'btn-primary' : 'btn-ghost'"
              @click="currentImageTab = idx"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 本期角色 -->
      <div v-if="featuredCards.length > 0" class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="text-lg font-medium mb-3 flex items-center gap-2">
            <CreditCard class="w-5 h-5 text-primary" />
            本期角色
          </h2>
          <div class="flex flex-wrap gap-3">
            <router-link 
              v-for="card in featuredCards" 
              :key="card?.id"
              :to="`/cards/${card?.id}`"
              class="hover:scale-105 transition-transform w-16 sm:w-20"
            >
              <SekaiCard 
                v-if="card" 
                :card="card" 
                :trained="useAfterTrainingStar(card.cardRarityType || '')" 
              />
            </router-link>
          </div>
        </div>
      </div>

      <!-- 模拟抽卡区域 -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="text-lg font-medium mb-3 flex items-center gap-2">
            <Dices class="w-5 h-5 text-primary" />
            模拟抽卡
          </h2>

          <!-- 抽卡按钮 -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="behavior in gacha.gachaBehaviors.filter(b => b.spinCount > 0)"
              :key="behavior.id"
              @click="doGacha(behavior)"
              class="btn btn-primary btn-sm"
            >
              {{ getBehaviorLabel(behavior) }}
              <span class="badge badge-ghost badge-sm">{{ getCostDisplay(behavior) }}</span>
            </button>
            <button @click="resetStats" class="btn btn-outline btn-error btn-sm">
              <RotateCcw class="w-4 h-4" />
              重置
            </button>
          </div>

          <!-- 统计信息 -->
          <div v-if="simulationStats.totalPulls > 0" class="mt-4 p-4 bg-base-200 rounded-lg">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-primary">{{ simulationStats.totalPulls }}</div>
                <div class="text-xs opacity-60">总抽数</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-warning">{{ simulationStats.totalJewels }}</div>
                <div class="text-xs opacity-60">消耗水晶</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-secondary">{{ simulationStats.rarityCount['rarity_4'] || 0 }}</div>
                <div class="text-xs opacity-60">4★ 数量</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-info">{{ simulationStats.rarityCount['rarity_3'] || 0 }}</div>
                <div class="text-xs opacity-60">3★ 数量</div>
              </div>
            </div>
          </div>

          <!-- 保存的4星/生日卡 -->
          <div v-if="rareCards.length > 0" class="mt-4">
            <h3 class="font-medium mb-2 flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-warning" />
              累计获得的 4★/生日卡 ({{ rareCards.length }})
            </h3>
            <div class="flex flex-wrap gap-2">
              <router-link 
                v-for="(result, index) in rareCards" 
                :key="'rare-' + index"
                :to="result.card ? `/cards/${result.card.id}` : '#'"
                class="hover:scale-105 transition-transform w-14 sm:w-16"
              >
                <SekaiCard 
                  v-if="result.card" 
                  :card="result.card" 
                  :trained="useAfterTrainingStar(result.card.cardRarityType)" 
                />
              </router-link>
            </div>
          </div>

          <!-- 本次抽卡结果 -->
          <div v-if="simulationResults.length > 0" class="mt-4">
            <h3 class="font-medium mb-2">本次结果</h3>
            <div class="flex flex-wrap gap-2">
              <router-link 
                v-for="(result, index) in simulationResults" 
                :key="index"
                :to="result.card ? `/cards/${result.card.id}` : '#'"
                class="hover:scale-105 transition-transform w-12 sm:w-14"
              >
                <SekaiCard 
                  v-if="result.card" 
                  :card="result.card" 
                  :trained="useAfterTrainingStar(result.card.cardRarityType)" 
                />
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 未找到 -->
    <div v-else class="text-center py-20 text-base-content/50">
      <Gift class="w-16 h-16 mx-auto mb-4 opacity-30" />
      <p>未找到该卡池</p>
    </div>
  </div>
</template>
