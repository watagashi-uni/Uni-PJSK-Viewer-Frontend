<script setup lang="ts">
import { displayImageUrl } from '@/utils/derivedAssets'
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { performerCharacterId, type SongLyrics } from '@/api/lyrics'
import { useMasterStore } from '@/stores/master'
import { usePlayerStore } from '@/stores/player'
import { useSettingsStore } from '@/stores/settings'
import type { PlayerTrackInfo } from '@/utils/playerTracks'
import { castTimeline, cueAt, type CastCue } from '@/utils/singingTimeline'
import { useSingerAvatars } from '@/composables/useSingerAvatars'

/**
 * The picture behind karaoke lyrics for a song without a 2D MV: card art of the characters
 * singing it, slowly drifting closer (and resting while the music is paused).
 * - Where the lyrics say who sings each line, the picture follows the voice, changing the moment
 *   it comes in: whoever is heard now, side by side when several sing together, the whole cast
 *   before the first line. Who is shown when is worked out in advance, and the cards are loaded
 *   before they are due.
 * - Otherwise their cards take turns at a steady pace.
 * Songs sung only by guests get their artwork, blurred, instead.
 *
 * As a strip (KTV subtitles): a row of the singers' cards, cut around the character and picked
 * at random, across the top; whoever is heard now stands out, the others fade back. The rest
 * is a panel for the lyrics, coloured by a soft reflection of the cards.
 */
const props = withDefaults(defineProps<{
  track: PlayerTrackInfo | null
  playing: boolean
  /** Lyrics timed for this audio, and whether their singers belong to this rendition. */
  lyrics?: SongLyrics | null
  showPerformers?: boolean
  currentTime?: number
  clock?: () => number
  /** slides: cards filling the picture. strip: a row of cards over a panel for the lyrics. */
  layout?: 'slides' | 'strip'
  /** Strip: its height in pixels (the panel takes the rest). */
  stripHeight?: number
}>(), { lyrics: null, showPerformers: false, currentTime: 0, clock: undefined, layout: 'slides', stripHeight: 0 })

interface CardRow { id: number; characterId: number; cardRarityType: string; assetbundleName: string; releaseAt: number }
/**
 * One side of a card: the whole illustration, and the game's own crop of it around the
 * character, which is what a narrow panel shows (the middle of the whole picture may well
 * miss the character altogether).
 */
interface CardArt { full: string; cutout: string }

/** Taking turns: each card holds the screen this long. */
const SLIDE_MS = 9000
/** Most cards side by side when many sing at once. */
const MAX_PANELS = 6
/**
 * Cards are loaded ahead of when they are due: every scene in the coming stretch of the song,
 * and at least the next few, so the picture never waits on the network (or goes dark).
 */
const PRELOAD_SECONDS = 40
const PRELOAD_SCENES = 4
/** Ways a picture drifts, taken in turn so one slide never moves like the last. */
const MOTIONS = 4
/** Cards in the strip. */
const STRIP_PANELS = 5

const master = useMasterStore()
const player = usePlayerStore()
const settings = useSettingsStore()
const { trackAvatars } = useSingerAvatars()

const cards = shallowRef<CardRow[]>([])
void master.getMaster<CardRow>('cards').then((rows) => { cards.value = rows }).catch(() => {})

const cover = computed(() => (props.track ? player.coverUrl(props.track) : ''))

/** A fixed shuffle per rendition: the same song shows its cards in the same order. */
function seeded(seed: number) {
  let state = seed >>> 0 || 1
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function shuffle<T>(list: T[], random: () => number): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[list[i], list[j]] = [list[j]!, list[i]!]
  }
  return list
}

