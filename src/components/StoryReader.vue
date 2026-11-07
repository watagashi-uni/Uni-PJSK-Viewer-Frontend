<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { BookOpen, ChevronLeft, ChevronRight, Copy, Film, Languages, Music2, Play, Search, Volume2, VolumeX, X } from 'lucide-vue-next'
import type { PjskPlayer, ScenarioSceneData } from 'pjsk-scenario-player'
import { buildStoryFrames } from '@/utils/storyPlayback'
import { loadStoryPlayerIndex, parsePlayerScenario, storyPlayerResolver } from '@/utils/storyPlayerAssets'
import { attachStoryZhOverlay, trimFullStop, type StoryZhOverlay } from '@/utils/storyZhOverlay'
import { loadZhStory, peekZhStorySource, type ZhStory, type ZhStorySource } from '@/api/translations'
import { useSettingsStore } from '@/stores/settings'
import ZhText from '@/components/ZhText.vue'

const props = withDefaults(defineProps<{
  title: string; episodeLabel?: string; scenarioId: string; scenarioUrls: string[]
  hasPrevious?: boolean; hasNext?: boolean
  /** 标题译名，随资料译名设置显示 */
  titleZh?: string
}>(), { episodeLabel: '', hasPrevious: false, hasNext: false, titleZh: '' })
const emit = defineEmits<{ close: []; previous: []; next: []; play: [] }>()
const scenario = shallowRef<ScenarioSceneData>()
const frames = computed(() => scenario.value ? buildStoryFrames(scenario.value) : [])
const stage = ref<HTMLElement>()
const mode = ref<'stage' | 'script'>('stage')
const loading = ref(true)
const stageLoading = ref(false)
const error = ref('')
const stageError = ref('')
const notice = ref('')
const search = ref('')
const snippet = ref(0)
const auto = ref(false)
const voiceEnabled = ref(true)
const bgmEnabled = ref(true)
const volume = ref(0.8)
const playerReady = ref(false)
const started = ref(false)
const settings = useSettingsStore()
// 中文台词：按 TalkData 下标对齐，人名和地点字幕另有对照表
const zhStory = shallowRef<ZhStory | null>(null)
// skipped：设置里关闭了 AI 译文，而这一话只有机翻，没有下载
const zhState = ref<'idle' | 'loading' | 'ready' | 'none' | 'skipped'>('idle')
const zhKnownSource = ref<ZhStorySource>()
const showZh = computed(() => settings.storyTranslation)
const zhHidden = computed(() => settings.hideAiTranslation && !!zhKnownSource.value && zhKnownSource.value !== 'official')
const zhActive = computed(() => showZh.value && !!zhStory.value && !zhHidden.value)
const zhFirst = computed(() => zhActive.value && settings.translationMode === 'zh-first')
const ZH_SOURCES: Record<ZhStorySource, { label: string; title: string }> = {
  official: { label: '官方中文', title: '国服官方汉化文本' },
  'auto-story': { label: 'AI 翻译 · 审校版', title: '机器翻译并经过审校，与剧情字幕视频的译文一致' },
  toolbox: { label: 'AI 翻译', title: '机器翻译，仅供参考' },
  ai: { label: 'AI 翻译', title: '机器翻译，仅供参考' },
}
const zhSource = computed(() => zhStory.value ? ZH_SOURCES[zhStory.value.src] ?? ZH_SOURCES.ai : undefined)
function zhLine(talkIndex: number): string {
  const text = zhActive.value ? zhStory.value!.lines[talkIndex] : ''
  return text ? trimFullStop(text) : ''
}
function zhName(name?: string): string {
  const zh = zhActive.value && name ? zhStory.value!.names[name] : ''
  return zh && zh !== name ? zh : ''
}
let zhRequest = ''
async function loadZh() {
  if (!showZh.value || zhRequest === props.scenarioId) return
  const scenarioId = zhRequest = props.scenarioId
  zhState.value = 'loading'
  if (settings.hideAiTranslation && !zhStory.value) {
    // 能提前知道来源时，只有机翻的剧情不必下载
    const source = await peekZhStorySource(scenarioId).catch(() => undefined)
    if (disposed || scenarioId !== props.scenarioId) return
    if (source === null) { zhState.value = 'none'; zhRequest = ''; return }
    if (source && source !== 'official') { zhKnownSource.value = source; zhState.value = 'skipped'; zhRequest = ''; return }
  }
  const story = await loadZhStory(scenarioId).catch(() => null)
  if (disposed || scenarioId !== props.scenarioId) return
  zhStory.value = story
  zhKnownSource.value = story?.src
  zhState.value = story ? 'ready' : 'none'
  if (!story) zhRequest = ''
}
const zhButtonText = computed(() => {
  if (!showZh.value) return '中文'
  if (zhState.value === 'loading') return '…'
  if (zhHidden.value) return 'AI 已隐藏'
  return zhState.value === 'none' ? '无译文' : '中文'
})
const zhButtonTitle = computed(() => {
  if (!showZh.value) return '显示中文'
  if (zhHidden.value) return '这一话只有 AI 译文，已在设置中关闭 AI 译文'
  return zhState.value === 'none' ? '这一话暂无中文译文' : '隐藏中文'
})
const index = computed(() => {
  for (let i = frames.value.length - 1; i >= 0; i--) {
    if (frames.value[i]!.snippetIndex <= snippet.value) return i
  }
  return 0
})
const matches = computed(() => frames.value.map((frame, i) => ({ ...frame, index: i }))
  .filter(frame => !search.value.trim() || `${frame.talk.WindowDisplayName} ${frame.talk.Body} ${zhName(frame.talk.WindowDisplayName)} ${zhLine(frame.talkIndex)}`.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase())))
