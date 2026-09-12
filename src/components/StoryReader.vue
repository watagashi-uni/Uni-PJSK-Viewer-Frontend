<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BookOpen, ChevronLeft, ChevronRight, Copy, Film, MapPin, Music2, Pause, Play, RotateCcw, Search, Volume2, VolumeX, X } from 'lucide-vue-next'
import { useMasterStore } from '@/stores/master'
import { backgroundPath, bgmPath, buildStoryFrames, loadStoryMedia, storyAssetUrl, voicePaths, type StoryFrame, type StoryMediaIndex, type StoryScenario } from '@/utils/storyPlayback'

const props = withDefaults(defineProps<{
  title: string; episodeLabel?: string; scenarioId: string; scenarioUrls: string[]
  hasPrevious?: boolean; hasNext?: boolean
}>(), { episodeLabel: '', hasPrevious: false, hasNext: false })
const emit = defineEmits<{ close: []; previous: []; next: [] }>()
const frames = ref<StoryFrame[]>([])
const media = ref<StoryMediaIndex>({ backgrounds: {}, bgm: {}, comics: [] })
const characterMap = ref<Record<number, number>>({})
const index = ref(0)
const mode = ref<'stage' | 'script'>('stage')
const loading = ref(true)
const error = ref('')
const search = ref('')
const notice = ref('')
const voiceEnabled = ref(true)
const bgmEnabled = ref(false)
const auto = ref(false)
const speaking = ref(false)
const volume = ref(0.8)
const speed = ref(1)
const bgFailed = ref(false)
const portraitFailures = ref(new Set<number>())
const frame = computed(() => frames.value[index.value])
const background = computed(() => {
  const path = backgroundPath(frame.value?.background || '', media.value)
  return path ? storyAssetUrl(path) : ''
})
const music = computed(() => {
  const path = bgmPath(frame.value?.bgm || '', media.value)
  return path ? storyAssetUrl(path) : ''
})
const characters = computed(() => [...new Set((frame.value?.talk.TalkCharacters || [])
  .map(item => characterMap.value[item.Character2dId] || (item.Character2dId <= 26 ? item.Character2dId : 0))
  .filter(id => id > 0 && id <= 26))].slice(0, 3))
const matches = computed(() => frames.value.map((value, i) => ({ ...value, index: i }))
  .filter(value => !search.value.trim() || `${value.talk.WindowDisplayName} ${value.talk.Body}`.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase())))
const bookmark = `story-position:v1:${props.scenarioId}`
const abort = new AbortController()
let generation = 0
let timer: ReturnType<typeof setTimeout> | undefined
let voice: HTMLAudioElement | undefined
let voiceGain = 1
let bgm: HTMLAudioElement | undefined
let cancelVoice: (() => void) | undefined
let disposed = false

function stopVoice() {
  generation++
  clearTimeout(timer)
  cancelVoice?.()
  cancelVoice = undefined
  if (voice) { voice.pause(); voice.removeAttribute('src'); voice.load(); voice = undefined }
  speaking.value = false
}
function pause() { auto.value = false; stopVoice(); bgm?.pause() }
function storePosition() {
  try { localStorage.setItem(bookmark, String(index.value)) } catch { /* Reading also works with storage disabled. */ }
}
function jump(next: number, continueAuto = false) {
  if (next < 0 || next >= frames.value.length) { pause(); return }
  if (!continueAuto) auto.value = false
  stopVoice()
  index.value = next
  storePosition()
  notice.value = ''
  if (mode.value === 'stage') void playFrame()
}
function seek(event: Event) { jump(Number((event.target as HTMLInputElement).value)) }
function portrait(id: number) { return storyAssetUrl(`startapp/character/member_cutout_trm/res${String(id).padStart(3, '0')}_no001/normal.png`) }
function failPortrait(id: number) { portraitFailures.value = new Set([...portraitFailures.value, id]) }

