<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import {
  Captions, Loader2, Maximize, Minimize, Pause, Play, RotateCw, SkipBack, SkipForward, Volume2, VolumeX, X,
} from 'lucide-vue-next'
import { useMusicVideos } from '@/composables/useMusicVideos'
import { useVocalLyrics } from '@/composables/useVocalLyrics'
import { SUBTITLE_EXTRAS, SUBTITLE_MODES, SUBTITLE_SIZES, useMvSettings } from '@/composables/useMvSettings'
import { usePlayerStore } from '@/stores/player'
import { trackEvent } from '@/utils/analytics'
import { MUSIC_VIDEO_LABEL, musicVideoUrl, type MusicVideoKind, type SubtitleExtra } from '@/utils/musicVideos'
import type { PlayerTrackInfo } from '@/utils/playerTracks'
import KtvBackdrop from '@/components/player/KtvBackdrop.vue'
import MvSubtitles from '@/components/player/MvSubtitles.vue'
import PlayerScrubber from '@/components/player/PlayerScrubber.vue'
import ZhText from '@/components/ZhText.vue'

/**
 * The 2D MV of a song rendition, as a block in the page, with the lyrics as subtitles. The video
 * is silent: it follows the site player's audio, which keeps the clock. It can go full screen.
 */
const props = withDefaults(defineProps<{
  track: PlayerTrackInfo | null
  /** The site player is on this rendition: the video follows it. Otherwise it waits to be started. */
  active: boolean
  /** Play button and scrubber under the picture; off where the page around it already has them. */
  transport?: boolean
  /** Offer a button that asks the page to put the player away. */
  closable?: boolean
}>(), { transport: true, closable: false })

const emit = defineEmits<{
  /** Start this rendition in the site player. */
  activate: []
  close: []
}>()

const player = usePlayerStore()
const { sourcesFor } = useMusicVideos()
const { settings, chosenKind } = useMvSettings()

/** Video lagging or running ahead by more than this jumps to the audio; less is evened out by speed. */
const HARD_SYNC_SEC = 0.25
/** A jump lands this far ahead, since the video takes a moment to get going again. */
const SEEK_LEAD_SEC = 0.08
/** No second jump this soon after one: a video still buffering would otherwise keep jumping. */
const SEEK_COOLDOWN_MS = 800
/** Furthest the speed is bent to catch up. */
const NUDGE_LIMIT = 0.06
const HIDE_CHROME_MS = 2800
const SKIP_SEC = 5
/** Shape of the shipped videos (576×328), until the video says otherwise. */
const DEFAULT_RATIO = 576 / 328
/** Narrower than this, the subtitles go in a band under the picture rather than over it. */
const NARROW_PX = 560
/** Room under the picture (full screen) worth moving the subtitles into. */
const BELOW_MIN_PX = 100

const root = ref<HTMLElement>()
const stage = ref<HTMLElement>()
const frame = ref<HTMLElement>()
const topBar = ref<HTMLElement>()
const bar = ref<HTMLElement>()
const video = ref<HTMLVideoElement>()

const cover = computed(() => (props.track ? player.coverUrl(props.track) : ''))
const playing = computed(() => props.active && player.isPlaying)
const currentTime = computed(() => (props.active ? player.currentTime : props.track?.trimStart ?? 0))
function clock(): number {
  return props.active ? player.sampleTime() : props.track?.trimStart ?? 0
}

function togglePlay() {
  if (props.active) player.toggle()
  else emit('activate')
}

// ----- which video -----

const sources = computed(() => sourcesFor(props.track))
const source = computed(() => sources.value.find(s => s.kind === chosenKind.value) ?? sources.value[0] ?? null)
const videoUrl = computed(() => (source.value ? musicVideoUrl(source.value) : ''))
const videoState = ref<'none' | 'loading' | 'ready' | 'error'>('none')
/** The video ran out of data while it should be playing. */
const videoStalled = ref(false)
const ratio = ref(DEFAULT_RATIO)
watch(videoUrl, (url) => {
  videoState.value = url ? 'loading' : 'none'
  videoStalled.value = false
}, { immediate: true })

