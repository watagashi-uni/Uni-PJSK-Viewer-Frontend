<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useMasterStore } from '@/stores/master'
import {
  ArrowLeft,
  Check,
  Dices,
  Scissors,
  Shirt,
  Sparkles,
  UserRoundCog,
} from 'lucide-vue-next'
import Costume3DPreview from '@/components/Costume3DPreview.vue'
import CostumeThumb from '@/components/CostumeThumb.vue'
import { buildCostumeGroups, COSTUME_PART_LABELS } from '@/utils/costume'
import {
  findRuntimePart,
  loadRuntimeRoleData,
  type RuntimeRoleData,
} from '@/utils/haruki3dRegistry'
import type {
  CardCostume3d,
  Costume3d,
  CostumeColorVariant,
  CostumeGroup,
  CostumePart,
} from '@/types/costume'

interface Character {
  id: number
  firstName?: string | null
  givenName: string
  unit: string
  gender: string
}

interface Character3dRole {
  id: number
  characterId: number
  unit: string
}

type PickerPart = 'body' | 'head' | 'hair'

interface PickerItem {
  key: string
  partType: PickerPart
  group: CostumeGroup
  part: CostumePart
  variant: CostumeColorVariant
}

const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const characters = ref<Character[]>([])
const characterRoles = ref<Character3dRole[]>([])
const groups = ref<CostumeGroup[]>([])
const isLoading = ref(true)
const runtimeLoading = ref(false)
const runtimeError = ref('')
const roleTransitionActive = ref(false)
const roleTransitionVisible = ref(false)
const roleTransitionLabel = ref('正在准备角色衣装…')

const selectedCharacterId = ref<number | null>(null)
const selectedUnit = ref('')
const crossBodyEnabled = ref(false)
const bodyCharacterId = ref<number | null>(null)
const bodyUnit = ref('')

const mainRoleData = ref<RuntimeRoleData | null>(null)
const bodyRoleData = ref<RuntimeRoleData | null>(null)

const selectedBody = ref<PickerItem | null>(null)
const selectedHead = ref<PickerItem | null>(null)
const selectedHair = ref<PickerItem | null>(null)
const lastPicked = ref<{ partType: PickerPart; item: PickerItem } | null>(null)
const activePart = ref<PickerPart>('body')
const pickerParts: PickerPart[] = ['body', 'head', 'hair']
const expandedItemKeys = ref<Record<PickerPart, string | null>>({
  body: null,
  head: null,
  hair: null,
})

const searches = ref<Record<PickerPart, string>>({
  body: '',
  head: '',
  hair: '',
})
const displayLimits = ref<Record<PickerPart, number>>({
  body: 90,
  head: 90,
  hair: 90,
})

const now = Date.now()
let roleLoadGeneration = 0
let roleTransitionGeneration = 0
let roleLoaderShowTimer: number | null = null
let roleLoaderShownAt = 0

const ROLE_LOADER_DELAY_MS = 140
const ROLE_LOADER_MIN_VISIBLE_MS = 480

function nextAnimationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()))
}

function clearRoleLoaderShowTimer() {
  if (roleLoaderShowTimer !== null) {
    window.clearTimeout(roleLoaderShowTimer)
    roleLoaderShowTimer = null
  }
}

async function beginRoleTransition(label: string, update: () => void) {
  const generation = ++roleTransitionGeneration
  roleTransitionLabel.value = label
  roleTransitionActive.value = true

  // 快速切换不展示加载动画；超过阈值才在选择器内显示，避免短促闪烁。
  if (!roleTransitionVisible.value) {
    clearRoleLoaderShowTimer()
    roleLoaderShowTimer = window.setTimeout(() => {
      roleLoaderShowTimer = null
      if (generation !== roleTransitionGeneration || !roleTransitionActive.value) return
      roleLoaderShownAt = performance.now()
      roleTransitionVisible.value = true
    }, ROLE_LOADER_DELAY_MS)
  }

  // 先让按钮反馈完成一帧，再更新角色数据。
  await nextTick()
  await nextAnimationFrame()
  if (generation !== roleTransitionGeneration) return
  update()
}

