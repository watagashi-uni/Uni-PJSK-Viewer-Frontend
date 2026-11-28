<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AudioLines, Calendar, Disc3, Mic2, Search } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import PageHeader from '@/components/PageHeader.vue'
import ZhText from '@/components/ZhText.vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { useZh } from '@/composables/useZh'
import { bannerPath, loadConnectLiveIndex, type ConnectLiveEntry } from '@/api/connectLive'

interface StreamingLive {
  id: number
  name: string
  assetbundleName: string
  virtualLiveType: string
  startAt: number
  endAt: number
  virtualLiveSchedules?: { startAt: number; endAt: number; isAfterEvent?: boolean }[]
}

const master = useMasterStore()
const settings = useSettingsStore()
const zhVirtualLives = useZh('virtualLives')

const lives = ref<StreamingLive[]>([])
const entries = ref<Record<string, ConnectLiveEntry>>({})
const loading = ref(true)
const error = ref('')
const query = ref('')

onMounted(async () => {
  try {
    const [rows, index] = await Promise.all([master.getMaster<StreamingLive>('virtualLives'), loadConnectLiveIndex()])
    lives.value = rows.filter(row => row.virtualLiveType === 'streaming')
    entries.value = index.lives
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
})

/** First show of a live (rehearsals and technical tests have no setlist and are left out). */
function firstShow(live: StreamingLive): number {
  const starts = (live.virtualLiveSchedules || []).filter(s => !s.isAfterEvent).map(s => s.startAt)
  return starts.length ? Math.min(...starts) : live.startAt
}

function songCount(entry: ConnectLiveEntry): number {
  return Math.max(...entry.shows.map(show => show.tracks.length))
}

const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return lives.value
    .filter(live => entries.value[String(live.id)])
    .filter(live => settings.showSpoilers || live.startAt <= Date.now())
    .filter(live => !q || zhVirtualLives.searchText('name', live.name).toLowerCase().includes(q) || String(live.id).includes(q)
      || entries.value[String(live.id)]!.shows.some(show => show.tracks.some(t => t.title.toLowerCase().includes(q))))
    .sort((a, b) => firstShow(b) - firstShow(a))
})

const totalSongs = computed(() => shown.value.reduce((sum, live) => sum + songCount(entries.value[String(live.id)]!), 0))

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5">
    <PageHeader title="Connect Live" :description="`历届 Connect Live 的曲目、演唱者和演出音源 · ${shown.length} 场 · ${totalSongs} 首`">
      <template #icon><AudioLines class="h-8 w-8 text-primary" /></template>
    </PageHeader>

    <div class="rounded-xl border border-base-300 bg-base-100 p-3">
      <label class="input input-sm input-bordered flex min-w-0 items-center gap-2">
        <Search class="h-4 w-4 opacity-45" />
        <input v-model="query" type="text" class="grow min-w-0" placeholder="搜索演出或曲名…" />
      </label>
    </div>

    <div v-if="loading" class="flex justify-center py-20"><span class="loading loading-spinner loading-lg"></span></div>
    <div v-else-if="error" class="alert alert-error">Connect Live 加载失败：{{ error }}</div>
    <div v-else-if="!shown.length" class="py-20 text-center text-base-content/60">没有找到符合条件的演出</div>

    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="live in shown"
        :key="live.id"
        :to="`/connect-live/${live.id}`"
        class="group block overflow-hidden rounded-xl border border-base-300 bg-base-100 transition hover:border-primary/35 hover:shadow-md"
        :class="{ 'cl-spoiler': live.startAt > Date.now() }"
      >
        <figure class="relative aspect-[122/52] bg-base-200">
          <AssetImage :src="`${settings.assetsHost}${bannerPath(live.assetbundleName)}`" :alt="live.name" class="h-full w-full object-cover" />
          <span class="absolute right-2 top-2 badge badge-sm border-0 bg-black/50 text-white">#{{ live.id }}</span>
          <span v-if="live.startAt > Date.now()" class="absolute left-2 top-2 badge badge-sm badge-warning" title="还没开场，请勿转载或截图外传">剧透</span>
        </figure>
        <div class="space-y-2.5 p-3">
          <h2 class="line-clamp-2 min-h-10 text-[15px] font-bold leading-5 transition-colors group-hover:text-primary">
            <ZhText :text="live.name" table="virtualLives" path="name" sub-class="text-xs font-normal" />
          </h2>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/60">
            <span class="inline-flex items-center gap-1"><Calendar class="h-3.5 w-3.5" />{{ formatDate(firstShow(live)) }}</span>
            <span class="inline-flex items-center gap-1"><Disc3 class="h-3.5 w-3.5" />{{ songCount(entries[String(live.id)]!) }} 首</span>
            <span v-if="entries[String(live.id)]!.shows.length > 1" class="inline-flex items-center gap-1"><Mic2 class="h-3.5 w-3.5" />{{ entries[String(live.id)]!.shows.length }} 种公演曲目</span>
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.cl-spoiler {
  border-color: color-mix(in oklab, var(--color-warning) 55%, var(--color-base-300));
}
</style>