let player: PjskPlayer | undefined
let overlay: StoryZhOverlay | undefined
let playerAbort: AbortController | undefined
let requestAbort: AbortController | undefined
let generation = 0
let disposed = false
let sourceUrl = ''

function savePosition() {
  try { localStorage.setItem(`story-snippet:v1:${props.scenarioId}`, String(snippet.value)) } catch { /* Storage is optional. */ }
}
function restorePosition() {
  try {
    const stored = localStorage.getItem(`story-snippet:v1:${props.scenarioId}`)
    // 旧版按台词行保存；都没有时从头播放，保留开场的字幕卡和全屏旁白
    const oldLine = localStorage.getItem(`story-position:v1:${props.scenarioId}`)
    const value = stored !== null ? Number(stored) : oldLine !== null ? (frames.value[Number(oldLine) || 0]?.snippetIndex || 0) : 0
    snippet.value = Number.isFinite(value) ? Math.max(0, Math.min((scenario.value?.Snippets.length || 1) - 1, Math.floor(value))) : 0
  } catch { snippet.value = 0 }
}
function destroyPlayer() {
  generation++
  playerAbort?.abort()
  overlay?.destroy()
  overlay = undefined
  player?.destroy()
  player = undefined
  playerReady.value = started.value = stageLoading.value = false
}
async function mountPlayer() {
  destroyPlayer()
  if (!scenario.value || mode.value !== 'stage' || document.hidden || disposed) return
  const current = generation
  const controller = new AbortController()
  playerAbort = controller
  stageLoading.value = true
  stageError.value = ''
  try {
    const [engine, assets] = await Promise.all([import('pjsk-scenario-player'), loadStoryPlayerIndex(controller.signal)])
    await nextTick()
    if (current !== generation || disposed || !stage.value) return
    const instance = engine.createPlayer(stage.value, {
      assets: storyPlayerResolver(assets, sourceUrl), models: assets.models,
      autoplay: false, auto: auto.value, voice: voiceEnabled.value, locale: 'zh', fonts: false,
      volumes: { voice: volume.value, bgm: bgmEnabled.value ? volume.value * 0.4 : 0, se: volume.value },
      menu: ['fullscreen', 'auto', 'fast', 'hide', 'log'],
    })
    player = instance
    overlay = attachStoryZhOverlay(instance.root, scenario.value, zhActive.value ? zhStory.value : null)
    const resumeAt = snippet.value
    instance.on('play', () => {
      started.value = true
      emit('play')
      // The library installs its seek handler immediately after emitting play.
      queueMicrotask(() => { if (player === instance && resumeAt > 0) void instance.jumpTo(resumeAt) })
    })
    instance.on('progress', value => { snippet.value = value.index; savePosition(); overlay?.snippet(value.index) })
    instance.on('mode', value => { auto.value = value.auto; voiceEnabled.value = value.voice })
    instance.on('log', () => { void setMode('script') })
    instance.on('end', () => { notice.value = '本话播放完毕'; instance.setAuto(false) })
    instance.on('loading', value => {
      if (value.failed.length) notice.value = '部分人物资源未能加载，可继续播放或切换文本阅读'
    })
    instance.on('error', () => { stageError.value = '场景播放失败，可重试或切换文本阅读'; playerReady.value = false })
    await instance.load(scenario.value)
    if (current === generation && !stageError.value) playerReady.value = true
  } catch {
    if (current === generation && !disposed) stageError.value = '播放器或场景资源加载失败，可重试或切换文本阅读'
  } finally { if (current === generation) stageLoading.value = false }
}
async function load() {
  requestAbort?.abort()
  destroyPlayer()
  const controller = new AbortController()
  requestAbort = controller
  loading.value = true
  error.value = notice.value = stageError.value = ''
  scenario.value = undefined
  if (zhRequest !== props.scenarioId) { zhStory.value = null; zhState.value = 'idle'; zhRequest = '' }
  // 译文与剧本并行加载，互不阻塞
  void loadZh()
  try {
    for (const url of new Set(props.scenarioUrls)) {
      try {
        const response = await fetch(url, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(25000)]) })
        if (!response.ok) continue
        const data = parsePlayerScenario(await response.json(), props.scenarioId)
        if (!data.Snippets.length) continue
        if (controller.signal.aborted || disposed) return
        sourceUrl = url
        scenario.value = data
        restorePosition()
        break
      } catch { if (controller.signal.aborted || disposed) return }
    }
    if (!scenario.value) throw new Error('这话的剧本暂不可用，请稍后重试或选择其他章节')
  } catch (reason) { error.value = reason instanceof Error ? reason.message : '加载失败' }
  finally { if (requestAbort === controller) loading.value = false }
  if (!controller.signal.aborted && !disposed && scenario.value) await mountPlayer()
}
async function setMode(value: 'stage' | 'script') {
  if (mode.value === value) return
  destroyPlayer()
  auto.value = false
  mode.value = value
  if (value === 'stage') await mountPlayer()
}
async function jump(line: number) {
  const frame = frames.value[line]
  if (!frame) return
  snippet.value = frame.snippetIndex
  savePosition()
  notice.value = ''
  if (mode.value === 'script') { await setMode('stage'); return }
  if (!playerReady.value) return
  if (!started.value) {
    // Recreate with the chosen resume position; the start button still requires
    // a gesture, so seeking never accidentally starts audio on a mobile browser.
    await mountPlayer()
  } else { player?.setAuto(false); await player?.jumpTo(frame.snippetIndex) }
}
function toggleAuto() {
  if (!playerReady.value) return
  auto.value = !auto.value
  player?.setAuto(auto.value)
  if (!started.value) void player?.play()
}
function toggleVoice() { voiceEnabled.value = !voiceEnabled.value; player?.setVoice(voiceEnabled.value) }
function syncVolume() {
  player?.setVolume('voice', volume.value)
  player?.setVolume('se', volume.value)
  player?.setVolume('bgm', bgmEnabled.value ? volume.value * 0.4 : 0)
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    // Let the library/browser leave fullscreen before closing the reader.
    if (player?.fullscreen || document.fullscreenElement) return
    event.preventDefault(); emit('close'); return
  }
  if ((event.target as HTMLElement)?.closest('input,textarea,select,button,a') || event.ctrlKey || event.metaKey || event.altKey || mode.value !== 'stage') return
  if (['ArrowRight', 'ArrowLeft', ' '].includes(event.key)) event.preventDefault()
  if (event.key === 'ArrowRight') void jump(index.value + 1)
  if (event.key === 'ArrowLeft') void jump(index.value - 1)
  if (event.key === ' ') toggleAuto()
}
function visibility() {
  if (document.hidden) { destroyPlayer(); auto.value = false }
  else if (scenario.value && mode.value === 'stage') void mountPlayer()
}
async function copyScript() {
  try {
    await navigator.clipboard.writeText(frames.value.map(frame => {
      const zh = zhLine(frame.talkIndex)
      const name = zhName(frame.talk.WindowDisplayName)
      return `${frame.talk.WindowDisplayName || '旁白'}${name ? `（${name}）` : ''}：${frame.talk.Body || ''}${zh ? `\n${zh}` : ''}`
    }).join('\n\n'))
    notice.value = '剧本文本已复制'
  } catch { notice.value = '当前浏览器无法复制，可在文本模式中选择台词' }
}
watch([volume, bgmEnabled], syncVolume)
watch(showZh, () => { void loadZh() })
watch(() => settings.hideAiTranslation, hide => { if (!hide && zhState.value === 'skipped') void loadZh() })
watch(zhActive, () => { overlay?.setStory(zhActive.value ? zhStory.value : null) })
watch(zhStory, () => { if (zhActive.value) overlay?.setStory(zhStory.value) })
watch(() => [props.scenarioId, ...props.scenarioUrls], () => { void load() })
onMounted(() => { void load(); window.addEventListener('keydown', keydown); document.addEventListener('visibilitychange', visibility) })
onBeforeUnmount(() => {
  disposed = true; requestAbort?.abort(); destroyPlayer()
  window.removeEventListener('keydown', keydown); document.removeEventListener('visibilitychange', visibility)
})
</script>

