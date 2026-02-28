<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSeoMeta, useHead } from '@unhead/vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import AssetImage from '@/components/AssetImage.vue'
import SekaiCard from '@/components/SekaiCard.vue'
import { ChevronLeft, ScrollText, Zap } from 'lucide-vue-next'

interface Card {
  id: number
  characterId: number
  cardRarityType: string
  attr: string
  prefix: string
  assetbundleName: string
  releaseAt: number
  skillId: number
  specialTrainingSkillId?: number
  cardSkillName: string
  specialTrainingSkillName?: string
  cardParameters: any
  specialTrainingPower1BonusFixed: number
  specialTrainingPower2BonusFixed: number
  specialTrainingPower3BonusFixed: number
}

interface ResourceBoxDetail {
  resourceType: string
  resourceId: number
}

interface ResourceBox {
  id: number
  resourceBoxPurpose: string
  details: ResourceBoxDetail[]
}

interface GachaCeilExchange {
  resourceBoxId: number
  gachaCeilExchangeLabelType: string
}

interface GachaCeilExchangeSummary {
  gachaCeilExchanges: GachaCeilExchange[]
}

interface Character {
  id: number
  firstName?: string
  givenName: string
}

interface SkillEffectDetail {
  level: number
  activateEffectDuration?: number
  activateEffectValue: number
}

interface SkillEnhance {
  activateEffectValue: number
}

interface SkillEffect {
  id: number
  activateCharacterRank?: number
  activateUnitCount?: number
  skillEffectDetails: SkillEffectDetail[]
  skillEnhance?: SkillEnhance
}

interface Skill {
  id: number
  descriptionSpriteName: string
  description: string
  skillEffects: SkillEffect[]
}

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const cardId = computed(() => Number(route.params.id))
const card = ref<Card | null>(null)
const character = ref<Character | null>(null)
const skill = ref<Skill | null>(null)
const trainedSkill = ref<Skill | null>(null)
const resourceBoxes = ref<ResourceBox[]>([])
const gachaCeilExchangeSummaries = ref<GachaCeilExchangeSummary[]>([])
const isLoading = ref(true)
const isCardTypeLoading = ref(true)
const showNormalCutout = ref(true)
const showTrainedCutout = ref(true)

const limitType = ref<false | 'limited' | 'fes'>(false)

const assetsHost = computed(() => settingsStore.assetsHost)

// Sliders states
const skillLevel = ref(1)
const maxSkillLevel = ref(1)

const charaRank = ref(1)
const maxCharaRank = ref(1)

// Removed computed side-effects and replaced with separate reactive states
const charaRankNecessaryNormal = ref(false)
const unitCountNecessaryNormal = ref(false)
const charaRankNecessaryTrained = ref(false)
const unitCountNecessaryTrained = ref(false)

const unitCount = ref(2)
const unitCountMax = ref(4)
const cardLevel = ref(1)
const maxNormalLevel = ref(1)
const maxTrainedLevel = ref(1)
const masterRank = ref(0)
const cardEpisodes = ref<any[]>([])

const masterRankRewards = [0, 50, 100, 150, 200]
const cardRarityTypeToRarity: Record<string, number> = {
  rarity_1: 0,
  rarity_2: 1,
  rarity_3: 2,
  rarity_4: 3,
  rarity_birthday: 4
}




const isTrainingType = computed(() => {
  return card.value?.cardRarityType === 'rarity_3' || card.value?.cardRarityType === 'rarity_4'
})

function findResourceBoxIdByCardId(cardId: number): number | null {
  for (const box of resourceBoxes.value) {
    if (box.resourceBoxPurpose === 'gacha_ceil_exchange') {
      for (const detail of box.details || []) {
        if (detail.resourceType === 'card' && detail.resourceId === cardId) {
          return box.id
        }
      }
    }
  }
  return null
}

function getCardLimitType(cardId: number): false | 'limited' | 'fes' {
  const resourceBoxId = findResourceBoxIdByCardId(cardId)
  if (!resourceBoxId) return false
  
  for (const summary of gachaCeilExchangeSummaries.value) {
    for (const exchange of summary.gachaCeilExchanges || []) {
      if (exchange.resourceBoxId === resourceBoxId) {
        const labelType = exchange.gachaCeilExchangeLabelType
        if (labelType === 'limited' || labelType === 'fes') {
          return labelType
        }
      }
    }
  }
  return false
}

