<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { EyeOff, ListFilter } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import AssetImage from '@/components/AssetImage.vue'

const settingsStore = useSettingsStore()
const spoilerRevealed = ref(false)

const props = defineProps<{
  id: number
  title: string
  translation?: string
  isLeak?: boolean
  isLimitedTime?: boolean
  isExpired?: boolean
  assetsHost: string
  composer: string
  assetbundleName: string
  difficulties: Record<string, number>
  categories: string[]
  // 成绩数据: difficulty -> 'AP' | 'FC' | 'C' | ''
  results?: Record<string, string>
}>()

const emit = defineEmits<{
  artistClick: [artist: string]
}>()

// 类别 -> 图标文件名映射
const categoryIconMap: Record<string, string> = {
  'mv_2d': 'mv_2d',
  'mv': 'mv_3d',
  'original': 'original',
}

const matchedIcons = computed(() => {
  return Object.entries(categoryIconMap)
    .filter(([cat]) => props.categories.includes(cat))
    .map(([, icon]) => icon)
})

const difficultyOrder = ['easy', 'normal', 'hard', 'expert', 'master', 'append']

const difficultyColors: Record<string, string> = {
  easy: 'bg-[#6EE1D6] text-black',
  normal: 'bg-[#34DDFF] text-black',
  hard: 'bg-[#FBCC26] text-black',
  expert: 'bg-[#EA5B75] text-white',
  master: 'bg-[#C656EA] text-white',
  append: 'bg-[#EE78DC] text-white'
}

const difficultyLabels: Record<string, string> = {
  easy: 'EASY',
  normal: 'NORMAL',
  hard: 'HARD',
  expert: 'EXPERT',
  master: 'MASTER',
  append: 'APPEND'
}

// 成绩显示
function getResultLabel(diff: string): string {
  if (!props.results) return ''
  return props.results[diff] || ''
}

// 取消 getResultClass 因为不再使用CSS颜色背景

// 获取有效的难度列表
const availableDifficulties = computed(() => {
  return difficultyOrder.filter(diff => props.difficulties[diff] !== undefined)
})

// 缩略图 URL
const coverUrl = computed(() => {
  return `${props.assetsHost}/startapp/music/jacket/${props.assetbundleName}/${props.assetbundleName}.png`
})

function revealSpoiler() {
  spoilerRevealed.value = true
}

function selectArtist() {
  if (!props.composer) return
  emit('artistClick', props.composer)
}
</script>

<template>
  <RouterLink 
    :to="`/musics/${id}`"
    class="card bg-base-100 shadow-sm overflow-hidden group relative"
    :class="results ? 'hover:border-primary/30 border border-transparent transition-colors' : 'hover:shadow-md transition-all hover:-translate-y-1'"
  >
    <!-- 全卡片遮罩 (仅在开启遮罩模式下显示，Hover时消失) -->
    <div
      v-if="isLeak && settingsStore.maskSpoilers && !spoilerRevealed"
      class="absolute inset-0 z-50 bg-base-100/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 transition-opacity duration-300 group-hover:opacity-0 group-hover:pointer-events-none"
      @click.prevent.stop="revealSpoiler"
    >
      <EyeOff class="w-8 h-8 mb-2 text-warning" />
      <span class="font-bold text-lg mb-1">剧透内容</span>
      <span class="text-xs text-base-content/60 mb-3">鼠标悬停或点击查看</span>
      <span class="btn btn-warning btn-xs pointer-events-auto" role="button">
        取消遮罩
      </span>
    </div>
    <!-- 封面 -->
    <figure class="relative aspect-square">
      <AssetImage 
        :src="coverUrl" 
        :alt="title"
        class="w-full h-full object-cover"
        :class="results ? '' : 'group-hover:scale-105 transition-transform duration-300'"
      />
      <!-- 简单角标 (替代之前的内部遮罩) -->
      <div v-if="isLeak" class="absolute top-2 right-2 badge badge-warning shadow-md z-20">
        剧透
      </div>
      <div v-if="isLimitedTime" class="absolute top-2 left-2 badge badge-warning text-warning-content font-bold shadow-md z-20">
        期间限定
      </div>
      <div v-else-if="isExpired" class="absolute top-2 left-2 badge border-none bg-base-300 text-base-content/60 font-bold shadow-md z-20">
        已过期
      </div>
      <!-- 类别图标 -->
      <div v-if="matchedIcons.length" class="absolute bottom-1.5 left-1.5 flex gap-1 z-20">
        <img
          v-for="cat in matchedIcons"
          :key="cat"
          :src="`/img/${cat}.png`"
          :alt="cat"
          class="w-6 h-6 drop-shadow-md"
        />
      </div>
    </figure>

    <div class="card-body p-3 gap-2">
      <!-- 标题 -->
      <div class="min-h-[3rem]">
        <h3 class="font-bold text-sm leading-tight line-clamp-2" :title="title">
          {{ title }}
        </h3>
        <p v-if="translation" class="text-xs text-base-content/60 mt-0.5 line-clamp-1" :title="translation">
          {{ translation }}
        </p>
      </div>

      <!-- ID 和 作者 -->
      <div class="flex justify-between items-center text-xs text-base-content/60 mb-1">
        <span>#{{ id }}</span>
        <button
          type="button"
          class="inline-flex max-w-[68%] items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-primary transition-colors hover:border-primary/50 hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :title="`筛选 ${composer}`"
          @click.prevent.stop="selectArtist"
        >
          <ListFilter class="h-3 w-3 shrink-0" />
          <span class="truncate">{{ composer }}</span>
        </button>
      </div>

      <!-- 难度条 -->
      <div class="flex gap-1 justify-between mt-auto">
        <div 
          v-for="diff in availableDifficulties" 
          :key="diff"
          class="flex-1 flex flex-col items-center justify-center rounded py-0.5 min-w-[1.2rem]"
          :class="difficultyColors[diff]"
          :title="`${difficultyLabels[diff]}: ${difficulties[diff]}`"
        >
          <span class="text-[10px] font-black leading-none">{{ difficulties[diff] }}</span>
        </div>
      </div>

      <!-- 成绩行 -->
      <div v-if="results" class="flex gap-1 justify-between mt-1.5 h-[20px]">
        <div 
          v-for="diff in availableDifficulties" 
          :key="`r-${diff}`"
          class="flex-1 flex items-center justify-center min-w-[1.2rem]"
        >
          <img
            v-if="getResultLabel(diff) === 'AP'"
            src="/img/icon_allPerfect.png"
            alt="AP"
            class="h-full w-auto object-contain drop-shadow-sm"
          />
          <img
            v-else-if="getResultLabel(diff) === 'FC'"
            src="/img/icon_fullCombo.png"
            alt="FC"
            class="h-full w-auto object-contain drop-shadow-sm"
          />
          <img
            v-else-if="getResultLabel(diff) === 'C'"
            src="/img/icon_clear.png"
            alt="C"
            class="h-full w-auto object-contain drop-shadow-sm"
          />
          <img
            v-else
            src="/img/icon_notClear.png"
            alt="NC"
            class="h-full w-auto object-contain drop-shadow-sm opacity-50"
          />
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.card {
  contain: layout style paint;
}
</style>
