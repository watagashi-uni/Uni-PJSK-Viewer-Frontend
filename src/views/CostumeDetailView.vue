<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSeoMeta } from '@unhead/vue'
import { useRoute, useRouter } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { ChevronLeft, Shirt, Info, CreditCard, Calendar } from 'lucide-vue-next'
import SekaiCard from '@/components/SekaiCard.vue'
import AssetImage from '@/components/AssetImage.vue'
import CostumeThumb from '@/components/CostumeThumb.vue'
import Costume3DPreview from '@/components/Costume3DPreview.vue'
import {
  buildCostumeGroups,
  costumeThumbUrl,
  COSTUME_PART_LABELS,
  COSTUME_TYPE_LABELS,
  COSTUME_RARITY_LABELS,
} from '@/utils/costume'
import type { Costume3d, CardCostume3d, CostumeGroup } from '@/types/costume'

interface Character {
  id: number
  firstName?: string
  givenName: string
}

interface Card {
  id: number
  characterId: number
  cardRarityType: string
  attr: string
  prefix: string
  assetbundleName: string
  releaseAt: number
}

interface EventCard {
  id: number
  cardId: number
  eventId: number
}

interface EventInfo {
  id: number
  name: string
  assetbundleName: string
  startAt: number
  aggregateAt: number
}

const route = useRoute()
const router = useRouter()
const masterStore = useMasterStore()
const settingsStore = useSettingsStore()

const assetsHost = computed(() => settingsStore.assetsHost)

const group = ref<CostumeGroup | null>(null)
const character = ref<Character | null>(null)
const sourceCard = ref<Card | null>(null)
const sourceCardCharacter = ref<Character | null>(null)
const sourceEvents = ref<EventInfo[]>([])
const relatedGroups = ref<CostumeGroup[]>([])
const isLoading = ref(true)
const notFoundText = ref('未找到该衣装')

function getCharaName(): string {
  if (!character.value) return ''
  return (character.value.firstName || '') + character.value.givenName
}

function getSourceCardCharaName(): string {
  if (!sourceCardCharacter.value) return ''
  return (sourceCardCharacter.value.firstName || '') + sourceCardCharacter.value.givenName
}

