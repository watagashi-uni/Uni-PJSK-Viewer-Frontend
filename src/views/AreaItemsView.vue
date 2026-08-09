<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Coins, Search, Wrench, X } from 'lucide-vue-next'
import AccountSelector from '@/components/AccountSelector.vue'
import AssetImage from '@/components/AssetImage.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAccountStore } from '@/stores/account'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import type { GameCharacterData } from '@/types/master'

interface AreaData {
  id: number
  name: string
}

interface AreaItem {
  id: number
  areaId: number
  name: string
  flavorText?: string
  assetbundleName: string
}

interface AreaItemLevel {
  areaItemId: number
  level: number
  targetUnit: string
  targetCardAttr: string
  targetGameCharacterId?: number
  power1BonusRate: number
  power1AllMatchBonusRate: number
  sentence: string
}

interface MaterialData {
  id: number
  seq: number
  name: string
  flavorText?: string
  materialType: string
}

interface ResourceDetail {
  resourceType: string
  resourceId?: number
  resourceLevel?: number
}

interface ResourceBox {
  resourceBoxPurpose: string
  id: number
  details: ResourceDetail[]
}

interface ShopCost {
  resourceId?: number
  resourceType: string
  quantity: number
}

interface ShopItem {
  id: number
  resourceBoxId: number
  costs: Array<{ cost: ShopCost }>
}

interface UpgradeCost {
  resourceType: string
  resourceId: number
  quantity: number
}

const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()

const areas = ref<AreaData[]>([])
const areaItems = ref<AreaItem[]>([])
const areaItemLevels = ref<AreaItemLevel[]>([])
const materials = ref<MaterialData[]>([])
const resourceBoxes = ref<ResourceBox[]>([])
const shopItems = ref<ShopItem[]>([])
const characters = ref<GameCharacterData[]>([])
const isLoading = ref(true)
const loadError = ref('')

const searchQuery = ref('')
const selectedAreaId = ref(0)
const selectedTargetType = ref('')
const selectedItem = ref<AreaItem | null>(null)
const currentLevel = ref(0)
const targetLevel = ref(20)

const assetsHost = computed(() => settingsStore.assetsHost)
const selectedUserId = computed({
  get: () => accountStore.currentUserId || '',
  set: value => { void accountStore.selectAccount(value) },
})
const areaMap = computed(() => new Map(areas.value.map(area => [area.id, area])))
const materialMap = computed(() => new Map(materials.value.map(material => [material.id, material])))
const characterMap = computed(() => new Map(characters.value.map(character => [character.id, character])))

const levelsByItem = computed(() => {
  const map = new Map<number, AreaItemLevel[]>()
  for (const level of areaItemLevels.value) {
    const list = map.get(level.areaItemId) || []
    list.push(level)
    map.set(level.areaItemId, list)
  }
  for (const list of map.values()) list.sort((a, b) => a.level - b.level)
  return map
})

const shopByItemLevel = computed(() => {
  const boxes = new Map(resourceBoxes.value
    .filter(box => box.resourceBoxPurpose === 'shop_item')
    .map(box => [box.id, box]))
  const result = new Map<string, ShopItem>()
  for (const shopItem of shopItems.value) {
    const box = boxes.get(shopItem.resourceBoxId)
    const reward = box?.details?.find(detail => detail.resourceType === 'area_item')
    if (!reward?.resourceId || !reward.resourceLevel) continue
    result.set(`${reward.resourceId}_${reward.resourceLevel}`, shopItem)
  }
  return result
})

const currentLevelMap = computed(() => {
  const map = new Map<number, number>()
  if (!selectedUserId.value) return map
  const suite = accountStore.getSuiteCache(selectedUserId.value)
  const userAreas = suite?.userAreas || suite?.user_areas || []
  for (const area of userAreas) {
    const items = area?.areaItems || area?.area_items || []
    for (const item of items) {
      const id = Number(item?.areaItemId ?? item?.area_item_id)
      const level = Number(item?.level)
      if (Number.isFinite(id) && Number.isFinite(level)) map.set(id, level)
    }
  }
  return map
})