async function finishRoleTransition(generation = roleTransitionGeneration) {
  if (generation !== roleTransitionGeneration) return
  roleTransitionActive.value = false
  clearRoleLoaderShowTimer()
  if (!roleTransitionVisible.value) return

  const remaining = ROLE_LOADER_MIN_VISIBLE_MS - (performance.now() - roleLoaderShownAt)
  if (remaining > 0) {
    await new Promise(resolve => window.setTimeout(resolve, remaining))
  }
  if (generation === roleTransitionGeneration && !roleTransitionActive.value) {
    roleTransitionVisible.value = false
  }
}

const sortedCharacters = computed(() =>
  [...characters.value].filter(character => character.id <= 26).sort((a, b) => a.id - b.id)
)

const selectedCharacter = computed(() =>
  characters.value.find(character => character.id === selectedCharacterId.value) ?? null
)

const selectedBodyCharacter = computed(() =>
  characters.value.find(character => character.id === effectiveBodyCharacterId.value) ?? null
)

const effectiveBodyCharacterId = computed(() =>
  crossBodyEnabled.value
    ? (bodyCharacterId.value ?? selectedCharacterId.value)
    : selectedCharacterId.value
)

function unitsFor(characterId: number | null): string[] {
  if (characterId === null) return []
  const units = [...new Set(
    characterRoles.value
      .filter(entry => entry.characterId === characterId)
      .sort((a, b) => a.id - b.id)
      .map(entry => entry.unit)
  )]
  if (units.length > 0) return units
  const character = characters.value.find(entry => entry.id === characterId)
  return character ? [character.unit] : []
}

const mainUnitOptions = computed(() => unitsFor(selectedCharacterId.value))
const bodyUnitOptions = computed(() => unitsFor(effectiveBodyCharacterId.value))

function characterName(character: Character | null | undefined): string {
  if (!character) return ''
  return `${character.firstName ?? ''}${character.givenName}`
}

function itemList(partType: PickerPart): PickerItem[] {
  const characterId = partType === 'body'
    ? effectiveBodyCharacterId.value
    : selectedCharacterId.value
  const roleData = partType === 'body' ? bodyRoleData.value : mainRoleData.value
  if (characterId === null || !roleData) return []

  const items: PickerItem[] = []
  for (const group of groups.value) {
    if (group.characterId !== characterId) continue
    if (!settingsStore.showSpoilers && group.publishedAt > now) continue
    const part = group.parts.find(entry => entry.partType === partType)
    if (!part) continue
    const usableVariants = part.variants.filter(variant =>
      findRuntimePart(
        roleData,
        variant.costume3dId,
        partType === 'head' ? ['head', 'head_optional'] : [partType],
      )
    )
    const firstVariant = usableVariants[0]
    if (!firstVariant) continue
    items.push({
      key: `${characterId}:${partType}:${group.key}`,
      partType,
      group,
      part: { ...part, variants: usableVariants },
      variant: firstVariant,
    })
  }
  return items.sort((a, b) => b.group.representativeId - a.group.representativeId)
}

const baseItems = computed<Record<PickerPart, PickerItem[]>>(() => ({
  body: itemList('body'),
  head: itemList('head'),
  hair: itemList('hair'),
}))

function assetFamily(name: string): string {
  return name
    .toLowerCase()
    .replace(/unique_/g, '')
    .replace(/_(?:body|head|hair)(?:_\d+)?$/i, '')
    .replace(/_\d+$/i, '')
}

