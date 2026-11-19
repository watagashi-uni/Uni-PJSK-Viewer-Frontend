import { registerSW } from 'virtual:pwa-register'

// Updates are forced (see public/push-sw.js): the new worker takes over at
// once and asks every page to reload. Acknowledging tells it this page takes
// care of itself, so it does not have to navigate the window.
const RELOAD_MESSAGE = 'PWA_RELOAD'
const RELOAD_ACK_MESSAGE = 'PWA_RELOAD_ACK'
let registration: ServiceWorkerRegistration | undefined

/**
 * Whether this page already runs the build the new worker belongs to. Pages are always
 * loaded from the network, so a page opened after a deployment is the new build before
 * its worker has even updated; reloading it then would only interrupt the visitor.
 * The new worker answers /index.html from its own precache.
 */
async function runsLatestBuild(): Promise<boolean> {
  const entry = document.querySelector('script[type="module"][src]')?.getAttribute('src')
  if (!entry) return false
  try {
    const response = await fetch('/index.html', { cache: 'no-store' })
    if (!response.ok) return false
    return (await response.text()).includes(`"${entry}"`)
  } catch {
    return false
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if ((event.data as { type?: string } | null)?.type !== RELOAD_MESSAGE) return
    event.source?.postMessage({ type: RELOAD_ACK_MESSAGE })
    void runsLatestBuild().then((latest) => {
      if (!latest) window.location.reload()
    })
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
