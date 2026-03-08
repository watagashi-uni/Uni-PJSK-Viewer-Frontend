<script setup lang="ts">
import { computed } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import type { ProfileData } from '@/types/profile'
import SekaiProfileHonor from '@/components/SekaiProfileHonor.vue'
import AssetImage from '@/components/AssetImage.vue'

const props = defineProps<{
  profileData: ProfileData
  deckCards: any[]
  showUserId: boolean
  assetsHost: string
}>()

const emit = defineEmits<{
  (e: 'toggle-user-id'): void
}>()

function getHonor(seq: number) {
  return props.profileData.userProfileHonors?.find(h => h.seq === seq) || null
}

const leaderCard = computed(() => {
  if (props.deckCards.length > 0 && props.deckCards[0]?.masterCard) {
    const dc = props.deckCards[0]
    return {
      assetbundleName: dc.masterCard.assetbundleName,
      trained: dc.trained
    }
  }
  return null
})
</script>

<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <div class="flex items-center gap-4 mb-4">
        <!-- Leader Avatar based on first deck card -->
        <div v-if="leaderCard" class="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 shadow-sm rounded-full overflow-hidden border-2 border-primary/20 bg-base-200">
          <AssetImage
            :src="`${assetsHost}/startapp/thumbnail/chara/${leaderCard.assetbundleName}_${leaderCard.trained ? 'after_training' : 'normal'}.png`"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-2xl font-bold truncate">{{ profileData.user.name }}</h2>
          <div class="flex items-center gap-2 mt-1 flex-nowrap">
            <span class="badge badge-primary flex-shrink-0">等级 {{ profileData.user.rank }}</span>
            <button
              class="btn btn-xs btn-ghost gap-1 min-w-0 flex-shrink"
              @click="emit('toggle-user-id')"
            >
              <Eye v-if="showUserId" class="w-3 h-3 flex-shrink-0" />
              <EyeOff v-else class="w-3 h-3 flex-shrink-0" />
              <span class="truncate">id:{{ showUserId ? profileData.user.userId : '保密' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 称号 (3-in-a-row with placeholders) -->
      <div class="flex items-center gap-1 h-10 sm:h-12 mb-4 max-w-full">
        <template v-for="i in 3" :key="i">
          <div v-if="getHonor(i)" class="h-full shrink min-w-0">
            <SekaiProfileHonor
              :data="getHonor(i)!"
              :user-honor-missions="profileData.userHonorMissions"
              class="h-full w-auto max-w-full block"
            />
          </div>
          <div v-else class="h-full shrink min-w-0">
            <img
              v-if="i === 1"
              src="/honor/frame_degree_m_1.png"
              class="h-full w-auto max-w-full opacity-50"
              alt="empty-slot-main"
            />
            <img
              v-else
              src="/honor/frame_degree_s_1.png"
              class="h-full w-auto max-w-full opacity-50"
              alt="empty-slot-sub"
            />
          </div>
        </template>
      </div>

      <!-- Twitter ID -->
      <div class="flex items-center gap-2 text-sm mb-1">
        <span class="font-medium">𝕏</span>
        <span v-if="profileData.userProfile.twitterId?.trim()">@{{ profileData.userProfile.twitterId.trim() }}</span>
        <span v-else class="text-base-content/40">未设置</span>
      </div>
      <!-- 签名 -->
      <div class="text-sm text-base-content/70 italic">
        <template v-if="profileData.userProfile.word">「{{ profileData.userProfile.word }}」</template>
        <span v-else class="text-base-content/40 not-italic">暂无签名</span>
      </div>
    </div>
  </div>
</template>
