<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarDays, Gift, Search, X } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'

type CampaignStatus = 'active' | 'upcoming' | 'ended'

interface LoginBonusDetail {
  id: number
  limitedLoginBonusId: number
  day: number
  resourceBoxId: number
}

interface LoginBonusCampaign {
  id: number
  seq: number
  name: string
  startAt: number
  endAt: number
  closeAt?: number
  assetbundleName: string
  limitedLoginBonusDetails: LoginBonusDetail[]
}

interface ResourceDetail {
  seq: number
  resourceType: string
  resourceId?: number
  resourceQuantity: number
}

interface ResourceBox {
  id: number
  resourceBoxPurpose: string
  details: ResourceDetail[]
}

interface NamedResource {
  id: number
  name?: string
  prefix?: string
  assetbundleName?: string
  iconAssetbundleName?: string
  spriteName?: string
}

interface RewardDay {
  day: number
  boxId: number
  rewards: ResourceDetail[]
}

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const campaigns = ref<LoginBonusCampaign[]>([])
const resourceBoxes = ref<ResourceBox[]>([])
const resourceMaps = ref(new Map<string, Map<number, NamedResource>>())
const isLoading = ref(true)
const rewardLoading = ref(false)
const rewardLoaded = ref(false)
const loadError = ref('')
const rewardError = ref('')
const searchQuery = ref('')
const statusFilter = ref<'all' | CampaignStatus>('all')
const selectedYear = ref(0)
const pageSize = 24
const now = Date.now()

const assetsHost = computed(() => settingsStore.assetsHost)
const currentPage = computed(() => Math.max(1, Number(route.query.page) || 1))
const selectedCampaignId = computed(() => Number(route.query.id) || 0)
const selectedCampaign = computed(() => campaigns.value.find(row => row.id === selectedCampaignId.value) || null)

const availableYears = computed(() => [...new Set(campaigns.value.map(row => new Date(row.startAt).getFullYear()))].sort((a, b) => b - a))

function campaignStatus(campaign: LoginBonusCampaign): CampaignStatus {
  if (now < campaign.startAt) return 'upcoming'
  if (now <= campaign.endAt) return 'active'
  return 'ended'
}

const statusMeta: Record<CampaignStatus, { label: string; badge: string }> = {
  active: { label: '进行中', badge: 'badge-success' },
  upcoming: { label: '未开始', badge: 'badge-info' },
  ended: { label: '已结束', badge: 'badge-ghost' },
}

const filteredCampaigns = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return campaigns.value
    .filter(row => settingsStore.showSpoilers || row.startAt <= now)
    .filter(row => statusFilter.value === 'all' || campaignStatus(row) === statusFilter.value)
    .filter(row => !selectedYear.value || new Date(row.startAt).getFullYear() === selectedYear.value)
    .filter(row => !query || [row.id, row.name, row.assetbundleName].some(value => String(value).toLocaleLowerCase().includes(query)))
    .sort((a, b) => b.startAt - a.startAt || b.id - a.id)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredCampaigns.value.length / pageSize)))
const paginatedCampaigns = computed(() => {
  const page = Math.min(currentPage.value, totalPages.value)
  return filteredCampaigns.value.slice((page - 1) * pageSize, page * pageSize)
})

const summary = computed(() => ({
  total: campaigns.value.length,
  active: campaigns.value.filter(row => campaignStatus(row) === 'active').length,
  upcoming: campaigns.value.filter(row => campaignStatus(row) === 'upcoming').length,
  rewardDays: campaigns.value.reduce((sum, row) => sum + row.limitedLoginBonusDetails.length, 0),
}))

const loginBonusBoxMap = computed(() => new Map(resourceBoxes.value
  .filter(box => box.resourceBoxPurpose === 'login_bonus')
  .map(box => [box.id, box])))

const selectedRewardDays = computed<RewardDay[]>(() => {
  if (!selectedCampaign.value || !rewardLoaded.value) return []
  return [...selectedCampaign.value.limitedLoginBonusDetails]
    .sort((a, b) => a.day - b.day)
    .map(detail => ({
      day: detail.day,
      boxId: detail.resourceBoxId,
      rewards: [...(loginBonusBoxMap.value.get(detail.resourceBoxId)?.details || [])].sort((a, b) => a.seq - b.seq),
    }))
})

watch([searchQuery, statusFilter, selectedYear], () => {
  const query = { ...route.query }
  delete query.page
  void router.replace({ query })
})
watch(totalPages, total => {
  if (currentPage.value > total) void setPage(total)
})
watch(selectedCampaign, campaign => {
  if (campaign) void ensureRewardData()
})

