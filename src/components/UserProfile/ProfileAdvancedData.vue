<script setup lang="ts">
import SekaiHonorBonds from '@/components/SekaiHonorBonds.vue'
import type { UnitKey, AttrKey } from '@/types/profile'

defineProps<{
  profileTab: string
  currentProfileTabLabel: string

  // Challenge
  hasChallengeSuiteData: boolean
  challengeSummary: any
  challengeMaxScore: number
  challengeRows: any[]

  // Bonus
  hasBonusSuiteData: boolean
  powerBonusCharacterGroupRows: any[]
  unitLabelMap: Record<string, string>
  powerBonusUnitRows: any[]
  powerBonusAttrRows: any[]

  // Bonds
  hasBondsSuiteData: boolean
  bondCharacterFilter: number
  bondCharacterOptions: any[]
  bondRows: any[]

  // Leader / Multi
  hasLeaderCountData: boolean
  leaderCountSummary: any
  leaderCountRows: any[]

  // Helpers
  getCharaIcon: (id: number) => string
  getCharaName: (id: number) => string
  getChallengeProgressColor: (score: number) => string
  formatPercent: (val: number) => string
  getUnitLogo: (unit: UnitKey) => string
  getAttrIcon: (attr: AttrKey) => string
  getCharaPillColor: (id: number) => string
  getLeaderProgressColor: (playCount: number) => string
}>()

const emit = defineEmits<{
  (e: 'update:bondCharacterFilter', value: number): void
}>()

function onBondCharacterFilterChange(e: Event) {
  const target = e.target as HTMLSelectElement
  emit('update:bondCharacterFilter', Number(target.value))
}
</script>

