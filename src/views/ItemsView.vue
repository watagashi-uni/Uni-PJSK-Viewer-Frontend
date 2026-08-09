<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Boxes, CalendarClock, Search, X } from 'lucide-vue-next'
import AccountSelector from '@/components/AccountSelector.vue'
import AssetImage from '@/components/AssetImage.vue'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import { useAccountStore } from '@/stores/account'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'

type ItemCategory = 'material' | 'boost' | 'practice' | 'skill' | 'gacha'

interface MaterialRow {
  id: number
  seq: number
  name: string
  flavorText?: string
  materialType: string
}

interface BoostItemRow {
  id: number
  seq: number
  name: string
  recoveryValue: number
  flavorText?: string
}

interface TicketRow {
  id: number
  name: string
  exp: number
  flavorText?: string
}

interface GachaCeilItemRow {
  id: number
  gachaId: number
  name: string
  assetbundleName: string
  convertStartAt?: number
}

interface DisplayItem {
  key: string
  id: number
  category: ItemCategory
  name: string
  description: string
  detail: string
  icon: string
  sort: number
  convertStartAt?: number
}

interface InventoryState {
  available: Set<ItemCategory>
  quantities: Map<string, number>
}

const categoryMeta: Record<ItemCategory, { label: string, shortLabel: string }> = {
  material: { label: '素材', shortLabel: '素材' },
  boost: { label: '体力道具', shortLabel: '体力' },
  practice: { label: '练习券', shortLabel: '练习' },
  skill: { label: '技能券', shortLabel: '技能' },
  gacha: { label: '招募贴纸', shortLabel: '贴纸' },
}
const categoryOrder: ItemCategory[] = ['material', 'boost', 'practice', 'skill', 'gacha']

const materialTypeLabels: Record<string, string> = {
  common: '通用素材',
  costume: '衣装素材',
  music: '歌曲道具',
  special_training: '特训素材',
  master_lesson: '大师训练素材',
  card_ticket: '成员交换券',
  gacha_ceil_ticket: '招募贴纸券',
  vocal_card_ticket: '翻唱卡交换券',
  character_rank_exp_ticket: '角色等级经验券',
  card_episode_release_ticket: '支线剧情解锁券',
  auto_exchange_music_vocal_ticket: '自动交换券',
  birthday_party_delivery: '生日派对道具',
}

const inventoryKeys: Record<ItemCategory, string[]> = {
  material: ['userMaterials', 'user_materials'],
  boost: ['userBoostItems', 'user_boost_items'],
  practice: ['userPracticeTickets', 'user_practice_tickets'],
  skill: ['userSkillPracticeTickets', 'user_skill_practice_tickets'],
  gacha: ['userGachaCeilItems', 'user_gacha_ceil_items'],
}

const inventoryIdKeys: Record<ItemCategory, string[]> = {
  material: ['materialId', 'material_id'],
  boost: ['boostItemId', 'boost_item_id'],
  practice: ['practiceTicketId', 'practice_ticket_id'],
  skill: ['skillPracticeTicketId', 'skill_practice_ticket_id'],
  gacha: ['gachaCeilItemId', 'gacha_ceil_item_id'],
}

const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()

const materials = ref<MaterialRow[]>([])
const boostItems = ref<BoostItemRow[]>([])
const practiceTickets = ref<TicketRow[]>([])
const skillPracticeTickets = ref<TicketRow[]>([])
const gachaCeilItems = ref<GachaCeilItemRow[]>([])
const isLoading = ref(true)
const loadError = ref('')
const searchQuery = ref('')
const selectedCategory = ref<ItemCategory | ''>('')
const ownedOnly = ref(false)
const currentPage = ref(1)
const selectedItem = ref<DisplayItem | null>(null)
const pageSize = 48

const selectedUserId = computed({
  get: () => accountStore.currentUserId || '',
  set: value => { void accountStore.selectAccount(value) },
})
const assetsHost = computed(() => settingsStore.assetsHost)

function firstValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key]
  }
  return undefined
}

const inventory = computed<InventoryState>(() => {
  const available = new Set<ItemCategory>()
  const quantities = new Map<string, number>()
  if (!selectedUserId.value) return { available, quantities }
  const suite = accountStore.getSuiteCache(selectedUserId.value)
  if (!suite || typeof suite !== 'object') return { available, quantities }

  for (const category of Object.keys(categoryMeta) as ItemCategory[]) {
    const raw = firstValue(suite, inventoryKeys[category])
    if (!Array.isArray(raw)) continue
    available.add(category)
    for (const row of raw) {
      if (!row || typeof row !== 'object') continue
      const id = Number(firstValue(row as Record<string, unknown>, inventoryIdKeys[category]))
      const quantity = Number(firstValue(row as Record<string, unknown>, ['quantity', 'count', 'stock']))
      if (Number.isFinite(id) && Number.isFinite(quantity)) quantities.set(`${category}_${id}`, quantity)
    }
  }
  return { available, quantities }
})

