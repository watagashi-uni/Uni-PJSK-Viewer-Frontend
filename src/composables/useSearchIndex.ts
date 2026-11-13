import { reactive, shallowReactive, toRaw, watch } from 'vue'
import { masterApiBaseUrl } from '@/api/masterClient'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { useTranslationStore } from '@/stores/translations'
import { cardImageVariant } from '@/utils/card'
import { getEventBannerUrl, getEventLogoUrl } from '@/utils/event'
import { joinSearchText, type SearchEntry } from '@/utils/globalSearch'
import { toRomaji } from '@/utils/kanaToRomaji'
import type { SlimRequest, SlimResponse } from '@/workers/masterSlim.worker'

/**
 * 全站搜索的索引。只在打开搜索面板后才加载数据，并尽量不占主线程：
 * - 第一批（打开面板时）：角色、歌曲、活动，体积小；
 * - 第二批（开始输入时）：卡片、卡池、虚拟 Live，体积大；
 * - 解压后几十 MB 的表在 Worker 里下载、解析，主线程只收到用得上的几个字段；
 * - 生成条目时每几毫秒让出一次主线程，输入和滚动不会卡。
 */

export type SearchSource = 'character' | 'music' | 'event' | 'card' | 'gacha' | 'vlive'
export type SourceState = 'idle' | 'loading' | 'ready' | 'error'

type Row = Record<string, any>
type EventAssetRow = { eventType: string; assetbundleName: string }

const SOURCES: readonly SearchSource[] = ['character', 'music', 'event', 'card', 'gacha', 'vlive']
const TIER_ONE: readonly SearchSource[] = ['character', 'music', 'event']
const TIER_TWO: readonly SearchSource[] = ['card', 'gacha', 'vlive']
const SLICE_MS = 6
const ZH_WAIT_MS = 6000
const ALWAYS_HIDDEN = Number.MAX_SAFE_INTEGER

const entries = shallowReactive<Record<SearchSource, SearchEntry[]>>({
  character: [], music: [], event: [], card: [], gacha: [], vlive: [],
})
const states = reactive<Record<SearchSource, SourceState>>({
  character: 'idle', music: 'idle', event: 'idle', card: 'idle', gacha: 'idle', vlive: 'idle',
})
/** 条目里包含译名，master 版本或译名设置变了就要重建 */
let builtSignature = ''

const UNIT_NAMES: Record<string, string> = {
  light_sound: 'Leo/need',
  idol: 'MORE MORE JUMP!',
  street: 'Vivid BAD SQUAD',
  theme_park: 'ワンダーランズ×ショウタイム',
  school_refusal: '25時、ナイトコードで。',
  piapro: 'VIRTUAL SINGER',
}
const EVENT_TYPE_NAMES: Record<string, string> = {
  marathon: '马拉松',
  cheerful_carnival: '5v5',
  world_bloom: 'World Link',
}
const RARITY_NAMES: Record<string, string> = {
  rarity_1: '★1',
  rarity_2: '★2',
  rarity_3: '★3',
  rarity_4: '★4',
  rarity_birthday: '生日',
}

// ---------------------------------------------------------------- 让出主线程

function idle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => resolve(), { timeout: 200 })
    else setTimeout(resolve, 16)
  })
}

async function mapInSlices<T>(rows: readonly T[], map: (row: T) => SearchEntry | null): Promise<SearchEntry[]> {
  const out: SearchEntry[] = []
  let sliceEnd = performance.now() + SLICE_MS
  for (let i = 0; i < rows.length; i++) {
    const entry = map(rows[i] as T)
    if (entry) out.push(entry)
    if ((i & 15) === 15 && performance.now() >= sliceEnd) {
      await idle()
      sliceEnd = performance.now() + SLICE_MS
    }
  }
  return out
}

// ---------------------------------------------------------------- 读取 master

let worker: Worker | null = null
let requestSeq = 0
const waiting = new Map<number, { resolve: (rows: Row[]) => void; reject: (error: Error) => void }>()

function failWaiting(message: string): void {
  for (const request of waiting.values()) request.reject(new Error(message))
  waiting.clear()
}

