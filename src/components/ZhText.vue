<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useTranslationStore, type ZhEntry } from '@/stores/translations'

// 日文与中文译名并排显示：默认日文为主、下方附中文；中文优先时对调。
const props = withDefaults(defineProps<{
  text?: string | null
  /** master 表名与字段路径，组件会自行按需加载这张表 */
  table?: string
  path?: string
  /** 直接给出的译文（优先于 table/path） */
  zh?: string | null
  ai?: boolean
  /** stack：译文另起一行；inline：同一行用 / 分隔 */
  layout?: 'stack' | 'inline'
  subClass?: string
  /** 原文所在行的类名（stack 时原文变成块元素，便于两段分别截断） */
  mainClass?: string
}>(), { text: '', table: '', path: '', zh: undefined, ai: false, layout: 'stack', subClass: '', mainClass: '' })

const settings = useSettingsStore()
const store = useTranslationStore()
const enabled = computed(() => settings.translationMode !== 'off')

watchEffect(() => { if (enabled.value && props.table && props.zh === undefined && props.text) store.ensure(props.table, props.path || undefined) })

const translated = computed<ZhEntry | undefined>(() => {
  if (!enabled.value || !props.text) return undefined
  if (props.zh !== undefined) return props.zh && props.zh !== props.text ? { text: props.zh, ai: props.ai } : undefined
  return props.table && props.path ? store.lookup(props.table, props.path, props.text) : undefined
})
const zhFirst = computed(() => settings.translationMode === 'zh-first' && !!translated.value)
const main = computed(() => zhFirst.value ? translated.value!.text : props.text || '')
const aiMark = computed(() => !!translated.value?.ai)
const sub = computed(() => translated.value ? (zhFirst.value ? props.text || '' : translated.value.text) : '')
</script>

<template>
  <span v-if="!sub && mainClass" :class="mainClass" class="block">{{ main }}</span>
  <template v-else-if="!sub">{{ main }}</template>
  <template v-else-if="layout === 'inline'"><span :lang="zhFirst ? 'zh-CN' : undefined">{{ main }}<span v-if="aiMark && zhFirst" class="zh-ai" title="机器翻译">AI</span></span><span class="zh-inline" :class="subClass" :lang="zhFirst ? 'ja' : 'zh-CN'"> / {{ sub }}<span v-if="aiMark && !zhFirst" class="zh-ai" title="机器翻译">AI</span></span></template>
  <template v-else><span :class="mainClass ? [mainClass, 'block'] : undefined" :lang="zhFirst ? 'zh-CN' : undefined">{{ main }}<span v-if="aiMark && zhFirst" class="zh-ai" title="机器翻译">AI</span></span><span class="zh-sub" :class="subClass" :lang="zhFirst ? 'ja' : 'zh-CN'">{{ sub }}<span v-if="aiMark && !zhFirst" class="zh-ai" title="机器翻译">AI</span></span></template>
</template>
