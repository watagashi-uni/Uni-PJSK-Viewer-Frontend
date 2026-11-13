<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <header class="page-header">
    <div class="flex min-w-0 items-center gap-3">
      <span v-if="$slots.icon" class="page-header__icon" aria-hidden="true">
        <slot name="icon"></slot>
      </span>
      <div class="min-w-0">
        <h1 class="page-header__title"><slot name="title">{{ title }}</slot></h1>
        <p v-if="description" class="page-header__desc">{{ description }}</p>
      </div>
    </div>
    <div v-if="$slots.actions" class="w-full shrink-0 sm:w-auto">
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .page-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

/* 斜切的图标底块：和侧边栏、小节标题用同一个倾角 */
.page-header__icon {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-primary);
}

.page-header__icon::before {
  content: '';
  position: absolute;
  inset: 0 0.125rem;
  border-radius: 0.5rem;
  background-color: color-mix(in oklab, var(--color-primary) 13%, transparent);
  transform: skewX(-10deg);
}

.page-header__icon :deep(svg) {
  position: relative;
  width: 1.3rem;
  height: 1.3rem;
}

.page-header__title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 2rem;
  letter-spacing: -0.01em;
}

.page-header__desc {
  margin-top: 0.125rem;
  color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
  font-size: 0.875rem;
  line-height: 1.375rem;
}
</style>
