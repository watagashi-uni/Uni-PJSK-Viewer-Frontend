<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead, useSeoMeta } from '@unhead/vue'
import { Coins, Search, ScrollText, Sparkles, X } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import { useMasterStore } from '@/stores/master'

interface OmikujiGroup {
  id: number
  name: string
  summary: string
  description: string
  assetbundleName: string
}

interface Omikuji {
  id: number
  omikujiGroupId: number
  unit: string
  fortuneType: string
  summary: string
  title1: string
  description1: string
  title2: string
  description2: string
  title3: string
  description3: string
}

interface OmikujiCost {
  id: number
  omikujiGroupId: number
  seq: number
  resourceType: string
  resourceQuantity: number
}

interface UnitMeta {
  label: string
  logo: string
  color: string
}

interface FortuneMeta {
  label: string
  color: string
  order: number
}

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()

const groups = ref<OmikujiGroup[]>([])
const omikujis = ref<Omikuji[]>([])
const costs = ref<OmikujiCost[]>([])
const isLoading = ref(true)
const loadError = ref('')
const searchQuery = ref('')
const unitFilter = ref('all')
const fortuneFilter = ref('all')

const unitOrder = ['light_sound', 'idol', 'street', 'theme_park', 'school_refusal', 'piapro']
const unitMeta: Record<string, UnitMeta> = {
  light_sound: { label: 'Leo/need', logo: '/img/logo/logo_light_sound.png', color: '#4455dd' },
  idol: { label: 'MORE MORE JUMP!', logo: '/img/logo/logo_idol.png', color: '#66bb44' },
  street: { label: 'Vivid BAD SQUAD', logo: '/img/logo/logo_street.png', color: '#ee1166' },
  theme_park: { label: 'Wonderlands×Showtime', logo: '/img/logo/logo_theme_park.png', color: '#ff9900' },
  school_refusal: { label: '25时、Nightcord见。', logo: '/img/logo/logo_school_refusal.png', color: '#884499' },
  piapro: { label: 'VIRTUAL SINGER', logo: '/img/logo/logo_piapro.png', color: '#00aeb8' },
}

const fortuneMeta: Record<string, FortuneMeta> = {
  grate_fortune: { label: '大吉', color: '#dc2626', order: 1 },
  fortune: { label: '吉', color: '#e35f16', order: 2 },
  middle_fortune: { label: '中吉', color: '#d97706', order: 3 },
  small_fortune: { label: '小吉', color: '#65a30d', order: 4 },
  uncertain_luck: { label: '末吉', color: '#0891b2', order: 5 },
  misfortune: { label: '凶', color: '#64748b', order: 6 },
  grate_misfortune: { label: '大凶', color: '#334155', order: 7 },
}

const sortedGroups = computed(() => [...groups.value].sort((a, b) => b.id - a.id))
const selectedFortuneId = computed(() => Number(route.query.id) || 0)
const selectedFortune = computed(() => omikujis.value.find(row => row.id === selectedFortuneId.value) || null)
const requestedGroupId = computed(() => Number(route.query.group) || 0)
const currentGroup = computed(() => {
  const fortuneGroupId = selectedFortune.value?.omikujiGroupId
  return groups.value.find(group => group.id === fortuneGroupId)
    || groups.value.find(group => group.id === requestedGroupId.value)
    || sortedGroups.value[0]
    || null
})

const currentCosts = computed(() => costs.value
  .filter(row => row.omikujiGroupId === currentGroup.value?.id)
  .sort((a, b) => a.seq - b.seq))

const currentFortunes = computed(() => omikujis.value.filter(row => row.omikujiGroupId === currentGroup.value?.id))
const filteredFortunes = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return currentFortunes.value
    .filter(row => unitFilter.value === 'all' || row.unit === unitFilter.value)
    .filter(row => fortuneFilter.value === 'all' || row.fortuneType === fortuneFilter.value)
    .filter(row => !query || [
      row.id, unitMeta[row.unit]?.label, fortuneMeta[row.fortuneType]?.label,
      row.summary, row.title1, row.description1, row.title2, row.description2, row.title3, row.description3,
    ].some(value => String(value || '').toLocaleLowerCase().includes(query)))
    .sort((a, b) => {
      const unitDiff = unitOrder.indexOf(a.unit) - unitOrder.indexOf(b.unit)
      if (unitDiff) return unitDiff
      return (fortuneMeta[a.fortuneType]?.order || 99) - (fortuneMeta[b.fortuneType]?.order || 99)
    })
})

