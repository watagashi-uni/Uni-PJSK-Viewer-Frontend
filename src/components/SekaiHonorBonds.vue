<script setup lang="ts">
/**
 * SekaiHonorBonds - Bonds Honor 渲染组件
 * 
 * 使用 SVG + mask 合成渲染绊 honor。
 * 移植自 sekai-viewer 的 BondsDegreeImage.tsx
 */
import { ref, watch, computed, onMounted } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { getRemoteImageSize } from '@/utils/imageRetry'
import { handleSvgImageError } from '@/utils/imageRetry'

// ---------- Types ----------
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
  levels: BondsHonorLevel[]
}

interface BondsHonorWord {
  id: number
  seq: number
  bondsGroupId: number
  name: string
  assetbundleName: string
}

interface GameCharaUnit {
  id: number
  gameCharacterId: number
  unit: string
  colorCode: string
  skinColorCode: string
  skinShadowColorCode1: string
  skinShadowColorCode2: string
}

// ---------- Props ----------
const props = withDefaults(defineProps<{
  honorId: number
  honorLevel: number
  bondsHonorWordId?: number
  bondsHonorViewType?: string  // "normal" | "reverse"
  sub?: boolean
}>(), {
  bondsHonorWordId: 0,
  bondsHonorViewType: 'normal',
  sub: false
})

// ---------- Constants ----------
const settingsStore = useSettingsStore()
const assetsHost = computed(() => settingsStore.assetsHost)

const degreeFrameMap: Record<string, string> = {
  low: '/honor/frame_degree_m_1.png',
  middle: '/honor/frame_degree_m_2.png',
  high: '/honor/frame_degree_m_3.png',
  highest: '/honor/frame_degree_m_4.png',
}

const degreeFrameSubMap: Record<string, string> = {
  low: '/honor/frame_degree_s_1.png',
  middle: '/honor/frame_degree_s_2.png',
  high: '/honor/frame_degree_s_3.png',
  highest: '/honor/frame_degree_s_4.png',
}

// ---------- State ----------
const masterStore = useMasterStore()
const honor = ref<BondsHonor>()
const gameCharas = ref<GameCharaUnit[]>([])

// SD 角色图
const sdLeft = ref('')
const sdLeftWidth = ref(0)
const sdLeftHeight = ref(0)
const sdLeftOffsetX = ref(0)
const sdLeftOffsetY = ref(0)
const sdRight = ref('')
const sdRightWidth = ref(0)
const sdRightHeight = ref(0)
const sdRightOffsetX = ref(0)
const sdRightOffsetY = ref(0)

// 台词文字图
const wordImage = ref('')
const wordImageOffsetX = ref(0)
const wordImageOffsetY = ref(0)

// ---------- Helpers ----------
function parseColor(code: string | undefined): string {
  if (!code) return '#333333'
  // 已经是 #RRGGBB 格式
  if (code.startsWith('#')) return code
  // 纯 RRGGBB 格式
  return `#${code}`
}

// ---------- Computed ----------
const viewBoxWidth = computed(() => props.sub ? 180 : 380)

const frameImage = computed(() => {
  if (!honor.value) return ''
  const rarity = honor.value.honorRarity
  return props.sub ? degreeFrameSubMap[rarity] : degreeFrameMap[rarity]
})

const leftColor = computed(() => {
  if (gameCharas.value.length < 2) return '#333333'
  const idx = props.bondsHonorViewType === 'normal' ? 0 : 1
  return parseColor(gameCharas.value[idx]?.colorCode)
})

const rightColor = computed(() => {
  if (gameCharas.value.length < 2) return '#333333'
  const idx = props.bondsHonorViewType === 'normal' ? 1 : 0
  return parseColor(gameCharas.value[idx]?.colorCode)
})

const halfWidth = computed(() => props.sub ? 90 : 190)