const allItems = computed<DisplayItem[]>(() => [
  ...materials.value.map(item => ({
    key: `material_${item.id}`,
    id: item.id,
    category: 'material' as const,
    name: item.name,
    description: item.flavorText || '',
    detail: materialTypeLabels[item.materialType] || item.materialType,
    icon: `${assetsHost.value}/startapp/thumbnail/material/material${item.id}.png`,
    sort: item.seq,
  })),
  ...boostItems.value.map(item => ({
    key: `boost_${item.id}`,
    id: item.id,
    category: 'boost' as const,
    name: item.name,
    description: item.flavorText || '',
    detail: `恢复 ${item.recoveryValue} 点 Live Bonus`,
    icon: `${assetsHost.value}/startapp/thumbnail/boost_item/boost_item${item.id}.png`,
    sort: item.seq,
  })),
  ...practiceTickets.value.map(item => ({
    key: `practice_${item.id}`,
    id: item.id,
    category: 'practice' as const,
    name: item.name,
    description: item.flavorText || '',
    detail: `成员 EXP +${formatNumber(item.exp)}`,
    icon: `${assetsHost.value}/startapp/thumbnail/practice_ticket/ticket${item.id}.png`,
    sort: item.id,
  })),
  ...skillPracticeTickets.value.map(item => ({
    key: `skill_${item.id}`,
    id: item.id,
    category: 'skill' as const,
    name: item.name,
    description: item.flavorText || '',
    detail: `技能 EXP +${formatNumber(item.exp)}`,
    icon: `${assetsHost.value}/startapp/thumbnail/skill_practice_ticket/ticket${item.id}.png`,
    sort: item.id,
  })),
  ...gachaCeilItems.value.map(item => ({
    key: `gacha_${item.id}`,
    id: item.id,
    category: 'gacha' as const,
    name: item.name,
    description: item.convertStartAt ? `转换开始：${formatDate(item.convertStartAt)}` : '',
    detail: `招募 #${item.gachaId}`,
    icon: `${assetsHost.value}/startapp/thumbnail/gacha_item/${item.assetbundleName}.png`,
    sort: -(item.convertStartAt || item.id),
    convertStartAt: item.convertStartAt,
  })),
])

const categoryCounts = computed(() => {
  const counts = new Map<ItemCategory, number>()
  for (const item of allItems.value) counts.set(item.category, (counts.get(item.category) || 0) + 1)
  return counts
})

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return allItems.value
    .filter(item => !selectedCategory.value || item.category === selectedCategory.value)
    .filter(item => !ownedOnly.value || getOwned(item) > 0)
    .filter(item => !query || [item.id, item.name, item.description, item.detail]
      .some(value => String(value || '').toLocaleLowerCase().includes(query)))
    .sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) || a.sort - b.sort || a.id - b.id)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize)))
const paginatedItems = computed(() => filteredItems.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))

watch([searchQuery, selectedCategory, ownedOnly, selectedUserId], () => { currentPage.value = 1 })
watch(() => inventory.value.available.size, value => { if (value === 0) ownedOnly.value = false })
watch(totalPages, value => { if (currentPage.value > value) currentPage.value = value })

function getOwned(item: DisplayItem): number {
  return inventory.value.quantities.get(item.key) || 0
}

function hasInventory(category: ItemCategory): boolean {
  return inventory.value.available.has(category)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })
}