const areaOptions = computed(() => {
  const ids = new Set(areaItems.value.map(item => item.areaId))
  return [...ids]
    .map(id => areaMap.value.get(id) || { id, name: `区域 #${id}` })
    .sort((a, b) => a.id - b.id)
})

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return areaItems.value
    .filter(item => !selectedAreaId.value || item.areaId === selectedAreaId.value)
    .filter(item => !selectedTargetType.value || getTargetType(item) === selectedTargetType.value)
    .filter(item => {
      if (!query) return true
      return [item.id, item.name, areaMap.value.get(item.areaId)?.name, getTargetLabel(item)]
        .some(value => String(value || '').toLocaleLowerCase().includes(query))
    })
    .sort((a, b) => a.areaId - b.areaId || a.id - b.id)
})

const selectedLevels = computed(() => selectedItem.value ? levelsByItem.value.get(selectedItem.value.id) || [] : [])
const currentBonus = computed(() => currentLevel.value > 0
  ? selectedLevels.value.find(level => level.level === currentLevel.value)
  : undefined)
const targetBonus = computed(() => selectedLevels.value.find(level => level.level === targetLevel.value))

const upgradeCosts = computed<UpgradeCost[]>(() => {
  if (!selectedItem.value || targetLevel.value <= currentLevel.value) return []
  const totals = new Map<string, UpgradeCost>()
  for (let level = currentLevel.value + 1; level <= targetLevel.value; level += 1) {
    const shop = shopByItemLevel.value.get(`${selectedItem.value.id}_${level}`)
    for (const entry of shop?.costs || []) {
      const cost = entry.cost
      const resourceId = Number(cost.resourceId || 0)
      const key = `${cost.resourceType}_${resourceId}`
      const existing = totals.get(key) || { resourceType: cost.resourceType, resourceId, quantity: 0 }
      existing.quantity += Number(cost.quantity || 0)
      totals.set(key, existing)
    }
  }
  return [...totals.values()].sort((a, b) => {
    if (a.resourceType === 'coin') return 1
    if (b.resourceType === 'coin') return -1
    return a.resourceId - b.resourceId
  })
})

watch(currentLevel, value => {
  if (targetLevel.value < value) targetLevel.value = value
})

function getLevel(item: AreaItem, level: number): AreaItemLevel | undefined {
  return levelsByItem.value.get(item.id)?.find(row => row.level === level)
}

function getTargetType(item: AreaItem): string {
  const level = getLevel(item, 1)
  if (level?.targetGameCharacterId) return 'character'
  if (level?.targetUnit && level.targetUnit !== 'any') return 'unit'
  if (level?.targetCardAttr && level.targetCardAttr !== 'any') return 'attr'
  return 'other'
}

function getTargetLabel(item: AreaItem): string {
  const level = getLevel(item, 1)
  if (level?.targetGameCharacterId) {
    const character = characterMap.value.get(level.targetGameCharacterId)
    return character ? `${character.firstName || ''}${character.givenName}` : `角色 #${level.targetGameCharacterId}`
  }
  if (level?.targetUnit && level.targetUnit !== 'any') return unitLabel(level.targetUnit)
  if (level?.targetCardAttr && level.targetCardAttr !== 'any') return attrLabel(level.targetCardAttr)
  return '全体'
}

function unitLabel(unit: string): string {
  const labels: Record<string, string> = {
    light_sound: 'Leo/need', idol: 'MORE MORE JUMP!', street: 'Vivid BAD SQUAD',
    theme_park: 'Wonderlands×Showtime', school_refusal: '25时、Nightcord见。', piapro: 'VIRTUAL SINGER',
  }
  return labels[unit] || unit
}

function attrLabel(attr: string): string {
  const labels: Record<string, string> = { cute: 'Cute', cool: 'Cool', pure: 'Pure', happy: 'Happy', mysterious: 'Mysterious' }
  return labels[attr] || attr
}

function cleanSentence(sentence?: string): string {
  return (sentence || '').replace(/<color=[^>]+>/g, '').replace(/<\/color>/g, '')
}