const levelStarsNormal = computed(() => {
  if (!props.honorLevel || !honor.value || honor.value.levels.length <= 1) return 0
  return Math.min(5, props.honorLevel)
})

const levelStarsGold = computed(() => {
  if (!props.honorLevel || !honor.value || honor.value.levels.length <= 1) return 0
  return Math.max(0, props.honorLevel - 5)
})

// 使用 SVG <path> 直接绘制圆角矩形的左右两半，
// 彻底避免 url(#id) 引用（Chrome 在 vue-router 下会解析失败）。
const leftHalfPath = computed(() => {
  const r = 40
  const mid = halfWidth.value
  const x = 10
  const h = 80
  // 左半圆角矩形: 左上圆角 → 顶边到中线 → 右边到底 → 底边到左下圆角
  return `M ${x + r} 0 L ${mid} 0 L ${mid} ${h} L ${x + r} ${h} A ${r} ${r} 0 0 1 ${x} ${h - r} L ${x} ${r} A ${r} ${r} 0 0 1 ${x + r} 0 Z`
})

const rightHalfPath = computed(() => {
  const r = 40
  const mid = halfWidth.value
  const x = 10
  const h = 80
  const right = x + (props.sub ? 160 : 360)
  // 右半圆角矩形: 中线顶 → 顶边到右上圆角 → 右边到右下圆角 → 底边回中线
  return `M ${mid} 0 L ${right - r} 0 A ${r} ${r} 0 0 1 ${right} ${r} L ${right} ${h - r} A ${r} ${r} 0 0 1 ${right - r} ${h} L ${mid} ${h} Z`
})

// ---------- Logic ----------
async function loadHonor() {
  try {
  // 确保 masterStore 已初始化
  if (!masterStore.isReady) {
    await masterStore.initialize()
  }
  const bondsHonors = await masterStore.getMaster<BondsHonor>('bondsHonors')
  const bondsHonorWords = await masterStore.getMaster<BondsHonorWord>('bondsHonorWords')
  const gameCharacterUnits = await masterStore.getMaster<GameCharaUnit>('gameCharacterUnits')

  const foundHonor = bondsHonors.find(h => h.id === props.honorId)
  if (!foundHonor) return

  honor.value = foundHonor

  // 查找角色
  const chara1 = gameCharacterUnits.find(gcu => gcu.id === foundHonor.gameCharacterUnitId1)
  const chara2 = gameCharacterUnits.find(gcu => gcu.id === foundHonor.gameCharacterUnitId2)
  if (chara1 && chara2) {
    gameCharas.value = [chara1, chara2]
  }

  // 加载台词文字图
  if (props.bondsHonorWordId) {
    const word = bondsHonorWords.find(w => w.id === props.bondsHonorWordId)
    if (word) {
      const url = `${assetsHost.value}/startapp/bonds_honor/word/${word.assetbundleName}_01.png`
      wordImage.value = url
      try {
        const size = await getRemoteImageSize(url)
        wordImageOffsetX.value = (viewBoxWidth.value - size.width) / 2
        wordImageOffsetY.value = (80 - size.height) / 2
      } catch {
        wordImage.value = ''
      }
    }
  }

  // 加载角色 SD 图
  if (chara1 && chara2) {
    const leftCharaId = props.bondsHonorViewType === 'normal'
      ? chara1.gameCharacterId : chara2.gameCharacterId
    const rightCharaId = props.bondsHonorViewType === 'normal'
      ? chara2.gameCharacterId : chara1.gameCharacterId

    const leftUrl = `${assetsHost.value}/startapp/bonds_honor/character/chr_sd_${String(leftCharaId).padStart(2, '0')}_01.png`
    const rightUrl = `${assetsHost.value}/startapp/bonds_honor/character/chr_sd_${String(rightCharaId).padStart(2, '0')}_01.png`

    sdLeft.value = leftUrl
    sdRight.value = rightUrl

    try {
      const [leftSize, rightSize] = await Promise.all([
        getRemoteImageSize(leftUrl),
        getRemoteImageSize(rightUrl),
      ])

      const scale = props.sub ? 1.35 : 1
      sdLeftWidth.value = leftSize.width / scale
      sdLeftHeight.value = leftSize.height / scale
      sdLeftOffsetX.value = props.sub ? 26 : 20
      sdLeftOffsetY.value = (props.sub ? 77 : 93) - leftSize.height / scale

      sdRightWidth.value = rightSize.width / scale
      sdRightHeight.value = rightSize.height / scale
      sdRightOffsetX.value = (props.sub ? 160 : 360) - rightSize.width / scale
      sdRightOffsetY.value = (props.sub ? 78 : 93) - rightSize.height / scale
    } catch {
      // 如果获取尺寸失败，使用默认值
      sdLeftWidth.value = 80
      sdLeftHeight.value = 80
      sdRightWidth.value = 80
      sdRightHeight.value = 80
    }
  }
  } catch {
    // ignore
  }
}