<template>
  <div class="space-y-3">
    <h3 class="text-lg font-medium">{{ currentProfileTabLabel }}</h3>

    <!-- Challenge Tab -->
    <div v-if="profileTab === 'challenge'" class="space-y-3">
      <div v-if="!hasChallengeSuiteData" class="alert alert-info py-2">
        <span class="text-sm">当前账号缺少挑战信息数据，请先点击上方“刷新Suite”。</span>
      </div>
      <template v-else>
        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-lg bg-base-200 px-3 py-2">
            <p class="text-[11px] text-base-content/60">剩余水晶</p>
            <p class="text-lg font-semibold text-success">{{ challengeSummary.totalJewel.toLocaleString() }}</p>
          </div>
          <div class="rounded-lg bg-base-200 px-3 py-2">
            <p class="text-[11px] text-base-content/60">剩余碎片(材料15)</p>
            <p class="text-lg font-semibold text-warning">{{ challengeSummary.totalFragment.toLocaleString() }}</p>
          </div>
        </div>
        <div class="rounded-xl border border-base-300 bg-base-100">
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>角色</th>
                  <th>等级</th>
                  <th>分数</th>
                  <th>进度(上限{{ Math.floor(challengeMaxScore / 10000) }}w)</th>
                  <th>水晶</th>
                  <th>碎片</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in challengeRows" :key="`challenge-${row.characterId}`">
                  <td>
                    <div class="flex items-center gap-2">
                      <img :src="getCharaIcon(row.characterId)" class="w-8 h-8 rounded-full ring-1 ring-base-300" />
                      <span class="hidden sm:inline">{{ getCharaName(row.characterId) }}</span>
                    </div>
                  </td>
                  <td class="font-semibold">{{ row.rank || '-' }}</td>
                  <td class="font-semibold">{{ row.highScore ? row.highScore.toLocaleString() : '-' }}</td>
                  <td class="min-w-[180px]">
                    <div class="space-y-1">
                      <div class="w-full h-2.5 rounded-full bg-base-300 overflow-hidden">
                        <div
                          class="h-full rounded-full"
                          :style="{
                            width: `${(row.progress * 100).toFixed(2)}%`,
                            backgroundColor: getChallengeProgressColor(row.highScore),
                          }"
                        ></div>
                      </div>
                      <div class="text-[11px] text-base-content/60 text-right">{{ formatPercent(row.progress * 100) }}</div>
                    </div>
                  </td>
                  <td class="font-medium text-success">{{ row.remainJewel.toLocaleString() }}</td>
                  <td class="font-medium text-warning">{{ row.remainFragment.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>

    <!-- Bonus Tab -->
    <div v-else-if="profileTab === 'bonus'" class="space-y-3">
      <div v-if="!hasBonusSuiteData" class="alert alert-info py-2">
        <span class="text-sm">当前账号缺少加成信息数据，请先点击上方“刷新Suite”。</span>
      </div>
      <template v-else>
        <div class="grid gap-3 lg:grid-cols-2">
          <div
            v-for="group in powerBonusCharacterGroupRows"
            :key="`bonus-group-${group.unit}`"
            class="rounded-xl border border-base-300 bg-base-100 p-3 shadow-sm"
          >
            <div class="mb-2 flex items-center gap-2">
              <img :src="getUnitLogo(group.unit)" class="h-5 w-auto object-contain" />
              <p class="text-sm font-semibold">{{ unitLabelMap[group.unit] }}</p>
            </div>
            <div class="grid gap-2 sm:grid-cols-2">
              <div
                v-for="row in group.rows"
                :key="`bonus-chara-${group.unit}-${row.characterId}`"
                class="rounded-lg bg-base-200/70 px-2.5 py-2"
              >
                <div class="flex items-center gap-2">
                  <img :src="getCharaIcon(row.characterId)" class="w-8 h-8 rounded-full ring-1 ring-base-300" />
                  <div class="min-w-0">
                    <p class="text-[11px] text-base-content/65 leading-none">{{ getCharaName(row.characterId) }}</p>
                    <p class="text-2xl leading-none font-bold text-success mt-1">{{ formatPercent(row.total) }}</p>
                  </div>
                </div>
                <p class="mt-1 text-[11px] leading-4 text-base-content/70 break-all">
                  区域道具{{ formatPercent(row.areaItem) }} + 角色等级{{ formatPercent(row.rank) }} + 烤森玩偶{{ formatPercent(row.fixture) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid gap-3 xl:grid-cols-2">
          <div class="rounded-xl border border-base-300 bg-base-100 p-3 shadow-sm">
            <p class="text-sm font-semibold">组合总加成</p>
            <div class="mt-2 grid gap-2 sm:grid-cols-2">
              <div
                v-for="row in powerBonusUnitRows"
                :key="`bonus-unit-${row.unit}`"
                class="rounded-lg bg-base-200/70 px-2.5 py-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <img :src="getUnitLogo(row.unit)" class="h-5 w-auto object-contain" />
                    <span class="text-xs truncate">{{ unitLabelMap[row.unit] }}</span>
                  </div>
                  <span class="text-lg font-bold text-success">{{ formatPercent(row.total) }}</span>
                </div>
                <p class="mt-1 text-[11px] text-base-content/70">区域道具{{ formatPercent(row.areaItem) }} + 烤森门{{ formatPercent(row.gate) }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-base-300 bg-base-100 p-3 shadow-sm">
            <p class="text-sm font-semibold">属性总加成</p>
            <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div
                v-for="row in powerBonusAttrRows"
                :key="`bonus-attr-${row.attr}`"
                class="rounded-lg bg-base-200/70 px-2.5 py-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <img :src="getAttrIcon(row.attr)" class="w-5 h-5 object-contain" />
                    <span class="text-xs">{{ row.attr }}</span>
                  </div>
                  <span class="font-bold text-success">{{ formatPercent(row.total) }}</span>
                </div>
                <p class="mt-1 text-[11px] text-base-content/70">区域道具{{ formatPercent(row.areaItem) }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Bonds Tab -->
    <div v-else-if="profileTab === 'bonds'" class="space-y-3">
      <div v-if="!hasBondsSuiteData" class="alert alert-info py-2">
        <span class="text-sm">当前账号缺少牵绊等级数据，请先点击上方“刷新Suite”。</span>
      </div>
      <template v-else>
        <div class="flex flex-wrap gap-2 items-center">
          <select 
            :value="bondCharacterFilter" 
            class="select select-bordered select-xs"
            @change="onBondCharacterFilterChange"
          >
            <option v-for="item in bondCharacterOptions" :key="`bond-filter-${item.id}`" :value="item.id">{{ item.name }}</option>
          </select>
        </div>
        <div class="rounded-xl border border-base-300 bg-base-100">
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>角色</th>
                  <th>角色等级</th>
                  <th>牵绊等级</th>
                  <th>进度</th>
                  <th>升级经验</th>
                  <th>牵绊徽章</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in bondRows" :key="`bond-${row.c1}-${row.c2}`">
                  <td>
                    <div class="flex items-center">
                      <img :src="getCharaIcon(row.c1)" class="w-8 h-8 rounded-full ring-1 ring-base-300" />
                      <img :src="getCharaIcon(row.c2)" class="w-8 h-8 rounded-full ring-1 ring-base-300 -ml-2" />
                      <span class="ml-2 text-xs hidden sm:inline">{{ getCharaName(row.c1) }} × {{ getCharaName(row.c2) }}</span>
                    </div>
                  </td>
                  <td>
                    <span :class="row.capBlocked ? 'text-error font-semibold' : ''">{{ row.rank1 }} &amp; {{ row.rank2 }}</span>
                  </td>
                  <td>
                    <span :class="row.capBlocked ? 'text-error font-semibold' : 'font-semibold'">{{ row.bondLevel || '-' }}</span>
                  </td>
                  <td class="min-w-[170px]">
                    <div class="space-y-1">
                      <div class="w-full h-2.5 rounded-full bg-base-300 overflow-hidden">
                        <div class="h-full rounded-full bg-info" :style="{ width: `${(row.progress * 100).toFixed(2)}%` }"></div>
                      </div>
                      <div class="text-[11px] text-base-content/60 text-right">{{ (row.progress * 100).toFixed(1) }}%</div>
                    </div>
                  </td>
                  <td class="font-medium">{{ row.needExpText }}</td>
                  <td>
                    <div v-if="row.honorId && row.honorLevel > 0" class="h-8">
                      <SekaiHonorBonds
                        :honor-id="row.honorId"
                        :honor-level="row.honorLevel"
                        :sub="true"
                      />
                    </div>
                    <span v-else class="text-xs text-base-content/50">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>

    <!-- Leader / Multi Tab -->
    <div v-else class="space-y-3">
      <div v-if="!hasLeaderCountData" class="alert alert-info py-2">
        <span class="text-sm">当前账号缺少队长次数数据，请先点击上方“刷新Suite”。</span>
      </div>
      <template v-else>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div class="rounded-lg bg-base-200 px-3 py-2">
            <p class="text-[11px] text-base-content/60">角色数据</p>
            <p class="text-lg font-semibold">{{ leaderCountSummary.availableRows }} / 26</p>
          </div>
          <div class="rounded-lg bg-base-200 px-3 py-2">
            <p class="text-[11px] text-base-content/60">总队长次数</p>
            <p class="text-lg font-semibold">{{ leaderCountSummary.totalPlayCount.toLocaleString() }}</p>
          </div>
          <div class="rounded-lg bg-base-200 px-3 py-2">
            <p class="text-[11px] text-base-content/60">总EX次数</p>
            <p class="text-lg font-semibold">{{ leaderCountSummary.totalExCount.toLocaleString() }}</p>
          </div>
          <div class="rounded-lg bg-base-200 px-3 py-2">
            <p class="text-[11px] text-base-content/60">最高队长次数</p>
            <p class="text-lg font-semibold">{{ leaderCountSummary.maxPlayCount.toLocaleString() }}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
          <div
            v-for="row in leaderCountRows"
            :key="row.characterId"
            class="rounded-2xl border border-base-300 bg-base-100 px-3 py-2.5 shadow-sm"
          >
            <div class="flex items-center gap-2.5 mb-2.5">
              <div class="w-10 h-10 rounded-full overflow-hidden ring-2 flex-shrink-0" :style="{ borderColor: getCharaPillColor(row.characterId) }">
                <img :src="getCharaIcon(row.characterId)" class="w-full h-full object-cover" />
              </div>
              <div>
                <p class="text-base font-bold">{{ getCharaName(row.characterId) }}</p>
                <p class="text-xs text-base-content/60">ID: {{ row.characterId }}</p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 mb-2.5">
              <div class="rounded-lg bg-base-200 px-2 py-1.5 text-center">
                <p class="text-[11px] text-base-content/60">队长次数</p>
                <p class="font-semibold">{{ row.playCount === null ? '-' : row.playCount.toLocaleString() }}</p>
              </div>
              <div class="rounded-lg bg-base-200 px-2 py-1.5 text-center">
                <p class="text-[11px] text-base-content/60">EX等级</p>
                <p class="font-semibold">{{ row.exLevel === null ? '-' : `x${row.exLevel}` }}</p>
              </div>
              <div class="rounded-lg bg-base-200 px-2 py-1.5 text-center">
                <p class="text-[11px] text-base-content/60">EX次数</p>
                <p class="font-semibold">{{ row.exCount === null ? '-' : row.exCount.toLocaleString() }}</p>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px] text-base-content/60">
                <span>进度</span>
                <span>{{ (row.progress * 100).toFixed(1) }}%</span>
              </div>
              <div class="w-full h-3 rounded-full bg-base-300 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :style="{
                    width: `${(row.progress * 100).toFixed(2)}%`,
                    backgroundColor: getLeaderProgressColor(row.playCount || 0),
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