<template>
  <div class="story-reader">
    <header class="reader-heading">
      <div class="min-w-0 flex-1"><p class="text-xs text-primary font-bold tracking-wider">{{ episodeLabel || 'STORY THEATER' }}<span v-if="zhActive && zhSource" class="zh-source" :title="zhSource.title">{{ zhSource.label }}</span><span v-else-if="showZh && zhHidden" class="zh-source" title="可在设置的“中文译名”中重新显示 AI 译文">仅有 AI 译文 · 已隐藏</span></p><h2 class="text-lg font-bold truncate"><ZhText :text="title" :zh="titleZh || null" layout="inline" sub-class="text-sm" /></h2></div>
      <button class="btn btn-sm btn-ghost gap-1 px-2" :class="{ 'text-primary': showZh }" :aria-pressed="showZh" :title="zhButtonTitle" @click="settings.storyTranslation = !showZh"><Languages class="w-4 h-4" /><span class="text-xs">{{ zhButtonText }}</span></button>
      <div class="join"><button aria-label="场景模式" class="btn btn-sm join-item" :class="mode === 'stage' ? 'btn-primary' : 'btn-ghost'" @click="setMode('stage')"><Film class="w-4 h-4" /><span class="hidden sm:inline">场景</span></button><button aria-label="文本模式" class="btn btn-sm join-item" :class="mode === 'script' ? 'btn-primary' : 'btn-ghost'" @click="setMode('script')"><BookOpen class="w-4 h-4" /><span class="hidden sm:inline">文本</span></button></div>
      <button class="btn btn-sm btn-circle btn-ghost" aria-label="关闭阅读器" @click="emit('close')"><X class="w-5 h-5" /></button>
    </header>
    <div v-if="loading" class="flex-1 grid place-items-center min-h-64"><div class="text-center"><span class="loading loading-spinner text-primary"></span><p class="mt-3 text-sm opacity-60">正在加载剧情…</p></div></div>
    <div v-else-if="error" class="flex-1 grid place-items-center p-8"><div class="text-center"><p role="alert">{{ error }}</p><button class="btn btn-primary btn-sm mt-4" @click="load">重新加载</button></div></div>
    <template v-else-if="scenario">
      <section v-show="mode === 'stage'" class="story-stage" aria-label="剧情场景">
        <div ref="stage" class="player-host"></div>
        <div v-if="stageLoading || stageError" class="stage-status">
          <span v-if="stageLoading" class="loading loading-spinner text-primary"></span>
          <p :role="stageError ? 'alert' : 'status'">{{ stageError || '正在准备 Live2D 场景…' }}</p>
          <div v-if="stageError" class="flex gap-3"><button class="btn btn-sm btn-primary" @click="mountPlayer">重试场景</button><button class="btn btn-sm" @click="setMode('script')">阅读文本</button></div>
        </div>
      </section>
      <section v-if="mode === 'script'" class="script-panel">
        <div class="script-search"><label class="input input-sm w-full"><Search class="w-4 h-4" /><input v-model="search" placeholder="搜索台词或人物…" /></label><button class="btn btn-sm btn-ghost" aria-label="复制全文" @click="copyScript"><Copy class="w-4 h-4" /></button></div>
        <div v-if="!matches.length" class="text-center p-10 opacity-50">没有匹配的台词</div>
        <button v-for="item in matches" :key="item.key" class="script-line" :class="{ 'current-line': item.index === index }" @click="jump(item.index)"><span class="text-xs opacity-40">{{ item.index + 1 }}</span><span><strong class="text-primary text-sm">{{ item.talk.WindowDisplayName || '旁白' }}<span v-if="zhName(item.talk.WindowDisplayName)" class="zh-speaker" lang="zh-CN">{{ zhName(item.talk.WindowDisplayName) }}</span></strong><template v-if="zhFirst && zhLine(item.talkIndex)"><span class="block whitespace-pre-line leading-7 mt-1" lang="zh-CN">{{ zhLine(item.talkIndex) }}</span><span class="zh-script-sub" lang="ja">{{ item.talk.Body }}</span></template><template v-else><span class="block whitespace-pre-line leading-7 mt-1">{{ item.talk.Body }}</span><span v-if="zhLine(item.talkIndex)" class="zh-script-sub" lang="zh-CN">{{ zhLine(item.talkIndex) }}</span></template></span><Play class="w-4 h-4 opacity-40" /></button>
      </section>
      <div class="reader-controls">
        <input v-if="frames.length" class="range range-primary range-xs w-full" aria-label="台词进度" type="range" min="0" :max="frames.length - 1" :value="index" :disabled="mode === 'stage' && !playerReady" @change="jump(Number(($event.target as HTMLInputElement).value))" />
        <div class="control-row">
          <div class="flex items-center gap-1">
            <button class="btn btn-sm btn-circle btn-ghost" aria-label="上一句" :disabled="index === 0 || (mode === 'stage' && !playerReady)" @click="jump(index - 1)"><ChevronLeft class="w-5 h-5" /></button>
            <button class="btn btn-sm btn-primary" :disabled="mode !== 'stage' || !playerReady" :aria-pressed="auto" @click="toggleAuto">{{ auto ? '停止自动' : '自动播放' }}</button>
            <button class="btn btn-sm btn-circle btn-ghost" aria-label="下一句" :disabled="index >= frames.length - 1 || (mode === 'stage' && !playerReady)" @click="jump(index + 1)"><ChevronRight class="w-5 h-5" /></button>
            <span class="text-xs opacity-50">{{ frames.length ? index + 1 : 0 }} / {{ frames.length }}</span>
          </div>
          <div class="flex items-center gap-1">
            <button class="btn btn-sm btn-circle btn-ghost" :aria-label="voiceEnabled ? '关闭语音' : '开启语音'" :aria-pressed="voiceEnabled" :disabled="mode !== 'stage'" @click="toggleVoice"><Volume2 v-if="voiceEnabled" class="w-4 h-4 text-primary" /><VolumeX v-else class="w-4 h-4" /></button>
            <button class="btn btn-sm btn-ghost gap-1" :class="{ 'text-primary': bgmEnabled }" :aria-pressed="bgmEnabled" :disabled="mode !== 'stage'" @click="bgmEnabled = !bgmEnabled"><Music2 class="w-4 h-4" /><span class="text-xs">BGM</span></button>
            <input v-model.number="volume" type="range" min="0" max="1" step="0.05" aria-label="音量" class="range range-xs w-16" />
          </div>
        </div>
        <p class="text-xs text-base-content/55 min-h-4" role="status">{{ notice || (mode === 'script' ? '点击台词可从这里播放' : '进度自动保存 · ← → 切换台词 · 空格切换自动播放') }}</p>
      </div>
      <footer class="reader-footer"><button class="btn btn-xs btn-ghost" :disabled="!hasPrevious" @click="emit('previous')">上一话</button><button class="btn btn-xs btn-ghost" @click="setMode(mode === 'stage' ? 'script' : 'stage')">{{ mode === 'stage' ? '全文与台词搜索' : '返回场景' }}</button><button class="btn btn-xs btn-ghost" :disabled="!hasNext" @click="emit('next')">下一话</button></footer>
    </template>
  </div>
