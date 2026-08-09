import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { getVersion, isCnAssetsEnabled } from '@/api/version'
import { detectIsChina } from '@/utils/location'

export const useSettingsStore = defineStore('settings', () => {
    const ASSETS_HOST_CN = 'https://assets-direct.unipjsk.com'
    const ASSETS_HOST_GLOBAL = 'https://assets.unipjsk.com'
    const allowedAssetsHosts = new Set([ASSETS_HOST_CN, ASSETS_HOST_GLOBAL])

    // 状态
    const showSpoilers = ref(false)
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
                localStorage.setItem('settings_cnAssetsAllowed', cnAssetsAllowed.value ? '1' : '0')
            } catch (error) {
                console.error('Failed to load asset source policy:', error)
                // 失败（如离线）时保留本地快照，避免把国内源用户踢回海外源导致缓存全部失配
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

        localStorage.removeItem('settings_maskSpoilers')

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

        // 恢复上次确认的国内源政策快照，version 返回前先按上次结果放行，
        // 让选国内源的用户启动即用国内域名，不必等 /api/version
        const savedCnAssetsAllowed = localStorage.getItem('settings_cnAssetsAllowed')
        if (savedCnAssetsAllowed !== null) {
            cnAssetsAllowed.value = savedCnAssetsAllowed === '1'
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
                // 失败时 detectIsChina 返回 false，等价于原先 catch 分支写入海外源
                void detectIsChina().then((isChina) => {
                    if (localStorage.getItem('settings_assetsHost')) {
                        return
                    }

                    const hostToSet = isChina ? ASSETS_HOST_CN : ASSETS_HOST_GLOBAL
                    preferredAssetsHost.value = hostToSet
                    localStorage.setItem('settings_assetsHost', hostToSet)
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

    // 监听变化并保存到 localStorage
    watch(showSpoilers, (value) => {
        localStorage.setItem('settings_showSpoilers', value ? '1' : '0')
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
        theme,
        defaultVocal,
        preferredAssetsHost,
        assetsHost,
        cnAssetsAllowed,
        cnAssetsPolicyLoaded,
        initialize,
        toggleSpoilers,
        setTheme,
        setDefaultVocal,
        setAssetsHost,
        syncCnAssetsPolicy,
    }
})