function itemImage(item: AreaItem): string {
  return `${assetsHost.value}/startapp/thumbnail/areaitem/${item.assetbundleName}.png`
}

function materialImage(materialId: number): string {
  return `${assetsHost.value}/startapp/thumbnail/material/material${materialId}.png`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function openItem(item: AreaItem) {
  selectedItem.value = item
  currentLevel.value = currentLevelMap.value.get(item.id) || 0
  const itemLevels = levelsByItem.value.get(item.id) || []
  targetLevel.value = Math.max(currentLevel.value, itemLevels[itemLevels.length - 1]?.level || 20)
}

onMounted(async () => {
  try {
    const [areaData, itemData, levelData, materialData, boxData, shopData, characterData] = await Promise.all([
      masterStore.getMaster<AreaData>('areas'),
      masterStore.getMaster<AreaItem>('areaItems'),
      masterStore.getMaster<AreaItemLevel>('areaItemLevels'),
      masterStore.getMaster<MaterialData>('materials'),
      masterStore.getMaster<ResourceBox>('resourceBoxes'),
      masterStore.getMaster<ShopItem>('shopItems'),
      masterStore.getMaster<GameCharacterData>('gameCharacters'),
    ])
    areas.value = areaData
    areaItems.value = itemData
    areaItemLevels.value = levelData
    materials.value = materialData
    resourceBoxes.value = boxData
    shopItems.value = shopData
    characters.value = characterData
  } catch (error) {
    console.error('加载区域道具数据失败:', error)
    loadError.value = '游戏资料加载失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <PageHeader title="区域道具规划" description="快速查看道具加成，并按账号等级精确计算升级素材与金币。"><template #icon><Wrench class="w-8 h-8 text-primary" /></template></PageHeader>

    <section class="card bg-base-100 border border-base-200 shadow-sm">
      <div class="card-body p-4 gap-4">
        <div class="grid md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_210px_180px_220px] gap-3">
          <label class="input input-bordered flex items-center gap-2"><Search class="w-4 h-4 opacity-50" /><input v-model="searchQuery" class="grow min-w-0" placeholder="搜索道具、区域或加成对象…" /><button v-if="searchQuery" class="btn btn-xs btn-circle btn-ghost" aria-label="清空" @click="searchQuery = ''"><X class="w-3 h-3" /></button></label>
          <select v-model.number="selectedAreaId" class="select select-bordered w-full"><option :value="0">全部区域</option><option v-for="area in areaOptions" :key="area.id" :value="area.id">{{ area.name }}</option></select>
          <select v-model="selectedTargetType" class="select select-bordered w-full"><option value="">全部加成类型</option><option value="character">角色</option><option value="unit">组合</option><option value="attr">属性</option></select>
          <AccountSelector v-if="accountStore.accounts.length" v-model="selectedUserId" />
        </div>
        <p class="text-sm text-base-content/55">{{ filteredItems.length }} 个区域道具<span v-if="selectedUserId"> · 已自动读取账号当前等级</span></p>
      </div>
    </section>

    <div v-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3"><div v-for="index in 18" :key="index" class="skeleton h-52 rounded-xl"></div></div>
    <div v-else-if="loadError" class="alert alert-error">区域道具数据加载失败：{{ loadError }}</div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      <button v-for="item in filteredItems" :key="item.id" class="group card bg-base-100 border border-base-200 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden text-left" @click="openItem(item)">
        <figure class="relative h-28 sm:h-32 bg-gradient-to-br from-base-200 to-base-100 p-2.5"><AssetImage :src="itemImage(item)" :alt="item.name" class="w-full h-full object-contain group-hover:scale-105 transition-transform" /><span v-if="currentLevelMap.has(item.id)" class="absolute top-2 right-2 badge badge-primary badge-sm shadow-sm">Lv.{{ currentLevelMap.get(item.id) }}</span></figure>
        <div class="card-body p-3 gap-1"><span class="text-[10px] text-base-content/45 truncate">{{ areaMap.get(item.areaId)?.name || `区域 #${item.areaId}` }}</span><h2 class="font-bold text-sm line-clamp-2 min-h-10 leading-5">{{ item.name }}</h2><div class="flex items-center justify-between gap-1 mt-1"><span class="badge badge-xs badge-outline max-w-[70%] truncate">{{ getTargetLabel(item) }}</span><span class="text-[10px] font-semibold text-primary whitespace-nowrap">+{{ getLevel(item, 20)?.power1BonusRate || 0 }}%</span></div></div>
      </button>
    </div>

    <dialog class="modal" :class="{ 'modal-open': selectedItem }">
      <div v-if="selectedItem" class="modal-box flex max-h-[calc(100dvh-1rem)] max-w-3xl flex-col overflow-hidden p-0 sm:max-h-[calc(100dvh-2rem)]">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 z-10" aria-label="关闭" @click="selectedItem = null"><X class="w-4 h-4" /></button>
        <div class="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <div class="grid md:grid-cols-[190px_1fr]">
            <div class="bg-gradient-to-br from-base-200 to-base-100 p-5 flex flex-col items-center justify-center"><AssetImage :src="itemImage(selectedItem)" :alt="selectedItem.name" class="w-36 h-36 object-contain" /><span class="badge badge-outline badge-sm mt-3">{{ areaMap.get(selectedItem.areaId)?.name }}</span></div>
            <div class="p-6 space-y-5">
              <div><p class="text-xs text-base-content/45">区域道具 #{{ selectedItem.id }}</p><h2 class="font-bold text-2xl">{{ selectedItem.name }}</h2><p class="text-sm text-base-content/60 mt-1">加成对象：{{ getTargetLabel(selectedItem) }}</p></div>
              <div class="grid grid-cols-2 gap-3">
                <label class="form-control"><span class="label-text mb-2">当前等级</span><select v-model.number="currentLevel" class="select select-bordered"><option :value="0">未购买</option><option v-for="level in selectedLevels" :key="level.level" :value="level.level">Lv.{{ level.level }}</option></select></label>
                <label class="form-control"><span class="label-text mb-2">目标等级</span><select v-model.number="targetLevel" class="select select-bordered"><option v-for="level in selectedLevels.filter(level => level.level >= currentLevel)" :key="level.level" :value="level.level">Lv.{{ level.level }}</option></select></label>
              </div>
              <div class="bg-base-200 rounded-xl p-4 text-sm"><p class="text-base-content/50 text-xs mb-1">加成变化</p><p v-if="targetBonus" class="leading-6">{{ currentBonus ? `${currentBonus.power1BonusRate}%` : '0%' }} → <strong class="text-primary">{{ targetBonus.power1BonusRate }}%</strong></p><p class="text-xs text-base-content/60 mt-1">{{ cleanSentence(targetBonus?.sentence) }}</p></div>
              <div><h3 class="font-bold mb-3">升级成本</h3><div v-if="upgradeCosts.length" class="grid sm:grid-cols-2 gap-2"><div v-for="cost in upgradeCosts" :key="`${cost.resourceType}_${cost.resourceId}`" class="flex items-center gap-3 bg-base-200/70 rounded-lg p-3"><AssetImage v-if="cost.resourceType === 'material'" :src="materialImage(cost.resourceId)" :alt="materialMap.get(cost.resourceId)?.name" class="w-10 h-10 object-contain shrink-0" /><div v-else class="w-10 h-10 rounded-full bg-warning/20 grid place-items-center shrink-0"><Coins class="w-6 h-6 text-warning" /></div><div class="min-w-0"><p class="text-xs text-base-content/55 truncate">{{ cost.resourceType === 'material' ? (materialMap.get(cost.resourceId)?.name || `素材 #${cost.resourceId}`) : '金币' }}</p><p class="font-bold">× {{ formatNumber(cost.quantity) }}</p></div></div></div><p v-else class="text-sm text-base-content/50">目标等级与当前等级相同，无需额外素材。</p></div>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="selectedItem = null">关闭</button></form>
    </dialog>
  </div>
</template>