/** The singers' illustrated cards, per character, in this rendition's order. */
const cardsByCharacter = computed(() => {
  const byCharacter = new Map<number, CardArt[]>()
  const track = props.track
  if (!track) return byCharacter
  const wanted = new Set(track.singers.filter(s => s.type === 'game').map(s => s.id))
  if (!wanted.size) return byCharacter
  const now = Date.now()
  const host = `${settings.assetsHost}/startapp/character`
  for (const card of cards.value) {
    if (!wanted.has(card.characterId) || !/^[\w-]+$/.test(card.assetbundleName)) continue
    if (!settings.showSpoilers && card.releaseAt > now) continue
    const name = card.assetbundleName
    const side = (full: string, cutout: string): CardArt => ({ full: displayImageUrl(`${host}/member/${name}/${full}.jpg`), cutout: `${host}/member_cutout/${name}/${cutout}.png` })
    let list = byCharacter.get(card.characterId)
    if (!list) byCharacter.set(card.characterId, list = [])
    // The illustrated rarities: both sides of a 3★/4★, the one side of a birthday card.
    if (card.cardRarityType === 'rarity_3' || card.cardRarityType === 'rarity_4') {
      list.push(side('card_after_training', 'after_training'), side('card_normal', 'normal'))
    } else if (card.cardRarityType === 'rarity_birthday') {
      list.push(side('card_normal', 'normal'))
    }
  }
  const random = seeded(track.musicId * 7919 + track.vocalId)
  for (const [id, list] of byCharacter) {
    if (list.length) shuffle(list, random)
    else byCharacter.delete(id)
  }
  return byCharacter
})

/** Characters with cards, in the order the rendition names them. */
const cast = computed(() => (props.track?.singers ?? []).filter(s => s.type === 'game' && cardsByCharacter.value.has(s.id)).map(s => s.id))

/** The pictures of one moment: a whole card for one singer, the crops side by side for several. */
function picturesFor(characters: number[], cursor: Map<number, number>): string[] {
  return characters.flatMap((id) => {
    const list = cardsByCharacter.value.get(id)
    if (!list?.length) return []
    const index = cursor.get(id) ?? 0
    cursor.set(id, index + 1)
    const art = list[index % list.length]!
    return [characters.length === 1 ? art.full : art.cutout]
  })
}

// ----- following the voice -----

interface Scene { time: number; pictures: string[] }

/** Who is shown when, following the voice; null where the lyrics do not say who sings. */
const cues = computed<CastCue[] | null>(() => {
  const lyrics = props.lyrics
  if (!props.showPerformers || !lyrics || !cast.value.length) return null
  const characterOf = new Map<string, number>()
  for (const performer of lyrics.performers || []) {
    // Renditions name the character outright (null for a guest); older files only by the id.
    const id = performer.characterId !== undefined
      ? performerCharacterId(String(performer.characterId ?? ''))
      : performerCharacterId(performer.performerId)
    if (id !== null && cardsByCharacter.value.has(id)) characterOf.set(performer.performerId, id)
  }
  if (!characterOf.size) return null
  const list: CastCue[] = castTimeline(lyrics.lines, { cast: cast.value, characterOf: id => characterOf.get(id), maxPanels: MAX_PANELS })
  return list.length < 2 ? null : list
})

/** Every change of picture over the song, with its pictures, decided in advance. */
const scenes = computed<Scene[] | null>(() => {
  if (props.layout === 'strip' || !cues.value) return null
  const cursor = new Map<number, number>()
  return cues.value.map(cue => ({ time: cue.time, pictures: picturesFor(cue.characters, cursor) }))
})

function now(): number {
  return props.clock ? props.clock() : props.currentTime
}

// ----- the strip -----

interface StripPanel { key: string; characterId: number; url: string; color: string; name: string }

const failedPanels = shallowRef(new Set<string>())

/** Drawn anew for each player, so the same song shows other cards another time. */
const salt = Math.floor(Math.random() * 2 ** 30)

/**
 * Five cards cut around the character, at random: the singers take turns, so each of up to
 * five has one; more than five, and five of them are drawn.
 */
const stripPanels = computed<StripPanel[]>(() => {
  const track = props.track
  const characters = cast.value
  if (props.layout !== 'strip' || !track || !characters.length) return []
  const random = seeded((track.musicId * 7919 + track.vocalId) ^ salt)
  const avatars = new Map(trackAvatars(track.singers).map(a => [a.key, a]))
  const order = shuffle([...characters], random)
  const pools = new Map(order.map(id => [id, shuffle([...new Set(cardsByCharacter.value.get(id)!.map(art => art.cutout))], random)]))
  // A card whose picture is missing makes way for another.
  const failed = failedPanels.value
  for (const [id, pool] of pools) pools.set(id, pool.filter(url => !failed.has(url)))
  const picked: StripPanel[] = []
  for (let n = 0; picked.length < STRIP_PANELS && n < STRIP_PANELS * order.length; n++) {
    const id = order[n % order.length]!
    const url = pools.get(id)!.shift()
    const avatar = avatars.get(`game-${id}`)
    if (url) picked.push({ key: url, characterId: id, url, color: avatar?.color || '#b9b4c8', name: avatar?.name || '' })
  }
  return shuffle(picked, random)
})

