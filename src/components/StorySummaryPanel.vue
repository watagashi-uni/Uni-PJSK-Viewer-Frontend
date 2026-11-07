<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { ChevronRight, Eye, EyeOff, ScrollText, Sparkles } from 'lucide-vue-next'
import { useStorySummaryStore } from '@/stores/storySummaries'

// 故事总结（AI 生成）。默认模糊收起，点“显示总结”后本次会话内都展开。
const props = withDefaults(defineProps<{
  storyKey: string
  /** 只有一话的故事没有总结，用这一话的梗概代替 */
  fallbackScenarioId?: string
  heading?: string
  /** 详情页用：附一个去剧情页的链接 */
  to?: string
  linkText?: string
}>(), { fallbackScenarioId: '', heading: '故事总结', to: '', linkText: '阅读剧情' })

const summaries = useStorySummaryStore()
watchEffect(() => summaries.ensure(props.storyKey))

const item = computed(() => summaries.get(props.storyKey))
const text = computed(() => {
  const value = item.value
  if (!value) return ''
  if (value.summary) return value.summary
  const only = Object.values(value.episodes)
  return (props.fallbackScenarioId && value.episodes[props.fallbackScenarioId]) || (only.length === 1 ? only[0]! : '')
})
const paragraphs = computed(() => text.value.split(/\n+/).map(line => line.trim()).filter(Boolean))
const loading = computed(() => summaries.isLoading(props.storyKey))
</script>

<template>
  <section v-if="summaries.enabled && (loading || text)" class="story-summary" :aria-label="heading">
    <header class="flex items-center gap-2">
      <span class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary"><ScrollText class="h-4 w-4" /></span>
      <h3 class="text-sm font-bold">{{ heading }}</h3>
      <span class="ai-tag" title="根据中文译文由 AI 生成，可能有误"><Sparkles class="h-3 w-3" />AI 生成</span>
      <button v-if="text" type="button" class="btn btn-ghost btn-xs ml-auto gap-1 font-medium" :aria-expanded="summaries.revealed" @click="summaries.revealed = !summaries.revealed">
        <component :is="summaries.revealed ? EyeOff : Eye" class="h-3.5 w-3.5" />{{ summaries.revealed ? '收起' : '显示总结' }}
      </button>
    </header>

    <div v-if="loading" class="mt-3 space-y-2" aria-hidden="true">
      <div class="skeleton h-3 w-full"></div><div class="skeleton h-3 w-11/12"></div><div class="skeleton h-3 w-2/3"></div>
    </div>
    <div v-else-if="summaries.revealed" class="summary-body" lang="zh-CN">
      <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
    </div>
    <button v-else type="button" class="summary-veil" @click="summaries.revealed = true">
      <span class="veil-text" aria-hidden="true">{{ paragraphs[0] }}</span>
      <span class="veil-cta"><Eye class="h-4 w-4" />可能包含剧透，点击显示</span>
    </button>

    <RouterLink v-if="to && text" :to="to" class="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">{{ linkText }}<ChevronRight class="h-3.5 w-3.5" /></RouterLink>
  </section>
</template>

<style scoped>
.story-summary {
  border: 1px solid color-mix(in oklab, var(--color-primary) 18%, var(--color-base-300));
  border-radius: 1rem;
  padding: 0.85rem 1rem 1rem;
  background:
    radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, var(--color-primary) 9%, transparent), transparent 60%),
    var(--color-base-100);
}
.ai-tag {
  display: inline-flex; align-items: center; gap: 0.2rem;
  padding: 0.05rem 0.45rem; border-radius: 999px;
  font-size: 0.68rem; font-weight: 600; line-height: 1.5;
  color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
  background: color-mix(in oklab, var(--color-base-content) 7%, transparent);
}
.summary-body { margin-top: 0.7rem; max-width: 44rem; font-size: 0.925rem; line-height: 1.85; color: color-mix(in oklab, var(--color-base-content) 84%, transparent); }
.summary-body p + p { margin-top: 0.6rem; }
.summary-body p { text-indent: 2em; text-wrap: pretty; }
.summary-veil { position: relative; display: block; width: 100%; margin-top: 0.7rem; text-align: left; border-radius: 0.75rem; overflow: hidden; cursor: pointer; }
.veil-text {
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  font-size: 0.925rem; line-height: 1.85; filter: blur(5px); opacity: 0.55; user-select: none;
}
.veil-cta {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  font-size: 0.8rem; font-weight: 600; color: var(--color-primary);
  background: color-mix(in oklab, var(--color-base-100) 35%, transparent);
  transition: background 0.15s;
}
.summary-veil:hover .veil-cta { background: color-mix(in oklab, var(--color-base-100) 15%, transparent); }
@media (prefers-reduced-motion: reduce) { .veil-cta { transition: none; } }
</style>
