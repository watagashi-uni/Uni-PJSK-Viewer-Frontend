<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CreditCard, Search, Smile, Sparkles, UserRound, Users } from 'lucide-vue-next'
import AccountSelector from '@/components/AccountSelector.vue'
import AssetImage from '@/components/AssetImage.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAccountStore } from '@/stores/account'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import type {
  CardData,
  CharacterProfileData,
  GameCharacterData,
  StampData,
  UnitProfileData,
} from '@/types/master'

interface UserCharacter {
  characterId?: number
  character_id?: number
  characterRank?: number
  character_rank?: number
  exp?: number
  totalExp?: number
  total_exp?: number
}

interface UserCharacterLiveUsage {
  characterId?: number
  character_id?: number
  characterLiveUsageType?: string
  character_live_usage_type?: string
  usageCount?: number
  usage_count?: number
}

interface CharacterRank {
  characterId: number
  characterRank: number
  power1BonusRate: number
  power2BonusRate: number
  power3BonusRate: number
}

interface CharacterLevel {
  levelType: string
  level: number
  totalExp: number
}

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()
const accountStore = useAccountStore()

const characters = ref<GameCharacterData[]>([])
const profiles = ref<CharacterProfileData[]>([])
const unitProfiles = ref<UnitProfileData[]>([])
const cards = ref<CardData[]>([])
const stamps = ref<StampData[]>([])
const characterRanks = ref<CharacterRank[]>([])
const levels = ref<CharacterLevel[]>([])
const searchQuery = ref('')
const sortMode = ref<'default' | 'rank' | 'leader' | 'member'>('default')
const isLoading = ref(true)
const loadError = ref('')

const unitOrder = ['light_sound', 'idol', 'street', 'theme_park', 'school_refusal', 'piapro']
const unitFallbackNames: Record<string, string> = {
  light_sound: 'Leo/need',
  idol: 'MORE MORE JUMP!',
  street: 'Vivid BAD SQUAD',
  theme_park: 'Wonderlands×Showtime',
  school_refusal: '25时、Nightcord见。',
  piapro: 'VIRTUAL SINGER',
}

const assetsHost = computed(() => settingsStore.assetsHost)
const selectedUserId = computed({
  get: () => accountStore.currentUserId || '',
  set: value => { void accountStore.selectAccount(value) },
})
const suite = computed<any | null>(() => selectedUserId.value ? accountStore.getSuiteCache(selectedUserId.value) : null)
const profileMap = computed(() => new Map(profiles.value.map(profile => [profile.characterId, profile])))
const unitProfileMap = computed(() => new Map(unitProfiles.value.map(profile => [profile.unit, profile])))

const userCharacterMap = computed(() => {
  const result = new Map<number, UserCharacter>()
  const rows = suite.value?.userCharacters ?? suite.value?.user_characters
  if (!Array.isArray(rows)) return result
  for (const row of rows as UserCharacter[]) {
    const id = Number(row.characterId ?? row.character_id)
    if (Number.isFinite(id)) result.set(id, row)
  }
  return result
})

const liveUsageMap = computed(() => {
  const result = new Map<number, { leader: number; member: number }>()
  const rows = suite.value?.userCharacterLiveUsageCounts ?? suite.value?.user_character_live_usage_counts
  if (!Array.isArray(rows)) return result
  for (const row of rows as UserCharacterLiveUsage[]) {
    const id = Number(row.characterId ?? row.character_id)
    const type = String(row.characterLiveUsageType ?? row.character_live_usage_type ?? '')
    const count = Number(row.usageCount ?? row.usage_count ?? 0)
    if (!Number.isFinite(id) || (type !== 'leader' && type !== 'member')) continue
    const usage = result.get(id) || { leader: 0, member: 0 }
    usage[type] = Number.isFinite(count) ? count : 0
    result.set(id, usage)
  }
  return result
})

