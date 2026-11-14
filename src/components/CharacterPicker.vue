<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronDown, Users, X } from 'lucide-vue-next'
import { useMasterStore } from '@/stores/master'
import { useCharacterName } from '@/composables/useCharacterName'
import { UNITS, characterIconUrl, unitOfCharacter } from '@/utils/units'

/**
 * 角色选择器：全站筛选角色都用它。
 * 头像按团体分组排列，比一长串名字或下拉列表好找。
 * - 单选（默认）：v-model 是角色 ID 或 null；clearable 时再点一次取消
 * - 多选（multiple）：v-model 是角色 ID 数组
 * - dropdown：收成一个按钮，点开后浮出同样的分组面板，用在筛选条里
 * - 传了 units 就可以同时按团体筛选（点团体 logo）
 */
interface CharacterRow {
  id: number
  firstName?: string
  givenName: string
}

type CountSource = Map<number, number> | Record<number, number>
type UnitCountSource = Map<string, number> | Record<string, number>

const props = withDefaults(defineProps<{
  modelValue: number | number[] | null
  multiple?: boolean
  clearable?: boolean
  dropdown?: boolean
  /** dropdown 没选角色时按钮上的文字 */
  allLabel?: string
  /** 每个角色对应的条目数，显示在悬停提示里；配合 hideEmpty 隐藏没有条目的角色 */
  counts?: CountSource
  hideEmpty?: boolean
  /** 已选团体；传入后团体 logo 变成可以点选的筛选项 */
  units?: string[]
  unitCounts?: UnitCountSource
  /** 只列出这些角色（例如活动限定的可选角色）；不传就是全部 26 人 */
  ids?: number[]
  /** 浮层对齐方向（dropdown） */
  align?: 'start' | 'end'
}>(), {
  multiple: false,
  clearable: false,
  dropdown: false,
  allLabel: '全部角色',
  counts: undefined,
  hideEmpty: false,
  units: undefined,
  unitCounts: undefined,
  ids: undefined,
  align: 'start',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | null]
  'update:units': [value: string[]]
}>()

const masterStore = useMasterStore()
const { characterName } = useCharacterName()
const characters = ref<CharacterRow[]>([])

onMounted(async () => {
  try {
    const rows = await masterStore.getMaster<CharacterRow>('gameCharacters')
    characters.value = rows.filter(row => row.id >= 1 && row.id <= 26).sort((a, b) => a.id - b.id)
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
})

function countOf(id: number): number | undefined {
  if (!props.counts) return undefined
  return props.counts instanceof Map ? props.counts.get(id) ?? 0 : props.counts[id] ?? 0
}

function unitCountOf(unit: string): number | undefined {
  if (!props.unitCounts) return undefined
  return props.unitCounts instanceof Map ? props.unitCounts.get(unit) ?? 0 : props.unitCounts[unit] ?? 0
}

const selectedIds = computed<number[]>(() => {
  const value = props.modelValue
  if (Array.isArray(value)) return value
  return value ? [value] : []
})
const selectedSet = computed(() => new Set(selectedIds.value))
const selectedUnits = computed(() => new Set(props.units ?? []))
const unitSelectable = computed(() => props.units !== undefined)
const hasSelection = computed(() => selectedIds.value.length > 0 || selectedUnits.value.size > 0)

const groups = computed(() => UNITS.map(unit => ({
  unit,
  members: characters.value.filter(row => (
    unitOfCharacter(row.id) === unit.value
    && !(props.hideEmpty && countOf(row.id) === 0)
    && (!props.ids || props.ids.includes(row.id))
  )),
})).filter(group => group.members.length > 0))

const nameMap = computed(() => new Map(characters.value.map(row => [row.id, characterName(row)])))
/** 面板窄的时候只显示名（一歌、咲希），放得下；虚拟歌手没有姓，还是全名 */
const shortNameMap = computed(() => new Map(characters.value.map(row => [row.id, characterName({ givenName: row.givenName })])))

function toggleCharacter(id: number) {
  if (props.multiple) {
    const next = selectedSet.value.has(id) ? selectedIds.value.filter(item => item !== id) : [...selectedIds.value, id]
    emit('update:modelValue', next)
    return
  }
  if (selectedSet.value.has(id)) {
    if (props.clearable) emit('update:modelValue', null)
  } else {
    emit('update:modelValue', id)
  }
  if (props.dropdown) close()
}

function toggleUnit(unit: string) {
  if (!unitSelectable.value) return
  const current = props.units ?? []
  emit('update:units', current.includes(unit) ? current.filter(item => item !== unit) : [...current, unit])
}

function clearAll() {
  emit('update:modelValue', props.multiple ? [] : null)
  if (unitSelectable.value && selectedUnits.value.size) emit('update:units', [])
  if (props.dropdown && !props.multiple) close()
}

// ---------------------------------------------------------------- 浮层（dropdown）

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
/** 浮层贴边时往回挪的距离，保证整个面板都在视口里 */
const shiftX = ref(0)

function placePanel() {
  const panel = panelRef.value
  if (!panel) return
  const margin = 8
  shiftX.value = 0
  void nextTick(() => {
    const rect = panel.getBoundingClientRect()
    const viewport = document.documentElement.clientWidth
    if (rect.right > viewport - margin) shiftX.value = viewport - margin - rect.right
    else if (rect.left < margin) shiftX.value = margin - rect.left
  })
}

function open() {
  isOpen.value = true
  void nextTick(placePanel)
}

function close() {
  isOpen.value = false
}

function onDocumentPointerDown(event: PointerEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    event.stopPropagation()
    close()
  }
}