// A silent video plays inline without a tap only when it is muted from the start (iOS).
watch(video, (el) => {
  if (!el) return
  el.muted = true
  el.defaultMuted = true
}, { flush: 'post' })

function onVideoReady() {
  const el = video.value
  if (!el) return
  if (el.videoWidth > 0 && el.videoHeight > 0) ratio.value = el.videoWidth / el.videoHeight
  videoState.value = 'ready'
  lastSeekAt = 0
  syncVideo()
}

function retryVideo() {
  videoState.value = 'loading'
  video.value?.load()
}

function chooseKind(kind: MusicVideoKind) {
  chosenKind.value = kind
}

// ----- keeping the video on the audio clock -----

let lastSeekAt = 0
let syncFrame = 0

function seekVideo(el: HTMLVideoElement, time: number) {
  lastSeekAt = performance.now()
  el.currentTime = time
}

function syncVideo() {
  const el = video.value
  if (!el || videoState.value !== 'ready') return
  const length = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : Number.POSITIVE_INFINITY
  const time = clock()
  // The audio may run a little past the picture: the video then rests on its last frame.
  const last = Math.max(0, length - 0.05)
  const target = Math.max(0, Math.min(time, last))
  const running = props.active && player.isPlaying && player.isLoaded && !player.isBuffering && time < last
  if (running && el.paused) void el.play().catch(() => {})
  else if (!running && !el.paused) el.pause()
  if (el.seeking) return
  const drift = el.currentTime - target
  if (!running) {
    if (el.playbackRate !== 1) el.playbackRate = 1
    if (Math.abs(drift) > 0.04) seekVideo(el, target)
    return
  }
  if (Math.abs(drift) > HARD_SYNC_SEC) {
    if (performance.now() - lastSeekAt > SEEK_COOLDOWN_MS) {
      el.playbackRate = 1
      seekVideo(el, Math.min(last, target + SEEK_LEAD_SEC))
    }
    return
  }
  // A small drift is evened out by playing a touch faster or slower, which nobody sees.
  const rate = Math.abs(drift) < 0.03 ? 1 : 1 - Math.max(-NUDGE_LIMIT, Math.min(NUDGE_LIMIT, drift * 0.5))
  if (Math.abs(el.playbackRate - rate) > 0.004) el.playbackRate = rate
}

function syncLoop() {
  syncVideo()
  syncFrame = requestAnimationFrame(syncLoop)
}

watch([playing, videoState], ([isPlaying, state]) => {
  cancelAnimationFrame(syncFrame)
  syncFrame = 0
  if (state !== 'ready') return
  syncVideo()
  if (isPlaying) syncFrame = requestAnimationFrame(syncLoop)
}, { flush: 'post', immediate: true })

// Paused: a seek still moves the picture.
watch([currentTime, () => props.active, () => player.isBuffering, () => player.isLoaded], () => {
  if (!syncFrame) syncVideo()
})

// ----- lyrics -----

const {
  timedLyrics, hasTranslation, hasRomaji, hasRuby, showPerformers, note,
} = useVocalLyrics(() => props.track, () => props.active)
const subtitleLyrics = computed(() => (settings.mode !== 'off' ? timedLyrics.value : null))
const extra = computed<SubtitleExtra>(() => {
  if (settings.extra === 'translation' && !hasTranslation.value) return 'none'
  if (settings.extra === 'romaji' && !hasRomaji.value) return 'none'
  return settings.extra
})
/** Why there are no subtitles although they are switched on. */
const subtitleNote = computed(() => (settings.mode === 'off' ? '' : note.value))
const sizeScale = computed(() => SUBTITLE_SIZES.find(s => s.value === settings.size)?.scale ?? 1)

function cycleSubtitles() {
  const index = SUBTITLE_MODES.findIndex(m => m.value === settings.mode)
  settings.mode = SUBTITLE_MODES[(index + 1) % SUBTITLE_MODES.length]!.value
}

// ----- full screen -----

