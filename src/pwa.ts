import { registerSW } from 'virtual:pwa-register'

// Updates are forced (see public/push-sw.js): the new worker takes over at
// once and asks every page to reload. Acknowledging tells it this page reloads
// itself, so it does not have to navigate the window.
const RELOAD_MESSAGE = 'PWA_RELOAD'
const RELOAD_ACK_MESSAGE = 'PWA_RELOAD_ACK'
let registration: ServiceWorkerRegistration | undefined

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if ((event.data as { type?: string } | null)?.type !== RELOAD_MESSAGE) return
    event.source?.postMessage({ type: RELOAD_ACK_MESSAGE })
    window.location.reload()
  })
}

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Only reached if a worker still ends up waiting; activate it straight away.
    void updateServiceWorker(true)
  },
  onOfflineReady() {
    console.log('PWA: App ready for offline use')
  },
  onRegisteredSW(_swUrl, currentRegistration) {
    registration = currentRegistration
  },
  onRegisterError(error) {
    console.error('PWA: Service worker registration failed', error)
  },
})

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