watch(isOpen, (value) => {
  if (value) {
    document.addEventListener('pointerdown', onDocumentPointerDown)
    window.addEventListener('resize', placePanel)
  } else {
    document.removeEventListener('pointerdown', onDocumentPointerDown)
    window.removeEventListener('resize', placePanel)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('resize', placePanel)
})

const triggerLabel = computed(() => {
  const ids = selectedIds.value
  if (ids.length === 0) return props.allLabel
  if (ids.length === 1) return nameMap.value.get(ids[0]!) ?? `角色 #${ids[0]}`
  return `${ids.length} 位角色`
})
</script>

<template>
  <div ref="rootRef" class="chara-picker" :class="{ 'is-dropdown': dropdown }" @keydown="onKeydown">
    <button
      v-if="dropdown"
      type="button"
      class="chara-picker__trigger"
      :class="{ 'is-open': isOpen, 'has-value': selectedIds.length > 0 }"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @click="isOpen ? close() : open()"
    >
      <span v-if="selectedIds.length" class="chara-picker__stack" aria-hidden="true">
        <img v-for="id in selectedIds.slice(0, 3)" :key="id" :src="characterIconUrl(id)" alt="" />
      </span>
      <Users v-else class="h-4 w-4 shrink-0 opacity-50" />
      <span class="min-w-0 flex-1 truncate text-left">{{ triggerLabel }}</span>
      <span
        v-if="selectedIds.length && (clearable || multiple)"
        role="button"
        tabindex="0"
        class="chara-picker__clear"
        aria-label="清除角色筛选"
        @click.stop="clearAll"
        @keydown.enter.stop.prevent="clearAll"
      >
        <X class="h-3.5 w-3.5" />
      </span>
      <ChevronDown class="h-4 w-4 shrink-0 opacity-50 transition-transform" :class="{ 'rotate-180': isOpen }" />
    </button>

    <div
      v-if="!dropdown || isOpen"
      ref="panelRef"
      class="chara-picker__panel"
      :class="[dropdown ? 'is-floating' : '', dropdown && align === 'end' ? 'is-end' : '']"
      :style="dropdown && shiftX ? { transform: `translateX(${shiftX}px)` } : undefined"
      :role="dropdown ? 'dialog' : 'group'"
      aria-label="选择角色"
    >
      <div v-if="dropdown || $slots.label || ((clearable || multiple) && hasSelection)" class="chara-picker__head">
        <span class="chara-picker__title"><slot name="label">{{ multiple ? '选择角色（可多选）' : '选择角色' }}</slot></span>
        <button
          v-if="(clearable || multiple) && hasSelection"
          type="button"
          class="chara-picker__reset"
          @click="clearAll"
        >
          <X class="h-3 w-3" /> 清除
        </button>
      </div>

      <div v-if="!groups.length" class="chara-picker__loading">
        <span class="loading loading-dots loading-sm"></span>
      </div>

      <div v-else class="chara-picker__groups">
        <section
          v-for="group in groups"
          :key="group.unit.value"
          class="chara-picker__group"
          :class="{ 'is-wide': group.members.length > 4 }"
          :style="{ '--unit-color': group.unit.color }"
        >
          <component
            :is="unitSelectable ? 'button' : 'div'"
            :type="unitSelectable ? 'button' : undefined"
            class="chara-picker__unit"
            :class="{ 'is-selectable': unitSelectable, 'is-active': selectedUnits.has(group.unit.value) }"
            :aria-pressed="unitSelectable ? selectedUnits.has(group.unit.value) : undefined"
            :title="unitSelectable ? `筛选 ${group.unit.label}` : group.unit.label"
            @click="toggleUnit(group.unit.value)"
          >
            <span class="chara-picker__unit-bar" aria-hidden="true"></span>
            <span class="chara-picker__unit-logo"><img :src="group.unit.logo" :alt="group.unit.label" /></span>
            <span v-if="unitCountOf(group.unit.value) !== undefined" class="chara-picker__unit-count num">{{ unitCountOf(group.unit.value) }}</span>
          </component>
          <div class="chara-picker__members">
            <button
              v-for="member in group.members"
              :key="member.id"
              type="button"
              class="chara-picker__member"
              :class="{ 'is-active': selectedSet.has(member.id), 'is-dim': selectedIds.length > 0 && !selectedSet.has(member.id) }"
              :aria-pressed="selectedSet.has(member.id)"
              :title="countOf(member.id) !== undefined ? `${nameMap.get(member.id)}（${countOf(member.id)}）` : nameMap.get(member.id)"
              @click="toggleCharacter(member.id)"
            >
              <span class="chara-picker__avatar"><img :src="characterIconUrl(member.id)" :alt="nameMap.get(member.id)" loading="lazy" /></span>
              <span class="chara-picker__name is-full">{{ nameMap.get(member.id) }}</span>
              <span class="chara-picker__name is-short" aria-hidden="true">{{ shortNameMap.get(member.id) }}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chara-picker {
  position: relative;
  min-width: 0;
}

/* ---- 收起时的按钮：和 daisyUI 的 select 同高，放在筛选条里不突兀 ---- */
.chara-picker__trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: var(--size, 2.5rem);
  padding: 0 0.625rem 0 0.75rem;
  border: 1px solid color-mix(in oklab, var(--color-base-content) 20%, transparent);
  border-radius: var(--radius-field);
  background-color: var(--color-base-100);
  font-size: 0.875rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.chara-picker__trigger:hover,
.chara-picker__trigger.is-open {
  border-color: color-mix(in oklab, var(--color-primary) 60%, var(--color-base-300));
}

.chara-picker__trigger.is-open {
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 14%, transparent);
}