const canFullscreen = typeof document !== 'undefined' && !!document.fullscreenEnabled
const isFullscreen = ref(false)
/** Where the browser has no full screen for a page element (iPhone): the player fills the window instead. */
const expanded = ref(false)
const full = computed(() => isFullscreen.value || expanded.value)
let overflowBefore = ''

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement && document.fullscreenElement === root.value
}

async function toggleFullscreen() {
  if (!canFullscreen) {
    expanded.value = !expanded.value
    return
  }
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await root.value?.requestFullscreen({ navigationUI: 'hide' })
    // Phones turn the picture sideways where they allow it.
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
    if (matchMedia('(pointer: coarse)').matches) await orientation.lock?.('landscape').catch(() => {})
  } catch {
    // Refused (no user gesture, or not allowed here): stay as is.
  }
}

watch(expanded, (value) => {
  if (value) {
    overflowBefore = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
  } else {
    document.documentElement.style.overflow = overflowBefore
  }
})

// ----- controls, layout -----

const chromeShown = ref(true)
const panelOpen = ref(false)
/** Full screen with the bars over the picture: they step aside while it plays. */
const overlaps = ref(false)
/** How far the bottom bar reaches into the picture: subtitles move up by this while it shows. */
const lift = ref(0)
const narrow = ref(false)
/** Where the subtitles are drawn, relative to the stage: over the picture, or in the room under it. */
const subtitleBox = shallowRef<{ placement: 'over' | 'below'; left: number; top: number; width: number; height: number } | null>(null)
/** In the page on a narrow screen, a band under the picture holds the subtitles. */
const band = computed(() => !full.value && narrow.value && !!subtitleLyrics.value)
let hideTimer: ReturnType<typeof setTimeout> | undefined

function wake() {
  chromeShown.value = true
  clearTimeout(hideTimer)
  if (full.value && playing.value && !panelOpen.value && overlaps.value) {
    hideTimer = setTimeout(() => { chromeShown.value = false }, HIDE_CHROME_MS)
  }
}
watch([playing, panelOpen, overlaps, full], wake)

function measure() {
  const box = root.value?.getBoundingClientRect()
  const area = stage.value?.getBoundingClientRect()
  const picture = frame.value?.getBoundingClientRect()
  const bottom = bar.value?.getBoundingClientRect()
  if (!box || !area || !picture || !bottom) return
  narrow.value = box.width < NARROW_PX
  let floor = area.bottom
  if (full.value) {
    const top = topBar.value?.getBoundingClientRect()
    overlaps.value = (!!top && picture.top < top.bottom - 1) || picture.bottom > bottom.top + 1
    lift.value = Math.max(0, Math.round(picture.bottom - bottom.top))
    floor = bottom.top
  } else {
    overlaps.value = false
    lift.value = 0
  }
  const room = floor - picture.bottom
  subtitleBox.value = room >= BELOW_MIN_PX
    ? { placement: 'below', left: 0, top: picture.bottom - area.top, width: area.width, height: room }
    : { placement: 'over', left: picture.left - area.left, top: picture.top - area.top, width: picture.width, height: picture.height }
}

let resizeObserver: ResizeObserver | undefined
onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  resizeObserver = new ResizeObserver(() => measure())
  if (root.value) resizeObserver.observe(root.value)
  if (stage.value) resizeObserver.observe(stage.value)
  measure()
})
watch([full, band, ratio], async () => {
  await nextTick()
  measure()
}, { flush: 'post' })

let lastPointer = 'mouse'
let clickTimer: ReturnType<typeof setTimeout> | undefined

function onStagePointerDown(event: PointerEvent) {
  lastPointer = event.pointerType
}

/**
 * A click plays or pauses (a double click toggles full screen). In full screen on a touch
 * screen a tap shows or hides the controls instead, as video players do.
 */
function onStageClick() {
  if (panelOpen.value) {
    panelOpen.value = false
    return
  }
  if (full.value && lastPointer !== 'mouse') {
    if (chromeShown.value && overlaps.value && playing.value) {
      clearTimeout(hideTimer)
      chromeShown.value = false
    } else {
      wake()
    }
    return
  }
  if (lastPointer !== 'mouse') {
    togglePlay()
    return
  }
  clearTimeout(clickTimer)
  clickTimer = setTimeout(() => {
    togglePlay()
    wake()
  }, 220)
}

