<script setup lang="ts">
import { computed, ref } from 'vue'
import { clearNoteJudgments, createJudgmentOverlay, mergeJudgmentsForExport, toggleNoteJudgment } from '@/utils/noteJudgmentInteraction'

const props = defineProps<{ svgText: string; imageUrl: string }>()
const overlayElement = ref<HTMLDivElement | null>(null)
const overlay = computed(() => createJudgmentOverlay(props.svgText))
const getOverlay = () => overlayElement.value?.querySelector<SVGSVGElement>('svg[data-judge-preview]') ?? null

defineExpose({
  clearJudgments: () => clearNoteJudgments(getOverlay()),
  getSvgForExport: () => mergeJudgmentsForExport(props.svgText, getOverlay()),
})
</script>

<template>
  <div class="relative inline-block">
    <img :src="imageUrl" alt="谱面" class="pointer-events-none block max-w-none" draggable="false" />
    <!-- Only hit targets and selected bands are live SVG nodes. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div ref="overlayElement" class="judgment-overlay absolute inset-0 [&_svg]:block [&_svg]:max-w-none" @click="toggleNoteJudgment" @keydown="toggleNoteJudgment" v-html="overlay"></div>
  </div>
</template>

<style scoped>
.judgment-overlay {
  contain: layout paint;
}
</style>
