// Smaller siblings Sekai publishes next to official game assets: WebP images
// and 128 kbps AAC (.m4a). Pages display/play these; opening, downloading and
// handing files to other tools keep the original PNG/JPG/MP3 URLs.

const GAME_ASSET = /^(?:https:\/\/assets(?:-[a-z0-9-]+)?\.unipjsk\.com)?\/?startapp\/|^(?:https:\/\/assets(?:-[a-z0-9-]+)?\.unipjsk\.com)?\/?ondemand\//
/** Connect Live recordings, published next to the game assets with the same 128k AAC sibling. */
const CONNECT_LIVE_AUDIO = /^(?:https:\/\/assets(?:-[a-z0-9-]+)?\.unipjsk\.com)?\/?connect-live\/audio\/[^/?#]+\.mp3$/

const WEBP_RULES: [RegExp, string][] = [
  [/(\/?startapp\/music\/jacket\/[^/?#]+\/[^/?#]+)\.png$/, '$1.webp'],
  [/(\/?startapp\/thumbnail\/music_jacket\/[^/?#]+)\.png$/, '$1.webp'],
  [/(\/?startapp\/character\/member\/[^/?#]+\/card_(?:normal|after_training))\.(?:jpg|png)$/, '$1.webp'],
  [/(\/?startapp\/thumbnail\/chara\/[^/?#]+)\.png$/, '$1.webp'],
  [/(\/?ondemand\/event\/[^/?#]+\/(?:screen\/bg|logo\/logo))\.png$/, '$1.webp'],
]

// The original each WebP replaced on screen (cards were shown as JPG).
const FALLBACK_RULES: [RegExp, string][] = [
  [/(\/?startapp\/music\/jacket\/[^/?#]+\/[^/?#]+)\.webp$/, '$1.png'],
  [/(\/?startapp\/thumbnail\/music_jacket\/[^/?#]+)\.webp$/, '$1.png'],
  [/(\/?startapp\/character\/member\/[^/?#]+\/card_(?:normal|after_training))\.webp$/, '$1.jpg'],
  [/(\/?startapp\/thumbnail\/chara\/[^/?#]+)\.webp$/, '$1.png'],
  [/(\/?ondemand\/event\/[^/?#]+\/(?:screen\/bg|logo\/logo))\.webp$/, '$1.png'],
]

function rewrite(url: string, rules: [RegExp, string][]): string | null {
  if (!url || !GAME_ASSET.test(url)) return null
  for (const [pattern, replacement] of rules) {
    if (pattern.test(url)) return url.replace(pattern, replacement)
  }
  return null
}

/** WebP for showing a jacket, jacket thumbnail, card, card thumbnail, event background or event logo; other URLs unchanged. */
export function displayImageUrl(url: string): string {
  return rewrite(url, WEBP_RULES) ?? url
}

/** The original PNG/JPG behind a displayed WebP, or null. */
export function fallbackImageUrl(url: string): string | null {
  return rewrite(url, FALLBACK_RULES)
}

/** 128 kbps AAC rendition of a full-length song or audition clip for playback. */
export function playbackAudioUrl(url: string): string {
  if (CONNECT_LIVE_AUDIO.test(url)) return url.replace(/\.mp3$/, '_128k.m4a')
  if (!GAME_ASSET.test(url)) return url
  if (/\/ondemand\/music\/long\/[^/?#]+\/[^/?#]+\.mp3$/.test(url) && !url.endsWith('_192k.mp3')) return url.replace(/\.mp3$/, '_128k.m4a')
  if (/\/startapp\/music\/short\/[^/?#]+\/[^/?#]+_short\.mp3$/.test(url)) return url.replace(/_short\.mp3$/, '_short_128k.m4a')
  return url
}

/** The original MP3 behind a playback rendition (128k AAC, or an earlier 192k MP3), or null. */
export function originalAudioUrl(url: string): string | null {
  if (/\/connect-live\/audio\/[^/?#]+_128k\.m4a$/.test(url)) return url.replace(/_128k\.m4a$/, '.mp3')
  return /_(?:128k\.m4a|192k\.mp3)$/.test(url) && GAME_ASSET.test(url) ? url.replace(/_(?:128k\.m4a|192k\.mp3)$/, '.mp3') : null
}

/**
 * A WebP not published yet falls back to its original once. Runs in the capture
 * phase and stops the event, so component error handlers (which hide the
 * image) only see a failure of the original as well.
 */
export function installDerivedImageFallback(root: Document = document) {
  root.addEventListener('error', (event) => {
    const target = event.target
    let current: string | null = null
    if (target instanceof HTMLImageElement) current = target.getAttribute('src') ? target.src : null
    else if (typeof SVGImageElement !== 'undefined' && target instanceof SVGImageElement) current = target.getAttribute('href') ?? target.getAttribute('xlink:href')
    const fallback = current ? fallbackImageUrl(current) : null
    if (!fallback) return
    event.stopPropagation()
    if (target instanceof HTMLImageElement) target.src = fallback
    else (target as SVGImageElement).setAttribute('href', fallback)
  }, true)
}
