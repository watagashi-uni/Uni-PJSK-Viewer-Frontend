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

function waitForWorkerState(
  worker: ServiceWorker,
  targetStates: ReadonlySet<ServiceWorkerState>,
): Promise<boolean> {
  if (targetStates.has(worker.state) || worker.state === 'redundant') {
    return Promise.resolve(targetStates.has(worker.state))
  }

  return new Promise((resolve) => {
    const finish = (result: boolean) => {
      window.clearTimeout(timeout)
      worker.removeEventListener('statechange', handleStateChange)
      resolve(result)
    }
    const handleStateChange = () => {
      if (targetStates.has(worker.state) || worker.state === 'redundant') {
        finish(targetStates.has(worker.state))
      }
    }
    const timeout = window.setTimeout(() => finish(false), 20_000)
    worker.addEventListener('statechange', handleStateChange)
  })
}

/**
 * Ask the browser to check for a complete new app shell. This never clears
 * user data or runtime data caches; it is only used by startup recovery.
 */
export async function checkForPwaUpdate(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return true

  const currentRegistration = registration ?? await navigator.serviceWorker.getRegistration()
  if (!currentRegistration) return true

  registration = await currentRegistration.update()
  const installingWorker = registration.installing
  if (installingWorker) {
    const installed = await waitForWorkerState(installingWorker, new Set(['installed', 'activated']))
    if (!installed) return false
  }

  const waitingWorker = registration.waiting
    ?? (installingWorker?.state === 'installed' ? installingWorker : undefined)
  if (waitingWorker) {
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    return waitForWorkerState(waitingWorker, new Set(['activated']))
  }

  return !registration.installing
}