const cardTypeLabel = computed(() => {
  if (!card.value) return '普通卡'
  if (card.value.cardRarityType === 'rarity_birthday') return '生日限定卡'
  if (isCardTypeLoading.value) return '加载中...'
  
  if (limitType.value === 'fes') return 'FES限定卡'
  if (limitType.value === 'limited') return '限定卡'
  return '普通卡'
})

const getPowerElement = (paramType: string) => {
  if (!card.value) return 0
  let baseObj = card.value.cardParameters
  if (!baseObj) return 0
  let p = 0
  if (Array.isArray(baseObj)) {
    p = baseObj.find((elem: any) => elem.cardParameterType === paramType && elem.cardLevel === cardLevel.value)?.power || 0
  } else {
      if(baseObj[paramType] && baseObj[paramType][cardLevel.value - 1]) {
          p = baseObj[paramType][cardLevel.value - 1]
      }
  }
  let trainingBonus = 0
  if (cardLevel.value > maxNormalLevel.value) {
    if (paramType === 'param1') trainingBonus = card.value.specialTrainingPower1BonusFixed || 0
    if (paramType === 'param2') trainingBonus = card.value.specialTrainingPower2BonusFixed || 0
    if (paramType === 'param3') trainingBonus = card.value.specialTrainingPower3BonusFixed || 0
  }
  let episodeBonus = 0
  if (cardEpisodes.value[0]) {
    if (paramType === 'param1') episodeBonus += cardEpisodes.value[0].power1BonusFixed || 0
    if (paramType === 'param2') episodeBonus += cardEpisodes.value[0].power2BonusFixed || 0
    if (paramType === 'param3') episodeBonus += cardEpisodes.value[0].power3BonusFixed || 0
  }
  if (cardEpisodes.value[1]) {
    if (paramType === 'param1') episodeBonus += cardEpisodes.value[1].power1BonusFixed || 0
    if (paramType === 'param2') episodeBonus += cardEpisodes.value[1].power2BonusFixed || 0
    if (paramType === 'param3') episodeBonus += cardEpisodes.value[1].power3BonusFixed || 0
  }
  let masterBonus = masterRank.value * (masterRankRewards[cardRarityTypeToRarity[card.value.cardRarityType] || 0] || 0)
  return p + trainingBonus + episodeBonus + masterBonus
}

const totalPower = computed(() => {
  const perf = getPowerElement("param1")
  const tech = getPowerElement("param2")
  const stam = getPowerElement("param3")
  return { perf, tech, stam, total: perf + tech + stam }
})

