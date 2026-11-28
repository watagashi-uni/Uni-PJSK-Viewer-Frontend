import { registerSW } from 'virtual:pwa-register'
import { START_LOCATION, type Router } from 'vue-router'

// Updates are forced (see public/push-sw.js): the new worker takes over at
// once and asks every page to reload. Acknowledging tells it this page takes
// care of itself, so it does not have to navigate the window. The page does
// not reload on the spot: the next link the visitor follows to another page
// loads that page in full, which brings in the new build without
// interrupting what they are looking at now.
const RELOAD_MESSAGE = 'PWA_RELOAD'
const RELOAD_ACK_MESSAGE = 'PWA_RELOAD_ACK'
// Should the full load never happen (e.g. blocked), the in-app navigation goes ahead.
const FULL_LOAD_TIMEOUT_MS = 10_000
let registration: ServiceWorkerRegistration | undefined
/** A newer build is active and this page still runs the old one. */
let updatePending = false
/** Something is broken until the new build runs; reload as soon as it is there. */
let reloadWhenUpdated = false

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
      if (latest) return
      if (reloadWhenUpdated) window.location.reload()
      else updatePending = true
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
 * Once a newer build is active, the next navigation to another page loads it
 * in full instead of switching views in place. Changing only the query or the
 * hash (filters, tabs) stays in place.
 */
export function installUpdateOnNavigation(router: Router) {
  router.beforeEach((to, from) => {
    if (!updatePending || from === START_LOCATION || to.path === from.path) return
    const href = router.resolve(to).href
    const current = window.location.pathname + window.location.search + window.location.hash
    // Back/forward has already moved the address bar to the target.
    if (current === href) window.location.reload()
    else window.location.assign(href)
    // Hold the navigation while the browser leaves the page; rejecting it
    // would make the router step back through history after a back/forward.
    return new Promise<boolean>((resolve) => {
      window.setTimeout(() => resolve(true), FULL_LOAD_TIMEOUT_MS)
    })
  })
}

/**
 * Ask the browser whether a newer build has been deployed. When it has, this
 * page reloads as soon as the new worker is active (rather than waiting for
 * the next navigation), so callers only need to wait.
 */
export async function checkForNewBuild(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  if (updatePending) {
    window.location.reload()
    return true
  }
  reloadWhenUpdated = true

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
