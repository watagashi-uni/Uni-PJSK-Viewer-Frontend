<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMasterStore } from '@/stores/master'
import { useAccountStore } from '@/stores/account'
import { useSettingsStore } from '@/stores/settings'
import SekaiCard from '@/components/SekaiCard.vue'
import AssetImage from '@/components/AssetImage.vue'
import AccountSelector from '@/components/AccountSelector.vue'
import { 
  Info, Play, Users, User,
  Zap, Settings2, Loader2, AlertTriangle, ChevronDown
} from 'lucide-vue-next'

const masterStore = useMasterStore()
const accountStore = useAccountStore()
const settingsStore = useSettingsStore()
const route = useRoute()

const assetsHost = computed(() => settingsStore.assetsHost)

// ==================== 类型定义 ====================
interface EventData {
  id: number
  eventType: string
  name: string
  assetbundleName: string
  startAt: number
  aggregateAt: number
}

interface MusicData {
  id: number
  title: string
  assetbundleName: string
  publishedAt: number
  composer: string
}

interface MusicDiffData {
  id: number
  musicId: number
  musicDifficulty: string
  playLevel: number
  totalNoteCount: number
}

interface CharacterData {
  id: number
  seq: number
  firstName?: string
  givenName: string
  unit: string
}

interface WorldBloomData {
  id: number
  eventId: number
  gameCharacterId: number
  worldBloomChapterType: string
}

interface CardData {
  id: number
  characterId: number
  cardRarityType: string
  attr: string
  assetbundleName: string
}

interface CardConfigLocal {
  disable?: boolean
  rankMax?: boolean
  episodeRead?: boolean
  masterMax?: boolean
  skillMax?: boolean
}

interface DeckCardResult {
  cardId: number
  level: number
  skillLevel: number
  masterRank: number
  power: {
    base: number
    areaItemBonus: number
    characterBonus: number
    honorBonus: number
    fixtureBonus: number
    gateBonus: number
    total: number
  }
  eventBonus?: string
  skill: {
    scoreUp: number
    lifeRecovery: number
  }
}

interface RecommendDeckResult {
  score: number
  power: {
    base: number
    areaItemBonus: number
    characterBonus: number
    honorBonus: number
    fixtureBonus: number
    gateBonus: number
    total: number
  }
  eventBonus?: number
  supportDeckBonus?: number
  cards: DeckCardResult[]
}

// ==================== 状态 ====================
const userId = ref('')
const mode = ref<'1' | '2'>('2') // 1=挑战, 2=活动


const selectedEventId = ref<number | null>(null)
const selectedCharacterId = ref<number>(21)
const selectedMusicId = ref<number | null>(null)
const selectedDifficulty = ref('master')
const selectedLiveType = ref('multi') // 'solo' | 'multi' | 'auto'
const selectedSupportCharacterId = ref<number | null>(null)

const events = ref<EventData[]>([])
const musics = ref<MusicData[]>([])
const musicDifficulties = ref<MusicDiffData[]>([])
const characters = ref<CharacterData[]>([])
const worldBlooms = ref<WorldBloomData[]>([])
const cards = ref<CardData[]>([])

const musicSearchText = ref('')
const showMusicDropdown = ref(false)
const eventSearchText = ref('')
const showEventDropdown = ref(false)

const cardConfig = ref<Record<string, CardConfigLocal>>({
  rarity_1: { disable: true, rankMax: true, masterMax: true, episodeRead: true, skillMax: true },
  rarity_2: { disable: true, rankMax: true, masterMax: true, episodeRead: true, skillMax: true },
  rarity_3: { disable: false, rankMax: true, masterMax: false, episodeRead: true, skillMax: false },
  rarity_birthday: { disable: false, rankMax: true, masterMax: false, episodeRead: true, skillMax: false },
  rarity_4: { disable: false, rankMax: true, masterMax: false, episodeRead: true, skillMax: false },
})

const calculating = ref(false)
const recommend = ref<RecommendDeckResult[] | null>(null)
const errorMsg = ref('')
const challengeHighScore = ref(0)
const calcDuration = ref(0)

