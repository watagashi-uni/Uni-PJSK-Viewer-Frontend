<script setup lang="ts">
/**
 * AssetImage - 通用资源图片组件
 * 
 * 功能：
 * 1. 支持 placeholder 兜底图
 * 2. 支持 lazy loading
 * 3. 支持自定义错误处理（emit "failed" 事件）
 */

const props = withDefaults(defineProps<{
  src: string
  alt?: string
  fallback?: string
  lazy?: boolean
  noFallback?: boolean  // 如果为 true，不显示 placeholder，而是触发 failed 事件
}>(), {
  alt: '',
  fallback: '/placeholder.png',
  lazy: true,
  noFallback: false
})

const emit = defineEmits<{
  failed: []  // 加载失败时触发
}>()

function handleError(e: Event) {
  const img = e.target as HTMLImageElement
  if (props.noFallback) {
    emit('failed')
  } else {
    // 避免 fallback 自身出错时死循环
    if (!img.src.endsWith(props.fallback)) {
      img.src = props.fallback
    }
  }
}
</script>

<template>
  <img 
    :src="src"
    :alt="alt"
    :loading="lazy ? 'lazy' : 'eager'"
    @error="handleError"
  />
</template>