// Unified parse skill function to avoid mutating reactive vars in computed
const parseSkill = (skillObj: Skill | null, isTrained: boolean) => {
  if (!skillObj) return '-'
  
  const skillInfo = skillObj.description
  const singleRegExp = /\{\{(\d+);(\w+)\}\}/g
  const doubleRegExp = /\{\{(\d+),(\d+);(\w+)\}\}/g

  let newSkillInfo = String(skillInfo)
  let _charaRankNecessary = false
  let _unitCountNecessary = false

  newSkillInfo = newSkillInfo.replace(singleRegExp, (match, p1, p2) => {
    const effect = skillObj.skillEffects.find(elem => elem.id === Number(p1))
    if (effect) {
      const detail = effect.skillEffectDetails.find(d => d.level === skillLevel.value)
      if (detail) {
        switch (p2) {
          case 'd':
            return String(detail.activateEffectDuration || 0)
          case 'v':
            return String(detail.activateEffectValue)
          case 'e':
            if (effect.skillEnhance?.activateEffectValue)
              return String(effect.skillEnhance.activateEffectValue)
            break
          case 'm':
            if (effect.skillEnhance?.activateEffectValue)
              return String(effect.skillEnhance.activateEffectValue * 5 + detail.activateEffectValue)
            break
        }
      }
    } else if (p2 === 'c' && character.value) {
      return (character.value.firstName || '') + character.value.givenName
    }
    return match
  })

  newSkillInfo = newSkillInfo.replace(doubleRegExp, (match, p1, p2, p3) => {
    switch (p3) {
      case 'r': {
        _charaRankNecessary = true
        const effectsInRange = skillObj.skillEffects.filter(elem => elem.id >= Number(p1) && elem.id <= Number(p2))
        const minRank = effectsInRange[0]?.activateCharacterRank
        if (minRank) {
          if (charaRank.value < minRank) {
            return '# 角色等级不足 #'
          }
          const targetEffect = [...effectsInRange].reverse().find(elem => elem.activateCharacterRank != null && elem.activateCharacterRank <= charaRank.value)
          
          if (targetEffect) {
            const detail = targetEffect.skillEffectDetails.find(d => d.level === skillLevel.value)
            return String(detail?.activateEffectValue || 0)
          } else {
            return '0'
          }
        }
        break
      }
      case 's': {
        _charaRankNecessary = true
        const baseSkillEffect = skillObj.skillEffects.find(elem => elem.id === Number(p1))
        const effectsInRange = skillObj.skillEffects.filter(elem => elem.id > Number(p1) && elem.id <= Number(p2))
        const minRank = effectsInRange[0]?.activateCharacterRank
        
        if (minRank) {
          if (charaRank.value < minRank) {
            return '# 角色等级不足 #'
          }
          const targetEffect = [...effectsInRange].reverse().find(elem => elem.activateCharacterRank != null && elem.activateCharacterRank <= charaRank.value)
          
          if (baseSkillEffect && targetEffect) {
            const baseDetail = baseSkillEffect.skillEffectDetails.find(d => d.level === skillLevel.value)
            const currentDetail = targetEffect.skillEffectDetails.find(d => d.level === skillLevel.value)
            return String((baseDetail?.activateEffectValue || 0) + (currentDetail?.activateEffectValue || 0))
          } else if (baseSkillEffect) {
            const baseDetail = baseSkillEffect.skillEffectDetails.find(d => d.level === skillLevel.value)
            return String(baseDetail?.activateEffectValue || 0)
          } else {
            return '0'
          }
        }
        break
      }
      case 'v': {
        const baseSkillEffect = skillObj.skillEffects.find(elem => elem.id === Number(p1))
        const maxRank = skillObj.skillEffects.find(elem => elem.id === Number(p2))?.activateCharacterRank
        if (maxRank) {
          const currentEffect = skillObj.skillEffects.find(elem => elem.activateCharacterRank === maxRank)
          if (baseSkillEffect && currentEffect) {
            const baseDetail = baseSkillEffect.skillEffectDetails.find(d => d.level === skillLevel.value)
            const currentDetail = currentEffect.skillEffectDetails.find(d => d.level === skillLevel.value)
            return String((baseDetail?.activateEffectValue || 0) + (currentDetail?.activateEffectValue || 0))
          }
        }
        break
      }
      case 'u': {
        _unitCountNecessary = true
        if (unitCount.value > 0) {
          const baseSkillEffect = skillObj.skillEffects.find(elem => elem.id === Number(p1))
          const unitSkillEffect = skillObj.skillEffects.find(elem => elem.activateUnitCount === unitCount.value)
          if (baseSkillEffect && unitSkillEffect) {
            const baseDetail = baseSkillEffect.skillEffectDetails.find(d => d.level === skillLevel.value)
            const currentDetail = unitSkillEffect.skillEffectDetails.find(d => d.level === skillLevel.value)
            return String((baseDetail?.activateEffectValue || 0) + (currentDetail?.activateEffectValue || 0))
          }
        } else {
            const baseSkillEffect = skillObj.skillEffects.find(elem => elem.id === Number(p1));
            if (baseSkillEffect) {
                const baseDetail = baseSkillEffect.skillEffectDetails.find(d => d.level === skillLevel.value);
                return String(baseDetail?.activateEffectValue || 0);
            }
        }
        break
      }
      case 'o': {
        const baseSkillEffect = skillObj.skillEffects.find(elem => elem.id === Number(p1))
        const enhanceSkillEffect = skillObj.skillEffects.find(elem => elem.id === Number(p2))
        if (baseSkillEffect && enhanceSkillEffect) {
          const baseDetail = baseSkillEffect.skillEffectDetails.find(d => d.level === skillLevel.value)
          const currentDetail = enhanceSkillEffect.skillEffectDetails.find(d => d.level === skillLevel.value)
          return String((baseDetail?.activateEffectValue || 0) + (currentDetail?.activateEffectValue || 0))
        }
        break
      }
    }
    return match
  })
  if (isTrained) {
    charaRankNecessaryTrained.value = _charaRankNecessary
    unitCountNecessaryTrained.value = _unitCountNecessary
  } else {
    charaRankNecessaryNormal.value = _charaRankNecessary
    unitCountNecessaryNormal.value = _unitCountNecessary
  }

  return newSkillInfo
}