let workerRef: Worker | null = null
const isLoading = ref(true)

// ==================== 计算属性 ====================
const selectedEvent = computed(() => events.value.find(e => e.id === selectedEventId.value) ?? null)
const selectedMusic = computed(() => musics.value.find(m => m.id === selectedMusicId.value) ?? null)
const selectedCharacter = computed(() => characters.value.find(c => c.id === selectedCharacterId.value) ?? null)
const selectedSupportCharacter = computed(() => characters.value.find(c => c.id === selectedSupportCharacterId.value) ?? null)

const filteredMusics = computed(() => {
  const now = Date.now()
  let list = musics.value.filter(m => m.publishedAt <= now)
  if (musicSearchText.value.trim()) {
    const q = musicSearchText.value.toLowerCase()
    list = list.filter(m => m.title.toLowerCase().includes(q) || m.id.toString().includes(q))
  }
  return list.sort((a, b) => b.id - a.id).slice(0, 50)
})

const filteredEvents = computed(() => {
  const now = Date.now()
  let list = events.value.filter(e => e.aggregateAt >= now)
  if (list.length === 0) {
    const past = events.value.filter(e => e.aggregateAt < now).sort((a, b) => b.id - a.id)
    if (past.length > 0) list = [past[0]!]
  }
  if (eventSearchText.value.trim()) {
    const q = eventSearchText.value.toLowerCase()
    list = list.filter(e => e.name.toLowerCase().includes(q) || e.id.toString().includes(q))
  }
  return list.sort((a, b) => a.id - b.id).slice(0, 50)
})

const availableDifficulties = computed(() => {
  if (!selectedMusicId.value) return []
  return musicDifficulties.value
    .filter(d => d.musicId === selectedMusicId.value)
    .map(d => d.musicDifficulty)
})

const supportCharacters = computed(() => {
  if (!selectedEvent.value || selectedEvent.value.eventType !== 'world_bloom') return []
  const wbs = worldBlooms.value.filter(wb => wb.eventId === selectedEvent.value!.id)
  if (wbs.length === 1 && wbs[0]?.worldBloomChapterType === 'finale') return characters.value
  return wbs
    .map(wb => characters.value.find(c => c.id === wb.gameCharacterId))
    .filter((c): c is CharacterData => c !== undefined)
})

const showSupportCharacter = computed(() =>
  mode.value === '2' && selectedEvent.value?.eventType === 'world_bloom' && supportCharacters.value.length > 0
)

function getCharacterName(c: CharacterData | null): string {
  if (!c) return ''
  return c.firstName ? `${c.firstName}${c.givenName}` : c.givenName
}

const difficultyColors: Record<string, string> = {
  easy: 'btn-success',
  normal: 'btn-info',
  hard: 'btn-warning',
  expert: 'btn-error',
  master: 'btn-secondary',
  append: 'btn-accent',
}

// ==================== 初始化 ====================
function closeDropdowns(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.music-dropdown')) showMusicDropdown.value = false
  if (!target.closest('.event-dropdown')) showEventDropdown.value = false
}