function onStageDoubleClick() {
  if (lastPointer !== 'mouse') return
  clearTimeout(clickTimer)
  void toggleFullscreen()
}

function onVolumeInput(event: Event) {
  player.setVolume(Number((event.target as HTMLInputElement).value))
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  // The scrubber and the volume slider handle their own arrow keys; buttons their own space.
  const inControl = !!target?.closest('input, [role="slider"]')
  const plain = !event.ctrlKey && !event.metaKey && !event.altKey
  wake()
  if (event.key === 'Escape') {
    if (panelOpen.value) panelOpen.value = false
    else if (expanded.value) expanded.value = false
    else return
    event.stopPropagation()
  } else if ((event.key === ' ' || event.key === 'k') && plain && !target?.closest('button, input')) {
    event.preventDefault()
    event.stopPropagation()
    togglePlay()
  } else if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && !inControl && props.active) {
    event.preventDefault()
    player.skip(event.key === 'ArrowLeft' ? -SKIP_SEC : SKIP_SEC)
  } else if (event.key === 'f' && plain) {
    void toggleFullscreen()
  } else if (event.key === 'c' && plain) {
    cycleSubtitles()
  } else if (event.key === 'm' && plain) {
    player.toggleMute()
  }
}

// Counted once each time a rendition's MV is started.
let trackedKey = ''
watch([() => props.active, () => props.track?.vocalId], ([isActive]) => {
  const key = props.track ? `${props.track.musicId}-${props.track.vocalId}` : ''
  if (!isActive || !key || key === trackedKey) return
  trackedKey = key
  trackEvent('mv-2d', { kind: source.value?.kind ?? 'none', subtitles: settings.mode })
}, { immediate: true })

onBeforeUnmount(() => {
  cancelAnimationFrame(syncFrame)
  clearTimeout(hideTimer)
  clearTimeout(clickTimer)
  resizeObserver?.disconnect()
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (document.fullscreenElement && document.fullscreenElement === root.value) void document.exitFullscreen().catch(() => {})
  if (expanded.value) document.documentElement.style.overflow = overflowBefore
})
</script>

