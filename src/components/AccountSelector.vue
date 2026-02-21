<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useMasterStore } from '@/stores/master'
import AssetImage from '@/components/AssetImage.vue'
import { User, ChevronDown } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue?: string
  showId?: boolean
}>(), {
  modelValue: '',
  showId: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

const accountStore = useAccountStore()
const masterStore = useMasterStore()
const assetsHost = 'https://assets.unipjsk.com'

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

function getAccountInfo(userId: string) {
  let rank = ''
  let assetbundleName = ''
  let isTrained = false

  const profile = accountStore.getProfileCache(userId)
  const suite = accountStore.getSuiteCache(userId)

  if (profile) {
    rank = profile.user?.rank || ''
    const leaderCardId = profile.userDeck?.member1
    if (leaderCardId && profile.userCards) {
      const userCard = profile.userCards.find((c: any) => c.cardId === leaderCardId)
      isTrained = userCard?.specialTrainingStatus === 'done' || userCard?.defaultImage === 'training'
      const masterCard = masterStore.cache['cards']?.find((c: any) => c.id === leaderCardId)
      if (masterCard) assetbundleName = masterCard.assetbundleName
    }
  } else if (suite) {
    rank = suite.user?.rank || ''
    const mainDeck = suite.userDecks?.[0]
    if (mainDeck?.member1 && suite.userCards) {
      const userCard = suite.userCards.find((c: any) => c.cardId === mainDeck.member1)
      isTrained = userCard?.specialTrainingStatus === 'done' || userCard?.defaultImage === 'training'
      const masterCard = masterStore.cache['cards']?.find((c: any) => c.id === mainDeck.member1)
      if (masterCard) assetbundleName = masterCard.assetbundleName
    }
  }

  return { rank, assetbundleName, isTrained }
}

const effectiveUserId = computed(() => {
  return props.modelValue || accountStore.currentUserId
})

const currentAccount = computed(() => {
  const acc = accountStore.accounts.find(a => a.userId === effectiveUserId.value)
  if (!acc) return null
  const info = getAccountInfo(acc.userId)
  return { ...acc, ...info }
})

function toggle() {
  isOpen.value = !isOpen.value
}

function select(userId: string) {
  emit('update:modelValue', userId)
  emit('change', userId)
  isOpen.value = false
}

function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <!-- Trigger Button -->
    <div
      class="flex items-center justify-between w-full px-2 py-1.5 rounded-lg cursor-pointer bg-base-100 hover:bg-base-200 transition-colors"
      @click.stop="toggle"
    >
      <template v-if="currentAccount">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <div class="w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-base-300 shrink-0 flex items-center justify-center">
            <AssetImage 
              v-if="currentAccount.assetbundleName"
              :src="`${assetsHost}/startapp/thumbnail/chara/${currentAccount.assetbundleName}_${currentAccount.isTrained ? 'after_training' : 'normal'}.png`"
              class="w-full h-full object-cover"
            />
            <User v-else class="w-4 h-4 text-base-content/30" />
          </div>
          <div class="flex flex-col items-start min-w-0 text-left">
            <span class="text-xs font-bold leading-tight truncate max-w-[120px] sm:max-w-[150px]">{{ currentAccount.name }}</span>
            <span class="text-[10px] text-base-content/60 leading-tight truncate">
              <template v-if="currentAccount.rank">Lv.{{ currentAccount.rank }}</template>
              <template v-if="showId"> | <span class="font-mono">{{ currentAccount.userId }}</span></template>
            </span>
          </div>
        </div>
        <ChevronDown class="w-4 h-4 opacity-50 shrink-0 ml-1 transition-transform" :class="{ 'rotate-180': isOpen }" />
      </template>
      <template v-else>
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-8 h-8 rounded-full border border-base-200 bg-base-200 shrink-0 flex items-center justify-center">
            <User class="w-4 h-4 text-base-content/30" />
          </div>
          <span class="text-sm font-medium">选择账号</span>
        </div>
        <ChevronDown class="w-4 h-4 opacity-50 shrink-0 ml-1" />
      </template>
    </div>
    
    <!-- Dropdown List -->
    <div
      v-if="isOpen"
      class="absolute left-0 right-0 mt-1 p-1 shadow-lg bg-base-100 rounded-lg z-50 max-h-[60vh] overflow-y-auto border border-base-200"
    >
      <div
        v-for="acc in accountStore.accounts"
        :key="acc.userId"
        class="flex flex-row items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors"
        :class="acc.userId === effectiveUserId ? 'bg-primary/10 text-primary' : 'hover:bg-base-200'"
        @click.stop="select(acc.userId)"
      >
        <div class="w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-base-300 shrink-0 flex items-center justify-center">
          <AssetImage 
            v-if="getAccountInfo(acc.userId).assetbundleName"
            :src="`${assetsHost}/startapp/thumbnail/chara/${getAccountInfo(acc.userId).assetbundleName}_${getAccountInfo(acc.userId).isTrained ? 'after_training' : 'normal'}.png`"
            class="w-full h-full object-cover"
          />
          <User v-else class="w-4 h-4 text-base-content/30" />
        </div>
        <div class="flex flex-col items-start min-w-0 flex-1 overflow-hidden text-left">
          <span class="text-xs font-bold leading-tight truncate w-full">{{ acc.name }}</span>
          <span class="text-[10px] opacity-70 leading-tight truncate w-full">
            <template v-if="getAccountInfo(acc.userId).rank">Lv.{{ getAccountInfo(acc.userId).rank }}</template>
            <template v-if="showId"> | <span class="font-mono">{{ acc.userId }}</span></template>
          </span>
        </div>
      </div>
      <div v-if="accountStore.accounts.length === 0" class="text-sm text-base-content/50 p-4 text-center">
        暂无账号
      </div>
    </div>
  </div>
</template>