function slimInWorker(name: string, url: string, fields: string[]): Promise<Row[]> {
  if (!worker) {
    worker = new Worker(new URL('../workers/masterSlim.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<SlimResponse>) => {
      const request = waiting.get(event.data.id)
      if (!request) return
      waiting.delete(event.data.id)
      if (event.data.rows) request.resolve(event.data.rows)
      else request.reject(new Error(event.data.error || 'worker error'))
      // 完整数据还留在 Worker 的内存里，用完就结束它
      if (waiting.size === 0) {
        worker?.terminate()
        worker = null
      }
    }
    worker.onerror = () => {
      failWaiting('worker failed')
      worker?.terminate()
      worker = null
    }
  }
  const id = ++requestSeq
  return new Promise<Row[]>((resolve, reject) => {
    waiting.set(id, { resolve, reject })
    worker!.postMessage({ id, name, url, fields } satisfies SlimRequest)
  })
}

/**
 * 读一张 master 表。已经在内存里的直接用；heavy 的表交给 Worker，
 * 只拿回 fields 里的字段；其余的小表走 masterStore（顺便进它的缓存）。
 */
async function loadRows(name: string, fields: string[], heavy: boolean): Promise<Row[]> {
  const masterStore = useMasterStore()
  const inMemory = toRaw(masterStore.cache)[name]
  if (inMemory) return toRaw(inMemory)
  if (heavy && typeof Worker === 'function') {
    try {
      await masterStore.initialize()
      const version = masterStore.version
      if (version) {
        const url = `${masterApiBaseUrl}/api/master/${encodeURIComponent(version)}/${encodeURIComponent(name)}`
        return await slimInWorker(name, url, fields)
      }
    } catch (error) {
      console.warn(`搜索索引：Worker 读取 ${name} 失败，改在主线程读取`, error)
    }
  }
  return toRaw(await masterStore.getMaster<Row>(name))
}

// ---------------------------------------------------------------- 译名

/** 等一张表的译名下载完；关闭译名显示或超时都直接继续（只是搜不到中文名） */
function zhReady(table: string): Promise<void> {
  const settings = useSettingsStore()
  const store = useTranslationStore()
  if (settings.translationMode === 'off') return Promise.resolve()
  store.ensure(table)
  if (store.isLoaded(table)) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer)
      stop()
      resolve()
    }
    const timer = setTimeout(done, ZH_WAIT_MS)
    const stop = watch(() => store.isLoaded(table), (loaded) => { if (loaded) done() })
  })
}

function zhOf(table: string, path: string, jp: string | null | undefined): string {
  const settings = useSettingsStore()
  if (settings.translationMode === 'off') return ''
  return useTranslationStore().lookup(table, path, jp)?.text ?? ''
}

/** 按显示设置决定哪个是主标题：中文优先时译名在上 */
function titlePair(jp: string, zh: string): { title: string; sub: string } {
  if (zh && useSettingsStore().translationMode === 'zh-first') return { title: zh, sub: jp }
  return { title: jp, sub: zh }
}

function formatDate(timestamp: number): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

function characterNames(row: Row): { jp: string; zh: string } {
  const jp = `${row.firstName || ''}${row.givenName || ''}`
  const part = (path: string, value?: string) => (value ? zhOf('gameCharacters', path, value) || value : '')
  const zh = `${part('firstName', row.firstName)}${part('givenName', row.givenName)}`
  return { jp, zh: zh === jp ? '' : zh }
}

// ---------------------------------------------------------------- 各类条目

async function buildCharacters(): Promise<SearchEntry[]> {
  const [rows] = await Promise.all([loadRows('gameCharacters', [], false), zhReady('gameCharacters')])
  return rows.map((row) => {
    const { jp, zh } = characterNames(row)
    const english = [row.firstNameEnglish, row.givenNameEnglish].filter(Boolean).join(' ')
    const unit = UNIT_NAMES[row.unit] ?? ''
    return {
      kind: 'character',
      id: String(row.id),
      ...titlePair(jp, zh),
      meta: unit,
      path: `/characters/${row.id}`,
      image: `/img/chr_ts/chr_ts_${row.id}.png`,
      keys: joinSearchText([jp, zh, english, row.givenName, row.firstName]),
      hay: joinSearchText([jp, zh, english, unit]),
      order: 1000 - Number(row.id),
      hiddenUntil: 0,
      num: -1,
    } satisfies SearchEntry
  })
}