function relationScore(candidate: PickerItem, anchor: PickerItem): number {
  if (candidate.group.groupId === anchor.group.groupId) {
    return candidate.variant.colorId === anchor.variant.colorId ? 0 : 1
  }
  if (candidate.group.name === anchor.group.name) {
    return candidate.variant.colorId === anchor.variant.colorId ? 2 : 3
  }
  if (assetFamily(candidate.variant.assetbundleName) === assetFamily(anchor.variant.assetbundleName)) {
    return candidate.variant.colorId === anchor.variant.colorId ? 4 : 5
  }
  return Number.POSITIVE_INFINITY
}

function buildOrderedItems(partType: PickerPart): PickerItem[] {
  const query = searches.value[partType].trim().toLowerCase()
  let items = baseItems.value[partType]
  if (query) {
    items = items.filter(item =>
      item.group.name.toLowerCase().includes(query)
      || item.part.variants.some(variant =>
        variant.colorName.toLowerCase().includes(query)
        || String(variant.costume3dId).includes(query)
      )
    )
  }

  const anchor = lastPicked.value?.partType === partType ? null : lastPicked.value?.item
  if (!anchor) return items
  return [...items].sort((a, b) => {
    const score = relationScore(a, anchor) - relationScore(b, anchor)
    return Number.isNaN(score) || score === 0
      ? b.group.representativeId - a.group.representativeId
      : score
  })
}

const orderedItemLists = computed<Record<PickerPart, PickerItem[]>>(() => ({
  body: buildOrderedItems('body'),
  head: buildOrderedItems('head'),
  hair: buildOrderedItems('hair'),
}))

function orderedItems(partType: PickerPart): PickerItem[] {
  return orderedItemLists.value[partType]
}

function visibleItems(partType: PickerPart): PickerItem[] {
  return orderedItems(partType).slice(0, displayLimits.value[partType])
}

function showMore(partType: PickerPart) {
  displayLimits.value[partType] += 90
}

function isRecommended(item: PickerItem, partType: PickerPart): boolean {
  const anchor = lastPicked.value?.partType === partType ? null : lastPicked.value?.item
  return Boolean(anchor && Number.isFinite(relationScore(item, anchor)))
}

function currentSelection(partType: PickerPart): PickerItem | null {
  if (partType === 'body') return selectedBody.value
  if (partType === 'head') return selectedHead.value
  return selectedHair.value
}

const activeSelection = computed(() => currentSelection(activePart.value))
const activeColorSelection = computed(() => {
  const selection = activeSelection.value
  return selection && expandedItemKeys.value[activePart.value] === selection.key
    ? selection
    : null
})

function selectItem(item: PickerItem) {
  const anchor = lastPicked.value?.partType === item.partType ? null : lastPicked.value?.item
  const matchedColor = anchor && Number.isFinite(relationScore(item, anchor))
    ? item.part.variants.find(variant => variant.colorId === anchor.variant.colorId)
    : undefined
  expandedItemKeys.value[item.partType] = item.key
  applySelection({ ...item, variant: matchedColor ?? item.part.variants[0]! })
}

function selectColor(item: PickerItem, variant: CostumeColorVariant) {
  applySelection({ ...item, variant })
}

function applySelection(item: PickerItem) {
  if (item.partType === 'body') selectedBody.value = item
  else if (item.partType === 'head') selectedHead.value = item
  else selectedHair.value = item
  lastPicked.value = { partType: item.partType, item }
}

function pickerIcon(partType: PickerPart) {
  if (partType === 'body') return Shirt
  if (partType === 'head') return Sparkles
  return Scissors
}

function findDefault(items: PickerItem[], costume3dId: number): PickerItem | null {
  for (const item of items) {
    const variant = item.part.variants.find(entry => entry.costume3dId === costume3dId)
    if (variant) return { ...item, variant }
  }
  return items[0] ?? null
}