<template>
  <Teleport to="body" :disabled="!expanded">
    <div
      ref="root"
      class="mvp"
      :class="{ 'mvp--full': full, 'mvp--expanded': expanded, 'mvp--idle': full && !chromeShown, 'mvp--narrow': narrow }"
      tabindex="0"
      role="region"
      :aria-label="source ? 'MV' : 'KTV'"
      @keydown="onKeydown"
      @pointermove="wake"
    >
      <div ref="stage" class="mvp-stage" @pointerdown="onStagePointerDown" @click="onStageClick" @dblclick="onStageDoubleClick">
        <div ref="frame" class="mvp-frame" :style="{ '--mv-ratio': ratio }">
          <video
            v-if="videoUrl"
            ref="video"
            :key="videoUrl"
            class="mvp-video"
            :class="{ shown: videoState === 'ready' }"
            :src="videoUrl"
            muted
            playsinline
            webkit-playsinline
            preload="auto"
            disablepictureinpicture
            disableremoteplayback
            @loadeddata="onVideoReady"
            @error="videoState = 'error'"
            @waiting="videoStalled = true"
            @playing="videoStalled = false"
            @seeked="videoStalled = false"
            @canplay="videoStalled = false"
          ></video>

          <!-- No 2D MV: karaoke over the singers' card art. -->
          <KtvBackdrop
            v-if="videoState === 'none'"
            :track="track"
            :playing="playing"
            :lyrics="timedLyrics"
            :show-performers="showPerformers"
            :current-time="currentTime"
            :clock="clock"
          />

          <!-- The video failed, or is not started yet: the artwork stands in. -->
          <div v-else-if="videoState === 'error' || !active" class="mvp-poster">
            <img class="mvp-poster-glow" :src="cover" alt="" aria-hidden="true" />
            <img class="mvp-poster-art" :src="cover" alt="" />
            <p v-if="videoState === 'error'" class="mvp-poster-note">
              MV 加载失败
              <button class="mvp-chip" @click.stop="retryVideo"><RotateCw class="h-3.5 w-3.5" /> 重试</button>
            </p>
          </div>

          <div v-if="active && (videoState === 'loading' || (videoStalled && playing))" class="mvp-spinner" aria-hidden="true">
            <Loader2 class="h-9 w-9 animate-spin" />
          </div>

          <Transition name="mvp-fade">
            <button v-if="!playing && !(active && player.isBuffering)" class="mvp-bigplay" :aria-label="active ? '播放' : '播放 MV'" @click.stop="togglePlay">
              <Play class="ml-1 h-8 w-8" fill="currentColor" />
            </button>
          </Transition>
        </div>

        <!-- A narrow page: the subtitles get a band of their own under the picture. -->
        <div v-if="band" class="mvp-band" :class="`mvp-band--${settings.mode}`" :style="{ '--mvs-scale': sizeScale }"></div>

        <div
          v-if="subtitleLyrics && settings.mode !== 'off' && subtitleBox"
          class="mvp-subs"
          :style="{ left: `${subtitleBox.left}px`, top: `${subtitleBox.top}px`, width: `${subtitleBox.width}px`, height: `${subtitleBox.height}px` }"
        >
          <MvSubtitles
            :lyrics="subtitleLyrics"
            :mode="settings.mode"
            :placement="subtitleBox.placement"
            :extra="extra"
            :ruby="settings.ruby"
            :singer-colors="settings.singerColors"
            :show-performers="showPerformers"
            :heading="track ? [track.title, track.composer].filter(Boolean).join(' / ') : ''"
            :trim-start="track?.trimStart ?? 0"
            :current-time="currentTime"
            :playing="playing"
            :clock="clock"
            :style="{ '--mvs-scale': sizeScale, '--mvs-lift': chromeShown && subtitleBox.placement === 'over' ? `${lift}px` : '0px' }"
          />
        </div>
      </div>

      <header v-if="full && track" ref="topBar" class="mvp-top mvp-chrome">
        <div class="mvp-meta">
          <p class="mvp-title"><ZhText :text="track.title" table="musics" path="title" layout="inline" /></p>
          <p class="mvp-caption"><ZhText :text="track.caption" table="musicVocals" path="caption" layout="inline" /></p>
        </div>
      </header>

      <div ref="bar" class="mvp-bar mvp-chrome">
        <PlayerScrubber
          v-if="transport || full"
          class="mvp-scrubber"
          :time="active ? player.currentTime : 0"
          :duration="active ? player.duration : 0"
          :disabled="!active || !player.isLoaded"
          @seek="player.seek"
        />
        <div class="mvp-row">
          <div class="mvp-group">
            <button v-if="full" class="mvp-icon" aria-label="上一首" title="上一首" :disabled="!active" @click="player.previous()">
              <SkipBack class="h-5 w-5" fill="currentColor" />
            </button>
            <button v-if="transport || full" class="mvp-icon mvp-icon--play" :aria-label="playing ? '暂停' : '播放'" :title="playing ? '暂停 (空格)' : '播放 (空格)'" @click="togglePlay">
              <Loader2 v-if="playing && player.isBuffering" class="h-5 w-5 animate-spin" />
              <Pause v-else-if="playing" class="h-5 w-5" fill="currentColor" />
              <Play v-else class="ml-0.5 h-5 w-5" fill="currentColor" />
            </button>
            <button v-if="full" class="mvp-icon" aria-label="下一首" title="下一首" :disabled="!active || !player.hasNext" @click="player.next()">
              <SkipForward class="h-5 w-5" fill="currentColor" />
            </button>
            <div v-if="sources.length > 1" class="mvp-tabs" role="group" aria-label="MV 版本">
              <button
                v-for="item in sources"
                :key="item.kind"
                class="mvp-tab"
                :class="{ on: source?.kind === item.kind }"
                :aria-pressed="source?.kind === item.kind"
                @click="chooseKind(item.kind)"
              >
                {{ MUSIC_VIDEO_LABEL[item.kind] }}
              </button>
            </div>
            <span v-else class="mvp-kind">{{ source ? MUSIC_VIDEO_LABEL[source.kind] : 'KTV' }}</span>
          </div>

          <div class="mvp-group">
            <button v-if="full" class="mvp-icon mvp-mute" :aria-label="player.muted || player.volume === 0 ? '取消静音' : '静音'" title="静音 (M)" @click="player.toggleMute()">
              <VolumeX v-if="player.muted || player.volume === 0" class="h-5 w-5" />
              <Volume2 v-else class="h-5 w-5" />
            </button>
            <input
              v-if="full"
              type="range"
              min="0"
              max="1"
              step="0.01"
              aria-label="音量"
              class="mvp-range"
              :value="player.muted ? 0 : player.volume"
              :style="{ '--fill': `${(player.muted ? 0 : player.volume) * 100}%` }"
              @input="onVolumeInput"
            />
            <div class="mvp-panel-anchor">
              <button
                class="mvp-icon"
                :class="{ on: settings.mode !== 'off' }"
                aria-label="字幕设置"
                title="字幕 (C 切换)"
                :aria-expanded="panelOpen"
                @click="panelOpen = !panelOpen"
              >
                <Captions class="h-5 w-5" />
              </button>
              <Transition name="mvp-pop">
                <div v-if="panelOpen" class="mvp-panel" role="dialog" aria-label="字幕设置">
                  <p class="mvp-panel-label">字幕</p>
                  <div class="mvp-seg">
                    <button v-for="item in SUBTITLE_MODES" :key="item.value" :class="{ on: settings.mode === item.value }" :aria-pressed="settings.mode === item.value" @click="settings.mode = item.value">
                      {{ item.label }}
                    </button>
                  </div>
                  <template v-if="settings.mode !== 'off'">
                    <p class="mvp-panel-label">每行下方</p>
                    <div class="mvp-seg">
                      <button
                        v-for="item in SUBTITLE_EXTRAS"
                        :key="item.value"
                        :class="{ on: extra === item.value }"
                        :aria-pressed="extra === item.value"
                        :disabled="(item.value === 'translation' && !hasTranslation) || (item.value === 'romaji' && !hasRomaji)"
                        @click="settings.extra = item.value"
                      >
                        {{ item.label }}
                      </button>
                    </div>
                    <p class="mvp-panel-label">字号</p>
                    <div class="mvp-seg">
                      <button v-for="item in SUBTITLE_SIZES" :key="item.value" :class="{ on: settings.size === item.value }" :aria-pressed="settings.size === item.value" @click="settings.size = item.value">
                        {{ item.label }}
                      </button>
                    </div>
                    <label v-if="hasRuby" class="mvp-switch">
                      <input v-model="settings.ruby" type="checkbox" class="toggle toggle-sm" />
                      <span>注音</span>
                    </label>
                    <label v-if="settings.mode === 'ktv' && showPerformers" class="mvp-switch">
                      <input v-model="settings.singerColors" type="checkbox" class="toggle toggle-sm" />
                      <span>按歌手颜色填充</span>
                    </label>
                  </template>
                  <p v-if="subtitleNote" class="mvp-panel-note">{{ subtitleNote }}</p>
                </div>
              </Transition>
            </div>
            <button class="mvp-icon" :aria-label="full ? '退出全屏' : '全屏'" :title="full ? '退出全屏 (F)' : '全屏 (F)'" @click="toggleFullscreen">
              <Minimize v-if="full" class="h-5 w-5" />
              <Maximize v-else class="h-5 w-5" />
            </button>
            <button v-if="closable && !full" class="mvp-icon" aria-label="收起 MV" title="收起 MV" @click="emit('close')">
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* A dark media block: the picture, then its controls. */
.mvp {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  background: #000;
  box-shadow: 0 12px 40px -18px rgb(0 0 0 / 0.55);
  color: #fff;
  outline: none;
}

