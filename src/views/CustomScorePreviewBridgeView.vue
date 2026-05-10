<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const kindText = computed(() => (route.query.kind === '3d' ? '3D 预览' : '平面预览'))
</script>

<template>
  <main class="min-h-screen bg-[#1a1a2e] text-white grid place-items-center p-6">
    <div class="text-center">
      <div class="text-xl font-bold mb-2">正在生成{{ kindText }}</div>
      <div class="text-sm text-white/65">请稍候，生成完成后会自动跳转。</div>
    </div>
  </main>
</template>
