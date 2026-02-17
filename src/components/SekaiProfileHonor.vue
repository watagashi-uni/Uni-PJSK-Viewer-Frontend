<script setup lang="ts">
/**
 * SekaiProfileHonor - Honor 渲染入口组件
 * 
 * 根据 profileHonorType 分发到 SekaiHonor 或 SekaiHonorBonds。
 * 直接接受游戏 API 返回的 userProfileHonor 数据。
 */
import SekaiHonor from './SekaiHonor.vue'
import SekaiHonorBonds from './SekaiHonorBonds.vue'
import { computed } from 'vue'

export interface ProfileHonorData {
  bondsHonorViewType: string
  bondsHonorWordId: number
  honorId: number
  honorLevel: number
  profileHonorType: string
  seq: number
  progress?: number // Allow progress in data
}

const props = defineProps<{
  data: ProfileHonorData
  forceSub?: boolean
  userHonorMissions?: Array<{ honorMissionType: string; progress: number }>
  progress?: number // Allow progress override
}>()

const isBonds = computed(() => props.data.profileHonorType === 'bonds')
const isSub = computed(() => props.forceSub || props.data.seq !== 1)
</script>

<template>
  <SekaiHonorBonds
    v-if="isBonds"
    :honor-id="data.honorId"
    :honor-level="data.honorLevel"
    :bonds-honor-word-id="data.bondsHonorWordId"
    :bonds-honor-view-type="data.bondsHonorViewType"
    :sub="isSub"
  />
  <SekaiHonor
    v-else
    :honor-id="data.honorId"
    :honor-level="data.honorLevel"
    :sub="isSub"
    :user-honor-missions="userHonorMissions"
    :progress="props.progress ?? data.progress"
  />
</template>
