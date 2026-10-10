<script lang="ts">
// RouterView 以 path 为 key，query 变化不会重建视图，但离开再返回列表时会重建；
// <script setup> 内的变量每次重建都会重置，这里用真正的模块作用域
// 在重建之间保留筛选面板的展开状态（null 表示本次会话还没手动开关过）
let filterPanelOpenMemory: boolean | null = null
</script>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { RefreshCw, SlidersHorizontal, ChevronDown, FilterX } from 'lucide-vue-next'
import { useAccountStore } from '@/stores/account'
import Pagination from '@/components/Pagination.vue'
import SekaiCard from '@/components/SekaiCard.vue'
import AccountSelector from '@/components/AccountSelector.vue'

interface Card {
  id: number
  characterId: number
  cardRarityType: string
  attr: string
  supportUnit: string
  skillId: number
  prefix: string
  assetbundleName: string
  releaseAt: number
}

interface Character {
  id: number
  firstName?: string
  givenName: string
  unit: string
}

interface SkillEffect {
  skillEffectType: string
  activateNotesJudgmentType?: string
}

interface Skill {
  id: number
  skillEffects: SkillEffect[]
}

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()

// 初始状态由 URL 推导: owned=1 时必须显示拥有状态, 否则“只看已拥有”不生效
const showUserCards = ref(route.query.owned === '1')
const selectedUserId = computed({
  get: () => accountStore.currentUserId || '',
  set: (val: string) => accountStore.selectAccount(val)
})

// 计算该用户的 suite 缓存数据
const suiteData = computed(() => {
  if (!selectedUserId.value) return null
  return accountStore.getSuiteCache(selectedUserId.value)
})

// 卡片拥有状态 Map: cardId -> userCard detail
const userCardsMap = computed(() => {
  if (!showUserCards.value || !suiteData.value?.userCards) return new Map()
  const map = new Map<number, any>()
  for (const c of suiteData.value.userCards) {
    map.set(c.cardId, c)
  }
  return map
})

function getMasterRank(cardId: number): number {
  if (!showUserCards.value) return 0
  const c = userCardsMap.value.get(cardId)
  return c ? c.masterRank : 0
}

async function refreshUserCards() {
  if (!selectedUserId.value) return
  await accountStore.refreshSuite(selectedUserId.value)
}

const cards = ref<Card[]>([])
const characters = ref<Character[]>([])
const skills = ref<Skill[]>([])
const isLoading = ref(true)

// 筛选面板展开状态
const isFilterPanelOpen = ref(filterPanelOpenMemory ?? false)
watch(isFilterPanelOpen, val => { filterPanelOpenMemory = val })

// 从 URL 读取列表型筛选参数
function queryList(key: string): string[] {
  const param = route.query[key]
  if (typeof param === 'string' && param) {
    return param.split(',').filter(Boolean)
  }
  return []
}

const selectedCharaIds = computed<number[]>(() => queryList('charaIds').map(Number).filter(n => !isNaN(n)))
const selectedUnits = computed<string[]>(() => queryList('units'))
const selectedAttrs = computed<string[]>(() => queryList('attrs'))
const selectedRarities = computed<string[]>(() => queryList('rarities'))
const selectedSkillTypes = computed<string[]>(() => queryList('skills'))

// 只看已拥有卡片
const filterOwnedOnly = computed<boolean>(() => {
  return route.query.owned === '1'
})

// 前进/后退恢复 owned=1 时同步打开拥有状态; 关闭拥有状态时移除 owned 参数
watch(filterOwnedOnly, (ownedOnly) => {
  if (ownedOnly) showUserCards.value = true
})
watch(showUserCards, (show) => {
  if (!show && filterOwnedOnly.value) pushQuery({ owned: undefined })
})

// 组合列表
const unitList = [
  { value: 'light_sound', label: 'Leo/need', image: '/img/logo/logo_light_sound.png' },
  { value: 'idol', label: 'MORE MORE JUMP!', image: '/img/logo/logo_idol.png' },
  { value: 'street', label: 'Vivid BAD SQUAD', image: '/img/logo/logo_street.png' },
  { value: 'theme_park', label: 'Wonderlands x Showtime', image: '/img/logo/logo_theme_park.png' },
  { value: 'school_refusal', label: '25-ji, Nightcord de.', image: '/img/logo/logo_school_refusal.png' },
  { value: 'piapro', label: 'VIRTUAL SINGER', image: '/img/logo/logo_piapro.png' },
]

// 属性列表
const attrList = ['cute', 'cool', 'pure', 'happy', 'mysterious']

