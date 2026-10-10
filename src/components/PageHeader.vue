<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight [&_svg]:h-6 [&_svg]:w-6 [&_svg]:text-primary">
        <slot name="icon"></slot>
        <span>{{ title }}</span>
      </h1>
      <p v-if="description" class="mt-1 text-sm text-base-content/60">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="w-full shrink-0 sm:w-auto">
      <slot name="actions"></slot>
    </div>
  </header>
</template>
