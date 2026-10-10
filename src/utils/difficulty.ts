// 游戏内难度配色（与官方 UI 一致），各页面共用这一份
export const DIFFICULTY_ORDER = ['easy', 'normal', 'hard', 'expert', 'master', 'append'] as const

export const DIFFICULTY_LABELS: Record<string, string> = {
    easy: 'EASY',
    normal: 'NORMAL',
    hard: 'HARD',
    expert: 'EXPERT',
    master: 'MASTER',
    append: 'APPEND',
}

/** 单色（APPEND 取渐变的起始色），用于文字、描边等无法使用渐变的场合 */
export const DIFFICULTY_COLORS: Record<string, string> = {
    easy: '#6EE1D6',
    normal: '#34DDFF',
    hard: '#FBCC26',
    expert: '#EA5B75',
    master: '#C656EA',
    append: '#ab9fef',
}

export const APPEND_GRADIENT = 'linear-gradient(135deg, #ab9fef, #e192d7)'

const FALLBACK_COLOR = '#9ca3af'
const LIGHT_BACKGROUNDS = new Set(['easy', 'normal', 'hard'])

/** 难度块背景：APPEND 用渐变，其余用单色 */
export function difficultyBackground(difficulty: string): string {
    const key = difficulty.toLowerCase()
    if (key === 'append') return APPEND_GRADIENT
    return DIFFICULTY_COLORS[key] || FALLBACK_COLOR
}

/** 难度块的背景与可读文字颜色 */
export function difficultyStyle(difficulty: string): { background: string, color: string } {
    const key = difficulty.toLowerCase()
    return {
        background: difficultyBackground(key),
        color: LIGHT_BACKGROUNDS.has(key) ? '#111827' : '#ffffff',
    }
}
