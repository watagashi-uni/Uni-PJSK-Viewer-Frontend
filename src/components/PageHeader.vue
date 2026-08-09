<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <h1 class="flex items-center gap-3 text-3xl font-bold">
        <slot name="icon"></slot>
        <span>{{ title }}</span>
      </h1>
      <p class="mt-2 text-sm text-base-content/60">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="w-full shrink-0 sm:w-auto">
      <slot name="actions"></slot>
    </div>
  </header>
</template>
