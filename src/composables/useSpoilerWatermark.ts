import { onScopeDispose, ref, watchEffect } from 'vue'

// 当前页面上正在显示的未公开内容数量（详情页、剧情阅读器各自登记）
export const unreleasedOnScreen = ref(0)

/** 页面显示未公开内容时登记，用于决定是否显示剧透水印 */
export function useSpoilerWatermark(active: () => boolean) {
  let registered = false
  const set = (value: boolean) => {
    if (value === registered) return
    registered = value
    unreleasedOnScreen.value += value ? 1 : -1
  }
  watchEffect(() => set(active()))
  onScopeDispose(() => set(false))
}
