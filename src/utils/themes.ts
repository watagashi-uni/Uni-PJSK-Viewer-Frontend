/** 主题：设置里保存的是 ThemeName，写到 <html data-theme> 上的是 daisyUI 主题名 */
export type ThemeName = 'auto' | 'light' | 'dark' | 'moe' | 'jirai'
export type ThemeAttribute = 'unipjsk' | 'dark' | 'moe' | 'jirai'

export interface ThemeOption {
  value: ThemeName
  label: string
  description: string
  /** 预览用的 daisyUI 主题名；跟随系统时左右各显示一半 */
  preview: ThemeAttribute[]
}

export const themeOptions: ThemeOption[] = [
  { value: 'auto', label: '跟随系统', description: '随系统在浅色和深色之间切换', preview: ['unipjsk', 'dark'] },
  { value: 'light', label: '浅色', description: '白底青色', preview: ['unipjsk'] },
  { value: 'dark', label: '深色', description: '深灰底，适合夜间', preview: ['dark'] },
  { value: 'moe', label: 'Moe', description: '粉色、大圆角', preview: ['moe'] },
  { value: 'jirai', label: '地雷', description: '黑粉配色、小圆角', preview: ['jirai'] },
]

/** 浏览器地址栏 / 状态栏颜色，与各主题的面板底色一致 */
const themeColors: Record<ThemeAttribute, string> = {
  unipjsk: '#ffffff',
  dark: '#1b1f27',
  moe: '#fffbfc',
  jirai: '#221a24',
}

export function isThemeName(value: unknown): value is ThemeName {
  return themeOptions.some(option => option.value === value)
}

export function resolveThemeAttribute(theme: string, prefersDark: boolean): ThemeAttribute {
  if (theme === 'dark' || theme === 'moe' || theme === 'jirai') return theme
  if (theme === 'light') return 'unipjsk'
  return prefersDark ? 'dark' : 'unipjsk'
}

/** 把主题写到 <html> 上，并同步地址栏颜色。index.html 里有一份等价的内联脚本，用来避免首屏闪烁 */
export function applyThemeToDocument(theme: string): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const attribute = resolveThemeAttribute(theme, prefersDark)
  document.documentElement.setAttribute('data-theme', attribute)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[attribute])
}
