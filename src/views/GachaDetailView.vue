<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { 
  ChevronLeft, Gift, Calendar, Clock, Percent, 
  Dices, RotateCcw, CreditCard, Sparkles, EyeOff, Target
} from 'lucide-vue-next'
import SekaiCard from '@/components/SekaiCard.vue'
import AssetImage from '@/components/AssetImage.vue'

import type { 
  Gacha, GachaBehavior, GachaCardRarityRate, 
  Card, SimulationResult, SimulationStats 
} from '@/types/gacha'

const route = useRoute()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const gacha = ref<Gacha | null>(null)
const cards = ref<Card[]>([])
const isLoading = ref(true)
type BgType = 'chr' | 'normal_n' | 'normal_single' | 'none'

const hasBanner = ref(false)
const hasLogo = ref(false)
const bgType = ref<BgType>('none')
const currentBgIndex = ref(1)
const maxValidBgIndex = ref(1)
const hasNextBg = ref(false)
const isCheckingNext = ref(false)

interface GachaCeilExchangeSummary {
  gachaId: number
  gachaCeilExchanges?: Array<{
    gachaCeilExchangeCost?: {
      resourceType?: string
      quantity?: number
    }
  }>
}

const gachaCeilExchangeSummaries = ref<GachaCeilExchangeSummary[]>([])
const selectedPickupCardId = ref(0)
const probabilityPulls = ref(100)

const currentBgUrl = computed(() => {
  if (!gacha.value) return ''
  const baseDir = `${assetsHost.value}/ondemand/gacha/${gacha.value.assetbundleName}/screen/texture`
  if (bgType.value === 'chr') {
    return `${baseDir}/bg_chr_gacha${gacha.value.id}_${currentBgIndex.value}.png`
  } else if (bgType.value === 'normal_n') {
    return `${baseDir}/bg_gacha${gacha.value.id}_${currentBgIndex.value}.png`
  } else if (bgType.value === 'normal_single') {
    return `${baseDir}/bg_gacha${gacha.value.id}.png`
  }
  return ''
})

// 模拟抽卡状态
const simulationResults = ref<SimulationResult[]>([])
const rareCards = ref<SimulationResult[]>([])  // 保存的4星和生日卡
const simulationStats = ref<SimulationStats>({
  totalPulls: 0,
  totalJewels: 0,
  totalTickets: 0,
  rarityCount: {}
})

const assetsHost = computed(() => settingsStore.assetsHost)

const gachaId = computed(() => Number(route.params.id))

const logoUrl = computed(() => {
  if (!gacha.value) return ''
  return `${assetsHost.value}/ondemand/gacha/${gacha.value.assetbundleName}/logo/logo.png`
})

