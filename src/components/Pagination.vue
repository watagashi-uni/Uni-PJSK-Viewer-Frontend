<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  currentPage: number
  totalPages: number
  baseUrl: string
}>()

const emit = defineEmits<{
  (e: 'pageChange', page: number): void
}>()

// 计算显示的页码范围
const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const current = props.currentPage
  const total = props.totalPages

  if (total <= 8) {
    // 总页数少于8，全部显示
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总是显示第一页
    pages.push(1)

    if (current > 4) {
      pages.push('...')
    }

    // 当前页周围的页码
    const start = Math.max(2, current - 2)
    const end = Math.min(total - 1, current + 2)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 3) {
      pages.push('...')
    }

    // 总是显示最后一页
    pages.push(total)
  }

  return pages
})

function goToPage(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('pageChange', page)
  }
}
</script>

<template>
  <nav class="mt-8 flex w-full min-w-0 flex-wrap items-center justify-center gap-3" aria-label="分页">
    <div class="max-w-full overflow-x-auto">
      <div class="panel flex w-max items-center gap-0.5 p-1">
        <button
          type="button"
          class="btn btn-sm btn-ghost btn-square"
          aria-label="上一页"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>

        <template v-for="(page, index) in visiblePages" :key="typeof page === 'number' ? `page-${page}` : `ellipsis-${index}`">
          <button
            v-if="typeof page === 'number'"
            type="button"
            class="btn btn-sm num min-w-8 px-2"
            :class="page === currentPage ? 'btn-primary' : 'btn-ghost font-medium'"
            :aria-current="page === currentPage ? 'page' : undefined"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <span v-else class="px-1 text-base-content/40" aria-hidden="true">…</span>
        </template>

        <button
          type="button"
          class="btn btn-sm btn-ghost btn-square"
          aria-label="下一页"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </div>

    <form
      v-if="totalPages > 8"
      class="flex items-center gap-1.5"
      @submit.prevent="goToPage(Number(($event.target as HTMLFormElement).page.value))"
    >
      <input
        type="number"
        name="page"
        :min="1"
        :max="totalPages"
        placeholder="页码"
        aria-label="跳转页码"
        class="input input-sm w-16 text-center"
      />
      <button type="submit" class="btn btn-sm btn-ghost">跳转</button>
    </form>
  </nav>
</template>