.chara-picker__trigger.has-value {
  padding-left: 0.375rem;
  font-weight: 600;
}

.chara-picker__stack {
  display: flex;
  flex: none;
}

.chara-picker__stack img {
  width: 1.75rem;
  height: 1.75rem;
  border: 2px solid var(--color-base-100);
  border-radius: 999px;
  background-color: var(--color-base-200);
}

.chara-picker__stack img + img {
  margin-left: -0.625rem;
}

.chara-picker__clear {
  display: grid;
  flex: none;
  place-items: center;
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 999px;
  color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
}

.chara-picker__clear:hover {
  background-color: color-mix(in oklab, var(--color-base-content) 10%, transparent);
  color: var(--color-base-content);
}

/* ---- 面板 ---- */
.chara-picker__panel {
  container-type: inline-size;
}

.chara-picker__panel.is-floating {
  position: absolute;
  z-index: 40;
  top: calc(100% + 0.375rem);
  left: 0;
  width: min(34rem, calc(100vw - 1rem));
  max-height: min(37rem, 78dvh);
  padding: 0.75rem;
  border: 1px solid var(--color-base-300);
  border-radius: var(--radius-box);
  background-color: var(--color-base-100);
  box-shadow: var(--shadow-float);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.chara-picker__panel.is-floating.is-end {
  right: 0;
  left: auto;
}

.chara-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 1.5rem;
  margin-bottom: 0.5rem;
}

.chara-picker__title {
  color: color-mix(in oklab, var(--color-base-content) 60%, transparent);
  font-size: 0.75rem;
  font-weight: 700;
}