function playClip(url: string, token: number, gain: number): Promise<'ended' | 'missing' | 'blocked' | 'cancelled'> {
  return new Promise(resolve => {
    if (token !== generation || disposed) { resolve('cancelled'); return }
    const audio = new Audio(url)
    voice = audio
    voiceGain = Number.isFinite(gain) ? Math.max(0, Math.min(1, gain)) : 1
    audio.volume = volume.value * voiceGain
    audio.playbackRate = speed.value
    let settled = false
    let watchdog: ReturnType<typeof setTimeout> | undefined
    const finish = (result: 'ended' | 'missing' | 'blocked' | 'cancelled') => {
      if (settled) return
      settled = true
      clearTimeout(watchdog)
      audio.onended = audio.onerror = audio.onplaying = audio.onwaiting = null
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      if (voice === audio) { voice = undefined; speaking.value = false; cancelVoice = undefined }
      resolve(result)
    }
    const armTimeout = () => { clearTimeout(watchdog); watchdog = setTimeout(() => finish('missing'), 15000) }
    cancelVoice = () => finish('cancelled')
    audio.onended = () => finish('ended')
    audio.onerror = () => finish('missing')
    audio.onwaiting = armTimeout
    audio.onplaying = () => { clearTimeout(watchdog); speaking.value = true }
    armTimeout()
    void audio.play().catch(reason => finish(reason?.name === 'NotAllowedError' ? 'blocked' : 'missing'))
  })
}
function syncBgm() {
  if (!bgmEnabled.value || mode.value !== 'stage' || !music.value || document.hidden) {
    bgm?.pause(); return
  }
  if (bgm?.dataset.source !== music.value) {
    bgm?.pause()
    bgm = new Audio(music.value)
    bgm.dataset.source = music.value
    bgm.loop = true
    bgm.onerror = () => { notice.value = '这段背景音乐暂不可用，仍可继续阅读' }
  }
  bgm.volume = volume.value * 0.18
  void bgm.play().catch(() => { notice.value = '背景音乐未能播放，可再次点击音乐按钮重试' })
}
async function playFrame() {
  stopVoice()
  const token = generation
  const current = frame.value
  if (!current) return
  syncBgm()
  let playedVoice = false
  if (voiceEnabled.value) {
    for (const clip of current.talk.Voices || []) {
      let result: 'ended' | 'missing' | 'blocked' | 'cancelled' = 'missing'
      for (const path of voicePaths(props.scenarioId, clip.VoiceId)) {
        result = await playClip(storyAssetUrl(path), token, clip.Volume ?? 1)
        if (token !== generation || disposed) return
        if (result !== 'missing') break
      }
      if (result === 'blocked') { auto.value = false; notice.value = '浏览器需要点击播放才能启用声音'; return }
      if (result === 'ended') playedVoice = true
      if (result === 'missing') notice.value = '本句语音暂不可用，已保留文字'
    }
  }
  if (token !== generation || disposed || !auto.value) return
  if (index.value === frames.value.length - 1) { auto.value = false; notice.value = '本话播放完毕'; bgm?.pause(); return }
  timer = setTimeout(() => jump(index.value + 1, true), playedVoice ? 1000 / speed.value : Math.max(1800, Math.min(9000, (current.talk.Body?.length || 0) * 95)) / speed.value)
}
function toggleAuto() { if (auto.value) pause(); else { auto.value = true; void playFrame() } }
function toggleVoice() { voiceEnabled.value = !voiceEnabled.value; void playFrame() }
function toggleBgm() { bgmEnabled.value = !bgmEnabled.value; syncBgm() }
function setMode(next: 'stage' | 'script') { pause(); mode.value = next }
function readFrom(i: number) { mode.value = 'stage'; jump(i) }
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); emit('close'); return }
  if ((event.target as HTMLElement)?.closest('input,textarea,select,button,a') || event.ctrlKey || event.metaKey || event.altKey) return
  if (mode.value !== 'stage') return
  if (['ArrowRight', 'ArrowLeft', ' '].includes(event.key)) event.preventDefault()
  if (event.key === 'ArrowRight') jump(index.value + 1)
  if (event.key === 'ArrowLeft') jump(index.value - 1)
  if (event.key === ' ') toggleAuto()
}
function visibility() { if (document.hidden) pause() }
async function copyScript() {
  try {
    await navigator.clipboard.writeText(frames.value.map(item => `${item.talk.WindowDisplayName || '旁白'}：${item.talk.Body || ''}`).join('\n\n'))
    notice.value = '剧本文本已复制'
  } catch { notice.value = '当前浏览器无法复制，可在文本模式中选择台词' }
}
async function load() {
  pause(); loading.value = true; error.value = ''
  try {
    const mediaLoad = loadStoryMedia().then(value => { media.value = value }).catch(() => { notice.value = '资源索引暂不可用，将尝试常规图片路径' })
    const characterLoad = useMasterStore().getMaster<{ id: number; characterId: number; characterType: string }>('character2ds')
      .then(items => { characterMap.value = Object.fromEntries(items.filter(item => item.characterType === 'game_character').map(item => [item.id, item.characterId])) }).catch(() => {})
    let found = false
    for (const url of new Set(props.scenarioUrls)) {
      if (disposed) return
      try {
        const request = new AbortController()
        const cancel = () => request.abort()
        abort.signal.addEventListener('abort', cancel, { once: true })
        const timeout = setTimeout(cancel, 25000)
        let data: StoryScenario
        try {
          const response = await fetch(url, { signal: request.signal })
          if (!response.ok) continue
          data = await response.json() as StoryScenario
        } finally { clearTimeout(timeout); abort.signal.removeEventListener('abort', cancel) }
        const next = buildStoryFrames(data)
        if (!next.length) continue
        frames.value = next
        try { index.value = Math.max(0, Math.min(next.length - 1, Math.floor(Number(localStorage.getItem(bookmark)) || 0))) } catch { index.value = 0 }
        found = true; break
      } catch { if (disposed) return }
    }
    if (!found) throw new Error('这话的剧本暂不可用，请稍后重试或选择其他章节')
    await Promise.all([mediaLoad, characterLoad])
  } catch (reason) { error.value = reason instanceof Error ? reason.message : '加载失败' }
  finally { loading.value = false }
}
watch(background, () => { bgFailed.value = false })
watch(volume, value => { if (voice) voice.volume = value * voiceGain; if (bgm) bgm.volume = value * 0.18 })
watch(speed, value => { if (voice) voice.playbackRate = value })
onMounted(() => { void load(); window.addEventListener('keydown', keydown); document.addEventListener('visibilitychange', visibility) })
onBeforeUnmount(() => {
  disposed = true; abort.abort(); pause(); bgm?.removeAttribute('src'); bgm?.load()
  window.removeEventListener('keydown', keydown); document.removeEventListener('visibilitychange', visibility)
})
</script>

