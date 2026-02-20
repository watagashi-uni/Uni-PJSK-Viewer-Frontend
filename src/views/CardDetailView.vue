<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import AssetImage from '@/components/AssetImage.vue'

interface Card {
  id: number
  characterId: number
  cardRarityType: string
  attr: string
  prefix: string
  assetbundleName: string
  releaseAt: number
  skillId: number
  cardSkillName: string
  cardParameters: { cardParameterType: string; power: number }[]
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
  activateEffectDuration?: number
  activateEffectValue: number
}

interface SkillEnhance {
  activateEffectValue: number
}

interface SkillEffect {
  id: number
  skillEffectDetails: SkillEffectDetail[]
  skillEnhance: SkillEnhance
}

interface Skill {
  id: number
  descriptionSpriteName: string
  description: string
  skillEffects: SkillEffect[]
}

const route = useRoute()
const masterStore = useMasterStore()

const cardId = computed(() => Number(route.params.id))
const card = ref<Card | null>(null)
const character = ref<Character | null>(null)
const skill = ref<Skill | null>(null)
const resourceBoxes = ref<ResourceBox[]>([])
const gachaCeilExchangeSummaries = ref<GachaCeilExchangeSummary[]>([])
const isLoading = ref(true)
const isCardTypeLoading = ref(true) // 卡片类型加载状态
const showNormalCutout = ref(true)
const showTrainedCutout = ref(true)

// 卡片限定类型: false=普通, 'limited'=普限, 'fes'=fes限
const limitType = ref<false | 'limited' | 'fes'>(false)

const assetsHost = 'https://assets.unipjsk.com'

// 稀有度星星数量
const starCount = computed(() => {
  if (!card.value) return 0
  const map: Record<string, number> = {
    rarity_1: 1,
    rarity_2: 2,
    rarity_3: 3,
    rarity_4: 4,
    rarity_birthday: 1,
  }
  return map[card.value.cardRarityType] || 0
})

// 是否为觉醒卡
const hasTraining = computed(() => {
  return card.value?.cardRarityType === 'rarity_3' || card.value?.cardRarityType === 'rarity_4'
})

// 根据cardId找到对应的resourceBoxId
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

// 判断卡片限定类型
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

// 综合力
const totalPower = computed(() => {
  if (!card.value?.cardParameters) return { perf: 0, tech: 0, stam: 0, total: 0 }
  const perf = card.value.cardParameters.find(p => p.cardParameterType === 'param1')?.power || 0
  const tech = card.value.cardParameters.find(p => p.cardParameterType === 'param2')?.power || 0
  const stam = card.value.cardParameters.find(p => p.cardParameterType === 'param3')?.power || 0
  return { perf, tech, stam, total: perf + tech + stam }
})

// 解析技能描述
const parsedDescription = computed(() => {
  if (!skill.value) return '-'
  
  let description = skill.value.description
  const placeholderRegex = /\{\{(\d+);([^}]+)\}\}/g
  
  return description.replace(placeholderRegex, (match, idStr, type) => {
    const id = parseInt(idStr)
    const effect = skill.value?.skillEffects.find(e => e.id === id)
    
    if (!effect) return match
    
    const details = effect.skillEffectDetails
    let values: (string | number)[] = []
    
    if (type === 'd') {
      values = details.map(d => d.activateEffectDuration || 0)
    } else if (type === 'e') {
      values = [effect.skillEnhance.activateEffectValue]
    } else if (type === 'm') {
      values = details.map(d => d.activateEffectValue + 5 * effect.skillEnhance.activateEffectValue)
    } else {
      values = details.map(d => d.activateEffectValue)
    }
    
    // 如果所有值相同，只显示一个
    const uniqueValues = Array.from(new Set(values))
    return uniqueValues.join('/')
  })
})

const coverUrl = computed(() => {
  if (!card.value) return ''
  return `${assetsHost}/startapp/character/member/${card.value.assetbundleName}/card_normal.jpg`
})

const trainedCoverUrl = computed(() => {
  if (!card.value) return ''
  return `${assetsHost}/startapp/character/member/${card.value.assetbundleName}/card_after_training.jpg`
})

// 格式化发布时间（包含具体时分秒）
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

// 后台加载卡片类型数据（用于判断限定卡类型）
async function loadCardTypeData() {
  isCardTypeLoading.value = true
  try {
    const [resourceBoxesData, gachaCeilExchangeSummariesData] = await Promise.all([
      masterStore.getMaster<ResourceBox>('resourceBoxes'),
      masterStore.getMaster<GachaCeilExchangeSummary>('gachaCeilExchangeSummaries'),
    ])
    resourceBoxes.value = resourceBoxesData
    gachaCeilExchangeSummaries.value = gachaCeilExchangeSummariesData
    
    // 计算当前卡片的限定类型
    if (card.value) {
      limitType.value = getCardLimitType(card.value.id)
    }
  } catch (error) {
    console.error('加载卡片类型数据失败:', error)
  } finally {
    isCardTypeLoading.value = false
  }
}