// 衣装角色与卡片角色不同 = 该衣装是卡片衣装的角色配布版本
const isDistributedCostume = computed(() => {
  return sourceCard.value !== null && group.value !== null
    && sourceCard.value.characterId !== group.value.characterId
})

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDateShort(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function partLabel(partType: string): string {
  return COSTUME_PART_LABELS[partType] || partType
}

const typeLabel = computed(() => group.value ? (COSTUME_TYPE_LABELS[group.value.costume3dType] || group.value.costume3dType) : '')
const rarityLabel = computed(() => group.value ? (COSTUME_RARITY_LABELS[group.value.rarity] || group.value.rarity) : '')

function eventBannerUrl(event: EventInfo): string {
  return `${assetsHost.value}/startapp/home/banner/${event.assetbundleName}/${event.assetbundleName}.png`
}

async function loadData() {
  isLoading.value = true
  // 从卡片跳转进来时会 router.replace 到标准地址并触发重建，期间保持加载态避免闪现 404
  let redirecting = false
  try {
    const [costumesData, cardCostumesData, charactersData, cardsData, eventCardsData, eventsData] = await Promise.all([
      masterStore.getMaster<Costume3d>('costume3ds'),
      masterStore.getMaster<CardCostume3d>('cardCostume3ds'),
      masterStore.getMaster<Character>('gameCharacters'),
      masterStore.getMaster<Card>('cards'),
      masterStore.getMaster<EventCard>('eventCards'),
      masterStore.getMaster<EventInfo>('events'),
    ])

    // 支持两种进入方式：/costumes/:id（costume3d 条目 id）与 /costumes/card/:cardId（从卡片跳转）
    let anchor: Costume3d | undefined
    if (route.params.cardId !== undefined) {
      const cardId = Number(route.params.cardId)
      const costumeIds = new Set(cardCostumesData.filter(l => l.cardId === cardId).map(l => l.costume3dId))
      if (costumeIds.size === 0) {
        notFoundText.value = '该卡片没有关联衣装'
        return
      }
      const cardEntries = costumesData.filter(c => costumeIds.has(c.id))
      anchor = cardEntries.find(c => c.partType === 'body') || cardEntries[0]
      if (anchor) {
        redirecting = true
        router.replace(`/costumes/${anchor.id}`)
        return
      }
    } else {
      const costumeId = Number(route.params.id)
      anchor = costumesData.find(c => c.id === costumeId)
    }
    if (!anchor) return
    const anchorEntry = anchor

    // 同 group + 同角色的全部条目构成"一套衣装"
    const setEntries = costumesData.filter(
      c => c.costume3dGroupId === anchorEntry.costume3dGroupId && c.characterId === anchorEntry.characterId
    )
    const builtGroup = buildCostumeGroups(setEntries, cardCostumesData, costumesData)[0]
    if (!builtGroup) return
    group.value = builtGroup

    character.value = charactersData.find(c => c.id === builtGroup.characterId) || null

    if (builtGroup.cardId !== undefined) {
      const foundCard = cardsData.find(c => c.id === builtGroup.cardId) || null
      sourceCard.value = foundCard
      if (foundCard) {
        sourceCardCharacter.value = charactersData.find(c => c.id === foundCard.characterId) || null
        const eventIds = new Set(eventCardsData.filter(l => l.cardId === foundCard.id).map(l => l.eventId))
        sourceEvents.value = eventsData
          .filter(e => eventIds.has(e.id))
          .sort((a, b) => a.startAt - b.startAt)
      }
    }

    // 相关衣装：同角色同名的其他衣装组（如卡片附带的通用头饰版本）+ 同卡片的其他衣装组
    // （配布版衣装不追加卡片角色本人的组，避免混入其他角色的部件）
    const isOwnCardCostume = sourceCard.value !== null && sourceCard.value.characterId === builtGroup.characterId
    const currentKey = builtGroup.key
    const relatedEntries = costumesData.filter(
      c => c.characterId === anchorEntry.characterId
        && c.name === anchorEntry.name
        && `${c.costume3dGroupId}:${c.characterId}` !== currentKey
    )
    if (builtGroup.cardId !== undefined && isOwnCardCostume) {
      const cardCostumeIds = new Set(
        cardCostumesData.filter(l => l.cardId === builtGroup.cardId).map(l => l.costume3dId)
      )
      for (const costume of costumesData) {
        if (cardCostumeIds.has(costume.id) && `${costume.costume3dGroupId}:${costume.characterId}` !== currentKey) {
          relatedEntries.push(costume)
        }
      }
    }
    if (relatedEntries.length > 0) {
      const dedup = new Map<number, Costume3d>()
      for (const costume of relatedEntries) dedup.set(costume.id, costume)
      relatedGroups.value = buildCostumeGroups([...dedup.values()], cardCostumesData)
        .sort((a, b) => a.representativeId - b.representativeId)
    }
  } catch (error) {
    console.error('加载衣装详情失败:', error)
  } finally {
    if (!redirecting) {
      isLoading.value = false
    }
  }
}

const pageTitle = computed(() => {
  if (group.value) {
    return `衣装「${group.value.name}」 ${getCharaName()} - Uni PJSK Viewer`
  }
  return '衣装详情 - Uni PJSK Viewer'
})

const pageDescription = computed(() => {
  if (group.value) {
    return `世界计划（PJSK / Project SEKAI）3D 衣装「${group.value.name}」（${getCharaName()}）的配色一览、获取方式与来源卡片信息。`
  }
  return '查看世界计划（PJSK / Project SEKAI）的 3D 衣装详情。'
})

const pageImage = computed(() => {
  if (group.value) {
    return costumeThumbUrl(settingsStore.ASSETS_HOST_GLOBAL, group.value.thumbAssetbundleName)
  }
  return ''
})

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogImage: pageImage,
  twitterCard: 'summary',
})