async function buildMusics(): Promise<SearchEntry[]> {
  const [rows, limited] = await Promise.all([
    loadRows('musics', [], false),
    loadRows('limitedTimeMusics', [], false),
    zhReady('musics'),
  ])
  const now = Date.now()
  const limitedById = new Map<number, Row>()
  for (const row of limited) limitedById.set(row.musicId, row)

  return mapInSlices(rows, (row) => {
    const zh = zhOf('musics', 'title', row.title)
    const period = limitedById.get(row.id)
    // 限时歌曲：开始前和结束后都按未公开内容处理，与歌曲列表一致
    let hiddenUntil = Number(row.publishedAt) || 0
    if (period) hiddenUntil = now >= period.endAt ? ALWAYS_HIDDEN : Math.max(hiddenUntil, period.startAt)
    const reading = row.pronunciation || ''
    return {
      kind: 'music',
      id: String(row.id),
      ...titlePair(row.title, zh),
      meta: row.composer && row.composer !== '-' ? row.composer : '',
      path: `/musics/${row.id}`,
      image: `startapp/thumbnail/music_jacket/jacket_s_${String(row.id).padStart(3, '0')}.png`,
      keys: joinSearchText([row.title, zh, reading, toRomaji(reading)]),
      hay: joinSearchText([row.title, zh, reading, toRomaji(reading), row.composer, row.lyricist, row.arranger]),
      order: Number(row.publishedAt) || 0,
      hiddenUntil,
      num: Number(row.id),
    } satisfies SearchEntry
  })
}