// 加载基本数据
async function loadData() {
  isLoading.value = true
  showNormalCutout.value = true
  showTrainedCutout.value = true
  try {
    // 先加载基本数据（快速渲染）
    const [cardsData, charactersData, skillsData] = await Promise.all([
      masterStore.getMaster<Card>('cards'),
      masterStore.getMaster<Character>('gameCharacters'),
      masterStore.getMaster<Skill>('skills'),
    ])
    
    card.value = cardsData.find(c => c.id === cardId.value) || null
    
    if (card.value) {
      character.value = charactersData.find(c => c.id === card.value!.characterId) || null
      skill.value = skillsData.find(s => s.id === card.value!.skillId) || null
    }
  } catch (error) {
    console.error('加载卡片详情失败:', error)
  } finally {
    isLoading.value = false
  }
  
  // 后台加载卡片类型数据（不阻塞页面渲染）
  loadCardTypeData()
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
      <div class="card bg-base-100 shadow-lg max-w-4xl mx-auto animate-fade-in-up overflow-hidden">
        <div class="card-body">
          <!-- 标题区域 -->
          <div class="text-center mb-6 pb-4 border-b border-base-200">
            <h1 class="text-2xl font-bold flex items-center justify-center gap-3">
              <img 
                :src="`/newcard/attr_icon_${card.attr}.png`" 
                :alt="card.attr"
                class="w-9 h-9"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              {{ card.prefix }}
            </h1>
            <p class="text-lg text-base-content/70 mt-1">
              {{ character ? (character.firstName || '') + character.givenName : '' }}
            </p>
            
            <!-- 星级 -->
            <div class="flex justify-center gap-1 mt-3">
              <template v-if="card.cardRarityType === 'rarity_birthday'">
                🎂
              </template>
              <template v-else>
                <span v-for="i in starCount" :key="i" class="text-yellow-400 text-xl">⭐</span>
              </template>
            </div>
          </div>

          <!-- 信息区域 -->
          <div class="grid md:grid-cols-2 gap-6">
            <!-- 卡片信息 -->
            <div class="bg-base-200 rounded-xl p-5">
              <h3 class="font-semibold text-primary mb-4 flex items-center gap-2">
                📝 卡片信息
              </h3>
              <div class="space-y-2 text-sm">
                <p><span class="font-medium">卡片类型：</span>{{ cardTypeLabel }}</p>
                <p><span class="font-medium">实装时间：</span>{{ card?.releaseAt ? formatDate(card.releaseAt) : '-' }}</p>
                <p><span class="font-medium">技能名：</span>{{ card?.cardSkillName || '-' }}</p>
                <p><span class="font-medium">技能效果：</span>{{ parsedDescription }}</p>
              </div>
            </div>
            
            <!-- 能力值 -->
            <div class="bg-base-200 rounded-xl p-5">
              <h3 class="font-semibold text-primary mb-4 flex items-center gap-2">
                ⚡ 能力值
              </h3>
              <p class="text-xs text-base-content/60 mb-3">满级 已特训 未突破 未看剧情的值</p>
              <div class="flex flex-wrap gap-3">
                <div class="bg-base-100 rounded-lg p-3 text-center min-w-20">
                  <div class="text-xs text-base-content/60">Performance</div>
                  <div class="text-lg font-bold text-primary">{{ totalPower.perf }}</div>
                </div>
                <div class="bg-base-100 rounded-lg p-3 text-center min-w-20">
                  <div class="text-xs text-base-content/60">Technique</div>
                  <div class="text-lg font-bold text-primary">{{ totalPower.tech }}</div>
                </div>
                <div class="bg-base-100 rounded-lg p-3 text-center min-w-20">
                  <div class="text-xs text-base-content/60">Stamina</div>
                  <div class="text-lg font-bold text-primary">{{ totalPower.stam }}</div>
                </div>
                <div class="bg-gradient-to-br from-primary to-success text-white rounded-lg p-3 text-center min-w-20">
                  <div class="text-xs opacity-90">综合力</div>
                  <div class="text-lg font-bold">{{ totalPower.total }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 卡面图片 -->
          <div class="mt-8 space-y-8">
            <!-- 普通卡面 + 立绘 -->
            <div class="flex justify-center items-end gap-4 flex-wrap md:flex-nowrap">
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
                  no-fallback
                  @failed="showNormalCutout = false"
                />
              </a>
            </div>
            
            <!-- 觉醒卡面 + 立绘 -->
            <div v-if="hasTraining" class="flex justify-center items-end gap-4 flex-wrap md:flex-nowrap">
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
                  no-fallback
                  @failed="showTrainedCutout = false"
                />
              </a>
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
