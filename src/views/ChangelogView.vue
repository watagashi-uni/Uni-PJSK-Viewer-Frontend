<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, History } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import { frontendVersion, releases } from '@/data/changelog'

const visibleCount = ref(10)
const visibleReleases = computed(() => releases.slice(0, visibleCount.value))
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5">
    <PageHeader title="更新日志" description="这里记录 Viewer 新增的功能和修好的问题。">
      <template #icon><History /></template>
      <template #actions>
        <span class="badge badge-primary badge-outline gap-2 py-3">
          当前版本 <span class="num font-semibold">v{{ frontendVersion }}</span>
        </span>
      </template>
    </PageHeader>

    <div class="space-y-4" aria-label="版本记录">
      <article
        v-for="release in visibleReleases"
        :key="release.version"
        class="panel release"
        :class="{ 'release--current': release.version === frontendVersion }"
        :aria-labelledby="`release-${release.version}`"
      >
        <div class="release__meta">
          <div class="flex flex-wrap items-center gap-2">
            <span class="num text-lg font-bold" :class="release.version === frontendVersion ? 'text-primary' : 'text-base-content'">v{{ release.version }}</span>
            <span v-if="release.version === frontendVersion" class="badge badge-primary badge-soft badge-xs">最新</span>
          </div>
          <time :datetime="release.date" class="num text-xs text-base-content/50">{{ release.date }}</time>
        </div>
        <div class="min-w-0 flex-1">
          <h2 :id="`release-${release.version}`" class="text-base font-bold">{{ release.title }}</h2>
          <ul class="release__changes">
            <li v-for="change in release.changes" :key="change">{{ change }}</li>
          </ul>
        </div>
      </article>
    </div>

    <div v-if="visibleCount < releases.length" class="text-center">
      <button type="button" class="btn btn-sm btn-ghost gap-2" @click="visibleCount += 10">
        <ChevronDown class="h-4 w-4" /> 查看更早的更新
      </button>
    </div>
  </div>
</template>

<style scoped>
.release {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.125rem;
}

.release--current {
  border-color: color-mix(in oklab, var(--color-primary) 40%, var(--color-base-300));
}

.release__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
}

.release__changes {
  display: grid;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding-left: 1.125rem;
  list-style: disc;
  color: color-mix(in oklab, var(--color-base-content) 75%, transparent);
  font-size: 0.875rem;
  line-height: 1.75;
  overflow-wrap: anywhere;
}

.release__changes li::marker {
  color: color-mix(in oklab, var(--color-primary) 60%, var(--color-base-content));
}

@media (min-width: 640px) {
  .release {
    flex-direction: row;
    gap: 1.5rem;
    padding: 1.25rem;
  }

  .release__meta {
    width: 9.5rem;
    flex: none;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
  }
}
</style>
