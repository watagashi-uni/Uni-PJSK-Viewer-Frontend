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

/**
 * Ask the browser whether a newer build has been deployed. When it has, the
 * forced update flow in push-sw.js reloads this page once the new worker is
 * active, so callers only need to wait.
 */
export async function checkForNewBuild(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false

  try {
    const currentRegistration = registration ?? await navigator.serviceWorker.getRegistration()
    if (!currentRegistration) return false
    await currentRegistration.update()
    return Boolean(currentRegistration.installing ?? currentRegistration.waiting)
  } catch (error) {
    console.error('PWA: Update check failed', error)
    return false
  }
}
