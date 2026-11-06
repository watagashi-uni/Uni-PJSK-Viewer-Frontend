import { checkForNewBuild } from '@/pwa'

// A chunk that fails to load almost always belongs to a build that has been
// replaced on the server, e.g. in a tab left open across a deployment (in-app
// navigation never makes the browser check for a new service worker). Finding
// the new build is enough: the forced update flow then reloads the page.
const RELOAD_ATTEMPT_KEY = 'pwa_asset_reload_attempted'
const UPDATE_TIMEOUT_MS = 15_000
const ASSET_ERROR_PATTERN = /(?:failed to fetch dynamically imported module|error loading dynamically imported module|unable to preload css|loading (?:css )?chunk|importing a module script failed|expected a javascript(?:-wasm)? module script|mime type)/i

let recoveryInProgress = false
let reloadAttemptResetTimer: number | undefined

function readReloadAttempt(): boolean {
  try {
    return sessionStorage.getItem(RELOAD_ATTEMPT_KEY) === '1'
  } catch {
    return true
  }
}

function writeReloadAttempt() {
  try {
    sessionStorage.setItem(RELOAD_ATTEMPT_KEY, '1')
  } catch {
    // Unavailable storage is treated as "already tried" by readReloadAttempt.
  }
}

function clearReloadAttempt() {
  try {
    sessionStorage.removeItem(RELOAD_ATTEMPT_KEY)
  } catch {
    // Ignore unavailable storage.
  }
}

function isAssetLoadError(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : String(reason ?? '')
  return ASSET_ERROR_PATTERN.test(message)
}

function renderLoadFailure(message: string) {
  const app = document.getElementById('app')
  if (!app) return

  const panel = document.createElement('main')
  panel.style.cssText = 'max-width:36rem;margin:12vh auto;padding:2rem;font-family:system-ui,sans-serif;text-align:center;color:#593d48'

  const title = document.createElement('h1')
  title.textContent = '页面资源加载失败'
  title.style.cssText = 'font-size:1.5rem;margin:0 0 1rem'

  const description = document.createElement('p')
  description.textContent = message
  description.style.cssText = 'line-height:1.7;margin:0 0 1.5rem'

  const retry = document.createElement('button')
  retry.type = 'button'
  retry.textContent = '重新加载'
  retry.style.cssText = 'border:0;border-radius:.75rem;padding:.75rem 1.25rem;background:#ff85a1;color:white;font-weight:700;cursor:pointer'
  retry.addEventListener('click', () => window.location.reload())

  panel.append(title, description, retry)
  app.replaceChildren(panel)
}

async function recoverFromAssetLoadFailure(reason: unknown) {
  if (recoveryInProgress) return
  recoveryInProgress = true
  console.error('PWA: Application asset failed to load', reason)

  if (!navigator.onLine) {
    renderLoadFailure('当前处于离线状态，并且所需页面资源尚未缓存。请联网后重新加载。')
    return
  }

  if (await checkForNewBuild()) {
    // The new worker reloads this page; only step in if that never happens.
    window.setTimeout(() => {
      renderLoadFailure('新版本未能自动启用。请关闭本站所有标签页后重新打开。')
    }, UPDATE_TIMEOUT_MS)
    return
  }

  // No newer build: the failure may be transient, so reload once.
  if (!readReloadAttempt()) {
    writeReloadAttempt()
    window.location.reload()
    return
  }
  renderLoadFailure('资源仍未加载成功，请检查网络后重新加载。')
}

export function installStartupRecovery() {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    void recoverFromAssetLoadFailure(event.payload)
  })

  window.addEventListener('unhandledrejection', (event) => {
    if (!isAssetLoadError(event.reason)) return
    event.preventDefault()
    void recoverFromAssetLoadFailure(event.reason)
  })
}

export function markStartupSuccessful() {
  window.__markPwaAppStarted?.()
  window.clearTimeout(reloadAttemptResetTimer)
  reloadAttemptResetTimer = window.setTimeout(clearReloadAttempt, 10_000)
}