const hasAccountCharacterData = computed(() => {
  const rows = suite.value?.userCharacters ?? suite.value?.user_characters
  return Array.isArray(rows)
})

const characterRankMap = computed(() => new Map(characterRanks.value.map(row => [
  `${row.characterId}_${row.characterRank}`,
  row,
])))

const characterLevelMap = computed(() => new Map(levels.value
  .filter(row => row.levelType === 'character')
  .map(row => [row.level, row])))

const selectedCharacter = computed(() => {
  const id = Number(route.params.id)
  if (!id) return null
  return characters.value.find(character => character.id === id) || undefined
})

const selectedProfile = computed(() => {
  if (!selectedCharacter.value) return null
  return profileMap.value.get(selectedCharacter.value.id) || null
})

const selectedUnitProfile = computed(() => {
  if (!selectedCharacter.value) return null
  return unitProfileMap.value.get(selectedCharacter.value.unit) || null
})

const selectedUserCharacter = computed(() => {
  if (!selectedCharacter.value) return null
  return userCharacterMap.value.get(selectedCharacter.value.id) || null
})

const selectedCharacterProgress = computed(() => selectedUserCharacter.value
  ? getRankProgress(selectedUserCharacter.value)
  : null)

const selectedCharacterRankBonus = computed(() => {
  if (!selectedCharacter.value || !selectedUserCharacter.value) return null
  const rank = getUserCharacterRank(selectedUserCharacter.value)
  return characterRankMap.value.get(`${selectedCharacter.value.id}_${rank}`) || null
})

const selectedCharacterLiveUsage = computed(() => {
  if (!selectedCharacter.value) return null
  return liveUsageMap.value.get(selectedCharacter.value.id) || null
})

const cardCounts = computed(() => {
  const result = new Map<number, number>()
  for (const card of cards.value) result.set(card.characterId, (result.get(card.characterId) || 0) + 1)
  return result
})

const stampCounts = computed(() => {
  const result = new Map<number, number>()
  for (const stamp of stamps.value) {
    if (stamp.characterId1) result.set(stamp.characterId1, (result.get(stamp.characterId1) || 0) + 1)
  }
  return result
})

const groupedCharacters = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()
  return unitOrder
    .map(unit => {
      const profile = unitProfileMap.value.get(unit)
      const items = characters.value
        .filter(character => character.unit === unit)
        .filter(character => {
          if (!query) return true
          return [
            getCharacterName(character),
            getEnglishName(character),
            profile?.unitName,
            character.id,
          ].some(value => String(value || '').toLocaleLowerCase().includes(query))
        })
        .sort((a, b) => {
          if (sortMode.value === 'rank') {
            const aRank = userCharacterMap.value.get(a.id)
            const bRank = userCharacterMap.value.get(b.id)
            return (bRank ? getUserCharacterRank(bRank) : 0) - (aRank ? getUserCharacterRank(aRank) : 0) || a.seq - b.seq
          }
          if (sortMode.value === 'leader' || sortMode.value === 'member') {
            return (liveUsageMap.value.get(b.id)?.[sortMode.value] || 0) - (liveUsageMap.value.get(a.id)?.[sortMode.value] || 0) || a.seq - b.seq
          }
          return a.seq - b.seq
        })
      return { unit, profile, items }
    })
    .filter(group => group.items.length > 0)
})

function getCharacterName(character: GameCharacterData): string {
  return `${character.firstName || ''}${character.givenName}`
}

function getEnglishName(character: GameCharacterData): string {
  return [character.firstNameEnglish, character.givenNameEnglish].filter(Boolean).join(' ')
}

function getUnitName(unit: string): string {
  return unitProfileMap.value.get(unit)?.unitName || unitFallbackNames[unit] || unit
}

function getUnitColor(unit: string): string {
  return unitProfileMap.value.get(unit)?.colorCode || '#33aaee'
}

