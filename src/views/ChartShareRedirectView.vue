<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const chartPreviewHost = 'https://mmw-chart.unipjsk.com'
const chartFileHost = 'https://charts-preview.unipjsk.com'

const shareId = computed(() => String(route.params.id || '').trim())
const waveOffsetMs = computed(() => {
  const rawValue = Array.isArray(route.query.offset) ? route.query.offset[0] : route.query.offset
  const parsed = Number(rawValue ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
})

const targetUrl = computed(() => {
  if (!shareId.value) return ''

  const target = new URL('/', chartPreviewHost)
  target.searchParams.set('sus', `${chartFileHost}/api/chart-share/${encodeURIComponent(shareId.value)}/chart.sus`)
  target.searchParams.set('bgm', `${chartFileHost}/api/chart-share/${encodeURIComponent(shareId.value)}/bgm.mp3`)
  if (waveOffsetMs.value !== 0) {
    target.searchParams.set('offset', String(-waveOffsetMs.value))
  }
  return target.toString()
})

onMounted(() => {
  if (targetUrl.value) {
    window.location.replace(targetUrl.value)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6 text-center">
    <div class="max-w-md space-y-3">
      <h1 class="text-2xl font-bold">正在跳转谱面预览</h1>
      <p class="text-base-content/60">
        如果没有自动跳转，请点击下方按钮继续。
      </p>
      <a
        v-if="targetUrl"
        :href="targetUrl"
        class="btn btn-primary"
      >
        打开预览
      </a>
      <p v-else class="text-error">
        分享链接无效
      </p>
    </div>
  </div>
</template>
