import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import apiClient from '@/api/client'
import { getVersion, isCnAssetsEnabled } from '@/api/version'

export const useSettingsStore = defineStore('settings', () => {
    const ASSETS_HOST_CN = 'https://assets-direct.unipjsk.com'
    const ASSETS_HOST_GLOBAL = 'https://assets.unipjsk.com'
    const allowedAssetsHosts = new Set([ASSETS_HOST_CN, ASSETS_HOST_GLOBAL])

    // 状态
    const showSpoilers = ref(false)
    // 是否使用遮罩覆盖剧透内容（默认开启）
    const maskSpoilers = ref(true)
    // 主题状态: 'light' | 'dark' | 'auto' | 'moe' | 'jirai'
    const theme = ref<string>('auto')

    // 默认 vocal 设置: 'sekai' | 'virtual_singer'
    const defaultVocal = ref<string>('sekai')
    const preferredAssetsHost = ref<string>(ASSETS_HOST_GLOBAL)
    const cnAssetsAllowed = ref(false)
    const cnAssetsPolicyLoaded = ref(false)
    const assetsHost = computed(() => {
        if (preferredAssetsHost.value === ASSETS_HOST_CN && !cnAssetsAllowed.value) {
            return ASSETS_HOST_GLOBAL
        }

        return allowedAssetsHosts.has(preferredAssetsHost.value)
            ? preferredAssetsHost.value
            : ASSETS_HOST_GLOBAL
    })

    let cnAssetsPolicyPromise: Promise<void> | null = null

    // 应用主题
    function applyTheme(newTheme: string) {
        if (newTheme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'unipjsk')
        } else if (newTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark')
        } else if (newTheme === 'moe') {
            document.documentElement.setAttribute('data-theme', 'moe')
        } else if (newTheme === 'jirai') {
            document.documentElement.setAttribute('data-theme', 'jirai')
        } else {
            document.documentElement.setAttribute('data-theme', 'unipjsk')
        }
    }

    // 设置主题
    function setTheme(newTheme: string) {
        theme.value = newTheme
        applyTheme(newTheme)
    }

    // 设置默认 vocal
    function setDefaultVocal(vocal: string) {
        defaultVocal.value = vocal
    }

    function normalizeAssetsHost(host: string, fallback = ASSETS_HOST_GLOBAL): string {
        return allowedAssetsHosts.has(host) ? host : fallback
    }

    function setAssetsHost(host: string) {
        const normalizedHost = normalizeAssetsHost(host)

        if (normalizedHost === ASSETS_HOST_CN && !cnAssetsAllowed.value) {
            preferredAssetsHost.value = ASSETS_HOST_GLOBAL
            return
        }

        preferredAssetsHost.value = normalizedHost
    }

    function syncCnAssetsPolicy(): Promise<void> {
        if (cnAssetsPolicyPromise) {
            return cnAssetsPolicyPromise
        }

        cnAssetsPolicyPromise = (async () => {
            try {
                const versionInfo = await getVersion()
                cnAssetsAllowed.value = isCnAssetsEnabled(versionInfo)
            } catch (error) {
                console.error('Failed to load asset source policy:', error)
                cnAssetsAllowed.value = false
            } finally {
                cnAssetsPolicyLoaded.value = true
                cnAssetsPolicyPromise = null
            }
        })()

        return cnAssetsPolicyPromise
    }

    // 初始化：从 localStorage 恢复状态
    function initialize(): void {
        const saved = localStorage.getItem('settings_showSpoilers')
        if (saved !== null) {
            showSpoilers.value = saved === '1'
        }

        const savedMask = localStorage.getItem('settings_maskSpoilers')
        if (savedMask !== null) {
            maskSpoilers.value = savedMask === '1'
        }

        const savedTheme = localStorage.getItem('settings_theme')
        if (savedTheme) {
            theme.value = savedTheme
            applyTheme(savedTheme)
        } else {
            applyTheme('auto')
        }

        const savedDefaultVocal = localStorage.getItem('settings_defaultVocal')
        if (savedDefaultVocal) {
            defaultVocal.value = savedDefaultVocal
        }

        // 检测是否为爬虫
        const isCrawler = /bot|googlebot|crawler|spider|robot|crawling|bingbot|yandex|duckduckbot|slurp|baiduspider/i.test(navigator.userAgent || '');

        if (isCrawler) {
            console.log('Crawler detected, forcing global asset host.');
            preferredAssetsHost.value = ASSETS_HOST_GLOBAL;
        } else {
            const savedAssetsHost = localStorage.getItem('settings_assetsHost')
            if (savedAssetsHost && allowedAssetsHosts.has(savedAssetsHost)) {
                preferredAssetsHost.value = savedAssetsHost
            } else {
                preferredAssetsHost.value = ASSETS_HOST_GLOBAL
                apiClient.get('/api/location')
                    .then(res => {
                        if (localStorage.getItem('settings_assetsHost')) {
                            return
                        }

                        const hostToSet = res.data.isChina ? ASSETS_HOST_CN : ASSETS_HOST_GLOBAL;
                        preferredAssetsHost.value = hostToSet;
                        localStorage.setItem('settings_assetsHost', hostToSet);
                    })
                    .catch(err => {
                        console.error('Failed to detect location:', err);
                        localStorage.setItem('settings_assetsHost', ASSETS_HOST_GLOBAL);
                    })
            }
        }

        void syncCnAssetsPolicy()

        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (theme.value === 'auto') {
                applyTheme('auto')
            }
        })
    }

    // 切换剧透显示
    function toggleSpoilers(): void {
        showSpoilers.value = !showSpoilers.value
    }

    function toggleMaskSpoilers(): void {
        maskSpoilers.value = !maskSpoilers.value
    }

    // 监听变化并保存到 localStorage
    watch(showSpoilers, (value) => {
        localStorage.setItem('settings_showSpoilers', value ? '1' : '0')
    })

    watch(maskSpoilers, (value) => {
        localStorage.setItem('settings_maskSpoilers', value ? '1' : '0')
    })

    watch(theme, (value) => {
        localStorage.setItem('settings_theme', value)
    })

    watch(defaultVocal, (value) => {
        localStorage.setItem('settings_defaultVocal', value)
    })

    watch(preferredAssetsHost, (value) => {
        localStorage.setItem('settings_assetsHost', value)
    })

    return {
        ASSETS_HOST_CN,
        ASSETS_HOST_GLOBAL,
        showSpoilers,
        maskSpoilers,
        theme,
        defaultVocal,
        preferredAssetsHost,
        assetsHost,
        cnAssetsAllowed,
        cnAssetsPolicyLoaded,
        initialize,
        toggleSpoilers,
        toggleMaskSpoilers,
        setTheme,
        setDefaultVocal,
        setAssetsHost,
        syncCnAssetsPolicy,
    }
})