const parsedDescription = computed(() => parseSkill(skill.value, false))
const parsedTrainedDescription = computed(() => parseSkill(trainedSkill.value, true))

// Show sliders if normal OR trained skill needs it
const showCharaRankSlider = computed(() => charaRankNecessaryNormal.value || charaRankNecessaryTrained.value)
const showUnitCountSlider = computed(() => unitCountNecessaryNormal.value || unitCountNecessaryTrained.value)

const coverUrl = computed(() => {
  if (!card.value) return ''
  return `${assetsHost.value}/startapp/character/member/${card.value.assetbundleName}/card_normal.jpg`
})

const trainedCoverUrl = computed(() => {
  if (!card.value) return ''
  return `${assetsHost.value}/startapp/character/member/${card.value.assetbundleName}/card_after_training.jpg`
})

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

async function loadCardTypeData() {
  isCardTypeLoading.value = true
  try {
    const [resourceBoxesData, gachaCeilExchangeSummariesData] = await Promise.all([
      masterStore.getMaster<ResourceBox>('resourceBoxes'),
      masterStore.getMaster<GachaCeilExchangeSummary>('gachaCeilExchangeSummaries'),
    ])
    resourceBoxes.value = resourceBoxesData
    gachaCeilExchangeSummaries.value = gachaCeilExchangeSummariesData
    
    if (card.value) {
      limitType.value = getCardLimitType(card.value.id)
    }
  } catch (error) {
    console.error('加载卡片类型数据失败:', error)
  } finally {
    isCardTypeLoading.value = false
  }
}

async function loadData() {
  isLoading.value = true
  showNormalCutout.value = true
  showTrainedCutout.value = true
  try {
    const [cardsData, charactersData, skillsData, raritiesData, charaRanksData, cardEpisodesData] = await Promise.all([
      masterStore.getMaster<Card>('cards'),
      masterStore.getMaster<Character>('gameCharacters'),
      masterStore.getMaster<Skill>('skills'),
      masterStore.getMaster<any>('cardRarities'),
      masterStore.getMaster<any>('characterRanks'),
      masterStore.getMaster<any>('cardEpisodes'),
    ])
    
    card.value = cardsData.find(c => c.id === cardId.value) || null
    
    if (card.value) {
      character.value = charactersData.find(c => c.id === card.value!.characterId) || null
      skill.value = skillsData.find(s => s.id === card.value!.skillId) || null
      
      if (card.value.specialTrainingSkillId) {
          trainedSkill.value = skillsData.find(s => s.id === card.value!.specialTrainingSkillId!) || null
      }
      
      const rarityInfo = raritiesData.find((r: any) => r.cardRarityType === card.value!.cardRarityType)
      if (rarityInfo) {
        maxNormalLevel.value = rarityInfo.maxLevel
        maxTrainedLevel.value = rarityInfo.trainingMaxLevel || rarityInfo.maxLevel
        cardLevel.value = maxTrainedLevel.value
        maxSkillLevel.value = skill.value?.skillEffects[0]?.skillEffectDetails[skill.value.skillEffects[0].skillEffectDetails.length - 1]?.level || rarityInfo.maxSkillLevel || 1
        skillLevel.value = maxSkillLevel.value
      }

      const ranks = charaRanksData.filter((c: any) => c.characterId === card.value!.characterId)
      maxCharaRank.value = ranks.length > 0 ? Math.max(...ranks.map((r: any) => r.characterRank)) : 1
      charaRank.value = maxCharaRank.value

      cardEpisodes.value = cardEpisodesData.filter((e: any) => e.cardId === card.value!.id)
    }
  } catch (error) {
    console.error('加载卡片详情失败:', error)
  } finally {
    isLoading.value = false
  }
  // Initialize parsing correctly with Watcher effect to avoid computed side effects
  
  loadCardTypeData()
}

