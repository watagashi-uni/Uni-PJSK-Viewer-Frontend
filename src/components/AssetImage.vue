<script setup lang="ts">
/**
 * AssetImage - 通用资源图片组件
 * 
 * 功能：
 * 1. 支持 lazy loading
 * 2. 支持跨域属性自动添加
 */

const props = withDefaults(defineProps<{
  src: string
  alt?: string
  lazy?: boolean
}>(), {
  alt: '',
  lazy: true
})
</script>

<template>
  <img 
    :src="src"
    :alt="alt"
    :loading="lazy ? 'lazy' : 'eager'"
    :crossorigin="src.startsWith('http') ? 'anonymous' : undefined"
  />
</template>
