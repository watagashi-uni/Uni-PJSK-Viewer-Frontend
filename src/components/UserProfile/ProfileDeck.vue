<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import SekaiCard from '@/components/SekaiCard.vue'

defineProps<{
  deckName: string
  deckCards: any[]
}>()
</script>

<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h3 class="text-lg font-medium mb-3 flex items-center gap-2">
        <Star class="w-5 h-5 text-primary" />
        卡组 - {{ deckName }}
      </h3>
      <div class="grid grid-cols-5 gap-1 sm:gap-2">
        <div
          v-for="dc in deckCards"
          :key="dc.cardId"
          class="text-center"
        >
          <RouterLink
            :to="`/cards/${dc.cardId}`"
            class="block hover:scale-105 transition-transform"
          >
            <SekaiCard
              :card="dc.masterCard"
              :trained="dc.trained"
              :master-rank="dc.userCard?.masterRank || 0"
            />
          </RouterLink>
          <div class="text-[10px] sm:text-xs mt-1 truncate">
            <span class="font-medium">Lv.{{ dc.userCard?.level || '?' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
