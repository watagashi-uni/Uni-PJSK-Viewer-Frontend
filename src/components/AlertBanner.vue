<script setup lang="ts">
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
    class="alert shadow-sm mb-5 animate-fade-in-up"
    :class="{
      'alert-warning': type === 'warning' || !type,
      'alert-info': type === 'info',
      'alert-success': type === 'success',
      'alert-error': type === 'error',
    }"
  >
    <svg v-if="type === 'warning' || !type" xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <svg v-else-if="type === 'info'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    
    <div class="flex-1">
      <slot />
    </div>
    
    <button 
      v-if="dismissible" 
      class="btn btn-sm btn-ghost btn-circle"
      @click="emit('dismiss')"
    >
      ✕
    </button>
  </div>
</template>