onMounted(async () => {
  document.addEventListener('click', closeDropdowns)
  // 优先用侧边栏已选账号
  if (accountStore.currentUserId) {
    userId.value = accountStore.currentUserId
  } else {
    const savedUid = localStorage.getItem('deckRecommend_userId')
    if (savedUid) userId.value = savedUid
  }

  try {
    if (!masterStore.isReady) await masterStore.initialize()

    const [eventsData, musicsData, musicDiffData, charsData, cardsData] = await Promise.all([
      masterStore.getMaster<EventData>('events'),
      masterStore.getMaster<MusicData>('musics'),
      masterStore.getMaster<MusicDiffData>('musicDifficulties'),
      masterStore.getMaster<CharacterData>('gameCharacters'),
      masterStore.getMaster<CardData>('cards'),
    ])

    events.value = eventsData
    musics.value = musicsData
    musicDifficulties.value = musicDiffData
    characters.value = charsData
    cards.value = cardsData

    try {
      worldBlooms.value = await masterStore.getMaster<WorldBloomData>('worldBlooms')
    } catch {
      worldBlooms.value = []
    }

    const now = Date.now()
    const activeAndFuture = eventsData.filter(e => e.aggregateAt >= now).sort((a, b) => a.id - b.id)
    if (activeAndFuture.length > 0) {
      selectedEventId.value = activeAndFuture[0]!.id
    } else {
      const past = eventsData.filter(e => e.aggregateAt < now).sort((a, b) => b.id - a.id)
      if (past.length > 0) selectedEventId.value = past[0]!.id
    }

    // 优先使用 URL query 参数，其次默认选择 ID 74
    const queryMusicId = route.query.musicId ? Number(route.query.musicId) : null
    if (queryMusicId && musicsData.find(m => m.id === queryMusicId)) {
      selectedMusicId.value = queryMusicId
    } else if (musicsData.find(m => m.id === 74)) {
      selectedMusicId.value = 74
    } else {
      const published = musicsData.filter(m => m.publishedAt <= now).sort((a, b) => b.id - a.id)
      if (published.length > 0) selectedMusicId.value = published[0]!.id
    }
  } catch (e) {
    console.error('加载自动组队数据失败:', e)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns)
  workerRef?.terminate()
})

watch(selectedEventId, () => {
  if (supportCharacters.value.length > 0) {
    selectedSupportCharacterId.value = supportCharacters.value[0]!.id
  } else {
    selectedSupportCharacterId.value = null
  }
})

// ==================== 计算 ====================
function selectMusic(m: MusicData) {
  selectedMusicId.value = m.id
  musicSearchText.value = ''
  showMusicDropdown.value = false
  const diffs = musicDifficulties.value.filter(d => d.musicId === m.id).map(d => d.musicDifficulty)
  for (const p of ['append', 'master', 'expert', 'hard', 'normal', 'easy']) {
    if (diffs.includes(p)) { selectedDifficulty.value = p; break }
  }
}

function selectEvent(e: EventData) {
  selectedEventId.value = e.id
  eventSearchText.value = ''
  showEventDropdown.value = false
}

