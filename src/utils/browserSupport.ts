// 这个文件在 index.html 里先于整个应用加载，只用浏览器原生能力，不引入其他模块。

interface InAppBrowser {
  name: string
  pattern: RegExp
}

// 国内 App 的内置浏览器：下载、音频、登录授权和本地缓存都可能被宿主 App 限制，直接拦下，
// 引导用户复制网址到浏览器打开。有先后顺序：企业微信的 UA 里同时带有 MicroMessenger。
// QQ 浏览器、UC、夸克、各家手机自带浏览器是独立浏览器，不在此列，交给下面的兼容性检查。
const IN_APP_BROWSERS: InAppBrowser[] = [
  { name: '企业微信', pattern: /\bwxwork\//i },
  { name: '微信', pattern: /\bMicroMessenger\//i },
  // 手机 QQ 的 UA 带独立的 "QQ/版本号"；QQ 浏览器是 "MQQBrowser/"，不会命中
  { name: 'QQ', pattern: /(?:^|[\s;])QQ\/[\d.]+|\bV1_(?:AND|IPH)_SQ/i },
  { name: 'TIM', pattern: /(?:^|[\s;])TIM\/[\d.]+/i },
  { name: '钉钉', pattern: /\bDingTalk\//i },
  { name: '飞书', pattern: /\b(?:Lark|Feishu)\/[\d.]+/i },
  { name: '微博', pattern: /__weibo__|\bWeibo\b/i },
  { name: '支付宝', pattern: /\bAlipayClient\//i },
  { name: '抖音', pattern: /\baweme|\bBytedanceWebview\//i },
  { name: '今日头条', pattern: /\bNewsArticle\//i },
  { name: '快手', pattern: /\bKwai(?:_\w+)?\/|\bksNebula\//i },
  { name: '小红书', pattern: /\bxhsdiscover\b/i },
  { name: '百度', pattern: /\bbaiduboxapp\//i },
]

/** 命中国内 App 内置浏览器时返回 App 名称 */
export function detectInAppBrowser(userAgent = ''): string | null {
  if (!userAgent) return null
  return IN_APP_BROWSERS.find(app => app.pattern.test(userAgent))?.name ?? null
}

export type DevicePlatform = 'android' | 'ios' | 'mac' | 'other'

export function detectPlatform(userAgent = '', maxTouchPoints = 0): DevicePlatform {
  if (/Android/i.test(userAgent)) return 'android'
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios'
  // iPadOS 13 起默认请求桌面网站，UA 和 Mac 一样，只能靠触点数区分
  if (/Macintosh/i.test(userAgent)) return maxTouchPoints > 1 ? 'ios' : 'mac'
  return 'other'
}

/**
 * 页面样式（Tailwind CSS 4 / daisyUI 5）大量依赖 color-mix()：Chrome 111、Safari 16.2、Firefox 113 起才支持。
 * 更旧的浏览器会退回到不透明的纯色，按钮文字、半透明背景等会糊成一块，属于无法逐一修补的问题。
 */
export function isLegacyBrowser(): boolean {
  try {
    return !window.CSS?.supports?.('color', 'color-mix(in lab, red, red)')
  } catch {
    return true
  }
}

/** 从 UA 里读出浏览器和版本，只用于提示文字 */
export function describeBrowser(userAgent = ''): string {
  const match = (pattern: RegExp) => userAgent.match(pattern)?.[1]
  const edge = match(/\bEdg(?:e|A|iOS)?\/([\d.]+)/)
  if (edge) return `Edge ${edge.split('.')[0]}`
  const firefox = match(/\b(?:Firefox|FxiOS)\/([\d.]+)/)
  if (firefox) return `Firefox ${firefox.split('.')[0]}`
  const chrome = match(/\b(?:Chrome|CriOS)\/([\d.]+)/)
  if (chrome) return `Chromium 内核 ${chrome.split('.')[0]}`
  const safari = match(/\bVersion\/([\d.]+).*Safari\//)
  if (safari) return `Safari ${safari}`
  const ios = match(/\bOS (\d+[_\d]*) like Mac OS X/)
  if (ios) return `iOS ${ios.replace(/_/g, '.')}`
  return ''
}

export function legacyBrowserAdvice(platform: DevicePlatform): string {
  switch (platform) {
    case 'android':
      return '建议下载并使用最新版 Chrome 浏览器访问。'
    case 'ios':
      return 'iPhone / iPad 上的浏览器都使用系统自带的 Safari 内核，换浏览器也无法解决，请将系统更新到 iOS / iPadOS 16.4 或更高版本。'
    case 'mac':
      return '请更新 macOS 和 Safari，或改用最新版 Chrome、Edge、Firefox。'
    default:
      return '请将浏览器更新到最新版，或改用最新版 Chrome、Edge、Firefox。'
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 内置浏览器常禁用异步剪贴板，退回到下面的旧办法
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0'
  document.body.append(textarea)
  textarea.select()
  textarea.setSelectionRange(0, text.length)
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }
  textarea.remove()
  return copied
}

export function renderUnsupportedBrowserNotice(appName: string): void {
  const platform = detectPlatform(navigator.userAgent, navigator.maxTouchPoints)
  const pageUrl = window.location.href
  const openHint = platform === 'ios'
    ? '也可以点右上角「···」，选择「在 Safari 中打开」。'
    : '也可以点右上角「···」，选择「在浏览器打开」。'

  document.title = '请在浏览器中打开'
  document.documentElement.lang = 'zh-CN'
  document.body.innerHTML = `
    <main class="unsupported-browser">
      <section class="unsupported-browser__panel" aria-labelledby="unsupported-browser-title">
        <p class="unsupported-browser__eyebrow">Unsupported Browser</p>
        <h1 id="unsupported-browser-title">请在浏览器中打开本站</h1>
        <p class="unsupported-browser__text"></p>
        <div class="unsupported-browser__url"></div>
        <button type="button" class="unsupported-browser__copy">复制网址</button>
        <p class="unsupported-browser__status" role="status" aria-live="polite"></p>
        <p class="unsupported-browser__hint"></p>
      </section>
    </main>
  `
  // 文字用 textContent 写入，网址里的任何字符都不会被当成 HTML
  const text = document.querySelector('.unsupported-browser__text')
  if (text) text.textContent = `${appName}内置浏览器无法正常使用本站的播放、下载和登录等功能。请复制网址，粘贴到 Chrome、Safari、Edge、Firefox 等浏览器中打开。`
  const url = document.querySelector('.unsupported-browser__url')
  if (url) url.textContent = pageUrl
  const hint = document.querySelector('.unsupported-browser__hint')
  if (hint) hint.textContent = openHint
  const status = document.querySelector('.unsupported-browser__status')
  const button = document.querySelector<HTMLButtonElement>('.unsupported-browser__copy')
  button?.addEventListener('click', () => {
    void copyText(pageUrl).then(copied => {
      if (status) status.textContent = copied ? '已复制，请到浏览器地址栏粘贴打开' : '复制失败，请长按上方网址手动复制'
      if (copied && button) button.textContent = '已复制'
    })
  })

  const style = document.createElement('style')
  style.textContent = `
    * {
      box-sizing: border-box;
    }

    html,
    body {
      min-height: 100%;
      margin: 0;
    }

    body {
      color: #2f2330;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 20% 20%, rgba(255, 133, 161, 0.22), transparent 32rem),
        linear-gradient(135deg, #fff7fa 0%, #f3fbff 100%);
    }

    .unsupported-browser {
      display: grid;
      min-height: 100vh;
      padding: 24px;
      place-items: center;
    }

    .unsupported-browser__panel {
      width: min(100%, 560px);
      padding: clamp(28px, 7vw, 48px);
      border: 1px solid rgba(255, 133, 161, 0.34);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.86);
      box-shadow: 0 24px 70px rgba(89, 61, 72, 0.16);
    }

    .unsupported-browser__eyebrow {
      margin: 0 0 14px;
      color: #d65a85;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .unsupported-browser h1 {
      margin: 0;
      color: #1f1820;
      font-size: clamp(26px, 7vw, 38px);
      line-height: 1.2;
      font-weight: 800;
      letter-spacing: 0;
    }

    .unsupported-browser__text {
      margin: 18px 0 0;
      color: #5d4b58;
      font-size: 16px;
      line-height: 1.7;
    }

    .unsupported-browser__url {
      margin-top: 18px;
      padding: 12px 14px;
      border: 1px solid rgba(89, 61, 72, 0.18);
      border-radius: 8px;
      background: #ffffff;
      color: #1f1820;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 14px;
      line-height: 1.5;
      word-break: break-all;
      -webkit-user-select: all;
      user-select: all;
    }

    .unsupported-browser__copy {
      width: 100%;
      margin-top: 14px;
      padding: 13px 20px;
      border: 0;
      border-radius: 8px;
      background: #d43a74;
      color: #ffffff;
      font: inherit;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }

    .unsupported-browser__copy:active {
      background: #b82d61;
    }

    .unsupported-browser__status {
      min-height: 1.5em;
      margin: 10px 0 0;
      color: #2f7a4b;
      font-size: 14px;
      text-align: center;
    }

    .unsupported-browser__hint {
      margin: 6px 0 0;
      color: #7a6874;
      font-size: 14px;
      line-height: 1.6;
    }
  `
  document.head.append(style)
}
