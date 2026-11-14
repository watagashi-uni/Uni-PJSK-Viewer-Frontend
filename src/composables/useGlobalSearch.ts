import { ref } from 'vue'

// 搜索面板的开关是全站共用的状态：侧边栏、顶栏、首页和快捷键都能打开它
const isOpen = ref(false)
/** 打开过一次之后才加载面板组件 */
const everOpened = ref(false)
const initialQuery = ref('')

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)

function open(query = ''): void {
  initialQuery.value = query
  everOpened.value = true
  isOpen.value = true
}

function close(): void {
  isOpen.value = false
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** Ctrl/⌘ + K 随时打开；不在输入框里时按 / 也能打开 */
function onKeydown(event: KeyboardEvent): void {
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return
  const key = event.key.toLowerCase()
  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && key === 'k') {
    event.preventDefault()
    if (isOpen.value) close()
    else open()
    return
  }
  if (key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isOpen.value && !isEditable(event.target)) {
    // 有其他弹窗打开时不抢焦点
    if (document.querySelector('dialog[open]')) return
    event.preventDefault()
    open()
  }
}

let hotkeysInstalled = false

export function useGlobalSearch() {
  function installHotkeys(): void {
    if (hotkeysInstalled) return
    hotkeysInstalled = true
    window.addEventListener('keydown', onKeydown)
  }

  return {
    isOpen,
    everOpened,
    initialQuery,
    open,
    close,
    installHotkeys,
    shortcutLabel: isMac ? '⌘K' : 'Ctrl K',
  }
}
