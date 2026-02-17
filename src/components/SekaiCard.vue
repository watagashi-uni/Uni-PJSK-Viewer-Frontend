<script setup lang="ts">
import { computed } from 'vue'
import { handleSvgImageError } from '@/utils/imageRetry'

interface Card {
  id: number
  characterId?: number
  cardRarityType: string
  attr: string
  assetbundleName: string
  releaseAt?: number
}

// DeckCardDetail from sekai-calculator (simplified interface)
interface DeckCardInfo {
  cardId: number
  level?: number
  masterRank?: number
  power?: {
    base: number
    areaItemBonus: number
    characterBonus: number
    total: number
  }
  eventBonus?: string
  skill?: {
    scoreUp: number
    lifeRecovery: number
  }
}

const props = defineProps<{
  card: Card
  trained?: boolean
  /** Optional: master rank to display (0-5) */
  masterRank?: number
  /** Optional: deck card detail for tooltip */
  deckCard?: DeckCardInfo
}>()

// 资源基础路径
const assetsHost = 'https://assets.unipjsk.com'

// 稀有度映射
const rarityMap: Record<string, number> = {
  'rarity_1': 1,
  'rarity_2': 2,
  'rarity_3': 3,
  'rarity_4': 4,
  'rarity_birthday': 4
}

// 计算星星数量
const starCount = computed(() => rarityMap[props.card.cardRarityType] || 1)

// 是否使用觉醒后的星星/素材
const isTrainingType = computed(() => {
  return props.card.cardRarityType === 'rarity_3' || props.card.cardRarityType === 'rarity_4'
})

// 卡面 URL
const cardImageUrl = computed(() => {
  const suffix = props.trained ? 'after_training' : 'normal'
  return `${assetsHost}/startapp/thumbnail/chara/${props.card.assetbundleName}_${suffix}.png`
})

// 边框 URL
const frameUrl = computed(() => `/newcard/frame_${props.card.cardRarityType}.png`)

// 属性图标 URL
const attrIconUrl = computed(() => `/newcard/attr_${props.card.attr}.png`)

// 星星 URL
const starUrl = computed(() => {
  if (props.card.cardRarityType === 'rarity_birthday') {
    return '/newcard/rare_birthday.png'
  }
  const suffix = (isTrainingType.value && props.trained) ? 'after_training' : 'normal'
  return `/newcard/rare_star_${suffix}.png`
})

// 显示的突破等级 (优先使用 prop，其次从 deckCard 获取)
const displayMasterRank = computed(() => {
  if (props.masterRank !== undefined && props.masterRank > 0) return props.masterRank
  if (props.deckCard?.masterRank && props.deckCard.masterRank > 0) return props.deckCard.masterRank
  return 0
})

// Tooltip 文本
const tooltipText = computed(() => {
  if (!props.deckCard) return `ID${props.card.id}`
  const parts = [`ID${props.card.id}`]
  if (props.deckCard.power) {
    parts.push(`面板${props.deckCard.power.base} 实际${props.deckCard.power.total}`)
  }
  if (props.deckCard.skill) {
    parts.push(`加分${props.deckCard.skill.scoreUp}`)
  }
  if (props.deckCard.eventBonus) {
    parts.push(`活动${props.deckCard.eventBonus}`)
  }
  return parts.join(' ')
})
</script>

<template>
  <div :title="tooltipText">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 156 156" class="w-full h-auto">
      <!-- 卡面 (调整大小以填满边框) -->
      <image 
        :href="cardImageUrl" 
        x="0" y="0" height="156" width="156"
        preserveAspectRatio="xMidYMid slice"
        @error="handleSvgImageError"
      />
      
      <!-- 边框 -->
      <image 
        :href="frameUrl" 
        x="0" y="0" height="156" width="156"
      />
      
      <!-- 属性图标 -->
      <image 
        :href="attrIconUrl" 
        x="0" y="0" width="35" height="35"
      />
      
      <!-- 星星 -->
      <template v-if="card.cardRarityType === 'rarity_birthday'">
        <image :href="starUrl" x="10" y="125" width="24" height="24" />
      </template>
      <template v-else>
        <image 
          v-for="i in starCount" 
          :key="i"
          :href="starUrl" 
          :x="5 + (i - 1) * 24" 
          y="125" 
          width="24" 
          height="24"
        />
      </template>

      <!-- 突破等级 (master rank) -->
      <image
        v-if="displayMasterRank > 0"
        :href="`/newcard/train_rank_${displayMasterRank}.png`"
        x="100" y="100" width="56" height="56"
      />
    </svg>
  </div>
</template>