<template>
  <div class="story-reader">
    <header class="reader-heading">
      <div class="min-w-0 flex-1"><p class="text-xs text-primary font-bold tracking-wider">{{ episodeLabel || 'STORY THEATER' }}</p><h2 class="text-lg font-bold truncate">{{ title }}</h2></div>
      <div class="join hidden sm:flex"><button class="btn btn-sm join-item" :class="mode === 'stage' ? 'btn-primary' : 'btn-ghost'" @click="setMode('stage')"><Film class="w-4 h-4" />场景</button><button class="btn btn-sm join-item" :class="mode === 'script' ? 'btn-primary' : 'btn-ghost'" @click="setMode('script')"><BookOpen class="w-4 h-4" />文本</button></div>
      <button class="btn btn-sm btn-circle btn-ghost" aria-label="关闭阅读器" @click="emit('close')"><X class="w-5 h-5" /></button>
    </header>
    <div v-if="loading" class="flex-1 grid place-items-center min-h-64"><div class="text-center"><span class="loading loading-spinner text-primary"></span><p class="mt-3 text-sm opacity-60">正在布置场景…</p></div></div>
    <div v-else-if="error" class="flex-1 grid place-items-center p-8"><div class="text-center"><p>{{ error }}</p><button class="btn btn-primary btn-sm mt-4" @click="load">重新加载</button></div></div>
    <template v-else-if="frame">
      <section v-if="mode === 'stage'" class="story-stage" aria-label="剧情场景">
        <img v-if="background && !bgFailed" :key="background" :src="background" alt="当前剧情背景" class="stage-background" @error="bgFailed = true" />
        <div class="stage-shade"></div>
        <div class="stage-label"><MapPin class="w-3.5 h-3.5" /><span>{{ frame.location || (bgFailed || !background ? '场景图片暂缺 · 可继续阅读' : '剧情场景') }}</span></div>
        <span v-if="characters.length" class="portrait-note">静态人物插图</span>
        <div class="stage-characters" aria-label="当前说话角色">
          <div v-for="id in characters" :key="id" class="character-slot">
            <img v-if="!portraitFailures.has(id)" :src="portrait(id)" :alt="frame.talk.WindowDisplayName || '角色'" class="character-cutout" @error="failPortrait(id)" />
          </div>
        </div>
        <div class="dialogue-box">
          <div class="dialogue-name"><img v-if="characters[0]" :src="`/img/chr_ts/chr_ts_${characters[0]}.png`" alt="" /><span>{{ frame.talk.WindowDisplayName || '旁白' }}</span><span v-if="speaking" class="voice-pulse" aria-label="语音播放中"><i></i><i></i><i></i></span></div>
          <p class="dialogue-text">{{ frame.talk.Body }}</p>
          <div class="dialogue-meta"><span>{{ index + 1 }} / {{ frames.length }}</span><button class="text-sm inline-flex items-center gap-1" :disabled="index >= frames.length - 1" @click="jump(index + 1)">继续 <ChevronRight class="w-4 h-4" /></button></div>
        </div>
      </section>
      <section v-else class="script-panel">
        <div class="script-search"><label class="input input-sm w-full"><Search class="w-4 h-4" /><input v-model="search" placeholder="搜索台词或人物…" /></label><button class="btn btn-sm btn-ghost" aria-label="复制全文" @click="copyScript"><Copy class="w-4 h-4" /></button></div>
        <div v-if="!matches.length" class="text-center p-10 opacity-50">没有匹配的台词</div>
        <template v-for="item in matches" :key="item.key">
          <p v-if="!search && (item.index === 0 || item.background !== frames[item.index - 1]?.background || item.location !== frames[item.index - 1]?.location)" class="flex items-center justify-center gap-2 text-xs opacity-50 py-3"><MapPin class="w-3 h-3" />{{ item.location || '场景切换' }}</p>
          <button class="script-line" :class="{ 'current-line': item.index === index }" @click="readFrom(item.index)"><span class="text-xs opacity-40">{{ item.index + 1 }}</span><span><strong class="text-primary text-sm">{{ item.talk.WindowDisplayName || '旁白' }}</strong><span class="block whitespace-pre-line leading-7 mt-1">{{ item.talk.Body }}</span></span><Play class="w-4 h-4 opacity-40" /></button>
        </template>
      </section>
      <div class="reader-controls">
        <input class="range range-primary range-xs w-full" aria-label="台词进度" type="range" min="0" :max="frames.length - 1" :value="index" @input="seek" />
        <div class="control-row">
          <div class="flex items-center gap-1">
            <button class="btn btn-sm btn-circle btn-ghost" aria-label="上一句" :disabled="index === 0" @click="jump(index - 1)"><ChevronLeft class="w-5 h-5" /></button>
            <button class="btn btn-sm btn-primary gap-1" :disabled="mode !== 'stage'" :aria-pressed="auto" @click="toggleAuto"><Pause v-if="auto" class="w-4 h-4" /><Play v-else class="w-4 h-4" />{{ auto ? '暂停' : '自动播放' }}</button>
            <button class="btn btn-sm btn-circle btn-ghost" aria-label="下一句" :disabled="index === frames.length - 1" @click="jump(index + 1)"><ChevronRight class="w-5 h-5" /></button>
          </div>
          <div class="flex items-center gap-1 flex-wrap">
            <button class="btn btn-sm btn-circle btn-ghost" aria-label="重播本句" :disabled="!frame.talk.Voices?.length || mode !== 'stage'" @click="voiceEnabled = true; playFrame()"><RotateCcw class="w-4 h-4" /></button>
            <button class="btn btn-sm btn-circle btn-ghost" :aria-label="voiceEnabled ? '关闭语音' : '开启语音'" :aria-pressed="voiceEnabled" :disabled="mode !== 'stage'" @click="toggleVoice"><Volume2 v-if="voiceEnabled" class="w-4 h-4 text-primary" /><VolumeX v-else class="w-4 h-4" /></button>
            <button class="btn btn-sm btn-ghost gap-1" :class="{ 'text-primary': bgmEnabled }" :aria-pressed="bgmEnabled" :disabled="mode !== 'stage'" @click="toggleBgm"><Music2 class="w-4 h-4" /><span class="text-xs">BGM</span></button>
            <select v-model.number="speed" class="select select-xs w-18" aria-label="播放速度"><option :value="0.8">0.8×</option><option :value="1">1×</option><option :value="1.25">1.25×</option><option :value="1.5">1.5×</option><option :value="2">2×</option></select>
            <input v-model.number="volume" type="range" min="0" max="1" step="0.05" aria-label="音量" class="range range-xs w-16 hidden md:block" />
          </div>
        </div>
        <p class="text-xs text-base-content/55 min-h-4" role="status">{{ notice || (mode === 'script' ? '点击台词可从这里播放' : '进度自动保存 · ← → 切换台词 · 空格播放 / 暂停') }}</p>
      </div>
      <footer class="reader-footer"><button class="btn btn-xs btn-ghost" :disabled="!hasPrevious" @click="emit('previous')">上一话</button><button class="btn btn-xs btn-ghost" @click="setMode(mode === 'stage' ? 'script' : 'stage')">{{ mode === 'stage' ? '全文与台词搜索' : '返回场景' }}</button><button class="btn btn-xs btn-ghost" :disabled="!hasNext" @click="emit('next')">下一话</button></footer>
    </template>
  </div>