const loadedPanels = shallowRef(new Set<string>())
function onPanelLoad(url: string) {
  loadedPanels.value = new Set(loadedPanels.value).add(url)
}

function onPanelError(url: string) {
  failedPanels.value = new Set(failedPanels.value).add(url)
}

/** Who is heard now (none: nobody stands out). */
const heard = shallowRef<number[]>([])
let stripFrame = 0

function followHeard() {
  const list = cues.value
  const index = list ? cueAt(list, now()) : -1
  const next = index >= 0 && list ? list[index]!.characters : []
  if (next.join() !== heard.value.join()) heard.value = next
}

function stripLoop() {
  followHeard()
  stripFrame = requestAnimationFrame(stripLoop)
}

watch([() => props.layout, () => props.playing, cues], ([layout, playing]) => {
  cancelAnimationFrame(stripFrame)
  stripFrame = 0
  if (layout !== 'strip') return
  followHeard()
  if (playing && cues.value) stripFrame = requestAnimationFrame(stripLoop)
}, { immediate: true })

watch(() => props.currentTime, () => {
  if (props.layout === 'strip' && !stripFrame) followHeard()
})

/** A card stands out while its character is heard (all of them, when nobody is). */
function panelState(panel: StripPanel): 'on' | 'off' | '' {
  if (!heard.value.length || heard.value.length >= cast.value.length) return ''
  return heard.value.includes(panel.characterId) ? 'on' : 'off'
}

// ----- the slides -----

interface Slide { key: number; panels: string[]; motion: number; quick: boolean }
const slide = shallowRef<Slide | null>(null)
let serial = 0

/**
 * Cards are fetched a couple at a time, in the order they are due: fired all at once, the one
 * needed next would share the connection with a dozen others and arrive last. Each is decoded
 * before it is shown, and the latest are kept decoded, so a card goes up the frame it is due
 * (a large picture decoded only on screen leaves it blank for a moment).
 */
const PARALLEL_LOADS = 2
const KEEP_DECODED = 8
const loading = new Map<string, Promise<boolean>>()
const waiting: { url: string; done: (ok: boolean) => void }[] = []
const decoded = new Map<string, HTMLImageElement>()
let running = 0

function pump() {
  while (running < PARALLEL_LOADS && waiting.length) {
    const { url, done } = waiting.shift()!
    running++
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    image.decode().then(() => {
      decoded.delete(url)
      decoded.set(url, image)
      if (decoded.size > KEEP_DECODED) decoded.delete(decoded.keys().next().value!)
      done(true)
    }, () => done(false)).finally(() => {
      running--
      pump()
    })
  }
}

/** The card loaded and decoded. `urgent`: needed on screen now, ahead of everything queued. */
function load(url: string, urgent = false): Promise<boolean> {
  let task = loading.get(url)
  if (!task) {
    task = new Promise((resolve) => {
      const entry = { url, done: resolve }
      if (urgent) waiting.unshift(entry)
      else waiting.push(entry)
    })
    loading.set(url, task)
    void task.then((ok) => { if (!ok) loading.delete(url) })
    pump()
  } else if (urgent) {
    // Already queued for later: move it to the front.
    const index = waiting.findIndex(entry => entry.url === url)
    if (index > 0) waiting.unshift(...waiting.splice(index, 1))
  }
  return task
}

/** Put these pictures on screen once they have loaded (a picture that fails is left out). */
async function show(pictures: string[], quick: boolean) {
  const request = ++serial
  const loaded = await Promise.all(pictures.map(url => load(url, true)))
  const panels = pictures.filter((_, n) => loaded[n])
  if (request !== serial || !panels.length) return
  slide.value = { key: request, panels, motion: request % MOTIONS, quick }
}

// Following the voice: the scene in effect is checked every frame while playing, so the picture
// changes as the voice comes in; the next scenes' cards are already loading by then.
let frame = 0
let sceneIndex = -1

function follow() {
  const list = scenes.value
  if (!list) return
  const index = cueAt(list, now())
  if (index === sceneIndex || index < 0) return
  sceneIndex = index
  void show(list[index]!.pictures, true)
  preloadFrom(index)
}