// 稀有度列表
const rarityList = [
  { value: 'rarity_1', label: '一星' },
  { value: 'rarity_2', label: '二星' },
  { value: 'rarity_3', label: '三星' },
  { value: 'rarity_4', label: '四星' },
  { value: 'rarity_birthday', label: '生日卡' },
]

// 技能大类列表
const skillTypeList = [
  { value: 'score_up', label: '分数加成' },
  { value: 'judgment_up', label: '判定强化' },
  { value: 'life_recovery', label: 'LIVE恢复' },
  { value: 'perfect_score_up', label: 'PERFECT分数加成' },
  { value: 'life_score_up', label: 'LIVE要求的分数加成' },
]

// 分页配置
const pageSize = 30
const currentPage = computed(() => Number(route.query.page) || 1)
const totalPages = computed(() => Math.ceil(filteredCards.value.length / pageSize))

const now = Date.now()

// 角色 -> 组合
const charaUnitMap = computed(() => new Map(characters.value.map(c => [c.id, c.unit])))

// 技能 -> 大类（生日卡技能同时有恢复和 PERFECT 加分效果，归入两类）
function classifySkill(skill: Skill): string[] {
  const cats = new Set<string>()
  for (const effect of skill.skillEffects || []) {
    if (effect.skillEffectType === 'judgment_up') cats.add('judgment_up')
    else if (effect.skillEffectType === 'life_recovery') cats.add('life_recovery')
    else if (effect.skillEffectType === 'score_up_condition_life') cats.add('life_score_up')
    else if (effect.skillEffectType === 'score_up' && effect.activateNotesJudgmentType === 'perfect') cats.add('perfect_score_up')
  }
  if (cats.size === 0) cats.add('score_up')
  return [...cats]
}

const skillCategoriesMap = computed(() => new Map(skills.value.map(s => [s.id, classifySkill(s)])))

// 卡片所属组合（V家卡带应援组合时同时归入两个组合）
function getCardUnits(card: Card): string[] {
  const units: string[] = []
  const charaUnit = charaUnitMap.value.get(card.characterId)
  if (charaUnit) units.push(charaUnit)
  if (card.supportUnit && card.supportUnit !== 'none') units.push(card.supportUnit)
  return units
}

// 仅过滤剧透后的卡片，用于计算各筛选项的数量
const visibleBaseCards = computed(() => {
  if (settingsStore.showSpoilers) return cards.value
  return cards.value.filter(c => c.releaseAt <= now)
})

const unitOptions = computed(() => {
  const counts = new Map<string, number>()
  for (const card of visibleBaseCards.value) {
    for (const unit of getCardUnits(card)) {
      counts.set(unit, (counts.get(unit) || 0) + 1)
    }
  }
  return unitList
    .map(option => ({ ...option, count: counts.get(option.value) || 0 }))
    .filter(option => option.count > 0)
})

const characterOptions = computed(() => {
  const counts = new Map<number, number>()
  for (const card of visibleBaseCards.value) {
    counts.set(card.characterId, (counts.get(card.characterId) || 0) + 1)
  }
  return [...characters.value]
    .sort((a, b) => a.id - b.id)
    .map(chara => ({
      value: chara.id,
      label: (chara.firstName || '') + chara.givenName,
      icon: `/img/chr_ts/chr_ts_90_${chara.id}.png`,
      count: counts.get(chara.id) || 0,
    }))
    .filter(option => option.count > 0)
})

const attrOptions = computed(() => {
  const counts = new Map<string, number>()
  for (const card of visibleBaseCards.value) {
    counts.set(card.attr, (counts.get(card.attr) || 0) + 1)
  }
  return attrList
    .map(value => ({ value, icon: `/newcard/attr_${value}.png`, count: counts.get(value) || 0 }))
    .filter(option => option.count > 0)
})

const rarityOptions = computed(() => {
  const counts = new Map<string, number>()
  for (const card of visibleBaseCards.value) {
    counts.set(card.cardRarityType, (counts.get(card.cardRarityType) || 0) + 1)
  }
  return rarityList
    .map(option => ({ ...option, count: counts.get(option.value) || 0 }))
    .filter(option => option.count > 0)
})

const skillTypeOptions = computed(() => {
  const counts = new Map<string, number>()
  for (const card of visibleBaseCards.value) {
    for (const cat of skillCategoriesMap.value.get(card.skillId) || []) {
      counts.set(cat, (counts.get(cat) || 0) + 1)
    }
  }
  return skillTypeList
    .map(option => ({ ...option, count: counts.get(option.value) || 0 }))
    .filter(option => option.count > 0)
})