</template>

<style scoped>
.story-reader { display:flex; flex-direction:column; height:min(90dvh,920px); background:var(--color-base-100); }
.reader-heading { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; border-bottom:1px solid var(--color-base-200); flex-shrink:0; }
.story-stage { position:relative; isolation:isolate; flex:1; min-height:260px; overflow:hidden; background:#233640; }
.stage-background { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; animation:scene-in .45s ease; }
.stage-shade { position:absolute; inset:0; background:linear-gradient(180deg,#07192440,transparent 30%,#071924a0); }
.stage-label { position:absolute; top:1rem; left:1rem; display:flex; align-items:center; gap:.5rem; color:white; padding:.4rem .8rem; background:#122730b3; border:1px solid #ffffff30; border-radius:4px; font-size:12px; z-index:2; }
.portrait-note { position:absolute; right:1rem; top:1.2rem; color:#fff9; font-size:10px; z-index:2; }
.stage-characters { position:absolute; inset:2rem 8% 0; display:flex; justify-content:center; }
.character-slot { flex:1; max-width:400px; position:relative; }
.character-cutout { width:100%; height:110%; object-fit:contain; object-position:center top; filter:drop-shadow(0 10px 15px #00131b55); }
.dialogue-box { position:absolute; left:4%; right:4%; bottom:1rem; background:#fcfdfdf0; border:1px solid #ffffff; border-left:4px solid #34c6d3; box-shadow:0 12px 45px #08253340; color:#173940; padding:1.15rem 1.5rem .7rem; border-radius:3px 18px 18px 18px; backdrop-filter:blur(12px); }
.dialogue-name { position:absolute; left:-4px; top:-2.1rem; background:#154954; border-left:4px solid #34c6d3; border-radius:3px 12px 0 0; color:#fff; padding:.45rem 1.5rem .45rem 3.4rem; font-size:15px; font-weight:700; min-width:140px; }
.dialogue-name img { position:absolute; left:.5rem; width:40px; height:40px; bottom:.15rem; }
.dialogue-text { white-space:pre-line; font-size:clamp(16px,2vw,21px); line-height:1.85; min-height:3.7em; max-height:27dvh; overflow:auto; font-family:'Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif; }
.dialogue-meta { display:flex; justify-content:space-between; align-items:center; color:#476c74; font-size:11px; margin-top:.5rem; }
.dialogue-meta button:disabled { opacity:.3; }
.reader-controls { padding:.7rem 1rem .45rem; border-top:1px solid var(--color-base-200); flex-shrink:0; }
.control-row { display:flex; justify-content:space-between; flex-wrap:wrap; gap:.4rem; align-items:center; padding:.45rem 0; }
.reader-footer { display:flex; align-items:center; justify-content:space-between; padding:.4rem .75rem; border-top:1px solid var(--color-base-200); }
.script-panel { flex:1; min-height:0; overflow:auto; padding:0 1rem 1rem; background:var(--color-base-200); }
.script-search { position:sticky; top:0; z-index:1; display:flex; gap:.5rem; padding:.75rem 0; background:var(--color-base-200); }
.script-line { display:grid; grid-template-columns:2rem 1fr 1rem; gap:.6rem; width:100%; text-align:left; padding:1rem; margin:.5rem 0; border-radius:12px; background:var(--color-base-100); border:1px solid transparent; }
.script-line:hover,.current-line { border-color:var(--color-primary); }
.voice-pulse { display:inline-flex; gap:2px; margin-left:.8rem; align-items:center; height:14px; }
.voice-pulse i { display:block; width:3px; height:12px; background:#63e4de; animation:voice .6s infinite alternate; }
.voice-pulse i:nth-child(2) { animation-delay:.2s; } .voice-pulse i:nth-child(3) { animation-delay:.4s; }
@keyframes scene-in { from {opacity:.4; transform:scale(1.015)} to {opacity:1; transform:scale(1)} }
@keyframes voice { from {transform:scaleY(.3)} to {transform:scaleY(1)} }
@media(max-width:640px) { .reader-heading {padding:.7rem 1rem;} .story-reader {height:92dvh;} .stage-characters {inset:3rem -20% 0;} .dialogue-box {left:3%;right:3%;padding:1rem .9rem .5rem;} .dialogue-text {font-size:16px; max-height:24dvh;} .portrait-note {top:3.5rem;right:.6rem;} }
@media(prefers-reduced-motion:reduce) { .stage-background,.voice-pulse i {animation:none;} }
</style>
