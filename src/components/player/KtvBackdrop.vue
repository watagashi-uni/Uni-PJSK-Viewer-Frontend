<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { performerCharacterId, type SongLyrics } from '@/api/lyrics'
import { useMasterStore } from '@/stores/master'
import { usePlayerStore } from '@/stores/player'
import { useSettingsStore } from '@/stores/settings'
import type { PlayerTrackInfo } from '@/utils/playerTracks'
import { castTimeline, cueAt, type CastCue } from '@/utils/singingTimeline'

/**
 * The picture behind karaoke lyrics for a song without a 2D MV: card art of the characters
 * singing it, slowly drifting closer (and resting while the music is paused).
 * - Where the lyrics say who sings each line, the picture follows the voice, changing the moment
 *   it comes in: whoever is heard now, side by side when several sing together, the whole cast
 *   before the first line. Who is shown when is worked out in advance, and the cards are loaded
 *   before they are due.
 * - Otherwise their cards take turns at a steady pace.
 * Songs sung only by guests get their artwork, blurred, instead.
 */
const props = withDefaults(defineProps<{
  track: PlayerTrackInfo | null
  playing: boolean
  /** Lyrics timed for this audio, and whether their singers belong to this rendition. */
  lyrics?: SongLyrics | null
  showPerformers?: boolean
  currentTime?: number
  clock?: () => number
}>(), { lyrics: null, showPerformers: false, currentTime: 0, clock: undefined })

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

const master = useMasterStore()
const player = usePlayerStore()
const settings = useSettingsStore()

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
    const side = (full: string, cutout: string): CardArt => ({ full: `${host}/member/${name}/${full}.jpg`, cutout: `${host}/member_cutout/${name}/${cutout}.png` })
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

/** Every change of picture over the song, with its pictures, decided in advance. */
const scenes = computed<Scene[] | null>(() => {
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
  const cues: CastCue[] = castTimeline(lyrics.lines, { cast: cast.value, characterOf: id => characterOf.get(id), maxPanels: MAX_PANELS })
  if (cues.length < 2) return null
  const cursor = new Map<number, number>()
  return cues.map(cue => ({ time: cue.time, pictures: picturesFor(cue.characters, cursor) }))
})

function now(): number {
  return props.clock ? props.clock() : props.currentTime
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
  if (!characters.length) return
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
  if (!characters.length) return
  // The cards of the opening scenes load right away, before anything plays.
  if (list) {
    preloadFrom(cueAt(list, now()))
    start()
  }
  else nextTurn()
}, { immediate: true })

watch(() => props.playing, (playing) => {
  if (!playing && !scenes.value) remaining = Math.max(1000, remaining - (performance.now() - shownAt))
  start()
})

// Paused: a seek still changes who is on screen (and what is loaded ahead).
watch(() => props.currentTime, () => {
  if (scenes.value && !props.playing) follow()
})

onBeforeUnmount(() => {
  stopAll()
  serial++
})
</script>

<template>
  <div class="kb" :class="{ 'kb--still': !playing }" aria-hidden="true">
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

@media (prefers-reduced-motion: reduce) {
  .kb-move {
    animation: none;
  }
}
</style>
