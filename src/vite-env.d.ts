/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />

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