const activeFilterCount = computed(() => {
  return selectedCharaIds.value.length
    + selectedUnits.value.length
    + selectedAttrs.value.length
    + selectedRarities.value.length
    + selectedSkillTypes.value.length
})

const hasFilters = computed(() => activeFilterCount.value > 0)

// 过滤后的卡片列表
const filteredCards = computed(() => {
  let result = [...cards.value]

  // 按 ID 排序（最新优先）
  result.sort((a, b) => b.id - a.id)

  // 过滤剧透内容
  if (!settingsStore.showSpoilers) {
    result = result.filter(c => c.releaseAt <= now)
  }

  // 只看拥有的卡
  if (filterOwnedOnly.value && showUserCards.value && suiteData.value?.userCards) {
    result = result.filter(c => userCardsMap.value.has(c.id))
  }

  // 按角色筛选 (多选)
  if (selectedCharaIds.value.length > 0) {
    result = result.filter(c => selectedCharaIds.value.includes(c.characterId))
  }

  // 按组合筛选 (多选)
  if (selectedUnits.value.length > 0) {
    const selected = selectedUnits.value
    result = result.filter(c => getCardUnits(c).some(unit => selected.includes(unit)))
  }

  // 按属性筛选 (多选)
  if (selectedAttrs.value.length > 0) {
    result = result.filter(c => selectedAttrs.value.includes(c.attr))
  }

  // 按稀有度筛选 (多选)
  if (selectedRarities.value.length > 0) {
    result = result.filter(c => selectedRarities.value.includes(c.cardRarityType))
  }

  // 按技能大类筛选 (多选)
  if (selectedSkillTypes.value.length > 0) {
    const selected = selectedSkillTypes.value
    const map = skillCategoriesMap.value
    result = result.filter(c => (map.get(c.skillId) || []).some(cat => selected.includes(cat)))
  }

  return result
})

// 当前页的卡片
const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredCards.value.slice(start, start + pageSize)
})

// 获取角色名字
function getCharaName(characterId: number): string {
  const chara = characters.value.find(c => c.id === characterId)
  if (!chara) return ''
  return (chara.firstName || '') + chara.givenName
}

// 判断是否为剧透内容
function isLeak(releaseAt: number): boolean {
  return releaseAt > now
}

// 筛选相关的 URL 参数
const FILTER_KEYS = ['charaIds', 'units', 'attrs', 'rarities', 'skills'] as const

// 更新 URL 筛选参数（patch 中值为 undefined 表示删除该参数）
// 筛选变化用 replace，避免每次点选都产生历史记录；翻页用 push
function pushQuery(patch: Record<string, string | undefined>, page: string = '1', mode: 'push' | 'replace' = 'replace') {
  const query: Record<string, string> = {}
  for (const key of [...FILTER_KEYS, 'owned']) {
    const value = route.query[key]
    if (typeof value === 'string' && value) query[key] = value
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete query[key]
    else query[key] = value
  }
  query.page = page
  if (mode === 'push') router.push({ query })
  else router.replace({ query })
}

// 切换列表型筛选参数中的某个值
function toggleListValue(key: string, value: string) {
  const current = queryList(key)
  const idx = current.indexOf(value)
  if (idx > -1) {
    current.splice(idx, 1)
  } else {
    current.push(value)
  }
  pushQuery({ [key]: current.length > 0 ? current.join(',') : undefined })
}

function toggleCharacter(id: number) {
  toggleListValue('charaIds', String(id))
}

function toggleUnit(value: string) {
  toggleListValue('units', value)
}

function toggleAttr(value: string) {
  toggleListValue('attrs', value)
}

function toggleRarity(value: string) {
  toggleListValue('rarities', value)
}

function toggleSkillType(value: string) {
  toggleListValue('skills', value)
}

// 切换只看拥有
function toggleOwnedOnly() {
  pushQuery({ owned: filterOwnedOnly.value ? undefined : '1' })
}