function resetSelectionsToDefaults() {
  if (!mainRoleData.value || !bodyRoleData.value) return
  selectedBody.value = findDefault(baseItems.value.body, bodyRoleData.value.defaults.bodyCostume3dId)
  selectedHead.value = findDefault(baseItems.value.head, mainRoleData.value.defaults.headCostume3dId)
  selectedHair.value = findDefault(baseItems.value.hair, mainRoleData.value.defaults.hairCostume3dId)
  displayLimits.value = { body: 90, head: 90, hair: 90 }
  expandedItemKeys.value = { body: null, head: null, hair: null }
  lastPicked.value = null
}

async function loadRoleData(resetAll: boolean) {
  if (selectedCharacterId.value === null || !selectedUnit.value) return
  const targetCharacterId = effectiveBodyCharacterId.value
  if (targetCharacterId === null || !bodyUnit.value) return

  const generation = ++roleLoadGeneration
  const transitionGeneration = roleTransitionGeneration
  const mainCharacterId = selectedCharacterId.value
  const mainUnit = selectedUnit.value
  const bodyCharacter = targetCharacterId
  const targetUnit = bodyUnit.value
  runtimeLoading.value = true
  runtimeError.value = ''
  try {
    const [main, body] = await Promise.all([
      loadRuntimeRoleData(mainCharacterId, mainUnit),
      loadRuntimeRoleData(bodyCharacter, targetUnit),
    ])
    if (generation !== roleLoadGeneration) return
    mainRoleData.value = main
    bodyRoleData.value = body
    if (resetAll) {
      resetSelectionsToDefaults()
    } else {
      selectedBody.value = findDefault(baseItems.value.body, body.defaults.bodyCostume3dId)
      displayLimits.value.body = 90
      expandedItemKeys.value.body = null
      lastPicked.value = null
    }
  } catch (error) {
    if (generation !== roleLoadGeneration) return
    console.error('加载自由选择器 3D registry 失败:', error)
    runtimeError.value = error instanceof Error ? error.message : String(error)
  } finally {
    if (generation === roleLoadGeneration) {
      runtimeLoading.value = false
      void finishRoleTransition(transitionGeneration)
    }
  }
}

function chooseCharacter(characterId: number) {
  if (selectedCharacterId.value === characterId) return
  const character = characters.value.find(entry => entry.id === characterId)
  void beginRoleTransition(`正在换成 ${characterName(character)}…`, () => {
    selectedCharacterId.value = characterId
    selectedUnit.value = unitsFor(characterId)[0] ?? ''
    if (!crossBodyEnabled.value) {
      bodyCharacterId.value = characterId
      bodyUnit.value = selectedUnit.value
    }
  })
}

function toggleCrossBody() {
  const willEnable = !crossBodyEnabled.value
  void beginRoleTransition(willEnable ? '正在开启跨角色身体…' : '正在恢复角色身体…', () => {
    crossBodyEnabled.value = willEnable
    bodyCharacterId.value = selectedCharacterId.value
    bodyUnit.value = crossBodyEnabled.value
      ? (unitsFor(bodyCharacterId.value)[0] ?? '')
      : selectedUnit.value
  })
}

function chooseBodyCharacter(characterId: number) {
  if (bodyCharacterId.value === characterId) return
  const character = characters.value.find(entry => entry.id === characterId)
  void beginRoleTransition(`正在加载 ${characterName(character)} 的身体…`, () => {
    bodyCharacterId.value = characterId
    bodyUnit.value = unitsFor(characterId)[0] ?? ''
  })
}

const previewSelection = computed(() => ({
  body: selectedBody.value?.variant ?? null,
  head: selectedHead.value?.variant ?? null,
  hair: selectedHair.value?.variant ?? null,
}))

const previewBodyRole = computed(() => {
  if (!crossBodyEnabled.value || effectiveBodyCharacterId.value === null) return null
  return {
    characterId: effectiveBodyCharacterId.value,
    unit: bodyUnit.value,
  }
})

watch([selectedCharacterId, selectedUnit], ([characterId]) => {
  if (characterId === null || !selectedUnit.value) return
  if (!crossBodyEnabled.value) {
    bodyCharacterId.value = characterId
    bodyUnit.value = selectedUnit.value
  }
  void loadRoleData(true)
})