async function buildEvents(): Promise<SearchEntry[]> {
  const [rows] = await Promise.all([
    loadRows('events', ['id', 'name', 'eventType', 'assetbundleName', 'startAt'], true),
    zhReady('events'),
  ])
  return mapInSlices(rows, (row) => {
    const zh = zhOf('events', 'name', row.name)
    const type = EVENT_TYPE_NAMES[row.eventType] ?? ''
    return {
      kind: 'event',
      id: String(row.id),
      ...titlePair(row.name, zh),
      meta: [type, formatDate(row.startAt)].filter(Boolean).join(' '),
      path: `/events/${row.id}`,
      // 没有横幅的活动（测试活动）用 logo
      image: (getEventBannerUrl(row as EventAssetRow, '') || getEventLogoUrl(row as EventAssetRow, '')).replace(/^\//, ''),
      keys: joinSearchText([row.name, zh]),
      hay: joinSearchText([row.name, zh, type]),
      order: Number(row.startAt) || 0,
      hiddenUntil: Number(row.startAt) || 0,
      num: Number(row.id),
    } satisfies SearchEntry
  })
}

async function buildCards(): Promise<SearchEntry[]> {
  const [rows, characters] = await Promise.all([
    loadRows('cards', ['id', 'prefix', 'characterId', 'cardRarityType', 'assetbundleName', 'releaseAt', 'initialSpecialTrainingStatus'], true),
    loadRows('gameCharacters', [], false),
    zhReady('cards'),
    zhReady('gameCharacters'),
  ])
  const names = new Map<number, { jp: string; zh: string }>()
  for (const character of characters) names.set(character.id, characterNames(character))

  return mapInSlices(rows, (row) => {
    const zh = zhOf('cards', 'prefix', row.prefix)
    const owner = names.get(row.characterId)
    const rarity = RARITY_NAMES[row.cardRarityType] ?? ''
    const ownerName = owner ? (useSettingsStore().translationMode === 'off' ? owner.jp : owner.zh || owner.jp) : ''
    return {
      kind: 'card',
      id: String(row.id),
      ...titlePair(row.prefix, zh),
      meta: [rarity, ownerName].filter(Boolean).join(' '),
      path: `/cards/${row.id}`,
      image: `startapp/thumbnail/chara/${row.assetbundleName}_${cardImageVariant(row, false)}.png`,
      keys: joinSearchText([row.prefix, zh]),
      hay: joinSearchText([row.prefix, zh, owner?.jp, owner?.zh, rarity]),
      order: Number(row.releaseAt) || 0,
      hiddenUntil: Number(row.releaseAt) || 0,
      num: Number(row.id),
    } satisfies SearchEntry
  })
}

async function buildGachas(): Promise<SearchEntry[]> {
  const [rows] = await Promise.all([
    loadRows('gachas', ['id', 'name', 'assetbundleName', 'startAt'], true),
    zhReady('gachas'),
  ])
  return mapInSlices(rows, (row) => {
    const zh = zhOf('gachas', 'name', row.name)
    return {
      kind: 'gacha',
      id: String(row.id),
      ...titlePair(row.name, zh),
      meta: formatDate(row.startAt),
      path: `/gachas/${row.id}`,
      image: `ondemand/gacha/${row.assetbundleName}/logo/logo.png`,
      keys: joinSearchText([row.name, zh]),
      hay: joinSearchText([row.name, zh]),
      order: Number(row.startAt) || 0,
      hiddenUntil: Number(row.startAt) || 0,
      num: Number(row.id),
    } satisfies SearchEntry
  })
}

async function buildVirtualLives(): Promise<SearchEntry[]> {
  const [rows] = await Promise.all([
    loadRows('virtualLives', ['id', 'name', 'virtualLiveType', 'assetbundleName', 'startAt'], true),
    zhReady('virtualLives'),
  ])
  return mapInSlices(rows, (row) => {
    // 迎新 Live 不在列表里展示
    if (row.virtualLiveType === 'beginner') return null
    const zh = zhOf('virtualLives', 'name', row.name)
    return {
      kind: 'vlive',
      id: String(row.id),
      ...titlePair(row.name, zh),
      meta: formatDate(row.startAt),
      path: `/vlives/${row.id}`,
      image: `ondemand/virtual_live/select/banner/${row.assetbundleName}/${row.assetbundleName}.png`,
      keys: joinSearchText([row.name, zh]),
      hay: joinSearchText([row.name, zh]),
      order: Number(row.startAt) || 0,
      hiddenUntil: Number(row.startAt) || 0,
      num: Number(row.id),
    } satisfies SearchEntry
  })
}

const BUILDERS: Record<SearchSource, () => Promise<SearchEntry[]>> = {
  character: buildCharacters,
  music: buildMusics,
  event: buildEvents,
  card: buildCards,
  gacha: buildGachas,
  vlive: buildVirtualLives,
}

// ---------------------------------------------------------------- 对外接口

function currentSignature(): string {
  const settings = useSettingsStore()
  return `${useMasterStore().cacheRevision}:${settings.translationMode}:${settings.hideAiTranslation}`
}

function resetIfStale(): void {
  const signature = currentSignature()
  if (signature === builtSignature) return
  builtSignature = signature
  for (const source of SOURCES) {
    entries[source] = []
    states[source] = 'idle'
  }
}

function load(source: SearchSource): void {
  if (states[source] === 'loading' || states[source] === 'ready') return
  const signature = builtSignature
  states[source] = 'loading'
  void BUILDERS[source]()
    .then((built) => {
      // 加载期间 master 版本或译名设置变了，这份结果作废
      if (signature !== builtSignature) return
      entries[source] = built
      states[source] = 'ready'
    })
    .catch((error) => {
      if (signature !== builtSignature) return
      console.error(`搜索索引：${source} 加载失败`, error)
      states[source] = 'error'
    })
}

export function useSearchIndex() {
  /** 打开面板时调用：加载体积小的几类 */
  function ensureBasics(): void {
    resetIfStale()
    for (const source of TIER_ONE) load(source)
  }
  /** 开始输入时调用：加载全部 */
  function ensureAll(): void {
    resetIfStale()
    for (const source of TIER_ONE) load(source)
    for (const source of TIER_TWO) load(source)
  }
  function retry(source: SearchSource): void {
    if (states[source] === 'error') states[source] = 'idle'
    load(source)
  }

  return { entries, states, ensureBasics, ensureAll, retry }
}
