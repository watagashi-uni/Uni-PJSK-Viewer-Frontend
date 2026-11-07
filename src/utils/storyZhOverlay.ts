import type { ScenarioSceneData } from 'pjsk-scenario-player'
import type { ZhStory } from '@/api/translations'

// 在场景播放器上叠加中文：排版沿用 auto-story 双语字幕。
// 坐标都是播放器 1280×720 舞台上的 px（auto-story 1080p 坐标 ÷ 1.5）。
// - 台词：日文正文下方，按日文实际行数定位；日文三行时缩小字号以免出画
// - 人名：日文人名右侧
// - 地点、字幕卡：色带加高，中文放在日文下方；全屏旁白放在下方黑边里

const STYLE_ID = 'viewer-story-zh-style'
const STYLE = `
.vz-zh-line, .vz-zh-name, .vz-zh-fst { position: absolute; pointer-events: none; color: #fff;
  font-family: var(--pjsk-font-zh-body); font-weight: 400; white-space: pre-wrap;
  -webkit-text-stroke: 4.27px rgba(68,68,102,.75); paint-order: stroke fill; }
.vz-zh-line { left: 166.7px; width: 880px; font-size: 24px; line-height: 29.33px; }
.vz-zh-line.compact { font-size: 20px; line-height: 24px; }
.vz-zh-line span, .vz-zh-fst span { opacity: 0; transition: opacity .08s linear; }
.vz-zh-fst span { transition-duration: .125s; }
.vz-zh-line span.on, .vz-zh-fst span.on { opacity: 1; }
.vz-zh-name { top: 532px; font-size: 20px; line-height: 1; white-space: nowrap; color: rgb(235,235,242); }
.pjsk-dialogue.no-name .vz-zh-name { visibility: hidden; }
.pjsk-fx-telop-box.vz-has-zh { height: 104px; margin-top: -52px; }
.pjsk-fx-telop-box.vz-has-zh .pjsk-fx-telop-text { flex-direction: column; justify-content: flex-start; padding-top: 17px; }
.vz-zh-telop { display: block; margin-top: 8.3px; font: 400 21.33px/26.67px var(--pjsk-font-zh-body); white-space: nowrap; }
.pjsk-fx-place.vz-has-zh { height: 66px; }
.pjsk-fx-place.vz-has-zh .pjsk-fx-place-text { height: 42.67px; }
.vz-zh-place { position: absolute; left: 26.67px; top: 36px; width: 346.67px; overflow: hidden; white-space: nowrap;
  font: 400 18.67px/1.2 var(--pjsk-font-zh-body); color: #fff; }
.pjsk-fx-place:not(.vz-has-zh) .vz-zh-place { display: none; }
.vz-zh-fst { left: 166.67px; top: 593.33px; width: 880px; font-size: 24px; line-height: 29.33px; }
@media (prefers-reduced-motion: reduce) { .vz-zh-line span, .vz-zh-fst span { transition: none; } }
`

const BODY_TOP = 572
const BODY_LINE = 32 // 26.67px × 1.2
const NAME_LEFT = 153.33

// 字幕不带句末句号，与 auto-story 一致
export function trimFullStop(text: string): string {
  return text.trim().replace(/。+(?=[』」）》】]*$)/u, '')
}

const normalizeCaption = (text: string) => text.replace(/[\s\p{Cc}]/gu, '')

function fillChars(el: HTMLElement, text: string) {
  el.replaceChildren(...[...text].map((char) => {
    const span = document.createElement('span')
    span.textContent = char
    return span
  }))
}

function reveal(el: HTMLElement, count: number) {
  const spans = el.children
  for (let i = 0; i < spans.length; i++) spans[i]!.classList.toggle('on', i < count)
}

export interface StoryZhOverlay {
  /** 播放器 progress 事件里的 snippet 序号 */
  snippet(index: number): void
  setStory(story: ZhStory | null): void
  destroy(): void
}

