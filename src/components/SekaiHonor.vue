<script setup lang="ts">
/**
 * SekaiHonor - Normal Honor 渲染组件
 * 
 * 使用 SVG 多图层合成渲染 honor 图像。
 * 移植自 sekai-viewer 的 DegreeImage.tsx
 */
import { ref, watch, computed, onMounted } from 'vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { handleSvgImageError } from '@/utils/imageRetry'
import { getHonorLevelAppearance } from '@/utils/honorAppearance'

// ---------- Types ----------
interface HonorLevel {
  honorId?: number
  level: number
  bonus: number
  description: string
  startAt?: number
  assetbundleName?: string
  honorRarity?: string
}

interface HonorInfo {
  id: number
  seq: number
  groupId: number
  honorRarity?: string
  name: string
  assetbundleName?: string
  startAt?: number
  levels: HonorLevel[]
  honorTypeId?: number
  honorMissionType?: string
}

interface HonorGroup {
  id: number
  name: string
  honorType: string
  backgroundAssetbundleName?: string
  frameName?: string
  isMedalDisplayed?: boolean
}

// ---------- Props ----------
const props = withDefaults(defineProps<{
  honorId: number
  honorLevel: number
  sub?: boolean
  backgroundAssetbundleName?: string
  wordAssetbundleName?: string
  userHonorMissions?: Array<{ honorMissionType: string; progress: number }>
  progress?: number
}>(), {
  sub: false,
  userHonorMissions: () => [],
  progress: undefined
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
const honor = ref<HonorInfo>()
const honorGroup = ref<HonorGroup>()
const degreeImage = ref('')
const degreeFrameImage = ref('')
const degreeRankImage = ref('')
const degreeLevelIcon = ref('/honor/icon_degreeLv.png')
const failedCustomImage = ref('')
const isDrawHonorLevel = ref(true)
const isWorldLinkDegree = ref(false)
const isLiveMaster = ref(false)
const liveMasterProgress = ref(0)

// ---------- Computed ----------
const viewBoxWidth = computed(() => props.sub ? 180 : 380)
const honorRarity = computed(() => honor.value?.honorRarity ||
  honor.value?.levels.find(level => level.level === props.honorLevel)?.honorRarity)

const characterArt = computed(() => {
  const rarity = ['low', 'middle', 'high', 'highest'].indexOf(honorRarity.value ?? '') + 1
  if (honorGroup.value?.honorType !== 'character' || !props.backgroundAssetbundleName ||
    (!props.sub && (!rarity || !props.wordAssetbundleName))) return null
  const root = `${assetsHost.value}/startapp`
  const background = `${root}/honor_background/${props.backgroundAssetbundleName}/degree_${props.sub ? 'sub' : 'main'}.png`
  const word = props.sub ? '' : `${root}/honor_word/${props.wordAssetbundleName}_0${rarity}.png`
  return { background, word }
})

const customArt = computed(() => {
  const art = characterArt.value
  return art && failedCustomImage.value !== `${art.background}|${art.word}` ? art : null
})

function onCustomImageError(event: Event) {
  const art = customArt.value
  const href = (event.currentTarget as SVGImageElement).getAttribute('href')
  if (art && (href === art.background || href === art.word)) {
    failedCustomImage.value = `${art.background}|${art.word}`
  }
}

const effectiveAssetbundleName = computed(() => {
  if (!honor.value) return ''
  if (honor.value.assetbundleName) return honor.value.assetbundleName
  // 尝试从 levels 获取
  const lvl = honor.value.levels.find(l => l.level === props.honorLevel)
  if (lvl?.assetbundleName) return lvl.assetbundleName
  if (honor.value.levels[0]?.assetbundleName) return honor.value.levels[0].assetbundleName
  return ''
})

const levelAppearance = computed(() => {
  const level = isLiveMaster.value || !isDrawHonorLevel.value ? 0 : props.honorLevel
  if (honorGroup.value?.honorType === 'birthday' && honorGroup.value.frameName) {
    return { normalDots: Math.min(5, level), upgradedDots: 0, medalTier: 0 }
  }
  return getHonorLevelAppearance(level, honorGroup.value?.isMedalDisplayed === true)
})

const medalImage = computed(() => levelAppearance.value.medalTier
  ? `${assetsHost.value}/startapp/honor_medal/medal/icon_degree_medal${levelAppearance.value.medalTier}.png`
  : '')

const starStartX = computed(() => {
  if (honorGroup.value?.honorType === 'birthday') return 180
  return 50
})

const liveMasterStars = computed(() => {
  if (!isLiveMaster.value) return []
  // 这里的算法根据 Python 代码似乎是 (progress // 10) % 10 + 1 ?
  // Python: star_count = (progress // 10) % 10 + 1
  // Wait, Python: (progress // 10) % 10 + 1. 
  // Example: 629 -> 62 // 10 = 6? No. 629 // 10 = 62. 62 % 10 = 2. 2+1=3 stars.
  // Example: 598 -> 59 % 10 = 9. 9+1=10 stars.
  const starCount = Math.floor(liveMasterProgress.value / 10) % 10 + 1
  
  const starsPos = [
    { x: 223, y: 68 - 8 }, { x: 216, y: 56 - 8 }, { x: 208, y: 42 - 8 }, { x: 216, y: 27 - 8 }, { x: 223, y: 13 - 8 },
    { x: 295, y: 68 - 8 }, { x: 304, y: 56 - 8 }, { x: 311, y: 42 - 8 }, { x: 303, y: 27 - 8 }, { x: 295, y: 13 - 8 }
  ]
  
  return starsPos.map((pos, index) => ({
    x: pos.x,
    y: pos.y,
    isActive: starCount > index
  }))
})

// ---------- Logic ----------
async function loadHonor() {
  try {
    // 确保 masterStore 已初始化
    if (!masterStore.isReady) {
      await masterStore.initialize()
    }
    const honors = await masterStore.getMaster<HonorInfo>('honors')
    const honorGroups = await masterStore.getMaster<HonorGroup>('honorGroups')

    const foundHonor = honors.find(h => h.id === props.honorId)
    if (!foundHonor) return

    honor.value = foundHonor
    const foundGroup = honorGroups.find(hg => hg.id === foundHonor.groupId)
    honorGroup.value = foundGroup

    // 判断是否为 Live Master (FC/AP) 称号
    // 逻辑：没有根 assetbundleName，但有 honorMissionType
    isLiveMaster.value = !foundHonor.assetbundleName && !!foundHonor.honorMissionType
    
    if (isLiveMaster.value) {
      if (props.progress !== undefined) {
        liveMasterProgress.value = props.progress
      } else {
        const mission = props.userHonorMissions?.find(m => m.honorMissionType === foundHonor.honorMissionType)
        liveMasterProgress.value = mission?.progress || 0
      }
      isDrawHonorLevel.value = false // Live Master 不画普通星星
    } else {
      // 普通称号星星逻辑
      if (foundGroup) {
        const noLevelTypes = ['event', 'rank_match', 'achievement']
        const isAchievementException = foundGroup.honorType === 'achievement' &&
          [33, 36, 37, 52, 72, 73, 74, 75, 76, 77].includes(foundGroup.id)
        const isBirthdayWithFrame = foundGroup.honorType === 'birthday' && !!foundGroup.frameName
  
        isDrawHonorLevel.value = !noLevelTypes.includes(foundGroup.honorType) ||
          isAchievementException || isBirthdayWithFrame
      }
    }

    // 检查 WorldLink degree
    const abn = effectiveAssetbundleName.value
    isWorldLinkDegree.value = /.*(_cp\d)$/.test(abn)

    // 构建各部分图片
    buildDegreeImage(foundHonor, foundGroup)
    buildFrameImage(foundGroup)
    buildRankImage(foundHonor, foundGroup)
    buildLevelIcon(foundHonor, foundGroup)
  } catch {
    // ignore
  }
}

function buildDegreeImage(_h: HonorInfo, group?: HonorGroup) {
  const suffix = props.sub ? 'sub' : 'main'
  if (group?.honorType === 'rank_match' && group.backgroundAssetbundleName) {
    degreeImage.value = `${assetsHost.value}/startapp/rank_live/honor/${group.backgroundAssetbundleName}/degree_${suffix}.png`
  } else if (group?.backgroundAssetbundleName) {
    degreeImage.value = `${assetsHost.value}/startapp/honor/${group.backgroundAssetbundleName}/degree_${suffix}.png`
  } else if (effectiveAssetbundleName.value) {
    degreeImage.value = `${assetsHost.value}/startapp/honor/${effectiveAssetbundleName.value}/degree_${suffix}.png`
  }
}

function buildFrameImage(group?: HonorGroup) {
  const suffix = props.sub ? 's' : 'm'
  const rarity = honorRarity.value
  if (!rarity) return

  // Live Master 可能会有 frameName? Python 没明确说，但 honors.json 可能会有
  // 如果是 Live Master，Python 逻辑是：如果有 honorType='rank_match' 特殊逻辑...
  // 普通 Live Master 使用默认 frame (based on rarity)

  if (group?.frameName) {
    if (rarity === 'highest') {
      degreeFrameImage.value = `${assetsHost.value}/startapp/honor_frame/${group.frameName}/frame_degree_${suffix}_4.png`
    } else if (rarity === 'high') {
      degreeFrameImage.value = `${assetsHost.value}/startapp/honor_frame/${group.frameName}/frame_degree_${suffix}_3.png`
    } else if (group.honorType === 'birthday' && rarity === 'middle') {
      degreeFrameImage.value = `${assetsHost.value}/startapp/honor_frame/${group.frameName}/frame_degree_${suffix}_2.png`
    } else {
      degreeFrameImage.value = props.sub ? (degreeFrameSubMap[rarity] ?? '') : (degreeFrameMap[rarity] ?? '')
    }
  } else {
    degreeFrameImage.value = props.sub ? (degreeFrameSubMap[rarity] ?? '') : (degreeFrameMap[rarity] ?? '')
  }
}

function buildRankImage(h: HonorInfo, group?: HonorGroup) {
  const abn = effectiveAssetbundleName.value
  const suffix = props.sub ? 'sub' : 'main'
  
  if (isLiveMaster.value) {
    // Live Master 强制使用 scroll.png
    degreeRankImage.value = `${assetsHost.value}/startapp/honor/${abn}/scroll.png` // Main/Sub 都是 scroll.png
  } else if (group?.honorType === 'event' && group.backgroundAssetbundleName) {
    degreeRankImage.value = `${assetsHost.value}/startapp/honor/${abn}/rank_${suffix}.png`
  } else if (group?.honorType === 'rank_match') {
    degreeRankImage.value = `${assetsHost.value}/startapp/rank_live/honor/${abn}/${suffix}.png`
  } else if (h.honorMissionType) {
    // 可能是旧逻辑 fallback
    degreeRankImage.value = `${assetsHost.value}/startapp/honor/${abn}/scroll.png`
  }
}

function buildLevelIcon(h: HonorInfo, group?: HonorGroup) {
  if (group?.honorType === 'birthday' && h.honorRarity && group.frameName) {
    const rarityList = ['low', 'middle', 'high', 'highest']
    const rarityIndex = rarityList.indexOf(h.honorRarity) + 1
    degreeLevelIcon.value = `${assetsHost.value}/startapp/honor_frame/${group.frameName}/frame_degree_level_${rarityIndex}.png`
  } else {
    degreeLevelIcon.value = '/honor/icon_degreeLv.png'
  }
}

// ---------- Lifecycle ----------
onMounted(() => loadHonor())

watch(() => [props.honorId, props.honorLevel, props.sub, props.userHonorMissions], () => {
  // 重置
  degreeImage.value = ''
  degreeFrameImage.value = ''
  degreeRankImage.value = ''
  loadHonor()
})
</script>

<template>
  <svg
    v-if="honor"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 ${viewBoxWidth} 80`"
    class="sekai-honor"
  >
    <!-- 背景图 -->
    <image
      v-if="customArt"
      :key="customArt.background"
      :href="customArt.background"
      x="0" y="0"
      height="80"
      :width="viewBoxWidth"
      @error="onCustomImageError"
    />
    <image
      v-else
      :key="degreeImage"
      :href="degreeImage"
      x="0" y="0"
      height="80"
      :width="viewBoxWidth"
      @error="handleSvgImageError"
    />
    <!-- 边框 -->
    <image
      v-if="customArt?.word"
      :key="customArt.word"
      :href="customArt.word"
      x="0" y="0"
      height="80"
      :width="viewBoxWidth"
      @error="onCustomImageError"
    />
    <image
      v-if="degreeFrameImage"
      :href="degreeFrameImage"
      x="0" y="0"
      height="80"
      :width="viewBoxWidth"
      @error="handleSvgImageError"
    />
    
    <!-- Live Master 内容 -->
    <template v-if="isLiveMaster">
      <!-- Scroll (Rank Image) - Main: 218,3 (Sub: 40,3) -->
      <image
        v-if="degreeRankImage"
        :href="degreeRankImage"
        :x="sub ? 40 : 218"
        y="3"
        @error="handleSvgImageError"
      />
      <!-- Progress Text - Main: 270,58 (Sub: 90,58) -->
      <text
        :x="sub ? 90 : 270"
        y="70"
        fill="white"
        font-size="20"
        font-weight="bold"
        text-anchor="middle"
        style="text-shadow: 0px 0px 4px rgba(0,0,0,0.5);"
      >
        {{ liveMasterProgress }}
      </text>
      <!-- Stars (Main only) -->
      <template v-if="!sub">
        <image 
          v-for="(star, idx) in liveMasterStars"
          :key="idx"
          :href="star.isActive ? '/honor/live_master_honor_star_1.png' : '/honor/live_master_honor_star_2.png'"
          :x="star.x"
          :y="star.y"
        />
      </template>
    </template>

    <!-- 普通称号逻辑 -->
    <template v-else>
      <!-- 等级星星 (≤5) -->
      <image
        v-for="idx in levelAppearance.normalDots"
        :key="'star-' + idx"
        :href="degreeLevelIcon"
        :x="starStartX + (idx - 1) * 16"
        y="64"
        height="16"
        width="16"
      />
      <!-- 等级金星 (>5) -->
      <image
        v-for="idx in levelAppearance.upgradedDots"
        :key="'gold-' + idx"
        href="/honor/icon_degreeLv6.png"
        :x="50 + (idx - 1) * 16"
        y="64"
        height="16"
        width="16"
      />
      <!-- 排名/装饰 -->
      <image
        v-if="degreeRankImage"
        :href="degreeRankImage"
        :x="isWorldLinkDegree ? 0 : (sub ? 11 : 200)"
        :y="isWorldLinkDegree ? 0 : (sub ? 40 : 0)"
        :width="isWorldLinkDegree ? viewBoxWidth : (sub ? 158 : 180)"
        :height="isWorldLinkDegree ? 80 : (sub ? 40 : 78)"
        @error="handleSvgImageError"
      />
      <image
        v-if="medalImage"
        :key="medalImage"
        :href="medalImage"
        x="0" y="0"
        :width="sub ? 52 : 64"
        :height="sub ? 58 : 72"
        @error="handleSvgImageError"
      />
    </template>
  </svg>
</template>

<style scoped>
.sekai-honor {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: auto;
  display: block;
}
</style>