const defaultTitle = 'Uni PJSK Viewer'

const pageTitle = computed(() => {
  if (card.value && character.value) {
    const charName = (character.value.firstName || '') + character.value.givenName
    return `[${card.value.prefix}] ${charName} - Uni PJSK Viewer`
  } else if (card.value) {
    return `[${card.value.prefix}] - Uni PJSK Viewer`
  }
  return defaultTitle
})

const pageDescription = computed(() => {
  if (card.value && character.value) {
    let rarityLabel = card.value.cardRarityType.replace('rarity_', '')
    if (rarityLabel === 'birthday') rarityLabel = '生日限定'
    else rarityLabel = rarityLabel + '星'

    const charName = (character.value.firstName || '') + character.value.givenName
    return `世界计划（PJSK / Project SEKAI）卡牌 [${card.value.prefix}] ${charName}。稀有度：${rarityLabel}。此页面提供详细的满级属性、技能和卡面插画资源。`
  }
  return '查看世界计划（PJSK / Project SEKAI）的卡牌详细数据，包括插画和技能等。'
})

const pageImage = computed(() => {
  if (card.value) {
    return `${assetsHost.value}/startapp/character/member/${card.value.assetbundleName}/card_normal.jpg`
  }
  return ''
})

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogImage: pageImage,
  twitterCard: 'summary_large_image',
})

const pageKeywords = computed(() => {
  if (card.value && character.value) {
    const charName = (character.value.firstName || '') + character.value.givenName
    return `世界计划, PJSK, Project SEKAI, ${charName}, ${card.value.prefix}, 卡面插画, 属性技能, 初音未来`
  }
  return '世界计划, PJSK, Project SEKAI, 游戏卡牌, 资源'
})

useHead({
  meta: [
    { name: 'keywords', content: pageKeywords }
  ]
})

function goBack() {
  const backState = window.history.state?.back
  if (typeof backState === 'string' && backState.startsWith('/cards')) {
    router.back()
  } else {
    router.push('/cards')
  }
}

onMounted(loadData)
</script>