const archiveSummary = computed(() => ({
  groups: groups.value.length,
  fortunes: omikujis.value.length,
  units: new Set(omikujis.value.map(row => row.unit)).size,
  types: new Set(omikujis.value.map(row => row.fortuneType)).size,
}))

function groupYear(group: OmikujiGroup): string {
  return group.name.match(/20\d{2}/)?.[0] || `第 ${group.id} 期`
}

function firstParagraph(text: string): string {
  return text.split(/\n\s*\n/)[0]?.replace(/\n/g, '') || ''
}

function costLabel(cost: OmikujiCost): string {
  const labels: Record<string, string> = { jewel: '水晶', virtual_coin: '虚拟币' }
  return `${labels[cost.resourceType] || cost.resourceType} ${cost.resourceQuantity.toLocaleString('zh-CN')}`
}

function selectGroup(groupId: number) {
  unitFilter.value = 'all'
  fortuneFilter.value = 'all'
  searchQuery.value = ''
  void router.replace({ query: { group: String(groupId) } })
}

function openFortune(row: Omikuji) {
  void router.replace({ query: { group: String(row.omikujiGroupId), id: String(row.id) } })
}

function closeFortune() {
  if (!currentGroup.value) return
  void router.replace({ query: { group: String(currentGroup.value.id) } })
}

onMounted(async () => {
  try {
    const [groupData, fortuneData, costData] = await Promise.all([
      masterStore.getMaster<OmikujiGroup>('omikujiGroups'),
      masterStore.getMaster<Omikuji>('omikujis'),
      masterStore.getMaster<OmikujiCost>('omikujiCosts'),
    ])
    groups.value = groupData
    omikujis.value = fortuneData
    costs.value = costData

    const selected = fortuneData.find(row => row.id === selectedFortuneId.value)
    const validGroup = groupData.some(group => group.id === requestedGroupId.value)
    if (selected && selected.omikujiGroupId !== requestedGroupId.value) {
      await router.replace({ query: { group: String(selected.omikujiGroupId), id: String(selected.id) } })
    } else if (!selected && !validGroup && groupData.length) {
      const latestGroup = [...groupData].sort((a, b) => b.id - a.id)[0]
      if (latestGroup) await router.replace({ query: { group: String(latestGroup.id) } })
    }
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Master 数据加载失败'
  } finally {
    isLoading.value = false
  }
})

useSeoMeta({
  title: '御神签档案 - Uni PJSK Viewer',
  description: '查看世界计划历年 Sekai 神社御神签的组合、运势、签文与抽取成本。',
  ogTitle: '御神签档案 - Uni PJSK Viewer',
  ogDescription: '收录历年 Sekai 神社御神签的完整签文资料。',
})

