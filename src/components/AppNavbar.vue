<script setup lang="ts">
import { Menu, Search } from 'lucide-vue-next'
import { useGlobalSearch } from '@/composables/useGlobalSearch'

const search = useGlobalSearch()
</script>

<template>
  <nav class="sticky top-0 z-40 flex h-12 items-center gap-1 border-b border-base-300 bg-base-100/90 px-2 backdrop-blur lg:hidden">
    <label for="my-drawer-2" class="btn btn-square btn-ghost btn-sm drawer-button" aria-label="打开菜单">
      <Menu class="h-5 w-5" />
    </label>
    <!-- 左上角始终是网站标题，点击回到首页 -->
    <RouterLink to="/" class="app-brand min-w-0">
      <span class="app-brand__mark" aria-hidden="true"><i></i><i></i></span>
      <span class="app-brand__name truncate">Uni PJSK</span>
      <span class="app-brand__sub">Viewer</span>
    </RouterLink>
    <span class="flex-1"></span>
    <button type="button" class="btn btn-ghost btn-square btn-sm" aria-label="搜索" title="搜索" @click="search.open()">
      <Search class="h-5 w-5" />
    </button>
  </nav>
</template>