.mvp:focus-visible {
  box-shadow: 0 0 0 2px var(--color-primary, #39c5ff), 0 12px 40px -18px rgb(0 0 0 / 0.55);
}

.mvp-stage {
  position: relative;
}

.mvp-frame {
  position: relative;
  width: 100%;
  aspect-ratio: var(--mv-ratio);
  overflow: hidden;
  background: #000;
}

.mvp-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mvp-video.shown {
  opacity: 1;
}

.mvp-poster {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  overflow: hidden;
  background: #000;
}

.mvp-poster-glow {
  position: absolute;
  inset: -20%;
  width: 140%;
  max-width: none;
  height: 140%;
  object-fit: cover;
  opacity: 0.45;
  filter: blur(40px) saturate(1.3);
}

.mvp-poster-art {
  position: relative;
  height: 52%;
  aspect-ratio: 1;
  border-radius: 0.75rem;
  object-fit: cover;
  box-shadow: 0 20px 60px -18px rgb(0 0 0 / 0.8);
}

.mvp-poster-note {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  opacity: 0.85;
}

.mvp-spinner {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  opacity: 0.8;
}

.mvp-bigplay {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  width: 4rem;
  height: 4rem;
  place-items: center;
  border-radius: 999px;
  background: rgb(0 0 0 / 0.5);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.2);
  backdrop-filter: blur(8px);
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition: background-color 0.15s, transform 0.15s;
}

