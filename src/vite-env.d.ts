/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string
    readonly VITE_CHART_PREVIEW_URL?: string
    readonly VITE_TOOLBOX_OAUTH_BASE_URL?: string
    readonly VITE_TOOLBOX_OAUTH_CLIENT_ID?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module 'virtual:pwa-register/vue' {
    import type { Ref } from 'vue'

    export interface RegisterSWOptions {
        immediate?: boolean
        onNeedRefresh?: () => void
        onOfflineReady?: () => void
        onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
        onRegisterError?: (error: Error) => void
    }

    export function useRegisterSW(options?: RegisterSWOptions): {
        needRefresh: Ref<boolean>
        offlineReady: Ref<boolean>
        updateServiceWorker: (reloadPage?: boolean) => Promise<void>
    }
}