/** Start loading the cards of the scenes due soon after scene `index`. */
function preloadFrom(index: number) {
  const list = scenes.value
  if (!list) return
  const from = Math.max(0, index)
  const until = (list[from]?.time ?? 0) + PRELOAD_SECONDS
  for (let n = from; n < list.length; n++) {
    if (n > from + PRELOAD_SCENES && list[n]!.time > until) break
    list[n]!.pictures.forEach(url => void load(url))
  }
}

function loop() {
  follow()
  frame = requestAnimationFrame(loop)
}

// Taking turns at a steady pace.
let turnTimer: ReturnType<typeof setTimeout> | undefined
let turn = -1
let remaining = SLIDE_MS
let shownAt = 0
const turnCursor = new Map<number, number>()

function nextTurn() {
  const characters = cast.value
  if (!characters.length || props.layout === 'strip') return
  turn = (turn + 1) % characters.length
  const pictures = picturesFor([characters[turn]!], turnCursor)
  void show(pictures, false).then(() => {
    shownAt = performance.now()
    remaining = SLIDE_MS
    scheduleTurn()
  })
  // The next one is loaded while this one shows.
  const upcoming = characters[(turn + 1) % characters.length]!
  const ahead = cardsByCharacter.value.get(upcoming)
  if (ahead?.length) void load(ahead[(turnCursor.get(upcoming) ?? 0) % ahead.length]!.full)
}

function scheduleTurn() {
  clearTimeout(turnTimer)
  if (scenes.value || !props.playing) return
  shownAt = performance.now()
  turnTimer = setTimeout(nextTurn, remaining)
}

function stopAll() {
  clearTimeout(turnTimer)
  cancelAnimationFrame(frame)
  frame = 0
}

function start() {
  stopAll()
  if (scenes.value) {
    follow()
    if (props.playing) frame = requestAnimationFrame(loop)
  } else {
    scheduleTurn()
  }
}

// Another song, other cards or other lyrics: start over.
watch([cast, scenes], ([characters, list], [oldCharacters, oldList]) => {
  if (characters.join() === oldCharacters?.join() && list === oldList) return
  serial++
  slide.value = null
  sceneIndex = -1
  turn = -1
  remaining = SLIDE_MS
  turnCursor.clear()
  stopAll()
  if (!characters.length || props.layout === 'strip') return
  // The cards of the opening scenes load right away, before anything plays.
  if (list) {
    preloadFrom(cueAt(list, now()))
    start()
  }
  else nextTurn()
}, { immediate: true })

watch(() => props.playing, (playing) => {
  if (props.layout === 'strip') return
  if (!playing && !scenes.value) remaining = Math.max(1000, remaining - (performance.now() - shownAt))
  start()
})

// Paused: a seek still changes who is on screen (and what is loaded ahead).
watch(() => props.currentTime, () => {
  if (scenes.value && !props.playing) follow()
})

onBeforeUnmount(() => {
  stopAll()
  cancelAnimationFrame(stripFrame)
  serial++
})
</script>

