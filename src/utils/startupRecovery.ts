import { checkForPwaUpdate } from '@/pwa'

const RECOVERY_ATTEMPT_KEY = 'pwa_asset_recovery_attempted'
const ASSET_ERROR_PATTERN = /(?:failed to fetch dynamically imported module|error loading dynamically imported module|unable to preload css|loading (?:css )?chunk|importing a module script failed|expected a javascript(?:-wasm)? module script|mime type)/i

let recoveryInProgress = false
let recoveryResetTimer: number | undefined

function readRecoveryAttempt(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_ATTEMPT_KEY) === '1'
  } catch {
    return false
  }
}

function writeRecoveryAttempt() {
  try {
    sessionStorage.setItem(RECOVERY_ATTEMPT_KEY, '1')
  } catch {
    // Storage may be disabled; the in-memory guard still prevents duplicate work in this page.
  }
}

function clearRecoveryAttempt() {
  try {
    sessionStorage.removeItem(RECOVERY_ATTEMPT_KEY)
  } catch {
    // Ignore unavailable storage.
  }
}

function errorMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message
  return String(reason ?? '')
}

function isAssetLoadError(reason: unknown): boolean {
  return ASSET_ERROR_PATTERN.test(errorMessage(reason))
}

function renderStartupFailure(message: string, requiresBrowserRestart = false) {
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
  retry.textContent = requiresBrowserRestart ? '再次尝试切换版本' : '重新加载'
  retry.style.cssText = 'border:0;border-radius:.75rem;padding:.75rem 1.25rem;background:#ff85a1;color:white;font-weight:700;cursor:pointer'
  retry.addEventListener('click', async () => {
    clearRecoveryAttempt()
    retry.disabled = true
    retry.textContent = '正在切换版本……'
    try {
      const ready = await checkForPwaUpdate()
      if (ready) {
        window.location.reload()
        return
      }
    } catch (error) {
      console.error('PWA: Manual update recovery failed', error)
    }
    description.textContent = '浏览器仍在使用旧版本。请关闭本站所有标签页后重新打开；如果仍未恢复，请彻底退出并重启浏览器。'
    retry.disabled = false
    retry.textContent = '再次尝试切换版本'
  })

  panel.append(title, description, retry)
  app.replaceChildren(panel)
}

async function recoverFromAssetLoadFailure(reason: unknown) {
  if (recoveryInProgress) return
  recoveryInProgress = true
  console.error('PWA: Application asset failed to load', reason)

  if (!navigator.onLine) {
    renderStartupFailure('当前处于离线状态，并且所需页面资源尚未完整缓存。请联网后重新加载。')
    return
  }

  if (readRecoveryAttempt()) {
    renderStartupFailure('已尝试获取最新版本，但资源仍未加载成功。请稍后重新加载。')
    return
  }

  writeRecoveryAttempt()
  let updateReady = true
  try {
    updateReady = await checkForPwaUpdate()
  } catch (error) {
    console.error('PWA: Update check during startup recovery failed', error)
  }
  if (!updateReady) {
    renderStartupFailure(
      '新版本已找到，但浏览器未能让它接管当前页面。请关闭本站所有标签页后重新打开；如果仍未恢复，请彻底退出并重启浏览器。',
      true,
    )
    return
  }
  window.location.reload()
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
  window.clearTimeout(recoveryResetTimer)
  recoveryResetTimer = window.setTimeout(clearRecoveryAttempt, 10_000)
}
