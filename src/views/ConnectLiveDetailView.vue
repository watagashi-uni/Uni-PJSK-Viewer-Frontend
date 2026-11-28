<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AudioLines, Calendar, ChevronLeft, Clock, EyeOff, ListPlus, ListVideo, Loader2, Pause, Play, Radio, ScrollText } from 'lucide-vue-next'
import AssetImage from '@/components/AssetImage.vue'
import PageHeader from '@/components/PageHeader.vue'
import ZhText from '@/components/ZhText.vue'
import SingerAvatars from '@/components/player/SingerAvatars.vue'
import { useMasterStore } from '@/stores/master'
import { useSettingsStore } from '@/stores/settings'
import { usePlayerStore } from '@/stores/player'
import { useZh } from '@/composables/useZh'
import { useBackToList } from '@/composables/useBackToList'
import { useSingerAvatars } from '@/composables/useSingerAvatars'
import { useSpoilerWatermark } from '@/composables/useSpoilerWatermark'
import { displayImageUrl } from '@/utils/derivedAssets'
import { loadTrackSources, trackCoverPath, type PlayerTrackInfo, type TrackSources } from '@/utils/playerTracks'
import {
  bannerPath, connectLiveTrack, loadConnectLiveIndex, playerSingers,
  type ConnectLiveEntry, type ConnectLiveSinger, type ConnectLiveTrack, type LiveInfo,
} from '@/api/connectLive'

interface StreamingLive extends LiveInfo {
  virtualLiveType: string
  startAt: number
  endAt: number
  virtualLiveSchedules?: { id: number; seq: number; startAt: number; endAt: number; isAfterEvent?: boolean }[]
}

const route = useRoute()
const goBack = useBackToList('/connect-live')
const master = useMasterStore()
const settings = useSettingsStore()
const player = usePlayerStore()
const zhVirtualLives = useZh('virtualLives')
const { trackAvatars } = useSingerAvatars()

const live = ref<StreamingLive | null>(null)
const entry = ref<ConnectLiveEntry | null>(null)
const sources = ref<TrackSources | null>(null)
const loading = ref(true)
const error = ref('')
const showIndex = ref(0)

/** Before the live opens its setlist and recordings are a spoiler: shown only with spoilers on, and marked. */
const unreleased = computed(() => !!live.value && live.value.startAt > Date.now())
const hidden = computed(() => unreleased.value && !settings.showSpoilers)
useSpoilerWatermark(() => unreleased.value && settings.showSpoilers)