function setPage(page: number) {
  const query = { ...route.query }
  if (page > 1) query.page = String(page)
  else delete query.page
  return router.push({ query })
}

function openCampaign(campaign: LoginBonusCampaign) {
  void router.replace({ query: { ...route.query, id: String(campaign.id) } })
}

function closeCampaign() {
  const query = { ...route.query }
  delete query.id
  void router.replace({ query })
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString('zh-CN')
}

async function ensureRewardData() {
  if (rewardLoaded.value || rewardLoading.value) return
  rewardLoading.value = true
  rewardError.value = ''
  try {
    const [boxes, materials, boosts, practice, skill, tickets, cards, stamps, mysekaiMaterials, mysekaiTools, fixtures, avatars, profileResources] = await Promise.all([
      masterStore.getMaster<ResourceBox>('resourceBoxes'),
      masterStore.getMaster<NamedResource>('materials'),
      masterStore.getMaster<NamedResource>('boostItems'),
      masterStore.getMaster<NamedResource>('practiceTickets'),
      masterStore.getMaster<NamedResource>('skillPracticeTickets'),
      masterStore.getMaster<NamedResource>('gachaTickets'),
      masterStore.getMaster<NamedResource>('cards'),
      masterStore.getMaster<NamedResource>('stamps'),
      masterStore.getMaster<NamedResource>('mysekaiMaterials'),
      masterStore.getMaster<NamedResource>('mysekaiTools'),
      masterStore.getMaster<NamedResource>('mysekaiFixtures'),
      masterStore.getMaster<NamedResource>('avatarCoordinates'),
      masterStore.getMaster<NamedResource>('customProfileCollectionResources'),
    ])
    resourceBoxes.value = boxes
    resourceMaps.value = new Map([
      ['material', new Map(materials.map(row => [row.id, row]))],
      ['boost_item', new Map(boosts.map(row => [row.id, row]))],
      ['practice_ticket', new Map(practice.map(row => [row.id, row]))],
      ['skill_practice_ticket', new Map(skill.map(row => [row.id, row]))],
      ['gacha_ticket', new Map(tickets.map(row => [row.id, row]))],
      ['card', new Map(cards.map(row => [row.id, row]))],
      ['stamp', new Map(stamps.map(row => [row.id, row]))],
      ['mysekai_material', new Map(mysekaiMaterials.map(row => [row.id, row]))],
      ['mysekai_tool', new Map(mysekaiTools.map(row => [row.id, row]))],
      ['mysekai_fixture', new Map(fixtures.map(row => [row.id, row]))],
      ['avatar_coordinate', new Map(avatars.map(row => [row.id, row]))],
      ['custom_profile_collection_resource', new Map(profileResources.map(row => [row.id, row]))],
    ])
    rewardLoaded.value = true
  } catch (error) {
    rewardError.value = error instanceof Error ? error.message : '奖励数据加载失败'
  } finally {
    rewardLoading.value = false
  }
}

const resourceTypeLabels: Record<string, string> = {
  jewel: '水晶', coin: '金币', virtual_coin: '虚拟币', material: '素材', boost_item: '体力道具',
  practice_ticket: '练习券', skill_practice_ticket: '技能券', gacha_ticket: '招募券', card: '成员',
  stamp: '表情贴图', mysekai_material: 'MySekai 素材', mysekai_tool: 'MySekai 工具',
  mysekai_fixture: 'MySekai 家具', avatar_coordinate: '虚拟形象套装',
  custom_profile_collection_resource: '个人资料素材',
}

function resourceName(resource: ResourceDetail): string {
  const typeLabel = resourceTypeLabels[resource.resourceType] || resource.resourceType
  const id = Number(resource.resourceId || 0)
  if (!id) return typeLabel
  const row = resourceMaps.value.get(resource.resourceType)?.get(id)
  if (resource.resourceType === 'card' && row?.prefix) return `「${row.prefix}」`
  if (resource.resourceType === 'stamp' && row?.name) return row.name.replace(/^\[スタンプ\]/, '')
  return row?.name || `${typeLabel} #${id}`
}

