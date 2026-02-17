<script setup lang="ts">
import { useMasterStore } from '@/stores/master'

const masterStore = useMasterStore()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="masterStore.isLoading" 
        class="fixed inset-0 bg-base-100/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div class="text-center animate-fade-in-up">
          <!-- Loading Spinner -->
          <span class="loading loading-spinner loading-lg text-primary"></span>
          
          <!-- Loading Text -->
          <p class="mt-4 text-base-content/70 text-lg font-medium">
            正在加载数据...
          </p>
          
          <!-- Current File -->
          <p v-if="masterStore.loadingFile" class="text-sm text-base-content/50 mt-1">
            {{ masterStore.loadingFile }}.json
          </p>
          
          <!-- Progress Dots Animation -->
          <div class="flex justify-center gap-1 mt-4">
            <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0ms;"></span>
            <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 150ms;"></span>
            <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 300ms;"></span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