</template>

<style scoped>
.story-reader { display:flex; flex-direction:column; height:min(90vh,920px); height:min(90svh,920px); background:var(--color-base-100); }
.reader-heading { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; border-bottom:1px solid var(--color-base-200); flex-shrink:0; }
.story-stage { position:relative; display:flex; align-items:center; justify-content:center; flex:1; min-height:0; overflow:hidden; background:#111820; }
.player-host { width:100%; height:100%; }
.player-host :deep(.pjsk-player:not(.pjsk-pseudo-fs):not(:fullscreen)) { width:100%; height:100%; aspect-ratio:auto; }
.stage-status { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; padding:1rem; text-align:center; color:#fff; background:#111820; }
.reader-controls { padding:.7rem 1rem .45rem; border-top:1px solid var(--color-base-200); flex-shrink:0; }
.control-row { display:flex; justify-content:space-between; flex-wrap:wrap; gap:.4rem; align-items:center; padding:.45rem 0; }
.reader-footer { display:flex; align-items:center; justify-content:space-between; padding:.4rem .75rem; border-top:1px solid var(--color-base-200); }
.script-panel { flex:1; min-height:0; overflow:auto; padding:0 1rem 1rem; background:var(--color-base-200); }
.script-search { position:sticky; top:0; z-index:1; display:flex; gap:.5rem; padding:.75rem 0; background:var(--color-base-200); }
.script-line { display:grid; grid-template-columns:2rem 1fr 1rem; gap:.6rem; width:100%; text-align:left; padding:1rem; margin:.5rem 0; border-radius:12px; background:var(--color-base-100); border:1px solid transparent; }
.script-line:hover,.current-line { border-color:var(--color-primary); }
.zh-source { margin-left:.5rem; padding:.05rem .4rem; border-radius:999px; font-weight:500; letter-spacing:0; color:var(--color-base-content); background:var(--color-base-200); opacity:.75; }
.zh-speaker { margin-left:.45rem; font-weight:500; opacity:.7; }
.zh-script-sub { display:block; margin-top:.2rem; white-space:pre-line; line-height:1.6; font-size:.92em; color:color-mix(in oklab, var(--color-base-content) 68%, transparent); }
/* 手机：按地址栏展开时的可视高度（svh）算，不支持时退回 vh；弹窗外层在 StoriesView 里贴顶，
   保证标题栏和关闭按钮始终在屏幕内，即使地址栏在底部或浏览器不支持 svh */
@media(max-width:640px) {
  .reader-heading {padding:.7rem .75rem;gap:.5rem;}
  .story-reader {height:calc(100vh - 1rem); height:calc(100svh - 1rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));}
}
@media(prefers-reduced-motion:reduce) { .player-host :deep(.pjsk-start) {animation:none;} }
</style>