function resourceIcon(resource: ResourceDetail): string {
  const id = Number(resource.resourceId || 0)
  const row = resourceMaps.value.get(resource.resourceType)?.get(id)
  if (['jewel', 'coin', 'virtual_coin'].includes(resource.resourceType)) {
    return `${assetsHost.value}/startapp/thumbnail/common_material/${resource.resourceType}.png`
  }
  if (resource.resourceType === 'material') return `${assetsHost.value}/startapp/thumbnail/material/material${id}.png`
  if (resource.resourceType === 'boost_item') return `${assetsHost.value}/startapp/thumbnail/boost_item/boost_item${id}.png`
  if (resource.resourceType === 'practice_ticket') return `${assetsHost.value}/startapp/thumbnail/practice_ticket/ticket${id}.png`
  if (resource.resourceType === 'skill_practice_ticket') return `${assetsHost.value}/startapp/thumbnail/skill_practice_ticket/ticket${id}.png`
  if (resource.resourceType === 'gacha_ticket' && row?.assetbundleName) return `${assetsHost.value}/startapp/thumbnail/gacha_ticket/${row.assetbundleName}.png`
  if (resource.resourceType === 'card' && row?.assetbundleName) return `${assetsHost.value}/startapp/thumbnail/chara/${row.assetbundleName}_normal.png`
  if (resource.resourceType === 'stamp' && row?.assetbundleName) return `${assetsHost.value}/startapp/stamp/${row.assetbundleName}/${row.assetbundleName}.png`
  if (resource.resourceType === 'mysekai_material' && row?.iconAssetbundleName) return `${assetsHost.value}/ondemand/mysekai/thumbnail/material/${row.iconAssetbundleName}.png`
  return ''
}

