<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Image, Music2, Search, X } from 'lucide-vue-next'
import { loadStoryMedia, storyAssetUrl, type StoryMediaIndex } from '@/utils/storyPlayback'
const media = ref<StoryMediaIndex>({ backgrounds: {}, bgm: {}, comics: [] })
const category = ref<'backgrounds' | 'comics' | 'bgm'>('backgrounds')
const search = ref('')
const page = ref(1)
const selected = ref('')
const imageDialog = ref<HTMLDialogElement | null>(null)
watch(selected, path => {
  if (path && !imageDialog.value?.open) imageDialog.value?.showModal()
  if (!path && imageDialog.value?.open) imageDialog.value.close()
}, { flush: 'post' })
const loading = ref(true)
const error = ref('')
let playing: HTMLAudioElement | undefined
const labels = { backgrounds: '剧情背景', comics: '单格漫画', bgm: '剧情音乐' }
const paths = computed(() => [...new Set(Object.values(media.value[category.value]))].filter(path => !search.value || path.toLowerCase().includes(search.value.trim().toLowerCase())))
const pages = computed(() => Math.max(1, Math.ceil(paths.value.length / 12)))
const name = (path: string) => path.split('/').pop()?.replace(/\.[^.]+$/, '') || ''
watch([category, search], () => { page.value = 1; playing?.pause() })
function play(event: Event) { const audio = event.target as HTMLAudioElement; if (playing !== audio) playing?.pause(); playing = audio }
async function load() { loading.value = true; error.value = ''; try { media.value = await loadStoryMedia() } catch { error.value = '画廊暂时无法加载' } finally { loading.value = false } }
onMounted(load)
onBeforeUnmount(() => playing?.pause())
</script>
<template>
  <section class="space-y-5">
    <div class="gallery-intro"><div><p class="text-xs tracking-[.2em] text-primary font-bold">BETWEEN THE LINES</p><h2 class="text-2xl font-bold mt-2">故事之外，风景之中。</h2><p class="text-sm opacity-60 mt-2">翻一页漫画，听一段音乐，或找回剧情里熟悉的地方。</p></div><Image class="w-12 h-12 opacity-20 hidden sm:block" /></div>
    <div class="flex flex-wrap items-center gap-2"><button v-for="(label, key) in labels" :key="key" class="btn btn-sm" :class="category === key ? 'btn-primary' : 'btn-ghost'" @click="category = key">{{ label }}</button><label class="input input-sm sm:ml-auto w-full sm:w-64"><Search class="w-4 h-4" /><input v-model="search" placeholder="按资源名称筛选…" /></label></div>
    <div v-if="loading" class="py-16 text-center"><span class="loading loading-spinner"></span></div>
    <div v-else-if="error" class="alert">{{ error }}<button class="btn btn-sm" @click="load">重试</button></div>
    <template v-else>
      <p class="text-xs opacity-50">{{ paths.length }} 个资源 · 按需加载</p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <article v-for="path in paths.slice((page - 1) * 12, page * 12)" :key="path" class="rounded-xl border border-base-200 overflow-hidden bg-base-100">
          <template v-if="category === 'bgm'"><div class="p-5 flex items-center gap-3"><Music2 class="w-8 h-8 text-primary" /><h3 class="text-sm font-bold break-all">{{ name(path) }}</h3></div><audio class="w-full px-3 pb-3" controls preload="none" :src="storyAssetUrl(path)" @play="play"></audio></template>
          <button v-else class="w-full text-left group" @click="selected = path"><img :src="storyAssetUrl(path)" :alt="name(path)" loading="lazy" class="w-full aspect-video bg-base-200" :class="category === 'comics' ? 'object-contain' : 'object-cover'" /><span class="block p-3 text-xs opacity-60 group-hover:opacity-100">{{ name(path) }} <span class="float-right">查看原图 ↗</span></span></button>
        </article>
      </div>
      <p v-if="!paths.length" class="text-center py-12 opacity-50">没有匹配的资源</p>
      <div v-if="pages > 1" class="flex justify-center items-center gap-4"><button class="btn btn-sm" :disabled="page === 1" @click="page--">上一页</button><span class="text-xs">{{ page }} / {{ pages }}</span><button class="btn btn-sm" :disabled="page === pages" @click="page++">下一页</button></div>
    </template>
    <dialog ref="imageDialog" class="modal" :class="{ 'modal-open': selected }" @cancel.prevent="selected = ''"><div v-if="selected" class="modal-box max-w-5xl p-3"><div class="flex items-center gap-3 mb-3"><span class="flex-1 text-sm">{{ name(selected) }}</span><a :href="storyAssetUrl(selected)" target="_blank" rel="noopener" class="btn btn-sm btn-ghost">打开原图</a><button class="btn btn-sm btn-circle btn-ghost" aria-label="关闭图片" @click="selected = ''"><X class="w-4 h-4" /></button></div><img :src="storyAssetUrl(selected)" :alt="name(selected)" class="min-h-40 max-h-[75dvh] w-full object-contain bg-base-200" /></div><form method="dialog" class="modal-backdrop"><button @click="selected = ''">关闭</button></form></dialog>
  </section>
</template>
<style scoped>
.gallery-intro { display:flex; align-items:center; justify-content:space-between; padding:2rem; border-left:3px solid var(--color-primary); background:color-mix(in srgb,var(--color-primary) 7%,var(--color-base-100)); }
</style>
