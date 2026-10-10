<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, Search } from 'lucide-vue-next'

const route = useRoute()
const pageTitle = computed(() => {
  const title = route.meta.title as string | undefined
  return route.path === '/' || !title ? 'Uni PJSK Viewer' : title
})
</script>

<template>
  <nav class="navbar sticky top-0 z-40 min-h-12 gap-1 border-b border-base-300 bg-base-100/95 px-2 backdrop-blur lg:hidden">
    <label for="my-drawer-2" class="btn btn-square btn-ghost btn-sm drawer-button" aria-label="打开菜单">
      <Menu class="h-5 w-5" />
    </label>
    <RouterLink v-if="route.path === '/'" to="/" class="min-w-0 flex-1 truncate px-1 text-base font-bold text-primary">
      Uni PJSK Viewer
    </RouterLink>
    <span v-else class="min-w-0 flex-1 truncate px-1 text-base font-semibold">{{ pageTitle }}</span>
    <RouterLink to="/musics/search" class="btn btn-ghost btn-square btn-sm" aria-label="搜索歌曲" title="搜索歌曲">
      <Search class="h-5 w-5" />
    </RouterLink>
  </nav>
</template>