.mvp-bigplay:hover {
  background: rgb(0 0 0 / 0.65);
  transform: translate(-50%, -50%) scale(1.06);
}

/* Room for the karaoke rows (or a film line) under a narrow picture. */
.mvp-band {
  height: calc(var(--mvs-scale, 1) * 6.25rem);
}

.mvp-band--ktv {
  height: calc(var(--mvs-scale, 1) * 8.75rem);
}

.mvp-subs {
  position: absolute;
  pointer-events: none;
  container-type: size;
}

/* ----- bars ----- */

.mvp-bar {
  --scrubber-color: #fff;
  position: relative;
  padding: 0.25rem 0.625rem 0.375rem;
  background: rgb(255 255 255 / 0.06);
}

.mvp-scrubber {
  padding-inline: 0.25rem;
}

.mvp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.375rem;
}

.mvp-group {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.125rem;
}

.mvp-icon {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.15s, transform 0.15s, opacity 0.15s;
}

.mvp-icon:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.14);
}

.mvp-icon:active:not(:disabled) {
  transform: scale(0.9);
}

.mvp-icon:disabled {
  opacity: 0.3;
  cursor: default;
}

.mvp-icon.on {
  background: rgb(255 255 255 / 0.2);
}

.mvp-tabs {
  display: flex;
  min-width: 0;
  gap: 0.125rem;
  margin-left: 0.25rem;
  padding: 0.1875rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.1);
}

.mvp-tab {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  opacity: 0.7;
  cursor: pointer;
  transition: background-color 0.2s, opacity 0.2s;
}

.mvp-tab:hover,
.mvp-tab.on {
  opacity: 1;
}

.mvp-tab.on {
  background: rgb(255 255 255 / 0.22);
}

.mvp-kind {
  margin-left: 0.375rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.1);
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0.75;
}

.mvp-range {
  display: none;
  width: 5.5rem;
  height: 1rem;
  margin-right: 0.375rem;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.mvp-range::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(to right, #fff var(--fill), rgb(255 255 255 / 0.25) var(--fill));
}

.mvp-range::-moz-range-track {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(to right, #fff var(--fill), rgb(255 255 255 / 0.25) var(--fill));
}

.mvp-range::-webkit-slider-thumb {
  width: 12px;
  height: 12px;
  margin-top: -4px;
  appearance: none;
  border-radius: 999px;
  background: #fff;
}

.mvp-range::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border: 0;
  border-radius: 999px;
  background: #fff;
}

/* ----- subtitle settings ----- */

.mvp-panel-anchor {
  position: relative;
}

.mvp-panel {
  position: absolute;
  z-index: 3;
  right: -2.5rem;
  bottom: calc(100% + 0.5rem);
  width: min(17.5rem, calc(100vw - 2rem));
  padding: 0.75rem;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 1rem;
  background: rgb(22 24 32 / 0.94);
  box-shadow: 0 20px 50px -12px rgb(0 0 0 / 0.7);
  backdrop-filter: blur(24px) saturate(1.4);
  font-size: 0.8125rem;
}

.mvp-panel-label {
  margin: 0.625rem 0 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  opacity: 0.6;
}

.mvp-panel-label:first-child {
  margin-top: 0;
}

.mvp-seg {
  display: flex;
  gap: 0.25rem;
  padding: 0.1875rem;
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.08);
}