async function load(id: number) {
  loading.value = true
  error.value = ''
  live.value = null
  entry.value = null
  showIndex.value = 0
  try {
    const [rows, index, trackSources] = await Promise.all([
      master.getMaster<StreamingLive>('virtualLives'),
      loadConnectLiveIndex(),
      loadTrackSources(name => master.getMaster(name)),
    ])
    live.value = rows.find(row => row.id === id && row.virtualLiveType === 'streaming') ?? null
    entry.value = index.lives[String(id)] ?? null
    sources.value = trackSources
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
watch(() => Number(route.params.id), id => { void load(id) }, { immediate: true })

const shows = computed(() => entry.value?.shows ?? [])
const show = computed(() => shows.value[showIndex.value] ?? shows.value[0] ?? null)
const extras = computed(() => entry.value?.extras ?? [])

const schedules = computed(() => (live.value?.virtualLiveSchedules || []).filter(s => !s.isAfterEvent).sort((a, b) => a.startAt - b.startAt))
const totalDuration = computed(() => (show.value?.tracks || []).reduce((sum, t) => sum + (t.duration || 0), 0))

function playerTrack(track: ConnectLiveTrack, label: string): PlayerTrackInfo | null {
  if (!live.value || !sources.value || hidden.value) return null
  return connectLiveTrack(track, live.value, label, sources.value)
}

function showTracks(): PlayerTrackInfo[] {
  return (show.value?.tracks || []).map(t => playerTrack(t, show.value?.label || '')).filter((t): t is PlayerTrackInfo => !!t)
}

function playAll() {
  player.playTracks(showTracks(), 0)
}

function enqueueAll() {
  player.enqueue(showTracks())
}

function playFrom(list: ConnectLiveTrack[], position: number, label: string) {
  const target = list[position]
  if (!target) return
  if (player.isCurrentLive(target.bundle)) {
    player.toggle()
    return
  }
  const tracks = list.map(t => playerTrack(t, label)).filter((t): t is PlayerTrackInfo => !!t)
  player.playTracks(tracks, position)
}

function enqueue(track: ConnectLiveTrack, label: string) {
  const info = playerTrack(track, label)
  if (info) player.enqueue([info])
}

function coverOf(track: ConnectLiveTrack, label: string): string {
  const info = playerTrack(track, label)
  return info ? displayImageUrl(`${settings.assetsHost}${trackCoverPath(info)}`) : ''
}

function avatarsOf(singers: ConnectLiveSinger[] | undefined) {
  return sources.value && singers ? trackAvatars(playerSingers(singers, sources.value)) : []
}

function singerNames(singers: ConnectLiveSinger[] | undefined): string {
  return avatarsOf(singers).map(s => s.name).filter(Boolean).join('・')
}

function formatTime(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds)) return ''
  const s = Math.round(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatTotal(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  return minutes >= 60 ? `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分` : `${minutes} 分钟`
}
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5">
    <div v-if="loading" class="space-y-4"><div class="skeleton h-20 rounded-xl"></div><div class="skeleton h-56 rounded-xl"></div><div class="skeleton h-96 rounded-xl"></div></div>
    <div v-else-if="error" class="alert alert-error">Connect Live 加载失败：{{ error }}</div>
    <div v-else-if="!live || !entry" class="rounded-xl border border-base-200 bg-base-100 py-20 text-center">
      <p class="text-xl text-base-content/60">没有这场 Connect Live 的曲目</p>
      <RouterLink to="/connect-live" class="btn btn-primary mt-4">返回列表</RouterLink>
    </div>

    <div v-else-if="hidden" class="rounded-xl border border-base-200 bg-base-100 px-4 py-20 text-center">
      <EyeOff class="mx-auto h-8 w-8 text-base-content/40" />
      <p class="mt-3 text-lg text-base-content/60">这场 Connect Live 还没开场，曲目和音源已隐藏</p>
      <p class="mt-1 text-sm text-base-content/45">可在<RouterLink to="/settings" class="link">设置</RouterLink>中开启剧透显示。</p>
      <RouterLink to="/connect-live" class="btn btn-primary btn-sm mt-4">返回列表</RouterLink>
    </div>

    <template v-else>
      <PageHeader :title="zhVirtualLives.label('name', live.name)" :description="`#${live.id} · Connect Live`">
        <template #icon><AudioLines class="h-8 w-8 text-primary" /></template>
        <template #actions><button type="button" class="btn btn-sm btn-ghost" @click="goBack"><ChevronLeft class="h-4 w-4" />返回列表</button></template>
      </PageHeader>

      <p v-if="unreleased" class="cl-spoiler-note" role="note">
        <EyeOff class="h-4 w-4 shrink-0" />
        <span><span class="badge badge-warning badge-sm mr-1.5 align-middle">剧透</span>这场 Connect Live 还没开场，以下曲目和音源来自提前放出的游戏数据，请勿转载或截图外传。</span>
      </p>

      <section class="grid grid-cols-1 overflow-hidden rounded-xl border border-base-300 bg-base-100 md:grid-cols-[minmax(0,1.35fr)_minmax(17rem,.75fr)]">
        <figure class="flex aspect-[33/10] items-center justify-center bg-base-200/70 p-3 md:aspect-auto">
          <AssetImage :src="`${settings.assetsHost}${bannerPath(live.assetbundleName)}`" :alt="live.name" class="h-full max-h-64 w-full object-contain" />
        </figure>
        <div class="flex flex-col justify-center gap-3 p-4 md:border-l md:border-base-200 md:p-5">
          <ul v-if="schedules.length" class="space-y-1.5 text-sm">
            <li v-for="(s, i) in schedules" :key="s.id" class="flex items-center gap-2">
              <Calendar class="h-4 w-4 shrink-0 text-primary" />
              <span class="text-base-content/50">第{{ i + 1 }}公演</span>
              <strong class="ml-auto text-right tabular-nums">{{ formatDate(s.startAt) }}</strong>
            </li>
          </ul>
          <div class="grid grid-cols-2 divide-x divide-base-200 rounded-lg bg-base-200/55 py-2 text-center">
            <div><strong class="block text-lg">{{ show?.tracks.length || 0 }}</strong><span class="text-[10px] text-base-content/45">曲目</span></div>
            <div><strong class="block text-lg">{{ formatTotal(totalDuration) }}</strong><span class="text-[10px] text-base-content/45">音源时长</span></div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn btn-primary btn-sm gap-1.5" :disabled="!show?.tracks.length" @click="playAll"><Play class="h-4 w-4" fill="currentColor" />播放全部</button>
            <button type="button" class="btn btn-ghost btn-sm gap-1.5" :disabled="!show?.tracks.length" @click="enqueueAll"><ListPlus class="h-4 w-4" />全部加入队列</button>
            <RouterLink :to="`/vlives/${live.id}`" class="btn btn-ghost btn-sm gap-1.5"><Radio class="h-4 w-4" />虚拟 Live 详情</RouterLink>
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-base-300 bg-base-100 p-3 md:p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 class="flex items-center gap-2 text-lg font-bold"><ListVideo class="h-5 w-5 text-primary" />曲目</h2>
          <div v-if="shows.length > 1" role="tablist" class="tabs tabs-box tabs-sm">
            <button
              v-for="(s, i) in shows"
              :key="s.label"
              role="tab"
              type="button"
              class="tab"
              :class="{ 'tab-active': showIndex === i }"
              :aria-selected="showIndex === i"
              @click="showIndex = i"
            >
              {{ s.label }}
            </button>
          </div>
        </div>
        <p v-if="shows.length > 1" class="mb-2 px-1 text-xs text-base-content/50">各场公演的曲目或演唱者有差异，可切换查看。</p>

        <ol v-if="show" class="cl-list">
          <li v-for="(t, i) in show.tracks" :key="t.bundle" class="cl-row" :class="{ current: player.isCurrentLive(t.bundle) }">
            <button type="button" class="cl-art" :aria-label="player.isCurrentLive(t.bundle) && player.isPlaying ? `暂停「${t.title}」` : `播放「${t.title}」`" @click="playFrom(show.tracks, i, show.label)">
              <img :src="coverOf(t, show.label)" alt="" loading="lazy" crossorigin="anonymous" />
              <span class="cl-art-overlay">
                <Loader2 v-if="player.isCurrentLive(t.bundle) && player.isPlaying && player.isBuffering" class="h-5 w-5 animate-spin" />
                <Pause v-else-if="player.isCurrentLive(t.bundle) && player.isPlaying" class="h-5 w-5" fill="currentColor" />
                <Play v-else class="ml-0.5 h-5 w-5" fill="currentColor" />
              </span>
            </button>
            <div class="min-w-0 flex-1">
              <div class="flex min-w-0 items-baseline gap-2">
                <span class="cl-no">{{ String(i + 1).padStart(2, '0') }}</span>
                <h3 class="min-w-0 truncate font-bold">
                  <RouterLink v-if="t.musicId" :to="`/musics/${t.musicId}`" class="hover:text-primary"><ZhText :text="t.title" table="musics" path="title" layout="inline" /></RouterLink>
                  <template v-else>{{ t.parts ? t.title.replace(/[（(].+[）)]\s*$/, '') : t.title }}</template>
                </h3>
                <span v-if="t.lyrics" class="shrink-0 self-center text-base-content/35" title="有滚动歌词" aria-label="有滚动歌词"><ScrollText class="h-3.5 w-3.5" /></span>
              </div>
              <ol v-if="t.parts" class="cl-parts">
                <li v-for="(p, n) in t.parts" :key="n">
                  <RouterLink v-if="p.musicId" :to="`/musics/${p.musicId}`" class="font-medium hover:text-primary"><ZhText :text="p.title" table="musics" path="title" layout="inline" /></RouterLink>
                  <span v-else class="font-medium">{{ p.title }}</span>
                  <span v-if="p.singers?.length" class="text-base-content/50"> · {{ singerNames(p.singers) }}</span>
                </li>
              </ol>
              <div class="mt-1 flex min-w-0 items-center gap-2">
                <SingerAvatars :singers="avatarsOf(t.singers)" :size="20" :max="10" />
                <span class="min-w-0 truncate text-xs text-base-content/55">{{ singerNames(t.singers) }}</span>
              </div>
            </div>
            <span class="cl-time"><Clock class="h-3 w-3 opacity-60" />{{ formatTime(t.duration) }}</span>
            <button type="button" class="btn btn-ghost btn-sm btn-square" :title="`把「${t.title}」加入播放队列`" :aria-label="`把「${t.title}」加入播放队列`" @click="enqueue(t, show.label)"><ListPlus class="h-4 w-4" /></button>
          </li>
        </ol>
      </section>

      <section v-if="extras.length" class="rounded-xl border border-base-300 bg-base-100 p-3 md:p-4">
        <h2 class="mb-1 px-1 text-lg font-bold">其他音源</h2>
        <p class="mb-2 px-1 text-xs text-base-content/50">游戏数据中有、但没有出现在公演曲目里的音源。</p>
        <ol class="cl-list">
          <li v-for="(t, i) in extras" :key="t.bundle" class="cl-row" :class="{ current: player.isCurrentLive(t.bundle) }">
            <button type="button" class="cl-art" :aria-label="`播放「${t.title}」`" @click="playFrom(extras, i, '其他音源')">
              <img :src="coverOf(t, '其他音源')" alt="" loading="lazy" crossorigin="anonymous" />
              <span class="cl-art-overlay"><Pause v-if="player.isCurrentLive(t.bundle) && player.isPlaying" class="h-5 w-5" fill="currentColor" /><Play v-else class="ml-0.5 h-5 w-5" fill="currentColor" /></span>
            </button>
            <div class="min-w-0 flex-1">
              <h3 class="truncate font-bold">{{ t.title }}</h3>
              <p class="truncate text-xs text-base-content/55">{{ singerNames(t.singers) }}<template v-if="t.note"> · {{ t.note }}</template></p>
            </div>
            <span class="cl-time">{{ formatTime(t.duration) }}</span>
            <button type="button" class="btn btn-ghost btn-sm btn-square" :aria-label="`把「${t.title}」加入播放队列`" @click="enqueue(t, '其他音源')"><ListPlus class="h-4 w-4" /></button>
          </li>
        </ol>
      </section>

      <p class="px-1 text-xs leading-5 text-base-content/45">
        音源取自游戏内 Connect Live 的演出数据。滚动歌词由游戏版时间轴按音频对齐到演出录音，完整版段落参考已收录的平台逐字歌词；对不上的段落不显示歌词。
      </p>
    </template>
  </div>
</template>

<style scoped>
.cl-spoiler-note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid color-mix(in oklab, var(--color-warning) 45%, var(--color-base-300));
  border-radius: var(--radius-field);
  background-color: color-mix(in oklab, var(--color-warning) 12%, var(--color-base-100));
  font-size: 0.8125rem;
  line-height: 1.5;
}

.cl-spoiler-note svg {
  margin-top: 0.15rem;
}

.cl-list {
  display: flex;
  flex-direction: column;
}

.cl-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.5rem;
  border-radius: 0.75rem;
  transition: background-color 0.15s;
}

.cl-row:hover {
  background: color-mix(in srgb, var(--color-base-content) 5%, transparent);
}

.cl-row.current {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.cl-art {
  position: relative;
  width: 3.5rem;
  height: 3.5rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.6rem;
  background: var(--color-base-200);
  cursor: pointer;
}

.cl-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cl-art-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 0.38);
  color: #fff;
  opacity: 0;
  transition: opacity 0.15s;
}

.cl-art:hover .cl-art-overlay,
.cl-art:focus-visible .cl-art-overlay,
.cl-row.current .cl-art-overlay {
  opacity: 1;
}

.cl-no {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--color-base-content) 40%, transparent);
}


.cl-parts {
  margin-top: 0.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  font-size: 0.75rem;
  counter-reset: part;
}

.cl-parts li {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cl-parts li::before {
  counter-increment: part;
  content: counter(part) '. ';
  color: color-mix(in srgb, var(--color-base-content) 40%, transparent);
}

.cl-time {
  display: none;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--color-base-content) 55%, transparent);
}

@media (min-width: 640px) {
  .cl-time {
    display: inline-flex;
  }
}
</style>