<template>
  <div v-if="layout === 'strip'" class="kb kb--strip" :class="{ 'kb--still': !playing }" :style="{ '--kb-strip': `${stripHeight}px` }" aria-hidden="true">
    <!-- The panel for the lyrics: the cards again, mirrored and blurred, under a pale veil. -->
    <div class="ks-floor">
      <img v-if="cover && !stripPanels.length" class="ks-floor-cover" :src="cover" alt="" />
      <div v-else class="ks-floor-row">
        <img v-for="panel in stripPanels" :key="panel.key" :src="panel.url" alt="" :class="{ shown: loadedPanels.has(panel.url) }" />
      </div>
      <div class="ks-veil"></div>
      <div class="ks-glints">
        <i v-for="panel in stripPanels" :key="panel.key" :style="{ '--c': panel.color }" :class="panelState(panel) && `ks-glint--${panelState(panel)}`"></i>
      </div>
    </div>

    <div class="ks-strip">
      <img v-if="cover" class="ks-strip-glow" :src="cover" alt="" />
      <div v-if="stripPanels.length" class="ks-row">
        <div
          v-for="(panel, n) in stripPanels"
          :key="panel.key"
          class="ks-cell"
          :class="[panelState(panel) && `ks-cell--${panelState(panel)}`, { shown: loadedPanels.has(panel.url) }]"
          :style="{ '--c': panel.color, '--i': n }"
        >
          <img class="ks-img" :src="panel.url" alt="" @load="onPanelLoad(panel.url)" @error="onPanelError(panel.url)" />
          <span class="ks-glow"></span>
          <span class="ks-frame"></span>
          <span v-if="panel.name" class="ks-name">{{ panel.name }}</span>
        </div>
      </div>
      <img v-else-if="cover" class="ks-cover" :src="cover" alt="" />
    </div>
    <!-- Where the strip meets the panel: a band in the singers' colours. -->
    <div class="ks-band">
      <i v-for="panel in stripPanels" :key="panel.key" :style="{ '--c': panel.color }" :class="panelState(panel) && `ks-band--${panelState(panel)}`"></i>
    </div>
  </div>

  <div v-else class="kb" :class="{ 'kb--still': !playing }" aria-hidden="true">
    <!-- The song's artwork, blurred, underneath: never a black screen while a card loads. -->
    <img v-if="cover" class="kb-cover-glow" :src="cover" alt="" />
    <img v-if="cover && !cast.length" class="kb-cover" :src="cover" alt="" />
    <TransitionGroup v-if="cast.length" name="kb-fade">
      <div v-if="slide" :key="slide.key" class="kb-slide" :class="{ 'kb-slide--quick': slide.quick, 'kb-slide--split': slide.panels.length > 1 }">
        <div class="kb-move" :class="`kb-move--m${slide.motion}`">
          <img v-for="(url, n) in slide.panels" :key="n" class="kb-panel" :src="url" alt="" decoding="sync" />
        </div>
      </div>
    </TransitionGroup>
    <div class="kb-shade"></div>
  </div>
</template>

<style scoped>
.kb {
  position: absolute;
  /* The slides are layered inside; that layering must not reach the lyrics drawn over it. */
  isolation: isolate;
  inset: 0;
  overflow: hidden;
  background: #0c0b10;
}

/* A slide fades in over the one before it, which stays as it is underneath until covered. */
.kb-slide {
  position: absolute;
  z-index: 1;
  inset: 0;
}

/* Several singers: their cards side by side, a thin dark line between them. Drifting is done
   inside, so the fade outside never interrupts it. */
.kb-move {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 3px;
  background: #0c0b10;
  animation: 16s linear both;
  will-change: transform;
}

.kb-panel {
  width: 0;
  min-width: 0;
  height: 100%;
  flex: 1;
  object-fit: cover;
  object-position: center;
}

/* A crop around the character: keep the face in view when the panel is narrow and short. */
.kb-slide--split .kb-panel {
  object-position: center 30%;
}

/* Four slow drifts: in towards a corner or the middle, a little to one side. */
.kb-move--m0 { animation-name: kb-drift-0; }
.kb-move--m1 { animation-name: kb-drift-1; }
.kb-move--m2 { animation-name: kb-drift-2; }
.kb-move--m3 { animation-name: kb-drift-3; }

.kb--still .kb-move {
  animation-play-state: paused;
}

@keyframes kb-drift-0 {
  from { transform: scale(1.04) translate(1.5%, 1%); }
  to { transform: scale(1.16) translate(-1.5%, -1%); }
}

@keyframes kb-drift-1 {
  from { transform: scale(1.16) translate(-2%, 0); }
  to { transform: scale(1.05) translate(1.5%, 0.5%); }
}

@keyframes kb-drift-2 {
  from { transform: scale(1.05) translate(-1%, 1.5%); }
  to { transform: scale(1.15) translate(1.5%, -1%); }
}

@keyframes kb-drift-3 {
  from { transform: scale(1.14) translate(1.5%, -1%); }
  to { transform: scale(1.04) translate(-1%, 1%); }
}

.kb-fade-enter-active {
  transition: opacity 1.6s ease;
}

/* Following the voice: a quick cut, so the picture changes with the singing. */
.kb-fade-enter-active.kb-slide--quick {
  transition-duration: 0.25s;
}

.kb-fade-enter-from {
  opacity: 0;
}

/* The slide going away stays whole underneath for as long as any fade can take: fading both
   at once would let the dark show through halfway (a flash of black at every change). */
.kb-fade-leave-active {
  z-index: 0;
  animation: kb-hold 1.6s linear;
}