// 加载数据
async function loadData() {
  isLoading.value = true
  try {
    const [cardsData, charactersData, skillsData] = await Promise.all([
      masterStore.getMaster<Card>('cards'),
      masterStore.getMaster<Character>('gameCharacters'),
      masterStore.getMaster<Skill>('skills'),
    ])
    cards.value = cardsData
    characters.value = charactersData
    skills.value = skillsData
  } catch (error) {
    console.error('加载卡片数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 页码变化
function handlePageChange(page: number) {
  pushQuery({}, page.toString(), 'push')
}

// 清除筛选
function clearFilters() {
  pushQuery(Object.fromEntries(FILTER_KEYS.map(key => [key, undefined])))
}

// 检查卡片是否有觉醒立绘
function hasTrainedCard(rarity: string): boolean {
  return rarity === 'rarity_3' || rarity === 'rarity_4'
}

onMounted(() => {
  loadData()
  // 本次会话还没开关过面板时，带筛选参数打开页面默认展开
  if (filterPanelOpenMemory === null && hasFilters.value) {
    isFilterPanelOpen.value = true
  }
})
</script>

<template>
  <div class="pb-10">
    <!-- 拥有状态切换区 -->
    <div class="card bg-base-100 shadow-md mb-4 mt-2">
      <div class="card-body p-4 flex flex-row flex-wrap items-center gap-4">
        <label class="label cursor-pointer gap-2 p-0">
          <input v-model="showUserCards" type="checkbox" class="toggle toggle-primary toggle-sm" />
          <span class="label-text font-medium mt-0.5">显示拥有状态</span>
        </label>

        <template v-if="showUserCards">
          <div class="divider divider-horizontal mx-0"></div>
          <label class="label cursor-pointer gap-2 p-0">
            <input type="checkbox" class="toggle toggle-secondary toggle-sm" :checked="filterOwnedOnly" @change="toggleOwnedOnly" />
            <span class="label-text font-medium mt-0.5">只看已拥有</span>
          </label>
          <div class="divider divider-horizontal mx-0"></div>

          <div v-if="accountStore.accounts.length > 0" class="min-w-[150px] max-w-[220px]">
            <AccountSelector v-model="selectedUserId" />
          </div>
          <span v-else class="text-sm text-base-content/60">无绑定账号</span>

          <button
            v-if="selectedUserId"
            class="btn btn-sm btn-ghost gap-1"
            :disabled="accountStore.suiteRefreshing"
            @click="refreshUserCards"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': accountStore.suiteRefreshing }" />
            刷新数据
          </button>
        </template>

        <div class="divider divider-horizontal mx-0"></div>
        <RouterLink class="btn btn-sm btn-primary" to="/card-collection">
          养成进度
        </RouterLink>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div class="mb-6 bg-base-100 rounded-lg shadow-sm">
      <div class="flex flex-wrap items-center gap-2 p-2">
        <button class="btn btn-sm btn-ghost gap-2" @click="isFilterPanelOpen = !isFilterPanelOpen">
          <SlidersHorizontal class="w-4 h-4" />
          筛选
          <span v-if="activeFilterCount > 0" class="badge badge-primary badge-sm">{{ activeFilterCount }}</span>
          <ChevronDown class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isFilterPanelOpen }" />
        </button>

        <button
          v-if="hasFilters"
          class="btn btn-ghost btn-sm gap-1"
          @click="clearFilters"
        >
          <FilterX class="w-4 h-4" />
          清空
        </button>
      </div>

      <div v-if="isFilterPanelOpen" class="border-t border-base-200 p-3 space-y-4">
        <div>
          <div class="text-xs font-bold text-base-content/60 mb-2">组合</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="unit in unitOptions"
              :key="unit.value"
              class="btn btn-sm min-h-9 h-9 px-3"
              :class="selectedUnits.includes(unit.value) ? 'btn-primary' : 'btn-outline'"
              :title="unit.label"
              @click="toggleUnit(unit.value)"
            >
              <img :src="unit.image" :alt="unit.label" class="h-4 max-w-[86px] object-contain" />
              <span class="text-[10px] opacity-60">{{ unit.count }}</span>
            </button>
          </div>
        </div>

        <div>
          <div class="text-xs font-bold text-base-content/60 mb-2">角色</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="chara in characterOptions"
              :key="chara.value"
              class="btn btn-sm h-9 min-h-9 gap-1.5 pl-1.5 pr-2"
              :class="selectedCharaIds.includes(chara.value) ? 'btn-primary' : 'btn-outline'"
              @click="toggleCharacter(chara.value)"
            >
              <span class="h-6 w-6 overflow-hidden rounded-full bg-base-200 ring-1 ring-base-300">
                <img :src="chara.icon" :alt="chara.label" class="h-full w-full object-cover" />
              </span>
              {{ chara.label }}
              <span class="text-[10px] opacity-60">{{ chara.count }}</span>
            </button>
          </div>
        </div>

        <div>
          <div class="text-xs font-bold text-base-content/60 mb-2">属性</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="attr in attrOptions"
              :key="attr.value"
              class="btn btn-sm h-9 min-h-9 gap-1 px-2.5"
              :class="selectedAttrs.includes(attr.value) ? 'btn-primary' : 'btn-outline'"
              :title="attr.value"
              @click="toggleAttr(attr.value)"
            >
              <img :src="attr.icon" :alt="attr.value" class="h-5 w-5 object-contain" />
              <span class="text-[10px] opacity-60">{{ attr.count }}</span>
            </button>
          </div>
        </div>

        <div>
          <div class="text-xs font-bold text-base-content/60 mb-2">稀有度</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="rarity in rarityOptions"
              :key="rarity.value"
              class="btn btn-sm h-8 min-h-8"
              :class="selectedRarities.includes(rarity.value) ? 'btn-primary' : 'btn-outline'"
              @click="toggleRarity(rarity.value)"
            >
              {{ rarity.label }}
              <span class="text-[10px] opacity-60">{{ rarity.count }}</span>
            </button>
          </div>
        </div>

        <div>
          <div class="text-xs font-bold text-base-content/60 mb-2">技能类型</div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="skillType in skillTypeOptions"
              :key="skillType.value"
              class="btn btn-sm h-8 min-h-8"
              :class="selectedSkillTypes.includes(skillType.value) ? 'btn-primary' : 'btn-outline'"
              @click="toggleSkillType(skillType.value)"
            >
              {{ skillType.label }}
              <span class="text-[10px] opacity-60">{{ skillType.count }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- 卡片网格 -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      <RouterLink
        v-for="card in paginatedCards"
        :key="card.id"
        :to="`/cards/${card.id}`"
        class="group animate-fade-in-up"
      >
        <!-- 卡片背景框 -->
        <div class="bg-base-100 rounded-xl p-2.5 shadow-md border border-base-200 hover:shadow-lg hover:border-primary/30 transition-all relative overflow-hidden">
          <!-- 简单角标 (替代之前的内部遮罩) -->
          <div v-if="isLeak(card.releaseAt)" class="absolute top-1 right-1 z-40 badge badge-warning badge-xs gap-0.5">
            剧透
          </div>

          <!-- 统一大小的卡片容器 -->
          <div class="flex gap-1 justify-center relative">
            <!-- 普通卡面 -->
            <div class="w-16 sm:w-20 flex-shrink-0" :class="{ 'mx-auto': !hasTrainedCard(card.cardRarityType) }">
              <div class="relative aspect-square">
                <SekaiCard
                  :card="card"
                  :master-rank="getMasterRank(card.id)"
                  class="transition-transform group-hover:scale-105"
                />
                <!-- 未拥有遮罩 -->
                <div v-if="showUserCards && !userCardsMap.has(card.id)" class="absolute inset-0 bg-black/60 pointer-events-none z-30 transition-opacity"></div>
              </div>
              <div v-if="showUserCards && userCardsMap.has(card.id)" class="text-[10px] text-center mt-0.5 font-bold text-primary truncate leading-[1.2]">
                <span class="text-base-content/80">Lv.{{ userCardsMap.get(card.id).level }}</span><br />
                <span class="text-secondary/80">SLv.{{ userCardsMap.get(card.id).skillLevel || 1 }}</span>
              </div>
            </div>

            <!-- 觉醒卡面 (3星/4星) -->
            <div v-if="hasTrainedCard(card.cardRarityType)" class="w-16 sm:w-20 flex-shrink-0">
              <div class="relative aspect-square">
                <SekaiCard
                  :card="card"
                  :trained="true"
                  :master-rank="getMasterRank(card.id)"
                  class="transition-transform group-hover:scale-105"
                />
                <!-- 未拥有遮罩 -->
                <div v-if="showUserCards && !userCardsMap.has(card.id)" class="absolute inset-0 bg-black/60 pointer-events-none z-30 transition-opacity"></div>
              </div>
              <div v-if="showUserCards && userCardsMap.has(card.id)" class="text-[10px] text-center mt-0.5 font-bold text-primary truncate leading-[1.2]">
                <span class="text-base-content/80">Lv.{{ userCardsMap.get(card.id).level }}</span><br />
                <span class="text-secondary/80">SLv.{{ userCardsMap.get(card.id).skillLevel || 1 }}</span>
              </div>
            </div>
          </div>

          <!-- 卡片名称 -->
          <h3 class="font-semibold text-sm mt-2 line-clamp-2">{{ card.prefix }}</h3>
          <p class="text-xs text-base-content/60">{{ getCharaName(card.characterId) }}</p>
        </div>
      </RouterLink>
    </div>

    <!-- 无结果 -->
    <div v-if="!isLoading && paginatedCards.length === 0" class="text-center py-20">
      <p class="text-base-content/60">没有找到卡片</p>
    </div>

    <!-- 分页 -->
    <Pagination
      v-if="totalPages > 1"
      :current-page="currentPage"
      :total-pages="totalPages"
      base-url="/cards"
      @page-change="handlePageChange"
    />
  </div>
</template>
