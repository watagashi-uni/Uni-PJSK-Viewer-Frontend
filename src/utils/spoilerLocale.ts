/** 剧透规则、提示和水印使用的语言：按浏览器语言选择，其他语言用英文 */
export type SpoilerLang = 'zh-Hans' | 'zh-Hant' | 'ja' | 'ko' | 'en'

export const SPOILER_HTML_LANG: Record<SpoilerLang, string> = { 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW', ja: 'ja', ko: 'ko', en: 'en' }

export const SPOILER_WATERMARK: Record<SpoilerLang, string> = {
  'zh-Hans': '剧透内容 请勿转载',
  'zh-Hant': '劇透內容 請勿轉載',
  ja: 'ネタバレ・転載禁止',
  ko: '스포일러 · 무단 전재 금지',
  en: 'Spoiler — do not repost',
}

export function detectSpoilerLang(): SpoilerLang {
  const list = typeof navigator === 'undefined' ? [] : (navigator.languages?.length ? navigator.languages : [navigator.language])
  for (const raw of list) {
    const tag = (raw || '').toLowerCase()
    if (/^zh-(hant|tw|hk|mo)\b/.test(tag)) return 'zh-Hant'
    if (/^zh\b/.test(tag)) return 'zh-Hans'
    if (/^ja\b/.test(tag)) return 'ja'
    if (/^ko\b/.test(tag)) return 'ko'
    if (/^en\b/.test(tag)) return 'en'
  }
  return 'en'
}
