import { computed, watchEffect } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useTranslationStore, type ZhEntry } from '@/stores/translations'

/**
 * 按需加载一张 master 表的中文译文（when 可推迟到某个标签页打开时再下载）。
 * `t(path, jp)` 返回中文（没有译文或关闭显示时为 undefined），
 * `entry` 额外给出是否机翻，`match` 用于搜索时同时匹配中文。
 */
export function useZh(table: string, when: () => boolean = () => true) {
  const settings = useSettingsStore()
  const store = useTranslationStore()
  const enabled = computed(() => settings.translationMode !== 'off')

  // 关闭显示或页面暂时用不到（when 为 false）时不下载；之后需要时立即补上
  watchEffect(() => { if (enabled.value && when()) store.ensure(table) })

  function entry(path: string, jp: string | null | undefined): ZhEntry | undefined {
    return enabled.value ? store.lookup(table, path, jp) : undefined
  }
  function t(path: string, jp: string | null | undefined): string | undefined {
    return entry(path, jp)?.text
  }
  /** 中文优先模式下返回中文，否则返回原文 */
  function label(path: string, jp: string | null | undefined): string {
    return (settings.translationMode === 'zh-first' && t(path, jp)) || jp || ''
  }
  /** 纯文本场合（下拉选项、title 属性）：按显示设置拼成“原文 / 译文” */
  function inline(path: string, jp: string | null | undefined): string {
    const zh = t(path, jp)
    if (!zh) return jp || ''
    return settings.translationMode === 'zh-first' ? `${zh} / ${jp}` : `${jp} / ${zh}`
  }
  /** 原文与译文拼在一起，供搜索使用（不受显示设置影响） */
  function searchText(path: string, jp: string | null | undefined): string {
    const zh = store.lookup(table, path, jp)?.text
    return zh ? `${jp ?? ''} ${zh}` : jp ?? ''
  }

  return { t, entry, label, inline, searchText, enabled, loaded: computed(() => store.isLoaded(table)) }
}