export function attachStoryZhOverlay(root: HTMLElement, scenario: ScenarioSceneData, initial: ZhStory | null): StoryZhOverlay {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = STYLE
    document.head.appendChild(style)
  }
  let story = initial
  let captions = new Map<string, string>()
  const observers: MutationObserver[] = []
  const created: HTMLElement[] = []
  const make = (className: string, parent: Element | null | undefined, tag = 'div') => {
    const el = document.createElement(tag)
    el.className = className
    el.setAttribute('lang', 'zh-CN')
    el.setAttribute('aria-hidden', 'true')
    parent?.appendChild(el)
    created.push(el)
    return el
  }

  function buildCaptions() {
    captions = new Map()
    if (!story) return
    for (const [key, zh] of Object.entries(story.effects)) {
      const jp = scenario.SpecialEffectData[Number(key)]?.StringVal
      if (jp && zh) captions.set(normalizeCaption(jp), zh)
    }
  }
  buildCaptions()

  // ── 台词与人名 ────────────────────────────────────────────────────────────
  const dialogue = root.querySelector<HTMLElement>('.pjsk-dialogue')
  const body = dialogue?.querySelector<HTMLElement>('.pjsk-dlg-body')
  const nameEl = dialogue?.querySelector<HTMLElement>('.pjsk-dlg-name')
  const line = make('vz-zh-line', dialogue)
  const name = make('vz-zh-name', dialogue)
  let active: { talkIndex: number; jp: string; started: boolean } | undefined
  let zhLength = 0

  // 量不到尺寸（刚开始播放时舞台可能还没排版）返回 0，稍后重试
  function measure(source: HTMLElement | null | undefined, text: string, prop: 'offsetHeight' | 'offsetWidth'): number {
    if (!source?.parentElement) return 0
    const probe = source.cloneNode(false) as HTMLElement
    probe.textContent = text
    probe.removeAttribute('data-text')
    probe.style.visibility = 'hidden'
    if (prop === 'offsetWidth') probe.style.width = 'auto'
    source.parentElement.appendChild(probe)
    const value = probe[prop]
    probe.remove()
    return value
  }

  let needsLayout = false
  let layoutFrame = 0
  function layout() {
    if (!active) return
    needsLayout = false
    const jpName = scenario.TalkData[active.talkIndex]?.WindowDisplayName || ''
    if (name.textContent) {
      const width = measure(nameEl, jpName, 'offsetWidth')
      if (width) name.style.left = `${NAME_LEFT + width + 10}px`
      else needsLayout = true
    }
    if (line.childElementCount) {
      const height = measure(body, active.jp, 'offsetHeight')
      const rows = Math.max(1, Math.round(height / BODY_LINE))
      line.classList.toggle('compact', rows >= 3)
      line.style.top = `${BODY_TOP + Math.min(rows, 3) * BODY_LINE + (rows >= 3 ? 2 : 4)}px`
      if (!height) needsLayout = true
    }
    cancelAnimationFrame(layoutFrame)
    if (needsLayout) layoutFrame = requestAnimationFrame(layout)
  }

  function startLine() {
    if (!active) return
    const raw = story?.lines[active.talkIndex]
    // 和 auto-story 一样去掉原有换行，按宽度重新折行
    const zh = raw ? trimFullStop(raw).replace(/\n/g, '') : ''
    const jpName = scenario.TalkData[active.talkIndex]?.WindowDisplayName || ''
    const zhName = story && jpName ? story.names[jpName] : ''
    name.textContent = zhName && zhName !== jpName ? zhName : ''
    zhLength = [...zh].length
    fillChars(line, zh)
    layout()
  }

  // 中文跟随日文打字机逐字出现（60 ms/字），日文显示完整时中文也全部显示
  // 播放器同步地先清空再写入第一个字，所以要看变更记录里是否经过了空串
  function syncTyping(records?: MutationRecord[]) {
    if (!active || !body) return
    const shown = body.dataset.text ?? ''
    if (!active.started) {
      if (shown !== '' && !records?.some((record) => record.oldValue === '')) return // 还停在上一句
      active.started = true
      startLine()
    } else if (needsLayout) layout()
    reveal(line, shown.length >= active.jp.length ? zhLength : [...shown].length)
  }
  if (body) {
    const observer = new MutationObserver(syncTyping)
    observer.observe(body, { attributes: true, attributeFilter: ['data-text'], attributeOldValue: true })
    observers.push(observer)
  }

  // ── 地点、字幕卡 ──────────────────────────────────────────────────────────
  const telopText = root.querySelector<HTMLElement>('.pjsk-fx-telop-text')
  const telopBox = telopText?.parentElement
  const telopZh = document.createElement('span')
  telopZh.className = 'vz-zh-telop'
  telopZh.setAttribute('lang', 'zh-CN')
  function syncTelop() {
    if (!telopText) return
    const jp = [...telopText.childNodes].filter((node) => node !== telopZh).map((node) => node.textContent).join('')
    const zh = captions.get(normalizeCaption(jp)) || ''
    telopBox?.classList.toggle('vz-has-zh', !!zh)
    if (!zh) { telopZh.remove(); return }
    if (telopZh.textContent !== zh) telopZh.textContent = zh
    // 放进日文元素里，跟着日文一起淡入淡出
    if (telopZh.parentElement !== telopText) telopText.appendChild(telopZh)
  }
  const placeEl = root.querySelector<HTMLElement>('.pjsk-fx-place')
  const placeText = placeEl?.querySelector<HTMLElement>('.pjsk-fx-place-text')
  const placeZh = make('vz-zh-place', placeEl)
  function syncPlace() {
    const zh = captions.get(normalizeCaption(placeText?.textContent || '')) || ''
    placeZh.textContent = zh
    placeEl?.classList.toggle('vz-has-zh', !!zh)
  }
  for (const [target, sync] of [[telopText, syncTelop], [placeText, syncPlace]] as const) {
    if (!target) continue
    const observer = new MutationObserver(sync)
    observer.observe(target, { childList: true, characterData: true, subtree: true })
    observers.push(observer)
  }

  // ── 全屏旁白：对话框随时创建，中文逐字跟着日文淡入 ─────────────────────────
  const stage = root.querySelector<HTMLElement>('.pjsk-stage')
  let fstText: HTMLElement | null = null
  let fstJp = ''
  let fstZh: HTMLElement | null = null
  function syncFullscreen() {
    const text = stage?.querySelector<HTMLElement>('.pjsk-fst-text') || null
    if (!text) { fstText = null; return }
    const jp = text.textContent || ''
    if (text !== fstText || jp !== fstJp) {
      fstText = text
      fstJp = jp
      const zh = captions.get(normalizeCaption(jp))
      if (!fstZh || fstZh.parentElement !== text.parentElement) {
        fstZh?.remove()
        fstZh = make('vz-zh-fst', text.parentElement)
      }
      fillChars(fstZh, zh ? trimFullStop(zh) : '')
    }
    if (!fstZh) return
    const spans = text.querySelectorAll('span')
    let visible = 0
    spans.forEach((span) => { if (span.style.opacity !== '0') visible++ })
    const total = fstZh.children.length
    reveal(fstZh, spans.length ? Math.ceil(total * visible / spans.length) : total)
    fstZh.style.opacity = text.style.opacity || '1'
  }
  if (stage) {
    const observer = new MutationObserver((records) => {
      if (records.some((record) => (record.target as Element).closest?.('.pjsk-fx-fst') || [...record.addedNodes].some((node) => (node as Element).classList?.contains('pjsk-fx-fst')))) syncFullscreen()
    })
    observer.observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] })
    observers.push(observer)
  }

  return {
    snippet(index) {
      const snippet = scenario.Snippets[index]
      if (snippet?.Action !== 1) return
      const talk = scenario.TalkData[snippet.ReferenceIndex]
      if (!talk) return
      // 播放器随后清空正文再逐字打出，清空时换成这一句的中文
      active = { talkIndex: snippet.ReferenceIndex, jp: talk.Body || '', started: false }
      syncTyping()
    },
    setStory(next) {
      story = next
      buildCaptions()
      if (active?.started) { startLine(); syncTyping() }
      syncTelop(); syncPlace()
      fstText = null
      syncFullscreen()
    },
    destroy() {
      cancelAnimationFrame(layoutFrame)
      for (const observer of observers) observer.disconnect()
      for (const el of created) el.remove()
      telopZh.remove()
      telopBox?.classList.remove('vz-has-zh')
      placeEl?.classList.remove('vz-has-zh')
    },
  }
}