const bannerUrl = computed(() => {
  if (!gacha.value) return ''
  return `${assetsHost.value}/startapp/home/banner/banner_gacha${gacha.value.id}/banner_gacha${gacha.value.id}.png`
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

async function checkUrlHead(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok || res.status === 200
  } catch {
    return false
  }
}

async function checkNextBg() {
  if (bgType.value === 'none' || bgType.value === 'normal_single') {
    hasNextBg.value = false
    return
  }
  
  if (currentBgIndex.value < maxValidBgIndex.value) {
    hasNextBg.value = true
    return
  }
  
  if (!gacha.value) return
  
  isCheckingNext.value = true
  const baseDir = `${assetsHost.value}/ondemand/gacha/${gacha.value.assetbundleName}/screen/texture`
  const nextIndex = currentBgIndex.value + 1
  const nextUrl = bgType.value === 'chr' 
    ? `${baseDir}/bg_chr_gacha${gacha.value.id}_${nextIndex}.png`
    : `${baseDir}/bg_gacha${gacha.value.id}_${nextIndex}.png`
    
  const exists = await checkUrlHead(nextUrl)
  hasNextBg.value = exists
  if (exists) {
    maxValidBgIndex.value = Math.max(maxValidBgIndex.value, nextIndex)
  }
  isCheckingNext.value = false
}

async function goNextBg() {
  if ((!hasNextBg.value && currentBgIndex.value >= maxValidBgIndex.value) || isCheckingNext.value) return
  currentBgIndex.value++
  await checkNextBg()
}

function goPrevBg() {
  if (currentBgIndex.value <= 1) return
  currentBgIndex.value--
  checkNextBg()
}

// 检测图片是否可用
async function checkImageAvailability() {
  if (!gacha.value) return
  
  // 老卡池可能没有 logo，只有 banner；探测到才显示
  const [bannerOk, logoOk] = await Promise.all([
    checkUrlHead(bannerUrl.value),
    checkUrlHead(logoUrl.value),
  ])
  hasBanner.value = bannerOk
  hasLogo.value = logoOk

  bgType.value = 'none'
  currentBgIndex.value = 1
  maxValidBgIndex.value = 1
  hasNextBg.value = false

  const baseDir = `${assetsHost.value}/ondemand/gacha/${gacha.value.assetbundleName}/screen/texture`
  
  if (await checkUrlHead(`${baseDir}/bg_chr_gacha${gacha.value.id}_1.png`)) {
    bgType.value = 'chr'
  } else if (await checkUrlHead(`${baseDir}/bg_gacha${gacha.value.id}_1.png`)) {
    bgType.value = 'normal_n'
  } else if (await checkUrlHead(`${baseDir}/bg_gacha${gacha.value.id}.png`)) {
    bgType.value = 'normal_single'
  }

  await checkNextBg()
}

// 本期卡牌 (Pickup) - 使用 gachaPickups 数组
const featuredCards = computed(() => {
  if (!gacha.value || !gacha.value.gachaPickups) return []
  return gacha.value.gachaPickups
    .map(pickup => {
      const card = cards.value.find(c => c.id === pickup.cardId)
      return card ? { id: card.id, prefix: card.prefix, assetbundleName: card.assetbundleName, cardRarityType: card.cardRarityType, attr: card.attr } : null
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

const sparkPulls = computed(() => {
  const summary = gachaCeilExchangeSummaries.value.find(row => row.gachaId === gacha.value?.id)
  const quantities = (summary?.gachaCeilExchanges || [])
    .map(row => row.gachaCeilExchangeCost)
    .filter(cost => cost?.resourceType === 'gacha_ceil_item' && Number(cost.quantity) >= 100)
    .map(cost => Number(cost?.quantity))
  return quantities.length ? Math.min(...quantities) : 0
})

const selectedPickupCard = computed(() => cards.value.find(card => card.id === selectedPickupCardId.value))

const probabilityAnalysis = computed(() => {
  const currentGacha = gacha.value
  const target = selectedPickupCard.value
  if (!currentGacha || !target) return null

  const allRates = currentGacha.gachaCardRarityRates || []
  const matchingRates = (currentGacha.gachaCardRarityRates || []).filter(rate => rate.cardRarityType === target.cardRarityType)
  if (matchingRates.length !== 1 || new Set(allRates.map(rate => rate.cardRarityType)).size !== allRates.length) {
    return { error: '该卡池使用自选或分阶段概率，无法仅凭基础权重给出唯一概率。' }
  }

  const targetDetail = (currentGacha.gachaDetails || []).find(detail => detail.cardId === target.id)
  const rarityDetails = (currentGacha.gachaDetails || []).filter(detail => {
    const card = cards.value.find(row => row.id === detail.cardId)
    return card?.cardRarityType === target.cardRarityType
  })
  const totalWeight = rarityDetails.reduce((sum, detail) => sum + Number(detail.weight || 0), 0)
  if (!targetDetail || totalWeight <= 0 || matchingRates[0]!.rate <= 0) {
    return { error: '当前 master 缺少这张卡的完整概率权重。' }
  }

  const singleRate = matchingRates[0]!.rate / 100 * Number(targetDetail.weight || 0) / totalWeight
  const tenPullBehavior = (currentGacha.gachaBehaviors || []).find(behavior =>
    behavior.spinCount === 10 &&
    (behavior.gachaBehaviorType.includes('over_rarity_3') || behavior.gachaBehaviorType.includes('over_rarity_4')),
  )
  const guaranteeRarity = tenPullBehavior?.gachaBehaviorType.includes('over_rarity_4') ? 4 : 3
  const guaranteedPoolRate = allRates
    .filter(rate => (rarityTypeToNum[rate.cardRarityType] || 0) >= guaranteeRarity)
    .reduce((sum, rate) => sum + Number(rate.rate || 0) / 100, 0)
  const targetGuaranteedRate = tenPullBehavior && (rarityTypeToNum[target.cardRarityType] || 0) >= guaranteeRarity && guaranteedPoolRate > 0
    ? singleRate / guaranteedPoolRate
    : 0
  const lowRarityRate = 1 - guaranteedPoolRate
  const targetIsGuaranteedRarity = targetGuaranteedRate > 0
  const lowRarityNoTargetRate = Math.max(0, lowRarityRate - (targetIsGuaranteedRarity ? 0 : singleRate))
  const packNoTarget = tenPullBehavior
    ? (Math.pow(1 - singleRate, 9) - Math.pow(lowRarityNoTargetRate, 9)) * (1 - singleRate) + Math.pow(lowRarityNoTargetRate, 9) * (1 - targetGuaranteedRate)
    : 0
  const noTargetProbability = (count: number) => {
    if (!tenPullBehavior) return Math.pow(1 - singleRate, count)
    const packs = Math.floor(count / 10)
    const remainder = count % 10
    return Math.pow(packNoTarget, packs) * Math.pow(1 - singleRate, remainder)
  }
  const probabilityAt = (count: number) => 1 - noTargetProbability(count)
  const pullsFor = (probability: number) => {
    for (let count = 1; count <= 10000; count += 1) {
      if (probabilityAt(count) >= probability) return count
    }
    return 10000
  }
  let expectedPulls = 0
  for (let count = 0; count < 10000; count += 1) expectedPulls += noTargetProbability(count)
  const pulls = Math.max(1, Math.floor(probabilityPulls.value || 1))
  const naturalProbability = probabilityAt(pulls)
  return {
    singleRate,
    naturalProbability,
    pulls,
    expectedPulls,
    pulls50: pullsFor(0.5),
    pulls90: pullsFor(0.9),
    pulls95: pullsFor(0.95),
    pulls99: pullsFor(0.99),
    withCeiling: sparkPulls.value > 0 && pulls >= sparkPulls.value ? 1 : naturalProbability,
    usesTenPullGuarantee: Boolean(tenPullBehavior),
  }
})



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

function formatProbability(value: number): string {
  const percent = value * 100
  if (percent >= 99.995) return '100%'
  if (percent >= 10) return `${percent.toFixed(1)}%`
  if (percent >= 1) return `${percent.toFixed(2)}%`
  return `${percent.toFixed(4)}%`
}

function formatPullCount(value: number): string {
  return Math.round(value).toLocaleString('zh-CN')
}

function simulateSinglePull(isGuaranteed: boolean = false): SimulationResult {
  if (!gacha.value) return { cardId: 0, card: null }

  const rates = gacha.value.gachaCardRarityRates || []
  const details = gacha.value.gachaDetails || []

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
  bgType.value = 'none'
  currentBgIndex.value = 1
  maxValidBgIndex.value = 1
  hasBanner.value = false
  hasLogo.value = false
  selectedPickupCardId.value = 0
  probabilityPulls.value = 100
  try {
    const [gachasData, cardsData, ceilData] = await Promise.all([
      masterStore.getMaster<Gacha>('gachas'),
      masterStore.getMaster<Card>('cards'),
      masterStore.getMaster<GachaCeilExchangeSummary>('gachaCeilExchangeSummaries'),
    ])

    gacha.value = gachasData.find(g => g.id === gachaId.value) || null
    cards.value = cardsData
    gachaCeilExchangeSummaries.value = ceilData
    selectedPickupCardId.value = gacha.value?.gachaPickups?.find(pickup => cardsData.some(card => card.id === pickup.cardId))?.cardId || 0

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
          
          <div class="flex items-start justify-between mb-4">
            <h1 class="text-2xl font-bold">{{ gacha.name }}</h1>
            <button 
              v-if="gacha.gachaInformation?.summary || gacha.gachaInformation?.description"
              class="btn btn-outline btn-sm font-normal"
              onclick="info_modal.showModal()"
            >
              卡池介绍（日文）
            </button>
          </div>

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
              v-for="rate in (gacha.gachaCardRarityRates || []).filter(r => r.rate > 0)" 
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

      <!-- Logo和Banner展示 -->
      <div v-if="hasLogo || hasBanner" class="card bg-base-100 shadow-lg">
        <div class="card-body p-3 sm:p-5">
          <h2 class="text-base font-medium mb-1 opacity-80">
            展示图
          </h2>
          <div class="flex flex-row flex-wrap justify-center items-end gap-6">
            <div v-if="hasLogo" class="flex flex-col items-center gap-1">
              <span class="text-[10px] font-bold opacity-40 uppercase tracking-wider">Logo</span>
              <AssetImage 
                :src="logoUrl" 
                alt="Logo"
                class="h-20 sm:h-28 object-contain"
              />
            </div>
            
            <div v-if="hasBanner" class="flex flex-col items-center gap-1">
              <span class="text-[10px] font-bold opacity-40 uppercase tracking-wider">Banner</span>
              <AssetImage 
                :src="bannerUrl" 
                alt="Banner"
                class="h-20 sm:h-24 object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 背景展示 -->
      <div v-if="bgType !== 'none'" class="card bg-base-100 shadow-lg overflow-hidden">
        <div class="px-5 pt-3 pb-2 border-b border-base-200">
          <h2 class="text-base font-medium opacity-80">
            卡池背景
          </h2>
        </div>
        <figure class="relative bg-base-300">
          <AssetImage 
            :src="currentBgUrl" 
            :alt="gacha.name + ' 背景'"
            class="w-full object-cover max-h-[600px]"
          />
        </figure>
        
        <div v-if="bgType === 'chr' || bgType === 'normal_n'" class="card-body py-3 border-t border-base-200">
          <div class="flex items-center justify-between">
            <button 
              class="btn btn-sm sm:btn-md"
              :class="{ 'btn-disabled': currentBgIndex <= 1 }"
              :disabled="currentBgIndex <= 1"
              @click="goPrevBg"
            >
              <ChevronLeft class="w-5 h-5 mr-1" /> 上一张
            </button>
            <span class="text-sm font-medium opacity-70">
              第 {{ currentBgIndex }} 张
            </span>
            <button 
              class="btn btn-sm sm:btn-md"
              :class="{ 'btn-disabled': (!hasNextBg && currentBgIndex >= maxValidBgIndex) || isCheckingNext }"
              :disabled="(!hasNextBg && currentBgIndex >= maxValidBgIndex) || isCheckingNext"
              @click="goNextBg"
            >
              {{ isCheckingNext ? '检查中...' : '下一张' }}
              <ChevronLeft class="w-5 h-5 ml-1 inline-block rotate-180" />
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

      <!-- 目标卡概率分析 -->
      <div v-if="featuredCards.length > 0" class="card bg-base-100 shadow-lg">
        <div class="card-body gap-5">
          <div>
            <h2 class="text-lg font-medium flex items-center gap-2">
              <Target class="w-5 h-5 text-primary" />
              目标 Pickup 概率
            </h2>
            <p class="text-xs text-base-content/50 mt-1">依据该卡池的稀有度概率、卡片权重和十连保底计算，不使用随机模拟。</p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="card in featuredCards"
              :key="`probability-${card?.id}`"
              class="w-16 sm:w-20 rounded-xl border-2 p-1 transition-colors"
              :class="selectedPickupCardId === card?.id ? 'border-primary bg-primary/10' : 'border-transparent bg-base-200 hover:border-primary/30'"
              :title="card?.prefix"
              @click="selectedPickupCardId = card?.id || 0"
            >
              <SekaiCard v-if="card" :card="card" :trained="useAfterTrainingStar(card.cardRarityType)" />
            </button>
          </div>

          <div v-if="probabilityAnalysis && 'error' in probabilityAnalysis" class="alert alert-warning py-3">
            {{ probabilityAnalysis.error }}
          </div>
          <template v-else-if="probabilityAnalysis && !('error' in probabilityAnalysis)">
            <div class="grid lg:grid-cols-[minmax(14rem,1fr)_minmax(0,2fr)] gap-5 items-start">
              <div class="rounded-xl bg-base-200 p-4 space-y-3">
                <div class="flex justify-between items-end gap-3"><label class="font-medium">计划抽数</label><div class="join"><input v-model.number="probabilityPulls" type="number" min="1" :max="Math.max(1000, sparkPulls)" class="input input-bordered input-sm join-item w-24 text-right" /><span class="btn btn-sm join-item pointer-events-none">抽</span></div></div>
                <input v-model.number="probabilityPulls" type="range" min="1" :max="Math.max(500, sparkPulls)" class="range range-primary range-sm" />
                <div class="flex justify-between text-[10px] text-base-content/45"><span>1</span><button class="link" @click="probabilityPulls = 100">100</button><button v-if="sparkPulls" class="link" @click="probabilityPulls = sparkPulls">天井 {{ sparkPulls }}</button><span>{{ Math.max(500, sparkPulls) }}</span></div>
                <div class="pt-2 border-t border-base-300 text-xs text-base-content/55 space-y-1"><p>预计水晶：<strong class="text-base-content">{{ (probabilityAnalysis.pulls * 300).toLocaleString() }}</strong></p><p v-if="sparkPulls">交换门槛：<strong class="text-base-content">{{ sparkPulls }} 抽</strong></p><p>{{ probabilityAnalysis.usesTenPullGuarantee ? '已计入十连保底格' : '按独立单抽概率计算' }}</p></div>
              </div>

              <div class="space-y-3">
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <div class="stat rounded-xl bg-primary/10 p-3"><div class="stat-title text-[11px]">单抽命中</div><div class="stat-value text-xl text-primary">{{ formatProbability(probabilityAnalysis.singleRate) }}</div></div>
                  <div class="stat rounded-xl bg-secondary/10 p-3"><div class="stat-title text-[11px]">{{ probabilityAnalysis.pulls }} 抽命中</div><div class="stat-value text-xl text-secondary">{{ formatProbability(probabilityAnalysis.naturalProbability) }}</div></div>
                  <div class="stat rounded-xl bg-base-200 p-3"><div class="stat-title text-[11px]">含交换保障</div><div class="stat-value text-xl">{{ formatProbability(probabilityAnalysis.withCeiling) }}</div></div>
                  <div class="stat rounded-xl bg-base-200 p-3"><div class="stat-title text-[11px]">平均首次获得</div><div class="stat-value text-xl">{{ formatPullCount(probabilityAnalysis.expectedPulls) }}</div><div class="stat-desc">抽</div></div>
                </div>
                <div class="grid grid-cols-4 gap-2 text-center">
                  <div v-for="threshold in [{ label: '50%', pulls: probabilityAnalysis.pulls50 }, { label: '90%', pulls: probabilityAnalysis.pulls90 }, { label: '95%', pulls: probabilityAnalysis.pulls95 }, { label: '99%', pulls: probabilityAnalysis.pulls99 }]" :key="threshold.label" class="rounded-lg border border-base-200 px-2 py-2"><p class="text-[10px] text-base-content/45">达到 {{ threshold.label }}</p><p class="font-bold">{{ threshold.pulls }} 抽</p></div>
                </div>
                <p class="text-[11px] leading-relaxed text-base-content/45">“含交换保障”仅在该卡池 master 存在 Pickup 交换门槛且计划抽数达到门槛时计为 100%；未扣除可使用的招募券。付费必中、自选和分阶段概率卡池会停止计算并显示提示。</p>
              </div>
            </div>
          </template>
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
              v-for="behavior in (gacha.gachaBehaviors || []).filter(b => b.spinCount > 0)"
              :key="behavior.id"
              class="btn btn-primary btn-sm"
              @click="doGacha(behavior)"
            >
              {{ getBehaviorLabel(behavior) }}
              <span class="badge badge-ghost badge-sm">{{ getCostDisplay(behavior) }}</span>
            </button>
            <button class="btn btn-outline btn-error btn-sm" @click="resetStats">
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

    <!-- 详情 Modal -->
    <dialog id="info_modal" class="modal modal-bottom sm:modal-middle">
      <div v-if="gacha?.gachaInformation" class="modal-box">
        <h3 class="font-bold text-lg mb-4">卡池详情</h3>
        <div class="space-y-4 text-sm whitespace-pre-wrap leading-relaxed">
          <div v-if="gacha.gachaInformation.summary">
            {{ gacha.gachaInformation.summary }}
          </div>
          <div v-if="gacha.gachaInformation.summary && gacha.gachaInformation.description" class="divider my-1"></div>
          <div v-if="gacha.gachaInformation.description">
            {{ gacha.gachaInformation.description }}
          </div>
        </div>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn">关闭</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