.chara-picker__reset {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background-color: color-mix(in oklab, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
}

.chara-picker__reset:hover {
  background-color: color-mix(in oklab, var(--color-primary) 20%, transparent);
}

.chara-picker__loading {
  display: grid;
  place-items: center;
  min-height: 6rem;
  color: color-mix(in oklab, var(--color-base-content) 40%, transparent);
}

/* 两列排团体；虚拟歌手有六个人，独占一行。面板够宽时改成三列 */
.chara-picker__groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.chara-picker__group {
  min-width: 0;
  padding: 0.5rem 0.5rem 0.375rem;
  border-radius: var(--radius-field);
  background-color: color-mix(in oklab, var(--unit-color) 7%, var(--color-base-100));
}

.chara-picker__group.is-wide {
  grid-column: 1 / -1;
}

@container (min-width: 54rem) {
  .chara-picker__groups {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .chara-picker__group.is-wide {
    grid-column: auto;
  }
}

.chara-picker__unit {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  max-width: 100%;
  height: 1.625rem;
  margin-bottom: 0.375rem;
  padding: 0 0.375rem 0 0;
  border: 1px solid transparent;
  border-radius: 999px;
}

.chara-picker__unit-bar {
  flex: none;
  width: 0.25rem;
  height: 1rem;
  border-radius: 999px;
  background-color: var(--unit-color);
}

/* 团体 logo 多是深色字，深色主题下垫一块浅底才看得清 */
.chara-picker__unit-logo {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 1.375rem;
  padding: 0.125rem 0.375rem;
  border-radius: 999px;
  background-color: rgb(255 255 255 / 0.92);
}

.chara-picker__unit-logo img {
  width: auto;
  max-width: 100%;
  height: 100%;
  object-fit: contain;
}

.chara-picker__unit-count {
  color: color-mix(in oklab, var(--color-base-content) 50%, transparent);
  font-size: 0.6875rem;
}

.chara-picker__unit.is-selectable {
  padding-left: 0.375rem;
  border-color: color-mix(in oklab, var(--unit-color) 35%, transparent);
  cursor: pointer;
  transition: background-color 0.12s ease, border-color 0.12s ease;
}

.chara-picker__unit.is-selectable:hover {
  border-color: var(--unit-color);
}

.chara-picker__unit.is-selectable.is-active {
  border-color: var(--unit-color);
  background-color: var(--unit-color);
}

.chara-picker__unit.is-active .chara-picker__unit-bar {
  background-color: #fff;
}

.chara-picker__unit.is-active .chara-picker__unit-count {
  color: #fff;
  font-weight: 700;
}

.chara-picker__members {
  display: flex;
  gap: 0.125rem;
}

.chara-picker__member {
  display: flex;
  flex: 0 1 4rem;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  min-width: 0;
  padding: 0.25rem 0.125rem;
  border-radius: var(--radius-field);
  transition: opacity 0.12s ease, background-color 0.12s ease;
}

.chara-picker__member:hover {
  background-color: color-mix(in oklab, var(--color-base-content) 7%, transparent);
}

.chara-picker__member.is-dim {
  opacity: 0.6;
}

.chara-picker__member.is-dim:hover {
  opacity: 1;
}

.chara-picker__avatar {
  display: block;
  width: 100%;
  max-width: 2.5rem;
  aspect-ratio: 1;
  border-radius: 999px;
  background-color: var(--color-base-200);
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--color-base-content) 12%, transparent);
  overflow: hidden;
  transition: box-shadow 0.12s ease;
}

.chara-picker__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chara-picker__member.is-active .chara-picker__avatar {
  box-shadow: 0 0 0 2px var(--color-base-100), 0 0 0 4px var(--color-primary);
}

.chara-picker__name {
  max-width: 100%;
  overflow: hidden;
  color: color-mix(in oklab, var(--color-base-content) 72%, transparent);
  font-size: 0.6875rem;
  line-height: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 面板窄（手机、浮层）时换成只有名字的短称呼 */
.chara-picker__name.is-short {
  display: none;
}

@container (max-width: 30rem) {
  .chara-picker__name.is-full {
    display: none;
  }

  .chara-picker__name.is-short {
    display: block;
    font-size: 0.65rem;
  }
}

.chara-picker__member.is-active .chara-picker__name {
  color: var(--color-primary);
  font-weight: 700;
}
</style>
