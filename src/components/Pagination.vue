<script setup lang="ts">
import { computed } from 'vue'

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
  <div class="flex flex-wrap items-center justify-center gap-4 mt-8">
    <!-- 分页按钮 -->
    <div class="join bg-base-100 shadow-lg rounded-full p-2">
      <!-- 上一页 -->
      <button 
        class="join-item btn btn-sm btn-ghost"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        «
      </button>

      <!-- 页码 -->
      <template v-for="page in visiblePages" :key="page">
        <button 
          v-if="typeof page === 'number'"
          class="join-item btn btn-sm"
          :class="page === currentPage ? 'btn-primary' : 'btn-ghost'"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <span v-else class="join-item btn btn-sm btn-ghost btn-disabled">...</span>
      </template>

      <!-- 下一页 -->
      <button 
        class="join-item btn btn-sm btn-ghost"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        »
      </button>
    </div>

    <!-- 跳转输入框 -->
    <form 
      v-if="totalPages > 1"
      @submit.prevent="goToPage(Number(($event.target as HTMLFormElement).page.value))"
      class="flex items-center gap-2"
    >
      <input 
        type="number"
        name="page"
        :min="1"
        :max="totalPages"
        placeholder="Go"
        class="input input-sm input-bordered w-16 text-center"
      />
      <button type="submit" class="btn btn-sm btn-ghost">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </form>
  </div>
</template>
