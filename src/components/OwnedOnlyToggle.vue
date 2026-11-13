<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { Info } from 'lucide-vue-next'

/**
 * “只看已拥有”这类依赖账号数据的筛选开关。
 * 没有数据时开关仍然可以点，点了会说明还缺什么，而不是一个点不动也没有解释的禁用控件。
 */
const props = withDefaults(defineProps<{
  modelValue: boolean
  label: string
  /** 当前账号的数据里有没有这项信息 */
  available: boolean
  /** 没有数据时的说明 */
  hint?: string
}>(), {
  hint: '先在个人信息页绑定账号并同步游戏数据，才能使用这个筛选。',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const HINT_MS = 6000
const hintShown = ref(false)
let hintTimer: ReturnType<typeof setTimeout> | undefined

function showHint(): void {
  hintShown.value = true
  clearTimeout(hintTimer)
  hintTimer = setTimeout(() => { hintShown.value = false }, HINT_MS)
}

function onChange(event: Event): void {
  const input = event.target as HTMLInputElement
  if (!props.available) {
    input.checked = false
    showHint()
    return
  }
  emit('update:modelValue', input.checked)
}

// 数据同步好之后说明就不需要了
watch(() => props.available, (available) => { if (available) hintShown.value = false })

onBeforeUnmount(() => clearTimeout(hintTimer))
</script>

<template>
  <div class="relative inline-flex">
    <label class="owned-toggle" :class="{ 'is-unavailable': !available }">
      <input
        type="checkbox"
        class="toggle toggle-sm toggle-primary"
        :checked="modelValue && available"
        :aria-describedby="hintShown ? 'owned-toggle-hint' : undefined"
        @change="onChange"
      />
      <span>{{ label }}</span>
    </label>
    <div v-if="hintShown" id="owned-toggle-hint" role="status" class="owned-toggle__hint">
      <Info class="mt-0.5 h-4 w-4 shrink-0 text-info" />
      <p class="min-w-0">
        {{ hint }}
        <RouterLink to="/profile" class="link link-primary whitespace-nowrap">去个人信息页</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.owned-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  user-select: none;
  white-space: nowrap;
}

.owned-toggle.is-unavailable {
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
}

.owned-toggle__hint {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 20;
  display: flex;
  gap: 0.5rem;
  width: max-content;
  max-width: min(18rem, calc(100vw - 3rem));
  margin-top: 0.25rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-base-300);
  border-radius: var(--radius-field);
  background-color: var(--color-base-100);
  box-shadow: var(--shadow-float);
  font-size: 0.8125rem;
  line-height: 1.25rem;
}
</style>
