<script setup lang="ts">
import { AlertTriangle, CheckCircle2, CircleX, Info, X } from 'lucide-vue-next'

defineProps<{
  type?: 'warning' | 'info' | 'success' | 'error'
  dismissible?: boolean
}>()

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()
</script>

<template>
  <div
    role="alert"
    class="alert mb-5 animate-fade-in-up"
    :class="{
      'alert-warning': type === 'warning' || !type,
      'alert-info': type === 'info',
      'alert-success': type === 'success',
      'alert-error': type === 'error',
    }"
  >
    <Info v-if="type === 'info'" class="h-5 w-5 shrink-0" />
    <CheckCircle2 v-else-if="type === 'success'" class="h-5 w-5 shrink-0" />
    <CircleX v-else-if="type === 'error'" class="h-5 w-5 shrink-0" />
    <AlertTriangle v-else class="h-5 w-5 shrink-0" />

    <div class="min-w-0 flex-1">
      <slot />
    </div>

    <button
      v-if="dismissible"
      type="button"
      class="btn btn-sm btn-ghost btn-circle"
      aria-label="关闭"
      @click="emit('dismiss')"
    >
      <X class="h-4 w-4" />
    </button>
  </div>
</template>