onMounted(async () => {
  try {
    campaigns.value = await masterStore.getMaster<LoginBonusCampaign>('limitedLoginBonuses')
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Master 数据加载失败'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5">
    <PageHeader title="登录活动档案" description="查看历次限时登录活动的开放时间、领取天数与每日奖励。">
      <template #icon><Gift class="h-8 w-8 text-primary" /></template>
    </PageHeader>

    <section class="grid grid-cols-2 gap-2 md:grid-cols-4">
      <div class="rounded-xl border border-base-200 bg-base-100 px-3 py-2"><p class="text-[11px] text-base-content/45">收录活动</p><p class="text-lg font-bold">{{ summary.total }}</p></div>
      <div class="rounded-xl border border-base-200 bg-base-100 px-3 py-2"><p class="text-[11px] text-base-content/45">进行中</p><p class="text-lg font-bold text-success">{{ summary.active }}</p></div>
      <div class="rounded-xl border border-base-200 bg-base-100 px-3 py-2"><p class="text-[11px] text-base-content/45">未开始</p><p class="text-lg font-bold text-info">{{ summary.upcoming }}</p></div>
      <div class="rounded-xl border border-base-200 bg-base-100 px-3 py-2"><p class="text-[11px] text-base-content/45">奖励日记录</p><p class="text-lg font-bold text-primary">{{ summary.rewardDays }}</p></div>
    </section>

    <section class="card border border-base-200 bg-base-100 shadow-sm">
      <div class="card-body grid gap-2 p-3 md:grid-cols-[minmax(0,1fr)_180px_150px]">
        <label class="input input-sm input-bordered flex items-center gap-2"><Search class="h-4 w-4 opacity-50" /><input v-model="searchQuery" class="grow min-w-0" placeholder="搜索活动名称、资源包名或 ID…" /><button v-if="searchQuery" class="btn btn-circle btn-ghost btn-xs" @click="searchQuery = ''"><X class="h-3 w-3" /></button></label>
        <select v-model="statusFilter" class="select select-sm select-bordered"><option value="all">全部状态</option><option value="active">进行中</option><option value="upcoming">未开始</option><option value="ended">已结束</option></select>
        <select v-model.number="selectedYear" class="select select-sm select-bordered"><option :value="0">全部年份</option><option v-for="year in availableYears" :key="year" :value="year">{{ year }} 年</option></select>
      </div>
    </section>

    <div v-if="isLoading" class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"><div v-for="index in 12" :key="index" class="skeleton aspect-[2338/1900] rounded-xl"></div></div>
    <div v-else-if="loadError" class="alert alert-error">登录活动加载失败：{{ loadError }}</div>
    <template v-else>
      <div class="flex items-center justify-between gap-3"><p class="text-sm font-medium">{{ filteredCampaigns.length }} 个登录活动</p><p class="text-xs text-base-content/45">按开放时间从新到旧</p></div>
      <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <button v-for="campaign in paginatedCampaigns" :key="campaign.id" class="group overflow-hidden rounded-xl border border-base-200 bg-base-100 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md" @click="openCampaign(campaign)">
          <div class="relative aspect-[2338/1100] overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20">
            <div class="absolute inset-0 grid place-items-center transition-transform duration-300 group-hover:scale-105"><Gift class="h-10 w-10 text-primary/30" /></div>
            <span class="absolute bottom-2 left-3 text-xs font-bold text-base-content/30">{{ new Date(campaign.startAt).getFullYear() }}</span>
            <span class="absolute right-2 top-2 badge badge-sm border-0 shadow-sm" :class="statusMeta[campaignStatus(campaign)].badge">{{ statusMeta[campaignStatus(campaign)].label }}</span>
          </div>
          <div class="space-y-2 p-3">
            <h2 class="line-clamp-2 min-h-10 text-sm font-bold leading-5">{{ campaign.name }}</h2>
            <div class="flex items-center justify-between gap-2 text-[11px] text-base-content/50"><span class="flex items-center gap-1"><CalendarDays class="h-3 w-3" />{{ new Date(campaign.startAt).toLocaleDateString('zh-CN') }}</span><span>{{ campaign.limitedLoginBonusDetails.length }} 天</span></div>
          </div>
        </button>
      </div>
      <div v-if="!paginatedCampaigns.length" class="rounded-xl border border-base-200 bg-base-100 py-16 text-center text-sm text-base-content/45">没有符合筛选条件的登录活动</div>
      <Pagination v-if="totalPages > 1" :current-page="Math.min(currentPage, totalPages)" :total-pages="totalPages" base-url="/login-bonuses" @page-change="setPage" />
    </template>

    <dialog class="modal" :class="{ 'modal-open': selectedCampaign }">
      <div v-if="selectedCampaign" class="modal-box max-w-4xl p-0">
        <div class="relative h-24 overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20">
          <div class="absolute inset-0 grid place-items-center"><Gift class="h-12 w-12 text-primary/20" /></div>
          <div class="absolute inset-0 bg-gradient-to-t from-base-100 via-transparent to-transparent"></div>
          <button class="btn btn-circle btn-sm absolute right-3 top-3 border-0 bg-base-100/85" @click="closeCampaign"><X class="h-4 w-4" /></button>
        </div>
        <header class="relative -mt-8 space-y-2 border-b border-base-200 px-5 pb-4">
          <div class="flex flex-wrap items-center gap-2"><span class="badge" :class="statusMeta[campaignStatus(selectedCampaign)].badge">{{ statusMeta[campaignStatus(selectedCampaign)].label }}</span><span class="badge badge-ghost">#{{ selectedCampaign.id }}</span><span class="badge badge-ghost">{{ selectedCampaign.limitedLoginBonusDetails.length }} 天</span></div>
          <h2 class="text-xl font-bold">{{ selectedCampaign.name }}</h2>
          <p class="text-xs text-base-content/55">{{ formatDate(selectedCampaign.startAt) }} — {{ formatDate(selectedCampaign.endAt) }}</p>
        </header>
        <div class="max-h-[58vh] overflow-y-auto bg-base-200/40 p-4">
          <div v-if="rewardLoading" class="flex justify-center py-16"><span class="loading loading-spinner loading-lg text-primary"></span></div>
          <div v-else-if="rewardError" class="alert alert-error"><span>{{ rewardError }}</span><button class="btn btn-sm" @click="ensureRewardData">重试</button></div>
          <div v-else class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="day in selectedRewardDays" :key="`${selectedCampaign.id}-${day.day}`" class="rounded-xl border border-base-200 bg-base-100 p-3">
              <div class="mb-2 flex items-center justify-between"><span class="font-bold text-primary">Day {{ day.day }}</span><span class="text-[10px] text-base-content/35">Box #{{ day.boxId }}</span></div>
              <div v-if="day.rewards.length" class="space-y-2">
                <div v-for="reward in day.rewards" :key="`${reward.seq}-${reward.resourceType}-${reward.resourceId || 0}`" class="flex items-center gap-2">
                  <AssetImage v-if="resourceIcon(reward)" :src="resourceIcon(reward)" :alt="resourceName(reward)" class="h-9 w-9 shrink-0 object-contain" />
                  <div v-else class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10"><Gift class="h-4 w-4 text-primary" /></div>
                  <div class="min-w-0 flex-1"><p class="truncate text-xs" :title="resourceName(reward)">{{ resourceName(reward) }}</p><p class="font-bold">× {{ formatNumber(reward.resourceQuantity) }}</p></div>
                </div>
              </div>
              <p v-else class="text-xs text-base-content/40">奖励箱数据缺失</p>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="closeCampaign">关闭</button></form>
    </dialog>
  </div>
</template>
