import { registerSW } from 'virtual:pwa-register'

export interface PwaState {
  needRefresh: boolean
  offlineReady: boolean
}

type PwaStateListener = (state: Readonly<PwaState>) => void

const state: PwaState = {
  needRefresh: false,
  offlineReady: false,
}
const listeners = new Set<PwaStateListener>()
let registration: ServiceWorkerRegistration | undefined

function notify() {
  const snapshot = { ...state }
  listeners.forEach(listener => listener(snapshot))
}

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    state.needRefresh = true
    notify()
  },
  onOfflineReady() {
    state.offlineReady = true
    notify()
    console.log('PWA: App ready for offline use')
  },
  onRegisteredSW(_swUrl, currentRegistration) {
    registration = currentRegistration
  },
  onRegisterError(error) {
    console.error('PWA: Service worker registration failed', error)
  },
})

export function subscribeToPwaState(listener: PwaStateListener): () => void {
  listeners.add(listener)
  listener({ ...state })
  return () => listeners.delete(listener)
}

export async function applyPwaUpdate(): Promise<void> {
  await updateServiceWorker(true)
}

function waitForWorkerState(worker: ServiceWorker, targetStates: ReadonlySet<ServiceWorkerState>): Promise<void> {
  if (targetStates.has(worker.state) || worker.state === 'redundant') {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const timeout = window.setTimeout(resolve, 8_000)
    worker.addEventListener('statechange', () => {
      if (targetStates.has(worker.state) || worker.state === 'redundant') {
        window.clearTimeout(timeout)
        resolve()
      }
    })
  })
}

/**
 * Ask the browser to check for a complete new app shell. This never clears
 * user data or runtime data caches; it is only used by startup recovery.
 */
export async function checkForPwaUpdate(): Promise<void> {
  if (!('serviceWorker' in navigator)) return

  const currentRegistration = registration ?? await navigator.serviceWorker.getRegistration()
  if (!currentRegistration) return

  registration = await currentRegistration.update()
  if (registration.installing) {
    await waitForWorkerState(registration.installing, new Set(['installed', 'activated']))
  }

  const waitingWorker = registration.waiting
  if (waitingWorker) {
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    // registerType=prompt 不会主动 claim 当前页面。等新 SW 真正激活后再由调用方刷新，
    // 可避免刷新请求仍被旧 SW 接管一次。
    await waitForWorkerState(waitingWorker, new Set(['activated']))
  }
}