@keyframes kb-hold {
  from { opacity: 1; }
  to { opacity: 1; }
}

/* Darker towards the bottom, where the lyrics are, and a little all round. */
.kb-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgb(0 0 0 / 0.05) 0%, rgb(0 0 0 / 0.08) 45%, rgb(0 0 0 / 0.5) 100%),
    radial-gradient(ellipse at center, transparent 55%, rgb(0 0 0 / 0.35) 100%);
}

.kb-cover-glow {
  position: absolute;
  inset: -20%;
  width: 140%;
  max-width: none;
  height: 140%;
  object-fit: cover;
  opacity: 0.6;
  filter: blur(40px) saturate(1.3);
}

.kb-cover {
  position: absolute;
  top: 12%;
  left: 50%;
  height: 56%;
  aspect-ratio: 1;
  border-radius: 0.75rem;
  object-fit: cover;
  box-shadow: 0 20px 60px -18px rgb(0 0 0 / 0.8);
  transform: translateX(-50%);
}

/* ----- strip ----- */

.kb--strip {
  --kb-band: max(4px, calc(var(--kb-strip) * 0.028));
  background: #ece8f3;
}

.ks-strip {
  position: absolute;
  z-index: 1;
  top: 0;
  right: 0;
  left: 0;
  height: var(--kb-strip);
  overflow: hidden;
  background: #1a1720;
}

.ks-strip-glow {
  position: absolute;
  inset: -30%;
  width: 160%;
  max-width: none;
  height: 160%;
  object-fit: cover;
  opacity: 0.55;
  filter: blur(30px) saturate(1.2);
}

.ks-row {
  position: absolute;
  inset: 0;
  display: flex;
  gap: 2px;
}

/* Who is heard takes more of the strip, the others give way: widths change smoothly. */
.ks-cell,
.ks-band i,
.ks-glints i {
  min-width: 0;
  flex: 1 1 0;
  transition: flex-grow 0.55s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.45s ease;
}

.ks-cell--on,
.ks-band i.ks-band--on,
.ks-glints i.ks-glint--on {
  flex-grow: 1.7;
}

.ks-cell--off,
.ks-band i.ks-band--off,
.ks-glints i.ks-glint--off {
  flex-grow: 0.8;
}

.ks-cell {
  position: relative;
  overflow: hidden;
  opacity: 0;
}

.ks-cell.shown {
  opacity: 1;
}

.ks-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 28%;
  transition: filter 0.45s ease;
  animation: ks-breathe 14s ease-in-out infinite alternate;
  animation-delay: calc(var(--i) * -2.7s);
}

.kb--still .ks-img,
.kb--still .ks-band i::after {
  animation-play-state: paused;
}

/* Someone else is heard: this card goes grey and pale, well behind the one singing. */
.ks-cell::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(226 222 236 / 0.45), rgb(236 232 243 / 0.7));
  opacity: 0;
  transition: opacity 0.45s ease;
  pointer-events: none;
}

.ks-cell--off .ks-img {
  filter: grayscale(0.85) brightness(0.92) contrast(0.85);
}

.ks-cell--off::after {
  opacity: 1;
}

.ks-cell--on .ks-img {
  filter: saturate(1.15) brightness(1.05);
}