async function handleCalculate() {
  if (calculating.value) {
    workerRef?.terminate()
    workerRef = null
    errorMsg.value = ''
    recommend.value = null
    calculating.value = false
    return
  }

  if (!userId.value) { errorMsg.value = '请选择绑定的账号'; return }
  const uid = userId.value
  localStorage.setItem('deckRecommend_userId', uid)

  if (!selectedMusic.value || !selectedDifficulty.value) { errorMsg.value = '请选择歌曲和难度'; return }
  if (mode.value === '1' && !selectedCharacter.value) { errorMsg.value = '请选择角色'; return }
  if (mode.value === '2' && !selectedEvent.value) { errorMsg.value = '请选择活动'; return }

  errorMsg.value = ''
  recommend.value = null
  challengeHighScore.value = 0
  calculating.value = true

  // 自动刷新 suite 数据
  try {
    await accountStore.refreshSuite(uid)
  } catch (e: any) {
    const msg = String(e?.message || e || '')
    // 已跳转 OAuth 授权流程，当前计算中止，等待授权完成后重试
    if (msg.includes('正在跳转 OAuth 授权页面')) {
      calculating.value = false
      return
    }
    errorMsg.value = msg || '刷新玩家数据失败'
    calculating.value = false
    return
  }

  workerRef = new Worker(
    new URL('../utils/deckRecommendWorker.ts', import.meta.url),
    { type: 'module' }
  )

  workerRef.onmessage = async (ev) => {
    const data = ev.data

    // 1. 处理 Master 数据请求 (Main Thread -> Worker)
    if (data.type === 'requestMaster') {
      try {
        const key = data.key
        // 从 masterStore 获取数据 (自动处理缓存/版本)
        const masterData = await masterStore.getMaster(key)
        
        // 发回给 Worker
        workerRef?.postMessage({
          type: 'responseMaster',
          requestId: data.requestId,
          data: JSON.parse(JSON.stringify(masterData)) // 去除 Proxy
        })
      } catch (e: any) {
        workerRef?.postMessage({
          type: 'responseMaster',
          requestId: data.requestId,
          error: e.message || String(e)
        })
      }
      return
    }

    // 1.5 处理用户数据请求 (Main Thread -> Worker)
    if (data.type === 'requestUserData') {
      try {
        const uidForWorker = String(data.userId || uid)
        const suiteData = accountStore.getSuiteCache(uidForWorker)
        if (!suiteData) {
          throw new Error('玩家数据未上传到指定地点')
        }
        workerRef?.postMessage({
          type: 'responseUserData',
          requestId: data.requestId,
          data: JSON.parse(JSON.stringify(suiteData))
        })
      } catch (e: any) {
        workerRef?.postMessage({
          type: 'responseUserData',
          requestId: data.requestId,
          error: e.message || String(e)
        })
      }
      return
    }

    // 2. 处理计算结果
    if (data.type === 'error') {
      const s = String(data.error)
      if (s.includes('404')) errorMsg.value = '玩家数据未上传到指定地点'
      else if (s.includes('403')) errorMsg.value = '当前账号未授权读取数据，请先完成 OAuth 授权后再试'
      else errorMsg.value = s
      recommend.value = null
      calculating.value = false
    } else if (data.type === 'result') {
      recommend.value = data.result.result
      if (data.result.challengeHighScore) challengeHighScore.value = data.result.challengeHighScore
      if (data.result.duration > 0) calcDuration.value = data.result.duration
      calculating.value = false
    }
  }

  workerRef.onerror = (e) => {
    errorMsg.value = e.message || '计算出错'
    calculating.value = false
  }

  const args: Record<string, unknown> = {
    mode: mode.value,
    userId: userId.value,
    music: JSON.parse(JSON.stringify(selectedMusic.value)), // 同样去除 music 的 proxy
    difficulty: selectedDifficulty.value,
    cardConfig: JSON.parse(JSON.stringify(cardConfig.value)), // 去除配置的 proxy
  }

  if (mode.value === '1') {
    args.gameCharacter = JSON.parse(JSON.stringify(selectedCharacter.value))
  } else {
    args.event0 = JSON.parse(JSON.stringify(selectedEvent.value))
    args.liveType = selectedLiveType.value
    args.supportCharacter = showSupportCharacter.value ? JSON.parse(JSON.stringify(selectedSupportCharacter.value)) : undefined
  }

  workerRef.postMessage({ args })
}

// ==================== 结果辅助 ====================
function getCardForResult(cardId: number): CardData | undefined {
  return cards.value.find(c => c.id === cardId)
}

function isNormalCard(rarity: string): boolean {
  return ['rarity_1', 'rarity_2', 'rarity_birthday'].includes(rarity)
}

