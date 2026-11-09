<script setup lang="ts">
import { CalendarDays, Swords } from 'lucide-vue-next'

defineProps<{
  testEvent?: boolean
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 bg-linear-to-br from-primary/10 via-base-200 to-secondary/10 px-4 py-3 text-center">
    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-base-100/70 text-primary" aria-hidden="true">
      <Swords v-if="testEvent" class="h-6 w-6" />
      <CalendarDays v-else class="h-6 w-6" />
    </span>
    <span class="text-sm font-medium text-base-content/70">{{ testEvent ? '测试活动' : '暂无活动图片' }}</span>
  </div>
</template>