<template>
  <div>
    <!-- 加载中 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- 卡片详情 -->
    <template v-else-if="card">
      <!-- 顶部导航 -->
      <div class="mb-4 max-w-4xl mx-auto px-4 lg:px-0 flex justify-between">
        <button class="btn btn-ghost btn-sm gap-2 pl-0" @click="goBack">
          <ChevronLeft class="w-4 h-4" /> 返回列表
        </button>
      </div>

      <div class="card bg-base-100 shadow-lg max-w-4xl mx-auto animate-fade-in-up overflow-hidden">
        <div class="card-body">
          <!-- 标题区域 -->
          <div class="text-center pb-4 mb-4">
            <h1 class="text-2xl font-bold flex items-center justify-center gap-3">
              <img 
                :src="`/newcard/attr_icon_${card.attr}.png`" 
                :alt="card.attr"
                class="w-9 h-9"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              {{ card.prefix }}
            </h1>
            <p class="text-lg text-base-content/70 mt-1 mb-4 border-b border-base-200 pb-4">
              {{ character ? (character.firstName || '') + character.givenName : '' }}
            </p>
            
            <div class="flex justify-center gap-6 mt-4 opacity-90">
              <div class="w-20 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-lg overflow-hidden shrink-0 mt-2">
                <SekaiCard :card="card" :trained="false" />
              </div>
              <div v-if="isTrainingType" class="w-20 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-lg overflow-hidden shrink-0 mt-2">
                <SekaiCard :card="card" :trained="true" />
              </div>
            </div>
          </div>



          <!-- 信息区域 -->
          <div class="grid md:grid-cols-2 gap-6">
            <!-- 卡片信息 -->
            <div class="bg-base-200 rounded-xl p-5">
              <h3 class="font-semibold text-primary mb-4 flex items-center gap-2">
                <ScrollText class="w-5 h-5 text-primary" /> 技能信息
              </h3>
              <!-- 技能滑块 -->
              <div class="space-y-4 mb-6">
                <div class="flex items-center">
                  <span class="w-24 text-sm font-medium">技能等级</span>
                  <input v-model.number="skillLevel" type="range" :min="1" :max="maxSkillLevel" class="range range-xs range-primary flex-1" />
                  <span class="ml-2 w-8 text-sm">{{ skillLevel }}</span>
                </div>
                <div v-if="showCharaRankSlider" class="flex items-center">
                  <span class="w-24 text-sm font-medium">角色等级</span>
                  <input v-model.number="charaRank" type="range" :min="1" :max="maxCharaRank" class="range range-xs range-primary flex-1" />
                  <span class="ml-2 w-8 text-sm">{{ charaRank }}</span>
                </div>
                <div v-if="showUnitCountSlider" class="flex items-center">
                  <span class="w-24 text-sm font-medium">同队人数</span>
                  <input v-model.number="unitCount" type="range" :min="0" :max="unitCountMax" class="range range-xs range-primary flex-1" />
                  <span class="ml-2 w-8 text-sm">{{ unitCount }}</span>
                </div>
              </div>



              <!-- 普通技能 -->
              <div class="space-y-2 text-sm border-t border-base-300 pt-4 mt-4">
                <p><span class="font-medium">技能名{{ !!card?.specialTrainingSkillId ? ' (特训前)' : '' }}：</span>{{ card?.cardSkillName || '-' }}</p>
                <div class="flex mt-1">
                  <span class="font-medium whitespace-nowrap">技能效果{{ !!card?.specialTrainingSkillId ? ' (特训前)' : '' }}：</span>
                  <span>{{ parsedDescription }}</span>
                </div>
              </div>

              <!-- 特训技能 -->
              <div v-if="!!card?.specialTrainingSkillId" class="space-y-2 text-sm border-t border-base-300 pt-4 mt-4">
                <p><span class="font-medium">技能名 (特训后)：</span>{{ card?.specialTrainingSkillName || '-' }}</p>
                <div class="flex mt-1">
                  <span class="font-medium whitespace-nowrap">技能效果 (特训后)：</span>
                  <span>{{ parsedTrainedDescription }}</span>
                </div>
              </div>

              <!-- 卡片类型 & 实装时间 -->
              <div class="space-y-2 text-sm border-t border-base-300 pt-4 mt-4 text-base-content/80">
                <p><span class="font-medium text-base-content">卡片类型：</span>{{ cardTypeLabel }}</p>
                <p><span class="font-medium text-base-content">实装时间：</span>{{ card?.releaseAt ? formatDate(card.releaseAt) : '-' }}</p>
              </div>
            </div>
            
            <!-- 能力值 -->
            <div class="bg-base-200 rounded-xl p-5">
              <h3 class="font-semibold text-primary mb-4 flex items-center gap-2">
                <Zap class="w-5 h-5 text-primary" /> 综合力
              </h3>
              <!-- 综合力滑块 -->
              <div class="space-y-6 mb-6">
                <div class="flex items-center">
                  <span class="w-24 text-sm font-medium">卡牌等级</span>
                  <input v-model.number="cardLevel" type="range" :min="1" :max="maxTrainedLevel" class="range range-xs range-secondary flex-1" />
                  <span class="ml-2 w-8 text-sm">{{ cardLevel }}</span>
                </div>
                <div class="flex items-center">
                  <span class="w-24 text-sm font-medium">Master Rank</span>
                  <input v-model.number="masterRank" type="range" :min="0" :max="5" class="range range-xs range-secondary flex-1" />
                  <span class="ml-2 w-8 text-sm">{{ masterRank }}</span>
                </div>
              </div>

              <div class="flex flex-nowrap gap-3 mt-4 border-t border-base-300 pt-4">
                <div class="bg-base-100 rounded-lg p-3 text-center flex-1">
                  <div class="text-xs text-base-content/60">Performance</div>
                  <div class="text-lg font-bold text-primary">{{ totalPower.perf }}</div>
                </div>
                <div class="bg-base-100 rounded-lg p-3 text-center flex-1">
                  <div class="text-xs text-base-content/60">Technique</div>
                  <div class="text-lg font-bold text-primary">{{ totalPower.tech }}</div>
                </div>
                <div class="bg-base-100 rounded-lg p-3 text-center flex-1">
                  <div class="text-xs text-base-content/60">Stamina</div>
                  <div class="text-lg font-bold text-primary">{{ totalPower.stam }}</div>
                </div>
              </div>
              <div class="bg-gradient-to-br from-primary to-success text-white rounded-lg p-3 text-center mt-3 shadow-md" style="width: 100%">
                <div class="text-xs opacity-90">总综合力</div>
                <div class="text-xl font-bold">{{ totalPower.total }}</div>
              </div>
              <p class="text-xs text-base-content/60 mt-3 flex items-center gap-1 justify-center">注：前篇和后篇看完的值</p>
            </div>
          </div>

          <!-- 卡面图片 -->
          <div class="mt-8 space-y-8">
            <!-- 普通卡面 + 头像 -->
            <div class="flex justify-center items-center gap-4 flex-wrap flex-col">
              <div class="flex justify-center items-end gap-4 max-w-full">
                <a 
                  :href="coverUrl.replace('.jpg', '.png')" 
                  target="_blank"
                  class="block rounded-xl overflow-hidden shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 min-w-0 flex-shrink"
                >
                  <AssetImage 
                    :src="coverUrl"
                    :alt="card.prefix"
                    class="max-h-[300px] md:max-h-[400px] w-auto max-w-full object-contain"
                  />
                </a>
                  
                <!-- 普通立绘 (cutout) -->
                <a 
                  v-if="showNormalCutout"
                  :href="`${assetsHost}/startapp/character/member_cutout_trm/${card.assetbundleName}/normal.png`" 
                  target="_blank"
                  class="block rounded-xl overflow-hidden shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 min-w-0 flex-shrink"
                >
                  <AssetImage 
                    :src="`${assetsHost}/startapp/character/member_cutout_trm/${card.assetbundleName}/normal.png`"
                    alt="立绘"
                    class="max-h-[300px] md:max-h-[400px] w-auto max-w-full object-contain"
                  />
                </a>
              </div>
            </div>
            
            <!-- 觉醒卡面 + 立绘 -->
            <div v-if="isTrainingType" class="flex justify-center items-center gap-4 flex-wrap flex-col border-t border-base-200 pt-8">
              <div class="flex justify-center items-end gap-4 max-w-full">
                <a 
                  :href="trainedCoverUrl.replace('.jpg', '.png')" 
                  target="_blank"
                  class="block rounded-xl overflow-hidden shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 min-w-0 flex-shrink"
                >
                  <AssetImage 
                    :src="trainedCoverUrl"
                    :alt="card.prefix + ' (觉醒)'"
                    class="max-h-[300px] md:max-h-[400px] w-auto max-w-full object-contain"
                  />
                </a>
                  
                <!-- 觉醒立绘 (cutout) -->
                <a 
                  v-if="showTrainedCutout"
                  :href="`${assetsHost}/startapp/character/member_cutout_trm/${card.assetbundleName}/after_training.png`" 
                  target="_blank"
                  class="block rounded-xl overflow-hidden shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-300 min-w-0 flex-shrink"
                >
                  <AssetImage 
                    :src="`${assetsHost}/startapp/character/member_cutout_trm/${card.assetbundleName}/after_training.png`"
                    alt="觉醒立绘"
                    class="max-h-[300px] md:max-h-[400px] w-auto max-w-full object-contain"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 404 -->
    <div v-else class="text-center py-20">
      <p class="text-base-content/60 text-lg">未找到该卡片</p>
    </div>
  </div>
</template>