// ---------- Lifecycle ----------
onMounted(() => loadHonor())

watch(() => [props.honorId, props.honorLevel, props.bondsHonorWordId, props.bondsHonorViewType, props.sub], () => {
  // 重置
  honor.value = undefined
  gameCharas.value = []
  sdLeft.value = ''
  sdRight.value = ''
  wordImage.value = ''
  loadHonor()
})
</script>

<template>
  <svg
    v-if="honor && gameCharas.length === 2"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 ${viewBoxWidth} 80`"
    class="sekai-honor-bonds"
  >
    <!-- 圆角双色背景：用两个 <path> 直接画左右半圆角矩形，无需任何 url() 引用 -->
    <path :d="leftHalfPath" :fill="leftColor" />
    <path :d="rightHalfPath" :fill="rightColor" />

    <!-- 内边框 -->
    <rect
      x="16" y="6"
      height="68"
      :width="sub ? 148 : 348"
      :rx="34"
      stroke="white"
      :stroke-width="8"
      fill-opacity="0"
    />

    <!-- 左侧角色 -->
    <image
      v-if="sdLeft"
      :href="sdLeft"
      :x="sdLeftOffsetX"
      :y="sdLeftOffsetY"
      :height="sdLeftHeight"
      :width="sdLeftWidth"
      @error="handleSvgImageError"
    />
    <!-- 右侧角色 -->
    <image
      v-if="sdRight"
      :href="sdRight"
      :x="sdRightOffsetX"
      :y="sdRightOffsetY"
      :height="sdRightHeight"
      :width="sdRightWidth"
      @error="handleSvgImageError"
    />

    <!-- 台词文字 -->
    <image
      v-if="!sub && wordImage"
      :href="wordImage"
      :x="wordImageOffsetX"
      :y="wordImageOffsetY"
      @error="handleSvgImageError"
    />

    <!-- 等级星星 (≤5) -->
    <image
      v-for="idx in levelStarsNormal"
      :key="'star-' + idx"
      href="/honor/icon_degreeLv.png"
      :x="50 + (idx - 1) * 16"
      y="64"
      :height="sub ? 14 : 16"
      :width="sub ? 14 : 16"
    />
    <!-- 等级金星 (>5) -->
    <image
      v-for="idx in levelStarsGold"
      :key="'gold-' + idx"
      href="/honor/icon_degreeLv6.png"
      :x="50 + (idx - 1) * 16"
      y="64"
      :height="sub ? 14 : 16"
      :width="sub ? 14 : 16"
    />

    <!-- 外框 -->
    <image
      v-if="frameImage"
      :href="frameImage"
      x="0" y="0"
      height="80"
      :width="viewBoxWidth"
    />
  </svg>
</template>

<style scoped>
.sekai-honor-bonds {
  width: 100%;
  height: auto;
  display: block;
}
</style>