.mvp-seg button {
  flex: 1;
  padding: 0.4rem 0.25rem;
  border-radius: 0.5625rem;
  font-weight: 600;
  line-height: 1.1;
  opacity: 0.72;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.15s;
}

.mvp-seg button:hover:not(:disabled) {
  opacity: 1;
}

.mvp-seg button.on {
  background: rgb(255 255 255 / 0.22);
  opacity: 1;
}

.mvp-seg button:disabled {
  opacity: 0.3;
  cursor: default;
}

.mvp-switch {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.mvp-panel-note {
  margin-top: 0.75rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.5rem;
  background: rgb(255 255 255 / 0.08);
  font-size: 0.75rem;
  opacity: 0.8;
}

.mvp-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.16);
  font-size: 0.75rem;
  cursor: pointer;
}

/* ----- full screen: the picture as large as the screen allows, the bars over it ----- */

.mvp--full {
  border-radius: 0;
  box-shadow: none;
}

.mvp--expanded {
  position: fixed;
  z-index: 80;
  inset: 0;
}

.mvp--full .mvp-stage {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  container-type: size;
}

.mvp--full .mvp-frame {
  width: min(100cqw, 100cqh * var(--mv-ratio));
}

.mvp--idle {
  cursor: none;
}

.mvp--full .mvp-chrome {
  position: absolute;
  z-index: 2;
  right: 0;
  left: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.mvp--idle .mvp-chrome {
  opacity: 0;
  pointer-events: none;
}

.mvp-top {
  top: 0;
  padding: calc(0.75rem + env(safe-area-inset-top, 0px)) calc(1rem + env(safe-area-inset-right, 0px)) 1.5rem calc(1rem + env(safe-area-inset-left, 0px));
  background: linear-gradient(rgb(0 0 0 / 0.7), rgb(0 0 0 / 0.3) 60%, transparent);
}

.mvp-meta {
  min-width: 0;
}

.mvp-title {
  overflow: hidden;
  font-size: 1rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mvp-caption {
  overflow: hidden;
  font-size: 0.75rem;
  opacity: 0.7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mvp--full .mvp-bar {
  bottom: 0;
  padding: 2rem calc(1rem + env(safe-area-inset-right, 0px)) calc(0.5rem + env(safe-area-inset-bottom, 0px)) calc(1rem + env(safe-area-inset-left, 0px));
  background: linear-gradient(transparent, rgb(0 0 0 / 0.4) 35%, rgb(0 0 0 / 0.78));
}

.mvp--full .mvp-icon {
  width: 2.5rem;
  height: 2.5rem;
}

.mvp--full .mvp-icon--play {
  width: 3rem;
  height: 3rem;
}

.mvp--full:not(.mvp--narrow) .mvp-range {
  display: block;
}

.mvp--full .mvp-panel {
  right: 0;
}

/* A phone held upright in full screen: the picture moves up under the title, the subtitles take the space below. */
@media (orientation: portrait) {
  .mvp--full .mvp-stage {
    place-items: start center;
    padding-top: calc(4.75rem + env(safe-area-inset-top, 0px));
  }
}

.mvp-fade-enter-active,
.mvp-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mvp-fade-enter-from,
.mvp-fade-leave-to {
  opacity: 0;
}

.mvp-pop-enter-active,
.mvp-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.mvp-pop-enter-from,
.mvp-pop-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
