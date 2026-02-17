import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
    // 状态
    const showSpoilers = ref(false)
    // 是否使用遮罩覆盖剧透内容（默认开启）
    const maskSpoilers = ref(true)
    // 主题状态: 'light' | 'dark' | 'auto'
    const theme = ref<string>('auto')

    // 应用主题
    function applyTheme(newTheme: string) {
        if (newTheme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'unipjsk')
        } else if (newTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark')
        } else {
            document.documentElement.setAttribute('data-theme', 'unipjsk')
        }
    }

    // 设置主题
    function setTheme(newTheme: string) {
        theme.value = newTheme
        applyTheme(newTheme)
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

    return {
        showSpoilers,
        maskSpoilers,
        theme,
        initialize,
        toggleSpoilers,
        toggleMaskSpoilers,
        setTheme,
    }
})