const rarityList = [
  { type: 'rarity_4', name: '四星' },
  { type: 'rarity_birthday', name: '生日' },
  { type: 'rarity_3', name: '三星' },
  { type: 'rarity_2', name: '二星' },
  { type: 'rarity_1', name: '一星' },
]
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <h1 class="text-3xl font-bold flex items-center gap-3">
      <Zap class="w-8 h-8 text-primary" />
      自动组队
    </h1>

    <div class="alert alert-info shadow-sm">
      <Info class="w-5 h-5 shrink-0" />
      <div class="text-sm">
        <p>使用前请先将用户数据传到 <a href="https://haruki.seiunx.com/upload_suite" target="_blank" class="link font-medium">Haruki工具箱</a>。</p>
        <p>计算过程全部在您的浏览器中进行，不会记录任何用户数据。手机性能有限建议使用电脑。</p>
        <p>本页面抄的 <a href="https://3-3.dev/sekai/deck-recommend" target="_blank" class="link font-medium">3-3.dev</a></p>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else>
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body space-y-4">
          <!-- 用户ID -->
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">用户账号</span></label>
            <div class="max-w-md w-full border border-base-300 rounded-lg p-1 bg-base-100 shadow-sm">
              <AccountSelector 
                v-model="userId"
                show-id
              />
            </div>
            <label v-if="accountStore.accounts.length === 0" class="label mt-1">
              <span class="label-text-alt text-base-content/60">
                请先在 <RouterLink to="/profile" class="link text-primary">用户档案</RouterLink> 中添加账号
              </span>
            </label>
          </div>

          <!-- 模式 -->
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">模式</span></label>
            <div class="flex gap-2">
              <button class="btn btn-sm" :class="mode === '2' ? 'btn-primary' : 'btn-ghost'" @click="mode = '2'">
                <Users class="w-4 h-4" /> 活动
              </button>
              <button class="btn btn-sm" :class="mode === '1' ? 'btn-primary' : 'btn-ghost'" @click="mode = '1'">
                <User class="w-4 h-4" /> 挑战
              </button>
            </div>
          </div>

          <!-- 活动选择 -->
          <div v-if="mode === '2'" class="form-control">
            <label class="label"><span class="label-text font-medium">活动</span></label>
            <div class="relative event-dropdown max-w-md">
              <div 
                class="border border-base-300 rounded-lg p-2 flex items-center gap-3 cursor-pointer hover:bg-base-200 transition-colors bg-base-100 shadow-sm"
                @click="showEventDropdown = !showEventDropdown"
              >
                <template v-if="selectedEvent">
                  <div class="w-12 h-12 flex-shrink-0 bg-base-300 rounded overflow-hidden flex items-center justify-center shadow-inner">
                    <AssetImage 
                      :src="`${assetsHost}/ondemand/event/${selectedEvent.assetbundleName}/logo/logo.png`"
                      class="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-xs opacity-60 font-medium">ID: {{ selectedEvent.id }}</div>
                    <div class="font-bold truncate text-sm" :title="selectedEvent.name">{{ selectedEvent.name }}</div>
                  </div>
                </template>
                <template v-else>
                  <div class="flex-1 text-base-content/60 px-2 py-1 text-sm">请选择活动...</div>
                </template>
                <ChevronDown class="w-5 h-5 opacity-50 mr-2 transition-transform duration-200" :class="{ 'rotate-180': showEventDropdown }" />
              </div>

              <!-- 下拉列表 -->
              <div v-if="showEventDropdown" class="absolute z-50 mt-2 w-full bg-base-100 shadow-2xl rounded-xl border border-base-300 flex flex-col max-h-[350px] overflow-hidden">
                <div class="p-3 border-b border-base-200 bg-base-100/95 backdrop-blur z-10 sticky top-0">
                  <input v-model="eventSearchText" type="text" placeholder="搜索活动名称或ID..." class="input input-sm input-bordered w-full" />
                </div>
                <div class="overflow-y-auto flex-1 p-2 space-y-1 bg-base-100/50">
                  <div 
                    v-for="e in filteredEvents" 
                    :key="e.id" 
                    class="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                    :class="selectedEventId === e.id ? 'bg-primary/10 border-primary/20 border shadow-sm' : 'border border-transparent'"
                    @click="selectEvent(e)"
                  >
                    <div class="w-14 h-14 flex-shrink-0 bg-base-300 rounded-md overflow-hidden flex items-center justify-center shadow-inner">
                      <AssetImage 
                        :src="`${assetsHost}/ondemand/event/${e.assetbundleName}/logo/logo.png`"
                        class="max-w-full max-h-full object-contain p-1"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-[11px] font-bold tracking-wider" :class="selectedEventId === e.id ? 'text-primary' : 'opacity-50'">ID: {{ e.id }}</div>
                      <div class="font-bold truncate text-sm mt-0.5" :class="selectedEventId === e.id ? 'text-primary' : ''" :title="e.name">{{ e.name }}</div>
                    </div>
                  </div>
                  <div v-if="filteredEvents.length === 0" class="p-6 text-center text-sm font-medium opacity-60">
                    没有找到该活动
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 角色选择(挑战) -->
          <div v-if="mode === '1'" class="form-control">
            <label class="label"><span class="label-text font-medium">角色</span></label>
            <select v-model.number="selectedCharacterId" class="select select-bordered w-full max-w-md">
              <option v-for="c in characters" :key="c.id" :value="c.id">{{ getCharacterName(c) }}</option>
            </select>
          </div>

          <!-- 支援角色(WL) -->
          <div v-if="showSupportCharacter" class="form-control">
            <label class="label"><span class="label-text font-medium">支援角色（队长）</span></label>
            <select v-model.number="selectedSupportCharacterId" class="select select-bordered w-full max-w-md">
              <option v-for="c in supportCharacters" :key="c.id" :value="c.id">{{ getCharacterName(c) }}</option>
            </select>
          </div>

          <!-- Live类型 -->
          <div v-if="mode === '2'" class="form-control">
            <label class="label"><span class="label-text font-medium">Live类型</span></label>
            <div class="flex gap-2">
              <button class="btn btn-sm" :class="selectedLiveType === 'multi' ? 'btn-primary' : 'btn-ghost'" @click="selectedLiveType = 'multi'">多人Live</button>
              <button class="btn btn-sm" :class="selectedLiveType === 'solo' ? 'btn-primary' : 'btn-ghost'" @click="selectedLiveType = 'solo'">单人Live</button>
              <button class="btn btn-sm" :class="selectedLiveType === 'auto' ? 'btn-primary' : 'btn-ghost'" @click="selectedLiveType = 'auto'">自动Live</button>
            </div>
          </div>

          <!-- 歌曲 -->
          <div class="form-control">
            <label class="label"><span class="label-text font-medium">歌曲</span></label>
            <div class="flex gap-2 flex-wrap items-start">
              <div class="relative music-dropdown flex-1 min-w-[200px] max-w-sm">
                <input v-model="musicSearchText" type="text" :placeholder="selectedMusic ? `${selectedMusic.id} - ${selectedMusic.title}` : '搜索歌曲...'" class="input input-bordered w-full" @focus="showMusicDropdown = true" />
                <ul v-if="showMusicDropdown" class="absolute z-50 mt-1 w-full bg-base-100 shadow-xl rounded-box max-h-60 overflow-y-auto border border-base-300">
                  <li v-for="m in filteredMusics" :key="m.id" class="px-4 py-2 hover:bg-base-200 cursor-pointer text-sm" :class="{ 'bg-primary/10': selectedMusicId === m.id }" @mousedown.prevent="selectMusic(m)">
                    {{ m.id }} - {{ m.title }}
                  </li>
                </ul>
              </div>
              <div class="flex gap-1">
                <button v-for="d in availableDifficulties" :key="d" class="btn btn-sm" :class="selectedDifficulty === d ? (difficultyColors[d] || 'btn-primary') : 'btn-ghost'" @click="selectedDifficulty = d">
                  {{ d.toUpperCase().slice(0, 3) }}
                </button>
              </div>
            </div>
          </div>

          <!-- 卡牌配置 -->
          <div class="collapse collapse-arrow bg-base-200 rounded-lg">
            <input type="checkbox" />
            <div class="collapse-title font-medium flex items-center gap-2">
              <Settings2 class="w-4 h-4" />
              卡牌配置
              <span class="text-xs opacity-60">（可覆盖卡牌当前养成情况）</span>
            </div>
            <div class="collapse-content">
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>稀有度</th>
                      <th class="text-center">禁用</th>
                      <th class="text-center">满级</th>
                      <th class="text-center">前后篇</th>
                      <th class="text-center">满突破</th>
                      <th class="text-center">满技能</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="rarity in rarityList" :key="rarity.type">
                      <td class="font-medium">{{ rarity.name }}</td>
                      <template v-if="cardConfig[rarity.type]">
                        <td class="text-center"><input v-model="cardConfig[rarity.type]!.disable" type="checkbox" class="checkbox checkbox-sm" /></td>
                        <td class="text-center"><input v-model="cardConfig[rarity.type]!.rankMax" type="checkbox" class="checkbox checkbox-sm" /></td>
                        <td class="text-center"><input v-model="cardConfig[rarity.type]!.episodeRead" type="checkbox" class="checkbox checkbox-sm" /></td>
                        <td class="text-center"><input v-model="cardConfig[rarity.type]!.masterMax" type="checkbox" class="checkbox checkbox-sm" /></td>
                        <td class="text-center"><input v-model="cardConfig[rarity.type]!.skillMax" type="checkbox" class="checkbox checkbox-sm" /></td>
                      </template>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 计算 -->
          <button class="btn btn-primary w-full max-w-md h-14 text-lg" @click="handleCalculate">
            <Loader2 v-if="calculating" class="w-5 h-5 animate-spin" />
            <Play v-else class="w-5 h-5" />
            {{ calculating ? '取消（计算中...可能要等30秒）' : '刷新数据并自动组卡！' }}
          </button>
        </div>
      </div>

      <!-- 错误 -->
      <div v-if="errorMsg" class="alert alert-error shadow-sm">
        <AlertTriangle class="w-5 h-5 shrink-0" />
        <div>
          <h3 class="font-bold">无法推荐卡组</h3>
          <p class="text-sm">{{ errorMsg }}</p>
        </div>
      </div>

      <!-- 计算完成 -->
      <div v-if="recommend" class="alert alert-success shadow-sm">
        <Info class="w-5 h-5 shrink-0" />
        <div>
          <h3 class="font-bold">计算完成</h3>
          <p v-if="mode === '1' && selectedCharacter && challengeHighScore > 0" class="text-sm">
            <strong>{{ getCharacterName(selectedCharacter) }}</strong> 当前最高分：<strong>{{ challengeHighScore }}</strong>
          </p>
          <p class="text-sm">计算耗时：<strong>{{ calcDuration.toFixed(0) }} 毫秒</strong></p>
        </div>
      </div>

      <!-- 结果 -->
      <div v-if="recommend && recommend.length > 0" class="card bg-base-100 shadow-lg overflow-x-auto">
        <div class="card-body p-4">
          <table class="table table-sm">
            <thead>
              <tr>
                <th class="text-center">排名</th>
                <th class="text-center">分数</th>
                <th class="text-center">对应卡组</th>
                <th v-if="recommend?.[0]?.eventBonus !== undefined" class="text-center">活动加成</th>
                <th class="text-center">综合力</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(deck, i) in recommend" :key="i" class="hover">
                <td class="text-center font-bold text-lg">{{ i + 1 }}</td>
                <td class="text-center text-lg">{{ deck.score }}</td>
                <td>
                  <div class="flex gap-1 justify-center">
                    <div v-for="dc in deck.cards" :key="dc.cardId" class="w-16 sm:w-20">
                      <RouterLink
                        v-if="getCardForResult(dc.cardId)"
                        :to="`/cards/${dc.cardId}`"
                        class="block hover:scale-105 transition-transform"
                      >
                        <SekaiCard
                          :card="getCardForResult(dc.cardId)!"
                          :trained="!isNormalCard(getCardForResult(dc.cardId)!.cardRarityType)"
                          :deck-card="dc"
                        />
                      </RouterLink>
                      <div v-else class="text-xs text-center opacity-60">{{ dc.cardId }}</div>
                    </div>
                  </div>
                </td>
                <td v-if="deck.eventBonus !== undefined" class="text-center text-lg">
                  {{ deck.eventBonus }}{{ deck.supportDeckBonus ? `+${deck.supportDeckBonus.toFixed(2)}` : '' }}
                </td>
                <td class="text-center text-lg" :title="`面板${deck.power.base}+区域${deck.power.areaItemBonus}+角色${deck.power.characterBonus}+称号${deck.power.honorBonus}+家具${deck.power.fixtureBonus}+大门${deck.power.gateBonus}`">
                  {{ deck.power.total }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="recommend && recommend.length === 0" class="text-center py-10 opacity-60">
        没有找到符合条件的卡组
      </div>
    </template>
  </div>
</template>