function goToPage(page: number) {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  try {
    const [materialData, boostData, practiceData, skillData, gachaData] = await Promise.all([
      masterStore.getMaster<MaterialRow>('materials'),
      masterStore.getMaster<BoostItemRow>('boostItems'),
      masterStore.getMaster<TicketRow>('practiceTickets'),
      masterStore.getMaster<TicketRow>('skillPracticeTickets'),
      masterStore.getMaster<GachaCeilItemRow>('gachaCeilItems'),
    ])
    materials.value = materialData
    boostItems.value = boostData
    practiceTickets.value = practiceData
    skillPracticeTickets.value = skillData
    gachaCeilItems.value = gachaData
  } catch (error) {
    console.error('加载物品数据失败:', error)
    loadError.value = '游戏资料加载失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <PageHeader title="物品图鉴" description="素材、体力道具、练习券、技能券与招募贴纸；选择账号后显示持有数量。"><template #icon><Boxes class="w-8 h-8 text-primary" /></template></PageHeader>

    <section class="card bg-base-100 border border-base-200 shadow-sm">
      <div class="card-body p-4 gap-4">
        <div class="grid md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_210px_180px_220px] gap-3">
          <label class="input input-bordered flex items-center gap-2"><Search class="w-4 h-4 opacity-50" /><input v-model="searchQuery" class="grow min-w-0" placeholder="搜索名称、说明或 ID…" /><button v-if="searchQuery" class="btn btn-xs btn-circle btn-ghost" aria-label="清空" @click="searchQuery = ''"><X class="w-3 h-3" /></button></label>
          <select v-model="selectedCategory" class="select select-bordered w-full"><option value="">全部分类（{{ allItems.length }}）</option><option v-for="(meta, key) in categoryMeta" :key="key" :value="key">{{ meta.label }}（{{ categoryCounts.get(key as ItemCategory) || 0 }}）</option></select>
          <label class="label cursor-pointer justify-start gap-3 rounded-lg border border-base-300 px-4"><input v-model="ownedOnly" type="checkbox" class="checkbox checkbox-primary" :disabled="!selectedUserId || inventory.available.size === 0" /><span class="label-text">仅显示持有</span></label>
          <AccountSelector v-if="accountStore.accounts.length" v-model="selectedUserId" />
        </div>
        <p class="text-sm text-base-content/55">匹配 {{ filteredItems.length }} 项<span v-if="selectedUserId && inventory.available.size"> · 已读取 {{ inventory.available.size }} 类账号库存</span><span v-else-if="selectedUserId"> · 当前 suite 未包含这些库存字段</span></p>
      </div>
    </section>

    <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"><div v-for="index in 24" :key="index" class="skeleton h-52 rounded-xl"></div></div>
    <div v-else-if="loadError" class="alert alert-error">物品数据加载失败：{{ loadError }}</div>
    <template v-else>
      <div v-if="paginatedItems.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <button v-for="item in paginatedItems" :key="item.key" class="group card bg-base-100 border border-base-200 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden text-left" @click="selectedItem = item">
          <figure class="relative h-28 sm:h-32 bg-gradient-to-br from-base-200 to-base-100 p-2.5"><AssetImage :src="item.icon" :alt="item.name" class="w-full h-full object-contain group-hover:scale-105 transition-transform" /><span class="absolute top-2 left-2 badge badge-xs badge-neutral">{{ categoryMeta[item.category].shortLabel }}</span><span v-if="hasInventory(item.category)" class="absolute top-2 right-2 badge badge-xs badge-primary shadow-sm">×{{ formatNumber(getOwned(item)) }}</span></figure>
          <div class="card-body p-3 gap-1"><span class="text-[10px] text-base-content/45">#{{ item.id }} · {{ item.detail }}</span><h2 class="font-bold text-sm line-clamp-2 min-h-10">{{ item.name }}</h2><p class="text-[11px] text-base-content/55 line-clamp-2 min-h-8">{{ item.description || '暂无说明' }}</p></div>
        </button>
      </div>
      <div v-else class="card bg-base-100 border border-base-200"><div class="card-body items-center py-16 text-base-content/55"><Boxes class="w-12 h-12 opacity-30" /><p>没有匹配的物品</p></div></div>
      <Pagination v-if="totalPages > 1" :current-page="currentPage" :total-pages="totalPages" base-url="/items" @page-change="goToPage" />
    </template>

    <dialog class="modal" :class="{ 'modal-open': selectedItem }">
      <div v-if="selectedItem" class="modal-box max-w-xl">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" aria-label="关闭" @click="selectedItem = null"><X class="w-4 h-4" /></button>
        <div class="flex flex-col sm:flex-row gap-6">
          <div class="w-32 h-32 bg-base-200 rounded-2xl p-3 shrink-0 self-center"><AssetImage :src="selectedItem.icon" :alt="selectedItem.name" class="w-full h-full object-contain" /></div>
          <div class="min-w-0 space-y-3"><div><span class="badge badge-outline">{{ categoryMeta[selectedItem.category].label }}</span><p class="text-xs text-base-content/45 mt-2">#{{ selectedItem.id }}</p><h2 class="font-bold text-2xl">{{ selectedItem.name }}</h2></div><p class="text-sm text-primary font-medium">{{ selectedItem.detail }}</p><p class="text-sm leading-6 text-base-content/70">{{ selectedItem.description || '暂无说明' }}</p><div v-if="hasInventory(selectedItem.category)" class="stat bg-base-200 rounded-xl p-3"><div class="stat-title text-xs">账号持有</div><div class="stat-value text-2xl text-primary">{{ formatNumber(getOwned(selectedItem)) }}</div></div><div v-if="selectedItem.convertStartAt" class="flex items-center gap-2 text-xs text-base-content/55"><CalendarClock class="w-4 h-4" />{{ formatDate(selectedItem.convertStartAt) }} 开始转换</div></div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="selectedItem = null">关闭</button></form>
    </dialog>
  </div>
</template>
