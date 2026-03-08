<script setup lang="ts">
import { User, Star } from 'lucide-vue-next'

defineProps<{
  characterTab: 'rank' | 'stage'
  characterRows: { characterId: number; value: number }[][]
  getCharaPillColor: (id: number) => string
  getCharaIcon: (id: number) => string
}>()

const emit = defineEmits<{
  (e: 'update:characterTab', value: 'rank' | 'stage'): void
}>()

// Provide static helpers or props if needed. 
// Assuming getCharaPillColor and getCharaIcon are provided as props to keep it pure, or we can import a store/helper.
// For simplicity, let's pass them as props since they rely on master store which UserProfileView already has.
</script>

<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h3 class="text-lg font-medium mb-3">
        {{ characterTab === 'rank' ? 'CHARACTER RANK' : 'CHALLENGE LIVE STAGE' }}
      </h3>
      <!-- Tab 切换 -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          class="btn btn-sm h-9 min-h-9 text-xs sm:text-sm"
          :class="characterTab === 'rank' ? 'btn-primary' : 'btn-ghost'"
          @click="emit('update:characterTab', 'rank')"
        >
          <User class="w-3.5 h-3.5 mr-1.5" />
          角色等级
        </button>
        <button
          type="button"
          class="btn btn-sm h-9 min-h-9 text-xs sm:text-sm"
          :class="characterTab === 'stage' ? 'btn-primary' : 'btn-ghost'"
          @click="emit('update:characterTab', 'stage')"
        >
          <Star class="w-3.5 h-3.5 mr-1.5" />
          挑战Live Stage
        </button>
      </div>

      <!-- 角色网格 (pill layout, fill width) -->
      <div class="space-y-2">
        <div
          v-for="(row, rowIdx) in characterRows"
          :key="rowIdx"
          class="grid grid-cols-4 gap-2"
        >
          <div
            v-for="item in row"
            :key="item.characterId"
            class="flex items-center gap-1 rounded-full pr-3"
            :style="{ backgroundColor: getCharaPillColor(item.characterId) + '40' }"
          >
            <div class="w-9 h-9 rounded-full overflow-hidden ring-2 flex-shrink-0" :style="{ borderColor: getCharaPillColor(item.characterId) }">
              <img :src="getCharaIcon(item.characterId)" class="w-full h-full object-cover" />
            </div>
            <span class="text-sm font-bold flex-1 text-center">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