function goBack() {
  const backState = window.history.state?.back
  if (typeof backState === 'string' && backState.startsWith('/costumes')) {
    router.back()
  } else {
    router.push('/costumes')
  }
}

onMounted(loadData)
</script>

<template>
  <div>
    <!-- 加载中 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else-if="group">
      <!-- 顶部导航 -->
      <div class="mb-4 max-w-4xl mx-auto px-4 lg:px-0 flex justify-between">
        <button class="btn btn-ghost btn-sm gap-2 pl-0" @click="goBack">
          <ChevronLeft class="w-4 h-4" /> 返回列表
        </button>
      </div>

      <div class="card bg-base-100 shadow-lg max-w-4xl mx-auto animate-fade-in-up overflow-hidden">
        <div class="card-body">
          <!-- 标题区域 -->
          <div class="text-center pb-4 mb-2 border-b border-base-200">
            <h1 class="text-2xl font-bold flex items-center justify-center gap-3">
              <Shirt class="w-7 h-7 text-primary" />
              {{ group.name }}
            </h1>
            <RouterLink
              :to="`/costumes?charaId=${group.characterId}`"
              class="inline-flex items-center gap-2 mt-3 text-base-content/70 hover:text-primary transition-colors"
            >
              <span class="h-7 w-7 overflow-hidden rounded-full bg-base-200 ring-1 ring-base-300">
                <img :src="`/img/chr_ts/chr_ts_90_${group.characterId}.png`" :alt="getCharaName()" class="h-full w-full object-cover" />
              </span>
              {{ getCharaName() }}
            </RouterLink>
            <div class="flex justify-center gap-2 mt-3">
              <span class="badge badge-outline">{{ typeLabel }}</span>
              <span class="badge" :class="group.rarity === 'rare' ? 'badge-secondary' : 'badge-ghost'">{{ rarityLabel }}</span>
              <span v-if="group.cardId !== undefined" class="badge badge-primary gap-1">
                <CreditCard class="w-3 h-3" /> 卡片衣装
              </span>
            </div>
          </div>

          <!-- 部件与配色 -->
          <div v-for="part in group.parts" :key="part.partType" class="mt-4">
            <h3 class="font-semibold text-primary mb-3 flex items-center gap-2">
              <Shirt class="w-5 h-5" /> {{ partLabel(part.partType) }}
              <span class="text-xs font-normal text-base-content/50">{{ part.variants.length }} 色</span>
            </h3>
            <!-- 部件单独的获取条件（如专属发型需要 Master Rank） -->
            <p v-if="part.howToObtain && part.howToObtain !== group.howToObtain" class="text-xs text-base-content/60 -mt-1 mb-3">
              {{ part.howToObtain }}
            </p>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="variant in part.variants"
                :key="variant.costume3dId"
                class="flex flex-col items-center gap-1"
              >
                <div class="w-20 h-20 bg-base-200 rounded-xl overflow-hidden shadow-sm">
                  <CostumeThumb
                    :assetbundle-name="variant.assetbundleName"
                    :alt="`${group.name} ${variant.colorName}`"
                    class="w-full h-full p-1"
                  />
                </div>
                <span class="text-xs text-base-content/70 max-w-20 truncate">{{ variant.colorName }}</span>
              </div>
            </div>
          </div>

          <!-- 3D 预览 -->
          <div class="mt-6">
            <Costume3DPreview :character-id="group.characterId" :parts="group.parts" />
          </div>

          <!-- 衣装信息 -->
          <div class="bg-base-200 rounded-xl p-5 mt-6">
            <h3 class="font-semibold text-primary mb-4 flex items-center gap-2">
              <Info class="w-5 h-5" /> 衣装信息
            </h3>
            <div class="space-y-2 text-sm">
              <p>
                <span class="font-medium">获取方式：</span>
                <span v-if="group.howToObtain">{{ group.howToObtain }}</span>
                <span v-else-if="group.cardId !== undefined">获得对应卡片后解锁</span>
                <span v-else>-</span>
              </p>
              <p v-if="group.designer && group.designer !== '-'">
                <span class="font-medium">设计者：</span>{{ group.designer }}
              </p>
              <p>
                <span class="font-medium">实装时间：</span>
                {{ group.publishedAt ? formatDate(group.publishedAt) : '-' }}
              </p>
              <p>
                <span class="font-medium">包含部件：</span>
                {{ group.parts.map(p => partLabel(p.partType)).join('、') }}
              </p>
            </div>
          </div>

          <!-- 来源卡片 -->
          <div v-if="sourceCard" class="bg-base-200 rounded-xl p-5 mt-6">
            <h3 class="font-semibold text-primary mb-4 flex items-center gap-2">
              <CreditCard class="w-5 h-5" /> 来源卡片
            </h3>
            <div class="flex flex-wrap items-center gap-5">
              <div class="flex gap-3">
                <div class="w-20 sm:w-24 shrink-0">
                  <SekaiCard :card="sourceCard" :trained="false" />
                </div>
                <div class="w-20 sm:w-24 shrink-0">
                  <SekaiCard :card="sourceCard" :trained="true" />
                </div>
              </div>
              <div class="flex-1 min-w-[180px]">
                <p class="font-semibold">{{ sourceCard.prefix }}</p>
                <p class="text-sm text-base-content/60 mt-0.5">{{ getSourceCardCharaName() }}</p>
                <p class="text-xs text-base-content/60 mt-1">实装时间：{{ formatDate(sourceCard.releaseAt) }}</p>
                <p v-if="isDistributedCostume" class="text-xs text-info mt-1">
                  此衣装是该卡片附带衣装配布给{{ getCharaName() }}的版本
                </p>
                <RouterLink :to="`/cards/${sourceCard.id}`" class="btn btn-primary btn-sm mt-3">
                  查看卡片详情
                </RouterLink>
              </div>
            </div>

            <!-- 当期活动 -->
            <div v-if="sourceEvents.length > 0" class="mt-4 pt-4 border-t border-base-300 space-y-2">
              <p class="text-sm font-medium flex items-center gap-1.5">
                <Calendar class="w-4 h-4" /> 当期活动
              </p>
              <RouterLink
                v-for="event in sourceEvents"
                :key="event.id"
                :to="`/events/${event.id}`"
                class="flex items-center gap-3 bg-base-100 rounded-lg p-2 hover:shadow-md transition-all group"
              >
                <AssetImage
                  :src="eventBannerUrl(event)"
                  :alt="event.name"
                  class="h-12 rounded object-contain shrink-0 group-hover:scale-[1.02] transition-transform"
                />
                <div class="min-w-0">
                  <p class="text-sm font-medium truncate">{{ event.name }}</p>
                  <p class="text-xs text-base-content/60">
                    {{ formatDateShort(event.startAt) }} ~ {{ formatDateShort(event.aggregateAt) }}
                  </p>
                </div>
              </RouterLink>
            </div>
          </div>

          <!-- 相关衣装 -->
          <div v-if="relatedGroups.length > 0" class="mt-6">
            <h3 class="font-semibold text-primary mb-3 flex items-center gap-2">
              <Shirt class="w-5 h-5" /> 相关衣装
            </h3>
            <div class="flex flex-wrap gap-3">
              <RouterLink
                v-for="related in relatedGroups"
                :key="related.key"
                :to="`/costumes/${related.representativeId}`"
                class="flex flex-col items-center gap-1 group"
              >
                <div class="w-20 h-20 bg-base-200 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all">
                  <CostumeThumb
                    :assetbundle-name="related.thumbAssetbundleName"
                    :alt="related.name"
                    class="w-full h-full p-1"
                  />
                </div>
                <span class="text-xs text-base-content/70 max-w-20 truncate">
                  {{ related.parts.map(p => partLabel(p.partType)).join('+') }}
                </span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 404 -->
    <div v-else class="text-center py-20">
      <p class="text-base-content/60 text-lg">{{ notFoundText }}</p>
    </div>
  </div>
</template>