useHead({
  meta: [{ name: 'keywords', content: '世界计划, PJSK, Project SEKAI, 御神签, おみくじ, Sekai神社, 签文' }],
})
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5">
    <PageHeader title="御神签档案" description="按年份、组合与运势查看 Sekai 神社历次御神签的完整签文。">
      <template #icon><ScrollText class="h-8 w-8 text-primary" /></template>
    </PageHeader>

    <section class="grid grid-cols-2 gap-2 md:grid-cols-4">
      <div class="rounded-xl border border-base-200 bg-base-100 px-3 py-2"><p class="text-[11px] text-base-content/45">收录年份</p><p class="text-lg font-bold">{{ archiveSummary.groups }}</p></div>
      <div class="rounded-xl border border-base-200 bg-base-100 px-3 py-2"><p class="text-[11px] text-base-content/45">御神签</p><p class="text-lg font-bold text-primary">{{ archiveSummary.fortunes }}</p></div>
      <div class="rounded-xl border border-base-200 bg-base-100 px-3 py-2"><p class="text-[11px] text-base-content/45">组合</p><p class="text-lg font-bold">{{ archiveSummary.units }}</p></div>
      <div class="rounded-xl border border-base-200 bg-base-100 px-3 py-2"><p class="text-[11px] text-base-content/45">运势种类</p><p class="text-lg font-bold">{{ archiveSummary.types }}</p></div>
    </section>

    <div v-if="isLoading" class="flex justify-center py-20"><span class="loading loading-spinner loading-lg text-primary"></span></div>
    <div v-else-if="loadError" class="alert alert-error">御神签档案加载失败：{{ loadError }}</div>

    <template v-else-if="currentGroup">
      <section class="card border border-base-200 bg-base-100 shadow-sm">
        <div class="card-body gap-4 p-4">
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="group in sortedGroups"
              :key="group.id"
              class="btn btn-sm shrink-0"
              :class="currentGroup.id === group.id ? 'btn-primary' : 'btn-ghost bg-base-200/60'"
              @click="selectGroup(group.id)"
            >
              {{ groupYear(group) }}
            </button>
          </div>

          <div class="flex flex-col gap-3 border-t border-base-200 pt-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="max-w-3xl">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-xl font-bold">{{ currentGroup.name }}</h2>
                <span class="badge badge-ghost">{{ currentFortunes.length }} 种</span>
              </div>
              <p class="mt-2 text-sm leading-6 text-base-content/65">{{ firstParagraph(currentGroup.summary) }}</p>
              <details class="mt-2 text-xs text-base-content/55">
                <summary class="cursor-pointer font-medium text-primary">查看完整活动说明</summary>
                <p class="mt-2 whitespace-pre-line leading-5">{{ currentGroup.summary }}</p>
              </details>
            </div>
            <div class="shrink-0 rounded-xl bg-base-200/60 px-4 py-3">
              <p class="flex items-center gap-2 text-xs font-medium text-base-content/55"><Coins class="h-4 w-4" />每次抽取成本</p>
              <div class="mt-2 flex flex-wrap gap-2"><span v-for="cost in currentCosts" :key="cost.id" class="badge badge-outline">{{ costLabel(cost) }}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section class="card border border-base-200 bg-base-100 shadow-sm">
        <div class="card-body grid gap-2 p-3 md:grid-cols-[minmax(0,1fr)_220px_160px]">
          <label class="input input-sm input-bordered flex items-center gap-2"><Search class="h-4 w-4 opacity-50" /><input v-model="searchQuery" class="grow min-w-0" placeholder="搜索签文、项目或 ID…" /><button v-if="searchQuery" class="btn btn-circle btn-ghost btn-xs" @click="searchQuery = ''"><X class="h-3 w-3" /></button></label>
          <select v-model="unitFilter" class="select select-sm select-bordered"><option value="all">全部组合</option><option v-for="unit in unitOrder" :key="unit" :value="unit">{{ unitMeta[unit]?.label }}</option></select>
          <select v-model="fortuneFilter" class="select select-sm select-bordered"><option value="all">全部运势</option><option v-for="(meta, type) in fortuneMeta" :key="type" :value="type">{{ meta.label }}</option></select>
        </div>
      </section>

      <div class="flex items-center justify-between gap-3"><p class="text-sm font-medium">{{ filteredFortunes.length }} 条签文</p><p class="text-xs text-base-content/45">按组合与运势排列</p></div>

      <section class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <button
          v-for="row in filteredFortunes"
          :key="row.id"
          class="group min-w-0 rounded-xl border border-t-4 border-base-200 bg-base-100 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          :style="{ borderTopColor: unitMeta[row.unit]?.color || '#94a3b8' }"
          @click="openFortune(row)"
        >
          <div class="flex items-start justify-between gap-2">
            <img :src="unitMeta[row.unit]?.logo" :alt="unitMeta[row.unit]?.label" class="h-6 max-w-[70%] object-contain object-left" />
            <span class="shrink-0 rounded-md border px-2 py-0.5 text-xs font-black" :style="{ color: fortuneMeta[row.fortuneType]?.color, borderColor: `${fortuneMeta[row.fortuneType]?.color}55` }">{{ fortuneMeta[row.fortuneType]?.label || row.fortuneType }}</span>
          </div>
          <p class="mt-3 line-clamp-3 min-h-[3.75rem] whitespace-pre-line text-sm font-medium leading-5">{{ row.summary }}</p>
          <div class="mt-3 flex flex-wrap gap-1 text-[10px] text-base-content/50"><span class="rounded bg-base-200 px-1.5 py-0.5">{{ row.title1 }}</span><span class="rounded bg-base-200 px-1.5 py-0.5">{{ row.title2 }}</span><span class="rounded bg-base-200 px-1.5 py-0.5">{{ row.title3 }}</span><span class="ml-auto opacity-50">#{{ row.id }}</span></div>
        </button>
      </section>

      <div v-if="!filteredFortunes.length" class="rounded-xl border border-base-200 bg-base-100 py-16 text-center text-sm text-base-content/45">没有符合筛选条件的签文</div>
    </template>

    <dialog class="modal" :class="{ 'modal-open': selectedFortune }">
      <div v-if="selectedFortune" class="modal-box max-w-3xl overflow-hidden p-0">
        <header class="relative overflow-hidden border-b border-base-200 bg-base-100 px-5 py-5">
          <div class="absolute inset-y-0 left-0 w-1.5" :style="{ backgroundColor: unitMeta[selectedFortune.unit]?.color }"></div>
          <div class="absolute inset-0 opacity-40" style="background-image: radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--color-primary) 12%, transparent) 0 2px, transparent 2px); background-size: 20px 20px;"></div>
          <div class="relative flex items-start justify-between gap-4">
            <div class="min-w-0">
              <img :src="unitMeta[selectedFortune.unit]?.logo" :alt="unitMeta[selectedFortune.unit]?.label" class="h-8 max-w-56 object-contain object-left" />
              <p class="mt-2 text-xs text-base-content/50">{{ currentGroup?.name }} · #{{ selectedFortune.id }}</p>
            </div>
            <div class="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 bg-base-100 text-xl font-black shadow-sm" :style="{ color: fortuneMeta[selectedFortune.fortuneType]?.color, borderColor: fortuneMeta[selectedFortune.fortuneType]?.color }">{{ fortuneMeta[selectedFortune.fortuneType]?.label }}</div>
            <button class="btn btn-circle btn-sm absolute -right-2 -top-2 bg-base-100" aria-label="关闭" @click="closeFortune"><X class="h-4 w-4" /></button>
          </div>
        </header>

        <div class="max-h-[68vh] overflow-y-auto bg-base-200/40 p-4 sm:p-5">
          <section class="rounded-2xl border border-amber-900/10 bg-[#fffdf4] p-5 text-[#3f382d] shadow-sm dark:bg-base-100 dark:text-base-content">
            <div class="flex items-center gap-2 text-xs font-medium text-amber-800/60 dark:text-base-content/45"><Sparkles class="h-4 w-4" />签文</div>
            <p class="mt-3 whitespace-pre-line text-lg font-bold leading-8">{{ selectedFortune.summary }}</p>
            <div class="my-5 h-px bg-amber-900/10 dark:bg-base-200"></div>
            <div class="grid gap-3 sm:grid-cols-3">
              <div v-for="index in 3" :key="index" class="rounded-xl border border-amber-900/10 bg-white/65 p-3 dark:border-base-200 dark:bg-base-200/40">
                <p class="text-xs font-bold text-amber-800/65 dark:text-primary">{{ selectedFortune[`title${index}` as 'title1'] }}</p>
                <p class="mt-1 whitespace-pre-line text-sm leading-6">{{ selectedFortune[`description${index}` as 'description1'] }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="closeFortune">关闭</button></form>
    </dialog>
  </div>
</template>
