<script setup lang="ts">
import { Check, Palette } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import { themeOptions } from '@/utils/themes'

// 主题切换按钮 + 菜单。侧边栏底部和首页右上角共用
withDefaults(defineProps<{
  /** sidebar：菜单向上弹出，宽度铺满所在的那一行；popover：从按钮下方靠右弹出 */
  variant?: 'sidebar' | 'popover'
}>(), {
  variant: 'popover',
})

const settingsStore = useSettingsStore()

function selectTheme(value: string) {
  settingsStore.setTheme(value)
  // 选完收起菜单（daisyUI 的 dropdown 靠焦点保持展开）
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}
</script>

<template>
  <div class="dropdown" :class="variant === 'sidebar' ? 'dropdown-top static' : 'dropdown-end'">
    <button
      type="button"
      tabindex="0"
      class="btn btn-ghost btn-sm btn-square"
      :class="{ 'theme-menu__pill': variant === 'popover' }"
      title="切换主题"
      aria-label="切换主题"
    >
      <Palette class="h-4 w-4" />
    </button>
    <ul
      tabindex="0"
      class="dropdown-content z-30 rounded-box border border-base-300 bg-base-100 p-1.5"
      :class="variant === 'sidebar' ? 'inset-x-0 mb-2' : 'mt-2 w-44'"
    >
      <li v-for="t in themeOptions" :key="t.value">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-field px-2 py-1.5 text-left text-sm hover:bg-base-content/7"
          :class="{ 'font-semibold text-primary': settingsStore.theme === t.value }"
          @click="selectTheme(t.value)"
        >
          <span class="theme-dot" :class="{ 'is-split': t.preview.length > 1 }" aria-hidden="true">
            <i v-for="name in t.preview" :key="name" :data-theme="name"></i>
          </span>
          <span class="flex-1">{{ t.label }}</span>
          <Check v-if="settingsStore.theme === t.value" class="h-3.5 w-3.5" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* 首页右上角：和旁边的头像胶囊同高的圆形按钮 */
.theme-menu__pill {
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid var(--color-base-300);
  border-radius: 999px;
  background-color: var(--color-base-100);
}

.theme-menu__pill:hover {
  border-color: color-mix(in oklab, var(--color-primary) 50%, var(--color-base-300));
  background-color: var(--color-base-100);
}

/* 主题色点：底色是那个主题的面板底色，中间一点是它的主色。
   只画主色的话，浅色主题的深青色反而比深色主题的亮青色更暗，看起来像是标反了 */
.theme-dot {
  display: flex;
  flex: none;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--color-base-content) 24%, transparent);
}

/* 每一格带 data-theme，取的是那个主题自己的颜色。
   daisyUI 会给带 data-theme 的元素铺一层底色渐变，要去掉才看得到下面的颜色 */
.theme-dot i {
  position: relative;
  display: block;
  flex: 1;
  overflow: hidden;
  background-color: var(--color-base-100);
  background-image: none;
}

.theme-dot i::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background-color: var(--color-primary);
  transform: translate(-50%, -50%);
}

/* 跟随系统：左半浅色、右半深色，中间的点各取一半 */
.theme-dot.is-split i:first-child::after {
  left: 100%;
}

.theme-dot.is-split i:last-child::after {
  left: 0;
}
</style>