watch([crossBodyEnabled, bodyCharacterId, bodyUnit], ([enabled], previous) => {
  if (selectedCharacterId.value === null || !bodyUnit.value) return
  if (!enabled && previous?.[0] === false) return
  void loadRoleData(false)
})

watch(searches, () => {
  displayLimits.value = { body: 90, head: 90, hair: 90 }
}, { deep: true })

async function loadData() {
  isLoading.value = true
  try {
    const [costumes, links, characterData, unitData] = await Promise.all([
      masterStore.getMaster<Costume3d>('costume3ds'),
      masterStore.getMaster<CardCostume3d>('cardCostume3ds'),
      masterStore.getMaster<Character>('gameCharacters'),
      masterStore.getMaster<Character3dRole>('character3ds'),
    ])
    groups.value = buildCostumeGroups(costumes, links)
    characters.value = characterData
    characterRoles.value = unitData
  } catch (error) {
    console.error('加载自由选择器数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
onBeforeUnmount(() => {
  roleTransitionGeneration += 1
  clearRoleLoaderShowTimer()
})
</script>

<template>
  <div class="space-y-6 pb-12">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <RouterLink to="/costumes" class="btn btn-ghost btn-sm gap-1 -ml-3 mb-1">
          <ArrowLeft class="w-4 h-4" /> 返回衣装一览
        </RouterLink>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <Dices class="w-6 h-6 text-primary" />
          衣装自由选择器
        </h1>
        <p class="text-sm text-base-content/55 mt-1">
          自由组合服装、发饰与发型；选中一个部件后，同套部件会排到其他栏最前。
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-24">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else>
      <section class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
          <h2 class="text-sm font-bold text-base-content/65 mb-1">1. 选择角色</h2>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="character in sortedCharacters"
              :key="character.id"
              class="btn btn-sm h-10 min-h-10 gap-1.5 pl-1.5 pr-2"
              :class="selectedCharacterId === character.id ? 'btn-primary' : 'btn-outline'"
              @click="chooseCharacter(character.id)"
            >
              <span class="h-7 w-7 overflow-hidden rounded-full bg-base-200">
                <img
                  :src="`/img/chr_ts/chr_ts_90_${character.id}.png`"
                  :alt="characterName(character)"
                  class="h-full w-full object-cover"
                />
              </span>
              {{ characterName(character) }}
            </button>
          </div>
          <select
            v-if="selectedCharacterId !== null && mainUnitOptions.length > 1"
            v-model="selectedUnit"
            class="select select-bordered select-sm w-full max-w-xs mt-3"
          >
            <option v-for="unit in mainUnitOptions" :key="unit" :value="unit">{{ unit }}</option>
          </select>
        </div>
      </section>

      <div v-if="selectedCharacterId === null" class="text-center py-20 text-base-content/45">
        <Dices class="w-16 h-16 mx-auto mb-3 opacity-25" />
        请先选择一名角色
      </div>

      <template v-else>
        <section class="card border border-secondary/30 bg-secondary/5 shadow-sm">
          <div class="card-body p-4 gap-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="font-bold flex items-center gap-2">
                  <UserRoundCog class="w-5 h-5 text-secondary" /> 娱乐：跨角色身体
                  <span class="badge badge-secondary badge-sm">实验</span>
                </h2>
                <p class="text-xs text-base-content/55 mt-1">
                  保留 {{ characterName(selectedCharacter) }} 的头部与发型，加载目标角色的身体；目标不限性别。
                </p>
              </div>
              <button
                class="btn btn-sm"
                :class="crossBodyEnabled ? 'btn-secondary' : 'btn-outline'"
                @click="toggleCrossBody"
              >
                {{ crossBodyEnabled ? '已开启' : '开启' }}
              </button>
            </div>

            <template v-if="crossBodyEnabled">
              <div class="flex flex-wrap gap-2 pt-2 border-t border-secondary/20">
                <button
                  v-for="character in sortedCharacters"
                  :key="character.id"
                  class="btn btn-xs h-9 min-h-9 gap-1 pl-1 pr-2"
                  :class="effectiveBodyCharacterId === character.id ? 'btn-secondary' : 'btn-outline'"
                  @click="chooseBodyCharacter(character.id)"
                >
                  <span class="h-6 w-6 overflow-hidden rounded-full bg-base-200">
                    <img
                      :src="`/img/chr_ts/chr_ts_90_${character.id}.png`"
                      :alt="characterName(character)"
                      class="h-full w-full object-cover"
                    />
                  </span>
                  {{ characterName(character) }}
                </button>
              </div>
              <select
                v-if="bodyUnitOptions.length > 1"
                v-model="bodyUnit"
                class="select select-bordered select-sm w-full max-w-xs"
              >
                <option v-for="unit in bodyUnitOptions" :key="unit" :value="unit">{{ unit }}</option>
              </select>
            </template>
          </div>
        </section>

        <div v-if="runtimeError" class="alert alert-error text-sm">
          {{ runtimeError }}
        </div>

        <div class="relative min-h-72 rounded-xl">
          <div
            class="space-y-6 transition-opacity duration-200"
            :class="{ 'pointer-events-none select-none opacity-45': roleTransitionVisible }"
            :aria-busy="roleTransitionActive || runtimeLoading"
          >
            <div role="tablist" class="tabs tabs-box bg-base-100 shadow-sm p-1">
              <button
                v-for="partType in pickerParts"
                :key="partType"
                role="tab"
                class="tab h-11 flex-1 gap-1.5"
                :class="{ 'tab-active': activePart === partType }"
                @click="activePart = partType"
              >
                <component :is="pickerIcon(partType)" class="w-4 h-4" />
                {{ COSTUME_PART_LABELS[partType] }}
                <span class="text-[10px] opacity-55">{{ baseItems[partType].length }}</span>
              </button>
            </div>

            <section class="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
              <div class="card-body p-0 gap-0">
                <div class="p-3 sm:p-4 border-b border-base-200">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <h2 class="font-bold flex items-center gap-2">
                      <component :is="pickerIcon(activePart)" class="w-5 h-5 text-primary" />
                      选择{{ COSTUME_PART_LABELS[activePart] }}
                      <span class="badge badge-ghost badge-sm">{{ baseItems[activePart].length }} 套</span>
                    </h2>
                    <p v-if="activePart === 'body' && crossBodyEnabled" class="text-xs text-secondary">
                      身体来源：{{ characterName(selectedBodyCharacter) }}
                    </p>
                  </div>
                  <label class="input input-bordered input-sm flex items-center gap-2 mt-3">
                    <input
                      v-model="searches[activePart]"
                      class="grow"
                      :placeholder="`搜索${COSTUME_PART_LABELS[activePart]}名称 / ID`"
                    />
                  </label>
                </div>

                <div class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-1.5 sm:gap-2 p-2 sm:p-3 max-h-[34rem] overflow-y-auto">
                  <button
                    v-for="(item, index) in visibleItems(activePart)"
                    :key="item.key"
                    class="relative min-w-0 rounded-lg border p-1 sm:p-1.5 text-left transition-all hover:border-primary hover:bg-primary/5"
                    :class="currentSelection(activePart)?.key === item.key
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-base-300 bg-base-100'"
                    @click="selectItem(item)"
                  >
                    <span
                      v-if="index === 0 && isRecommended(item, activePart)"
                      class="badge badge-accent badge-xs absolute top-0.5 left-0.5 z-10 max-w-[calc(100%-0.25rem)] truncate"
                    >
                      同套
                    </span>
                    <span
                      v-if="currentSelection(activePart)?.key === item.key"
                      class="absolute top-0.5 right-0.5 z-10 rounded-full bg-primary text-primary-content p-0.5"
                    >
                      <Check class="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </span>
                    <CostumeThumb
                      :assetbundle-name="item.variant.assetbundleName"
                      :alt="item.group.name"
                      class="w-full aspect-square bg-base-200 rounded-md p-0.5"
                    />
                    <p class="text-[10px] sm:text-xs font-medium truncate mt-1" :title="item.group.name">
                      {{ item.group.name }}
                    </p>
                    <p class="text-[9px] sm:text-[10px] text-base-content/45 truncate">
                      {{ item.part.variants.length }} 色
                    </p>
                  </button>
                  <p
                    v-if="visibleItems(activePart).length === 0"
                    class="col-span-full text-center text-sm text-base-content/45 py-12"
                  >
                    没有可加载的部件
                  </p>
                </div>

                <button
                  v-if="orderedItems(activePart).length > displayLimits[activePart]"
                  class="btn btn-ghost btn-sm rounded-none border-t border-base-200"
                  @click="showMore(activePart)"
                >
                  加载更多（剩余 {{ orderedItems(activePart).length - displayLimits[activePart] }} 套）
                </button>

                <div
                  v-if="activeColorSelection && activeColorSelection.part.variants.length > 1"
                  class="border-t border-base-300 bg-base-200/60 p-3 sm:p-4"
                >
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <div class="min-w-0">
                      <p class="text-sm font-semibold truncate">{{ activeColorSelection.group.name }}</p>
                      <p class="text-[10px] text-base-content/50">选择配色</p>
                    </div>
                    <span class="badge badge-primary badge-sm">{{ activeColorSelection.part.variants.length }} 色</span>
                  </div>
                  <div class="flex gap-2 overflow-x-auto pb-1">
                    <button
                      v-for="variant in activeColorSelection.part.variants"
                      :key="variant.costume3dId"
                      class="w-16 sm:w-20 shrink-0 rounded-lg border p-1 transition-all"
                      :class="activeColorSelection.variant.costume3dId === variant.costume3dId
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-base-300 bg-base-100'"
                      @click="selectColor(activeColorSelection, variant)"
                    >
                      <CostumeThumb
                        :assetbundle-name="variant.assetbundleName"
                        :alt="`${activeColorSelection.group.name} ${variant.colorName}`"
                        class="w-full aspect-square rounded-md bg-base-200 p-0.5"
                      />
                      <p class="text-[9px] sm:text-[10px] truncate mt-1">{{ variant.colorName }}</p>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <Transition name="selector-loading">
            <div
              v-if="roleTransitionVisible"
              class="absolute inset-0 z-20 grid place-items-center rounded-xl bg-base-100/75 px-4 backdrop-blur-[2px]"
              role="status"
              aria-live="polite"
            >
              <div class="flex items-center gap-3 rounded-2xl border border-primary/20 bg-base-100 px-4 py-3 shadow-lg">
                <span class="loading loading-spinner loading-md shrink-0 text-primary"></span>
                <div>
                  <p class="text-sm font-semibold text-base-content">{{ roleTransitionLabel }}</p>
                  <p class="mt-0.5 text-[11px] text-base-content/50">正在更新可用衣装</p>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <section class="card bg-base-100 shadow-sm">
          <div class="card-body p-4 sm:p-6">
            <h2 class="font-bold mb-1">3. 预览自由搭配</h2>
            <p class="text-xs text-base-content/50 mb-3">
              不可用或源文件缺失的部件会自动回退到角色默认部件。
            </p>
            <Costume3DPreview
              :character-id="selectedCharacterId"
              :selection="previewSelection"
              :body-role="previewBodyRole"
            />
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.selector-loading-enter-active,
.selector-loading-leave-active {
  transition: opacity 160ms ease;
}

.selector-loading-enter-from,
.selector-loading-leave-to {
  opacity: 0;
}
</style>
