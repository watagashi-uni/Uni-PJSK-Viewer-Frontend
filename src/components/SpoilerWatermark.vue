<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { unreleasedOnScreen } from '@/composables/useSpoilerWatermark'
import { detectSpoilerLang, SPOILER_WATERMARK } from '@/utils/spoilerLocale'

// 剧透水印：开启剧透后，在会列出未公开内容的列表页，以及正在显示未公开内容的详情页、剧情阅读器上，
// 铺满整个视口的斜向文字（一张 SVG 平铺背景，不生成大量节点）。
// 放进浏览器顶层（popover），因此盖在弹窗和全屏播放器之上；不拦截点击。
const settings = useSettingsStore()
const route = useRoute()
const visible = computed(() => settings.showSpoilers && (route.meta.spoilerList === true || unreleasedOnScreen.value > 0))

const label = SPOILER_WATERMARK[detectSpoilerLang()]
// 截图里带上时间：日期加小时，整点更新
const stamp = ref('')
function updateStamp() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  stamp.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:00`
}
updateStamp()
const timer = setInterval(updateStamp, 60_000)

const escape = (text: string) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const background = computed(() => {
  // 中灰色、低不透明度，浅色和深色主题都能看清又不挡内容
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="220" viewBox="0 0 360 220">`
    + `<g transform="rotate(-24 180 110)" fill="#7f7f8f" fill-opacity="0.17" font-family="system-ui, sans-serif" text-anchor="middle">`
    + `<text x="180" y="104" font-size="22" font-weight="700">${escape(label)}</text>`
    + `<text x="180" y="132" font-size="14" font-weight="600">${escape(stamp.value)}</text></g></svg>`
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`
})

const layer = ref<HTMLElement>()
const supportsPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype

// 后打开的顶层元素（弹窗、全屏）会盖住水印，所以每次有新的顶层元素出现时把水印重新提到最上面
function raise() {
  const el = layer.value
  if (!el || !supportsPopover || !visible.value) return
  try {
    if (el.matches(':popover-open')) el.hidePopover()
    el.showPopover()
  } catch { /* 元素未挂载时忽略 */ }
}
function hide() {
  const el = layer.value
  if (el && supportsPopover && el.matches(':popover-open')) el.hidePopover()
}
watch(visible, async (show) => { await nextTick(); if (show) raise(); else hide() })

let observer: MutationObserver | undefined
onMounted(() => {
  if (visible.value) raise()
  observer = new MutationObserver((records) => {
    if (records.some((record) => record.target instanceof HTMLDialogElement && record.target.open)) raise()
  })
  observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] })
  document.addEventListener('fullscreenchange', raise)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  observer?.disconnect()
  document.removeEventListener('fullscreenchange', raise)
})
</script>

<template>
  <div
    v-show="visible"
    ref="layer"
    class="spoiler-watermark"
    :class="{ fallback: !supportsPopover }"
    :popover="supportsPopover ? 'manual' : undefined"
    aria-hidden="true"
    :style="{ backgroundImage: background }"
  ></div>
</template>

<style scoped>
.spoiler-watermark {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background-color: transparent;
  background-repeat: repeat;
  background-position: center;
  pointer-events: none;
  user-select: none;
  overflow: hidden;
}
/* 不支持 popover 的浏览器：普通固定层，盖在页面和伪全屏播放器之上 */
.spoiler-watermark.fallback { z-index: 2147483600; }
@media (max-width: 640px) {
  .spoiler-watermark { background-size: 270px 165px; }
}
</style>