/* The one heard: framed in their colour, which also rises from the bottom of the card. */
.ks-glow,
.ks-frame {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.ks-glow {
  background: linear-gradient(180deg, transparent 50%, var(--c) 130%);
  mix-blend-mode: screen;
}

.ks-frame {
  box-shadow:
    inset 0 0 0 max(2px, calc(var(--kb-strip) * 0.014)) var(--c),
    inset 0 0 calc(var(--kb-strip) * 0.12) var(--c);
}

.ks-cell--on .ks-glow,
.ks-cell--on .ks-frame {
  opacity: 1;
}

/* Their name, on a tag in their colour, slides up into the corner. */
.ks-name {
  position: absolute;
  bottom: max(6px, calc(var(--kb-strip) * 0.05));
  left: max(6px, calc(var(--kb-strip) * 0.04));
  max-width: calc(100% - max(12px, calc(var(--kb-strip) * 0.08)));
  overflow: hidden;
  padding: 0.25em 0.7em 0.3em;
  border-radius: 0.35em;
  background: var(--c);
  box-shadow: 0 4px 14px -4px rgb(0 0 0 / 0.5), inset 0 0 0 1px rgb(255 255 255 / 0.35);
  color: #fff;
  font-size: clamp(10px, calc(var(--kb-strip) * 0.065), 20px);
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.45);
  opacity: 0;
  transform: translateY(60%);
  transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.ks-cell--on .ks-name {
  opacity: 1;
  transform: none;
}

.ks-cover {
  position: absolute;
  top: 8%;
  left: 50%;
  height: 84%;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  object-fit: cover;
  box-shadow: 0 14px 40px -14px rgb(0 0 0 / 0.8);
  transform: translateX(-50%);
}

.ks-band {
  position: absolute;
  z-index: 1;
  top: var(--kb-strip);
  right: 0;
  left: 0;
  display: flex;
  gap: 2px;
  height: var(--kb-band);
  background: #d9d3e6;
  box-shadow: 0 6px 18px -6px rgb(40 30 60 / 0.35);
}

.ks-band i {
  position: relative;
  overflow: hidden;
  background: var(--c);
  opacity: 0.55;
}

/* Under whoever is heard: their colour at full strength, a light running along it, and a glow
   spilling down into the panel. */
.ks-band i.ks-band--on {
  overflow: visible;
  opacity: 1;
  box-shadow: 0 0 calc(var(--kb-band) * 3) var(--c), 0 calc(var(--kb-band) * 1.5) calc(var(--kb-band) * 5) var(--c);
}

.ks-band i::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.85) 50%, transparent 100%) no-repeat;
  background-size: 40% 100%;
  opacity: 0;
}

.ks-band i.ks-band--on::after {
  opacity: 1;
  animation: ks-shine 1.6s ease-in-out infinite;
}

.ks-band i.ks-band--off {
  opacity: 0.18;
}

@keyframes ks-shine {
  from { background-position: -60% 0; }
  to { background-position: 160% 0; }
}

/* The panel: the cards upside down and blurred into washes of colour, under a pale veil with
   a fine dot screen, so the lyrics sit on something without fighting it. */
.ks-floor {
  position: absolute;
  top: var(--kb-strip);
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  background: #ece8f3;
}

.ks-floor-row {
  position: absolute;
  inset: -12%;
  display: flex;
  transform: scaleY(-1);
  filter: blur(26px) saturate(1.35);
}

.ks-floor-row img {
  min-width: 0;
  height: 100%;
  flex: 1;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.8s ease;
}

.ks-floor-row img.shown {
  opacity: 1;
}

.ks-floor-cover {
  position: absolute;
  inset: -20%;
  width: 140%;
  max-width: none;
  height: 140%;
  object-fit: cover;
  filter: blur(36px) saturate(1.3);
}

.ks-veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle, rgb(255 255 255 / 0.5) 0.7px, transparent 1.2px) 0 0 / 7px 7px,
    linear-gradient(180deg, rgb(244 241 249 / 0.5) 0%, rgb(244 241 249 / 0.7) 55%, rgb(236 232 243 / 0.82) 100%);
}

/* Soft glows rising from the bottom under each card, brightest under whoever is heard. */
.ks-glints {
  position: absolute;
  inset: 0;
  display: flex;
}

.ks-glints i {
  position: relative;
}

.ks-glints i::before {
  content: '';
  position: absolute;
  bottom: -30%;
  left: 50%;
  width: 130%;
  height: 70%;
  border-radius: 50%;
  background: radial-gradient(closest-side, var(--c), transparent);
  opacity: 0.22;
  transform: translateX(-50%);
  transition: opacity 0.5s ease;
}

/* Under the one heard, its colour also reaches down from the band. */
.ks-glints i.ks-glint--on::before {
  opacity: 0.55;
}

.ks-glints i.ks-glint--on::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 120%;
  height: 45%;
  background: radial-gradient(ellipse at top, var(--c), transparent 70%);
  opacity: 0.35;
  transform: translateX(-50%);
}

.ks-glints i.ks-glint--off::before {
  opacity: 0.06;
}

@keyframes ks-breathe {
  from { transform: scale(1.02); }
  to { transform: scale(1.1) translateY(-1.5%); }
}

@media (prefers-reduced-motion: reduce) {
  .kb-move,
  .ks-img,
  .ks-band i.ks-band--on::after {
    animation: none;
  }
}
</style>
