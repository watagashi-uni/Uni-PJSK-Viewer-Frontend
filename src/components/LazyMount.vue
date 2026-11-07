<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 只在接近可视区域时挂载内容，离开后卸载。用于榜线这类一次列出上百块称号牌子的页面：
 * 每块牌子都是带多张图片的 SVG，全部同时渲染会让 iOS Safari 因内存过高而崩溃。
 * 占位按 aspect（宽/高）保持尺寸，挂载前后布局不跳动。
 */
const props = withDefaults(defineProps<{ aspect: number; margin?: string }>(), { margin: '600px 0px' })

const el = ref<HTMLElement>()
const shown = ref(false)

type Entry = (visible: boolean) => void
const observers = new Map<string, { io: IntersectionObserver; callbacks: Map<Element, Entry> }>()
function shared(margin: string) {
  let item = observers.get(margin)
  if (!item) {
    const callbacks = new Map<Element, Entry>()
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) callbacks.get(entry.target)?.(entry.isIntersecting)
    }, { rootMargin: margin })
    item = { io, callbacks }
    observers.set(margin, item)
  }
  return item
}

onMounted(() => {
  if (!el.value) return
  if (typeof IntersectionObserver === 'undefined') { shown.value = true; return }
  const { io, callbacks } = shared(props.margin)
  callbacks.set(el.value, (visible) => { shown.value = visible })
  io.observe(el.value)
})
onBeforeUnmount(() => {
  const item = observers.get(props.margin)
  if (!item || !el.value) return
  item.io.unobserve(el.value)
  item.callbacks.delete(el.value)
})
</script>

<template>
  <div ref="el" class="lazy-mount" :style="{ aspectRatio: String(aspect) }">
    <slot v-if="shown" />
  </div>
</template>

<style scoped>
.lazy-mount { height: 100%; flex-shrink: 0; }
</style>
