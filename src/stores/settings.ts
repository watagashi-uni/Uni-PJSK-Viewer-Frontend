import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { DEFAULT_CN_ASSETS_HOST, getVersion, isCnAssetsEnabled, normalizeCnAssetsHost } from '@/api/version'
import { detectIsChina } from '@/utils/location'

export type AssetsSource = 'cn' | 'global'
/** 资料译名显示方式：不显示 / 日文为主附中文 / 中文为主附日文 */
export type TranslationMode = 'off' | 'both' | 'zh-first'
const TRANSLATION_MODES: readonly TranslationMode[] = ['off', 'both', 'zh-first']

// 旧版本保存的是域名（settings_assetsHost），海外源以外都视为选了国内源
function readSavedAssetsSource(): AssetsSource | null {
    const saved = localStorage.getItem('settings_assetsSource')
    if (saved === 'cn' || saved === 'global') {
        return saved
    }

    const legacyHost = localStorage.getItem('settings_assetsHost')
    if (!legacyHost) {
        return null
    }

    const source: AssetsSource = legacyHost === 'https://assets.unipjsk.com' ? 'global' : 'cn'
    localStorage.setItem('settings_assetsSource', source)
    localStorage.removeItem('settings_assetsHost')
    return source
}

export const useSettingsStore = defineStore('settings', () => {
    const ASSETS_HOST_GLOBAL = 'https://assets.unipjsk.com'

    // 状态
    const showSpoilers = ref(false)
    // 主题状态: 'light' | 'dark' | 'auto' | 'moe' | 'jirai'
    const theme = ref<string>('auto')

    const translationMode = ref<TranslationMode>('both')
    // 剧情阅读器里的中文台词，阅读器内也可以切换
    const storyTranslation = ref(true)

    // 默认 vocal 设置: 'sekai' | 'virtual_singer'
    const defaultVocal = ref<string>('sekai')
    // 用户选的是"国内/海外"，国内源的具体域名由 /api/version 的 cnAssetsHost 下发
    const assetsSource = ref<AssetsSource>('global')
    const cnAssetsHost = ref<string>(DEFAULT_CN_ASSETS_HOST)
    const cnAssetsAllowed = ref(false)
    const cnAssetsPolicyLoaded = ref(false)
    const ASSETS_HOST_CN = computed(() => cnAssetsHost.value)
    const assetsHost = computed(() => (
        assetsSource.value === 'cn' && cnAssetsAllowed.value ? cnAssetsHost.value : ASSETS_HOST_GLOBAL
    ))
    const preferredAssetsHost = computed(() => (assetsSource.value === 'cn' ? cnAssetsHost.value : ASSETS_HOST_GLOBAL))

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

    function setAssetsSource(source: AssetsSource) {
        assetsSource.value = source === 'cn' && cnAssetsAllowed.value ? 'cn' : 'global'
    }

    function setAssetsHost(host: string) {
        setAssetsSource(host === ASSETS_HOST_GLOBAL ? 'global' : 'cn')
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
                cnAssetsHost.value = normalizeCnAssetsHost(versionInfo.cnAssetsHost) ?? DEFAULT_CN_ASSETS_HOST
                localStorage.setItem('settings_cnAssetsHost', cnAssetsHost.value)
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

        const savedTranslationMode = localStorage.getItem('settings_translationMode') as TranslationMode | null
        if (savedTranslationMode && TRANSLATION_MODES.includes(savedTranslationMode)) {
            translationMode.value = savedTranslationMode
        }
        storyTranslation.value = localStorage.getItem('settings_storyTranslation') !== '0'

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
        cnAssetsHost.value = normalizeCnAssetsHost(localStorage.getItem('settings_cnAssetsHost')) ?? DEFAULT_CN_ASSETS_HOST

        // 检测是否为爬虫
        const isCrawler = /bot|googlebot|crawler|spider|robot|crawling|bingbot|yandex|duckduckbot|slurp|baiduspider/i.test(navigator.userAgent || '');

        if (isCrawler) {
            console.log('Crawler detected, forcing global asset host.');
            assetsSource.value = 'global';
        } else {
            const savedSource = readSavedAssetsSource()
            if (savedSource) {
                assetsSource.value = savedSource
            } else {
                assetsSource.value = 'global'
                // 失败时 detectIsChina 返回 false，等价于原先 catch 分支写入海外源
                void detectIsChina().then((isChina) => {
                    if (readSavedAssetsSource()) {
                        return
                    }

                    assetsSource.value = isChina ? 'cn' : 'global'
                    localStorage.setItem('settings_assetsSource', assetsSource.value)
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

    watch(translationMode, (value) => {
        localStorage.setItem('settings_translationMode', value)
    })

    watch(storyTranslation, (value) => {
        localStorage.setItem('settings_storyTranslation', value ? '1' : '0')
    })

    watch(defaultVocal, (value) => {
        localStorage.setItem('settings_defaultVocal', value)
    })

    watch(assetsSource, (value) => {
        localStorage.setItem('settings_assetsSource', value)
    })

    return {
        ASSETS_HOST_CN,
        ASSETS_HOST_GLOBAL,
        showSpoilers,
        theme,
        defaultVocal,
        translationMode,
        storyTranslation,
        preferredAssetsHost,
        assetsSource,
        assetsHost,
        cnAssetsHost,
        cnAssetsAllowed,
        cnAssetsPolicyLoaded,
        initialize,
        toggleSpoilers,
        setTheme,
        setDefaultVocal,
        setAssetsHost,
        setAssetsSource,
        syncCnAssetsPolicy,
    }
})
