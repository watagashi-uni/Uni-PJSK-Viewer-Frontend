// Umami page views and feature events, configured entirely by build-time env vars so any Umami
// instance works. Reports go straight to `/api/send` with sendBeacon; no remote script is loaded.
// Every entry point swallows its own errors: a stats outage must never affect browsing.

const START_TIMEOUT_MS = 5000

export type EventData = Record<string, string | number | boolean | undefined>

function readConfig() {
    // Off unless the build explicitly opts in; there is no default instance.
    if (import.meta.env.VITE_UMAMI_ENABLED !== '1') return null
    const hostUrl = (import.meta.env.VITE_UMAMI_HOST_URL || '').trim().replace(/\/+$/, '')
    const websiteId = (import.meta.env.VITE_UMAMI_WEBSITE_ID || '').trim()
    if (!hostUrl || !websiteId) return null
    const domains = (import.meta.env.VITE_UMAMI_DOMAINS || '')
        .split(',')
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean)
    return { endpoint: `${hostUrl}/api/send`, websiteId, domains }
}

const config = readConfig()

let ready = false
let pendingPath: string | null = null
let lastPath: string | null = null
let referrerSent = false

function shouldTrack() {
    try {
        return config !== null
            && !import.meta.env.DEV
            && (config.domains.length === 0 || config.domains.includes(location.hostname.toLowerCase()))
            && window.self === window.top
            && typeof navigator.sendBeacon === 'function'
    } catch {
        return false
    }
}

const enabled = shouldTrack()

/** Only reported on the first view, and only when it comes from another site. */
function externalReferrer() {
    if (referrerSent) return ''
    referrerSent = true
    try {
        const referrer = new URL(document.referrer)
        return referrer.hostname === location.hostname ? '' : referrer.origin + referrer.pathname
    } catch {
        return ''
    }
}

/** Sends the path only: query strings can carry OAuth codes, user IDs or filters. */
function send(path: string, event?: { name: string; data?: EventData }) {
    if (!config) return
    try {
        // A string body is a CORS simple request; nothing waits for the response.
        navigator.sendBeacon(config.endpoint, JSON.stringify({
            type: 'event',
            payload: {
                website: config.websiteId,
                hostname: location.hostname,
                url: path,
                referrer: event ? '' : externalReferrer(),
                screen: `${screen.width}x${screen.height}`,
                language: navigator.language,
                ...event,
            },
        }))
    } catch {
        // Stats are best effort and must never surface to visitors.
    }
}

/** Waits until the page is idle before the first report, so it never competes with startup. */
function start() {
    const flush = () => {
        ready = true
        if (pendingPath !== null) send(pendingPath)
        pendingPath = null
    }
    try {
        const schedule = () => {
            try {
                if ('requestIdleCallback' in window) requestIdleCallback(flush, { timeout: START_TIMEOUT_MS })
                else setTimeout(flush, 0)
            } catch {
                // Never block the page over stats.
            }
        }
        if (document.readyState === 'complete') schedule()
        else window.addEventListener('load', schedule, { once: true })
    } catch {
        // Never block the page over stats.
    }
}

if (enabled) start()

/** Reports a route view; query-only changes (filters, page numbers) are not new views. */
export function trackPageview(path: string) {
    if (!enabled || path === lastPath) return
    lastPath = path
    if (ready) send(path)
    else pendingPath = path
}

/** Reports a feature use. Callers pass settings and types only, never IDs, file names, URLs or error text. */
export function trackEvent(name: string, data?: EventData) {
    if (!enabled) return
    try {
        send(location.pathname, { name, data })
    } catch {
        // Stats are best effort and must never surface to visitors.
    }
}