function getReadableTextColor(background: string): string {
  const normalized = background.trim().replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return '#ffffff'
  const channels = [0, 2, 4].map(offset => {
    const value = Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
  return luminance > 0.3 ? '#2b2026' : '#ffffff'
}

function getUnitBadgeStyle(unit: string) {
  const backgroundColor = getUnitColor(unit)
  return {
    backgroundColor,
    color: getReadableTextColor(backgroundColor),
    borderColor: backgroundColor.toLocaleLowerCase() === '#ffffff' ? 'var(--color-base-300)' : backgroundColor,
  }
}

function getStandingUrl(character: GameCharacterData): string {
  const resourceId = String(character.resourceId).padStart(3, '0')
  return `${assetsHost.value}/startapp/character/member_cutout_trm/res${resourceId}_no001/normal.png`
}

function cleanText(value?: string): string {
  return (value || '').replace(/\n/g, '')
}

function getUserCharacterRank(row: UserCharacter): number {
  return Number(row.characterRank ?? row.character_rank ?? 0)
}

function getUserCharacterExp(row: UserCharacter): number {
  return Number(row.exp ?? 0)
}

function getUserCharacterTotalExp(row: UserCharacter): number {
  return Number(row.totalExp ?? row.total_exp ?? 0)
}

function getRankProgress(row: UserCharacter) {
  const rank = getUserCharacterRank(row)
  const currentExp = getUserCharacterExp(row)
  const nextLevel = characterLevelMap.value.get(rank + 1)
  const currentLevel = characterLevelMap.value.get(rank)
  const requiredExp = nextLevel && currentLevel ? nextLevel.totalExp - currentLevel.totalExp : 0
  return {
    rank,
    currentExp,
    requiredExp,
    totalExp: getUserCharacterTotalExp(row),
    percentage: requiredExp > 0 ? Math.min(100, Math.max(0, currentExp / requiredExp * 100)) : 100,
  }
}

function formatBonus(value: number): string {
  return Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

function formatCount(value: number): string {
  return Number(value || 0).toLocaleString('zh-CN')
}

function openCharacter(character: GameCharacterData) {
  void router.push(`/characters/${character.id}`)
}

function closeDetail() {
  void router.push('/characters')
}

onMounted(async () => {
  try {
    const [characterData, profileData, unitData, cardData, stampData, rankData, levelData] = await Promise.all([
      masterStore.getMaster<GameCharacterData>('gameCharacters'),
      masterStore.getMaster<CharacterProfileData>('characterProfiles'),
      masterStore.getMaster<UnitProfileData>('unitProfiles'),
      masterStore.getMaster<CardData>('cards'),
      masterStore.getMaster<StampData>('stamps'),
      masterStore.getMaster<CharacterRank>('characterRanks'),
      masterStore.getMaster<CharacterLevel>('levels'),
    ])
    characters.value = characterData
    profiles.value = profileData
    unitProfiles.value = unitData
    cards.value = cardData
    stamps.value = stampData
    characterRanks.value = rankData
    levels.value = levelData
  } catch (error) {
    console.error('加载角色图鉴失败:', error)
    loadError.value = error instanceof Error ? error.message : 'Master 数据加载失败'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <template v-if="route.params.id">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <button class="btn btn-ghost btn-sm gap-2" @click="closeDetail">
          <ArrowLeft class="w-4 h-4" /> 返回角色图鉴
        </button>
        <div v-if="accountStore.accounts.length" class="w-full sm:w-56">
          <AccountSelector v-model="selectedUserId" />
        </div>
      </div>

      <div v-if="isLoading" class="grid lg:grid-cols-[360px_1fr] gap-6">
        <div class="skeleton h-[520px] rounded-2xl"></div>
        <div class="skeleton h-[520px] rounded-2xl"></div>
      </div>

      <div v-else-if="loadError" class="alert alert-error">角色资料加载失败：{{ loadError }}</div>

      <div v-else-if="selectedCharacter === undefined" class="hero min-h-96 bg-base-100 rounded-2xl border border-base-200">
        <div class="hero-content text-center">
          <div>
            <UserRound class="w-14 h-14 opacity-30 mx-auto mb-3" />
            <h1 class="text-2xl font-bold">找不到这个角色</h1>
            <RouterLink to="/characters" class="btn btn-primary btn-sm mt-4">返回图鉴</RouterLink>
          </div>
        </div>
      </div>

      <div v-else-if="selectedCharacter" class="grid lg:grid-cols-[minmax(300px,380px)_1fr] gap-6 items-stretch">
        <section
          class="relative min-h-[520px] rounded-2xl overflow-hidden border border-base-200 bg-base-100"
          :style="{ background: `linear-gradient(160deg, ${getUnitColor(selectedCharacter.unit)}25, transparent 55%), var(--color-base-100)` }"
        >
          <div class="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-base-200/70 to-transparent"></div>
          <AssetImage
            :src="getStandingUrl(selectedCharacter)"
            :alt="getCharacterName(selectedCharacter)"
            :lazy="false"
            class="absolute inset-0 w-full h-full object-contain object-bottom p-3"
          />
          <div class="absolute left-5 top-5">
            <span class="badge border" :style="getUnitBadgeStyle(selectedCharacter.unit)">
              {{ getUnitName(selectedCharacter.unit) }}
            </span>
          </div>
        </section>

        <section class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-6 md:p-8 gap-6">
            <header>
              <p class="text-sm tracking-[0.18em] text-base-content/45 uppercase">{{ getEnglishName(selectedCharacter) }}</p>
              <h1 class="text-3xl md:text-4xl font-bold mt-1">{{ getCharacterName(selectedCharacter) }}</h1>
              <p v-if="selectedProfile?.characterVoice" class="text-sm text-base-content/60 mt-2">CV：{{ selectedProfile.characterVoice }}</p>
            </header>

            <p v-if="selectedProfile?.introduction" class="leading-7 text-base-content/80 whitespace-pre-line">
              {{ selectedProfile.introduction }}
            </p>

            <div
              v-if="selectedCharacterProgress"
              class="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <Sparkles class="w-5 h-5 text-primary" />
                  <div>
                    <p class="text-xs text-base-content/55">账号角色 Rank</p>
                    <p class="text-xl font-bold">Rank {{ selectedCharacterProgress.rank }}</p>
                  </div>
                </div>
                <div v-if="selectedCharacterRankBonus" class="text-right">
                  <p class="text-xs text-base-content/55">综合力加成</p>
                  <p class="font-bold text-primary">
                    +{{ formatBonus(selectedCharacterRankBonus.power1BonusRate) }}% / +{{ formatBonus(selectedCharacterRankBonus.power2BonusRate) }}% / +{{ formatBonus(selectedCharacterRankBonus.power3BonusRate) }}%
                  </p>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span v-if="selectedCharacterProgress.requiredExp">
                    距 Rank {{ selectedCharacterProgress.rank + 1 }}：{{ selectedCharacterProgress.currentExp }} / {{ selectedCharacterProgress.requiredExp }} EXP
                  </span>
                  <span v-else>已达到当前最高 Rank</span>
                  <span>累计 {{ selectedCharacterProgress.totalExp.toLocaleString('zh-CN') }} EXP</span>
                </div>
                <progress
                  class="progress progress-primary w-full"
                  :value="selectedCharacterProgress.percentage"
                  max="100"
                ></progress>
              </div>
            </div>

            <div v-else-if="hasAccountCharacterData" class="alert py-3 text-sm">
              当前账号没有这个角色的成长记录。
            </div>

            <div v-if="selectedCharacterLiveUsage" class="grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-base-200/70 p-3">
                <p class="text-xs text-base-content/50">队长 Live 使用</p>
                <p class="text-xl font-bold mt-1">{{ formatCount(selectedCharacterLiveUsage.leader) }}<span class="text-xs font-normal text-base-content/50 ml-1">次</span></p>
              </div>
              <div class="rounded-lg bg-base-200/70 p-3">
                <p class="text-xs text-base-content/50">成员 Live 使用</p>
                <p class="text-xl font-bold mt-1">{{ formatCount(selectedCharacterLiveUsage.member) }}<span class="text-xs font-normal text-base-content/50 ml-1">次</span></p>
              </div>
            </div>

            <dl v-if="selectedProfile" class="grid sm:grid-cols-2 gap-3 text-sm">
              <div v-if="selectedProfile.birthday" class="bg-base-200/70 rounded-lg p-3">
                <dt class="text-base-content/50 text-xs">生日</dt><dd class="font-medium mt-1">{{ selectedProfile.birthday }}</dd>
              </div>
              <div v-if="selectedProfile.height" class="bg-base-200/70 rounded-lg p-3">
                <dt class="text-base-content/50 text-xs">身高</dt><dd class="font-medium mt-1">{{ selectedProfile.height }}</dd>
              </div>
              <div v-if="selectedProfile.school" class="bg-base-200/70 rounded-lg p-3">
                <dt class="text-base-content/50 text-xs">学校 / 年级</dt><dd class="font-medium mt-1">{{ selectedProfile.school }} {{ selectedProfile.schoolYear }}</dd>
              </div>
              <div v-if="selectedProfile.hobby" class="bg-base-200/70 rounded-lg p-3">
                <dt class="text-base-content/50 text-xs">兴趣</dt><dd class="font-medium mt-1">{{ cleanText(selectedProfile.hobby) }}</dd>
              </div>
              <div v-if="selectedProfile.specialSkill" class="bg-base-200/70 rounded-lg p-3">
                <dt class="text-base-content/50 text-xs">特长</dt><dd class="font-medium mt-1">{{ cleanText(selectedProfile.specialSkill) }}</dd>
              </div>
              <div v-if="selectedProfile.favoriteFood" class="bg-base-200/70 rounded-lg p-3">
                <dt class="text-base-content/50 text-xs">喜欢的食物</dt><dd class="font-medium mt-1">{{ cleanText(selectedProfile.favoriteFood) }}</dd>
              </div>
              <div v-if="selectedProfile.hatedFood" class="bg-base-200/70 rounded-lg p-3">
                <dt class="text-base-content/50 text-xs">不喜欢的食物</dt><dd class="font-medium mt-1">{{ cleanText(selectedProfile.hatedFood) }}</dd>
              </div>
              <div v-if="selectedProfile.weak" class="bg-base-200/70 rounded-lg p-3">
                <dt class="text-base-content/50 text-xs">不擅长</dt><dd class="font-medium mt-1">{{ cleanText(selectedProfile.weak) }}</dd>
              </div>
            </dl>

            <div class="flex flex-wrap gap-3 mt-auto">
              <RouterLink :to="{ path: '/cards', query: { charaIds: String(selectedCharacter.id) } }" class="btn btn-primary gap-2">
                <CreditCard class="w-4 h-4" /> 查看 {{ cardCounts.get(selectedCharacter.id) || 0 }} 张卡牌
              </RouterLink>
              <RouterLink :to="{ path: '/stamps', query: { character: String(selectedCharacter.id) } }" class="btn btn-outline gap-2">
                <Smile class="w-4 h-4" /> 查看 {{ stampCounts.get(selectedCharacter.id) || 0 }} 张贴图
              </RouterLink>
            </div>
          </div>
        </section>

        <section v-if="selectedUnitProfile?.profileSentence" class="card bg-base-100 border border-base-200 lg:col-span-2">
          <div class="card-body p-5">
            <h2 class="font-bold flex items-center gap-2"><Users class="w-5 h-5" /> {{ selectedUnitProfile.unitName }}</h2>
            <p class="text-sm leading-6 text-base-content/70">{{ selectedUnitProfile.profileSentence }}</p>
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <PageHeader title="角色图鉴" description="角色档案、账号成长数据，以及对应卡牌与表情贴图入口。">
        <template #icon><Users class="w-8 h-8 text-primary" /></template>
        <template #actions>
          <div class="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div v-if="accountStore.accounts.length" class="w-full sm:w-56">
              <AccountSelector v-model="selectedUserId" />
            </div>
            <select v-model="sortMode" class="select select-bordered w-full sm:w-40 bg-base-100">
              <option value="default">默认顺序</option>
              <option value="rank">Rank 由高到低</option>
              <option value="leader">队长次数排序</option>
              <option value="member">成员次数排序</option>
            </select>
            <label class="input input-bordered flex items-center gap-2 w-full sm:w-72 bg-base-100">
              <Search class="w-4 h-4 opacity-50" />
              <input v-model="searchQuery" class="grow" placeholder="搜索角色或组合…" />
            </label>
          </div>
        </template>
      </PageHeader>

      <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="index in 12" :key="index" class="skeleton h-72 rounded-xl"></div>
      </div>

      <div v-else-if="loadError" class="alert alert-error">角色资料加载失败：{{ loadError }}</div>

      <div v-else-if="groupedCharacters.length === 0" class="hero min-h-64 bg-base-100 rounded-xl border border-base-200">
        <div class="hero-content text-center"><p class="font-bold">没有匹配的角色</p></div>
      </div>

      <section v-for="group in groupedCharacters" :key="group.unit" class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="h-7 w-1.5 rounded-full border border-base-300" :style="{ backgroundColor: getUnitColor(group.unit) }"></span>
          <div>
            <h2 class="text-xl font-bold">{{ group.profile?.unitName || getUnitName(group.unit) }}</h2>
            <p class="text-[11px] text-base-content/45">{{ group.items.length }} 名角色</p>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5">
          <button
            v-for="character in group.items"
            :key="character.id"
            type="button"
            class="card bg-base-100 border border-base-200 hover:-translate-y-1 hover:shadow-lg transition-all overflow-hidden text-left group"
            @click="openCharacter(character)"
          >
            <figure
              class="relative h-40 sm:h-44 overflow-hidden"
              :style="{ background: `linear-gradient(150deg, ${getUnitColor(character.unit)}30, transparent 65%), var(--color-base-200)` }"
            >
              <AssetImage
                :src="getStandingUrl(character)"
                :alt="getCharacterName(character)"
                class="w-full h-full object-contain object-bottom pt-2 group-hover:scale-105 transition-transform duration-300"
              />
              <span
                v-if="userCharacterMap.get(character.id)"
                class="absolute left-2 top-2 badge badge-sm border-0 bg-black/65 text-white shadow-sm"
              >
                Rank {{ getUserCharacterRank(userCharacterMap.get(character.id)!) }}
              </span>
              <span class="absolute top-2 right-2 badge badge-sm bg-base-100/80 border-0">#{{ character.id }}</span>
            </figure>
            <div class="card-body p-2.5 gap-0">
              <h3 class="font-bold truncate">{{ getCharacterName(character) }}</h3>
              <p class="text-[10px] tracking-wider text-base-content/45 truncate uppercase">{{ getEnglishName(character) }}</p>
              <p class="text-[11px] text-base-content/55 mt-2">{{ cardCounts.get(character.id) || 0 }} 卡牌 · {{ stampCounts.get(character.id) || 0 }} 贴图</p>
              <p v-if="liveUsageMap.get(character.id)" class="text-[10px] text-base-content/45 mt-1 truncate">
                队长 {{ formatCount(liveUsageMap.get(character.id)!.leader) }} · 成员 {{ formatCount(liveUsageMap.get(character.id)!.member) }}
              </p>
            </div>
          </button>
        </div>
      </section>
    </template>
  </div>
</template>
