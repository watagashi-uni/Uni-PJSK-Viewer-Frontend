<script setup lang="ts">
// Navbar logic simplified for sidebar layout
</script>

<template>
  <nav class="navbar bg-base-100 shadow-sm sticky top-0 z-40 lg:hidden">
    <div class="flex-none">
      <label for="my-drawer-2" class="btn btn-square btn-ghost drawer-button lg:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </label>
    </div>
    <div class="flex-1">
      <RouterLink to="/" class="btn btn-ghost normal-case text-xl text-primary">Uni PJSK Viewer</RouterLink>
    </div>
    <div class="flex-none">
      <!-- Mobile Search Button -->
      <button class="btn btn-ghost btn-circle" @click="$router.push('/musics/search')">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </button>
    </div>
  </nav>
</template>
